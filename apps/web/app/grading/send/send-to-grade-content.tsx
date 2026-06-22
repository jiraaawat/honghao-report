'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardDto, CARD_TYPES, GAMES } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { ArrowLeft, Gem, Send, Search, Plus } from 'lucide-react'

interface CardWithInventory extends CardDto {
  inventory?: {
    quantity: number
    averageCost: number
  } | null
}

export default function SendToGradeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCardId = searchParams.get('cardId') || ''
  const { status } = useSession()
  const [cards, setCards] = useState<CardWithInventory[]>([])

  const [mode, setMode] = useState<'existing' | 'new'>(preselectedCardId ? 'existing' : 'new')
  const [existingCardId, setExistingCardId] = useState(preselectedCardId || '')
  const [newCard, setNewCard] = useState({
    name: '',
    cardType: 'Single',
    game: 'Pokemon',
    setCode: '',
    cardNumber: '',
    rarity: '',
  })
  const [gradingCost, setGradingCost] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return

    let cancelled = false

    fetch('/api/cards?status=in_stock')
      .then((r) => r.json())
      .then((data: CardWithInventory[]) => {
        if (!cancelled) setCards(data.filter((c) => c.status === 'in_stock'))
      })

    return () => {
      cancelled = true
    }
  }, [status])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gradingCost) return

    const payload: {
      gradingCost: number
      date: string
      cardId?: string
      newCard?: {
        name: string
        cardType: string
        game: string
        setCode?: string
        cardNumber?: string
        rarity?: string
      }
    } = {
      gradingCost: Number(gradingCost),
      date: new Date(date).toISOString(),
    }

    if (mode === 'existing') {
      if (!existingCardId) return
      payload.cardId = existingCardId
    } else {
      if (!newCard.name.trim()) return
      payload.newCard = {
        name: newCard.name,
        cardType: newCard.cardType,
        game: newCard.game,
        setCode: newCard.setCode || undefined,
        cardNumber: newCard.cardNumber || undefined,
        rarity: newCard.rarity || undefined,
      }
    }

    setLoading(true)
    const res = await fetch('/api/grading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)

    if (res.ok) {
      router.push('/grading')
      router.refresh()
    }
  }

  const selectedCard = cards.find((c) => c.id === existingCardId)

  if (status === 'loading') {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="font-mono text-sm text-zinc-500">loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6">
      <Link href="/grading">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 font-mono text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> back to grading
        </Button>
      </Link>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10">
            <Gem className="h-6 w-6 text-amber-400" />
          </div>
          <CardTitle className="font-mono text-xl text-amber-400">$ send to grade</CardTitle>
          <p className="font-mono text-sm text-zinc-500">the grading cost will be added to monthly cost</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 font-mono text-xs transition-colors ${
                  mode === 'existing'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Search className="h-3.5 w-3.5" /> select existing
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex items-center justify-center gap-2 rounded-md py-2 font-mono text-xs transition-colors ${
                  mode === 'new'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Plus className="h-3.5 w-3.5" /> type new name
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">select card</label>
                <Select
                  value={existingCardId}
                  onChange={(e) => setExistingCardId(e.target.value)}
                  required={mode === 'existing'}
                >
                  <option value="">choose a card in stock</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} [{card.game}] ({card.inventory?.quantity ?? 0} in stock)
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">card name</label>
                  <Input
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    placeholder="e.g. Charizard Base Set"
                    required={mode === 'new'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                  >
                    {CARD_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </Select>
                  <Select
                    value={newCard.game}
                    onChange={(e) => setNewCard({ ...newCard, game: e.target.value })}
                  >
                    {GAMES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="set code"
                    value={newCard.setCode}
                    onChange={(e) => setNewCard({ ...newCard, setCode: e.target.value })}
                  />
                  <Input
                    placeholder="card #"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  />
                  <Input
                    placeholder="rarity"
                    value={newCard.rarity}
                    onChange={(e) => setNewCard({ ...newCard, rarity: e.target.value })}
                  />
                </div>
              </div>
            )}

            {selectedCard && mode === 'existing' && (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>current avg cost</span>
                  <span className="text-zinc-200">{formatCurrency(Number(selectedCard.inventory?.averageCost ?? 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span>card type</span>
                  <span className="text-zinc-200">{selectedCard.cardType}</span>
                </div>
                <div className="flex justify-between">
                  <span>game</span>
                  <span className="text-zinc-200">{selectedCard.game}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">grading cost</label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={gradingCost}
                  onChange={(e) => setGradingCost(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">send date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={
                loading ||
                !gradingCost ||
                (mode === 'existing' && !existingCardId) ||
                (mode === 'new' && !newCard.name.trim())
              }
            >
              <Send className="h-4 w-4" />
              {loading ? 'sending...' : 'send to grade'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
