'use client'
import { useEffect, useState, useCallback } from 'react'
import Shell from '@/components/Shell'
import { apiFetch } from '@/lib/api'

interface Membership {
  id: string; client_id: string; client_name: string; client_phone: string
  barber_id: string; barber_name: string; service_id: string; service_name: string
  frequency: string; preferred_day: number; preferred_time_min: number
  duration_minutes: number; amount_cents: number; status: string
  next_booking_at: string; last_booking_at: string; charge_count: number
  created_at: string
}
interface Barber { id: string; name: string }
interface Service { id: string; name: string; durationMin: number; price?: string; barberIds: string[] }

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const FREQ_LABELS: Record<string,string> = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' }
const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  active: { color: '#8ff0b1', bg: 'rgba(143,240,177,.10)', border: 'rgba(143,240,177,.30)' },
  paused: { color: '#ffe9a3', bg: 'rgba(255,207,63,.08)', border: 'rgba(255,207,63,.30)' },
  cancelled: { color: '#ffd0d0', bg: 'rgba(255,107,107,.08)', border: 'rgba(255,107,107,.25)' },
}

const money = (cents: number) => '$' + (cents / 100).toFixed(2)
const minToTime = (min: number) => { const h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'PM' : 'AM'; return `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${String(m).padStart(2, '0')} ${ap}` }
const fmtDate = (iso: string) => { try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return iso } }
const fmtDateTime = (iso: string) => { try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) } catch { return iso } }

