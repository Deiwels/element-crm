// middleware.ts — Next.js Edge Middleware
// Reads ELEMENT_TOKEN cookie for route protection.
// Does NOT verify JWT signature — only checks exp claim.
// Real auth happens on the backend on every API request.

import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'ELEMENT_TOKEN'

// Routes that don't need auth
const PUBLIC_PATHS = ['/signin', '/login']

// Routes restricted by role
const OWNER_ADMIN_ONLY = ['/settings', '/payroll', '/payments']
const BARBER_REDIRECT  = '/calendar'

interface JWTPayload {
  exp?: number
  role?: string
  [key: string]: unknown
}

function parseJWTPayload(token: string): JWTPayload | null {
  try {
    const base64 = token.split('.')[1]
    if (!base64) return null
    // Edge Runtime supports atob
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json) as JWTPayload
  } catch {
    return null
  }
}

function isExpired(payload: JWTPayload): boolean {
  if (!payload.exp) return false // no exp = treat as valid
  return Date.now() / 1000 > payload.exp
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public paths, static files, api routes
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
    ? decodeURIComponent(req.cookies.get(COOKIE_NAME)!.value)
    : null

  // No token → redirect to signin
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const payload = parseJWTPayload(token)

  // Invalid or expired token → redirect to signin + clear cookie
  if (!payload || isExpired(payload)) {
    const url = req.nextUrl.clone()
    url.pathname = '/signin'
    const res = NextResponse.redirect(url)
    res.cookies.set(COOKIE_NAME, '', { path: '/', maxAge: 0 })
    return res
  }

  const role = payload.role as string | undefined

  // Barber trying to access owner/admin routes → redirect to calendar
  if (role === 'barber' && OWNER_ADMIN_ONLY.some(p => pathname.startsWith(p))) {
    const url = req.nextUrl.clone()
    url.pathname = BARBER_REDIRECT
    return NextResponse.redirect(url)
  }

  // Authenticated user going to /signin → redirect to their home
  if (pathname.startsWith('/signin')) {
    const url = req.nextUrl.clone()
    url.pathname = role === 'barber' ? '/calendar' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // All good — pass through + add role header for server components
  const res = NextResponse.next()
  if (role) res.headers.set('x-user-role', role)
  return res
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image
     * - favicon, public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
