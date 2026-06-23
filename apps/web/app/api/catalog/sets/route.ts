import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prismaCatalog } from '@/lib/prisma-catalog'

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!prismaCatalog) {
    return NextResponse.json({ error: 'TCGDB_URL not configured' }, { status: 500 })
  }

  try {
    const sets = await prismaCatalog.$queryRaw<
      { set_id: string; set_name: string | null }[]
    >`
      SELECT set_id, set_name
      FROM public.sets
      ORDER BY set_id ASC
    `

    return NextResponse.json(
      sets.map((s) => ({ setId: s.set_id, setName: s.set_name }))
    )
  } catch (error) {
    console.error('Catalog sets error:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog sets' }, { status: 500 })
  }
}
