'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { InventoryItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { Package, PackageCheck, PackageX, Gem, Plus, Minus, Tag, Pencil } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { memo } from 'react'

interface InventoryGridCardProps {
  item: InventoryItem
  onSell: (item: InventoryItem) => void
  onAdd: (item: InventoryItem) => void
  onRemove: (item: InventoryItem) => void
  onEditCost: (item: InventoryItem) => void
  onOpenDetails?: (item: InventoryItem) => void
  editing: boolean
  onEdit: () => void
  onUpdateValue: (value: string) => void
}

function InventoryGridCardRaw({
  item,
  onSell,
  onAdd,
  onRemove,
  onEditCost,
  onOpenDetails,
  editing,
  onEdit,
  onUpdateValue,
}: InventoryGridCardProps) {
  const { t } = useLanguage()
  const inStock = item.status === 'in_stock' && item.quantity > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex h-full flex-col justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div
        className="relative aspect-[488/680] cursor-pointer overflow-hidden rounded-lg bg-zinc-950 sm:cursor-default"
        onClick={() => onOpenDetails?.(item)}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.cardName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 font-mono text-xs text-zinc-600">
            <Package className="h-6 w-6" />
            {t('inventoryGridCard.noImage')}
          </div>
        )}
        <div className="absolute left-2 top-2">
          {item.status === 'grading' ? (
            <Badge variant="grading" className="gap-1 text-[10px]">
              <Gem className="h-3 w-3" /> {t('common.grading')}
            </Badge>
          ) : item.quantity > 0 ? (
            <Badge variant="buy" className="gap-1 text-[10px]">
              <PackageCheck className="h-3 w-3" /> {t('common.inStock')}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <PackageX className="h-3 w-3" /> {t('common.soldOut')}
            </Badge>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn('truncate font-mono text-xs font-semibold', item.status === 'grading' ? 'text-amber-400' : 'text-zinc-200')}>
          {item.cardName}
        </p>
        <p className="truncate font-mono text-[10px] text-zinc-500">
          {[item.setCode, item.cardNumber, item.rarity].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1.5 overflow-hidden">
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
          <div className="text-zinc-500">{t('inventoryGridCard.market')}</div>
          {editing ? (
            <Input
              type="number"
              step="0.01"
              min={0}
              autoFocus
              defaultValue={item.marketValuePerUnit}
              onBlur={(e) => onUpdateValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onUpdateValue((e.target as HTMLInputElement).value)
                if (e.key === 'Escape') onUpdateValue(String(item.marketValuePerUnit))
              }}
              className="h-5 w-full px-1 py-0 text-right text-[10px]"
            />
          ) : (
            <button
              type="button"
              onClick={onEdit}
              className="text-left text-zinc-300 hover:text-zinc-100"
              title={t('inventoryGridCard.editValueTitle')}
            >
              {formatCurrency(item.marketValuePerUnit)}
            </button>
          )}
        </div>
        <div className="rounded-md bg-zinc-950/50 p-2">
          <div className="text-zinc-500">{t('inventoryGridCard.totalValue')}</div>
          <div className="text-zinc-300">{formatCurrency(item.currentValue)}</div>
        </div>
        <div className="col-span-2 rounded-md bg-zinc-950/50 p-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">{t('inventoryGridCard.profit')}</span>
            <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatCurrency(item.profit)}
            </span>
          </div>

        </div>
      </div>

      <div className="mt-auto hidden shrink-0 space-y-2 sm:block">
        {inStock ? (
          <>
            <Button
              size="sm"
              className="h-8 w-full gap-1 text-xs"
              onClick={() => onSell(item)}
            >
              <Tag className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('inventoryGridCard.sell')}</span>
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 gap-1 text-xs"
                onClick={() => onAdd(item)}
              >
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('inventoryGridCard.add')}</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 flex-1 gap-1 text-xs"
                onClick={() => onRemove(item)}
              >
                <Minus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('inventoryGridCard.remove')}</span>
              </Button>
            </div>
            <Link href={`/grading/send?cardId=${item.cardId}`} className="block">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-full gap-1 text-xs text-amber-400 hover:bg-amber-500/10 hover:text-amber-400"
              >
                <Gem className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('inventoryGridCard.sendToGrade')}</span>
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-full gap-1 text-xs text-blue-400 hover:bg-blue-500/10 hover:text-blue-400"
              onClick={() => onEditCost(item)}
            >
              <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t('inventoryGridCard.editCost')}</span>
            </Button>
          </>
        ) : (
          <div className="mt-auto flex min-h-[96px] shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950/30 p-2 font-mono text-[10px] text-zinc-500 sm:mt-auto">
            {item.status === 'sold_out' && item.soldAt
              ? t('inventoryGridCard.soldAtWithDate', { date: formatDate(item.soldAt) })
              : t('inventoryGridCard.createdAtWithDate', { date: formatDate(item.createdAt) })}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export const InventoryGridCard = memo(InventoryGridCardRaw)
