import { InventoryItem, CardDto } from '@/types'

interface InventorySummary {
  totalCards: number
  inStock: number
  grading: number
  soldOut: number
  soldCards: number
  totalValue: number
  totalProfit: number
  totalInvested: number
  totalBuy: number
  totalROI: number
}

export interface InventoryResponse {
  items: InventoryItem[]
  summary: InventorySummary
}

function recalcROI(summary: InventorySummary) {
  summary.totalROI = summary.totalBuy > 0 ? (summary.totalProfit / summary.totalBuy) * 100 : 0
}

function patchSummary(
  current: InventoryResponse,
  delta: Partial<Omit<InventorySummary, 'totalROI'>>
): InventorySummary {
  const next = { ...current.summary }
  ;(Object.keys(delta) as (keyof typeof delta)[]).forEach((key) => {
    const value = delta[key]
    if (typeof value === 'number') {
      ;(next as Record<typeof key, number>)[key] += value
    }
  })
  recalcROI(next)
  return next
}

function updateItem(current: InventoryResponse, cardId: string, patch: Partial<InventoryItem>) {
  return current.items.map((item) => (item.cardId === cardId ? { ...item, ...patch } : item))
}

const emptyResponse: InventoryResponse = {
  items: [],
  summary: {
    totalCards: 0,
    inStock: 0,
    grading: 0,
    soldOut: 0,
    soldCards: 0,
    totalValue: 0,
    totalProfit: 0,
    totalInvested: 0,
    totalBuy: 0,
    totalROI: 0,
  },
}

export function optimisticSell(
  current: InventoryResponse | undefined,
  item: InventoryItem,
  qty: number,
  price: number,
  shipping: number
): InventoryResponse {
  if (!current) return emptyResponse

  const newQty = item.quantity - qty
  const newSoldQty = item.soldQty + qty
  const saleTotal = qty * price + shipping
  const avgCost = item.averageCost
  const newTotalSold = item.totalSold + saleTotal
  const newProfit = newTotalSold - newSoldQty * avgCost
  const now = new Date().toISOString()

  const patch: Partial<InventoryItem> = {
    quantity: newQty,
    soldQty: newSoldQty,
    totalSold: newTotalSold,
    profit: newProfit,
    realizedProfit: newProfit,
    totalInvested: avgCost * newQty,
    currentValue: newQty * item.marketValuePerUnit,
    status: newQty > 0 ? 'in_stock' : 'sold_out',
    lastTransaction: now,
    soldAt: newQty === 0 ? now : item.soldAt,
  }

  return {
    items: updateItem(current, item.cardId, patch),
    summary: patchSummary(current, {
      totalCards: -qty,
      inStock: -qty,
      soldOut: +qty,
      soldCards: +qty,
      totalValue: -(qty * item.marketValuePerUnit),
      totalProfit: +(saleTotal - qty * avgCost),
      totalInvested: -(qty * avgCost),
    }),
  }
}

export function optimisticRemove(
  current: InventoryResponse | undefined,
  item: InventoryItem,
  qty: number
): InventoryResponse {
  if (!current) return emptyResponse

  const newQty = item.quantity - qty
  const avgCost = item.averageCost
  const now = new Date().toISOString()

  if (newQty <= 0 && item.soldQty === 0) {
    return {
      items: current.items.filter((i) => i.cardId !== item.cardId),
      summary: patchSummary(current, {
        totalCards: -item.quantity,
        inStock: -item.quantity,
        totalValue: -item.currentValue,
        totalProfit: 0,
        totalInvested: -item.totalInvested,
      }),
    }
  }

  const patch: Partial<InventoryItem> = {
    quantity: newQty,
    totalInvested: avgCost * newQty,
    currentValue: newQty * item.marketValuePerUnit,
    lastTransaction: now,
  }

  return {
    items: updateItem(current, item.cardId, patch),
    summary: patchSummary(current, {
      totalCards: -qty,
      inStock: -qty,
      totalValue: -(qty * item.marketValuePerUnit),
      totalInvested: -(qty * avgCost),
    }),
  }
}

export function optimisticBuy(
  current: InventoryResponse | undefined,
  item: InventoryItem,
  qty: number,
  price: number
): InventoryResponse {
  if (!current) return emptyResponse

  const newQty = item.quantity + qty
  const newTotalInvested = item.totalInvested + qty * price
  const newAvgCost = newQty > 0 ? newTotalInvested / newQty : 0
  const now = new Date().toISOString()

  const patch: Partial<InventoryItem> = {
    quantity: newQty,
    averageCost: newAvgCost,
    totalInvested: newTotalInvested,
    totalBuy: (item.totalBuy ?? 0) + qty * price,
    currentValue: newQty * item.marketValuePerUnit,
    status: newQty > 0 ? 'in_stock' : item.status,
    lastTransaction: now,
  }

  return {
    items: updateItem(current, item.cardId, patch),
    summary: patchSummary(current, {
      totalCards: +qty,
      inStock: +qty,
      totalValue: +(qty * item.marketValuePerUnit),
      totalInvested: +(qty * price),
      totalBuy: +(qty * price),
    }),
  }
}

export function optimisticNewCard(
  current: InventoryResponse | undefined,
  card: CardDto,
  qty: number,
  price: number
): InventoryResponse {
  if (!current) return emptyResponse

  const now = new Date().toISOString()
  const newItem: InventoryItem = {
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
    status: 'in_stock',
    quantity: qty,
    averageCost: price,
    marketValuePerUnit: price,
    currentValue: qty * price,
    totalInvested: qty * price,
    totalBuy: qty * price,
    totalSold: 0,
    soldQty: 0,
    realizedProfit: 0,
    unrealizedProfit: 0,
    profit: 0,
    order: null,
    lastTransaction: now,
    createdAt: now,
    soldAt: null,
    grading: null,
  }

  return {
    items: [newItem, ...current.items],
    summary: patchSummary(current, {
      totalCards: +qty,
      inStock: +qty,
      totalValue: +(qty * price),
      totalInvested: +(qty * price),
      totalBuy: +(qty * price),
    }),
  }
}

export function optimisticCost(
  current: InventoryResponse | undefined,
  item: InventoryItem,
  newAverageCost: number
): InventoryResponse {
  if (!current) return emptyResponse

  const qty = item.quantity
  const newTotalInvested = newAverageCost * qty
  const newProfit = item.totalSold - item.soldQty * newAverageCost
  const now = new Date().toISOString()

  const patch: Partial<InventoryItem> = {
    averageCost: newAverageCost,
    totalInvested: newTotalInvested,
    profit: newProfit,
    realizedProfit: newProfit,
    lastTransaction: now,
  }

  return {
    items: updateItem(current, item.cardId, patch),
    summary: patchSummary(current, {
      totalProfit: +(newProfit - item.profit),
      totalInvested: +(newTotalInvested - item.totalInvested),
      totalBuy: +(newTotalInvested - (item.totalInvested ?? 0)),
    }),
  }
}

export function optimisticCurrentValue(
  current: InventoryResponse | undefined,
  item: InventoryItem,
  newValuePerUnit: number
): InventoryResponse {
  if (!current) return emptyResponse

  const newCurrentValue = item.quantity * newValuePerUnit
  const deltaValue = newCurrentValue - item.currentValue

  const patch: Partial<InventoryItem> = {
    marketValuePerUnit: newValuePerUnit,
    currentValue: newCurrentValue,
  }

  return {
    items: updateItem(current, item.cardId, patch),
    summary: patchSummary(current, {
      totalValue: +deltaValue,
    }),
  }
}
