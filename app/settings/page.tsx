'use client'
import Shell from '@/components/Shell'
import { useEffect, useState, useCallback } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Fee { id: string; label: string; type: 'percent'|'fixed'; value: number; applies_to: string; enabled: boolean }
interface Charge { id: string; name: string; type: 'percent'|'fixed'|'label'; value: number; color: string; enabled: boolean }
interface UserAccount { id: string; username: string; name: string; role: string; active: boolean; barber_id?: string; last_login?: string }
interface Barber { id: string; name: string }

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp: React.CSSProperties = { width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }
const inpSm: React.CSSProperties = { height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 12, fontFamily: 'inherit' }
const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', display: 'block', marginBottom: 5 }
const card: React.CSSProperties = { borderRadius: 18, border: '1px solid rgba(255,255,255,.10)', background: 'linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))', backdropFilter: 'blur(14px)', overflow: 'hidden' }
const cardHead: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.12)' }
const headLbl: React.CSSProperties = { fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.70)' }

function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!checked)} style={{ width: 44, height: 26, borderRadius: 999, border: 'none', background: checked ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.14)', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
        <span style={{ position: 'absolute', top: 4, left: checked ? 22 : 4, width: 18, height: 18, borderRadius: 999, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.4)' }} />
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label style={lbl}>{label}</label>{children}</div>
}

function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={card}>
      <div style={cardHead}><span style={headLbl}>{title}</span>{action}</div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function SmBtn({ onClick, children, danger, disabled }: { onClick: () => void; children: React.ReactNode; danger?: boolean; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ height: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${danger ? 'rgba(255,107,107,.45)' : 'rgba(255,255,255,.14)'}`, background: danger ? 'rgba(255,107,107,.10)' : 'rgba(255,255,255,.05)', color: danger ? '#ffd0d0' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', opacity: disabled ? .5 : 1 }}>
      {children}
    </button>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'owner'|'admin'|'barber'>('barber')
  const [barberId, setBarberId] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [ud, bd] = await Promise.all([apiFetch('/api/users'), apiFetch('/api/barbers')])
      setUsers(ud?.users || [])
      setBarbers((Array.isArray(bd) ? bd : bd?.barbers || []).map((b: any) => ({ id: b.id, name: b.name })))
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function createUser() {
    if (!name.trim() || !username.trim() || !password) { setMsg('Name, username and password required'); return }
    if (password.length < 4) { setMsg('Password min 4 characters'); return }
    setCreating(true); setMsg('')
    try {
      await apiFetch('/api/users', { method: 'POST', body: JSON.stringify({ name: name.trim(), username: username.trim().toLowerCase(), password, role, barber_id: barberId }) })
      setName(''); setUsername(''); setPassword(''); setBarberId('')
      setMsg('Account created ✓'); load()
    } catch (e: any) { setMsg('Error: ' + e.message) }
    setCreating(false)
  }

  async function resetPw(uid: string) {
    const pw = prompt('New password (min 4 chars):')
    if (!pw || pw.length < 4) { alert('Min 4 characters'); return }
    try { await apiFetch(`/api/users/${encodeURIComponent(uid)}`, { method: 'PATCH', body: JSON.stringify({ password: pw }) }); load() }
    catch (e: any) { alert(e.message) }
  }

  async function toggleActive(uid: string, active: boolean) {
    try { await apiFetch(`/api/users/${encodeURIComponent(uid)}`, { method: 'PATCH', body: JSON.stringify({ active }) }); load() }
    catch (e: any) { alert(e.message) }
  }

  const roleColors: Record<string, { border: string; color: string }> = {
    owner: { border: 'rgba(255,207,63,.35)', color: '#ffe9a3' },
    admin: { border: 'rgba(143,240,177,.35)', color: '#c9ffe1' },
    barber: { border: 'rgba(10,132,255,.35)', color: '#d7ecff' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Create new account */}
      <SectionCard title="Create account">
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>Owner, Admin or Barber — each person gets their own login</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          <Field label="Display name"><input value={name} onChange={e => setName(e.target.value)} placeholder="Nazar" style={inp} /></Field>
          <Field label="Username (login)"><input value={username} onChange={e => setUsername(e.target.value)} placeholder="nazar" style={inp} /></Field>
          <Field label="Password"><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min 4 chars" style={inp} /></Field>
          <Field label="Role">
            <select value={role} onChange={e => setRole(e.target.value as any)} style={inp}>
              <option value="owner">Owner — full access</option>
              <option value="admin">Admin — all except payroll/settings</option>
              <option value="barber">Barber — own bookings only</option>
            </select>
          </Field>
          {role === 'barber' && (
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Link to barber profile">
                <select value={barberId} onChange={e => setBarberId(e.target.value)} style={inp}>
                  <option value="">— Not linked —</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </div>
          )}
        </div>
        {msg && <div style={{ fontSize: 12, color: msg.includes('Error') ? '#ffd0d0' : '#c9ffe1', padding: '8px 12px', borderRadius: 10, border: `1px solid ${msg.includes('Error') ? 'rgba(255,107,107,.30)' : 'rgba(143,240,177,.30)'}`, background: msg.includes('Error') ? 'rgba(255,107,107,.08)' : 'rgba(143,240,177,.08)' }}>{msg}</div>}
        <button onClick={createUser} disabled={creating}
          style={{ height: 44, borderRadius: 12, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: creating ? .5 : 1 }}>
          {creating ? 'Creating…' : '+ Create account'}
        </button>
      </SectionCard>

      {/* Users list */}
      <SectionCard title={`Accounts (${users.length})`} action={<SmBtn onClick={load}>↻</SmBtn>}>
        {loading ? <div style={{ color: 'rgba(255,255,255,.35)', fontSize: 12 }}>Loading…</div> :
          users.length === 0 ? <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No accounts yet</div> :
          users.map(u => {
            const rc = roleColors[u.role] || roleColors.barber
            const linked = barbers.find(b => b.id === u.barber_id)
            return (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)', opacity: u.active ? 1 : 0.55 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{u.name || u.username}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)', marginTop: 2 }}>
                    @{u.username}{linked ? ` · 💈 ${linked.name}` : ''}{u.last_login ? ` · last login ${u.last_login.slice(0,10)}` : ''}
                    {!u.active && <span style={{ color: '#ff6b6b', marginLeft: 8 }}>disabled</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 999, border: `1px solid ${rc.border}`, background: 'rgba(0,0,0,.14)', color: rc.color }}>{u.role}</span>
                  <SmBtn onClick={() => resetPw(u.id)}>Reset PW</SmBtn>
                  <SmBtn danger onClick={() => toggleActive(u.id, !u.active)}>{u.active ? 'Disable' : 'Enable'}</SmBtn>
                </div>
              </div>
            )
          })
        }
      </SectionCard>

      {/* Permissions table */}
      <SectionCard title="Role permissions">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', ...lbl }}>Feature</th>
                {['Owner', 'Admin', 'Barber'].map(r => <th key={r} style={{ padding: '8px 12px', textAlign: 'center', ...lbl, color: roleColors[r.toLowerCase()]?.color }}>{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ['Dashboard', true, true, true],
                ['Calendar — all barbers', true, true, false],
                ['Calendar — own column only', true, true, true],
                ['Clients', true, true, false],
                ['Payments', true, true, false],
                ['Payroll', true, false, false],
                ['Settings', true, false, false],
                ['Own profile / password', true, true, true],
                ['Add/block time slots', true, true, false],
                ['View client phones', true, true, false],
              ].map(([feat, owner, admin, barber]) => (
                <tr key={String(feat)}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', color: 'rgba(255,255,255,.70)' }}>{feat as string}</td>
                  {[owner, admin, barber].map((v, i) => (
                    <td key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.05)', textAlign: 'center' }}>
                      {v ? <span style={{ color: '#8ff0b1', fontSize: 16 }}>✓</span> : <span style={{ color: 'rgba(255,255,255,.20)', fontSize: 14 }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState<'shop'|'fees'|'booking'|'payroll'|'square'|'users'>('shop')
  const [settings, setSettings] = useState<any>({})
  const [fees, setFees] = useState<Fee[]>([])
  const [charges, setCharges] = useState<Charge[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const s = await apiFetch('/api/settings')
      setSettings(s || {})
      setFees(Array.isArray(s?.fees) ? s.fees : [])
      setCharges(Array.isArray(s?.charges) ? s.charges : [])
      setDirty(false)
    } catch (e: any) { showToast('Error: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function set(key: string, val: any) { setSettings((s: any) => ({ ...s, [key]: val })); setDirty(true) }
  function setNested(parent: string, key: string, val: any) { setSettings((s: any) => ({ ...s, [parent]: { ...(s[parent] || {}), [key]: val } })); setDirty(true) }

  async function save() {
    setSaving(true)
    try {
      await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ ...settings, fees, charges }) })
      setDirty(false); showToast('Settings saved ✓')
    } catch (e: any) { showToast('Error: ' + e.message) }
    setSaving(false)
  }

  async function testSquare() {
    try {
      const d = await apiFetch('/api/payments/terminal/devices')
      const devices = d?.devices || []
      showToast(devices.length ? `✓ ${devices.length} device(s): ${devices.map((x: any) => x.name).join(', ')}` : '⚠ Connected, no devices')
    } catch (e: any) { showToast('❌ ' + e.message) }
  }

  async function cleanup() {
    try { const r = await apiFetch('/api/admin/cleanup-test-payments', { method: 'DELETE' }); showToast(`Cleaned ${r?.deleted || 0} records`) }
    catch (e: any) { showToast('Error: ' + e.message) }
  }

  const s = settings
  const tax = s.tax || {}
  const booking = s.booking || {}
  const display = s.display || {}
  const payroll = s.payroll || {}
  const square = s.square || {}

  const TABS = [
    { id: 'shop', label: 'Shop' },
    { id: 'fees', label: 'Fees & Charges' },
    { id: 'booking', label: 'Booking & SMS' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'square', label: 'Square' },
    { id: 'users', label: 'Accounts' },
  ] as const

  return (
    <Shell page="settings">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&family=Julius+Sans+One&display=swap');
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
        select option{background:#111}
        @media(max-width:768px){
          .set-2col{grid-template-columns:1fr!important;}
          .set-tabs{gap:4px!important;}
          .set-tabs button{font-size:10px!important;padding:0 10px!important;height:32px!important;}
          .set-topbar{flex-wrap:wrap!important;gap:8px!important;}
          .set-topbar h2{font-size:13px!important;}
          .set-fee-row{grid-template-columns:1fr 70px 80px 36px!important;}
          .set-fee-col3{display:none!important;}
        }
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Topbar */}
        <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Settings</h2>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>
              {loading ? 'Loading…' : s.updated_at ? `Last saved ${new Date(s.updated_at).toLocaleString()}` : 'Not saved yet'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {dirty && <span style={{ fontSize: 11, padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.30)', background: 'rgba(255,255,255,.08)', color: '#fff', fontWeight: 900 }}>Unsaved</span>}
            <SmBtn onClick={load}>↻</SmBtn>
            <button onClick={save} disabled={saving || loading}
              style={{ height: 40, padding: '0 20px', borderRadius: 999, border: '1px solid rgba(10,132,255,.75)', background: 'rgba(0,0,0,.75)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', boxShadow: '0 0 18px rgba(10,132,255,.25)', opacity: saving ? .5 : 1 }}>
              {saving ? 'Saving…' : 'Save all'}
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.30)', overflowX: 'auto', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ height: 36, padding: '0 16px', borderRadius: 999, border: `1px solid ${tab===t.id ? 'rgba(10,132,255,.55)' : 'rgba(255,255,255,.10)'}`, background: tab===t.id ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.04)', color: tab===t.id ? '#d7ecff' : 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.40)' }}>Loading settings…</div> : (<>

            {/* ── SHOP ── */}
            {tab === 'shop' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
                <SectionCard title="Shop info">
                  <Field label="Shop name"><input value={s.shop_name || ''} onChange={e => set('shop_name', e.target.value)} placeholder="ELEMENT Barbershop" style={inp} /></Field>
                  <Field label="Timezone">
                    <select value={s.timezone || 'America/Chicago'} onChange={e => set('timezone', e.target.value)} style={inp}>
                      {['America/Chicago','America/New_York','America/Los_Angeles','America/Denver','America/Phoenix'].map(tz => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </Field>
                  <Field label="Currency">
                    <select value={s.currency || 'USD'} onChange={e => set('currency', e.target.value)} style={inp}>
                      <option value="USD">USD — US Dollar</option>
                      <option value="CAD">CAD — Canadian Dollar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </Field>
                  <Field label="Shop status">
                    <select value={s.shopStatusMode || 'auto'} onChange={e => set('shopStatusMode', e.target.value)} style={inp}>
                      <option value="auto">Auto (follow schedule)</option>
                      <option value="open">Force Open</option>
                      <option value="closed">Force Closed</option>
                    </select>
                  </Field>
                </SectionCard>

                <SectionCard title="Tax">
                  <Toggle checked={!!tax.enabled} onChange={v => setNested('tax','enabled',v)} label="Enable tax on services" sub="Added to invoice total" />
                  {tax.enabled && <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                      <Field label="Tax label"><input value={tax.label || ''} onChange={e => setNested('tax','label',e.target.value)} placeholder="Sales Tax" style={inp} /></Field>
                      <Field label="Tax rate %"><input type="number" min={0} max={50} step={0.01} value={tax.rate || ''} onChange={e => setNested('tax','rate',Number(e.target.value))} placeholder="8.75" style={inp} /></Field>
                    </div>
                    <Toggle checked={!!tax.included_in_price} onChange={v => setNested('tax','included_in_price',v)} label="Price includes tax" sub="Tax already built into service price" />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', lineHeight: 1.5 }}>Example: $59.99 + 8.75% tax → client pays $65.24</div>
                  </>}
                </SectionCard>
              </div>
            )}

            {/* ── FEES ── */}
            {tab === 'fees' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <SectionCard title="Processing fees & surcharges"
                  action={<SmBtn onClick={() => { setFees(f => [...f, { id: 'fee_'+Date.now(), label: '', type: 'percent', value: 0, applies_to: 'all', enabled: true }]); setDirty(true) }}>+ Add fee</SmBtn>}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Card surcharges, booking fees, processing fees</div>
                  {fees.length === 0 ? <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12, padding: '8px 0' }}>No fees — services charged at face value</div> :
                    fees.map((f, i) => (
                      <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 100px 36px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)' }}>
                        <input value={f.label} onChange={e => { const n=[...fees]; n[i]={...n[i],label:e.target.value}; setFees(n); setDirty(true) }} placeholder="e.g. Card surcharge" style={{...inpSm,width:'100%'}} />
                        <select value={f.type} onChange={e => { const n=[...fees]; n[i]={...n[i],type:e.target.value as any}; setFees(n); setDirty(true) }} style={inpSm}>
                          <option value="percent">%</option>
                          <option value="fixed">Fixed $</option>
                        </select>
                        <input type="number" min={0} step={0.01} value={f.value||''} onChange={e => { const n=[...fees]; n[i]={...n[i],value:Number(e.target.value)}; setFees(n); setDirty(true) }} placeholder="Value" style={inpSm} />
                        <select value={f.applies_to} onChange={e => { const n=[...fees]; n[i]={...n[i],applies_to:e.target.value}; setFees(n); setDirty(true) }} style={inpSm}>
                          <option value="all">All</option>
                          <option value="services">Services</option>
                          <option value="tips">Tips</option>
                        </select>
                        <button onClick={() => { setFees(fees.filter((_,j)=>j!==i)); setDirty(true) }} style={{ height: 34, width: 34, borderRadius: 10, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ff6b6b', cursor: 'pointer', fontSize: 15 }}>✕</button>
                      </div>
                    ))
                  }
                </SectionCard>

                <SectionCard title="Custom charges & categories"
                  action={<SmBtn onClick={() => { setCharges(c => [...c, { id: 'charge_'+Date.now(), name: '', type: 'percent', value: 0, color: '#0a84ff', enabled: true }]); setDirty(true) }}>+ Add</SmBtn>}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Promotions, membership discounts, product sales</div>
                  {charges.length === 0 ? <div style={{ color: 'rgba(255,255,255,.30)', fontSize: 12 }}>No custom charges</div> :
                    charges.map((c, i) => (
                      <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 36px', gap: 8, alignItems: 'center', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)' }}>
                        <input value={c.name} onChange={e => { const n=[...charges]; n[i]={...n[i],name:e.target.value}; setCharges(n); setDirty(true) }} placeholder="Name (e.g. Loyalty discount)" style={{...inpSm,width:'100%'}} />
                        <select value={c.type} onChange={e => { const n=[...charges]; n[i]={...n[i],type:e.target.value as any}; setCharges(n); setDirty(true) }} style={inpSm}>
                          <option value="percent">%</option>
                          <option value="fixed">Fixed $</option>
                          <option value="label">Label only</option>
                        </select>
                        <input type="number" min={0} step={0.01} value={c.value||''} disabled={c.type==='label'} onChange={e => { const n=[...charges]; n[i]={...n[i],value:Number(e.target.value)}; setCharges(n); setDirty(true) }} placeholder="Value" style={{...inpSm,opacity:c.type==='label'?.4:1}} />
                        <input type="color" value={c.color||'#0a84ff'} onChange={e => { const n=[...charges]; n[i]={...n[i],color:e.target.value}; setCharges(n); setDirty(true) }} style={{ height: 34, width: '100%', borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'none', cursor: 'pointer', padding: 2 }} />
                        <button onClick={() => { setCharges(charges.filter((_,j)=>j!==i)); setDirty(true) }} style={{ height: 34, width: 34, borderRadius: 10, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ff6b6b', cursor: 'pointer', fontSize: 15 }}>✕</button>
                      </div>
                    ))
                  }
                </SectionCard>
              </div>
            )}

            {/* ── BOOKING & SMS ── */}
            {tab === 'booking' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14 }}>
                <SectionCard title="SMS notifications">
                  <Toggle checked={booking.sms_confirm !== false} onChange={v => setNested('booking','sms_confirm',v)} label="Confirmation SMS" sub="Sent when booking is created" />
                  <Toggle checked={!!booking.reminder_hours_24} onChange={v => setNested('booking','reminder_hours_24',v)} label="24h reminder" sub="Day before appointment" />
                  <Toggle checked={!!booking.reminder_hours_2} onChange={v => setNested('booking','reminder_hours_2',v)} label="2h reminder" sub="2 hours before" />
                  <Toggle checked={!!booking.sms_on_reschedule} onChange={v => setNested('booking','sms_on_reschedule',v)} label="Reschedule notification" sub="When appointment time changes" />
                  <Toggle checked={!!booking.sms_on_cancel} onChange={v => setNested('booking','sms_on_cancel',v)} label="Cancellation notification" sub="When appointment is cancelled" />
                </SectionCard>
                <SectionCard title="Booking page">
                  <Field label="Cancellation window (hours)">
                    <input type="number" min={0} max={72} value={booking.cancellation_hours ?? 2} onChange={e => setNested('booking','cancellation_hours',Number(e.target.value))} style={inp} />
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>Clients can cancel up to X hours before</div>
                  </Field>
                  <Toggle checked={display.show_prices !== false} onChange={v => setNested('display','show_prices',v)} label="Show service prices" sub="On public booking page" />
                  <Toggle checked={!!display.require_phone} onChange={v => setNested('display','require_phone',v)} label="Require phone number" sub="Mandatory for SMS" />
                  <Toggle checked={display.allow_notes !== false} onChange={v => setNested('display','allow_notes',v)} label="Allow booking notes" sub="Client can add notes & reference photo" />
                </SectionCard>
              </div>
            )}

            {/* ── PAYROLL ── */}
            {tab === 'payroll' && (
              <div style={{ maxWidth: 600 }}>
                <SectionCard title="Payroll defaults">
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>Default rates for new barbers. Override per-barber in Payroll → Commission rules.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                    <Field label="Default barber commission %">
                      <input type="number" min={0} max={100} value={payroll.default_barber_pct ?? 60} onChange={e => { const v = Number(e.target.value); setNested('payroll','default_barber_pct',v) }} style={inp} />
                    </Field>
                    <Field label="Owner share % (auto)">
                      <input type="number" value={100 - (payroll.default_barber_pct ?? 60)} disabled style={{...inp,opacity:.45,cursor:'not-allowed'}} />
                    </Field>
                    <Field label="Tips go to">
                      <select value={String(payroll.tips_pct ?? 100)} onChange={e => setNested('payroll','tips_pct',Number(e.target.value))} style={inp}>
                        <option value="100">100% to barber</option>
                        <option value="50">50/50 split</option>
                        <option value="0">100% to owner</option>
                      </select>
                    </Field>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lbl}>Tip options shown on Terminal screen</label>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginBottom: 8 }}>3 preset percentages + "No tip" button shown on Square Terminal</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {[0,1,2].map(i => (
                          <div key={i}>
                            <label style={{ ...lbl, marginBottom: 4 }}>Option {i+1} (%)</label>
                            <input type="number" min={0} max={100} step={1}
                              value={(payroll.tip_options?.[i]) ?? [15,20,25][i]}
                              onChange={e => {
                                const opts = [...(payroll.tip_options || [15,20,25])]
                                opts[i] = Number(e.target.value)
                                setNested('payroll','tip_options',opts)
                              }}
                              style={inp} />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(0,0,0,.14)', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                        Preview on Terminal: {' '}
                        {(payroll.tip_options || [15,20,25]).map((p: number, i: number) => (
                          <span key={i} style={{ marginRight: 8, padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(10,132,255,.40)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', fontSize: 11 }}>{p}%</span>
                        ))}
                        <span style={{ padding: '2px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(255,255,255,.05)', color: 'rgba(255,255,255,.55)', fontSize: 11 }}>No tip</span>
                      </div>
                    </div>
                    <Field label="Pay period">
                      <select value={payroll.period || 'weekly'} onChange={e => setNested('payroll','period',e.target.value)} style={inp}>
                        <option value="daily">Daily closeout</option>
                        <option value="weekly">Weekly (Mon–Sun)</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </Field>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── SQUARE ── */}
            {tab === 'square' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 680 }}>
                <SectionCard title="Square & integrations">
                  <Field label="Square Proxy URL"><input value={square.proxy_url || ''} onChange={e => setNested('square','proxy_url',e.target.value)} placeholder="https://square-proxy-…run.app" style={inp} /></Field>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
                    <Field label="Location ID"><input value={square.location_id || ''} onChange={e => setNested('square','location_id',e.target.value)} placeholder="L08HP7JSW9WNR" style={inp} /></Field>
                    <Field label="Terminal Device ID"><input value={square.device_id || ''} onChange={e => setNested('square','device_id',e.target.value)} placeholder="device:438CS…" style={inp} /></Field>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <SmBtn onClick={testSquare}>Test connection</SmBtn>
                  </div>
                </SectionCard>
                <SectionCard title="Danger zone">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(255,107,107,.20)', background: 'rgba(255,107,107,.04)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Clear abandoned Terminal requests</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>Remove pending/test payment requests older than 4h</div>
                    </div>
                    <SmBtn danger onClick={cleanup}>Clean up</SmBtn>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── USERS ── */}
            {tab === 'users' && <UsersTab />}

          </>)}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,8,8,.92)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '10px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(18px)', fontSize: 13, zIndex: 5000, whiteSpace: 'nowrap', color: '#e9e9e9', fontFamily: 'inherit' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: toast.includes('Error') || toast.includes('❌') ? '#ff6b6b' : toast.includes('⚠') ? '#ffd18a' : '#8ff0b1', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </Shell>
  )
}
