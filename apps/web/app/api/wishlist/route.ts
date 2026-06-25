import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const wishlistSchema = z.object({
  catalogCardId: z.string().min(1),
  name: z.string().min(1),
  cardNo: z.string().nullish(),
  setCode: z.string().nullish(),
  setName: z.string().nullish(),
  imageUrl: z.string().nullish(),
  language: z.string().nullish(),
  cardType: z.string().nullish(),
  game: z.string().nullish(),
})

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const items = await prisma.wishlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(
    items.map((item) => ({
      id: item.id,
      catalogCardId: item.catalogCardId,
      name: item.name,
      setName: item.setName,
      imageUrl: item.imageUrl,
      language: item.language,
      cardType: item.cardType,
      game: item.game,
      createdAt: item.createdAt.toISOString(),
    }))
  )
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = wishlistSchema.parse(body)

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_catalogCardId_language: {
          userId,
          catalogCardId: data.catalogCardId,
          language: data.language || 'EN',
        },
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'Already in wishlist' }, { status: 409 })
    }

    const item = await prisma.wishlistItem.create({
      data: {
        userId,
        catalogCardId: data.catalogCardId,
        name: data.name,
        cardNo: data.cardNo || null,
        setCode: data.setCode || null,
        setName: data.setName || null,
        imageUrl: data.imageUrl || null,
        language: data.language || 'EN',
        cardType: data.cardType || null,
        game: data.game || 'OnePiece',
      },
    })

    return NextResponse.json(
      {
        id: item.id,
        catalogCardId: item.catalogCardId,
        name: item.name,
        cardNo: item.cardNo,
        setCode: item.setCode,
        setName: item.setName,
        imageUrl: item.imageUrl,
        language: item.language,
        cardType: item.cardType,
        game: item.game,
        createdAt: item.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Wishlist POST error:', error)
    return NextResponse.json({ error: 'Failed to add wishlist item' }, { status: 500 })
  }
}
