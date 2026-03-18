'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Shell from '@/components/Shell'
import { BookingModal } from '@/app/calendar/booking-modal'

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

// ─── Constants ────────────────────────────────────────────────────────────────
function timeStrToMin(s: string) { const [h,m] = s.split(':').map(Number); return (h||0)*60+(m||0) }

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch('https://element-crm-api-431945333485.us-central1.run.app' + path, {
    ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── DATE PICKER ─────────────────────────────────────────────────────────────
function DatePickerModal({ current, onSelect, onClose }: { current: Date; onSelect: (d: Date) => void; onClose: () => void }) {
  const [month, setMonth] = useState(() => { const d = new Date(current); d.setDate(1); d.setHours(0,0,0,0); return d })
  const today = new Date(); today.setHours(0,0,0,0)
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
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()-1); setMonth(m) }} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>←</button>
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()+1); setMonth(m) }} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>→</button>
          </div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => { const t = new Date(); t.setDate(1); t.setHours(0,0,0,0); setMonth(t) }} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Today</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginBottom: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', padding: '4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth()
            const isToday = +d === +today
            const isSel = d.toDateString() === current.toDateString()
            return <button key={i} onClick={() => { onSelect(d); onClose() }} style={{ ...btn, opacity: inMonth ? 1 : 0.35, borderColor: isSel ? 'rgba(10,132,255,.75)' : isToday ? 'rgba(255,207,63,.55)' : 'rgba(255,255,255,.12)', background: isSel ? 'rgba(10,132,255,.12)' : 'rgba(0,0,0,.18)', boxShadow: isSel ? '0 0 0 1px rgba(10,132,255,.22) inset' : 'none' }}>{d.getDate()}</button>
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
            <button onClick={() => toggle(i)} style={{ height: 28, borderRadius: 999, border: `1px solid ${day.enabled ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.16)'}`, background: day.enabled ? 'rgba(10,132,255,.16)' : 'rgba(255,255,255,.05)', color: day.enabled ? '#d7ecff' : '#fff', cursor: 'pointer', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 900, fontFamily: 'inherit', width: '100%' }}>{day.enabled ? 'ON' : 'OFF'}</button>
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
  return <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, whiteSpace: 'nowrap' as const }}>{label}</span>
}

