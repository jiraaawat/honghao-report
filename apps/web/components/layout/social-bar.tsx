'use client'

import Link from 'next/link'
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'

const socialLinks = [
  // TODO: replace # with actual profile URLs
  { href: '#', label: 'Instagram', icon: Instagram },
  { href: '#', label: 'Facebook', icon: Facebook },
  { href: '#', label: 'Twitter / X', icon: Twitter },
  { href: '#', label: 'YouTube', icon: Youtube },
  { href: '#', label: 'LinkedIn', icon: Linkedin },
]

export function SocialBar({ className }: { className?: string }) {
  const { t } = useLanguage()
  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 hidden h-10 transform-gpu items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur md:flex',
        className
      )}
    >
      <span className="font-mono text-[10px] text-zinc-500">
        {t('socialBar.followUs')}
      </span>
      <div className="flex items-center gap-1">
        {socialLinks.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              onClick={(e) => item.href === '#' && e.preventDefault()}
            >
              <Icon className="h-4 w-4" />
            </Link>
          )
        })}
      </div>
    </footer>
  )
}
