import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addSchema = z.object({
  name: z.string().min(1),
  cardNo: z.string().nullish(),
  setCode: z.string().nullish(),
  setName: z.string().nullish(),
  rarity: z.string().nullish(),
  imagePath: z.string().nullish(),
  type: z.string().nullish(),
  cardType: z.string().min(1),
  game: z.string().min(1),
  language: z.string().nullish(),
  condition: z.string().nullish(),
  quantity: z.coerce.number().int().min(1),
  pricePerUnit: z.coerce.number().min(0),
  date: z.string().nullish(),
  note: z.string().nullish(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = addSchema.parse(body)

    const totalAmount = data.quantity * data.pricePerUnit
    const txDate = data.date ? new Date(data.date) : new Date()

    const result = await prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: {
          name: data.name,
          setCode: data.setCode || null,
          cardNumber: data.cardNo || null,
          rarity: data.rarity || null,
          cardType: data.cardType,
          game: data.game,
          language: data.language || 'EN',
          condition: data.condition || null,
          imageUrl: data.imagePath || null,
          userId,
        },
      })

      await tx.cardInventory.create({
        data: {
          cardId: card.id,
          userId,
          quantity: data.quantity,
          averageCost: data.pricePerUnit,
          totalInvested: totalAmount,
          currentValue: data.pricePerUnit,
        },
      })

      const transaction = await tx.transaction.create({
        data: {
          cardId: card.id,
          userId,
          type: 'BUY',
          quantity: data.quantity,
          pricePerUnit: data.pricePerUnit,
          totalAmount,
          shippingCost: 0,
          date: txDate,
          note: data.note || undefined,
          isGradingCost: false,
        },
      })

      return { card, transaction }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Add from catalog error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 })
  }
}