// ─── MAIN CALENDAR PAGE ──────────────────────────────────────────────────────
export default function CalendarPage() {
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [events, setEvents] = useState<CalEvent[]>([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalState>({ open: false, eventId: null, isNew: false })
  const [nowMin, setNowMin] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drag, setDrag] = useState<{ eventId: string; offsetMin: number; ghostBarberIdx: number; ghostMin: number } | null>(null)
  const [dragConfirm, setDragConfirm] = useState<{ eventId: string; newBarberId: string; newBarberName: string; newMin: number } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; barberId: string; min: number } | null>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])

  const [currentUser] = useState<{ uid: string; name: string; username: string; role: string; barber_id?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null') } catch { return null }
  })
  const isBarber = currentUser?.role === 'barber'
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  const myBarberId = currentUser?.barber_id || ''

  const todayStr = isoDate(anchor)
  const selectedEvent = events.find(e => e.id === modal.eventId) || null

  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()) }
    tick(); const t = setInterval(tick, 30000); return () => clearInterval(t)
  }, [])

  const loadBarbers = useCallback(async () => {
    const data = await apiFetch('/api/barbers')
    const list = Array.isArray(data) ? data : (data?.barbers || [])
    return list.map((b: any, i: number) => ({
      id: String(b.id || ''), name: String(b.name || b.full_name || b.id || '').trim(),
      level: String(b.level || '').trim(), photo: String(b.photo_url || b.photoUrl || b.photo || '').trim(),
      color: BARBER_COLORS[i % BARBER_COLORS.length], serverId: String(b.id || ''),
      about: String(b.about || b.description || '').trim(), basePrice: String(b.base_price || '').trim(),
      publicRole: String(b.public_role || '').trim(),
      radarLabels: Array.isArray(b.radar_labels) ? b.radar_labels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
      radarValues: Array.isArray(b.radar_values) ? b.radar_values.map(Number) : [4.5,4.5,4.5,4.5,4.5],
      username: String(b.username || '').trim(),
    })).filter((b: Barber) => b.id && b.name)
  }, [])

  const loadServices = useCallback(async () => {
    const data = await apiFetch('/api/services')
    const list = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : []
    return list.map((s: any) => {
      const durMs = s.durationMs ?? (s.duration_minutes != null ? s.duration_minutes * 60000 : 0)
      const durMin = Math.max(1, Math.round(durMs / 60000) || 30)
      const priceStr = s.price != null ? String(s.price) : s.price_cents > 0 ? (s.price_cents / 100).toFixed(2) : ''
      return { id: String(s.id || ''), name: String(s.name || ''), durationMin: durMin, price: priceStr, barberIds: (s.barberIds || s.barber_ids || []).map(String) }
    }).filter((s: Service) => s.name)
  }, [])

  const loadBookings = useCallback(async (barbersArg: Barber[], servicesArg: Service[]) => {
    const data = await apiFetch(`/api/bookings?from=${todayStr}T00:00:00.000Z&to=${todayStr}T23:59:59.999Z`)
    const list = Array.isArray(data?.bookings) ? data.bookings : Array.isArray(data) ? data : []
    return list.map((b: any) => {
      const startAt = b.start_at ? new Date(b.start_at) : null
      const startMin = startAt ? startAt.getHours() * 60 + startAt.getMinutes() : clamp(10 * 60)
      const svc = servicesArg.find(s => s.id === (b.service_id || b.serviceId))
      const barber = barbersArg.find(br => br.id === (b.barber_id || b.barberId))
      const isBlock = b.status === 'block' || b.type === 'block'
      const durMin = isBlock
        ? (b.end_at ? Math.round((new Date(b.end_at).getTime() - (startAt?.getTime() || 0)) / 60000) : 30)
        : (svc?.durationMin || 30)
      return {
        id: b.id || b.booking_id || uid(),
        type: isBlock ? 'block' as const : 'booking' as const,
        barberId: String(b.barber_id || b.barberId || ''),
        barberName: barber?.name || String(b.barber_name || ''),
        clientName: String(b.client_name || b.clientName || 'Client'),
        clientPhone: String(b.client_phone || ''),
        serviceId: String(b.service_id || b.serviceId || ''),
        serviceName: svc?.name || String(b.service_name || ''),
        date: b.start_at ? b.start_at.slice(0, 10) : todayStr,
        startMin: clamp(startMin), durMin: Math.max(5, durMin),
        status: String(b.status || 'booked'),
        paid: !!(b.paid || b.is_paid || b.payment_status === 'paid'),
        paymentMethod: String(b.payment_method || ''),
        notes: String(b.notes || b.customer_note || ''),
        tipAmount: Number(b.tip || b.tip_amount || 0),
        _raw: b,
      } as CalEvent
    })
  }, [todayStr])

  const reloadAll = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([loadBarbers(), loadServices()])
      setBarbers(b); setServices(s)
      const evs = await loadBookings(b, s); setEvents(evs)
    } catch (err) { console.warn(err) }
  }, [loadBarbers, loadServices, loadBookings])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadBarbers(), loadServices()]).then(async ([b, s]) => {
      setBarbers(b); setServices(s)
      const evs = await loadBookings(b, s); setEvents(evs); setLoading(false)
    }).catch(err => { console.warn(err); setLoading(false) })
  }, [todayStr])

  const reload = useCallback(() => {
    if (!barbers.length) return
    loadBookings(barbers, services).then(setEvents).catch(console.warn)
  }, [barbers, services, loadBookings])

  const totalSlots = (END_HOUR - START_HOUR) * 12
  const totalH = totalSlots * SLOT_H
  const minToY = (min: number) => ((min - START_HOUR * 60) / 5) * SLOT_H
  const nowY = minToY(nowMin)
  const showNow = nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60

  const todayEvents = events.filter(e => {
    if (e.date !== todayStr) return false
    if (isBarber && e.type !== 'block' && e.barberId !== myBarberId) return false
    return true
  })
  const filtered = search
    ? todayEvents.filter(e => [e.clientName, e.barberName, e.serviceName].join(' ').toLowerCase().includes(search.toLowerCase()))
    : todayEvents

  // ── Drag ─────────────────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent, ev: CalEvent, barberIdx: number) {
    e.preventDefault(); e.stopPropagation()
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const col = colRefs.current[barberIdx]; if (!col) return
    const rect = col.getBoundingClientRect()
    const clickedMin = Math.round((clientY - rect.top) / SLOT_H) * 5 + START_HOUR * 60
    setDrag({ eventId: ev.id, offsetMin: clickedMin - ev.startMin, ghostBarberIdx: barberIdx, ghostMin: ev.startMin })
  }

  function onDragMove(e: MouseEvent | TouchEvent) {
    if (!drag) return
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    let newBarberIdx = drag.ghostBarberIdx
    colRefs.current.forEach((col, i) => {
      if (!col) return
      const rect = col.getBoundingClientRect()
      if (clientX >= rect.left && clientX <= rect.right) newBarberIdx = i
    })
    const col = colRefs.current[newBarberIdx]; if (!col) return
    const rect = col.getBoundingClientRect()
    const rawMin = Math.round((clientY - rect.top) / SLOT_H) * 5 + START_HOUR * 60 - drag.offsetMin
    setDrag(d => d ? { ...d, ghostBarberIdx: newBarberIdx, ghostMin: Math.max(START_HOUR * 60, Math.min(rawMin, END_HOUR * 60 - 5)) } : d)
  }

  function onDragEnd() {
    if (!drag) return
    const ev = events.find(e => e.id === drag.eventId); if (!ev) { setDrag(null); return }
    const newBarber = barbers[drag.ghostBarberIdx]; if (!newBarber) { setDrag(null); return }
    if (newBarber.id !== ev.barberId || drag.ghostMin !== ev.startMin) {
      setDragConfirm({ eventId: ev.id, newBarberId: newBarber.id, newBarberName: newBarber.name, newMin: drag.ghostMin })
    }
    setDrag(null)
  }

  async function confirmDragMove() {
    if (!dragConfirm) return
    const ev = events.find(e => e.id === dragConfirm.eventId); if (!ev) { setDragConfirm(null); return }
    const newBarber = barbers.find(b => b.id === dragConfirm.newBarberId)
    const updated = { ...ev, barberId: dragConfirm.newBarberId, barberName: newBarber?.name || ev.barberName, startMin: dragConfirm.newMin }
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e)); setDragConfirm(null)
    if (ev._raw?.id) {
      try {
        const startAt = new Date(updated.date + 'T' + minToHHMM(updated.startMin) + ':00')
        await apiFetch('/api/bookings/' + encodeURIComponent(String(ev._raw.id)), {
          method: 'PATCH',
          body: JSON.stringify({ barber_id: updated.barberId, start_at: startAt.toISOString(), ...(updated.type === 'block' ? { end_at: new Date(startAt.getTime() + updated.durMin * 60000).toISOString() } : {}) })
        })
      } catch (err: any) { console.warn('drag patch:', err.message) }
    }
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: MouseEvent | TouchEvent) => onDragMove(e)
    const end = () => onDragEnd()
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end)
    }
  }, [drag, events, barbers])

  // ── Create / Block ────────────────────────────────────────────────────────
  function openCreateBlock(barberId: string, startMin: number) {
    const id = 'block_' + Date.now()
    const barber = barbers.find(b => b.id === barberId)
    const blockEv: CalEvent = {
      id, type: 'block', barberId, barberName: barber?.name || '',
      clientName: 'BLOCKED', clientPhone: '', serviceId: '', serviceName: 'Blocked',
      date: todayStr, startMin: clamp(startMin), durMin: 30,
      status: 'block', paid: false, notes: '', _raw: null
    }
    setEvents(prev => [...prev, blockEv])
    const startAt = new Date(todayStr + 'T' + minToHHMM(clamp(startMin)) + ':00')
    apiFetch('/api/bookings', {
      method: 'POST',
      body: JSON.stringify({ barber_id: barberId, type: 'block', status: 'block', client_name: 'BLOCKED', service_id: '', start_at: startAt.toISOString(), end_at: new Date(startAt.getTime() + 30 * 60000).toISOString(), notes: 'Blocked by manager' })
    }).then(res => {
      const savedId = res?.booking?.id || res?.id
      if (savedId) setEvents(prev => prev.map(e => e.id === id ? { ...e, _raw: { id: savedId } } : e))
    }).catch(console.warn)
  }

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

  async function handleSave(patch: any) {
    const ev = events.find(e => e.id === modal.eventId); if (!ev) return
    const updated = { ...ev, ...patch }
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e))
    const isNew = !ev._raw?.id
    try {
      if (isNew) {
        const startAt = new Date(updated.date + 'T' + minToHHMM(updated.startMin) + ':00')
        const res = await apiFetch('/api/bookings', {
          method: 'POST',
          body: JSON.stringify({ barber_id: updated.barberId, service_id: updated.serviceId, client_name: updated.clientName, client_phone: updated.clientPhone || '', start_at: startAt.toISOString(), notes: updated.notes || '', status: 'booked', reference_photo_url: updated.photoUrl || '' })
        })
        const savedId = res?.booking?.id || res?.id
        if (savedId) setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, _raw: res?.booking || { id: savedId }, id: String(savedId) } : e))
      } else {
        await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, {
          method: 'PATCH',
          body: JSON.stringify({ barber_id: updated.barberId, service_id: updated.serviceId, client_name: updated.clientName, client_phone: updated.clientPhone || '', status: updated.status, notes: updated.notes || '', reference_photo_url: updated.photoUrl || '' })
        })
      }
    } catch (err: any) { console.warn('save:', err.message) }
    setModal({ open: false, eventId: null, isNew: false })
  }

  async function handleDelete() {
    const ev = events.find(e => e.id === modal.eventId); if (!ev) return
    if (!window.confirm('Delete this booking?')) return
    setEvents(prev => prev.filter(e => e.id !== ev.id))
    setModal({ open: false, eventId: null, isNew: false })
    if (ev._raw?.id) {
      try { await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, { method: 'DELETE' }) }
      catch (err: any) { console.warn('delete:', err.message) }
    }
  }

  function handlePayment(method: string, tip: number) {
    setEvents(prev => prev.map(e => e.id === modal.eventId ? { ...e, paid: true, paymentMethod: method, tipAmount: tip } : e))
  }

  return (
    <Shell page="calendar">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        .cal-event:hover { filter: brightness(1.12); }
        input[type=date],input[type=time] { color-scheme: dark; }
        select option { background: #111; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Topbar */}
        <div style={{ padding: '10px 18px 12px', background: 'linear-gradient(to bottom,rgba(0,0,0,.90),rgba(0,0,0,.70))', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Calendar</h2>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase' }}>
                {anchor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {[
                { label: 'Date', onClick: () => setDatePickerOpen(true) },
                { label: '←', onClick: () => setAnchor(a => { const x = new Date(a); x.setDate(x.getDate()-1); return x }) },
                { label: 'Today', onClick: () => { const d = new Date(); d.setHours(0,0,0,0); setAnchor(d) } },
                { label: '→', onClick: () => setAnchor(a => { const x = new Date(a); x.setDate(x.getDate()+1); return x }) },
              ].map(b => (
                <button key={b.label} onClick={b.onClick} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>{b.label}</button>
              ))}
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                style={{ height: 40, width: 'min(240px,50vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />
              {isOwnerOrAdmin && (
                <button onClick={() => setSettingsOpen(true)} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>Settings</button>
              )}
              <button onClick={() => {
                const barberId = isBarber ? myBarberId : (barbers[0]?.id || '')
                openCreate(barberId, clamp(new Date().getHours() * 60))
              }} style={{ height: 40, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(0,0,0,.75)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', boxShadow: '0 0 18px rgba(10,132,255,.25)' }}>
                + New booking
              </button>
              <button onClick={reload} style={{ height: 40, width: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>↻</button>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
          <div style={{ minWidth: 90 + barbers.length * COL_MIN }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${barbers.length}, minmax(${COL_MIN}px, 1fr))`, borderBottom: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.20)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', borderRight: '1px solid rgba(255,255,255,.10)' }}>Time</div>
              {barbers.map((b, i) => (
                <div key={b.id} style={{ padding: '10px 12px', borderRight: i < barbers.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {b.photo ? <img src={b.photo} alt={b.name} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
                    : <div style={{ width: 10, height: 10, borderRadius: 999, background: b.color, flexShrink: 0 }} />}
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</div>
                    {b.level && <div style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>{b.level}</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: `90px repeat(${barbers.length}, minmax(${COL_MIN}px, 1fr))`, height: totalH, position: 'relative' }}>
              {/* Time labels */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.12)', position: 'relative' }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H * 12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>
                    {pad2(START_HOUR + i)}:00
                  </div>
                ))}
              </div>

              {/* Barber columns */}
              {barbers.map((barber, bi) => {
                const colEvents = filtered.filter(e => e.barberId === barber.id)
                return (
                  <div key={barber.id} ref={el => { colRefs.current[bi] = el }}
                    style={{ position: 'relative', borderRight: bi < barbers.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none', background: drag?.ghostBarberIdx === bi ? 'rgba(10,132,255,.03)' : 'rgba(0,0,0,.06)', transition: 'background .15s' }}
                    onClick={e => {
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      if (isBarber && barber.id !== myBarberId) return
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                      const min = Math.round((e.clientY - rect.top) / SLOT_H) * 5 + START_HOUR * 60
                      if (isOwnerOrAdmin) {
                        setContextMenu({ x: e.clientX, y: e.clientY, barberId: barber.id, min: clamp(min) })
                      } else {
                        openCreate(barber.id, clamp(min))
                      }
                    }}>

                    {/* Grid lines */}
                    {Array.from({ length: (END_HOUR - START_HOUR) * 12 }, (_, i) => (
                      <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i * SLOT_H, height: 1, background: i % 12 === 0 ? 'rgba(255,255,255,.12)' : i % 4 === 0 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)', pointerEvents: 'none' }} />
                    ))}

                    {/* Now line */}
                    {showNow && bi === 0 && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: nowY, height: 2, background: 'rgba(10,132,255,.95)', boxShadow: '0 0 22px rgba(10,132,255,.35)', pointerEvents: 'none', zIndex: 20 }}>
                        <div style={{ position: 'absolute', left: 8, top: -4, width: 10, height: 10, borderRadius: 999, background: '#0a84ff', boxShadow: '0 0 0 3px rgba(10,132,255,.18)' }} />
                      </div>
                    )}

                    {/* Ghost */}
                    {drag?.ghostBarberIdx === bi && (() => {
                      const dragEv = events.find(e => e.id === drag.eventId); if (!dragEv) return null
                      const ghostTop = minToY(drag.ghostMin)
                      const ghostH = Math.max(SLOT_H * 6, (dragEv.durMin / 5) * SLOT_H)
                      return (
                        <div style={{ position: 'absolute', left: 8, right: 8, top: ghostTop, height: ghostH - 2, borderRadius: 14, border: '2px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.12)', pointerEvents: 'none', zIndex: 40 }}>
                          <div style={{ padding: '6px 10px', fontWeight: 900, fontSize: 11, color: '#d7ecff' }}>{dragEv.clientName} — {minToHHMM(drag.ghostMin)}</div>
                        </div>
                      )
                    })()}

                    {/* Events */}
                    {colEvents.map(ev => {
                      const top = minToY(ev.startMin)
                      const height = Math.max(SLOT_H * 6, (ev.durMin / 5) * SLOT_H)
                      const isBlock = ev.type === 'block' || ev.status === 'block'
                      const canDrag = isBlock ? isOwnerOrAdmin : (!isBarber || ev.barberId === myBarberId)

                      if (isBlock) {
                        return (
                          <div key={ev.id}
                            style={{ position: 'absolute', left: 4, right: 4, top, height: height - 2, borderRadius: 10, background: 'repeating-linear-gradient(45deg,rgba(255,107,107,.10) 0px,rgba(255,107,107,.10) 6px,rgba(255,107,107,.04) 6px,rgba(255,107,107,.04) 12px)', border: `1px solid ${drag?.eventId === ev.id ? 'rgba(255,107,107,.70)' : 'rgba(255,107,107,.28)'}`, zIndex: drag?.eventId === ev.id ? 50 : 3, overflow: 'hidden', cursor: isOwnerOrAdmin ? (drag?.eventId === ev.id ? 'grabbing' : 'grab') : 'default', opacity: drag?.eventId === ev.id ? 0.5 : 1, userSelect: 'none' }}
                            onMouseDown={e => { if (!isOwnerOrAdmin || e.button !== 0) return; e.stopPropagation(); startDrag(e, ev, bi) }}
                            onTouchStart={e => { if (!isOwnerOrAdmin) return; e.stopPropagation(); startDrag(e, ev, bi) }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,107,107,.80)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                                <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,107,107,.80)', fontWeight: 900 }}>Blocked {minToHHMM(ev.startMin)}–{minToHHMM(ev.startMin + ev.durMin)}</span>
                              </div>
                              {isOwnerOrAdmin && (
                                <button onMouseDown={e => e.stopPropagation()}
                                  onClick={e => { e.stopPropagation(); setEvents(prev => prev.filter(x => x.id !== ev.id)); if (ev._raw?.id) apiFetch('/api/bookings/' + encodeURIComponent(String(ev._raw.id)), { method: 'DELETE' }).catch(console.warn) }}
                                  style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.10)', color: 'rgba(255,107,107,.90)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, fontFamily: 'inherit' }}>✕</button>
                              )}
                            </div>
                            {isOwnerOrAdmin && (
                              <div onMouseDown={e => {
                                e.stopPropagation(); e.preventDefault()
                                const startY = e.clientY, startDur = ev.durMin
                                const onMove = (me: MouseEvent) => { const addMin = Math.round((me.clientY - startY) / SLOT_H) * 5; setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, durMin: Math.max(5, startDur + addMin) } : x)) }
                                const onUp = () => {
                                  window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp)
                                  const updEv = events.find(x => x.id === ev.id)
                                  if (updEv?._raw?.id) { const startAt = new Date(updEv.date + 'T' + minToHHMM(updEv.startMin) + ':00'); apiFetch('/api/bookings/' + encodeURIComponent(String(updEv._raw.id)), { method: 'PATCH', body: JSON.stringify({ end_at: new Date(startAt.getTime() + updEv.durMin * 60000).toISOString() }) }).catch(console.warn) }
                                }
                                window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp)
                              }} style={{ position: 'absolute', left: 10, right: 10, bottom: 4, height: 8, borderRadius: 999, background: 'rgba(255,107,107,.25)', cursor: 'ns-resize' }} />
                            )}
                          </div>
                        )
                      }

                      return (
                        <div key={ev.id} className="cal-event"
                          style={{ position: 'absolute', left: 8, right: 8, top, height: height - 2, borderRadius: 14, border: `1px solid ${drag?.eventId === ev.id ? 'rgba(10,132,255,.75)' : 'rgba(255,255,255,.14)'}`, background: `linear-gradient(180deg,${barber.color}44,${barber.color}22)`, padding: '8px 10px', cursor: canDrag ? (drag ? 'grabbing' : 'grab') : 'pointer', userSelect: 'none', overflow: 'hidden', zIndex: drag?.eventId === ev.id ? 50 : 5, opacity: drag?.eventId === ev.id ? 0.5 : 1, transition: 'opacity .15s' }}
                          onMouseDown={e => { if (!canDrag || e.button !== 0) return; startDrag(e, ev, bi) }}
                          onTouchStart={e => { if (!canDrag) return; startDrag(e, ev, bi) }}
                          onClick={e => { e.stopPropagation(); if (!drag) setModal({ open: true, eventId: ev.id, isNew: false }) }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                              {isBarber ? ev.clientName : ev.clientName}
                            </div>
                            {ev.paid ? <Chip label="Paid" type="paid" /> : <Chip label={ev.status} type={ev.status} />}
                          </div>
                          {height > 40 && (
                            <div style={{ marginTop: 4, fontSize: 11, color: 'rgba(255,255,255,.70)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        {loading && <div style={{ position: 'fixed', bottom: 20, right: 20, padding: '8px 16px', borderRadius: 999, background: 'rgba(10,132,255,.20)', border: '1px solid rgba(10,132,255,.40)', color: '#d7ecff', fontSize: 12, zIndex: 99 }}>Loading…</div>}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setContextMenu(null)}>
          <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 151, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98))', backdropFilter: 'blur(18px)', boxShadow: '0 12px 40px rgba(0,0,0,.6)', padding: 6, minWidth: 190, fontFamily: 'Inter,sans-serif' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', padding: '6px 10px 4px' }}>
              {minToHHMM(contextMenu.min)} · {barbers.find(b => b.id === contextMenu.barberId)?.name}
            </div>
            {[
              { label: 'New booking', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d7ecff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, bg: 'rgba(10,132,255,.18)', border: 'rgba(10,132,255,.35)', color: '#e9e9e9', action: () => { setContextMenu(null); openCreate(contextMenu.barberId, contextMenu.min) } },
              { label: 'Block this time', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffd0d0" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, bg: 'rgba(255,107,107,.12)', border: 'rgba(255,107,107,.30)', color: '#ffd0d0', action: () => { setContextMenu(null); openCreateBlock(contextMenu.barberId, contextMenu.min) } },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: item.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = item.bg)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: item.bg, border: `1px solid ${item.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag confirm */}
      {dragConfirm && (() => {
        const ev = events.find(e => e.id === dragConfirm.eventId); if (!ev) return null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, backdropFilter: 'blur(12px)' }}>
            <div style={{ width: 'min(380px,92vw)', borderRadius: 22, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(28,28,28,.98),rgba(16,16,16,.98))', boxShadow: '0 24px 80px rgba(0,0,0,.55)', padding: 20, color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13, color: 'rgba(255,255,255,.70)', marginBottom: 14 }}>Move booking</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 4 }}>{dragConfirm.newBarberName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#0a84ff', letterSpacing: '.02em', marginBottom: 4 }}>{minToHHMM(dragConfirm.newMin)}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)' }}>{ev.clientName} · {ev.serviceName}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDragConfirm(null)} style={{ height: 40, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={confirmDragMove} style={{ height: 40, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.18)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13 }}>Move</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Date picker */}
      {datePickerOpen && (
        <DatePickerModal current={anchor} onSelect={d => { const x = new Date(d); x.setHours(0,0,0,0); setAnchor(x) }} onClose={() => setDatePickerOpen(false)} />
      )}

      {/* Settings */}
      {settingsOpen && (
        <SettingsModal barbers={barbers} services={services} onClose={() => setSettingsOpen(false)} onReload={reloadAll} />
      )}

      {/* Booking modal */}
      {modal.open && (
        <BookingModal
          isOpen={modal.open}
          barberId={selectedEvent?.barberId || barbers[0]?.id || ''}
          barberName={selectedEvent?.barberName || barbers[0]?.name || ''}
          date={selectedEvent?.date || todayStr}
          startMin={selectedEvent?.startMin || 9 * 60}
          barbers={barbers}
          services={services}
          isOwnerOrAdmin={isOwnerOrAdmin}
          myBarberId={myBarberId}
          existingEvent={selectedEvent ? {
            id: selectedEvent.id,
            clientName: selectedEvent.clientName,
            clientPhone: selectedEvent.clientPhone,
            serviceId: selectedEvent.serviceId,
            status: selectedEvent.status,
            notes: selectedEvent.notes,
            paid: selectedEvent.paid,
            paymentMethod: selectedEvent.paymentMethod,
            photoUrl: selectedEvent._raw?.reference_photo_url || selectedEvent._raw?.photo_url || '',
            _raw: selectedEvent._raw,
          } : null}
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
