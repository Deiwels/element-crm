'use client'
import React, { useEffect, useState, useRef, useCallback } from 'react'
import Shell from '@/components/Shell'
import { BookingModal } from '@/app/calendar/booking-modal'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Barber {
  id: string; name: string; level?: string; photo?: string; color: string
  about?: string; basePrice?: string; publicRole?: string
  radarLabels?: string[]; radarValues?: number[]; username?: string
  schedule?: { enabled: boolean; startMin: number; endMin: number }[]
}
interface Service {
  id: string; name: string; durationMin: number; price?: string; barberIds: string[]
}
interface CalEvent {
  id: string; type?: 'booking' | 'block'; barberId: string; barberName: string
  clientName: string; clientPhone: string; serviceId: string; serviceName: string
  date: string; startMin: number; durMin: number; status: string
  paid: boolean; paymentMethod?: string; notes?: string; tipAmount?: number; _raw: any
}
interface ModalState { open: boolean; eventId: string | null; isNew: boolean }
interface DaySchedule { enabled: boolean; startMin: number; endMin: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const slotH_DEFAULT = 11
const START_HOUR = 0
const END_HOUR = 24
const COL_MIN = 190
const BARBER_COLORS = ['#99d100','#a86bff','#0a84ff','#ffb000','#ff5aa5','#35d6c7','#ff6b6b']
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const minToHHMM = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`
const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`
const uid = () => 'e_' + Math.random().toString(16).slice(2)
const clamp = (min: number) => Math.max(START_HOUR * 60, Math.min(min, END_HOUR * 60 - 5))
const timeStrToMin = (s: string) => { const [h,m] = s.split(':').map(Number); return (h||0)*60+(m||0) }
const minToTimeStr = (min: number) => `${pad2(Math.floor(min/60))}:${pad2(min%60)}`

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, { credentials: 'include',
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── Status Chip ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, { border: string; bg: string; color: string }> = {
  paid:      { border: 'rgba(143,240,177,.40)', bg: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  booked:    { border: 'rgba(10,132,255,.40)',  bg: 'rgba(10,132,255,.10)',  color: '#d7ecff' },
  arrived:   { border: 'rgba(143,240,177,.40)', bg: 'rgba(143,240,177,.10)', color: '#c9ffe1' },
  done:      { border: 'rgba(255,207,63,.40)',  bg: 'rgba(255,207,63,.08)',  color: '#ffe9a3' },
  noshow:    { border: 'rgba(255,107,107,.40)', bg: 'rgba(255,107,107,.10)', color: '#ffd0d0' },
  cancelled: { border: 'rgba(255,107,107,.30)', bg: 'rgba(255,107,107,.07)', color: '#ffd0d0' },
  model:     { border: 'rgba(168,107,255,.40)', bg: 'rgba(168,107,255,.10)', color: '#d4b8ff' },
}
function Chip({ label, type }: { label: string; type: string }) {
  const s = STATUS_COLORS[type] || STATUS_COLORS.booked
  return <span style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 7px', borderRadius: 999, border: `1px solid ${s.border}`, background: s.bg, color: s.color, whiteSpace: 'nowrap' as const }}>{label}</span>
}

// ─── DatePickerModal ──────────────────────────────────────────────────────────
function DatePickerModal({ current, onSelect, onClose }: {
  current: Date; onSelect: (d: Date) => void; onClose: () => void
}) {
  const [month, setMonth] = useState(() => { const d = new Date(current); d.setDate(1); d.setHours(0,0,0,0); return d })
  const today = new Date(); today.setHours(0,0,0,0)
  const offset = (month.getDay() + 6) % 7
  const start = new Date(month); start.setDate(1 - offset)
  const days: Date[] = []
  for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
  const btn: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(460px,100%)', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', padding: 18, color: '#e9e9e9', fontFamily: 'Inter,sans-serif', boxShadow: '0 32px 80px rgba(0,0,0,.55), inset 0 0 0 0.5px rgba(255,255,255,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,.10)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 13 }}>Choose date</div>
          <button onClick={onClose} style={{ height: 32, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12 }}>Close</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()-1); setMonth(m) }} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit' }}>←</button>
            <button onClick={() => { const m = new Date(month); m.setMonth(m.getMonth()+1); setMonth(m) }} style={{ height: 36, width: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit' }}>→</button>
          </div>
          <div style={{ fontWeight: 900, fontSize: 15 }}>{month.toLocaleDateString([], { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => { const t = new Date(); t.setDate(1); t.setHours(0,0,0,0); setMonth(t) }} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Today</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, marginBottom: 6 }}>
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', padding: '4px 0' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {days.map((d, i) => {
            const inMonth = d.getMonth() === month.getMonth()
            const isToday = +d === +today
            const isSel = d.toDateString() === current.toDateString()
            return <button key={i} onClick={() => { onSelect(d); onClose() }} style={{ ...btn, opacity: inMonth ? 1 : 0.3, borderColor: isSel ? 'rgba(255,255,255,.40)' : isToday ? 'rgba(255,207,63,.55)' : 'rgba(255,255,255,.09)', background: isSel ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.04)' }}>{d.getDate()}</button>
          })}
        </div>
      </div>
    </div>
  )
}

