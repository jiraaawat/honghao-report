'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/lib/theme/provider'

export function AmbientGlow() {
  const { theme } = useTheme()

  if (theme !== 'dark') return null

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Top horizontal glow line */}
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />

      {/* Top-left emerald orb */}
      <motion.div
        className="absolute -left-28 -top-28 h-[440px] w-[440px] rounded-full bg-emerald-500/[0.14] blur-[115px] will-change-transform"
        animate={{
          x: [0, 28, -18, 0],
          y: [0, 18, -26, 0],
          scale: [1, 1.06, 0.98, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      />

      {/* Top-right teal orb */}
      <motion.div
        className="absolute -right-28 -top-24 h-[520px] w-[520px] rounded-full bg-teal-500/[0.10] blur-[125px] will-change-transform"
        animate={{
          x: [0, -24, 30, 0],
          y: [0, -26, 18, 0],
          scale: [1, 0.98, 1.05, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      />

      {/* Bottom-center emerald wash */}
      <motion.div
        className="absolute -bottom-32 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full bg-emerald-700/[0.08] blur-[115px] will-change-transform"
        animate={{
          x: ['-50%', '-48%', '-52%', '-50%'],
          scale: [1, 1.04, 0.98, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
