'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FlexCard } from '@/components/flex-card'
import { TransactionDto } from '@/types'
import { useLanguage } from '@/lib/i18n/provider'
import { formatCurrency } from '@/lib/utils'
import { Zap, Download, Share2 } from 'lucide-react'

interface FlexCardDialogProps {
  tx: TransactionDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
  userName?: string | null
}

export function FlexCardDialog({ tx, open, onOpenChange, userName }: FlexCardDialogProps) {
  const { t } = useLanguage()
  const [variant, setVariant] = useState<'wide' | 'portrait'>('wide')
  const flexRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const cardWidth = variant === 'wide' ? 1200 : 720
  const cardHeight = variant === 'wide' ? 630 : 1080

  const [previewScale, setPreviewScale] = useState(1)

  useEffect(() => {
    const calc = () => {
      const width = previewRef.current?.clientWidth ?? (typeof window !== 'undefined' ? window.innerWidth - 48 : 0)
      const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 0
      const scale = Math.min(1, width / cardWidth, maxHeight / cardHeight)
      setPreviewScale(Math.max(scale, 0.25))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [cardWidth, cardHeight])

  const handleDownload = async () => {
    if (!tx || !flexRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(flexRef.current, { pixelRatio: 2 })
      const link = document.createElement('a')
      link.href = dataUrl
      link.download = `flex-${tx.id}.png`
      link.click()
    } catch (err) {
      console.error(err)
    }
  }

  const handleShare = async () => {
    if (!tx || !flexRef.current) return
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(flexRef.current, { pixelRatio: 2 })
      const blob = await fetch(dataUrl).then((r) => r.blob())
      const file = new File([blob], `flex-${tx.id}.png`, { type: 'image/png' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t('flexCard.shareTitle'),
          text: t('flexCard.shareText', {
            name: tx.card?.name ?? '',
            amount: formatCurrency(Number(tx.totalAmount)),
          }),
        })
      } else {
        handleDownload()
      }
    } catch (err) {
      console.error(err)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-7xl">
      <DialogHeader>
        <div className="flex items-center justify-between gap-4">
          <DialogTitle className="flex items-center gap-2 font-mono text-base">
            <Zap className="h-4 w-4 text-orange-600" />
            {t('flexCard.previewTitle')}
          </DialogTitle>
          <div className="flex rounded-lg border border-zinc-700 bg-zinc-950 p-0.5">
            <button
              type="button"
              onClick={() => setVariant('wide')}
              className={`rounded px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                variant === 'wide' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Wide
            </button>
            <button
              type="button"
              onClick={() => setVariant('portrait')}
              className={`rounded px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${
                variant === 'portrait' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Portrait
            </button>
          </div>
        </div>
        <DialogDescription>{tx?.card?.name}</DialogDescription>
      </DialogHeader>

      {tx && (
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
                  <FlexCard tx={tx} userName={userName} variant={variant} />
                </div>
              </div>
            </div>
          </div>
          <div className="fixed -left-[9999px] top-0">
            <FlexCard ref={flexRef} tx={tx} userName={userName} variant={variant} />
          </div>
        </>
      )}

      <DialogFooter className="flex-wrap justify-center gap-2 sm:justify-end">
        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          {t('flexCard.download')}
        </Button>
        <Button size="sm" className="gap-2" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          {t('flexCard.share')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
