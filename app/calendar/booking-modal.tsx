'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

import { apiFetch, API, API_KEY } from '@/lib/api'

// ─── Shop settings — always fresh, no permanent cache ────────────────────────
async function getShopSettings() {
  try {
    const token = localStorage.getItem('ELEMENT_TOKEN') || ''
    const res = await fetch(API + '/api/settings', {
      headers: { Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY }
    })
    return res.ok ? await res.json() : {}
  } catch { return {} }
}

// ─── Price calculation ────────────────────────────────────────────────────────
function calcTotal(basePrice: number, settings: any) {
  if (!basePrice) return { base: 0, tax: 0, fees: 0, total: 0, breakdown: [] }
  const breakdown: { label: string; amount: number; type: string }[] = []

  // Tax
  let taxAmount = 0
  const tax = settings?.tax
  if (tax?.enabled && tax?.rate) {
    const rate = Number(tax.rate) / 100
    if (tax.included_in_price) {
      const base = basePrice / (1 + rate)
      taxAmount = Math.round((basePrice - base) * 100) / 100
    } else {
      taxAmount = Math.round(basePrice * rate * 100) / 100
    }
    breakdown.push({ label: tax.label || 'Tax', amount: taxAmount, type: 'tax' })
  }

  // Fees
  let feesTotal = 0
  const fees: any[] = (settings?.fees || []).filter((f: any) => f.enabled !== false)
  for (const f of fees) {
    let amt = 0
    if (f.type === 'percent') amt = Math.round(basePrice * (Number(f.value||0)/100) * 100) / 100
    else if (f.type === 'fixed') amt = Number(f.value || 0)
    if (amt > 0) { feesTotal += amt; breakdown.push({ label: f.label || 'Fee', amount: amt, type: 'fee' }) }
  }

  const total = tax?.included_in_price
    ? Math.round((basePrice + feesTotal) * 100) / 100
    : Math.round((basePrice + taxAmount + feesTotal) * 100) / 100

  return { base: basePrice, tax: taxAmount, fees: feesTotal, total, breakdown }
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  photo_url?: string
  visitCount?: number
  client_status?: string
  no_shows?: number
}

interface Barber { id: string; name: string; color: string; schedule?: any; work_schedule?: any }
interface Service { id: string; name: string; durationMin: number; price?: string; barberIds: string[] }

function getBarberWorkingHours(barbers: Barber[], barberId: string, dateStr: string): { startMin: number; endMin: number } | null {
  const barber = barbers.find(b => b.id === barberId)
  if (!barber) return { startMin: 480, endMin: 1260 }
  const sch = barber.schedule || barber.work_schedule
  if (!sch) return { startMin: 480, endMin: 1260 }
  const d = new Date(dateStr + 'T12:00:00')
  const dow = d.getDay()
  // Per-day array format [Sun..Sat]
  if (Array.isArray(sch)) {
    const day = sch[dow]
    if (!day || day.enabled === false) return null
    return { startMin: Number(day.startMin ?? day.start_min ?? 480), endMin: Number(day.endMin ?? day.end_min ?? 1260) }
  }
  // Object format with perDay
  const perDay = sch.perDay || sch.per_day
  if (Array.isArray(perDay) && perDay[dow]) {
    const day = perDay[dow]
    if (day.enabled === false) return null
    const sm = day.startMin ?? day.start_min
    const em = day.endMin ?? day.end_min
    if (sm != null) return { startMin: Number(sm), endMin: Number(em ?? 1260) }
  }
  // Fallback to global startMin/endMin
  const days: number[] = Array.isArray(sch.days) ? sch.days : [0, 1, 2, 3, 4, 5, 6]
  if (!days.includes(dow)) return null
  return { startMin: Number(sch.startMin ?? sch.start_min ?? 480), endMin: Number(sch.endMin ?? sch.end_min ?? 1260) }
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  barberId: string
  barberName: string
  date: string        // YYYY-MM-DD
  startMin: number    // minutes from midnight
  barbers: Barber[]
  services: Service[]
  isOwnerOrAdmin: boolean
  myBarberId?: string
  isStudent?: boolean
  mentorBarberIds?: string[]
  allEvents?: Array<{ id: string; barberId: string; startMin: number; durMin: number; status: string; paid: boolean; clientName: string; date?: string; paymentStatus?: string }>
  existingEvent?: {
    id: string
    clientName: string
    clientPhone?: string
    serviceId: string
    serviceIds?: string[]
    status: string
    notes?: string
    paid: boolean
    paymentMethod?: string
    isModelEvent?: boolean
    photoUrl?: string
    _raw: any
  } | null
  onSave: (data: {
    clientName: string; clientPhone: string; clientId?: string
    barberId: string; serviceId: string; serviceIds: string[]; date: string; startMin: number
    durMin: number; status: string; notes: string; photoUrl?: string; _forceArrivedNotify?: boolean
  }) => void
  onDelete: () => void
  onPayment: (method: string, tip: number) => void
  onOpenEvent?: (eventId: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const minToHHMM = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`
const _is24h = (() => { try { const f = new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions(); return f.hourCycle === 'h23' || f.hourCycle === 'h24' } catch { return false } })()
const minToDisplay = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60
  if (_is24h) return `${pad2(h)}:${pad2(m)}`
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${pad2(m)} ${period}`
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 4) return `+1 ***-***-${digits.slice(-4)}`
  return phone ? '***' : '—'
}


