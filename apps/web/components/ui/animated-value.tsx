'use client'

import { useCountUp } from '@/lib/hooks/use-count-up'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function AnimatedCurrency({ value, className }: { value: number; className?: string }) {
  const animated = useCountUp(value)
  return <span className={cn('whitespace-nowrap tabular-nums', className)}>{formatCurrency(animated)}</span>
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
    <span className={cn('whitespace-nowrap tabular-nums', className)}>
      {formatNumber(animated, decimals)}
      {suffix ?? ''}
    </span>
  )
}
