'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { DictionaryKey, getLabel, Lang } from './dictionary'

interface LanguageContextValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: DictionaryKey, params?: Record<string, string | number>) => string
}

const STORAGE_KEY = 'honghao-lang'

function getStoredLang(): Lang {
  if (typeof window === 'undefined') return 'th'
  const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null
  return stored === 'th' || stored === 'en' ? stored : 'th'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang())

  useEffect(() => {
    document.documentElement.lang = lang
    window.localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = e.newValue as Lang | null
        if (next === 'th' || next === 'en') {
          setLangState(next)
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
  }, [])

  const t = useCallback(
    (key: DictionaryKey, params?: Record<string, string | number>) => {
      let text = getLabel(key, lang)
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        })
      }
      return text
    },
    [lang]
  )

  const value = useMemo(
    () => ({ lang, setLang, t }),
    [lang, setLang, t]
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
