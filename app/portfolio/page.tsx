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

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<string[]>([])
  const [barberId, setBarberId] = useState('')
  const [barberName, setBarberName] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}')
      const bid = user.barber_id || ''
      setBarberId(bid)
      setBarberName(user.name || '')
      if (!bid) { setLoading(false); return }
      const data = await apiFetch('/api/barbers')
      const list = Array.isArray(data) ? data : (data?.barbers || [])
      const me = list.find((b: any) => String(b.id) === String(bid))
      setPhotos(Array.isArray(me?.portfolio) ? me.portfolio : [])
    } catch (e: any) { showToast('Error: ' + e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          const MAX = 1200
          let w = img.width, h = img.height
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX }
            else { w = Math.round(w * MAX / h); h = MAX }
          }
          const canvas = document.createElement('canvas')
          canvas.width = w; canvas.height = h
          canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
          let q = 0.78, out = canvas.toDataURL('image/jpeg', q)
          while (out.length > 600000 && q > 0.3) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
          resolve(out)
        }
        img.onerror = reject
        img.src = reader.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length || !barberId) return
    setUploading(true)
    try {
      const newPhotos = [...photos]
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        if (file.size > 10 * 1024 * 1024) { showToast('Max 10MB per photo'); continue }
        const dataUrl = await compressImage(file)
        newPhotos.push(dataUrl)
      }
      setPhotos(newPhotos)
      // Save to server
      await apiFetch(`/api/barbers/${encodeURIComponent(barberId)}`, {
        method: 'PATCH', body: JSON.stringify({ portfolio: newPhotos })
      })
      showToast(`${files.length} photo${files.length > 1 ? 's' : ''} added ✓`)
    } catch (e: any) { showToast('Error: ' + e.message) }
    setUploading(false)
  }

  async function removePhoto(index: number) {
    const newPhotos = photos.filter((_, i) => i !== index)
    setPhotos(newPhotos)
    setSaving(true)
    try {
      await apiFetch(`/api/barbers/${encodeURIComponent(barberId)}`, {
        method: 'PATCH', body: JSON.stringify({ portfolio: newPhotos })
      })
      showToast('Photo removed')
    } catch (e: any) { showToast('Error: ' + e.message); load() }
    setSaving(false)
  }

  async function movePhoto(from: number, to: number) {
    if (to < 0 || to >= photos.length) return
    const newPhotos = [...photos]
    const [item] = newPhotos.splice(from, 1)
    newPhotos.splice(to, 0, item)
    setPhotos(newPhotos)
    try {
      await apiFetch(`/api/barbers/${encodeURIComponent(barberId)}`, {
        method: 'PATCH', body: JSON.stringify({ portfolio: newPhotos })
      })
    } catch { load() }
  }

  return (
    <Shell page="portfolio">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800;900&family=Julius+Sans+One&display=swap');
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:3px}
        @keyframes photoIn { 0% { opacity:0; transform:scale(.9) } 100% { opacity:1; transform:scale(1) } }
        .port-photo { animation: photoIn .3s ease both; }
        .port-photo:hover .port-overlay { opacity: 1 !important; }
        @media(max-width:640px) { .port-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.18em', textTransform: 'uppercase', fontSize: 15 }}>Portfolio</h2>
            <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,.40)', fontSize: 11, letterSpacing: '.08em' }}>
              {barberName ? `${barberName} — ${photos.length} photo${photos.length !== 1 ? 's' : ''}` : 'Your work gallery'}
            </p>
          </div>
          <label style={{
            height: 40, padding: '0 18px', borderRadius: 999,
            border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.10)',
            color: '#d7ecff', cursor: uploading ? 'wait' : 'pointer',
            fontWeight: 900, fontSize: 12, fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 0 14px rgba(10,132,255,.20)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {uploading ? 'Uploading…' : 'Add photos'}
            <input type="file" accept="image/*" multiple style={{ display: 'none' }} disabled={uploading}
              onChange={e => handleUpload(e.target.files)} />
          </label>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>Loading…</div>
          ) : !barberId ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 14 }}>No barber profile linked</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,.20)' }}>Ask admin to link your account to a barber profile</div>
            </div>
          ) : photos.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✂️</div>
              <div style={{ fontSize: 14 }}>No photos yet</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,.20)' }}>Add your best work to show on the website</div>
            </div>
          ) : (
            <div className="port-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {photos.map((url, i) => (
                <div key={i} className="port-photo" style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,.08)', aspectRatio: '1', animationDelay: `${i * 0.05}s` }}>
                  <img src={url} alt={`Work ${i + 1}`} onClick={() => setLightbox(url)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', display: 'block' }} />
                  <div className="port-overlay" style={{
                    position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.8) 0%, transparent 50%)',
                    opacity: 0, transition: 'opacity .2s ease', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: 8
                  }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {i > 0 && (
                        <button onClick={e => { e.stopPropagation(); movePhoto(i, i - 1) }}
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
                      )}
                      {i < photos.length - 1 && (
                        <button onClick={e => { e.stopPropagation(); movePhoto(i, i + 1) }}
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
                      )}
                    </div>
                    <button onClick={e => { e.stopPropagation(); removePhoto(i) }}
                      style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.15)', color: '#ffd0d0', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', fontSize: 11, color: 'rgba(255,255,255,.30)', lineHeight: 1.6 }}>
              💡 Hover over photos to reorder or delete. Photos show on the public website in your ABOUT section. Max 50 photos.
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(18px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, cursor: 'zoom-out', padding: 20 }}>
          <img src={lightbox} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', boxShadow: '0 20px 80px rgba(0,0,0,.6)' }} />
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,8,8,.92)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 999, padding: '10px 20px', boxShadow: '0 20px 60px rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(18px)', fontSize: 13, zIndex: 6000, whiteSpace: 'nowrap', color: '#e9e9e9', fontFamily: 'inherit' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: toast.includes('Error') ? '#ff6b6b' : '#8ff0b1', flexShrink: 0 }} />
          {toast}
        </div>
      )}
    </Shell>
  )
}
