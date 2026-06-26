import { cn } from '@/lib/utils'

interface TcgIconProps {
  symbol:
    | 'cards'
    | 'sword'
    | 'gem'
    | 'scroll'
    | 'leaf'
    | 'flame'
    | 'drop'
    | 'sun'
    | 'skull'
  className?: string
}

export function TcgIcon({ symbol, className }: TcgIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-6 w-6', className)}
    >
      {symbol === 'cards' && (
        <>
          <rect x="4" y="6" width="14" height="18" rx="2" />
          <rect x="8" y="2" width="14" height="18" rx="2" />
        </>
      )}
      {symbol === 'sword' && (
        <>
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
          <path d="m13 19 6-6" />
          <path d="m16 16 4 4" />
          <path d="M19 21l2-2" />
        </>
      )}
      {symbol === 'gem' && (
        <>
          <path d="M6 3h12l4 6-10 13L2 9l4-6z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </>
      )}
      {symbol === 'scroll' && (
        <>
          <path d="M8 21h12a2 2 0 0 0 2-2v-8H8v10z" />
          <path d="M6 11h14V7a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2" />
          <path d="M10 15h8" />
          <path d="M10 18h8" />
        </>
      )}
      {symbol === 'leaf' && (
        <>
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </>
      )}
      {symbol === 'flame' && (
        <>
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a6 6 0 0 1-11 3.5" />
          <path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </>
      )}
      {symbol === 'drop' && (
        <>
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
        </>
      )}
      {symbol === 'sun' && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </>
      )}
      {symbol === 'skull' && (
        <>
          <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none" />
          <path d="M8 16v2" />
          <path d="M12 16v2" />
          <path d="M16 16v2" />
          <path d="M12 16a4 4 0 0 0 4-4V9A6 6 0 0 0 6 9v3a4 4 0 0 0 4 4z" />
        </>
      )}
    </svg>
  )
}
