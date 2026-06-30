'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Twitter, Youtube, Linkedin } from 'lucide-react'
import { cn } from '@/lib/utils'

const socialLinks = [
  // TODO: replace # with actual profile URLs
  { href: '#', label: 'Instagram', icon: Instagram },
  { href: '#', label: 'Facebook', icon: Facebook },
  { href: '#', label: 'Twitter / X', icon: Twitter },
  { href: '#', label: 'YouTube', icon: Youtube },
  { href: '#', label: 'LinkedIn', icon: Linkedin },
]

interface TickerItem {
  name: string
  price: number
  change: number
}

const MOCK_CARDS = [
  'OP07-001 Luffy',
  'Pikachu VMAX',
  'Lorcana Elsa',
  'PSA10 Charizard',
  'Uta SP',
  'Shanks SEC',
  'Mewtwo AR',
]

function generateMockItems(): TickerItem[] {
  return MOCK_CARDS.map((name) => {
    const price = Math.random() * 4000 + 200
    const change = Math.random() * 18 - 7
    return { name, price, change }
  })
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
    .slice(0, 5)
}

function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lime-500" />
    </span>
  )
}

function MarketTicker() {
  const [items, setItems] = useState<TickerItem[]>([])

  useEffect(() => {
    setItems(generateMockItems())
  }, [])

  if (items.length === 0) return null

  const repeated = Array.from({ length: 8 }, (_, i) => items[i % items.length])
  const track = [...repeated, ...repeated]

  return (
    <div className="ticker-box flex min-w-0 max-w-md flex-1 items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1">
      <div className="flex shrink-0 items-center gap-1.5">
        <LiveDot />
        <span className="font-mono text-[9px] font-black uppercase tracking-wider text-zinc-500">live</span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max gap-4 whitespace-nowrap">
          {track.map((item, i) => (
            <span key={`${item.name}-${i}`} className="inline-flex items-center gap-1 font-mono text-[10px]">
              <span className="truncate text-zinc-300">{item.name}</span>
              <span className={cn('tabular-nums', item.change >= 0 ? 'text-lime-500' : 'text-rose-400')}>
                {item.change >= 0 ? '+' : ''}
                {item.change.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SocialBar({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 hidden h-10 transform-gpu items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-6 backdrop-blur md:flex',
        className
      )}
    >
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

      <MarketTicker />
    </footer>
  )
}
