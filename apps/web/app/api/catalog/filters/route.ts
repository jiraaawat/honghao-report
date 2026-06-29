import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prismaCatalog } from '@/lib/prisma-catalog'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prismaCatalog) {
    return NextResponse.json({ error: 'TCGDB_URL not configured' }, { status: 500 })
  }

  try {
    const [colors, types, rarities, sources] = await Promise.all([
      prismaCatalog.$queryRaw<{ color: string | null }[]>`
        SELECT DISTINCT color FROM public.cards WHERE color IS NOT NULL ORDER BY color ASC
      `,
      prismaCatalog.$queryRaw<{ type: string | null }[]>`
        SELECT DISTINCT type FROM public.cards WHERE type IS NOT NULL ORDER BY type ASC
      `,
      prismaCatalog.$queryRaw<{ rarity: string | null }[]>`
        SELECT DISTINCT rarity FROM public.cards WHERE rarity IS NOT NULL ORDER BY rarity ASC
      `,
      prismaCatalog.$queryRaw<{ source: string | null }[]>`
        SELECT DISTINCT source FROM public.cards WHERE source IS NOT NULL ORDER BY source ASC
      `,
    ])

    return NextResponse.json({
      colors: colors.map((c) => c.color).filter(Boolean) as string[],
      types: types.map((t) => t.type).filter(Boolean) as string[],
      rarities: rarities.map((r) => r.rarity).filter(Boolean) as string[],
      sources: sources.map((s) => s.source).filter(Boolean) as string[],
    })
  } catch (error) {
    console.error('Catalog filters error:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog filters' }, { status: 500 })
  }
}
