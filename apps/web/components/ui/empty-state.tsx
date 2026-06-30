import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline'
}

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  className?: string
}

export function EmptyState({ icon, title, description, action, secondaryAction, className }: EmptyStateProps) {
  const renderAction = (a: EmptyStateAction | undefined) => {
    if (!a) return null
    const button = (
      <Button variant={a.variant ?? 'default'} size="sm" onClick={a.onClick} className="gap-1.5 font-mono text-xs">
        {a.label}
      </Button>
    )
    if (a.href) {
      return (
        <Link href={a.href}>
          {button}
        </Link>
      )
    }
    return button
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 py-14 text-center md:py-20',
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-950 text-lime-500 shadow-[0_0_30px_-12px_rgba(132,204,22,0.25)]">
        {icon}
      </div>
      <h3 className="font-mono text-sm font-semibold text-zinc-200">{title}</h3>
      {description && <p className="mt-1 max-w-xs font-mono text-xs text-zinc-500">{description}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {renderAction(action)}
        {renderAction(secondaryAction)}
      </div>
    </div>
  )
}
