'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import Shell from '@/components/Shell'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Barber {
  id: string
  name: string
  level?: string
  photo?: string
  color: string
  serverId?: string
}

interface Service {
  id: string
  name: string
  durationMin: number
  price?: string
  barberIds: string[]
}

interface CalEvent {
  id: string
  barberId: string
  barberName: string
  clientName: string
  clientPhone?: string
  serviceId: string
  serviceName: string
  date: string
  startMin: number
  durMin: number
  status: string
  paid: boolean
  paymentMethod?: string
  notes?: string
  tipAmount?: number
  _raw: any
}

interface ModalState {
  open: boolean
  eventId: string | null
  isNew: boolean
}

interface PayState {
  method: string
  hint: string
  polling: boolean
  tipYes: boolean
  tipAmount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SLOT_H = 44
const START_HOUR = 9
const END_HOUR = 21
const COL_MIN = 190
const BARBER_COLORS = ['#99d100','#a86bff','#0a84ff','#ffb000','#ff5aa5','#35d6c7','#ff6b6b']

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const minToHHMM = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`
const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const fmtDateLong = (d: Date) => d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const fmtTime = (iso: string) => { try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) } catch { return '—' } }
const uid = () => 'e_' + Math.random().toString(16).slice(2)
const clamp = (min: number) => Math.max(START_HOUR * 60, Math.min(min, END_HOUR * 60 - 30))

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

function getServicePrice(svc?: Service) {
  if (!svc?.price) return 0
  return Number(String(svc.price).replace(/[^\d.]/g, '')) || 0
}

// ─── STATUS CHIP ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { border: string; bg: string; color: string }> = {
  paid:      { border: 'rgba(143,240,177,.40)', bg: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  booked:    { border: 'rgba(10,132,255,.40)',  bg: 'rgba(10,132,255,.10)',  color: '#d7ecff' },
  arrived:   { border: 'rgba(143,240,177,.40)', bg: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  done:      { border: 'rgba(255,207,63,.40)',  bg: 'rgba(255,207,63,.08)',  color: '#ffe9a3' },
  noshow:    { border: 'rgba(255,107,107,.40)', bg: 'rgba(255,107,107,.10)', color: '#ffd0d0' },
  cancelled: { border: 'rgba(255,107,107,.30)', bg: 'rgba(255,107,107,.07)', color: '#ffd0d0' },
}
function Chip({ label, type }: { label: string; type: string }) {
  const s = STATUS_COLORS[type] || STATUS_COLORS.booked
  return (
    <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, whiteSpace: 'nowrap' as const }}>
      {label}
    </span>
  )
}

// ─── BOOKING MODAL ────────────────────────────────────────────────────────────
function BookingModal({
  ev, barbers, services, onClose, onSave, onDelete, onPayment
}: {
  ev: CalEvent | null
  barbers: Barber[]
  services: Service[]
  onClose: () => void
  onSave: (patch: Partial<CalEvent>) => void
  onDelete: () => void
  onPayment: (method: string, tip: number) => void
}) {
  const [client, setClient] = useState('')
  const [barberId, setBarberId] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [startMin, setStartMin] = useState(START_HOUR * 60)
  const [status, setStatus] = useState('booked')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [pay, setPay] = useState<PayState>({ method: 'terminal', hint: '', polling: false, tipYes: false, tipAmount: 0 })
  const [terminalPollId, setTerminalPollId] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!ev) return
    setClient(ev.clientName || '')
    setBarberId(ev.barberId || barbers[0]?.id || '')
    setServiceId(ev.serviceId || '')
    setDate(ev.date || isoDate(new Date()))
    setStartMin(ev.startMin)
    setStatus(ev.status || 'booked')
    setPhone(ev.clientPhone || '')
    setNotes(ev.notes || '')
    setPay({ method: 'terminal', hint: '', polling: false, tipYes: false, tipAmount: 0 })
  }, [ev?.id])

  useEffect(() => { return () => { if (terminalPollId) clearInterval(terminalPollId) } }, [terminalPollId])

  if (!ev) return null

  const barberServices = services.filter(s => !s.barberIds.length || s.barberIds.includes(barberId))
  const svc = services.find(s => s.id === serviceId)
  const durMin = svc?.durationMin || 30
  const price = getServicePrice(svc)
  const isNew = !ev._raw?.id

  // Time slots
  const slots: number[] = []
  for (let m = START_HOUR * 60; m + durMin <= END_HOUR * 60; m += 30) slots.push(m)

  async function handleSave() {
    if (!client.trim()) return alert('Enter client name')
    if (!barberId) return alert('Choose barber')
    if (!serviceId) return alert('Choose service')
    setSaving(true)
    onSave({ clientName: client.trim(), barberId, barberName: barbers.find(b => b.id === barberId)?.name || '', serviceId, serviceName: svc?.name || '', date, startMin, durMin, status, clientPhone: phone, notes })
    setSaving(false)
  }

  async function handleTerminal() {
    if (isNew) { alert('Save booking first, then use Terminal'); return }
    if (!price) { alert('Service has no price. Add price in Settings.'); return }
    const backendId = ev._raw?.id
    setPay(p => ({ ...p, hint: `Sending $${price.toFixed(2)} to Terminal…`, polling: true }))
    try {
      const res = await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: String(backendId), amount: price, currency: 'USD',
          client_name: ev.clientName, barber_id: ev.barberId, barber_name: ev.barberName,
          service_name: ev.serviceName,
          note: `ELEMENT • ${ev.clientName} • ${ev.serviceName} • ${minToHHMM(ev.startMin)}`
        })
      })
      const checkoutId = res?.checkout_id
      if (!checkoutId) { setPay(p => ({ ...p, hint: 'No checkout ID returned', polling: false })); return }
      setPay(p => ({ ...p, hint: 'Waiting for payment on Terminal…' }))
      let count = 0
      const timer = setInterval(async () => {
        count++
        if (count > 45) { clearInterval(timer); setPay(p => ({ ...p, hint: 'Timed out. Check Terminal.', polling: false })); return }
        try {
          const s = await apiFetch(`/api/payments/terminal/status/${encodeURIComponent(checkoutId)}`)
          const st = String(s?.status || '').toUpperCase()
          if (st === 'COMPLETED') {
            clearInterval(timer)
            setPay(p => ({ ...p, hint: 'Payment completed ✓', polling: false }))
            onPayment('terminal', 0)
          } else if (st === 'CANCELED' || st === 'CANCEL_REQUESTED') {
            clearInterval(timer)
            setPay(p => ({ ...p, hint: 'Cancelled on Terminal', polling: false }))
          } else {
            setPay(p => ({ ...p, hint: `Client is paying… (${count * 4}s)` }))
          }
        } catch {}
      }, 4000)
      setTerminalPollId(timer)
    } catch (err: any) {
      setPay(p => ({ ...p, hint: 'Error: ' + err.message, polling: false }))
    }
  }

  async function handleManualPayment() {
    const tip = pay.tipYes ? pay.tipAmount : 0
    const backendId = ev._raw?.id
    setPay(p => ({ ...p, hint: 'Saving…' }))
    try {
      await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: backendId ? String(backendId) : '',
          amount: price, tip, tip_amount: tip, currency: 'USD',
          client_name: ev.clientName, barber_id: ev.barberId, barber_name: ev.barberName,
          service_name: ev.serviceName, source: pay.method, payment_method: pay.method,
          note: `ELEMENT • ${ev.clientName} • ${ev.serviceName} • ${minToHHMM(ev.startMin)}`
        })
      })
      if (backendId) {
        await apiFetch(`/api/bookings/${encodeURIComponent(String(backendId))}`, {
          method: 'PATCH',
          body: JSON.stringify({ paid: true, payment_method: pay.method, tip, tip_amount: tip, service_amount: price })
        })
      }
      setPay(p => ({ ...p, hint: `${pay.method} payment recorded ✓` }))
      onPayment(pay.method, tip)
    } catch (err: any) {
      setPay(p => ({ ...p, hint: 'Error: ' + err.message }))
    }
  }

  const methodColors: Record<string, React.CSSProperties> = {
    terminal: { borderColor: 'rgba(10,132,255,.75)', background: 'rgba(10,132,255,.14)', color: '#d7ecff' },
    cash:     { borderColor: 'rgba(143,240,177,.65)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
    zelle:    { borderColor: 'rgba(106,0,255,.75)', background: 'rgba(106,0,255,.14)', color: '#d8b4fe' },
    other:    { borderColor: 'rgba(255,207,63,.65)', background: 'rgba(255,207,63,.10)', color: '#fff3b0' },
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 18, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(760px, 95vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))', backdropFilter: 'blur(18px)', padding: 16, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', color: '#e9e9e9', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>
          {isNew ? 'New appointment' : `Edit — ${ev.clientName}`}
        </div>

        {/* Form grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>Client</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name"
              style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 14 }} />
          </div>
          {[
            { label: 'Barber', content: <select value={barberId} onChange={e => setBarberId(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }}>
              {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select> },
            { label: 'Service', content: <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }}>
              {barberServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select> },
            { label: 'Date', content: <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', colorScheme: 'dark' as any }} /> },
            { label: 'Time', content: <select value={startMin} onChange={e => setStartMin(Number(e.target.value))} style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }}>
              {slots.map(m => <option key={m} value={m}>{minToHHMM(m)}</option>)}
            </select> },
            { label: 'Status', content: <select value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }}>
              {['booked','arrived','done','noshow','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select> },
            { label: 'Phone', content: <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (___) ___-____" style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }} /> },
          ].map((f, i) => (
            <div key={i}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>{f.label}</label>
              {f.content}
            </div>
          ))}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none' }} />
          </div>
        </div>

        {/* Payment block */}
        <div style={{ padding: 12, borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.18)', marginBottom: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 4 }}>Accept payment {price > 0 && <span style={{ color: 'rgba(255,255,255,.60)', fontSize: 13, fontWeight: 400 }}>— ${price.toFixed(2)}</span>}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 10, marginTop: 10 }}>
            {['terminal','cash','zelle','other'].map(m => (
              <button key={m} onClick={() => {
                setPay(p => ({ ...p, method: m, hint: '', tipYes: false, tipAmount: 0 }))
                if (m === 'terminal') handleTerminal()
              }} disabled={ev.paid}
                style={{ flex: '1 1 80px', height: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: ev.paid ? 'not-allowed' : 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', ...(pay.method === m ? methodColors[m] : {}) }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {/* Tip section for non-terminal, non-cash */}
          {pay.method !== 'terminal' && pay.method !== 'cash' && !ev.paid && (
            <div style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)', marginBottom: 8 }}>
              <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 8 }}>Tip?</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' as const }}>
                <button onClick={() => setPay(p => ({ ...p, tipYes: false }))} style={{ flex: 1, height: 34, borderRadius: 999, border: `1px solid ${!pay.tipYes ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.12)'}`, background: !pay.tipYes ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.02)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>No tip</button>
                <button onClick={() => setPay(p => ({ ...p, tipYes: true }))} style={{ flex: 1, height: 34, borderRadius: 999, border: `1px solid ${pay.tipYes ? 'rgba(143,240,177,.65)' : 'rgba(255,255,255,.12)'}`, background: pay.tipYes ? 'rgba(143,240,177,.10)' : 'rgba(255,255,255,.02)', color: pay.tipYes ? '#c9ffe1' : '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Yes, tip</button>
                {pay.tipYes && <input type="number" min="0" step="0.01" placeholder="$ Tip" value={pay.tipAmount || ''} onChange={e => setPay(p => ({ ...p, tipAmount: parseFloat(e.target.value) || 0 }))}
                  style={{ flex: 1, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13 }} />}
              </div>
            </div>
          )}

