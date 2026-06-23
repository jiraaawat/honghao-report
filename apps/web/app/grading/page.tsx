'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GRADES } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, CheckCircle, XCircle, Gem, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react'

interface GradingWithCard {
  id: string
  cardId: string
  status: 'grading' | 'completed' | 'cancelled'
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
  const { status } = useSession()
  const [gradings, setGradings] = useState<GradingWithCard[]>([])
  const [completed, setCompleted] = useState<GradingWithCard[]>([])
  const [loading, setLoading] = useState(true)
  const [completeForm, setCompleteForm] = useState<Record<string, { grade: string; currentValue: string }>>({})
  const [showCompleted, setShowCompleted] = useState(false)

  const fetchData = useCallback(async () => {
    const [activeRes, completedRes] = await Promise.all([
      fetch('/api/grading?status=grading'),
      fetch('/api/grading?status=completed'),
    ])
    return {
      gradings: (await activeRes.json()) as GradingWithCard[],
      completed: (await completedRes.json()) as GradingWithCard[],
    }
  }, [])

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      const data = await fetchData()
      if (!cancelled) {
        setGradings(data.gradings)
        setCompleted(data.completed)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [status, fetchData])

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this grading? The grading cost will be removed from monthly cost.')) return
    const res = await fetch(`/api/grading/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    })
    if (res.ok) {
      const data = await fetchData()
      setGradings(data.gradings)
      setCompleted(data.completed)
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
      fetchData()
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">loading grading queue...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="space-y-4 p-3 md:space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-mono text-2xl font-bold text-zinc-100">$ grading</h1>
          <p className="font-mono text-sm text-zinc-500">track cards being sent for grading</p>
        </div>
        <Link href="/grading/send">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            send card to grade
          </Button>
        </Link>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <Gem className="h-4 w-4 text-amber-400" />
            currently grading ({gradings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gradings.length === 0 ? (
            <div className="py-12 text-center font-mono text-sm text-zinc-500">
              no cards currently being graded.
              <div className="mt-2">
                <Link href="/grading/send">
                  <Button variant="outline" size="sm" className="gap-1">
                    send one now <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {gradings.map((g) => (
                <div
                  key={g.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3 md:p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="min-w-0 truncate font-mono font-medium text-zinc-100">{g.card?.name}</h3>
                        <Badge variant="grading" className="shrink-0">grading</Badge>
                      </div>
                      <p className="mt-1 min-w-0 truncate font-mono text-xs text-zinc-500">
                        {[g.card?.setCode, g.card?.cardNumber, g.card?.rarity].filter(Boolean).join(' · ')} · {g.card?.game}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-x-3 font-mono text-xs text-zinc-400">
                        <span>cost: <span className="text-amber-400">{formatCurrency(Number(g.gradingCost))}</span></span>
                        <span>sent: {formatDate(g.sentDate)}</span>
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
                          <option value="">select grade</option>
                          {GRADES.map((grade) => (
                            <option key={grade} value={grade}>{grade}</option>
                          ))}
                        </Select>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="current value"
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
                          complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleCancel(g.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          cancel
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
        <Card className="border-zinc-800 bg-zinc-900/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              completed gradings ({completed.length})
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCompleted((v) => !v)}
              className="gap-1 md:hidden font-mono text-xs"
            >
              {showCompleted ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {showCompleted ? 'hide' : 'show'}
            </Button>
          </CardHeader>
          <CardContent className={!showCompleted ? 'hidden md:block' : ''}>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left font-mono text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500">
                    <th className="pb-2 pr-4">card</th>
                    <th className="pb-2 pr-4">grade</th>
                    <th className="pb-2 pr-4">cost</th>
                    <th className="pb-2 pr-4">current value</th>
                    <th className="pb-2">completed</th>
                  </tr>
                </thead>
                <tbody>
                  {completed.map((g) => (
                    <tr key={g.id} className="border-b border-zinc-800/50 last:border-0">
                      <td className="py-3 pr-4 text-zinc-200">{g.card?.name}</td>
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
                <div key={g.id} className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-mono text-sm text-zinc-200">{g.card?.name}</span>
                    <Badge variant="default" className="shrink-0">{g.grade}</Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
                    <div className="min-w-0">
                      <div className="text-zinc-500">cost</div>
                      <div className="break-words text-zinc-300">{formatCurrency(Number(g.gradingCost))}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-zinc-500">value</div>
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
