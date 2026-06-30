'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { InventoryItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { Tooltip } from '@/components/ui/tooltip'
import { Package, PackageCheck, PackageX, Gem } from 'lucide-react'
import { UnrealizedValue } from './unrealized-value'
import { useLanguage } from '@/lib/i18n/provider'
import { memo } from 'react'

interface InventoryGridCardProps {
  item: InventoryItem
  onOpenDetails?: (item: InventoryItem) => void
  editing: boolean
  onEdit: () => void
  onUpdateValue: (value: string) => void
}

function InventoryGridCardRaw({
  item,
  onOpenDetails,
  editing,
  onEdit,
  onUpdateValue,
}: InventoryGridCardProps) {
  const { t } = useLanguage()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex h-full flex-col justify-between gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div
        className="relative aspect-[488/680] cursor-pointer overflow-hidden rounded-lg bg-zinc-950"
        onClick={() => onOpenDetails?.(item)}
      >
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.cardName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, (max-width: 1536px) 14vw, 12vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 font-mono text-[10px] text-zinc-600">
            <Package className="h-5 w-5" />
            {t('inventoryGridCard.noImage')}
          </div>
        )}
        <div className="absolute left-1.5 top-1.5">
          {item.status === 'grading' ? (
            <Badge variant="grading" className="gap-0.5 text-[9px]">
              <Gem className="h-2.5 w-2.5" /> {t('common.grading')}
            </Badge>
          ) : item.quantity > 0 ? (
            <Badge variant="buy" className="gap-0.5 text-[9px]">
              <PackageCheck className="h-2.5 w-2.5" /> {t('common.inStock')}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-0.5 text-[9px]">
              <PackageX className="h-2.5 w-2.5" /> {t('common.soldOut')}
            </Badge>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn('truncate font-mono text-[11px] font-semibold leading-tight', item.status === 'grading' ? 'text-orange-600' : 'text-zinc-200')}>
          {item.cardName}
        </p>
        <p className="truncate font-mono text-[9px] text-zinc-500">
          {[item.setCode, item.cardNumber, item.rarity].filter(Boolean).join(' · ')}
        </p>
      </div>

      <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
        {item.condition && (
          <Badge variant="outline" className="text-[9px]">
            {item.condition}
          </Badge>
        )}
        <Badge variant="secondary" className="text-[9px]">
          {item.cardType}
        </Badge>
        <Badge variant="secondary" className="text-[9px]">
          {item.game}
        </Badge>
        <LanguageBadge language={item.language} className="text-[9px] px-1 py-0" />
      </div>

      <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
        <div className="rounded-md bg-zinc-950/50 p-1.5">
          <div className="text-zinc-500">{t('inventoryGridCard.qty')}</div>
          <div className="text-zinc-300">{item.quantity}</div>
        </div>
        <div className="rounded-md bg-zinc-950/50 p-1.5">
          <div className="text-zinc-500">{t('inventoryGridCard.avgCost')}</div>
          <div className="text-zinc-300">{formatCurrency(item.averageCost)}</div>
        </div>
        <div className="rounded-md bg-zinc-950/50 p-1.5">
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
              className="h-5 w-full px-1 py-0 text-right text-[9px]"
            />
          ) : (
            <Tooltip content={t('inventoryGridCard.editValueTitle')} side="top">
              <button
                type="button"
                onClick={onEdit}
                className="text-left text-zinc-300 hover:text-zinc-100"
              >
                {formatCurrency(item.marketValuePerUnit)}
              </button>
            </Tooltip>
          )}
        </div>
        <div className="rounded-md bg-zinc-950/50 p-1.5">
          <div className="text-zinc-500">{t('inventoryGridCard.totalValue')}</div>
          <div className="text-zinc-300">{formatCurrency(item.currentValue)}</div>
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-1.5">
          <div className="rounded-md bg-zinc-950/50 p-1.5">
            <div className="flex flex-col justify-between gap-0.5">
              <span className="text-zinc-500">{t('inventoryGridCard.profit')}</span>
              <span className={cn('font-mono font-semibold', item.profit >= 0 ? 'text-lime-500' : 'text-red-400')}>
                {formatCurrency(item.profit)}
              </span>
            </div>
          </div>
          <div
            className={cn(
              'rounded-md border p-1.5',
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

    </motion.div>
  )
}

export const InventoryGridCard = memo(InventoryGridCardRaw)
