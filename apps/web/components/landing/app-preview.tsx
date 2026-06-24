'use client'

import { motion } from 'framer-motion'

export function AppPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
      className="relative mx-auto mt-14 w-full max-w-4xl"
    >
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20 blur-lg" />
      <div className="relative overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900/90 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="mx-2 flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-center font-mono text-[10px] text-zinc-500">
            honghao-report.vercel.app/dashboard
          </div>
        </div>

        <div className="space-y-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded bg-zinc-800" />
            <div className="h-8 w-24 rounded-md bg-emerald-500/20" />
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
                    className="flex-1 rounded-sm bg-emerald-500/30"
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
      </div>
    </motion.div>
  )
}
