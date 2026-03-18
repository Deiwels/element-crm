'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

// ─── Types ───────────────────────────────────────────────────────────────────
interface Client {
  id: string
  name: string
  phone?: string
  email?: string
  notes?: string
  visitCount?: number
}

interface Barber { id: string; name: string; color: string }
interface Service { id: string; name: string; durationMin: number; price?: string; barberIds: string[] }

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
  existingEvent?: {
    id: string
    clientName: string
    clientPhone?: string
    serviceId: string
    status: string
    notes?: string
    paid: boolean
    paymentMethod?: string
    photoUrl?: string
    _raw: any
  } | null
  onSave: (data: {
    clientName: string; clientPhone: string; clientId?: string
    barberId: string; serviceId: string; date: string; startMin: number
    durMin: number; status: string; notes: string; photoUrl?: string
  }) => void
  onDelete: () => void
  onPayment: (method: string, tip: number) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0')
const minToHHMM = (min: number) => `${pad2(Math.floor(min / 60))}:${pad2(min % 60)}`

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 4) return `+1 ***-***-${digits.slice(-4)}`
  return phone ? '***' : '—'
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── ClientSearch ─────────────────────────────────────────────────────────────
function ClientSearch({ onSelect, isOwnerOrAdmin }: {
  onSelect: (c: Client | null, name: string) => void
  isOwnerOrAdmin: boolean
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Client | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<any>(null)

  const search = useCallback((q: string) => {
    if (q.length < 2) { setResults([]); setLoading(false); return }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const data = await apiFetch(`/api/clients/search?q=${encodeURIComponent(q)}`)
        setResults(Array.isArray(data?.clients) ? data.clients : Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      setLoading(false)
    }, 300)
  }, [])

  function select(c: Client) {
    setSelected(c); setQuery(c.name); setOpen(false); setShowNew(false)
    onSelect(c, c.name)
  }

  function clear() {
    setSelected(null); setQuery(''); setResults([]); setShowNew(false)
    onSelect(null, '')
  }

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 14, fontFamily: 'inherit' }

  if (selected) {
    return (
      <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(10,132,255,.35)', background: 'rgba(10,132,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(10,132,255,.20)', border: '1px solid rgba(10,132,255,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14 }}>{selected.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)', marginTop: 2 }}>
              {isOwnerOrAdmin ? (selected.phone || '—') : (selected.phone ? maskPhone(selected.phone) : '—')}
              {selected.visitCount ? ` · ${selected.visitCount} visits` : ''}
            </div>
          </div>
        </div>
        <button onClick={clear} style={{ height: 30, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit' }}>Change</button>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); setOpen(true); onSelect(null, e.target.value) }}
          onFocus={() => setOpen(true)}
          placeholder="Search by name or phone…"
          style={inp}
          autoComplete="off"
        />
        {loading && <div style={{ position: 'absolute', right: 12, top: 14, width: 16, height: 16, border: '2px solid rgba(255,255,255,.20)', borderTop: '2px solid #0a84ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
      </div>

      {open && query.length >= 2 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: 4, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(30,30,30,.98),rgba(18,18,18,.98))', backdropFilter: 'blur(18px)', boxShadow: '0 12px 40px rgba(0,0,0,.6)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,.45)' }}>Searching…</div>
          ) : results.length > 0 ? (
            <>
              {results.slice(0, 8).map(c => (
                <div key={c.id} onClick={() => select(c)}
                  style={{ padding: '12px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.05)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>
                      {isOwnerOrAdmin ? c.phone || '—' : c.phone ? maskPhone(c.phone) : '—'}
                      {c.visitCount ? ` · ${c.visitCount} visits` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 10 }}>Client not found</div>
              <button onClick={() => { setShowNew(true); setOpen(false) }}
                style={{ height: 36, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>
                + Add new client
              </button>
            </div>
          )}
        </div>
      )}

      {showNew && (
        <NewClientForm
          initialName={query}
          onCreated={c => { select(c); setShowNew(false) }}
          onCancel={() => setShowNew(false)}
        />
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

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }

  return (
    <div style={{ marginTop: 8, padding: '14px', borderRadius: 14, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.05)', animation: 'slideDown .2s ease' }}>
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
function PaymentPanel({ ev, services, onPayment }: {
  ev: BookingModalProps['existingEvent']
  services: Service[]
  onPayment: (method: string, tip: number) => void
}) {
  const [method, setMethod] = useState('terminal')
  const [tipYes, setTipYes] = useState(false)
  const [tipAmt, setTipAmt] = useState(0)
  const [hint, setHint] = useState('')
  const [polling, setPolling] = useState(false)
  const pollRef = useRef<any>(null)

  const svc = services.find(s => s.id === ev?.serviceId)
  const price = svc?.price ? Number(String(svc.price).replace(/[^\d.]/g, '')) : 0

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  if (ev?.paid) {
    return (
      <div style={{ padding: '10px 14px', borderRadius: 14, border: '1px solid rgba(143,240,177,.30)', background: 'rgba(143,240,177,.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8ff0b1" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        <span style={{ fontSize: 13, color: '#c9ffe1', fontWeight: 700 }}>Paid via {ev.paymentMethod || '—'}</span>
      </div>
    )
  }

  const methodStyle = (m: string): React.CSSProperties => ({
    flex: 1, height: 38, borderRadius: 999, cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit',
    border: method === m ? {
      terminal: '1px solid rgba(10,132,255,.75)', cash: '1px solid rgba(143,240,177,.65)',
      zelle: '1px solid rgba(106,0,255,.75)', other: '1px solid rgba(255,207,63,.65)'
    }[m]! : '1px solid rgba(255,255,255,.12)',
    background: method === m ? {
      terminal: 'rgba(10,132,255,.14)', cash: 'rgba(143,240,177,.10)',
      zelle: 'rgba(106,0,255,.14)', other: 'rgba(255,207,63,.10)'
    }[m]! : 'rgba(255,255,255,.04)',
    color: method === m ? {
      terminal: '#d7ecff', cash: '#c9ffe1', zelle: '#d8b4fe', other: '#fff3b0'
    }[m]! : 'rgba(255,255,255,.70)',
  })

  async function handleTerminal() {
    const backendId = ev?._raw?.id
    if (!backendId) { setHint('Save booking first'); return }
    if (!price) { setHint('Service has no price'); return }
    setHint(`Sending $${price.toFixed(2)} to Terminal…`); setPolling(true)
    try {
      const res = await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({ booking_id: String(backendId), amount: price, currency: 'USD', client_name: ev?._raw?.client_name || '', service_name: svc?.name || '' })
      })
      const checkoutId = res?.checkout_id
      if (!checkoutId) { setHint('No checkout ID. Check Terminal manually.'); setPolling(false); return }
      setHint('Waiting for payment…')
      let count = 0
      pollRef.current = setInterval(async () => {
        count++
        if (count > 45) { clearInterval(pollRef.current); setHint('Timed out'); setPolling(false); return }
        try {
          const s = await apiFetch(`/api/payments/terminal/status/${encodeURIComponent(checkoutId)}`)
          if (String(s?.status).toUpperCase() === 'COMPLETED') {
            clearInterval(pollRef.current); setPolling(false)
            setHint('Payment completed ✓'); onPayment('terminal', 0)
          } else if (String(s?.status).toUpperCase().includes('CANCEL')) {
            clearInterval(pollRef.current); setPolling(false); setHint('Cancelled on Terminal')
          }
        } catch {}
      }, 4000)
    } catch (e: any) { setHint('Error: ' + e.message); setPolling(false) }
  }

  async function handleManual() {
    const backendId = ev?._raw?.id
    const tip = tipYes ? tipAmt : 0
    setHint('Saving…')
    try {
      await apiFetch('/api/payments/terminal', {
        method: 'POST',
        body: JSON.stringify({ booking_id: backendId ? String(backendId) : '', amount: price, tip, tip_amount: tip, source: method, payment_method: method, currency: 'USD', client_name: ev?._raw?.client_name || '', service_name: svc?.name || '' })
      })
      if (backendId) {
        await apiFetch('/api/bookings/' + encodeURIComponent(String(backendId)), {
          method: 'PATCH', body: JSON.stringify({ paid: true, payment_method: method, tip, service_amount: price })
        })
      }
      setHint(`${method} payment recorded ✓`); onPayment(method, tip)
    } catch (e: any) { setHint('Error: ' + e.message) }
  }

  return (
    <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.16)', marginTop: 4 }}>
      <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', marginBottom: 10 }}>
        Accept payment {price > 0 && <span style={{ color: 'rgba(255,255,255,.35)' }}>— ${price.toFixed(2)}</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['terminal','cash','zelle','other'] as const).map(m => (
          <button key={m} onClick={() => { setMethod(m); setHint(''); if (m === 'terminal') handleTerminal() }} disabled={polling} style={methodStyle(m)}>
            {m === 'terminal' && polling ? 'Waiting…' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>
      {method !== 'terminal' && method !== 'cash' && (
        <div style={{ padding: '10px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.12)', marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>Tip?</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setTipYes(false)} style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${!tipYes ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'}`, background: !tipYes ? 'rgba(255,255,255,.06)' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>No tip</button>
            <button onClick={() => setTipYes(true)} style={{ flex: 1, height: 32, borderRadius: 8, border: `1px solid ${tipYes ? 'rgba(143,240,177,.55)' : 'rgba(255,255,255,.10)'}`, background: tipYes ? 'rgba(143,240,177,.08)' : 'transparent', color: tipYes ? '#c9ffe1' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>Yes, tip</button>
            {tipYes && <input type="number" min="0" step="0.01" placeholder="$ amount" value={tipAmt || ''} onChange={e => setTipAmt(parseFloat(e.target.value) || 0)} style={{ flex: 1, height: 32, borderRadius: 8, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 12 }} />}
          </div>
        </div>
      )}
      {method === 'cash' && (
        <div style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(143,240,177,.06)', border: '1px solid rgba(143,240,177,.18)', fontSize: 12, color: 'rgba(143,240,177,.85)', marginBottom: 8 }}>Cash collected by barber directly</div>
      )}
      {method !== 'terminal' && (
        <button onClick={handleManual} style={{ width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit' }}>
          Confirm {method} payment
        </button>
      )}
      {hint && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.50)', marginTop: 8 }}>{hint}</div>}
    </div>
  )
}

// ─── BookingModal ─────────────────────────────────────────────────────────────
export function BookingModal({
  isOpen, onClose, barberId, barberName, date, startMin,
  barbers, services, isOwnerOrAdmin, myBarberId,
  existingEvent, onSave, onDelete, onPayment
}: BookingModalProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientName, setClientName] = useState('')
  const [selBarberId, setSelBarberId] = useState(barberId)
  const [serviceId, setServiceId] = useState('')
  const [selStartMin, setSelStartMin] = useState(startMin)
  const [status, setStatus] = useState('booked')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const isNew = !existingEvent?._raw?.id

  // Init from existing event
  useEffect(() => {
    if (!isOpen) return
    setSelBarberId(barberId)
    setSelStartMin(startMin)
    if (existingEvent) {
      setClientName(existingEvent.clientName || '')
      setServiceId(existingEvent.serviceId || '')
      setStatus(existingEvent.status || 'booked')
      setNotes(existingEvent.notes || '')
      setPhotoUrl('')  // Upload state is always fresh; existing photo shown separately
    } else {
      setClientName(''); setServiceId(''); setStatus('booked'); setNotes(''); setPhotoUrl('')
      setSelectedClient(null)
    }
  }, [isOpen, existingEvent?.id, barberId, startMin])

  const svc = services.find(s => s.id === serviceId)
  const durMin = svc?.durationMin || 30
  const barberServices = services.filter(s => !s.barberIds.length || s.barberIds.includes(selBarberId))

  // Time slots 5min
  const slots: number[] = []
  for (let m = 9 * 60; m <= 21 * 60 - 5; m += 5) slots.push(m)

  async function handleSave() {
    if (!clientName.trim()) { alert('Enter client name'); return }
    if (!serviceId) { alert('Choose service'); return }
    setSaving(true)
    onSave({
      clientName: clientName.trim(),
      clientPhone: selectedClient?.phone || '',
      clientId: selectedClient?.id,
      barberId: selBarberId,
      serviceId,
      date,
      startMin: selStartMin,
      durMin,
      status,
      notes,
      photoUrl,
    })
    setSaving(false)
  }

  if (!isOpen) return null

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', display: 'block', marginBottom: 5 }

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
        .bm-scroll::-webkit-scrollbar { width:5px } 
        .bm-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,.15); border-radius:3px }
        select option { background:#111 }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80, padding: 18, overflowY: 'auto' }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="bm-scroll" style={{ width: 'min(680px,95vw)', borderRadius: 20, border: '1px solid rgba(255,255,255,.12)', background: 'linear-gradient(180deg,rgba(28,28,28,.98),rgba(16,16,16,.98))', backdropFilter: 'blur(18px)', boxShadow: '0 20px 80px rgba(0,0,0,.7)', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <div>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13, color: '#e9e9e9' }}>
                {isNew ? 'New appointment' : `Edit — ${existingEvent?.clientName}`}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 3, letterSpacing: '.08em' }}>
                {date} · {barberName} · {minToHHMM(selStartMin)}
              </div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
          </div>

          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Client search */}
            <div>
              <label style={lbl}>Client</label>
              <ClientSearch
                isOwnerOrAdmin={isOwnerOrAdmin}
                onSelect={(c, name) => { setSelectedClient(c); setClientName(name || c?.name || '') }}
              />
              {!selectedClient && clientName && (
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Or type name manually" style={{ ...inp, marginTop: 8, fontSize: 13 }} />
              )}
            </div>

            {/* Booking fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Barber</label>
                <select value={selBarberId} onChange={e => setSelBarberId(e.target.value)}
                  disabled={!isOwnerOrAdmin}
                  style={{ ...inp, opacity: isOwnerOrAdmin ? 1 : 0.6, cursor: isOwnerOrAdmin ? 'auto' : 'not-allowed' }}>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Service</label>
                <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={inp}>
                  <option value="">Choose service…</option>
                  {barberServices.map(s => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — $${s.price}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Time</label>
                <select value={selStartMin} onChange={e => setSelStartMin(Number(e.target.value))} style={inp}>
                  {slots.map(m => <option key={m} value={m}>{minToHHMM(m)}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Duration → end time</label>
                <div style={{ height: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.12)', padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(255,255,255,.60)' }}>
                  {durMin}min → {minToHHMM(selStartMin + durMin)}
                </div>
              </div>
              {!isNew && (
                <div>
                  <label style={lbl}>Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} style={inp}>
                    {['booked','arrived','done','noshow','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
              <div style={{ gridColumn: !isNew ? '2 / 3' : '1 / -1' }}>
                <label style={lbl}>Notes</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes…" style={inp} />
              </div>
            </div>

            {/* Reference photo */}
            <PhotoUpload value={photoUrl} onChange={(url) => setPhotoUrl(url)} />

            {/* Reference photo from client (website booking) */}
            {existingEvent?.photoUrl && (
              <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,207,63,.25)', background: 'rgba(255,207,63,.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,207,63,.80)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,207,63,.80)', fontWeight: 900 }}>Reference photo from client</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <img
                    src={existingEvent.photoUrl}
                    alt="Client reference"
                    style={{ width: 120, height: 120, borderRadius: 14, objectFit: 'cover', border: '1px solid rgba(255,207,63,.30)', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => window.open(existingEvent.photoUrl, '_blank')}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.6, marginBottom: 8 }}>
                      Client attached this reference when booking online. Click the photo to view full size.
                    </div>
                    <button
                      onClick={() => window.open(existingEvent.photoUrl, '_blank')}
                      style={{ height: 32, padding: '0 14px', borderRadius: 8, border: '1px solid rgba(255,207,63,.35)', background: 'rgba(255,207,63,.08)', color: 'rgba(255,207,63,.90)', cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit' }}>
                      Open full size ↗
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment — owner/admin only */}
            {isOwnerOrAdmin && existingEvent && (
              <PaymentPanel ev={existingEvent} services={services} onPayment={onPayment} />
            )}

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid rgba(255,255,255,.08)', flexWrap: 'wrap' }}>
              {!isNew && (
                <button onClick={onDelete} style={{ height: 42, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13 }}>Delete</button>
              )}
              <button onClick={onClose} style={{ height: 42, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 13 }}>Close</button>
              <button onClick={handleSave} disabled={saving} style={{ height: 42, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(10,132,255,.80)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 13, opacity: saving ? .5 : 1 }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
