import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  currentValue: z.number().nonnegative(),
})

const removeSchema = z.object({
  quantity: z.number().int().positive(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
  })
  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = removeSchema.parse(body)

    const inventory = await prisma.cardInventory.findUnique({
      where: { cardId },
    })
    if (!inventory || inventory.quantity < data.quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    const newQuantity = inventory.quantity - data.quantity
    const newTotalInvested = Math.max(
      0,
      Number(inventory.totalInvested) - Number(inventory.averageCost) * data.quantity
    )

    await prisma.cardInventory.update({
      where: { cardId },
      data: {
        quantity: newQuantity,
        totalInvested: newTotalInvested,
      },
    })

    return NextResponse.json({ success: true, quantity: newQuantity })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId },
  })

  if (!card) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    await prisma.cardInventory.update({
      where: { cardId },
      data: { currentValue: data.currentValue },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
