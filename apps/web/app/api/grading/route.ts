import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const createSchema = z.object({
  cardId: z.string().min(1).optional(),
  newCard: z
    .object({
      name: z.string().min(1),
      cardType: z.string().optional(),
      game: z.string().optional(),
      setCode: z.string().optional(),
      cardNumber: z.string().optional(),
      rarity: z.string().optional(),
    })
    .optional(),
  quantity: z.coerce.number().int().positive().default(1),
  grade: z.string().optional(),
  gradingCost: z.number().positive(),
  date: z.string().datetime(),
}).refine((data) => data.cardId || data.newCard, {
  message: 'Either cardId or newCard must be provided',
})

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined

  const where: Prisma.GradingRecordWhereInput = { userId }
  if (status) where.status = status as 'grading' | 'completed' | 'cancelled'

  const gradings = await prisma.gradingRecord.findMany({
    where,
    include: { card: { include: { inventory: true } } },
    orderBy: { sentDate: 'desc' },
  })

  return NextResponse.json(gradings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const txDate = new Date(data.date)

    const result = await prisma.$transaction(async (tx) => {
      let cardId = data.cardId
      let card

      if (cardId) {
        const originalCard = await tx.card.findFirst({
          where: { id: cardId, userId },
          include: { inventory: true },
        })
        if (!originalCard) {
          throw new Error('Card not found')
        }
        if (originalCard.status !== 'in_stock') {
          throw new Error('Card is not available for grading')
        }
        if (!originalCard.inventory || originalCard.inventory.quantity < data.quantity) {
          throw new Error('Not enough quantity to grade')
        }

        const avgCost = Number(originalCard.inventory.averageCost)
        const splitInvested = avgCost * data.quantity

        // Create a new card record for the graded portion
        const gradedCard = await tx.card.create({
          data: {
            name: originalCard.name,
            cardType: originalCard.cardType,
            game: originalCard.game,
            setCode: originalCard.setCode,
            cardNumber: originalCard.cardNumber,
            rarity: originalCard.rarity,
            condition: originalCard.condition,
            imageUrl: originalCard.imageUrl,
            status: 'grading',
            userId,
          },
        })

        await tx.cardInventory.create({
          data: {
            cardId: gradedCard.id,
            userId,
            quantity: data.quantity,
            averageCost: avgCost,
            totalInvested: splitInvested,
            currentValue: avgCost,
          },
        })

        await tx.transaction.create({
          data: {
            cardId: gradedCard.id,
            userId,
            type: 'BUY',
            quantity: data.quantity,
            pricePerUnit: avgCost,
            totalAmount: splitInvested,
            shippingCost: 0,
            date: txDate,
            note: `Split ${data.quantity} qty for grading`,
            isGradingCost: false,
          },
        })

        // Reduce original card inventory
        const newOriginalQty = originalCard.inventory.quantity - data.quantity
        const newOriginalInvested = Number(originalCard.inventory.totalInvested) - splitInvested
        await tx.cardInventory.update({
          where: { cardId: originalCard.id },
          data: {
            quantity: newOriginalQty,
            totalInvested: newOriginalInvested,
          },
        })

        card = gradedCard
        cardId = gradedCard.id
      } else if (data.newCard) {
        card = await tx.card.create({
          data: {
            name: data.newCard.name,
            cardType: data.newCard.cardType || 'Single',
            game: data.newCard.game || 'OnePiece',
            setCode: data.newCard.setCode || null,
            cardNumber: data.newCard.cardNumber || null,
            rarity: data.newCard.rarity || null,
            status: 'grading',
            userId,
          },
        })

        await tx.cardInventory.create({
          data: {
            cardId: card.id,
            userId,
            quantity: data.quantity,
            averageCost: data.gradingCost / data.quantity,
            totalInvested: data.gradingCost,
            currentValue: data.gradingCost / data.quantity,
          },
        })

        cardId = card.id
      }

      if (!card || !cardId) {
        throw new Error('Invalid card')
      }

      const grading = await tx.gradingRecord.create({
        data: {
          cardId,
          userId,
          status: 'grading',
          quantity: data.quantity,
          grade: data.grade || null,
          gradingCost: data.gradingCost,
          sentDate: txDate,
        },
      })

      await tx.transaction.create({
        data: {
          cardId,
          userId,
          type: 'BUY',
          quantity: data.quantity,
          pricePerUnit: data.gradingCost / data.quantity,
          totalAmount: data.gradingCost,
          shippingCost: 0,
          date: txDate,
          note: `Grading cost for ${card.name}`,
          isGradingCost: true,
        },
      })

      return { grading, card }
    })

    return NextResponse.json(result.grading, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error) {
      if (error.message === 'Card not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (
        error.message === 'Card is not available for grading' ||
        error.message === 'Not enough quantity to grade'
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
