'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface BannerSlide {
  id: string
  href: string
  image?: string
  alt?: string
  label?: string
  title?: string
  subtitle?: string
  bgClass?: string
}

interface BannerCarouselProps {
  banners: BannerSlide[]
  interval?: number
  className?: string
}

export function BannerCarousel({ banners, interval = 5000, className }: BannerCarouselProps) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const next = useCallback(() => {
    setDirection(1)
    setIndex((i) => (i + 1) % banners.length)
  }, [banners.length])

  const prev = useCallback(() => {
    setDirection(-1)
    setIndex((i) => (i - 1 + banners.length) % banners.length)
  }, [banners.length])

  const goTo = useCallback((i: number) => {
    setDirection(i > index ? 1 : -1)
    setIndex(i)
  }, [index])

  useEffect(() => {
    if (banners.length <= 1 || paused || reducedMotion) return
    const timer = setInterval(next, interval)
    return () => clearInterval(timer)
  }, [banners.length, interval, next, paused, reducedMotion])

  if (banners.length === 0) return null

  const slide = banners[index]

  return (
    <div
      className={cn('group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-lime-600/30', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="region"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.a
          key={slide.id}
          custom={direction}
          href={slide.href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 block"
          aria-label={slide.alt ?? slide.title ?? 'Banner'}
          initial={{ x: reducedMotion ? 0 : direction > 0 ? '100%' : '-100%', opacity: reducedMotion ? 0 : 1 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: reducedMotion ? 0 : direction > 0 ? '-100%' : '100%', opacity: reducedMotion ? 0 : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.5, ease: 'easeInOut' }}
        >
          {slide.image ? (
            <>
              <Image
                src={slide.image}
                alt={slide.alt ?? ''}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/70 via-zinc-950/25 to-transparent" />
            </>
          ) : (
            <div className={cn('absolute inset-0', slide.bgClass ?? 'bg-gradient-to-r from-zinc-900 to-zinc-950')} />
          )}

          {(slide.label || slide.title || slide.subtitle) && (
            <div className="absolute inset-0 flex flex-col justify-between p-4">
              <div className="flex items-start justify-between">
                {slide.label && (
                  <span className="rounded border border-lime-600/30 bg-zinc-950/70 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-lime-500 backdrop-blur-sm">
                    {slide.label}
                  </span>
                )}
                <span className="font-mono text-[10px] text-zinc-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {slide.title ? `${slide.title} \u2192` : '\u2192'}
                </span>
              </div>
              {(slide.title || slide.subtitle) && (
                <div>
                  {slide.title && <div className="font-mono text-lg font-bold text-zinc-100">{slide.title}</div>}
                  {slide.subtitle && <div className="font-mono text-xs text-zinc-500">{slide.subtitle}</div>}
                </div>
              )}
            </div>
          )}
        </motion.a>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              prev()
            }}
            className="absolute left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/70 text-zinc-300 opacity-0 backdrop-blur-sm transition-opacity hover:border-lime-600/30 hover:text-lime-500 group-hover:opacity-100"
            aria-label="Previous banner"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              next()
            }}
            className="absolute right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/70 text-zinc-300 opacity-0 backdrop-blur-sm transition-opacity hover:border-lime-600/30 hover:text-lime-500 group-hover:opacity-100"
            aria-label="Next banner"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  goTo(i)
                }}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  i === index ? 'w-4 bg-lime-500' : 'w-1.5 bg-zinc-600 hover:bg-zinc-400'
                )}
                aria-label={`Go to banner ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
