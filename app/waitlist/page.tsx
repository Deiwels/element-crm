'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Shell from '../../components/Shell'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, {
    credentials: 'include', ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers || {}) },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

interface WaitlistEntry {
  id: string
  client_name?: string
  phone_raw?: string
  phone_norm?: string
  barber_id: string
  barber_name?: string
  date: string
  service_names?: string[]
  duration_minutes: number
  notified: boolean
  confirmed?: boolean
  removed?: boolean
  created_at: string
}

interface Barber { id: string; name: string }

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(false)

  // Add form
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newBarberId, setNewBarberId] = useState('')
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newDuration, setNewDuration] = useState(30)
  const [saving, setSaving] = useState(false)

  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}') } catch { return {} }
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [wl, bd] = await Promise.all([
        apiFetch('/api/waitlist'),
        apiFetch('/api/barbers'),
      ])
      setEntries(wl?.waitlist || [])
      const list = (Array.isArray(bd) ? bd : bd?.barbers || []).map((b: any) => ({ id: b.id, name: b.name }))
      setBarbers(list)
      if (!newBarberId && list.length) setNewBarberId(list[0].id)
    } catch (e: any) { console.warn('waitlist load:', e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function confirm(id: string) {
    try {
      await apiFetch(`/api/waitlist/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'confirm' }) })
      load()
    } catch (e: any) { alert(e.message) }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/api/waitlist/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ action: 'remove' }) })
      load()
    } catch (e: any) { alert(e.message) }
  }

  async function addEntry() {
    if (!newName.trim() || !newPhone.trim() || !newBarberId || !newDate) return
    setSaving(true)
    try {
      const barber = barbers.find(b => b.id === newBarberId)
      await apiFetch('/api/waitlist', {
        method: 'POST',
        body: JSON.stringify({
          client_name: newName.trim(),
          phone: newPhone.trim(),
          barber_id: newBarberId,
          barber_name: barber?.name || '',
          date: newDate,
          duration_minutes: newDuration,
        }),
      })
      setNewName(''); setNewPhone(''); setAdding(false)
      load()
    } catch (e: any) { alert(e.message) }
    setSaving(false)
  }

  async function checkWaitlist() {
    try {
      const res = await apiFetch('/api/admin/waitlist/check')
      alert(`Checked: ${res.checked}, Notified: ${res.notified}`)
      load()
    } catch (e: any) { alert(e.message) }
  }

  const filtered = filter
    ? entries.filter(e => e.barber_id === filter)
    : entries

  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 14, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 5 }

  return (
    <Shell page="Waitlist" sub="Queue & notify" user={user}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#e9e9e9', fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.12em', textTransform: 'uppercase' }}>Waitlist</h2>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 2 }}>{filtered.length} waiting</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={checkWaitlist} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(143,240,177,.35)', background: 'rgba(143,240,177,.08)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
              Check & notify
            </button>
            <button onClick={() => setAdding(!adding)} style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
              {adding ? 'Cancel' : '+ Add'}
            </button>
            <button onClick={load} style={{ height: 36, width: 36, borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>↻</button>
          </div>
        </div>

        {/* Filter by barber */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFilter('')}
            style={{ height: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${!filter ? 'rgba(255,255,255,.30)' : 'rgba(255,255,255,.10)'}`, background: !filter ? 'rgba(255,255,255,.08)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
            All
          </button>
          {barbers.map(b => (
            <button key={b.id} onClick={() => setFilter(b.id)}
              style={{ height: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${filter === b.id ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)'}`, background: filter === b.id ? 'rgba(10,132,255,.12)' : 'transparent', color: filter === b.id ? '#d7ecff' : 'rgba(255,255,255,.65)', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
              {b.name}
            </button>
          ))}
        </div>

        {/* Add form */}
        {adding && (
          <div style={{ padding: 16, borderRadius: 18, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#d7ecff', letterSpacing: '.08em', textTransform: 'uppercase' }}>Add to waitlist</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={lbl}>Client name</label>
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Doe" style={inp} />
              </div>
              <div>
                <label style={lbl}>Phone</label>
                <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="+1 (___) ___-____" type="tel" style={inp} />
              </div>
              <div>
                <label style={lbl}>Barber</label>
                <select value={newBarberId} onChange={e => setNewBarberId(e.target.value)} style={inp}>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date</label>
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={inp} />
              </div>
              <div>
                <label style={lbl}>Duration (min)</label>
                <select value={newDuration} onChange={e => setNewDuration(Number(e.target.value))} style={inp}>
                  {[15, 20, 25, 30, 35, 40, 45, 60, 90].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
            </div>
            <button onClick={addEntry} disabled={saving || !newName.trim() || !newPhone.trim()}
              style={{ height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
              {saving ? 'Adding…' : 'Add to waitlist'}
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.30)', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,.25)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" style={{ margin: '0 auto 12px' }}>
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
            </svg>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No one waiting</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Clients will appear here when they join the waitlist</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(entry => {
              const barber = barbers.find(b => b.id === entry.barber_id)
              return (
                <div key={entry.id} style={{ padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>{entry.client_name || 'Unknown'}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(255,207,63,.30)', background: 'rgba(255,207,63,.08)', color: '#ffe9a3', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>WAITING</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span>{barber?.name || entry.barber_name || '—'}</span>
                      <span>{entry.date}</span>
                      <span>{entry.duration_minutes}min</span>
                      {entry.phone_raw && <span>{entry.phone_raw}</span>}
                    </div>
                    {entry.service_names?.length ? (
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{entry.service_names.join(', ')}</div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => confirm(entry.id)}
                      style={{ height: 32, padding: '0 12px', borderRadius: 8, border: '1px solid rgba(143,240,177,.40)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                      Confirm
                    </button>
                    <button onClick={() => remove(entry.id)}
                      style={{ height: 32, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Shell>
  )
}
