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
type Tab = ChatType | 'requests' | 'applications'

interface Application {
  id: string; type: string; role: string; name: string; phone: string; email: string
  instagram: string; experience: string; english: string; fulltime: string
  portfolio: string; motivation: string; status: string; created_at: string
  license?: string; fade_level?: string; medium_hair?: string; beard?: string; barber_notes?: string
  admin_experience?: string; pos?: string; typing?: string; multitask?: string; admin_notes?: string
  schedule?: string; message?: string; lang?: string; notes?: string; reviewed_by?: string
}

interface Message {
  id: string
  chatType: ChatType
  senderId: string
  senderName: string
  senderRole: string
  senderPhoto?: string
  text: string
  imageUrl?: string
  createdAt: string
}

interface Request {
  id: string
  type: 'schedule_change' | 'photo_change' | 'profile_change' | 'service_change' | 'block_time'
  barberId: string
  barberName: string
  status: 'pending' | 'approved' | 'rejected'
  data: any
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
}

// ─── Tab config ──────────────────────────────────────────────────────────────
// SVG icons for tabs (matching glass-dark style)
function TabIcon({ id, color }: { id: string; color: string }) {
  const s = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' }
  switch (id) {
    case 'general': return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...s}/></svg>
    case 'barbers': return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 3v18" {...s}/><path d="M5 8c4-1 7 1 7 4s-3 5-7 4" {...s}/><circle cx="16" cy="12" r="3" {...s}/><path d="M19 12h2" {...s}/></svg>
    case 'admins': return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...s}/></svg>
    case 'students': return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M22 10v6M2 10l10-5 10 5-10 5z" {...s}/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" {...s}/></svg>
    case 'requests': return <svg width="14" height="14" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" {...s}/><path d="M9 12l2 2 4-4" {...s}/><line x1="9" y1="7" x2="15" y2="7" {...s}/><line x1="9" y1="17" x2="13" y2="17" {...s}/></svg>
    case 'applications': return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" {...s}/><rect x="8" y="2" width="8" height="4" rx="1" {...s}/><path d="M9 14h6M9 18h4" {...s}/></svg>
    default: return null
  }
}

const TAB_COLORS: Record<string, string> = {
  general: '#d7ecff', barbers: '#d7ecff', admins: '#c9ffe1', students: '#d4b8ff', requests: '#ffe9a3', applications: '#ffb7d5'
}

const TABS: { id: Tab; label: string; roles: string[] }[] = [
  { id: 'general',  label: 'General',  roles: ['owner','admin','barber','student'] },
  { id: 'barbers',  label: 'Barbers',  roles: ['owner','admin','barber'] },
  { id: 'admins',   label: 'Admins',   roles: ['owner','admin'] },
  { id: 'students', label: 'Students', roles: ['owner','admin','student'] },
  { id: 'requests',     label: 'Requests',     roles: ['owner','admin','barber'] },
  { id: 'applications', label: 'Applications', roles: ['owner','admin'] },
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
function MessageBubble({ msg, isOwn, onImageClick }: { msg: Message; isOwn: boolean; onImageClick?: (url: string) => void }) {
  const roleColor = ROLE_COLORS[msg.senderRole] || '#e9e9e9'
  return (
    <div style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-end', marginBottom: 4, padding: '0 16px' }}>
      {/* Avatar */}
      {msg.senderPhoto ? (
        <img src={msg.senderPhoto} alt="" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: `1px solid ${isOwn ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.10)'}`, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 32, height: 32, borderRadius: 10, background: isOwn ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.08)', border: `1px solid ${isOwn ? 'rgba(10,132,255,.30)' : 'rgba(255,255,255,.10)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: isOwn ? '#d7ecff' : roleColor, flexShrink: 0 }}>
          {initials(msg.senderName)}
        </div>
      )}
      {/* Bubble */}
      <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isOwn ? 'rgba(10,132,255,.14)' : 'rgba(255,255,255,.06)', border: `1px solid ${isOwn ? 'rgba(10,132,255,.25)' : 'rgba(255,255,255,.08)'}` }}>
        {!isOwn && (
          <div style={{ fontSize: 10, fontWeight: 800, color: roleColor, marginBottom: 3, letterSpacing: '.04em' }}>
            {msg.senderName} <span style={{ color: 'rgba(255,255,255,.25)', fontWeight: 400 }}>· {msg.senderRole}</span>
          </div>
        )}
        {msg.text && <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e9e9e9', wordBreak: 'break-word' }}>{msg.text}</div>}
        {msg.imageUrl && (
          <img src={msg.imageUrl} alt="" onClick={() => onImageClick?.(msg.imageUrl!)}
            style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, marginTop: msg.text ? 6 : 0, cursor: 'pointer', objectFit: 'cover', border: '1px solid rgba(255,255,255,.10)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,.25)', marginTop: 4, textAlign: isOwn ? 'right' : 'left' }}>{timeAgo(msg.createdAt)}</div>
      </div>
    </div>
  )
}

