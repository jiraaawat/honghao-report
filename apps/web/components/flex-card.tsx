'use client'

import { forwardRef } from 'react'
import Image from 'next/image'
import { TransactionDto } from '@/types'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { Rocket, Skull, Zap, Package, Diamond, TrendingUp, TrendingDown } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'

interface FlexCardProps {
  tx: TransactionDto
  userName?: string | null
  variant?: 'wide' | 'portrait'
}

export const FlexCard = forwardRef<HTMLDivElement, FlexCardProps>(function FlexCard(
  { tx, userName, variant = 'wide' },
  ref
) {
  if (variant === 'portrait') {
    return <FlexCardPortrait ref={ref} tx={tx} userName={userName} />
  }
  return <FlexCardWide ref={ref} tx={tx} userName={userName} />
})

const FlexCardWide = forwardRef<HTMLDivElement, FlexCardProps>(function FlexCardWide(
  { tx, userName },
  ref
) {
  const { t } = useLanguage()
  const qty = tx.quantity
  const avgCost = tx.card?.inventory?.averageCost ?? 0
  const sellPerCard = qty > 0 ? Number(tx.totalAmount) / qty : 0
  const profitPerCard = sellPerCard - avgCost
  const totalProfit = profitPerCard * qty
  const roi = avgCost > 0 ? (profitPerCard / avgCost) * 100 : 0
  const isProfit = totalProfit >= 0

  const accentColor = isProfit ? '#10b981' : '#ef4444'
  const glowColor = isProfit ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
  const txHash = tx.id.slice(-8).toUpperCase()

  const profitText = formatCurrency(Math.abs(totalProfit))
  const profitLength = profitText.length
  const profitSizeClass =
    profitLength > 10 ? 'text-5xl' : profitLength > 7 ? 'text-6xl' : 'text-7xl'

  return (
    <div
      ref={ref}
      className="relative flex w-[1200px] shrink-0 items-stretch overflow-hidden rounded-3xl border-2 p-0 pl-14 font-mono text-zinc-100 shadow-2xl"
      style={{
        height: 630,
        borderColor: isProfit ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
        boxShadow: `0 32px 96px ${glowColor}`,
      }}
    >
      <FlexBackground isProfit={isProfit} />

      {/* Vertical username strip */}
      <div className="absolute left-0 top-0 bottom-0 z-20 flex w-14 items-center justify-center border-r border-zinc-800/60 bg-zinc-950/30">
        <VerticalUsername userName={userName} />
      </div>

      {/* Left: card identity */}
      <div className="relative z-10 flex w-[380px] flex-col border-r border-zinc-800/60 py-10 pr-8 pl-16">
        <FlexHeader />
        <div className="flex flex-1 flex-col justify-center">
          <div
            className="relative ml-4 mt-2 aspect-[488/680] w-52 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950"
            style={{ boxShadow: `0 0 32px ${glowColor}` }}
          >
            <CardImage tx={tx} size="208px" />
          </div>

          <div className="mt-4">
            <div className="text-xl font-black leading-tight tracking-tight text-white line-clamp-2">
              {tx.card?.name}
            </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="rounded bg-zinc-800/80 px-2 py-1 font-bold text-zinc-300">
              {tx.card?.setCode || 'SET'} {tx.card?.cardNumber || '000'}
            </span>
            <span>{tx.card?.cardType}</span>
            <LanguageBadge language={tx.card?.language} />
          </div>
        </div>
      </div>
      </div>

      {/* Right: profit & stats */}
      <div className="relative z-10 flex flex-1 flex-col justify-between p-10">
        <div className="flex items-start justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            <span className="text-green-400">honghao</span>
          </span>
          <ProfitIcon isProfit={isProfit} glowColor={glowColor} size="h-14 w-14" iconSize="h-7 w-7" />
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: accentColor }}>
            {isProfit ? `🚀 ${t('flexCard.toTheMoon')} 🚀` : `💀 ${t('flexCard.ngmi')} 💀`}
          </div>
          <div
            className={`mt-3 font-sans ${profitSizeClass} font-black tabular-nums leading-none tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis ${
              isProfit ? 'text-green-400' : 'text-red-400'
            }`}
            style={{ textShadow: `0 0 32px ${glowColor}` }}
          >
            {isProfit ? '+' : '-'}
            {profitText}
          </div>
          <div className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">{t('flexCard.totalProfit')}</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatBox label={t('flexCard.profitPerCard')} value={`${isProfit ? '+' : '-'}${formatCurrency(Math.abs(profitPerCard))}`} accent={accentColor} size="h-24 text-xl" />
          <StatBox label={t('flexCard.roi')} value={`${isProfit ? '+' : '-'}${formatNumber(Math.abs(roi))}%`} accent={accentColor} size="h-24 text-xl" />
          <StatBox label={t('flexCard.costPerCard')} value={formatCurrency(avgCost)} accent="#a1a1aa" size="h-24 text-xl" />
          <StatBox label={t('flexCard.sellPerCard')} value={formatCurrency(sellPerCard)} accent="#a1a1aa" size="h-24 text-xl" />
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800/70 pt-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <Diamond className="h-3.5 w-3.5" />
            <span>{t('flexCard.qty')} {qty}</span>
          </div>
          <div className="text-xs font-mono tracking-widest text-zinc-600">0x{txHash}</div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{formatDate(tx.date)}</span>
        </div>
      </div>
    </div>
  )
})