// ─── SchedGrid ────────────────────────────────────────────────────────────────
function SchedGrid({ schedule, onChange }: { schedule: DaySchedule[]; onChange: (s: DaySchedule[]) => void }) {
  function toggle(i: number) { const n = [...schedule]; n[i] = { ...n[i], enabled: !n[i].enabled }; onChange(n) }
  function setTime(i: number, field: 'startMin'|'endMin', val: string) { const n = [...schedule]; n[i] = { ...n[i], [field]: timeStrToMin(val) }; onChange(n) }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, margin: '6px auto' }}>
      {DAY_NAMES.map((name, i) => {
        const day = schedule[i]
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, border: `1px solid ${day.enabled ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)'}`, borderRadius: 10, padding: '5px 4px', background: day.enabled ? 'rgba(10,132,255,.08)' : 'rgba(0,0,0,.18)', opacity: day.enabled ? 1 : 0.55 }}>
            <div style={{ fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', textAlign: 'center', fontWeight: 900, color: 'rgba(255,255,255,.60)' }}>{name}</div>
            <button onClick={() => toggle(i)} style={{ height: 22, borderRadius: 999, border: `1px solid ${day.enabled ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.16)'}`, background: day.enabled ? 'rgba(10,132,255,.16)' : 'rgba(255,255,255,.05)', color: day.enabled ? '#d7ecff' : '#fff', cursor: 'pointer', fontSize: 8, textTransform: 'uppercase', fontWeight: 900, fontFamily: 'inherit', width: '100%' }}>{day.enabled ? 'ON' : 'OFF'}</button>
            <div style={{ opacity: day.enabled ? 1 : 0.3, pointerEvents: day.enabled ? 'auto' : 'none' }}>
              <input type="time" value={minToTimeStr(day.startMin)} onChange={e => setTime(i,'startMin',e.target.value)} style={{ height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 3px', fontSize: 9, outline: 'none', width: '100%', colorScheme: 'dark' as any }} />
              <input type="time" value={minToTimeStr(day.endMin)} onChange={e => setTime(i,'endMin',e.target.value)} style={{ height: 24, borderRadius: 6, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 3px', fontSize: 9, outline: 'none', width: '100%', colorScheme: 'dark' as any, marginTop: 2 }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── BarberEditCard ───────────────────────────────────────────────────────────
function BarberEditCard({ b, onDelete, onSaved, onError, isBarberSelf }: {
  b: Barber; onDelete?: (id: string, name: string) => void
  onSaved: () => void; onError: (e: string) => void
  isBarberSelf?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [level, setLevel] = useState(b.level || '')
  const [price, setPrice] = useState(b.basePrice || '')
  const [about, setAbout] = useState(b.about || '')
  const [publicRole, setPublicRole] = useState(b.publicRole || '')
  const [radarLabels, setRadarLabels] = useState((b.radarLabels || ['FADE','LONG','BEARD','STYLE','DETAIL']).join(','))
  const [radarValues, setRadarValues] = useState((b.radarValues || [4.5,4.5,4.5,4.5,4.5]).join(','))
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [sched, setSched] = useState<DaySchedule[]>(() => {
    // Load from barber's actual schedule if available
    if (b.schedule && b.schedule.length === 7) {
      return b.schedule.map(d => ({ enabled: d.enabled, startMin: d.startMin, endMin: d.endMin }))
    }
    return DAY_DEFAULTS.map(d => ({...d}))
  })

  useEffect(() => {
    setLevel(b.level || ''); setPrice(b.basePrice || ''); setAbout(b.about || '')
    setPublicRole(b.publicRole || '')
    setRadarLabels((b.radarLabels || ['FADE','LONG','BEARD','STYLE','DETAIL']).join(','))
    setRadarValues((b.radarValues || [4.5,4.5,4.5,4.5,4.5]).join(','))
    // Sync schedule from server data (b.schedule is 7-element array [Sun..Sat])
    if (b.schedule && b.schedule.length === 7) {
      setSched(b.schedule.map((d: any) => ({ enabled: !!d.enabled, startMin: Number(d.startMin) || 10*60, endMin: Number(d.endMin) || 20*60 })))
    } else {
      setSched(DAY_DEFAULTS.map(d => ({...d})))
    }
  }, [b.id])

  function handlePhoto(file: File | null) {
    if (!file) return; setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX/img.width, MAX/img.height)
        const w = Math.round(img.width*scale), h = Math.round(img.height*scale)
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
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
      const enabledScheds = sched.filter(d => d.enabled)
      const startMin = enabledScheds.length ? Math.min(...enabledScheds.map(d => d.startMin)) : 10*60
      const endMin   = enabledScheds.length ? Math.max(...enabledScheds.map(d => d.endMin))   : 20*60
      const schedPayload = { startMin, endMin, days: enabledDays }
      const rLabels = radarLabels.split(',').map(s => s.trim()).filter(Boolean)
      const rValues = radarValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      const changes = { level, base_price: price, public_role: publicRole || level, about, description: about, bio: about, radar_labels: rLabels, radar_values: rValues, photo_url: photoPreview || b.photo || '', schedule: schedPayload, work_schedule: schedPayload, public_off_days: DAY_NAMES.filter((_,i) => !sched[i].enabled), public_enabled: true }

      if (isBarberSelf) {
        // Build readable schedule summary
        const schedSummary = sched.map((d, i) => d.enabled ? `${DAY_NAMES[i]} ${minToTimeStr(d.startMin)}–${minToTimeStr(d.endMin)}` : null).filter(Boolean)
        // Barber sends profile changes as request for approval
        await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({
          type: 'profile_change',
          data: { barberId: b.id, barberName: b.name, changes, scheduleSummary: schedSummary, workDays: DAY_NAMES.filter((_, i) => sched[i].enabled) }
        })})
      } else {
        // Owner/admin saves directly
        await apiFetch(`/api/barbers/${encodeURIComponent(b.id)}`, { method: 'PATCH', body: JSON.stringify(changes) })
      }
      setPhotoFile(null); setPhotoPreview(''); onSaved()
    } catch (e: any) { onError(e.message) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 4 }

  return (
    <div style={{ borderRadius: 16, border: `1px solid ${open ? 'rgba(10,132,255,.35)' : 'rgba(255,255,255,.10)'}`, background: open ? 'rgba(10,132,255,.08)' : 'rgba(255,255,255,.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {(photoPreview || b.photo)
            ? <img src={photoPreview || b.photo} alt={b.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} />
            : <div style={{ width: 44, height: 44, borderRadius: 12, background: b.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{b.name[0]}</div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{b.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', letterSpacing: '.06em', marginTop: 2 }}>{b.level || 'Barber'}{b.basePrice ? ` · $${b.basePrice}` : ''}</div>
            {b.about && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.30)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{b.about}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={() => setOpen(v => !v)} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${open ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.14)'}`, background: open ? 'rgba(10,132,255,.12)' : 'rgba(255,255,255,.05)', color: open ? '#d7ecff' : '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>{open ? 'Collapse' : 'Edit'}</button>
          {!isBarberSelf && onDelete && <button onClick={() => onDelete(b.id, b.name)} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Remove</button>}
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,.08)', overflow: 'hidden' }}>
          <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: '100%' }}>
            {[['Level / Rank', level, setLevel, 'Senior / Expert'], ['Base price ($)', price, setPrice, '55.99'], ['Public role', publicRole, setPublicRole, 'Ambassador'], ['Radar labels', radarLabels, setRadarLabels, 'FADE,LONG,BEARD,STYLE,DETAIL']].map(([lbText, val, setter, ph]) => (
              <div key={lbText as string}><label style={lbl}>{lbText as string}</label><input value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={ph as string} style={inp} /></div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>About / Bio</label>
              <textarea value={about} onChange={e => setAbout(e.target.value)} rows={3} placeholder="Precision fades. Clean silhouette. Premium finish..." style={{ ...inp, height: 'auto', padding: '10px', resize: 'vertical' as const, lineHeight: 1.5 }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Radar values (0–5, comma separated)</label>
              <input value={radarValues} onChange={e => setRadarValues(e.target.value)} placeholder="4.5,4.5,4.5,4.5,4.5" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <label style={{ height: 38, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'inherit' }}>
                  {photoFile ? photoFile.name : 'Change photo…'}
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhoto(e.target.files?.[0] || null)} />
                </label>
                {(photoPreview || b.photo) && <img src={photoPreview || b.photo} alt="" style={{ width: 38, height: 38, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)' }} onError={e => (e.currentTarget.style.display='none')} />}
                {photoPreview && <button onClick={() => { setPhotoFile(null); setPhotoPreview('') }} style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={lbl}>Working schedule</label>
            <SchedGrid schedule={sched} onChange={setSched} />
          </div>
          <button onClick={save} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', marginTop: 12 }}>
            {saving ? 'Saving…' : isBarberSelf ? 'Send for approval' : 'Save changes — update on website'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SettingsModal ────────────────────────────────────────────────────────────
function SettingsModal({ barbers, services, onClose, onReload, isStudent, isBarber, myBarberId, studentSchedule, onStudentScheduleChange }: {
  barbers: Barber[]; services: any[]; onClose: () => void; onReload: () => void
  isStudent?: boolean; isBarber?: boolean; myBarberId?: string
  studentSchedule?: DaySchedule[]; onStudentScheduleChange?: (s: DaySchedule[]) => void
}) {
  const _isOwnerOrAdmin = !isStudent && !isBarber
  const [tab, setTab] = useState<'barbers'|'services'|'account'>(isStudent ? 'account' : (isBarber ? 'barbers' : 'barbers'))
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // Barber form
  const [bName, setBName] = useState(''); const [bLevel, setBLevel] = useState('')
  const [bUsername, setBUsername] = useState(''); const [bPassword, setBPassword] = useState('')
  const [bPrice, setBPrice] = useState(''); const [bAbout, setBAbout] = useState('')
  const [bPublicRole, setBPublicRole] = useState('')
  const [bRadarLabels, setBRadarLabels] = useState('FADE,LONG,BEARD,STYLE,DETAIL')
  const [bRadarValues, setBRadarValues] = useState('4.5,4.5,4.5,4.5,4.5')
  const [bPhotoPreview, setBPhotoPreview] = useState('')
  const [bSchedule, setBSchedule] = useState<DaySchedule[]>(DAY_DEFAULTS.map(d => ({...d})))

  // Service form
  const [sName, setSName] = useState(''); const [sDur, setSDur] = useState('30')
  const [sPrice, setSPrice] = useState(''); const [sBarber, setSBarber] = useState('')
  const [editSvcId, setEditSvcId] = useState<string | null>(null)
  const [sBarbers, setSBarbers] = useState<string[]>([]) // multi-barber selection

  async function addBarber() {
    if (!bName.trim()) { setMsg('Name required'); return }
    if (!bPassword.trim()) { setMsg('Password required'); return }
    setSaving(true); setMsg('')
    try {
      const enabledDays = bSchedule.map((d, i) => d.enabled ? i : -1).filter(i => i >= 0)
      const schedPayload = { startMin: 10*60, endMin: 20*60, days: enabledDays, perDay: bSchedule }
      const rLabels = bRadarLabels.split(',').map(s => s.trim()).filter(Boolean)
      const rValues = bRadarValues.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
      await apiFetch('/api/barbers', { method: 'POST', body: JSON.stringify({
        name: bName.trim(), level: bLevel.trim(),
        username: bUsername.trim() || bName.toLowerCase().replace(/\s+/g, '.'),
        password: bPassword.trim(), barber_pin: bPassword.trim(),
        base_price: bPrice.trim(), public_role: bPublicRole.trim() || bLevel.trim(),
        about: bAbout.trim(), description: bAbout.trim(), bio: bAbout.trim(),
        radar_labels: rLabels.length ? rLabels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
        radar_values: rValues.length ? rValues : [4.5,4.5,4.5,4.5,4.5],
        photo_url: bPhotoPreview || '', active: true, public_enabled: true,
        schedule: schedPayload, work_schedule: schedPayload,
        public_off_days: DAY_NAMES.filter((_, i) => !bSchedule[i].enabled)
      })})
      setMsg('Barber added ✓')
      setBName(''); setBLevel(''); setBUsername(''); setBPassword(''); setBPrice('')
      setBAbout(''); setBPublicRole(''); setBPhotoPreview('')
      setBSchedule(DAY_DEFAULTS.map(d => ({...d}))); onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  async function deleteBarber(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    try { await apiFetch(`/api/barbers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ active: false }) }); setMsg('Barber removed'); onReload() }
    catch (e: any) { setMsg('Error: ' + e.message) }
  }

  async function addService() {
    if (!sName.trim()) { setMsg('Service name required'); return }
    setSaving(true); setMsg('')
    try {
      const price_cents = Math.round(parseFloat(sPrice || '0') * 100)
      // Always create new service — same name can exist for different barbers/prices
      await apiFetch('/api/services', { method: 'POST', body: JSON.stringify({ name: sName.trim(), duration_minutes: Number(sDur), price_cents, version: '1', barber_ids: sBarbers }) })
      setMsg('Service added ✓'); setSName(''); setSDur('30'); setSPrice(''); setSBarbers([]); onReload()
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 4 }
  const tabs = (isStudent ? ['account'] : ['barbers','services','account']) as ('barbers'|'services'|'account')[]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 90, padding: 'clamp(8px,2vw,16px)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(680px,100%)', maxWidth: 'calc(100vw - 16px)', height: 'min(800px,calc(100dvh - 32px))', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', color: '#e9e9e9', fontFamily: 'Inter,sans-serif', overflowY: 'auto', overflowX: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,.55), inset 0 0 0 0.5px rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 14 }}>Settings</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, padding: '14px 18px 0' }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ height: 36, padding: '0 16px', borderRadius: 999, border: `1px solid ${tab === t ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.09)'}`, background: tab === t ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: tab === t ? '#fff' : 'rgba(255,255,255,.55)', cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'inherit' }}>{t}</button>
          ))}
        </div>

        <div style={{ padding: '16px 18px 20px', flex: 1, overflowY: 'auto' }}>
          {msg && <div style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', fontSize: 12, color: '#e9e9e9', marginBottom: 14 }}>{msg}</div>}

          {/* Barbers tab */}
          {tab === 'barbers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>{isBarber ? 'My profile' : `Current barbers (${barbers.length})`}</div>
                {(isBarber ? barbers.filter(b => b.id === myBarberId) : barbers).map(b => (
                  <BarberEditCard key={b.id} b={b} onDelete={isBarber ? undefined as any : deleteBarber} isBarberSelf={isBarber}
                    onSaved={() => { setMsg(isBarber ? 'Changes sent for approval ✓' : 'Saved ✓ — updated on website'); onReload() }}
                    onError={(e: string) => setMsg('Error: ' + e)} />
                ))}
              </div>

              {!isBarber && <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 12 }}>Add new barber</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['Name *', bName, setBName, 'Nazar'], ['Level', bLevel, setBLevel, 'Senior'], ['Login', bUsername, setBUsername, 'nazar'], ['Password *', bPassword, setBPassword, '1234'], ['Base price', bPrice, setBPrice, '55.99'], ['Public role', bPublicRole, setBPublicRole, 'Ambassador']].map(([l, v, s, p]) => (
                    <div key={l as string}><label style={lbl}>{l as string}</label><input value={v as string} onChange={e => (s as any)(e.target.value)} placeholder={p as string} style={inp} /></div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>About / Bio</label>
                    <textarea value={bAbout} onChange={e => setBAbout(e.target.value)} rows={2} placeholder="Precision fades. Clean silhouette..." style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} />
                  </div>
                  <div><label style={lbl}>Radar labels</label><input value={bRadarLabels} onChange={e => setBRadarLabels(e.target.value)} style={inp} /></div>
                  <div><label style={lbl}>Radar values</label><input value={bRadarValues} onChange={e => setBRadarValues(e.target.value)} style={inp} /></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Photo</label>
                    <label style={{ height: 38, padding: '0 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.70)', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 12, fontFamily: 'inherit', gap: 8 }}>
                      {bPhotoPreview ? <img src={bPhotoPreview} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} /> : null}
                      {bPhotoPreview ? 'Change photo' : 'Upload photo…'}
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return
                        const reader = new FileReader()
                        reader.onload = () => {
                          const img = new Image()
                          img.onload = () => {
                            const MAX = 900, scale = Math.min(1, MAX/img.width, MAX/img.height)
                            const w = Math.round(img.width*scale), h = Math.round(img.height*scale)
                            const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
                            canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
                            let q = 0.82, out = canvas.toDataURL('image/jpeg', q)
                            while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
                            setBPhotoPreview(out)
                          }
                          img.src = reader.result as string
                        }
                        reader.readAsDataURL(file)
                      }} />
                    </label>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Working schedule</label>
                    <SchedGrid schedule={bSchedule} onChange={setBSchedule} />
                  </div>
                </div>
                <button onClick={addBarber} disabled={saving} style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', marginTop: 12 }}>
                  {saving ? 'Saving…' : '+ Add barber'}
                </button>
              </div>}
            </div>
          )}

          {/* Services tab */}
          {tab === 'services' && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {(isBarber ? services.filter(s => !s.barberIds.length || s.barberIds.includes(myBarberId || '')) : services).map(s => {
                  const assignedBarbers = barbers.filter(b => s.barberIds.includes(b.id))
                  const isEditing = editSvcId === s.id
                  return (
                    <div key={s.id} style={{ borderRadius: 12, border: `1px solid ${isEditing ? 'rgba(255,255,255,.20)' : 'rgba(255,255,255,.07)'}`, background: 'rgba(255,255,255,.03)', overflow: 'hidden' }}>
                      {/* Service row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 2 }}>
                            {s.durationMin}min{s.price ? ` · $${s.price}` : ''}
                          </div>
                          {/* Barbers assigned */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                            {assignedBarbers.length === 0
                              ? <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', letterSpacing: '.06em' }}>All barbers</span>
                              : assignedBarbers.map(b => (
                                <span key={b.id} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.65)' }}>{b.name}</span>
                              ))
                            }
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => {
                            if (isEditing) { setEditSvcId(null); return }
                            setEditSvcId(s.id)
                            setSName(s.name)
                            setSDur(String(s.durationMin))
                            setSPrice(s.price || '')
                            setSBarbers(s.barberIds)
                          }} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: isEditing ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          {!isBarber && <button onClick={async () => { if (!confirm(`Delete ${s.name}?`)) return; try { await apiFetch(`/api/services/${encodeURIComponent(s.id)}`, { method: 'DELETE' }); setMsg('Deleted'); onReload() } catch (e: any) { setMsg('Error: ' + e.message) } }} style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>✕</button>}
                        </div>
                      </div>
                      {/* Edit form inline */}
                      {isEditing && (
                        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                            <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Name</label><input value={sName} onChange={e => setSName(e.target.value)} style={inp} /></div>
                            <div><label style={lbl}>Duration (min)</label><input type="number" value={sDur} onChange={e => setSDur(e.target.value)} style={inp} /></div>
                            <div><label style={lbl}>Price ($)</label><input value={sPrice} onChange={e => setSPrice(e.target.value)} style={inp} /></div>
                          </div>
                          {/* Barbers checkboxes — owner/admin only */}
                          {!isBarber && <div style={{ marginTop: 10 }}>
                            <label style={lbl}>Assigned barbers</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                              {barbers.map(b => {
                                const on = sBarbers.includes(b.id)
                                return (
                                  <button key={b.id} onClick={() => setSBarbers(prev => on ? prev.filter(x => x !== b.id) : [...prev, b.id])}
                                    style={{ height: 30, padding: '0 10px', borderRadius: 999, border: `1px solid ${on ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.03)', color: on ? '#fff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                                    {b.name}
                                  </button>
                                )
                              })}
                            </div>
                          </div>}
                          <button onClick={async () => {
                            setSaving(true)
                            try {
                              const price_cents = sPrice ? Math.round(parseFloat(sPrice) * 100) : 0
                              const changes = { name: sName.trim(), duration_minutes: Number(sDur), price_cents, barber_ids: sBarbers }
                              if (isBarber) {
                                // Barber sends service change as request
                                await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({ type: 'service_change', data: { serviceId: s.id, serviceName: s.name, changes } }) })
                                setMsg('Service change request sent for approval ✓'); setEditSvcId(null)
                              } else {
                                await apiFetch(`/api/services/${encodeURIComponent(s.id)}`, { method: 'PATCH', body: JSON.stringify(changes) })
                                setMsg('Saved'); setEditSvcId(null); onReload()
                              }
                            } catch (e: any) { setMsg('Error: ' + e.message) }
                            setSaving(false)
                          }} disabled={saving} style={{ width: '100%', height: 38, borderRadius: 10, border: `1px solid ${isBarber ? 'rgba(168,107,255,.40)' : 'rgba(255,255,255,.20)'}`, background: isBarber ? 'rgba(168,107,255,.10)' : 'rgba(255,255,255,.08)', color: isBarber ? '#d4b8ff' : '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', marginTop: 10 }}>
                            {saving ? 'Saving…' : isBarber ? 'Send for approval' : 'Save changes'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {!isBarber && <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 14 }}>
                <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>Add new service</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Service name</label><input value={editSvcId ? '' : sName} onChange={e => setSName(e.target.value)} placeholder="Fade" style={inp} /></div>
                  <div><label style={lbl}>Duration (min)</label><input type="number" value={editSvcId ? '30' : sDur} onChange={e => setSDur(e.target.value)} placeholder="30" style={inp} /></div>
                  <div><label style={lbl}>Price ($)</label><input value={editSvcId ? '' : sPrice} onChange={e => setSPrice(e.target.value)} placeholder="35" style={inp} /></div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Assign barbers</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {barbers.map(b => {
                        const on = !editSvcId && sBarbers.includes(b.id)
                        return (
                          <button key={b.id} onClick={() => { if (editSvcId) return; setSBarbers(prev => on ? prev.filter(x => x !== b.id) : [...prev, b.id]) }}
                            style={{ height: 30, padding: '0 10px', borderRadius: 999, border: `1px solid ${on ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'}`, background: on ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.03)', color: on ? '#fff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>
                            {b.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <button onClick={addService} disabled={saving || !!editSvcId} style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: editSvcId ? 0.4 : 1 }}>
                  {saving ? 'Saving…' : '+ Add service'}
                </button>
              </div>}
            </div>
          )}

          {/* Account tab */}
          {tab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)' }}>
                <div style={{ fontWeight: 900, marginBottom: 4 }}>Current session</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)' }}>
                  {(() => { try { const u = JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null'); return u ? `${u.role} · ${u.name || u.username}` : 'Guest' } catch { return 'Guest' } })()}
                </div>
              </div>

              {/* Student schedule editor */}
              {isStudent && studentSchedule && onStudentScheduleChange && (
                <div style={{ padding: '14px', borderRadius: 14, border: '1px solid rgba(168,107,255,.20)', background: 'rgba(168,107,255,.04)' }}>
                  <div style={{ fontWeight: 900, marginBottom: 8, color: '#d4b8ff' }}>My schedule</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginBottom: 12 }}>Set your working hours — off-hours will be grayed out on your calendar</div>
                  <SchedGrid schedule={studentSchedule} onChange={onStudentScheduleChange} />
                </div>
              )}

              <button onClick={() => { localStorage.removeItem('ELEMENT_TOKEN'); localStorage.removeItem('ELEMENT_USER'); window.location.href = '/signin' }} style={{ height: 42, borderRadius: 12, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>Log out</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── CalendarPage ─────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [anchor, setAnchor] = useState(() => { const d = new Date(); d.setHours(0,0,0,0); return d })
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [events, setEvents] = useState<CalEvent[]>([])
  const [studentUsers, setStudentUsers] = useState<{ id: string; name: string; mentorIds: string[] }[]>([])
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([])
  const [wlConfirm, setWlConfirm] = useState<{ w: any; barberId: string; barberName: string; slotMin: number; dur: number } | null>(null)
  const [wlConfirming, setWlConfirming] = useState(false)
  const [search, setSearch] = useState('')
  const [slotH, setSlotH] = useState(slotH_DEFAULT)
  const [isMobile, setIsMobile] = useState(false) // mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  const [modal, setModal] = useState<ModalState>({ open: false, eventId: null, isNew: false })
  const [nowMin, setNowMin] = useState(0)
  const [loading, setLoading] = useState(true)
  const [drag, setDrag] = useState<{ eventId: string; offsetMin: number; ghostBarberIdx: number; ghostMin: number } | null>(null)
  const [dragConfirm, setDragConfirm] = useState<{ eventId: string; newBarberId: string; newBarberName: string; newMin: number } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; barberId: string; min: number } | null>(null)
  const [blockDrag, setBlockDrag] = useState<{ barberId: string; barberIdx: number; startMin: number; endMin: number } | null>(null)
  const blockDragRef = useRef<{ barberId: string; barberIdx: number; startMin: number; endMin: number } | null>(null)
  const blockDragJustEnded = useRef(false)
  const blockLongPressTimer = useRef<any>(null)
  const [trainingModal, setTrainingModal] = useState<{ barberId: string; barberName: string; min: number } | null>(null)
  const [toast, setToast] = useState('')
  const [slotPicker, setSlotPicker] = useState<{ min: number; mentorId: string; mentorName: string }[] | null>(null)
  const [mobilePage, setMobilePage] = useState(0)
  const BARBERS_PER_PAGE = 2
  const swipeRef = useRef<{ startX: number; startY: number } | null>(null)
  const toastTimer = useRef<any>(null)
  const showToast = useCallback((msg: string) => { setToast(msg); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3500) }, [])
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Pinch zoom
  const lastPinchDist = useRef(0)
  const onPinchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastPinchDist.current = Math.sqrt(dx*dx + dy*dy)
    }
  }
  const onPinchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx*dx + dy*dy)
      if (lastPinchDist.current > 0) {
        const scale = dist / lastPinchDist.current
        setSlotH(prev => Math.round(Math.max(6, Math.min(22, prev * scale))))
      }
      lastPinchDist.current = dist
    }
  }
  const onPinchEnd = () => { lastPinchDist.current = 0 }

  // Work hours per barber: { barberId -> { startMin, endMin } }
  // Default: 10:00–20:00 if no schedule loaded
  const [workHours, setWorkHours] = useState<Record<string, { startMin: number; endMin: number }>>({})
  const offResize = useRef<{ barberId: string; type: 'top' | 'bottom'; startY: number; origMin: number } | null>(null)
  const hasScrolledRef = useRef(false)
  const prevAnchorRef = useRef<string>('')
  const [scheduleConfirm, setScheduleConfirm] = useState<{ barberId: string; barberName: string; dow: number; startMin: number; endMin: number } | null>(null)

  // Student schedule state
  const [studentSchedule, setStudentSchedule] = useState<DaySchedule[]>(() => {
    try { const s = localStorage.getItem('ELEMENT_STUDENT_SCHEDULE'); if (s) return JSON.parse(s) } catch {}
    return DAY_DEFAULTS.map(d => ({...d}))
  })
  // Build workHours from barber schedule every time barbers or date changes
  // Note: _isStudent computed inline to avoid block-scope ordering issues
  const _isStudent = (() => { try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}')?.role === 'student' } catch { return false } })()

  useEffect(() => {
    if (!barbers.length && !_isStudent) return
    // dow = 0=Sun,1=Mon..6=Sat — matches how schedule.days[] is stored on server
    const dow = anchor.getDay() // anchor is Date object, 0=Sun..6=Sat
    const next: Record<string, { startMin: number; endMin: number; dayOff: boolean }> = {}
    barbers.forEach(b => {
      const sched = b.schedule
      if (!sched) {
        // No schedule — no gray blocks, show full day
        next[b.id] = { startMin: 0, endMin: END_HOUR * 60, dayOff: false }
        return
      }
      // sched is 7-element array indexed by JS getDay() 0=Sun..6=Sat
      const day = sched[dow]
      if (!day) {
        next[b.id] = { startMin: 0, endMin: END_HOUR * 60, dayOff: false }
      } else if (!day.enabled) {
        next[b.id] = { startMin: 0, endMin: 0, dayOff: true }
      } else {
        next[b.id] = { startMin: day.startMin, endMin: day.endMin, dayOff: false }
      }
    })
    // Student column work hours
    if (_isStudent && studentSchedule.length === 7) {
      const day = studentSchedule[dow]
      if (!day || !day.enabled) {
        next['__student__'] = { startMin: 0, endMin: 0, dayOff: true }
      } else {
        next['__student__'] = { startMin: day.startMin, endMin: day.endMin, dayOff: false }
      }
    }
    setWorkHours(next as any)
  }, [barbers, anchor, _isStudent, studentSchedule])

  // Scroll to current time or work start — runs after barbers load
  useEffect(() => {
    if (!barbers.length) return
    const anchorStr = isoDate(anchor)
    // Reset scroll flag when anchor date changes (user navigated to a different day)
    if (prevAnchorRef.current && prevAnchorRef.current !== anchorStr) {
      hasScrolledRef.current = false
    }
    prevAnchorRef.current = anchorStr
    // Only scroll once per anchor date
    if (hasScrolledRef.current) return
    const container = scrollContainerRef.current
    if (!container) return
    const now = new Date()
    const today = isoDate(now)
    const currentMin = now.getHours() * 60 + now.getMinutes()
    // Find earliest work start across visible barbers
    let earliestWorkStart = 8 * 60 // fallback
    for (const b of barbers) {
      const wh = (workHours as any)[b.id]
      if (wh && !wh.dayOff && wh.startMin < earliestWorkStart) earliestWorkStart = wh.startMin
    }
    // If today → scroll to current time (30% from top)
    // If another day → scroll to work start
    const scrollMin = anchorStr === today ? currentMin : earliestWorkStart
    const y = ((scrollMin - START_HOUR * 60) / 5) * slotH
    const offset = Math.max(0, y - container.clientHeight * 0.3)
    requestAnimationFrame(() => { container.scrollTop = offset })
    hasScrolledRef.current = true
  }, [barbers, anchor, workHours])

  // Off-block resize handlers
  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!offResize.current) return
      // Prevent page scroll while resizing on touch devices
      if ('touches' in e) e.preventDefault()
      const { barberId, type, startY, origMin } = offResize.current
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const dy = clientY - startY
      const dMin = Math.round(dy / slotH) * 5
      setWorkHours(prev => {
        const cur = prev[barberId] || { startMin: 10*60, endMin: 20*60 }
        if (type === 'top') {
          const newStart = Math.max(START_HOUR*60, Math.min(cur.endMin - 30, origMin + dMin))
          return { ...prev, [barberId]: { ...cur, startMin: newStart } }
        } else {
          const newEnd = Math.max(cur.startMin + 30, Math.min(END_HOUR*60, origMin + dMin))
          return { ...prev, [barberId]: { ...cur, endMin: newEnd } }
        }
      })
    }
    function onUp() {
      if (!offResize.current) return
      const { barberId } = offResize.current
      offResize.current = null
      const wh = (workHours as any)[barberId]
      if (!wh || wh.dayOff) return
      const barber = barbers.find(b => b.id === barberId)
      if (!barber) return
      const dow = anchor.getDay()
      // Show confirm dialog before saving
      setScheduleConfirm({ barberId, barberName: barber.name, dow, startMin: wh.startMin, endMin: wh.endMin })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [workHours])

  const [currentUser, setCurrentUser] = useState<{ role: string; barber_id?: string; mentor_barber_ids?: string[]; uid?: string; name?: string; username?: string } | null>(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null') } catch { return null }
  })
  // Re-read user from localStorage when Shell updates it (barber_id might arrive late)
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const fresh = JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null')
        if (fresh?.barber_id && fresh.barber_id !== currentUser?.barber_id) {
          setCurrentUser(fresh)
        }
      } catch {}
    }, 1500)
    return () => clearInterval(interval)
  }, [currentUser?.barber_id])
  const isBarber = currentUser?.role === 'barber'
  const isStudent = currentUser?.role === 'student'
  const isOwnerOrAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin'
  const myBarberId = currentUser?.barber_id || ''
  const mentorBarberIds: string[] = currentUser?.mentor_barber_ids || []

  // Load student schedule from API on mount
  useEffect(() => {
    if (!isStudent) return
    ;(async () => {
      try {
        const data = await apiFetch('/api/auth/me')
        const sched = data?.user?.schedule
        if (Array.isArray(sched) && sched.length === 7) {
          setStudentSchedule(sched)
          localStorage.setItem('ELEMENT_STUDENT_SCHEDULE', JSON.stringify(sched))
        }
      } catch {}
    })()
  }, [isStudent])

  // Barber sees only their own column
  // Student sees ONE column with their name (availability computed from mentors)
  const myBarberObj = isBarber ? barbers.find(b => b.id === myBarberId) : null
  const studentColumn: Barber | null = isStudent ? {
    id: '__student__', name: currentUser?.name || currentUser?.username || 'My Schedule',
    color: '#a86bff', schedule: undefined,
  } : null
  const visibleBarbers = isStudent
    ? (studentColumn ? [studentColumn] : [])
    : isBarber
      ? (myBarberObj ? [myBarberObj] : barbers)
      : barbers
  const totalPages = Math.ceil(visibleBarbers.length / BARBERS_PER_PAGE)

  // Swipe handler for mobile
  useEffect(() => {
    if (!isMobile) return
    const el = scrollContainerRef.current; if (!el) return
    function onTouchStart(e: TouchEvent) { swipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY } }
    function onTouchEnd(e: TouchEvent) {
      if (!swipeRef.current) return
      const dx = e.changedTouches[0].clientX - swipeRef.current.startX
      const dy = e.changedTouches[0].clientY - swipeRef.current.startY
      swipeRef.current = null
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return
      if (isBarber || isStudent || visibleBarbers.length <= BARBERS_PER_PAGE) {
        // Barber/student: swipe changes day
        if (dx < 0) setAnchor(a => { const x = new Date(a); x.setDate(x.getDate() + 1); return x })
        else setAnchor(a => { const x = new Date(a); x.setDate(x.getDate() - 1); return x })
      } else {
        // Owner/admin: swipe changes barber page
        if (dx < 0) setMobilePage(p => Math.min(p + 1, totalPages - 1))
        else setMobilePage(p => Math.max(p - 1, 0))
      }
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => { el.removeEventListener('touchstart', onTouchStart); el.removeEventListener('touchend', onTouchEnd) }
  }, [isMobile, isStudent, isBarber, visibleBarbers.length, totalPages])

  const todayStr = isoDate(anchor)

  // ── Student: compute blocked slots from mentor schedules + bookings ──
  const mentorBarbers = isStudent ? barbers.filter(b => mentorBarberIds.includes(b.id)) : []

  // For each 5-min slot: which mentor(s) are free?
  const studentSlotMentorMap = React.useMemo(() => {
    if (!isStudent || !mentorBarbers.length) return new Map<number, string>()
    const map = new Map<number, string>()
    const dow = anchor.getDay()
    const mentorEvents = events.filter(e => e.date === todayStr && mentorBarberIds.includes(e.barberId) && e.status !== 'cancelled')

    for (let m = 0; m < END_HOUR * 60; m += 5) {
      for (const mb of mentorBarbers) {
        // Check if mentor works this slot
        const wh = (workHours as any)[mb.id]
        if (!wh || wh.dayOff) continue
        if (m < wh.startMin || m >= wh.endMin) continue
        // Check if mentor has a booking at this slot
        const busy = mentorEvents.some(e => e.barberId === mb.id && m >= e.startMin && m < e.startMin + e.durMin)
        if (!busy) { map.set(m, mb.id); break } // first free mentor wins
      }
    }
    return map
  }, [isStudent, mentorBarbers.length, mentorBarberIds.join(','), events, todayStr, workHours, anchor.getTime()])

  // Blocked ranges: consecutive slots where no mentor is free
  const studentBlockedRanges = React.useMemo(() => {
    if (!isStudent || !mentorBarbers.length) return [] as { startMin: number; endMin: number }[]
    const ranges: { startMin: number; endMin: number }[] = []
    let rangeStart = -1
    for (let m = 0; m < END_HOUR * 60; m += 5) {
      if (!studentSlotMentorMap.has(m)) {
        if (rangeStart < 0) rangeStart = m
      } else {
        if (rangeStart >= 0) { ranges.push({ startMin: rangeStart, endMin: m }); rangeStart = -1 }
      }
    }
    if (rangeStart >= 0) ranges.push({ startMin: rangeStart, endMin: END_HOUR * 60 })
    return ranges
  }, [isStudent, studentSlotMentorMap])

  const selectedEvent = events.find(e => e.id === modal.eventId) || null

  useEffect(() => {
    const tick = () => { const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes()) }
    tick(); const t = setInterval(tick, 30000); return () => clearInterval(t)
  }, [])

  // Per-day schedule overrides stored in localStorage
  // Key: 'sched_override_<barberId>' = {dow: {startMin, endMin}, ...}
  function getSchedOverrides(barberId: string): Record<number, { startMin: number; endMin: number }> {
    try { return JSON.parse(localStorage.getItem('sched_override_' + barberId) || '{}') } catch { return {} }
  }
  function saveSchedOverride(barberId: string, dow: number, startMin: number, endMin: number) {
    const cur = getSchedOverrides(barberId)
    cur[dow] = { startMin, endMin }
    localStorage.setItem('sched_override_' + barberId, JSON.stringify(cur))
  }

  const loadBarbers = useCallback(async () => {
    const data = await apiFetch('/api/barbers')
    const list = Array.isArray(data) ? data : (data?.barbers || [])
    return list.map((b: any, i: number) => {
      // Extract work hours from any schedule format the API returns
      const rawSched = b.schedule || b.work_schedule
      let parsedSchedule: { enabled: boolean; startMin: number; endMin: number }[] | undefined

      if (rawSched) {
        if (Array.isArray(rawSched)) {
          // Format: array of day objects
          parsedSchedule = rawSched.map((d: any) => ({
            enabled: !!d.enabled,
            startMin: Number(d.startMin ?? d.start_min ?? 10*60),
            endMin: Number(d.endMin ?? d.end_min ?? 20*60),
          }))
        } else if (typeof rawSched === 'object') {
          if (Array.isArray(rawSched.perDay)) {
            // Format: { startMin, endMin, perDay: [...] }
            parsedSchedule = rawSched.perDay.map((d: any) => ({
              enabled: !!d.enabled,
              startMin: Number(d.startMin ?? d.start_min ?? 10*60),
              endMin: Number(d.endMin ?? d.end_min ?? 20*60),
            }))
          } else if (rawSched.startMin !== undefined || rawSched.start_min !== undefined) {
            // Format: { startMin, endMin, days:[0,1,2,3,4,5,6] } — server normalizeSchedule output
            const sm = Number(rawSched.startMin ?? rawSched.start_min ?? 10*60)
            const em = Number(rawSched.endMin ?? rawSched.end_min ?? 20*60)
            // days[] contains JS getDay() indices of WORKING days (0=Sun..6=Sat)
            const workDays: number[] = Array.isArray(rawSched.days)
              ? rawSched.days.map(Number)
              : [1,2,3,4,5,6] // default Mon-Sat if no days specified
            parsedSchedule = Array.from({ length: 7 }, (_, i) => ({
              enabled: workDays.includes(i), // use server data, not hardcoded!
              startMin: sm,
              endMin: em,
            }))
          }
        }
      }

      // Apply per-day localStorage overrides on top of server schedule
      let finalSchedule = parsedSchedule
      if (finalSchedule) {
        const overrides = getSchedOverrides(String(b.id || ''))
        if (Object.keys(overrides).length > 0) {
          finalSchedule = finalSchedule.map((day, dow) => {
            const ov = overrides[dow]
            return ov ? { ...day, startMin: ov.startMin, endMin: ov.endMin } : day
          })
        }
      }

      return {
        id: String(b.id || ''), name: String(b.name || '').trim(),
        level: String(b.level || '').trim(), photo: String(b.photo_url || b.photo || '').trim(),
        color: BARBER_COLORS[i % BARBER_COLORS.length],
        about: String(b.about || b.description || '').trim(),
        basePrice: String(b.base_price || '').trim(),
        publicRole: String(b.public_role || '').trim(),
        radarLabels: Array.isArray(b.radar_labels) ? b.radar_labels : ['FADE','LONG','BEARD','STYLE','DETAIL'],
        radarValues: Array.isArray(b.radar_values) ? b.radar_values.map(Number) : [4.5,4.5,4.5,4.5,4.5],
        username: String(b.username || '').trim(),
        schedule: finalSchedule,
      }
    }).filter((b: Barber) => b.id && b.name)
  }, [])

  const loadServices = useCallback(async () => {
    const data = await apiFetch('/api/services')
    const list = Array.isArray(data?.services) ? data.services : Array.isArray(data) ? data : []
    return list.map((s: any) => {
      const durMin = s.duration_minutes || Math.round((s.durationMs || 0) / 60000) || 30
      const price = s.price ?? (s.price_cents > 0 ? (s.price_cents / 100).toFixed(2) : '')
      return { id: String(s.id || ''), name: String(s.name || ''), durationMin: Math.max(1, durMin), price: String(price), barberIds: (s.barber_ids || s.barberIds || []).map(String) }
    }).filter((s: Service) => s.name)
  }, [])

  const loadBookings = useCallback(async (barbersArg: Barber[], servicesArg: Service[]) => {
    // Build UTC range that covers the full local day (Chicago UTC-6 / UTC-5)
    // Expand by ±1 day to catch bookings near midnight boundaries
    const anchorDate = new Date(todayStr + 'T00:00:00')
    const dayBefore = new Date(anchorDate); dayBefore.setDate(dayBefore.getDate() - 1)
    const dayAfter  = new Date(anchorDate); dayAfter.setDate(dayAfter.getDate() + 2)
    const fromIso = dayBefore.toISOString()
    const toIso   = dayAfter.toISOString()
    const data = await apiFetch(`/api/bookings?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`)
    const list = Array.isArray(data?.bookings) ? data.bookings : Array.isArray(data) ? data : []
    return list.map((b: any) => {
      const startAt = b.start_at ? new Date(b.start_at) : null
      // Use LOCAL time for startMin and date — not UTC slice
      const startMin = startAt ? startAt.getHours() * 60 + startAt.getMinutes() : 10*60
      const localDate = startAt ? isoDate(startAt) : todayStr
      const isBlock = b.status === 'block' || b.type === 'block'
      const isModelOrTraining = b.booking_type === 'model' || b.booking_type === 'training'
      const svc = servicesArg.find(s => s.id === String(b.service_id || ''))
      const barber = barbersArg.find(br => br.id === String(b.barber_id || ''))
      // For blocks and model/training: use end_at - start_at; for regular bookings: use service duration
      const durMin = (isBlock || isModelOrTraining) ? (b.end_at && startAt ? Math.max(5, Math.round((new Date(b.end_at).getTime() - startAt.getTime()) / 60000)) : 90) : (svc?.durationMin || 30)
      return {
        id: String(b.id || uid()), type: isBlock ? 'block' as const : 'booking' as const,
        barberId: String(b.barber_id || ''), barberName: barber?.name || String(b.barber_name || ''),
        clientName: String(b.client_name || 'Client'), clientPhone: String(b.client_phone || ''),
        serviceId: String(b.service_id || ''), serviceName: svc?.name || String(b.service_name || b.notes || ''),
        date: localDate,
        startMin: clamp(startMin), durMin: Math.max(5, durMin),
        status: String(b.status || 'booked'), paid: !!(b.paid || b.is_paid),
        paymentMethod: String(b.payment_method || ''), notes: String(b.notes || ''),
        tipAmount: Number(b.tip || 0), _raw: b,
      } as CalEvent
    })
  }, [todayStr])

  // Load student users (for showing badges on barber headers)
  const loadStudents = useCallback(async () => {
    if (isStudent) return
    try {
      // Try /api/users first (owner/admin), fallback to /api/users/students (barber)
      let users: any[] = []
      try {
        const data = await apiFetch('/api/users')
        users = Array.isArray(data?.users) ? data.users : []
      } catch {
        // Barber may not have access to /api/users — try students endpoint
        try {
          const data = await apiFetch('/api/users/students')
          users = Array.isArray(data?.students) ? data.students : []
        } catch { /* no access */ }
      }
      setStudentUsers(users.filter((u: any) => u.role === 'student' && u.active !== false).map((u: any) => ({
        id: u.id, name: u.name || u.username || '', mentorIds: Array.isArray(u.mentor_barber_ids) ? u.mentor_barber_ids : []
      })))
    } catch { /* ignore */ }
  }, [isOwnerOrAdmin])

  const loadWaitlist = useCallback(async () => {
    if (!isOwnerOrAdmin) return
    try {
      const data = await apiFetch(`/api/waitlist?date=${todayStr}`)
      setWaitlistEntries(data?.waitlist || [])
    } catch { /* ignore */ }
  }, [isOwnerOrAdmin, todayStr])

  const reloadAll = useCallback(async () => {
    try {
      const [b, s] = await Promise.all([loadBarbers(), loadServices()])
      setBarbers(b); setServices(s)
      setEvents(await loadBookings(b, s))
      loadStudents()
      loadWaitlist()
    } catch(e) { console.warn(e) }
  }, [loadBarbers, loadServices, loadBookings, loadStudents, loadWaitlist])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadBarbers(), loadServices()]).then(async ([b, s]) => {
      setBarbers(b); setServices(s)
      setEvents(await loadBookings(b, s)); setLoading(false)
      loadStudents(); loadWaitlist()
    }).catch(e => { console.warn(e); setLoading(false) })
  }, [todayStr])

  // Poll bookings every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      loadBookings(barbers, services).then(setEvents).catch(console.warn)
    }, 15000)
    return () => clearInterval(interval)
  }, [barbers, services, loadBookings])

  const reload = useCallback(() => {
    loadBookings(barbers, services).then(setEvents).catch(console.warn)
  }, [barbers, services, loadBookings])

  const totalH = (END_HOUR - START_HOUR) * 12 * slotH
  const minToY = (min: number) => ((min - START_HOUR * 60) / 5) * slotH
  const nowY = minToY(nowMin)
  const isToday = (() => { const t = new Date(); return todayStr === isoDate(t) })()
  const showNow = isToday && nowMin >= START_HOUR * 60 && nowMin <= END_HOUR * 60

  const todayEvents = events.filter(e => {
    if (e.date !== todayStr) return false
    if (isBarber && myBarberId && e.type !== 'block' && e.barberId !== myBarberId) return false
    // Student: show model + training bookings
    if (isStudent) return e._raw?.booking_type === 'model' || e._raw?.booking_type === 'training'
    return true
  })
  const filtered = search ? todayEvents.filter(e => [e.clientName, e.barberName, e.serviceName].join(' ').toLowerCase().includes(search.toLowerCase())) : todayEvents

  // ── Drag ──────────────────────────────────────────────────────────────────
  function startDrag(e: React.MouseEvent | React.TouchEvent, ev: CalEvent, barberIdx: number) {
    e.preventDefault(); e.stopPropagation()
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const col = colRefs.current[barberIdx]; if (!col) return
    const clickedMin = Math.round((clientY - col.getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60
    setDrag({ eventId: ev.id, offsetMin: clickedMin - ev.startMin, ghostBarberIdx: barberIdx, ghostMin: ev.startMin })
  }

  function onDragMove(e: MouseEvent | TouchEvent) {
    if (!drag) return
    // Prevent page scroll while dragging on touch devices
    if ('touches' in e) e.preventDefault()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    let newBI = drag.ghostBarberIdx
    colRefs.current.forEach((col, i) => { if (!col) return; const r = col.getBoundingClientRect(); if (clientX >= r.left && clientX <= r.right) newBI = i })
    const col = colRefs.current[newBI]; if (!col) return
    const rawMin = Math.round((clientY - col.getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60 - drag.offsetMin
    setDrag(d => d ? { ...d, ghostBarberIdx: newBI, ghostMin: clamp(rawMin) } : d)
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
          body: JSON.stringify({ barber_id: updated.barberId, start_at: startAt.toISOString(), end_at: new Date(startAt.getTime() + updated.durMin*60000).toISOString() })
        })
      } catch(e: any) { console.warn(e.message) }
    }
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: MouseEvent|TouchEvent) => onDragMove(e)
    const end = () => onDragEnd()
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false }); window.addEventListener('touchend', end)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', end); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', end) }
  }, [drag, events, barbers])

  // ── Block drag-to-create ────────────────────────────────────────────────────
  function startBlockDrag(barberId: string, barberIdx: number, startMin: number) {
    const bd = { barberId, barberIdx, startMin: clamp(startMin), endMin: clamp(startMin) + 15 }
    blockDragRef.current = bd
    setBlockDrag(bd)
  }
  useEffect(() => {
    if (!blockDrag) return
    function onMove(e: MouseEvent | TouchEvent) {
      if (!blockDragRef.current) return
      if ('touches' in e) e.preventDefault()
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
      const col = colRefs.current[blockDragRef.current.barberIdx]; if (!col) return
      const rawMin = Math.round((clientY - col.getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60
      const endMin = Math.max(blockDragRef.current.startMin + 5, clamp(rawMin))
      const updated = { ...blockDragRef.current, endMin }
      blockDragRef.current = updated
      setBlockDrag(updated)
    }
    function onEnd() {
      const bd = blockDragRef.current
      if (bd && bd.endMin - bd.startMin >= 5) {
        openCreateBlock(bd.barberId, bd.startMin, bd.endMin - bd.startMin)
      }
      blockDragRef.current = null
      setBlockDrag(null)
      blockDragJustEnded.current = true
      setTimeout(() => { blockDragJustEnded.current = false }, 50)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onEnd)
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onEnd); window.removeEventListener('touchmove', onMove); window.removeEventListener('touchend', onEnd) }
  }, [blockDrag, slotH])

  // ── Create / Block ─────────────────────────────────────────────────────────
  function openCreateBlock(barberId: string, startMin: number, durMin?: number) {
    const duration = durMin || 30
    // Barber sends block as request for approval
    if (isBarber && !isOwnerOrAdmin && barberId === myBarberId) {
      const startAt = new Date(todayStr + 'T' + minToHHMM(clamp(startMin)) + ':00')
      apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({
        type: 'block_time',
        data: { barberId, barberName: barbers.find(b => b.id === barberId)?.name || '', date: todayStr, startMin: clamp(startMin), startAt: startAt.toISOString(), endAt: new Date(startAt.getTime() + duration*60000).toISOString() }
      })}).then(() => showToast('Block request sent for approval')).catch(e => showToast('Error: ' + e.message))
      return
    }
    const id = 'block_' + Date.now()
    const barber = barbers.find(b => b.id === barberId)
    setEvents(prev => [...prev, { id, type: 'block', barberId, barberName: barber?.name || '', clientName: 'BLOCKED', clientPhone: '', serviceId: '', serviceName: 'Blocked', date: todayStr, startMin: clamp(startMin), durMin: duration, status: 'block', paid: false, notes: '', _raw: null }])
    const startAt = new Date(todayStr + 'T' + minToHHMM(clamp(startMin)) + ':00')
    apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({ barber_id: barberId, type: 'block', status: 'block', client_name: 'BLOCKED', service_id: '', start_at: startAt.toISOString(), end_at: new Date(startAt.getTime() + duration*60000).toISOString(), notes: 'Blocked by manager' }) })
      .then(res => { const savedId = res?.booking?.id || res?.id; if (savedId) setEvents(prev => prev.map(e => e.id === id ? { ...e, _raw: { id: savedId } } : e)) })
      .catch(console.warn)
  }

  function openCreate(barberId: string, startMin: number) {
    const id = uid()
    const barber = barbers.find(b => b.id === barberId)
    const defaultSvc = services.find(s => !s.barberIds.length || s.barberIds.includes(barberId))
    setEvents(prev => [...prev, { id, barberId, barberName: barber?.name || '', clientName: '', clientPhone: '', serviceId: defaultSvc?.id || '', serviceName: defaultSvc?.name || '', date: todayStr, startMin: clamp(startMin), durMin: defaultSvc?.durationMin || 30, status: 'booked', paid: false, notes: '', _raw: null }])
    setModal({ open: true, eventId: id, isNew: true })
  }

  async function handleSave(patch: any) {
    const ev = events.find(e => e.id === modal.eventId); if (!ev) return
    const updated = { ...ev, ...patch }
    setEvents(prev => prev.map(e => e.id === ev.id ? updated : e))
    try {
      if (!ev._raw?.id) {
        const startAt = new Date(updated.date + 'T' + minToHHMM(updated.startMin) + ':00')
        const endAt = new Date(startAt.getTime() + (updated.durMin || 30) * 60000)
        const res = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({ barber_id: updated.barberId, service_id: updated.serviceId, client_name: updated.clientName, client_phone: updated.clientPhone || '', start_at: startAt.toISOString(), end_at: endAt.toISOString(), notes: updated.notes || '', status: 'booked', reference_photo_url: updated.photoUrl || '', ...(isStudent ? { booking_type: 'model', student_id: currentUser?.uid || '' } : {}) }) })
        const savedId = res?.booking?.id || res?.id
        if (savedId) setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, _raw: { ...e._raw, ...res, id: savedId }, id: String(savedId) } : e))
      } else {
        await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, { method: 'PATCH', body: JSON.stringify({ barber_id: updated.barberId, service_id: updated.serviceId, client_name: updated.clientName, client_phone: updated.clientPhone || '', status: updated.status, notes: updated.notes || '', reference_photo_url: updated.photoUrl || '' }) })
      }
    } catch(e: any) { console.warn('save:', e.message) }
    setModal({ open: false, eventId: null, isNew: false })
  }

  async function handleDelete() {
    const ev = events.find(e => e.id === modal.eventId); if (!ev) return
    if (!window.confirm('Delete this booking?')) return
    setEvents(prev => prev.filter(e => e.id !== ev.id))
    setModal({ open: false, eventId: null, isNew: false })
    if (ev._raw?.id) { try { await apiFetch(`/api/bookings/${encodeURIComponent(String(ev._raw.id))}`, { method: 'DELETE' }) } catch(e: any) { console.warn(e.message) } }
  }

  function handlePayment(method: string, tip: number) {
    setEvents(prev => prev.map(e => e.id === modal.eventId ? { ...e, paid: true, paymentMethod: method, tipAmount: tip } : e))
  }

  return (
    <Shell page="calendar">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        .cal-event:hover { filter: brightness(1.12); }
        @keyframes slideUp { from { opacity:0; transform:translateX(-50%) translateY(12px) } to { opacity:1; transform:translateX(-50%) translateY(0) } }
        @keyframes wlGhostPulse {
          0%, 100% { box-shadow: 0 0 8px rgba(10,132,255,.15), inset 0 0 0 1px rgba(10,132,255,.12); border-color: rgba(10,132,255,.25); background: rgba(10,132,255,.05); }
          50% { box-shadow: 0 0 22px rgba(10,132,255,.45), inset 0 0 0 1px rgba(10,132,255,.30); border-color: rgba(10,132,255,.55); background: rgba(10,132,255,.12); }
        }
        .wl-ghost-pulse { animation: wlGhostPulse 2.6s ease-in-out infinite; transition: filter .2s; }
        .wl-ghost-pulse:hover { filter: brightness(1.25); }
        @keyframes blockPendingPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(255,107,107,.10); border-color: rgba(255,107,107,.25); background: rgba(255,107,107,.04); }
          50% { box-shadow: 0 0 18px rgba(255,107,107,.40); border-color: rgba(255,107,107,.55); background: rgba(255,107,107,.10); }
        }
        .block-pending-pulse { animation: blockPendingPulse 2.4s ease-in-out infinite; }
        /* Desktop: hide mobile-only elements */
        .cal-search-icon{ display:none !important; }
        .cal-settings-icon{ display:none !important; }
        .cal-date-mobile{ display:none !important; }
        .cal-today-desktop{ display:inline-flex !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.15); border-radius: 3px; }
        /* Mobile: prevent scroll bounce and pinch zoom */
        @media(max-width:768px){
          body { overscroll-behavior: none; touch-action: pan-x pan-y; }
          .cal-scroll-lock { touch-action: none !important; overflow: hidden !important; }
          /* Mobile topbar — single row, title centered */
          .cal-topbar-row{
            flex-direction:row !important;
            align-items:center !important;
            justify-content:space-between !important;
            gap:0 !important;
            flex-wrap:nowrap !important;
          }
          /* Hide title+date on mobile — save space */
          .cal-topbar-left{
            display:none !important;
          }
          /* Buttons row — compact, center, no wrap */
          .cal-topbar-btns{
            flex-wrap:nowrap !important;
            gap:4px !important;
            justify-content:center !important;
            width:100% !important;
            overflow-x:auto !important;
            padding:0 4px !important;
          }
          .cal-topbar-btns button, .cal-topbar-btns label, .cal-topbar-btns div {
            flex-shrink:0 !important;
          }
          /* Hide desktop Date btn, show date pill instead */
          .cal-btn-date{ display:none !important; }
          .cal-date-mobile{ display:inline-flex !important; }
          .cal-today-desktop{ display:none !important; }
          /* Hide text labels on mobile — show only icons */
          .cal-btn-text{ display:none !important; }
          .cal-btn-date{ display:none !important; }
          .cal-search-full{ display:none !important; }
          .cal-search-icon{ display:flex !important; }
          .cal-settings-btn{ display:none !important; }
          .cal-settings-icon{ display:flex !important; }
          /* Hide Calendar title + date on mobile */
          .cal-topbar-left{ display:none !important; }
          /* Compact topbar on mobile — safe area for status bar */
          .cal-topbar-wrap{ padding:calc(env(safe-area-inset-top, 0px) + 6px) 8px 8px !important; }
        }
        select option { background: #111; }
        input[type=date],input[type=time] { color-scheme: dark; }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Topbar */}
        <div className="cal-topbar-wrap" style={{ padding: '10px 18px 12px', background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', flexShrink: 0 }}>
          <div className="cal-topbar-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            {!isMobile && (
              <div className="cal-topbar-left">
                <h2 className="page-title" style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Calendar</h2>
                <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>{anchor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            )}
            <div className="cal-topbar-btns" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Date picker — desktop only */}
              <button className="cal-btn-date" onClick={() => setDatePickerOpen(true)} style={{ height: 40, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>Date</button>

              {/* Prev */}
              <button onClick={() => setAnchor(a => { const x=new Date(a); x.setDate(x.getDate()-1); return x })} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit', flexShrink: 0 }}>‹</button>

              {/* Today — desktop only */}
              {!isMobile && <button onClick={() => { const d=new Date(); d.setHours(0,0,0,0); setAnchor(d) }} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', flexShrink: 0 }}>Today</button>}

              {/* Date pill — mobile only, shows current date, opens picker */}
              {isMobile && (
                <button onClick={() => setDatePickerOpen(true)} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.07)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', flexShrink: 0, letterSpacing: '.02em' }}>
                  {anchor.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </button>
              )}

              {/* Next */}
              <button onClick={() => setAnchor(a => { const x=new Date(a); x.setDate(x.getDate()+1); return x })} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit', flexShrink: 0 }}>›</button>

              {/* Search — full on desktop */}
              <input className="cal-search-full" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ height: 36, width: 'min(200px,40vw)', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13 }} />

              {/* Search — icon on mobile, expands on tap */}
              <div className="cal-search-icon" style={{ display: 'none', position: 'relative', alignItems: 'center' }}>
                {search
                  ? <input autoFocus placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} onBlur={() => { if (!search) {} }} style={{ height: 36, width: 130, borderRadius: 999, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.08)', color: '#fff', padding: '0 14px 0 32px', outline: 'none', fontSize: 12 }} />
                  : <button onClick={() => setSearch(' ')} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    </button>
                }
              </div>

              {/* Settings — desktop only */}
              {isOwnerOrAdmin && <button className="cal-settings-btn" onClick={() => setSettingsOpen(true)} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Settings</button>}

              {/* Settings icon — mobile */}
              {(isOwnerOrAdmin || isStudent || isBarber) && <button onClick={() => setSettingsOpen(true)} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} className="cal-settings-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>}

              {/* New booking */}
              {isStudent ? (
                <button onClick={() => {
                  // Collect ALL free 90min slots
                  const freeSlots: { min: number; mentorId: string; mentorName: string }[] = []
                  for (let m = START_HOUR * 60; m <= END_HOUR * 60 - 90; m += 5) {
                    const mid = studentSlotMentorMap.get(m)
                    if (!mid) continue
                    let ok = true
                    for (let c = m; c < m + 90; c += 5) { if (!studentSlotMentorMap.has(c)) { ok = false; break } }
                    if (ok) {
                      const mentor = barbers.find(b => b.id === mid)
                      // Only add if previous slot wasn't same time (skip 5-min overlaps)
                      if (!freeSlots.length || freeSlots[freeSlots.length-1].min + 5 < m || freeSlots[freeSlots.length-1].mentorId !== mid) {
                        freeSlots.push({ min: m, mentorId: mid, mentorName: mentor?.name || '' })
                      }
                    }
                  }
                  if (!freeSlots.length) { showToast('No free 90min slot available today'); return }
                  setSlotPicker(freeSlots)
                }} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(168,107,255,.80)', background: 'rgba(0,0,0,.75)', color: '#d4b8ff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 0 14px rgba(168,107,255,.20)', whiteSpace: 'nowrap', flexShrink: 0 }}>+ Model</button>
              ) : (
                <button onClick={() => openCreate(isBarber ? myBarberId : (barbers[0]?.id || ''), clamp(new Date().getHours()*60))} style={{ height: 36, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(0,0,0,.75)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', boxShadow: '0 0 14px rgba(10,132,255,.20)', whiteSpace: 'nowrap', flexShrink: 0 }}>+ New</button>
              )}

              {/* Zoom +/- — desktop only */}
              {!isMobile && <>
                <button onClick={() => setSlotH(h => Math.max(6, h-2))} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 700, flexShrink: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{'\u2212'}</button>
                <button onClick={() => setSlotH(h => Math.min(22, h+2))} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 17, fontWeight: 700, flexShrink: 0, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              </>}

              {/* Reload — desktop only */}
              {!isMobile && <button onClick={reload} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 15, flexShrink: 0 }}>↻</button>}
            </div>
          </div>
        </div>

        {/* Calendar grid */}
        {(() => {
          // On mobile (owner/admin with multiple barbers): show BARBERS_PER_PAGE at a time
          const pageBarbers = (isMobile && !isStudent && !isBarber && visibleBarbers.length > BARBERS_PER_PAGE)
            ? visibleBarbers.slice(mobilePage * BARBERS_PER_PAGE, mobilePage * BARBERS_PER_PAGE + BARBERS_PER_PAGE)
            : visibleBarbers
          const timeColW = isMobile ? 46 : 90
          return (
        <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden', touchAction: drag ? 'none' : 'pan-x pan-y' }} ref={scrollContainerRef} onTouchStart={onPinchStart} onTouchMove={onPinchMove} onTouchEnd={onPinchEnd}>
          <div style={{ minWidth: timeColW + pageBarbers.length * COL_MIN }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(${pageBarbers.length}, minmax(${COL_MIN}px,1fr))`, borderBottom: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.20)', position: 'sticky', top: 0, zIndex: 10 }}>
              <div style={{ padding: '10px 12px', borderRight: '1px solid rgba(255,255,255,.10)', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', textAlign: 'center' }}>Time</div>
              {pageBarbers.map((b, i) => {
                const attachedStudents = studentUsers.filter(s => s.mentorIds.includes(b.id))
                return (
                  <div key={b.id} style={{ padding: '10px 12px', borderRight: i < visibleBarbers.length-1 ? '1px solid rgba(255,255,255,.08)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {b.id === '__student__' ? (
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(168,107,255,.20)', border: '1px solid rgba(168,107,255,.30)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4b8ff" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
                      </div>
                    ) : b.photo ? <img src={b.photo} alt={b.name} style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', flexShrink: 0 }} onError={e => (e.currentTarget.style.display='none')} /> : <div style={{ width: 10, height: 10, borderRadius: 999, background: b.color, flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
                        <span style={{ fontWeight: 900, fontSize: 13, whiteSpace: 'nowrap' }}>{b.name}</span>
                        {attachedStudents.length > 0 && attachedStudents.map(s => (
                          <span key={s.id} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 999, border: '1px solid rgba(168,107,255,.25)', background: 'rgba(168,107,255,.08)', color: 'rgba(168,107,255,.65)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {s.name.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                      {b.level && <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: 'rgba(255,255,255,.35)' }}>{b.level}</div>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Body */}
            <div style={{ display: 'grid', gridTemplateColumns: `${timeColW}px repeat(${pageBarbers.length}, minmax(${COL_MIN}px,1fr))`, height: totalH, position: 'relative' }}>
              {/* Time labels */}
              <div style={{ borderRight: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.12)', position: 'relative' }}>
                {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i*slotH*12, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8, color: 'rgba(255,255,255,.40)', fontSize: 11 }}>{(() => {
                    const h = START_HOUR + i
                    if (h === 0) return '12 AM'
                    if (h === 12) return '12 PM'
                    return h < 12 ? `${h} AM` : `${h-12} PM`
                  })()}</div>
                ))}
              </div>

              {/* Columns */}
              {pageBarbers.map((barber, bi) => {
                // Student: all model events go to the single student column
                const colEvents = isStudent
                  ? filtered.filter(e => e._raw?.booking_type === 'model' || e._raw?.booking_type === 'training')
                  : filtered.filter(e => e.barberId === barber.id)
                return (
                  <div key={barber.id} ref={el => { colRefs.current[bi] = el }}
                    style={{ position: 'relative', borderRight: bi < visibleBarbers.length-1 ? '1px solid rgba(255,255,255,.08)' : 'none', background: blockDrag?.barberIdx === bi ? 'rgba(255,107,107,.03)' : drag?.ghostBarberIdx === bi ? 'rgba(10,132,255,.03)' : 'transparent', transition: 'background .15s', touchAction: (drag || blockDrag) ? 'none' : 'pan-y' }}
                    onMouseDown={e => {
                      if (e.button !== 0 || !e.shiftKey) return
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      if (isStudent) return
                      const min = Math.round((e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60
                      // Shift+click on empty space starts block drag
                      if (isOwnerOrAdmin || (isBarber && barber.id === myBarberId)) { e.preventDefault(); startBlockDrag(barber.id, bi, min); return }
                    }}
                    onTouchStart={e => {
                      clearTimeout(blockLongPressTimer.current)
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      if (isBarber && !isOwnerOrAdmin && barber.id === myBarberId && e.touches.length === 1) {
                        const min = Math.round((e.touches[0].clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60
                        const bId = barber.id
                        blockLongPressTimer.current = setTimeout(() => { startBlockDrag(bId, bi, min) }, 400)
                      }
                    }}
                    onTouchEnd={() => { clearTimeout(blockLongPressTimer.current) }}
                    onTouchMove={() => { clearTimeout(blockLongPressTimer.current) }}
                    onClick={e => {
                      if (blockDrag || blockDragRef.current || blockDragJustEnded.current) return
                      if ((e.target as HTMLElement).closest('.cal-event')) return
                      if (isBarber && barber.id !== myBarberId) return
                      const min = Math.round((e.clientY - (e.currentTarget as HTMLElement).getBoundingClientRect().top) / slotH) * 5 + START_HOUR * 60
                      // Student: find which mentor is free at this slot
                      if (isStudent) {
                        const slotMin = clamp(min)
                        const mentorId = studentSlotMentorMap.get(slotMin)
                        if (!mentorId) return // slot is blocked — no free mentor
                        // Check if model would conflict (90min block)
                        const modelDur = 90
                        let hasConflict = false
                        for (let m = slotMin; m < slotMin + modelDur; m += 5) {
                          if (!studentSlotMentorMap.has(m)) { hasConflict = true; break }
                        }
                        if (hasConflict) { showToast('Not enough free time for 90min model at this slot'); return }
                        openCreate(mentorId, slotMin)
                        return
                      }
                      (isOwnerOrAdmin || (isBarber && barber.id === myBarberId)) ? setContextMenu({ x: e.clientX, y: e.clientY, barberId: barber.id, min: clamp(min) }) : openCreate(barber.id, clamp(min))
                    }}>
                    {/* Student: blocked slots overlay (where no mentor is free) */}
                    {isStudent && barber.id === '__student__' && studentBlockedRanges.map((range, ri) => {
                      const STRIPE = 'repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0px,rgba(255,255,255,.07) 3px,transparent 3px,transparent 9px)'
                      return (
                        <div key={ri} style={{ position: 'absolute', left: 0, right: 0, top: minToY(range.startMin), height: minToY(range.endMin) - minToY(range.startMin), zIndex: 2, background: 'rgba(0,0,0,.55)', backgroundImage: STRIPE, cursor: 'not-allowed', pointerEvents: 'none' }} />
                      )
                    })}
                    {/* Off-hours blocks — gray, like red block but for non-working time */}
                    {(() => {
                      const wh = (workHours as any)[barber.id]
                      if (!wh) return null
                      const { startMin, endMin, dayOff } = wh as { startMin: number; endMin: number; dayOff: boolean }
                      const totalPx = minToY(END_HOUR * 60)
                      const sy = minToY(startMin)
                      const ey = minToY(endMin)

                      // Same stripe pattern as red block but gray
                      const STRIPE = 'repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0px,rgba(255,255,255,.07) 3px,transparent 3px,transparent 9px)'
                      const BG = 'rgba(0,0,0,.72)'
                      const BORDER_COLOR = 'rgba(255,255,255,.12)'
                      const TIME_PILL = { fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 999, background: 'rgba(0,0,0,.50)', border: '1px solid rgba(255,255,255,.18)', color: 'rgba(255,255,255,.55)', letterSpacing: '.04em', fontFamily: 'Inter,sans-serif' } as React.CSSProperties

                      if (dayOff) return (
                        <div style={{ position: 'absolute', inset: 0, zIndex: 2, background: BG, backgroundImage: STRIPE, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', pointerEvents: 'none' }}>
                          <span style={{ ...TIME_PILL, fontSize: 11 }}>Day off</span>
                        </div>
                      )

                      return (
                        <>
                          {/* TOP — before work */}
                          {sy > 0 && (
                            <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: sy, zIndex: 2, background: BG, backgroundImage: STRIPE, cursor: 'default', pointerEvents: 'none' }}>
                              {/* Border bottom = work start */}
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: BORDER_COLOR, pointerEvents: 'none' }} />
                              {/* Label */}
                              {sy > 32 && (
                                <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                                  <span style={TIME_PILL}>{minToHHMM(startMin)}</span>
                                </div>
                              )}
                              {/* Handle zone — owner/admin/barber(own column) can drag */}
                              {(isOwnerOrAdmin || (isBarber && barber.id === myBarberId)) && (
                                <div
                                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, cursor: 'ns-resize', pointerEvents: 'all', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11 }}
                                  onMouseDown={e => { e.stopPropagation(); offResize.current = { barberId: barber.id, type: 'top', startY: e.clientY, origMin: startMin } }}
                                  onTouchStart={e => { e.stopPropagation(); offResize.current = { barberId: barber.id, type: 'top', startY: e.touches[0].clientY, origMin: startMin } }}>
                                  <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.35)' }} />
                                </div>
                              )}
                            </div>
                          )}

                          {/* BOTTOM — after work */}
                          {ey < totalPx && (
                            <div style={{ position: 'absolute', left: 0, right: 0, top: ey, height: totalPx - ey, zIndex: 2, background: BG, backgroundImage: STRIPE, cursor: 'default', pointerEvents: 'none' }}>
                              {/* Border top = work end */}
                              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: BORDER_COLOR, pointerEvents: 'none' }} />
                              {/* Handle zone — owner/admin/barber(own column) can drag */}
                              {(isOwnerOrAdmin || (isBarber && barber.id === myBarberId)) && (
                                <div
                                  style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, cursor: 'ns-resize', pointerEvents: 'all', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 11 }}
                                  onMouseDown={e => { e.stopPropagation(); offResize.current = { barberId: barber.id, type: 'bottom', startY: e.clientY, origMin: endMin } }}
                                  onTouchStart={e => { e.stopPropagation(); offResize.current = { barberId: barber.id, type: 'bottom', startY: e.touches[0].clientY, origMin: endMin } }}>
                                  <div style={{ width: 32, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.35)' }} />
                                </div>
                              )}
                              {/* Label */}
                              {(totalPx - ey) > 32 && (
                                <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
                                  <span style={TIME_PILL}>{minToHHMM(endMin)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}
                    {/* Grid lines */}
                    {Array.from({ length: (END_HOUR-START_HOUR)*12 }, (_, i) => (
                      <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: i*slotH, height: 1, background: i%12===0 ? 'rgba(255,255,255,.10)' : i%4===0 ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.015)', pointerEvents: 'none' }} />
                    ))}
                    {/* Now line — full width across all columns */}
                    {showNow && (
                      <div style={{ position: 'absolute', left: 0, right: 0, top: nowY, height: 2, background: 'rgba(10,132,255,.85)', boxShadow: '0 0 14px rgba(10,132,255,.40)', pointerEvents: 'none', zIndex: 20 }}>
                        {bi === 0 && <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: 999, background: '#0a84ff', boxShadow: '0 0 0 3px rgba(10,132,255,.25)' }} />}
                      </div>
                    )}
                    {/* Ghost */}
                    {drag?.ghostBarberIdx===bi && (() => {
                      const dragEv = events.find(e => e.id === drag.eventId); if (!dragEv) return null
                      return <div style={{ position: 'absolute', left: 8, right: 8, top: minToY(drag.ghostMin), height: Math.max(slotH*6, (dragEv.durMin/5)*slotH)-2, borderRadius: 14, border: '2px solid rgba(10,132,255,.75)', background: 'rgba(10,132,255,.12)', pointerEvents: 'none', zIndex: 40 }}><div style={{ padding: '6px 10px', fontWeight: 900, fontSize: 11, color: '#d7ecff' }}>{dragEv.clientName} — {minToHHMM(drag.ghostMin)}</div></div>
                    })()}
                    {/* Block drag ghost */}
                    {blockDrag?.barberIdx === bi && (() => {
                      const h = minToY(blockDrag.endMin) - minToY(blockDrag.startMin)
                      return <div style={{ position: 'absolute', left: 4, right: 4, top: minToY(blockDrag.startMin), height: Math.max(slotH * 2, h), borderRadius: 10, border: '2px dashed rgba(255,107,107,.65)', background: 'repeating-linear-gradient(45deg,rgba(255,107,107,.08) 0px,rgba(255,107,107,.08) 6px,rgba(255,107,107,.03) 6px,rgba(255,107,107,.03) 12px)', pointerEvents: 'none', zIndex: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,107,107,.80)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,107,107,.80)', textTransform: 'uppercase' }}>{minToHHMM(blockDrag.startMin)}–{minToHHMM(blockDrag.endMin)}</span>
                        <span style={{ fontSize: 9, color: 'rgba(255,107,107,.55)' }}>{blockDrag.endMin - blockDrag.startMin}min</span>
                      </div>
                    })()}
                    {/* Events */}
                    {colEvents.map(ev => {
                      const top = minToY(ev.startMin)
                      const height = Math.max(slotH*6, (ev.durMin/5)*slotH)
                      const isBlock = ev.type === 'block' || ev.status === 'block'
                      const canDrag = isStudent ? false : (isBlock ? isOwnerOrAdmin : (!isBarber || ev.barberId === myBarberId))

                      const isPending = !!(ev as any)._pendingResize
                      if (isBlock) return (
                        <div key={ev.id}
                          className={isPending ? 'block-pending-pulse' : ''}
                          style={{ position: 'absolute', left: 4, right: 4, top, height: height-2, borderRadius: 10, background: isPending ? 'rgba(255,107,107,.08)' : 'repeating-linear-gradient(45deg,rgba(255,107,107,.10) 0px,rgba(255,107,107,.10) 6px,rgba(255,107,107,.04) 6px,rgba(255,107,107,.04) 12px)', border: `1px solid ${isPending ? 'rgba(255,107,107,.45)' : drag?.eventId===ev.id ? 'rgba(255,107,107,.70)' : 'rgba(255,107,107,.28)'}`, zIndex: drag?.eventId===ev.id ? 50 : 3, overflow: 'hidden', cursor: isOwnerOrAdmin ? (drag?.eventId===ev.id ? 'grabbing' : 'grab') : 'default', opacity: drag?.eventId===ev.id ? 0.5 : 1, userSelect: 'none' }}
                          onMouseDown={e => { if (!isOwnerOrAdmin || e.button!==0) return; e.stopPropagation(); startDrag(e, ev, bi) }}
                          onTouchStart={e => { if (!isOwnerOrAdmin) return; e.stopPropagation(); startDrag(e, ev, bi) }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,107,107,.80)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                              <span style={{ fontSize: 10, textTransform: 'uppercase', color: isPending ? 'rgba(255,107,107,.90)' : 'rgba(255,107,107,.80)', fontWeight: 900 }}>{isPending ? 'Pending review' : 'Blocked'} {minToHHMM(ev.startMin)}–{minToHHMM(ev.startMin+ev.durMin)}</span>
                            </div>
                            {(isOwnerOrAdmin || (isBarber && ev.barberId === currentUser?.barber_id)) && <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setEvents(prev => prev.filter(x => x.id!==ev.id)); if (ev._raw?.id) apiFetch('/api/bookings/'+encodeURIComponent(String(ev._raw.id)),{method:'DELETE'}).catch(console.warn) }} style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.10)', color: 'rgba(255,107,107,.90)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'inherit' }}>✕</button>}
                          </div>
                          {(isOwnerOrAdmin || (isBarber && ev.barberId === currentUser?.barber_id)) && (() => {
                            const handleResize = (startY: number, getY: (e: any) => number, evId: string, startDur: number, rawObj: any, startMin: number, dateStr: string, addMove: (fn: any) => void, addEnd: (fn: any) => void, rmMove: (fn: any) => void, rmEnd: (fn: any) => void) => {
                              let currentDur = startDur
                              const onMove = (e: any) => {
                                if (e.preventDefault) e.preventDefault()
                                const dy = getY(e) - startY
                                currentDur = Math.max(5, startDur + Math.round(dy / slotH) * 5)
                                setEvents(prev => prev.map(x => x.id === evId ? { ...x, durMin: currentDur } : x))
                              }
                              const onEnd = () => {
                                rmMove(onMove); rmEnd(onEnd)
                                if (currentDur === startDur) return
                                // Revert to original
                                setEvents(prev => prev.map(x => x.id === evId ? { ...x, durMin: startDur } : x))
                                const sa = new Date(dateStr + 'T' + minToHHMM(startMin) + ':00')
                                if (isBarber && !isOwnerOrAdmin) {
                                  if (confirm(`Send block request? ${minToHHMM(startMin)}–${minToHHMM(startMin + currentDur)} (${currentDur}min)`)) {
                                    setEvents(prev => prev.map(x => x.id === evId ? { ...x, durMin: currentDur, _pendingResize: true } : x))
                                    apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({ type: 'block_time', data: { barberId: currentUser?.barber_id, startAt: sa.toISOString(), endAt: new Date(sa.getTime() + currentDur * 60000).toISOString(), bookingId: String(rawObj?.id) } }) }).catch(console.warn)
                                  }
                                } else {
                                  if (confirm(`Resize block to ${minToHHMM(startMin)}–${minToHHMM(startMin + currentDur)} (${currentDur}min)?`)) {
                                    setEvents(prev => prev.map(x => x.id === evId ? { ...x, durMin: currentDur } : x))
                                    apiFetch('/api/bookings/' + encodeURIComponent(String(rawObj?.id)), { method: 'PATCH', body: JSON.stringify({ end_at: new Date(sa.getTime() + currentDur * 60000).toISOString() }) }).catch(console.warn)
                                  }
                                }
                              }
                              addMove(onMove); addEnd(onEnd)
                            }
                            return <div
                              onMouseDown={e => {
                                e.stopPropagation(); e.preventDefault()
                                handleResize(e.clientY, (me: MouseEvent) => me.clientY, ev.id, ev.durMin, ev._raw, ev.startMin, ev.date,
                                  fn => window.addEventListener('mousemove', fn),
                                  fn => window.addEventListener('mouseup', fn),
                                  fn => window.removeEventListener('mousemove', fn),
                                  fn => window.removeEventListener('mouseup', fn))
                              }}
                              onTouchStart={e => {
                                e.stopPropagation()
                                handleResize(e.touches[0].clientY, (te: TouchEvent) => te.touches[0].clientY, ev.id, ev.durMin, ev._raw, ev.startMin, ev.date,
                                  fn => window.addEventListener('touchmove', fn, { passive: false }),
                                  fn => window.addEventListener('touchend', fn),
                                  fn => window.removeEventListener('touchmove', fn),
                                  fn => window.removeEventListener('touchend', fn))
                              }}
                              style={{ position: 'absolute', left: 10, right: 10, bottom: 4, height: 14, borderRadius: 999, background: 'rgba(255,107,107,.40)', cursor: 'ns-resize', touchAction: 'none' }} />
                          })()}
                        </div>
                      )

                      return (
                        <div key={ev.id} className="cal-event"
                          style={{ position: 'absolute', left: 8, right: 8, top, height: height-2, borderRadius: 14, border: `1px solid ${drag?.eventId===ev.id ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.10)'}`, background: (ev._raw?.booking_type === 'model' || ev._raw?.booking_type === 'training') ? 'linear-gradient(180deg,rgba(168,107,255,.26),rgba(168,107,255,.10))' : `linear-gradient(180deg,${barber.color}26,${barber.color}12)`, padding: '7px 10px', cursor: canDrag ? (drag ? 'grabbing' : 'grab') : 'pointer', userSelect: 'none', overflow: 'hidden', zIndex: drag?.eventId===ev.id ? 50 : 5, opacity: drag?.eventId===ev.id ? 0.5 : 1, transition: 'opacity .15s' }}
                          onMouseDown={e => { if (!canDrag || e.button!==0) return; startDrag(e, ev, bi) }}
                          onTouchStart={e => { if (!canDrag) return; startDrag(e, ev, bi) }}
                          onClick={e => { e.stopPropagation(); if (!drag) setModal({ open: true, eventId: ev.id, isNew: false }) }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ fontWeight: 900, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{ev.clientName}</div>
                            <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                              {ev._raw?.booking_type === 'model' && <Chip label="Model" type="model" />}
                              {ev._raw?.booking_type === 'training' && <Chip label="Training" type="model" />}
                              {(ev._raw?.booking_type === 'model' || ev._raw?.booking_type === 'training') ? (
                                ev.status === 'completed' || ev.status === 'done'
                                  ? <Chip label="✓ Done" type="paid" />
                                  : <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); if (ev._raw?.id) { apiFetch('/api/bookings/'+encodeURIComponent(String(ev._raw.id)),{method:'PATCH',body:JSON.stringify({status:'completed'})}).then(()=>setEvents(prev=>prev.map(x=>x.id===ev.id?{...x,status:'completed'}:x))).catch(console.warn) } else { setEvents(prev=>prev.map(x=>x.id===ev.id?{...x,status:'completed'}:x)) } }} style={{ height: 20, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.50)', cursor: 'pointer', fontSize: 9, fontWeight: 700, fontFamily: 'inherit' }}>Mark done</button>
                              ) : (
                                ev.paid ? <Chip label="Paid" type="paid" /> : <Chip label={ev.status} type={ev.status} />
                              )}
                            </div>
                          </div>
                          {height > 40 && <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{minToHHMM(ev.startMin)} · {ev.serviceName}</div>}
                        </div>
                      )
                    })}
                    {/* Waitlist ghost entries */}
                    {!isStudent && waitlistEntries.filter(w => w.barber_id === barber.id).map((w, wi) => {
                      // Place at first available slot for this barber
                      const dur = w.duration_minutes || 30
                      // Find a free slot in working hours
                      const wh = (workHours as any)[barber.id]
                      if (!wh || wh.dayOff) return null
                      const prefStart = Number(w.preferred_start_min || wh.startMin)
                      const prefEnd = Number(w.preferred_end_min || wh.endMin)
                      const startSearch = Math.max(wh.startMin, prefStart)
                      const endSearch = Math.min(wh.endMin, prefEnd)
                      let slotMin = -1
                      for (let m = startSearch; m <= endSearch - dur; m += 5) {
                        const hasConflict = colEvents.some(e => {
                          const eEnd = e.startMin + e.durMin
                          return m < eEnd && (m + dur) > e.startMin
                        })
                        if (!hasConflict) { slotMin = m; break }
                      }
                      if (slotMin < 0) return null
                      const top = minToY(slotMin)
                      const height = Math.max(24, (dur / 5) * slotH) - 2
                      return (
                        <div key={`wl-${w.id}`} className="wl-ghost-pulse" style={{ position: 'absolute', left: 8, right: 8, top, height, borderRadius: 14, border: '1px solid rgba(10,132,255,.35)', background: 'rgba(10,132,255,.08)', zIndex: 3, padding: '6px 10px', cursor: 'pointer', overflow: 'hidden', boxShadow: '0 0 12px rgba(10,132,255,.20), inset 0 0 0 1px rgba(10,132,255,.15)' }}
                          onClick={() => setWlConfirm({ w, barberId: barber.id, barberName: barber.name, slotMin, dur })}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#bfe0ff' }}>{w.client_name || 'Waitlist'}</div>
                          <div style={{ fontSize: 9, color: 'rgba(10,132,255,.70)', marginTop: 1 }}>{minToHHMM(slotMin)} · {dur}min · {prefStart !== wh.startMin || prefEnd !== wh.endMin ? `${minToHHMM(prefStart)}-${minToHHMM(prefEnd)}` : 'WAITLIST'}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
          )
        })()}

        {/* Mobile page dots — floating over calendar */}
        {isMobile && !isStudent && !isBarber && visibleBarbers.length > BARBERS_PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '6px 0', position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 10, pointerEvents: 'none' }}>
            {Array.from({ length: Math.ceil(visibleBarbers.length / BARBERS_PER_PAGE) }, (_, i) => (
              <button key={i} onClick={() => setMobilePage(i)}
                style={{ width: mobilePage === i ? 18 : 8, height: 8, borderRadius: 4, border: 'none', background: mobilePage === i ? 'rgba(10,132,255,.80)' : 'rgba(255,255,255,.20)', cursor: 'pointer', transition: 'all .2s', padding: 0, pointerEvents: 'auto' }} />
            ))}
          </div>
        )}

        {loading && <div style={{ position: 'fixed', bottom: 20, right: 20, padding: '8px 16px', borderRadius: 999, background: 'rgba(10,132,255,.20)', border: '1px solid rgba(10,132,255,.40)', color: '#d7ecff', fontSize: 12, zIndex: 99 }}>Loading…</div>}
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const cmBarber = barbers.find(b=>b.id===contextMenu.barberId)
        const hasStudents = studentUsers.some(s => s.mentorIds.includes(contextMenu.barberId))
        const cmItems = [
          { label: 'Booking', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d7ecff" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, bg: 'rgba(10,132,255,.18)', brd: 'rgba(10,132,255,.35)', col: '#d7ecff', fn: () => { setContextMenu(null); openCreate(contextMenu.barberId, contextMenu.min) } },
          ...(hasStudents ? [{
            label: 'Training', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d4b8ff" strokeWidth="2.2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>, bg: 'rgba(168,107,255,.18)', brd: 'rgba(168,107,255,.35)', col: '#d4b8ff', fn: () => { setContextMenu(null); setTrainingModal({ barberId: contextMenu.barberId, barberName: cmBarber?.name || '', min: contextMenu.min }) }
          }] : []),
          { label: 'Block', icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffd0d0" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>, bg: 'rgba(255,107,107,.12)', brd: 'rgba(255,107,107,.25)', col: '#ffd0d0', fn: () => { setContextMenu(null); openCreateBlock(contextMenu.barberId, contextMenu.min) } },
        ]
        // Clamp position to screen
        const top = Math.max(8, Math.min(contextMenu.y - 24, window.innerHeight - 120))
        const left = Math.max(8, Math.min(contextMenu.x - 90, window.innerWidth - 200))
        return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.25)' }} onClick={() => setContextMenu(null)}>
          <div style={{ position: 'fixed', left, top, zIndex: 151, borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.80)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 16px 40px rgba(0,0,0,.65), inset 0 0 0 0.5px rgba(255,255,255,.06)', padding: '10px 10px 8px', fontFamily: 'Inter,sans-serif' }} onClick={e => e.stopPropagation()}>
            {/* Time + barber */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{minToHHMM(contextMenu.min)}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,.35)' }}>{cmBarber?.name}</span>
            </div>
            {/* Buttons in a row */}
            <div style={{ display: 'flex', gap: 4 }}>
              {cmItems.map(item => (
                <button key={item.label} onClick={item.fn} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 10, border: `1px solid ${item.brd}`, background: item.bg, color: item.col, cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        )
      })()}

      {/* Drag confirm */}
      {dragConfirm && (() => {
        const ev = events.find(e => e.id === dragConfirm.eventId); if (!ev) return null
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
            <div style={{ width: 'min(380px,92vw)', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,.55), inset 0 0 0 0.5px rgba(255,255,255,.06)', padding: 20, color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13, color: 'rgba(255,255,255,.70)', marginBottom: 14 }}>Move booking</div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.08em' }}>{dragConfirm.newBarberName}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{minToHHMM(dragConfirm.newMin)}</div>
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

      {/* Training modal */}
      {trainingModal && (() => {
        const barberStudents = studentUsers.filter(s => s.mentorIds.includes(trainingModal.barberId))
        const TRAINING_TYPES = [
          { value: 'model', label: 'Model haircut', durMin: 90 },
          { value: 'beard', label: 'Beard training', durMin: 90 },
          { value: 'head', label: 'Head training', durMin: 90 },
          { value: 'beard_head', label: 'Beard + Head', durMin: 90 },
          { value: 'theory', label: 'Theory', durMin: 60 },
        ]
        function TrainingForm() {
          const [studentId, setStudentId] = React.useState(barberStudents[0]?.id || '')
          const [trainingType, setTrainingType] = React.useState('model')
          const [tNotes, setTNotes] = React.useState('')
          const [tSaving, setTSaving] = React.useState(false)
          const tt = TRAINING_TYPES.find(t => t.value === trainingType) || TRAINING_TYPES[0]
          const student = barberStudents.find(s => s.id === studentId)
          async function saveTraining() {
            if (!studentId || !student) return
            setTSaving(true)
            const clientName = `Training · ${student.name} · ${tt.label}`
            const startAt = new Date(todayStr + 'T' + minToHHMM(trainingModal.min) + ':00')
            const endAt = new Date(startAt.getTime() + tt.durMin * 60000)
            const id = uid()
            setEvents(prev => [...prev, { id, type: 'booking' as const, barberId: trainingModal.barberId, barberName: trainingModal.barberName, clientName, clientPhone: '', serviceId: '', serviceName: tt.label, date: todayStr, startMin: clamp(trainingModal.min), durMin: tt.durMin, status: 'model', paid: false, notes: tNotes, _raw: { booking_type: 'training', student_id: studentId, training_type: trainingType } }])
            try {
              const res = await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({ barber_id: trainingModal.barberId, client_name: clientName, start_at: startAt.toISOString(), end_at: endAt.toISOString(), notes: tNotes || tt.label, status: 'booked', booking_type: 'training', student_id: studentId, training_type: trainingType }) })
              const savedId = res?.id || res?.booking?.id
              if (savedId) setEvents(prev => prev.map(e => e.id === id ? { ...e, _raw: { ...e._raw, id: savedId }, id: String(savedId) } : e))
            } catch (e: any) { console.warn('training save:', e.message) }
            setTSaving(false); setTrainingModal(null)
          }
          const mInp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
          const mLbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)' }}>
                  <div style={{ ...mLbl, marginBottom: 2 }}>Time</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{minToHHMM(trainingModal.min)} — {minToHHMM(trainingModal.min + tt.durMin)}</div>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)' }}>
                  <div style={{ ...mLbl, marginBottom: 2 }}>Duration</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{tt.durMin} min</div>
                </div>
              </div>
              {barberStudents.length > 1 && (
                <div>
                  <label style={mLbl}>Student</label>
                  <select value={studentId} onChange={e => setStudentId(e.target.value)} style={mInp}>
                    {barberStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={mLbl}>Training type</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {TRAINING_TYPES.map(t => (
                    <button key={t.value} onClick={() => setTrainingType(t.value)}
                      style={{ height: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${trainingType === t.value ? 'rgba(168,107,255,.65)' : 'rgba(255,255,255,.12)'}`, background: trainingType === t.value ? 'rgba(168,107,255,.16)' : 'rgba(255,255,255,.04)', color: trainingType === t.value ? '#d4b8ff' : 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' as const }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={mLbl}>Notes</label>
                <textarea value={tNotes} onChange={e => setTNotes(e.target.value)} placeholder="Lesson details…" rows={2}
                  style={{ ...mInp, height: 'auto', padding: '10px 12px', resize: 'vertical' as const, lineHeight: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setTrainingModal(null)} style={{ height: 42, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>Cancel</button>
                <button onClick={saveTraining} disabled={tSaving || !studentId} style={{ height: 42, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(168,107,255,.55)', background: 'rgba(168,107,255,.18)', color: '#d4b8ff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13, opacity: tSaving ? .5 : 1 }}>
                  {tSaving ? 'Saving…' : 'Schedule training'}
                </button>
              </div>
            </div>
          )
        }
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setTrainingModal(null) }}>
            <div style={{ width: 'min(480px,100%)', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,.60), inset 0 0 0 0.5px rgba(255,255,255,.07)', color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
              <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.03)', borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>Schedule training</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 3, letterSpacing: '.08em' }}>{todayStr} · {trainingModal.barberName}</div>
                </div>
                <button onClick={() => setTrainingModal(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
              </div>
              <div style={{ padding: '16px 20px 20px' }}>
                <TrainingForm />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Date picker */}
      {/* Schedule change confirm */}
      {scheduleConfirm && (() => {
        const { barberId, barberName, dow, startMin, endMin } = scheduleConfirm
        const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
        const dayName = dayNames[dow]
        const pad2 = (n: number) => String(n).padStart(2,'0')
        const fmt = (m: number) => `${pad2(Math.floor(m/60))}:${pad2(m%60)}`
        async function confirm() {
          setScheduleConfirm(null)
          try {
            // Barber sends request instead of direct save
            if (isBarber && !isOwnerOrAdmin) {
              // Build full schedule with the change applied so backend can save directly
              const barber = barbers.find(b => b.id === barberId)
              const baseSched = barber?.schedule || Array.from({length:7}, (_, i) => ({ enabled: i !== 0, startMin: 10*60, endMin: 20*60 }))
              const newSched = baseSched.map((d: any, i: number) => i === dow ? { ...d, startMin, endMin } : d)
              const enabledDays = newSched.map((d: any, i: number) => d.enabled ? i : -1).filter((i: number) => i >= 0)
              const enabledScheds = newSched.filter((d: any) => d.enabled)
              const globalStart = enabledScheds.length ? Math.min(...enabledScheds.map((d: any) => d.startMin)) : startMin
              const globalEnd = enabledScheds.length ? Math.max(...enabledScheds.map((d: any) => d.endMin)) : endMin

              await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({
                type: 'schedule_change',
                data: {
                  barberName, barberId, dayName, dow,
                  startTime: fmt(startMin), endTime: fmt(endMin),
                  // Full schedule for backend to apply on approve
                  schedule: { startMin: globalStart, endMin: globalEnd, days: enabledDays },
                  work_schedule: { startMin: globalStart, endMin: globalEnd, days: enabledDays },
                }
              })})
              showToast('Schedule change request sent for approval')
              loadBarbers().then(list => setBarbers(list))
              return
            }
            const barber = barbers.find(b => b.id === barberId)
            const baseSched = barber?.schedule || Array.from({length:7}, (_, i) => ({ enabled: i !== 0, startMin: 10*60, endMin: 20*60 }))

            // 1. Save this day's override to localStorage
            saveSchedOverride(barberId, dow, startMin, endMin)

            // 2. Build updated schedule applying ALL localStorage overrides
            const allOverrides = getSchedOverrides(barberId)
            const newSched = baseSched.map((d, i) => {
              const ov = allOverrides[i]
              return ov ? { ...d, startMin: ov.startMin, endMin: ov.endMin } : d
            })
            const enabledDays = newSched.map((d, i) => d.enabled ? i : -1).filter(i => i >= 0)

            // 3. Server stores global startMin/endMin (min/max of all enabled days)
            const enabledDays2 = newSched.filter(d => d.enabled)
            const globalStart = enabledDays2.length ? Math.min(...enabledDays2.map(d => d.startMin)) : startMin
            const globalEnd   = enabledDays2.length ? Math.max(...enabledDays2.map(d => d.endMin))   : endMin

            await apiFetch('/api/barbers/' + encodeURIComponent(barberId), {
              method: 'PATCH',
              body: JSON.stringify({
                schedule: { startMin: globalStart, endMin: globalEnd, days: enabledDays },
                work_schedule: { startMin: globalStart, endMin: globalEnd, days: enabledDays }
              })
            })
            loadBarbers().then(list => setBarbers(list))
          } catch(e) { console.warn('Schedule save error:', e) }
        }
        function cancel() {
          // Revert visual change
          setScheduleConfirm(null)
          loadBarbers().then(list => setBarbers(list))
        }
        return (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(18px)', WebkitBackdropFilter:'blur(18px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
            <div style={{ width:'min(360px,92vw)', borderRadius:22, border:'1px solid rgba(255,255,255,.10)', background:'rgba(0,0,0,.65)', backdropFilter:'saturate(180%) blur(40px)', WebkitBackdropFilter:'saturate(180%) blur(40px)', boxShadow:'0 32px 80px rgba(0,0,0,.55)', padding:22, color:'#e9e9e9', fontFamily:'Inter,sans-serif' }}>
              <div style={{ fontFamily:'"Julius Sans One",sans-serif', letterSpacing:'.16em', textTransform:'uppercase', fontSize:13, marginBottom:14 }}>{isBarber && !isOwnerOrAdmin ? 'Request schedule change' : 'Update schedule'}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.70)', lineHeight:1.6, marginBottom:18 }}>
                {isBarber && !isOwnerOrAdmin ? 'Request to change' : 'Change'} <span style={{ color:'#fff', fontWeight:700 }}>{barberName}</span>'s schedule for every <span style={{ color:'#fff', fontWeight:700 }}>{dayName}</span> to:
                <div style={{ marginTop:10, fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'.04em' }}>
                  {fmt(startMin)} — {fmt(endMin)}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={cancel} style={{ flex:1, height:42, borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.06)', color:'rgba(255,255,255,.70)', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>Cancel</button>
                <button onClick={confirm} style={{ flex:1, height:42, borderRadius:12, border:'1px solid rgba(255,255,255,.22)', background:'rgba(255,255,255,.12)', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700, fontFamily:'inherit' }}>{isBarber && !isOwnerOrAdmin ? 'Send request' : 'Save'}</button>
              </div>
            </div>
          </div>
        )
      })()}

      {datePickerOpen && <DatePickerModal current={anchor} onSelect={d => { const x=new Date(d); x.setHours(0,0,0,0); setAnchor(x) }} onClose={() => setDatePickerOpen(false)} />}

      {/* Settings */}
      {settingsOpen && <SettingsModal barbers={barbers} services={services} onClose={() => setSettingsOpen(false)} onReload={reloadAll}
        isStudent={isStudent} isBarber={isBarber} myBarberId={myBarberId}
        studentSchedule={studentSchedule} onStudentScheduleChange={(s: DaySchedule[]) => {
          setStudentSchedule(s); localStorage.setItem('ELEMENT_STUDENT_SCHEDULE', JSON.stringify(s))
          // Save to user profile
          const uid = currentUser?.uid; if (uid) apiFetch(`/api/users/${encodeURIComponent(uid)}`, { method: 'PATCH', body: JSON.stringify({ schedule: s }) }).catch(() => {})
        }} />}

      {/* Booking modal */}
      {modal.open && (
        <BookingModal
          isOpen={modal.open}
          barberId={selectedEvent?.barberId || barbers[0]?.id || ''}
          barberName={selectedEvent?.barberName || barbers[0]?.name || ''}
          date={selectedEvent?.date || todayStr}
          startMin={selectedEvent?.startMin || 9*60}
          barbers={barbers} services={services}
          isOwnerOrAdmin={isOwnerOrAdmin} myBarberId={myBarberId}
          isStudent={isStudent} mentorBarberIds={mentorBarberIds}
          existingEvent={selectedEvent ? { id: selectedEvent.id, clientName: selectedEvent.clientName, clientPhone: selectedEvent.clientPhone, serviceId: selectedEvent.serviceId, status: selectedEvent.status, notes: selectedEvent.notes, paid: selectedEvent.paid, paymentMethod: selectedEvent.paymentMethod, isModelEvent: selectedEvent._raw?.booking_type === 'model' || selectedEvent._raw?.booking_type === 'training', photoUrl: (() => {
              const r = selectedEvent._raw
              return r?.reference_photo_url || r?.photo_url || r?.client_photo || r?.client_photo_url || r?.attachment_url || r?.image_url || r?.photo || r?.haircut_photo || r?.style_photo || ''
            })(), _raw: { ...selectedEvent._raw, start_min: selectedEvent.startMin } } : null}
          allEvents={events.map(e => ({ id: e.id, barberId: e.barberId, startMin: e.startMin, durMin: e.durMin, status: e.status, paid: e.paid, clientName: e.clientName, paymentStatus: (e._raw as any)?.payment_status || '' }))}
          onClose={() => { if (modal.isNew) setEvents(prev => prev.filter(e => e.id !== modal.eventId)); setModal({ open: false, eventId: null, isNew: false }) }}
          onSave={handleSave} onDelete={handleDelete} onPayment={handlePayment}
        />
      )}

      {/* Slot picker for student */}
      {slotPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setSlotPicker(null) }}>
          <div style={{ width: 'min(400px,100%)', maxHeight: 'min(600px,80vh)', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,.60), inset 0 0 0 0.5px rgba(255,255,255,.07)', color: '#e9e9e9', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>Available slots</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 3 }}>{slotPicker.length} free 90min slots today</div>
              </div>
              <button onClick={() => setSlotPicker(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {slotPicker.map((slot, i) => (
                <button key={i} onClick={() => { setSlotPicker(null); openCreate(slot.mentorId, slot.min) }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', cursor: 'pointer', color: '#e9e9e9', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}
                  onMouseEnter={e => (e.currentTarget.style.background='rgba(168,107,255,.12)')} onMouseLeave={e => (e.currentTarget.style.background='rgba(255,255,255,.04)')}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{minToHHMM(slot.min)} — {minToHHMM(slot.min + 90)}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>with {slot.mentorName}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(168,107,255,.80)', fontWeight: 700 }}>90 min</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Waitlist confirm modal */}
      {wlConfirm && (() => {
        const { w, barberId, barberName, slotMin, dur } = wlConfirm
        const svcNames = Array.isArray(w.service_names) ? w.service_names : []
        async function doConfirm() {
          setWlConfirming(true)
          try {
            const startAt = new Date(todayStr + 'T' + minToHHMM(slotMin) + ':00')
            const endAt = new Date(startAt.getTime() + dur * 60000)
            const svcIds = Array.isArray(w.service_ids) ? w.service_ids : []
            await apiFetch('/api/bookings', { method: 'POST', body: JSON.stringify({
              barber_id: barberId, client_name: w.client_name || 'Waitlist client',
              client_phone: w.phone_raw || w.phone_norm || '',
              service_id: svcIds[0] || '', service_name: svcNames.join(', ') || 'Service',
              start_at: startAt.toISOString(), end_at: endAt.toISOString(),
              notes: 'From waitlist', source: 'waitlist',
            })})
            await apiFetch(`/api/waitlist/${encodeURIComponent(w.id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'confirm' }) })
            showToast(`${w.client_name || 'Client'} booked at ${minToHHMM(slotMin)}`)
            setWlConfirm(null); loadWaitlist(); reloadAll()
          } catch (e: any) { showToast('Error: ' + e.message) }
          setWlConfirming(false)
        }
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget && !wlConfirming) setWlConfirm(null) }}>
            <div style={{ width: 'min(420px,92vw)', borderRadius: 22, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(0,0,0,.70)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,.60), inset 0 0 0 0.5px rgba(255,255,255,.07)', padding: '24px 22px', color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
              {/* Icon */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(10,132,255,.10)', border: '1px solid rgba(10,132,255,.30)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7fbfff" strokeWidth="2" strokeLinecap="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><polyline points="9 14 11 16 15 12"/></svg>
                </div>
              </div>
              {/* Title */}
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.14em', textTransform: 'uppercase', fontSize: 14, textAlign: 'center', marginBottom: 16 }}>Confirm from waitlist</div>
              {/* Details */}
              <div style={{ padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Client</span>
                  <span style={{ fontSize: 14, fontWeight: 800 }}>{w.client_name || 'Client'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Barber</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{barberName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Time</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{minToHHMM(slotMin)} — {minToHHMM(slotMin + dur)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: svcNames.length ? 8 : 0 }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Duration</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{dur} min</span>
                </div>
                {svcNames.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Service</span>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{svcNames.join(', ')}</span>
                  </div>
                )}
              </div>
              {/* Note */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.40)', textAlign: 'center', marginBottom: 18 }}>This will create an appointment and remove from waitlist</div>
              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setWlConfirm(null)} disabled={wlConfirming}
                  style={{ flex: 1, height: 44, borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={doConfirm} disabled={wlConfirming}
                  style={{ flex: 2, height: 44, borderRadius: 999, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.12)', color: '#bfe0ff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13, opacity: wlConfirming ? .5 : 1 }}>
                  {wlConfirming ? 'Creating…' : 'Confirm & Book'}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Toast notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', left: '50%', transform: 'translateX(-50%)', zIndex: 400, padding: '12px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(0,0,0,.80)', backdropFilter: 'saturate(180%) blur(30px)', WebkitBackdropFilter: 'saturate(180%) blur(30px)', boxShadow: '0 12px 40px rgba(0,0,0,.50)', color: '#e9e9e9', fontSize: 13, fontWeight: 600, fontFamily: 'Inter,sans-serif', maxWidth: '90vw', textAlign: 'center', animation: 'slideUp .2s ease' }}
          onClick={() => setToast('')}>
          {toast}
        </div>
      )}
    </Shell>
  )
}
/* deploy 1774457169 */
