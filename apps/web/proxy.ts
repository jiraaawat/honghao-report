import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SESSION_COOKIE_RE = /^(?:__Host-|__Secure-)?(?:authjs|next-auth)\.session-token$/

function hasSessionCookie(req: NextRequest) {
  return req.cookies.getAll().some(
    ({ name, value }) => SESSION_COOKIE_RE.test(name) && !!value
  )
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isLoggedIn = hasSessionCookie(req)

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
