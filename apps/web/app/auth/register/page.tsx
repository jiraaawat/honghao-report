'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'
import { TcgIcon } from '@/components/landing/tcg-icon'
import { FullPageLoader } from '@/components/ui/loading'

export default function RegisterPage() {
  const { t } = useLanguage()
  const { status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return <FullPageLoader />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password !== form.confirmPassword) {
      setError(t('auth.register.passwordMismatch'))
      setLoading(false)
      return
    }

    const { confirmPassword, ...payload } = form

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || t('auth.register.registrationFailed'))
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/auth/signin')
      }, 1500)
    }
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
            <span>$ {t('auth.register.title')}</span>
          </div>
          <CardDescription>{t('auth.register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-md border border-lime-600/30 bg-lime-600/10 p-3 font-mono text-xs text-lime-500">
                <CheckCircle className="h-4 w-4" />
                {t('auth.register.accountCreated')}
              </div>
            )}
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.register.name')}</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.register.email')}</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="dev@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.register.password')}</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="font-mono text-xs text-zinc-400">{t('auth.register.confirmPassword')}</label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? t('auth.register.creating') : t('auth.register.createAccount')}
            </Button>
          </form>

          <SocialLoginButtons />

          <p className="mt-4 text-center font-mono text-xs text-zinc-500">
            {t('auth.register.alreadyHaveAccount')}{' '}
            <Link href="/auth/signin" className="text-lime-500 hover:underline">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