const FlexCardPortrait = forwardRef<HTMLDivElement, FlexCardProps>(function FlexCardPortrait(
  { tx, userName },
  ref
) {
  const { t } = useLanguage()
  const qty = tx.quantity
  const avgCost = tx.card?.inventory?.averageCost ?? 0
  const sellPerCard = qty > 0 ? Number(tx.totalAmount) / qty : 0
  const profitPerCard = sellPerCard - avgCost
  const totalProfit = profitPerCard * qty
  const roi = avgCost > 0 ? (profitPerCard / avgCost) * 100 : 0
  const isProfit = totalProfit >= 0

  const accentColor = isProfit ? '#10b981' : '#ef4444'
  const glowColor = isProfit ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'
  const txHash = tx.id.slice(-8).toUpperCase()

  const profitText = formatCurrency(Math.abs(totalProfit))
  const profitLength = profitText.length
  const profitSizeClass =
    profitLength > 10 ? 'text-4xl' : profitLength > 7 ? 'text-5xl' : 'text-6xl'

  return (
    <div
      ref={ref}
      className="relative flex w-[720px] shrink-0 flex-col overflow-hidden rounded-3xl border-2 p-0 font-mono text-zinc-100 shadow-2xl"
      style={{
        height: 1080,
        borderColor: isProfit ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
        boxShadow: `0 24px 80px ${glowColor}`,
      }}
    >
      <FlexBackground isProfit={isProfit} />

      <div className="relative z-10 flex h-full flex-col p-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <FlexHeader />
          <span className="max-w-[200px] truncate text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">
            {userName || 'DEGEN'} · <span className="text-green-400">honghao</span>
          </span>
        </div>

        {/* Card image + identity */}
        <div className="mt-8 flex flex-col items-center text-center">
          <div
            className="relative aspect-[488/680] w-52 overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-950"
            style={{ boxShadow: `0 0 48px ${glowColor}` }}
          >
            <CardImage tx={tx} size="208px" />
          </div>

          <div className="mt-4 max-w-full px-4">
            <div className="text-2xl font-black leading-tight tracking-tight text-white line-clamp-2">
              {tx.card?.name}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-400">
              <span className="rounded bg-zinc-800/80 px-2 py-0.5 font-bold text-zinc-300">
                {tx.card?.setCode || 'SET'} {tx.card?.cardNumber || '000'}
              </span>
              <span>{tx.card?.cardType}</span>
              <LanguageBadge language={tx.card?.language} />
            </div>
          </div>
        </div>

        {/* Profit banner */}
        <div
          className="mt-5 flex items-center gap-5 rounded-2xl border p-5"
          style={{
            borderColor: isProfit ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
            background: isProfit ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            boxShadow: `0 0 28px ${glowColor} inset`,
          }}
        >
          <ProfitIcon isProfit={isProfit} glowColor={glowColor} size="h-14 w-14" iconSize="h-7 w-7" />
          <div className="min-w-0 flex-1">
            <div
              className={`font-sans ${profitSizeClass} font-black tabular-nums leading-none tracking-tighter whitespace-nowrap overflow-hidden text-ellipsis ${
                isProfit ? 'text-green-400' : 'text-red-400'
              }`}
              style={{ textShadow: `0 0 24px ${glowColor}` }}
            >
              {isProfit ? '+' : '-'}
              {profitText}
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: accentColor }}>
              {isProfit ? `🚀 ${t('flexCard.toTheMoon')} 🚀` : `💀 ${t('flexCard.ngmi')} 💀`}
            </div>
            <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              {t('flexCard.totalProfit')}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <StatBox label={t('flexCard.profitPerCard')} value={`${isProfit ? '+' : '-'}${formatCurrency(Math.abs(profitPerCard))}`} accent={accentColor} size="h-24 text-lg" />
          <StatBox label={t('flexCard.roi')} value={`${isProfit ? '+' : '-'}${formatNumber(Math.abs(roi))}%`} accent={accentColor} size="h-24 text-lg" />
          <StatBox label={t('flexCard.costPerCard')} value={formatCurrency(avgCost)} accent="#a1a1aa" size="h-24 text-lg" />
          <StatBox label={t('flexCard.sellPerCard')} value={formatCurrency(sellPerCard)} accent="#a1a1aa" size="h-24 text-lg" />
        </div>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-800/70 pt-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
            <Diamond className="h-4 w-4" />
            <span>{t('flexCard.qty')} {qty}</span>
          </div>
          <div className="text-xs font-mono tracking-widest text-zinc-600">0x{txHash}</div>
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{formatDate(tx.date)}</span>
        </div>
      </div>
    </div>
  )
})

