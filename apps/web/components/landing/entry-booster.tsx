'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'

interface EntryBoosterProps {
  onComplete: () => void
  duration?: number
}

export function EntryBooster({ onComplete, duration = 3000 }: EntryBoosterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(onComplete, duration)
    return () => clearTimeout(timer)
  }, [onComplete, duration])

  if (!mounted) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950"
      >
        {/* Pack */}
        <motion.div
          initial={{ scale: 0.8, rotate: -2 }}
          animate={{
            scale: [0.8, 1, 1, 1.05, 0],
            rotate: [-2, 2, -2, 0, 0],
            y: [0, 0, 0, -20, -200],
            opacity: [1, 1, 1, 1, 0],
          }}
          transition={{
            duration: 2.4,
            times: [0, 0.2, 0.5, 0.75, 1],
            ease: 'easeInOut',
          }}
          className="relative"
        >
          <div className="relative flex h-80 w-56 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-green-500/40 bg-gradient-to-b from-green-950 to-zinc-900 shadow-[0_0_60px_-10px_rgba(34,197,94,0.4)]">
            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'url(\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgxdjFIMUMxeiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvc3ZnPg==\')' }} />
            <div className="z-10 flex h-16 w-16 items-center justify-center rounded-full border border-orange-500/30 bg-orange-500/10 shadow-[0_0_30px_-5px_rgba(249,115,22,0.4)]">
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="z-10 mt-4 font-mono text-lg font-bold text-green-300">honghao</div>
            <div className="z-10 font-mono text-xs uppercase tracking-widest text-orange-500/80">booster pack</div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-500/40" />
          </div>
        </motion.div>

        {/* Opening flash */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2.5, 3] }}
          transition={{ duration: 0.8, delay: 1.7, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 bg-green-400/30"
        />

        {/* Fan of cards */}
        {[-24, -12, 0, 12, 24].map((deg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40, scale: 0.6, rotate: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [40, -60 - i * 10, -120 - i * 10, -180],
              scale: [0.6, 1, 1, 0.9],
              rotate: [0, deg, deg, deg * 1.5],
            }}
            transition={{
              duration: 1.1,
              delay: 1.6 + i * 0.05,
              ease: 'easeOut',
            }}
            className="pointer-events-none absolute h-48 w-32 rounded-lg border border-green-500/30 bg-gradient-to-b from-green-900/80 to-zinc-900 shadow-xl"
            style={{ originY: 1 }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
