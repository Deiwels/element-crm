'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

interface User {
  uid: string; name: string; username: string; role: string; barber_id?: string; photo?: string
}

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', sub: 'Today overview' },
  { id: 'calendar',  href: '/calendar',  label: 'Calendar',  sub: 'Bookings grid' },
  { id: 'clients',   href: '/clients',   label: 'Clients',   sub: 'Search / notes', ownerAdmin: true },
  { id: 'payments',  href: '/payments',  label: 'Payments',  sub: 'Square + Terminal', ownerAdmin: true },
  { id: 'payroll',   href: '/payroll',   label: 'Payroll',   sub: 'Commission + tips', ownerOnly: true },
  { id: 'settings',  href: '/settings',  label: 'Settings',  sub: 'Config & sync', ownerAdmin: true },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  html,body{height:100%;background:#000;color:#e9e9e9;font-family:Inter,system-ui,sans-serif;}
  a{color:#fff!important;text-decoration:none!important;}

  .shell{display:flex;height:100vh;width:100vw;overflow:hidden;position:relative;}

  /* Sidebar — Apple frosted glass */
  .sidebar{
    width:240px;flex:0 0 240px;
    border-right:1px solid rgba(255,255,255,.08);
    background:rgba(8,8,18,.72);
    backdrop-filter:saturate(180%) blur(40px);
    -webkit-backdrop-filter:saturate(180%) blur(40px);
    display:flex;flex-direction:column;height:100vh;
    z-index:50;transition:transform .25s cubic-bezier(.4,0,.2,1);
  }

  .brand{padding:22px 16px 14px;border-bottom:1px solid rgba(255,255,255,.06);}
  .brand h1{
    font-family:"Julius Sans One",sans-serif;
    letter-spacing:.30em;font-size:15px;text-transform:uppercase;
    background:linear-gradient(160deg,rgba(255,255,255,.95) 0%,rgba(255,255,255,.50) 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  }
  .brand-sub{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-top:5px;}

  .nav{display:flex;flex-direction:column;gap:3px;padding:12px 10px;flex:1;overflow-y:auto;}
  .nav-item{
    display:flex;align-items:center;gap:10px;padding:11px 13px;
    border-radius:14px;border:1px solid transparent;
    transition:all .18s ease;cursor:pointer;
  }
  .nav-item:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.08);}
  .nav-item.active{
    border-color:rgba(10,132,255,.35);
    background:rgba(10,132,255,.14);
    box-shadow:0 0 20px rgba(10,132,255,.15), inset 0 0 0 0.5px rgba(10,132,255,.30);
  }
  .nav-t{font-weight:600;font-size:13px;color:rgba(255,255,255,.88);display:block;letter-spacing:.01em;}
  .nav-s{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.28);display:block;margin-top:1px;}

  .user-bar{padding:10px;border-top:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);}

  .content{flex:1;min-width:0;height:100vh;overflow:hidden;background:#000;}

  /* Burger — mobile only */
  .burger-btn{
    display:none;position:fixed;top:12px;left:12px;z-index:100;
    width:42px;height:42px;border-radius:12px;
    border:1px solid rgba(255,255,255,.16);
    background:rgba(8,8,18,.80);
    backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
    color:#fff;cursor:pointer;font-size:18px;
    align-items:center;justify-content:center;
  }
  .sidebar-backdrop{
    display:none;position:fixed;inset:0;
    background:rgba(0,0,0,.50);z-index:49;
    backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  }

  @media(max-width:768px){
    .sidebar{position:fixed;inset:0 auto 0 0;transform:translateX(-105%);}
    .sidebar.open{transform:translateX(0);}
    .burger-btn{display:flex;}
    .sidebar-backdrop.open{display:block;}
    .content{width:100vw;}
  }
`

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

  // Load barber photo on mount
  useEffect(() => {
    if (user.barber_id && !user.photo) {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      fetch(`${API}/api/barbers`, {
        headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }
      })
        .then(r => r.json())
        .then((data: any) => {
          const list = Array.isArray(data) ? data : (data?.barbers || [])
          const me = list.find((b: any) => String(b.id) === String(user.barber_id))
          if (me?.photo_url) setPhoto(me.photo_url)
        })
        .catch(() => {})
    }
  }, [user.barber_id, user.photo])

  function handlePhoto(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900
        const scale = Math.min(1, MAX / img.width, MAX / img.height)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.82
        let out = canvas.toDataURL('image/jpeg', q)
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
      if (user.barber_id) {
        await fetch(`${API}/api/barbers/${encodeURIComponent(user.barber_id)}`, {
          method: 'PATCH', headers: h, body: JSON.stringify({ name, photo_url: photo })
        })
      }
      await fetch(`${API}/api/users/${encodeURIComponent(user.uid)}`, {
        method: 'PATCH', headers: h, body: JSON.stringify({ name })
      })
      const updated = { ...user, name, photo }
      localStorage.setItem('ELEMENT_USER', JSON.stringify(updated))
      onUpdated(updated); setMsg('Saved ✓')
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

  const inp: React.CSSProperties = {
    width: '100%', height: 42, borderRadius: 12,
    border: '1px solid rgba(255,255,255,.12)',
    background: 'rgba(255,255,255,.06)',
    color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit'
  }
  const lbl: React.CSSProperties = {
    fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase',
    color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5
  }
  const tabBtn = (t: 'profile' | 'password') => ({
    height: 32, padding: '0 14px', borderRadius: 999, cursor: 'pointer',
    fontWeight: 900 as const, fontSize: 11, textTransform: 'uppercase' as const,
    letterSpacing: '.08em', fontFamily: 'inherit',
    border: `1px solid ${tab === t ? 'rgba(10,132,255,.50)' : 'rgba(255,255,255,.10)'}`,
    background: tab === t ? 'rgba(10,132,255,.16)' : 'rgba(255,255,255,.04)',
    color: tab === t ? '#d7ecff' : 'rgba(255,255,255,.55)',
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.50)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      <div style={{
        width: 'min(440px,95vw)', borderRadius: 24,
        border: '1px solid rgba(255,255,255,.12)',
        background: 'rgba(14,14,22,.72)',
        backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)',
        color: '#e9e9e9', fontFamily: 'Inter,sans-serif',
        boxShadow: '0 30px 80px rgba(0,0,0,.50), 0 0 0 0.5px rgba(255,255,255,.07)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.07)',
          background: 'rgba(255,255,255,.03)'
        }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>My Profile</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '12px 18px 0' }}>
          <button style={tabBtn('profile')} onClick={() => { setTab('profile'); setMsg(''); setErr('') }}>Profile</button>
          <button style={tabBtn('password')} onClick={() => { setTab('password'); setMsg(''); setErr('') }}>Password</button>
        </div>

        <div style={{ padding: '16px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'profile' && (
            <>
              {/* Photo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {photo
                  ? <img src={photo} alt={name} style={{ width: 72, height: 72, borderRadius: 18, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} />
                  : <div style={{ width: 72, height: 72, borderRadius: 18, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, flexShrink: 0 }}>
                      {(user.name || '?')[0].toUpperCase()}
                    </div>
                }
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Photo</label>
                  <label style={{ height: 38, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.70)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'inherit', gap: 8 }}>
                    📷 {photo ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0] || null)} />
                  </label>
                  {photo && (
                    <button onClick={() => setPhoto('')} style={{ marginTop: 6, height: 28, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Remove</button>
                  )}
                </div>
              </div>

              <div>
                <label style={lbl}>Display name</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Username (login)</label>
                <input value={user.username || ''} disabled style={{ ...inp, opacity: .4, cursor: 'not-allowed' }} />
              </div>
              <div>
                <label style={lbl}>Role</label>
                <input value={user.role || ''} disabled style={{ ...inp, opacity: .4, cursor: 'not-allowed', textTransform: 'capitalize' }} />
              </div>
              <button onClick={saveProfile} disabled={saving} style={{ height: 44, borderRadius: 12, border: '1px solid rgba(10,132,255,.60)', background: 'rgba(10,132,255,.16)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </>
          )}

          {tab === 'password' && (
            <>
              <div>
                <label style={lbl}>Current password</label>
                <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" style={inp} />
              </div>
              <div>
                <label style={lbl}>New password</label>
                <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="min 4 characters" style={inp} />
              </div>
              <button onClick={savePassword} disabled={saving} style={{ height: 44, borderRadius: 12, border: '1px solid rgba(10,132,255,.60)', background: 'rgba(10,132,255,.16)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </>
          )}

          {msg && <div style={{ fontSize: 12, color: '#c9ffe1', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(143,240,177,.28)', background: 'rgba(143,240,177,.07)' }}>{msg}</div>}
          {err && <div style={{ fontSize: 12, color: '#ffd0d0', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,107,107,.28)', background: 'rgba(255,107,107,.07)' }}>{err}</div>}
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
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) { setStatus('noauth'); return }
    const stored = localStorage.getItem('ELEMENT_USER')
    if (stored) { try { setUser(JSON.parse(stored)); setStatus('ok') } catch { setStatus('ok') } }
    else setStatus('ok')

    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY } })
      .then(r => r.json())
      .then(async (d: any) => {
        if (d.user) {
          let userData = { ...d.user }
          if (d.user.barber_id) {
            try {
              const br = await fetch(`${API}/api/barbers`, {
                headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }
              }).then(r => r.json())
              const list = Array.isArray(br) ? br : (br?.barbers || [])
              const myBarber = list.find((b: any) => String(b.id) === String(d.user.barber_id))
              if (myBarber?.photo_url) userData = { ...userData, photo: myBarber.photo_url, name: myBarber.name || userData.name }
            } catch {}
          }
          setUser(userData)
          localStorage.setItem('ELEMENT_USER', JSON.stringify(userData))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => { if (status === 'noauth') window.location.href = '/signin' }, [status])

  if (status === 'loading' || status === 'noauth') {
    return <div style={{ background: '#000', minHeight: '100vh' }} />
  }

  const role = user?.role || 'barber'
  const isBarber = role === 'barber'

  const visibleNav = NAV.filter(item => {
    if ((item as any).ownerOnly && role !== 'owner') return false
    if ((item as any).ownerAdmin && isBarber) return false
    return true
  })

  const initials = (name: string) => {
    const p = (name || '').split(' ')
    return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase()
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="shell">
        <button className="burger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
        <div className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="brand">
            <h1>ELEMENT</h1>
            <div className="brand-sub">{page}</div>
          </div>

          <nav className="nav">
            {visibleNav.map(item => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`nav-item${pathname === item.href ? ' active' : ''}`}
              >
                <div>
                  <span className="nav-t">{item.label}</span>
                  <span className="nav-s">{item.sub}</span>
                </div>
              </Link>
            ))}
          </nav>

          <div className="user-bar">
            <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)' }}>
              <button
                onClick={() => setShowProfile(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10, textAlign: 'left' }}
              >
                {(user as any)?.photo
                  ? <img src={(user as any).photo} alt={user?.name || ''} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10,132,255,.18)', border: '1px solid rgba(10,132,255,.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#d7ecff', flexShrink: 0 }}>
                      {initials(user?.name || user?.username || '?')}
                    </div>
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e9e9e9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || user?.username || '—'}</div>
                  <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.32)', marginTop: 2 }}>{user?.role || '—'}</div>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.28)', flexShrink: 0 }}>✎</div>
              </button>

              <button
                onClick={() => { localStorage.removeItem('ELEMENT_TOKEN'); localStorage.removeItem('ELEMENT_USER'); window.location.href = '/signin' }}
                style={{ height: 30, width: '100%', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: '1px solid rgba(255,107,107,.28)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', fontFamily: 'inherit' }}
              >
                Log out
              </button>
            </div>
          </div>
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
