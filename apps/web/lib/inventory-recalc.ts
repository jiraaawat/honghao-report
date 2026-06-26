import { Prisma } from '@prisma/client'
import { calculateAverageCost } from './calculations'

export interface InventoryRecalcTx {
  type: string
  quantity: number
  totalAmount: number | string | { toNumber: () => number }
  isGradingCost?: boolean | null
}

export function computeInventoryFromTransactions(
  transactions: InventoryRecalcTx[],
  currentQuantity?: number
): { quantity: number; averageCost: number; totalInvested: number } {
  const buyLike = transactions.filter(
    (t) => (t.type === 'BUY' || t.type === 'GRADING') && !t.isGradingCost
  )
  const sellLike = transactions.filter((t) => t.type === 'SELL')

  const totalBuyQty = buyLike.reduce((sum, t) => sum + t.quantity, 0)
  const totalSellQty = sellLike.reduce((sum, t) => sum + t.quantity, 0)
  const quantity = Math.max(0, totalBuyQty - totalSellQty)

  const costTransactions = transactions.filter((t) => t.type !== 'SELL')
  const averageCost = calculateAverageCost(costTransactions, currentQuantity ?? quantity)
  const totalInvested = averageCost * quantity

  return { quantity, averageCost, totalInvested }
}

export async function recalculateInventoryFromTransactions(
  tx: Prisma.TransactionClient,
  cardId: string,
  userId: string
) {
  const [inventory, buyLikeTxs, gradingCostTxs, adjustmentTxs, sellTxs] = await Promise.all([
    tx.cardInventory.findUnique({ where: { cardId } }),
    tx.transaction.findMany({
      where: {
        cardId,
        OR: [
          { type: 'BUY', isGradingCost: false },
          { type: 'GRADING', isGradingCost: false },
        ],
      },
      select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
    }),
    tx.transaction.findMany({
      where: {
        cardId,
        OR: [
          { type: 'BUY', isGradingCost: true },
          { type: 'GRADING', isGradingCost: true },
        ],
      },
      select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
    }),
    tx.transaction.findMany({
      where: { cardId, type: 'COST_ADJUSTMENT' },
      select: { type: true, quantity: true, totalAmount: true, isGradingCost: true },
    }),
    tx.transaction.findMany({
      where: { cardId, type: 'SELL' },
      select: { quantity: true },
    }),
  ])

  const { quantity, averageCost, totalInvested } = computeInventoryFromTransactions(
    [
      ...buyLikeTxs,
      ...gradingCostTxs,
      ...adjustmentTxs,
      ...sellTxs.map((t) => ({ type: 'SELL' as const, quantity: t.quantity, totalAmount: 0, isGradingCost: false })),
    ],
    inventory?.quantity ?? undefined
  )

  return tx.cardInventory.upsert({
    where: { cardId },
    update: { quantity, averageCost, totalInvested },
    create: { cardId, userId, quantity, averageCost, totalInvested },
  })
}
