'use client'
import Shell from '@/components/Shell'
import { useEffect, useState } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function DashboardPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    const today = new Date().toISOString().split('T')[0]
    fetch(`${API}/api/bookings?date=${today}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setBookings(d.bookings || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const total = bookings.reduce((s: number, b: any) => s + (b.price || 0), 0)

  return (
    <Shell page="dashboard">
      <div style={{ padding: '24px', color: '#e9e9e9', fontFamily: 'Inter, sans-serif', overflowY: 'auto', height: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: '.04em' }}>
          Today — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h2>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Bookings', value: loading ? '…' : bookings.length },
            { label: 'Revenue', value: loading ? '…' : `$${total}` },
          ].map(s => (
            <div key={s.label} style={{ flex: '1 1 140px', padding: '20px', borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)' }}>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Bookings list */}
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)' }}>
            Today's Bookings
          </div>
          {loading ? (
            <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>Loading…</div>
          ) : bookings.length === 0 ? (
            <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>No bookings today</div>
          ) : (
            bookings.map((b: any, i: number) => (
              <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.clientName || b.client_name || 'Client'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{b.service || ''} · {b.barberName || b.barber_name || ''} · {b.time || b.startTime || ''}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{b.price ? `$${b.price}` : ''}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  )
}
