import { Transaction } from '@prisma/client'
import { calculateAverageCost } from './calculations'

export interface InventoryCardInput {
  id: string
  name: string
  setCode: string | null
  cardNumber: string | null
  rarity: string | null
  imageUrl: string | null
  cardType: string | null
  game: string | null
  language: string | null
  condition: string | null
  status: string
  createdAt: Date
  inventory: {
    quantity: number
    currentValue: number | string | { toNumber: () => number } | null
    order: number | null
  } | null
  gradings: Array<{
    id: string
    cardId: string
    status: string
    gradingCost: number | string | { toNumber: () => number }
    grade: string | null
    currentValue: number | string | { toNumber: () => number } | null
    sentDate: Date
  }>
  transactions: Transaction[]
}

export interface InventoryItem {
  cardId: string
  cardName: string
  setCode: string | null
  cardNumber: string | null
  rarity: string | null
  imageUrl: string | null
  cardType: string
  game: string
  language: string
  condition: string | null
  status: 'in_stock' | 'sold_out' | 'grading'
  quantity: number
  averageCost: number
  marketValuePerUnit: number
  currentValue: number
  totalInvested: number
  totalSold: number
  soldQty: number
  realizedProfit: number
  unrealizedProfit: number
  profit: number
  order: number | null
  lastTransaction: string | null
  createdAt: string
  soldAt: string | null
  grading: {
    id: string
    cardId: string
    status: string
    gradingCost: number
    grade: string | null
    currentValue: number | null
    sentDate: string
  } | null
}

export function aggregateInventoryItem(card: InventoryCardInput): InventoryItem {
  const sellTxs = card.transactions.filter((t) => t.type === 'SELL')
  const totalSellQty = sellTxs.reduce((sum, t) => sum + t.quantity, 0)
  const totalSellAmount = sellTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
  const quantity = card.inventory?.quantity ?? 0
  const avgCost = calculateAverageCost(card.transactions, quantity)

  const effectiveStatus: 'in_stock' | 'sold_out' | 'grading' =
    card.status === 'grading'
      ? 'grading'
      : totalSellQty > 0 && quantity === 0
        ? 'sold_out'
        : 'in_stock'

  const marketValuePerUnit = card.inventory?.currentValue
    ? Number(card.inventory.currentValue)
    : avgCost
  const currentValue = quantity * marketValuePerUnit
  const realizedProfit = totalSellAmount - totalSellQty * avgCost
  const unrealizedProfit =
    effectiveStatus !== 'sold_out' && card.inventory?.currentValue
      ? (marketValuePerUnit - avgCost) * quantity
      : 0
  const profit = realizedProfit

  const grading = card.gradings[0]

  return {
    cardId: card.id,
    cardName: card.name,
    setCode: card.setCode,
    cardNumber: card.cardNumber,
    rarity: card.rarity,
    imageUrl: card.imageUrl,
    cardType: card.cardType || 'Single',
    game: card.game || 'OnePiece',
    language: card.language || 'EN',
    condition: card.condition,
    status: effectiveStatus,
    quantity,
    averageCost: avgCost,
    marketValuePerUnit,
    currentValue,
    totalInvested: avgCost * quantity,
    totalSold: totalSellAmount,
    soldQty: totalSellQty,
    realizedProfit,
    unrealizedProfit,
    profit,
    order: card.inventory?.order ?? null,
    lastTransaction:
      card.transactions.length > 0
        ? card.transactions[card.transactions.length - 1].date.toISOString()
        : null,
    createdAt: card.createdAt.toISOString(),
    soldAt: sellTxs.length > 0 ? sellTxs[sellTxs.length - 1].date.toISOString() : null,
    grading: grading
      ? {
          id: grading.id,
          cardId: grading.cardId,
          status: grading.status,
          gradingCost: Number(grading.gradingCost),
          grade: grading.grade,
          currentValue: grading.currentValue ? Number(grading.currentValue) : null,
          sentDate: grading.sentDate.toISOString(),
        }
      : null,
  }
}

export function aggregateInventorySummary(items: InventoryItem[]) {
  const visible = items.filter(
    (i) => i.quantity > 0 || i.status === 'sold_out' || i.status === 'grading'
  )

  const allInStockQty = visible
    .filter((i) => i.status === 'in_stock')
    .reduce((sum, i) => sum + i.quantity, 0)
  const allGradingQty = visible
    .filter((i) => i.status === 'grading')
    .reduce((sum, i) => sum + i.quantity, 0)
  const allSoldOutCount = visible.reduce((sum, i) => sum + i.soldQty, 0)

  const allTotalValue = visible.reduce((sum, i) => sum + i.currentValue, 0)
  const allTotalProfit = visible.reduce((sum, i) => sum + i.profit, 0)
  const allTotalInvested = visible.reduce((sum, i) => sum + i.totalInvested, 0)

  return {
    totalCards: allInStockQty + allGradingQty,
    inStock: allInStockQty,
    grading: allGradingQty,
    soldOut: allSoldOutCount,
    soldCards: allSoldOutCount,
    totalValue: allTotalValue,
    totalProfit: allTotalProfit,
    totalROI: allTotalInvested > 0 ? (allTotalProfit / allTotalInvested) * 100 : 0,
    totalInvested: allTotalInvested,
  }
}
