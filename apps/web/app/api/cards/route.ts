import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'

const cardSchema = z.object({
  name: z.string().min(1),
  setCode: z.string().optional(),
  cardNumber: z.string().optional(),
  rarity: z.string().optional(),
  cardType: z.string().optional(),
  game: z.string().optional(),
  language: z.string().optional(),
  condition: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
})

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

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

async function saveUploadedImage(file: File): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const ext = file.name.split('.').pop() || 'png'
  const filename = `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}.${ext}`
  const filepath = path.join(uploadsDir, filename)
  const buffer = Buffer.from(await file.arrayBuffer())
  fs.writeFileSync(filepath, buffer)

  return `/uploads/${filename}`
}

async function createCardFromData(
  data: z.infer<typeof cardSchema>,
  imageUrl: string | null,
  userId: string
) {
  const card = await prisma.card.create({
    data: {
      name: data.name,
      setCode: data.setCode || null,
      cardNumber: data.cardNumber || null,
      rarity: data.rarity || null,
      cardType: data.cardType || 'Single',
      game: data.game || 'OnePiece',
      language: data.language || 'EN',
      condition: data.condition || null,
      imageUrl: imageUrl || data.imageUrl || null,
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

  return card
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('image') as File | null

      let imageUrl: string | null = null
      if (file && file.size > 0) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          return NextResponse.json(
            { error: 'Invalid image type. Allowed: jpeg, png, webp, gif' },
            { status: 400 }
          )
        }
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: 'Image too large. Max 5MB.' },
            { status: 400 }
          )
        }
        imageUrl = await saveUploadedImage(file)
      }

      const data = cardSchema.parse({
        name: formData.get('name'),
        setCode: formData.get('setCode') ?? undefined,
        cardNumber: formData.get('cardNumber') ?? undefined,
        rarity: formData.get('rarity') ?? undefined,
        cardType: formData.get('cardType') ?? undefined,
        game: formData.get('game') ?? undefined,
        language: formData.get('language') ?? undefined,
        condition: formData.get('condition') ?? undefined,
      })

      const card = await createCardFromData(data, imageUrl, userId)
      return NextResponse.json(card, { status: 201 })
    }

    const body = await req.json()
    const data = cardSchema.parse(body)
    const card = await createCardFromData(data, null, userId)
    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
