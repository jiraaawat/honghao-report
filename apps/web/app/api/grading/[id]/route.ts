import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { recalculateInventoryFromTransactions } from '@/lib/inventory-recalc'

const completeSchema = z.object({
  action: z.literal('complete'),
  grade: z.string().min(1),
  currentValue: z.number().positive(),
  date: z.string().datetime(),
})

const cancelSchema = z.object({
  action: z.literal('cancel'),
})

const updateSchema = z.union([completeSchema, cancelSchema])

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const grading = await prisma.gradingRecord.findFirst({
    where: { id, userId },
    include: { card: true },
  })

  if (!grading) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    if (data.action === 'cancel') {
      await prisma.$transaction(async (tx) => {
        await tx.gradingRecord.update({
          where: { id },
          data: {
            status: 'cancelled',
            cancelledDate: new Date(),
          },
        })

        await tx.card.update({
          where: { id: grading.cardId },
          data: { status: 'in_stock' },
        })

        // Remove grading cost transaction
        await tx.transaction.deleteMany({
          where: {
            cardId: grading.cardId,
            userId,
            isGradingCost: true,
          },
        })

        await recalculateInventoryFromTransactions(tx, grading.cardId, userId)
      }, { timeout: 20000, maxWait: 10000 })

      return NextResponse.json({ success: true })
    }

    if (data.action === 'complete') {
      const newCardType = data.grade.startsWith('PSA') ? data.grade : `PSA ${data.grade}`

      await prisma.$transaction(async (tx) => {
        await tx.gradingRecord.update({
          where: { id },
          data: {
            status: 'completed',
            grade: data.grade,
            currentValue: data.currentValue,
            completedDate: new Date(data.date),
          },
        })

        await tx.card.update({
          where: { id: grading.cardId },
          data: {
            status: 'in_stock',
            cardType: newCardType,
          },
        })

        // Set inventory current value to the graded value.
        // Average cost already includes grading cost via the BUY transaction.
        await tx.cardInventory.update({
          where: { cardId: grading.cardId },
          data: {
            currentValue: data.currentValue,
          },
        })

        // Update grading cost transaction note with final grade
        await tx.transaction.updateMany({
          where: {
            cardId: grading.cardId,
            userId,
            isGradingCost: true,
          },
          data: {
            note: `Grading cost for ${grading.card.name} → ${data.grade}`,
          },
        })

        await recalculateInventoryFromTransactions(tx, grading.cardId, userId)
      }, { timeout: 20000, maxWait: 10000 })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
