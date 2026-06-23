import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
        destructive: 'border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20',
        outline: 'border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100',
        secondary: 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700',
        ghost: 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100',
        link: 'border-transparent text-emerald-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
