'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function SignInPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username || !password) { setError('Enter username and password.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      
      localStorage.setItem('ELEMENT_TOKEN', data.token)
      localStorage.setItem('ELEMENT_USER', JSON.stringify(data.user))
      
      const role = data.user?.role || 'barber'
      const dest = role === 'barber' ? '/calendar' : '/dashboard'
      
      router.push(dest)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: 20, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        * { box-sizing: border-box; }
        input:focus { outline: none; border-color: rgba(10,132,255,.65) !important; box-shadow: 0 0 0 3px rgba(10,132,255,.18) !important; }
        input::placeholder { color: rgba(255,255,255,.25); }
        button:disabled { opacity: .4; cursor: not-allowed; }
      `}</style>
      <div style={{ width: '100%', maxWidth: 400, borderRadius: 24, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', boxShadow: '0 24px 80px rgba(0,0,0,.6)', backdropFilter: 'blur(20px)', padding: '36px 32px 32px' }}>
        <div style={{ fontFamily: '"Julius Sans One", sans-serif', letterSpacing: '.22em', textTransform: 'uppercase', fontSize: 20, textAlign: 'center', marginBottom: 6, color: '#e9e9e9' }}>Element</div>
        <div style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 32 }}>CRM · Staff portal</div>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 8 }}>Username</label>
            <input type="text" placeholder="Enter your username" autoComplete="username" autoCapitalize="none" value={username} onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', height: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.30)', color: '#fff', padding: '0 16px', fontSize: 15 }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 8 }}>Password</label>
            <input type="password" placeholder="Enter your password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', height: 48, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.30)', color: '#fff', padding: '0 16px', fontSize: 15 }} />
          </div>
          {error && <div style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', height: 52, marginTop: 8, borderRadius: 14, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', fontSize: 14, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.25)', letterSpacing: '.06em' }}>Accounts are created by the owner.</div>
      </div>
    </div>
  )
}
