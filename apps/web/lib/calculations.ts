import { Transaction } from '@prisma/client'

export interface MonthlyStats {
  year: number
  month: number
  totalBuy: number
  totalSell: number
  buyQty: number
  sellQty: number
  costBasisSold: number
  totalProfit: number
  roi: number
  transactionCount: number
}

export function calculateMonthlyReport(
  transactions: Transaction[],
  avgCostMap?: Record<string, number>
): MonthlyStats[] {
  const grouped = new Map<string, MonthlyStats>()

  for (const tx of transactions) {
    const date = new Date(tx.date)
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        totalBuy: 0,
        totalSell: 0,
        buyQty: 0,
        sellQty: 0,
        costBasisSold: 0,
        totalProfit: 0,
        roi: 0,
        transactionCount: 0,
      })
    }

    const stats = grouped.get(key)!
    stats.transactionCount += 1

    if (tx.type === 'BUY') {
      stats.totalBuy += Number(tx.totalAmount)
      stats.buyQty += tx.quantity
    } else {
      stats.totalSell += Number(tx.totalAmount)
      stats.sellQty += tx.quantity
      if (avgCostMap) {
        const avgCost = avgCostMap[tx.cardId] ?? 0
        stats.costBasisSold += tx.quantity * avgCost
      }
    }
  }

  return Array.from(grouped.values())
    .map((stats) => {
      if (avgCostMap) {
        stats.totalProfit = stats.totalSell - stats.costBasisSold
        stats.roi = stats.costBasisSold > 0 ? (stats.totalProfit / stats.costBasisSold) * 100 : 0
      } else {
        stats.totalProfit = stats.totalSell - stats.totalBuy
        stats.roi = stats.totalBuy > 0 ? (stats.totalProfit / stats.totalBuy) * 100 : 0
      }
      return stats
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
}

export function calculateTotalProfit(transactions: Transaction[]): number {
  const buyTotal = transactions
    .filter((t) => t.type === 'BUY')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const sellTotal = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  return sellTotal - buyTotal
}

export function calculateROI(transactions: Transaction[]): number {
  const buyTotal = transactions
    .filter((t) => t.type === 'BUY')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const profit = calculateTotalProfit(transactions)
  return buyTotal > 0 ? (profit / buyTotal) * 100 : 0
}
