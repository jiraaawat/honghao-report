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

    let cardId = data.cardId

    const result = await prisma.$transaction(async (tx) => {
      let card

      if (cardId) {
        card = await tx.card.findFirst({
          where: { id: cardId, userId },
          include: { inventory: true },
        })
        if (!card) {
          throw new Error('Card not found')
        }
        if (card.status !== 'in_stock') {
          throw new Error('Card is not available for grading')
        }
      } else if (data.newCard) {
        // Create new card directly for grading
        card = await tx.card.create({
          data: {
            name: data.newCard.name,
            cardType: data.newCard.cardType || 'Single',
            game: data.newCard.game || 'Pokemon',
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
            quantity: 1,
            averageCost: data.gradingCost,
            totalInvested: data.gradingCost,
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
          gradingCost: data.gradingCost,
          sentDate: new Date(data.date),
        },
      })

      if (card.status !== 'grading') {
        await tx.card.update({
          where: { id: cardId },
          data: { status: 'grading' },
        })
      }

      await tx.transaction.create({
        data: {
          cardId,
          userId,
          type: 'BUY',
          quantity: 1,
          pricePerUnit: data.gradingCost,
          totalAmount: data.gradingCost,
          date: new Date(data.date),
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
      if (error.message === 'Card is not available for grading') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
