'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

interface User {
  uid: string
  name: string
  username: string
  role: string
  barber_id?: string
}

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', sub: 'Today overview', pill: '', pillClass: '' },
  { id: 'calendar',  href: '/calendar',  label: 'Calendar',  sub: 'Bookings grid',  pill: 'Day', pillClass: 'blue' },
  { id: 'clients',   href: '/clients',   label: 'Clients',   sub: 'Search / notes', pill: '', pillClass: '' },
  { id: 'payments',  href: '/payments',  label: 'Payments',  sub: 'Square + Terminal', pill: 'Live', pillClass: 'live', ownerAdmin: true },
  { id: 'payroll',   href: '/payroll',   label: 'Payroll',   sub: 'Commission + tips', pill: '', pillClass: '', ownerOnly: true },
  { id: 'settings',  href: '/settings',  label: 'Settings',  sub: 'Config & sync', pill: '', pillClass: '', ownerAdmin: true },
] as const

const ICONS: Record<string, string> = {
  dashboard: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>`,
  calendar:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  clients:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  payments:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>`,
  payroll:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  settings:  `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
}

export default function Shell({ children, page }: { children: React.ReactNode; page: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [pw, setPw] = useState({ cur: '', nw: '', cfm: '' })
  const [pwErr, setPwErr] = useState('')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) { router.push('/signin'); return }
    const stored = localStorage.getItem('ELEMENT_USER')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.user) { setUser(d.user); localStorage.setItem('ELEMENT_USER', JSON.stringify(d.user)) } else { router.push('/signin') } })
      .catch(() => {})
  }, [])

  function logout() {
    localStorage.removeItem('ELEMENT_TOKEN')
    localStorage.removeItem('ELEMENT_USER')
    router.push('/signin')
  }

  async function savePw() {
    setPwErr('')
    if (!pw.cur || !pw.nw) { setPwErr('Fill all fields'); return }
    if (pw.nw.length < 4) { setPwErr('Min 4 characters'); return }
    if (pw.nw !== pw.cfm) { setPwErr('Passwords do not match'); return }
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const r = await fetch(`${API}/api/auth/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ current_password: pw.cur, new_password: pw.nw }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setPwModal(false); setPw({ cur: '', nw: '', cfm: '' }); alert('Password updated!')
    } catch(e: any) { setPwErr(e.message) }
  }

  const visibleNav = NAV.filter(item => {
    if ('ownerOnly' in item && item.ownerOnly && user?.role !== 'owner') return false
    if ('ownerAdmin' in item && item.ownerAdmin && user?.role === 'barber') return false
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#000;color:#e9e9e9;font-family:Inter,system-ui,sans-serif;}
        a{color:#fff!important;text-decoration:none!important;}
        button,input{font-family:inherit;}
        .shell{display:flex;height:100vh;width:100vw;overflow:hidden;}
        .sidebar{width:280px;flex:0 0 280px;border-right:1px solid rgba(255,255,255,.10);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02));backdrop-filter:blur(18px);display:flex;flex-direction:column;height:100vh;overflow:auto;z-index:40;transition:transform .25s ease;}
        .brand{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 14px;border-bottom:1px solid rgba(255,255,255,.10);}
        .brand h1{margin:0;font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:14px;text-transform:uppercase;}
        .brand-tag{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.12);padding:5px 9px;border-radius:999px;background:rgba(255,255,255,.04);}
        .nav{display:flex;flex-direction:column;gap:6px;padding:12px 8px;flex:1;}
        .nav-item{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.10);transition:all .18s ease;text-decoration:none!important;}
        .nav-item:hover{background:rgba(255,255,255,.06);}
        .nav-item.active{border-color:rgba(10,132,255,.75);box-shadow:0 0 0 1px rgba(10,132,255,.22) inset,0 0 18px rgba(10,132,255,.25);background:rgba(10,132,255,.12);}
        .nav-left{display:flex;align-items:center;gap:10px;min-width:0;}
        .ico{width:34px;height:34px;border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);flex:0 0 auto;color:rgba(255,255,255,.80);}
        .nav-label{min-width:0;}
        .nav-t{font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;color:#fff!important;}
        .nav-s{font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.45)!important;display:block;}
        .pill{font-size:10px;letter-spacing:.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:rgba(255,255,255,.65);flex:0 0 auto;white-space:nowrap;}
        .pill.blue{border-color:rgba(10,132,255,.55);background:rgba(10,132,255,.12);color:#d7ecff;}
        .pill.live{border-color:rgba(143,240,177,.45);background:rgba(143,240,177,.08);color:#c9ffe1;}
        .user-bar{padding:10px;border-top:1px solid rgba(255,255,255,.08);}
        .user-card{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:rgba(0,0,0,.16);}
        .user-info{min-width:0;overflow:hidden;}
        .user-name{font-weight:900;font-size:13px;color:#e9e9e9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .user-role{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.40);margin-top:2px;}
        .user-btns{display:flex;gap:6px;flex-shrink:0;}
        .ubtn{height:30px;padding:0 10px;border-radius:8px;cursor:pointer;font-size:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:#fff;}
        .ubtn.out{border-color:rgba(255,107,107,.30);background:rgba(255,107,107,.06);color:#ffd0d0;}
        .burger{display:none;position:fixed;top:14px;left:14px;z-index:200;width:44px;height:44px;border-radius:14px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.85);backdrop-filter:blur(12px);color:#fff;cursor:pointer;align-items:center;justify-content:center;flex-direction:column;gap:5px;}
        .burger span{display:block;width:18px;height:2px;border-radius:2px;background:#fff;transition:all .25s;}
        .sb-backdrop{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:39;}
        .sb-backdrop.open{display:block;}
        .content{flex:1;min-width:0;height:100vh;overflow-y:auto;overflow-x:hidden;background:#000;}
        .pw-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(10px);z-index:500;display:flex;align-items:center;justify-content:center;}
        .pw-modal{width:min(360px,90vw);border-radius:20px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98));box-shadow:0 24px 80px rgba(0,0,0,.7);padding:24px;}
        .pw-input{height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(0,0,0,.30);color:#fff;padding:0 14px;font-size:14px;outline:none;width:100%;margin-bottom:10px;display:block;}
        .pw-input:focus{border-color:rgba(10,132,255,.55);}
        @media(max-width:980px){
          .sidebar{position:fixed;inset:0 auto 0 0;transform:translateX(-110%);z-index:180;}
          .sidebar.open{transform:translateX(0);}
          .burger{display:flex;}
        }
      `}</style>

      <button className="burger" style={{ display: 'none' }} onClick={() => setSidebarOpen(v => !v)}>
        <span /><span /><span />
      </button>
      <div className={`sb-backdrop ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className="shell">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <div>
              <h1>Element CRM</h1>
              <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginTop: 3 }}>{page.toUpperCase()}</div>
            </div>
            <div className="brand-tag">v3</div>
          </div>

          <nav className="nav">
            {visibleNav.map(item => (
              <Link key={item.id} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
                <div className="nav-left">
                  <div className="ico" dangerouslySetInnerHTML={{ __html: ICONS[item.id] }} />
                  <div className="nav-label">
                    <span className="nav-t">{item.label}</span>
                    <span className="nav-s">{item.sub}</span>
                  </div>
                </div>
                {item.pill && <span className={`pill ${item.pillClass}`}>{item.pill}</span>}
              </Link>
            ))}
          </nav>

          <div className="user-bar">
            <div className="user-card">
              <div className="user-info">
                <div className="user-name">{user?.name || user?.username || '—'}</div>
                <div className="user-role">{user?.role || '—'}</div>
              </div>
              <div className="user-btns">
                <button className="ubtn" onClick={() => setPwModal(true)}>PW</button>
                <button className="ubtn out" onClick={logout}>Out</button>
              </div>
            </div>
          </div>
        </aside>

        <div className="content">{children}</div>
      </div>

      {pwModal && (
        <div className="pw-overlay" onClick={() => setPwModal(false)}>
          <div className="pw-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 14 }}>Change password</div>
            {[['Current password', pw.cur, (v: string) => setPw(p => ({...p, cur: v}))], ['New password', pw.nw, (v: string) => setPw(p => ({...p, nw: v}))], ['Confirm new password', pw.cfm, (v: string) => setPw(p => ({...p, cfm: v}))]].map(([ph, val, fn], i) => (
              <input key={i} type="password" placeholder={ph as string} value={val as string} onChange={e => (fn as any)(e.target.value)} className="pw-input" />
            ))}
            {pwErr && <div style={{ fontSize: 12, color: '#ffd0d0', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,107,107,.08)', border: '1px solid rgba(255,107,107,.25)', marginBottom: 10 }}>{pwErr}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setPwModal(false)} style={{ height: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 700, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff' }}>Cancel</button>
              <button onClick={savePw} style={{ height: 40, padding: '0 18px', borderRadius: 999, cursor: 'pointer', fontWeight: 900, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.16)', color: '#d7ecff' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
