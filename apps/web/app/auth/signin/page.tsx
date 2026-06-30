'use client'

import { useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'
import { TcgIcon } from '@/components/landing/tcg-icon'
import { EntryBooster } from '@/components/landing/entry-booster'
import { FullPageLoader } from '@/components/ui/loading'

export default function SignInPage() {
  const { t } = useLanguage()
  const { status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [entering, setEntering] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && !entering) {
      router.replace('/dashboard')
    }
  }, [status, entering, router])

  if (status === 'loading') {
    return <FullPageLoader />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError(t('auth.signin.invalidCredentials'))
    } else {
      setEntering(true)
    }
  }

  if (entering) {
    return (
      <EntryBooster
        duration={3500}
        onComplete={() => {
          router.push('/dashboard')
          router.refresh()
        }}
      />
    )
  }

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-lime-600/10 blur-[120px]" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-orange-700/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 24px)',
          }}
        />
      </div>

      <Card className="group relative w-full max-w-md overflow-hidden border-lime-600/30 bg-zinc-900/80 backdrop-blur">
        {/* Foil shimmer */}
        <div className="pointer-events-none absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-lime-300/10 via-white/5 to-transparent opacity-0 transition-all duration-1000 ease-in-out group-hover:translate-x-[150%] group-hover:opacity-100" />

        <Link
          href="/"
          className="absolute left-4 top-4 z-10 flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('common.back')}
        </Link>

        <CardHeader className="space-y-2 pt-12 text-center">
          <div className="mx-auto mb-2 flex items-center justify-center gap-2 font-mono text-xl font-bold text-lime-400 drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
            <TcgIcon symbol="cards" className="h-6 w-6" />
            <span>$ {t('auth.signin.title')}</span>
          </div>
          <CardDescription>{t('auth.signin.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.signin.email')}</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="dev@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.signin.password')}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.signin.authenticating') : t('auth.signin.signIn')}
            </Button>
          </form>

          <SocialLoginButtons />

          <p className="mt-4 text-center font-mono text-xs text-zinc-500">
            {t('auth.signin.noAccount')}{' '}
            <Link href="/auth/register" className="text-lime-500 hover:underline">
              {t('auth.signin.register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
