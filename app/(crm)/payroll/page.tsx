'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface BarberPayroll {
  barber_id: string
  barber_name: string
  bookings_count: number
  service_total: number
  tips_total: number
  commission_rate: number
  payout: number
}

export default function PayrollPage() {
  const { user } = useAuth()
  const router = useRouter()
  const now = new Date()
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(endOfMonth(now), 'yyyy-MM-dd'))

  useEffect(() => {
    if (user && user.role !== 'owner') router.push('/dashboard')
  }, [user, router])

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', from, to],
    queryFn: () => api.get<{ barbers: BarberPayroll[]; period_total: number }>(
      `/api/payroll?from=${from}T00:00:00Z&to=${to}T23:59:59Z`
    ),
    enabled: user?.role === 'owner',
  })

  const barbers = data?.barbers || []
  const periodTotal = data?.period_total || barbers.reduce((s, b) => s + b.service_total + b.tips_total, 0)

  function handlePrint() { window.print() }

  if (!user || user.role !== 'owner') return null

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display tracking-[.18em] uppercase text-base">Payroll</h2>
          <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Earnings by barber</p>
        </div>
        <button onClick={handlePrint} className="btn text-xs">Print / PDF</button>
      </div>

      {/* Date range */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex flex-col gap-1.5">
          <label className="field-label">From</label>
          <input type="date" className="field-input w-auto" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="field-label">To</label>
          <input type="date" className="field-input w-auto" value={to} onChange={e => setTo(e.target.value)} />
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4 mb-5">
        <div className="text-[11px] tracking-widest uppercase text-white/45 mb-1">Period Total Revenue</div>
        <div className="text-3xl font-black text-yellow-300">${periodTotal.toFixed(2)}</div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 text-[11px] tracking-widest uppercase text-white/45">
          {isLoading ? 'Loading…' : `${barbers.length} barbers`}
        </div>

        {/* Header */}
        <div className="hidden md:grid grid-cols-6 px-5 py-2 text-[10px] tracking-widest uppercase text-white/30 border-b border-white/6">
          <div className="col-span-2">Barber</div>
          <div className="text-right">Services</div>
          <div className="text-right">Tips</div>
          <div className="text-right">Commission</div>
          <div className="text-right">Payout</div>
        </div>

        {barbers.length === 0 && !isLoading && (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No payroll data for this period</div>
        )}

        {barbers.map(b => (
          <div key={b.barber_id} className="grid grid-cols-2 md:grid-cols-6 px-5 py-4 border-b border-white/6 last:border-0 gap-y-1">
            <div className="col-span-2 md:col-span-2">
              <div className="font-bold text-sm">{b.barber_name}</div>
              <div className="text-[11px] text-white/40">{b.bookings_count} bookings</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">${b.service_total.toFixed(2)}</div>
              <div className="text-[10px] text-white/30 md:hidden">Services</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-emerald-300">${b.tips_total.toFixed(2)}</div>
              <div className="text-[10px] text-white/30 md:hidden">Tips</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/60">{(b.commission_rate * 100).toFixed(0)}%</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-black text-yellow-300">${b.payout.toFixed(2)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
