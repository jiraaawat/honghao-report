import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { recalculateInventoryFromTransactions } from '@/lib/inventory-recalc'

async function syncCardStatus(tx: Prisma.TransactionClient, cardId: string) {
  const inventory = await tx.cardInventory.findUnique({
    where: { cardId },
  })
  const card = await tx.card.findUnique({
    where: { id: cardId },
    include: { transactions: { where: { type: 'SELL' }, select: { id: true } } },
  })
  if (!card) return

  let status = card.status
  if (status === 'grading') return

  const qty = inventory?.quantity ?? 0
  const hasSell = card.transactions.length > 0

  if (qty === 0 && hasSell) {
    status = 'sold_out'
  } else {
    status = 'in_stock'
  }

  if (status !== card.status) {
    await tx.card.update({ where: { id: cardId }, data: { status } })
  }
}

const transactionSchema = z.object({
  cardId: z.string().min(1),
  type: z.enum(['BUY', 'SELL']),
  quantity: z.number().int().positive(),
  pricePerUnit: z.number().positive(),
  shippingCost: z.number().nonnegative().optional(),
  date: z.string().datetime(),
  note: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') as 'BUY' | 'SELL' | 'GRADING' | null
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const search = searchParams.get('search') || ''
  const cardType = searchParams.get('cardType')
  const game = searchParams.get('game')
  const limit = searchParams.get('limit')

  const where: Prisma.TransactionWhereInput = { userId }
  if (type) {
    where.type = type
  } else {
    // Grading transactions are managed from the Grading page.
    where.type = { not: 'GRADING' }
  }
  if (year && month) {
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    const end = new Date(Date.UTC(Number(year), Number(month), 1))
    where.date = { gte: start, lt: end }
  }

  if (search || cardType || game) {
    where.card = {}
    if (search) {
      where.card.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { setCode: { contains: search, mode: 'insensitive' } },
        { cardNumber: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (cardType) where.card.cardType = cardType
    if (game) where.card.game = game
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      card: {
        include: {
          inventory: {
            select: { averageCost: true },
          },
        },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    take: limit ? Number(limit) : undefined,
  })

  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = transactionSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.findFirst({
        where: { id: data.cardId, userId },
        include: { inventory: true },
      })
      if (!card) {
        throw new Error('Card not found')
      }

      if (data.type === 'SELL') {
        if (card.status === 'grading') {
          throw new Error('Card is being graded')
        }
        if (!card.inventory || card.inventory.quantity < data.quantity) {
          throw new Error('Insufficient stock')
        }
      }

      const shippingCost = data.shippingCost ?? 0
      const totalAmount = data.quantity * data.pricePerUnit + shippingCost

      const transaction = await tx.transaction.create({
        data: {
          cardId: data.cardId,
          userId,
          type: data.type,
          quantity: data.quantity,
          pricePerUnit: data.pricePerUnit,
          totalAmount,
          shippingCost: shippingCost > 0 ? shippingCost : null,
          date: new Date(data.date),
          note: data.note,
        },
      })

      await recalculateInventoryFromTransactions(tx, data.cardId, userId)
      await syncCardStatus(tx, data.cardId)

      return transaction
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error) {
      if (error.message === 'Card not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === 'Insufficient stock' || error.message === 'Card is being graded') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
