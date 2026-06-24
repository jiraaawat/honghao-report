'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardDto, CARD_TYPES, GAMES, GRADES } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { ArrowLeft, Gem, Send, Search, Plus } from 'lucide-react'

interface CardWithInventory extends CardDto {
  inventory?: {
    quantity: number
    averageCost: number
  } | null
}

export default function SendToGradeContent() {
  const router = useRouter()
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const preselectedCardId = searchParams.get('cardId') || ''
  const { status } = useSession()
  const [cards, setCards] = useState<CardWithInventory[]>([])

  const [mode, setMode] = useState<'existing' | 'new'>(preselectedCardId ? 'existing' : 'new')
  const [existingCardId, setExistingCardId] = useState(preselectedCardId || '')
  const [newCard, setNewCard] = useState({
    name: '',
    cardType: 'Single',
    game: 'OnePiece',
    setCode: '',
    cardNumber: '',
    rarity: '',
  })
  const [gradingCost, setGradingCost] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [grade, setGrade] = useState('PSA10')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [showOptional, setShowOptional] = useState(false)

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
      quantity: number
      grade: string
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
      quantity: Number(quantity),
      grade,
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
        <div className="font-mono text-sm text-zinc-500">{t('common.loading')}</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  return (
    <div className="mx-auto max-w-2xl p-3 md:p-6">
      <Link href="/grading">
        <Button variant="ghost" size="sm" className="mb-4 gap-1 font-mono text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> {t('gradingSend.back')}
        </Button>
      </Link>

      <Card className="border-zinc-800 bg-zinc-900/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 md:mb-2 md:h-12 md:w-12">
            <Gem className="h-5 w-5 text-amber-400 md:h-6 md:w-6" />
          </div>
          <CardTitle className="font-mono text-xl text-amber-400">$ {t('gradingSend.title')}</CardTitle>
          <p className="font-mono text-sm text-zinc-500">{t('gradingSend.note')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex min-w-0 items-center justify-center gap-2 rounded-md py-2 font-mono text-xs transition-colors ${
                  mode === 'existing'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Search className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0">{t('gradingSend.selectExisting')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('new')}
                className={`flex min-w-0 items-center justify-center gap-2 rounded-md py-2 font-mono text-xs transition-colors ${
                  mode === 'new'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" /> <span className="min-w-0">{t('gradingSend.typeNewName')}</span>
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('gradingSend.selectCard')}</label>
                <Select
                  value={existingCardId}
                  onChange={(e) => setExistingCardId(e.target.value)}
                  required={mode === 'existing'}
                >
                  <option value="">{t('gradingSend.chooseCardInStock')}</option>
                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} [{card.game}] ({card.inventory?.quantity ?? 0} {t('common.inStock')})
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="font-mono text-xs text-zinc-400">{t('gradingSend.cardName')}</label>
                  <Input
                    value={newCard.name}
                    onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                    placeholder="e.g. Charizard Base Set"
                    required={mode === 'new'}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                  >
                    {CARD_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowOptional((v) => !v)}
                  className="w-full gap-1 font-mono text-xs text-zinc-500"
                >
                  {showOptional ? t('gradingSend.hideOptionalDetails') : t('gradingSend.showOptionalDetails')}
                </Button>
                {showOptional && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input
                      placeholder={t('gradingSend.setCodePlaceholder')}
                      value={newCard.setCode}
                      onChange={(e) => setNewCard({ ...newCard, setCode: e.target.value })}
                    />
                    <Input
                      placeholder={t('gradingSend.cardNumberPlaceholder')}
                      value={newCard.cardNumber}
                      onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                    />
                    <Input
                      placeholder={t('gradingSend.rarityPlaceholder')}
                      value={newCard.rarity}
                      onChange={(e) => setNewCard({ ...newCard, rarity: e.target.value })}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedCard && mode === 'existing' && (
              <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between gap-2">
                  <span>{t('gradingSend.currentAvgCost')}</span>
                  <span className="min-w-0 break-words text-right text-zinc-200">{formatCurrency(Number(selectedCard.inventory?.averageCost ?? 0))}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('gradingSend.inStock')}</span>
                  <span className="min-w-0 break-words text-right text-zinc-200">{selectedCard.inventory?.quantity ?? 0} qty</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('common.cardType')}</span>
                  <span className="min-w-0 break-words text-right text-zinc-200">{selectedCard.cardType}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>{t('common.game')}</span>
                  <span className="min-w-0 break-words text-right text-zinc-200">{selectedCard.game}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="min-w-0 space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('gradingSend.quantityToGrade')}</label>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  max={selectedCard?.inventory?.quantity ?? 1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="min-w-0 space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('gradingSend.targetGrade')}</label>
                <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>
              <div className="min-w-0 space-y-2">
                <label className="font-mono text-xs text-zinc-400">{t('gradingSend.gradingCost')}</label>
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
            </div>

            <div className="min-w-0 space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('gradingSend.sendDate')}</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={
                loading ||
                !gradingCost ||
                !quantity ||
                Number(quantity) < 1 ||
                (mode === 'existing' && (!existingCardId || Number(quantity) > (selectedCard?.inventory?.quantity ?? 0))) ||
                (mode === 'new' && !newCard.name.trim())
              }
            >
              <Send className="h-4 w-4" />
              {loading ? t('gradingSend.sending') : t('gradingSend.title')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
