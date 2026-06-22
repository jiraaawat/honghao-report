'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { InventoryItem, CardDto, CARD_TYPES, GAMES, CARD_CONDITIONS } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Search,
  Package,
  PackageCheck,
  PackageX,
  TrendingUp,
  Wallet,
  Boxes,
  Calendar,
  Gem,
  Plus,
  Minus,
  Tag,
  PlusCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

interface InventoryResponse {
  items: InventoryItem[]
  summary: {
    totalCards: number
    inStock: number
    grading: number
    soldOut: number
    soldCards: number
    totalValue: number
    totalProfit: number
    totalInvested: number
  }
}

export default function InventoryPage() {
  const { status } = useSession()
  const [data, setData] = useState<InventoryResponse | null>(null)
  const [cards, setCards] = useState<CardDto[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cardType, setCardType] = useState('')
  const [game, setGame] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [sortBy, setSortBy] = useState<'lastTransaction_desc' | 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' | 'quantity_desc' | 'quantity_asc'>('lastTransaction_desc')

  const [sellDialog, setSellDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  })
  const [sellQty, setSellQty] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellShipping, setSellShipping] = useState('')
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0])
  const [sellNote, setSellNote] = useState('')

  const [adjustDialog, setAdjustDialog] = useState<{
    open: boolean
    item: InventoryItem | null
    mode: 'remove'
  }>({ open: false, item: null, mode: 'remove' })
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustPrice, setAdjustPrice] = useState('')
  const [adjustDate, setAdjustDate] = useState(new Date().toISOString().split('T')[0])
  const [adjustNote, setAdjustNote] = useState('')

  const [addDialog, setAddDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  })
  const [addMode, setAddMode] = useState<'existing' | 'new'>('existing')
  const [addCardId, setAddCardId] = useState('')
  const [addCard, setAddCard] = useState({
    name: '',
    setCode: '',
    cardNumber: '',
    rarity: '',
    cardType: 'Single',
    game: 'Pokemon',
    condition: '',
  })
  const [addQty, setAddQty] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addNote, setAddNote] = useState('')

  const [editingValue, setEditingValue] = useState<{ cardId: string; value: string } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const [sellConfirm, setSellConfirm] = useState<{ open: boolean; item: InventoryItem | null; qty: number; price: number; shipping: number; date: string; note: string }>({
    open: false,
    item: null,
    qty: 0,
    price: 0,
    shipping: 0,
    date: '',
    note: '',
  })
  const [addConfirm, setAddConfirm] = useState<{ open: boolean; cardName: string; qty: number; price: number; date: string; note: string; cardId: string; isNewCard: boolean }>({
    open: false,
    cardName: '',
    qty: 0,
    price: 0,
    date: '',
    note: '',
    cardId: '',
    isNewCard: false,
  })
  const [removeConfirm, setRemoveConfirm] = useState<{ open: boolean; item: InventoryItem | null; qty: number; price: number; date: string; note: string }>({
    open: false,
    item: null,
    qty: 0,
    price: 0,
    date: '',
    note: '',
  })

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()),
    []
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), [])

  const fetchInventory = useCallback(() => {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (statusFilter) params.append('status', statusFilter)
    if (cardType) params.append('cardType', cardType)
    if (game) params.append('game', game)

    setLoading(true)
    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [search, statusFilter, cardType, game])

  const fetchCards = useCallback(() => {
    fetch('/api/cards')
      .then((r) => r.json())
      .then((d) => setCards(d))
      .catch(() => setCards([]))
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCards()
      const timeout = setTimeout(fetchInventory, 200)
      return () => clearTimeout(timeout)
    }
  }, [status, fetchCards, fetchInventory])

  const openSell = (item: InventoryItem) => {
    setSellDialog({ open: true, item })
    setSellQty(item.quantity.toString())
    setSellPrice('')
    setSellShipping('')
    setSellDate(new Date().toISOString().split('T')[0])
    setSellNote('')
  }

  const closeSell = () => {
    setSellDialog({ open: false, item: null })
  }

  const openAdjust = (item: InventoryItem) => {
    setAdjustDialog({ open: true, item, mode: 'remove' })
    setAdjustQty('1')
    setAdjustPrice('0')
    setAdjustDate(new Date().toISOString().split('T')[0])
    setAdjustNote('stock out')
  }

  const closeAdjust = () => {
    setAdjustDialog({ open: false, item: null, mode: 'remove' })
  }

  const openAdd = (item: InventoryItem | null = null) => {
    setAddDialog({ open: true, item })
    setAddMode(item ? 'existing' : 'existing')
    setAddCardId(item ? item.cardId : cards.length > 0 ? cards[0].id : '')
    setAddCard({
      name: '',
      setCode: '',
      cardNumber: '',
      rarity: '',
      cardType: 'Single',
      game: 'Pokemon',
      condition: '',
    })
    setAddQty('1')
    setAddPrice('')
    setAddDate(new Date().toISOString().split('T')[0])
    setAddNote('stock in')
  }

  const closeAdd = () => {
    setAddDialog({ open: false, item: null })
  }

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault()
    const item = sellDialog.item
    if (!item) return

    const qty = Number(sellQty)
    const price = Number(sellPrice)
    const shipping = Number(sellShipping || 0)
    if (!qty || qty <= 0 || qty > item.quantity || price < 0 || shipping < 0) return

    setSellConfirm({
      open: true,
      item,
      qty,
      price,
      shipping,
      date: sellDate,
      note: sellNote,
    })
  }

  const executeSell = async () => {
    const { item, qty, price, shipping, date, note } = sellConfirm
    if (!item) return

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: item.cardId,
        type: 'SELL',
        quantity: qty,
        pricePerUnit: price,
        shippingCost: shipping,
        date: new Date(date).toISOString(),
        note: note || undefined,
      }),
    })

    if (res.ok) {
      setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })
      closeSell()
      fetchInventory()
    }
  }

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    const item = adjustDialog.item
    if (!item) return

    const qty = Number(adjustQty)
    const price = Number(adjustPrice || 0)
    if (!qty || qty <= 0 || qty > item.quantity) return

    setRemoveConfirm({
      open: true,
      item,
      qty,
      price,
      date: adjustDate,
      note: adjustNote,
    })
  }

  const executeRemove = async () => {
    const { item, qty, price, date, note } = removeConfirm
    if (!item) return

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: item.cardId,
        type: 'SELL',
        quantity: qty,
        pricePerUnit: price,
        date: new Date(date).toISOString(),
        note: note || undefined,
      }),
    })

    if (res.ok) {
      setRemoveConfirm({ open: false, item: null, qty: 0, price: 0, date: '', note: '' })
      closeAdjust()
      fetchInventory()
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = Number(addQty)
    const price = Number(addPrice || 0)
    if (!qty || qty <= 0) return

    const cardId = addCardId
    let cardName = cards.find((c) => c.id === cardId)?.name ?? ''
    let isNewCard = false

    if (addMode === 'new') {
      if (!addCard.name.trim()) return
      isNewCard = true
      cardName = addCard.name
    }

    if (!cardId && !isNewCard) return

    setAddConfirm({
      open: true,
      cardName,
      qty,
      price,
      date: addDate,
      note: addNote,
      cardId,
      isNewCard,
    })
  }

  const executeAdd = async () => {
    const { qty, price, date, note, isNewCard } = addConfirm
    let cardId = addConfirm.cardId

    if (isNewCard) {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addCard.name,
          setCode: addCard.setCode || undefined,
          cardNumber: addCard.cardNumber || undefined,
          rarity: addCard.rarity || undefined,
          cardType: addCard.cardType,
          game: addCard.game,
          condition: addCard.condition || undefined,
        }),
      })
      if (!res.ok) return
      const newCard = await res.json()
      cardId = newCard.id
      fetchCards()
    }

    if (!cardId) return

    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        type: 'BUY',
        quantity: qty,
        pricePerUnit: price,
        date: new Date(date).toISOString(),
        note: note || undefined,
      }),
    })

    if (res.ok) {
      setAddConfirm({ open: false, cardName: '', qty: 0, price: 0, date: '', note: '', cardId: '', isNewCard: false })
      closeAdd()
      fetchInventory()
    }
  }

  const toggleExpanded = (cardId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) next.delete(cardId)
      else next.add(cardId)
      return next
    })
  }

  const updateCurrentValue = async (cardId: string, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num) || num < 0) return

    const res = await fetch(`/api/inventory/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentValue: num }),
    })

    if (res.ok) {
      setEditingValue(null)
      fetchInventory()
    }
  }

  const sellTotal = useMemo(() => {
    const qty = Number(sellQty || 0)
    const price = Number(sellPrice || 0)
    const shipping = Number(sellShipping || 0)
    return qty * price + shipping
  }, [sellQty, sellPrice, sellShipping])

  const items = useMemo(() => data?.items ?? [], [data])

  const filteredItems = useMemo(() => {
    if (!year && !month) return items
    return items.filter((item) => {
      const dateStr = statusFilter === 'sold_out' ? item.soldAt : item.createdAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      const y = d.getUTCFullYear().toString()
      const m = (d.getUTCMonth() + 1).toString()
      if (year && y !== year) return false
      if (month && m !== month) return false
      return true
    })
  }, [items, year, month, statusFilter])

  const sortedItems = useMemo(() => {
    const list = [...filteredItems]
    switch (sortBy) {
      case 'createdAt_desc':
        return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      case 'createdAt_asc':
        return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case 'name_asc':
        return list.sort((a, b) => a.cardName.localeCompare(b.cardName))
      case 'name_desc':
        return list.sort((a, b) => b.cardName.localeCompare(a.cardName))
      case 'quantity_desc':
        return list.sort((a, b) => b.quantity - a.quantity)
      case 'quantity_asc':
        return list.sort((a, b) => a.quantity - b.quantity)
      case 'lastTransaction_desc':
      default:
        return list.sort((a, b) => {
          if (!a.lastTransaction && !b.lastTransaction) return 0
          if (!a.lastTransaction) return 1
          if (!b.lastTransaction) return -1
          return new Date(b.lastTransaction).getTime() - new Date(a.lastTransaction).getTime()
        })
    }
  }, [filteredItems, sortBy])

  const summary = useMemo(() => {
    const inStockQty = filteredItems
      .filter((i) => i.status === 'in_stock')
      .reduce((sum, i) => sum + i.quantity, 0)
    const gradingQty = filteredItems
      .filter((i) => i.status === 'grading')
      .reduce((sum, i) => sum + i.quantity, 0)
    const soldOutQty = filteredItems.reduce((sum, i) => sum + i.soldQty, 0)
    const totalValue = filteredItems.reduce((sum, i) => sum + i.currentValue, 0)
    const totalProfit = filteredItems.reduce((sum, i) => sum + i.profit, 0)
    const totalInvested = filteredItems.reduce((sum, i) => sum + i.totalInvested, 0)
    return {
      totalCards: inStockQty + gradingQty,
      inStock: inStockQty,
      grading: gradingQty,
      soldOut: soldOutQty,
      soldCards: soldOutQty,
      totalValue,
      totalProfit,
      totalROI: totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0,
      totalInvested,
    }
  }, [filteredItems])

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">loading inventory...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const statCards = [
    {
      label: 'total cards',
      value: summary.totalCards,
      icon: Boxes,
      color: 'text-blue-400',
      note: 'unsold quantity',
    },
    {
      label: 'in stock',
      value: summary.inStock,
      icon: PackageCheck,
      color: 'text-emerald-400',
      note: 'quantity',
    },
    {
      label: 'grading',
      value: summary.grading,
      icon: Gem,
      color: 'text-amber-400',
      note: 'quantity',
    },
    {
      label: 'sold cards',
      value: summary.soldCards,
      icon: PackageX,
      color: 'text-zinc-400',
    },
    {
      label: 'current value',
      value: formatCurrency(summary.totalValue),
      icon: Wallet,
      color: 'text-zinc-200',
    },
    {
      label: 'total profit',
      value: formatCurrency(summary.totalProfit),
      icon: TrendingUp,
      color: (summary?.totalProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">$ inventory</h1>
          <p className="font-mono text-sm text-zinc-500">track your cards, stock, and sold items</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilter === 'sold_out' ? (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setStatusFilter('in_stock')
                setSortBy('lastTransaction_desc')
              }}
            >
              <PackageCheck className="h-4 w-4" />
              view in stock
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setStatusFilter('sold_out')
                setSortBy('createdAt_desc')
              }}
            >
              <PackageX className="h-4 w-4" />
              view sold cards
            </Button>
          )}
          <Button className="gap-2" onClick={() => openAdd(null)}>
            <PlusCircle className="h-4 w-4" />
            add card
          </Button>
          <Link href="/grading/send">
            <Button className="gap-2">
              <Gem className="h-4 w-4" />
              send to grade
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`font-mono text-xl font-bold sm:text-2xl ${s.color}`}>{s.value}</div>
                {s.note && (
                  <div className="mt-1 font-mono text-[10px] text-zinc-600">{s.note}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="search cards..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">all status</option>
              <option value="in_stock">in stock</option>
              <option value="grading">grading</option>
              <option value="sold_out">sold out</option>
            </Select>

            <Select value={cardType} onChange={(e) => setCardType(e.target.value)}>
              <option value="">all types</option>
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <Select value={game} onChange={(e) => setGame(e.target.value)}>
              <option value="">all games</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">all years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">all months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.padStart(2, '0')}</option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="lastTransaction_desc">sort: last transaction</option>
                <option value="createdAt_desc">sort: latest created</option>
                <option value="createdAt_asc">sort: oldest created</option>
                <option value="name_asc">sort: name A-Z</option>
                <option value="name_desc">sort: name Z-A</option>
                <option value="quantity_desc">sort: qty high-low</option>
                <option value="quantity_asc">sort: qty low-high</option>
              </Select>
            </div>

            {[search, statusFilter, cardType, game, year, month].some(Boolean) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('')
                  setCardType('')
                  setGame('')
                  setYear('')
                  setMonth('')
                  setSearch('')
                  setSortBy('lastTransaction_desc')
                }}
                className="font-mono text-xs"
              >
                clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">items ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedItems.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              no items match your filters
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2 pr-4">card</th>
                      <th className="pb-2 pr-4">type</th>
                      <th className="pb-2 pr-4">game</th>
                      <th className="pb-2 pr-4">condition</th>
                      <th className="pb-2 pr-4">status</th>
                      <th className="pb-2 pr-4">created / sold</th>
                      <th className="pb-2 pr-4 text-right">qty</th>
                      <th className="pb-2 pr-4 text-right">avg cost</th>
                      <th className="pb-2 pr-4 text-right">market value</th>
                      <th className="pb-2 pr-4 text-right">total value</th>
                      <th className="pb-2 pr-4 text-right">profit</th>
                      <th className="pb-2">actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item) => (
                      <tr
                        key={item.cardId}
                        onClick={() => item.status === 'in_stock' && item.quantity > 0 && openSell(item)}
                        className={`border-b border-zinc-800/50 last:border-0 ${
                          item.status === 'in_stock' && item.quantity > 0
                            ? 'cursor-pointer hover:bg-zinc-800/40'
                            : 'cursor-default'
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-zinc-200">{item.cardName}</span>
                            <span className="text-xs text-zinc-500">
                              {[item.setCode, item.cardNumber, item.rarity].filter(Boolean).join(' · ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-zinc-400">{item.cardType}</td>
                        <td className="py-3 pr-4 text-zinc-400">{item.game}</td>
                        <td className="py-3 pr-4">
                          {item.condition ? (
                            <Badge variant="outline" className="text-xs">
                              {item.condition}
                            </Badge>
                          ) : (
                            <span className="text-xs text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          {item.status === 'grading' ? (
                            <Badge variant="grading" className="gap-1">
                              <Gem className="h-3 w-3" /> grading
                            </Badge>
                          ) : item.quantity > 0 ? (
                            <Badge variant="buy" className="gap-1">
                              <Package className="h-3 w-3" /> in stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <PackageX className="h-3 w-3" /> sold out
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col text-xs">
                            <span className="text-zinc-500">created {formatDate(item.createdAt)}</span>
                            {item.status === 'sold_out' && item.soldAt && (
                              <span className="text-amber-400">sold {formatDate(item.soldAt)}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right text-zinc-300">{item.quantity}</td>
                        <td className="py-3 pr-4 text-right text-zinc-400">
                          {formatCurrency(item.averageCost)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          {editingValue?.cardId === item.cardId ? (
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              autoFocus
                              defaultValue={item.marketValuePerUnit}
                              onBlur={(e) => updateCurrentValue(item.cardId, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  updateCurrentValue(item.cardId, (e.target as HTMLInputElement).value)
                                }
                                if (e.key === 'Escape') setEditingValue(null)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 w-28 text-right font-mono text-xs"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingValue({ cardId: item.cardId, value: String(item.marketValuePerUnit) })
                              }}
                              className="font-mono text-zinc-300 hover:text-zinc-100"
                              title="click to edit current value"
                            >
                              {formatCurrency(item.marketValuePerUnit)}
                            </button>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right text-zinc-300">
                          {formatCurrency(item.currentValue)}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex flex-col items-end">
                            <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                              {formatCurrency(item.profit)}
                            </span>
                            {item.unrealizedProfit !== 0 && (
                              <span className="text-[10px] text-zinc-500">
                                unrealized {formatCurrency(item.unrealizedProfit)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {item.status === 'in_stock' && item.quantity > 0 && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="quick add"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAdd(item)
                                  }}
                                  className="h-7 w-7 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="quick remove"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAdjust(item)
                                  }}
                                  className="h-7 w-7 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Link href={`/grading/send?cardId=${item.cardId}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    title="send to grade"
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-7 w-7 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
                                  >
                                    <Gem className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {sortedItems.map((item) => {
                  const isExpanded = expandedCards.has(item.cardId)
                  return (
                    <div
                      key={item.cardId}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-mono font-medium text-sm text-zinc-200">
                            {item.cardName}
                          </div>
                          <div className="truncate font-mono text-[10px] text-zinc-500">
                            {[item.setCode, item.cardNumber, item.rarity].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {item.condition && (
                            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                              {item.condition}
                            </Badge>
                          )}
                          <span className="font-mono text-[10px] text-zinc-500">{item.game}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {item.status === 'grading' ? (
                            <Badge variant="grading" className="gap-1 text-[10px]">
                              <Gem className="h-3 w-3" /> grading
                            </Badge>
                          ) : item.quantity > 0 ? (
                            <Badge variant="buy" className="gap-1 text-[10px]">
                              <Package className="h-3 w-3" /> in stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[10px]">
                              <PackageX className="h-3 w-3" /> sold out
                            </Badge>
                          )}
                          <span className="font-mono text-xs text-zinc-300">qty {item.quantity}</span>
                        </div>
                        <div className="font-mono text-xs font-medium text-zinc-200">
                          {formatCurrency(item.currentValue)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between font-mono text-xs">
                        <span className="text-zinc-500">profit</span>
                        <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(item.profit)}
                        </span>
                      </div>

                      {item.status === 'in_stock' && item.quantity > 0 && (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openSell(item)}
                          >
                            <Tag className="h-3.5 w-3.5" /> sell
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 gap-1"
                            onClick={() => openAdd(item)}
                          >
                            <Plus className="h-3.5 w-3.5" /> add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 flex-1 gap-1"
                            onClick={() => openAdjust(item)}
                          >
                            <Minus className="h-3.5 w-3.5" /> remove
                          </Button>
                          <Link href={`/grading/send?cardId=${item.cardId}`}>
                            <Button size="sm" variant="outline" className="h-8 px-2">
                              <Gem className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.cardId)}
                        className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-zinc-800 bg-zinc-900/50 py-1 font-mono text-[10px] text-zinc-500 hover:text-zinc-300"
                      >
                        {isExpanded ? 'hide details' : 'show details'}
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 grid grid-cols-2 gap-y-2 border-t border-zinc-800 pt-2 font-mono text-xs">
                          <div>
                            <div className="text-zinc-500">avg cost</div>
                            <div className="text-zinc-300">{formatCurrency(item.averageCost)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">market value</div>
                            {editingValue?.cardId === item.cardId ? (
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                autoFocus
                                defaultValue={item.marketValuePerUnit}
                                onBlur={(e) => updateCurrentValue(item.cardId, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    updateCurrentValue(item.cardId, (e.target as HTMLInputElement).value)
                                  }
                                  if (e.key === 'Escape') setEditingValue(null)
                                }}
                                className="h-6 w-24 text-right font-mono text-xs"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingValue({ cardId: item.cardId, value: String(item.marketValuePerUnit) })
                                }
                                className="text-zinc-300 hover:text-zinc-100"
                              >
                                {formatCurrency(item.marketValuePerUnit)}
                              </button>
                            )}
                          </div>
                          <div className="col-span-2">
                            <div className="text-zinc-500">
                              {item.status === 'sold_out' ? 'sold at' : 'created at'}
                            </div>
                            <div className="text-zinc-300">
                              {item.status === 'sold_out' && item.soldAt
                                ? formatDate(item.soldAt)
                                : formatDate(item.createdAt)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={sellDialog.open} onOpenChange={closeSell}>
        <form onSubmit={handleSell}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-400" />
              sell {sellDialog.item?.cardName}
            </DialogTitle>
            <DialogDescription>
              click a card row to sell. quantity cannot exceed current stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">quantity</label>
                <Input
                  type="number"
                  min={1}
                  max={sellDialog.item?.quantity ?? 1}
                  value={sellQty}
                  onChange={(e) => setSellQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">avg cost</label>
                <Input
                  type="text"
                  value={formatCurrency(sellDialog.item?.averageCost ?? 0)}
                  disabled
                  className="text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">sell price / unit</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">shipping cost</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={sellShipping}
                  onChange={(e) => setSellShipping(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">date</label>
              <Input type="date" value={sellDate} onChange={(e) => setSellDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">note</label>
              <Input
                value={sellNote}
                onChange={(e) => setSellNote(e.target.value)}
                placeholder="optional"
              />
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>cards total</span>
                <span>{formatCurrency(Number(sellQty || 0) * Number(sellPrice || 0))}</span>
              </div>
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>shipping</span>
                <span>{formatCurrency(Number(sellShipping || 0))}</span>
              </div>
              <div className="mt-1 flex justify-between font-mono text-sm font-bold text-zinc-200">
                <span>total received</span>
                <span>{formatCurrency(sellTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeSell}>
              cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2">
              <Tag className="h-3.5 w-3.5" />
              confirm sell
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={adjustDialog.open} onOpenChange={closeAdjust}>
        <form onSubmit={handleAdjust}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-zinc-400" />
              remove stock · {adjustDialog.item?.cardName}
            </DialogTitle>
            <DialogDescription>
              creates a SELL transaction for the removed quantity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">quantity</label>
                <Input
                  type="number"
                  min={1}
                  max={adjustDialog.item?.quantity ?? 1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">sell price / unit</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={adjustPrice}
                  onChange={(e) => setAdjustPrice(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">date</label>
              <Input type="date" value={adjustDate} onChange={(e) => setAdjustDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">note</label>
              <Input
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeAdjust}>
              cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2">
              <>
                <Minus className="h-3.5 w-3.5" />
                remove stock
              </>
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={addDialog.open} onOpenChange={closeAdd}>
        <form onSubmit={handleAdd}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              add card / stock
            </DialogTitle>
            <DialogDescription>
              choose an existing card from your history, or create a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2 rounded border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setAddMode('existing')}
                className={`flex-1 rounded px-3 py-1.5 font-mono text-xs ${
                  addMode === 'existing'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                existing card
              </button>
              <button
                type="button"
                onClick={() => setAddMode('new')}
                className={`flex-1 rounded px-3 py-1.5 font-mono text-xs ${
                  addMode === 'new'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                new card
              </button>
            </div>

            {addMode === 'existing' ? (
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">card</label>
                <Select value={addCardId} onChange={(e) => setAddCardId(e.target.value)} required>
                  <option value="">select card</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} {card.condition ? `(${card.condition})` : ''}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">card name</label>
                  <Input
                    value={addCard.name}
                    onChange={(e) => setAddCard({ ...addCard, name: e.target.value })}
                    placeholder="e.g. Charizard Base Set"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">set code</label>
                    <Input
                      value={addCard.setCode}
                      onChange={(e) => setAddCard({ ...addCard, setCode: e.target.value })}
                      placeholder="BS"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">card number</label>
                    <Input
                      value={addCard.cardNumber}
                      onChange={(e) => setAddCard({ ...addCard, cardNumber: e.target.value })}
                      placeholder="004"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">rarity</label>
                    <Input
                      value={addCard.rarity}
                      onChange={(e) => setAddCard({ ...addCard, rarity: e.target.value })}
                      placeholder="Holo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">condition</label>
                    <Select
                      value={addCard.condition}
                      onChange={(e) => setAddCard({ ...addCard, condition: e.target.value })}
                    >
                      <option value="">unspecified</option>
                      {CARD_CONDITIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">card type</label>
                    <Select
                      value={addCard.cardType}
                      onChange={(e) => setAddCard({ ...addCard, cardType: e.target.value })}
                    >
                      {CARD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">game</label>
                    <Select
                      value={addCard.game}
                      onChange={(e) => setAddCard({ ...addCard, game: e.target.value })}
                    >
                      {GAMES.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">cost / unit</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">date</label>
              <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">note</label>
              <Input
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
                placeholder="optional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>
              cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2">
              <Plus className="h-3.5 w-3.5" />
              add stock
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={sellConfirm.open} onOpenChange={() => setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            confirm sell
          </DialogTitle>
          <DialogDescription>please review the sell details before confirming.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">card</span>
            <span className="text-zinc-200">{sellConfirm.item?.cardName}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">quantity</span>
            <span className="text-zinc-200">{sellConfirm.qty}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">price / unit</span>
            <span className="text-zinc-200">{formatCurrency(sellConfirm.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">shipping</span>
            <span className="text-zinc-200">{formatCurrency(sellConfirm.shipping)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">date</span>
            <span className="text-zinc-200">{sellConfirm.date}</span>
          </div>
          {sellConfirm.note && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">note</span>
              <span className="text-zinc-200">{sellConfirm.note}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold text-zinc-200">
            <span>total received</span>
            <span>{formatCurrency(sellConfirm.qty * sellConfirm.price + sellConfirm.shipping)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })}
          >
            cancel
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={executeSell}>
            <Tag className="h-3.5 w-3.5" />
            confirm sell
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={removeConfirm.open} onOpenChange={() => setRemoveConfirm({ open: false, item: null, qty: 0, price: 0, date: '', note: '' })}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-zinc-400" />
            confirm remove stock
          </DialogTitle>
          <DialogDescription>please review the stock removal before confirming.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">card</span>
            <span className="text-zinc-200">{removeConfirm.item?.cardName}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">quantity</span>
            <span className="text-zinc-200">{removeConfirm.qty}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">price / unit</span>
            <span className="text-zinc-200">{formatCurrency(removeConfirm.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">date</span>
            <span className="text-zinc-200">{removeConfirm.date}</span>
          </div>
          {removeConfirm.note && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">note</span>
              <span className="text-zinc-200">{removeConfirm.note}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold text-zinc-200">
            <span>total</span>
            <span>{formatCurrency(removeConfirm.qty * removeConfirm.price)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setRemoveConfirm({ open: false, item: null, qty: 0, price: 0, date: '', note: '' })}
          >
            cancel
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={executeRemove}>
            <Minus className="h-3.5 w-3.5" />
            confirm remove
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={addConfirm.open} onOpenChange={() => setAddConfirm({ open: false, cardName: '', qty: 0, price: 0, date: '', note: '', cardId: '', isNewCard: false })}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" />
            confirm add stock
          </DialogTitle>
          <DialogDescription>please review the stock addition before confirming.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">card</span>
            <span className="text-zinc-200">{addConfirm.cardName || 'new card'}</span>
          </div>
          {addConfirm.isNewCard && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">type</span>
              <span className="text-zinc-200">{addCard.cardType}</span>
            </div>
          )}
          {addConfirm.isNewCard && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">game</span>
              <span className="text-zinc-200">{addCard.game}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">quantity</span>
            <span className="text-zinc-200">{addConfirm.qty}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">cost / unit</span>
            <span className="text-zinc-200">{formatCurrency(addConfirm.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">date</span>
            <span className="text-zinc-200">{addConfirm.date}</span>
          </div>
          {addConfirm.note && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">note</span>
              <span className="text-zinc-200">{addConfirm.note}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold text-zinc-200">
            <span>total cost</span>
            <span>{formatCurrency(addConfirm.qty * addConfirm.price)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAddConfirm({ open: false, cardName: '', qty: 0, price: 0, date: '', note: '', cardId: '', isNewCard: false })}
          >
            cancel
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={executeAdd}>
            <Plus className="h-3.5 w-3.5" />
            confirm add
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
