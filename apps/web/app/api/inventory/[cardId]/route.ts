import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { recalculateInventoryFromTransactions } from '@/lib/inventory-recalc'
import { z } from 'zod'

const updateSchema = z.object({
  currentValue: z.number().nonnegative(),
})

const removeSchema = z.object({
  quantity: z.number().int().positive(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
  })
  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = removeSchema.parse(body)

    const result = await prisma.$transaction(async (tx) => {
      const inventory = await tx.cardInventory.findUnique({
        where: { cardId },
      })
      if (!inventory || inventory.quantity < data.quantity) {
        throw new Error('Insufficient stock')
      }

      // Reverse the most recent normal BUY transaction(s) up to the removed qty.
      const buyTxs = await tx.transaction.findMany({
        where: {
          cardId,
          userId,
          type: 'BUY',
          isGradingCost: false,
        },
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      })

      let remaining = data.quantity
      for (const transaction of buyTxs) {
        if (remaining <= 0) break
        if (transaction.quantity <= remaining) {
          await tx.transaction.delete({ where: { id: transaction.id } })
          remaining -= transaction.quantity
        } else {
          const newQty = transaction.quantity - remaining
          const newTotal = Number(transaction.totalAmount) - Number(transaction.pricePerUnit) * remaining
          await tx.transaction.update({
            where: { id: transaction.id },
            data: {
              quantity: newQty,
              totalAmount: newTotal,
            },
          })
          remaining = 0
        }
      }

      // Recalculate inventory from remaining transactions.
      if (buyTxs.length > 0) {
        await recalculateInventoryFromTransactions(tx, cardId, userId)
      } else {
        // Fallback: if no normal buy tx was found to reverse, just reduce the existing inventory.
        const newQuantity = inventory.quantity - data.quantity
        const fallbackAvgCost = Number(inventory.averageCost)
        const totalInvested = Math.max(0, fallbackAvgCost * newQuantity)
        const avgCost = newQuantity > 0 ? totalInvested / newQuantity : 0
        await tx.cardInventory.update({
          where: { cardId },
          data: { quantity: newQuantity, averageCost: avgCost, totalInvested },
        })
      }

      const updated = await tx.cardInventory.findUnique({ where: { cardId } })
      return { quantity: updated?.quantity ?? 0 }
    })

    return NextResponse.json({ success: true, quantity: result.quantity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Insufficient stock') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
  })

  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    await prisma.cardInventory.update({
      where: { cardId },
      data: { currentValue: data.currentValue },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
