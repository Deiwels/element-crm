'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { format } from 'date-fns'

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
  payment_method: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const from = `${today}T00:00:00.000Z`
  const to = `${today}T23:59:59.000Z`

  const { data: bookingsData } = useQuery({
    queryKey: ['bookings', today],
    queryFn: () => api.get<{ bookings: Booking[] }>(`/api/bookings?from=${from}&to=${to}`),
  })

  const { data: paymentsData } = useQuery({
    queryKey: ['payments', today],
    queryFn: () => api.get<{ payments: Payment[] }>(`/api/payments?date=${today}`),
    enabled: user?.role !== 'barber',
  })

  const bookings = bookingsData?.bookings || []
  const payments = paymentsData?.payments || []
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0) + (p.tip_amount || 0), 0)
  const paidCount = bookings.filter(b => b.paid).length

  const statusColor: Record<string, string> = {
    booked: 'text-white/60 border-white/20',
    arrived: 'text-emerald-300 border-emerald-400/35 bg-emerald-400/8',
    done: 'text-yellow-200 border-yellow-400/35 bg-yellow-400/8',
    noshow: 'text-red-300 border-red-400/35 bg-red-400/8',
  }

  return (
    <div className="p-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display tracking-[.18em] uppercase text-base">Dashboard</h2>
        <p className="text-white/40 text-xs tracking-widest uppercase mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="text-[11px] tracking-widest uppercase text-white/45 mb-2">Bookings Today</div>
          <div className="text-3xl font-black">{bookings.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] tracking-widest uppercase text-white/45 mb-2">Paid</div>
          <div className="text-3xl font-black text-emerald-300">{paidCount}</div>
        </div>
        {user?.role !== 'barber' && (
          <>
            <div className="card p-4">
              <div className="text-[11px] tracking-widest uppercase text-white/45 mb-2">Revenue</div>
              <div className="text-3xl font-black text-yellow-300">${totalRevenue.toFixed(0)}</div>
            </div>
            <div className="card p-4">
              <div className="text-[11px] tracking-widest uppercase text-white/45 mb-2">Transactions</div>
              <div className="text-3xl font-black">{payments.length}</div>
            </div>
          </>
        )}
      </div>

      {/* Bookings list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h3 className="text-[11px] tracking-widest uppercase text-white/60">
            Today&apos;s Bookings
          </h3>
        </div>
        {bookings.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No bookings today</div>
        ) : (
          <div className="divide-y divide-white/6">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white truncate">{b.client_name}</div>
                  <div className="text-[11px] text-white/45 tracking-wide">
                    {b.barber_name} · {b.service_name} · {format(new Date(b.start_at), 'h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {b.paid && (
                    <span className="text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 text-emerald-300">
                      Paid
                    </span>
                  )}
                  <span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border ${statusColor[b.status] || statusColor.booked}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