// ─── ClientSearch ─────────────────────────────────────────────────────────────
function ClientSearch({ onSelect, isOwnerOrAdmin, initialClient, initialName }: {
  onSelect: (c: Client | null, name: string) => void
  isOwnerOrAdmin: boolean
  initialClient?: Client | null
  initialName?: string
}) {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Client | null>(initialClient || null)
  const [notFound, setNotFound] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const timerRef = useRef<any>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSelected(initialClient || null)
    setPhone(initialClient?.phone || '')
    setName(''); setEmail(''); setNotes(''); setResults([]); setNotFound(false); setOpen(false)
  }, [initialClient?.id, initialName])

  // Extract only digits from phone
  function digits(s: string) { return s.replace(/\D/g, '') }

  // Format as +1 (XXX) XXX-XXXX — always show +1 prefix
  function formatPhone(raw: string) {
    const d = digits(raw).replace(/^1/, '').slice(0, 10) // strip leading 1, max 10 digits
    if (d.length === 0) return ''
    if (d.length <= 3)  return `+1 (${d}`
    if (d.length <= 6)  return `+1 (${d.slice(0,3)}) ${d.slice(3)}`
    return `+1 (${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  }

  function onPhoneChange(raw: string) {
    // If user clears field, reset
    if (!raw.trim()) { setPhone(''); setNotFound(false); setResults([]); setOpen(false); return }
    const formatted = formatPhone(raw)
    setPhone(formatted)
    setNotFound(false); setResults([]); setOpen(false)
    const d = digits(raw).replace(/^1/, '')
    if (d.length >= 10) doSearch(d) // search with raw 10 digits
  }

  const doSearch = useCallback((tenDigits: string) => {
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        // Search by both formatted and raw digits — API uses phone_norm (digits only)
        const queries = [
          apiFetch(`/api/clients/search?q=${encodeURIComponent(tenDigits)}`),
          apiFetch(`/api/clients/search?q=${encodeURIComponent('+1' + tenDigits)}`),
          apiFetch(`/api/clients?q=${encodeURIComponent(tenDigits)}`),
        ]
        const results = await Promise.allSettled(queries)
        const allClients: any[] = []
        const seenIds = new Set<string>()
        for (const r of results) {
          if (r.status !== 'fulfilled') continue
          const data = r.value
          const list = Array.isArray(data?.clients) ? data.clients
            : Array.isArray(data) ? data
            : Array.isArray(data?.data) ? data.data : []
          for (const c of list) {
            const id = String(c.id || c.uid || '')
            if (!id || seenIds.has(id)) continue
            // Backend already filtered by phone_norm — trust the result
            // Don't re-filter by phone digits (barbers see masked phones like ***-1234)
            seenIds.add(id)
            allClients.push(c)
          }
        }
        const mapped: Client[] = allClients.map((c: any) => ({
          id: String(c.id || c.uid || ''),
          name: String(c.name || c.full_name || ''),
          phone: String(c.phone || c.phone_number || ''),
          email: String(c.email || ''),
          notes: String(c.notes || ''),
          visitCount: Number(c.visit_count || c.visits || 0),
          client_status: String(c.client_status || c.status || 'new'),
          no_shows: Number(c.no_shows || 0),
        })).filter((c: Client) => c.name)
        if (mapped.length > 0) {
          setResults(mapped); setOpen(true); setNotFound(false)
        } else {
          setResults([]); setNotFound(true); setOpen(false)
        }
      } catch { setResults([]); setNotFound(true) }
      setLoading(false)
    }, 400)
  }, [])

  function select(c: Client) {
    setSelected(c); setPhone(c.phone || phone); setResults([]); setOpen(false); setNotFound(false)
    onSelect(c, c.name)
  }

  function clear() {
    setSelected(null); setPhone(''); setName(''); setEmail(''); setNotes('')
    setResults([]); setNotFound(false); setOpen(false)
    onSelect(null, '')
    setTimeout(() => phoneRef.current?.focus(), 50)
  }

  async function saveNew() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), phone, email, notes })
      })
      const c = res?.client || res
      const newClient: Client = { id: String(c.id || c.uid || 'local_' + Date.now()), name: c.name || name.trim(), phone: c.phone || phone, email: c.email || email, visitCount: 0 }
      select(newClient)
    } catch {
      // Save locally anyway
      select({ id: 'local_' + Date.now(), name: name.trim(), phone, email, visitCount: 0 })
    }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 14, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }

  // ── Selected client card ──────────────────────────────────────────────────
  const [editingNotes, setEditingNotes] = useState(false)
  const [clientNotes, setClientNotes] = useState(selected?.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [clientPhoto, setClientPhoto] = useState(selected?.photo_url || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    setClientNotes(selected?.notes || '')
    setClientPhoto(selected?.photo_url || '')
    setEditingNotes(false)
  }, [selected?.id])

  async function handleClientPhoto(file: File | null) {
    if (!file || !selected?.id || selected.id.startsWith('local_')) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 8 * 1024 * 1024) return
    setUploadingPhoto(true)
    try {
      const reader = new FileReader()
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      // Upload via GCS-backed endpoint or store as data URL
      await apiFetch(`/api/clients/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH', body: JSON.stringify({ photo_url: dataUrl })
      })
      setClientPhoto(dataUrl)
      setSelected(prev => prev ? { ...prev, photo_url: dataUrl } : prev)
    } catch {}
    setUploadingPhoto(false)
  }

  async function removeClientPhoto() {
    if (!selected?.id || selected.id.startsWith('local_')) return
    try {
      await apiFetch(`/api/clients/${encodeURIComponent(selected.id)}`, {
        method: 'PATCH', body: JSON.stringify({ photo_url: '' })
      })
      setClientPhoto('')
      setSelected(prev => prev ? { ...prev, photo_url: '' } : prev)
    } catch {}
  }

  async function saveClientNotes() {
    setSavingNotes(true)
    try {
      let cid = selected?.id || ''
      // If no client ID, try to find by name
      if (!cid || cid.startsWith('local_')) {
        const name = selected?.name || ''
        if (name) {
          const data = await apiFetch(`/api/clients?q=${encodeURIComponent(name)}`)
          const list = Array.isArray(data) ? data : (data?.clients || [])
          const match = list.find((c: any) => c.name === name)
          if (match?.id) {
            cid = match.id
            setSelected(prev => prev ? { ...prev, id: cid } : prev)
          }
        }
      }
      if (!cid || cid.startsWith('local_')) { setEditingNotes(false); setSavingNotes(false); return }
      await apiFetch(`/api/clients/${encodeURIComponent(cid)}`, {
        method: 'PATCH', body: JSON.stringify({ notes: clientNotes })
      })
      setSelected(prev => prev ? { ...prev, notes: clientNotes } : prev)
    } catch (e: any) { console.warn('Save notes failed:', e?.message) }
    setSavingNotes(false); setEditingNotes(false)
  }

  if (selected) {
    return (
      <div style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', overflow: 'hidden' }}>
        {/* Client header */}
        <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {clientPhoto ? (
                <img src={clientPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d7ecff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 15 }}>{selected.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)', marginTop: 2 }}>
                {isOwnerOrAdmin ? (selected.phone || 'No phone') : maskPhone(selected.phone || '')}
                {selected.visitCount ? ` · ${selected.visitCount} visit${selected.visitCount !== 1 ? 's' : ''}` : ' · New client'}
                {(selected.no_shows || 0) > 0 && <span style={{ color: '#ff6b6b' }}> · {selected.no_shows} no-show{(selected.no_shows || 0) !== 1 ? 's' : ''}</span>}
              </div>
              {/* Client status scale */}
              {(() => {
                const st = (status === 'noshow' || (selected.no_shows || 0) > 0) ? 'at_risk' : (selected.client_status || 'new')
                const statuses = [
                  { key: 'at_risk', label: 'Risk', color: '#ff6b6b', bg: 'rgba(255,107,107,.15)', border: 'rgba(255,107,107,.35)' },
                  { key: 'new', label: 'New', color: '#7abaff', bg: 'rgba(10,132,255,.15)', border: 'rgba(10,132,255,.35)' },
                  { key: 'active', label: 'Active', color: '#8ff0b1', bg: 'rgba(143,240,177,.15)', border: 'rgba(143,240,177,.35)' },
                  { key: 'vip', label: 'VIP', color: '#ffd700', bg: 'rgba(255,215,0,.15)', border: 'rgba(255,215,0,.40)' },
                ]
                const activeIdx = statuses.findIndex(s => s.key === st || (st === 'risk' && s.key === 'at_risk'))
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                    {statuses.map((s, i) => {
                      const isActive = i === activeIdx
                      return (
                        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <span style={{
                            fontSize: 8, fontWeight: 900, letterSpacing: '.06em', textTransform: 'uppercase',
                            padding: '2px 6px', borderRadius: 4,
                            border: `1px solid ${isActive ? s.border : 'rgba(255,255,255,.06)'}`,
                            background: isActive ? s.bg : 'transparent',
                            color: isActive ? s.color : 'rgba(255,255,255,.18)',
                          }}>{s.label}</span>
                          {i < statuses.length - 1 && <span style={{ fontSize: 8, color: 'rgba(255,255,255,.12)' }}>›</span>}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {isOwnerOrAdmin && selected.id && !selected.id.startsWith('local_') && (
              <button onClick={() => { setEcName(selected.name || ''); setEcPhone(selected.phone || ''); setEcEmail(selected.email || ''); setEcNotes(selected.notes || ''); setEditClientOpen(true) }}
                style={{ height: 30, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(10,132,255,.30)', background: 'rgba(10,132,255,.06)', color: '#d7ecff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 3 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
            )}
            <button onClick={clear} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.60)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>Change</button>
          </div>
        </div>

        {/* Client photo */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 14px', background: 'rgba(0,0,0,.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: clientPhoto ? 8 : 0 }}>
            <span style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Client photo</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <label style={{ height: 24, padding: '0 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.10)', background: 'transparent', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center' }}>
                {uploadingPhoto ? 'Uploading…' : (clientPhoto ? 'Change' : '+ Add photo')}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleClientPhoto(e.target.files?.[0] || null)} />
              </label>
              {clientPhoto && (
                <button onClick={removeClientPhoto}
                  style={{ height: 24, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(255,107,107,.20)', background: 'transparent', color: 'rgba(255,107,107,.60)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Remove</button>
              )}
            </div>
          </div>
          {clientPhoto && (
            <img src={clientPhoto} alt="Client" style={{ width: '100%', maxWidth: 180, height: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', display: 'block' }} />
          )}
        </div>

        {/* Client notes */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '10px 14px', background: 'rgba(0,0,0,.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editingNotes ? 8 : (clientNotes ? 6 : 0) }}>
            <span style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Client notes</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)}
                  style={{ height: 24, padding: '0 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,.10)', background: 'transparent', color: 'rgba(255,255,255,.45)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>
                  {clientNotes ? 'Edit' : '+ Add note'}
                </button>
              )}
              {!editingNotes && clientNotes && (
                <button onClick={async () => {
                  setClientNotes('')
                  if (selected?.id && !selected.id.startsWith('local_')) {
                    try { await apiFetch(`/api/clients/${encodeURIComponent(selected.id)}`, { method: 'PATCH', body: JSON.stringify({ notes: '' }) }) } catch {}
                  }
                  setSelected(prev => prev ? { ...prev, notes: '' } : prev)
                }} style={{ height: 24, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(255,107,107,.20)', background: 'transparent', color: 'rgba(255,107,107,.60)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>Clear</button>
              )}
            </div>
          </div>
          {editingNotes ? (
            <div>
              <textarea value={clientNotes} onChange={e => setClientNotes(e.target.value)} rows={2} autoFocus
                placeholder="Notes about this client…"
                style={{ width: '100%', borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '8px 10px', fontSize: 12, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', lineHeight: 1.5 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <button onClick={() => { setClientNotes(selected?.notes || ''); setEditingNotes(false) }}
                  style={{ height: 28, padding: '0 12px', borderRadius: 7, border: '1px solid rgba(255,255,255,.10)', background: 'transparent', color: 'rgba(255,255,255,.55)', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={saveClientNotes} disabled={savingNotes}
                  style={{ height: 28, padding: '0 14px', borderRadius: 7, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                  {savingNotes ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : clientNotes ? (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.60)', lineHeight: 1.5 }}>{clientNotes}</div>
          ) : null}
        </div>
      </div>
    )
  }

  // ── Phone input + results/form ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Phone field */}
      <div style={{ position: 'relative' }}>
        <label style={lbl}>Phone number</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 14, fontSize: 14, color: 'rgba(255,255,255,.55)', pointerEvents: 'none', fontWeight: 700, zIndex: 1 }}>+1</div>
          <input
            ref={phoneRef}
            value={phone.replace(/^\+1\s?/, '')}
            onChange={e => onPhoneChange(e.target.value)}
            placeholder="(___) ___-____"
            style={{ ...inp, paddingLeft: 38, paddingRight: 40 }}
            type="tel"
            autoComplete="off"
          />
          {loading && <div style={{ position: 'absolute', right: 14, top: 14, width: 16, height: 16, border: '2px solid rgba(255,255,255,.20)', borderTop: '2px solid #0a84ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
          {!loading && phone && <button onMouseDown={e => { e.preventDefault(); clear() }} style={{ position: 'absolute', right: 10, top: 10, width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.08)', color: 'rgba(255,255,255,.50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>✕</button>}
        </div>
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div style={{ borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', backdropFilter: 'saturate(180%) blur(20px)', overflow: 'hidden' }}>
          {results.slice(0, 6).map(c => (
            <div key={c.id} onClick={() => select(c)}
              style={{ padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.05)', display: 'flex', alignItems: 'center', gap: 12 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(10,132,255,.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.50)" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.40)', marginTop: 1 }}>
                  {isOwnerOrAdmin ? c.phone : maskPhone(c.phone || '')}
                  {c.visitCount ? ` · ${c.visitCount} visits` : ''}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {/* Not found — ask for name */}
      {notFound && (
        <div style={{ padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.04)', animation: 'slideDown .18s ease' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)', marginBottom: 12 }}>
            No client found for <strong style={{ color: '#fff' }}>{phone}</strong> — fill in their details:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <label style={lbl}>Full name <span style={{ color: '#ff6b6b' }}>*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name" style={inp} autoFocus />
            </div>
            <div>
              <label style={lbl}>Email <span style={{ color: 'rgba(255,255,255,.30)' }}>(optional)</span></label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={inp} type="email" />
            </div>
            <div>
              <label style={lbl}>Notes <span style={{ color: 'rgba(255,255,255,.30)' }}>(optional)</span></label>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={inp} />
            </div>
            <button
              onClick={saveNew}
              disabled={!name.trim() || saving}
              style={{ height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: name.trim() ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.04)', color: name.trim() ? '#d7ecff' : 'rgba(255,255,255,.30)', cursor: name.trim() ? 'pointer' : 'default', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', marginTop: 2, transition: 'all .15s' }}>
              {saving ? 'Saving…' : 'Save & use this client'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── NewClientForm ────────────────────────────────────────────────────────────
function NewClientForm({ initialName, onCreated, onCancel }: {
  initialName: string
  onCreated: (c: Client) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const res = await apiFetch('/api/clients', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), phone, email, notes })
      })
      const client = res?.client || res
      onCreated({ id: client.id || client.uid || String(Date.now()), name: client.name || name, phone: client.phone || phone, email: client.email || email, notes: client.notes || notes, visitCount: 0 })
    } catch (e: any) {
      // If API fails, create locally
      onCreated({ id: 'local_' + Date.now(), name: name.trim(), phone, email, notes, visitCount: 0 })
    }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }

  return (
    <div style={{ marginTop: 8, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.09)', background: 'rgba(255,255,255,.04)', animation: 'slideDown .2s ease' }}>
      <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 12 }}>New client</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Client name" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (___) ___-____" style={inp} />
        </div>
        <div>
          <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="optional" style={inp} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }}>Notes</label>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={inp} />
        </div>
      </div>
      {err && <div style={{ fontSize: 12, color: '#ffd0d0', marginBottom: 8 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onCancel} style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
        <button onClick={save} disabled={saving} style={{ flex: 2, height: 38, borderRadius: 10, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.16)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>
          {saving ? 'Saving…' : 'Save client'}
        </button>
      </div>
    </div>
  )
}

// ─── PhotoUpload ──────────────────────────────────────────────────────────────
function PhotoUpload({ value, onChange }: { value: string; onChange: (url: string, name: string) => void }) {
  const [preview, setPreview] = useState(value)
  const [fileName, setFileName] = useState('')

  function handleFile(file: File | null) {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 900, scale = Math.min(1, MAX / img.width, MAX / img.height)
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.82, out = canvas.toDataURL('image/jpeg', q)
        while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
        setPreview(out)
        onChange(out, file.name)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <label style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 6 }}>
        Reference photo (haircut style)
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ height: 44, padding: '0 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.70)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontFamily: 'inherit', whiteSpace: 'nowrap', flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {fileName || (preview ? 'Change photo' : 'Attach reference photo…')}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
        </label>
        {preview && (
          <>
            <img src={preview} alt="ref" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)', cursor: 'pointer', flexShrink: 0 }}
              onClick={() => window.open(preview, '_blank')} />
            <button onClick={() => { setPreview(''); setFileName(''); onChange('', '') }}
              style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>✕</button>
          </>
        )}
      </div>
      {!preview && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.30)', marginTop: 6 }}>
          Clients can also attach a reference photo when booking online
        </div>
      )}
    </div>
  )
}

// ─── PaymentPanel ─────────────────────────────────────────────────────────────
function PaymentPanel({ ev, services, onPayment, allEvents, barberId, onOpenEvent, date }: {
  ev: BookingModalProps['existingEvent']
  services: Service[]
  onPayment: (method: string, tip: number) => void
  allEvents?: BookingModalProps['allEvents']
  barberId?: string
  onOpenEvent?: (eventId: string) => void
  date?: string
}) {
  const [method, setMethod] = useState('terminal')
  const [tipYes, setTipYes] = useState(false)
  const [tipAmt, setTipAmt] = useState(0)
  const [hint, setHint] = useState('')
  const [hintType, setHintType] = useState<'info'|'success'|'error'|'warning'>('info')
  const [polling, setPolling] = useState(false)
  const [activeCheckoutId, setActiveCheckoutId] = useState<string|null>(null)
  const [shopSettings, setShopSettings] = useState<any>(null)
  const [isOwnerOrAdmin] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}'); return u.role === 'owner' || u.role === 'admin' } catch { return false }
  })
  const pollRef = useRef<any>(null)

  useEffect(() => { getShopSettings().then(setShopSettings) }, [])
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  const evServiceIds = ev?.serviceIds?.length ? ev.serviceIds : ev?.serviceId ? [ev.serviceId] : []
  const evSvcs = services.filter(s => evServiceIds.includes(s.id))
  const basePrice = evSvcs.reduce((sum, s) => sum + (s.price ? Number(String(s.price).replace(/[^\d.]/g, '')) : 0), 0)
  const priceCalc = calcTotal(basePrice, shopSettings)
  // Terminal gets full price with tax+fees; cash/zelle/other get base price only
  const isTerminal = method === 'terminal'
  const price = isTerminal ? priceCalc.total : basePrice

  // Find blocking event — same barber, same day, earlier start, not resolved
  // Exclude block events (clientName 'BLOCKED') — they don't need payment
  const RESOLVED = ['paid', 'done', 'cancelled', 'noshow', 'no_show', 'refunded', 'partially_refunded', 'block', 'completed']
  const evDate = date || ev?._raw?.date || ev?._raw?.start_at?.slice?.(0, 10) || ''
  const blockingEvent = ev && allEvents && barberId
    ? allEvents.find(e =>
        e.id !== ev.id &&
        e.barberId === barberId &&
        e.date === evDate &&
        e.clientName !== 'BLOCKED' &&
        e.clientName !== 'Client' &&
        e.startMin < (ev._raw?.start_min ?? 0) &&
        !e.paid &&
        e.paymentStatus !== 'refunded' &&
        !RESOLVED.includes(e.status)
      )
    : null

  if (blockingEvent) {
    return (
      <div onClick={() => onOpenEvent?.(blockingEvent.id)} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,207,63,.30)', background: 'rgba(255,207,63,.06)', cursor: onOpenEvent ? 'pointer' : 'default', transition: 'background .15s' }}
        onMouseEnter={e => { if (onOpenEvent) (e.currentTarget as HTMLElement).style.background = 'rgba(255,207,63,.12)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,207,63,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffcf3f" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ffcf3f' }}>Cannot charge yet</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fff' }}>{blockingEvent.clientName || 'Previous client'}</strong> ({minToHHMM(blockingEvent.startMin)}) has not been charged, cancelled, or marked as no-show yet.
          <br />{onOpenEvent ? 'Tap to open and resolve.' : 'Please resolve them first.'}
        </div>
      </div>
    )
  }

  if (ev?.paid) {
    const rawData = ev._raw || {} as any
    const tipAmount = Number(rawData.tip || rawData.tip_amount || 0)
    const serviceAmount = Number(rawData.service_amount || rawData.amount || 0)
    const totalAmount = Number(rawData.total_amount || serviceAmount)
    const rawBarberName = (ev as any).barberName || (ev._raw as any)?.barber_name || (ev._raw as any)?.barber || '—'
    const svcNames = (ev.serviceIds || []).map((id: string) => services.find(s => s.id === id)?.name).filter(Boolean).join(', ') || (ev as any).serviceName || (ev._raw as any)?.service_name || '—'
    const evStartMin = Number((ev as any).startMin || (ev._raw as any)?.start_min || 0)
    const timeStr = `${pad2(Math.floor(evStartMin / 60))}:${pad2(evStartMin % 60)}`

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Paid badge */}
        <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(143,240,177,.25)', background: 'rgba(143,240,177,.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8ff0b1" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <div>
            <div style={{ fontSize: 13, color: '#c9ffe1', fontWeight: 800 }}>Completed & Paid</div>
            <div style={{ fontSize: 11, color: 'rgba(143,240,177,.60)', marginTop: 2 }}>via {ev.paymentMethod || '—'}</div>
          </div>
        </div>

        {/* Read-only booking info */}
        <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><div style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Client</div><div style={{ fontSize: 13, fontWeight: 700 }}>{ev.clientName || '—'}</div></div>
            <div><div style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Barber</div><div style={{ fontSize: 13, fontWeight: 700 }}>{rawBarberName}</div></div>
            <div><div style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Time</div><div style={{ fontSize: 13, fontWeight: 700 }}>{timeStr}</div></div>
            <div><div style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 3 }}>Services</div><div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.70)' }}>{svcNames}</div></div>
          </div>
        </div>

        {/* Financial info — tip visible to all, amounts visible to owner/admin */}
        <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,207,63,.15)', background: 'rgba(255,207,63,.03)' }}>
          {tipAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOwnerOrAdmin && serviceAmount > 0 ? 8 : 0 }}>
              <span style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,207,63,.60)' }}>Tip</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#ffe9a3' }}>${tipAmount.toFixed(2)}</span>
            </div>
          )}
          {tipAmount === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.25)', textAlign: 'center' }}>No tip</div>
          )}
          {isOwnerOrAdmin && serviceAmount > 0 && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Service</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>${serviceAmount.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Tip</span>
                <span style={{ fontSize: 13, fontWeight: 700 }}>${tipAmount.toFixed(2)}</span>
              </div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 4, marginTop: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.65)' }}>Total</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>${(totalAmount + tipAmount).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Refund — owner/admin only */}
        {isOwnerOrAdmin && ev._raw?.id && (
          <button onClick={handleRefund} style={{ width: '100%', height: 36, borderRadius: 10, border: '1px solid rgba(255,107,107,.25)', background: 'rgba(255,107,107,.04)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
            Issue Refund
          </button>
        )}
        {hint && (
          <div style={{ fontSize: 12, marginTop: 4, padding: '8px 12px', borderRadius: 10,
            color: hintType==='success' ? '#c9ffe1' : hintType==='error' ? '#ffd0d0' : 'rgba(255,255,255,.60)',
            background: hintType==='success' ? 'rgba(143,240,177,.08)' : hintType==='error' ? 'rgba(255,107,107,.08)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${hintType==='success' ? 'rgba(143,240,177,.20)' : hintType==='error' ? 'rgba(255,107,107,.20)' : 'rgba(255,255,255,.08)'}`,
          }}>{hint}</div>
        )}
      </div>
    )
  }

  // Price breakdown display
  const PriceBreakdown = () => priceCalc.breakdown.length > 0 ? (
    <div style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', fontSize: 11, marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,.55)', marginBottom: 4 }}>
        <span>Service</span><span>${basePrice.toFixed(2)}</span>
      </div>
      {priceCalc.breakdown.map((b, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: b.type === 'tax' ? 'rgba(255,207,63,.80)' : 'rgba(255,255,255,.50)', marginBottom: 2 }}>
          <span>{b.label}</span><span>+${b.amount.toFixed(2)}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, color: '#e9e9e9', borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 6, paddingTop: 6 }}>
        <span>Total</span><span>${priceCalc.total.toFixed(2)}</span>
      </div>
    </div>
  ) : null

  const methodStyle = (m: string): React.CSSProperties => ({
    flex: 1, height: 40, borderRadius: 12, cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit',
    transition: 'all .18s ease',
    border: method === m ? {
      terminal: '1px solid rgba(10,132,255,.75)', cash: '1px solid rgba(143,240,177,.65)',
      zelle: '1px solid rgba(106,0,255,.75)', other: '1px solid rgba(255,207,63,.65)'
    }[m]! : '1px solid rgba(255,255,255,.10)',
    background: method === m ? {
      terminal: 'rgba(10,132,255,.14)', cash: 'rgba(143,240,177,.10)',
      zelle: 'rgba(106,0,255,.14)', other: 'rgba(255,207,63,.10)'
    }[m]! : 'rgba(255,255,255,.03)',
    color: method === m ? {
      terminal: '#d7ecff', cash: '#c9ffe1', zelle: '#d8b4fe', other: '#fff3b0'
    }[m]! : 'rgba(255,255,255,.50)',
    boxShadow: method === m ? {
      terminal: '0 0 12px rgba(10,132,255,.15)', cash: '0 0 12px rgba(143,240,177,.12)',
      zelle: '0 0 12px rgba(106,0,255,.12)', other: '0 0 12px rgba(255,207,63,.10)'
    }[m]! : 'none',
  })

  async function handleTerminal() {
    const backendId = ev?._raw?.id
    if (!backendId) { setHint('Save booking first'); return }
    if (!price) { setHint('Service has no price'); return }
    setHint(`Sending $${price.toFixed(2)} to Terminal…`); setPolling(true)
    // Get tip options from settings (default 15/20/25%)
    const tipOptions: number[] = shopSettings?.payroll?.tip_options || [15, 20, 25]
    try {
      const res = await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: String(backendId),
          amount: priceCalc.total,
          currency: 'USD',
          client_name: ev?._raw?.client_name || '',
          service_name: evSvcs.map(s => s.name).join(' + ') || '',
          service_amount: basePrice,
          tax_amount: priceCalc.tax,
          fee_amount: priceCalc.fees,
          // Tip options for Square Terminal screen
          tip_options: tipOptions,
          tip_percentages: tipOptions,
          allow_tipping: true,
        })
      })
      const checkoutId = res?.checkout_id
      if (!checkoutId) { setHint('No checkout ID. Check Terminal manually.'); setHintType('warning'); setPolling(false); return }
      setActiveCheckoutId(checkoutId)
      const tipOptStr = (shopSettings?.payroll?.tip_options || [15,20,25]).join('% / ') + '%'
      setHint(`Waiting for payment… Tip options: ${tipOptStr} / No tip`); setHintType('info')
      let count = 0
      pollRef.current = setInterval(async () => {
        count++
        if (count > 45) { clearInterval(pollRef.current); setHint('Timed out — check Terminal'); setHintType('warning'); setPolling(false); setActiveCheckoutId(null); return }
        try {
          const s = await apiFetch(`/api/payments/terminal/status/${encodeURIComponent(checkoutId)}`)
          const st = String(s?.status || '').toUpperCase()
          if (st === 'COMPLETED') {
            clearInterval(pollRef.current); setPolling(false); setActiveCheckoutId(null)
            const tip = Number(s?.raw?.tip_money?.amount || 0) / 100
            setHint('Payment completed ✓'); setHintType('success'); onPayment('terminal', tip)
          } else if (st === 'CANCELED' || st.includes('CANCEL')) {
            clearInterval(pollRef.current); setPolling(false); setActiveCheckoutId(null)
            setHint('Payment was cancelled on Terminal'); setHintType('error')
          } else if (st === 'IN_PROGRESS') {
            setHint('Customer is completing payment on Terminal…'); setHintType('info')
          }
        } catch {}
      }, 3000)
    } catch (e: any) { setHint('Error: ' + e.message); setHintType('error'); setPolling(false) }
  }

  async function handleCancelTerminal() {
    if (!activeCheckoutId) return
    try {
      setHint('Cancelling…'); setHintType('info')
      await apiFetch(`/api/payments/terminal/cancel/${encodeURIComponent(activeCheckoutId)}`, { method: 'POST', body: '{}' })
      if (pollRef.current) clearInterval(pollRef.current)
      setPolling(false); setActiveCheckoutId(null)
      setHint('Payment cancelled'); setHintType('warning')
    } catch (e: any) { setHint('Cancel failed: ' + e.message); setHintType('error') }
  }

  async function handleRefund() {
    const backendId = ev?._raw?.id
    if (!backendId) return
    const method = String(ev?._raw?.payment_method || (ev as any)?.paymentMethod || (ev as any)?.payment_method || '').toLowerCase()
    const isTerminal = method === 'terminal' || method === 'square'
    if (isTerminal) {
      if (!window.confirm('Issue a full refund via Square for this terminal payment?')) return
      try {
        setHint('Processing Square refund…'); setHintType('info')
        await apiFetch(`/api/payments/refund-by-booking/${encodeURIComponent(String(backendId))}`, {
          method: 'POST',
          body: JSON.stringify({ reason: 'Requested by staff' })
        })
        setHint('Refund issued via Square ✓'); setHintType('success')
      } catch (e: any) { setHint('Refund failed: ' + e.message); setHintType('error') }
    } else {
      if (!window.confirm(`Issue a refund for this ${method || 'manual'} payment? This will mark it as refunded (no Square transaction).`)) return
      try {
        setHint('Processing refund…'); setHintType('info')
        await apiFetch(`/api/bookings/${encodeURIComponent(String(backendId))}`, {
          method: 'PATCH',
          body: JSON.stringify({ payment_status: 'refunded', status: 'cancelled', notes: (ev?._raw?.notes || '') + '\n[Refunded — ' + method + ']' })
        })
        setHint('Refund recorded ✓'); setHintType('success')
      } catch (e: any) { setHint('Refund failed: ' + e.message); setHintType('error') }
    }
  }

  async function handleManual() {
    const backendId = ev?._raw?.id
    const tip = tipYes ? tipAmt : 0
    setHint('Saving…')
    try {
      await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({ booking_id: backendId ? String(backendId) : '', amount: basePrice, tip, tip_amount: tip, source: method, payment_method: method, currency: 'USD', client_name: ev?._raw?.client_name || '', service_name: evSvcs.map(s => s.name).join(' + ') || '', service_amount: basePrice, tax_amount: 0, fee_amount: 0 })
      })
      if (backendId) {
        await apiFetch('/api/bookings/' + encodeURIComponent(String(backendId)), {
          method: 'PATCH', body: JSON.stringify({ paid: true, payment_method: method, tip, service_amount: basePrice, tax_amount: 0, fee_amount: 0, total_amount: basePrice })
        })
      }
      setHint(`${method} payment recorded ✓`); onPayment(method, tip)
    } catch (e: any) { setHint('Error: ' + e.message) }
  }

  return (
    <div className="bm-section" style={{ padding: '16px', borderRadius: 18, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', fontWeight: 600 }}>Payment</div>
        {price > 0 && <div style={{ fontSize: 16, fontWeight: 900, color: '#e9e9e9', letterSpacing: '.02em' }}>${price.toFixed(2)}{!isTerminal && priceCalc.breakdown.length > 0 ? <span style={{ fontSize: 10, color: 'rgba(255,255,255,.30)', fontWeight: 400, marginLeft: 6 }}>no tax/fees</span> : ''}</div>}
      </div>
      {isTerminal && <PriceBreakdown />}
      {/* Tip options preview for terminal */}
      {method === 'terminal' && (() => {
        const opts: number[] = shopSettings?.payroll?.tip_options || [15, 20, 25]
        return (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' as const, marginBottom: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>Tip on screen:</span>
            {opts.map((p: number) => (
              <span key={p} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(143,240,177,.35)', background: 'rgba(143,240,177,.08)', color: '#c9ffe1' }}>{p}%</span>
            ))}
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.45)' }}>No tip</span>
          </div>
        )
      })()}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['terminal','cash','zelle','other'] as const).map(m => (
          <button key={m} onClick={() => { setMethod(m); setHint(''); if (m === 'terminal') handleTerminal() }} disabled={polling} style={methodStyle(m)}>
            {m === 'terminal' && polling ? 'Waiting…' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
      {method !== 'terminal' && method !== 'cash' && (
        <div style={{ padding: '10px 12px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Tip?</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setTipYes(false)} style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${!tipYes ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'}`, background: !tipYes ? 'rgba(255,255,255,.06)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>No tip</button>
            <button onClick={() => setTipYes(true)} style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${tipYes ? 'rgba(143,240,177,.55)' : 'rgba(255,255,255,.10)'}`, background: tipYes ? 'rgba(143,240,177,.08)' : 'transparent', color: tipYes ? '#c9ffe1' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>Yes, tip</button>
            {tipYes && <input type="number" min="0" step="0.01" placeholder="$ amount" value={tipAmt || ''} onChange={e => setTipAmt(parseFloat(e.target.value) || 0)} style={{ flex: 1, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 12 }} />}
          </div>
        </div>
      )}
      {method === 'cash' && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(143,240,177,.06)', border: '1px solid rgba(143,240,177,.18)', fontSize: 12, color: 'rgba(143,240,177,.85)', marginBottom: 8 }}>Cash collected by barber directly</div>
      )}
      {method !== 'terminal' && (
        <button onClick={handleManual} className="bm-footer-btn" style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.40)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', boxShadow: '0 0 16px rgba(10,132,255,.10)' }}>
          Confirm {method} payment
        </button>
      )}
      {/* Cancel terminal button while polling */}
      {polling && activeCheckoutId && (
        <button onClick={handleCancelTerminal} style={{ width: '100%', height: 36, borderRadius: 10, border: '1px solid rgba(255,107,107,.40)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', marginTop: 8 }}>
          Cancel payment on Terminal
        </button>
      )}

      {/* Refund button for owner/admin on paid bookings */}
      {ev?.paid && isOwnerOrAdmin && ev._raw?.id && (
        <button onClick={handleRefund} style={{ width: '100%', height: 36, borderRadius: 10, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', marginTop: 8 }}>
          Issue Refund
        </button>
      )}

      {hint && (
        <div style={{ fontSize: 12, marginTop: 8, padding: '8px 12px', borderRadius: 10, 
          color: hintType==='success' ? '#c9ffe1' : hintType==='error' ? '#ffd0d0' : hintType==='warning' ? '#ffe9a3' : 'rgba(255,255,255,.60)',
          background: hintType==='success' ? 'rgba(143,240,177,.08)' : hintType==='error' ? 'rgba(255,107,107,.08)' : hintType==='warning' ? 'rgba(255,207,63,.08)' : 'rgba(255,255,255,.04)',
          border: `1px solid ${hintType==='success' ? 'rgba(143,240,177,.20)' : hintType==='error' ? 'rgba(255,107,107,.20)' : hintType==='warning' ? 'rgba(255,207,63,.20)' : 'rgba(255,255,255,.08)'}`,
        }}>{hint}</div>
      )}

      {/* Fullscreen terminal waiting overlay */}
      {polling && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 350, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', animation: 'bmOrbitFadeIn .3s ease-out' }}>
          <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 28 }}>
            <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: '1px solid rgba(10,132,255,.15)', animation: 'bmOrbitGlow 2.5s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 30, borderRadius: '50%', border: '1px solid rgba(10,132,255,.06)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#0a84ff', boxShadow: '0 0 14px rgba(10,132,255,.70), 0 0 30px rgba(10,132,255,.30)', animation: 'bmOrbit 2s linear infinite' }} />
              <div style={{ position: 'absolute', width: 6, height: 6, borderRadius: '50%', background: 'rgba(10,132,255,.50)', animation: 'bmOrbitTrail 2s linear infinite', animationDelay: '-.15s' }} />
              <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'rgba(10,132,255,.25)', animation: 'bmOrbitTrail 2s linear infinite', animationDelay: '-.3s' }} />
            </div>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '.02em' }}>${price.toFixed(2)}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,.30)', textTransform: 'uppercase', letterSpacing: '.14em', marginTop: 3 }}>Terminal</div>
            </div>
          </div>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13, color: 'rgba(255,255,255,.65)', marginBottom: 6 }}>
            Waiting for payment
          </div>
          <div style={{ fontSize: 18, color: 'rgba(255,255,255,.30)', marginBottom: 32, letterSpacing: 4 }}>
            <span style={{ display: 'inline-block', animation: 'bmDots 1.4s infinite', animationDelay: '0s' }}>.</span>
            <span style={{ display: 'inline-block', animation: 'bmDots 1.4s infinite', animationDelay: '.2s' }}>.</span>
            <span style={{ display: 'inline-block', animation: 'bmDots 1.4s infinite', animationDelay: '.4s' }}>.</span>
          </div>
          <button onClick={handleCancelTerminal}
            style={{ height: 46, padding: '0 30px', borderRadius: 999, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', letterSpacing: '.02em' }}>
            Cancel payment
          </button>
        </div>
      )}
    </div>
  )
}

