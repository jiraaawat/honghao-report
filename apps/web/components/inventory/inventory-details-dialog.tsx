'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { InventoryItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { useLanguage } from '@/lib/i18n/provider'
import { Tag, Plus, Minus, Pencil, Gem, Package } from 'lucide-react'
import { UnrealizedValue } from './unrealized-value'

interface InventoryDetailsDialogProps {
  item: InventoryItem | null
  open: boolean
  onClose: () => void
  onSell: (item: InventoryItem) => void
  onAdd: (item: InventoryItem) => void
  onRemove: (item: InventoryItem) => void
  onEditCost: (item: InventoryItem) => void
  onUpdateValue: (cardId: string, value: string) => void
}

export function InventoryDetailsDialog({
  item,
  open,
  onClose,
  onSell,
  onAdd,
  onRemove,
  onEditCost,
  onUpdateValue,
}: InventoryDetailsDialogProps) {
  const { t } = useLanguage()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(item?.marketValuePerUnit ?? ''))

  if (!item) return null

  const inStock = item.status === 'in_stock' && item.quantity > 0

  const handleSaveValue = () => {
    onUpdateValue(item.cardId, value)
    setEditing(false)
  }

  const handleCancelValue = () => {
    setValue(String(item.marketValuePerUnit))
    setEditing(false)
  }

  const handleAction = (action: (item: InventoryItem) => void) => {
    action(item)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogHeader>
        <DialogTitle className="font-mono text-base">{item.cardName}</DialogTitle>
        <DialogDescription>
          {[item.setCode, item.cardNumber, item.rarity].filter(Boolean).join(' · ')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="relative mx-auto aspect-[488/680] w-full max-w-[14rem] overflow-hidden rounded-lg bg-zinc-950">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.cardName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {item.condition && (
            <Badge variant="outline" className="text-[10px]">
              {item.condition}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px]">
            {item.cardType}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {item.game}
          </Badge>
          <LanguageBadge language={item.language} />
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
          <div className="rounded-md bg-zinc-950/50 p-2">
            <div className="text-zinc-500">{t('inventoryGridCard.qty')}</div>
            <div className="text-zinc-300">{item.quantity}</div>
          </div>
          <div className="rounded-md bg-zinc-950/50 p-2">
            <div className="text-zinc-500">{t('inventoryGridCard.avgCost')}</div>
            <div className="text-zinc-300">{formatCurrency(item.averageCost)}</div>
          </div>
          <div className="rounded-md bg-zinc-950/50 p-2">
            <div className="text-zinc-500">{t('inventoryGridCard.marketValue')}</div>
            {editing ? (
              <Input
                type="number"
                step="0.01"
                min={0}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveValue()
                  if (e.key === 'Escape') handleCancelValue()
                }}
                className="h-5 w-full px-1 py-0 text-right text-[10px]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-left text-zinc-300 hover:text-zinc-100"
              >
                {formatCurrency(item.marketValuePerUnit)}
              </button>
            )}
          </div>
          <div className="rounded-md bg-zinc-950/50 p-2">
            <div className="text-zinc-500">{t('inventoryGridCard.totalValue')}</div>
            <div className="text-zinc-300">{formatCurrency(item.currentValue)}</div>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-zinc-950/50 p-2">
              <div className="flex flex-col justify-between gap-0.5">
                <span className="text-zinc-500">{t('inventoryGridCard.profit')}</span>
                <span className={cn('font-mono font-semibold', item.profit >= 0 ? 'text-lime-500' : 'text-red-400')}>
                  {formatCurrency(item.profit)}
                </span>
              </div>
            </div>
            <div
              className={cn(
                'rounded-md border p-2',
                item.unrealizedProfit >= 0
                  ? 'border-lime-500/20 bg-lime-500/5'
                  : item.unrealizedProfit < 0
                    ? 'border-rose-500/20 bg-rose-500/5'
                    : 'border-zinc-800 bg-zinc-950/50'
              )}
            >
              <div className="flex flex-col justify-between gap-0.5">
                <span className="text-zinc-500">{t('inventoryGridCard.unrealized')}</span>
                <UnrealizedValue value={item.unrealizedProfit} />
              </div>
            </div>
          </div>
        </div>

        {inStock ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              className="h-9 gap-1 text-xs"
              onClick={() => handleAction(onSell)}
            >
              <Tag className="h-3.5 w-3.5" /> {t('common.sell')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={() => handleAction(onAdd)}
            >
              <Plus className="h-3.5 w-3.5" /> {t('common.add')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={() => handleAction(onRemove)}
            >
              <Minus className="h-3.5 w-3.5" /> {t('common.remove')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={() => handleAction(onEditCost)}
            >
              <Pencil className="h-3.5 w-3.5" /> {t('inventory.editCost')}
            </Button>
            <Link href={`/grading/send?cardId=${item.cardId}`} className="col-span-2" onClick={onClose}>
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-full gap-1 text-xs text-orange-600 hover:bg-orange-700/10 hover:text-orange-600"
              >
                <Gem className="h-3.5 w-3.5" /> {t('common.sendToGrade')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-md border border-zinc-800 bg-zinc-950/30 p-2 text-center font-mono text-xs text-zinc-500">
            {item.status === 'sold_out' && item.soldAt
              ? t('inventoryGridCard.soldAtWithDate', { date: formatDate(item.soldAt) })
              : t('inventoryGridCard.createdAtWithDate', { date: formatDate(item.createdAt) })}
          </div>
        )}
      </div>
    </Dialog>
  )
}
