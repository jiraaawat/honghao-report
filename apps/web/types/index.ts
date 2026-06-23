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
  type: 'BUY' | 'SELL'
  quantity: number
  pricePerUnit: number
  totalAmount: number
  shippingCost?: number | null
  date: string
  note?: string | null
  isGradingCost?: boolean
  createdAt: string
  updatedAt: string
  card?: CardDto & { inventory?: { averageCost: number } | null }
}

export interface GradingRecordDto {
  id: string
  cardId: string
  status: 'grading' | 'completed' | 'cancelled'
  quantity: number
  gradingCost: number
  grade?: string | null
  currentValue?: number | null
  sentDate: string
  completedDate?: string | null
  cancelledDate?: string | null
  card?: CardDto
}

export interface MonthlyReport {
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

export interface DashboardStats {
  totalTransactions: number
  totalCards: number
  totalSoldCards: number
  totalProfit: number
  totalROI: number
  totalSpend: number
  totalSell: number
  periodProfit: number
  totalInvested: number
  totalValue: number
  startDate: string
  endDate: string
}

export interface InventoryItem {
  cardId: string
  cardName: string
  setCode?: string | null
  cardNumber?: string | null
  rarity?: string | null
  imageUrl?: string | null
  cardType: string
  game: string
  condition?: string | null
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
  lastTransaction: string | null
  createdAt: string
  soldAt?: string | null
  grading?: GradingRecordDto | null
}

export interface CatalogCardDto {
  id: string
  cardNo: string
  name: string
  color?: string | null
  cost?: number | null
  type?: string | null
  rarity?: string | null
  imagePath?: string | null
  effectText?: string | null
  setId?: string | null
  setName?: string | null
  marketPrice?: number | null
  inventoryPrice?: number | null
  source?: string | null
  cardPower?: number | null
  life?: number | null
  subTypes?: string | null
  dateScraped?: string | null
  cardImageId?: string | null
}

export interface CatalogSetDto {
  setId: string
  setName?: string | null
}

export const CARD_TYPES = ['Single', 'Bundle', 'PSA10', 'PSA9', 'Sealed Product'] as const
export const GAMES = ['OnePiece', 'Pokemon', 'Lorcana', 'ETC'] as const
export const GRADES = ['PSA10', 'PSA9', 'PSA8', 'PSA7', 'PSA6', 'PSA5', 'BGS10', 'BGS9.5', 'CGC10'] as const
export const TRANSACTION_TYPES = ['BUY', 'SELL'] as const
export const CARD_CONDITIONS = ['NM', 'LP', 'MP', 'HP', 'DMG'] as const
