import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const costSchema = z.object({
  newAverageCost: z.number().nonnegative(),
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
    include: { inventory: true },
  })
  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!card.inventory || card.inventory.quantity <= 0) {
    return NextResponse.json({ error: 'No inventory to adjust' }, { status: 400 })
  }

  try {
    const body = await req.json()
    const data = costSchema.parse(body)

    const quantity = card.inventory.quantity
    const oldAverageCost = Number(card.inventory.averageCost)
    const newAverageCost = data.newAverageCost
    const delta = (newAverageCost - oldAverageCost) * quantity

    const latestBuy = await prisma.transaction.findFirst({
      where: { cardId, userId, type: 'BUY' },
      orderBy: { date: 'desc' },
      select: { date: true },
    })
    const adjustmentDate = latestBuy?.date ?? new Date()

    const [updatedInventory] = await prisma.$transaction(async (tx) => {
      await tx.transaction.create({
        data: {
          cardId,
          userId,
          type: 'COST_ADJUSTMENT',
          quantity,
          pricePerUnit: newAverageCost - oldAverageCost,
          totalAmount: delta,
          shippingCost: null,
          date: adjustmentDate,
          note: `Cost adjustment: ${oldAverageCost} → ${newAverageCost}`,
          isGradingCost: false,
        },
      })

      const inv = await tx.cardInventory.update({
        where: { cardId },
        data: {
          averageCost: newAverageCost,
          totalInvested: newAverageCost * quantity,
        },
      })
      return [inv]
    })

    return NextResponse.json({
      success: true,
      averageCost: Number(updatedInventory.averageCost),
      totalInvested: Number(updatedInventory.totalInvested),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
