'use client'

import { motion } from 'framer-motion'
import { useLanguage } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

interface FullPageLoaderProps {
  message?: string
  className?: string
}

export function FullPageLoader({ message, className }: FullPageLoaderProps) {
  const { t } = useLanguage()

  return (
    <div
      className={cn(
        'flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-5',
        className
      )}
    >
      <div className="relative h-16 w-16">
        {/* Outer track */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        {/* Counter-rotating glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent shadow-[0_0_24px_rgba(52,211,153,0.35)]"
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        />
        {/* Main spinner */}
        <motion.div
          className="absolute inset-1 rounded-full border-2 border-emerald-400/40 border-t-emerald-300 border-r-emerald-300 border-b-transparent border-l-transparent shadow-[0_0_16px_rgba(52,211,153,0.4)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center pulse */}
        <motion.div
          className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
      <div className="font-mono text-sm text-emerald-400/80">
        {message || t('common.loading')}
      </div>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent shadow-[0_0_16px_rgba(52,211,153,0.35)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  )
}

export function Skeleton({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-800/60',
        className
      )}
    >
      {children}
    </div>
  )
}
