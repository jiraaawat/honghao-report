'use client'

import { useEffect, useState, useMemo } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Package, Plus, Heart, X, Eye, Library, Layers, Gem, Palette, Coins, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CatalogCardDto, CatalogSetDto, CARD_TYPES, CARD_CONDITIONS, GAMES, LANGUAGES, WishlistItemDto } from '@/types'
import { useLanguage } from '@/lib/i18n/provider'
import { useToast } from '@/components/providers/toast-provider'
import { fetcher, swrOptions } from '@/lib/swr'
import { formatUsdToThb, usdToThb, cn } from '@/lib/utils'

const PAGE_SIZE = 24

type FilterOptions = {
  colors: string[]
  types: string[]
  rarities: string[]
  sources: string[]
}

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

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-xs text-zinc-300">
      {label}
      <button type="button" onClick={onRemove} className="text-zinc-500 hover:text-zinc-200" aria-label="Remove filter">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

export default function CardsPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const { mutate } = useSWRConfig()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedGame, setSelectedGame] = useState('OnePiece')
  const [setId, setSetId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [rarityFilter, setRarityFilter] = useState('')
  const [colorFilter, setColorFilter] = useState('')
  const [minCost, setMinCost] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [minPower, setMinPower] = useState('')
  const [maxPower, setMaxPower] = useState('')
  const [minLife, setMinLife] = useState('')
  const [maxLife, setMaxLife] = useState('')
  const [page, setPage] = useState(1)

  const [addDialog, setAddDialog] = useState<{ open: boolean; card: CatalogCardDto | null }>({
    open: false,
    card: null,
  })
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; card: CatalogCardDto | null }>({
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
    if (typeFilter) params.set('type', typeFilter)
    if (rarityFilter) params.set('rarity', rarityFilter)
    if (colorFilter) params.set('color', colorFilter)
    params.set('game', selectedGame)
    if (minCost) params.set('minCost', minCost)
    if (maxCost) params.set('maxCost', maxCost)
    if (minPower) params.set('minPower', minPower)
    if (maxPower) params.set('maxPower', maxPower)
    if (minLife) params.set('minLife', minLife)
    if (maxLife) params.set('maxLife', maxLife)
    params.set('page', page.toString())
    params.set('limit', PAGE_SIZE.toString())
    return params
  }, [debouncedSearch, selectedGame, setId, typeFilter, rarityFilter, colorFilter, minCost, maxCost, minPower, maxPower, minLife, maxLife, page])

  const catalogKey = `/api/catalog/cards?${catalogParams.toString()}`
  const { data: catalogData, isLoading: catalogLoading } = useSWR<{
    items: CatalogCardDto[]
    pagination: { pages: number }
  }>(catalogKey, fetcher, swrOptions)
  const { data: setsData } = useSWR<CatalogSetDto[]>(`/api/catalog/sets?game=${selectedGame}`, fetcher, swrOptions)
  const { data: filterOptionsData } = useSWR<FilterOptions>(`/api/catalog/filters?game=${selectedGame}`, fetcher, swrOptions)
  const { data: wishlistData, mutate: mutateWishlist } = useSWR<WishlistItemDto[]>('/api/wishlist', fetcher, swrOptions)

  const items = catalogData?.items ?? []
  const totalPages = catalogData?.pagination?.pages ?? 1
  const sets = setsData ?? []
  const filterOptions = filterOptionsData ?? { colors: [], types: [], rarities: [], sources: [] }
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
      game: selectedGame,
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

  const openDetail = (card: CatalogCardDto) => {
    setDetailDialog({ open: true, card })
  }

  const closeDetail = () => {
    setDetailDialog({ open: false, card: null })
  }

  const handleAddFromDetail = (card: CatalogCardDto) => {
    closeDetail()
    openAdd(card)
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
        toast({
          variant: 'success',
          title: t('inventory.toast.cardAdded'),
          description: card.name,
        })
        mutate((key) => typeof key === 'string' && key.startsWith('/api/inventory'), undefined, { revalidate: true })
      } else {
        const err = await res.json().catch(() => ({}))
        toast({
          variant: 'error',
          title: t('inventory.toast.addFailed'),
          description: err.error || 'Failed to add card',
        })
      }
    } catch {
      toast({
        variant: 'error',
        title: t('inventory.toast.addFailed'),
        description: 'Failed to add card',
      })
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

  const hasFilters =
    search ||
    setId ||
    typeFilter ||
    rarityFilter ||
    colorFilter ||
    minCost ||
    maxCost ||
    minPower ||
    maxPower ||
    minLife ||
    maxLife

  const clearFilters = () => {
    setSearch('')
    setSetId('')
    setTypeFilter('')
    setRarityFilter('')
    setColorFilter('')
    setMinCost('')
    setMaxCost('')
    setMinPower('')
    setMaxPower('')
    setMinLife('')
    setMaxLife('')
    setPage(1)
  }

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
        <p className="mt-1 font-mono text-[10px] text-orange-600">{t('cards.testDataNote')}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {GAMES.map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => {
                clearFilters()
                setSelectedGame(game)
              }}
              className={cn(
                'rounded-md border px-3 py-1 font-mono text-xs transition-colors',
                selectedGame === game
                  ? 'border-lime-600/50 bg-lime-600/10 text-lime-500'
                  : 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              )}
            >
              {game}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
          <CardContent className="space-y-4 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t('cards.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Library className="h-3 w-3" /> {t('cards.set')}</label>
                <Select
                  value={setId}
                  onChange={(e) => {
                    setSetId(e.target.value)
                    setPage(1)
                  }}
                  className="w-full"
                >
                  <option value="">{t('cards.allSets')}</option>
                  {sets.map((s) => (
                    <option key={s.setId} value={s.setId}>
                      {s.setId} {s.setName ? `- ${s.setName}` : ''}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Layers className="h-3 w-3" /> {t('cards.type')}</label>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full">
                  <option value="">{t('cards.allTypes')}</option>
                  {filterOptions.types.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Gem className="h-3 w-3" /> {t('cards.rarity')}</label>
                <Select value={rarityFilter} onChange={(e) => setRarityFilter(e.target.value)} className="w-full">
                  <option value="">{t('cards.allRarities')}</option>
                  {filterOptions.rarities.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Palette className="h-3 w-3" /> {t('cards.color')}</label>
                <Select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className="w-full">
                  <option value="">{t('cards.allColors')}</option>
                  {filterOptions.colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Coins className="h-3 w-3" /> {t('cards.cost')}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.min')}
                    value={minCost}
                    onChange={(e) => setMinCost(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.max')}
                    value={maxCost}
                    onChange={(e) => setMaxCost(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Zap className="h-3 w-3" /> {t('cards.power')}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.min')}
                    value={minPower}
                    onChange={(e) => setMinPower(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.max')}
                    value={maxPower}
                    onChange={(e) => setMaxPower(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500"><Heart className="h-3 w-3" /> {t('cards.life')}</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.min')}
                    value={minLife}
                    onChange={(e) => setMinLife(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder={t('cards.max')}
                    value={maxLife}
                    onChange={(e) => setMaxLife(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {hasFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {search && <FilterChip label={`${t('cards.search')}: ${search}`} onRemove={() => setSearch('')} />}
                {setId && <FilterChip label={`${t('cards.set')}: ${setId}`} onRemove={() => setSetId('')} />}
                {typeFilter && <FilterChip label={`${t('cards.type')}: ${typeFilter}`} onRemove={() => setTypeFilter('')} />}
                {rarityFilter && <FilterChip label={`${t('cards.rarity')}: ${rarityFilter}`} onRemove={() => setRarityFilter('')} />}
                {colorFilter && <FilterChip label={`${t('cards.color')}: ${colorFilter}`} onRemove={() => setColorFilter('')} />}
                {minCost && <FilterChip label={`${t('cards.minCost')}: ${minCost}`} onRemove={() => setMinCost('')} />}
                {maxCost && <FilterChip label={`${t('cards.maxCost')}: ${maxCost}`} onRemove={() => setMaxCost('')} />}
                {minPower && <FilterChip label={`${t('cards.minPower')}: ${minPower}`} onRemove={() => setMinPower('')} />}
                {maxPower && <FilterChip label={`${t('cards.maxPower')}: ${maxPower}`} onRemove={() => setMaxPower('')} />}
                {minLife && <FilterChip label={`${t('cards.minLife')}: ${minLife}`} onRemove={() => setMinLife('')} />}
                {maxLife && <FilterChip label={`${t('cards.maxLife')}: ${maxLife}`} onRemove={() => setMaxLife('')} />}
                <Button variant="ghost" size="sm" onClick={clearFilters} className="font-mono text-xs">
                  {t('common.clearFilters')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {selectedGame !== 'OnePiece' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-16 text-center"
        >
          <Package className="mb-3 h-8 w-8 text-zinc-600" />
          <p className="font-mono text-sm text-zinc-400">{t('cards.gameNotAvailable')}</p>
        </motion.div>
      ) : catalogLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-[488/680] w-full animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
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
            {items.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                onClick={() => openDetail(card)}
                className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
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
                      <p className="font-mono text-xs font-medium text-lime-500">
                        {formatUsdToThb(Number(card.marketPrice))}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Tooltip content={t('wishlist.add')} side="top">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleWishlist(card)
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlistItems.some((w) => w.catalogCardId === card.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-zinc-500'
                        }`}
                      />
                    </Button>
                  </Tooltip>
                  <Button
                    size="sm"
                    className="h-8 flex-1 gap-1 text-xs bg-lime-700 text-white shadow-sm transition-all hover:bg-lime-800 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    onClick={(e) => {
                      e.stopPropagation()
                      openAdd(card)
                    }}
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
                  <span className="ml-1 text-lime-500">
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

      <Dialog open={detailDialog.open} onOpenChange={closeDetail}>
        {detailDialog.card && (
          <>
            <DialogHeader>
              <DialogTitle className="font-mono text-base">{detailDialog.card.name}</DialogTitle>
              <DialogDescription>
                {[detailDialog.card.cardNo, detailDialog.card.setName, detailDialog.card.rarity].filter(Boolean).join(' · ')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative mx-auto aspect-[488/680] w-full max-w-[14rem] overflow-hidden rounded-lg bg-zinc-950">
                {detailDialog.card.imagePath ? (
                  <Image
                    src={detailDialog.card.imagePath}
                    alt={detailDialog.card.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-600">
                    {t('inventoryGridCard.noImage')}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {detailDialog.card.type && (
                  <Badge variant="outline" className="text-[10px]">
                    {detailDialog.card.type}
                  </Badge>
                )}
                {detailDialog.card.color && (
                  <Badge variant="outline" className="text-[10px]">
                    {detailDialog.card.color}
                  </Badge>
                )}
                {detailDialog.card.rarity && (
                  <Badge variant="outline" className="text-[10px]">
                    {detailDialog.card.rarity}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
                {detailDialog.card.cost !== null && detailDialog.card.cost !== undefined && (
                  <div className="rounded-md bg-zinc-950/50 p-2 text-center">
                    <div className="text-zinc-500">{t('cards.cost')}</div>
                    <div className="text-zinc-200">{detailDialog.card.cost}</div>
                  </div>
                )}
                {detailDialog.card.cardPower !== null && detailDialog.card.cardPower !== undefined && (
                  <div className="rounded-md bg-zinc-950/50 p-2 text-center">
                    <div className="text-zinc-500">{t('cards.power')}</div>
                    <div className="text-zinc-200">{detailDialog.card.cardPower}</div>
                  </div>
                )}
                {detailDialog.card.life !== null && detailDialog.card.life !== undefined && (
                  <div className="rounded-md bg-zinc-950/50 p-2 text-center">
                    <div className="text-zinc-500">{t('cards.life')}</div>
                    <div className="text-zinc-200">{detailDialog.card.life}</div>
                  </div>
                )}
              </div>

              {detailDialog.card.subTypes && (
                <div className="text-center font-mono text-xs text-zinc-400">
                  {t('cards.subTypes')}: {detailDialog.card.subTypes}
                </div>
              )}

              {detailDialog.card.effectText && (
                <div className="max-h-40 overflow-auto rounded-md border border-zinc-800 bg-zinc-950/50 p-3 font-mono text-xs leading-relaxed text-zinc-300">
                  {detailDialog.card.effectText}
                </div>
              )}

              <div className="flex items-center justify-between gap-2 rounded-md border border-zinc-800 bg-zinc-950/50 p-3 font-mono text-xs">
                <span className="text-zinc-500">{t('cards.marketPrice')}</span>
                <span className="text-lime-500">
                  {detailDialog.card.marketPrice
                    ? formatUsdToThb(Number(detailDialog.card.marketPrice))
                    : '-'}
                </span>
              </div>
            </div>

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  closeDetail()
                  toggleWishlist(detailDialog.card!)
                }}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${
                    wishlistItems.some((w) => w.catalogCardId === detailDialog.card!.id)
                      ? 'fill-red-500 text-red-500'
                      : ''
                  }`}
                />
                {t('wishlist.add')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1 bg-lime-700 text-white hover:bg-lime-800"
                onClick={() => detailDialog.card && handleAddFromDetail(detailDialog.card)}
              >
                <Plus className="h-3.5 w-3.5" /> {t('cards.addToInventory')}
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  )
}
