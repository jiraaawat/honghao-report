import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateMonthlyReport } from '@/lib/calculations'

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
          where: { type: 'BUY' },
          select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
        },
      },
    }),
  ])

  const avgCostMap: Record<string, number> = {}
  for (const card of cards) {
    const normalBuyTxs = card.transactions.filter((t) => !t.isGradingCost)
    const gradingBuyTxs = card.transactions.filter((t) => t.isGradingCost)
    const totalBuyQty = normalBuyTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = normalBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalGradingCost = gradingBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    avgCostMap[card.id] = totalBuyQty > 0 ? (totalBuyAmount + totalGradingCost) / totalBuyQty : 0
  }

  const report = calculateMonthlyReport(transactions, avgCostMap)

  return NextResponse.json(report)
}
