'use client'

import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { TcgIcon } from './tcg-icon'

export function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
      className="group relative mx-auto mt-14 w-full max-w-4xl"
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-lime-500/30 via-lime-400/20 to-orange-600/30 blur-lg" />
      <div className="relative overflow-hidden rounded-xl border-2 border-lime-600/40 bg-zinc-900/90 shadow-2xl backdrop-blur">
        {/* Holographic sheen */}
        <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-all duration-1000 group-hover:translate-x-full group-hover:opacity-100" />

        {/* Card title bar */}
        <div className="relative flex items-center justify-between border-b-2 border-lime-600/30 bg-gradient-to-r from-lime-950/60 via-zinc-950/80 to-zinc-950/80 px-4 py-3">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-green-200">
            <TcgIcon symbol="cards" className="h-4 w-4 text-lime-500" />
            <span>Portfolio Dashboard</span>
            <span className="rounded bg-lime-600/15 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-lime-400">
              preview
            </span>
          </div>
          <div className="flex items-center gap-1">
            {(['leaf', 'flame', 'drop'] as const).map((symbol) => (
              <span
                key={symbol}
                className="flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-zinc-950/50 text-lime-500 shadow-sm"
              >
                <TcgIcon symbol={symbol} className="h-3 w-3" />
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-zinc-800" />
            <div className="h-8 w-24 rounded-md bg-lime-600/20" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-3"
              >
                <div className="h-2.5 w-16 rounded bg-zinc-800" />
                <div className="mt-3 h-6 w-20 rounded bg-zinc-700/60" />
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="col-span-2 rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4">
              <div className="h-3 w-28 rounded bg-zinc-800" />
              <div className="mt-4 flex items-end gap-1">
                {[40, 65, 35, 80, 55, 90, 45].map((h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 rounded-sm bg-lime-600/30"
                    style={{ height: `${h * 0.7}px` }}
                  />
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4">
              <div className="h-3 w-20 rounded bg-zinc-800" />
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded bg-zinc-800" />
                <div className="h-2 w-4/5 rounded bg-zinc-800" />
                <div className="h-2 w-3/5 rounded bg-zinc-800" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-800/60 bg-zinc-950/50 p-4">
            <div className="h-3 w-32 rounded bg-zinc-800" />
            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded bg-zinc-800" />
                  <div className="h-2 flex-1 rounded bg-zinc-800" />
                  <div className="h-2 w-16 rounded bg-zinc-800" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card type line / footer */}
        <div className="relative flex items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Legendary Tracker
          </span>
          <div className="flex items-center gap-1 text-lime-500">
            <Sparkles className="h-3 w-3" />
            <span className="font-mono text-[10px] font-black">MYTHIC</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
