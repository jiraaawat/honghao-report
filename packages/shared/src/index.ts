export interface CardDto {
  id: string
  name: string
  setCode?: string | null
  cardNumber?: string | null
  rarity?: string | null
  cardType?: string | null
  game?: string | null
  condition?: string | null
  status?: string | null
  imageUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface TransactionDto {
  id: string
  cardId: string
  type: 'BUY' | 'SELL' | 'GRADING' | 'COST_ADJUSTMENT'
  quantity: number
  pricePerUnit: number
  totalAmount: number
  shippingCost?: number | null
  date: string
  note?: string | null
  createdAt: string
  updatedAt: string
  card?: CardDto
}

export interface MonthlyReport {
  year: number
  month: number
  totalBuy: number
  totalSell: number
  totalProfit: number
  roi: number
  transactionCount: number
}
