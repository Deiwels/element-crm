'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function SignInForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Enter username and password.'); return }
    setError(''); setLoading(true)
    try {
      await login(username.trim(), password)
      const redirect = params.get('redirect') || '/dashboard'
      router.push(redirect)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center p-5">
      <div className="w-full max-w-sm card p-8 shadow-[0_24px_80px_rgba(0,0,0,.6)]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display tracking-[.22em] uppercase text-xl mb-1">Element</h1>
          <p className="text-[11px] tracking-[.14em] uppercase text-white/35">CRM · Staff Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="field-label">Username</label>
            <input
              className="field-input"
              type="text"
              placeholder="Enter your username"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="field-label">Password</label>
            <input
              className="field-input"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/8 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary h-13 mt-2 text-sm font-black tracking-wide uppercase disabled:opacity-40"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-white/25 tracking-wide">
          Accounts are created by the owner.
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/40 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