// ─── BookingModal ─────────────────────────────────────────────────────────────
export function BookingModal({
  isOpen, onClose, barberId, barberName, date, startMin,
  barbers, services, isOwnerOrAdmin, myBarberId,
  isStudent, mentorBarberIds,
  existingEvent, onSave, onDelete, onPayment, allEvents, onOpenEvent
}: BookingModalProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientName, setClientName] = useState('')
  const [modalKey, setModalKey] = useState(0)  // force remount ClientSearch on open
  const [editClientOpen, setEditClientOpen] = useState(false)
  const [ecName, setEcName] = useState('')
  const [ecPhone, setEcPhone] = useState('')
  const [ecEmail, setEcEmail] = useState('')
  const [ecNotes, setEcNotes] = useState('')
  const [ecSaving, setEcSaving] = useState(false)
  // Barbers can only book for themselves — but when editing existing bookings, keep original barber
  const isEditingExisting = !!existingEvent?._raw?.id
  const forcedBarberId = (!isOwnerOrAdmin && myBarberId && !isEditingExisting) ? myBarberId : barberId
  const [selBarberId, setSelBarberId] = useState(forcedBarberId)
  const [serviceIds, setServiceIds] = useState<string[]>([])
  const [selStartMin, setSelStartMin] = useState(startMin)
  const [status, setStatus] = useState('booked')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [lightbox, setLightbox] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [shopSettings, setShopSettings] = useState<any>(null)
  useEffect(() => { getShopSettings().then(setShopSettings) }, [])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const isModelEvent = isStudent || !!existingEvent?.isModelEvent
  const isPaidEvent = !!existingEvent?.paid

  const isNew = !existingEvent?._raw?.id

  // Init from existing event
  useEffect(() => {
    if (!isOpen) return
    setSelBarberId(forcedBarberId)
    setSelStartMin(startMin)
    setModalKey(k => k + 1)  // remount ClientSearch
    if (existingEvent) {
      setClientName(existingEvent.clientName || '')
      setServiceIds(existingEvent.serviceIds?.length ? existingEvent.serviceIds : existingEvent.serviceId ? [existingEvent.serviceId] : [])
      setStatus(existingEvent.status || 'booked')
      setNotes((existingEvent.notes || '').replace(/Reference photo attached on website:\s*\S+/gi, '').trim())
      setPhotoUrl('')
      // Pre-fill client card if we have client info from existing event
      if (existingEvent.clientName) {
        setSelectedClient({ id: '', name: existingEvent.clientName, phone: existingEvent.clientPhone || '', visitCount: 0, client_status: existingEvent._raw?.client_status || 'new', no_shows: Number(existingEvent._raw?.no_shows || 0) })
        // Try to find real client ID for notes saving
        if (existingEvent.clientName !== 'BLOCKED' && existingEvent.clientName !== 'Client') {
          apiFetch(`/api/clients?q=${encodeURIComponent(existingEvent.clientName)}`)
            .then((data: any) => {
              const list = Array.isArray(data) ? data : (data?.clients || [])
              const match = list.find((c: any) => c.name === existingEvent.clientName)
              if (match?.id) setSelectedClient(prev => prev ? { ...prev, id: match.id, notes: match.notes || '', client_status: match.client_status || prev.client_status, no_shows: Number(match.no_shows || prev.no_shows || 0), visitCount: Number(match.visit_count || match.visits || prev.visitCount || 0) } : prev)
            }).catch(() => {})
        }
      } else {
        setSelectedClient(null)
      }
    } else {
      // Student: auto-fill and set status
      if (isStudent) {
        setClientName('')
        setStatus('model')
      } else {
        setClientName(''); setStatus('booked')
      }
      setServiceIds([]); setNotes(''); setPhotoUrl('')
      setSelectedClient(null)
    }
  }, [isOpen, existingEvent?.id, barberId, startMin])

  // Remap services when barber changes — find equivalent services by name
  function remapServicesForBarber(newBarberId: string, currentServiceIds: string[]) {
    if (!currentServiceIds.length) return currentServiceIds
    const newBarberSvcs = services.filter(s => !s.barberIds.length || s.barberIds.includes(newBarberId))
    const remapped = currentServiceIds.map(id => {
      // Already available for new barber? Keep it
      if (newBarberSvcs.some(s => s.id === id)) return id
      // Find equivalent by name
      const oldSvc = services.find(s => s.id === id)
      if (!oldSvc) return null
      const match = newBarberSvcs.find(s => s.name.toLowerCase() === oldSvc.name.toLowerCase())
      return match ? match.id : null
    }).filter(Boolean) as string[]
    return remapped
  }

  function handleBarberChange(newBarberId: string) {
    const remapped = remapServicesForBarber(newBarberId, serviceIds)
    setSelBarberId(newBarberId)
    setServiceIds(remapped)
  }

  const selectedSvcs = services.filter(s => serviceIds.includes(s.id))
  const durMin = isModelEvent ? 90 : (selectedSvcs.length > 0 ? selectedSvcs.reduce((sum, s) => sum + (s.durationMin || 30), 0) : 30)
  const barberServices = (() => {
    const filtered = services.filter(s => !s.barberIds.length || s.barberIds.includes(selBarberId))
    const list = filtered.length > 0 ? filtered : services
    // Sort by duration: longest first
    return [...list].sort((a, b) => (b.durationMin || 30) - (a.durationMin || 30))
  })()

  // Time slots — only barber's working hours, filtered by availability
  const workHours = getBarberWorkingHours(barbers, selBarberId, date)
  const schedStart = workHours?.startMin ?? 480
  const schedEnd = workHours?.endMin ?? 1260
  const allSlots: number[] = []
  for (let m = schedStart; m + durMin <= schedEnd; m += 5) allSlots.push(m)
  // Get busy intervals for selected barber (exclude current event being edited)
  const busyIntervals = (allEvents || [])
    .filter(e => e.barberId === selBarberId && e.date === date && e.clientName !== 'BLOCKED' && e.id !== existingEvent?.id)
    .map(e => ({ start: e.startMin, end: e.startMin + (e.durMin || 30) }))
  const slots = allSlots.filter(m => {
    const end = m + durMin
    return !busyIntervals.some(b => m < b.end && end > b.start)
  })
  // Auto-snap: only for non-admin users — admins can book at any tapped time
  if (!isOwnerOrAdmin && slots.length > 0 && !slots.includes(selStartMin)) {
    const closest = slots.reduce((a, b) => Math.abs(b - selStartMin) < Math.abs(a - selStartMin) ? b : a)
    if (closest !== selStartMin) setTimeout(() => setSelStartMin(closest), 0)
  }

  // Optimal slots — minimize gaps between appointments
  const optimalSlots = (() => {
    if (busyIntervals.length === 0) return []
    const sorted = [...busyIntervals].sort((a, b) => a.start - b.start)
    const scored = slots.map(m => {
      const end = m + durMin
      const afterBooking = sorted.some(b => b.end === m) || m === schedStart
      const beforeBooking = sorted.some(b => b.start === end) || end === schedEnd
      const score = (afterBooking ? 2 : 0) + (beforeBooking ? 2 : 0)
      // Also score slots close to bookings (within 5 min)
      const nearAfter = !afterBooking && sorted.some(b => m - b.end >= 0 && m - b.end <= 5)
      const nearBefore = !beforeBooking && sorted.some(b => b.start - end >= 0 && b.start - end <= 5)
      return { m, score: score + (nearAfter ? 1 : 0) + (nearBefore ? 1 : 0) }
    })
    return scored.filter(s => s.score >= 2).sort((a, b) => b.score - a.score).map(s => s.m).slice(0, 6)
  })()

  async function handleSave() {
    setFormError('')
    if (!isModelEvent && !clientName.trim()) { setFormError('Enter client name'); return }
    if (!isModelEvent && serviceIds.length === 0) { setFormError('Choose at least one service'); return }
    setSaving(true)
    // Student: format name as "Training · StudentName · ModelName"
    let finalClientName = clientName.trim()
    if (isStudent) {
      const studentName = (() => { try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}').name || 'Student' } catch { return 'Student' } })()
      finalClientName = finalClientName
        ? `Training · ${studentName} · ${finalClientName}`
        : `Training · ${studentName}`
    }
    // Safety: barbers can only save bookings for themselves (but keep original barber when editing)
    const saveBarberId = (!isOwnerOrAdmin && myBarberId && !isEditingExisting) ? myBarberId : selBarberId
    try {
      await onSave({
        clientName: finalClientName,
        clientPhone: selectedClient?.phone || '',
        clientId: selectedClient?.id,
        barberId: saveBarberId,
        serviceId: serviceIds[0] || '',
        serviceIds,
        date,
        startMin: selStartMin,
        durMin,
        status,
        notes,
        photoUrl,
      })
    } catch (e: any) {
      setFormError(e?.message || 'Save failed')
    }
    setSaving(false)
  }

  if (!isOpen) return null

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 6, fontWeight: 600 }

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes bmBackdropIn { from { opacity:0; backdrop-filter:blur(0px); -webkit-backdrop-filter:blur(0px) } to { opacity:1; backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px) } }
        @keyframes bmCardIn {
          0% { opacity:0; transform:translateY(60px) scale(.92) }
          60% { opacity:1; transform:translateY(-6px) scale(1.01) }
          80% { transform:translateY(2px) scale(.998) }
          100% { transform:translateY(0) scale(1) }
        }
        @keyframes bmGlowIn {
          0% { box-shadow: 0 40px 100px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 rgba(10,132,255,0) }
          40% { box-shadow: 0 40px 100px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.06), 0 0 40px rgba(10,132,255,.12) }
          100% { box-shadow: 0 40px 100px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 rgba(10,132,255,0) }
        }
        @keyframes bmShimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        .bm-scroll::-webkit-scrollbar { width:5px }
        .bm-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:3px }
        select option { background:#111 }
        .bm-backdrop { animation: bmBackdropIn .35s ease-out both }
        .bm-card { animation: bmCardIn .45s cubic-bezier(.16,1.2,.3,1) both, bmGlowIn .8s ease-out both }
        .bm-section { animation: slideDown .25s ease-out both }
        .bm-section:nth-child(2) { animation-delay: .08s }
        .bm-section:nth-child(3) { animation-delay: .14s }
        .bm-section:nth-child(4) { animation-delay: .20s }
        .bm-section:nth-child(5) { animation-delay: .26s }
        .bm-section:nth-child(6) { animation-delay: .32s }
        .bm-svc-btn {
          transition: all .2s cubic-bezier(.4,0,.2,1);
          position: relative;
          overflow: hidden;
        }
        .bm-svc-btn:active { transform: scale(.93) }
        .bm-svc-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: radial-gradient(circle at var(--rx,50%) var(--ry,50%), rgba(10,132,255,.35) 0%, transparent 60%);
          opacity: 0;
          transition: opacity .4s;
          pointer-events: none;
        }
        .bm-svc-active::after { opacity: 1; animation: bmRippleFade .6s ease-out }
        @keyframes bmRippleFade {
          0% { opacity: .8; transform: scale(.5) }
          50% { opacity: .4; transform: scale(1.2) }
          100% { opacity: 0; transform: scale(1) }
        }
        @keyframes bmSvcPop {
          0% { transform: scale(1) }
          40% { transform: scale(1.08) }
          100% { transform: scale(1) }
        }
        .bm-svc-pop { animation: bmSvcPop .3s cubic-bezier(.16,1.2,.3,1) }
        @keyframes bmPriceFloat {
          0% { opacity: 1; transform: translateY(0) scale(1) }
          100% { opacity: 0; transform: translateY(-28px) scale(.7) }
        }
        .bm-price-float {
          position: absolute; top: -4px; right: 8px;
          font-size: 10px; font-weight: 800; color: rgba(10,132,255,.80);
          pointer-events: none;
          animation: bmPriceFloat .5s ease-out forwards;
        }
        .bm-footer-btn { transition: all .15s ease; }
        .bm-footer-btn:active { transform: scale(.96) }
        .bm-input { transition: border-color .2s ease, box-shadow .2s ease; }
        .bm-input:focus { border-color: rgba(10,132,255,.50) !important; box-shadow: 0 0 0 3px rgba(10,132,255,.12) !important; }
        .bm-header-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.04) 40%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 60%, transparent 100%);
          background-size: 200% 100%;
          animation: bmShimmer 3s ease-in-out infinite;
        }
        @keyframes bmOrbit {
          0% { transform: rotate(0deg) translateX(52px) rotate(0deg) }
          100% { transform: rotate(360deg) translateX(52px) rotate(-360deg) }
        }
        @keyframes bmOrbitTrail {
          0% { transform: rotate(0deg) translateX(52px) rotate(0deg); opacity: .6 }
          100% { transform: rotate(360deg) translateX(52px) rotate(-360deg); opacity: 0 }
        }
        @keyframes bmOrbitGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(10,132,255,.15); }
          50% { box-shadow: 0 0 35px rgba(10,132,255,.30); }
        }
        @keyframes bmOrbitFadeIn {
          0% { opacity: 0; transform: scale(.9) }
          100% { opacity: 1; transform: scale(1) }
        }
        @keyframes bmDots {
          0%, 20% { opacity: .2 }
          50% { opacity: 1 }
          80%, 100% { opacity: .2 }
        }
        @keyframes bmSuccessIn {
          0% { opacity:0; transform:scale(.3) }
          50% { opacity:1; transform:scale(1.08) }
          70% { transform:scale(.96) }
          100% { transform:scale(1) }
        }
        @keyframes bmCheckDraw {
          0% { stroke-dashoffset: 48 }
          100% { stroke-dashoffset: 0 }
        }
        @keyframes bmCircleDraw {
          0% { stroke-dashoffset: 200 }
          100% { stroke-dashoffset: 0 }
        }
        @keyframes bmSuccessGlow {
          0% { box-shadow: 0 0 0 rgba(143,240,177,0) }
          50% { box-shadow: 0 0 60px rgba(143,240,177,.25) }
          100% { box-shadow: 0 0 0 rgba(143,240,177,0) }
        }
        @keyframes bmSuccessFade {
          0%,70% { opacity:1 }
          100% { opacity:0 }
        }
        .bm-success-overlay {
          animation: bmSuccessIn .5s cubic-bezier(.16,1.2,.3,1) both, bmSuccessFade 1.8s ease-in-out both;
        }
        .bm-success-ring {
          animation: bmCircleDraw .6s ease-out .15s both, bmSuccessGlow 1.2s ease-out .2s both;
        }
        .bm-success-check {
          animation: bmCheckDraw .4s ease-out .4s both;
        }
      `}</style>
      <div className="bm-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.50)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 'clamp(8px,3vw,16px)' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bm-scroll bm-card" style={{ width: 'min(580px,100%)', height: 'min(720px,calc(100dvh - 16px))', borderRadius: 24, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(8,8,12,.80)', backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 40px 100px rgba(0,0,0,.70), inset 0 1px 0 rgba(255,255,255,.06)', overflowY: 'auto', display: 'flex', flexDirection: 'column', color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>

          {/* Header */}
          <div className="bm-header-shimmer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 16px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
            <div>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 13, color: '#e9e9e9' }}>
                {isNew ? (isModelEvent ? 'New model appointment' : 'New appointment') : (isModelEvent ? `Model — ${existingEvent?.clientName}` : `Edit — ${existingEvent?.clientName}`)}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4, letterSpacing: '.08em' }}>
                {date} · {barberName} · {minToDisplay(selStartMin)}
              </div>
            </div>
            <button onClick={onClose} className="bm-footer-btn" style={{ width: 34, height: 34, borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.60)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ padding: '18px 22px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Client search — hidden for student (model appointment = student is the client) */}
            {isModelEvent ? (
              <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(168,107,255,.30)', background: 'rgba(168,107,255,.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(168,107,255,.20)', border: '1px solid rgba(168,107,255,.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4b8ff" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14, color: '#d4b8ff' }}>Model appointment</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>Free practice — {clientName}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label style={lbl}>Client</label>
                <ClientSearch
                  key={modalKey}
                  isOwnerOrAdmin={isOwnerOrAdmin}
                  initialClient={selectedClient}
                  initialName={!selectedClient ? clientName : undefined}
                  onSelect={(c, name) => {
                    setSelectedClient(c)
                    setClientName(c ? c.name : (name || ''))
                  }}
                />
              </div>
            )}

            {/* Booking fields — simplified for student */}
            {isModelEvent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Time + duration info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>Time</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{minToDisplay(selStartMin)} — {minToDisplay(selStartMin + durMin)}</div>
                  </div>
                  <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)' }}>
                    <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 2 }}>Mentor</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{barbers.find(b => b.id === selBarberId)?.name || '—'}</div>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Model name</label>
                  <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Enter model's name" style={inp} autoFocus />
                </div>
                <div>
                  <label style={lbl}>Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What to practice…" rows={2}
                    style={{ ...inp, height: 'auto', padding: '10px 12px', resize: 'vertical' as const, lineHeight: 1.5 }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Barber + Status + Time + Duration — compact grid */}
                <div className="bm-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={lbl}>Barber</label>
                    <select value={selBarberId} onChange={e => handleBarberChange(e.target.value)}
                      disabled={!isOwnerOrAdmin || isPaidEvent} className="bm-input"
                      style={{ ...inp, opacity: (isOwnerOrAdmin && !isPaidEvent) ? 1 : 0.5, cursor: (isOwnerOrAdmin && !isPaidEvent) ? 'auto' : 'not-allowed' }}>
                      {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  {!isNew && (
                    <div>
                      <label style={lbl}>Status</label>
                      <select value={status} onChange={e => {
                        const newStatus = e.target.value
                        setStatus(newStatus)
                        if (newStatus === 'cancelled' || newStatus === 'noshow') {
                          if (window.confirm(`Mark as ${newStatus}? This will save and close.`)) {
                            setTimeout(() => { try { onSave({ clientName: clientName || selectedClient?.name || '', clientPhone: selectedClient?.phone || '', clientId: selectedClient?.id, barberId: selBarberId, serviceId: serviceIds[0] || '', serviceIds, date, startMin: selStartMin, durMin, status: newStatus, notes, photoUrl }) } catch {} }, 50)
                          } else { setStatus(status) }
                        }
                        if (newStatus === 'arrived') {
                          setTimeout(() => { try { onSave({ clientName: clientName || selectedClient?.name || '', clientPhone: selectedClient?.phone || '', clientId: selectedClient?.id, barberId: selBarberId, serviceId: serviceIds[0] || '', serviceIds, date, startMin: selStartMin, durMin, status: 'arrived', notes, photoUrl, _forceArrivedNotify: true }) } catch {} }, 50)
                        }
                      }} disabled={isPaidEvent} className="bm-input" style={{ ...inp, opacity: isPaidEvent ? 0.5 : 1 }}>
                        {['booked','arrived','done','noshow','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={lbl}>Time {workHours ? <span style={{ color: 'rgba(255,255,255,.30)', fontWeight: 400 }}>({slots.length} free)</span> : <span style={{ color: '#ff6b6b', fontWeight: 400 }}>Day off</span>}</label>
                    {optimalSlots.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 9, color: 'rgba(143,240,177,.50)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>Best — no gaps</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                          {optimalSlots.map(m => {
                            const isActive = m === selStartMin
                            return <button key={`opt-${m}`} type="button" onClick={() => !isPaidEvent && setSelStartMin(m)} style={{
                              height: 34, borderRadius: 10,
                              border: `1px solid ${isActive ? 'rgba(143,240,177,.55)' : 'rgba(143,240,177,.20)'}`,
                              background: isActive ? 'rgba(143,240,177,.14)' : 'rgba(143,240,177,.04)',
                              color: isActive ? '#8ff0b1' : 'rgba(143,240,177,.65)', fontWeight: isActive ? 800 : 600,
                              fontSize: 11, cursor: isPaidEvent ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                              transition: 'all .15s ease', opacity: isPaidEvent ? 0.5 : 1,
                            }}>{minToDisplay(m)}</button>
                          })}
                        </div>
                      </div>
                    )}
                    {slots.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, maxHeight: 180, overflowY: 'auto', padding: 2 }}>
                        {slots.map(m => {
                          const isActive = m === selStartMin
                          return <button key={m} type="button" onClick={() => !isPaidEvent && setSelStartMin(m)} style={{
                            height: 34, borderRadius: 10, border: `1px solid ${isActive ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.08)'}`,
                            background: isActive ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.03)',
                            color: isActive ? '#d7ecff' : 'rgba(255,255,255,.50)', fontWeight: isActive ? 800 : 500,
                            fontSize: 11, cursor: isPaidEvent ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                            transition: 'all .15s ease', opacity: isPaidEvent ? 0.5 : 1,
                          }}>{minToDisplay(m)}</button>
                        })}
                      </div>
                    ) : (
                      <div style={{ padding: '12px 0', fontSize: 12, color: 'rgba(255,255,255,.30)', textAlign: 'center' }}>No available slots</div>
                    )}
                  </div>
                  <div>
                    <label style={lbl}>Duration → end</label>
                    <div style={{ height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.03)', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,.50)', fontWeight: 600 }}>
                      {durMin}min → {minToDisplay(selStartMin + durMin)}
                    </div>
                  </div>
                </div>

                {/* Services + Payment unified */}
                <div className="bm-section" style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)' }}>
                  <label style={{ ...lbl, marginBottom: 10 }}>Services {serviceIds.length > 0 && <span style={{ color: 'rgba(10,132,255,.60)', fontWeight: 600 }}>({serviceIds.length} selected)</span>}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
                    {barberServices.map(s => {
                      const active = serviceIds.includes(s.id)
                      const bp = s.price ? Number(String(s.price).replace(/[^\d.]/g, '')) : 0
                      const calc = calcTotal(bp, shopSettings)
                      const priceLabel = bp > 0 ? `$${calc.total.toFixed(2)}` : ''
                      return (
                        <button key={s.id} type="button" disabled={isPaidEvent} className={`bm-svc-btn${active ? ' bm-svc-active bm-svc-pop' : ''}`}
                          onClick={(e) => {
                            if (isPaidEvent) return
                            const adding = !active
                            setServiceIds(prev => active ? prev.filter(id => id !== s.id) : [...prev, s.id])
                            if (adding && priceLabel) {
                              const btn = e.currentTarget; const float = document.createElement('span'); float.className = 'bm-price-float'; float.textContent = '+' + priceLabel; btn.style.position = 'relative'; btn.appendChild(float); setTimeout(() => float.remove(), 600)
                            }
                          }}
                          style={{ height: 42, padding: '0 10px', borderRadius: 12, border: `1px solid ${active ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.08)'}`, background: active ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.03)', color: active ? '#d7ecff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontSize: 11, fontWeight: active ? 800 : 500, fontFamily: 'inherit', boxShadow: active ? '0 0 14px rgba(10,132,255,.18)' : 'none', display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', justifyContent: 'center', gap: 1, textAlign: 'left' as const }}>
                          <span style={{ lineHeight: 1.2 }}>{s.name}{active ? ' ✓' : ''}</span>
                          {priceLabel && <span style={{ fontSize: 10, opacity: .6 }}>{priceLabel}</span>}
                        </button>
                      )
                    })}
                  </div>
                  {selectedSvcs.length > 0 && (() => {
                    const totalDur = durMin
                    return (
                      <div style={{ marginTop: 10, padding: '6px 12px', borderRadius: 10, background: 'rgba(10,132,255,.04)', border: '1px solid rgba(10,132,255,.08)', fontSize: 12, color: 'rgba(10,132,255,.60)', fontWeight: 600, textAlign: 'center' }}>
                        {totalDur}min · {selectedSvcs.length} service{selectedSvcs.length > 1 ? 's' : ''}
                      </div>
                    )
                  })()}
                </div>

                {/* Notes — only if has content or new */}
                {(notes || isNew) && (
                  <div className="bm-section">
                    <label style={lbl}>Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" rows={2} className="bm-input"
                      style={{ ...inp, height: 'auto', padding: '10px 12px', resize: 'vertical' as const, lineHeight: 1.5 }} />
                  </div>
                )}
              </div>
            )}

            {/* Client photo — clean, no decoration */}
            {existingEvent?.photoUrl && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                  <img
                    src={existingEvent.photoUrl}
                    alt="reference"
                    style={{ width: 110, height: 110, borderRadius: 12, objectFit: 'cover', cursor: 'zoom-in', border: '1px solid rgba(255,255,255,.12)', display: 'block' }}
                    onClick={() => setLightbox(true)}
                    onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
                  />
                </div>
                {lightbox && (
                  <div onClick={() => setLightbox(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, cursor: 'zoom-out', backdropFilter: 'blur(8px)' }}>
                    <img src={existingEvent.photoUrl} alt="reference"
                      style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} />
                    <button onClick={() => setLightbox(false)}
                      style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.50)', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                )}
              </>
            )}

            {/* Edit Client Modal */}
            {editClientOpen && (
              <div style={{ position: 'fixed', inset: 0, zIndex: 250, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                onClick={e => { if (e.target === e.currentTarget) setEditClientOpen(false) }}>
                <div style={{ width: 'min(400px,92vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(10,10,20,.92)', backdropFilter: 'saturate(180%) blur(40px)', padding: 0, boxShadow: '0 30px 80px rgba(0,0,0,.6)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                    <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.14em', textTransform: 'uppercase', fontSize: 12 }}>Edit client</div>
                    <button onClick={() => setEditClientOpen(false)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 5 }}>Name</label>
                      <input value={ecName} onChange={e => setEcName(e.target.value)} style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 5 }}>Phone</label>
                      <input value={ecPhone} onChange={e => setEcPhone(e.target.value)} type="tel" style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 5 }}>Email</label>
                      <input value={ecEmail} onChange={e => setEcEmail(e.target.value)} type="email" style={{ width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', display: 'block', marginBottom: 5 }}>Notes</label>
                      <textarea value={ecNotes} onChange={e => setEcNotes(e.target.value)} rows={3} style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '10px 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.5 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                      <button onClick={() => setEditClientOpen(false)} style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.60)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
                      <button disabled={ecSaving} onClick={async () => {
                        if (!ecName.trim()) return
                        setEcSaving(true)
                        try {
                          const patch: any = { name: ecName.trim() }
                          if (ecPhone) patch.phone = ecPhone
                          if (ecEmail) patch.email = ecEmail
                          if (ecNotes !== undefined) patch.notes = ecNotes
                          await apiFetch(`/api/clients/${encodeURIComponent(selectedClient?.id || '')}`, { method: 'PATCH', body: JSON.stringify(patch) })
                          setSelectedClient(prev => prev ? { ...prev, name: ecName.trim(), phone: ecPhone, email: ecEmail, notes: ecNotes } : prev)
                          setClientName(ecName.trim())
                          setEditClientOpen(false)
                        } catch (e: any) { console.warn('Edit client error:', e) }
                        setEcSaving(false)
                      }} style={{ flex: 1, height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.50)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: ecSaving ? .5 : 1 }}>
                        {ecSaving ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload reference photo — only for new bookings */}
            {!isModelEvent && isNew && <PhotoUpload value={photoUrl} onChange={(url) => setPhotoUrl(url)} />}

            {/* Payment — owner/admin only, NOT for new bookings or model/training */}
            {isOwnerOrAdmin && existingEvent && !isNew && !isModelEvent && (
              <PaymentPanel ev={existingEvent} services={services} onPayment={(method, tip) => { onPayment(method, tip); setPaymentSuccess(true); setTimeout(() => onClose(), 1800) }} allEvents={allEvents} barberId={barberId} onOpenEvent={onOpenEvent} date={date} />
            )}

            {/* Form error */}
            {formError && (
              <div style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,207,63,.30)', background: 'rgba(255,207,63,.08)', fontSize: 12, color: '#ffe9a3', fontWeight: 600 }}>{formError}</div>
            )}

            {/* Footer */}
            <div className="bm-section" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 14, marginTop: 4, borderTop: '1px solid rgba(255,255,255,.06)', flexWrap: 'wrap' as const }}>
              {!isNew && !isPaidEvent && (
                <button onClick={onDelete} className="bm-footer-btn" style={{ height: 44, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13, letterSpacing: '.02em' }}>Delete</button>
              )}
              <button onClick={onClose} className="bm-footer-btn" style={{ height: 44, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.70)', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>Close</button>
              {!isPaidEvent && (
              <button onClick={handleSave} disabled={saving} className="bm-footer-btn" style={{ height: 44, padding: '0 24px', borderRadius: 999, border: isModelEvent ? '1px solid rgba(168,107,255,.50)' : '1px solid rgba(10,132,255,.40)', background: isModelEvent ? 'rgba(168,107,255,.14)' : 'rgba(10,132,255,.12)', color: isModelEvent ? '#d4b8ff' : '#d7ecff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13, opacity: saving ? .5 : 1, boxShadow: saving ? 'none' : isModelEvent ? '0 0 16px rgba(168,107,255,.15)' : '0 0 16px rgba(10,132,255,.15)' }}>
                {saving ? 'Saving…' : isModelEvent ? (isNew ? 'Book model' : 'Save') : 'Save'}
              </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment success overlay */}
      {paymentSuccess && (
        <div className="bm-success-overlay" style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.70)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle className="bm-success-ring" cx="60" cy="60" r="50" fill="none" stroke="rgba(143,240,177,.70)" strokeWidth="3" strokeDasharray="200" strokeDashoffset="200" strokeLinecap="round" />
              <polyline className="bm-success-check" points="38,62 52,76 82,46" fill="none" stroke="#8ff0b1" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="48" strokeDashoffset="48" />
            </svg>
            <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 14, color: '#c9ffe1' }}>Payment complete</div>
          </div>
        </div>
      )}
    </>
  )
}