// ─── RequestCard ─────────────────────────────────────────────────────────────
const REQ_TYPE_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  schedule_change: { label: 'Schedule change', color: '#ffe9a3', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffe9a3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  photo_change:    { label: 'Photo change', color: '#d7ecff', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d7ecff" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg> },
  profile_change:  { label: 'Profile update', color: '#d4b8ff', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d4b8ff" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  service_change:  { label: 'Service change', color: '#35d6c7', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#35d6c7" strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg> },
  block_time:      { label: 'Block time', color: '#ffd0d0', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffd0d0" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> },
}

function RequestCard({ req, isOwnerOrAdmin, onReview }: { req: Request; isOwnerOrAdmin: boolean; onReview: (id: string, status: 'approved' | 'rejected') => void }) {
  const isPending = req.status === 'pending'
  const statusColors: Record<string, { bg: string; border: string; color: string }> = {
    pending:  { bg: 'rgba(255,207,63,.08)', border: 'rgba(255,207,63,.25)', color: '#ffe9a3' },
    approved: { bg: 'rgba(143,240,177,.08)', border: 'rgba(143,240,177,.25)', color: '#c9ffe1' },
    rejected: { bg: 'rgba(255,107,107,.08)', border: 'rgba(255,107,107,.25)', color: '#ffd0d0' },
  }
  const sc = statusColors[req.status] || statusColors.pending
  const info = REQ_TYPE_INFO[req.type] || { label: req.type, color: '#e9e9e9', icon: null }
  const detailStyle: React.CSSProperties = { padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.06)', fontSize: 12, color: 'rgba(255,255,255,.55)', marginBottom: isPending && isOwnerOrAdmin ? 10 : 0, lineHeight: 1.6 }

  return (
    <div style={{ ...GLASS, padding: '14px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{info.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: info.color }}>{info.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.40)' }}>{req.barberName} · {timeAgo(req.createdAt)}</div>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color, textTransform: 'uppercase', letterSpacing: '.06em' }}>{req.status}</span>
      </div>

      {/* Details per type */}
      {req.type === 'schedule_change' && req.data && (
        <div style={detailStyle}>
          {req.data.dayName && <div>Day: <strong style={{ color: '#e9e9e9' }}>{req.data.dayName}</strong></div>}
          {req.data.workDays && <div>Days: <strong style={{ color: '#e9e9e9' }}>{req.data.workDays.join(', ')}</strong></div>}
          <div>Hours: <strong style={{ color: '#e9e9e9' }}>{req.data.startTime} — {req.data.endTime}</strong></div>
          {req.data.note && <div style={{ marginTop: 4, color: 'rgba(255,255,255,.40)' }}>Note: {req.data.note}</div>}
        </div>
      )}

      {req.type === 'photo_change' && req.data?.newPhotoUrl && (
        <div style={{ marginBottom: isPending && isOwnerOrAdmin ? 10 : 0 }}>
          <img src={req.data.newPhotoUrl} alt="new photo" style={{ width: 80, height: 80, borderRadius: 12, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)' }} />
        </div>
      )}

      {req.type === 'profile_change' && req.data?.changes && (
        <div style={detailStyle}>
          {req.data.changes.about && <div>Bio: <strong style={{ color: '#e9e9e9' }}>{String(req.data.changes.about).slice(0, 60)}{String(req.data.changes.about).length > 60 ? '…' : ''}</strong></div>}
          {req.data.changes.level && <div>Level: <strong style={{ color: '#e9e9e9' }}>{req.data.changes.level}</strong></div>}
          {req.data.changes.base_price && <div>Price: <strong style={{ color: '#e9e9e9' }}>${req.data.changes.base_price}</strong></div>}
          {req.data.changes.public_role && <div>Role: <strong style={{ color: '#e9e9e9' }}>{req.data.changes.public_role}</strong></div>}
          {req.data.scheduleSummary && Array.isArray(req.data.scheduleSummary) && (
            <div>Schedule: <strong style={{ color: '#e9e9e9' }}>{req.data.scheduleSummary.join(', ')}</strong></div>
          )}
          {!req.data.scheduleSummary && req.data.changes.schedule && <div>Schedule: <strong style={{ color: '#e9e9e9' }}>Updated</strong></div>}
          {req.data.changes.photo_url && (
            <div style={{ marginTop: 6 }}>
              <div style={{ marginBottom: 4 }}>New photo:</div>
              <img src={req.data.changes.photo_url} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.12)' }} />
            </div>
          )}
        </div>
      )}

      {req.type === 'service_change' && req.data && (
        <div style={detailStyle}>
          <div>Service: <strong style={{ color: '#e9e9e9' }}>{req.data.serviceName || req.data.changes?.name || '—'}</strong></div>
          {req.data.changes?.duration_minutes && <div>Duration: <strong style={{ color: '#e9e9e9' }}>{req.data.changes.duration_minutes} min</strong></div>}
          {req.data.changes?.price_cents != null && <div>Price: <strong style={{ color: '#e9e9e9' }}>${(req.data.changes.price_cents / 100).toFixed(2)}</strong></div>}
          {req.data.changes?.name && <div>New name: <strong style={{ color: '#e9e9e9' }}>{req.data.changes.name}</strong></div>}
        </div>
      )}

      {req.type === 'block_time' && req.data && (
        <div style={detailStyle}>
          <div>Date: <strong style={{ color: '#e9e9e9' }}>{req.data.date || '—'}</strong></div>
          <div>Time: <strong style={{ color: '#e9e9e9' }}>{req.data.startAt ? new Date(req.data.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'} — {req.data.endAt ? new Date(req.data.endAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—'}</strong></div>
          {req.data.barberName && <div>Barber: <strong style={{ color: '#e9e9e9' }}>{req.data.barberName}</strong></div>}
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
            {[{ v: 'schedule_change' as const, l: 'Schedule change' }, { v: 'photo_change' as const, l: 'Photo change' }].map(t => (
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
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const wasAtBottom = useRef(true)

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null')) } catch {}
    // Re-read after Shell may have updated photo from API
    const t = setTimeout(() => {
      try { setUser(JSON.parse(localStorage.getItem('ELEMENT_USER') || 'null')) } catch {}
    }, 2000)
    return () => clearTimeout(t)
  }, [])

  const role = user?.role || 'barber'
  const uid = user?.uid || ''
  const isOwnerOrAdmin = role === 'owner' || role === 'admin'
  const visibleTabs = TABS.filter(t => t.roles.includes(role))

  // Load messages
  const loadMessages = useCallback(async () => {
    if (activeTab === 'requests' || activeTab === 'applications') return
    try {
      const data = await apiFetch(`/api/messages?chatType=${activeTab}&limit=100`)
      setMessages(Array.isArray(data?.messages) ? data.messages : [])
    } catch { /* ignore */ }
  }, [activeTab])

  // Load requests
  const loadRequests = useCallback(async () => {
    try {
      const data = await apiFetch('/api/requests')
      setRequests(Array.isArray(data?.requests) ? data.requests : [])
    } catch { /* ignore */ }
  }, [])

  // Load applications
  const loadApplications = useCallback(async () => {
    try {
      const data = await apiFetch('/api/applications')
      setApplications(Array.isArray(data?.applications) ? data.applications : [])
    } catch { /* ignore */ }
  }, [])

  // Initial load + polling
  useEffect(() => {
    setLoading(true)
    if (activeTab === 'requests') {
      loadRequests().then(() => setLoading(false))
    } else if (activeTab === 'applications') {
      loadApplications().then(() => setLoading(false))
    } else {
      loadMessages().then(() => setLoading(false))
    }
    const interval = setInterval(() => {
      if (activeTab === 'requests') loadRequests()
      else if (activeTab === 'applications') loadApplications()
      else loadMessages()
    }, 10000)
    return () => clearInterval(interval)
  }, [activeTab, loadMessages, loadRequests, loadApplications])

  // Fix mobile keyboard pushing content — reset scroll position on blur
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function onResize() {
      const container = document.querySelector('.msg-container') as HTMLElement
      if (!container) return
      container.style.height = `${vv!.height}px`
      // Prevent iOS Safari from scrolling the page up
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    // Also reset on any input blur (keyboard close)
    function onBlur() {
      setTimeout(() => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
        const container = document.querySelector('.msg-container') as HTMLElement
        if (container) container.style.height = '100dvh'
      }, 100)
    }
    document.addEventListener('focusout', onBlur)
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize); document.removeEventListener('focusout', onBlur) }
  }, [])

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
    if ((!input.trim() && !imagePreview) || sending) return
    setSending(true)
    try {
      // Re-read photo from localStorage (Shell may have updated it after initial load)
      let userPhoto = user?.photo || ''
      try { const fresh = JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}'); userPhoto = fresh?.photo || userPhoto } catch {}
      await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ chatType: activeTab, text: input.trim(), senderPhoto: userPhoto, imageUrl: imagePreview || undefined }) })
      setInput(''); setImagePreview('')
      wasAtBottom.current = true
      await loadMessages()
    } catch (e: any) { console.warn(e.message) }
    setSending(false)
  }

  function handleImageAttach(file: File | null) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800, scale = Math.min(1, MAX / img.width, MAX / img.height)
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        let q = 0.75, out = canvas.toDataURL('image/jpeg', q)
        while (out.length > 500000 && q > 0.3) { q -= 0.1; out = canvas.toDataURL('image/jpeg', q) }
        setImagePreview(out)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
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

      <div className="msg-container" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter,sans-serif', color: '#e9e9e9' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 0', flexShrink: 0 }}>
          <h2 style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 'clamp(16px,3vw,20px)', margin: 0, fontWeight: 400, textAlign: 'center' }}>Messages</h2>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2, letterSpacing: '.06em' }}>Team communication</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, padding: '14px 16px 8px', overflowX: 'auto', flexShrink: 0 }}>
          {visibleTabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ height: 36, padding: '0 14px', borderRadius: 999, border: `1px solid ${activeTab === t.id ? (TAB_COLORS[t.id] || 'rgba(255,255,255,.25)').replace(')', ',.35)').replace('rgb', 'rgba') : 'rgba(255,255,255,.08)'}`, background: activeTab === t.id ? 'rgba(255,255,255,.10)' : 'rgba(255,255,255,.03)', color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontWeight: 800, fontSize: 12, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TabIcon id={t.id} color={activeTab === t.id ? (TAB_COLORS[t.id] || '#fff') : 'rgba(255,255,255,.35)'} /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'applications' ? (
          /* Applications tab */
          <div className="msg-list" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Loading…</div>}
            {!loading && applications.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.20)' }}>
                <div style={{ marginBottom: 8 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></div>
                <div style={{ fontSize: 13 }}>No applications yet</div>
              </div>
            )}
            {applications.map(app => {
              const roleType = String(app.role || app.type || '').toLowerCase()
              const isBarber = roleType.includes('barber') && !roleType.includes('academy')
              const isAcademy = roleType.includes('academy')
              const statusColors: Record<string,{bg:string;border:string;color:string}> = {
                new:       { bg: 'rgba(10,132,255,.08)', border: 'rgba(10,132,255,.35)', color: '#d7ecff' },
                reviewed:  { bg: 'rgba(255,207,63,.08)', border: 'rgba(255,207,63,.35)', color: '#ffe9a3' },
                interview: { bg: 'rgba(168,107,255,.08)', border: 'rgba(168,107,255,.35)', color: '#d4b8ff' },
                hired:     { bg: 'rgba(143,240,177,.08)', border: 'rgba(143,240,177,.35)', color: '#c9ffe1' },
                rejected:  { bg: 'rgba(255,107,107,.08)', border: 'rgba(255,107,107,.35)', color: '#ffd0d0' },
              }
              const sc = statusColors[app.status] || statusColors.new
              const roleBadge = isAcademy ? { bg: 'rgba(168,107,255,.12)', border: 'rgba(168,107,255,.40)', color: '#d4b8ff', label: 'ACADEMY' } : isBarber ? { bg: 'rgba(10,132,255,.12)', border: 'rgba(10,132,255,.40)', color: '#d7ecff', label: 'BARBER' } : { bg: 'rgba(143,240,177,.12)', border: 'rgba(143,240,177,.40)', color: '#c9ffe1', label: 'ADMIN' }
              return (
                <div key={app.id} style={{ padding: '14px 16px', borderRadius: 16, border: `1px solid ${sc.border}`, background: sc.bg, marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 900, fontSize: 15 }}>{app.name}</span>
                      <span style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, border: `1px solid ${roleBadge.border}`, background: roleBadge.bg, color: roleBadge.color, fontWeight: 900 }}>{roleBadge.label}</span>
                      <span style={{ fontSize: 9, letterSpacing: '.10em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, border: `1px solid ${sc.border}`, color: sc.color, fontWeight: 700 }}>{app.status}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,.30)' }}>{app.created_at?.slice(0, 10)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.60)', lineHeight: 1.6, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '4px 16px' }}>
                    {app.phone && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Phone:</b> {app.phone}</div>}
                    {app.email && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Email:</b> {app.email}</div>}
                    {app.instagram && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>IG:</b> {app.instagram}</div>}
                    {app.experience && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Experience:</b> {app.experience}</div>}
                    {app.english && app.english !== 'N/A' && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>English:</b> {app.english}</div>}
                    {app.fulltime && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Availability:</b> {app.fulltime}</div>}
                    {isBarber && app.license && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>License:</b> {app.license}</div>}
                    {isBarber && app.fade_level && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Fade:</b> {app.fade_level}</div>}
                    {isBarber && app.beard && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Beard:</b> {app.beard}</div>}
                    {!isBarber && !isAcademy && app.admin_experience && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Clients:</b> {app.admin_experience}</div>}
                    {!isBarber && !isAcademy && app.multitask && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Multitask:</b> {app.multitask}</div>}
                    {isAcademy && app.schedule && <div><b style={{ color: 'rgba(255,255,255,.40)' }}>Schedule:</b> {app.schedule}</div>}
                  </div>
                  {(app.motivation || app.message || app.barber_notes || app.admin_notes) && (
                    <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,.50)', fontStyle: 'italic' }}>{app.motivation || app.message || app.barber_notes || app.admin_notes}</div>
                  )}
                  {isOwnerOrAdmin && app.status === 'new' && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {['reviewed', 'interview', 'hired', 'rejected'].map(s => (
                        <button key={s} onClick={async () => { try { await apiFetch(`/api/applications/${app.id}`, { method: 'PATCH', body: JSON.stringify({ status: s }) }); loadApplications() } catch (e: any) { alert(e.message) } }}
                          style={{ height: 28, padding: '0 10px', borderRadius: 8, border: `1px solid ${(statusColors[s] || statusColors.new).border}`, background: (statusColors[s] || statusColors.new).bg, color: (statusColors[s] || statusColors.new).color, cursor: 'pointer', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'inherit' }}>{s}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : activeTab === 'requests' ? (
          <div className="msg-list" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {(role === 'barber') && (
              <div style={{ padding: '12px 14px', borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.03)', marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,.40)', lineHeight: 1.5 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.30)" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: 'middle', marginRight: 6 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Requests are created automatically when you change your schedule, photo, or profile in Calendar Settings.
              </div>
            )}
            {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Loading…</div>}
            {!loading && requests.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.20)' }}>
                <div style={{ marginBottom: 8 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12l2 2 4-4"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="17" x2="13" y2="17"/></svg></div>
                <div style={{ fontSize: 13 }}>No requests</div>
              </div>
            )}
            {requests.map(req => (
              <RequestCard key={req.id} req={req} isOwnerOrAdmin={isOwnerOrAdmin} onReview={reviewRequest} />
            ))}
          </div>
        ) : (
          <>
            <div ref={listRef} className="msg-list" onScroll={onScroll}
              style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12, paddingBottom: 8 }}>
              {loading && <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.25)', fontSize: 12 }}>Loading…</div>}
              {!loading && messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,.20)' }}>
                  <div style={{ marginBottom: 8 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
                  <div style={{ fontSize: 13 }}>No messages yet</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: 'rgba(255,255,255,.15)' }}>Be the first to say something!</div>
                </div>
              )}
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === uid} onImageClick={url => setLightboxUrl(url)} />
              ))}
            </div>
            {imagePreview && (
              <div style={{ padding: '8px 16px 0', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
                <img src={imagePreview} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,.14)' }} />
                <button onClick={() => setImagePreview('')} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid rgba(255,107,107,.30)', background: 'rgba(255,107,107,.08)', color: '#ffd0d0', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            )}
            <div style={{ padding: '8px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid rgba(255,255,255,.07)', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ width: 42, height: 42, borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleImageAttach(e.target.files?.[0] || null); e.target.value = '' }} />
              </label>
              <input className="msg-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }} placeholder="Type a message…"
                style={{ flex: 1, height: 42, borderRadius: 999, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.05)', color: '#fff', padding: '0 16px', outline: 'none', fontSize: 13, fontFamily: 'inherit' }} />
              <button onClick={sendMessage} disabled={sending || (!input.trim() && !imagePreview)}
                style={{ width: 42, height: 42, borderRadius: 999, border: '1px solid rgba(10,132,255,.55)', background: (input.trim() || imagePreview) ? 'rgba(10,132,255,.18)' : 'rgba(255,255,255,.04)', color: (input.trim() || imagePreview) ? '#d7ecff' : 'rgba(255,255,255,.25)', cursor: (input.trim() || imagePreview) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .15s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Image lightbox */}
      {lightboxUrl && (
        <div onClick={() => setLightboxUrl('')}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, cursor: 'zoom-out', padding: 16 }}>
          <img src={lightboxUrl} alt="" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} />
          <button onClick={() => setLightboxUrl('')}
            style={{ position: 'absolute', top: 20, right: 20, width: 40, height: 40, borderRadius: 999, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.50)', color: '#fff', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
      )}

      {/* New request modal */}
      {showNewRequest && <NewRequestModal onClose={() => setShowNewRequest(false)} onCreated={() => { setShowNewRequest(false); loadRequests() }} />}
    </Shell>
  )
}
