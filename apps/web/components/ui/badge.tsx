import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-lime-500/50 bg-lime-500/15 text-lime-400',
        secondary: 'border-zinc-600 bg-zinc-800 text-zinc-300',
        destructive: 'border-rose-500/50 bg-rose-500/15 text-rose-400',
        outline: 'border-zinc-700 text-zinc-300',
        buy: 'border-lime-500/50 bg-lime-500/15 text-lime-400',
        sell: 'border-blue-400/50 bg-blue-400/15 text-blue-300',
        grading: 'border-orange-500/50 bg-orange-500/15 text-orange-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
