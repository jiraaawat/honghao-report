import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const resetSchema = z.object({
  password: z.string().min(1),
  confirmation: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = resetSchema.parse(body)

    if (data.confirmation !== 'RESET') {
      return NextResponse.json({ error: 'Confirmation text does not match' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Account password not found' }, { status: 400 })
    }

    const isValid = await bcrypt.compare(data.password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { userId } })
      await tx.cardInventory.deleteMany({ where: { userId } })
      await tx.gradingRecord.deleteMany({ where: { userId } })
      await tx.card.deleteMany({ where: { userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Reset portfolio error:', error)
    return NextResponse.json({ error: 'Failed to reset portfolio' }, { status: 500 })
  }
}
