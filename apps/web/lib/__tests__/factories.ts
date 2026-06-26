import { Transaction } from '@prisma/client'
import { calculateAverageCost } from '../calculations'
import { InventoryCardInput } from '../inventory-aggregate'

type CostTx = Parameters<typeof calculateAverageCost>[0][number]

export function transactionFactory(
  overrides: Partial<Transaction> & Pick<Transaction, 'type' | 'quantity' | 'totalAmount' | 'date'>
): Transaction {
  return {
    id: 'tx-1',
    cardId: 'card-1',
    userId: 'user-1',
    pricePerUnit: 0,
    shippingCost: null,
    isGradingCost: null,
    note: null,
    createdAt: new Date(),
    ...overrides,
  } as unknown as Transaction
}

export function costTransactionFactory(
  overrides: Partial<CostTx> & Pick<CostTx, 'type' | 'quantity' | 'totalAmount'>
): CostTx {
  return {
    isGradingCost: null,
    ...overrides,
  }
}

export function inventoryCardFactory(overrides: Partial<InventoryCardInput> = {}): InventoryCardInput {
  return {
    id: 'card-1',
    name: 'Card One',
    setCode: null,
    cardNumber: null,
    rarity: null,
    imageUrl: null,
    cardType: 'Single',
    game: 'OnePiece',
    language: 'EN',
    condition: null,
    status: 'in_stock',
    inventory: null,
    gradings: [],
    transactions: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  } as InventoryCardInput
}
