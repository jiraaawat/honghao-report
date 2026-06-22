'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Receipt, BarChart3, LogOut, User, Boxes, Gem } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { href: '/inventory', label: 'inventory', icon: Boxes },
  { href: '/grading', label: 'grading', icon: Gem },
  { href: '/transactions', label: 'transactions', icon: Receipt },
  { href: '/reports', label: 'reports', icon: BarChart3 },
]

export function Navbar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status === 'loading') return null
  if (!session) return null

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-400">
            <span className="text-emerald-500">$</span> honghao-report
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
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
                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 font-mono text-xs text-zinc-400 md:flex">
            <User className="h-3.5 w-3.5" />
            {session.user?.email}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden md:inline">logout</span>
          </Button>
        </div>
      </div>

      <nav className="flex items-center gap-1 border-t border-zinc-800 px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-md border py-2 font-mono text-[10px] transition-colors',
                isActive
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:bg-zinc-800'
              )}
            >
              <Icon className="h-3 w-3" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
