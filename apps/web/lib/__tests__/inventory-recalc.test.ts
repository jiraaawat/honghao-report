import { describe, it, expect } from 'vitest'
import { computeInventoryFromTransactions } from '../inventory-recalc'

type Tx = Parameters<typeof computeInventoryFromTransactions>[0][number]

function tx(overrides: Partial<Tx> & Pick<Tx, 'type' | 'quantity' | 'totalAmount'>): Tx {
  return { isGradingCost: null, ...overrides }
}

describe('computeInventoryFromTransactions', () => {
  it('returns zeros for empty transactions', () => {
    const result = computeInventoryFromTransactions([], 0)
    expect(result.quantity).toBe(0)
    expect(result.averageCost).toBe(0)
    expect(result.totalInvested).toBe(0)
  })

  it('computes quantity and average cost after a buy', () => {
    const result = computeInventoryFromTransactions([tx({ type: 'BUY', quantity: 2, totalAmount: 100 })], 2)
    expect(result.quantity).toBe(2)
    expect(result.averageCost).toBe(50)
    expect(result.totalInvested).toBe(100)
  })

  it('subtracts sells from quantity and leaves invested at zero when sold out', () => {
    const result = computeInventoryFromTransactions(
      [
        tx({ type: 'BUY', quantity: 2, totalAmount: 100 }),
        tx({ type: 'SELL', quantity: 2, totalAmount: 150 }),
      ],
      0
    )
    expect(result.quantity).toBe(0)
    expect(result.averageCost).toBe(50)
    expect(result.totalInvested).toBe(0)
  })

  it('clamps quantity to zero when sells exceed buys', () => {
    const result = computeInventoryFromTransactions(
      [
        tx({ type: 'BUY', quantity: 1, totalAmount: 50 }),
        tx({ type: 'SELL', quantity: 3, totalAmount: 200 }),
      ],
      0
    )
    expect(result.quantity).toBe(0)
    expect(result.averageCost).toBe(50)
  })

  it('includes grading-cost transactions in average cost but not quantity', () => {
    const result = computeInventoryFromTransactions(
      [
        tx({ type: 'BUY', quantity: 2, totalAmount: 100 }),
        tx({ type: 'GRADING', quantity: 1, totalAmount: 50, isGradingCost: true }),
      ],
      2
    )
    expect(result.quantity).toBe(2)
    expect(result.averageCost).toBe(75)
    expect(result.totalInvested).toBe(150)
  })

  it('includes non-cost grading as buy-like', () => {
    const result = computeInventoryFromTransactions(
      [
        tx({ type: 'BUY', quantity: 1, totalAmount: 100 }),
        tx({ type: 'GRADING', quantity: 1, totalAmount: 80, isGradingCost: false }),
      ],
      2
    )
    expect(result.quantity).toBe(2)
    expect(result.averageCost).toBe(90)
  })

  it('includes cost adjustments in average cost', () => {
    const result = computeInventoryFromTransactions(
      [
        tx({ type: 'BUY', quantity: 2, totalAmount: 100 }),
        tx({ type: 'COST_ADJUSTMENT', quantity: 0, totalAmount: 20 }),
      ],
      2
    )
    expect(result.averageCost).toBe(60)
    expect(result.totalInvested).toBe(120)
  })

  it('falls back to currentQuantity when there are no buy-like transactions', () => {
    const result = computeInventoryFromTransactions(
      [tx({ type: 'GRADING', quantity: 1, totalAmount: 100, isGradingCost: true })],
      5
    )
    expect(result.quantity).toBe(0)
    expect(result.averageCost).toBe(20)
    expect(result.totalInvested).toBe(0)
  })
})
