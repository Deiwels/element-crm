'use client'
import { useEffect, useState, useCallback } from 'react'
import Shell from '@/components/Shell'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

interface Booking {
  id: string
  client_name?: string
  barber_name?: string
  barber?: string
  service_name?: string
  service?: string
  start_at?: string
  status?: string
  paid?: boolean
  is_paid?: boolean
  payment_status?: string
}

interface Payment {
  amount?: number
  tip?: number
}

function money(n: number) { return '$' + Number(n || 0).toFixed(2) }
function fmtTime(iso?: string) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) }
  catch { return '—' }
}
function isoToday() { return new Date().toISOString().slice(0, 10) }
function fmtDateLong() {
  return new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  paid:      { borderColor: 'rgba(143,240,177,.40)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  booked:    { borderColor: 'rgba(10,132,255,.40)',  background: 'rgba(10,132,255,.10)',  color: '#d7ecff' },
  arrived:   { borderColor: 'rgba(143,240,177,.40)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  done:      { borderColor: 'rgba(255,207,63,.40)',  background: 'rgba(255,207,63,.08)',  color: '#ffe9a3' },
  noshow:    { borderColor: 'rgba(255,107,107,.40)', background: 'rgba(255,107,107,.10)', color: '#ffd0d0' },
  cancelled: { borderColor: 'rgba(255,107,107,.30)', background: 'rgba(255,107,107,.07)', color: '#ffd0d0' },
}

function Chip({ label, type }: { label: string; type: string }) {
  const s = STATUS_STYLE[type] || {}
  return (
    <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.12)', color: 'rgba(255,255,255,.70)', ...s }}>
      {label}
    </span>
  )
}

function KpiCard({ title, value, sub, dotColor }: { title: string; value: string; sub: string; dotColor: string }) {
  const dots: Record<string, string> = { ok: '#8ff0b1', bad: '#ff6b6b', blue: '#0a84ff', gold: '#ffcf3f', '': 'rgba(255,255,255,.25)' }
  return (
    <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', boxShadow: '0 10px 40px rgba(0,0,0,.35)', padding: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)' }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: dots[dotColor] || dots[''], flexShrink: 0, display: 'inline-block' }} />
        {sub}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBarber, setFilterBarber] = useState('')

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    const today = isoToday()
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    setLoading(true)
    try {
      const [bkRes, pmRes] = await Promise.all([
        fetch(`${API}/api/bookings?from=${today}T00:00:00.000Z&to=${today}T23:59:59.999Z`, { headers }),
        fetch(`${API}/api/payments?from=${today}&to=${today}`, { headers }),
      ])
      const bkData = await bkRes.json()
      const pmData = await pmRes.json()
      setBookings(Array.isArray(bkData?.bookings) ? bkData.bookings : Array.isArray(bkData) ? bkData : [])
      setPayments(Array.isArray(pmData?.payments) ? pmData.payments : [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { const t = setInterval(loadAll, 120000); return () => clearInterval(t) }, [loadAll])

  const barbers = [...new Set(bookings.map(b => b.barber_name || b.barber).filter(Boolean))] as string[]
  const filtered = bookings
    .filter(b => !filterBarber || (b.barber_name || b.barber) === filterBarber)
    .filter(b => !search || [b.client_name, b.barber_name, b.service_name].join(' ').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')))

  const total  = filtered.length
  const paid   = filtered.filter(b => b.paid || b.is_paid || b.payment_status === 'paid').length
  const noshow = filtered.filter(b => b.status === 'noshow' || b.status === 'no_show').length
  const gross  = payments.reduce((s, p) => s + (p.amount || 0) + (p.tip || 0), 0)
  const tips   = payments.reduce((s, p) => s + (p.tip || 0), 0)

  const byBarber = bookings.reduce((acc, b) => {
    const name = b.barber_name || b.barber || '?'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const maxCount = Math.max(...Object.values(byBarber), 1)

  return (
    <Shell page="dashboard">
      <div style={{ padding: '18px 18px 40px', maxWidth: 1400, margin: '0 auto', overflowY: 'auto', height: '100vh', color: '#e9e9e9', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '10px 0 12px', background: 'linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),transparent)', backdropFilter: 'blur(14px)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: '"Julius Sans One", sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 16 }}>Dashboard</h2>
              <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,.45)', fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase' }}>
                {fmtDateLong()} · ELEMENT BARBERSHOP
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                placeholder="Search client / booking…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: 44, width: 'min(300px, 55vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }}
              />
              <button onClick={loadAll} style={{ height: 44, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16 }}>↻</button>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 14 }}>
          <KpiCard title="Bookings today" value={loading ? '…' : String(total)} sub={`${filtered.filter(b => b.status === 'booked' || b.status === 'arrived').length} upcoming`} dotColor="blue" />
          <KpiCard title="Revenue today"  value={loading ? '…' : money(gross)} sub={tips > 0 ? `incl. ${money(tips)} tips` : 'from bookings'} dotColor="ok" />
          <KpiCard title="Paid / Unpaid"  value={loading ? '…' : `${paid}/${total}`} sub={total - paid > 0 ? `${total - paid} unpaid` : 'all paid ✓'} dotColor={total > 0 && paid === total ? 'ok' : total - paid > 0 ? 'gold' : ''} />
          <KpiCard title="No-shows"       value={loading ? '…' : String(noshow)} sub={noshow > 0 ? 'needs attention' : 'all good'} dotColor={noshow > 0 ? 'bad' : ''} />
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14 }}>

          {/* Today's appointments */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)' }}>Today's appointments</span>
              <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}
                style={{ height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 8px', fontSize: 11, outline: 'none' }}>
                <option value="">All barbers</option>
                {barbers.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.30)', fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase' }}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.30)', fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase' }}>No bookings today</div>
              ) : filtered.map((b, i) => (
                <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)', cursor: 'pointer' }}>
                  <span style={{ width: 48, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{fmtTime(b.start_at)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.client_name || 'Client'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.50)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.barber_name || b.barber || '—'} · {b.service_name || b.service || '—'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {(b.paid || b.is_paid || b.payment_status === 'paid') && <Chip label="Paid" type="paid" />}
                    <Chip label={b.status || 'booked'} type={b.status || 'booked'} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quick actions */}
            <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Quick actions</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Calendar', desc: 'View & manage bookings', href: '/calendar' },
                  { label: 'Payments', desc: 'Transactions & Square', href: '/payments' },
                  { label: 'Payroll',  desc: 'Commission + tips', href: '/payroll' },
                  { label: 'Settings', desc: 'Tax, fees, barbers', href: '/settings' },
                ].map(item => (
                  <a key={item.href} href={item.href} style={{ padding: '14px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.14)', cursor: 'pointer', display: 'block' }}>
                    <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.50)', lineHeight: 1.4 }}>{item.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Barber bars */}
            <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Today by barber</div>
              {Object.entries(byBarber).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                  <span style={{ width: 60, fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)' }}>
                    <div style={{ height: 6, borderRadius: 999, background: 'linear-gradient(90deg,#0a84ff,rgba(10,132,255,.5))', width: `${Math.round(count / maxCount * 100)}%`, transition: 'width .6s ease' }} />
                  </div>
                  <span style={{ width: 55, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{count} bk</span>
                </div>
              ))}
              {Object.keys(byBarber).length === 0 && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No data yet</div>}
            </div>

            {/* Activity */}
            <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Recent activity</div>
              {[...bookings].sort((a, b) => String(b.start_at || '').localeCompare(String(a.start_at || ''))).slice(0, 8).map((b, i) => {
                const dotColors: Record<string, string> = { booked: '#0a84ff', arrived: '#8ff0b1', done: '#ffcf3f', noshow: '#ff6b6b', cancelled: '#ff6b6b' }
                const dotColor = b.paid ? '#8ff0b1' : (dotColors[b.status || ''] || 'rgba(255,255,255,.25)')
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0, marginTop: 5, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, lineHeight: 1.4, flex: 1 }}>
                      <strong>{b.client_name || 'Client'}</strong> — {b.service_name || 'service'} · <em style={{ color: 'rgba(255,255,255,.45)' }}>{b.paid ? 'paid' : (b.status || 'booked')}</em>
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtTime(b.start_at)}</span>
                  </div>
                )
              })}
              {bookings.length === 0 && !loading && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No activity yet</div>}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  )
}