function FlexBackground({ isProfit }: { isProfit: boolean }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: isProfit
            ? 'radial-gradient(circle at 20% 10%, rgba(16,185,129,0.22), transparent 45%), radial-gradient(circle at 85% 85%, rgba(6,182,212,0.15), transparent 40%), linear-gradient(160deg, #0c0c0e 0%, #09090b 100%)'
            : 'radial-gradient(circle at 20% 10%, rgba(239,68,68,0.22), transparent 45%), radial-gradient(circle at 85% 85%, rgba(168,85,247,0.15), transparent 40%), linear-gradient(160deg, #0c0c0e 0%, #09090b 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div
        className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.05]"
        style={{ color: isProfit ? '#10b981' : '#ef4444' }}
      >
        {isProfit ? <TrendingUp className="h-72 w-72" /> : <TrendingDown className="h-72 w-72" />}
      </div>
    </>
  )
}

function FlexHeader() {
  return (
    <div className="flex items-center gap-2.5">
      <Zap
        className="h-6 w-6"
        style={{ color: '#facc15', filter: 'drop-shadow(0 0 6px rgba(250,204,21,0.7))' }}
        fill="#facc15"
      />
      <span
        className="text-2xl font-black italic uppercase tracking-tighter text-white"
        style={{ textShadow: '0 0 14px rgba(250,204,21,0.55)' }}
      >
        FLEX
      </span>
    </div>
  )
}

function VerticalUsername({ userName }: { userName?: string | null }) {
  return (
    <span
      className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500"
      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
    >
      {userName || 'DEGEN'}
    </span>
  )
}

function CardImage({ tx, size }: { tx: TransactionDto; size: string }) {
  return tx.card?.imageUrl ? (
    <Image src={tx.card.imageUrl} alt={tx.card.name} fill sizes={size} className="object-cover" />
  ) : (
    <div className="flex h-full items-center justify-center text-zinc-600">
      <Package className="h-8 w-8" />
    </div>
  )
}

function ProfitIcon({
  isProfit,
  glowColor,
  size,
  iconSize,
}: {
  isProfit: boolean
  glowColor: string
  size: string
  iconSize: string
}) {
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-2xl ${
        isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
      }`}
      style={{ boxShadow: `0 0 28px ${glowColor} inset` }}
    >
      {isProfit ? <Rocket className={iconSize} /> : <Skull className={iconSize} />}
    </div>
  )
}

function StatBox({
  label,
  value,
  accent,
  size,
}: {
  label: string
  value: string
  accent: string
  size: string
}) {
  const [heightClass, textClass] = size.split(' ')
  return (
    <div
      className={`flex ${heightClass} flex-col justify-center rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-4 backdrop-blur-sm`}
      style={{ boxShadow: `0 0 16px rgba(0,0,0,0.35)` }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</div>
      <div
        className={`mt-1 font-sans ${textClass} font-black tabular-nums tracking-tight whitespace-nowrap overflow-hidden text-ellipsis`}
        style={{ color: accent }}
      >
        {value}
      </div>
    </div>
  )
}
