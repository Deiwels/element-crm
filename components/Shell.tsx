'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

interface User {
  uid: string
  name: string
  username: string
  role: string
}

const NAV = [
  { id: 'dashboard', href: '/dashboard', label: 'Dashboard', sub: 'Today overview' },
  { id: 'calendar',  href: '/calendar',  label: 'Calendar',  sub: 'Bookings grid' },
  { id: 'clients',   href: '/clients',   label: 'Clients',   sub: 'Search / notes' },
  { id: 'payments',  href: '/payments',  label: 'Payments',  sub: 'Square + Terminal', ownerAdmin: true },
  { id: 'payroll',   href: '/payroll',   label: 'Payroll',   sub: 'Commission + tips', ownerOnly: true },
  { id: 'settings',  href: '/settings',  label: 'Settings',  sub: 'Config & sync', ownerAdmin: true },
]

export default function Shell({ children, page }: { children: React.ReactNode; page: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'ok' | 'noauth'>('loading')
  const pathname = usePathname()

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    
    if (!token) {
      setStatus('noauth')
      return
    }

    // Load cached user
    const stored = localStorage.getItem('ELEMENT_USER')
    if (stored) {
      try { 
        setUser(JSON.parse(stored))
        setStatus('ok')
      } catch {
        setStatus('ok')
      }
    } else {
      setStatus('ok')
    }

    // Verify in background — do NOT redirect on failure
    fetch(`${API}/api/auth/me`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setUser(d.user)
          localStorage.setItem('ELEMENT_USER', JSON.stringify(d.user))
        }
      })
      .catch(() => {})
  }, [])

  // Only redirect if confirmed no token
  useEffect(() => {
    if (status === 'noauth') {
      window.location.href = '/signin'
    }
  }, [status])

  if (status === 'loading') {
    return <div style={{ background: '#000', minHeight: '100vh' }} />
  }

  if (status === 'noauth') {
    return <div style={{ background: '#000', minHeight: '100vh' }} />
  }

  const visibleNav = NAV.filter(item => {
    if ('ownerOnly' in item && (item as any).ownerOnly && user?.role !== 'owner') return false
    if ('ownerAdmin' in item && (item as any).ownerAdmin && user?.role === 'barber') return false
    return true
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;background:#000;color:#e9e9e9;font-family:Inter,system-ui,sans-serif;}
        a{color:#fff!important;text-decoration:none!important;}
        .shell{display:flex;height:100vh;width:100vw;overflow:hidden;}
        .sidebar{width:260px;flex:0 0 260px;border-right:1px solid rgba(255,255,255,.10);background:rgba(255,255,255,.03);display:flex;flex-direction:column;height:100vh;}
        .brand{padding:16px 14px;border-bottom:1px solid rgba(255,255,255,.08);}
        .brand h1{font-family:"Julius Sans One",sans-serif;letter-spacing:.18em;font-size:13px;text-transform:uppercase;color:#e9e9e9;}
        .brand-sub{font-size:10px;letter-spacing:.10em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-top:3px;}
        .nav{display:flex;flex-direction:column;gap:4px;padding:10px 8px;flex:1;}
        .nav-item{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:12px;border:1px solid transparent;transition:all .15s ease;cursor:pointer;}
        .nav-item:hover{background:rgba(255,255,255,.05);border-color:rgba(255,255,255,.08);}
        .nav-item.active{border-color:rgba(10,132,255,.60);background:rgba(10,132,255,.10);}
        .nav-t{font-weight:700;font-size:13px;color:#e9e9e9;display:block;}
        .nav-s{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.40);display:block;margin-top:1px;}
        .user-bar{padding:10px;border-top:1px solid rgba(255,255,255,.08);}
        .user-card{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:12px;background:rgba(0,0,0,.20);}
        .user-name{font-weight:700;font-size:13px;color:#e9e9e9;}
        .user-role{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.35);margin-top:2px;}
        .logout-btn{height:30px;padding:0 12px;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;border:1px solid rgba(255,107,107,.30);background:rgba(255,107,107,.06);color:#ffd0d0;font-family:inherit;}
        .content{flex:1;min-width:0;height:100vh;overflow:hidden;background:#000;}
      `}</style>

      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <h1>Element CRM</h1>
            <div className="brand-sub">{page}</div>
          </div>
          <nav className="nav">
            {visibleNav.map(item => (
              <Link key={item.id} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
                <div>
                  <span className="nav-t">{item.label}</span>
                  <span className="nav-s">{item.sub}</span>
                </div>
              </Link>
            ))}
          </nav>
          <div className="user-bar">
            <div className="user-card">
              <div>
                <div className="user-name">{user?.name || user?.username || '—'}</div>
                <div className="user-role">{user?.role || '—'}</div>
              </div>
              <button className="logout-btn" onClick={() => {
                localStorage.removeItem('ELEMENT_TOKEN')
                localStorage.removeItem('ELEMENT_USER')
                window.location.href = '/signin'
              }}>Log out</button>
            </div>
          </div>
        </aside>
        <div className="content">{children}</div>
      </div>
    </>
  )
}
