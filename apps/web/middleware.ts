import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isLoggedIn = SESSION_COOKIES.some((name) => req.cookies.get(name)?.value)

  const isApiAuthRoute = pathname.startsWith('/api/auth')
  const isAuthRoute = pathname.startsWith('/auth')
  const isPublicRoute = pathname === '/' || isAuthRoute

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
