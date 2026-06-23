'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { InventoryItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Package, PackageCheck, PackageX, Gem, Plus, Minus, Tag } from 'lucide-react'

interface InventoryGridCardProps {
  item: InventoryItem
  onSell: (item: InventoryItem) => void
  onAdd: (item: InventoryItem) => void
  onRemove: (item: InventoryItem) => void
  editing: boolean
  onEdit: () => void
  onUpdateValue: (value: string) => void
}

export function InventoryGridCard({
  item,
  onSell,
  onAdd,
  onRemove,
  editing,
  onEdit,
  onUpdateValue,
}: InventoryGridCardProps) {
  const inStock = item.status === 'in_stock' && item.quantity > 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="relative aspect-[488/680] overflow-hidden rounded-lg bg-zinc-950">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.cardName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 font-mono text-xs text-zinc-600">
            <Package className="h-6 w-6" />
            no image
          </div>
        )}
        <div className="absolute left-2 top-2">
          {item.status === 'grading' ? (
            <Badge variant="grading" className="gap-1 text-[10px]">
              <Gem className="h-3 w-3" /> grading
            </Badge>
          ) : item.quantity > 0 ? (
            <Badge variant="buy" className="gap-1 text-[10px]">
              <PackageCheck className="h-3 w-3" /> in stock
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-[10px]">
              <PackageX className="h-3 w-3" /> sold out
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
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[10px]">
        <div className="rounded-md bg-zinc-950/50 p-2">
          <div className="text-zinc-500">qty</div>
          <div className="text-zinc-300">{item.quantity}</div>
        </div>
        <div className="rounded-md bg-zinc-950/50 p-2">
          <div className="text-zinc-500">avg cost</div>
          <div className="text-zinc-300">{formatCurrency(item.averageCost)}</div>
        </div>
        <div className="rounded-md bg-zinc-950/50 p-2">
          <div className="text-zinc-500">market</div>
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
              title="click to edit"
            >
              {formatCurrency(item.marketValuePerUnit)}
            </button>
          )}
        </div>
        <div className="rounded-md bg-zinc-950/50 p-2">
          <div className="text-zinc-500">total value</div>
          <div className="text-zinc-300">{formatCurrency(item.currentValue)}</div>
        </div>
        <div className="col-span-2 rounded-md bg-zinc-950/50 p-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500">profit</span>
            <span className={item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {formatCurrency(item.profit)}
            </span>
          </div>
          {item.unrealizedProfit !== 0 && (
            <div className="mt-0.5 flex items-center justify-between text-zinc-500">
              <span>unrealized</span>
              <span>{formatCurrency(item.unrealizedProfit)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto space-y-2">
        {inStock ? (
          <>
            <Button
              size="sm"
              className="h-8 w-full gap-1 text-xs bg-emerald-500 font-semibold text-white shadow-sm hover:bg-emerald-400"
              onClick={() => onSell(item)}
            >
              <Tag className="h-3.5 w-3.5" /> sell
            </Button>
            <div className="flex gap-2">
              <Button
                size="sm"
                className="h-8 flex-1 gap-1 text-xs bg-blue-500 font-semibold text-white shadow-sm hover:bg-blue-400"
                onClick={() => onAdd(item)}
              >
                <Plus className="h-3.5 w-3.5" /> add
              </Button>
              <Button
                size="sm"
                className="h-8 flex-1 gap-1 text-xs bg-red-500 font-semibold text-white shadow-sm hover:bg-red-400"
                onClick={() => onRemove(item)}
              >
                <Minus className="h-3.5 w-3.5" /> remove
              </Button>
            </div>
            <Link href={`/grading/send?cardId=${item.cardId}`} className="block">
              <Button
                size="sm"
                className="h-8 w-full gap-1 text-xs bg-amber-500 font-semibold text-white shadow-sm hover:bg-amber-400"
              >
                <Gem className="h-3.5 w-3.5" /> send to grade
              </Button>
            </Link>
          </>
        ) : (
          <div className="rounded-md border border-zinc-800 bg-zinc-950/30 p-2 font-mono text-[10px] text-zinc-500">
            {item.status === 'sold_out' && item.soldAt
              ? `sold ${formatDate(item.soldAt)}`
              : `created ${formatDate(item.createdAt)}`}
          </div>
        )}
      </div>
    </motion.div>
  )
}
