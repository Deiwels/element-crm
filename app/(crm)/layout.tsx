'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { can, isOwnerOrAdmin } from '@/lib/roles'
import Link from 'next/link'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', sub: 'Overview', icon: '◈' },
  { href: '/calendar',  label: 'Calendar',  sub: 'Bookings', icon: '◷', pill: 'Live' },
  { href: '/clients',   label: 'Clients',   sub: 'Database', icon: '◎' },
  { href: '/payments',  label: 'Payments',  sub: 'Transactions', icon: '◉', ownerAdmin: true },
  { href: '/payroll',   label: 'Payroll',   sub: 'Earnings', icon: '◈', ownerOnly: true },
  { href: '/settings',  label: 'Settings',  sub: 'Configure', icon: '⚙', ownerAdmin: true },
]

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/signin')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-white/40 text-sm tracking-widest uppercase">Loading…</div>
      </div>
    )
  }

  if (!user) return null

  const visibleNav = NAV.filter(item => {
    if (item.ownerOnly && user.role !== 'owner') return false
    if (item.ownerAdmin && !isOwnerOrAdmin(user)) return false
    return true
  })

  const roleLabel = user.role === 'owner' ? 'Owner' : user.role === 'admin' ? 'Admin' : 'Barber'

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 flex flex-col
        border-r border-white/10 bg-gradient-to-b from-white/5 to-white/2 backdrop-blur-xl
        transition-transform duration-250
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Brand */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <div>
            <h1 className="font-display tracking-[.18em] uppercase text-sm">Element</h1>
            <p className="text-[10px] tracking-[.12em] uppercase text-white/40 mt-0.5">Staff CRM</p>
          </div>
          <span className="text-[11px] tracking-[.10em] uppercase px-3 py-1.5 rounded-full border border-white/12 bg-white/4 text-white/55">
            {roleLabel}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {visibleNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center justify-between gap-3 px-3 py-3 rounded-2xl border transition-all
                ${pathname === item.href
                  ? 'border-blue-500/75 bg-blue-500/12 shadow-[0_0_18px_rgba(10,132,255,.25)]'
                  : 'border-white/10 bg-black/10 hover:bg-white/6'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/12 bg-white/5 flex-shrink-0 text-base">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-black text-sm tracking-wide text-white">{item.label}</div>
                  <div className="text-[11px] tracking-widest uppercase text-white/45">{item.sub}</div>
                </div>
              </div>
              {item.pill && (
                <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border border-emerald-400/45 bg-emerald-400/8 text-emerald-300 flex-shrink-0">
                  {item.pill}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <div className="text-sm font-bold text-white">{user.name}</div>
              <div className="text-[11px] text-white/40 tracking-wide">{user.username}</div>
            </div>
            <button
              onClick={logout}
              className="text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/12 bg-white/4 text-white/55 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-300 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/80 backdrop-blur-xl sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/18 bg-black/75"
          >
            <span className="w-4 h-0.5 bg-white rounded-full" />
            <span className="w-4 h-0.5 bg-white rounded-full" />
            <span className="w-4 h-0.5 bg-white rounded-full" />
          </button>
          <span className="font-display tracking-[.18em] uppercase text-sm">Element</span>
        </div>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
