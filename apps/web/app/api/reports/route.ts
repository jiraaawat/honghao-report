import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateAverageCost, calculateMonthlyReport } from '@/lib/calculations'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const where: { userId: string; date?: { gte: Date; lt: Date } } = { userId }
  if (year && month) {
    const start = new Date(Date.UTC(Number(year), Number(month) - 1, 1))
    const end = new Date(Date.UTC(Number(year), Number(month), 1))
    where.date = { gte: start, lt: end }
  }

  const [transactions, cards] = await Promise.all([
    prisma.transaction.findMany({ where }),
    prisma.card.findMany({
      where: { userId },
      include: {
        inventory: true,
        transactions: {
          where: { type: { in: ['BUY', 'GRADING', 'COST_ADJUSTMENT'] } },
          select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
        },
      },
    }),
  ])

  const avgCostMap: Record<string, number> = {}
  for (const card of cards) {
    avgCostMap[card.id] = calculateAverageCost(card.transactions, card.inventory?.quantity ?? 0)
  }

  const report = calculateMonthlyReport(transactions, avgCostMap)

  return NextResponse.json(report)
}
