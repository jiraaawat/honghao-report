import { describe, it, expect } from 'vitest'
import {
  calculateAverageCost,
  calculateMonthlyReport,
  calculateTotalProfit,
  calculateROI,
} from '../calculations'
import { costTransactionFactory, transactionFactory } from './factories'

describe('calculateAverageCost', () => {
  it('returns 0 when there are no transactions', () => {
    expect(calculateAverageCost([], 0)).toBe(0)
  })

  it('calculates simple buy average', () => {
    const txs = [costTransactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100 })]
    expect(calculateAverageCost(txs, 2)).toBe(50)
  })

  it('weights multiple buys by quantity', () => {
    const txs = [
      costTransactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100 }),
      costTransactionFactory({ type: 'BUY', quantity: 3, totalAmount: 100 }),
    ]
    expect(calculateAverageCost(txs, 4)).toBe(50)
  })

  it('treats grading-cost BUY as cost only (no quantity)', () => {
    const txs = [
      costTransactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100 }),
      costTransactionFactory({ type: 'BUY', quantity: 1, totalAmount: 50, isGradingCost: true }),
    ]
    expect(calculateAverageCost(txs, 2)).toBe(75)
  })

  it('treats non-cost GRADING as buy-like', () => {
    const txs = [
      costTransactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100 }),
      costTransactionFactory({ type: 'GRADING', quantity: 1, totalAmount: 80, isGradingCost: false }),
    ]
    expect(calculateAverageCost(txs, 2)).toBe(90)
  })

  it('treats cost GRADING as cost only', () => {
    const txs = [
      costTransactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100 }),
      costTransactionFactory({ type: 'GRADING', quantity: 1, totalAmount: 50, isGradingCost: true }),
    ]
    expect(calculateAverageCost(txs, 2)).toBe(75)
  })

  it('includes COST_ADJUSTMENT in numerator only', () => {
    const txs = [
      costTransactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100 }),
      costTransactionFactory({ type: 'COST_ADJUSTMENT', quantity: 0, totalAmount: 20 }),
    ]
    expect(calculateAverageCost(txs, 2)).toBe(60)
  })

  it('falls back to currentQuantity when there is no buy quantity', () => {
    const txs = [costTransactionFactory({ type: 'GRADING', quantity: 1, totalAmount: 100, isGradingCost: true })]
    expect(calculateAverageCost(txs, 5)).toBe(20)
  })

  it('returns 0 when there is no buy quantity and no current quantity', () => {
    const txs = [costTransactionFactory({ type: 'GRADING', quantity: 1, totalAmount: 100, isGradingCost: true })]
    expect(calculateAverageCost(txs)).toBe(0)
  })
})

describe('calculateMonthlyReport', () => {
  it('groups transactions by year and month', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-15') }),
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-02-15') }),
    ]
    const report = calculateMonthlyReport(txs)
    expect(report).toHaveLength(2)
    expect(report[0].month).toBe(1)
    expect(report[1].month).toBe(2)
  })

  it('counts totalBuy from cost-like transactions and buyQty from buy-like transactions', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-10') }),
      transactionFactory({
        type: 'BUY',
        quantity: 1,
        totalAmount: 50,
        isGradingCost: true,
        date: new Date('2024-01-11'),
      }),
      transactionFactory({
        type: 'GRADING',
        quantity: 1,
        totalAmount: 30,
        isGradingCost: true,
        date: new Date('2024-01-12'),
      }),
    ]
    const report = calculateMonthlyReport(txs)
    expect(report[0].totalBuy).toBe(180)
    expect(report[0].buyQty).toBe(2)
  })

  it('uses avgCostMap to compute cost basis and profit for sells', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 2, totalAmount: 100, date: new Date('2024-01-05') }),
      transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 80, date: new Date('2024-01-10') }),
    ]
    const report = calculateMonthlyReport(txs, { 'card-1': 50 })
    expect(report[0].costBasisSold).toBe(50)
    expect(report[0].totalProfit).toBe(30)
    expect(report[0].roi).toBe(60)
  })

  it('computes profit from totalSell - totalBuy when avgCostMap is absent', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-05') }),
      transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 150, date: new Date('2024-01-10') }),
    ]
    const report = calculateMonthlyReport(txs)
    expect(report[0].totalProfit).toBe(50)
    expect(report[0].roi).toBe(50)
  })

  it('sorts months in ascending order', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-02-01') }),
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-01') }),
    ]
    const report = calculateMonthlyReport(txs)
    expect(report[0].month).toBe(1)
    expect(report[1].month).toBe(2)
  })
})

describe('calculateTotalProfit', () => {
  it('returns sell total minus cost-like spend', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-01') }),
      transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 150, date: new Date('2024-01-02') }),
    ]
    expect(calculateTotalProfit(txs)).toBe(50)
  })

  it('returns negative buy total when nothing is sold', () => {
    const txs = [transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-01') })]
    expect(calculateTotalProfit(txs)).toBe(-100)
  })
})

describe('calculateROI', () => {
  it('returns profit divided by cost-like spend times 100', () => {
    const txs = [
      transactionFactory({ type: 'BUY', quantity: 1, totalAmount: 100, date: new Date('2024-01-01') }),
      transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 150, date: new Date('2024-01-02') }),
    ]
    expect(calculateROI(txs)).toBe(50)
  })

  it('returns 0 when there is no cost-like spend', () => {
    const txs = [transactionFactory({ type: 'SELL', quantity: 1, totalAmount: 150, date: new Date('2024-01-02') })]
    expect(calculateROI(txs)).toBe(0)
  })
})
