import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/signin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('element_token')?.value

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    // If already logged in, redirect to dashboard
    if (token) return NextResponse.redirect(new URL('/dashboard', request.url))
    return NextResponse.next()
  }

  // Protected paths — require token
  if (!token) {
    const url = new URL('/signin', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
