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
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-lime-400/35 to-transparent" />

      {/* Subtle dot grid texture */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Film grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 90% at 50% 42%, transparent 40%, rgba(0,0,0,0.32) 100%)',
        }}
      />

      {/* Centered ambient glow behind content */}
      <div
        className="absolute left-1/2 top-1/2 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime-500/[0.05] blur-[140px]"
      />

      {/* Top-left green orb */}
      <motion.div
        className="absolute -left-28 -top-28 h-[480px] w-[480px] rounded-full bg-lime-600/[0.18] blur-[115px] will-change-transform"
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

      {/* Top-right orange orb */}
      <motion.div
        className="absolute -right-28 -top-24 h-[560px] w-[560px] rounded-full bg-orange-700/[0.14] blur-[125px] will-change-transform"
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

      {/* Bottom-center green wash */}
      <motion.div
        className="absolute -bottom-40 left-1/2 h-[520px] w-[1000px] -translate-x-1/2 rounded-full bg-lime-800/[0.11] blur-[115px] will-change-transform"
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

      {/* Bottom aurora band */}
      <motion.div
        className="absolute -bottom-48 left-1/2 h-[360px] w-[140%] -translate-x-1/2 rounded-full bg-gradient-to-r from-lime-700/[0.10] via-lime-500/[0.10] via-orange-700/[0.07] to-lime-700/[0.10] blur-[100px] will-change-transform"
        animate={{
          x: ['-55%', '-45%', '-55%'],
          scaleX: [1, 1.1, 1],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
