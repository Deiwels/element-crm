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
