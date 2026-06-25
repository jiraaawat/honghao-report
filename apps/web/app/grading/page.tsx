'use client'

import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GRADES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { fetcher, swrOptions } from '@/lib/swr'
import { GradingSkeleton } from '@/components/grading/grading-skeleton'
import { Plus, CheckCircle, XCircle, Gem, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'

interface GradingWithCard {
  id: string
  cardId: string
  status: 'grading' | 'completed' | 'cancelled'
  quantity: number
  gradingCost: number
  grade?: string | null
  currentValue?: number | null
  sentDate: string
  completedDate?: string | null
  cancelledDate?: string | null
  card?: {
    id: string
    name: string
    setCode?: string | null
    cardNumber?: string | null
    rarity?: string | null
    cardType?: string | null
    game?: string | null
  }
}

export default function GradingPage() {
  const { t } = useLanguage()
  const [completeForm, setCompleteForm] = useState<Record<string, { grade: string; currentValue: string }>>({})
  const [showCompleted, setShowCompleted] = useState(false)

  const { data: gradingsData, mutate: mutateGradings } = useSWR<GradingWithCard[]>('/api/grading?status=grading', fetcher, swrOptions)
  const { data: completedData, mutate: mutateCompleted } = useSWR<GradingWithCard[]>('/api/grading?status=completed', fetcher, swrOptions)
  const gradings = gradingsData ?? []
  const completed = completedData ?? []

  const mutateAll = () => {
    mutateGradings()
    mutateCompleted()
  }

  const handleCancel = async (id: string) => {
    if (!confirm(t('grading.cancelConfirm'))) return
    const res = await fetch(`/api/grading/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    if (res.ok) {
      await mutateAll()
    }
  }

  const handleComplete = async (id: string) => {
    const form = completeForm[id]
    if (!form?.grade || !form?.currentValue) return

    const res = await fetch(`/api/grading/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        grade: form.grade,
        currentValue: Number(form.currentValue),
        date: new Date().toISOString(),
      }),
    })

    if (res.ok) {
      setCompleteForm((prev) => ({ ...prev, [id]: { grade: '', currentValue: '' } }))
      await mutateAll()
    }
  }

  if ((!gradingsData || !completedData)) {
    return <GradingSkeleton />
  }

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">$ {t('grading.title')}</h1>
          <p className="font-mono text-sm text-zinc-500">{t('grading.subtitle')}</p>
        </div>
        <Link href="/grading/send">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('grading.sendCard')}
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <Gem className="h-4 w-4 text-amber-400" />
            {t('grading.currentlyGradingWithCount', { count: gradings.length })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gradings.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              {t('grading.noCards')}
              <div className="mt-2">
                <Link href="/grading/send">
                  <Button variant="outline" size="sm" className="gap-1">
                    {t('grading.sendNow')} <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {gradings.map((g) => (
                <div
                  key={g.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 md:p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="min-w-0 truncate font-mono font-medium text-amber-400">{g.card?.name}</h3>
                        <Badge variant="grading" className="shrink-0">{t('common.grading')}</Badge>
                      </div>
                      <p className="mt-1 min-w-0 truncate font-mono text-xs text-zinc-500">
                        {[g.card?.setCode, g.card?.cardNumber, g.card?.rarity].filter(Boolean).join(' · ')} · {g.card?.game}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 font-mono text-xs text-zinc-400">
                        <span>{t('grading.qty')}: <span className="text-amber-400">{g.quantity}</span></span>
                        <span>{t('grading.target')}: <span className="text-amber-400">{g.grade || '-'}</span></span>
                        <span>{t('grading.cost')}: <span className="text-amber-400">{formatCurrency(Number(g.gradingCost))}</span></span>
                        <span>{t('grading.sent')}: {formatDate(g.sentDate)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 md:min-w-[280px]">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Select
                          value={completeForm[g.id]?.grade || ''}
                          onChange={(e) =>
                            setCompleteForm((prev) => ({
                              ...prev,
                              [g.id]: { ...(prev[g.id] || { currentValue: '' }), grade: e.target.value },
                            }))
                          }
                        >
                          <option value="">{t('grading.selectGrade')}</option>
                          {GRADES.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder={t('grading.currentValue')}
                          value={completeForm[g.id]?.currentValue || ''}
                          onChange={(e) =>
                            setCompleteForm((prev) => ({
                              ...prev,
                              [g.id]: { ...(prev[g.id] || { grade: '' }), currentValue: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => handleComplete(g.id)}
                          disabled={!completeForm[g.id]?.grade || !completeForm[g.id]?.currentValue}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t('grading.complete')}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleCancel(g.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          {t('grading.cancel')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card className="border-zinc-800 bg-zinc-900/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              {t('grading.completedGradingsWithCount', { count: completed.length })}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted((v) => !v)}
              className="gap-1 md:hidden font-mono text-xs"
            >
              {showCompleted ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showCompleted ? t('common.hide') : t('common.show')}
            </Button>
          </CardHeader>
          <CardContent className={!showCompleted ? 'hidden md:block' : ''}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-2 pr-4">{t('grading.table.card')}</th>
                    <th className="pb-2 pr-4">{t('grading.table.qty')}</th>
                    <th className="pb-2 pr-4">{t('grading.table.grade')}</th>
                    <th className="pb-2 pr-4">{t('grading.table.cost')}</th>
                    <th className="pb-2 pr-4">{t('grading.table.currentValue')}</th>
                    <th className="pb-2">{t('grading.table.completed')}</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((g) => (
                    <tr key={g.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 pr-4 text-zinc-200">{g.card?.name}</td>
                      <td className="py-3 pr-4 text-zinc-400">{g.quantity}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="default">{g.grade}</Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">{formatCurrency(Number(g.gradingCost))}</td>
                      <td className="py-3 pr-4 text-emerald-400">{formatCurrency(Number(g.currentValue))}</td>
                      <td className="py-3 text-zinc-500">
                        {g.completedDate ? formatDate(g.completedDate) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 md:hidden">
              {completed.map((g) => (
                <div key={g.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-mono text-sm text-zinc-200">{g.card?.name}</span>
                    <Badge variant="default" className="shrink-0">{g.grade}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="min-w-0">
                      <div className="text-zinc-500">{t('grading.table.cost')}</div>
                      <div className="break-words text-zinc-300">{formatCurrency(Number(g.gradingCost))}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-zinc-500">{t('grading.table.currentValue')}</div>
                      <div className="break-words text-emerald-400">{formatCurrency(Number(g.currentValue))}</div>
                    </div>
                  </div>
                  <div className="mt-1 min-w-0 break-words font-mono text-xs text-zinc-500">
                    {g.completedDate ? formatDate(g.completedDate) : '-'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
