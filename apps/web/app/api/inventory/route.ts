import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { aggregateInventoryItem, aggregateInventorySummary } from '@/lib/inventory-aggregate'

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
    orderBy: [
      { inventory: { order: { sort: 'asc', nulls: 'last' } } },
      { updatedAt: 'desc' },
    ],
  })

  const items = cards.map((card) => aggregateInventoryItem(card))

  const visibleItems = items.filter(
    (i) => i.quantity > 0 || i.status === 'sold_out' || i.status === 'grading'
  )

  let filtered = visibleItems
  if (status === 'in_stock') filtered = visibleItems.filter((i) => i.status === 'in_stock')
  if (status === 'sold_out') filtered = visibleItems.filter((i) => i.status === 'sold_out')

  const summary = aggregateInventorySummary(items)

  return NextResponse.json({ items: filtered, summary })
}
