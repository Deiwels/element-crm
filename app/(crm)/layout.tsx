'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { isOwnerOrAdmin } from '@/lib/roles'
import Link from 'next/link'

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', sub: 'Today overview', pill: '', pillClass: '' },
  { id: 'calendar',  href: '/calendar',  label: 'Calendar',  sub: 'Bookings grid',  pill: 'Day', pillClass: 'blue' },
  { id: 'clients',   href: '/clients',   label: 'Clients',   sub: 'Search / notes', pill: '', pillClass: '' },
  { id: 'payments',  href: '/payments',  label: 'Payments',  sub: 'Square + Terminal', pill: 'Live', pillClass: 'live', ownerAdmin: true },
  { id: 'payroll',   href: '/payroll',   label: 'Payroll',   sub: 'Commission + tips', pill: '', pillClass: '', ownerOnly: true },
  { id: 'settings',  href: '/settings',  label: 'Settings',  sub: 'Config & sync', pill: '', pillClass: '', ownerAdmin: true },
] as const

const ICONS: Record<string, React.ReactNode> = {
  dashboard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>,
  calendar:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  clients:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  payments:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>,
  payroll:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  settings:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pw, setPw] = useState({ cur: '', nw: '', cfm: '' })
  const [pwErr, setPwErr] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/signin')
  }, [user, loading, router])

  if (loading) return <div className="loader"><div className="loader-dot"/></div>
  if (!user) return null

  const visibleNav = NAV.filter(item => {
    if ('ownerOnly' in item && item.ownerOnly && user.role !== 'owner') return false
    if ('ownerAdmin' in item && item.ownerAdmin && !isOwnerOrAdmin(user)) return false
    return true
  })

  async function savePw() {
    setPwErr('')
    if (!pw.cur || !pw.nw) { setPwErr('Fill all fields'); return }
    if (pw.nw.length < 4) { setPwErr('Min 4 characters'); return }
    if (pw.nw !== pw.cfm) { setPwErr('Passwords do not match'); return }
    setPwLoading(true)
    try {
      const TOKEN = localStorage.getItem('ELEMENT_TOKEN') || ''
      const r = await fetch('https://element-crm-api-431945333485.us-central1.run.app/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN },
        body: JSON.stringify({ current_password: pw.cur, new_password: pw.nw })
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error')
      setShowPw(false); setPw({ cur: '', nw: '', cfm: '' })
      alert('Password updated!')
    } catch(e: any) { setPwErr(e.message) }
    finally { setPwLoading(false) }
  }

  const currentLabel = visibleNav.find(n => pathname.startsWith(n.href))?.label?.toUpperCase() || 'DASHBOARD'

  return (
    <>
      <button className={`burger${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(v => !v)}>
        <span/><span/><span/>
      </button>
      <div className={`sb-backdrop${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)}/>

      <div className="shell">
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="brand">
            <div>
              <h1>Element CRM</h1>
              <div style={{fontSize:10,letterSpacing:'.10em',textTransform:'uppercase',color:'rgba(255,255,255,.40)',marginTop:3}}>{currentLabel}</div>
            </div>
            <div className="brand-tag">v3</div>
          </div>

          <nav className="nav">
            {visibleNav.map(item => (
              <Link key={item.id} href={item.href} className={pathname.startsWith(item.href) ? 'active' : ''} onClick={() => setSidebarOpen(false)}>
                <div className="nav-left">
                  <div className="ico">{ICONS[item.id]}</div>
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
                <div className="user-name">{user.name || user.username}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <div className="user-btns">
                <button onClick={() => setShowPw(true)}>PW</button>
                <button className="btn-out" onClick={logout}>Out</button>
              </div>
            </div>
          </div>
        </aside>

        <div className="content">{children}</div>
      </div>

      {showPw && (
        <>
          <div onClick={() => setShowPw(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(10px)',zIndex:9500}}/>
          <div style={{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(360px,90vw)',borderRadius:20,border:'1px solid rgba(255,255,255,.12)',background:'linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98))',boxShadow:'0 24px 80px rgba(0,0,0,.7)',padding:24,zIndex:9501}}>
            <div style={{fontFamily:'"Julius Sans One",sans-serif',letterSpacing:'.16em',textTransform:'uppercase',fontSize:11,color:'rgba(255,255,255,.45)',marginBottom:14}}>Change password</div>
            {[['Current password', pw.cur, (v:string)=>setPw(p=>({...p,cur:v}))],['New password', pw.nw, (v:string)=>setPw(p=>({...p,nw:v}))],['Confirm new password', pw.cfm, (v:string)=>setPw(p=>({...p,cfm:v}))]].map(([ph, val, fn], i) => (
              <input key={i} type="password" placeholder={ph as string} value={val as string}
                onChange={e => (fn as any)(e.target.value)}
                style={{height:44,borderRadius:12,border:'1px solid rgba(255,255,255,.12)',background:'rgba(0,0,0,.30)',color:'#fff',padding:'0 14px',fontFamily:'inherit',fontSize:14,outline:'none',width:'100%',marginBottom:10,display:'block'}}/>
            ))}
            {pwErr && <div style={{fontSize:12,color:'#ffd0d0',padding:'8px 12px',borderRadius:8,background:'rgba(255,107,107,.08)',border:'1px solid rgba(255,107,107,.25)',marginBottom:10}}>{pwErr}</div>}
            <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
              <button onClick={() => setShowPw(false)} style={{height:40,padding:'0 18px',borderRadius:999,cursor:'pointer',fontWeight:700,fontFamily:'inherit',border:'1px solid rgba(255,255,255,.14)',background:'rgba(255,255,255,.06)',color:'#fff'}}>Cancel</button>
              <button onClick={savePw} disabled={pwLoading} style={{height:40,padding:'0 18px',borderRadius:999,cursor:'pointer',fontWeight:900,fontFamily:'inherit',border:'1px solid rgba(10,132,255,.65)',background:'rgba(10,132,255,.16)',color:'#d7ecff'}}>{pwLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
