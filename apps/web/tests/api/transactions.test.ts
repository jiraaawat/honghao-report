import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/transactions/route'
import { PUT, DELETE } from '@/app/api/transactions/[id]/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

vi.mock('next/server', () => ({
  NextRequest: Request,
  NextResponse: {
    json: vi.fn((body, init) => new Response(JSON.stringify(body), init)),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    transaction: { findFirst: vi.fn() },
  },
}))

const USER_ID = 'user-1'
const CARD_ID = 'card-1'

function mockTx(overrides: Record<string, unknown> = {}) {
  return {
    card: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      aggregate: vi.fn().mockResolvedValue({ _sum: { quantity: 0 } }),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
    },
    cardInventory: { upsert: vi.fn(), findUnique: vi.fn() },
    ...overrides,
  }
}

function jsonRequest(body: unknown) {
  return { json: vi.fn().mockResolvedValue(body) } as unknown as Request
}

async function readError(res: Response) {
  return res.json()
}

describe('POST /api/transactions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: USER_ID } })
  })

  it('returns 401 when not authenticated', async () => {
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    const res = await POST(jsonRequest({}))
    expect(res.status).toBe(401)
  })

  it('returns 404 when the card does not belong to the user', async () => {
    const tx = mockTx()
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await POST(
      jsonRequest({
        cardId: CARD_ID,
        type: 'BUY',
        quantity: 1,
        pricePerUnit: 10,
        date: new Date().toISOString(),
      })
    )
    expect(res.status).toBe(404)
    const data = await readError(res)
    expect(data.error).toBe('Card not found')
  })

  it('rejects SELL when the card is being graded', async () => {
    const tx = mockTx()
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: CARD_ID,
      status: 'grading',
      inventory: { quantity: 5 },
    })
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await POST(
      jsonRequest({
        cardId: CARD_ID,
        type: 'SELL',
        quantity: 1,
        pricePerUnit: 10,
        date: new Date().toISOString(),
      })
    )
    expect(res.status).toBe(400)
    const data = await readError(res)
    expect(data.error).toBe('Card is being graded')
    expect(tx.transaction.create).not.toHaveBeenCalled()
  })

  it('rejects SELL when stock is insufficient', async () => {
    const tx = mockTx()
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: CARD_ID,
      status: 'in_stock',
      inventory: { quantity: 2 },
    })
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await POST(
      jsonRequest({
        cardId: CARD_ID,
        type: 'SELL',
        quantity: 3,
        pricePerUnit: 10,
        date: new Date().toISOString(),
      })
    )
    expect(res.status).toBe(400)
    const data = await readError(res)
    expect(data.error).toBe('Insufficient stock')
    expect(tx.transaction.create).not.toHaveBeenCalled()
  })

  it('creates a BUY transaction and recalculates inventory', async () => {
    const tx = mockTx()
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: CARD_ID,
      status: 'in_stock',
      inventory: null,
    })
    ;(tx.transaction.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'tx-1' })
    ;(tx.cardInventory.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ cardId: CARD_ID, quantity: 2 })
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await POST(
      jsonRequest({
        cardId: CARD_ID,
        type: 'BUY',
        quantity: 2,
        pricePerUnit: 50,
        date: new Date().toISOString(),
      })
    )
    expect(res.status).toBe(201)
    expect(tx.transaction.create).toHaveBeenCalled()
    expect(tx.cardInventory.upsert).toHaveBeenCalled()
  })
})

describe('PUT /api/transactions/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: USER_ID } })
  })

  it('rejects editing a SELL that would exceed available stock', async () => {
    const tx = mockTx()
    ;(prisma.transaction.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tx-1',
      cardId: CARD_ID,
      type: 'SELL',
      quantity: 1,
    })
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: CARD_ID,
      status: 'in_stock',
      inventory: { quantity: 1 },
    })
    ;(tx.transaction.aggregate as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ _sum: { quantity: 1 } }) // other sells
      .mockResolvedValueOnce({ _sum: { quantity: 1 } }) // buy-like
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await PUT(jsonRequest({ quantity: 2, pricePerUnit: 10, date: new Date().toISOString() }), {
      params: Promise.resolve({ id: 'tx-1' }),
    })
    expect(res.status).toBe(400)
    const data = await readError(res)
    expect(data.error).toBe('Insufficient stock')
  })
})

describe('DELETE /api/transactions/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    ;(auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: USER_ID } })
  })

  it('deletes a transaction and recalculates inventory', async () => {
    const tx = mockTx()
    ;(prisma.transaction.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'tx-1',
      cardId: CARD_ID,
      type: 'SELL',
      quantity: 1,
    })
    ;(tx.card.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: CARD_ID,
      status: 'sold_out',
      inventory: { quantity: 0 },
    })
    ;(tx.cardInventory.upsert as ReturnType<typeof vi.fn>).mockResolvedValue({ cardId: CARD_ID, quantity: 1 })
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx))

    const res = await DELETE(new Request('http://localhost'), { params: Promise.resolve({ id: 'tx-1' }) })
    expect(res.status).toBe(200)
    expect(tx.transaction.delete).toHaveBeenCalledWith({ where: { id: 'tx-1' } })
    expect(tx.cardInventory.upsert).toHaveBeenCalled()
  })
})
