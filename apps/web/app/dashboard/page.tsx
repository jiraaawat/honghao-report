'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DashboardStats } from '@/types'
import { TransactionDto, InventoryItem, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { FullPageLoader } from '@/components/ui/loading'
import {
  ArrowRight,
  Receipt,
  Package,
  TrendingUp,
  Calendar,
  Plus,
  Boxes,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react'

function formatInputDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return { start, end }
}

function getTodayRange(date = new Date()) {
  return { start: new Date(date), end: new Date(date) }
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recent, setRecent] = useState<TransactionDto[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [inventorySummary, setInventorySummary] = useState({
    totalCards: 0,
    inStock: 0,
    grading: 0,
    soldOut: 0,
    totalValue: 0,
    totalInvested: 0,
    totalProfit: 0,
    totalROI: 0,
  })
  const [loading, setLoading] = useState(true)
  const [{ startDate, endDate }, setDateRange] = useState(() => {
    const { start, end } = getMonthRange()
    return { startDate: formatInputDate(start), endDate: formatInputDate(end) }
  })

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)

    Promise.all([
      fetch(`/api/dashboard?${params.toString()}`).then((r) => r.json()),
      fetch('/api/transactions?limit=5').then((r) => r.json()),
      fetch('/api/inventory').then((r) => r.json()),
    ])
      .then(([statsData, recentData, inventoryData]) => {
        if (cancelled) return
        setStats(statsData)
        setRecent(recentData.slice(0, 5))
        setInventory(inventoryData.items)
        setInventorySummary({
          totalCards: inventoryData.summary.totalCards,
          inStock: inventoryData.summary.inStock,
          grading: inventoryData.summary.grading,
          soldOut: inventoryData.summary.soldOut,
          totalValue: inventoryData.summary.totalValue,
          totalInvested: inventoryData.summary.totalInvested,
          totalProfit: inventoryData.summary.totalProfit,
          totalROI: inventoryData.summary.totalROI,
        })
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [status, startDate, endDate])

  const setRange = (range: 'month' | 'today' | '7d' | '30d' | 'all') => {
    const today = new Date()
    let start: Date
    let end: Date

    switch (range) {
      case 'month':
        ;({ start, end } = getMonthRange(today))
        break
      case 'today':
        ;({ start, end } = getTodayRange(today))
        break
      case '7d':
        start = addDays(today, -6)
        end = today
        break
      case '30d':
        start = addDays(today, -29)
        end = today
        break
      case 'all':
      default:
        start = new Date(2020, 0, 1)
        end = today
        break
    }

    setDateRange({ startDate: formatInputDate(start), endDate: formatInputDate(end) })
  }

  if (status === 'loading' || loading) {
    return <FullPageLoader />
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
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

  const statItems = [
    {
      labelKey: 'dashboard.totalSpend',
      value: stats ? formatCurrency(stats.totalSpend) : '-',
      icon: ArrowDownCircle,
      color: 'text-zinc-200',
    },
    {
      labelKey: 'dashboard.totalSell',
      value: stats ? formatCurrency(stats.totalSell) : '-',
      icon: ArrowUpCircle,
      color: 'text-emerald-400',
    },
    {
      labelKey: 'dashboard.profitLoss',
      value: stats ? formatCurrency(stats.periodProfit) : '-',
      icon: TrendingUp,
      color: stats && stats.periodProfit >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      labelKey: 'dashboard.transactions',
      value: stats?.totalTransactions ?? 0,
      icon: Receipt,
      color: 'text-blue-400',
    },
    {
      labelKey: 'dashboard.activeCards',
      value: stats?.totalCards ?? 0,
      icon: Package,
      color: 'text-emerald-400',
    },
    {
      labelKey: 'dashboard.soldCards',
      value: stats?.totalSoldCards ?? 0,
      icon: Boxes,
      color: 'text-amber-400',
    },
  ] as const

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">$ {t('dashboard.title')}</h1>
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

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <Calendar className="h-4 w-4" />
            {t('dashboard.dateRange')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(['month', 'today', '7d', '30d', 'all'] as const).map((range) => (
              <Button
                key={range}
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={() => setRange(range)}
              >
                {range === 'month' && t('dashboard.thisMonth')}
                {range === 'today' && t('dashboard.today')}
                {range === '7d' && t('dashboard.last7Days')}
                {range === '30d' && t('dashboard.last30Days')}
                {range === 'all' && t('dashboard.allTime')}
              </Button>
            ))}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-500">{t('common.startDate')}</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                className="border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-500">{t('common.endDate')}</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                className="border-zinc-800 bg-zinc-950 font-mono text-sm text-zinc-200"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {statItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.labelKey} className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
                  <Icon className="h-3.5 w-3.5" />
                  {t(item.labelKey)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`min-w-0 break-words font-mono text-xl font-bold sm:text-2xl ${item.color}`}>{item.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm">{t('dashboard.inventorySnapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('inventory.totalCards')}</span>
                <span className="font-mono text-zinc-200">{inventorySummary.totalCards}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('inventory.inStock')}</span>
                <span className="font-mono text-emerald-400">{inventorySummary.inStock}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('inventory.grading')}</span>
                <span className="font-mono text-amber-400">{inventorySummary.grading}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('dashboard.soldCards')}</span>
                <span className="font-mono text-amber-400">{inventorySummary.soldOut}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('dashboard.totalInvested')}</span>
                <span className="font-mono text-zinc-200">
                  {formatCurrency(inventorySummary.totalInvested)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('dashboard.totalValue')}</span>
                <span className="font-mono text-zinc-200">{formatCurrency(inventorySummary.totalValue)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('dashboard.totalProfit')}</span>
                <span
                  className={`font-mono ${
                    inventorySummary.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatCurrency(inventorySummary.totalProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="font-mono text-xs text-zinc-400">{t('dashboard.overallRoi')}</span>
                <span
                  className={`font-mono ${
                    inventorySummary.totalROI >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatNumber(inventorySummary.totalROI)}%
                </span>
              </div>
            </div>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" className="w-full gap-1 font-mono text-xs">
                {t('dashboard.viewInventory')} <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm">{t('dashboard.byGame')}</CardTitle>
          </CardHeader>
          <CardContent>
            {gameBreakdown.length === 0 ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="space-y-2">
                {gameBreakdown.map((g) => (
                  <div key={g.game} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-400">{g.game}</span>
                    <div className="text-right">
                      <div className="font-mono text-sm text-zinc-200">{g.count} {t('common.cards')}</div>
                      <div className="font-mono text-xs text-zinc-500">{formatCurrency(g.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-mono text-sm">{t('dashboard.byCardType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {typeBreakdown.length === 0 ? (
              <div className="py-4 text-center font-mono text-xs text-zinc-500">{t('common.noData')}</div>
            ) : (
              <div className="space-y-2">
                {typeBreakdown.map((typeItem) => (
                  <div key={typeItem.type} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-zinc-400">{typeItem.type}</span>
                    <div className="text-right">
                      <div className="font-mono text-sm text-zinc-200">{typeItem.count} {t('common.cards')}</div>
                      <div className="font-mono text-xs text-zinc-500">{formatCurrency(typeItem.value)}</div>
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
                          <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : 'grading'}>
                            {tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : t('transactions.grading')}
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
                  <div key={tx.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-zinc-400">{formatDate(tx.date)}</span>
                      <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : 'grading'} className="shrink-0">{tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : t('transactions.grading')}</Badge>
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
