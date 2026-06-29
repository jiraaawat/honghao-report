'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LogOut,
  User,
  Boxes,
  Gem,
  Library,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/provider'
import { LanguageToggle } from '@/components/i18n/language-toggle'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { DictionaryKey } from '@/lib/i18n/dictionary'

const navItems: { href: string; label: DictionaryKey; icon: React.ElementType }[] = [
  { href: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'nav.inventory', icon: Boxes },
  { href: '/cards', label: 'nav.cards', icon: Library },
  { href: '/wishlist', label: 'nav.wishlist', icon: Heart },
  { href: '/grading', label: 'nav.grading', icon: Gem },
  { href: '/transactions', label: 'nav.transactions', icon: Receipt },
  { href: '/reports', label: 'nav.reports', icon: BarChart3 },
]

const pageTitles: Record<string, DictionaryKey> = {
  '/dashboard': 'pageTitle.dashboard',
  '/inventory': 'pageTitle.inventory',
  '/cards': 'pageTitle.cardList',
  '/wishlist': 'pageTitle.wishlist',
  '/grading': 'pageTitle.grading',
  '/grading/send': 'pageTitle.sendToGrade',
  '/transactions': 'pageTitle.transactions',
  '/reports': 'pageTitle.reports',
}

function getPageTitleKey(pathname: string): DictionaryKey | null {
  if (pageTitles[pathname]) return pageTitles[pathname]
  const match = Object.keys(pageTitles)
    .filter((p) => p !== '/')
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname.startsWith(p))
  return match ? pageTitles[match] : null
}

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const { t } = useLanguage()
  const titleKey = getPageTitleKey(pathname)

  if (status === 'loading') {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 h-14 transform-gpu border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          <div className="h-4 w-32 rounded bg-zinc-800" />
          <div className="h-8 w-20 rounded-md bg-zinc-800" />
        </div>
      </header>
    )
  }
  if (!session) return null

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-14 transform-gpu border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="flex h-full items-center px-4 md:px-6">
          <div className="hidden flex-1 items-center md:flex">
            <Link
              href="/dashboard"
              className="font-mono text-sm font-bold"
            >
              <span className="bg-gradient-to-r from-yellow-300 via-orange-300 to-green-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                $ honghao
              </span>
            </Link>
          </div>

          <div className="relative z-10 flex items-center gap-3 md:hidden">
            <ThemeToggle />
            <LanguageToggle />
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
            {titleKey ? (
              <h2 className="font-mono text-sm font-medium tracking-tight text-zinc-200">{t(titleKey)}</h2>
            ) : null}
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-xs transition-colors',
                    isActive
                      ? 'border-green-500/50 bg-green-500/10 text-green-400'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t(item.label)}
                </Link>
              )
            })}
          </nav>

          <div className="relative z-10 flex flex-1 items-center justify-end gap-3">
            <div className="hidden items-center gap-3 md:flex">
              <ThemeToggle />
              <LanguageToggle />
            </div>
            <div className="hidden items-center gap-2 font-mono text-xs text-zinc-400 lg:flex">
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[160px] truncate">{session.user?.email}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(t('nav.logoutConfirm'))) {
                  signOut({ callbackUrl: '/' })
                }
              }}
              className="gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t('nav.logout')}</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 transform-gpu border-t border-zinc-800 bg-zinc-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <ul className="flex items-center justify-around px-2 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-mono font-bold transition-colors',
                    active ? 'text-green-400' : 'text-zinc-500 hover:text-zinc-300'
                  )}
                >
                  <span
                    className={cn(
                      'rounded-lg p-1.5 transition-colors',
                      active && 'bg-green-500/15'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  {t(item.label)}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
