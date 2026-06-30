'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface FitTextProps {
  children: React.ReactNode
  className?: string
  minScale?: number
}

export function FitText({ children, className, minScale = 0.6 }: FitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const update = () => {
      const available = container.clientWidth
      const natural = content.scrollWidth
      if (natural > available && available > 0) {
        setScale(Math.max(minScale, available / natural))
      } else {
        setScale(1)
      }
    }

    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [children, minScale])

  return (
    <div ref={containerRef} className="min-w-0 flex-1 overflow-hidden">
      <div
        ref={contentRef}
        className={cn('inline-block whitespace-nowrap will-change-transform', className)}
        style={{ transform: `scale(${scale})`, transformOrigin: 'left center' }}
      >
        {children}
      </div>
    </div>
  )
}
