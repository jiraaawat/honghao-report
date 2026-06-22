import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

async function syncCardStatus(tx: Prisma.TransactionClient, cardId: string) {
  const inventory = await tx.cardInventory.findUnique({
    where: { cardId },
  })
  const card = await tx.card.findUnique({
    where: { id: cardId },
    include: { transactions: { where: { type: 'SELL' }, select: { id: true } } },
  })
  if (!card) return

  let status = card.status
  if (status === 'grading') return

  const qty = inventory?.quantity ?? 0
  const hasSell = card.transactions.length > 0

  if (qty === 0 && hasSell) {
    status = 'sold_out'
  } else {
    status = 'in_stock'
  }

  if (status !== card.status) {
    await tx.card.update({ where: { id: cardId }, data: { status } })
  }
}

const updateSchema = z.object({
  quantity: z.number().int().positive(),
  pricePerUnit: z.number().nonnegative(),
  shippingCost: z.number().nonnegative().optional(),
  date: z.string().datetime(),
  note: z.string().optional(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const data = updateSchema.parse(body)

    const shippingCost = data.shippingCost ?? 0
    const totalAmount = data.quantity * data.pricePerUnit + shippingCost

    await prisma.$transaction(async (tx) => {
      let inventory = await tx.cardInventory.findUnique({
        where: { cardId: transaction.cardId },
      })

      if (!inventory) {
        inventory = await tx.cardInventory.create({
          data: {
            cardId: transaction.cardId,
            userId,
            quantity: 0,
            averageCost: 0,
            totalInvested: 0,
          },
        })
      }

      // Revert old transaction effect
      if (transaction.type === 'BUY') {
        const newQuantity = inventory.quantity - transaction.quantity
        const newTotalInvested = Number(inventory.totalInvested) - Number(transaction.totalAmount)
        const newAverageCost = newQuantity > 0 ? newTotalInvested / newQuantity : 0

        await tx.cardInventory.update({
          where: { cardId: transaction.cardId },
          data: {
            quantity: newQuantity < 0 ? 0 : newQuantity,
            averageCost: newAverageCost < 0 ? 0 : newAverageCost,
            totalInvested: newTotalInvested < 0 ? 0 : newTotalInvested,
          },
        })
      } else {
        const newQuantity = inventory.quantity + transaction.quantity
        const newTotalInvested = Number(inventory.totalInvested) + Number(inventory.averageCost) * transaction.quantity

        await tx.cardInventory.update({
          where: { cardId: transaction.cardId },
          data: {
            quantity: newQuantity,
            totalInvested: newTotalInvested,
          },
        })
      }

      // Apply new transaction effect
      inventory = await tx.cardInventory.findUnique({
        where: { cardId: transaction.cardId },
      })

      if (transaction.type === 'SELL' && inventory!.quantity < data.quantity) {
        throw new Error('Insufficient stock')
      }

      if (transaction.type === 'BUY') {
        const newTotalInvested = Number(inventory!.totalInvested) + totalAmount
        const newQuantity = inventory!.quantity + data.quantity
        const newAverageCost = newQuantity > 0 ? newTotalInvested / newQuantity : 0

        await tx.cardInventory.update({
          where: { cardId: transaction.cardId },
          data: {
            quantity: newQuantity,
            averageCost: newAverageCost,
            totalInvested: newTotalInvested,
          },
        })
      } else {
        const newQuantity = inventory!.quantity - data.quantity
        const newTotalInvested = Number(inventory!.totalInvested) - Number(inventory!.averageCost) * data.quantity

        await tx.cardInventory.update({
          where: { cardId: transaction.cardId },
          data: {
            quantity: newQuantity < 0 ? 0 : newQuantity,
            totalInvested: newTotalInvested < 0 ? 0 : newTotalInvested,
          },
        })
      }

      await tx.transaction.update({
        where: { id },
        data: {
          quantity: data.quantity,
          pricePerUnit: data.pricePerUnit,
          totalAmount,
          shippingCost: shippingCost > 0 ? shippingCost : null,
          date: new Date(data.date),
          note: data.note,
        },
      })

      await syncCardStatus(tx, transaction.cardId)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'Insufficient stock') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
  })

  if (!transaction) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    let inventory = await tx.cardInventory.findUnique({
      where: { cardId: transaction.cardId },
    })

    if (!inventory) {
      inventory = await tx.cardInventory.create({
        data: {
          cardId: transaction.cardId,
          userId,
          quantity: 0,
          averageCost: 0,
          totalInvested: 0,
        },
      })
    }

    if (transaction.type === 'BUY') {
      const newQuantity = inventory.quantity - transaction.quantity
      const newTotalInvested = Number(inventory.totalInvested) - Number(transaction.totalAmount)
      const newAverageCost = newQuantity > 0 ? newTotalInvested / newQuantity : 0

      await tx.cardInventory.update({
        where: { cardId: transaction.cardId },
        data: {
          quantity: newQuantity < 0 ? 0 : newQuantity,
          averageCost: newAverageCost < 0 ? 0 : newAverageCost,
          totalInvested: newTotalInvested < 0 ? 0 : newTotalInvested,
        },
      })
    } else {
      const newQuantity = inventory.quantity + transaction.quantity
      const newTotalInvested = Number(inventory.totalInvested) + Number(inventory.averageCost) * transaction.quantity

      await tx.cardInventory.update({
        where: { cardId: transaction.cardId },
        data: {
          quantity: newQuantity,
          totalInvested: newTotalInvested,
        },
      })
    }

    await tx.transaction.delete({ where: { id } })

    await syncCardStatus(tx, transaction.cardId)
  })

  return NextResponse.json({ success: true })
}
