'use client'

import { useState } from 'react'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { MonthlyReport } from '@/types'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { AnimatedCurrency, AnimatedNumber } from '@/components/ui/animated-value'
import { useLanguage } from '@/lib/i18n/provider'
import { fetcher, swrOptions } from '@/lib/swr'
import { ReportsSkeleton } from '@/components/reports/reports-skeleton'

const MonthlyChart = dynamic(() => import('@/components/reports/monthly-chart').then((mod) => mod.MonthlyChart), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-800" />,
})
import { Download, TrendingUp, TrendingDown, AlertTriangle, Trash2 } from 'lucide-react'

export default function ReportsPage() {
  const { t } = useLanguage()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [resetDialog, setResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetting, setResetting] = useState(false)

  const reportParams = new URLSearchParams()
  if (startDate) reportParams.append('startDate', startDate)
  if (endDate) reportParams.append('endDate', endDate)
  const reportKey = `/api/reports?${reportParams.toString()}`
  const { data: reportData, isLoading: reportLoading } = useSWR<MonthlyReport[]>(reportKey, fetcher, swrOptions)
  const report = reportData ?? []

  const handleExport = () => {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    window.location.href = `/api/reports/export?${params}`
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (resetConfirm !== 'RESET') {
      alert('Please type RESET to confirm')
      return
    }

    setResetting(true)
    try {
      const res = await fetch('/api/portfolio/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword, confirmation: resetConfirm }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setResetDialog(false)
        setResetPassword('')
        setResetConfirm('')
        window.location.reload()
      } else {
        alert(data.error || 'Failed to reset portfolio')
      }
    } catch {
      alert('Failed to reset portfolio')
    } finally {
      setResetting(false)
    }
  }

  if (reportLoading && !reportData) {
    return <ReportsSkeleton />
  }

  const totalProfit = report.reduce((sum, r) => sum + r.totalProfit, 0)
  const totalBuy = report.reduce((sum, r) => sum + r.totalBuy, 0)
  const totalROI = totalBuy > 0 ? (totalProfit / totalBuy) * 100 : 0

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-100">$ {t('reports.title')}</h1>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-zinc-500" />
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-500">{t('common.startDate')}</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 border-zinc-800 bg-zinc-950 px-2 font-mono text-xs text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-zinc-500">{t('common.endDate')}</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 border-zinc-800 bg-zinc-950 px-2 font-mono text-xs text-zinc-200"
              />
            </div>
          </div>
          <Button onClick={handleExport} className="h-8 gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('reports.exportExcel')}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="relative h-28 overflow-hidden border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/70">
          <div className="grid h-full grid-rows-[auto_1fr_auto] gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.totalProfit')}</span>
              <TrendingUp className="h-4 w-4 shrink-0 text-lime-500/60" />
            </div>
            <div className="flex min-w-0 items-center">
              <AnimatedCurrency
                value={totalProfit}
                className={cn('block truncate font-mono text-xl font-bold sm:text-2xl', totalProfit >= 0 ? 'text-lime-500' : 'text-red-400')}
              />
            </div>
            <div className="invisible font-mono text-[10px]">–</div>
          </div>
        </Card>

        <Card className="relative h-28 overflow-hidden border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/70">
          <div className="grid h-full grid-rows-[auto_1fr_auto] gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('reports.totalBuy')}</span>
              <Calendar className="h-4 w-4 shrink-0 text-zinc-400/60" />
            </div>
            <div className="flex min-w-0 items-center">
              <AnimatedCurrency
                value={totalBuy}
                className="block truncate font-mono text-xl font-bold text-zinc-200 sm:text-2xl"
              />
            </div>
            <div className="invisible font-mono text-[10px]">–</div>
          </div>
        </Card>

        <Card className="relative h-28 overflow-hidden border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/70">
          <div className="grid h-full grid-rows-[auto_1fr_auto] gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('reports.totalSell')}</span>
              <TrendingDown className="h-4 w-4 shrink-0 text-blue-400/60" />
            </div>
            <div className="flex min-w-0 items-center">
              <AnimatedCurrency
                value={report.reduce((sum, r) => sum + r.totalSell, 0)}
                className="block truncate font-mono text-xl font-bold text-blue-400 sm:text-2xl"
              />
            </div>
            <div className="invisible font-mono text-[10px]">–</div>
          </div>
        </Card>

        <Card className="relative h-28 overflow-hidden border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700/80 hover:bg-zinc-900/70">
          <div className="grid h-full grid-rows-[auto_1fr_auto] gap-1">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">{t('common.overallRoi')}</span>
              <TrendingUp className="h-4 w-4 shrink-0 text-lime-500/60" />
            </div>
            <div className="flex min-w-0 items-center">
              <AnimatedNumber
                value={totalROI}
                suffix="%"
                decimals={1}
                className={cn('block truncate font-mono text-xl font-bold sm:text-2xl', totalROI >= 0 ? 'text-lime-500' : 'text-red-400')}
              />
            </div>
            <div className="invisible font-mono text-[10px]">–</div>
          </div>
        </Card>
      </div>

      <MonthlyChart data={report} />

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">{t('reports.monthlyBreakdown')}</CardTitle>
        </CardHeader>
        <CardContent>
          {report.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              {t('reports.noData')}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left font-mono text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500">
                      <th className="pb-2 pr-4">period</th>
                      <th className="pb-2 pr-4 text-right">buy</th>
                      <th className="pb-2 pr-4 text-right">buy qty</th>
                      <th className="pb-2 pr-4 text-right">sell</th>
                      <th className="pb-2 pr-4 text-right">sell qty</th>
                      <th className="pb-2 pr-4 text-right">cost basis</th>
                      <th className="pb-2 pr-4 text-right">profit</th>
                      <th className="pb-2 pr-4 text-right">roi</th>
                      <th className="pb-2 text-right">txns</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.map((r) => (
                      <tr key={`${r.year}-${r.month}`} className="border-b border-zinc-800/50 last:border-0">
                        <td className="py-3 pr-4 text-zinc-300">
                          {r.month.toString().padStart(2, '0')}/{r.year}
                        </td>
                        <td className="py-3 pr-4 text-right text-zinc-400">{formatCurrency(r.totalBuy)}</td>
                        <td className="py-3 pr-4 text-right text-zinc-400">{r.buyQty}</td>
                        <td className="py-3 pr-4 text-right text-zinc-400">{formatCurrency(r.totalSell)}</td>
                        <td className="py-3 pr-4 text-right text-zinc-400">{r.sellQty}</td>
                        <td className="py-3 pr-4 text-right text-zinc-500">{formatCurrency(r.costBasisSold)}</td>
                        <td className="py-3 pr-4 text-right">
                          <span className={r.totalProfit >= 0 ? 'text-lime-500' : 'text-red-400'}>
                            {formatCurrency(r.totalProfit)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <Badge variant={r.roi >= 0 ? 'default' : 'destructive'}>
                            {formatNumber(r.roi)}%
                          </Badge>
                        </td>
                        <td className="py-3 text-right text-zinc-400">{r.transactionCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="space-y-2 md:hidden">
                {report.map((r) => (
                  <div key={`${r.year}-${r.month}`} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-zinc-200">
                        {r.month.toString().padStart(2, '0')}/{r.year}
                      </span>
                      <Badge variant={r.roi >= 0 ? 'default' : 'destructive'} className="shrink-0">
                        {formatNumber(r.roi)}%
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                      <div className="min-w-0">
                        <div className="text-zinc-500">{t('reports.table.buy')} ({r.buyQty})</div>
                        <div className="break-words text-zinc-300">{formatCurrency(r.totalBuy)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">{t('reports.table.sell')} ({r.sellQty})</div>
                        <div className="break-words text-zinc-300">{formatCurrency(r.totalSell)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">{t('reports.table.costBasis')}</div>
                        <div className="break-words text-zinc-400">{formatCurrency(r.costBasisSold)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">{t('reports.table.profit')}</div>
                        <div className={r.totalProfit >= 0 ? 'break-words text-lime-500' : 'break-words text-red-400'}>
                          {formatCurrency(r.totalProfit)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">
                      {t('transactions.transactionCount', { count: r.transactionCount })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-900/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm text-red-400">
            <AlertTriangle className="h-4 w-4" />
            {t('reports.dangerZone')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-mono text-xs text-zinc-400">
            {t('reports.dangerZoneDescription')}
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setResetDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('reports.resetPortfolio')}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <form onSubmit={handleReset}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              {t('reports.resetDialog.confirmTitle')}
            </DialogTitle>
            <DialogDescription>
              {t('reports.resetDialog.confirmDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-400">{t('reports.resetDialog.password')}</label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="your password"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-400">{t('reports.resetDialog.confirmText')}</label>
              <Input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder={t('reports.resetDialog.placeholder')}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setResetDialog(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={resetting || resetConfirm !== 'RESET' || !resetPassword}
            >
              {resetting ? t('reports.resetDialog.resetting') : t('reports.resetDialog.confirmButton')}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
