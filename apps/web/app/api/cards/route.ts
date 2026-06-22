import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

const cardSchema = z.object({
  name: z.string().min(1),
  setCode: z.string().optional(),
  cardNumber: z.string().optional(),
  rarity: z.string().optional(),
  cardType: z.string().optional(),
  game: z.string().optional(),
  condition: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

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
  const status = searchParams.get('status') // in_stock | sold_out

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
    include: { inventory: true, transactions: true },
    orderBy: { updatedAt: 'desc' },
  })

  let result = cards

  if (status === 'in_stock') {
    result = cards.filter((c) => (c.inventory?.quantity ?? 0) > 0)
  } else if (status === 'sold_out') {
    result = cards.filter((c) => {
      const qty = c.inventory?.quantity ?? 0
      const hasSold = c.transactions.some((t) => t.type === 'SELL')
      return qty === 0 && hasSold
    })
  }

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = cardSchema.parse(body)

    const card = await prisma.card.create({
      data: {
        name: data.name,
        setCode: data.setCode || null,
        cardNumber: data.cardNumber || null,
        rarity: data.rarity || null,
        cardType: data.cardType || 'Single',
        game: data.game || 'Pokemon',
        condition: data.condition || null,
        imageUrl: data.imageUrl || null,
        userId,
      },
    })

    await prisma.cardInventory.create({
      data: {
        cardId: card.id,
        userId,
        quantity: 0,
        averageCost: 0,
        totalInvested: 0,
      },
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
