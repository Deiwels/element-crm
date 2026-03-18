'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { isOwnerOrAdmin } from '@/lib/roles'
import { format } from 'date-fns'

interface Payment {
  id: string
  booking_id?: string
  client_name?: string
  barber_name?: string
  service_name?: string
  amount: number
  tip_amount?: number
  payment_method: string
  status: string
  created_at: string
}

const METHOD_COLORS: Record<string, string> = {
  terminal: 'border-blue-500/35 bg-blue-500/8 text-blue-300',
  cash: 'border-emerald-400/35 bg-emerald-400/8 text-emerald-300',
  zelle: 'border-purple-500/35 bg-purple-500/8 text-purple-300',
  other: 'border-yellow-400/35 bg-yellow-400/8 text-yellow-200',
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [methodFilter, setMethodFilter] = useState('')

  useEffect(() => {
    if (user && !isOwnerOrAdmin(user)) router.push('/calendar')
  }, [user, router])

  const { data, isLoading } = useQuery({
    queryKey: ['payments', date, methodFilter],
    queryFn: () => api.get<{ payments: Payment[] }>(
      `/api/payments?date=${date}${methodFilter ? `&method=${methodFilter}` : ''}`
    ),
    enabled: !!user && isOwnerOrAdmin(user),
  })

  const payments = data?.payments || []
  const total = payments.reduce((s, p) => s + (p.amount || 0), 0)
  const tips = payments.reduce((s, p) => s + (p.tip_amount || 0), 0)

  const refund = useMutation({
    mutationFn: (id: string) => api.delete(`/api/payments/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payments'] }),
  })

  function exportCsv() {
    const rows = [
      ['Date', 'Client', 'Barber', 'Service', 'Amount', 'Tip', 'Method', 'Status'],
      ...payments.map(p => [
        format(new Date(p.created_at), 'yyyy-MM-dd HH:mm'),
        p.client_name || '',
        p.barber_name || '',
        p.service_name || '',
        p.amount.toFixed(2),
        (p.tip_amount || 0).toFixed(2),
        p.payment_method,
        p.status,
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `payments-${date}.csv`
    a.click()
  }

  if (!user || !isOwnerOrAdmin(user)) return null

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display tracking-[.18em] uppercase text-base">Payments</h2>
        <p className="text-white/40 text-xs tracking-widest uppercase mt-1">Transaction history</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input type="date" className="field-input w-auto"
          value={date} onChange={e => setDate(e.target.value)} />
        <select className="field-input w-auto"
          value={methodFilter} onChange={e => setMethodFilter(e.target.value)}>
          <option value="">All methods</option>
          <option value="terminal">Terminal</option>
          <option value="cash">Cash</option>
          <option value="zelle">Zelle</option>
          <option value="other">Other</option>
        </select>
        <button onClick={exportCsv} className="btn text-xs">Export CSV</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4">
          <div className="text-[11px] tracking-widest uppercase text-white/45 mb-1">Revenue</div>
          <div className="text-2xl font-black text-yellow-300">${total.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] tracking-widest uppercase text-white/45 mb-1">Tips</div>
          <div className="text-2xl font-black text-emerald-300">${tips.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-[11px] tracking-widest uppercase text-white/45 mb-1">Transactions</div>
          <div className="text-2xl font-black">{payments.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 text-[11px] tracking-widest uppercase text-white/45">
          {isLoading ? 'Loading…' : `${payments.length} transactions`}
        </div>
        {payments.length === 0 && !isLoading && (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No payments found</div>
        )}
        {payments.map(p => (
          <div key={p.id} className="flex items-center justify-between px-5 py-3 border-b border-white/6 last:border-0 gap-3">
            <div className="min-w-0">
              <div className="font-bold text-sm truncate">{p.client_name || 'Client'}</div>
              <div className="text-[11px] text-white/40">
                {p.barber_name} · {p.service_name} · {format(new Date(p.created_at), 'h:mm a')}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <div className="font-bold text-sm">${p.amount.toFixed(2)}</div>
                {(p.tip_amount || 0) > 0 && (
                  <div className="text-[11px] text-emerald-300">+${p.tip_amount!.toFixed(2)} tip</div>
                )}
              </div>
              <span className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border ${METHOD_COLORS[p.payment_method] || METHOD_COLORS.other}`}>
                {p.payment_method}
              </span>
              <button
                onClick={() => { if (confirm('Refund this payment?')) refund.mutate(p.id) }}
                className="text-[11px] text-red-300/60 hover:text-red-300 transition-colors"
              >
                ↩
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
