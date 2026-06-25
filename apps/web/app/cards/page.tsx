'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Package, Plus, Heart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CatalogCardDto, CatalogSetDto, CARD_TYPES, CARD_CONDITIONS, GAMES, LANGUAGES, WishlistItemDto } from '@/types'
import { useLanguage } from '@/lib/i18n/provider'
import { fetcher, swrOptions } from '@/lib/swr'
import { formatUsdToThb, usdToThb } from '@/lib/utils'

const PAGE_SIZE = 24

const CARD_TYPE_OPTIONS = ['All', 'Leader', 'Character', 'Event', 'Stage', 'DON!!']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' as const },
  },
}

export default function CardsPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [setId, setSetId] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [page, setPage] = useState(1)

  const [addDialog, setAddDialog] = useState<{ open: boolean; card: CatalogCardDto | null }>({
    open: false,
    card: null,
  })
  const [addForm, setAddForm] = useState({
    cardType: 'Single',
    condition: 'NM',
    game: 'OnePiece',
    language: 'EN',
    quantity: '1',
    pricePerUnit: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [adding, setAdding] = useState(false)

  const catalogParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (setId) params.set('setId', setId)
    params.set('page', page.toString())
    params.set('limit', PAGE_SIZE.toString())
    return params
  }, [debouncedSearch, setId, page])

  const catalogKey = `/api/catalog/cards?${catalogParams.toString()}`
  const { data: catalogData, isLoading: catalogLoading } = useSWR<{
    items: CatalogCardDto[]
    pagination: { pages: number }
  }>(catalogKey, fetcher, swrOptions)
  const { data: setsData } = useSWR<CatalogSetDto[]>('/api/catalog/sets', fetcher, swrOptions)
  const { data: wishlistData, mutate: mutateWishlist } = useSWR<WishlistItemDto[]>('/api/wishlist', fetcher, swrOptions)

  const items = catalogData?.items ?? []
  const totalPages = catalogData?.pagination?.pages ?? 1
  const sets = setsData ?? []
  const wishlistItems = wishlistData ?? []

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const toggleWishlist = async (card: CatalogCardDto) => {
    const existing = wishlistItems.find(
      (w) => w.catalogCardId === card.id && w.language === addForm.language
    )
    if (existing) {
      const res = await fetch(`/api/wishlist/${existing.id}`, { method: 'DELETE' })
      if (res.ok) {
        await mutateWishlist()
      }
      return
    }

    const res = await fetch('/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogCardId: card.id,
        name: card.name,
        cardNo: card.cardNo,
        setCode: card.setId,
        setName: card.setName,
        imageUrl: card.imagePath,
        language: addForm.language,
        cardType: card.type,
        game: addForm.game,
      }),
    })
    if (res.ok) {
      await mutateWishlist()
    }
  }

  const openAdd = (card: CatalogCardDto) => {
    setAddDialog({ open: true, card })
    setAddForm({
      cardType: 'Single',
      condition: 'NM',
      game: 'OnePiece',
      language: 'EN',
      quantity: '1',
      pricePerUnit: card.marketPrice ? String(usdToThb(Number(card.marketPrice))) : '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
  }

  const closeAdd = () => {
    setAddDialog({ open: false, card: null })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const card = addDialog.card
    if (!card) return

    setAdding(true)
    try {
      const res = await fetch('/api/inventory/add-from-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: card.name,
          cardNo: card.cardNo,
          setCode: card.setId,
          setName: card.setName,
          rarity: card.rarity,
          imagePath: card.imagePath,
          type: card.type,
          cardType: addForm.cardType,
          game: addForm.game,
          language: addForm.language,
          condition: addForm.condition,
          quantity: Number(addForm.quantity),
          pricePerUnit: Number(addForm.pricePerUnit),
          date: addForm.date,
          note: addForm.note,
        }),
      })

      if (res.ok) {
        closeAdd()
        router.push('/inventory')
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Failed to add card')
      }
    } catch {
      alert('Failed to add card')
    } finally {
      setAdding(false)
    }
  }

  if (catalogLoading && !catalogData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="h-10 flex-1 animate-pulse rounded bg-zinc-800" />
          <div className="h-10 w-56 animate-pulse rounded bg-zinc-800" />
          <div className="h-10 w-44 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-[488/680] w-full animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  const visibleItems =
    typeFilter === 'All'
      ? items
      : items.filter((c) => c.type?.toLowerCase() === typeFilter.toLowerCase())

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="font-mono text-xl font-bold text-zinc-100">{t('cards.title')}</h1>
        <p className="font-mono text-xs text-zinc-500">{t('cards.subtitle')}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder={t('cards.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={setId}
          onChange={(e) => {
            setSetId(e.target.value)
            setPage(1)
          }}
          className="sm:w-56"
        >
          <option value="">{t('cards.allSets')}</option>
          {sets.map((s) => (
            <option key={s.setId} value={s.setId}>
              {s.setId} {s.setName ? `- ${s.setName}` : ''}
            </option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-44">
          {CARD_TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
      </motion.div>

      {catalogLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-[488/680] w-full animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center"
        >
          <Package className="mb-3 h-8 w-8 text-zinc-600" />
          <p className="font-mono text-sm text-zinc-400">{t('cards.noCards')}</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
          >
            {visibleItems.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="relative aspect-[488/680] overflow-hidden rounded-lg bg-zinc-950">
                  {card.imagePath ? (
                    <Image
                      src={card.imagePath}
                      alt={card.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-600">
                      {t('inventoryGridCard.noImage')}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-semibold text-zinc-200">{card.name}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">
                    {card.cardNo} · {card.rarity || '-'} · {card.setId || '-'}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    {card.type ? (
                      <Badge variant="outline" className="text-[10px]">
                        {card.type}
                      </Badge>
                    ) : (
                      <span />
                    )}
                    {card.marketPrice ? (
                      <p className="font-mono text-xs font-medium text-emerald-400">
                        {formatUsdToThb(Number(card.marketPrice))}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 p-0"
                    onClick={() => toggleWishlist(card)}
                    title={t('wishlist.add')}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        wishlistItems.some((w) => w.catalogCardId === card.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-zinc-500'
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 flex-1 gap-1 text-xs bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    onClick={() => openAdd(card)}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t('cards.add')}
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between gap-4 pt-6"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              {t('common.previous')}
            </Button>
            <span className="font-mono text-xs text-zinc-400">
              {t('cards.pageOf', { page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              {t('common.next')}
            </Button>
          </motion.div>
        </>
      )}

      <Dialog open={addDialog.open} onOpenChange={closeAdd}>
        <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>{t('cards.addToInventory')}</DialogTitle>
              <DialogDescription>
                {addDialog.card?.name} ({addDialog.card?.cardNo})
                {addDialog.card?.marketPrice ? (
                  <span className="ml-1 text-emerald-400">
                    {t('cards.marketPrice', { price: formatUsdToThb(Number(addDialog.card.marketPrice)) })}
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('cards.category')}</label>
                  <Select
                    value={addForm.cardType}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, cardType: e.target.value }))}
                    required
                  >
                    {CARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('common.game')}</label>
                  <Select
                    value={addForm.game}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, game: e.target.value }))}
                    required
                  >
                    {GAMES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('common.condition')}</label>
                  <Select
                    value={addForm.condition}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, condition: e.target.value }))}
                  >
                    {CARD_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('common.language')}</label>
                  <Select
                    value={addForm.language}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, language: e.target.value }))}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('cards.quantity')}</label>
                  <Input
                    type="number"
                    min={1}
                    value={addForm.quantity}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('cards.pricePerUnit')}</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={addForm.pricePerUnit}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">{t('cards.date')}</label>
                  <Input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">{t('cards.note')}</label>
                <Input
                  value={addForm.note}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder={t('common.optional')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>
                {t('cards.cancel')}
              </Button>
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? t('cards.adding') : t('cards.addToInventory')}
              </Button>
            </DialogFooter>
          </form>
      </Dialog>
    </div>
  )
}
