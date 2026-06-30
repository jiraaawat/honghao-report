import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prismaCatalog } from '@/lib/prisma-catalog'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const setId = searchParams.get('setId')
  const type = searchParams.get('type')
  const rarity = searchParams.get('rarity')
  const color = searchParams.get('color')
  const minCost = searchParams.get('minCost')
  const maxCost = searchParams.get('maxCost')
  const minPower = searchParams.get('minPower')
  const maxPower = searchParams.get('maxPower')
  const minLife = searchParams.get('minLife')
  const maxLife = searchParams.get('maxLife')
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '24')))
  const offset = (page - 1) * limit

  const conditions: Prisma.Sql[] = [Prisma.sql`1 = 1`]
  if (search) {
    const term = `%${search}%`
    conditions.push(
      Prisma.sql`(
        c.name ILIKE ${term}
        OR c.card_no ILIKE ${term}
        OR c.set_name ILIKE ${term}
      )`
    )
  }
  if (setId) {
    conditions.push(Prisma.sql`c.set_id = ${setId}`)
  }
  if (type) {
    conditions.push(Prisma.sql`c.type = ${type}`)
  }
  if (rarity) {
    conditions.push(Prisma.sql`c.rarity = ${rarity}`)
  }
  if (color) {
    conditions.push(Prisma.sql`c.color = ${color}`)
  }
  if (minCost) {
    conditions.push(Prisma.sql`c.cost >= ${Number(minCost)}`)
  }
  if (maxCost) {
    conditions.push(Prisma.sql`c.cost <= ${Number(maxCost)}`)
  }
  if (minPower) {
    conditions.push(Prisma.sql`c.card_power >= ${Number(minPower)}`)
  }
  if (maxPower) {
    conditions.push(Prisma.sql`c.card_power <= ${Number(maxPower)}`)
  }
  if (minLife) {
    conditions.push(Prisma.sql`c.life >= ${Number(minLife)}`)
  }
  if (maxLife) {
    conditions.push(Prisma.sql`c.life <= ${Number(maxLife)}`)
  }

  const whereClause = Prisma.join(conditions, ' AND ')

  if (!prismaCatalog) {
    return NextResponse.json({ error: 'TCGDB_URL not configured' }, { status: 500 })
  }

  try {
    const cards = await prismaCatalog.$queryRaw<
      {
        id: string
        card_no: string
        name: string
        color: string | null
        cost: number | null
        type: string | null
        rarity: string | null
        image_path: string | null
        effect_text: string | null
        set_id: string | null
        set_name: string | null
        market_price: number | null
        inventory_price: number | null
        source: string | null
        card_power: number | null
        life: number | null
        sub_types: string | null
        date_scraped: Date | null
        card_image_id: string | null
      }[]
    >`
      SELECT
        c.id,
        c.card_no,
        c.name,
        c.color,
        c.cost,
        c.type,
        c.rarity,
        c.image_path,
        c.effect_text,
        c.set_id,
        c.set_name,
        c.market_price,
        c.inventory_price,
        c.source,
        c.card_power,
        c.life,
        c.sub_types,
        c.date_scraped,
        c.card_image_id
      FROM public.cards c
      WHERE ${whereClause}
      ORDER BY c.card_no ASC
      LIMIT ${limit} OFFSET ${offset}
    `

    const countResult = await prismaCatalog.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM public.cards c
      WHERE ${whereClause}
    `

    const total = Number(countResult[0]?.count || 0)

    return NextResponse.json({
      items: cards.map((c) => ({
        id: c.id,
        cardNo: c.card_no,
        name: c.name,
        color: c.color,
        cost: c.cost,
        type: c.type,
        rarity: c.rarity,
        imagePath: c.image_path,
        effectText: c.effect_text,
        setId: c.set_id,
        setName: c.set_name,
        marketPrice: c.market_price ? Number(c.market_price) : null,
        inventoryPrice: c.inventory_price ? Number(c.inventory_price) : null,
        source: c.source,
        cardPower: c.card_power,
        life: c.life,
        subTypes: c.sub_types,
        dateScraped: c.date_scraped ? c.date_scraped.toISOString().split('T')[0] : null,
        cardImageId: c.card_image_id,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Catalog cards error:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog cards' }, { status: 500 })
  }
}