          {/* Confirm button for cash/zelle/other */}
          {pay.method !== 'terminal' && !ev.paid && (
            <button onClick={handleManualPayment} style={{ width: '100%', height: 42, marginTop: 6, borderRadius: 14, border: '1px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', fontWeight: 900, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Confirm {pay.method} payment
            </button>
          )}

          {ev.paid && (
            <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(143,240,177,.08)', border: '1px solid rgba(143,240,177,.30)', color: '#c9ffe1', fontSize: 13 }}>
              ✓ Paid via {ev.paymentMethod || '—'}
            </div>
          )}

          {pay.hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 8, padding: '4px 0' }}>{pay.hint}</div>}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' as const }}>
          {!isNew && <button onClick={onDelete} style={{ height: 42, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.10)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit' }}>Delete</button>}
          <button onClick={onClose} style={{ height: 42, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Close</button>
          <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN CALENDAR PAGE ───────────────────────────────────────────────────────
export default function CalendarPage() {
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [events, setEvents] = useState<CalEvent[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ open: false, eventId: null, isNew: false })
  const [nowMin, setNowMin] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState<{ eventId: string; offsetMin: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const todayStr = isoDate(anchor)
  const selectedEvent = events.find(e => e.id === modal.eventId) || null

  // Now line
  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()) }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  // Load barbers
  const loadBarbers = useCallback(async () => {
    const data = await apiFetch('/api/barbers')
    const list = Array.isArray(data) ? data : (data?.barbers || [])
    return list.map((b: any, i: number) => ({
      id: String(b.id || ''),
      name: String(b.name || b.full_name || b.id || '').trim(),
      level: String(b.level || '').trim(),
      photo: String(b.photo_url || b.photoUrl || b.photo || '').trim(),
      color: BARBER_COLORS[i % BARBER_COLORS.length],
      serverId: String(b.id || ''),
    })).filter((b: Barber) => b.id && b.name)
  }, [])

  // Load services
  const loadServices = useCallback(async () => {
    const data = await apiFetch('/api/services')
    const list = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : []
    return list.map((s: any) => {
      const durMs = s.durationMs ?? (s.duration_minutes != null ? s.duration_minutes * 60000 : 0)
      const durMin = Math.max(1, Math.round(durMs / 60000) || 30)
      const priceStr = s.price != null ? String(s.price) : s.price_cents > 0 ? (s.price_cents / 100).toFixed(2) : ''
      return {
        id: String(s.id || ''),
        name: String(s.name || ''),
        durationMin: durMin,
        price: priceStr,
        barberIds: (s.barberIds || s.barber_ids || []).map(String),
      }
    }).filter((s: Service) => s.name)
  }, [])

  // Load bookings
  const loadBookings = useCallback(async (barbersArg: Barber[], servicesArg: Service[]) => {
    const data = await apiFetch(`/api/bookings?from=${todayStr}T00:00:00.000Z&to=${todayStr}T23:59:59.999Z`)
    const list = Array.isArray(data?.bookings) ? data.bookings : Array.isArray(data) ? data : []
    return list.map((b: any) => {
      const startAt = b.start_at ? new Date(b.start_at) : null
      const startMin = startAt ? startAt.getHours() * 60 + startAt.getMinutes() : clamp(10 * 60)
      const svc = servicesArg.find(s => s.id === (b.service_id || b.serviceId))
      const barber = barbersArg.find(br => br.id === (b.barber_id || b.barberId))
      return {
        id: b.id || b.booking_id || uid(),
        barberId: String(b.barber_id || b.barberId || ''),
        barberName: barber?.name || String(b.barber_name || ''),
        clientName: String(b.client_name || b.clientName || 'Client'),
        clientPhone: String(b.client_phone || ''),
        serviceId: String(b.service_id || b.serviceId || ''),
        serviceName: svc?.name || String(b.service_name || ''),
        date: b.start_at ? b.start_at.slice(0, 10) : todayStr,
        startMin: clamp(startMin),
        durMin: svc?.durationMin || 30,
        status: String(b.status || 'booked'),
        paid: !!(b.paid || b.is_paid || b.payment_status === 'paid'),
        paymentMethod: String(b.payment_method || ''),
        notes: String(b.notes || b.customer_note || ''),
        tipAmount: Number(b.tip || b.tip_amount || 0),
        _raw: b,
      } as CalEvent
    })
  }, [todayStr])

  // Initial load
  useEffect(() => {
    setLoading(true)
    Promise.all([loadBarbers(), loadServices()])
      .then(async ([b, s]) => {
        setBarbers(b)
        setServices(s)
        const evs = await loadBookings(b, s)
        setEvents(evs)
        setLoading(false)
      })
      .catch(err => { console.warn(err); setLoading(false) })
  }, [todayStr])

  // Refresh on date change
  const reload = useCallback(() => {
    if (!barbers.length) return
    loadBookings(barbers, services).then(setEvents).catch(console.warn)
  }, [barbers, services, loadBookings])

  // Calendar geometry
  const totalSlots = (END_HOUR - START_HOUR) * 2
  const totalH = totalSlots * SLOT_H
  const minToY = (min: number) => ((min - START_HOUR * 60) / 30) * SLOT_H
  const nowY = minToY(nowMin)
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60

  // Filter events for today & barber column
  const todayEvents = events.filter(e => e.date === todayStr)
  const filtered = search
    ? todayEvents.filter(e => [e.clientName, e.barberName, e.serviceName].join(' ').toLowerCase().includes(search.toLowerCase()))
    : todayEvents

  // Open create modal
  function openCreate(barberId: string, startMin: number) {
    const id = uid()
    const barber = barbers.find(b => b.id === barberId)
    const defaultSvc = services.find(s => !s.barberIds.length || s.barberIds.includes(barberId))
    const newEv: CalEvent = {
      id, barberId, barberName: barber?.name || '', clientName: '', clientPhone: '',
      serviceId: defaultSvc?.id || '', serviceName: defaultSvc?.name || '',
      date: todayStr, startMin: clamp(startMin), durMin: defaultSvc?.durationMin || 30,
      status: 'booked', paid: false, notes: '', _raw: null
    }
    setEvents(prev => [...prev, newEv])
    setModal({ open: true, eventId: id, isNew: true })
  }

  // Save booking
  async function handleSave(patch: Partial<CalEvent>) {
    const ev = events.find(e => e.id === modal.eventId)
    if (!ev) return
    const updated = { ...ev, ...patch }
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e))
    const isNew = !ev._raw?.id
    try {
      if (isNew) {
        const startAt = new Date(updated.date + 'T' + minToHHMM(updated.startMin) + ':00')
        const res = await apiFetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify({
            barber_id: updated.barberId, service_id: updated.serviceId,
            client_name: updated.clientName, client_phone: updated.clientPhone || '',
            start_at: startAt.toISOString(), notes: updated.notes || '',
            status: 'booked'
          })
        })
        const savedId = res?.booking?.id || res?.id
        if (savedId) {
          setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, _raw: res?.booking || { id: savedId }, id: String(savedId) } : e))
        }
      } else {
        await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, {
          method: 'PATCH',
          body: JSON.stringify({ barber_id: updated.barberId, service_id: updated.serviceId, client_name: updated.clientName, client_phone: updated.clientPhone || '', status: updated.status, notes: updated.notes || '' })
        })
      }
    } catch (err: any) { console.warn('save:', err.message) }
    setModal({ open: false, eventId: null, isNew: false })
  }

  // Delete booking
  async function handleDelete() {
    const ev = events.find(e => e.id === modal.eventId)
    if (!ev) return
    if (!window.confirm('Delete this booking?')) return
    setEvents(prev => prev.filter(e => e.id !== ev.id))
    setModal({ open: false, eventId: null, isNew: false })
    if (ev._raw?.id) {
      try { await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, { method: 'DELETE' }) }
      catch (err: any) { console.warn('delete:', err.message) }
    }
  }

  // Payment callback
  function handlePayment(method: string, tip: number) {
    setEvents(prev => prev.map(e => e.id === modal.eventId ? { ...e, paid: true, paymentMethod: method, tipAmount: tip } : e))
  }

  return (
    <Shell page="calendar">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        .cal-event:hover { filter: brightness(1.15); }
        .cal-col:hover { background: rgba(255,255,255,.02); }
        input[type=date] { color-scheme: dark; }
        select option { background: #111; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Topbar */}
        <div style={{ padding: '10px 18px 12px', background: 'linear-gradient(to bottom,rgba(0,0,0,.90),rgba(0,0,0,.70))', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: '"Julius Sans One", sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Calendar</h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase' }}>{fmtDateLong(anchor)}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '←', onClick: () => setAnchor(a => addDays(a, -1)) },
                { label: 'Today', onClick: () => { const d = new Date(); d.setHours(0,0,0,0); setAnchor(d) } },
                { label: '→', onClick: () => setAnchor(a => addDays(a, 1)) },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>{b.label}</button>
              ))}
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ height: 40, width: 'min(260px, 50vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />
              <button onClick={() => openCreate(barbers[0]?.id || '', clamp(new Date().getHours() * 60))}
                style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(0,0,0,.75)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', boxShadow: '0 0 18px rgba(10,132,255,.25)' }}>
                + New booking
              </button>
              <button onClick={reload} style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>↻</button>
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 90 + barbers.length * COL_MIN }}>

            {/* Header row — barber names */}
            <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${barbers.length}, minmax(${COL_MIN}px, 1fr))`, borderBottom: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.20)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,.10)' }}>Time</div>
              {barbers.map((b, i) => (
                <div key={b.id} style={{ padding: '10px 12px', borderRight: i < barbers.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {b.photo && <img src={b.photo} alt={b.name} style={{ width: 32, height: 32, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display = 'none')} />}
                  {!b.photo && <div style={{ width: 10, height: 10, borderRadius: 999, background: b.color, flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    {b.level && <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)' }}>{b.level}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: `90px repeat(${barbers.length}, minmax(${COL_MIN}px, 1fr))`, height: totalH, position: 'relative' }}>

              {/* Time labels */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.12)', position: 'relative' }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H * 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: '.08em' }}>
                    {pad2(START_HOUR + i)}:00
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {barbers.map((barber, bi) => {
                const colEvents = filtered.filter(e => e.barberId === barber.id)
                return (
                  <div key={barber.id} className="cal-col" style={{ position: 'relative', borderRight: bi < barbers.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none', background: 'rgba(0,0,0,.06)' }}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      const y = e.clientY - rect.top
                      const min = Math.round(y / SLOT_H) * 30 + START_HOUR * 60
                      openCreate(barber.id, clamp(min))
                    }}>

                    {/* Hour lines */}
                    {Array.from({ length: (END_HOUR - START_HOUR) * 2 }, (_, i) => (
                      <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H, height: 1, background: i % 2 === 0 ? 'rgba(255,255,255,.09)' : 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
                    ))}

                    {/* Now line */}
                    {showNow && bi === 0 && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: nowY, height: 2, background: 'rgba(10,132,255,.95)', boxShadow: '0 0 22px rgba(10,132,255,.35)', pointerEvents: 'none', zIndex: 20 }}>
                        <div style={{ position: 'absolute', left: 8, top: -4, width: 10, height: 10, borderRadius: 999, background: '#0a84ff', boxShadow: '0 0 0 3px rgba(10,132,255,.18)' }} />
                      </div>
                    )}

                    {/* Events */}
                    {colEvents.map(ev => {
                      const top = minToY(ev.startMin)
                      const height = Math.max(SLOT_H, (ev.durMin / 30) * SLOT_H)
                      const color = barber.color
                      return (
                        <div key={ev.id} className="cal-event"
                          style={{ position: 'absolute', left: 8, right: 8, top, height: height - 4, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: `linear-gradient(180deg,${color}44,${color}22)`, padding: '8px 10px', cursor: 'pointer', userSelect: 'none', overflow: 'hidden', zIndex: 5 }}
                          onClick={e => { e.stopPropagation(); setModal({ open: true, eventId: ev.id, isNew: false }) }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{ev.clientName}</div>
                            {ev.paid ? <Chip label="Paid" type="paid" /> : <Chip label={ev.status} type={ev.status} />}
                          </div>
                          {height > 55 && (
                            <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {minToHHMM(ev.startMin)} · {ev.serviceName}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ position: 'fixed', bottom: 20, right: 20, padding: '8px 16px', borderRadius: 999, background: 'rgba(10,132,255,.20)', border: '1px solid rgba(10,132,255,.40)', color: '#d7ecff', fontSize: 12, zIndex: 99 }}>
            Loading…
          </div>
        )}
      </div>

      {modal.open && selectedEvent && (
        <BookingModal
          ev={selectedEvent}
          barbers={barbers}
          services={services}
          onClose={() => {
            if (modal.isNew) setEvents(prev => prev.filter(e => e.id !== modal.eventId))
            setModal({ open: false, eventId: null, isNew: false })
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          onPayment={handlePayment}
        />
      )}
    </Shell>
  )
}
