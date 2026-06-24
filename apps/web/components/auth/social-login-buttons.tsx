'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { signInWithPopup } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Facebook, Loader2 } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/provider'
import { firebaseAuth, facebookProvider } from '@/lib/firebase/client'

type FirebaseError = { code?: string; message?: string }

export function SocialLoginButtons() {
  const { t } = useLanguage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const enabled = process.env.NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN === 'true'
  if (!enabled) return null

  const disabled = loading || !firebaseAuth

  const handleFacebookSignIn = async () => {
    if (!firebaseAuth) return
    setLoading(true)
    setError('')

    try {
      const result = await signInWithPopup(firebaseAuth, facebookProvider)
      const idToken = await result.user.getIdToken()
      const signInResult = await signIn('credentials', {
        idToken,
        redirect: false,
      })

      if (signInResult?.error) {
        setError(t('auth.signin.firebaseError'))
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      const firebaseErr = err as FirebaseError
      if (firebaseErr?.code === 'auth/popup-closed-by-user') {
        // silently ignore
      } else {
        console.error('Firebase Facebook sign-in error:', err)
        setError(t('auth.signin.firebaseError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 font-mono text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <span className="relative flex justify-center">
          <span className="bg-zinc-900 px-2 font-mono text-xs text-zinc-500">
            {t('auth.common.or')}
          </span>
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-zinc-700 bg-zinc-950 hover:bg-zinc-800"
        disabled={disabled}
        onClick={handleFacebookSignIn}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Facebook className="h-4 w-4 text-blue-500" />
        )}
        <span className="font-mono text-xs">{t('auth.signin.continueWithFacebook')}</span>
      </Button>
    </div>
  )
}
