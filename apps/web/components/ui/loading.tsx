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
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <div className="font-mono text-sm text-zinc-500">
        {message || t('common.loading')}
      </div>
    </div>
  )
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center py-12', className)}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-full border-2 border-zinc-800" />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
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
