'use client'

import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/provider'

export function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
      className="h-8 border-zinc-700 bg-zinc-950 px-2 font-mono text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
      aria-label="switch language"
    >
      <span className={lang === 'en' ? 'text-green-400' : 'text-zinc-500'}>EN</span>
      <span className="text-zinc-600">/</span>
      <span className={lang === 'th' ? 'text-green-400' : 'text-zinc-500'}>TH</span>
    </Button>
  )
}
