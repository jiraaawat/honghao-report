'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
import { InventoryGridCard } from '@/components/inventory/inventory-grid-card'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { FullPageLoader } from '@/components/ui/loading'
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
  LayoutList,
  LayoutGrid,
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('in_stock')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [formatFilter, setFormatFilter] = useState<'all' | 'raw' | 'slab' | 'sealed'>('all')
  const [cardType, setCardType] = useState('')
  const [game, setGame] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [sortBy, setSortBy] = useState<'lastTransaction_desc' | 'createdAt_desc' | 'createdAt_asc' | 'name_asc' | 'name_desc' | 'quantity_desc' | 'quantity_asc'>('lastTransaction_desc')
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const [sellDialog, setSellDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  })
  const [sellQty, setSellQty] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [sellShipping, setSellShipping] = useState('')
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0])
  const [sellNote, setSellNote] = useState('')

  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean
    item: InventoryItem | null
  }>({ open: false, item: null })
  const [removeQty, setRemoveQty] = useState('')

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
    game: 'OnePiece',
    condition: '',
  })
  const [addQty, setAddQty] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addNote, setAddNote] = useState('')

  const [editingValue, setEditingValue] = useState<{ cardId: string; value: string } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()

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


  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()),
    []
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), [])

  const formatLabel = (key: typeof formatFilter) => {
    if (key === 'raw') return t('inventory.format.raw')
    if (key === 'slab') return t('inventory.format.slab')
    if (key === 'sealed') return t('inventory.format.sealed')
    return t('common.all')
  }

  const fetchInventory = useCallback(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (statusFilter) params.append('status', statusFilter)
    if (cardType) params.append('cardType', cardType)
    if (game) params.append('game', game)

    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [debouncedSearch, statusFilter, cardType, game])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

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

  const openRemove = (item: InventoryItem) => {
    setRemoveDialog({ open: true, item })
    setRemoveQty('1')
  }

  const closeRemove = () => {
    setRemoveDialog({ open: false, item: null })
  }

  const openAdd = (item: InventoryItem | null = null) => {
    setAddDialog({ open: true, item })
    setAddMode(item ? 'existing' : 'new')
    setAddCardId(item ? item.cardId : '')
    setAddCard({
      name: '',
      setCode: '',
      cardNumber: '',
      rarity: '',
      cardType: 'Single',
      game: 'OnePiece',
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
    if (!item || isSubmitting) return

    setIsSubmitting(true)
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
    setIsSubmitting(false)
  }

  const handleRemove = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = removeDialog.item
    if (!item || isSubmitting) return

    const qty = Number(removeQty)
    if (!qty || qty <= 0 || qty > item.quantity) return

    setIsSubmitting(true)
    const res = await fetch(`/api/inventory/${item.cardId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: qty }),
    })

    if (res.ok) {
      closeRemove()
      fetchInventory()
    }
    setIsSubmitting(false)
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

    if (isSubmitting) return
    setIsSubmitting(true)

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
      if (!res.ok) {
        setIsSubmitting(false)
        return
      }
      const newCard = await res.json()
      cardId = newCard.id
      fetchCards()
    }

    if (!cardId) {
      setIsSubmitting(false)
      return
    }

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
    setIsSubmitting(false)
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

  const searchSuggestions = useMemo(() => {
    if (!search || search.length < 1) return []
    const term = search.toLowerCase()
    const matches = new Set<string>()
    items.forEach((item) => {
      if (item.cardName.toLowerCase().includes(term)) matches.add(item.cardName)
      if (item.setCode?.toLowerCase().includes(term)) matches.add(item.setCode)
      if (item.cardNumber?.toLowerCase().includes(term)) matches.add(item.cardNumber)
    })
    return Array.from(matches).slice(0, 8)
  }, [search, items])

  const formatGroups = useMemo(
    () => ({
      raw: ['Single', 'Bundle'],
      slab: ['PSA10', 'PSA9'],
      sealed: ['Sealed Product'],
    }),
    []
  )

  const filteredItems = useMemo(() => {
    let list = items
    if (formatFilter !== 'all') {
      list = list.filter((item) => formatGroups[formatFilter].includes(item.cardType))
    }
    if (!year && !month) return list
    return list.filter((item) => {
      const dateStr = statusFilter === 'sold_out' ? item.soldAt : item.createdAt
      if (!dateStr) return false
      const d = new Date(dateStr)
      const y = d.getUTCFullYear().toString()
      const m = (d.getUTCMonth() + 1).toString()
      if (year && y !== year) return false
      if (month && m !== month) return false
      return true
    })
  }, [items, year, month, statusFilter, formatFilter, formatGroups])

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

  const formatCounts = useMemo(() => {
    return {
      all: items.length,
      raw: items.filter((i) => formatGroups.raw.includes(i.cardType)).length,
      slab: items.filter((i) => formatGroups.slab.includes(i.cardType)).length,
      sealed: items.filter((i) => formatGroups.sealed.includes(i.cardType)).length,
    }
  }, [items, formatGroups])

  if (status === 'loading' || loading) {
    return <FullPageLoader />
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const statCards = [
    {
      label: t('inventory.totalCards'),
      value: summary.totalCards,
      icon: Boxes,
      color: 'text-blue-400',
      note: t('inventory.unsoldQuantity'),
    },
    {
      label: t('inventory.inStock'),
      value: summary.inStock,
      icon: PackageCheck,
      color: 'text-emerald-400',
      note: t('common.quantity'),
    },
    {
      label: t('inventory.grading'),
      value: summary.grading,
      icon: Gem,
      color: 'text-amber-400',
      note: t('common.quantity'),
    },
    {
      label: t('inventory.soldCards'),
      value: summary.soldCards,
      icon: PackageX,
      color: 'text-zinc-400',
    },
    {
      label: t('inventory.currentValue'),
      value: formatCurrency(summary.totalValue),
      icon: Wallet,
      color: 'text-zinc-200',
    },
    {
      label: t('inventory.totalProfit'),
      value: formatCurrency(summary.totalProfit),
      icon: TrendingUp,
      color: (summary?.totalProfit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
  ]

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">$ {t('inventory.title')}</h1>
          <p className="font-mono text-sm text-zinc-500">{t('inventory.pageSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={() => openAdd(null)}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">{t('inventory.addCard')}</span>
          </Button>
          <Link href="/grading/send">
            <Button className="gap-2">
              <Gem className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.sendToGrade')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
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
                <div className={`min-w-0 break-words font-mono text-xl font-bold sm:text-2xl ${s.color}`}>{s.value}</div>
                {s.note && (
                  <div className="mt-1 font-mono text-[10px] text-zinc-600">{s.note}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'raw', 'slab', 'sealed'] as const).map((key) => {
          const active = formatFilter === key
          return (
            <Button
              key={key}
              type="button"
              variant={active ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFormatFilter(key)}
              className="gap-2 font-mono text-xs"
            >
              <span className="uppercase">{formatLabel(key)}</span>
              <span className={active ? 'text-zinc-300' : 'text-zinc-500'}>({formatCounts[key]})</span>
            </Button>
          )
        })}
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm">{t('common.filters')}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-1 md:hidden font-mono text-xs"
          >
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {t('common.filters')}
          </Button>
        </CardHeader>
        <CardContent className={!showFilters ? 'hidden md:block' : ''}>
          <div className="flex flex-wrap items-end gap-2">
            <div className="relative w-44">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t('inventory.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="pl-9"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
                  {searchSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setSearch(s)
                        setShowSuggestions(false)
                      }}
                      className="block w-full truncate px-3 py-1.5 text-left font-mono text-xs text-zinc-300 hover:bg-zinc-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
              <option value="">{t('inventory.allStatus')}</option>
              <option value="in_stock">{t('common.inStock')}</option>
              <option value="grading">{t('common.grading')}</option>
              <option value="sold_out">{t('common.soldOut')}</option>
            </Select>

            <Select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-44">
              <option value="">{t('inventory.allTypes')}</option>
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>

            <Select value={game} onChange={(e) => setGame(e.target.value)} className="w-44">
              <option value="">{t('inventory.allGames')}</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>

            <div className="flex w-44 items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={year} onChange={(e) => setYear(e.target.value)} className="flex-1">
                <option value="">{t('inventory.allYears')}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-44">
              <option value="">{t('inventory.allMonths')}</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.padStart(2, '0')}</option>
              ))}
            </Select>

            <div className="flex w-44 items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="flex-1">
                <option value="lastTransaction_desc">{t('inventory.sortLabel.lastTransaction_desc')}</option>
                <option value="createdAt_desc">{t('inventory.sortLabel.createdAt_desc')}</option>
                <option value="createdAt_asc">{t('inventory.sortLabel.createdAt_asc')}</option>
                <option value="name_asc">{t('inventory.sortLabel.name_asc')}</option>
                <option value="name_desc">{t('inventory.sortLabel.name_desc')}</option>
                <option value="quantity_desc">{t('inventory.sortLabel.quantity_desc')}</option>
                <option value="quantity_asc">{t('inventory.sortLabel.quantity_asc')}</option>
              </Select>
            </div>

            {[search, statusFilter, cardType, game, year, month].some(Boolean) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('')
                  setFormatFilter('all')
                  setCardType('')
                  setGame('')
                  setYear('')
                  setMonth('')
                  setSearch('')
                  setSortBy('lastTransaction_desc')
                }}
                className="ml-auto font-mono text-xs"
              >
                {t('common.clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle className="font-mono text-sm">{t('inventory.itemsWithCount', { count: items.length })}</CardTitle>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-sm">
              {(['in_stock', 'sold_out', ''] as const).map((key) => {
                const label = key === 'in_stock' ? t('common.inStock') : key === 'sold_out' ? t('common.sold') : t('common.all')
                const active = statusFilter === key
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={cn(
                      'flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 font-mono text-[10px] font-medium transition-all',
                      active
                        ? 'bg-emerald-500 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-md px-3 font-mono text-xs font-medium transition-all',
                  viewMode === 'list'
                    ? 'bg-emerald-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                )}
                title={t('inventory.listView')}
              >
                <LayoutList className="h-4 w-4" /> {t('common.list')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-8 items-center gap-2 rounded-md px-3 font-mono text-xs font-medium transition-all',
                  viewMode === 'grid'
                    ? 'bg-emerald-500 text-zinc-950 shadow'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                )}
                title={t('inventory.gridView')}
              >
                <LayoutGrid className="h-4 w-4" /> {t('common.grid')}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedItems.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              {t('inventory.noItemsMatch')}
            </div>
          ) : (
            <>
              <div className={cn('hidden overflow-x-auto md:block', viewMode !== 'list' && 'md:hidden')}>
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2 pr-4">{t('inventory.table.card')}</th>
                      <th className="pb-2 pr-4">{t('inventory.table.type')}</th>
                      <th className="pb-2 pr-4">{t('inventory.table.game')}</th>
                      <th className="pb-2 pr-4">{t('inventory.table.condition')}</th>
                      <th className="pb-2 pr-4">{t('inventory.table.status')}</th>
                      <th className="pb-2 pr-4">{t('inventory.table.createdSold')}</th>
                      <th className="pb-2 pr-4 text-right">{t('inventory.table.qty')}</th>
                      <th className="pb-2 pr-4 text-right">{t('inventory.table.avgCost')}</th>
                      <th className="pb-2 pr-4 text-right">{t('inventory.table.marketValue')}</th>
                      <th className="pb-2 pr-4 text-right">{t('inventory.table.totalValue')}</th>
                      <th className="pb-2 pr-4 text-right">{t('inventory.table.profit')}</th>
                      <th className="w-28 pb-2">{t('inventory.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.map((item) => (
                      <tr
                        key={item.cardId}
                        onClick={() => item.status === 'in_stock' && item.quantity > 0 && openSell(item)}
                        className={`h-12 border-b border-zinc-800/50 last:border-0 ${
                          item.status === 'in_stock' && item.quantity > 0
                            ? 'cursor-pointer hover:bg-zinc-800/40'
                            : 'cursor-default'
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className={cn('font-medium', item.status === 'grading' ? 'text-amber-400' : 'text-zinc-200')}>
                              {item.cardName}
                            </span>
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
                              <Gem className="h-3 w-3" /> {t('common.grading')}
                            </Badge>
                          ) : item.quantity > 0 ? (
                            <Badge variant="buy" className="gap-1">
                              <Package className="h-3 w-3" /> {t('common.inStock')}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <PackageX className="h-3 w-3" /> {t('common.soldOut')}
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-col text-xs">
                            <span className="text-zinc-500">{t('inventory.createdOn', { date: formatDate(item.createdAt) })}</span>
                            {item.status === 'sold_out' && item.soldAt && (
                              <span className="text-amber-400">{t('inventory.soldOn', { date: formatDate(item.soldAt) })}</span>
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
                              title={t('inventory.editValueTitle')}
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
                                {t('inventoryGridCard.unrealized')} {formatCurrency(item.unrealizedProfit)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="w-28 py-3">
                          <div className="flex items-center gap-1">
                            {item.status === 'in_stock' && item.quantity > 0 ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title={t('common.add')}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openAdd(item)
                                  }}
                                  className="h-7 w-7 shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title={t('common.remove')}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openRemove(item)
                                  }}
                                  className="h-7 w-7 shrink-0 border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </Button>
                                <Link href={`/grading/send?cardId=${item.cardId}`}>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title={t('common.sendToGrade')}
                                    onClick={(e) => e.stopPropagation()}
                                    className="h-7 w-7 shrink-0 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
                                  >
                                    <Gem className="h-3.5 w-3.5" />
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <span className="inline-block h-7 w-7" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={cn('space-y-2 md:hidden', viewMode !== 'list' && 'hidden')}>
                {sortedItems.map((item) => {
                  const isExpanded = expandedCards.has(item.cardId)
                  return (
                    <div
                      key={item.cardId}
                      className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className={cn('truncate font-mono font-medium text-sm', item.status === 'grading' ? 'text-amber-400' : 'text-zinc-200')}>
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

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          {item.status === 'grading' ? (
                            <Badge variant="grading" className="gap-1 whitespace-nowrap text-[10px]">
                              <Gem className="h-3 w-3" /> grading
                            </Badge>
                          ) : item.quantity > 0 ? (
                            <Badge variant="buy" className="gap-1 whitespace-nowrap text-[10px]">
                              <Package className="h-3 w-3" /> in stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 whitespace-nowrap text-[10px]">
                              <PackageX className="h-3 w-3" /> sold out
                            </Badge>
                          )}
                          <span className="font-mono text-xs text-zinc-300">{t('inventoryGridCard.qty')} {item.quantity}</span>
                        </div>
                        <div className="min-w-0 break-words text-right font-mono text-xs font-medium text-zinc-200">
                          {formatCurrency(item.currentValue)}
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-zinc-500">{t('inventoryGridCard.profit')}</span>
                        <span className={item.profit >= 0 ? 'min-w-0 break-words text-right text-emerald-400' : 'min-w-0 break-words text-right text-red-400'}>
                          {formatCurrency(item.profit)}
                        </span>
                      </div>

                      {item.status === 'in_stock' && item.quantity > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-7 flex-1 gap-1 bg-emerald-600 text-[10px] text-white hover:bg-emerald-700"
                            onClick={() => openSell(item)}
                          >
                            <Tag className="h-3.5 w-3.5" /> {t('inventoryGridCard.sell')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 gap-1 text-[10px]"
                            onClick={() => openAdd(item)}
                          >
                            <Plus className="h-3.5 w-3.5" /> {t('inventoryGridCard.add')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 gap-1 text-[10px]"
                            onClick={() => openRemove(item)}
                          >
                            <Minus className="h-3.5 w-3.5" /> {t('inventoryGridCard.remove')}
                          </Button>
                          <Link href={`/grading/send?cardId=${item.cardId}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400">
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
                        {isExpanded ? t('inventory.hideDetails') : t('inventory.showDetails')}
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 grid grid-cols-2 gap-y-2 border-t border-zinc-800 pt-2 font-mono text-xs">
                          <div>
                            <div className="text-zinc-500">{t('inventoryGridCard.avgCost')}</div>
                            <div className="text-zinc-300">{formatCurrency(item.averageCost)}</div>
                          </div>
                          <div>
                            <div className="text-zinc-500">{t('inventoryGridCard.marketValue')}</div>
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
                              {item.status === 'sold_out' ? t('inventoryGridCard.soldAt') : t('inventoryGridCard.createdAt')}
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

          {viewMode === 'grid' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {sortedItems.map((item) => (
                <InventoryGridCard
                  key={item.cardId}
                  item={item}
                  onSell={openSell}
                  onAdd={openAdd}
                  onRemove={openRemove}
                  editing={editingValue?.cardId === item.cardId}
                  onEdit={() => setEditingValue({ cardId: item.cardId, value: String(item.marketValuePerUnit) })}
                  onUpdateValue={(value) => updateCurrentValue(item.cardId, value)}
                />
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Dialog open={sellDialog.open} onOpenChange={closeSell}>
        <form onSubmit={handleSell}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-emerald-400" />
              {t('inventory.dialog.sell.title')} {sellDialog.item?.cardName}
            </DialogTitle>
            <DialogDescription>
              {t('inventory.dialog.sell.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('common.quantity')}</label>
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
                <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.sell.avgCost')}</label>
                <Input
                  type="text"
                  value={formatCurrency(sellDialog.item?.averageCost ?? 0)}
                  disabled
                  className="text-zinc-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.sell.sellPrice')}</label>
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
                <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.sell.shippingCost')}</label>
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
              <label className="font-mono text-xs text-zinc-400">{t('common.date')}</label>
              <Input type="date" value={sellDate} onChange={(e) => setSellDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('common.note')}</label>
              <Input
                value={sellNote}
                onChange={(e) => setSellNote(e.target.value)}
                placeholder={t('common.optional')}
              />
            </div>

            <div className="rounded border border-zinc-800 bg-zinc-950 p-3">
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>{t('inventory.dialog.sell.cardsTotal')}</span>
                <span>{formatCurrency(Number(sellQty || 0) * Number(sellPrice || 0))}</span>
              </div>
              <div className="flex justify-between font-mono text-xs text-zinc-400">
                <span>{t('inventory.dialog.sell.shipping')}</span>
                <span>{formatCurrency(Number(sellShipping || 0))}</span>
              </div>
              <div className="mt-1 flex justify-between font-mono text-sm font-bold text-zinc-200">
                <span>{t('inventory.dialog.sell.totalReceived')}</span>
                <span>{formatCurrency(sellTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeSell}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" className="gap-2">
              <Tag className="h-3.5 w-3.5" />
              {t('inventory.dialog.sell.confirmSell')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={removeDialog.open} onOpenChange={closeRemove}>
        <form onSubmit={handleRemove}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="h-4 w-4 text-zinc-400" />
              {t('inventory.dialog.remove.title')} · {removeDialog.item?.cardName}
            </DialogTitle>
            <DialogDescription>
              {t('inventory.dialog.remove.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('common.quantity')}</label>
              <Input
                type="number"
                min={1}
                max={removeDialog.item?.quantity ?? 1}
                value={removeQty}
                onChange={(e) => setRemoveQty(e.target.value)}
                required
                autoFocus
              />
            </div>

          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeRemove}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting} size="sm" className="gap-2">
              {isSubmitting ? (
                <span className="font-mono text-xs">{t('common.processing')}</span>
              ) : (
                <>
                  <Minus className="h-3.5 w-3.5" />
                  {t('inventory.dialog.remove.title')}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={addDialog.open} onOpenChange={closeAdd}>
        <form onSubmit={handleAdd}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-emerald-400" />
              {t('inventory.dialog.add.title')}
            </DialogTitle>
            <DialogDescription>
              {t('inventory.dialog.add.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {addDialog.item ? (
              <div className="space-y-2 rounded border border-zinc-800 bg-zinc-950 p-3">
                <label className="font-mono text-xs text-zinc-400">{t('inventory.table.card')}</label>
                <div className="font-mono text-sm text-zinc-100">{addDialog.item.cardName}</div>
              </div>
            ) : (
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
                  {t('inventory.dialog.add.existingCard')}
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
                  {t('inventory.dialog.add.newCard')}
                </button>
              </div>
            )}

            {addMode === 'existing' && !addDialog.item ? (
              <div className="flex flex-col items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-6 text-center">
                <p className="font-mono text-xs text-zinc-400">
                  {t('inventory.dialog.add.browseCardListDescription')}
                </p>
                <Link href="/cards" onClick={closeAdd}>
                  <Button type="button" size="sm" className="gap-2">
                    <Package className="h-3.5 w-3.5" />
                    {t('inventory.dialog.add.browseCardList')}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {addMode === 'new' && !addDialog.item && (
                  <>
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.add.cardName')}</label>
                      <Input
                        value={addCard.name}
                        onChange={(e) => setAddCard({ ...addCard, name: e.target.value })}
                        placeholder="e.g. Charizard Base Set"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.add.setCode')}</label>
                        <Input
                          value={addCard.setCode}
                          onChange={(e) => setAddCard({ ...addCard, setCode: e.target.value })}
                          placeholder="BS"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.add.cardNumber')}</label>
                        <Input
                          value={addCard.cardNumber}
                          onChange={(e) => setAddCard({ ...addCard, cardNumber: e.target.value })}
                          placeholder="004"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('common.rarity')}</label>
                        <Input
                          value={addCard.rarity}
                          onChange={(e) => setAddCard({ ...addCard, rarity: e.target.value })}
                          placeholder="Holo"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('common.condition')}</label>
                        <Select
                          value={addCard.condition}
                          onChange={(e) => setAddCard({ ...addCard, condition: e.target.value })}
                        >
                          <option value="">{t('common.unspecified')}</option>
                          {CARD_CONDITIONS.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('common.cardType')}</label>
                        <Select
                          value={addCard.cardType}
                          onChange={(e) => setAddCard({ ...addCard, cardType: e.target.value })}
                        >
                          {CARD_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('common.game')}</label>
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

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">{t('common.quantity')}</label>
                    <Input
                      type="number"
                      min={1}
                      value={addQty}
                      onChange={(e) => setAddQty(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.add.costPerUnit')}</label>
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
                  <label className="font-mono text-xs text-zinc-400">{t('common.date')}</label>
                  <Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">{t('common.note')}</label>
                  <Input
                    value={addNote}
                    onChange={(e) => setAddNote(e.target.value)}
                    placeholder={t('common.optional')}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>
              {t('common.cancel')}
            </Button>
            {(addMode === 'new' || addDialog.item) && (
              <Button type="submit" size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                {t('inventory.dialog.add.addStock')}
              </Button>
            )}
          </DialogFooter>
        </form>
      </Dialog>

      <Dialog open={sellConfirm.open} onOpenChange={() => {
        setIsSubmitting(false)
        setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-emerald-400" />
            {t('inventory.dialog.sell.confirmSell')}
          </DialogTitle>
          <DialogDescription>{t('inventory.dialog.sell.reviewDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('inventory.table.card')}</span>
            <span className="text-zinc-200">{sellConfirm.item?.cardName}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('common.quantity')}</span>
            <span className="text-zinc-200">{sellConfirm.qty}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('inventory.dialog.sell.sellPrice')}</span>
            <span className="text-zinc-200">{formatCurrency(sellConfirm.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('inventory.dialog.sell.shipping')}</span>
            <span className="text-zinc-200">{formatCurrency(sellConfirm.shipping)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('common.date')}</span>
            <span className="text-zinc-200">{sellConfirm.date}</span>
          </div>
          {sellConfirm.note && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{t('common.note')}</span>
              <span className="text-zinc-200">{sellConfirm.note}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold text-zinc-200">
            <span>{t('inventory.dialog.sell.totalReceived')}</span>
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
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={executeSell} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="font-mono text-xs">{t('common.processing')}</span>
            ) : (
              <>
                <Tag className="h-3.5 w-3.5" />
                {t('inventory.dialog.sell.confirmSell')}
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={addConfirm.open} onOpenChange={() => {
        setIsSubmitting(false)
        setAddConfirm({ open: false, cardName: '', qty: 0, price: 0, date: '', note: '', cardId: '', isNewCard: false })
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-emerald-400" />
            {t('inventory.dialog.add.confirmTitle')}
          </DialogTitle>
          <DialogDescription>{t('inventory.dialog.add.reviewDescription')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('inventory.table.card')}</span>
            <span className="text-zinc-200">{addConfirm.cardName || t('inventory.dialog.add.newCard')}</span>
          </div>
          {addConfirm.isNewCard && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{t('common.type')}</span>
              <span className="text-zinc-200">{addCard.cardType}</span>
            </div>
          )}
          {addConfirm.isNewCard && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{t('common.game')}</span>
              <span className="text-zinc-200">{addCard.game}</span>
            </div>
          )}
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('common.quantity')}</span>
            <span className="text-zinc-200">{addConfirm.qty}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('inventory.dialog.add.costPerUnit')}</span>
            <span className="text-zinc-200">{formatCurrency(addConfirm.price)}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-800 pb-2">
            <span className="text-zinc-500">{t('common.date')}</span>
            <span className="text-zinc-200">{addConfirm.date}</span>
          </div>
          {addConfirm.note && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{t('common.note')}</span>
              <span className="text-zinc-200">{addConfirm.note}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 font-bold text-zinc-200">
            <span>{t('inventory.dialog.add.totalCost')}</span>
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
            {t('common.cancel')}
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={executeAdd} disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="font-mono text-xs">{t('common.processing')}</span>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                {t('inventory.dialog.add.confirmAdd')}
              </>
            )}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
