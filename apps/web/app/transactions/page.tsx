'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import useSWR from 'swr'
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
import { TransactionDto, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'

import { useLanguage } from '@/lib/i18n/provider'
import { useSession } from 'next-auth/react'
import { fetcher, swrOptions } from '@/lib/swr'
import { FlexCard } from '@/components/flex-card'
import { InlineLoader } from '@/components/ui/loading'
import { TransactionsSkeleton } from '@/components/transactions/transactions-skeleton'
import { Search, Calendar, ChevronUp, ChevronDown, Zap, Download, Share2, Eye } from 'lucide-react'

export default function TransactionsPage() {
  const { t } = useLanguage()

  const [filterYear, setFilterYear] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterCardType, setFilterCardType] = useState('')
  const [filterGame, setFilterGame] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const txParams = useMemo(() => {
    const params = new URLSearchParams()
    if (filterYear) params.append('year', filterYear)
    if (filterMonth) params.append('month', filterMonth)
    if (search) params.append('search', search)
    if (filterType) params.append('type', filterType)
    if (filterCardType) params.append('cardType', filterCardType)
    if (filterGame) params.append('game', filterGame)
    return params
  }, [filterYear, filterMonth, search, filterType, filterCardType, filterGame])

  const txKey = `/api/transactions?${txParams.toString()}`
  const { data: txData, isLoading: txLoading } = useSWR<TransactionDto[]>(txKey, fetcher, swrOptions)
  const transactions = txData ?? []

  const { data: session } = useSession()
  const [flexTx, setFlexTx] = useState<TransactionDto | null>(null)
  const [flexOpen, setFlexOpen] = useState(false)
  const [flexVariant, setFlexVariant] = useState<'wide' | 'portrait'>('wide')
  const flexRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const cardWidth = flexVariant === 'wide' ? 1200 : 720
  const cardHeight = flexVariant === 'wide' ? 630 : 1080

  const [previewScale, setPreviewScale] = useState(() => {
    if (typeof window === 'undefined') return 1
    const width = window.innerWidth - 48
    const maxHeight = window.innerHeight * 0.6
    return Math.max(0.25, Math.min(1, width / cardWidth, maxHeight / cardHeight))
  })

  useEffect(() => {
    const calc = () => {
      const width = previewRef.current?.clientWidth ?? window.innerWidth - 48
      const maxHeight = window.innerHeight * 0.6
      const scale = Math.min(1, width / cardWidth, maxHeight / cardHeight)
      setPreviewScale(Math.max(scale, 0.25))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [cardWidth, cardHeight])

  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString()),
    []
  )
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => (i + 1).toString()), [])



  const handleFlex = (tx: TransactionDto) => {
    if (tx.type !== 'SELL') return
    setFlexTx(tx)
    setFlexOpen(true)
  }

  const closeFlex = () => {
    setFlexOpen(false)
    setFlexTx(null)
  }

  const handleFlexDownload = async () => {
    if (!flexTx || !flexRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(flexRef.current, { pixelRatio: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `flex-${flexTx.id}.png`
      link.click()
    } catch (err) {
      console.error(err)
    }
  }

  const handleFlexShare = async () => {
    if (!flexTx || !flexRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(flexRef.current, { pixelRatio: 2 })
      const blob = await fetch(dataUrl).then((r) => r.blob())
      const file = new File([blob], `flex-${flexTx.id}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('flexCard.shareTitle'),
          text: t('flexCard.shareText', { name: flexTx.card?.name ?? '', amount: formatCurrency(Number(flexTx.totalAmount)) }),
        })
      } else {
        handleFlexDownload()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const clearFilters = () => {
    setFilterYear('')
    setFilterMonth('')
    setSearch('')
    setFilterType('')
    setFilterCardType('')
    setFilterGame('')
  }

  if (txLoading && !txData) {
    return <TransactionsSkeleton />
  }

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="font-mono text-2xl font-bold text-zinc-100">$ {t('transactions.title')}</h1>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm">{t('common.filters')}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters((v) => !v)}
            className="gap-1 md:hidden font-mono text-xs"
          >
            {showFilters ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {t('common.filters')}
          </Button>
        </CardHeader>
        <CardContent className={!showFilters ? 'hidden md:block' : ''}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder={t('transactions.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">{t('transactions.allTypes')}</option>
              <option value="BUY">{t('transactions.buy')}</option>
              <option value="SELL">{t('transactions.sell')}</option>
            </Select>

            <Select value={filterCardType} onChange={(e) => setFilterCardType(e.target.value)}>
              <option value="">{t('transactions.allCardTypes')}</option>
              {CARD_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>

            <Select value={filterGame} onChange={(e) => setFilterGame(e.target.value)}>
              <option value="">{t('transactions.allGames')}</option>
              {GAMES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-500" />
              <Select value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">{t('transactions.allYears')}</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </Select>
            </div>

            <Select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              <option value="">{t('transactions.allMonths')}</option>
              {months.map((m) => (
                <option key={m} value={m}>{m.padStart(2, '0')}</option>
              ))}
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[search, filterType, filterCardType, filterGame, filterYear, filterMonth].some(Boolean) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="font-mono text-xs">
                {t('transactions.clearFilters')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader>
            <CardTitle className="font-mono text-sm">
              {t('transactions.transactionsWithCount', { count: transactions.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txLoading ? (
              <InlineLoader />
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center font-mono text-sm text-zinc-500">
                {t('transactions.noTransactionsForPeriod', { month: filterMonth.padStart(2, '0'), year: filterYear })}
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
                        <th className="pb-2 pr-4">{t('transactions.table.game')}</th>
                        <th className="pb-2 pr-4">{t('transactions.table.qty')}</th>
                        <th className="pb-2 pr-4">{t('transactions.table.price')}</th>
                        <th className="pb-2 pr-4">{t('transactions.table.shipping')}</th>
                        <th className="pb-2 pr-4">{t('transactions.table.total')}</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="h-16 border-b border-zinc-800/50 last:border-0">
                          <td className="align-middle py-0 pr-4 text-zinc-400">{formatDate(tx.date)}</td>
                          <td className="align-middle py-0 pr-4">
                            <div className="flex max-w-[220px] flex-col">
                              <span className="truncate text-zinc-200">{tx.card?.name}</span>
                              <span className="truncate text-xs text-zinc-500">{tx.card?.cardType}</span>

                            </div>
                          </td>
                          <td className="align-middle py-0 pr-4">
                            <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : tx.type === 'GRADING' ? 'grading' : 'default'}>
                              {tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : tx.type === 'GRADING' ? t('transactions.grading') : t('transactions.adjustment')}
                            </Badge>
                          </td>
                          <td className="align-middle py-0 pr-4 text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              {tx.card?.game}
                            </div>
                          </td>
                          <td className="align-middle py-0 pr-4 text-zinc-300">{tx.quantity}</td>
                          <td className="align-middle py-0 pr-4 text-zinc-300">
                            {formatCurrency(Number(tx.pricePerUnit))}
                          </td>
                          <td className="align-middle py-0 pr-4 text-zinc-300">
                            {tx.shippingCost ? formatCurrency(Number(tx.shippingCost)) : '-'}
                          </td>
                          <td className="align-middle py-0 pr-4 text-zinc-300">
                            {formatCurrency(Number(tx.totalAmount))}
                          </td>
                          <td className="align-middle py-0 text-right">
                            {tx.type === 'SELL' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFlex(tx)}
                                className="h-8 w-8 text-orange-400 hover:text-orange-300"
                                title="FLEX"
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigator.clipboard?.writeText(tx.id)}
                              className="h-8 w-8 text-zinc-500 hover:text-blue-400"
                              title={`TX ID: ${tx.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid grid-cols-1 gap-3 md:hidden">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex h-40 flex-col overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                      <div className="flex min-h-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="line-clamp-2 font-mono text-sm leading-tight text-zinc-200">{tx.card?.name}</div>
                          <div className="truncate font-mono text-xs text-zinc-500">{tx.card?.cardType} · {tx.card?.game}</div>

                        </div>
                        <Badge variant={tx.type === 'BUY' ? 'buy' : tx.type === 'SELL' ? 'sell' : tx.type === 'GRADING' ? 'grading' : 'default'} className="shrink-0">{tx.type === 'BUY' ? t('transactions.buy') : tx.type === 'SELL' ? t('transactions.sell') : tx.type === 'GRADING' ? t('transactions.grading') : t('transactions.adjustment')}</Badge>
                      </div>
                      <div className="mt-2 flex shrink-0 items-center justify-between gap-2 font-mono text-xs">
                        <span className="text-zinc-500">{formatDate(tx.date)}</span>
                        <span className="min-w-0 truncate text-right text-zinc-300">{tx.quantity} × {formatCurrency(Number(tx.pricePerUnit))}</span>
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-2 font-mono text-xs">
                        <span className="truncate text-zinc-500">{t('transactions.table.shipping')} {tx.shippingCost ? formatCurrency(Number(tx.shippingCost)) : '-'}</span>
                        <span className="min-w-0 truncate text-right font-medium text-zinc-200">{formatCurrency(Number(tx.totalAmount))}</span>
                      </div>
                      <div className="mt-auto flex shrink-0 justify-end gap-1">
                        {tx.type === 'SELL' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleFlex(tx)}
                            className="h-8 w-8 text-orange-400 hover:text-orange-300"
                            title="FLEX"
                          >
                            <Zap className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigator.clipboard?.writeText(tx.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-blue-400"
                          title={`TX ID: ${tx.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

      <Dialog open={flexOpen} onOpenChange={(v) => !v && closeFlex()} className="max-w-7xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="flex items-center gap-2 font-mono text-base">
              <Zap className="h-4 w-4 text-orange-400" />
              {t('flexCard.previewTitle')}
            </DialogTitle>
            <div className="flex rounded-lg border border-zinc-700 bg-zinc-950 p-0.5">
              <button
                type="button"
                onClick={() => setFlexVariant('wide')}
                className={`rounded px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                  flexVariant === 'wide' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Wide
              </button>
              <button
                type="button"
                onClick={() => setFlexVariant('portrait')}
                className={`rounded px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                  flexVariant === 'portrait' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Portrait
              </button>
            </div>
          </div>
          <DialogDescription>{flexTx?.card?.name}</DialogDescription>
        </DialogHeader>

        {flexTx && (
          <>
            <div ref={previewRef} className="w-full">
              <div className="flex items-center justify-center py-2 sm:py-4">
                <div
                  className="rounded-2xl border border-zinc-800/70 bg-zinc-950/60 p-3 shadow-2xl"
                  style={{
                    width: (cardWidth + 24) * previewScale,
                    height: (cardHeight + 24) * previewScale,
                  }}
                >
                  <div
                    className="rounded-xl"
                    style={{ zoom: previewScale, width: cardWidth, height: cardHeight }}
                  >
                    <FlexCard tx={flexTx} userName={session?.user?.name} variant={flexVariant} />
                  </div>
                </div>
              </div>
            </div>
            <div className="fixed -left-[9999px] top-0">
              <FlexCard ref={flexRef} tx={flexTx} userName={session?.user?.name} variant={flexVariant} />
            </div>
          </>
        )}

        <DialogFooter className="flex-wrap justify-center gap-2 sm:justify-end">
          <Button variant="ghost" size="sm" onClick={closeFlex}>
            {t('common.cancel')}
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleFlexDownload}>
            <Download className="h-4 w-4" />
            {t('flexCard.download')}
          </Button>
          <Button size="sm" className="gap-2" onClick={handleFlexShare}>
            <Share2 className="h-4 w-4" />
            {t('flexCard.share')}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
}
