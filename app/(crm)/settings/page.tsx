'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { isOwnerOrAdmin } from '@/lib/roles'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Barber {
  id: string
  name: string
  level: string
  username: string
  base_price: string
  active: boolean
}

interface Service {
  id: string
  name: string
  durationMin: number
  price: string
  barberIds: string[]
}

type Tab = 'barbers' | 'services' | 'account'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('barbers')

  // Redirect barbers
  useEffect(() => {
    if (user && !isOwnerOrAdmin(user)) router.push('/calendar')
  }, [user, router])

  const { data: barbersData } = useQuery({
    queryKey: ['barbers'],
    queryFn: () => api.get<{ barbers?: Barber[] } | Barber[]>('/api/barbers'),
  })

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get<{ services?: Service[] } | Service[]>('/api/services'),
  })

  const barbers: Barber[] = Array.isArray(barbersData) ? barbersData : (barbersData as any)?.barbers || []
  const services: Service[] = Array.isArray(servicesData) ? servicesData : (servicesData as any)?.services || []

  // Add barber form state
  const [bForm, setBForm] = useState({ name: '', username: '', password: '', level: '', base_price: '' })
  const [bError, setBError] = useState('')

  const addBarber = useMutation({
    mutationFn: (data: typeof bForm) => api.post('/api/barbers', {
      name: data.name, username: data.username, password: data.password,
      level: data.level, base_price: data.base_price, active: true,
      schedule: { startMin: 480, endMin: 1200, days: [1,2,3,4,5,6] },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barbers'] })
      setBForm({ name: '', username: '', password: '', level: '', base_price: '' })
      setBError('')
    },
    onError: (e: any) => setBError(e.message),
  })

  const deleteBarber = useMutation({
    mutationFn: (id: string) => api.patch(`/api/barbers/${id}`, { active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['barbers'] }),
  })

  // Add service form
  const [sForm, setSForm] = useState({ name: '', durationMin: '30', price: '', barberId: '' })
  const [sError, setSError] = useState('')

  const addService = useMutation({
    mutationFn: (data: typeof sForm) => api.post('/api/services', {
      name: data.name,
      duration_minutes: Number(data.durationMin),
      price_cents: Math.round(Number(data.price) * 100),
      barberIds: data.barberId ? [data.barberId] : [],
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      setSForm({ name: '', durationMin: '30', price: '', barberId: '' })
      setSError('')
    },
    onError: (e: any) => setSError(e.message),
  })

  if (!user || !isOwnerOrAdmin(user)) return null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'barbers', label: 'Barbers' },
    { key: 'services', label: 'Services' },
    { key: 'account', label: 'Account' },
  ]

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display tracking-[.18em] uppercase text-base">Settings</h2>
        <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Manage barbers, services, account</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`h-9 px-4 rounded-full text-xs font-bold tracking-wide border transition-all ${
              tab === t.key ? 'border-blue-500/55 bg-blue-500/12 text-blue-200' : 'border-white/12 bg-white/4 text-white/70 hover:bg-white/8'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BARBERS ── */}
      {tab === 'barbers' && (
        <div className="flex flex-col gap-4">
          {/* Add form */}
          <div className="card p-5">
            <h3 className="text-[11px] tracking-widest uppercase text-white/55 mb-4">Add new barber</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'name', label: 'Name', placeholder: 'Nazar' },
                { key: 'username', label: 'Login', placeholder: 'nazar' },
                { key: 'password', label: 'Password', placeholder: '1234' },
                { key: 'level', label: 'Level', placeholder: 'Senior' },
                { key: 'base_price', label: 'Base price', placeholder: '55' },
              ].map(f => (
                <div key={f.key} className="flex flex-col gap-1.5">
                  <label className="field-label">{f.label}</label>
                  <input className="field-input" placeholder={f.placeholder}
                    value={(bForm as any)[f.key]}
                    onChange={e => setBForm(p => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            {bError && <div className="mt-3 text-red-300 text-sm">{bError}</div>}
            <button
              onClick={() => {
                if (!bForm.name || !bForm.password) { setBError('Name and password required'); return }
                addBarber.mutate(bForm)
              }}
              disabled={addBarber.isPending}
              className="btn-primary mt-4 w-full"
            >
              {addBarber.isPending ? 'Adding…' : '+ Add barber'}
            </button>
          </div>

          {/* List */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 text-[11px] tracking-widest uppercase text-white/45">
              Team ({barbers.length})
            </div>
            {barbers.length === 0 && <div className="px-5 py-6 text-white/30 text-sm text-center">No barbers yet</div>}
            {barbers.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 border-b border-white/6 last:border-0">
                <div>
                  <div className="font-bold text-sm">{b.name}</div>
                  <div className="text-[11px] text-white/40 tracking-wide">
                    @{b.username} · {b.level || '—'} {b.base_price ? `· $${b.base_price}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm(`Remove ${b.name}?`)) deleteBarber.mutate(b.id) }}
                  className="btn-danger text-xs h-8 px-3"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SERVICES ── */}
      {tab === 'services' && (
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="text-[11px] tracking-widest uppercase text-white/55 mb-4">Add service</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="field-label">Service name</label>
                <input className="field-input" placeholder="Men's Haircut"
                  value={sForm.name} onChange={e => setSForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="field-label">Duration (min)</label>
                <select className="field-input" value={sForm.durationMin}
                  onChange={e => setSForm(p => ({ ...p, durationMin: e.target.value }))}>
                  {[30,45,60,75,90].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="field-label">Price ($)</label>
                <input className="field-input" placeholder="45" type="number"
                  value={sForm.price} onChange={e => setSForm(p => ({ ...p, price: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="field-label">Assign to barber</label>
                <select className="field-input" value={sForm.barberId}
                  onChange={e => setSForm(p => ({ ...p, barberId: e.target.value }))}>
                  <option value="">— All barbers —</option>
                  {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            {sError && <div className="mt-3 text-red-300 text-sm">{sError}</div>}
            <button onClick={() => { if (!sForm.name) { setSError('Name required'); return } addService.mutate(sForm) }}
              disabled={addService.isPending} className="btn-primary mt-4 w-full">
              {addService.isPending ? 'Saving…' : '+ Add service'}
            </button>
          </div>
          <div className="card overflow-hidden">
            {services.length === 0 && <div className="px-5 py-6 text-white/30 text-sm text-center">No services yet</div>}
            {services.map(s => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3 border-b border-white/6 last:border-0">
                <div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-[11px] text-white/40">{s.durationMin}min {s.price ? `· $${s.price}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ACCOUNT ── */}
      {tab === 'account' && (
        <div className="card p-5 flex items-center justify-between">
          <div>
            <div className="font-bold">{user.name}</div>
            <div className="text-[11px] text-white/40 mt-0.5">{user.role} · @{user.username}</div>
          </div>
          <button onClick={logout} className="btn-danger">Logout</button>
        </div>
      )}
    </div>
  )
}
