'use client'

import { cn } from '@/lib/utils'

type AdFormat = 'banner' | 'leaderboard' | 'card' | 'sidebar' | 'inline'

interface AdSlotProps {
  format?: AdFormat
  className?: string
  label?: string
}

const formatClasses: Record<AdFormat, string> = {
  banner:
    'h-24 w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30',
  leaderboard:
    'h-28 w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30',
  card:
    'h-64 w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30',
  sidebar:
    'h-full min-h-[300px] w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30',
  inline:
    'h-20 w-full rounded-lg border border-dashed border-zinc-700 bg-zinc-900/30',
}

export function AdSlot({ format = 'banner', className, label }: AdSlotProps) {
  const enabled = process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
  if (!enabled) return null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center overflow-hidden p-2 text-center',
        formatClasses[format],
        className
      )}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-600">
        {label || 'Advertisement'}
      </span>
      <span className="mt-1 font-mono text-[10px] text-zinc-700">
        {format === 'sidebar' ? '300x600' : format === 'card' ? '300x250' : '728x90'}
      </span>
    </div>
  )
}
