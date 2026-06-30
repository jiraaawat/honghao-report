'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  const { toast, dismiss } = ctx
  return { toast, dismiss }
}

function useToastContext() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('Toast context missing')
  return ctx
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const icon =
    toast.variant === 'success' ? (
      <CheckCircle className="h-4 w-4 text-lime-500" />
    ) : toast.variant === 'error' ? (
      <AlertCircle className="h-4 w-4 text-rose-400" />
    ) : (
      <Info className="h-4 w-4 text-lime-500" />
    )

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border bg-zinc-900/95 p-3 shadow-lg backdrop-blur',
        toast.variant === 'success' && 'border-lime-600/30',
        toast.variant === 'error' && 'border-rose-500/30',
        toast.variant === 'info' && 'border-lime-600/30'
      )}
      role="status"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <div className="font-mono text-sm font-medium text-zinc-100">{toast.title}</div>
        {toast.description && (
          <div className="mt-0.5 font-mono text-xs text-zinc-400">{toast.description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 text-zinc-500 hover:text-zinc-300"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToastContext()
  if (toasts.length === 0) return null
  return (
    <div className="fixed right-0 top-0 z-[100] flex flex-col gap-2 p-4 sm:p-6">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { ...t, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}
