'use client'

import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { useTheme } from '@/lib/theme/provider'
import { useLanguage } from '@/lib/i18n/provider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <Tooltip content={t('theme.toggle')} side="bottom">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="h-8 w-8 border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
        aria-label={t('theme.toggle')}
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
    </Tooltip>
  )
}
