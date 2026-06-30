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

const updateSchema = z.object({
  quantity: z.number().int().positive(),
  pricePerUnit: z.number().nonnegative(),
  shippingCost: z.number().nonnegative().optional(),
  date: z.string().datetime(),
  note: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (transaction.type === 'GRADING') {
    return NextResponse.json(
      { error: 'Grading transactions cannot be modified here. Use the Grading page instead.' },
      { status: 400 }
    )
  }

  if (transaction.type === 'COST_ADJUSTMENT') {
    return NextResponse.json(
      { error: 'Cost adjustments cannot be modified. Edit the inventory cost instead.' },
      { status: 400 }
    )
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const shippingCost = data.shippingCost ?? 0
    const totalAmount = data.quantity * data.pricePerUnit + shippingCost

    await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: transaction.cardId },
        include: { inventory: true },
      })
      if (!card || card.userId !== userId) {
        throw new Error('Card not found')
      }

      // For SELL edits, ensure enough stock after reverting the old sell.
      if (transaction.type === 'SELL') {
        const otherSells = await tx.transaction.aggregate({
          where: {
            cardId: transaction.cardId,
            type: 'SELL',
            id: { not: transaction.id },
          },
          _sum: { quantity: true },
        })
        const buyLike = await tx.transaction.aggregate({
          where: {
            cardId: transaction.cardId,
            OR: [
              { type: 'BUY', isGradingCost: false },
              { type: 'GRADING', isGradingCost: false },
            ],
          },
          _sum: { quantity: true },
        })
        const available = (buyLike._sum.quantity ?? 0) - (otherSells._sum.quantity ?? 0)
        if (data.quantity > available) {
          throw new Error('Insufficient stock')
        }
      }

      await tx.transaction.update({
        where: { id },
        data: {
          quantity: data.quantity,
          pricePerUnit: data.pricePerUnit,
          totalAmount,
          shippingCost: shippingCost > 0 ? shippingCost : null,
          date: new Date(data.date),
          note: data.note,
        },
      })

      await recalculateInventoryFromTransactions(tx, transaction.cardId, userId)
      await syncCardStatus(tx, transaction.cardId)
    }, { timeout: 20000, maxWait: 10000 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error) {
      if (error.message === 'Card not found') {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message === 'Insufficient stock') {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (transaction.type === 'GRADING') {
    return NextResponse.json(
      { error: 'Grading transactions cannot be deleted here. Use the Grading page instead.' },
      { status: 400 }
    )
  }

  try {
    await prisma.$transaction(async (tx) => {
      const card = await tx.card.findUnique({
        where: { id: transaction.cardId },
        include: { inventory: true },
      })
      if (!card || card.userId !== userId) {
        throw new Error('Card not found')
      }

      await tx.transaction.delete({ where: { id } })

      await recalculateInventoryFromTransactions(tx, transaction.cardId, userId)
      await syncCardStatus(tx, transaction.cardId)
    }, { timeout: 20000, maxWait: 10000 })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Card not found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
