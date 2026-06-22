import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-mono font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        secondary: 'border-zinc-600 bg-zinc-800 text-zinc-300',
        destructive: 'border-red-500/50 bg-red-500/10 text-red-400',
        outline: 'border-zinc-700 text-zinc-300',
        buy: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        sell: 'border-blue-500/50 bg-blue-500/10 text-blue-400',
        grading: 'border-amber-500/50 bg-amber-500/10 text-amber-400',
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
