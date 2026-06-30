'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'

interface UnrealizedValueProps {
  value: number
  className?: string
  showZero?: boolean
}

export function UnrealizedValue({ value, className, showZero = true }: UnrealizedValueProps) {
  const isPositive = value > 0
  const isNegative = value < 0
  const isZero = value === 0

  if (isZero && !showZero) return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-mono font-semibold',
        isPositive ? 'text-lime-500' : isNegative ? 'text-rose-400' : 'text-zinc-400',
        className
      )}
    >
      {isPositive && <ArrowUp className="h-3 w-3 shrink-0" />}
      {isNegative && <ArrowDown className="h-3 w-3 shrink-0" />}
      {formatCurrency(value)}
    </span>
  )
}
