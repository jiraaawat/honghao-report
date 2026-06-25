'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'

export default function RegisterPage() {
  const { t } = useLanguage()
  const { status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <Card className="relative w-full max-w-md border-zinc-800 bg-zinc-900/80">
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-1 font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t('common.back')}
        </Link>
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
            <Terminal className="h-6 w-6 text-emerald-400" />
          </div>
          <CardTitle className="font-mono text-xl text-emerald-400">$ {t('auth.register.title')}</CardTitle>
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
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 font-mono text-xs text-emerald-400">
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
            <Button type="submit" className="w-full" disabled={loading || success}>
              {loading ? t('auth.register.creating') : t('auth.register.createAccount')}
            </Button>
          </form>

          <SocialLoginButtons />

          <p className="mt-4 text-center font-mono text-xs text-zinc-500">
            {t('auth.register.alreadyHaveAccount')}{' '}
            <Link href="/auth/signin" className="text-emerald-400 hover:underline">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
