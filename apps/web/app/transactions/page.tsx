'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { TransactionDto, CardDto, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Trash2, Plus, Package, Search, Calendar, Pencil } from 'lucide-react'

interface CardWithInventory extends CardDto {
  inventory?: {
    quantity: number
    averageCost: number
  } | null
}

export default function TransactionsPage() {
  const { status } = useSession()
  const [transactions, setTransactions] = useState<TransactionDto[]>([])
  const [cards, setCards] = useState<CardWithInventory[]>([])
  const [loading, setLoading] = useState(true)

  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCardType, setFilterCardType] = useState('')
  const [filterGame, setFilterGame] = useState('')

  const [txForm, setTxForm] = useState({
    cardId: '',
    type: 'BUY' as 'BUY' | 'SELL',
    quantity: '',
    pricePerUnit: '',
    shippingCost: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  const [editDialog, setEditDialog] = useState<{ open: boolean; tx: TransactionDto | null }>({
    open: false,
    tx: null,
  })
  const [editForm, setEditForm] = useState({
    quantity: '',
    pricePerUnit: '',
    shippingCost: '',
    date: '',
    note: '',
  })

  const [cardForm, setCardForm] = useState({
    name: '',
    setCode: '',
    cardNumber: '',
    rarity: '',
    cardType: 'Single',
    game: 'Pokemon',
    imageUrl: '',
  })

  const [showCardForm, setShowCardForm] = useState(false)

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()),
    []
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), [])

  const buildTxParams = useCallback(() => {
    const params = new URLSearchParams()
    if (filterYear) params.append('year', filterYear)
    if (filterMonth) params.append('month', filterMonth)
    if (search) params.append('search', search)
    if (filterType) params.append('type', filterType)
    if (filterCardType) params.append('cardType', filterCardType)
    if (filterGame) params.append('game', filterGame)
    return params
  }, [filterYear, filterMonth, search, filterType, filterCardType, filterGame])

  const fetchCards = useCallback(async () => {
    const res = await fetch('/api/cards')
    return (await res.json()) as CardWithInventory[]
  }, [])

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/transactions?${buildTxParams()}`)
    const data = await res.json()
    setLoading(false)
    return data as TransactionDto[]
  }, [buildTxParams])

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    const load = async () => {
      const [cardsData, txData] = await Promise.all([fetchCards(), fetchTransactions()])
      if (!cancelled) {
        setCards(cardsData)
        setTransactions(txData)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [status, fetchCards, fetchTransactions])

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: txForm.cardId,
        type: txForm.type,
        quantity: Number(txForm.quantity),
        pricePerUnit: Number(txForm.pricePerUnit),
        shippingCost: txForm.shippingCost ? Number(txForm.shippingCost) : undefined,
        date: new Date(txForm.date).toISOString(),
        note: txForm.note,
      }),
    })

    if (res.ok) {
      setTxForm({
        cardId: '',
        type: 'BUY',
        quantity: '',
        pricePerUnit: '',
        shippingCost: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
      })
      const [txData, cardsData] = await Promise.all([fetchTransactions(), fetchCards()])
      setTransactions(txData)
      setCards(cardsData)
    }
  }

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cardForm),
    })

    if (res.ok) {
      setCardForm({
        name: '',
        setCode: '',
        cardNumber: '',
        rarity: '',
        cardType: 'Single',
        game: 'Pokemon',
        imageUrl: '',
      })
      setShowCardForm(false)
      const cardsData = await fetchCards()
      setCards(cardsData)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      const [txData, cardsData] = await Promise.all([fetchTransactions(), fetchCards()])
      setTransactions(txData)
      setCards(cardsData)
    }
  }

  const openEdit = (tx: TransactionDto) => {
    setEditDialog({ open: true, tx })
    setEditForm({
      quantity: tx.quantity.toString(),
      pricePerUnit: tx.pricePerUnit.toString(),
      shippingCost: tx.shippingCost?.toString() ?? '',
      date: new Date(tx.date).toISOString().split('T')[0],
      note: tx.note ?? '',
    })
  }

  const closeEdit = () => {
    setEditDialog({ open: false, tx: null })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const tx = editDialog.tx
    if (!tx) return

    const res = await fetch(`/api/transactions/${tx.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(editForm.quantity),
        pricePerUnit: Number(editForm.pricePerUnit),
        shippingCost: editForm.shippingCost ? Number(editForm.shippingCost) : undefined,
        date: new Date(editForm.date).toISOString(),
        note: editForm.note || undefined,
      }),
    })

    if (res.ok) {
      closeEdit()
      const [txData, cardsData] = await Promise.all([fetchTransactions(), fetchCards()])
      setTransactions(txData)
      setCards(cardsData)
    }
  }

  const clearFilters = () => {
    setFilterYear('')
    setFilterMonth('')
    setSearch('')
    setFilterType('')
    setFilterCardType('')
    setFilterGame('')
  }

  if (status === 'loading') {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-100">$ transactions</h1>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="search card..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">all types</option>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </Select>

            <Select value={filterCardType} onChange={(e) => setFilterCardType(e.target.value)}>
              <option value="">all card types</option>
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <Select value={filterGame} onChange={(e) => setFilterGame(e.target.value)}>
              <option value="">all games</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">all years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">all months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.padStart(2, '0')}</option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[search, filterType, filterCardType, filterGame, filterYear, filterMonth].some(Boolean) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="font-mono text-xs">
                clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm">new transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">card</label>
                <Select
                  value={txForm.cardId}
                  onChange={(e) => setTxForm({ ...txForm, cardId: e.target.value })}
                  required
                >
                  <option value="">select card</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} [{card.game}] ({card.inventory?.quantity ?? 0} in stock)
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">type</label>
                <Select
                  value={txForm.type}
                  onChange={(e) => setTxForm({ ...txForm, type: e.target.value as 'BUY' | 'SELL' })}
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={txForm.quantity}
                    onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">price/unit</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={txForm.pricePerUnit}
                    onChange={(e) => setTxForm({ ...txForm, pricePerUnit: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">shipping cost</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={txForm.shippingCost}
                  onChange={(e) => setTxForm({ ...txForm, shippingCost: e.target.value })}
                  placeholder="0.00 (optional, SELL only)"
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">date</label>
                <Input
                  type="date"
                  value={txForm.date}
                  onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">note</label>
                <Input
                  value={txForm.note}
                  onChange={(e) => setTxForm({ ...txForm, note: e.target.value })}
                  placeholder="optional"
                />
              </div>

              <Button type="submit" className="w-full gap-2">
                <Plus className="h-4 w-4" />
                add transaction
              </Button>
            </form>

            <div className="mt-6 border-t border-zinc-800 pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCardForm(!showCardForm)}
                className="gap-2 font-mono text-xs"
              >
                <Package className="h-3.5 w-3.5" />
                {showCardForm ? 'cancel' : 'new card'}
              </Button>

              {showCardForm && (
                <form onSubmit={handleCreateCard} className="mt-4 space-y-3">
                  <Input
                    placeholder="card name"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={cardForm.cardType}
                      onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })}
                    >
                      {CARD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                    <Select
                      value={cardForm.game}
                      onChange={(e) => setCardForm({ ...cardForm, game: e.target.value })}
                    >
                      {GAMES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>
                  </div>
                  <Input
                    placeholder="set code"
                    value={cardForm.setCode}
                    onChange={(e) => setCardForm({ ...cardForm, setCode: e.target.value })}
                  />
                  <Input
                    placeholder="card number"
                    value={cardForm.cardNumber}
                    onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
                  />
                  <Input
                    placeholder="rarity"
                    value={cardForm.rarity}
                    onChange={(e) => setCardForm({ ...cardForm, rarity: e.target.value })}
                  />
                  <Button type="submit" size="sm" className="w-full">
                    create card
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-sm">
              transactions ({transactions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center font-mono text-sm text-zinc-500">loading...</div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center font-mono text-sm text-zinc-500">
                no transactions for {filterMonth.padStart(2, '0')}/{filterYear}
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left font-mono text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="pb-2 pr-4">date</th>
                        <th className="pb-2 pr-4">card</th>
                        <th className="pb-2 pr-4">type</th>
                        <th className="pb-2 pr-4">game</th>
                        <th className="pb-2 pr-4">qty</th>
                        <th className="pb-2 pr-4">price</th>
                        <th className="pb-2 pr-4">shipping</th>
                        <th className="pb-2 pr-4">total</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0">
                          <td className="py-3 pr-4 text-zinc-400">{formatDate(tx.date)}</td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-col">
                              <span className="text-zinc-200">{tx.card?.name}</span>
                              <span className="text-xs text-zinc-500">{tx.card?.cardType}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={tx.type === 'BUY' ? 'buy' : 'sell'}>{tx.type}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-zinc-400">{tx.card?.game}</td>
                          <td className="py-3 pr-4 text-zinc-300">{tx.quantity}</td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {formatCurrency(Number(tx.pricePerUnit))}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {tx.shippingCost ? formatCurrency(Number(tx.shippingCost)) : '-'}
                          </td>
                          <td className="py-3 pr-4 text-zinc-300">
                            {formatCurrency(Number(tx.totalAmount))}
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(tx)}
                              className="h-8 w-8 text-zinc-500 hover:text-emerald-400"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(tx.id)}
                              className="h-8 w-8 text-zinc-500 hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-3 md:hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-sm text-zinc-200">{tx.card?.name}</div>
                          <div className="font-mono text-xs text-zinc-500">{tx.card?.cardType} · {tx.card?.game}</div>
                        </div>
                        <Badge variant={tx.type === 'BUY' ? 'buy' : 'sell'}>{tx.type}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between font-mono text-xs">
                        <span className="text-zinc-500">{formatDate(tx.date)}</span>
                        <span className="text-zinc-300">{tx.quantity} × {formatCurrency(Number(tx.pricePerUnit))}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-xs">
                        <span className="text-zinc-500">shipping {tx.shippingCost ? formatCurrency(Number(tx.shippingCost)) : '-'}</span>
                        <span className="font-medium text-zinc-200">{formatCurrency(Number(tx.totalAmount))}</span>
                      </div>
                      <div className="mt-2 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(tx)}
                          className="h-8 w-8 text-zinc-500 hover:text-emerald-400"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(tx.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editDialog.open} onOpenChange={closeEdit}>
        <form onSubmit={handleEdit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-emerald-400" />
              edit transaction
            </DialogTitle>
            <DialogDescription>
              update quantity, price, shipping, date, or note.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">price / unit</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={editForm.pricePerUnit}
                  onChange={(e) => setEditForm({ ...editForm, pricePerUnit: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">shipping cost</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={editForm.shippingCost}
                onChange={(e) => setEditForm({ ...editForm, shippingCost: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">date</label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">note</label>
              <Input
                value={editForm.note}
                onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                placeholder="optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeEdit}>
              cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              save changes
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
