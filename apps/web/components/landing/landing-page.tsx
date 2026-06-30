'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/provider'
import { LanguageToggle } from '@/components/i18n/language-toggle'
import { AdSlot } from '@/components/ads/ad-slot'
import { AppPreview } from './app-preview'
import { BoosterLoader } from './booster-loader'
import { TcgIcon } from './tcg-icon'
import { ArrowRight } from 'lucide-react'

export function LandingPage() {
  const { t } = useLanguage()

  const features = [
    {
      symbol: 'cards' as const,
      title: t('landing.featureInventory'),
      description: t('landing.featureInventoryDesc'),
      rarity: 'RARE',
      cardBorder: 'border-lime-600/30',
      shimmer: 'via-lime-300/20',
      glow: 'bg-lime-600/5',
      rarityBorder: 'border-lime-600/30',
      rarityText: 'text-lime-500',
      iconBox: 'from-lime-600/10 to-lime-500/10',
      iconColor: 'text-lime-500',
    },
    {
      symbol: 'sword' as const,
      title: t('landing.featureProfit'),
      description: t('landing.featureProfitDesc'),
      rarity: 'UNCOMMON',
      cardBorder: 'border-orange-700/30',
      shimmer: 'via-orange-300/20',
      glow: 'bg-orange-700/5',
      rarityBorder: 'border-orange-700/30',
      rarityText: 'text-orange-600',
      iconBox: 'from-orange-700/10 to-lime-600/10',
      iconColor: 'text-orange-600',
    },
    {
      symbol: 'gem' as const,
      title: t('landing.featureGrading'),
      description: t('landing.featureGradingDesc'),
      rarity: 'EPIC',
      cardBorder: 'border-lime-500/30',
      shimmer: 'via-lime-300/20',
      glow: 'bg-lime-500/5',
      rarityBorder: 'border-lime-500/30',
      rarityText: 'text-lime-400',
      iconBox: 'from-lime-500/10 to-orange-700/10',
      iconColor: 'text-lime-400',
    },
    {
      symbol: 'scroll' as const,
      title: t('landing.featureReports'),
      description: t('landing.featureReportsDesc'),
      rarity: 'MYTHIC',
      cardBorder: 'border-lime-600/30',
      shimmer: 'via-lime-300/20',
      glow: 'bg-lime-600/5',
      rarityBorder: 'border-lime-600/30',
      rarityText: 'text-lime-500',
      iconBox: 'from-lime-600/10 to-orange-700/10',
      iconColor: 'text-lime-500',
    },
  ]

  const steps = [
    {
      symbol: 'sun' as const,
      title: t('landing.manualStep1Title'),
      description: t('landing.manualStep1Desc'),
    },
    {
      symbol: 'drop' as const,
      title: t('landing.manualStep2Title'),
      description: t('landing.manualStep2Desc'),
    },
    {
      symbol: 'leaf' as const,
      title: t('landing.manualStep3Title'),
      description: t('landing.manualStep3Desc'),
    },
    {
      symbol: 'gem' as const,
      title: t('landing.manualStep4Title'),
      description: t('landing.manualStep4Desc'),
    },
    {
      symbol: 'scroll' as const,
      title: t('landing.manualStep5Title'),
      description: t('landing.manualStep5Desc'),
    },
    {
      symbol: 'skull' as const,
      title: t('landing.manualStep6Title'),
      description: t('landing.manualStep6Desc'),
    },
  ]

  return (
    <>
      <BoosterLoader />
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        {/* Ambient glow layer */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-lime-600/10 blur-[120px]" />
          <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-orange-700/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/3 h-[600px] w-[600px] rounded-full bg-lime-500/5 blur-[120px]" />
          <div className="absolute right-0 top-1/2 h-[400px] w-[400px] rounded-full bg-lime-500/10 blur-[120px]" />
        </div>

        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md">
          <div className="flex h-full items-center justify-between px-4 md:px-6">
            <Link
              href="/"
              className="font-mono text-sm font-bold"
            >
              <span className="bg-gradient-to-r from-lime-300 via-orange-300 to-lime-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                $ honghao
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                href="/auth/signin"
                className="hidden font-mono text-xs text-zinc-400 transition-colors hover:text-zinc-100 sm:inline"
              >
                {t('auth.signin.signIn')}
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="font-mono text-xs">
                  {t('auth.register.createAccount')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative">
          {/* Hero */}
          <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-14 text-center">
            {/* Background image from reference */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
              style={{ backgroundImage: 'url(/images/landing-bg.png)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/80 via-zinc-950/70 to-zinc-950 backdrop-blur-[2px]" />

            {/* Decorative floral glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -left-24 top-24 h-[28rem] w-[28rem] rounded-full bg-lime-500/15 blur-[120px]" />
              <div className="absolute -right-24 bottom-24 h-[28rem] w-[28rem] rounded-full bg-lime-600/15 blur-[120px]" />
              <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-orange-800/10 blur-[100px]" />
              <div className="absolute right-1/4 top-24 h-80 w-80 rounded-full bg-lime-600/10 blur-[100px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative z-10 max-w-4xl"
            >
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.35em] text-orange-600 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)] md:text-xs">
                built for collectors
              </p>
              <div className="mb-8">
                <h1 className="bg-gradient-to-r from-lime-300 via-orange-300 to-lime-300 bg-clip-text font-mono text-6xl font-bold tracking-tighter text-transparent drop-shadow-[0_0_30px_rgba(34,197,94,0.4)] md:text-8xl">
                  $ honghao
                </h1>
              </div>

              <p className="mx-auto mt-6 max-w-2xl font-mono text-lg text-zinc-300 drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] md:text-xl">
                {t('landing.subtitle')}
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="gap-2 border border-lime-600/30 bg-lime-700 font-mono text-white shadow-[0_0_24px_-6px_rgba(34,197,94,0.35)] transition-all hover:bg-lime-600 hover:shadow-[0_0_32px_-4px_rgba(34,197,94,0.5)]"
                  >
                    {t('auth.register.createAccount')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-zinc-700 bg-zinc-950/50 font-mono hover:bg-zinc-900"
                  >
                    {t('auth.signin.signIn')}
                  </Button>
                </Link>
              </div>
            </motion.div>

            <AppPreview />
          </section>

          <section className="border-t border-zinc-800/60 px-4 py-12 md:px-6">
            <div className="mx-auto max-w-5xl">
              <AdSlot format="leaderboard" label="sponsor" />
            </div>
          </section>

          {/* Features */}
          <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
            <div className="mx-auto max-w-5xl">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-lime-600"
              >
                {t('landing.featuresTitle')}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="mb-12 text-center font-mono text-3xl font-bold text-zinc-100"
              >
                {t('landing.ctaTitle')}
              </motion.h2>
              <div className="grid gap-4 md:grid-cols-2">
                {features.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className={`group relative h-full overflow-hidden ${feature.cardBorder} bg-zinc-900/40 backdrop-blur transition-colors hover:bg-zinc-900/60`}>
                      <div className={`pointer-events-none absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent ${feature.shimmer} via-white/10 to-transparent opacity-0 transition-all duration-1000 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100`} />
                      <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full ${feature.glow} blur-2xl transition-opacity group-hover:opacity-100`} />
                      <div className={`absolute right-3 top-3 rounded border ${feature.rarityBorder} px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider ${feature.rarityText}`}>
                        {feature.rarity}
                      </div>
                      <CardContent className="relative flex h-full flex-col justify-between p-6">
                        <div>
                          <div className={`mb-4 flex h-24 items-center justify-center rounded-lg border border-zinc-800/60 bg-gradient-to-br ${feature.iconBox}`}>
                            <TcgIcon symbol={feature.symbol} className={`h-10 w-10 ${feature.iconColor}`} />
                          </div>
                          <h3 className="font-mono text-lg font-bold text-zinc-200">
                            {feature.title}
                          </h3>
                          <p className="mt-2 font-mono text-sm leading-relaxed text-zinc-500">
                            {feature.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Steps */}
          <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
            <div className="mx-auto max-w-5xl">
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-lime-600"
                  >
                    {t('landing.manualTitle')}
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mb-10 font-mono text-3xl font-bold text-zinc-100"
                  >
                    {t('landing.ctaSubtitle')}
                  </motion.h2>
                  <div className="relative space-y-6 pl-8 before:absolute before:left-3 before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-zinc-800">
                    {steps.map((step, index) => {
                      return (
                        <motion.div
                          key={step.title}
                          initial={{ opacity: 0, x: -16 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.08 }}
                          className="relative"
                        >
                          <span className="absolute -left-[1.85rem] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-mono text-[10px] text-lime-500">
                            {index + 1}
                          </span>
                          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
                            <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-200">
                              <TcgIcon symbol={step.symbol} className="h-4 w-4 text-lime-500" />
                              {step.title}
                            </div>
                            <p className="mt-1 font-mono text-xs leading-relaxed text-zinc-500">
                              {step.description}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <AdSlot
                    format="sidebar"
                    label="sponsor"
                    className="sticky top-20"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-zinc-800/60 px-4 py-12 md:px-6">
            <div className="mx-auto max-w-5xl">
              <AdSlot format="banner" label="sponsor" />
            </div>
          </section>

          {/* Final CTA */}
          <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
            <div className="mx-auto max-w-3xl rounded-2xl border-2 border-lime-600/30 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-8 text-center shadow-[0_0_60px_-20px_rgba(34,197,94,0.25)] backdrop-blur md:p-12">
              <h2 className="font-mono text-2xl font-bold text-zinc-100 md:text-3xl">
                {t('landing.ctaTitle')}
              </h2>
              <p className="mt-3 font-mono text-sm text-zinc-500 md:text-base">
                {t('landing.ctaSubtitle')}
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    className="gap-2 border border-lime-600/30 bg-lime-700 font-mono text-white shadow-[0_0_24px_-6px_rgba(34,197,94,0.35)] transition-all hover:bg-lime-600 hover:shadow-[0_0_32px_-4px_rgba(34,197,94,0.5)]"
                  >
                    {t('auth.register.createAccount')} <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-zinc-700 bg-zinc-950/50 font-mono hover:bg-zinc-900"
                  >
                    {t('auth.signin.signIn')}
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          <footer className="border-t border-zinc-800/60 py-8 text-center font-mono text-xs text-zinc-600">
            © {new Date().getFullYear()} honghao
          </footer>
        </main>
      </div>
    </>
  )
}
