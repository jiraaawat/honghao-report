'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnimatedCurrency, AnimatedNumber } from '@/components/ui/animated-value'
import { FitText } from '@/components/ui/fit-text'
import { DashboardStats } from '@/types'
import { TransactionDto, InventoryItem, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency, formatNumber, formatDate, cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { fetcher, swrOptions } from '@/lib/swr'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { BannerCarousel } from '@/components/ads/banner-carousel'
import { UnrealizedValue } from '@/components/inventory/unrealized-value'

function SnapshotRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2.5 py-2">
      <span className="font-mono text-xs text-zinc-400">{label}</span>
      <span className={cn('font-mono text-sm font-semibold tabular-nums', valueClassName)}>{value}</span>
    </div>
  )
}
import {
  ArrowRight,
  Package,
  Plus,
  Boxes,
  Clock,
} from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const { data: stats } = useSWR<DashboardStats>('/api/dashboard', fetcher, swrOptions)
  const { data: recentData } = useSWR<TransactionDto[]>('/api/transactions?limit=5', fetcher, swrOptions)
  const { data: inventoryData } = useSWR<{ items: InventoryItem[]; summary: { totalCards: number; inStock: number; grading: number; soldOut: number; totalValue: number; totalInvested: number; totalProfit: number; totalROI: number } }>('/api/inventory', fetcher, swrOptions)

  const recent = recentData?.slice(0, 5) ?? []
  const inventory = inventoryData?.items ?? []
  const inventorySummary = inventoryData?.summary ?? {
    totalCards: 0,
    inStock: 0,
    grading: 0,
    soldOut: 0,
    totalValue: 0,
    totalInvested: 0,
    totalProfit: 0,
    totalROI: 0,
  }

  if (!stats || !recentData || !inventoryData) {
    return <DashboardSkeleton />
  }

  const gameBreakdown = GAMES.map((game) => {
    const items = inventory.filter((i) => i.game === game)
    return {
      game,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      value: items.reduce((sum, i) => sum + i.currentValue, 0),
    }
  }).filter((g) => g.count > 0)

  const typeBreakdown = CARD_TYPES.map((type) => {
    const items = inventory.filter((i) => i.cardType === type)
    return {
      type,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      value: items.reduce((sum, i) => sum + i.currentValue, 0),
    }
  }).filter((t) => t.count > 0)

  const candidates = inventory.filter((i) => i.quantity > 0)
  const topCard =
    candidates.length > 0
      ? candidates.reduce((top, item) =>
          item.marketValuePerUnit > top.marketValuePerUnit ? item : top
        )
      : null

  const soldOutProfitable = inventory.filter((i) => i.status === 'sold_out' && i.profit > 0)
  const topProfitCard =
    soldOutProfitable.length > 0
      ? soldOutProfitable.reduce((top, item) => (item.profit > top.profit ? item : top))
      : null

  const lastAddedCard =
    inventory.length > 0
      ? inventory.reduce((latest, item) =>
          new Date(item.createdAt).getTime() > new Date(latest.createdAt).getTime() ? item : latest
        )
      : null

  const periodROI =
    stats && stats.totalSpend > 0 ? (stats.periodProfit / stats.totalSpend) * 100 : 0

  const totalUnrealizedProfit = inventory.reduce((sum, item) => sum + item.unrealizedProfit, 0)

  return (
    <div className="space-y-6 p-3 pt-4 md:space-y-8 md:p-6 md:pt-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="truncate font-mono text-2xl font-bold text-zinc-100">$ {t('dashboard.title')}</h1>
          <p className="font-mono text-sm text-zinc-500">
            {t('dashboard.welcomeBack')}, {session?.user?.name || session?.user?.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/inventory">
            <Button variant="outline" className="gap-2">
              <Boxes className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.inventory')}</span>
            </Button>
          </Link>
          <Link href="/transactions">
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.transactions')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <BannerCarousel
          className="lg:col-span-2 lg:h-44"
          banners={[
            {
              id: 'opcg',
              href: 'https://www.facebook.com/groups/1329363959139210',
              image: '/images/sponsor.jpg',
              alt: 'Sponsor - OPCG Thailand',
              label: 'Sponsor',
              title: 'OPCG Thailand',
              subtitle: 'Facebook group',
            },
            {
              id: 'honghao-labs',
              href: 'https://www.facebook.com/honghao.labs',
              image: 'https://scontent.fbkk13-2.fna.fbcdn.net/v/t39.30808-6/732337875_1007437352036796_8474410687784789239_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1374&ctp=s2048x1374&_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=2N-IRgTQl6EQ7kNvwH5ZUrp&_nc_oc=AdoDY6pV3CWn5hMKqiu5FRo6ZbclT7zcXVIpsxHgNWpnGxztjvf3rJKRv52mIMj5A0O58ggUBPSMgscpc4suK-Er&_nc_zt=23&_nc_ht=scontent.fbkk13-2.fna&_nc_gid=YoybU8mmpkSojuDvW5djZQ&_nc_ss=7b2a8&oh=00_AQAgq5Kl_8gW4EiTl1rEc5pzzQSedZvZ5bujsRoPwToTow&oe=6A4983DE',
              alt: 'HONGHAO.Labs',
              label: 'Community',
              title: 'HONGHAO.Labs',
              subtitle: 'Facebook page',
            },
            {
              id: 'promo-lime',
              href: '#',
              label: 'Promo',
              title: 'Special Drop',
              subtitle: 'Coming soon',
              bgClass: 'bg-gradient-to-br from-lime-900/30 via-zinc-900 to-zinc-950',
            },
            {
              id: 'promo-orange',
              href: '#',
              label: 'Event',
              title: 'Trading Event',
              subtitle: 'Stay tuned',
              bgClass: 'bg-gradient-to-br from-orange-900/30 via-zinc-900 to-zinc-950',
            },
          ]}
        />

        <Card className="min-h-[9rem] border-zinc-800 bg-zinc-900/50 lg:h-44">
          <CardContent className="flex h-full flex-col gap-3 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-6 lg:py-6">
            <div className="font-mono text-sm text-zinc-400">
              {t('dashboard.periodStats')}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:border-l lg:border-zinc-800 lg:pl-6">
              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-600/70" />
                  <span className="truncate">{t('dashboard.profitLoss')}</span>
                </div>
                <div
                  className={`inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-lg border bg-zinc-950/60 px-2 py-1 font-mono text-base font-bold drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] sm:px-3 sm:text-xl ${
                    stats && stats.periodProfit >= 0
                      ? 'border-lime-600/30 text-lime-500 shadow-[inset_0_0_20px_rgba(34,197,94,0.06)]'
                      : 'border-rose-500/30 text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.06)]'
                  }`}
                >
                  <FitText minScale={0.6}>
                    <AnimatedCurrency value={stats?.periodProfit ?? 0} />
                  </FitText>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] leading-relaxed text-zinc-500">
                  <AnimatedNumber value={stats?.totalTransactions ?? 0} /> {t('dashboard.transactions')} <span>·</span> {t('dashboard.totalSpend')} <AnimatedCurrency value={stats?.totalSpend ?? 0} />
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-700/70" />
                  <span className="truncate">{t('dashboard.totalSell')}</span>
                </div>
                <div className="inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-lg border border-orange-700/30 bg-zinc-950/60 px-2 py-1 font-mono text-sm font-bold text-orange-600 drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] shadow-[inset_0_0_20px_rgba(249,115,22,0.06)] sm:px-3 sm:text-lg">
                  <FitText minScale={0.6}>
                    <AnimatedCurrency value={stats?.totalSell ?? 0} />
                  </FitText>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-700/70" />
                  <span className="truncate">{t('dashboard.periodRoi')}</span>
                </div>
                <div
                  className={`inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-lg border bg-zinc-950/60 px-2 py-1 font-mono text-sm font-bold drop-shadow-[0_1px_10px_rgba(0,0,0,0.5)] sm:px-3 sm:text-lg ${
                    periodROI >= 0
                      ? 'border-orange-700/30 text-orange-600 shadow-[inset_0_0_20px_rgba(249,115,22,0.06)]'
                      : 'border-rose-500/30 text-rose-400 shadow-[inset_0_0_20px_rgba(244,63,94,0.06)]'
                  }`}
                >
                  <FitText minScale={0.6}>
                    <AnimatedNumber value={periodROI} suffix="%" decimals={1} />
                  </FitText>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[minmax(220px,auto)]">
        <Card className="flex h-full flex-col border-zinc-800 bg-zinc-900/50 md:row-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.inventorySnapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <SnapshotRow label={t('inventory.totalCards')} value={inventorySummary.totalCards} valueClassName="text-lime-500" />
              <SnapshotRow label={t('inventory.inStock')} value={inventorySummary.inStock} valueClassName="text-lime-500" />
              <SnapshotRow label={t('inventory.grading')} value={inventorySummary.grading} valueClassName="text-orange-600" />
              <SnapshotRow label={t('dashboard.soldCards')} value={inventorySummary.soldOut} valueClassName="text-rose-400" />
              <SnapshotRow label={t('dashboard.totalInvested')} value={formatCurrency(inventorySummary.totalInvested)} />
              <SnapshotRow label={t('dashboard.totalValue')} value={formatCurrency(inventorySummary.totalValue)} valueClassName="text-lime-500" />
              <SnapshotRow
                label={t('dashboard.totalProfit')}
                value={formatCurrency(inventorySummary.totalProfit)}
                valueClassName={inventorySummary.totalProfit >= 0 ? 'text-lime-500' : 'text-rose-400'}
              />
              <SnapshotRow
                label={t('dashboard.unrealizedProfit')}
                value={<UnrealizedValue value={totalUnrealizedProfit} className="text-sm" />}
              />
              <SnapshotRow
                label={t('dashboard.overallRoi')}
                value={`${formatNumber(inventorySummary.totalROI)}%`}
                valueClassName={inventorySummary.totalROI >= 0 ? 'text-lime-500' : 'text-rose-400'}
              />
            </div>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="w-full gap-1 font-mono text-xs">
                {t('dashboard.viewInventory')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="h-full border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.topCard')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!topCard ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="flex h-full gap-3">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
                  {topCard.imageUrl ? (
                    <Image
                      src={topCard.imageUrl}
                      alt={topCard.cardName}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">
                      <Package className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between space-y-1">
                  <div className="truncate font-mono text-sm font-semibold text-zinc-200">
                    {topCard.cardName}
                  </div>
                  <div className="truncate font-mono text-[10px] text-zinc-500">
                    {[topCard.setCode, topCard.cardNumber, topCard.rarity].filter(Boolean).join(' · ')}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {topCard.condition && (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        {topCard.condition}
                      </Badge>
                    )}
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {topCard.game}
                    </Badge>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {topCard.cardType}
                    </Badge>
                  </div>
                  <div className="pt-1">
                    <div className="font-mono text-[10px] text-zinc-500">{t('inventoryGridCard.marketValue')}</div>
                    <div className="font-mono text-lg font-bold text-lime-500">
                      {formatCurrency(topCard.marketValuePerUnit)}
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                    <span>{t('inventoryGridCard.qty')} {topCard.quantity}</span>
                    <span>{formatCurrency(topCard.currentValue)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.topProfit')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!topProfitCard ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="flex h-full gap-3">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
                  {topProfitCard.imageUrl ? (
                    <Image
                      src={topProfitCard.imageUrl}
                      alt={topProfitCard.cardName}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">
                      <Package className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between space-y-1">
                  <div className="truncate font-mono text-sm font-medium text-zinc-200">
                    {topProfitCard.cardName}
                  </div>
                  <div className="font-mono text-[10px] text-zinc-500">
                    {t('inventoryGridCard.soldAt')} {formatDate(topProfitCard.soldAt || topProfitCard.createdAt)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {topProfitCard.game}
                    </Badge>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {topProfitCard.cardType}
                    </Badge>
                  </div>
                  <div className="pt-1">
                    <div className="font-mono text-[10px] text-zinc-500">{t('inventoryGridCard.profit')}</div>
                    <div className="font-mono text-lg font-bold text-lime-500">
                      {formatCurrency(topProfitCard.profit)}
                    </div>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                    <span>{t('dashboard.soldFor')} {formatCurrency(topProfitCard.totalSold)}</span>
                    <span>
                      ROI{' '}
                      {topProfitCard.averageCost > 0 && topProfitCard.soldQty > 0
                        ? `${formatNumber((topProfitCard.profit / (topProfitCard.soldQty * topProfitCard.averageCost)) * 100)}%`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.lastAdded')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!lastAddedCard ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="flex h-full gap-3">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-950">
                  {lastAddedCard.imageUrl ? (
                    <Image
                      src={lastAddedCard.imageUrl}
                      alt={lastAddedCard.cardName}
                      fill
                      sizes="88px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-zinc-600">
                      <Package className="h-7 w-7" />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between space-y-1">
                  <div className="truncate font-mono text-sm font-medium text-zinc-200">
                    {lastAddedCard.cardName}
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-500">
                    <Clock className="h-3 w-3" />
                    {formatDate(lastAddedCard.createdAt)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {lastAddedCard.game}
                    </Badge>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {lastAddedCard.cardType}
                    </Badge>
                  </div>
                  <div className="flex justify-between font-mono text-[10px] text-zinc-500">
                    <span>{t('inventoryGridCard.qty')} {lastAddedCard.quantity}</span>
                    <span>{formatCurrency(lastAddedCard.averageCost)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-zinc-800 bg-zinc-900/50 md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.byGame')}</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col justify-between">
            {gameBreakdown.length === 0 ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {gameBreakdown.map((g) => (
                  <div key={g.game} className="flex flex-col gap-0.5 rounded-md border border-zinc-800 bg-zinc-950 p-2">
                    <span className="font-mono text-xs text-zinc-400">{g.game}</span>
                    <div className="font-mono text-xs text-zinc-200">
                      {g.count} {t('common.cards')} · <span className="text-[10px] text-zinc-500">{formatCurrency(g.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-full border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-sm">{t('dashboard.byCardType')}</CardTitle>
          </CardHeader>
          <CardContent className="h-full flex flex-col justify-between">
            {typeBreakdown.length === 0 ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="space-y-1.5">
                {typeBreakdown.map((typeItem) => (
                  <div key={typeItem.type} className="flex flex-col gap-0.5">
                    <span className="font-mono text-xs text-zinc-400">{typeItem.type}</span>
                    <div className="font-mono text-xs text-zinc-200">
                      {typeItem.count} {t('common.cards')} · <span className="text-[10px] text-zinc-500">{formatCurrency(typeItem.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm">{t('dashboard.recentTransactions')}</CardTitle>
          <Link href="/transactions">
            <Button variant="ghost" size="sm" className="gap-1 font-mono text-xs">
              {t('common.viewAll')} <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="py-8 text-center font-mono text-sm text-zinc-500">
              {t('dashboard.noTransactions')}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2 pr-4">{t('transactions.table.date')}</th>
                      <th className="pb-2 pr-4">{t('transactions.table.card')}</th>
                      <th className="pb-2 pr-4">{t('transactions.table.type')}</th>
                      <th className="pb-2 pr-4">{t('transactions.table.qty')}</th>
                      <th className="pb-2 pr-4">{t('transactions.table.price')}</th>
                      <th className="pb-2">{t('common.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((tx) => (
                      <tr key={tx.id} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-4 text-zinc-400">{formatDate(tx.date)}</td>
                        <td className="py-3 pr-4 text-zinc-200">{tx.card?.name}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : tx.type === 'COST_ADJUSTMENT' ? 'default' : 'grading'}>
                            {tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : tx.type === 'COST_ADJUSTMENT' ? t('transactions.adjustment') : t('transactions.grading')}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-zinc-300">{tx.quantity}</td>
                        <td className="py-3 pr-4 text-zinc-300">{formatCurrency(Number(tx.pricePerUnit))}</td>
                        <td className="py-3 text-zinc-300">{formatCurrency(Number(tx.totalAmount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-3 md:hidden">
                {recent.map((tx) => (
                  <div key={tx.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-zinc-400">{formatDate(tx.date)}</span>
                      <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : tx.type === 'COST_ADJUSTMENT' ? 'default' : 'grading'} className="shrink-0">{tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : tx.type === 'COST_ADJUSTMENT' ? t('transactions.adjustment') : t('transactions.grading')}</Badge>
                    </div>
                    <div className="mt-1 min-w-0 break-words font-mono text-sm text-zinc-200">{tx.card?.name}</div>
                    <div className="mt-2 flex items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-zinc-500">{tx.quantity} × {formatCurrency(Number(tx.pricePerUnit))}</span>
                      <span className="min-w-0 break-words text-right text-zinc-200">{formatCurrency(Number(tx.totalAmount))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
