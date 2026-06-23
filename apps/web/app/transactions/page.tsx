'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { TransactionDto, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toPng } from 'html-to-image'
import { FlexCard } from '@/components/flex-card'
import { Trash2, Search, Calendar, Pencil, ChevronUp, ChevronDown, Zap } from 'lucide-react'

export default function TransactionsPage() {
  const { status } = useSession()
  const [transactions, setTransactions] = useState<TransactionDto[]>([])
  const [loading, setLoading] = useState(true)

  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCardType, setFilterCardType] = useState('')
  const [filterGame, setFilterGame] = useState('')
  const [showFilters, setShowFilters] = useState(false)

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

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [flexTx, setFlexTx] = useState<TransactionDto | null>(null)
  const flexRef = useRef<HTMLDivElement>(null)

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
      const txData = await fetchTransactions()
      if (!cancelled) {
        setTransactions(txData)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [status, fetchTransactions])

  useEffect(() => {
    if (!flexTx || !flexRef.current) return

    const run = async () => {
      try {
        const dataUrl = await toPng(flexRef.current!, { pixelRatio: 2 })
        const blob = await fetch(dataUrl).then((r) => r.blob())
        const file = new File([blob], `flex-${flexTx.id}.png`, { type: 'image/png' })

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'FLEX by honghao report',
            text: `Sold ${flexTx.card?.name} for ${formatCurrency(Number(flexTx.totalAmount))}`,
          })
        } else {
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = `flex-${flexTx.id}.png`
          link.click()
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFlexTx(null)
      }
    }

    run()
  }, [flexTx])

  const handleFlex = (tx: TransactionDto) => {
    if (tx.type !== 'SELL') return
    setFlexTx(tx)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return
    if (isSubmitting) return
    setIsSubmitting(true)
    const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    if (res.ok) {
      const txData = await fetchTransactions()
      setTransactions(txData)
    }
    setIsSubmitting(false)
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
    if (!tx || isSubmitting) return
    setIsSubmitting(true)

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
      const txData = await fetchTransactions()
      setTransactions(txData)
    }
    setIsSubmitting(false)
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
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-100">$ transactions</h1>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm">filters</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-1 md:hidden font-mono text-xs"
          >
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            filters
          </Button>
        </CardHeader>
        <CardContent className={!showFilters ? 'hidden md:block' : ''}>
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

      <Card className="border-zinc-800 bg-zinc-900/50">
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
                            {tx.type === 'SELL' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFlex(tx)}
                                className="h-8 w-8 text-amber-400 hover:text-amber-300"
                                title="FLEX"
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                            )}
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
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono text-sm text-zinc-200">{tx.card?.name}</div>
                          <div className="truncate font-mono text-xs text-zinc-500">{tx.card?.cardType} · {tx.card?.game}</div>
                        </div>
                        <Badge variant={tx.type === 'BUY' ? 'buy' : 'sell'} className="shrink-0">{tx.type}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-zinc-500">{formatDate(tx.date)}</span>
                        <span className="min-w-0 break-words text-right text-zinc-300">{tx.quantity} × {formatCurrency(Number(tx.pricePerUnit))}</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-zinc-500">shipping {tx.shippingCost ? formatCurrency(Number(tx.shippingCost)) : '-'}</span>
                        <span className="min-w-0 break-words text-right font-medium text-zinc-200">{formatCurrency(Number(tx.totalAmount))}</span>
                      </div>
                      <div className="mt-2 flex justify-end gap-1">
                        {tx.type === 'SELL' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFlex(tx)}
                            className="h-8 w-8 text-amber-400 hover:text-amber-300"
                            title="FLEX"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <Button type="submit" disabled={isSubmitting} size="sm" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              save changes
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {flexTx && (
        <div className="fixed left-[-9999px] top-0">
          <FlexCard ref={flexRef} tx={flexTx} />
        </div>
      )}
    </div>
  )
}
