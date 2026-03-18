'use client'
import Shell from '@/components/Shell'
import { useEffect, useState, useCallback } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Client {
  id: string; name: string; phone?: string; email?: string; notes?: string
  status?: string; tags?: string[]; preferred_barber?: string; barber?: string
  last_visit?: string; visits?: number; spend?: number; no_shows?: number
  bookings?: Booking[]
}
interface Booking {
  id: string; service_name?: string; service?: string; barber_name?: string; barber?: string
  start_at?: string; date?: string; paid?: boolean; is_paid?: boolean; status?: string
}
interface Barber { id: string; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string) => { try { return new Date(iso.includes('T') ? iso : iso+'T00:00:00').toLocaleDateString([], { month:'short', day:'numeric', year:'numeric' }) } catch { return iso } }
const initials = (name: string) => { const p=(name||'').split(' '); return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase() || '?' }
const STATUS_STYLE: Record<string, React.CSSProperties> = {
  vip:    { borderColor:'rgba(255,207,63,.45)', background:'rgba(255,207,63,.10)', color:'#ffe9a3' },
  active: { borderColor:'rgba(143,240,177,.40)', background:'rgba(143,240,177,.10)', color:'#c9ffe1' },
  new:    { borderColor:'rgba(10,132,255,.45)', background:'rgba(10,132,255,.10)', color:'#d7ecff' },
  risk:   { borderColor:'rgba(255,107,107,.40)', background:'rgba(255,107,107,.10)', color:'#ffd0d0' },
}
const STATUS_LABELS: Record<string,string> = { vip:'VIP', active:'Active', new:'New', risk:'At risk' }

