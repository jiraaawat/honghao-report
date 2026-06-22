import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function getDateRange(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (startDate && endDate) {
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const { start, end } = getDateRange(searchParams)

  const dateWhere = { gte: start, lte: end }

  const [totalTransactions, filteredTransactions, cards] = await Promise.all([
    prisma.transaction.count({ where: { userId, date: dateWhere } }),
    prisma.transaction.findMany({
      where: { userId, date: dateWhere },
    }),
    prisma.card.findMany({
      where: { userId },
      include: {
        inventory: true,
        transactions: {
          select: { type: true, quantity: true, totalAmount: true, isGradingCost: true, date: true },
        },
      },
    }),
  ])

  let activeCards = 0
  let totalProfit = 0
  let totalInvested = 0
  let totalValue = 0
  let totalBuyAllTime = 0
  const avgCostByCardId = new Map<string, number>()

  for (const card of cards) {
    const buyTxs = card.transactions.filter((t) => t.type === 'BUY')
    const sellTxs = card.transactions.filter((t) => t.type === 'SELL')
    const normalBuyTxs = buyTxs.filter((t) => !t.isGradingCost)
    const gradingBuyTxs = buyTxs.filter((t) => t.isGradingCost)
    const totalBuyQty = normalBuyTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = normalBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalGradingCost = gradingBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalSellQty = sellTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalSellAmount = sellTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const avgCost = totalBuyQty > 0 ? (totalBuyAmount + totalGradingCost) / totalBuyQty : 0
    const qty = card.inventory?.quantity ?? 0

    if (qty > 0 || card.status === 'grading') {
      activeCards += qty
    }

    const realizedProfit = totalSellAmount - totalSellQty * avgCost
    const marketValue = card.inventory?.currentValue
      ? Number(card.inventory.currentValue)
      : avgCost

    avgCostByCardId.set(card.id, avgCost)
    totalProfit += realizedProfit
    totalInvested += avgCost * qty
    totalValue += qty * marketValue
    totalBuyAllTime += totalBuyAmount + totalGradingCost
  }

  const filteredBuyTxs = filteredTransactions.filter((t) => t.type === 'BUY')
  const filteredSellTxs = filteredTransactions.filter((t) => t.type === 'SELL')
  const totalSpend = filteredBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const totalSell = filteredSellTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const periodProfit = filteredSellTxs.reduce(
    (sum, t) => sum + Number(t.totalAmount) - t.quantity * (avgCostByCardId.get(t.cardId) ?? 0),
    0
  )

  const totalSoldCards = filteredSellTxs.reduce((sum, t) => sum + t.quantity, 0)

  const totalROI = totalBuyAllTime > 0 ? (totalProfit / totalBuyAllTime) * 100 : 0

  return NextResponse.json({
    totalTransactions,
    totalCards: activeCards,
    totalSoldCards,
    totalProfit,
    totalROI,
    totalSpend,
    totalSell,
    periodProfit,
    totalInvested,
    totalValue,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  })
}
