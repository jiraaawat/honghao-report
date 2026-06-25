'use client'

import { forwardRef } from 'react'
import { TransactionDto } from '@/types'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'
import { LanguageBadge } from '@/components/language/language-badge'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'

interface FlexCardProps {
  tx: TransactionDto
}

export const FlexCard = forwardRef<HTMLDivElement, FlexCardProps>(function FlexCard({ tx }, ref) {
  const { t } = useLanguage()
  const qty = tx.quantity
  const sellPrice = Number(tx.pricePerUnit)
  const avgCost = tx.card?.inventory?.averageCost ?? 0
  const profitPerCard = sellPrice - avgCost
  const totalProfit = profitPerCard * qty - Number(tx.shippingCost ?? 0)
  const roi = avgCost > 0 ? (profitPerCard / avgCost) * 100 : 0
  const isProfit = totalProfit >= 0

  return (
    <div
      ref={ref}
      className="w-[360px] shrink-0 rounded-2xl border bg-zinc-900 p-6 font-mono text-zinc-100 shadow-2xl"
      style={{
        borderColor: isProfit ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)',
        background: isProfit
          ? 'linear-gradient(145deg, #052e1d 0%, #09090b 100%)'
          : 'linear-gradient(145deg, #3f0f12 0%, #09090b 100%)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className={`h-5 w-5 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t('flexCard.flex')}</span>
        </div>
        <span className="text-[10px] text-zinc-500">{t('flexCard.honghaoReport')}</span>
      </div>

      <div className="mt-6">
        <div className="text-lg font-bold leading-tight">{tx.card?.name}</div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
          {tx.card?.cardType} · {tx.card?.game} <LanguageBadge language={tx.card?.language} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full ${
            isProfit ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}
        >
          {isProfit ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
        </div>
        <div>
          <div className={`text-3xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}
            {formatCurrency(totalProfit)}
          </div>
          <div className="text-xs text-zinc-400">{t('flexCard.totalProfit')}</div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-zinc-500">{t('flexCard.profitPerCard')}</div>
          <div className={`mt-1 text-base font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}
            {formatCurrency(profitPerCard)}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-zinc-500">{t('flexCard.roi')}</div>
          <div className={`mt-1 text-base font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}
            {formatNumber(roi)}%
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-zinc-500">{t('flexCard.costPerCard')}</div>
          <div className="mt-1 text-base font-bold text-zinc-200">{formatCurrency(avgCost)}</div>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
          <div className="text-zinc-500">{t('flexCard.sellPerCard')}</div>
          <div className="mt-1 text-base font-bold text-zinc-200">{formatCurrency(sellPrice)}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4 text-[10px] text-zinc-500">
        <span>{t('flexCard.qty')} {qty}</span>
        <span>{formatDate(tx.date)}</span>
      </div>
    </div>
  )
})
