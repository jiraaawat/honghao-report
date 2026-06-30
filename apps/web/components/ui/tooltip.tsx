'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [show, setShow] = useState(false)

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-0 border-t-zinc-800',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-0 border-b-zinc-800',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-0 border-l-zinc-800',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-0 border-r-zinc-800',
  }

  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded border border-zinc-700 bg-zinc-800 px-2 py-1 font-mono text-[10px] text-zinc-200 shadow-lg',
            sideClasses[side]
          )}
          role="tooltip"
        >
          {content}
          <span
            className={cn(
              'absolute h-0 w-0 border-4',
              arrowClasses[side]
            )}
          />
        </span>
      )}
    </span>
  )
}
