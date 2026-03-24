'use client'
import { useEffect, useState } from 'react'
import { clearAuthCookie } from '@/lib/auth-cookie'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

interface User {
  uid: string; name: string; username: string; role: string; barber_id?: string; photo?: string; mentor_barber_ids?: string[]
}

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard',  sub: 'Today overview' },
  { id: 'calendar',  href: '/calendar',  label: 'Calendar',   sub: 'Bookings grid' },
  { id: 'messages',  href: '/messages',  label: 'Messages',   sub: 'Team chat' },
  { id: 'waitlist',  href: '/waitlist',  label: 'Waitlist',   sub: 'Queue & notify',      ownerAdmin: true },
  { id: 'clients',   href: '/clients',   label: 'Clients',    sub: 'Search / notes',      ownerAdmin: true },
  { id: 'payments',  href: '/payments',  label: 'Payments',   sub: 'Square + Terminal',   ownerAdmin: true },
  { id: 'attendance', href: '/attendance', label: 'Attendance', sub: 'Hours & clock',       ownerAdmin: true },
  { id: 'payroll',   href: '/payroll',   label: 'Payroll',    sub: 'Commission + tips',   ownerOnly: true },
  { id: 'settings',  href: '/settings',  label: 'Settings',   sub: 'Config & sync',       ownerAdmin: true },
] as const

