import { describe, it, expect } from 'vitest'
import { aggregateInventoryItem, aggregateInventorySummary } from '../inventory-aggregate'
import { inventoryCardFactory, transactionFactory } from './factories'

describe('aggregateInventoryItem', () => {
  it('returns in-stock zeros for a card with no transactions', () => {
    const card = inventoryCardFactory()
    const item = aggregateInventoryItem(card)
    expect(item.status).toBe('in_stock')
    expect(item.quantity).toBe(0)
    expect(item.averageCost).toBe(0)
    expect(item.totalInvested).toBe(0)
    expect(item.profit).toBe(0)
  })

  it('computes average cost and total invested after a buy', () => {
    const card = inventoryCardFactory({
      inventory: { quantity: 2, currentValue: null, order: null },
      transactions: [
        transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
      ],
    })
    const item = aggregateInventoryItem(card)
    expect(item.quantity).toBe(2)
    expect(item.averageCost).toBe(50)
    expect(item.totalInvested).toBe(100)
    expect(item.status).toBe('in_stock')
  })

  it('includes grading-cost BUY in average cost without increasing quantity', () => {
    const card = inventoryCardFactory({
      inventory: { quantity: 2, currentValue: null, order: null },
      transactions: [
        transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
        transactionFactory({
          type: 'BUY',
          quantity: 1,
          totalAmount: 50,
          isGradingCost: true,
          date: new Date('2024-01-02'),
        }),
      ],
    })
    const item = aggregateInventoryItem(card)
    expect(item.averageCost).toBe(75)
    expect(item.totalInvested).toBe(150)
  })

  it('includes COST_ADJUSTMENT in average cost', () => {
    const card = inventoryCardFactory({
      inventory: { quantity: 2, currentValue: null, order: null },
      transactions: [
        transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
        transactionFactory({ type: 'COST_ADJUSTMENT', quantity: 0, totalAmount: 20, date: new Date('2024-01-02') }),
      ],
    })
    const item = aggregateInventoryItem(card)
    expect(item.averageCost).toBe(60)
    expect(item.totalInvested).toBe(120)
  })

  it('computes realized profit and sold-out status after a full sell', () => {
    const card = inventoryCardFactory({
      inventory: { quantity: 0, currentValue: null, order: null },
      transactions: [
        transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
        transactionFactory({ type: 'SELL', quantity: 2, totalAmount: 150, date: new Date('2024-01-10') }),
      ],
    })
    const item = aggregateInventoryItem(card)
    expect(item.status).toBe('sold_out')
    expect(item.soldQty).toBe(2)
    expect(item.totalSold).toBe(150)
    expect(item.realizedProfit).toBe(50)
    expect(item.profit).toBe(50)
    expect(item.soldAt).toBe(new Date('2024-01-10').toISOString())
  })

  it('preserves grading status regardless of quantity', () => {
    const card = inventoryCardFactory({
      status: 'grading',
      inventory: { quantity: 0, currentValue: null, order: null },
      transactions: [],
    })
    const item = aggregateInventoryItem(card)
    expect(item.status).toBe('grading')
  })

  it('uses inventory currentValue for market value and unrealized profit', () => {
    const card = inventoryCardFactory({
      inventory: { quantity: 2, currentValue: 75, order: null },
      transactions: [
        transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
      ],
    })
    const item = aggregateInventoryItem(card)
    expect(item.marketValuePerUnit).toBe(75)
    expect(item.currentValue).toBe(150)
    expect(item.unrealizedProfit).toBe(50)
  })

  it('exposes lastTransaction and createdAt as ISO strings', () => {
    const txDate = new Date('2024-03-15T12:00:00Z')
    const card = inventoryCardFactory({
      createdAt: new Date('2024-01-01T00:00:00Z'),
      transactions: [transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 50, date: txDate })],
    })
    const item = aggregateInventoryItem(card)
    expect(item.lastTransaction).toBe(txDate.toISOString())
    expect(item.createdAt).toBe(new Date('2024-01-01T00:00:00Z').toISOString())
  })
})

describe('aggregateInventorySummary', () => {
  it('sums visible inventory metrics', () => {
    const items = [
      aggregateInventoryItem(
        inventoryCardFactory({
          id: 'c1',
          inventory: { quantity: 2, currentValue: 60, order: null },
          transactions: [
            transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-01') }),
          ],
        })
      ),
      aggregateInventoryItem(
        inventoryCardFactory({
          id: 'c2',
          inventory: { quantity: 0, currentValue: null, order: null },
          transactions: [
            transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 40, date: new Date('2024-01-01') }),
            transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 60, date: new Date('2024-01-02') }),
          ],
        })
      ),
    ]
    const summary = aggregateInventorySummary(items)
    expect(summary.totalCards).toBe(2)
    expect(summary.inStock).toBe(2)
    expect(summary.soldOut).toBe(1)
    expect(summary.soldCards).toBe(1)
    expect(summary.totalValue).toBe(120)
    expect(summary.totalProfit).toBe(20)
    expect(summary.totalInvested).toBe(100)
    expect(summary.totalROI).toBe(20)
  })
})
