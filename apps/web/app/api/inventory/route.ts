import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const cardType = searchParams.get('cardType')
  const game = searchParams.get('game')
  const status = searchParams.get('status')

  const where: Prisma.CardWhereInput = { userId }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { setCode: { contains: search, mode: 'insensitive' } },
      { cardNumber: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (cardType) where.cardType = cardType
  if (game) where.game = game

  const cards = await prisma.card.findMany({
    where,
    include: {
      inventory: true,
      gradings: {
        where: { status: 'grading' },
        orderBy: { sentDate: 'desc' },
        take: 1,
      },
      transactions: {
        orderBy: { date: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const items = cards.map((card) => {
    const buyTxs = card.transactions.filter((t) => t.type === 'BUY')
    const sellTxs = card.transactions.filter((t) => t.type === 'SELL')
    const normalBuyTxs = buyTxs.filter((t) => !t.isGradingCost)
    const gradingBuyTxs = buyTxs.filter((t) => t.isGradingCost)
    const totalBuyQty = normalBuyTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalBuyAmount = normalBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalGradingCost = gradingBuyTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const totalSellQty = sellTxs.reduce((sum, t) => sum + t.quantity, 0)
    const totalSellAmount = sellTxs.reduce((sum, t) => sum + Number(t.totalAmount), 0)
    const avgCost = totalBuyQty > 0 ? (totalBuyAmount + totalGradingCost) / totalBuyQty : 0
    const quantity = card.inventory?.quantity ?? 0

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
      game: card.game || 'Pokemon',
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
      lastTransaction: card.transactions.length > 0
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
  })

  let filtered = items
  if (status === 'in_stock') filtered = items.filter((i) => i.status === 'in_stock')
  if (status === 'sold_out') filtered = items.filter((i) => i.status === 'sold_out')

  const inStockQty = filtered
    .filter((i) => i.status === 'in_stock')
    .reduce((sum, i) => sum + i.quantity, 0)
  const gradingQty = filtered
    .filter((i) => i.status === 'grading')
    .reduce((sum, i) => sum + i.quantity, 0)
  const soldOutCount = filtered.reduce((sum, i) => sum + i.soldQty, 0)

  const totalValue = filtered.reduce((sum, i) => sum + i.currentValue, 0)
  const totalProfit = filtered.reduce((sum, i) => sum + i.profit, 0)
  const totalInvested = filtered.reduce((sum, i) => sum + i.totalInvested, 0)

  const summary = {
    totalCards: inStockQty + gradingQty, // total unsold card quantity
    inStock: inStockQty,
    grading: gradingQty,
    soldOut: soldOutCount,
    soldCards: soldOutCount,
    totalValue,
    totalProfit,
    totalROI: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0,
    totalInvested,
  }

  return NextResponse.json({ items: filtered, summary })
}
