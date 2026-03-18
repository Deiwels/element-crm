'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { isOwnerOrAdmin } from '@/lib/roles'

interface Booking {
  id: string
  client_name: string
  barber_name: string
  service_name: string
  start_at: string
  status: string
  paid: boolean
}

interface Payment {
  id: string
  amount: number
  tip_amount?: number
}

function fmt(iso: string) {
  const d = new Date(iso)
  let h = d.getHours(), m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${String(m).padStart(2,'0')} ${ampm}`
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
}

const STATUS_CHIP: Record<string,string> = {
  booked:  '',
  arrived: 'ok',
  done:    'done',
  noshow:  'noshow',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const from = `${today}T00:00:00.000Z`
  const to   = `${today}T23:59:59.999Z`

  const { data: bData } = useQuery({
    queryKey: ['bookings-today', today],
    queryFn: () => api.get<{ bookings: Booking[] }>(`/api/bookings?from=${from}&to=${to}`),
  })
  const { data: pData } = useQuery({
    queryKey: ['payments-today', today],
    queryFn: () => api.get<{ payments: Payment[] }>(`/api/payments?date=${today}`),
    enabled: isOwnerOrAdmin(user),
  })

  const bookings = bData?.bookings || []
  const payments = pData?.payments || []
  const revenue  = payments.reduce((s,p) => s + (p.amount||0), 0)
  const tips     = payments.reduce((s,p) => s + (p.tip_amount||0), 0)
  const paid     = bookings.filter(b => b.paid).length

  return (
    <div className="main">
      <div className="topbar">
        <div className="topbar-row">
          <div>
            <h2 className="page-title">Dashboard</h2>
            <p className="sub">{fmtDate(now)}</p>
          </div>
        </div>
      </div>

      {/* KPI */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:12,marginBottom:20}}>
        <div className="kpi-card">
          <div className="kpi-label">Bookings today</div>
          <div className="kpi-value">{bookings.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Paid</div>
          <div className="kpi-value" style={{color:'#8ff0b1'}}>{paid}</div>
        </div>
        {isOwnerOrAdmin(user) && <>
          <div className="kpi-card">
            <div className="kpi-label">Revenue</div>
            <div className="kpi-value" style={{color:'#ffcf3f'}}>${revenue.toFixed(0)}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Tips</div>
            <div className="kpi-value" style={{color:'#8ff0b1'}}>${tips.toFixed(0)}</div>
          </div>
        </>}
      </div>

      {/* Bookings list */}
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{padding:'12px 18px',borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <span style={{fontSize:11,letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.55)'}}>Today&apos;s Bookings</span>
        </div>
        {bookings.length === 0 && (
          <div style={{padding:'40px 18px',textAlign:'center',color:'rgba(255,255,255,.30)',fontSize:13}}>No bookings today</div>
        )}
        {bookings.map(b => (
          <div key={b.id} className="row" style={{borderRadius:0,border:'none',borderBottom:'1px solid rgba(255,255,255,.06)',margin:0}}>
            <div className="rowLeft">
              <div className="rowName">{b.client_name}</div>
              <div className="rowMeta">{b.barber_name} · {b.service_name} · {fmt(b.start_at)}</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
              {b.paid && <span className="chip paid">Paid</span>}
              <span className={`chip ${STATUS_CHIP[b.status] || ''}`}>{b.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
