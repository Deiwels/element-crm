// lib/auth-cookie.ts
// Sets/clears a non-httpOnly cookie so middleware.ts can read it for redirects.
// Real session security is handled by the backend on every API request.

const COOKIE_NAME = 'ELEMENT_TOKEN'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 days in seconds

export function setAuthCookie(token: string): void {
  if (typeof document === 'undefined') return
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `path=/`,
    `max-age=${MAX_AGE}`,
    `SameSite=Strict`,
    // No HttpOnly — set from JS intentionally, middleware reads it for redirects only
  ].join('; ')
}

export function clearAuthCookie(): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`
}