function Chip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] || {}
  return <span style={{ fontSize:9, letterSpacing:'.08em', textTransform:'uppercase', padding:'4px 8px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.12)', color:'rgba(255,255,255,.70)', display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap', ...s }}>
    <span style={{ width:5, height:5, borderRadius:999, background:'currentColor', flexShrink:0 }} />
    {STATUS_LABELS[status] || status || '—'}
  </span>
}

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers||{}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── AddClientModal ───────────────────────────────────────────────────────────
function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Client) => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function save() {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const c = await apiFetch('/api/clients', { method: 'POST', body: JSON.stringify({ name: name.trim(), phone: phone.trim(), email: email.trim(), status: 'new', tags: ['first-time'] }) })
      onCreated(c)
    } catch (e: any) { setErr(e.message) }
    setSaving(false)
  }

  const inp: React.CSSProperties = { width:'100%', height:42, borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.22)', color:'#fff', padding:'0 12px', outline:'none', fontSize:13, fontFamily:'inherit' }
  const lbl: React.CSSProperties = { fontSize:10, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(255,255,255,.45)', display:'block', marginBottom:5 }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, backdropFilter:'blur(10px)' }}
      onClick={e => { if (e.target===e.currentTarget) onClose() }}>
      <div style={{ width:'min(420px,95vw)', borderRadius:20, border:'1px solid rgba(255,255,255,.12)', background:'linear-gradient(180deg,rgba(20,20,30,.92),rgba(10,10,20,.90))', backdropFilter:'blur(24px)', padding:20, color:'#e9e9e9', fontFamily:'Inter,sans-serif', boxShadow:'0 24px 80px rgba(0,0,0,.7)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontFamily:'"Julius Sans One",sans-serif', letterSpacing:'.16em', textTransform:'uppercase', fontSize:13 }}>Add client</div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'#fff', cursor:'pointer', fontSize:15 }}>✕</button>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div><label style={lbl}>Full name *</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="Client name" style={inp} autoFocus /></div>
          <div><label style={lbl}>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+1 (___) ___-____" style={inp} type="tel" /></div>
          <div><label style={lbl}>Email</label><input value={email} onChange={e=>setEmail(e.target.value)} placeholder="optional" style={inp} type="email" /></div>
          {err && <div style={{ fontSize:12, color:'#ffd0d0', padding:'8px 12px', borderRadius:10, border:'1px solid rgba(255,107,107,.30)', background:'rgba(255,107,107,.08)' }}>{err}</div>}
          <button onClick={save} disabled={saving} style={{ height:44, borderRadius:12, border:'1px solid rgba(10,132,255,.65)', background:'rgba(10,132,255,.14)', color:'#d7ecff', cursor:'pointer', fontWeight:900, fontSize:13, fontFamily:'inherit' }}>
            {saving ? 'Saving…' : 'Add client'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ClientProfile ────────────────────────────────────────────────────────────
function ClientProfile({ clientId, clients, onUpdate }: { clientId: string; clients: Client[]; onUpdate: (c: Client) => void }) {
  const [detailed, setDetailed] = useState<Client | null>(null)
  const [loading, setLoading] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const cached = clients.find(c => c.id === clientId)
    if (cached) { setDetailed(cached); setNotes(cached.notes || '') }
    setLoading(true)
    apiFetch(`/api/clients/${encodeURIComponent(clientId)}`).then(d => {
      setDetailed(d); setNotes(d.notes || ''); onUpdate(d); setLoading(false)
    }).catch(() => setLoading(false))
  }, [clientId])

  async function patch(body: any) {
    const updated = await apiFetch(`/api/clients/${encodeURIComponent(clientId)}`, { method:'PATCH', body:JSON.stringify(body) })
    setDetailed(prev => ({ ...prev, ...body }))
    onUpdate({ ...(detailed||{}), ...body } as Client)
    return updated
  }

  async function saveNotes() {
    setNotesSaving(true)
    try { await patch({ notes }) } catch {}
    setNotesSaving(false)
  }

  async function addTag(tag: string) {
    if (!tag.trim()) return
    const newTags = [...new Set([tag.trim().toLowerCase(), ...(detailed?.tags||[])])]
    await patch({ tags: newTags })
    setTagInput('')
  }

  async function removeTag(tag: string) {
    await patch({ tags: (detailed?.tags||[]).filter(t => t !== tag) })
  }

  if (!detailed && loading) return <div style={{ padding:32, textAlign:'center', color:'rgba(255,255,255,.35)', fontSize:12 }}>Loading…</div>
  if (!detailed) return null

  const c = detailed
  const visits = c.visits || (c.bookings?.length || 0)
  const spend = c.spend || (c.bookings||[]).reduce((s,b) => s + Number((b as any).service_price||(b as any).price||0), 0)
  const noShows = c.no_shows || (c.bookings||[]).filter(b => b.status==='noshow').length
  const lastVisit = c.last_visit || (c.bookings?.[0]?.start_at||'')
  const barber = c.preferred_barber || c.barber || '—'

  const row = (label: string, value: React.ReactNode) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'9px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,.08)', background:'rgba(0,0,0,.14)' }}>
      <span style={{ fontSize:11, letterSpacing:'.10em', textTransform:'uppercase', color:'rgba(255,255,255,.45)' }}>{label}</span>
      <span style={{ fontWeight:700, fontSize:13 }}>{value}</span>
    </div>
  )

  return (
    <div style={{ padding:14, display:'flex', flexDirection:'column', gap:10 }}>
      {/* Top */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:16, border:'1px solid rgba(255,255,255,.10)', background:'rgba(0,0,0,.16)' }}>
        <div style={{ width:48, height:48, borderRadius:16, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:16, flexShrink:0 }}>
          {initials(c.name)}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:900, fontSize:15 }}>{c.name}</div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
            <Chip status={c.status||'new'} />
            <span style={{ fontSize:11, color:'rgba(255,255,255,.40)' }}>{barber}</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {[{v:visits, l:'Visits'},{v:'$'+Number(spend).toFixed(0), l:'Spend'},{v:noShows, l:'No-shows'}].map(k => (
          <div key={k.l} style={{ padding:'10px 12px', borderRadius:14, border:'1px solid rgba(255,255,255,.10)', background:'rgba(0,0,0,.14)' }}>
            <div style={{ fontWeight:900, fontSize:18 }}>{k.v}</div>
            <div style={{ fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.45)', marginTop:4 }}>{k.l}</div>
          </div>
        ))}
      </div>

      {/* Info */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {c.phone && row('Phone', <a href={`tel:${c.phone}`} style={{ color:'#d7ecff', textDecoration:'none' }}>{c.phone}</a>)}
        {c.email && row('Email', <a href={`mailto:${c.email}`} style={{ color:'#d7ecff', textDecoration:'none', overflow:'hidden', textOverflow:'ellipsis', maxWidth:160, display:'block' }}>{c.email}</a>)}
        {lastVisit && row('Last visit', fmtDate(lastVisit))}
      </div>

      {/* Status */}
      <div>
        <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.40)', marginBottom:8 }}>Status</div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' as const }}>
          {(['vip','active','new','risk'] as const).map(s => (
            <button key={s} onClick={() => patch({ status:s })}
              style={{ height:32, padding:'0 14px', borderRadius:999, border:`1px solid ${c.status===s ? (STATUS_STYLE[s]?.borderColor||'rgba(10,132,255,.55)') : 'rgba(255,255,255,.12)'}`, background:c.status===s ? (STATUS_STYLE[s]?.background||'rgba(10,132,255,.12)') : 'rgba(255,255,255,.04)', color:c.status===s ? (STATUS_STYLE[s]?.color||'#fff') : 'rgba(255,255,255,.65)', cursor:'pointer', fontWeight:700, fontSize:11, fontFamily:'inherit' }}>
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.40)', marginBottom:8 }}>Tags</div>
        <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginBottom:8 }}>
          {(c.tags||[]).map(t => (
            <span key={t} onClick={() => removeTag(t)}
              style={{ fontSize:10, letterSpacing:'.08em', textTransform:'uppercase', padding:'4px 10px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.65)', cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              {t} <span style={{ opacity:.55 }}>✕</span>
            </span>
          ))}
        </div>
        <input value={tagInput} onChange={e=>setTagInput(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter') { addTag(tagInput); (e.target as HTMLInputElement).value=''; setTagInput('') } }}
          placeholder="Type tag + Enter to add…"
          style={{ height:34, width:'100%', borderRadius:10, border:'1px solid rgba(255,255,255,.10)', background:'rgba(0,0,0,.22)', color:'#fff', padding:'0 10px', outline:'none', fontSize:12, fontFamily:'inherit' }} />
      </div>

      {/* Notes */}
      <div>
        <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.40)', marginBottom:8 }}>Notes</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3}
          style={{ width:'100%', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.22)', color:'#fff', padding:'10px 12px', outline:'none', fontSize:13, lineHeight:1.5, resize:'vertical' as const, fontFamily:'inherit' }} />
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          <button onClick={saveNotes} disabled={notesSaving}
            style={{ height:34, padding:'0 16px', borderRadius:999, border:'1px solid rgba(10,132,255,.55)', background:'rgba(10,132,255,.12)', color:'#d7ecff', cursor:'pointer', fontWeight:900, fontSize:12, fontFamily:'inherit' }}>
            {notesSaving ? 'Saving…' : 'Save notes'}
          </button>
          {c.phone && <>
            <a href={`tel:${c.phone}`} style={{ height:34, padding:'0 12px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', textDecoration:'none' }}>📞 Call</a>
            <a href={`sms:${c.phone}`} style={{ height:34, padding:'0 12px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:12, fontFamily:'inherit', display:'flex', alignItems:'center', textDecoration:'none' }}>✉ SMS</a>
          </>}
        </div>
      </div>

      {/* Recent bookings */}
      {(c.bookings||[]).length > 0 && (
        <div>
          <div style={{ fontSize:10, letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.40)', marginBottom:8 }}>Recent visits ({(c.bookings||[]).length})</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {(c.bookings||[]).slice(0,5).map((b,i) => (
              <div key={i} style={{ padding:'9px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,.07)', background:'rgba(0,0,0,.14)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>{b.service_name||b.service||'Service'}</span>
                  <span style={{ fontSize:9, padding:'3px 7px', borderRadius:999, border:`1px solid ${b.paid||b.is_paid ? 'rgba(143,240,177,.40)' : 'rgba(255,255,255,.12)'}`, background:b.paid||b.is_paid ? 'rgba(143,240,177,.10)' : 'rgba(0,0,0,.12)', color:b.paid||b.is_paid ? '#c9ffe1' : 'rgba(255,255,255,.55)', letterSpacing:'.06em', textTransform:'uppercase' }}>{b.paid||b.is_paid ? 'Paid' : 'Unpaid'}</span>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:3 }}>{b.barber_name||b.barber||'—'} · {fmtDate(b.start_at||b.date||'')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [mobileProfile, setMobileProfile] = useState(false)
  const [q, setQ] = useState('')
  const [filterBarber, setFilterBarber] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [cd, bd] = await Promise.all([
        apiFetch('/api/clients'),
        apiFetch('/api/barbers').catch(() => [])
      ])
      setClients(Array.isArray(cd) ? cd : [])
      const bl = Array.isArray(bd) ? bd : (bd?.barbers || [])
      setBarbers(bl.filter((b: Barber) => b.name))
    } catch (e: any) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const ql = q.toLowerCase()
  const visible = clients.filter(c => {
    if (filterBarber && (c.preferred_barber||c.barber) !== filterBarber) return false
    if (filterStatus && c.status !== filterStatus) return false
    if (ql) {
      const hay = [c.name, c.phone, c.email, c.notes, ...(c.tags||[])].join(' ').toLowerCase()
      if (!hay.includes(ql)) return false
    }
    return true
  })

  function updateClient(updated: Client) {
    setClients(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c))
  }

  const inp: React.CSSProperties = { height:40, borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(0,0,0,.22)', color:'#fff', padding:'0 14px', outline:'none', fontSize:13, fontFamily:'inherit' }

  return (
    <Shell page="clients">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
        select option{background:#111}
        .cl-row:hover td{background:rgba(255,255,255,.025)!important}
        .cl-row.sel td{background:rgba(10,132,255,.07)!important}
        @media(max-width:768px){
          .cl-grid{grid-template-columns:1fr!important;}
          .cl-profile-panel{display:none!important;}
          .cl-profile-panel.visible{display:block!important;position:fixed;inset:0;z-index:80;background:#000;overflow-y:auto;}
          th:nth-child(3),td:nth-child(3){display:none;}
          th:nth-child(4),td:nth-child(4){display:none;}
          th:nth-child(5),td:nth-child(5){display:none;}
          .cl-filters{gap:6px!important;}
          .cl-filters select,.cl-filters input{height:36px!important;font-size:12px!important;}
        }
      `}</style>
      <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'#000', color:'#e9e9e9', fontFamily:'Inter,system-ui,sans-serif' }}>

        {/* Topbar */}
        <div style={{ padding:'12px 18px', background:'rgba(0,0,0,.80)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(255,255,255,.08)', position:'sticky', top:0, zIndex:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap', marginBottom:10 }}>
            <div>
              <h2 style={{ margin:0, fontFamily:'"Julius Sans One",sans-serif', letterSpacing:'.18em', textTransform:'uppercase', fontSize:15 }}>Clients</h2>
              <p style={{ margin:'3px 0 0', color:'rgba(255,255,255,.40)', fontSize:11, letterSpacing:'.08em' }}>
                {visible.length} of {clients.length} clients
              </p>
            </div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <button onClick={load} style={{ height:40, width:40, borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', color:'#fff', cursor:'pointer', fontSize:16 }}>↻</button>
              <button onClick={() => setShowAdd(true)}
                style={{ height:40, padding:'0 16px', borderRadius:999, border:'1px solid rgba(10,132,255,.75)', background:'rgba(0,0,0,.75)', color:'#d7ecff', cursor:'pointer', fontWeight:900, fontSize:13, fontFamily:'inherit', boxShadow:'0 0 18px rgba(10,132,255,.25)' }}>
                + Add client
              </button>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search name / phone / notes / tags…"
              style={{ ...inp, width:'min(280px,55vw)' }} />
            <select value={filterBarber} onChange={e=>setFilterBarber(e.target.value)} style={inp}>
              <option value="">All barbers</option>
              {barbers.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={inp}>
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Main grid */}
        <div style={{ flex:1, overflow:'hidden', display:'grid', gridTemplateColumns:'1.6fr .9fr' }}>

          {/* Table */}
          <div style={{ overflowY:'auto', borderRight:'1px solid rgba(255,255,255,.08)' }}>
            {loading && clients.length===0 ? (
              <div style={{ padding:40, textAlign:'center', color:'rgba(255,255,255,.40)', fontSize:13 }}>Loading…</div>
            ) : visible.length===0 ? (
              <div style={{ padding:40, textAlign:'center', color:'rgba(255,255,255,.40)', fontSize:13 }}>No clients found</div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed' }}>
                <thead>
                  <tr>
                    {[['Client','38%'],['Status','14%'],['Last visit','16%'],['Barber','16%'],['Tags','16%']].map(([h,w]) => (
                      <th key={h} style={{ padding:'10px 14px', fontSize:10, letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.55)', background:'rgba(0,0,0,.90)', position:'sticky', top:0, textAlign:'left', borderBottom:'1px solid rgba(255,255,255,.08)', width:w }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map(c => {
                    const isSel = c.id === selectedId
                    return (
                      <tr key={c.id} className={`cl-row${isSel?' sel':''}`} onClick={() => setSelectedId(c.id)} style={{ cursor:'pointer' }}>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,.06)', overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                            <div style={{ width:34, height:34, borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:11, flexShrink:0 }}>
                              {initials(c.name)}
                            </div>
                            <div style={{ minWidth:0 }}>
                              <div style={{ fontWeight:900, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:1 }}>{c.phone||'—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,.06)' }}><Chip status={c.status||'new'} /></td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:12, color:'rgba(255,255,255,.55)' }}>{c.last_visit ? fmtDate(c.last_visit) : '—'}</td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.preferred_barber||c.barber||'—'}</td>
                        <td style={{ padding:'11px 14px', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap' as const }}>
                            {(c.tags||[]).slice(0,2).map(t => <span key={t} style={{ fontSize:9, padding:'3px 7px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.04)', color:'rgba(255,255,255,.60)', letterSpacing:'.06em', textTransform:'uppercase' }}>{t}</span>)}
                            {(c.tags||[]).length>2 && <span style={{ fontSize:9, color:'rgba(255,255,255,.35)' }}>+{(c.tags||[]).length-2}</span>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Profile panel */}
          <div style={{ overflowY:'auto', background:'rgba(0,0,0,.08)' }} className={`cl-profile-panel${mobileProfile && selectedId ? ' visible' : ''}`}>
            {mobileProfile && selectedId && (
              <div style={{ position:'sticky', top:0, zIndex:10, padding:'10px 14px', background:'rgba(0,0,0,.80)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:10 }}>
                <button onClick={() => setMobileProfile(false)} style={{ height:34, padding:'0 14px', borderRadius:999, border:'1px solid rgba(255,255,255,.12)', background:'rgba(255,255,255,.06)', color:'#fff', cursor:'pointer', fontWeight:700, fontSize:13, fontFamily:'inherit' }}>← Back</button>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.45)' }}>Client profile</span>
              </div>
            )}
            {!selectedId ? (
              <div style={{ padding:32, textAlign:'center', color:'rgba(255,255,255,.30)', fontSize:13 }}>Click any client to view profile</div>
            ) : (
              <ClientProfile
                key={selectedId}
                clientId={selectedId}
                clients={clients}
                onUpdate={updateClient}
              />
            )}
          </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddClientModal
          onClose={() => setShowAdd(false)}
          onCreated={c => { setClients(prev => [c, ...prev]); setSelectedId(c.id); setShowAdd(false) }}
        />
      )}
    </Shell>
  )
}
