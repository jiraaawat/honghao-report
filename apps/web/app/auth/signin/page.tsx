'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Terminal, AlertCircle, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { SocialLoginButtons } from '@/components/auth/social-login-buttons'

export default function SignInPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
      router.push('/dashboard')
      router.refresh()
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
          <CardTitle className="font-mono text-xl text-emerald-400">$ {t('auth.signin.title')}</CardTitle>
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
            <Link href="/auth/register" className="text-emerald-400 hover:underline">
              {t('auth.signin.register')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
