'use client'

import { useCountUp } from '@/lib/hooks/use-count-up'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)
  return <span className={className}>{formatCurrency(animated)}</span>
}

export function AnimatedNumber({
  value,
  suffix,
  decimals = 0,
  className,
}: {
  value: number
  suffix?: string
  decimals?: number
  className?: string
}) {
  const animated = useCountUp(value)
  return (
    <span className={className}>
      {formatNumber(animated, decimals)}
      {suffix ?? ''}
    </span>
  )
}