export default function MembershipPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Membership | null>(null)

  // Form
  const [fClient, setFClient] = useState('')
  const [fPhone, setFPhone] = useState('')
  const [fBarber, setFBarber] = useState('')
  const [fService, setFService] = useState('')
  const [fFreq, setFFreq] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly')
  const [fDay, setFDay] = useState(1)
  const [fTime, setFTime] = useState(600)
  const [saving, setSaving] = useState(false)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mData, bData, sData] = await Promise.all([
        apiFetch('/api/memberships'),
        apiFetch('/api/barbers'),
        apiFetch('/api/services'),
      ])
      setMemberships(mData?.memberships || [])
      const bList = (Array.isArray(bData) ? bData : bData?.barbers || []).filter((b: any) => b.active !== false)
      setBarbers(bList.map((b: any) => ({ id: b.id, name: b.name })))
      const sList = (sData?.services || []).map((s: any) => ({
        id: s.id, name: s.name,
        durationMin: s.duration_minutes || Math.round((s.durationMs || 0) / 60000) || 30,
        price: s.price_cents > 0 ? (s.price_cents / 100).toFixed(2) : '',
        barberIds: (s.barber_ids || []).map(String),
      }))
      setServices(sList)
    } catch (e: any) { showToast('Error: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function openAdd() {
    setEditing(null); setFClient(''); setFPhone(''); setFBarber(barbers[0]?.id || ''); setFService(''); setFFreq('weekly'); setFDay(1); setFTime(600); setShowModal(true)
  }
  function openEdit(m: Membership) {
    setEditing(m); setFClient(m.client_name); setFPhone(m.client_phone || ''); setFBarber(m.barber_id); setFService(m.service_id); setFFreq(m.frequency as any); setFDay(m.preferred_day); setFTime(m.preferred_time_min); setShowModal(true)
  }

  async function handleSave() {
    if (!fClient.trim()) { showToast('Enter client name'); return }
    if (!fBarber) { showToast('Select barber'); return }
    setSaving(true)
    const barber = barbers.find(b => b.id === fBarber)
    const svc = services.find(s => s.id === fService)
    try {
      if (editing) {
        await apiFetch(`/api/memberships/${editing.id}`, { method: 'PATCH', body: JSON.stringify({
          barber_id: fBarber, barber_name: barber?.name || '', service_id: fService, service_name: svc?.name || '',
          duration_minutes: svc?.durationMin || 30, frequency: fFreq, preferred_day: fDay, preferred_time_min: fTime,
          amount_cents: svc?.price ? Math.round(parseFloat(svc.price) * 100) : 0,
        }) })
        showToast('Membership updated ✓')
      } else {
        await apiFetch('/api/memberships', { method: 'POST', body: JSON.stringify({
          client_name: fClient.trim(), client_phone: fPhone, barber_id: fBarber, barber_name: barber?.name || '',
          service_id: fService, service_name: svc?.name || '', duration_minutes: svc?.durationMin || 30,
          frequency: fFreq, preferred_day: fDay, preferred_time_min: fTime,
          amount_cents: svc?.price ? Math.round(parseFloat(svc.price) * 100) : 0,
        }) })
        showToast('Membership created ✓')
      }
      setShowModal(false); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
    setSaving(false)
  }

  async function toggleStatus(m: Membership) {
    const newStatus = m.status === 'active' ? 'paused' : 'active'
    try {
      await apiFetch(`/api/memberships/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) })
      showToast(newStatus === 'active' ? 'Resumed ✓' : 'Paused ✓'); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  async function cancelMembership(m: Membership) {
    try {
      await apiFetch(`/api/memberships/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
      showToast('Cancelled ✓'); load()
    } catch (e: any) { showToast('Error: ' + e.message) }
  }

  const active = memberships.filter(m => m.status === 'active')
  const paused = memberships.filter(m => m.status === 'paused')
  const cancelled = memberships.filter(m => m.status === 'cancelled')

  const card: React.CSSProperties = { borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.02))', padding: 16 }
  const inp: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 14px', outline: 'none', fontSize: 14, fontFamily: 'inherit' }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', display: 'block', marginBottom: 6 }

  // Time options
  const timeOptions: { value: number; label: string }[] = []
  for (let h = 6; h <= 21; h++) for (let m = 0; m < 60; m += 30) timeOptions.push({ value: h * 60 + m, label: minToTime(h * 60 + m) })

  return (
    <Shell page="membership">
      {/* Loading */}
      {loading && memberships.length === 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000', gap: 16 }}>
          <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/Element_logo-05.jpg" alt="Element" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
            <svg viewBox="0 0 80 80" fill="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', animation: 'memSpin 1.2s linear infinite' }}>
              <circle cx="40" cy="40" r="38" stroke="rgba(255,255,255,.08)" strokeWidth="2.5" />
              <path d="M40 2a38 38 0 0 1 38 38" stroke="#d7ecff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.30)', letterSpacing: '.08em' }}>Loading memberships…</div>
        </div>
      )}

      <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.22em', textTransform: 'uppercase', fontSize: 18 }}>Membership</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.40)', marginTop: 2 }}>{active.length} active · {paused.length} paused · {cancelled.length} cancelled</div>
          </div>
          <button onClick={openAdd} style={{ height: 38, padding: '0 18px', borderRadius: 12, border: '1px solid rgba(143,240,177,.35)', background: 'rgba(143,240,177,.08)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', letterSpacing: '.06em', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add membership
          </button>
        </div>

        {/* Membership cards */}
        {memberships.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,.25)', fontSize: 13 }}>No memberships yet</div>
        )}

        {memberships.map((m, i) => {
          const st = STATUS_STYLES[m.status] || STATUS_STYLES.active
          return (
            <div key={m.id} style={{ ...card, animation: 'memSlide .35s ease both', animationDelay: `${i * 0.04}s`, borderColor: st.border + '40' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontWeight: 900, fontSize: 16 }}>{m.client_name}</span>
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, border: `1px solid ${st.border}`, background: st.bg, color: st.color }}>{m.status}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 12, color: 'rgba(255,255,255,.50)' }}>
                    <span>{m.barber_name || 'No barber'}</span>
                    <span style={{ color: 'rgba(255,255,255,.20)' }}>·</span>
                    <span>{m.service_name || 'No service'}</span>
                    <span style={{ color: 'rgba(255,255,255,.20)' }}>·</span>
                    <span style={{ color: '#d7ecff', fontWeight: 700 }}>{FREQ_LABELS[m.frequency] || m.frequency}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,.40)' }}>
                    <span>Every {DAYS[m.preferred_day]} at {minToTime(m.preferred_time_min)}</span>
                    {m.amount_cents > 0 && <span style={{ color: '#ffe9a3', fontWeight: 700 }}>{money(m.amount_cents)}</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6, fontSize: 11 }}>
                    {m.next_booking_at && m.status === 'active' && (
                      <span style={{ color: '#8ff0b1' }}>Next: {fmtDateTime(m.next_booking_at)}</span>
                    )}
                    {m.charge_count > 0 && (
                      <span style={{ color: 'rgba(255,255,255,.30)' }}>{m.charge_count} booking{m.charge_count !== 1 ? 's' : ''} created</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => openEdit(m)} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.60)', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>Edit</button>
                  {m.status !== 'cancelled' && (
                    <button onClick={() => toggleStatus(m)} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: `1px solid ${m.status === 'active' ? 'rgba(255,207,63,.30)' : 'rgba(143,240,177,.30)'}`, background: m.status === 'active' ? 'rgba(255,207,63,.06)' : 'rgba(143,240,177,.06)', color: m.status === 'active' ? '#ffe9a3' : '#c9ffe1', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>
                      {m.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  {m.status !== 'cancelled' && (
                    <button onClick={() => cancelMembership(m)} style={{ height: 28, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,107,107,.25)', background: 'rgba(255,107,107,.06)', color: '#ffd0d0', cursor: 'pointer', fontSize: 10, fontWeight: 700, fontFamily: 'inherit' }}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ width: 'min(440px,100%)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(10,10,20,.92)', backdropFilter: 'saturate(180%) blur(40px)', color: '#e9e9e9', fontFamily: 'Inter,sans-serif', boxShadow: '0 30px 80px rgba(0,0,0,.55)', overflow: 'hidden', animation: 'memModalIn .3s cubic-bezier(.4,0,.2,1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
              <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>
                {editing ? 'Edit membership' : 'New membership'}
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 15, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!editing && <>
                <div><label style={lbl}>Client name</label><input value={fClient} onChange={e => setFClient(e.target.value)} placeholder="John Smith" style={inp} /></div>
                <div><label style={lbl}>Phone</label><input value={fPhone} onChange={e => setFPhone(e.target.value)} placeholder="+1 (555) 000-0000" type="tel" style={inp} /></div>
              </>}
              <div><label style={lbl}>Barber</label>
                <select value={fBarber} onChange={e => setFBarber(e.target.value)} style={inp}>
                  <option value="">Select barber</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Service</label>
                <select value={fService} onChange={e => setFService(e.target.value)} style={inp}>
                  <option value="">Select service</option>
                  {services.filter(s => !fBarber || !s.barberIds.length || s.barberIds.includes(fBarber)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}{s.price ? ` — $${s.price}` : ''}</option>
                  ))}
                </select>
              </div>
              <div><label style={lbl}>Frequency</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['weekly', 'biweekly', 'monthly'] as const).map(f => (
                    <button key={f} onClick={() => setFFreq(f)}
                      style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${fFreq === f ? 'rgba(10,132,255,.50)' : 'rgba(255,255,255,.10)'}`, background: fFreq === f ? 'rgba(10,132,255,.12)' : 'rgba(255,255,255,.03)', color: fFreq === f ? '#d7ecff' : 'rgba(255,255,255,.45)', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit', transition: 'all .2s' }}>
                      {FREQ_LABELS[f]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div><label style={lbl}>Day of week</label>
                  <select value={fDay} onChange={e => setFDay(Number(e.target.value))} style={inp}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div><label style={lbl}>Time</label>
                  <select value={fTime} onChange={e => setFTime(Number(e.target.value))} style={inp}>
                    {timeOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => setShowModal(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.60)', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid rgba(10,132,255,.50)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create membership'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,8,8,.92)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '10px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(18px)', fontSize: 13, zIndex: 5000, whiteSpace: 'nowrap', color: '#e9e9e9', fontFamily: 'inherit', animation: 'memSlide .25s ease' }}>
          {toast}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Julius+Sans+One&display=swap');
        @keyframes memSpin { to { transform: rotate(360deg) } }
        @keyframes memSlide { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes memModalIn { 0% { opacity: 0; transform: scale(.96) translateY(8px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        select option { background: #111; }
      `}</style>
    </Shell>
  )
}
