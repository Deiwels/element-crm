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

  // Reviews
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewFilter, setReviewFilter] = useState('')
  const [addingReview, setAddingReview] = useState(false)
  const [rvBarber, setRvBarber] = useState('')
  const [rvName, setRvName] = useState('')
  const [rvRating, setRvRating] = useState(5)
  const [rvText, setRvText] = useState('')
  const [rvSaving, setRvSaving] = useState(false)

  // Shop status & banner — owner/admin only
  const [shopStatus, setShopStatus] = useState<'auto'|'open'|'closed'>('auto')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerText, setBannerText] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Phone access log
  const [phoneAccessLog, setPhoneAccessLog] = useState<any[]>([])

  // Attendance
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [clockLoading, setClockLoading] = useState(false)
  const [clockError, setClockError] = useState('')
  const [staffOnClock, setStaffOnClock] = useState<any[]>([])
  const [attHistory, setAttHistory] = useState<any[]>([])
  const [attSummary, setAttSummary] = useState<any>(null)
  const [attFrom, setAttFrom] = useState(() => isoToday())
  const [attTo, setAttTo] = useState(() => isoToday())
  const [attOpen, setAttOpen] = useState(false)
  const [attLoading, setAttLoading] = useState(false)

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

      // Parse barbers schedule same as calendar — flat {startMin, endMin, days} from server
      const parsedBarbers = barberList.map((b: any) => {
        const raw = b.schedule || b.work_schedule
        let schedule = null
        if (raw && typeof raw === 'object') {
          if (Array.isArray(raw)) {
            schedule = { startMin: raw[1]?.startMin ?? 10*60, endMin: raw[1]?.endMin ?? 20*60, days: raw.map((d: any, i: number) => d.enabled ? i : -1).filter((i: number) => i >= 0) }
          } else if (raw.startMin !== undefined) {
            // Flat object — what server normalizeSchedule returns
            schedule = {
              startMin: Number(raw.startMin ?? 10*60),
              endMin: Number(raw.endMin ?? 20*60),
              days: Array.isArray(raw.days) ? raw.days.map(Number) : [1,2,3,4,5,6]
            }
          }
        }
        return { ...b, schedule }
      })
      setBarbers(parsedBarbers)

      // Load shop settings for owner/admin
      if (!isBarber) {
        try {
          const settRes = await fetch(`${API}/api/settings`, { credentials: 'include', headers })
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
          const pr = await fetch(`${API}/api/payroll?from=${today}T00:00:00.000Z&to=${today}T23:59:59.999Z`, { credentials: 'include', headers })
          const prData = await pr.json()
          const mine = (prData?.barbers || []).find((b: BarberPayroll) => b.barber_id === myBarberId)
          setMyPayroll(mine || null)
        } catch { setMyPayroll(null) }
      }
    } catch {}
    // Load reviews
    try {
      const rvRes = await fetch(`${API}/api/reviews`, { headers })
      const rvData = await rvRes.json()
      setReviews(rvData?.reviews || [])
    } catch { setReviews([]) }
    // Load attendance status
    try {
      const attStatusRes = await fetch(`${API}/api/attendance/status`, { credentials: 'include', headers })
      const attStatus = await attStatusRes.json()
      setClockedIn(!!attStatus.clocked_in)
      setClockInTime(attStatus.clock_in || null)
      setTodayMinutes(attStatus.today_minutes || 0)
    } catch { setClockedIn(false) }
    // Admin: load who's on clock today
    if (!isBarber) {
      try {
        const staffRes = await fetch(`${API}/api/attendance?from=${today}&to=${today}`, { credentials: 'include', headers })
        const staffData = await staffRes.json()
        const records = staffData?.attendance || []
        // Currently clocked in = clock_out is null
        setStaffOnClock(records.filter((r: any) => !r.clock_out))
      } catch { setStaffOnClock([]) }
    }
    // Owner: load phone access log
    if (role === 'owner') {
      try {
        const palRes = await fetch(`${API}/api/admin/phone-access-log?limit=20`, { credentials: 'include', headers })
        const palData = await palRes.json()
        setPhoneAccessLog(palData?.logs || [])
      } catch { setPhoneAccessLog([]) }
    }
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
      await fetch(`${API}/api/settings`, { credentials: 'include',
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
      await fetch(`${API}/api/settings`, { credentials: 'include',
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

  // Attendance helpers
  const fmtMins = (m: number) => { const h = Math.floor(m / 60); const mm = m % 60; return h > 0 ? `${h}h ${mm}m` : `${mm}m` }
  const clockInSince = clockInTime ? new Date(clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : ''

  async function handleClockAction() {
    setClockLoading(true)
    setClockError('')
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
      })
      const { latitude: lat, longitude: lng } = pos.coords
      const endpoint = clockedIn ? '/api/attendance/clock-out' : '/api/attendance/clock-in'
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY },
        body: JSON.stringify({ lat, lng })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      loadAll()
    } catch (err: any) {
      if (err?.code === 1) setClockError('Location access denied. Enable GPS in your browser settings.')
      else if (err?.code === 2 || err?.code === 3) setClockError('Could not get location. Try again.')
      else setClockError(err?.message || 'Clock action failed')
    }
    setClockLoading(false)
  }

  async function loadAttHistory() {
    setAttLoading(true)
    try {
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const res = await fetch(`${API}/api/attendance?from=${attFrom}&to=${attTo}`, {
        credentials: 'include',
        headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, Accept: 'application/json' }
      })
      const data = await res.json()
      setAttHistory(data?.attendance || [])
      setAttSummary(data?.summary || null)
    } catch { setAttHistory([]); setAttSummary(null) }
    setAttLoading(false)
  }

  return (
    <Shell page="dashboard">
      <div className="dash-container" style={{ padding: '18px 18px 40px', maxWidth: 1400, margin: '0 auto', overflowY: 'auto', height: '100vh', color: '#e9e9e9', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Topbar */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, padding: '10px 0 12px', background: 'linear-gradient(to bottom,rgba(0,0,0,.88),rgba(0,0,0,.68),transparent)', backdropFilter: 'blur(14px)', marginBottom: 16 } as React.CSSProperties}>
          <div className="dash-topbar-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 className="page-title" style={{ margin: 0, fontFamily: '"Julius Sans One", sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 16 }}>
                {isBarber ? `Hey, ${myBarberName.split(' ')[0]}` : 'Dashboard'}
              </h2>
              <p style={{ margin: '5px 0 0', color: 'rgba(255,255,255,.45)', fontSize: 12, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {fmtDateLong()} · ELEMENT BARBERSHOP
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="dash-search"
                style={{ height: 40, width: 'min(200px,38vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />
              <button onClick={loadAll} style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>↻</button>
            </div>
          </div>
        </div>

        {/* Clock In/Out card */}
        <style>{`
          @keyframes clockPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(143,240,177,0); }
            50% { box-shadow: 0 0 16px 4px rgba(143,240,177,.35); }
          }
          @keyframes clockDot {
            0%, 100% { opacity: .4; }
            50% { opacity: 1; }
          }
          @media (max-width: 768px) {
            .dash-topbar-row { flex-direction: column !important; align-items: stretch !important; gap: 8px !important; }
            .dash-search { width: 100% !important; }
            .dash-kpi-grid { grid-template-columns: 1fr !important; }
            .dash-quick-grid { grid-template-columns: 1fr !important; }
            .dash-review-form-grid { grid-template-columns: 1fr !important; }
            .dash-container { padding: 12px 10px 40px !important; }
          }
        `}</style>
        <div style={{ borderRadius: 18, border: `1px solid ${clockedIn ? 'rgba(143,240,177,.25)' : 'rgba(255,255,255,.10)'}`, background: clockedIn ? 'linear-gradient(180deg,rgba(143,240,177,.06),rgba(143,240,177,.01))' : 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', boxShadow: '0 10px 40px rgba(0,0,0,.35)', padding: '14px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {/* Status icon */}
          <div style={{ width: 44, height: 44, borderRadius: 14, background: clockedIn ? 'rgba(143,240,177,.12)' : 'rgba(255,255,255,.06)', border: `1px solid ${clockedIn ? 'rgba(143,240,177,.30)' : 'rgba(255,255,255,.12)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={clockedIn ? '#8ff0b1' : 'rgba(255,255,255,.45)'} strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          {/* Text */}
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {clockedIn && <span style={{ width: 8, height: 8, borderRadius: 999, background: '#8ff0b1', display: 'inline-block', animation: 'clockDot 2s ease-in-out infinite' }} />}
              <span style={{ fontWeight: 800, fontSize: 14, color: clockedIn ? '#c9ffe1' : 'rgba(255,255,255,.70)' }}>
                {clockedIn ? `Clocked in since ${clockInSince}` : 'Not clocked in'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 2 }}>
              Today: {fmtMins(todayMinutes)}
            </div>
            {clockError && <div style={{ fontSize: 11, color: '#ff6b6b', marginTop: 4 }}>{clockError}</div>}
          </div>
          {/* Button */}
          <button onClick={handleClockAction} disabled={clockLoading}
            style={{
              height: 44, padding: '0 22px', borderRadius: 999, cursor: clockLoading ? 'wait' : 'pointer',
              fontWeight: 900, fontSize: 13, fontFamily: 'inherit', letterSpacing: '.04em', textTransform: 'uppercase',
              border: `1px solid ${clockedIn ? 'rgba(255,107,107,.45)' : 'rgba(143,240,177,.45)'}`,
              background: clockedIn ? 'rgba(255,107,107,.12)' : 'rgba(143,240,177,.12)',
              color: clockedIn ? '#ffd0d0' : '#c9ffe1',
              opacity: clockLoading ? .5 : 1,
              animation: !clockLoading && !clockedIn ? 'clockPulse 2.6s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}>
            {clockLoading ? 'Locating…' : clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
        </div>

        {/* Staff on clock — admin/owner only */}
        {isOwnerOrAdmin && staffOnClock.length > 0 && (
          <div style={{ borderRadius: 18, border: '1px solid rgba(143,240,177,.15)', background: 'linear-gradient(180deg,rgba(143,240,177,.04),rgba(143,240,177,.01))', boxShadow: '0 10px 40px rgba(0,0,0,.35)', padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 10, fontWeight: 900 }}>Staff on clock</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staffOnClock.map((s: any) => {
                const since = s.clock_in ? new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
                const elapsed = s.clock_in ? Math.round((Date.now() - new Date(s.clock_in).getTime()) / 60000) : 0
                return (
                  <div key={s.id || s.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: '#8ff0b1', animation: 'clockDot 2s ease-in-out infinite', flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#e9e9e9', flex: 1 }}>{s.user_name || 'Staff'}</span>
                    <span style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.50)' }}>{s.role}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>since {since}</span>
                    <span style={{ fontSize: 12, color: '#8ff0b1', fontWeight: 700 }}>{fmtMins(elapsed)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Attendance history — admin/owner */}
        {isOwnerOrAdmin && (
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => { setAttOpen(o => !o); if (!attOpen) loadAttHistory() }}
              style={{ height: 36, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {attOpen ? 'Hide' : 'Show'} Attendance History
            </button>
            {attOpen && (
              <div style={{ marginTop: 10, borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                  <input type="date" value={attFrom} onChange={e => setAttFrom(e.target.value)} style={{ height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 12, colorScheme: 'dark' as any }} />
                  <span style={{ color: 'rgba(255,255,255,.35)', fontSize: 12 }}>to</span>
                  <input type="date" value={attTo} onChange={e => setAttTo(e.target.value)} style={{ height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 12, colorScheme: 'dark' as any }} />
                  <button onClick={loadAttHistory} disabled={attLoading} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(10,132,255,.45)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', opacity: attLoading ? .5 : 1 }}>
                    {attLoading ? 'Loading…' : 'Load'}
                  </button>
                </div>
                {/* Summary */}
                {attSummary && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(0,0,0,.14)', border: '1px solid rgba(255,255,255,.08)' }}>
                    <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 8, fontWeight: 900 }}>Summary · {attSummary.total_hours || 0}h total</div>
                    {Object.entries(attSummary.by_user || {}).map(([uid, u]: any) => (
                      <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: '#e9e9e9', flex: 1 }}>{u.name}</span>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.50)' }}>{u.role}</span>
                        <span style={{ fontSize: 12, color: '#8ff0b1', fontWeight: 700 }}>{fmtMins(u.total_minutes)}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{u.shifts} shift{u.shifts !== 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Records */}
                <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                  {attHistory.length === 0 && !attLoading && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', padding: 8 }}>No records found.</div>}
                  {attHistory.map((r: any) => {
                    const inTime = r.clock_in ? new Date(r.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'
                    const outTime = r.clock_out ? new Date(r.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Still in'
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 12 }}>
                        <span style={{ fontWeight: 700, color: '#e9e9e9', flex: 1, minWidth: 80 }}>{r.user_name}</span>
                        <span style={{ color: 'rgba(255,255,255,.40)', minWidth: 75 }}>{r.date}</span>
                        <span style={{ color: 'rgba(255,255,255,.55)' }}>{inTime}</span>
                        <span style={{ color: 'rgba(255,255,255,.30)' }}>→</span>
                        <span style={{ color: r.clock_out ? 'rgba(255,255,255,.55)' : '#8ff0b1' }}>{outTime}</span>
                        <span style={{ color: '#8ff0b1', fontWeight: 700, minWidth: 50, textAlign: 'right' as const }}>{r.duration_minutes ? fmtMins(r.duration_minutes) : '—'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* KPIs — barber sees their own earnings, owner sees totals */}
        <div className="dash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 14 }}>
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

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Quick actions */}
            <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Quick actions</div>
              <div className="dash-quick-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                    const icons = {
                      auto:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.08-7.5"/></svg>,
                      open:   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
                      closed: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
                    }
                    const labels = { auto: 'Auto', open: 'Force Open', closed: 'Force Closed' }
                    const colors = {
                      auto:   shopStatus==='auto'   ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.08)',
                      open:   shopStatus==='open'   ? 'rgba(143,240,177,.35)' : 'rgba(255,255,255,.08)',
                      closed: shopStatus==='closed' ? 'rgba(255,107,107,.35)' : 'rgba(255,255,255,.08)',
                    }
                    return (
                      <button key={mode} onClick={() => saveShopStatus(mode)} disabled={statusSaving}
                        style={{ height: 38, padding: '0 14px', borderRadius: 999, border: `1px solid ${colors[mode]}`, background: shopStatus===mode ? colors[mode] : 'rgba(255,255,255,.03)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: shopStatus===mode ? 900 : 400, fontFamily: 'inherit', transition: 'all .18s' }}>
                        <span style={{ display:'flex', alignItems:'center', gap:5 }}>{icons[mode]}{labels[mode]}</span>
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

              {/* Barbers — days + ratings */}
              <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', padding: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Barbers</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', textTransform: 'none', letterSpacing: 0 }}>Tap days: green — works, red — day off</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {barbers.map((b: any) => {
                    const sched = b.schedule
                    const workDays: number[] = Array.isArray(sched?.days) ? sched.days : [1,2,3,4,5,6]
                    return (
                      <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.07)', background: 'rgba(0,0,0,.12)' }}>
                        {b.photo_url
                          ? <img src={b.photo_url} alt={b.name} style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
                          : <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{(b.name||'?')[0]}</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{b.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {DAY_NAMES_SHORT.map((day, i) => {
                              const works = workDays.includes(i)
                              return (
                                <span key={day} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 999, border: `1px solid ${works ? 'rgba(143,240,177,.40)' : 'rgba(255,107,107,.28)'}`, background: works ? 'rgba(143,240,177,.10)' : 'rgba(255,107,107,.07)', color: works ? '#8ff0b1' : '#ffd0d0', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>
                                  {day}
                                </span>
                              )
                            })}
                          </div>
                          {(() => {
                            const fmt = (m: number) => `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`
                            const sm = sched?.startMin ?? 600
                            const em = sched?.endMin ?? 1200
                            return (
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>{fmt(sm)} — {fmt(em)}</span>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    )
                  })}
                  {barbers.length === 0 && <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>Loading…</div>}
                </div>
              </div>

            </div>
          )}

          {/* ─── Reviews ─── */}
          {isOwnerOrAdmin && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', fontWeight: 900 }}>
                  Reviews ({reviews.length})
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setAddingReview(!addingReview)}
                    style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,207,63,.45)', background: 'rgba(255,207,63,.08)', color: '#ffe9a3', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                    {addingReview ? 'Cancel' : '+ Add review'}
                  </button>
                </div>
              </div>

              {/* Add review form */}
              {addingReview && (
                <div style={{ padding: 14, borderRadius: 16, border: '1px solid rgba(255,207,63,.20)', background: 'rgba(255,207,63,.04)', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="dash-review-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>Barber</div>
                      <select value={rvBarber} onChange={e => setRvBarber(e.target.value)}
                        style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}>
                        <option value="">Select barber</option>
                        {barbers.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>Client name</div>
                      <input value={rvName} onChange={e => setRvName(e.target.value)} placeholder="Client name"
                        style={{ width: '100%', height: 40, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>Rating</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={() => setRvRating(n)} type="button"
                          style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${n <= rvRating ? 'rgba(255,207,63,.55)' : 'rgba(255,255,255,.10)'}`, background: n <= rvRating ? 'rgba(255,207,63,.14)' : 'rgba(255,255,255,.04)', color: n <= rvRating ? '#ffe9a3' : 'rgba(255,255,255,.30)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>Review text</div>
                    <textarea value={rvText} onChange={e => setRvText(e.target.value)} placeholder="Great experience…" rows={3}
                      style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical' as const }} />
                  </div>
                  <button onClick={async () => {
                    if (!rvBarber || !rvName.trim()) return
                    setRvSaving(true)
                    try {
                      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
                      const barber = barbers.find((b: any) => b.id === rvBarber)
                      await fetch(`${API}/api/reviews`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }, body: JSON.stringify({ barber_id: rvBarber, barber_name: barber?.name || '', name: rvName.trim(), rating: rvRating, text: rvText.trim(), source: 'crm', status: 'approved' }) })
                      setRvName(''); setRvText(''); setRvRating(5); setAddingReview(false); loadAll()
                    } catch {}
                    setRvSaving(false)
                  }} disabled={rvSaving || !rvBarber || !rvName.trim()}
                    style={{ height: 40, borderRadius: 10, border: '1px solid rgba(255,207,63,.55)', background: 'rgba(255,207,63,.12)', color: '#ffe9a3', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: rvSaving ? .5 : 1 }}>
                    {rvSaving ? 'Saving…' : 'Add review'}
                  </button>
                </div>
              )}

              {/* Filter */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <button onClick={() => setReviewFilter('')}
                  style={{ height: 28, padding: '0 10px', borderRadius: 999, border: `1px solid ${!reviewFilter ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)'}`, background: !reviewFilter ? 'rgba(255,255,255,.06)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  All ({reviews.length})
                </button>
                {barbers.map((b: any) => {
                  const cnt = reviews.filter(r => r.barber_id === b.id).length
                  return (
                    <button key={b.id} onClick={() => setReviewFilter(b.id)}
                      style={{ height: 28, padding: '0 10px', borderRadius: 999, border: `1px solid ${reviewFilter === b.id ? 'rgba(10,132,255,.45)' : 'rgba(255,255,255,.08)'}`, background: reviewFilter === b.id ? 'rgba(10,132,255,.10)' : 'transparent', color: reviewFilter === b.id ? '#d7ecff' : 'rgba(255,255,255,.55)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                      {b.name} ({cnt})
                    </button>
                  )
                })}
              </div>

              {/* Pending reviews first */}
              {(() => {
                const pending = reviews.filter(r => r.status === 'pending')
                if (!pending.length) return null
                return (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,207,63,.70)', marginBottom: 8, fontWeight: 700 }}>Pending approval ({pending.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {pending.map((r: any) => (
                        <div key={r.id} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,207,63,.25)', background: 'rgba(255,207,63,.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ color: '#ffcf3f', fontSize: 13 }}>{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                              <span style={{ fontWeight: 700, fontSize: 13 }}>{r.name || 'Anonymous'}</span>
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, border: '1px solid rgba(255,207,63,.35)', background: 'rgba(255,207,63,.10)', color: '#ffe9a3', letterSpacing: '.06em', textTransform: 'uppercase' }}>PENDING</span>
                            </div>
                            {r.barber_name && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.06)', color: 'rgba(10,132,255,.80)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{r.barber_name}</span>}
                          </div>
                          {r.text && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 2, lineHeight: 1.4 }}>{String(r.text).slice(0, 300)}{String(r.text).length > 300 ? '…' : ''}</div>}
                          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                            <button onClick={async () => {
                              const token = localStorage.getItem('ELEMENT_TOKEN') || ''
                              await fetch(`${API}/api/reviews/${encodeURIComponent(r.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }, body: JSON.stringify({ status: 'approved' }) })
                              loadAll()
                            }} style={{ height: 28, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(143,240,177,.45)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                              Approve
                            </button>
                            <button onClick={async () => {
                              const token = localStorage.getItem('ELEMENT_TOKEN') || ''
                              await fetch(`${API}/api/reviews/${encodeURIComponent(r.id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }, body: JSON.stringify({ status: 'rejected' }) })
                              loadAll()
                            }} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                              Reject
                            </button>
                            <button onClick={async () => {
                              const token = localStorage.getItem('ELEMENT_TOKEN') || ''
                              await fetch(`${API}/api/reviews/${encodeURIComponent(r.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY } })
                              loadAll()
                            }} style={{ height: 28, padding: '0 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'transparent', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Reviews list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
                {(reviewFilter ? reviews.filter(r => r.barber_id === reviewFilter) : reviews).filter(r => r.status !== 'pending').slice(0, 50).map((r: any) => (
                  <div key={r.id} style={{ padding: '10px 12px', borderRadius: 14, border: `1px solid ${r.status === 'rejected' ? 'rgba(255,107,107,.15)' : 'rgba(255,255,255,.06)'}`, background: r.status === 'rejected' ? 'rgba(255,107,107,.03)' : 'rgba(255,255,255,.02)', opacity: r.status === 'rejected' ? 0.5 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#ffcf3f', fontSize: 13 }}>{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{r.name || 'Anonymous'}</span>
                        {r.status === 'rejected' && <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 999, border: '1px solid rgba(255,107,107,.30)', color: '#ffd0d0', letterSpacing: '.06em', textTransform: 'uppercase' }}>REJECTED</span>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {r.barber_name && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.06)', color: 'rgba(10,132,255,.80)', letterSpacing: '.06em', textTransform: 'uppercase' }}>{r.barber_name}</span>}
                        {r.source === 'google' && <span style={{ fontSize: 9, color: 'rgba(255,255,255,.25)' }}>Google</span>}
                      </div>
                    </div>
                    {r.text && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 4, lineHeight: 1.4 }}>{String(r.text).slice(0, 200)}{String(r.text).length > 200 ? '…' : ''}</div>}
                  </div>
                ))}
                {reviews.length === 0 && <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 12, textAlign: 'center', padding: 20 }}>No reviews yet</div>}
              </div>
            </div>
          )}

      {/* Phone access log — owner only */}
      {role === 'owner' && phoneAccessLog.length > 0 && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(168,107,255,.20)', background: 'linear-gradient(180deg,rgba(168,107,255,.06),rgba(168,107,255,.01))', boxShadow: '0 10px 40px rgba(0,0,0,.35)', padding: 16, marginTop: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#d4b8ff', marginBottom: 10, fontWeight: 900 }}>
            Phone access log
          </div>
          <div style={{ maxHeight: 260, overflowY: 'auto' }}>
            {phoneAccessLog.map((l: any) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,.06)', fontSize: 12 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: l.result === 'granted' ? '#8ff0b1' : '#ff6b6b', flexShrink: 0 }} />
                <span style={{ fontWeight: 700, color: '#e9e9e9', minWidth: 70 }}>{l.admin_name}</span>
                <span style={{ color: 'rgba(255,255,255,.55)', flex: 1 }}>→ {l.client_name || l.client_id?.slice(0,8)}</span>
                <span style={{ color: 'rgba(255,255,255,.30)', fontSize: 10 }}>{l.reason || ''}</span>
                <span style={{ color: 'rgba(255,255,255,.30)', fontSize: 10, minWidth: 60, textAlign: 'right' as const }}>
                  {l.timestamp ? new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </Shell>
  )
}
