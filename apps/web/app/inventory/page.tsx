'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import useSWR from 'swr'
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
import { InventoryItem, CardDto, TransactionDto, CARD_TYPES, GAMES, CARD_CONDITIONS, LANGUAGES } from '@/types'
import {
  InventoryResponse,
  optimisticSell,
  optimisticRemove,
  optimisticBuy,
  optimisticNewCard,
  optimisticCost,
  optimisticCurrentValue,
} from '@/lib/optimistic/inventory'
import { InventoryGridCard } from '@/components/inventory/inventory-grid-card'
import { SortableInventoryGrid } from '@/components/inventory/sortable-grid'
import { InventoryDetailsDialog } from '@/components/inventory/inventory-details-dialog'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { AnimatedCurrency, AnimatedNumber } from '@/components/ui/animated-value'
import { useLanguage } from '@/lib/i18n/provider'
import { useToast } from '@/components/providers/toast-provider'
import { useSession } from 'next-auth/react'
import { fetcher, swrOptions } from '@/lib/swr'
import { InventorySkeleton } from '@/components/inventory/inventory-skeleton'
import { Tooltip } from '@/components/ui/tooltip'
import { FlexCardDialog } from '@/components/flex-card-dialog'
import { compressImage, validateImageFile } from '@/lib/image'
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
  Pencil,
  PlusCircle,
  ChevronUp,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  Check,
  X,
  GripVertical,
  Zap,
} from 'lucide-react'

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-300">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-zinc-500 hover:text-zinc-200"
        aria-label="Remove filter"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

