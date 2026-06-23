'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Package, Plus } from 'lucide-react'
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
import { CatalogCardDto, CatalogSetDto, CARD_TYPES, CARD_CONDITIONS, GAMES } from '@/types'

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
  const { status } = useSession()
  const router = useRouter()

  const [items, setItems] = useState<CatalogCardDto[]>([])
  const [sets, setSets] = useState<CatalogSetDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [setId, setSetId] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const [addDialog, setAddDialog] = useState<{ open: boolean; card: CatalogCardDto | null }>({
    open: false,
    card: null,
  })
  const [addForm, setAddForm] = useState({
    cardType: 'Single',
    condition: 'NM',
    game: 'OnePiece',
    quantity: '1',
    pricePerUnit: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  })
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchCards = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (setId) params.set('setId', setId)
    params.set('page', page.toString())
    params.set('limit', PAGE_SIZE.toString())

    fetch(`/api/catalog/cards?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : [])
        setTotalPages(data.pagination?.pages || 1)
        setLoading(false)
      })
      .catch(() => {
        setItems([])
        setTotalPages(1)
        setLoading(false)
      })
  }, [debouncedSearch, setId, page])

  const fetchSets = useCallback(() => {
    fetch('/api/catalog/sets')
      .then((res) => res.json())
      .then((data) => setSets(Array.isArray(data) ? data : []))
      .catch(() => setSets([]))
  }, [])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSets()
    }
  }, [status, fetchSets])

  useEffect(() => {
    if (status === 'authenticated') {
      const timeout = setTimeout(fetchCards, 0)
      return () => clearTimeout(timeout)
    }
  }, [status, fetchCards])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const openAdd = (card: CatalogCardDto) => {
    setAddDialog({ open: true, card })
    setAddForm({
      cardType: 'Single',
      condition: 'NM',
      game: 'OnePiece',
      quantity: '1',
      pricePerUnit: card.marketPrice ? String(Number(card.marketPrice)) : '',
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

  if (status === 'loading') return null
  if (status === 'unauthenticated') return null

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
        <h1 className="font-mono text-xl font-bold text-zinc-100">card list</h1>
        <p className="font-mono text-xs text-zinc-500">Browse the One Piece TCG catalog</p>
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
            placeholder="Search card name or number..."
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
          <option value="">All sets</option>
          {sets.map((s) => (
            <option key={s.setId} value={s.setId}>
              {s.setId} {s.setName ? `- ${s.setName}` : ''}
            </option>
          ))}
        </Select>
        <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-44">
          {CARD_TYPE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
      </motion.div>

      {loading ? (
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
          <p className="font-mono text-sm text-zinc-400">No cards found.</p>
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
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-xs text-zinc-600">
                      No image
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
                        ${Number(card.marketPrice).toFixed(2)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Button
                  size="sm"
                  className="mt-auto h-8 gap-1 text-xs bg-emerald-600 text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                  onClick={() => openAdd(card)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
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
              Previous
            </Button>
            <span className="font-mono text-xs text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </motion.div>
        </>
      )}

      <Dialog open={addDialog.open} onOpenChange={closeAdd}>
        <form onSubmit={handleAdd}>
            <DialogHeader>
              <DialogTitle>Add to inventory</DialogTitle>
              <DialogDescription>
                {addDialog.card?.name} ({addDialog.card?.cardNo})
                {addDialog.card?.marketPrice ? (
                  <span className="ml-1 text-emerald-400">
                    market ${Number(addDialog.card.marketPrice).toFixed(2)}
                  </span>
                ) : null}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">Category</label>
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
                  <label className="font-mono text-xs text-zinc-400">Game</label>
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
                  <label className="font-mono text-xs text-zinc-400">Condition</label>
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
                  <label className="font-mono text-xs text-zinc-400">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    value={addForm.quantity}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">Price / unit</label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={addForm.pricePerUnit}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-xs text-zinc-400">Date</label>
                  <Input
                    type="date"
                    value={addForm.date}
                    onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">Note</label>
                <Input
                  value={addForm.note}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={adding}>
                {adding ? 'Adding...' : 'Add to inventory'}
              </Button>
            </DialogFooter>
          </form>
      </Dialog>
    </div>
  )
}
