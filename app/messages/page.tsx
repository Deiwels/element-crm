'use client'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import Shell from '@/components/Shell'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'
const API_KEY = 'R1403ss81fxrx*rx1403'

async function apiFetch(path: string, opts?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ELEMENT_TOKEN') || '' : ''
  const res = await fetch(API + path, { credentials: 'include', ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-API-KEY': API_KEY, ...(opts?.headers || {}) }
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'HTTP ' + res.status)
  return data
}

// ─── Types ───────────────────────────────────────────────────────────────────
type ChatType = 'general' | 'barbers' | 'admins' | 'students'
type Tab = ChatType | 'requests'

interface Message {
  id: string
  chatType: ChatType
  senderId: string
  senderName: string
  senderRole: string
  text: string
  createdAt: string
}

interface Request {
  id: string
  type: 'schedule_change' | 'photo_change'
  barberId: string
  barberName: string
  status: 'pending' | 'approved' | 'rejected'
  data: any
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

// ─── Tab config ──────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: string; roles: string[] }[] = [
  { id: 'general',  label: 'General',  icon: '💬', roles: ['owner','admin','barber','student'] },
  { id: 'barbers',  label: 'Barbers',  icon: '💈', roles: ['owner','admin','barber'] },
  { id: 'admins',   label: 'Admins',   icon: '🛡️', roles: ['owner','admin'] },
  { id: 'students', label: 'Students', icon: '🎓', roles: ['owner','admin','student'] },
  { id: 'requests', label: 'Requests', icon: '📋', roles: ['owner','admin','barber'] },
]

// ─── Styles ──────────────────────────────────────────────────────────────────
const GLASS = { borderRadius: 18, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.04)', backdropFilter: 'saturate(180%) blur(20px)' } as React.CSSProperties

function timeAgo(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

const ROLE_COLORS: Record<string, string> = {
  owner: '#ffe9a3', admin: '#c9ffe1', barber: '#d7ecff', student: '#d4b8ff'
}

// ─── MessageBubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: Message; isOwn: boolean }) {
  const roleColor = ROLE_COLORS[msg.senderRole] || '#e9e9e9'
  return (
    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', marginBottom: 4, padding: '0 16px' }}>
      {/* Avatar */}
      <div style={{ width: 32, height: 32, borderRadius: 10, background: isOwn ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.08)', border: `1px solid ${isOwn ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.10)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isOwn ? '#d7ecff' : roleColor, flexShrink: 0 }}>
        {initials(msg.senderName)}
      </div>
      {/* Bubble */}
      <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isOwn ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.06)', border: `1px solid ${isOwn ? 'rgba(10,132,255,.25)' : 'rgba(255,255,255,.08)'}` }}>
        {!isOwn && (
          <div style={{ fontSize: 10, fontWeight: 800, color: roleColor, marginBottom: 3, letterSpacing: '.04em' }}>
            {msg.senderName} <span style={{ color: 'rgba(255,255,255,.25)', fontWeight: 400 }}>· {msg.senderRole}</span>
          </div>
        )}
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e9e9e9', wordBreak: 'break-word' }}>{msg.text}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>{timeAgo(msg.createdAt)}</div>
      </div>
    </div>
  )
}

// ─── RequestCard ─────────────────────────────────────────────────────────────
function RequestCard({ req, isOwnerOrAdmin, onReview }: { req: Request; isOwnerOrAdmin: boolean; onReview: (id: string, status: 'approved' | 'rejected') => void }) {
  const isPending = req.status === 'pending'
  const statusColors: Record<string, { bg: string; border: string; color: string }> = {
    pending:  { bg: 'rgba(255,207,63,.08)', border: 'rgba(255,207,63,.25)', color: '#ffe9a3' },
    approved: { bg: 'rgba(143,240,177,.08)', border: 'rgba(143,240,177,.25)', color: '#c9ffe1' },
    rejected: { bg: 'rgba(255,107,107,.08)', border: 'rgba(255,107,107,.25)', color: '#ffd0d0' },
  }
  const sc = statusColors[req.status] || statusColors.pending

  return (
    <div style={{ ...GLASS, padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{req.type === 'schedule_change' ? '📅' : '📸'}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>{req.type === 'schedule_change' ? 'Schedule change' : 'Photo change'}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>{req.barberName} · {timeAgo(req.createdAt)}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>{req.status}</span>
      </div>

      {/* Details */}
      {req.type === 'schedule_change' && req.data && (
        <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: isPending && isOwnerOrAdmin ? 10 : 0 }}>
          <div>Days: <strong style={{ color: '#e9e9e9' }}>{(req.data.workDays || []).join(', ')}</strong></div>
          <div>Hours: <strong style={{ color: '#e9e9e9' }}>{req.data.startTime} — {req.data.endTime}</strong></div>
          {req.data.note && <div style={{ marginTop: 4 }}>Note: {req.data.note}</div>}
        </div>
      )}
      {req.type === 'photo_change' && req.data?.newPhotoUrl && (
        <div style={{ marginBottom: isPending && isOwnerOrAdmin ? 10 : 0 }}>
          <img src={req.data.newPhotoUrl} alt="new photo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)' }} />
        </div>
      )}

      {/* Actions */}
      {isPending && isOwnerOrAdmin && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onReview(req.id, 'approved')} style={{ flex: 1, height: 36, borderRadius: 10, border: '1px solid rgba(143,240,177,.45)', background: 'rgba(143,240,177,.10)', color: '#c9ffe1', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit' }}>Approve</button>
          <button onClick={() => onReview(req.id, 'rejected')} style={{ flex: 1, height: 36, borderRadius: 10, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit' }}>Reject</button>
        </div>
      )}
      {req.reviewedBy && (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.30)', marginTop: 6 }}>Reviewed by {req.reviewedBy}{req.reviewedAt ? ` · ${timeAgo(req.reviewedAt)}` : ''}</div>
      )}
    </div>
  )
}

// ─── NewRequestModal ─────────────────────────────────────────────────────────
function NewRequestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [type, setType] = useState<'schedule_change' | 'photo_change'>('schedule_change')
  const [days, setDays] = useState<string[]>(['Mon','Tue','Wed','Thu','Fri','Sat'])
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('20:00')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  const inp: React.CSSProperties = { width: '100%', height: 40, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 10px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }

  async function submit() {
    setSaving(true)
    try {
      await apiFetch('/api/requests', { method: 'POST', body: JSON.stringify({ type, data: type === 'schedule_change' ? { workDays: days, startTime, endTime, note } : {} }) })
      onCreated()
    } catch (e: any) { alert(e.message) }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ width: 'min(440px,100%)', borderRadius: 22, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(0,0,0,.65)', backdropFilter: 'saturate(180%) blur(40px)', boxShadow: '0 32px 80px rgba(0,0,0,.60)', color: '#e9e9e9', fontFamily: 'Inter,sans-serif' }}>
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 13 }}>New request</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.05)', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ v: 'schedule_change' as const, l: '📅 Schedule' }, { v: 'photo_change' as const, l: '📸 Photo' }].map(t => (
              <button key={t.v} onClick={() => setType(t.v)}
                style={{ flex: 1, height: 38, borderRadius: 999, border: `1px solid ${type === t.v ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.10)'}`, background: type === t.v ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: type === t.v ? '#fff' : 'rgba(255,255,255,.55)', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>{t.l}</button>
            ))}
          </div>

          {type === 'schedule_change' && (
            <>
              {/* Days */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>Working days</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {DAY_NAMES.map(d => (
                    <button key={d} onClick={() => setDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])}
                      style={{ width: 42, height: 34, borderRadius: 8, border: `1px solid ${days.includes(d) ? 'rgba(10,132,255,.50)' : 'rgba(255,255,255,.10)'}`, background: days.includes(d) ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.04)', color: days.includes(d) ? '#d7ecff' : 'rgba(255,255,255,.40)', cursor: 'pointer', fontWeight: 700, fontSize: 11, fontFamily: 'inherit' }}>{d}</button>
                  ))}
                </div>
              </div>
              {/* Times */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Start time</div>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>End time</div>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
                </div>
              </div>
              {/* Note */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 4 }}>Note (optional)</div>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for change…" rows={2} style={{ ...inp, height: 'auto', padding: '8px 10px', resize: 'vertical' as const }} />
              </div>
            </>
          )}

          {type === 'photo_change' && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,.40)', fontSize: 12 }}>
              Photo change requests — upload a new photo in your profile settings, and it will be sent for approval.
            </div>
          )}

          <button onClick={submit} disabled={saving}
            style={{ height: 42, borderRadius: 12, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.14)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 13, fontFamily: 'inherit', opacity: saving ? .5 : 1 }}>
            {saving ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Messages Page ───────────────────────────────────────────────────────────
export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [messages, setMessages] = useState<Message[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const wasAtBottom = useRef(true)

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null')) } catch {}
  }, [])

  const role = user?.role || 'barber'
  const uid = user?.uid || ''
  const isOwnerOrAdmin = role === 'owner' || role === 'admin'
  const visibleTabs = TABS.filter(t => t.roles.includes(role))

  // Load messages
  const loadMessages = useCallback(async () => {
    if (activeTab === 'requests') return
    try {
      const data = await apiFetch(`/api/messages?chatType=${activeTab}&limit=100`)
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch { /* ignore — API might not be deployed yet */ }
  }, [activeTab])

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      const data = await apiFetch('/api/requests')
      setRequests(Array.isArray(data?.requests) ? data.requests : [])
    } catch { /* ignore */ }
  }, [])

  // Initial load + polling
  useEffect(() => {
    setLoading(true)
    if (activeTab === 'requests') {
      loadRequests().then(() => setLoading(false))
    } else {
      loadMessages().then(() => setLoading(false))
    }
    const interval = setInterval(() => {
      if (activeTab === 'requests') loadRequests()
      else loadMessages()
    }, 5000)
    return () => clearInterval(interval)
  }, [activeTab, loadMessages, loadRequests])

  // Auto-scroll to bottom
  useEffect(() => {
    const el = listRef.current
    if (el && wasAtBottom.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  function onScroll() {
    const el = listRef.current
    if (el) wasAtBottom.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40
  }

  async function sendMessage() {
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ chatType: activeTab, text: input.trim() }) })
      setInput('')
      wasAtBottom.current = true
      await loadMessages()
    } catch (e: any) { console.warn(e.message) }
    setSending(false)
  }

  async function reviewRequest(id: string, status: 'approved' | 'rejected') {
    try {
      await apiFetch(`/api/requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      loadRequests()
    } catch (e: any) { alert(e.message) }
  }

  return (
    <Shell page="Messages">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Julius+Sans+One&display=swap');
        .msg-input:focus { border-color: rgba(255,255,255,.25) !important; }
        .msg-list::-webkit-scrollbar { width: 4px; }
        .msg-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }
      `}</style>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter,sans-serif', color: '#e9e9e9' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
          <h2 style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 'clamp(16px,3vw,20px)', margin: 0, fontWeight: 400, textAlign: 'center' }}>Messages</h2>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2, letterSpacing: '.06em' }}>Team communication</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 16px 8px', overflowX: 'auto', flexShrink: 0 }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ height: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${activeTab === t.id ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)'}`, background: activeTab === t.id ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab !== 'requests' ? (
          <>
            {/* Message list */}
            <div ref={listRef} className="msg-list" onScroll={onScroll}
              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, paddingBottom: 8 }}>
              {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Loading…</div>}
              {!loading && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.20)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: 13 }}>No messages yet</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,.15)' }}>Be the first to say something!</div>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === uid} />
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: '8px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="msg-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Type a message…"
                style={{ flex: 1, height: 42, borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 16px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}
                style={{ width: 42, height: 42, borderRadius: 999, border: '1px solid rgba(10,132,255,.55)', background: input.trim() ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.04)', color: input.trim() ? '#d7ecff' : 'rgba(255,255,255,.25)', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>
        ) : (
          /* Requests tab */
          <div className="msg-list" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {/* New request button for barbers */}
            {(role === 'barber') && (
              <button onClick={() => setShowNewRequest(true)}
                style={{ width: '100%', height: 44, borderRadius: 14, border: '1px solid rgba(10,132,255,.40)', background: 'rgba(10,132,255,.10)', color: '#d7ecff', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New request
              </button>
            )}

            {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Loading…</div>}
            {!loading && requests.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.20)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 13 }}>No requests</div>
              </div>
            )}
            {requests.map(req => (
              <RequestCard key={req.id} req={req} isOwnerOrAdmin={isOwnerOrAdmin} onReview={reviewRequest} />
            ))}
          </div>
        )}
      </div>

      {/* New request modal */}
      {showNewRequest && <NewRequestModal onClose={() => setShowNewRequest(false)} onCreated={() => { setShowNewRequest(false); loadRequests() }} />}
    </Shell>
  )
}
