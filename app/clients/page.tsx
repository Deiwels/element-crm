'use client'
import Shell from '@/components/Shell'
import { useEffect, useState } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    fetch(`${API}/api/clients`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setClients(d.clients || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = clients.filter((c: any) =>
    !search || (c.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Shell page="clients">
      <div style={{ padding: 24, color: '#e9e9e9', fontFamily: 'Inter, sans-serif', overflowY: 'auto', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Clients</h2>
          <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 14px', fontSize: 13, outline: 'none', width: 200 }} />
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 16, fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)' }}>
            <span>Name</span><span>Phone</span><span>Visits</span>
          </div>
          {loading ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>Loading…</div>
          : filtered.length === 0 ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>No clients found</div>
          : filtered.map((c: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 16, alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{c.name || '—'}</span>
              <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>{c.phone ? `+1 ***-***-${String(c.phone).slice(-4)}` : '—'}</span>
              <span style={{ fontSize: 13 }}>{c.visits || c.visitCount || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
