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

function isBuyLike(tx: Transaction): boolean {
  // BUY transactions and grading-cost transactions count as spend and quantity.
  return tx.type === 'BUY' || (tx.type === 'GRADING' && tx.isGradingCost)
}

function isCostLike(tx: Transaction): boolean {
  // Anything that changes the cost basis, including manual adjustments.
  return tx.type === 'BUY' || (tx.type === 'GRADING' && tx.isGradingCost) || tx.type === 'COST_ADJUSTMENT'
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

    if (isCostLike(tx)) {
      stats.totalBuy += Number(tx.totalAmount)
      if (isBuyLike(tx)) {
        stats.buyQty += tx.quantity
      }
    } else if (tx.type === 'SELL') {
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
    .filter(isCostLike)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const sellTotal = transactions
    .filter((t) => t.type === 'SELL')
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  return sellTotal - buyTotal
}

export function calculateROI(transactions: Transaction[]): number {
  const buyTotal = transactions
    .filter(isCostLike)
    .reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const profit = calculateTotalProfit(transactions)
  return buyTotal > 0 ? (profit / buyTotal) * 100 : 0
}

interface CostTransaction {
  type: string
  quantity: number
  totalAmount: number | string | { toNumber: () => number }
  isGradingCost?: boolean | null
}

export function calculateAverageCost(
  transactions: CostTransaction[],
  currentQuantity?: number
): number {
  const costBasisTxs = transactions.filter(
    (t) => t.type === 'BUY' || (t.type === 'GRADING' && !t.isGradingCost)
  )
  const gradingCostTxs = transactions.filter(
    (t) => (t.type === 'BUY' && t.isGradingCost) || (t.type === 'GRADING' && t.isGradingCost)
  )
  const adjustmentTxs = transactions.filter((t) => t.type === 'COST_ADJUSTMENT')

  const totalBuyQty = costBasisTxs.reduce((sum, t) => sum + t.quantity, 0)
  const totalBuyAmount = costBasisTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const totalGradingCost = gradingCostTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const totalAdjustment = adjustmentTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)

  if (totalBuyQty > 0) {
    return (totalBuyAmount + totalGradingCost + totalAdjustment) / totalBuyQty
  }

  const qty = currentQuantity ?? 0
  return qty > 0 ? (totalGradingCost + totalAdjustment) / qty : 0
}
