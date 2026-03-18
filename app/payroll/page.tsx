'use client'
import Shell from '@/components/Shell'
import { useEffect, useState } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function PayrollPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    fetch(`${API}/api/payments`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const payments = d.payments || d || []
        // Group by barber
        const byBarber: Record<string, any> = {}
        payments.forEach((p: any) => {
          const name = p.barberName || p.barber_name || 'Unknown'
          if (!byBarber[name]) byBarber[name] = { name, count: 0, total: 0 }
          byBarber[name].count++
          byBarber[name].total += (p.amount || p.total || 0)
        })
        setData(Object.values(byBarber))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Shell page="payroll">
      <div style={{ padding: 24, color: '#e9e9e9', fontFamily: 'Inter, sans-serif', overflowY: 'auto', height: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Payroll</h2>
        <div style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,.10)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: 16, fontSize: 11, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)' }}>
            <span>Barber</span><span>Services</span><span>Revenue</span><span>Commission (50%)</span>
          </div>
          {loading ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>Loading…</div>
          : data.length === 0 ? <div style={{ padding: 20, color: 'rgba(255,255,255,.40)' }}>No data</div>
          : data.map((b: any, i: number) => (
            <div key={i} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'grid', gridTemplateColumns: '1fr 80px 120px 120px', gap: 16, alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>{b.name}</span>
              <span>{b.count}</span>
              <span>${b.total}</span>
              <span style={{ color: '#8ff0b1', fontWeight: 800 }}>${(b.total * 0.5).toFixed(0)}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
