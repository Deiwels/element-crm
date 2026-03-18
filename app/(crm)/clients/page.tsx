'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { isOwnerOrAdmin } from '@/lib/roles'

interface Client {
  id: string
  name: string
  phone?: string
  notes?: string
  visit_count?: number
  total_spent?: number
}

export default function ClientsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', notes: '' })
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get<{ clients: Client[] }>(`/api/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  })

  const clients = data?.clients || []

  const addClient = useMutation({
    mutationFn: (d: typeof form) => api.post('/api/clients', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); setForm({ name: '', phone: '', notes: '' }); setError('') },
    onError: (e: any) => setError(e.message),
  })

  const maskPhone = (phone: string) => {
    if (!phone) return '—'
    if (!isOwnerOrAdmin(user)) return phone.replace(/\d(?=\d{4})/g, '*')
    return phone
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display tracking-[.18em] uppercase text-base">Clients</h2>
        <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Client database</p>
      </div>

      {/* Search + Add */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="field-input flex-1 min-w-48"
          placeholder="Search by name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Add form */}
      <div className="card p-5 mb-5">
        <h3 className="text-[11px] tracking-widest uppercase text-white/45 mb-4">Add client</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Name</label>
            <input className="field-input" placeholder="Client name"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="field-label">Phone</label>
            <input className="field-input" placeholder="+1 (___) ___-____"
              value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5 col-span-2">
            <label className="field-label">Notes</label>
            <input className="field-input" placeholder="Notes…"
              value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        {error && <p className="text-red-300 text-sm mt-3">{error}</p>}
        <button
          onClick={() => { if (!form.name) { setError('Name required'); return } addClient.mutate(form) }}
          disabled={addClient.isPending}
          className="btn-primary mt-4 w-full"
        >
          {addClient.isPending ? 'Saving…' : '+ Add client'}
        </button>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 text-[11px] tracking-widest uppercase text-white/45">
          {isLoading ? 'Loading…' : `${clients.length} clients`}
        </div>
        {clients.length === 0 && !isLoading && (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No clients found</div>
        )}
        {clients.map(c => (
          <div key={c.id} className="flex items-center justify-between px-5 py-3 border-b border-white/6 last:border-0">
            <div>
              <div className="font-bold text-sm">{c.name}</div>
              <div className="text-[11px] text-white/40 tracking-wide">
                {maskPhone(c.phone || '')}
                {c.notes ? ` · ${c.notes}` : ''}
              </div>
            </div>
            <div className="text-right">
              {c.visit_count != null && (
                <div className="text-[11px] text-white/40">{c.visit_count} visits</div>
              )}
              {c.total_spent != null && isOwnerOrAdmin(user) && (
                <div className="text-[11px] text-yellow-300">${c.total_spent.toFixed(0)}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
