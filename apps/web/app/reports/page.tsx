'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
import { formatCurrency, formatNumber } from '@/lib/utils'
import { Download, TrendingUp, TrendingDown, Calendar, AlertTriangle, Trash2 } from 'lucide-react'

export default function ReportsPage() {
  const { status } = useSession()
  const [report, setReport] = useState<MonthlyReport[]>([])
  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [loading, setLoading] = useState(true)

  const [resetDialog, setResetDialog] = useState(false)
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    const fetchReport = async () => {
      const params = new URLSearchParams()
      if (filterYear) params.append('year', filterYear)
      if (filterMonth) params.append('month', filterMonth)

      const res = await fetch(`/api/reports?${params}`)
      const data = await res.json()
      if (!cancelled) {
        setReport(data)
        setLoading(false)
      }
    }

    fetchReport()

    return () => {
      cancelled = true
    }
  }, [status, filterYear, filterMonth])

  const handleExport = () => {
    const params = new URLSearchParams()
    if (filterYear) params.append('year', filterYear)
    if (filterMonth) params.append('month', filterMonth)
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">calculating...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

  const totalProfit = report.reduce((sum, r) => sum + r.totalProfit, 0)
  const totalBuy = report.reduce((sum, r) => sum + r.totalBuy, 0)
  const totalROI = totalBuy > 0 ? (totalProfit / totalBuy) * 100 : 0

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-100">$ reports</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            <option value="">all years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">all months</option>
            {months.map((m) => (
              <option key={m} value={m}>{m.padStart(2, '0')}</option>
            ))}
          </Select>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">export excel</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5" />
              total profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`min-w-0 break-words font-mono text-xl font-bold sm:text-2xl ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
              <Calendar className="h-3.5 w-3.5" />
              total buy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 break-words font-mono text-xl font-bold text-zinc-200 sm:text-2xl">
              {formatCurrency(totalBuy)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
              <TrendingDown className="h-3.5 w-3.5" />
              total sell
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 break-words font-mono text-xl font-bold text-blue-400 sm:text-2xl">
              {formatCurrency(report.reduce((sum, r) => sum + r.totalSell, 0))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-mono text-xs font-normal text-zinc-500">
              <TrendingUp className="h-3.5 w-3.5" />
              overall roi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`min-w-0 break-words font-mono text-xl font-bold sm:text-2xl ${totalROI >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatNumber(totalROI)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="font-mono text-sm">monthly breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {report.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              no data available for the selected period
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
                          <span className={r.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
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
                        <div className="text-zinc-500">buy ({r.buyQty})</div>
                        <div className="break-words text-zinc-300">{formatCurrency(r.totalBuy)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">sell ({r.sellQty})</div>
                        <div className="break-words text-zinc-300">{formatCurrency(r.totalSell)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">cost basis</div>
                        <div className="break-words text-zinc-400">{formatCurrency(r.costBasisSold)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-zinc-500">profit</div>
                        <div className={r.totalProfit >= 0 ? 'break-words text-emerald-400' : 'break-words text-red-400'}>
                          {formatCurrency(r.totalProfit)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-1 font-mono text-xs text-zinc-500">
                      {r.transactionCount} transactions
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
            danger zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 font-mono text-xs text-zinc-400">
            Resetting your portfolio will permanently delete all cards, transactions, inventory records, and grading records. This cannot be undone.
          </p>
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            onClick={() => setResetDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            reset portfolio
          </Button>
        </CardContent>
      </Card>

      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <form onSubmit={handleReset}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              Reset portfolio
            </DialogTitle>
            <DialogDescription>
              This will delete all your portfolio data. Enter your password and type RESET to confirm.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-400">password</label>
              <Input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="your password"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-xs text-zinc-400">type RESET to confirm</label>
              <Input
                type="text"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                placeholder="RESET"
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
              cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant="destructive"
              disabled={resetting || resetConfirm !== 'RESET' || !resetPassword}
            >
              {resetting ? 'resetting...' : 'yes, reset everything'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