// ─── SVG icons ────────────────────────────────────────────────────────────────
function Icon({ id, color }: { id: string; color: string }) {
  const s = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (id) {
    case 'dashboard':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" {...s}/>
        <rect x="14" y="3" width="7" height="7" rx="1.5" {...s}/>
        <rect x="3" y="14" width="7" height="7" rx="1.5" {...s}/>
        <rect x="14" y="14" width="7" height="7" rx="1.5" {...s}/>
      </svg>
    case 'calendar':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <rect x="3" y="4" width="18" height="18" rx="2.5" {...s}/>
        <line x1="16" y1="2" x2="16" y2="6" {...s}/>
        <line x1="8" y1="2" x2="8" y2="6" {...s}/>
        <line x1="3" y1="10" x2="21" y2="10" {...s}/>
        <circle cx="8" cy="15" r="1" fill={color}/>
        <circle cx="12" cy="15" r="1" fill={color}/>
        <circle cx="16" cy="15" r="1" fill={color}/>
      </svg>
    case 'messages':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...s}/>
      </svg>
    case 'waitlist':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" {...s}/>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" {...s}/>
        <line x1="9" y1="12" x2="15" y2="12" {...s}/><line x1="9" y1="16" x2="13" y2="16" {...s}/>
      </svg>
    case 'clients':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...s}/>
        <circle cx="9" cy="7" r="4" {...s}/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" {...s}/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" {...s}/>
      </svg>
    case 'payments':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <rect x="1" y="4" width="22" height="16" rx="2.5" {...s}/>
        <line x1="1" y1="10" x2="23" y2="10" {...s}/>
        <line x1="6" y1="16" x2="9" y2="16" {...s}/>
      </svg>
    case 'attendance':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <circle cx="12" cy="12" r="10" {...s}/><polyline points="12 6 12 12 16 14" {...s}/>
      </svg>
    case 'payroll':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <line x1="12" y1="1" x2="12" y2="23" {...s}/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" {...s}/>
      </svg>
    case 'settings':
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <circle cx="12" cy="12" r="3" {...s}/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...s}/>
      </svg>
    default:
      return <svg width="17" height="17" viewBox="0 0 24 24" {...{}}>
        <circle cx="12" cy="12" r="4" {...s}/>
      </svg>
  }
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onUpdated }: {
  user: User; onClose: () => void; onUpdated: (u: User) => void
}) {
  const [name, setName] = useState(user.name || '')
  const [photo, setPhoto] = useState(user.photo || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [tab, setTab] = useState<'profile' | 'password'>('profile')

  useEffect(() => {
    if (!user.barber_id || user.photo) return
    const token = localStorage.getItem('ELEMENT_TOKEN') || ''
    fetch(`${API}/api/barbers`, { headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY } })
      .then(r => r.json())
      .then((data: any) => {
        const list: any[] = Array.isArray(data) ? data : (data?.barbers || [])
        const me = list.find(b => String(b.id) === String(user.barber_id))
        if (me?.photo_url) setPhoto(me.photo_url)
      })
      .catch(() => {})
  }, [user.barber_id, user.photo])

  function handlePhoto(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX / img.width, MAX / img.height)
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.82, out = canvas.toDataURL('image/jpeg', q)
        while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
        setPhoto(out)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    setSaving(true); setMsg(''); setErr('')
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const h = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }
      const isBarberRole = user.role === 'barber'
      const photoChanged = photo !== (user.photo || '')

      if (user.barber_id) {
        if (isBarberRole && photoChanged) {
          // Barber photo change → send request for approval, save name only
          await fetch(`${API}/api/barbers/${encodeURIComponent(user.barber_id)}`, {
            method: 'PATCH', headers: h, body: JSON.stringify({ name })
          })
          await fetch(`${API}/api/requests`, {
            method: 'POST', headers: h, body: JSON.stringify({ type: 'photo_change', data: { newPhotoUrl: photo, barberId: user.barber_id, barberName: name } })
          })
          setMsg('Name saved. Photo sent for approval ✓')
        } else {
          // Owner/admin — save directly
          await fetch(`${API}/api/barbers/${encodeURIComponent(user.barber_id)}`, {
            method: 'PATCH', headers: h, body: JSON.stringify({ name, photo_url: photo })
          })
          setMsg('Saved ✓')
        }
      }
      await fetch(`${API}/api/users/${encodeURIComponent(user.uid)}`, {
        method: 'PATCH', headers: h, body: JSON.stringify({ name })
      })
      const updated = { ...user, name, photo: isBarberRole && photoChanged ? user.photo : photo }
      localStorage.setItem('ELEMENT_USER', JSON.stringify(updated))
      onUpdated(updated)
    } catch (e: any) { setErr(e.message) }
    setSaving(false)
  }

  async function savePassword() {
    if (!currentPw || !newPw) { setErr('Fill both fields'); return }
    if (newPw.length < 4) { setErr('Min 4 characters'); return }
    setSaving(true); setMsg(''); setErr('')
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setCurrentPw(''); setNewPw(''); setMsg('Password updated ✓')
    } catch (e: any) { setErr(e.message) }
    setSaving(false)
  }

  const glassModal: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,.50)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
  }
  const modalBox: React.CSSProperties = {
    width: 'min(420px,100%)', borderRadius: 24,
    border: '1px solid rgba(255,255,255,.10)',
    background: 'rgba(0,0,0,.60)',
    backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)',
    color: '#e9e9e9', fontFamily: 'Inter,sans-serif',
    boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 0 0 0.5px rgba(255,255,255,.06)',
    overflow: 'hidden', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto'
  }
  const inp: React.CSSProperties = {
    width: '100%', height: 42, borderRadius: 12,
    border: '1px solid rgba(255,255,255,.10)',
    background: 'rgba(255,255,255,.06)',
    color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit'
  }
  const lbl: React.CSSProperties = {
    fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 6
  }

  return (
    <div style={glassModal} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={modalBox}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>My Profile</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '12px 18px 0' }}>
          {(['profile', 'password'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setMsg(''); setErr('') }}
              style={{ height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'inherit', border: `1px solid ${tab === t ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)'}`, background: tab === t ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: tab === t ? '#fff' : 'rgba(255,255,255,.45)' }}>
              {t === 'profile' ? 'Profile' : 'Password'}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'profile' && <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {photo
                ? <img src={photo} alt={name} style={{ width: 68, height: 68, borderRadius: 18, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)', flexShrink: 0 }} />
                : <div style={{ width: 68, height: 68, borderRadius: 18, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, flexShrink: 0 }}>{(user.name || '?')[0].toUpperCase()}</div>
              }
              <div style={{ flex: 1 }}>
                <label style={lbl}>Photo</label>
                <label style={{ height: 36, padding: '0 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.65)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'inherit', gap: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {photo ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0] || null)} />
                </label>
                {photo && <button onClick={() => setPhoto('')} style={{ marginTop: 6, height: 26, padding: '0 10px', borderRadius: 7, border: '1px solid rgba(255,107,107,.25)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Remove</button>}
              </div>
            </div>
            <div><label style={lbl}>Display name</label><input value={name} onChange={e => setName(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Username</label><input value={user.username || ''} disabled style={{ ...inp, opacity: .35, cursor: 'not-allowed' }} /></div>
            <div><label style={lbl}>Role</label><input value={user.role || ''} disabled style={{ ...inp, opacity: .35, cursor: 'not-allowed', textTransform: 'capitalize' }} /></div>
            <button onClick={saveProfile} disabled={saving} style={{ height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.10)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </>}

          {tab === 'password' && <>
            <div><label style={lbl}>Current password</label><input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" style={inp} /></div>
            <div><label style={lbl}>New password</label><input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="min 4 characters" style={inp} /></div>
            <button onClick={savePassword} disabled={saving} style={{ height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.10)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
              {saving ? 'Saving…' : 'Update password'}
            </button>
          </>}

          {msg && <div style={{ fontSize: 12, color: '#c9ffe1', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(143,240,177,.22)', background: 'rgba(143,240,177,.06)' }}>{msg}</div>}
          {err && <div style={{ fontSize: 12, color: '#ffd0d0', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,107,107,.22)', background: 'rgba(255,107,107,.06)' }}>{err}</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Shell ────────────────────────────────────────────────────────────────────
export default function Shell({ children, page }: { children: React.ReactNode; page: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'noauth'>('loading')
  const [showProfile, setShowProfile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadChat, setUnreadChat] = useState<string | null>(null) // color of latest unread chat type
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) { setStatus('noauth'); return }
    const stored = localStorage.getItem('ELEMENT_USER')
    if (stored) { try { setUser(JSON.parse(stored)); setStatus('ok') } catch { setStatus('ok') } }
    else setStatus('ok')

    fetch(`${API}/api/auth/me`, { credentials: 'include', headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY } })
      .then(r => r.json())
      .then(async (d: any) => {
        if (!d.user) return
        // Preserve barber_id from localStorage if backend returns empty
        const prevStored = localStorage.getItem('ELEMENT_USER')
        let prev: any = {}
        try { prev = JSON.parse(prevStored || '{}') } catch {}
        const barberId = d.user.barber_id || prev.barber_id || ''
        let userData = { ...d.user, barber_id: barberId }
        if (barberId) {
          try {
            const br = await fetch(`${API}/api/barbers`, {
              credentials: 'include',
              headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }
            }).then(r => r.json())
            const list: any[] = Array.isArray(br) ? br : (br?.barbers || [])
            const me = list.find(b => String(b.id) === String(barberId))
            if (me?.photo_url) userData = { ...userData, photo: me.photo_url, name: me.name || userData.name }
          } catch {}
        }
        setUser(userData)
        localStorage.setItem('ELEMENT_USER', JSON.stringify(userData))
      })
      .catch(() => {})
  }, [])

  useEffect(() => { if (status === 'noauth') window.location.href = '/signin' }, [status])

  // Poll for unread messages — check latest message per chat type
  useEffect(() => {
    if (status !== 'ok' || !user) return
    const CHAT_COLORS: Record<string, string> = { general: '#d7ecff', barbers: '#d7ecff', admins: '#c9ffe1', students: '#d4b8ff', requests: '#ffe9a3', applications: '#ffb7d5' }
    const chatTypes = ['general', 'barbers', 'admins', 'students']
    const lastSeenKey = 'ELEMENT_MSG_LAST_SEEN'

    async function checkUnread() {
      if (pathname === '/messages') { setUnreadChat(null); return }
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      if (!token) return
      const lastSeen = localStorage.getItem(lastSeenKey) || ''
      try {
        for (const ct of chatTypes) {
          const res = await fetch(`${API}/api/messages?chatType=${ct}&limit=1`, {
            credentials: 'include',
            headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' }
          })
          if (!res.ok) continue
          const data = await res.json()
          const msgs = data?.messages || []
          if (msgs.length && msgs[msgs.length - 1]?.createdAt > lastSeen && msgs[msgs.length - 1]?.senderId !== user.uid) {
            setUnreadChat(CHAT_COLORS[ct] || '#d7ecff')
            return
          }
        }
        setUnreadChat(null)
      } catch { /* ignore */ }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 15000)
    return () => clearInterval(interval)
  }, [status, user, pathname])

  // Mark messages as seen when visiting Messages page
  useEffect(() => {
    if (pathname === '/messages') {
      setUnreadChat(null)
      localStorage.setItem('ELEMENT_MSG_LAST_SEEN', new Date().toISOString())
    }
  }, [pathname])

  if (status === 'loading' || status === 'noauth') {
    return <div style={{ background: '#000', minHeight: '100vh' }} />
  }

  const role = user?.role || 'barber'
  const isBarber = role === 'barber'
  const isStudent = role === 'student'
  const visibleNav = NAV.filter(item => {
    if ((item as any).ownerOnly && role !== 'owner') return false
    if ((item as any).ownerAdmin && (isBarber || isStudent)) return false
    // Student sees ONLY calendar
    if (isStudent && item.id !== 'calendar' && item.id !== 'messages') return false
    return true
  })
  const initials = (n: string) => { const p = (n || '').split(' '); return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase() }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#000;color:#e9e9e9;font-family:Inter,system-ui,sans-serif;}
        a{color:#fff!important;text-decoration:none!important;}

        .shell{display:flex;height:100vh;width:100vw;overflow:hidden;position:relative;}

        /* ── Sidebar — Apple glass ── */
        .sidebar{
          width:240px;flex:0 0 240px;
          height:100vh;display:flex;flex-direction:column;
          border-right:1px solid rgba(255,255,255,.07);
          background:rgba(0,0,0,.55);
          backdrop-filter:saturate(180%) blur(40px);
          -webkit-backdrop-filter:saturate(180%) blur(40px);
          z-index:50;
          transition:transform .28s cubic-bezier(.4,0,.2,1);
        }

        /* Brand */
        .brand{
          padding:12px 18px 12px;
          border-bottom:1px solid rgba(255,255,255,.06);
          display:flex;
          flex-direction:column;
          align-items:center;
          text-align:center;
        }
        .brand h1{
          font-family:"Julius Sans One",sans-serif;
          letter-spacing:.32em;font-size:14px;text-transform:uppercase;
          background:linear-gradient(150deg,rgba(255,255,255,.92),rgba(255,255,255,.45));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        }
        .brand-sub{
          font-size:9px;letter-spacing:.18em;text-transform:uppercase;
          color:rgba(255,255,255,.20);margin-top:6px;
        }

        .nav{
          display:flex;flex-direction:column;justify-content:center;
          gap:3px;padding:16px 12px;flex:1;overflow-y:auto;
        }

        .nav-item{
          display:flex;align-items:center;gap:11px;
          padding:10px 12px;border-radius:13px;
          border:1px solid transparent;
          transition:background .16s ease, border-color .16s ease;
          cursor:pointer;
        }
        .nav-item:hover{
          background:rgba(255,255,255,.06);
          border-color:rgba(255,255,255,.07);
        }
        .nav-item.active{
          background:rgba(255,255,255,.09);
          border-color:rgba(255,255,255,.12);
        }
        .nav-ico{
          width:33px;height:33px;border-radius:9px;
          display:flex;align-items:center;justify-content:center;
          flex-shrink:0;transition:background .16s;
          background:rgba(255,255,255,.05);
          border:1px solid rgba(255,255,255,.06);
        }
        .nav-item.active .nav-ico{
          background:rgba(255,255,255,.12);
          border-color:rgba(255,255,255,.14);
        }
        .nav-t{font-weight:600;font-size:13px;color:rgba(255,255,255,.85);display:block;letter-spacing:.01em;}
        .nav-s{font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.28);display:block;margin-top:1px;}
        .nav-item.active .nav-t{color:#fff;}

        @keyframes msgPulse {
          0%, 100% { box-shadow: 0 0 0 rgba(var(--pulse-rgb), 0); }
          50% { box-shadow: 0 0 14px rgba(var(--pulse-rgb), .75); }
        }
        .nav-ico.has-unread {
          animation: msgPulse 2.4s ease-in-out infinite;
          border-color: var(--pulse-color) !important;
          background: var(--pulse-bg) !important;
        }

        /* User bar */
        .user-bar{
          padding:8px 12px 10px;
          border-bottom:1px solid rgba(255,255,255,.06);
        }
        .user-card{
          display:flex;flex-direction:column;gap:8px;
          padding:12px;border-radius:14px;
          background:rgba(255,255,255,.04);
          border:1px solid rgba(255,255,255,.07);
        }

        /* Content */
        .content{flex:1;min-width:0;height:100vh;overflow:hidden;background:#000;}

        /* Mobile: compensate for fixed burger button */
        @media(max-width:768px){
          .content{ position:relative; }

          /* Center page title h2 on mobile */
          .page-title{
            text-align:center!important;
            width:100%;
            display:block!important;
          }

          /* Center ALL topbar rows: title + subtitle + buttons */
          .cal-topbar-row,
          .content > div > div:first-child > div > div:first-child,
          [class*="topbar"]{
            justify-content:center!important;
            text-align:center!important;
          }

          /* Date/subtitle lines under h2 */
          .content h2 + p,
          .content .page-title + p{
            text-align:center!important;
            width:100%;
          }

          /* Topbar padding-left — only for elements with specific class */
          .cal-topbar-wrap{
            padding-left:54px!important;
          }
        }

        /* Burger */
        .burger-btn{
          display:none;
          position:fixed;top:6px;left:10px;z-index:80;
          width:36px;height:36px;border-radius:999px;
          border:none;
          background:transparent;
          color:#fff;cursor:pointer;
          align-items:center;justify-content:center;
          flex-direction:column;gap:3px;padding:0;
          transition:background .15s;
        }
        .burger-btn:hover{background:rgba(255,255,255,.10);}
        .burger-dot{
          display:block;width:3.5px;height:3.5px;
          border-radius:999px;background:rgba(255,255,255,.70);
        }
        @media(max-width:768px){
          .burger-btn.open{ opacity:0; pointer-events:none; }
        }

        .sidebar-backdrop{
          display:none;position:fixed;inset:0;
          background:rgba(0,0,0,.45);z-index:49;
          backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
        }
        .sidebar-backdrop.open{display:block;}

        @media(max-width:768px){
          /* Sidebar */
          .sidebar{
            position:fixed;
            /* dvh accounts for Safari toolbar collapsing */
            top:0;left:0;bottom:0;right:auto;
            transform:translateX(-108%);
          }
          .sidebar.open{transform:translateX(0);}
          .burger-btn{display:flex;}
          .content{width:100vw;}

          /* Brand — centered text, clear burger with padding */
          .brand{
            padding:10px 18px;
            display:flex;
            flex-direction:column;
            align-items:center;
            text-align:center;
          }
          .brand h1{
            font-size:13px;
            letter-spacing:.28em;
          }
          .brand-sub{
            display:none;
          }
          /* User bar — on top, add top padding for status bar + burger */
          .user-bar{
            padding:max(16px, env(safe-area-inset-top, 16px)) 12px 12px;
            border-bottom:1px solid rgba(255,255,255,.06);
            border-top:none;
          }
        }

        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px;}
        select option{background:#111;}
      `}</style>

      <div className="shell">
        {/* Burger */}
        <button
          className={`burger-btn${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Menu"
        >
          <span className="burger-dot" />
          <span className="burger-dot" />
          <span className="burger-dot" />
        </button>

        {/* Backdrop */}
        <div
          className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="brand">
            <h1>ELEMENT</h1>
            <div className="brand-sub">{page}</div>
          </div>

          {/* Profile — top on mobile */}
          <div className="user-bar">
            <div className="user-card">
              <button
                onClick={() => setShowProfile(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}
              >
                {(user as any)?.photo
                  ? <img
                      src={(user as any).photo}
                      alt={user?.name || ''}
                      style={{ width: 34, height: 34, borderRadius: 9, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)', flexShrink: 0 }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  : <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,.10)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                      {initials(user?.name || user?.username || '?')}
                    </div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#e9e9e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.username || '—'}</div>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.30)', marginTop: 2 }}>{user?.role || '—'}</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button
                onClick={() => { localStorage.removeItem('ELEMENT_TOKEN'); localStorage.removeItem('ELEMENT_USER'); clearAuthCookie(); window.location.href = '/signin' }}
                style={{ height: 30, width: '100%', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 600, border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.55)', fontFamily: 'inherit', letterSpacing: '.04em' }}
              >
                Sign out
              </button>
            </div>
          </div>

          <nav className="nav">
            {visibleNav.map(item => {
              const active = pathname === item.href
              const hasUnread = item.id === 'messages' && !!unreadChat && !active
              const pc = unreadChat || '#d7ecff'
              const r = parseInt(pc.slice(1,3),16)||215, g = parseInt(pc.slice(3,5),16)||236, b = parseInt(pc.slice(5,7),16)||255
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`nav-item${active ? ' active' : ''}`}
                >
                  <div
                    className={`nav-ico${hasUnread ? ' has-unread' : ''}`}
                    style={hasUnread ? { '--pulse-rgb': `${r},${g},${b}`, '--pulse-color': `rgba(${r},${g},${b},.55)`, '--pulse-bg': `rgba(${r},${g},${b},.12)` } as React.CSSProperties : undefined}
                  >
                    <Icon id={item.id} color={hasUnread ? pc : active ? 'rgba(255,255,255,.90)' : 'rgba(255,255,255,.45)'} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="nav-t" style={hasUnread ? { color: pc } : undefined}>{item.label}</span>
                    <span className="nav-s">{item.sub}</span>
                  </div>
                </Link>
              )
            })}
          </nav>


        </aside>

        <div className="content">{children}</div>
      </div>

      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdated={u => { setUser(u); setShowProfile(false) }}
        />
      )}
    </>
  )
}
