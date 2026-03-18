'use client'
import Shell from '@/components/Shell'
import { useEffect, useState } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    fetch(`${API}/api/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPayments(d.payments || d || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const total = payments.reduce((s: number, p: any) => s + (p.amount || p.total || 0), 0)

  return (
    <Shell page="payments">
      <div style={{ padding: 24, color: '#e9e9e9', fontFamily: 'Inter, sans-serif', overflowY: 'auto', height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Payments</h2>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>Total: <strong style={{ color: '#fff' }}>${total}</strong></div>
        </div>
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap: 16, fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)' }}>
            <span>Client</span><span>Barber</span><span>Method</span><span>Amount</span>
          </div>
          {loading ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>Loading…</div>
          : payments.length === 0 ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>No payments</div>
          : payments.slice(0, 50).map((p: any, i: number) => (
            <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'grid', gridTemplateColumns: '1fr 1fr 100px 100px', gap: 16, alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{p.clientName || p.client_name || '—'}</span>
              <span style={{ color: 'rgba(255,255,255,.55)', fontSize: 13 }}>{p.barberName || p.barber_name || '—'}</span>
              <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,.08)', display: 'inline-block' }}>{p.method || p.paymentMethod || '—'}</span>
              <span style={{ fontWeight: 800 }}>${p.amount || p.total || 0}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
