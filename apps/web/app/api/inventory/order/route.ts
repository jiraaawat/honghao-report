import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { orders?: Record<string, number | null> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orders = body.orders
  if (!orders || typeof orders !== 'object') {
    return NextResponse.json({ error: 'Missing orders' }, { status: 400 })
  }

  const entries = Object.entries(orders).filter(
    (entry): entry is [string, number] => typeof entry[1] === 'number'
  )

  if (entries.length === 0) {
    return NextResponse.json({ success: true })
  }

  const cardIds = entries.map(([cardId]) => cardId)
  const cards = await prisma.card.findMany({
    where: { id: { in: cardIds }, userId },
    include: { inventory: true },
  })

  if (cards.length !== cardIds.length) {
    return NextResponse.json({ error: 'Some cards not found' }, { status: 403 })
  }

  await prisma.$transaction(
    entries.map(([cardId, order]) =>
      prisma.cardInventory.update({
        where: { cardId },
        data: { order },
      })
    )
  )

  return NextResponse.json({ success: true })
}
