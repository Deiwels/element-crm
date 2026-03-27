'use client'
import Shell from '@/components/Shell'
import { useEffect, useState, useCallback, useRef } from 'react'

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

// ─── Photo Editor Modal ──────────────────────────────────────────────────────
function PhotoEditor({ src, onSave, onClose }: { src: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [filter, setFilter] = useState('none')
  const [rotation, setRotation] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const FILTERS = [
    { id: 'none', label: 'Original', css: '' },
    { id: 'bw', label: 'B&W', css: 'grayscale(100%)' },
    { id: 'sepia', label: 'Sepia', css: 'sepia(80%)' },
    { id: 'contrast', label: 'Contrast', css: 'contrast(130%) saturate(110%)' },
    { id: 'warm', label: 'Warm', css: 'sepia(25%) saturate(130%) brightness(105%)' },
    { id: 'cool', label: 'Cool', css: 'saturate(80%) hue-rotate(15deg) brightness(105%)' },
    { id: 'vivid', label: 'Vivid', css: 'saturate(160%) contrast(110%)' },
    { id: 'fade', label: 'Fade', css: 'saturate(70%) brightness(110%) contrast(90%)' },
  ]

  useEffect(() => {
    const img = new Image()
    img.onload = () => { imgRef.current = img; drawCanvas() }
    img.src = src
  }, [src])

  useEffect(() => { drawCanvas() }, [filter, rotation])

  function drawCanvas() {
    const canvas = canvasRef.current; const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    const rotated = rotation % 180 !== 0
    canvas.width = rotated ? img.height : img.width
    canvas.height = rotated ? img.width : img.height
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    const f = FILTERS.find(f => f.id === filter)
    if (f?.css) ctx.filter = f.css
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
    ctx.restore()
  }

  function handleSave() {
    const canvas = canvasRef.current; if (!canvas) return
    const MAX = 1200
    let w = canvas.width, h = canvas.height
    if (w > MAX || h > MAX) {
      if (w > h) { h = Math.round(h * MAX / w); w = MAX } else { w = Math.round(w * MAX / h); h = MAX }
    }
    const out = document.createElement('canvas'); out.width = w; out.height = h
    out.getContext('2d')!.drawImage(canvas, 0, 0, w, h)
    let q = 0.80, dataUrl = out.toDataURL('image/jpeg', q)
    while (dataUrl.length > 600000 && q > 0.3) { q -= 0.08; dataUrl = out.toDataURL('image/jpeg', q) }
    onSave(dataUrl)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.90)', backdropFilter: 'blur(24px)', zIndex: 6000, display: 'flex', flexDirection: 'column', fontFamily: 'Inter,sans-serif', color: '#e9e9e9' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={onClose} style={{ height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit' }}>Cancel</button>
        <div style={{ fontWeight: 900, fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase' }}>Edit Photo</div>
        <button onClick={handleSave} style={{ height: 34, padding: '0 14px', borderRadius: 999, border: '1px solid rgba(10,132,255,.55)', background: 'rgba(10,132,255,.12)', color: '#d7ecff', cursor: 'pointer', fontWeight: 900, fontSize: 12, fontFamily: 'inherit' }}>Save</button>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 16 }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, objectFit: 'contain' }} />
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <button onClick={() => setRotation(r => (r + 90) % 360)} style={{ height: 36, padding: '0 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12, fontFamily: 'inherit', marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: 'middle', marginRight: 6 }}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Rotate
        </button>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              flexShrink: 0, width: 64, height: 64, borderRadius: 12, overflow: 'hidden', border: `2px solid ${filter === f.id ? 'rgba(10,132,255,.65)' : 'rgba(255,255,255,.08)'}`, background: '#000', cursor: 'pointer', position: 'relative', padding: 0, boxShadow: filter === f.id ? '0 0 12px rgba(10,132,255,.25)' : 'none', transition: 'all .2s ease'
            }}>
              <img src={src} alt={f.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css || 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,.7)', padding: '3px 0', fontSize: 8, fontWeight: 700, letterSpacing: '.04em', textAlign: 'center', color: filter === f.id ? '#d7ecff' : 'rgba(255,255,255,.60)' }}>{f.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const [photos, setPhotos] = useState<string[]>([])
  const [barberId, setBarberId] = useState('')
  const [barberName, setBarberName] = useState('')
  const [barbers, setBarbers] = useState<{ id: string; name: string; photo?: string }[]>([])
  const [isOwnerOrAdmin, setIsOwnerOrAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editingPhoto, setEditingPhoto] = useState<{ index: number; src: string } | null>(null)

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const loadBarbers = useCallback(async () => {
    try {
      const data = await apiFetch('/api/barbers')
      const list = (Array.isArray(data) ? data : (data?.barbers || [])).map((b: any) => ({ id: String(b.id), name: String(b.name || ''), photo: b.photo_url || '', portfolio: Array.isArray(b.portfolio) ? b.portfolio : [] }))
      setBarbers(list)
      return list
    } catch { return [] }
  }, [])

  const load = useCallback(async (overrideBarberId?: string) => {
    setLoading(true)
    try {
      const user = JSON.parse(localStorage.getItem('ELEMENT_USER') || '{}')
      const role = user.role || 'barber'
      const ownerAdmin = role === 'owner' || role === 'admin'
      setIsOwnerOrAdmin(ownerAdmin)

      const list = await loadBarbers()
      const bid = overrideBarberId || (ownerAdmin ? (list[0]?.id || '') : (user.barber_id || ''))
      setBarberId(bid)

      const found = list.find((b: any) => b.id === bid)
      setBarberName(found?.name || user.name || '')
      setPhotos(Array.isArray((found as any)?.portfolio) ? (found as any).portfolio : [])
    } catch (e: any) { showToast('Error: ' + e.message) }
    setLoading(false)
  }, [loadBarbers])

  function switchBarber(bid: string) {
    const found = barbers.find(b => b.id === bid)
    setBarberId(bid)
    setBarberName(found?.name || '')
    setPhotos(Array.isArray((found as any)?.portfolio) ? (found as any).portfolio : [])
  }

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
        @keyframes emptyFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .port-photo { animation: photoIn .3s ease both; transition: transform .25s ease; }
        .port-photo:hover { transform: scale(1.03); }
        .port-photo:hover .port-overlay { opacity: 1 !important; }
        .port-shimmer { background: linear-gradient(90deg, rgba(255,255,255,.04) 25%, rgba(255,255,255,.08) 50%, rgba(255,255,255,.04) 75%); background-size: 200% 100%; animation: shimmer 1.5s ease-in-out infinite; }
        @media(max-width:640px) { .port-grid { grid-template-columns: repeat(2,1fr) !important; } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', color: '#e9e9e9', fontFamily: 'Inter,system-ui,sans-serif' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', background: 'rgba(0,0,0,.80)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'sticky', top: 0, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          {/* Barber selector for owner/admin */}
          {isOwnerOrAdmin && barbers.length > 0 && (
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {barbers.map(b => (
                <button key={b.id} onClick={() => switchBarber(b.id)}
                  style={{ height: 32, padding: '0 12px', borderRadius: 999, border: `1px solid ${barberId === b.id ? 'rgba(10,132,255,.50)' : 'rgba(255,255,255,.08)'}`, background: barberId === b.id ? 'rgba(10,132,255,.12)' : 'rgba(255,255,255,.03)', color: barberId === b.id ? '#d7ecff' : 'rgba(255,255,255,.50)', cursor: 'pointer', fontWeight: 800, fontSize: 11, fontFamily: 'inherit', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s ease', flexShrink: 0 }}>
                  {b.photo && <img src={b.photo} alt="" style={{ width: 18, height: 18, borderRadius: 999, objectFit: 'cover' }} />}
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>Loading…</div>
          ) : !barberId ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>
              <div style={{ marginBottom: 12, animation: 'emptyFloat 3s ease-in-out infinite' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>
              <div style={{ fontSize: 14 }}>No barber profile linked</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,.20)' }}>Ask admin to link your account to a barber profile</div>
            </div>
          ) : photos.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,.30)' }}>
              <div style={{ marginBottom: 12, animation: 'emptyFloat 3s ease-in-out infinite' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg></div>
              <div style={{ fontSize: 14 }}>No photos yet</div>
              <div style={{ fontSize: 12, marginTop: 4, color: 'rgba(255,255,255,.20)' }}>Add your best work to show on the website</div>
            </div>
          ) : (
            <div className="port-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {uploading && (
                <div className="port-shimmer" style={{ borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', aspectRatio: '1' }} />
              )}
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
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
                      )}
                      {i < photos.length - 1 && (
                        <button onClick={e => { e.stopPropagation(); movePhoto(i, i + 1) }}
                          style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,255,255,.20)', background: 'rgba(0,0,0,.6)', color: '#fff', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={e => { e.stopPropagation(); setEditingPhoto({ index: i, src: url }) }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(10,132,255,.35)', background: 'rgba(10,132,255,.15)', color: '#d7ecff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={e => { e.stopPropagation(); removePhoto(i) }}
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid rgba(255,107,107,.35)', background: 'rgba(255,107,107,.15)', color: '#ffd0d0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.06)', background: 'rgba(255,255,255,.02)', fontSize: 11, color: 'rgba(255,255,255,.30)', lineHeight: 1.6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.40)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/></svg>Hover over photos to reorder or delete. Photos show on the public website in your ABOUT section. Max 50 photos.
            </div>
          )}
        </div>
      </div>

      {/* Photo Editor */}
      {editingPhoto && (
        <PhotoEditor
          src={editingPhoto.src}
          onClose={() => setEditingPhoto(null)}
          onSave={async (dataUrl) => {
            const newPhotos = [...photos]
            newPhotos[editingPhoto.index] = dataUrl
            setPhotos(newPhotos)
            setEditingPhoto(null)
            try {
              await apiFetch(`/api/barbers/${encodeURIComponent(barberId)}`, {
                method: 'PATCH', body: JSON.stringify({ portfolio: newPhotos })
              })
              showToast('Photo updated')
            } catch (e: any) { showToast('Error: ' + (e?.message || '')); load() }
          }}
        />
      )}

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
