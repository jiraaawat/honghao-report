'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Image from 'next/image'

import { motion } from 'framer-motion'
import { Package, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { WishlistItemDto, CARD_TYPES, GAMES, CARD_CONDITIONS, LANGUAGES } from '@/types'
import { LanguageBadge } from '@/components/language/language-badge'
import { useLanguage } from '@/lib/i18n/provider'
import { fetcher, swrOptions } from '@/lib/swr'

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

export default function WishlistPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const { data: wishlistData, isLoading: wishlistLoading, mutate: mutateWishlist } = useSWR<WishlistItemDto[]>('/api/wishlist', fetcher, swrOptions)
  const items = wishlistData ?? []

  const [addDialog, setAddDialog] = useState<{ open: boolean; item: WishlistItemDto | null }>({
    open: false,
    item: null,
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

  const removeItem = async (id: string) => {
    const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
    if (res.ok) {
      await mutateWishlist()
    }
  }

  const openAdd = (item: WishlistItemDto) => {
    setAddDialog({ open: true, item })
    setAddForm({
      cardType: item.cardType || 'Single',
      condition: 'NM',
      game: item.game || 'OnePiece',
      quantity: '1',
      pricePerUnit: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    })
  }

  const closeAdd = () => {
    setAddDialog({ open: false, item: null })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const item = addDialog.item
    if (!item) return

    setAdding(true)
    try {
      const res = await fetch('/api/inventory/add-from-catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          cardNo: item.cardNo,
          setCode: item.setCode,
          setName: item.setName,
          rarity: undefined,
          imagePath: item.imageUrl,
          type: item.cardType,
          cardType: addForm.cardType,
          game: addForm.game,
          language: item.language,
          condition: addForm.condition,
          quantity: Number(addForm.quantity),
          pricePerUnit: Number(addForm.pricePerUnit),
          date: addForm.date,
          note: addForm.note,
        }),
      })

      if (res.ok) {
        closeAdd()
        await removeItem(item.id)
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

  if (wishlistLoading && !wishlistData) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 space-y-2">
          <div className="h-7 w-40 animate-pulse rounded bg-zinc-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-zinc-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[488/680] w-full animate-pulse rounded-xl bg-zinc-800" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h1 className="font-mono text-xl font-bold text-zinc-100">{t('wishlist.title')}</h1>
        <p className="font-mono text-xs text-zinc-500">{t('wishlist.subtitle')}</p>
      </motion.div>

      {wishlistLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
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
          <p className="font-mono text-sm text-zinc-400">{t('wishlist.empty')}</p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {items.map((item) => (
            <motion.div
              key={item.id}
              variants={itemVariants}
              className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
            >
              <div className="relative aspect-[488/680] overflow-hidden rounded-lg bg-zinc-950">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
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
                <p className="truncate font-mono text-xs font-semibold text-zinc-200">{item.name}</p>
                <p className="truncate font-mono text-[10px] text-zinc-500">
                  {[item.cardNo, item.setName].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  {item.cardType ? (
                    <Badge variant="outline" className="text-[10px]">
                      {item.cardType}
                    </Badge>
                  ) : null}
                  <LanguageBadge language={item.language} />
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 flex-1 gap-1 text-xs"
                  onClick={() => openAdd(item)}
                >
                  <Plus className="h-3.5 w-3.5" /> {t('wishlist.addToInventory')}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 p-0 text-zinc-500 hover:text-red-400"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={addDialog.open} onOpenChange={closeAdd}>
        <form onSubmit={handleAdd}>
          <DialogHeader>
            <DialogTitle>{t('wishlist.addToInventory')}</DialogTitle>
            <DialogDescription>{addDialog.item?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">{t('common.cardType')}</label>
                <Select
                  value={addForm.cardType}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, cardType: e.target.value }))}
                  required
                >
                  {CARD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
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
                  value={addDialog.item?.language || 'EN'}
                  disabled
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
                <label className="font-mono text-xs text-zinc-400">{t('common.quantity')}</label>
                <Input
                  type="number"
                  min={1}
                  value={addForm.quantity}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">{t('common.price')}</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={addForm.pricePerUnit}
                  onChange={(e) =>
                    setAddForm((prev) => ({ ...prev, pricePerUnit: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">{t('common.date')}</label>
                <Input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-xs text-zinc-400">{t('common.note')}</label>
                <Input
                  value={addForm.note}
                  onChange={(e) => setAddForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder={t('common.optional')}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={closeAdd}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" size="sm" disabled={adding}>
              {adding ? t('common.processing') : t('wishlist.addToInventory')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