export default function InventoryPage() {
  const emptySummary = useMemo(
    () => ({
      totalCards: 0,
      inStock: 0,
      grading: 0,
      soldOut: 0,
      soldCards: 0,
      totalValue: 0,
      totalProfit: 0,
      totalInvested: 0,
      totalROI: 0,
    }),
    []
  )

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('in_stock')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [formatFilter, setFormatFilter] = useState<'all' | 'raw' | 'slab' | 'sealed'>('all')
  const [cardType, setCardType] = useState('')
  const [game, setGame] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  type SortBy =
    | 'userOrder'
    | 'value_desc'
    | 'value_asc'
    | 'lastTransaction_desc'
    | 'createdAt_desc'
    | 'createdAt_asc'
    | 'name_asc'
    | 'name_desc'
    | 'quantity_desc'
    | 'quantity_asc'
  const [sortBy, setSortBy] = useState<SortBy>('userOrder')
  const [reorderDraft, setReorderDraft] = useState<InventoryItem[] | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')

  const inventoryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.append('search', debouncedSearch)
    if (statusFilter) params.append('status', statusFilter)
    if (cardType) params.append('cardType', cardType)
    if (game) params.append('game', game)
    return params
  }, [debouncedSearch, statusFilter, cardType, game])

  const inventoryKey = `/api/inventory?${inventoryParams.toString()}`
  const { data: inventoryData, isLoading: inventoryLoading, mutate: mutateInventory } = useSWR<InventoryResponse>(
    inventoryKey,
    fetcher,
    swrOptions
  )
  const { data: cardsData, mutate: mutateCards } = useSWR<CardDto[]>('/api/cards', fetcher, swrOptions)

  const data = inventoryData ?? { items: [], summary: emptySummary }
  const cards = cardsData ?? []

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
    language: 'EN',
    condition: '',
  })
  const [addQty, setAddQty] = useState('')
  const [addPrice, setAddPrice] = useState('')
  const [addDate, setAddDate] = useState(new Date().toISOString().split('T')[0])
  const [addNote, setAddNote] = useState('')
  const [addImage, setAddImage] = useState<File | null>(null)
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null)

  const [editingValue, setEditingValue] = useState<{ cardId: string; value: string } | null>(null)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useLanguage()
  const { toast } = useToast()
  const { data: session } = useSession()

  const [sellConfirm, setSellConfirm] = useState<{ open: boolean; item: InventoryItem | null; qty: number; price: number; shipping: number; date: string; note: string }>({
    open: false,
    item: null,
    qty: 0,
    price: 0,
    shipping: 0,
    date: '',
    note: '',
  })
  const [sellSuccess, setSellSuccess] = useState<{ open: boolean; tx: TransactionDto | null }>({
    open: false,
    tx: null,
  })
  const [flexTx, setFlexTx] = useState<TransactionDto | null>(null)
  const [flexOpen, setFlexOpen] = useState(false)
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
  const [costDialog, setCostDialog] = useState<{ open: boolean; item: InventoryItem | null }>({
    open: false,
    item: null,
  })
  const [costValue, setCostValue] = useState('')
  const [detailsItem, setDetailsItem] = useState<InventoryItem | null>(null)

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  const openSell = useCallback((item: InventoryItem) => {
    setSellDialog({ open: true, item })
    setSellQty(item.quantity.toString())
    setSellPrice('')
    setSellShipping('')
    setSellDate(new Date().toISOString().split('T')[0])
    setSellNote('')
  }, [])

  const closeSell = () => {
    setSellDialog({ open: false, item: null })
  }

  const closeSellSuccess = () => {
    setSellSuccess({ open: false, tx: null })
  }

  const openFlexFromSuccess = () => {
    if (!sellSuccess.tx) return
    setFlexTx(sellSuccess.tx)
    setFlexOpen(true)
    closeSellSuccess()
  }

  const closeFlex = () => {
    setFlexOpen(false)
    setFlexTx(null)
  }

  const openRemove = useCallback((item: InventoryItem) => {
    setRemoveDialog({ open: true, item })
    setRemoveQty('1')
  }, [])

  const closeRemove = () => {
    setRemoveDialog({ open: false, item: null })
  }

  const openAdd = useCallback((item: InventoryItem | null = null) => {
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
      language: 'EN',
      condition: '',
    })
    setAddQty('1')
    setAddPrice('')
    setAddDate(new Date().toISOString().split('T')[0])
    setAddNote('stock in')
    if (addImagePreview) {
      URL.revokeObjectURL(addImagePreview)
    }
    setAddImage(null)
    setAddImagePreview(null)
  }, [addImagePreview])

  const closeAdd = () => {
    setAddDialog({ open: false, item: null })
    if (addImagePreview) {
      URL.revokeObjectURL(addImagePreview)
    }
    setAddImage(null)
    setAddImagePreview(null)
  }

  const openCost = useCallback((item: InventoryItem) => {
    setCostDialog({ open: true, item })
    setCostValue(String(item.averageCost))
  }, [])

  const closeCost = () => {
    setCostDialog({ open: false, item: null })
    setCostValue('')
  }

  const handleCost = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = costDialog.item
    if (!item || isSubmitting) return

    const newCost = Number(costValue)
    if (Number.isNaN(newCost) || newCost < 0) return

    setIsSubmitting(true)
    const res = await fetch(`/api/inventory/${item.cardId}/cost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newAverageCost: newCost }),
    })

    if (res.ok) {
      closeCost()
      mutateInventory(
        (current) => optimisticCost(current ?? inventoryData ?? { items: [], summary: emptySummary }, item, newCost),
        false
      )
      mutateInventory()
    }
    setIsSubmitting(false)
  }

  const handleSell = (e: React.FormEvent) => {
    e.preventDefault()
    const item = sellDialog.item
    if (!item) return

    const qty = Number(sellQty)
    const price = Number(sellPrice)
    const shipping = Number(sellShipping || 0)
    if (!qty || qty <= 0 || qty > item.quantity || price <= 0 || shipping < 0) return

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
      const tx: TransactionDto = await res.json()
      setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })
      closeSell()
      mutateInventory(
        (current) =>
          optimisticSell(current ?? inventoryData ?? { items: [], summary: emptySummary }, item, qty, price, shipping),
        false
      )
      mutateInventory()
      toast({
        variant: 'success',
        title: t('inventory.toast.sold'),
        description: item.cardName,
      })
      setSellSuccess({ open: true, tx })
    } else {
      const err = await res.json().catch(() => ({}))
      setSellConfirm({ open: false, item: null, qty: 0, price: 0, shipping: 0, date: '', note: '' })
      closeSell()
      toast({
        variant: 'error',
        title: t('inventory.toast.sellFailed'),
        description: err.error || 'Please check the quantity and try again.',
      })
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
      mutateInventory(
        (current) => optimisticRemove(current ?? inventoryData ?? { items: [], summary: emptySummary }, item, qty),
        false
      )
      mutateInventory()
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
    let newCard: CardDto | null = null

    if (isSubmitting) return
    setIsSubmitting(true)

    if (isNewCard) {
      const formData = new FormData()
      formData.append('name', addCard.name)
      if (addCard.setCode) formData.append('setCode', addCard.setCode)
      if (addCard.cardNumber) formData.append('cardNumber', addCard.cardNumber)
      if (addCard.rarity) formData.append('rarity', addCard.rarity)
      formData.append('cardType', addCard.cardType)
      formData.append('game', addCard.game)
      formData.append('language', addCard.language)
      if (addCard.condition) formData.append('condition', addCard.condition)
      if (addImage) formData.append('image', addImage)

      const res = await fetch('/api/cards', {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        setIsSubmitting(false)
        return
      }
      const created = await res.json()
      newCard = created
      cardId = created.id
      mutateCards()
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
      mutateInventory(
        (current) => {
          const base = current ?? inventoryData ?? { items: [], summary: emptySummary }
          const existing = base.items.find((i) => i.cardId === cardId)
          if (existing) {
            return optimisticBuy(base, existing, qty, price)
          }
          if (isNewCard && newCard) {
            return optimisticNewCard(base, newCard, qty, price)
          }
          const card = cards.find((c) => c.id === cardId)
          if (card) {
            return optimisticNewCard(base, card, qty, price)
          }
          return base
        },
        false
      )
      mutateInventory()
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

  const updateCurrentValue = useCallback(async (cardId: string, value: string) => {
    const num = Number(value)
    if (Number.isNaN(num) || num < 0) return

    const item = inventoryData?.items.find((i) => i.cardId === cardId)

    const res = await fetch(`/api/inventory/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentValue: num }),
    })

    if (res.ok) {
      setEditingValue(null)
      if (item) {
        mutateInventory(
          (current) =>
            optimisticCurrentValue(current ?? inventoryData ?? { items: [], summary: emptySummary }, item, num),
          false
        )
      }
      mutateInventory()
    }
  }, [mutateInventory, inventoryData, emptySummary])

  const renderInventoryCard = useCallback(
    (item: InventoryItem) => (
      <InventoryGridCard
        item={item}
        onOpenDetails={setDetailsItem}
        editing={editingValue?.cardId === item.cardId}
        onEdit={() => setEditingValue({ cardId: item.cardId, value: String(item.marketValuePerUnit) })}
        onUpdateValue={(value) => updateCurrentValue(item.cardId, value)}
      />
    ),
    [editingValue, updateCurrentValue]
  )

  const sellTotal = useMemo(() => {
    const qty = Number(sellQty || 0)
    const price = Number(sellPrice || 0)
    const shipping = Number(sellShipping || 0)
    return qty * price + shipping
  }, [sellQty, sellPrice, sellShipping])

  const items = useMemo(() => data.items ?? [], [data.items])

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
      case 'userOrder':
        return list.sort((a, b) => {
          if (a.order === null && b.order === null) return 0
          if (a.order === null) return 1
          if (b.order === null) return -1
          return a.order - b.order
        })
      case 'value_desc':
        return list.sort((a, b) => b.currentValue - a.currentValue)
      case 'value_asc':
        return list.sort((a, b) => a.currentValue - b.currentValue)
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

  const summary = useMemo(() => data.summary, [data.summary])

  const changeSortBy = useCallback((value: SortBy) => {
    if (value !== 'userOrder') setReorderDraft(null)
    setSortBy(value)
  }, [])

  const startReorder = useCallback(() => {
    setReorderDraft(data.items)
  }, [data.items])

  const cancelReorder = useCallback(() => {
    setReorderDraft(null)
  }, [])

  const saveReorder = useCallback(async () => {
    if (!reorderDraft) return
    const orders: Record<string, number> = {}
    reorderDraft.forEach((item, i) => {
      orders[item.cardId] = i
    })
    await fetch('/api/inventory/order', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    })
    mutateInventory((current) => (current ? { ...current, items: reorderDraft } : current), false)
    mutateInventory()
    setReorderDraft(null)
  }, [reorderDraft, mutateInventory])

  const handleReorder = useCallback(
    (newSortedItems: InventoryItem[]) => {
      if (!reorderDraft) return
      const visibleIds = new Set(newSortedItems.map((i) => i.cardId))
      const sortedIterator = [...newSortedItems]
      let idx = 0
      const combined = reorderDraft.map((item) => {
        if (visibleIds.has(item.cardId)) {
          return sortedIterator[idx++]
        }
        return item
      })
      setReorderDraft(combined)
    },
    [reorderDraft]
  )

  if (inventoryLoading && !inventoryData) {
    return <InventorySkeleton />
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
      color: 'text-lime-500',
      note: t('common.quantity'),
    },
    {
      label: t('inventory.grading'),
      value: summary.grading,
      icon: Gem,
      color: 'text-orange-600',
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
      value: summary.totalValue,
      icon: Wallet,
      color: 'text-zinc-200',
      isCurrency: true,
    },
    {
      label: t('inventory.totalProfit'),
      value: summary.totalProfit,
      icon: TrendingUp,
      color: (summary?.totalProfit ?? 0) >= 0 ? 'text-lime-500' : 'text-red-400',
      isCurrency: true,
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card className="relative h-28 overflow-hidden border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/70">
                <div className="grid h-full grid-rows-[auto_1fr_auto] gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</span>
                    <Icon className={cn('h-4 w-4 shrink-0 opacity-60', s.color)} />
                  </div>
                  <div className="flex min-w-0 items-center">
                    {s.isCurrency ? (
                      <AnimatedCurrency value={s.value as number} className={cn('block truncate font-mono text-xl font-bold sm:text-2xl', s.color)} />
                    ) : (
                      <AnimatedNumber value={s.value as number} className={cn('block truncate font-mono text-xl font-bold sm:text-2xl', s.color)} />
                    )}
                  </div>
                  <div className={cn('font-mono text-[10px]', s.note ? 'text-zinc-600' : 'invisible')}>{s.note || '–'}</div>
                </div>
              </Card>
            </motion.div>
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
        <CardContent className={cn('space-y-4', !showFilters ? 'hidden md:block' : '')}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder={t('inventory.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.status')}</label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full">
                <option value="">{t('inventory.allStatus')}</option>
                <option value="in_stock">{t('common.inStock')}</option>
                <option value="grading">{t('common.grading')}</option>
                <option value="sold_out">{t('common.soldOut')}</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.type')}</label>
              <Select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full">
                <option value="">{t('inventory.allTypes')}</option>
                {CARD_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.game')}</label>
              <Select value={game} onChange={(e) => setGame(e.target.value)} className="w-full">
                <option value="">{t('inventory.allGames')}</option>
                {GAMES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('inventory.format.label')}</label>
              <Select value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as typeof formatFilter)} className="w-full">
                <option value="all">{t('common.all')}</option>
                <option value="raw">{t('inventory.format.raw')}</option>
                <option value="slab">{t('inventory.format.slab')}</option>
                <option value="sealed">{t('inventory.format.sealed')}</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('inventory.year')}</label>
              <Select value={year} onChange={(e) => setYear(e.target.value)} className="w-full">
                <option value="">{t('inventory.allYears')}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('inventory.month')}</label>
              <Select value={month} onChange={(e) => setMonth(e.target.value)} className="w-full">
                <option value="">{t('inventory.allMonths')}</option>
                {months.map((m) => (
                  <option key={m} value={m}>{m.padStart(2, '0')}</option>
                ))}
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.sort')}</label>
              <Select value={sortBy} onChange={(e) => changeSortBy(e.target.value as SortBy)} className="w-full">
                <option value="userOrder">{t('inventory.sortLabel.userOrder')}</option>
                <option value="value_desc">{t('inventory.sortLabel.value_desc')}</option>
                <option value="value_asc">{t('inventory.sortLabel.value_asc')}</option>
                <option value="lastTransaction_desc">{t('inventory.sortLabel.lastTransaction_desc')}</option>
                <option value="createdAt_desc">{t('inventory.sortLabel.createdAt_desc')}</option>
                <option value="createdAt_asc">{t('inventory.sortLabel.createdAt_asc')}</option>
                <option value="name_asc">{t('inventory.sortLabel.name_asc')}</option>
                <option value="name_desc">{t('inventory.sortLabel.name_desc')}</option>
                <option value="quantity_desc">{t('inventory.sortLabel.quantity_desc')}</option>
                <option value="quantity_asc">{t('inventory.sortLabel.quantity_asc')}</option>
              </Select>
            </div>
          </div>

          {[search, statusFilter, cardType, game, year, month, formatFilter !== 'all' ? 'x' : ''].some(Boolean) && (
            <div className="flex flex-wrap items-center gap-2">
              {search && <FilterChip label={`${t('inventory.search')}: ${search}`} onRemove={() => setSearch('')} />}
              {statusFilter && (
                <FilterChip
                  label={`${t('common.status')}: ${statusFilter === 'in_stock' ? t('common.inStock') : statusFilter === 'grading' ? t('common.grading') : t('common.soldOut')}`}
                  onRemove={() => setStatusFilter('')}
                />
              )}
              {cardType && <FilterChip label={`${t('common.type')}: ${cardType}`} onRemove={() => setCardType('')} />}
              {game && <FilterChip label={`${t('common.game')}: ${game}`} onRemove={() => setGame('')} />}
              {formatFilter !== 'all' && <FilterChip label={`${t('inventory.format.label')}: ${formatLabel(formatFilter)}`} onRemove={() => setFormatFilter('all')} />}
              {year && <FilterChip label={`${t('inventory.year')}: ${year}`} onRemove={() => setYear('')} />}
              {month && <FilterChip label={`${t('inventory.month')}: ${month.padStart(2, '0')}`} onRemove={() => setMonth('')} />}
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
                  changeSortBy('userOrder')
                }}
                className="font-mono text-xs"
              >
                {t('common.clearFilters')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                        ? 'bg-lime-600 text-zinc-950 shadow'
                        : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <div className="flex shrink-0 items-center rounded-lg border border-zinc-700 bg-zinc-950 p-1 shadow-sm">
              <Tooltip content={t('inventory.listView')} side="bottom">
                <button
                  type="button"
                  aria-label={t('inventory.listView')}
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-md px-3 font-mono text-xs font-medium transition-all',
                    viewMode === 'list'
                      ? 'bg-lime-600 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  <LayoutList className="h-4 w-4" /> <span className="hidden sm:inline">{t('common.list')}</span>
                </button>
              </Tooltip>
              <Tooltip content={t('inventory.gridView')} side="bottom">
                <button
                  type="button"
                  aria-label={t('inventory.gridView')}
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex h-8 items-center gap-2 rounded-md px-3 font-mono text-xs font-medium transition-all',
                    viewMode === 'grid'
                      ? 'bg-lime-600 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  )}
                >
                  <LayoutGrid className="h-4 w-4" /> <span className="hidden sm:inline">{t('common.grid')}</span>
                </button>
              </Tooltip>
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
                      <th className="pb-2 pr-4">{t('common.language')}</th>
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
                            <span className={cn('font-medium', item.status === 'grading' ? 'text-orange-600' : 'text-zinc-200')}>
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
                          <LanguageBadge language={item.language} />
                        </td>
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
                              <span className="text-orange-600">{t('inventory.soldOn', { date: formatDate(item.soldAt) })}</span>
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
                            <span className={item.profit >= 0 ? 'text-lime-500' : 'text-red-400'}>
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
                                <Tooltip content={t('common.add')} side="left">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={t('common.add')}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openAdd(item)
                                    }}
                                    className="h-7 w-7 shrink-0 border-lime-600/30 text-lime-500 hover:bg-lime-600/10 hover:text-lime-500"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content={t('common.remove')} side="left">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={t('common.remove')}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openRemove(item)
                                    }}
                                    className="h-7 w-7 shrink-0 border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </Button>
                                </Tooltip>
                                <Tooltip content={t('common.sendToGrade')} side="left">
                                  <Link href={`/grading/send?cardId=${item.cardId}`} aria-label={t('common.sendToGrade')}>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      aria-label={t('common.sendToGrade')}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-7 w-7 shrink-0 border-orange-700/30 text-orange-600 hover:bg-orange-700/10 hover:text-orange-600"
                                    >
                                      <Gem className="h-3.5 w-3.5" />
                                    </Button>
                                  </Link>
                                </Tooltip>
                                <Tooltip content={t('inventory.editCost')} side="left">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label={t('inventory.editCost')}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      openCost(item)
                                    }}
                                    className="h-7 w-7 shrink-0 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-400"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </Tooltip>
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
                          <div className={cn('truncate font-mono font-medium text-sm', item.status === 'grading' ? 'text-orange-600' : 'text-zinc-200')}>
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
                          <LanguageBadge language={item.language} />
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
                        <span className={item.profit >= 0 ? 'min-w-0 break-words text-right text-lime-500' : 'min-w-0 break-words text-right text-red-400'}>
                          {formatCurrency(item.profit)}
                        </span>
                      </div>

                      {item.status === 'in_stock' && item.quantity > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            className="h-7 flex-1 gap-1 bg-lime-700 text-[10px] text-white hover:bg-lime-800"
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
                          <Link href={`/grading/send?cardId=${item.cardId}`} aria-label={t('common.sendToGrade')}>
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={t('common.sendToGrade')}
                              className="h-7 px-2 text-orange-600 hover:bg-orange-700/10 hover:text-orange-600"
                            >
                              <Gem className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            aria-label={t('inventory.editCost')}
                            className="h-7 px-2 text-blue-400 hover:bg-blue-500/10 hover:text-blue-400"
                            onClick={() => openCost(item)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
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

          {viewMode === 'grid' && sortBy === 'userOrder' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-xs text-zinc-500">
                  {reorderDraft ? t('inventory.reorderingHint') : t('inventory.dragToReorder')}
                </div>
                {!reorderDraft ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startReorder}
                    className="gap-1 font-mono text-xs"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                    {t('inventory.editOrder')}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelReorder}
                      className="gap-1 font-mono text-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      {t('inventory.cancelOrder')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveReorder}
                      className="gap-1 font-mono text-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {t('inventory.saveOrder')}
                    </Button>
                  </div>
                )}
              </div>
              <SortableInventoryGrid
                items={reorderDraft ?? sortedItems}
                onReorder={handleReorder}
                renderItem={renderInventoryCard}
                disabled={!reorderDraft}
              />
            </div>
          )}

          {viewMode === 'grid' && sortBy !== 'userOrder' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-4 auto-rows-[1fr] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
            >
              {sortedItems.map((item) => (
                <div key={item.cardId}>{renderInventoryCard(item)}</div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Dialog open={sellDialog.open} onOpenChange={closeSell}>
        <form onSubmit={handleSell}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-lime-500" />
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
              <Plus className="h-4 w-4 text-lime-500" />
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
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="font-mono text-xs text-zinc-400">{t('common.language')}</label>
                        <Select
                          value={addCard.language}
                          onChange={(e) => setAddCard({ ...addCard, language: e.target.value })}
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.add.image')}</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        aria-label={t('inventory.dialog.add.image')}
                        onChange={async (e) => {
                          const file = e.target.files?.[0] || null
                          if (addImagePreview) {
                            URL.revokeObjectURL(addImagePreview)
                            setAddImagePreview(null)
                          }
                          if (!file) {
                            setAddImage(null)
                            return
                          }
                          const validation = validateImageFile(file)
                          if (!validation.valid) {
                            toast({ title: validation.error ?? t('common.error'), variant: 'error' })
                            setAddImage(null)
                            return
                          }
                          try {
                            const compressed = await compressImage(file, { maxWidth: 1280, quality: 0.85 })
                            setAddImage(compressed)
                            setAddImagePreview(URL.createObjectURL(compressed))
                          } catch (err) {
                            toast({
                              title: err instanceof Error ? err.message : t('common.error'),
                              variant: 'error',
                            })
                            setAddImage(null)
                          }
                        }}
                        className="block w-full font-mono text-xs text-zinc-400 file:mr-3 file:rounded file:border-0 file:bg-lime-600 file:px-3 file:py-1.5 file:text-white"
                      />
                      {addImagePreview && (
                        <div className="relative aspect-[488/680] w-24 overflow-hidden rounded-lg border border-zinc-800">
                          <img src={addImagePreview} alt="preview" className="h-full w-full object-cover" />
                        </div>
                      )}
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
            <Tag className="h-4 w-4 text-lime-500" />
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

      <Dialog open={sellSuccess.open} onOpenChange={(v) => !v && closeSellSuccess()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-lg">
            <PackageCheck className="h-5 w-5 text-lime-500" />
            {t('inventory.dialog.sell.successTitle')}
          </DialogTitle>
          <DialogDescription>{t('inventory.dialog.sell.successDescription')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Button type="button" variant="outline" size="sm" onClick={closeSellSuccess}>
            {t('common.close')}
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-lime-700 text-white shadow-[0_0_12px_rgba(101,163,13,0.25)] transition-all hover:bg-lime-800 hover:shadow-[0_0_18px_rgba(101,163,13,0.4)]"
            onClick={openFlexFromSuccess}
          >
            <Zap className="h-4 w-4" />
            {t('inventory.dialog.sell.createFlex')}
          </Button>
        </div>
      </Dialog>

      <FlexCardDialog
        tx={flexTx}
        open={flexOpen}
        onOpenChange={(v) => !v && closeFlex()}
        userName={session?.user?.name}
      />

      <Dialog open={addConfirm.open} onOpenChange={() => {
        setIsSubmitting(false)
        setAddConfirm({ open: false, cardName: '', qty: 0, price: 0, date: '', note: '', cardId: '', isNewCard: false })
      }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-lime-500" />
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
          {addConfirm.isNewCard && (
            <div className="flex justify-between border-b border-zinc-800 pb-2">
              <span className="text-zinc-500">{t('common.language')}</span>
              <span className="text-zinc-200">{addCard.language}</span>
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

      <Dialog open={costDialog.open} onOpenChange={closeCost}>
        <form onSubmit={handleCost}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4 text-blue-400" />
              {t('inventory.dialog.cost.title')} {costDialog.item?.cardName}
            </DialogTitle>
            <DialogDescription>{t('inventory.dialog.cost.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('inventory.table.qty')}</label>
                <Input type="number" value={costDialog.item?.quantity ?? 0} disabled className="text-zinc-500" />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.cost.currentAvgCost')}</label>
                <Input
                  type="text"
                  value={formatCurrency(costDialog.item?.averageCost ?? 0)}
                  disabled
                  className="text-zinc-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('inventory.dialog.cost.newAvgCost')}</label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
                placeholder="0.00"
                required
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeCost}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" className="gap-2" disabled={isSubmitting}>
              <Pencil className="h-3.5 w-3.5" />
              {t('inventory.dialog.cost.save')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      <InventoryDetailsDialog
        key={detailsItem?.cardId ?? 'empty'}
        item={detailsItem}
        open={!!detailsItem}
        onClose={() => setDetailsItem(null)}
        onSell={openSell}
        onAdd={openAdd}
        onRemove={openRemove}
        onEditCost={openCost}
        onUpdateValue={updateCurrentValue}
      />
    </div>
  )
}
