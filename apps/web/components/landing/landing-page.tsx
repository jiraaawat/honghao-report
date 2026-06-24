'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/provider'
import { LanguageToggle } from '@/components/i18n/language-toggle'
import { AdSlot } from '@/components/ads/ad-slot'
import { AppPreview } from './app-preview'
import {
  Terminal,
  Boxes,
  TrendingUp,
  BarChart3,
  Gem,
  ArrowRight,
  UserPlus,
  Search,
  Receipt,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react'

export function LandingPage() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Boxes,
      title: t('landing.featureInventory'),
      description: t('landing.featureInventoryDesc'),
      className: 'md:col-span-2',
    },
    {
      icon: TrendingUp,
      title: t('landing.featureProfit'),
      description: t('landing.featureProfitDesc'),
    },
    {
      icon: Gem,
      title: t('landing.featureGrading'),
      description: t('landing.featureGradingDesc'),
    },
    {
      icon: BarChart3,
      title: t('landing.featureReports'),
      description: t('landing.featureReportsDesc'),
      className: 'md:col-span-2',
    },
  ]

  const steps = [
    {
      icon: UserPlus,
      title: t('landing.manualStep1Title'),
      description: t('landing.manualStep1Desc'),
    },
    {
      icon: Search,
      title: t('landing.manualStep2Title'),
      description: t('landing.manualStep2Desc'),
    },
    {
      icon: Receipt,
      title: t('landing.manualStep3Title'),
      description: t('landing.manualStep3Desc'),
    },
    {
      icon: Gem,
      title: t('landing.manualStep4Title'),
      description: t('landing.manualStep4Desc'),
    },
    {
      icon: FileSpreadsheet,
      title: t('landing.manualStep5Title'),
      description: t('landing.manualStep5Desc'),
    },
    {
      icon: RotateCcw,
      title: t('landing.manualStep6Title'),
      description: t('landing.manualStep6Desc'),
    },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -right-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[600px] w-[600px] rounded-full bg-emerald-600/5 blur-[120px]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-zinc-800/60 bg-zinc-950/70 backdrop-blur-md">
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-400"
          >
            <span className="text-emerald-500">$</span> honghao-report
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
        <section className="flex min-h-screen flex-col items-center justify-center px-4 pt-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
              <Terminal className="h-10 w-10 text-emerald-400" />
            </div>
            <h1 className="bg-gradient-to-r from-emerald-300 via-cyan-300 to-emerald-300 bg-clip-text font-mono text-5xl font-bold tracking-tight text-transparent md:text-7xl">
              $ honghao-report
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-mono text-lg text-zinc-400 md:text-xl">
              {t('landing.subtitle')}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/auth/signin">
                <Button size="lg" className="gap-2 font-mono">
                  {t('auth.signin.signIn')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-zinc-700 bg-zinc-950/50 font-mono hover:bg-zinc-900"
                >
                  {t('auth.register.createAccount')}
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

        <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center font-mono text-xs font-bold uppercase tracking-widest text-emerald-500"
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
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={feature.className}
                  >
                    <Card className="group relative h-full overflow-hidden border-zinc-800/60 bg-zinc-900/40 backdrop-blur transition-colors hover:border-emerald-500/30 hover:bg-zinc-900/60">
                      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-opacity group-hover:opacity-100" />
                      <CardContent className="relative flex h-full flex-col justify-between p-6">
                        <div>
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950/50">
                            <Icon className="h-6 w-6 text-emerald-400" />
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
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-emerald-500"
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
                    const Icon = step.icon
                    return (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, x: -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.08 }}
                        className="relative"
                      >
                        <span className="absolute -left-[1.85rem] top-1 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 font-mono text-[10px] text-emerald-400">
                          {index + 1}
                        </span>
                        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-5 backdrop-blur transition-colors hover:border-zinc-700 hover:bg-zinc-900/60">
                          <div className="flex items-center gap-2 font-mono text-sm font-bold text-zinc-200">
                            <Icon className="h-4 w-4 text-emerald-400" />
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

        <section className="border-t border-zinc-800/60 px-4 py-24 md:px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-8 text-center backdrop-blur md:p-12">
            <h2 className="font-mono text-2xl font-bold text-zinc-100 md:text-3xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mt-3 font-mono text-sm text-zinc-500 md:text-base">
              {t('landing.ctaSubtitle')}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/auth/register">
                <Button size="lg" className="gap-2 font-mono">
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
          © {new Date().getFullYear()} honghao-report
        </footer>
      </main>
    </div>
  )
}
