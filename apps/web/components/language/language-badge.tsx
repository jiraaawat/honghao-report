'use client'

import { cn } from '@/lib/utils'
import { getLanguageStyle } from '@/lib/language'

export function LanguageBadge({
  language,
  className,
}: {
  language?: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium',
        getLanguageStyle(language),
        className
      )}
    >
      {language || 'EN'}
    </span>
  )
}
