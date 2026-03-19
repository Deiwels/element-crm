'use client'
import { useEffect, useState, useCallback } from 'react'
import Shell from '@/components/Shell'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

interface Booking {
  id: string; client_name?: string; barber_name?: string; barber?: string
  barber_id?: string; service_name?: string; service?: string
  start_at?: string; status?: string; paid?: boolean
  is_paid?: boolean; payment_status?: string
}
interface BarberPayroll {
  barber_id: string; barber_name: string
  service_total: number; tips_total: number; barber_total: number
  barber_service_share: number; client_count: number; bookings_count: number
}

const money = (n: number) => '$' + Number(n || 0).toFixed(2)
const fmtTime = (iso?: string) => { try { return new Date(iso!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) } catch { return '—' } }
const isoToday = () => { const d = new Date(); const p = (n: number) => String(n).padStart(2,'0'); return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}` }
const fmtDateLong = () => new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

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
  return <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.12)', color: 'rgba(255,255,255,.70)', ...s }}>{label}</span>
}

function KpiCard({ title, value, sub, color }: { title: string; value: string; sub: string; color?: string }) {
  const dots: Record<string, string> = { ok: '#8ff0b1', bad: '#ff6b6b', blue: '#0a84ff', gold: '#ffcf3f' }
  return (
    <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', boxShadow: '0 10px 40px rgba(0,0,0,.35)', padding: 16 }}>
      <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 10 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '.02em', lineHeight: 1 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,.45)' }}>
        {color && <span style={{ width: 7, height: 7, borderRadius: 999, background: dots[color] || 'rgba(255,255,255,.25)', flexShrink: 0, display: 'inline-block' }} />}
        {sub}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [myPayroll, setMyPayroll] = useState<BarberPayroll | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterBarber, setFilterBarber] = useState('')
  const [barbers, setBarbers] = useState<any[]>([])

  // Shop status & banner — owner/admin only
  const [shopStatus, setShopStatus] = useState<'auto'|'open'|'closed'>('auto')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Get current user from localStorage
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null') } catch { return null }
  })
  const role: string = user?.role || 'owner'
  const isBarber = role === 'barber'
  const myBarberId: string = user?.barber_id || ''
  const myBarberName: string = user?.name || ''
  const isOwnerOrAdmin = role === 'owner' || role === 'admin'

  const loadAll = useCallback(async () => {
    const token = localStorage.getItem('ELEMENT_TOKEN') || ''
    const headers: Record<string,string> = { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, Accept: 'application/json' }
    const today = isoToday()
    setLoading(true)
    try {
      // Load barbers for name lookup
      const [bkRes, brRes] = await Promise.all([
        fetch(`${API}/api/bookings?from=${today}T00:00:00.000Z&to=${today}T23:59:59.999Z`, { headers }),
        fetch(`${API}/api/barbers`, { headers }),
      ])
      const bkData = await bkRes.json()
      const brData = await brRes.json()
      const barberList = Array.isArray(brData) ? brData : (brData?.barbers || [])
      const barberMap: Record<string, string> = {}
      barberList.forEach((b: any) => { if (b.id && b.name) barberMap[String(b.id)] = String(b.name) })

      let bks: Booking[] = Array.isArray(bkData?.bookings) ? bkData.bookings : Array.isArray(bkData) ? bkData : []

      // Enrich with barber names
      bks = bks.map(b => {
        const bn = b.barber_name || b.barber || ''
        // If barber_name looks like an ID (long alphanum) — replace with real name
        const isId = bn.length > 16 && /^[A-Za-z0-9]+$/.test(bn)
        const realName = b.barber_id ? barberMap[String(b.barber_id)] : undefined
        return { ...b, barber_name: (isId || !bn) ? (realName || bn) : bn }
      })

      // Extra client-side filter for barbers (safety)
      if (isBarber && myBarberId) {
        bks = bks.filter(b => String(b.barber_id || '') === myBarberId)
      }
      setBookings(bks)

      // Load barbers list
      setBarbers(barberList)

      // Load shop settings for owner/admin
      if (!isBarber) {
        try {
          const settRes = await fetch(`${API}/api/settings`, { headers })
          const settData = await settRes.json()
          if (settData.shopStatusMode) setShopStatus(settData.shopStatusMode)
          if (settData.banner) {
            setBannerEnabled(!!settData.banner.enabled)
            setBannerText(settData.banner.text || '')
          }
        } catch {}
      }

      // Payroll for barber — load their personal stats from payroll API
      if (isBarber && myBarberId) {
        try {
          const pr = await fetch(`${API}/api/payroll?from=${today}T00:00:00.000Z&to=${today}T23:59:59.999Z`, { headers })
          const prData = await pr.json()
          const mine = (prData?.barbers || []).find((b: BarberPayroll) => b.barber_id === myBarberId)
          setMyPayroll(mine || null)
        } catch { setMyPayroll(null) }
      }
    } catch {}
    setLoading(false)
  }, [isBarber, myBarberId])

  useEffect(() => { loadAll() }, [loadAll])
  useEffect(() => { const t = setInterval(loadAll, 120000); return () => clearInterval(t) }, [loadAll])

  // For owner/admin: all barbers. For barber: only themselves
  const allBarberNames = [...new Set(bookings.map(b => b.barber_name || b.barber).filter(Boolean))] as string[]

  const filtered = bookings
    .filter(b => !filterBarber || (b.barber_name || b.barber) === filterBarber)
    .filter(b => !search || [b.client_name, b.barber_name, b.service_name].join(' ').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => String(a.start_at || '').localeCompare(String(b.start_at || '')))

  const total   = filtered.length
  const paid    = filtered.filter(b => b.paid || b.is_paid || b.payment_status === 'paid').length
  const noshow  = filtered.filter(b => b.status === 'noshow').length
  const upcoming = filtered.filter(b => b.status === 'booked' || b.status === 'arrived').length

  // Barber: show their payroll stats. Owner: show totals from bookings (rough)
  const barberEarnings = myPayroll?.barber_total || 0
  const barberTips     = myPayroll?.tips_total || 0
  const barberClients  = myPayroll?.client_count || total

  // Owner/Admin bars by barber
  const byBarber = bookings.reduce((acc, b) => {
    const name = b.barber_name || b.barber || '?'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const maxCount = Math.max(...Object.values(byBarber), 1)

  // Quick actions — filtered by role
  const actions = [
    { label: 'Calendar', desc: 'View & manage bookings', href: '/calendar' },
    ...(isOwnerOrAdmin ? [
      { label: 'Payments', desc: 'Transactions & Square', href: '/payments' },
      { label: 'Payroll',  desc: 'Commission + tips', href: '/payroll' },
      { label: 'Settings', desc: 'Tax, fees, barbers', href: '/settings' },
    ] : []),
  ]

  async function saveShopStatus(mode: 'auto'|'open'|'closed') {
    setShopStatus(mode)
    setStatusSaving(true)
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      await fetch(`${API}/api/settings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopStatusMode: mode })
      })
      setStatusMsg('Saved ✓')
      setTimeout(() => setStatusMsg(''), 2000)
    } catch { setStatusMsg('Error') }
    setStatusSaving(false)
  }

  async function saveBanner() {
    setStatusSaving(true)
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      await fetch(`${API}/api/settings`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner: { enabled: bannerEnabled, text: bannerText } })
      })
      setStatusMsg('Banner saved ✓')
      setTimeout(() => setStatusMsg(''), 2000)
    } catch { setStatusMsg('Error') }
    setStatusSaving(false)
  }

  const DAY_NAMES_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <Shell page="dashboard">
      <div style={{ padding: '18px 18px 40px', maxWidth: 1400, margin: '0 auto', overflowY: 'auto', height: '100vh', color: '#e9e9e9', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '10px 0 12px', background: 'linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),transparent)', backdropFilter: 'blur(14px)', marginBottom: 16 } as React.CSSProperties}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 className="page-title" style={{ margin: 0, fontFamily: '"Julius Sans One", sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 16 }}>
                {isBarber ? `Hey, ${myBarberName.split(' ')[0]}` : 'Dashboard'}
              </h2>
              <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,.45)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {fmtDateLong()} · ELEMENT BARBERSHOP
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ height: 40, width: 'min(200px,38vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />
              <button onClick={loadAll} style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>↻</button>
            </div>
          </div>
        </div>

        {/* KPIs — barber sees their own earnings, owner sees totals */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
          {isBarber ? <>
            <KpiCard title="My bookings today" value={loading ? '…' : String(total)} sub={`${upcoming} upcoming`} color="blue" />
            <KpiCard title="My earnings today" value={loading ? '…' : money(barberEarnings)} sub={`incl. ${money(barberTips)} tips`} color="ok" />
            <KpiCard title="My clients today" value={loading ? '…' : String(barberClients)} sub={paid > 0 ? `${paid} paid` : 'today'} color="gold" />
            <KpiCard title="No-shows" value={loading ? '…' : String(noshow)} sub={noshow > 0 ? 'needs attention' : 'all good'} color={noshow > 0 ? 'bad' : undefined} />
          </> : <>
            <KpiCard title="Bookings today" value={loading ? '…' : String(total)} sub={`${upcoming} upcoming`} color="blue" />
            <KpiCard title="Paid / Unpaid" value={loading ? '…' : `${paid}/${total}`} sub={total - paid > 0 ? `${total - paid} unpaid` : 'all paid ✓'} color={paid === total && total > 0 ? 'ok' : 'gold'} />
            <KpiCard title="No-shows" value={loading ? '…' : String(noshow)} sub={noshow > 0 ? 'needs attention' : 'all good'} color={noshow > 0 ? 'bad' : undefined} />
            <KpiCard title="Barbers working" value={loading ? '…' : String(Object.keys(byBarber).length)} sub="today" color="blue" />
          </>}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: 14 }}>

          {/* Appointments */}
          <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)' }}>
                {isBarber ? 'My appointments today' : "Today's appointments"}
              </span>
              {isOwnerOrAdmin && allBarberNames.length > 1 && (
                <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}
                  style={{ height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 8px', fontSize: 11, outline: 'none' }}>
                  <option value="">All barbers</option>
                  {allBarberNames.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 520, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'rgba(255,255,255,.30)', fontSize: 12, letterSpacing: '.10em' }}>Loading…</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No bookings today</div>
              ) : filtered.map((b, i) => (
                <div key={b.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)' }}>
                  <span style={{ width: 44, fontWeight: 900, fontSize: 13, flexShrink: 0 }}>{fmtTime(b.start_at)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.client_name || 'Client'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {!isBarber && <>{b.barber_name || b.barber || '—'} · </>}{b.service_name || b.service || '—'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                {actions.map(item => (
                  <a key={item.href} href={item.href} style={{ padding: '13px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.14)', cursor: 'pointer', display: 'block', textDecoration: 'none' }}>
                    <div style={{ fontWeight: 900, fontSize: 13, marginBottom: 4, color: '#fff' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', lineHeight: 1.4 }}>{item.desc}</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Barber: earnings breakdown. Owner: by barber bars */}
            {isBarber ? (
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>My earnings today</div>
                {loading ? <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12 }}>Loading…</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Services', value: money(myPayroll?.barber_service_share || 0), color: '#d7ecff' },
                      { label: 'Tips', value: money(barberTips), color: '#8ff0b1' },
                      { label: 'Total payout', value: money(barberEarnings), color: '#fff', big: true },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: row.big ? 'rgba(10,132,255,.08)' : 'rgba(0,0,0,.14)', borderColor: row.big ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.08)' }}>
                        <span style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>{row.label}</span>
                        <span style={{ fontWeight: 900, fontSize: row.big ? 18 : 14, color: row.color }}>{row.value}</span>
                      </div>
                    ))}
                    {!myPayroll && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.30)', marginTop: 4 }}>Updates every 2 minutes</div>}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Today by barber</div>
                {Object.entries(byBarber).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <span style={{ width: 70, fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)' }}>
                      <div style={{ height: 6, borderRadius: 999, background: 'linear-gradient(90deg,#0a84ff,rgba(10,132,255,.5))', width: `${Math.round(count / maxCount * 100)}%`, transition: 'width .6s ease' }} />
                    </div>
                    <span style={{ width: 50, textAlign: 'right', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{count} bk</span>
                  </div>
                ))}
                {Object.keys(byBarber).length === 0 && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No data yet</div>}
              </div>
            )}

            {/* Recent activity */}
            <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Recent activity</div>
              {[...bookings].sort((a, b) => String(b.start_at||'').localeCompare(String(a.start_at||''))).slice(0, 6).map((b, i) => {
                const dotColors: Record<string,string> = { booked:'#0a84ff', arrived:'#8ff0b1', done:'#ffcf3f', noshow:'#ff6b6b', cancelled:'#ff6b6b' }
                const dc = b.paid ? '#8ff0b1' : (dotColors[b.status||''] || 'rgba(255,255,255,.25)')
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: dc, flexShrink: 0, marginTop: 5, display: 'inline-block' }} />
                    <span style={{ fontSize: 12, lineHeight: 1.4, flex: 1 }}>
                      <strong>{b.client_name || 'Client'}</strong> — {b.service_name || 'service'}
                      {!isBarber && <> · <em style={{ color: 'rgba(255,255,255,.40)' }}>{b.barber_name || b.barber}</em></>}
                    </span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', whiteSpace: 'nowrap' }}>{fmtTime(b.start_at)}</span>
                  </div>
                )
              })}
              {bookings.length === 0 && !loading && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No activity yet</div>}
            </div>
          </div>
        </div>
          {/* ── OWNER/ADMIN ONLY: Shop Status + Banner + Barbers ── */}
          {isOwnerOrAdmin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>

              {/* Shop Status */}
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Shop status</span>
                  {statusMsg && <span style={{ fontSize: 11, color: '#8ff0b1' }}>{statusMsg}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['auto','open','closed'] as const).map(mode => {
                    const labels = { auto: '🔄 Auto', open: '✅ Force Open', closed: '❌ Force Closed' }
                    const colors = {
                      auto:   shopStatus==='auto'   ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.08)',
                      open:   shopStatus==='open'   ? 'rgba(143,240,177,.35)' : 'rgba(255,255,255,.08)',
                      closed: shopStatus==='closed' ? 'rgba(255,107,107,.35)' : 'rgba(255,255,255,.08)',
                    }
                    return (
                      <button key={mode} onClick={() => saveShopStatus(mode)} disabled={statusSaving}
                        style={{ height: 38, padding: '0 14px', borderRadius: 999, border: `1px solid ${colors[mode]}`, background: shopStatus===mode ? colors[mode] : 'rgba(255,255,255,.03)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: shopStatus===mode ? 900 : 400, fontFamily: 'inherit', transition: 'all .18s' }}>
                        {labels[mode]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Banner */}
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Top banner</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <button onClick={() => { setBannerEnabled(v => !v); }} style={{ height: 28, padding: '0 12px', borderRadius: 999, border: `1px solid ${bannerEnabled ? 'rgba(143,240,177,.40)' : 'rgba(255,255,255,.12)'}`, background: bannerEnabled ? 'rgba(143,240,177,.12)' : 'rgba(255,255,255,.04)', color: bannerEnabled ? '#8ff0b1' : 'rgba(255,255,255,.55)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                    {bannerEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>Shown on main website</span>
                </div>
                <textarea value={bannerText} onChange={e => setBannerText(e.target.value)} placeholder="THANKSGIVING · TODAY WE WORK UNTIL 2:00 PM" rows={2}
                  style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', padding: '8px 12px', fontSize: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical' as const }} />
                {bannerEnabled && bannerText && (
                  <div style={{ marginTop: 8, padding: '8px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.08)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', textAlign: 'center', color: '#fff' }}>
                    {bannerText}
                  </div>
                )}
                <button onClick={saveBanner} disabled={statusSaving} style={{ marginTop: 10, height: 36, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.07)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                  Save banner
                </button>
              </div>

              {/* Barbers schedule overview */}
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Barbers weekly schedule</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {barbers.map((b: any) => {
                    const sched = b.schedule
                    const workDays: number[] = Array.isArray(sched?.days) ? sched.days : [1,2,3,4,5,6]
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.12)' }}>
                        {b.photo_url ? <img src={b.photo_url} alt={b.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} /> : <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{(b.name||'?')[0]}</div>}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 4 }}>
                            {DAY_NAMES_SHORT.map((day, i) => {
                              const works = workDays.includes(i)
                              return (
                                <span key={day} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, border: `1px solid ${works ? 'rgba(143,240,177,.35)' : 'rgba(255,107,107,.25)'}`, background: works ? 'rgba(143,240,177,.08)' : 'rgba(255,107,107,.06)', color: works ? '#8ff0b1' : '#ffd0d0', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                                  {day}
                                </span>
                              )
                            })}
                          </div>
                          {sched && <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 3 }}>{Math.floor((sched.startMin||600)/60).toString().padStart(2,'0')}:{String((sched.startMin||600)%60).padStart(2,'0')} — {Math.floor((sched.endMin||1200)/60).toString().padStart(2,'0')}:{String((sched.endMin||1200)%60).padStart(2,'0')}</div>}
                        </div>
                      </div>
                    )
                  })}
                  {barbers.length === 0 && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>Loading barbers…</div>}
                </div>
              </div>

            </div>
          )}

      </div>
    </Shell>
  )
}
