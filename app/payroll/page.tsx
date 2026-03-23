'use client'
import Shell from '@/components/Shell'
import { useEffect, useState, useCallback, useRef } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tier { type: 'revenue' | 'clients'; threshold: number; pct: number }
interface Rule { base_pct: number; tips_pct: number; tiers: Tier[]; hourly_rate?: number; owner_profit_pct?: number; service_fee_pct?: number; service_fee_days?: number[] }
interface Booking { id: string; date: string; client: string; service: string; service_amount: number; tip: number; status: string; paid: boolean }
interface BarberPayroll {
  barber_id: string; barber_name: string; barber_photo: string; barber_level: string
  bookings_count: number; client_count: number; service_total: number; tips_total: number
  effective_pct: number; base_pct: number
  barber_service_share: number; owner_service_share: number
  barber_tips: number; barber_total: number
  rule: Rule; bookings: Booking[]
}
interface Totals { service_total: number; tips_total: number; barber_service_share: number; owner_service_share: number; barber_total: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}` }
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate()-n); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}` }
const fmtDate = (iso: string) => { try { const d = new Date(iso+'T00:00:00'); return d.toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' }) } catch { return iso } }
const fmtMoney = (n: number) => '$' + (Math.round((n||0)*100)/100).toFixed(2)
const initials = (name: string) => { const p = (name||'').split(' '); return (p[0]?.[0]||'')+(p[1]?.[0]||'') }

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, { credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── DatePicker ───────────────────────────────────────────────────────────────
function DatePicker({ from, to, onChange, onClose }: {
  from: string; to: string; onChange: (f: string, t: string) => void; onClose: () => void
}) {
  const [step, setStep] = useState<'from'|'to'>('from')
  const [selFrom, setSelFrom] = useState(from)
  const [selTo, setSelTo] = useState(to)
  const [month, setMonth] = useState(() => { const d = new Date(from+'T00:00:00'); d.setDate(1); return d })

  const todayStr = today()
  const offset = (month.getDay() + 6) % 7
  const start = new Date(month); start.setDate(1 - offset)
  const days: string[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    days.push(`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`)
  }
  const monthKey = `${month.getFullYear()}-${pad2(month.getMonth()+1)}`

  function pickDay(iso: string) {
    if (step === 'from') { setSelFrom(iso); setSelTo(iso); setStep('to') }
    else {
      const f = iso < selFrom ? iso : selFrom
      const t = iso < selFrom ? selFrom : iso
      setSelFrom(f); setSelTo(t); onChange(f, t); onClose()
    }
  }

  const presets = [
    { label: 'Today', f: today(), t: today() },
    { label: 'This week', f: daysAgo(new Date().getDay() || 7), t: today() },
    { label: 'Last 7 days', f: daysAgo(7), t: today() },
    { label: 'Last 14 days', f: daysAgo(14), t: today() },
    { label: 'Last 30 days', f: daysAgo(30), t: today() },
    { label: 'This month', f: `${new Date().getFullYear()}-${pad2(new Date().getMonth()+1)}-01`, t: today() },
  ]

  const s: React.CSSProperties = { fontFamily: 'Inter,sans-serif', color: '#e9e9e9' }
  const btnBase: React.CSSProperties = { height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ ...s, width: 'min(560px,96vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(20,20,30,.90),rgba(10,10,20,.88))', backdropFilter: 'blur(24px)', padding: 18, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>Date range</div>
          <button onClick={onClose} style={{ ...btnBase, padding: '0 14px' }}>Close</button>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {presets.map(p => (
            <button key={p.label} onClick={() => { onChange(p.f, p.t); onClose() }}
              style={{ ...btnBase, padding: '0 12px', fontSize: 11, letterSpacing: '.06em', background: selFrom === p.f && selTo === p.t ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.04)', borderColor: selFrom === p.f && selTo === p.t ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)' }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()-1); setMonth(m) }} style={{ ...btnBase, width: 36, padding: 0 }}>←</button>
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()+1); setMonth(m) }} style={{ ...btnBase, width: 36, padding: 0 }}>→</button>
          </div>
          <div style={{ fontWeight: 900 }}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
          <div style={{ fontSize: 12, color: step === 'from' ? '#0a84ff' : '#8ff0b1', fontWeight: 700, letterSpacing: '.06em' }}>
            {step === 'from' ? 'Pick start →' : '← Pick end'}
          </div>
        </div>

        {/* Days header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 4 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {days.map(iso => {
            const inMonth = iso.startsWith(monthKey)
            const isToday = iso === todayStr
            const isFrom = iso === selFrom
            const isTo = iso === selTo
            const inRange = iso > selFrom && iso < selTo
            return (
              <button key={iso} onClick={() => pickDay(iso)}
                style={{ height: 40, borderRadius: 10, border: `1px solid ${isFrom ? 'rgba(10,132,255,.75)' : isTo ? 'rgba(143,240,177,.65)' : isToday ? 'rgba(255,207,63,.50)' : 'rgba(255,255,255,.08)'}`, background: isFrom ? 'rgba(10,132,255,.20)' : isTo ? 'rgba(143,240,177,.15)' : inRange ? 'rgba(10,132,255,.08)' : 'rgba(0,0,0,.18)', color: isTo ? '#c9ffe1' : '#fff', cursor: 'pointer', opacity: inMonth ? 1 : 0.3, fontWeight: isFrom || isTo ? 900 : 500, fontSize: 13, fontFamily: 'inherit' }}>
                {parseInt(iso.slice(8))}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Click start date, then end date</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#d7ecff' }}>{selFrom && selTo ? fmtDate(selFrom) + ' → ' + fmtDate(selTo) : '—'}</div>
        </div>
      </div>
    </div>
  )
}

// ─── CommissionEditor ─────────────────────────────────────────────────────────
function CommissionEditor({ barber, rule, onSaved }: { barber: BarberPayroll; rule: Rule; onSaved: (r: Rule) => void }) {
  const [open, setOpen] = useState(false)
  const [basePct, setBasePct] = useState(rule.base_pct)
  const [tipsPct, setTipsPct] = useState(rule.tips_pct)
  const [tiers, setTiers] = useState<Tier[]>(rule.tiers || [])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const inp: React.CSSProperties = { height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13, fontFamily: 'inherit', width: '100%' }

  async function save() {
    setSaving(true)
    try {
      await apiFetch(`/api/payroll/rules/${encodeURIComponent(barber.barber_id)}`, {
        method: 'POST', body: JSON.stringify({ base_pct: basePct, tips_pct: tipsPct, tiers: tiers.filter(t => t.threshold > 0) })
      })
      onSaved({ base_pct: basePct, tips_pct: tipsPct, tiers })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e: any) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${open ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.08)'}`, overflow: 'hidden', background: open ? 'rgba(10,132,255,.04)' : 'rgba(0,0,0,.12)' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {barber.barber_photo
            ? <img src={barber.barber_photo} alt={barber.barber_name} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)' }} onError={e => (e.currentTarget.style.display='none')} />
            : <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>{initials(barber.barber_name)}</div>
          }
          <div style={{ fontWeight: 900, fontSize: 13 }}>{barber.barber_name}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{rule.base_pct}% base · {rule.tips_pct}% tips</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.40)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Base commission %</label>
              <input type="number" min={0} max={100} value={basePct} onChange={e => setBasePct(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Tips % (100 = barber keeps all)</label>
              <input type="number" min={0} max={100} value={tipsPct} onChange={e => setTipsPct(Number(e.target.value))} style={inp} />
            </div>
          </div>

          {/* Tiers */}
          <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 8 }}>Bonus tiers</div>
          {tiers.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 6 }}>
              {['Type','Threshold','Rate %',''].map(h => <div key={h} style={{ fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.30)' }}>{h}</div>)}
            </div>
          )}
          {tiers.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 6, marginBottom: 6 }}>
              <select value={t.type} onChange={e => { const n=[...tiers]; n[i]={...n[i],type:e.target.value as 'revenue'|'clients'}; setTiers(n) }} style={{ ...inp, height: 34, fontSize: 12 }}>
                <option value="revenue">Revenue ≥</option>
                <option value="clients">Clients ≥</option>
              </select>
              <input type="number" min={0} value={t.threshold} onChange={e => { const n=[...tiers]; n[i]={...n[i],threshold:Number(e.target.value)}; setTiers(n) }} style={{ ...inp, height: 34, fontSize: 12 }} placeholder="Threshold" />
              <input type="number" min={0} max={100} value={t.pct} onChange={e => { const n=[...tiers]; n[i]={...n[i],pct:Number(e.target.value)}; setTiers(n) }} style={{ ...inp, height: 34, fontSize: 12 }} placeholder="%" />
              <button onClick={() => setTiers(tiers.filter((_,j) => j!==i))} style={{ height: 34, width: 34, borderRadius: 10, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ff6b6b', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ))}
          <button onClick={() => setTiers([...tiers, { type: 'revenue', threshold: 0, pct: 65 }])}
            style={{ height: 32, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.65)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', marginBottom: 12 }}>
            + Add tier
          </button>

          <button onClick={save} disabled={saving}
            style={{ width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(10,132,255,.55)', background: saved ? 'rgba(143,240,177,.12)' : 'rgba(10,132,255,.14)', color: saved ? '#c9ffe1' : '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', borderColor: saved ? 'rgba(143,240,177,.45)' : 'rgba(10,132,255,.55)' }}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save rules'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── AdminPayrollEditor ───────────────────────────────────────────────────────
const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
function AdminPayrollEditor({ userId, userName, rule, onSaved }: { userId: string; userName: string; rule: Rule; onSaved: (r: Rule) => void }) {
  const [open, setOpen] = useState(false)
  const [hourly, setHourly] = useState(rule.hourly_rate ?? 0)
  const [ownerPct, setOwnerPct] = useState(rule.owner_profit_pct ?? 2)
  const [feePct, setFeePct] = useState(rule.service_fee_pct ?? 3)
  const [feeDays, setFeeDays] = useState<number[]>(rule.service_fee_days ?? [0,1,2,3,4,5,6])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const inp: React.CSSProperties = { height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13, fontFamily: 'inherit', width: '100%' }

  async function save() {
    setSaving(true)
    try {
      await apiFetch(`/api/payroll/rules/${encodeURIComponent(userId)}`, {
        method: 'POST', body: JSON.stringify({ ...rule, hourly_rate: hourly, owner_profit_pct: ownerPct, service_fee_pct: feePct, service_fee_days: feeDays })
      })
      onSaved({ ...rule, hourly_rate: hourly, owner_profit_pct: ownerPct, service_fee_pct: feePct, service_fee_days: feeDays })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e: any) { alert('Error: ' + e.message) }
    setSaving(false)
  }

  function toggleDay(d: number) { setFeeDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort()) }

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${open ? 'rgba(143,240,177,.25)' : 'rgba(255,255,255,.08)'}`, overflow: 'hidden', background: open ? 'rgba(143,240,177,.04)' : 'rgba(0,0,0,.12)' }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(143,240,177,.12)', border: '1px solid rgba(143,240,177,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: '#c9ffe1' }}>{initials(userName)}</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 13 }}>{userName}</div>
            <div style={{ fontSize: 10, color: '#c9ffe1' }}>ADMIN</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>${hourly}/hr · {ownerPct}% profit · {feePct}% fee</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,.40)' }}>{open ? '▴' : '▾'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Hourly rate ($)</label>
              <input type="number" min={0} step={0.5} value={hourly} onChange={e => setHourly(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Owner profit %</label>
              <input type="number" min={0} max={100} step={0.5} value={ownerPct} onChange={e => setOwnerPct(Number(e.target.value))} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Service fee %</label>
              <input type="number" min={0} max={100} step={0.5} value={feePct} onChange={e => setFeePct(Number(e.target.value))} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 6 }}>Service fee applies on days</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAY_LABELS.map((d, i) => (
                <button key={i} onClick={() => toggleDay(i)}
                  style={{ height: 30, width: 40, borderRadius: 8, border: `1px solid ${feeDays.includes(i) ? 'rgba(143,240,177,.45)' : 'rgba(255,255,255,.10)'}`, background: feeDays.includes(i) ? 'rgba(143,240,177,.12)' : 'rgba(255,255,255,.03)', color: feeDays.includes(i) ? '#c9ffe1' : 'rgba(255,255,255,.40)', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 12, lineHeight: 1.5 }}>
            <strong style={{ color: 'rgba(255,255,255,.55)' }}>Formula:</strong> Base = hourly × attendance hours · Profit = owner share × {ownerPct}% · Fee = service fees × {feePct}% (only on selected days)
          </div>
          <button onClick={save} disabled={saving}
            style={{ width: '100%', height: 40, borderRadius: 12, border: `1px solid ${saved ? 'rgba(143,240,177,.45)' : 'rgba(143,240,177,.40)'}`, background: saved ? 'rgba(143,240,177,.18)' : 'rgba(143,240,177,.10)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save admin rules'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const [from, setFrom] = useState(daysAgo(14))
  const [to, setTo] = useState(today())
  const [barbers, setBarbers] = useState<BarberPayroll[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [rules, setRules] = useState<Record<string, Rule>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filterBarber, setFilterBarber] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary'|'rules'>('summary')
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [adminAttendance, setAdminAttendance] = useState<Record<string, number>>({})
  const [adminWorkDays, setAdminWorkDays] = useState<Record<string, number[]>>({})

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [payData, rulesData, usersData, attData] = await Promise.all([
        apiFetch(`/api/payroll?from=${encodeURIComponent(from+'T00:00:00.000Z')}&to=${encodeURIComponent(to+'T23:59:59.999Z')}`),
        apiFetch('/api/payroll/rules').catch(() => ({ rules: {} })),
        apiFetch('/api/users').catch(() => ({ users: [] })),
        apiFetch(`/api/attendance?from=${from}&to=${to}`).catch(() => ({ attendance: [], summary: {} })),
      ])
      setBarbers(payData?.barbers || [])
      setTotals(payData?.totals || null)
      setRules(rulesData?.rules || {})
      // Admin users
      const allUsers = usersData?.users || []
      // Admin + owner users (anyone who could have hourly rate)
      const admins = allUsers.filter((u: any) => (u.role === 'admin' || u.role === 'owner') && u.active !== false)
      setAdminUsers(admins)
      // Attendance hours per user
      const attHours: Record<string, number> = {}
      const attRecords = attData?.attendance || []
      attRecords.forEach((r: any) => {
        if (r.duration_minutes) {
          attHours[r.user_id] = (attHours[r.user_id] || 0) + r.duration_minutes
        }
      })
      // For currently clocked in, add elapsed
      attRecords.forEach((r: any) => {
        if (!r.clock_out && r.clock_in) {
          const elapsed = Math.round((Date.now() - new Date(r.clock_in).getTime()) / 60000)
          attHours[r.user_id] = (attHours[r.user_id] || 0) + Math.max(0, elapsed)
        }
      })
      setAdminAttendance(attHours)
      // Also compute service fee days for admins
      // Store which days each user worked
      const attDaysSet: Record<string, Set<number>> = {}
      attRecords.forEach((r: any) => {
        if (r.clock_in) {
          const d = new Date(r.clock_in)
          if (!isNaN(d.getTime())) {
            if (!attDaysSet[r.user_id]) attDaysSet[r.user_id] = new Set()
            attDaysSet[r.user_id].add(d.getDay())
          }
        }
      })
      const attDaysArr: Record<string, number[]> = {}
      Object.entries(attDaysSet).forEach(([uid, s]) => { attDaysArr[uid] = [...s] })
      setAdminWorkDays(attDaysArr)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [from, to])

  useEffect(() => { load() }, [load])

  const visible = filterBarber ? barbers.filter(b => b.barber_id === filterBarber) : barbers

  function toggleExpand(id: string) {
    setExpanded(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  }

  function exportCSV() {
    const rows = [['Barber','Rate%','Services Gross','Barber Share','Owner Share','Tips','Total Payout','Clients','Bookings']]
    visible.forEach(b => rows.push([b.barber_name, String(b.effective_pct), b.service_total.toFixed(2), b.barber_service_share.toFixed(2), b.owner_service_share.toFixed(2), b.tips_total.toFixed(2), b.barber_total.toFixed(2), String(b.client_count), String(b.bookings_count)]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `payroll_${from}_${to}.csv`; a.click()
  }

  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }
  const card: React.CSSProperties = { borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', backdropFilter: 'blur(14px)', overflow: 'hidden' }

  function exportPDF() {
    const doc: string[] = []
    doc.push(`<html><head><meta charset="utf-8">`)
    doc.push(`<title>Payroll Report ${from} – ${to}</title>`)
    doc.push(`<style>
      body{font-family:Inter,Arial,sans-serif;background:#fff;color:#111;padding:32px;max-width:900px;margin:0 auto}
      h1{font-size:22px;letter-spacing:.1em;text-transform:uppercase;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:4px}
      .meta{font-size:12px;color:#666;margin-bottom:24px}
      .barber{margin-bottom:28px;border:1px solid #ddd;border-radius:8px;overflow:hidden}
      .barber-head{background:#f5f5f5;padding:12px 16px;display:flex;justify-content:space-between;align-items:center}
      .barber-name{font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
      .barber-total{font-size:18px;font-weight:900}
      table{width:100%;border-collapse:collapse;font-size:12px}
      th{background:#f9f9f9;padding:8px 12px;text-align:left;border-bottom:1px solid #eee;text-transform:uppercase;font-size:10px;letter-spacing:.08em;color:#666}
      td{padding:7px 12px;border-bottom:1px solid #f0f0f0}
      .totals{padding:12px 16px;background:#fafafa;display:flex;gap:24px;font-size:13px}
      .totals span{color:#666}
      .totals b{color:#111}
      @media print{body{padding:16px}.barber{break-inside:avoid}}
    </style></head><body>`)
    doc.push(`<h1>Element Barbershop — Payroll Report</h1>`)
    doc.push(`<div class="meta">Period: ${from} — ${to} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString()}</div>`)

    barbers.forEach(b => {
      doc.push(`<div class="barber">`)
      doc.push(`<div class="barber-head"><span class="barber-name">${b.barber_name}</span><span class="barber-total">${fmtMoney(b.barber_total)}</span></div>`)
      doc.push(`<table><thead><tr><th>Date</th><th>Client</th><th>Service</th><th>Amount</th><th>Tip</th></tr></thead><tbody>`)
      ;(b.bookings||[]).forEach((bk: any) => {
        doc.push(`<tr><td>${bk.date||''}</td><td>${bk.client||''}</td><td>${bk.service||''}</td><td>${fmtMoney(bk.service_amount||0)}</td><td>${fmtMoney(bk.tip||0)}</td></tr>`)
      })
      doc.push(`</tbody></table>`)
      doc.push(`<div class="totals"><span>Services: <b>${fmtMoney(b.service_total)}</b></span><span>Tips: <b>${fmtMoney(b.tips_total)}</b></span><span>Commission: <b>${b.effective_pct}%</b></span><span>Payout: <b>${fmtMoney(b.barber_total)}</b></span></div>`)
      doc.push(`</div>`)
    })
    doc.push(`</body></html>`)

    const blob = new Blob([doc.join('\n')], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    if (win) { win.onload = () => { win.print(); URL.revokeObjectURL(url) } }
    else { const a = document.createElement('a'); a.href = url; a.download = `payroll-${from}-${to}.html`; a.click(); URL.revokeObjectURL(url) }
  }

  return (
    <Shell page="payroll">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
        select option{background:#111}
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif', overflowY: 'auto' }}>

        {/* Topbar */}
        <div style={{ padding: '14px 20px 12px', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 className="page-title" style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Payroll</h2>
              <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>
                Commission + tips · {barbers.length} barbers · {barbers.reduce((s,b)=>s+b.bookings_count,0)} bookings
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Date range */}
              <button onClick={() => setShowDatePicker(true)}
                style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit', minWidth: 200 }}>
                {fmtDate(from)} → {fmtDate(to)}
              </button>
              {/* Barber filter */}
              <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}
                style={{ height: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }}>
                <option value="">All barbers</option>
                {barbers.map(b => <option key={b.barber_id} value={b.barber_id}>{b.barber_name}</option>)}
              </select>
              <button onClick={load} disabled={loading}
                style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: loading ? .5 : 1 }}>↻</button>
              <button onClick={exportCSV}
                style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: '18px 20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

          {/* Left — table */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.12)' }}>
              <div style={{ ...lbl }}>Barbers payout summary</div>
              <div style={{ ...lbl, border: '1px solid rgba(255,255,255,.12)', padding: '4px 10px', borderRadius: 999 }}>{visible.length} barbers</div>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.40)', fontSize: 13 }}>
                <div style={{ display: 'inline-block', width: 20, height: 20, border: '2px solid rgba(255,255,255,.18)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin .8s linear infinite', marginRight: 8, verticalAlign: 'middle' }} />
                Loading…
              </div>
            ) : error ? (
              <div style={{ padding: 24, color: '#ff6b6b', fontSize: 13 }}>Error: {error}</div>
            ) : visible.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.40)', fontSize: 13, letterSpacing: '.08em' }}>No data for selected period</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Barber','Rate','Services','Barber share','Owner share','Tips','Total payout',''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.08)', textAlign: 'left', ...lbl, background: 'rgba(0,0,0,.10)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(b => {
                      const isBoosted = b.effective_pct !== b.base_pct
                      const isOpen = expanded.has(b.barber_id)
                      return <>
                        <tr key={b.barber_id} style={{ background: isOpen ? 'rgba(10,132,255,.04)' : 'transparent' }}
                          onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,.025)')}
                          onMouseLeave={e => (e.currentTarget.style.background=isOpen?'rgba(10,132,255,.04)':'transparent')}>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {b.barber_photo
                                ? <img src={b.barber_photo} alt={b.barber_name} style={{ width: 36, height: 36, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
                                : <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, flexShrink: 0 }}>{initials(b.barber_name)}</div>
                              }
                              <div>
                                <div style={{ fontWeight: 900, fontSize: 13 }}>{b.barber_name}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{b.client_count} clients · {b.bookings_count} bookings</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', whiteSpace: 'nowrap' }}>
                            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 999, border: isBoosted ? '1px solid rgba(143,240,177,.45)' : '1px solid rgba(10,132,255,.40)', background: isBoosted ? 'rgba(143,240,177,.10)' : 'rgba(10,132,255,.10)', color: isBoosted ? '#c9ffe1' : '#d7ecff' }}>
                              {b.effective_pct}%{isBoosted ? ' ↑' : ''}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 700 }}>{fmtMoney(b.service_total)}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', color: '#d7ecff' }}>{fmtMoney(b.barber_service_share)}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.45)' }}>{fmtMoney(b.owner_service_share)}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', color: '#8ff0b1' }}>{fmtMoney(b.tips_total)}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', fontWeight: 900, fontSize: 14 }}>{fmtMoney(b.barber_total)}</td>
                          <td style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                            <button onClick={() => toggleExpand(b.barber_id)}
                              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '2px 6px', borderRadius: 8 }}>
                              {isOpen ? '▴' : '▾'}
                            </button>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr key={b.barber_id+'_exp'}>
                            <td colSpan={8} style={{ padding: 0, borderBottom: '1px solid rgba(255,255,255,.06)', background: 'rgba(0,0,0,.18)' }}>
                              <div style={{ padding: '10px 14px 14px' }}>
                                {b.bookings.length === 0 ? (
                                  <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, padding: '8px 0' }}>No bookings</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                                    {b.bookings.map(bk => (
                                      <div key={bk.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.18)', fontSize: 13, gap: 10 }}>
                                        <div>
                                          <div style={{ fontWeight: 700 }}>{bk.client || '—'}</div>
                                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                                            {bk.date} · {bk.service} · {bk.status}{bk.paid ? ' · Paid' : ''}
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                          <div style={{ fontWeight: 700 }}>{fmtMoney(bk.service_amount)}</div>
                                          {bk.tip > 0 && <div style={{ fontSize: 12, color: '#8ff0b1' }}>+{fmtMoney(bk.tip)} tip</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, padding: '12px 14px 0' }}>
                {(['summary','rules'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    style={{ height: 34, padding: '0 14px', borderRadius: 999, border: `1px solid ${activeTab===tab ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)'}`, background: activeTab===tab ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.04)', color: activeTab===tab ? '#d7ecff' : 'rgba(255,255,255,.70)', cursor: 'pointer', fontWeight: 900, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'inherit' }}>
                    {tab === 'summary' ? 'Summary' : 'Commission rules'}
                  </button>
                ))}
              </div>

              {activeTab === 'summary' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 14px' }}>
                    {[
                      { label: 'Services gross', value: fmtMoney(totals?.service_total||0), wide: true },
                      { label: 'Barbers total', value: fmtMoney(totals?.barber_service_share||0) },
                      { label: 'Owner share', value: fmtMoney(totals?.owner_service_share||0) },
                      { label: 'Tips', value: fmtMoney(totals?.tips_total||0) },
                      { label: 'Barbers total payout', value: fmtMoney(totals?.barber_total||0), wide: true, big: true },
                    ].map(k => (
                      <div key={k.label} style={{ padding: '12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)', gridColumn: k.wide ? '1/-1' : undefined }}>
                        <div style={{ ...lbl, marginBottom: 4 }}>{k.label}</div>
                        <div style={{ fontWeight: 900, fontSize: k.big ? 22 : 16, letterSpacing: '.02em' }}>{k.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '0 14px 14px', fontSize: 12, color: 'rgba(255,255,255,.40)', lineHeight: 1.7 }}>
                    <strong style={{ color: 'rgba(255,255,255,.65)' }}>Formula</strong><br/>
                    Barber payout = services × rate% + tips × tips%<br/>
                    Owner share = services × (100 − rate%)<br/>
                    Tiers override base % when threshold reached
                  </div>

                  {/* Admin payroll summary */}
                  {adminUsers.length > 0 && (() => {
                    const ownerShare = totals?.owner_service_share || 0
                    // Calculate total service fees from payments for the period
                    // Service fee is 3% of total services — approximate
                    const totalServices = totals?.service_total || 0
                    return (
                      <div style={{ margin: '0 14px 14px', borderRadius: 14, border: '1px solid rgba(143,240,177,.20)', background: 'rgba(143,240,177,.04)', padding: '14px' }}>
                        <div style={{ ...lbl, color: '#c9ffe1', marginBottom: 10 }}>Admin payroll</div>
                        {adminUsers.map(u => {
                          const r = rules[u.id] || { hourly_rate: 0, owner_profit_pct: 2, service_fee_pct: 3, service_fee_days: [0,1,2,3,4,5,6] }
                          const hours = (adminAttendance[u.id] || 0) / 60
                          const basePay = (r.hourly_rate || 0) * hours
                          const profitShare = ownerShare * ((r.owner_profit_pct || 0) / 100)
                          // Service fee: approximate from total services × fee rate, prorated by days worked
                          const feeDays = r.service_fee_days || [0,1,2,3,4,5,6]
                          const worked = adminWorkDays[u.id] || []
                          const feeWorkDays = feeDays.filter(d => worked.includes(d)).length
                          const totalFeeDays = feeDays.length || 1
                          const serviceFeeTotal = totalServices * 0.03 // 3% service fee on all services
                          const feeShare = serviceFeeTotal * ((r.service_fee_pct || 0) / 100) * (feeWorkDays / totalFeeDays)
                          const totalPay = basePay + profitShare + feeShare
                          return (
                            <div key={u.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: '#e9e9e9' }}>{u.name || u.username}</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
                                <div><span style={{ color: 'rgba(255,255,255,.40)' }}>Hours: </span><span style={{ color: '#d7ecff' }}>{hours.toFixed(1)}h</span></div>
                                <div><span style={{ color: 'rgba(255,255,255,.40)' }}>Base pay: </span><span style={{ color: '#8ff0b1' }}>{fmtMoney(basePay)}</span></div>
                                <div><span style={{ color: 'rgba(255,255,255,.40)' }}>Profit {r.owner_profit_pct || 0}%: </span><span style={{ color: '#ffe9a3' }}>{fmtMoney(profitShare)}</span></div>
                                <div><span style={{ color: 'rgba(255,255,255,.40)' }}>Fee {r.service_fee_pct || 0}%: </span><span style={{ color: '#ffe9a3' }}>{fmtMoney(feeShare)}</span></div>
                              </div>
                              <div style={{ marginTop: 6, fontWeight: 900, fontSize: 16 }}>
                                Total: <span style={{ color: '#8ff0b1' }}>{fmtMoney(totalPay)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </>
              )}

              {activeTab === 'rules' && (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Admin rules */}
                  {adminUsers.length > 0 && (
                    <>
                      <div style={{ ...lbl, marginBottom: 4, marginTop: 4 }}>Admin payroll rules</div>
                      {adminUsers.map(u => (
                        <AdminPayrollEditor key={u.id} userId={u.id} userName={u.name || u.username}
                          rule={rules[u.id] || { base_pct: 0, tips_pct: 0, tiers: [], hourly_rate: 0, owner_profit_pct: 2, service_fee_pct: 3, service_fee_days: [0,1,2,3,4,5,6] }}
                          onSaved={r => { setRules(prev => ({ ...prev, [u.id]: r })); load() }}
                        />
                      ))}
                      <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '4px 0' }} />
                      <div style={{ ...lbl, marginBottom: 4 }}>Barber commission rules</div>
                    </>
                  )}
                  {barbers.length === 0 ? (
                    <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12, padding: '12px 0' }}>Load data first</div>
                  ) : barbers.map(b => (
                    <CommissionEditor key={b.barber_id} barber={b}
                      rule={rules[b.barber_id] || b.rule || { base_pct: 60, tips_pct: 100, tiers: [] }}
                      onSaved={r => { setRules(prev => ({ ...prev, [b.barber_id]: r })); load() }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDatePicker && (
        <DatePicker from={from} to={to}
          onChange={(f, t) => { setFrom(f); setTo(t) }}
          onClose={() => setShowDatePicker(false)} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  )
}
// fixed
