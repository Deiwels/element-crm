'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
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
  about?: string
  basePrice?: string
  publicRole?: string
  radarLabels?: string[]
  radarValues?: number[]
  username?: string
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
  type?: 'booking' | 'block'  // block = unavailable slot
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
const SLOT_H = 11  // 5min = 11px (44px per 20min, 4 slots per hour)
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
const clamp = (min: number) => Math.max(START_HOUR * 60, Math.min(min, END_HOUR * 60 - 5))

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
  ev, barbers, services, onClose, onSave, onDelete, onPayment, isOwnerOrAdmin
}: {
  ev: CalEvent | null
  barbers: Barber[]
  services: Service[]
  onClose: () => void
  onSave: (patch: Partial<CalEvent>) => void
  onDelete: () => void
  onPayment: (method: string, tip: number) => void
  isOwnerOrAdmin: boolean
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
  for (let m = START_HOUR * 60; m + durMin <= END_HOUR * 60; m += 5) slots.push(m)

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

        {/* Payment block — only owner/admin */}
        {isOwnerOrAdmin && (
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
        )}
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

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_DEFAULTS: DaySchedule[] = [
  { enabled: false, startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
  { enabled: true,  startMin: 10*60, endMin: 20*60 },
]

interface DaySchedule { enabled: boolean; startMin: number; endMin: number }

function minToTimeStr(min: number) {
  return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}`
}
function timeStrToMin(s: string) {
  const [h, m] = s.split(':').map(Number)
  return (h||0)*60 + (m||0)
}

// ─── DATE PICKER ─────────────────────────────────────────────────────────────
function DatePickerModal({ current, onSelect, onClose }: {
  current: Date; onSelect: (d: Date) => void; onClose: () => void
}) {
  const [month, setMonth] = useState(() => {
    const d = new Date(current); d.setDate(1); d.setHours(0,0,0,0); return d
  })
  const today = new Date(); today.setHours(0,0,0,0)
  function prevMonth() { const m = new Date(month); m.setMonth(m.getMonth()-1); setMonth(m) }
  function nextMonth() { const m = new Date(month); m.setMonth(m.getMonth()+1); setMonth(m) }
  const firstDay = new Date(month)
  const offset = (firstDay.getDay() + 6) % 7
  const start = new Date(firstDay); start.setDate(1 - offset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
  const btn: React.CSSProperties = { height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.18)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 14, fontFamily: 'inherit' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 18 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(480px,95vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))', backdropFilter: 'blur(18px)', padding: 16, color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.10)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 13 }}>Choose date</div>
          <button onClick={onClose} style={{ height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>Close</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prevMonth} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>←</button>
            <button onClick={nextMonth} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>→</button>
          </div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => { const t = new Date(); t.setDate(1); t.setHours(0,0,0,0); setMonth(t) }} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Today</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth()
            const isToday = +d === +today
            const isSel = d.toDateString() === current.toDateString()
            return (
              <button key={i} onClick={() => { onSelect(d); onClose() }}
                style={{ ...btn, opacity: inMonth ? 1 : 0.35, borderColor: isSel ? 'rgba(10,132,255,.75)' : isToday ? 'rgba(255,207,63,.55)' : 'rgba(255,255,255,.12)', background: isSel ? 'rgba(10,132,255,.12)' : 'rgba(0,0,0,.18)', boxShadow: isSel ? '0 0 0 1px rgba(10,132,255,.22) inset' : 'none' }}>
                {d.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SCHEDULE GRID ───────────────────────────────────────────────────────────
function SchedGrid({ schedule, onChange }: { schedule: DaySchedule[]; onChange: (s: DaySchedule[]) => void }) {
  function toggle(i: number) { const n = [...schedule]; n[i] = { ...n[i], enabled: !n[i].enabled }; onChange(n) }
  function setTime(i: number, field: 'startMin'|'endMin', val: string) { const n = [...schedule]; n[i] = { ...n[i], [field]: timeStrToMin(val) }; onChange(n) }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, margin: '8px 0' }}>
      {DAY_NAMES.map((name, i) => {
        const day = schedule[i]
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, border: `1px solid ${day.enabled ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)'}`, borderRadius: 12, padding: '8px 6px', background: day.enabled ? 'rgba(10,132,255,.08)' : 'rgba(0,0,0,.18)', opacity: day.enabled ? 1 : 0.55, transition: 'all .18s' }}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center', fontWeight: 900, color: 'rgba(255,255,255,.65)' }}>{name}</div>
            <button onClick={() => toggle(i)} style={{ height: 28, borderRadius: 999, border: `1px solid ${day.enabled ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.16)'}`, background: day.enabled ? 'rgba(10,132,255,.16)' : 'rgba(255,255,255,.05)', color: day.enabled ? '#d7ecff' : '#fff', cursor: 'pointer', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 900, fontFamily: 'inherit', width: '100%' }}>
              {day.enabled ? 'ON' : 'OFF'}
            </button>
            <div style={{ opacity: day.enabled ? 1 : 0.3, pointerEvents: day.enabled ? 'auto' : 'none' }}>
              <label style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 2 }}>From</label>
              <input type="time" value={minToTimeStr(day.startMin)} onChange={e => setTime(i,'startMin',e.target.value)} style={{ height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 6px', fontSize: 11, outline: 'none', width: '100%', colorScheme: 'dark' as any }} />
              <label style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', margin: '4px 0 2px' }}>To</label>
              <input type="time" value={minToTimeStr(day.endMin)} onChange={e => setTime(i,'endMin',e.target.value)} style={{ height: 30, borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 6px', fontSize: 11, outline: 'none', width: '100%', colorScheme: 'dark' as any }} />
            </div>
          </div>
        )
      })}
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
  const [drag, setDrag] = useState<{
    eventId: string
    offsetMin: number       // where in the event user grabbed (minutes from top)
    ghostBarberIdx: number  // current column index during drag
    ghostMin: number        // current time during drag
  } | null>(null)
  const [dragConfirm, setDragConfirm] = useState<{
    eventId: string; newBarberId: string; newBarberName: string; newMin: number
  } | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent, ev: CalEvent, barberIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const col = colRefs.current[barberIdx]
    if (!col) return
    const rect = col.getBoundingClientRect()
    const y = clientY - rect.top
    const clickedMin = Math.round(y / SLOT_H) * 5 + START_HOUR * 60
    const offsetMin = clickedMin - ev.startMin
    setDrag({ eventId: ev.id, offsetMin, ghostBarberIdx: barberIdx, ghostMin: ev.startMin })
  }

  function onDragMove(e: MouseEvent | TouchEvent) {
    if (!drag) return
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    // Find which column we're over
    let newBarberIdx = drag.ghostBarberIdx
    colRefs.current.forEach((col, i) => {
      if (!col) return
      const rect = col.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right) newBarberIdx = i
    })
    const col = colRefs.current[newBarberIdx]
    if (!col) return
    const rect = col.getBoundingClientRect()
    const y = clientY - rect.top
    const rawMin = Math.round(y / SLOT_H) * 5 + START_HOUR * 60 - drag.offsetMin
    const newMin = Math.max(START_HOUR * 60, Math.min(rawMin, END_HOUR * 60 - 5))
    setDrag(d => d ? { ...d, ghostBarberIdx: newBarberIdx, ghostMin: newMin } : d)
  }

  function onDragEnd() {
    if (!drag) return
    const ev = events.find(e => e.id === drag.eventId)
    if (!ev) { setDrag(null); return }
    const newBarber = barbers[drag.ghostBarberIdx]
    if (!newBarber) { setDrag(null); return }
    const changed = newBarber.id !== ev.barberId || drag.ghostMin !== ev.startMin
    if (!changed) { setDrag(null); return }
    setDragConfirm({ eventId: ev.id, newBarberId: newBarber.id, newBarberName: newBarber.name, newMin: drag.ghostMin })
    setDrag(null)
  }

  async function confirmDragMove() {
    if (!dragConfirm) return
    const ev = events.find(e => e.id === dragConfirm.eventId)
    if (!ev) { setDragConfirm(null); return }
    const newBarber = barbers.find(b => b.id === dragConfirm.newBarberId)
    const updated = { ...ev, barberId: dragConfirm.newBarberId, barberName: newBarber?.name || ev.barberName, startMin: dragConfirm.newMin }
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e))
    setDragConfirm(null)
    if (ev._raw?.id) {
      try {
        const startAt = new Date(updated.date + 'T' + minToHHMM(updated.startMin) + ':00')
        await apiFetch('/api/bookings/' + encodeURIComponent(String(ev._raw.id)), {
          method: 'PATCH',
          body: JSON.stringify({ barber_id: updated.barberId, start_at: startAt.toISOString() })
        })
      } catch (err: any) { console.warn('drag patch:', err.message) }
    }
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: MouseEvent | TouchEvent) => onDragMove(e)
    const end = () => onDragEnd()
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [drag, events, barbers])

  // ── Auth / Role ─────────────────────────────────────────────────────────────
  const [currentUser] = useState<{ uid: string; name: string; username: string; role: string; barber_id?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null') } catch { return null }
  })
  const isBarber = currentUser?.role === 'barber'
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  const myBarberId = currentUser?.barber_id || ''

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
      about: String(b.about || b.description || b.bio || '').trim(),
      basePrice: String(b.base_price || b.price || '').trim(),
      publicRole: String(b.public_role || b.level || '').trim(),
      radarLabels: Array.isArray(b.radar_labels) ? b.radar_labels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
      radarValues: Array.isArray(b.radar_values) ? b.radar_values.map(Number) : [4.5,4.5,4.5,4.5,4.5],
      username: String(b.username || '').trim(),
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

  // Reload all (for Settings)
  const reloadAll = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([loadBarbers(), loadServices()])
      setBarbers(b)
      setServices(s)
      const evs = await loadBookings(b, s)
      setEvents(evs)
    } catch (err) { console.warn(err) }
  }, [loadBarbers, loadServices, loadBookings])

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
  const totalSlots = (END_HOUR - START_HOUR) * 12  // 5min slots
  const totalH = totalSlots * SLOT_H
  const minToY = (min: number) => ((min - START_HOUR * 60) / 5) * SLOT_H
  const nowY = minToY(nowMin)
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60

  // Filter events for today & barber column
  const todayEvents = events.filter(e => {
    if (e.date !== todayStr) return false
    // Barber sees only their own bookings
    if (isBarber && e.type !== 'block' && e.barberId !== myBarberId) return false
    return true
  })
  const filtered = search
    ? todayEvents.filter(e => [e.clientName, e.barberName, e.serviceName].join(' ').toLowerCase().includes(search.toLowerCase()))
    : todayEvents

  // Create block (owner/admin only)
  function openCreateBlock(barberId: string, startMin: number) {
    const id = 'block_' + Date.now()
    const barber = barbers.find(b => b.id === barberId)
    const blockEv: CalEvent = {
      id, type: 'block', barberId, barberName: barber?.name || '',
      clientName: 'BLOCKED', clientPhone: '', serviceId: '', serviceName: 'Blocked',
      date: todayStr, startMin: clamp(startMin), durMin: 60,
      status: 'block', paid: false, notes: '', _raw: null
    }
    setEvents(prev => [...prev, blockEv])
    // Save to API
    const startAt = new Date(todayStr + 'T' + minToHHMM(startMin) + ':00')
    const endAt = new Date(startAt.getTime() + 60 * 60000)
    apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({
        barber_id: barberId, type: 'block', status: 'block',
        client_name: 'BLOCKED', service_id: '',
        start_at: startAt.toISOString(), end_at: endAt.toISOString(),
        notes: 'Blocked by manager'
      })
    }).then(res => {
      const savedId = res?.booking?.id || res?.id
      if (savedId) setEvents(prev => prev.map(e => e.id === id ? { ...e, _raw: { id: savedId } } : e))
    }).catch(console.warn)
  }

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
                { label: 'Date', onClick: () => setDatePickerOpen(true) },
                { label: '←', onClick: () => setAnchor(a => addDays(a, -1)) },
                { label: 'Today', onClick: () => { const d = new Date(); d.setHours(0,0,0,0); setAnchor(d) } },
                { label: '→', onClick: () => setAnchor(a => addDays(a, 1)) },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>{b.label}</button>
              ))}
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ height: 40, width: 'min(260px, 50vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />
              {isOwnerOrAdmin && (
                <button onClick={() => {
                  const barberId = prompt('Block which barber ID? (or leave blank for first barber)')
                  const targetId = barberId?.trim() || barbers[0]?.id || ''
                  if (targetId) openCreateBlock(targetId, clamp(new Date().getHours() * 60))
                }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,107,107,.50)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>
                  ⊘ Block
                </button>
              )}
              <button onClick={() => {
                const barberId = isBarber ? myBarberId : (barbers[0]?.id || '')
                openCreate(barberId, clamp(new Date().getHours() * 60))
              }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(0,0,0,.75)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', boxShadow: '0 0 18px rgba(10,132,255,.25)' }}>
                + New booking
              </button>
              <button onClick={reload} style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>↻</button>
              {isOwnerOrAdmin && (
                <button onClick={() => setSettingsOpen(true)} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>Settings</button>
              )}
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
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H * 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, color: 'rgba(255,255,255,.45)', fontSize: 11, letterSpacing: '.08em' }}>
                    {pad2(START_HOUR + i)}:00
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {barbers.map((barber, bi) => {
                const colEvents = filtered.filter(e => e.barberId === barber.id)
                return (
                  <div key={barber.id} className="cal-col"
                  ref={el => { colRefs.current[bi] = el }}
                  style={{ position: 'relative', borderRight: bi < barbers.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none', background: drag && drag.ghostBarberIdx === bi ? 'rgba(10,132,255,.04)' : 'rgba(0,0,0,.06)', transition: 'background .15s' }}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      const y = e.clientY - rect.top
                      const min = Math.round(y / SLOT_H) * 5 + START_HOUR * 60
                      // Barbers can only create in their own column
                      if (isBarber && barber.id !== myBarberId) return
                      openCreate(barber.id, clamp(min))
                    }}>

                    {/* Hour lines */}
                    {Array.from({ length: (END_HOUR - START_HOUR) * 12 }, (_, i) => (
                      <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H, height: 1, background: i % 12 === 0 ? 'rgba(255,255,255,.12)' : i % 4 === 0 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.025)', pointerEvents: 'none' }} />
                    ))}

                    {/* Now line */}
                    {showNow && bi === 0 && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: nowY, height: 2, background: 'rgba(10,132,255,.95)', boxShadow: '0 0 22px rgba(10,132,255,.35)', pointerEvents: 'none', zIndex: 20 }}>
                        <div style={{ position: 'absolute', left: 8, top: -4, width: 10, height: 10, borderRadius: 999, background: '#0a84ff', boxShadow: '0 0 0 3px rgba(10,132,255,.18)' }} />
                      </div>
                    )}

                    {/* Drag ghost */}
                    {drag && drag.ghostBarberIdx === bi && (() => {
                      const dragEv = events.find(e => e.id === drag.eventId)
                      if (!dragEv) return null
                      const ghostTop = minToY(drag.ghostMin)
                      const ghostH = Math.max(SLOT_H * 3, (dragEv.durMin / 5) * SLOT_H)
                      return (
                        <div style={{ position: 'absolute', left: 8, right: 8, top: ghostTop, height: ghostH - 4, borderRadius: 14, border: '2px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.14)', pointerEvents: 'none', zIndex: 40, backdropFilter: 'blur(4px)' }}>
                          <div style={{ padding: '8px 10px', fontWeight: 900, fontSize: 12, color: '#d7ecff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {dragEv.clientName} — {minToHHMM(drag.ghostMin)}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Events */}
                    {colEvents.map(ev => {
                      const top = minToY(ev.startMin)
                      const height = Math.max(SLOT_H * 6, (ev.durMin / 5) * SLOT_H)  // min 30min height
                      const isBlock = ev.type === 'block' || ev.status === 'block'
                      const color = barber.color
                      // Barber can only drag their own bookings, not blocks
                      const canDrag = !isBlock && (!isBarber || ev.barberId === myBarberId)
                      // Mask client phone for barbers
                      const displayClient = isBarber && ev.clientPhone
                        ? ev.clientName
                        : ev.clientName

                      if (isBlock) {
                        // Block — only owner/admin can remove it
                        return (
                          <div key={ev.id}
                            style={{ position: 'absolute', left: 4, right: 4, top, height: height - 2, borderRadius: 10, background: 'repeating-linear-gradient(45deg, rgba(255,107,107,.08) 0px, rgba(255,107,107,.08) 6px, rgba(255,107,107,.04) 6px, rgba(255,107,107,.04) 12px)', border: '1px solid rgba(255,107,107,.25)', zIndex: 3, overflow: 'hidden', cursor: isOwnerOrAdmin ? 'pointer' : 'default' }}
                            onClick={e => {
                              e.stopPropagation()
                              if (!isOwnerOrAdmin) return
                              if (!confirm('Remove this block?')) return
                              setEvents(prev => prev.filter(x => x.id !== ev.id))
                              if (ev._raw?.id) apiFetch('/api/bookings/' + encodeURIComponent(String(ev._raw.id)), { method: 'DELETE' }).catch(console.warn)
                            }}>
                            <div style={{ padding: '4px 8px', fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,107,107,.70)', fontWeight: 900 }}>
                              {isOwnerOrAdmin ? '⊘ Blocked — click to remove' : '⊘ Blocked'}
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={ev.id} className="cal-event"
                          style={{ position: 'absolute', left: 8, right: 8, top, height: height - 2, borderRadius: 14, border: `1px solid ${drag?.eventId === ev.id ? 'rgba(10,132,255,.75)' : 'rgba(255,255,255,.14)'}`, background: `linear-gradient(180deg,${color}44,${color}22)`, padding: '8px 10px', cursor: canDrag ? (drag ? 'grabbing' : 'grab') : 'pointer', userSelect: 'none', overflow: 'hidden', zIndex: drag?.eventId === ev.id ? 50 : 5, opacity: drag?.eventId === ev.id ? 0.5 : 1, transition: 'opacity .15s' }}
                          onMouseDown={e => { if (!canDrag || e.button !== 0) return; startDrag(e, ev, bi) }}
                          onTouchStart={e => { if (!canDrag) return; startDrag(e, ev, bi) }}
                          onClick={e => { e.stopPropagation(); if (!drag) setModal({ open: true, eventId: ev.id, isNew: false }) }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{displayClient}</div>
                            {ev.paid ? <Chip label="Paid" type="paid" /> : <Chip label={ev.status} type={ev.status} />}
                          </div>
                          {height > 40 && (
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
          isOwnerOrAdmin={isOwnerOrAdmin}
          onClose={() => {
            if (modal.isNew) setEvents(prev => prev.filter(e => e.id !== modal.eventId))
            setModal({ open: false, eventId: null, isNew: false })
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          onPayment={handlePayment}
        />
      )}

      {/* Drag confirm modal */}
      {dragConfirm && (() => {
        const ev = events.find(e => e.id === dragConfirm.eventId)
        if (!ev) return null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(12px)' }}>
            <div style={{ width: 'min(380px,92vw)', borderRadius: 22, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(255,255,255,.09),rgba(255,255,255,.04))', backdropFilter: 'blur(20px)', boxShadow: '0 24px 80px rgba(0,0,0,.55)', padding: 20, color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 14 }}>Move booking</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>{dragConfirm.newBarberName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0a84ff', letterSpacing: '.02em', marginBottom: 4 }}>{minToHHMM(dragConfirm.newMin)}</div>
                <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>{ev.clientName} · {ev.serviceName}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDragConfirm(null)} style={{ height: 40, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={confirmDragMove} style={{ height: 40, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.18)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13 }}>Move</button>
              </div>
            </div>
          </div>
        )
      })()}

      {datePickerOpen && (
        <DatePickerModal
          current={anchor}
          onSelect={d => { const x = new Date(d); x.setHours(0,0,0,0); setAnchor(x) }}
          onClose={() => setDatePickerOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          barbers={barbers}
          services={services}
          onClose={() => setSettingsOpen(false)}
          onReload={reloadAll}
        />
      )}
    </Shell>
  )
}

// ─── BARBER EDIT CARD ────────────────────────────────────────────────────────
function BarberEditCard({ b, onDelete, onSaved, onError, inputStyle, labelStyle, btnStyle, primaryBtnStyle, dangerBtnStyle }: {
  b: Barber
  onDelete: (id: string, name: string) => void
  onSaved: () => void
  onError: (e: string) => void
  inputStyle: React.CSSProperties
  labelStyle: React.CSSProperties
  btnStyle: React.CSSProperties
  primaryBtnStyle: React.CSSProperties
  dangerBtnStyle: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Editable fields — initialized from barber data
  const [level, setLevel] = useState(b.level || '')
  const [price, setPrice] = useState(b.basePrice || '')
  const [about, setAbout] = useState(b.about || '')
  const [publicRole, setPublicRole] = useState(b.publicRole || b.level || '')
  const [radarLabels, setRadarLabels] = useState((b.radarLabels || ['FADE','LONG','BEARD','STYLE','DETAIL']).join(','))
  const [radarValues, setRadarValues] = useState((b.radarValues || [4.5,4.5,4.5,4.5,4.5]).join(','))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [sched, setSched] = useState<DaySchedule[]>(DAY_DEFAULTS.map(d => ({...d})))
  const [schedLoaded, setSchedLoaded] = useState(false)

  // Update fields if barber data changes (after reload)
  React.useEffect(() => {
    setLevel(b.level || '')
    setPrice(b.basePrice || '')
    setAbout(b.about || '')
    setPublicRole(b.publicRole || b.level || '')
    setRadarLabels((b.radarLabels || ['FADE','LONG','BEARD','STYLE','DETAIL']).join(','))
    setRadarValues((b.radarValues || [4.5,4.5,4.5,4.5,4.5]).join(','))
  }, [b.id, b.level, b.about])

  function handleOpen() {
    setOpen(v => !v)
    if (!schedLoaded) {
      // Try to load schedule from API
      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      fetch(`https://element-crm-api-431945333485.us-central1.run.app/api/barbers`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        const list = Array.isArray(data) ? data : (data?.barbers || [])
        const raw = list.find((x: any) => String(x.id) === String(b.id))
        if (raw?.schedule?.perDay && Array.isArray(raw.schedule.perDay) && raw.schedule.perDay.length === 7) {
          setSched(raw.schedule.perDay.map((d: any) => ({ enabled: !!d.enabled, startMin: Number(d.startMin)||10*60, endMin: Number(d.endMin)||20*60 })))
        } else if (raw?.schedule?.days) {
          const days: number[] = raw.schedule.days
          setSched(DAY_DEFAULTS.map((def, i) => ({ ...def, enabled: days.includes(i), startMin: raw.schedule.startMin || 10*60, endMin: raw.schedule.endMin || 20*60 })))
        }
        setSchedLoaded(true)
      }).catch(() => setSchedLoaded(true))
    }
  }

  function handlePhoto(file: File | null) {
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX/img.width, MAX/img.height)
        const w = Math.round(img.width*scale), h = Math.round(img.height*scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.82, out = canvas.toDataURL('image/jpeg', q)
        while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
        setPhotoPreview(out)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    setSaving(true)
    try {
      const enabledDays = sched.map((d, i) => d.enabled ? i : -1).filter(i => i >= 0)
      const startMins = sched.filter(d => d.enabled).map(d => d.startMin)
      const endMins = sched.filter(d => d.enabled).map(d => d.endMin)
      const schedPayload = {
        startMin: startMins.length ? Math.min(...startMins) : 10*60,
        endMin: endMins.length ? Math.max(...endMins) : 20*60,
        days: enabledDays, perDay: sched
      }
      const rLabels = radarLabels.split(',').map(s => s.trim()).filter(Boolean)
      const rValues = radarValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      const photoUrl = photoPreview || b.photo || ''

      const token = localStorage.getItem('ELEMENT_TOKEN') || ''
      const res = await fetch(`https://element-crm-api-431945333485.us-central1.run.app/api/barbers/${encodeURIComponent(b.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          level, base_price: price,
          public_role: publicRole || level,
          about, description: about, bio: about,
          radar_labels: rLabels.length ? rLabels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
          radar_values: rValues.length ? rValues : [4.5,4.5,4.5,4.5,4.5],
          photo_url: photoUrl,
          schedule: schedPayload, work_schedule: schedPayload,
          public_off_days: DAY_NAMES.filter((_, i) => !sched[i].enabled),
          public_enabled: true
        })
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
      setPhotoFile(null); setPhotoPreview('')
      onSaved()
    } catch (e: any) { onError(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${open ? 'rgba(10,132,255,.35)' : 'rgba(255,255,255,.10)'}`, background: open ? 'rgba(10,132,255,.04)' : 'rgba(0,0,0,.14)', transition: 'all .18s' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {(photoPreview || b.photo)
            ? <img src={photoPreview || b.photo} alt={b.name} style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
            : <div style={{ width: 48, height: 48, borderRadius: 12, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, flexShrink: 0, color: '#fff' }}>{b.name[0]}</div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 2 }}>
              {b.level || 'Barber'}{b.basePrice ? ` · $${b.basePrice}` : ''}{b.username ? ` · @${b.username}` : ''}
            </div>
            {b.about && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{b.about}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleOpen} style={{ ...btnStyle, borderColor: open ? 'rgba(10,132,255,.55)' : undefined, background: open ? 'rgba(10,132,255,.12)' : undefined, color: open ? '#d7ecff' : undefined }}>
            {open ? 'Collapse' : 'Edit'}
          </button>
          <button onClick={() => onDelete(b.id, b.name)} style={dangerBtnStyle}>Remove</button>
        </div>
      </div>

      {/* Edit form */}
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Level / Rank</label>
              <input value={level} onChange={e => setLevel(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Base price ($)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} placeholder="55.99" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Public role</label>
              <input value={publicRole} onChange={e => setPublicRole(e.target.value)} placeholder="Ambassador" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Radar labels</label>
              <input value={radarLabels} onChange={e => setRadarLabels(e.target.value)} placeholder="FADE,LONG,BEARD,STYLE,DETAIL" style={inputStyle} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>About / Bio (shown on public website)</label>
              <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3}
                placeholder="Precision fades. Clean silhouette. Premium finish — built for clients who want it perfect from every angle."
                style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' as const, lineHeight: 1.5 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Radar values (0–5, comma separated)</label>
              <input value={radarValues} onChange={e => setRadarValues(e.target.value)} placeholder="4.5,4.5,4.5,4.5,4.5" style={inputStyle} />
            </div>

            {/* Photo */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ height: 40, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {photoFile ? photoFile.name : 'Change photo…'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0] || null)} />
                </label>
                {(photoPreview || b.photo) && <img src={photoPreview || b.photo} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)' }} onError={e => (e.currentTarget.style.display='none')} />}
                {photoPreview && <button onClick={() => { setPhotoFile(null); setPhotoPreview('') }} style={{ ...dangerBtnStyle, height: 30, padding: '0 10px', fontSize: 11 }}>✕</button>}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Working schedule</label>
            <SchedGrid schedule={sched} onChange={setSched} />
          </div>

          <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, width: '100%', height: 44, marginTop: 12 }}>
            {saving ? 'Saving…' : 'Save changes — update on website'}
          </button>
        </div>
      )}
    </div>
  )
}


// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
function SettingsModal({
  barbers, services, onClose, onReload
}: {
  barbers: Barber[]
  services: Service[]
  onClose: () => void
  onReload: () => void
}) {
  const [tab, setTab] = useState<'barbers'|'services'|'clients'|'account'>('barbers')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Barber form
  const [bName, setBName] = useState('')
  const [bLevel, setBLevel] = useState('')
  const [bUsername, setBUsername] = useState('')
  const [bPassword, setBPassword] = useState('')
  const [bPrice, setBPrice] = useState('')
  const [bPhotoFile, setBPhotoFile] = useState<File | null>(null)
  const [bPhotoPreview, setBPhotoPreview] = useState('')
  const [bAbout, setBAbout] = useState('')
  const [bPublicRole, setBPublicRole] = useState('')
  const [bRadarLabels, setBRadarLabels] = useState('FADE,LONG,BEARD,STYLE,DETAIL')
  const [bRadarValues, setBRadarValues] = useState('4.5,4.5,4.5,4.5,4.5')
  const [bSchedule, setBSchedule] = useState<DaySchedule[]>(DAY_DEFAULTS.map(d => ({...d})))

  function handlePhotoChange(file: File | null) {
    if (!file) return
    setBPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX/img.width, MAX/img.height)
        const w = Math.round(img.width*scale), h = Math.round(img.height*scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.82, out = canvas.toDataURL('image/jpeg', q)
        while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
        setBPhotoPreview(out)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  // Service form
  const [sName, setSName] = useState('')
  const [sDur, setSDur] = useState('30')
  const [sPrice, setSPrice] = useState('')
  const [sBarber, setSBarber] = useState(barbers[0]?.id || '')

  // Client form
  const [cName, setCName] = useState('')
  const [cPhone, setCPhone] = useState('')
  const [cNotes, setCNotes] = useState('')
  const [clients, setClients] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_CRM_CLIENTS_V1') || '[]') } catch { return [] }
  })

  function saveClients(list: any[]) {
    localStorage.setItem('ELEMENT_CRM_CLIENTS_V1', JSON.stringify(list))
    setClients(list)
  }

  async function addBarber() {
    if (!bName.trim()) { setMsg('Name is required'); return }
    if (!bPassword.trim()) { setMsg('Password is required'); return }
    setSaving(true); setMsg('')
    try {
      const enabledDays = bSchedule.map((d, i) => d.enabled ? i : -1).filter(i => i >= 0)
      const startMins = bSchedule.filter(d => d.enabled).map(d => d.startMin)
      const endMins = bSchedule.filter(d => d.enabled).map(d => d.endMin)
      const schedPayload = {
        startMin: startMins.length ? Math.min(...startMins) : 10*60,
        endMin: endMins.length ? Math.max(...endMins) : 20*60,
        days: enabledDays, perDay: bSchedule
      }
      const radarLabels = bRadarLabels.split(',').map(s => s.trim()).filter(Boolean)
      const radarValues = bRadarValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      await apiFetch('/api/barbers', {
        method: 'POST',
        body: JSON.stringify({
          name: bName.trim(),
          level: bLevel.trim(),
          username: bUsername.trim() || bName.toLowerCase().replace(/\s+/g, '.'),
          password: bPassword.trim(),
          barber_pin: bPassword.trim(),
          base_price: bPrice.trim(),
          public_role: bPublicRole.trim() || bLevel.trim(),
          about: bAbout.trim(),
          description: bAbout.trim(),
          bio: bAbout.trim(),
          radar_labels: radarLabels.length ? radarLabels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
          radar_values: radarValues.length ? radarValues : [4.5,4.5,4.5,4.5,4.5],
          active: true,
          public_enabled: true,
          photo_url: bPhotoPreview || '',
          schedule: schedPayload,
          work_schedule: schedPayload,
          public_off_days: DAY_NAMES.filter((_, i) => !bSchedule[i].enabled)
        })
      })
      setMsg('Barber added ✓ — visible on website')
      setBName(''); setBLevel(''); setBUsername(''); setBPassword(''); setBPrice('')
      setBAbout(''); setBPublicRole('')
      setBRadarLabels('FADE,LONG,BEARD,STYLE,DETAIL'); setBRadarValues('4.5,4.5,4.5,4.5,4.5')
      setBSchedule(DAY_DEFAULTS.map(d => ({...d})))
      setBPhotoFile(null); setBPhotoPreview('')
      onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  async function deleteBarber(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    try {
      await apiFetch(`/api/barbers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ active: false }) })
      setMsg('Barber removed'); onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
  }

  async function addService() {
    if (!sName.trim()) { setMsg('Service name required'); return }
    if (!sBarber) { setMsg('Choose barber'); return }
    setSaving(true); setMsg('')
    try {
      const price_cents = Math.round(Number(sPrice.replace(/[^\d.]/g,'') || 0) * 100)
      const existing = services.find(s => s.name.toLowerCase() === sName.trim().toLowerCase())
      if (existing) {
        const ids = new Set(existing.barberIds); ids.add(sBarber)
        await apiFetch(`/api/services/${encodeURIComponent(existing.id)}`, { method: 'PATCH', body: JSON.stringify({ barber_ids: Array.from(ids), duration_minutes: Number(sDur), price_cents }) })
      } else {
        await apiFetch('/api/services', { method: 'POST', body: JSON.stringify({ name: sName.trim(), duration_minutes: Number(sDur), price_cents, version: '1', barber_ids: [sBarber] }) })
      }
      setMsg('Service saved ✓'); setSName(''); setSPrice(''); onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  async function deleteService(id: string, name: string) {
    if (!confirm(`Delete service ${name}?`)) return
    try {
      await apiFetch(`/api/services/${encodeURIComponent(id)}`, { method: 'DELETE' })
      setMsg('Service deleted'); onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
  }

  function addClient() {
    if (!cName.trim()) { setMsg('Client name required'); return }
    const list = [...clients]
    const idx = list.findIndex(c => c.name.toLowerCase() === cName.trim().toLowerCase())
    if (idx >= 0) { list[idx] = { ...list[idx], phone: cPhone || list[idx].phone, notes: cNotes || list[idx].notes } }
    else { list.unshift({ id: 'c_' + Date.now(), name: cName.trim(), phone: cPhone, notes: cNotes }) }
    saveClients(list); setCName(''); setCPhone(''); setCNotes(''); setMsg('Client saved ✓')
  }

  function deleteClient(id: string) {
    saveClients(clients.filter(c => c.id !== id))
  }

  const inputStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif' }
  const labelStyle: React.CSSProperties = { fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6, display: 'block' }
  const btnStyle: React.CSSProperties = { height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }
  const dangerBtnStyle: React.CSSProperties = { ...btnStyle, borderColor: 'rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0' }
  const primaryBtnStyle: React.CSSProperties = { ...btnStyle, borderColor: 'rgba(10,132,255,.75)', background: 'rgba(10,132,255,.14)', color: '#d7ecff' }

  const TABS = [
    { id: 'barbers', label: 'Barbers' },
    { id: 'services', label: 'Services' },
    { id: 'clients', label: 'Clients' },
    { id: 'account', label: 'Account' },
  ] as const

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 18, overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(920px, 96vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.03))', backdropFilter: 'blur(18px)', padding: 16, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', color: '#e9e9e9', fontFamily: 'Inter, sans-serif' }}>

        <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.60)', marginBottom: 12 }}>Settings</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>Services · Barbers · Clients</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setMsg('') }}
              style={{ height: 34, padding: '0 14px', borderRadius: 999, border: `1px solid ${tab === t.id ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.12)'}`, background: tab === t.id ? 'rgba(10,132,255,.12)' : 'rgba(255,255,255,.04)', color: tab === t.id ? '#d7ecff' : 'rgba(255,255,255,.85)', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 12 }}>
              {t.label}
            </button>
          ))}
        </div>

        {msg && <div style={{ padding: '8px 12px', borderRadius: 10, background: msg.includes('Error') ? 'rgba(255,107,107,.08)' : 'rgba(143,240,177,.08)', border: `1px solid ${msg.includes('Error') ? 'rgba(255,107,107,.25)' : 'rgba(143,240,177,.25)'}`, color: msg.includes('Error') ? '#ffd0d0' : '#c9ffe1', fontSize: 12, marginBottom: 12 }}>{msg}</div>}

        {/* ── BARBERS TAB ── */}
        {tab === 'barbers' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>Add new barber with login and PIN.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Barber name *', val: bName, set: setBName, ph: 'Nazar' },
                { label: 'Level / Rank', val: bLevel, set: setBLevel, ph: 'Senior / Expert / Ambassador' },
                { label: 'Login', val: bUsername, set: setBUsername, ph: 'nazar' },
                { label: 'Password / PIN *', val: bPassword, set: setBPassword, ph: '1234' },
                { label: 'Base price ($)', val: bPrice, set: setBPrice, ph: '55.99' },
                { label: 'Public role', val: bPublicRole, set: setBPublicRole, ph: 'Ambassador' },
              ].map(f => (
                <div key={f.label}>
                  <label style={labelStyle}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle} />
                </div>
              ))}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>About / Bio (shown on public website)</label>
                <textarea value={bAbout} onChange={e => setBAbout(e.target.value)}
                  placeholder="Precision fades. Clean silhouette. Premium finish — built for clients who want it perfect from every angle."
                  rows={3}
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' as const, lineHeight: 1.5 }} />
              </div>
              <div>
                <label style={labelStyle}>Radar labels (comma separated)</label>
                <input value={bRadarLabels} onChange={e => setBRadarLabels(e.target.value)} placeholder="FADE,LONG,BEARD,STYLE,DETAIL" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Radar values (0–5, comma separated)</label>
                <input value={bRadarValues} onChange={e => setBRadarValues(e.target.value)} placeholder="4.5,4.5,4.5,4.5,4.5" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ height: 44, padding: '0 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                    {bPhotoFile ? bPhotoFile.name : 'Choose photo…'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoChange(e.target.files?.[0] || null)} />
                  </label>
                  {bPhotoPreview && (
                    <img src={bPhotoPreview} alt="preview" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} />
                  )}
                  {bPhotoPreview && (
                    <button onClick={() => { setBPhotoFile(null); setBPhotoPreview('') }} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>✕</button>
                  )}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={addBarber} disabled={saving} style={{ ...primaryBtnStyle, width: '100%', height: 44 }}>
                  {saving ? 'Adding…' : '+ Add barber'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Current barbers ({barbers.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {barbers.map(b => (
                <BarberEditCard
                  key={b.id}
                  b={b}
                  onDelete={deleteBarber}
                  onSaved={() => { setMsg('Saved ✓ — updated on website'); onReload() }}
                  onError={(e: string) => setMsg('Error: ' + e)}
                  inputStyle={inputStyle}
                  labelStyle={labelStyle}
                  btnStyle={btnStyle}
                  primaryBtnStyle={primaryBtnStyle}
                  dangerBtnStyle={dangerBtnStyle}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── SERVICES TAB ── */}
        {tab === 'services' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>Create services and assign them to barbers.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Service name</label>
                <input value={sName} onChange={e => setSName(e.target.value)} placeholder="Men's Haircut" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Duration (min)</label>
                <select value={sDur} onChange={e => setSDur(e.target.value)} style={{ ...inputStyle }}>
                  {['30','40','45','60','75','90'].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Price ($)</label>
                <input value={sPrice} onChange={e => setSPrice(e.target.value)} placeholder="45" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Assign to barber</label>
                <select value={sBarber} onChange={e => setSBarber(e.target.value)} style={{ ...inputStyle }}>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button onClick={addService} disabled={saving} style={{ ...primaryBtnStyle, width: '100%', height: 44 }}>
                  {saving ? 'Saving…' : '+ Add / Assign service'}
                </button>
              </div>
            </div>

            <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Current services</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {services.length === 0 && <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>No services yet</div>}
              {services.map(s => {
                const assigned = s.barberIds.map(id => barbers.find(b => b.id === id)?.name).filter(Boolean)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.18)', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: 13 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                        {s.durationMin}min{s.price ? ` · $${s.price}` : ''} · {assigned.length ? assigned.join(', ') : '—'}
                      </div>
                    </div>
                    <button onClick={() => deleteService(s.id, s.name)} style={dangerBtnStyle}>Delete</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CLIENTS TAB ── */}
        {tab === 'clients' && (
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: 12 }}>Client database (saved locally).</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Client name</label>
                <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Client name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input value={cPhone} onChange={e => setCPhone(e.target.value)} placeholder="+1 (___) ___-____" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <input value={cNotes} onChange={e => setCNotes(e.target.value)} placeholder="Notes…" style={inputStyle} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button onClick={addClient} style={{ ...primaryBtnStyle, width: '100%', height: 44 }}>+ Add client</button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
              {clients.length === 0 && <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 13 }}>No clients yet</div>}
              {clients.slice(0, 100).map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.18)', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>{c.phone || '—'}{c.notes ? ' · ' + c.notes : ''}</div>
                  </div>
                  <button onClick={() => deleteClient(c.id)} style={dangerBtnStyle}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACCOUNT TAB ── */}
        {tab === 'account' && (
          <div>
            <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.18)', marginBottom: 10 }}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>Current session</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
                {(() => { try { const u = JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null'); return u ? `${u.role} · ${u.name || u.username}` : 'Guest' } catch { return 'Guest' } })()}
              </div>
            </div>
            <button onClick={() => {
              localStorage.removeItem('ELEMENT_TOKEN')
              localStorage.removeItem('ELEMENT_USER')
              window.location.href = '/signin'
            }} style={{ ...dangerBtnStyle, height: 44, width: '100%' }}>Log out</button>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={onClose} style={btnStyle}>Close</button>
        </div>
      </div>
    </div>
  )
}
