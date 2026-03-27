'use client'
import Shell from '@/components/Shell'
import { useEffect, useState, useCallback } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = localStorage.getItem('ELEMENT_TOKEN') || ''
  const res = await fetch(API + path, { credentials: 'include', ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function usd(n: number) { return '$' + n.toFixed(2) }

interface CashReport {
  id: string
  date: string
  actual_cash: number
  notes: string
  submitted_by: string
  submitted_at: string
}

interface DaySummary {
  date: string
  cashTotal: number
  zelleTotal: number
  cashTips: number
  zelleTips: number
  cashCount: number
  zelleCount: number
  report?: CashReport
}

export default function CashPage() {
  const today = localDateStr(new Date())
  const [fromDate, setFromDate] = useState(today)
  const [toDate, setToDate] = useState(today)
  const [days, setDays] = useState<DaySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [cashInput, setCashInput] = useState('')
  const [noteInput, setNoteInput] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [paymentsData, reportsData] = await Promise.all([
        apiFetch(`/api/payments?from=${fromDate}T00:00:00Z&to=${toDate}T23:59:59Z`),
        apiFetch(`/api/cash-reports?from=${fromDate}&to=${toDate}`)
      ])

      const payments = paymentsData?.payments || []
      const reports: CashReport[] = reportsData?.reports || []
      const reportMap = new Map(reports.map(r => [r.date, r]))

      // Group payments by date
      const byDate = new Map<string, { cashTotal: number; zelleTotal: number; cashTips: number; zelleTips: number; cashCount: number; zelleCount: number }>()

      // Generate all dates in range
      const start = new Date(fromDate + 'T00:00:00')
      const end = new Date(toDate + 'T00:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = localDateStr(d)
        byDate.set(key, { cashTotal: 0, zelleTotal: 0, cashTips: 0, zelleTips: 0, cashCount: 0, zelleCount: 0 })
      }

      for (const p of payments) {
        if (p.status !== 'paid') continue
        const method = String(p.method || p.source || '').toLowerCase()
        const date = String(p.date || '').slice(0, 10)
        if (!date) continue
        const entry = byDate.get(date) || { cashTotal: 0, zelleTotal: 0, cashTips: 0, zelleTips: 0, cashCount: 0, zelleCount: 0 }

        if (method === 'cash') {
          entry.cashTotal += Number(p.amount || 0)
          entry.cashTips += Number(p.tip || 0)
          entry.cashCount++
        } else if (method === 'zelle') {
          entry.zelleTotal += Number(p.amount || 0)
          entry.zelleTips += Number(p.tip || 0)
          entry.zelleCount++
        }
        byDate.set(date, entry)
      }

      const result: DaySummary[] = []
      byDate.forEach((v, date) => {
        result.push({ date, ...v, report: reportMap.get(date) })
      })
      result.sort((a, b) => b.date.localeCompare(a.date))
      setDays(result)
    } catch (e: any) { showToast('Error: ' + e.message) }
    setLoading(false)
  }, [fromDate, toDate])

  useEffect(() => { load() }, [load])

  async function saveReport(date: string) {
    const amount = parseFloat(cashInput)
    if (isNaN(amount) || amount < 0) { showToast('Enter valid amount'); return }
    setSaving(date)
    try {
      await apiFetch('/api/cash-reports', {
        method: 'POST',
        body: JSON.stringify({ date, actual_cash: amount, notes: noteInput.trim() })
      })
      showToast('Cash report saved ✓')
      setEditingDay(null)
      setCashInput('')
      setNoteInput('')
      load()
    } catch (e: any) { showToast('Error: ' + e.message) }
    setSaving(null)
  }

  // Quick presets
  function setPreset(preset: 'today' | 'week' | 'month') {
    const now = new Date()
    if (preset === 'today') { setFromDate(today); setToDate(today) }
    else if (preset === 'week') { const w = new Date(now); w.setDate(w.getDate() - 6); setFromDate(localDateStr(w)); setToDate(today) }
    else { const m = new Date(now); m.setDate(m.getDate() - 29); setFromDate(localDateStr(m)); setToDate(today) }
  }

  // Totals
  const totalExpectedCash = days.reduce((s, d) => s + d.cashTotal + d.cashTips, 0)
  const totalExpectedZelle = days.reduce((s, d) => s + d.zelleTotal + d.zelleTips, 0)
  const totalActual = days.reduce((s, d) => s + (d.report?.actual_cash || 0), 0)
  const reportsCount = days.filter(d => d.report).length
  const totalDiff = reportsCount > 0 ? totalActual - days.filter(d => d.report).reduce((s, d) => s + d.cashTotal + d.cashTips, 0) : 0

  const inp: React.CSSProperties = { width: '100%', height: 42, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(0,0,0,.22)', color: '#fff', padding: '0 12px', outline: 'none', fontSize: 13, fontFamily: 'inherit', colorScheme: 'dark' as any }
  const lbl: React.CSSProperties = { fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.50)', display: 'block', marginBottom: 5 }

  return (
    <Shell page="cash">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Julius+Sans+One&display=swap');
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
        .cash-card:hover { border-color: rgba(255,255,255,.18) !important; }
        @keyframes cashSlide { 0% { opacity:0; transform:translateY(8px) } 100% { opacity:1; transform:translateY(0) } }
        .cash-day { animation: cashSlide .3s ease both; }
        @media(max-width:640px) {
          .cash-kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
          .cash-date-row { flex-direction: column !important; align-items: stretch !important; }
          .cash-date-row input { min-width: 0 !important; }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 20 }}>
          <h2 style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Cash Register</h2>
          <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>
            Daily cash reconciliation
          </p>
        </div>

        {/* Date range + presets */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="cash-date-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>From</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...inp, minWidth: 140 }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>To</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...inp, minWidth: 140 }} />
            </div>
            <button onClick={() => load()} disabled={loading}
              style={{ height: 42, padding: '0 16px', borderRadius: 12, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {loading ? '…' : 'Load'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['today', 'week', 'month'] as const).map(p => (
              <button key={p} onClick={() => setPreset(p)}
                style={{ height: 30, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', color: 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'inherit' }}>
                {p === 'today' ? 'Today' : p === 'week' ? 'Last 7 days' : 'Last 30 days'}
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="cash-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, padding: '14px 20px' }}>
          {[
            { label: 'Expected Cash', value: usd(totalExpectedCash), color: '#ffe9a3' },
            { label: 'Expected Zelle', value: usd(totalExpectedZelle), color: '#d7ecff' },
            { label: 'Actual Counted', value: reportsCount > 0 ? usd(totalActual) : '—', color: '#c9ffe1' },
            { label: 'Difference', value: reportsCount > 0 ? (totalDiff >= 0 ? '+' : '') + usd(totalDiff) : '—', color: totalDiff >= 0 ? '#c9ffe1' : '#ffd0d0' },
          ].map(kpi => (
            <div key={kpi.label} style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)' }}>
              <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.40)', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Day list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>Loading…</div>
          ) : days.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>No data for selected period</div>
          ) : days.map((day, i) => {
            const expectedCash = day.cashTotal + day.cashTips
            const diff = day.report ? day.report.actual_cash - expectedCash : null
            const isEditing = editingDay === day.date
            const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            const isToday = day.date === today

            return (
              <div key={day.date} className="cash-day cash-card" style={{
                marginTop: i > 0 ? 8 : 0, padding: '14px 16px', borderRadius: 16,
                border: `1px solid ${isToday ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.08)'}`,
                background: isToday ? 'rgba(10,132,255,.04)' : 'rgba(255,255,255,.02)',
                transition: 'border-color .25s ease',
                animationDelay: `${i * 0.04}s`,
              }}>
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 14 }}>
                      {dayLabel}
                      {isToday && <span style={{ marginLeft: 8, fontSize: 10, padding: '2px 8px', borderRadius: 999, border: '1px solid rgba(10,132,255,.40)', background: 'rgba(10,132,255,.10)', color: '#d7ecff' }}>TODAY</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>
                      {day.cashCount} cash · {day.zelleCount} zelle
                    </div>
                  </div>
                  {day.report ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.06em' }}>
                        {day.report.submitted_by} · {new Date(day.report.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingDay(day.date); setCashInput(''); setNoteInput('') }}
                      style={{ height: 32, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,207,63,.40)', background: 'rgba(255,207,63,.08)', color: '#ffe9a3', cursor: 'pointer', fontWeight: 800, fontSize: 11, fontFamily: 'inherit' }}>
                      Enter cash count
                    </button>
                  )}
                </div>

                {/* Numbers */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(255,207,63,.06)', border: '1px solid rgba(255,207,63,.15)' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,207,63,.60)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Cash expected</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#ffe9a3', marginTop: 2 }}>{usd(expectedCash)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', marginTop: 1 }}>services {usd(day.cashTotal)} + tips {usd(day.cashTips)}</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: 'rgba(10,132,255,.06)', border: '1px solid rgba(10,132,255,.15)' }}>
                    <div style={{ fontSize: 9, color: 'rgba(10,132,255,.60)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Zelle</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#d7ecff', marginTop: 2 }}>{usd(day.zelleTotal + day.zelleTips)}</div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,.25)', marginTop: 1 }}>services {usd(day.zelleTotal)} + tips {usd(day.zelleTips)}</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 10, background: day.report ? (diff !== null && diff >= 0 ? 'rgba(143,240,177,.06)' : 'rgba(255,107,107,.06)') : 'rgba(255,255,255,.03)', border: `1px solid ${day.report ? (diff !== null && diff >= 0 ? 'rgba(143,240,177,.15)' : 'rgba(255,107,107,.15)') : 'rgba(255,255,255,.08)'}` }}>
                    <div style={{ fontSize: 9, color: day.report ? (diff !== null && diff >= 0 ? 'rgba(143,240,177,.60)' : 'rgba(255,107,107,.60)') : 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Actual / Diff</div>
                    {day.report ? (
                      <>
                        <div style={{ fontSize: 16, fontWeight: 900, color: diff !== null && diff >= 0 ? '#c9ffe1' : '#ffd0d0', marginTop: 2 }}>{usd(day.report.actual_cash)}</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: diff !== null && diff >= 0 ? '#8ff0b1' : '#ff6b6b', marginTop: 1 }}>
                          {diff !== null ? (diff >= 0 ? '+' : '') + usd(diff) : ''}
                          {diff === 0 && ' ✓'}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,.20)', marginTop: 4 }}>Not counted</div>
                    )}
                  </div>
                </div>

                {/* Notes from report */}
                {day.report?.notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(255,255,255,.45)', padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)' }}>
                    💬 {day.report.notes}
                  </div>
                )}

                {/* Edit/update form */}
                {isEditing && (
                  <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(10,132,255,.25)', background: 'rgba(10,132,255,.04)' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={lbl}>Cash counted ($)</label>
                        <input type="number" min="0" step="0.01" value={cashInput} onChange={e => setCashInput(e.target.value)} placeholder="0.00" autoFocus
                          style={inp} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={lbl}>Note (optional)</label>
                        <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Any notes…" style={inp} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => setEditingDay(null)}
                        style={{ height: 36, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>
                        Cancel
                      </button>
                      <button onClick={() => saveReport(day.date)} disabled={saving === day.date}
                        style={{ height: 36, padding: '0 18px', borderRadius: 999, border: '1px solid rgba(10,132,255,.65)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>
                        {saving === day.date ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Re-enter button if already reported */}
                {day.report && !isEditing && (
                  <button onClick={() => { setEditingDay(day.date); setCashInput(String(day.report!.actual_cash)); setNoteInput(day.report!.notes || '') }}
                    style={{ marginTop: 8, height: 28, padding: '0 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,.08)', background: 'transparent', color: 'rgba(255,255,255,.35)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}>
                    Update count
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,8,8,.92)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '10px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(18px)', fontSize: 13, zIndex: 5000, whiteSpace: 'nowrap', color: '#e9e9e9', fontFamily: 'inherit' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: toast.includes('Error') ? '#ff6b6b' : '#8ff0b1', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </Shell>
  )
}
