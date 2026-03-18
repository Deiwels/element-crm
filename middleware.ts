import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/signin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths always
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // For protected paths — check cookie OR allow through (client will check localStorage)
  // We do a soft check here; hard check is in each layout component
  const token = request.cookies.get('element_token')?.value
  
  // If no cookie, still allow — client-side auth will redirect if needed
  // This prevents issues when using localStorage-based auth
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
