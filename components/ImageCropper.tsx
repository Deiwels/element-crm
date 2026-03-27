'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

interface ImageCropperProps {
  src: string
  onSave: (croppedDataUrl: string) => void
  onClose: () => void
  shape?: 'circle' | 'square'
}

const CROP_SIZE = 280
const OUTPUT_SIZE = 800
const MIN_SCALE = 1.0
const MAX_SCALE = 3.0

export default function ImageCropper({ src, onSave, onClose, shape = 'square' }: ImageCropperProps) {
  const [scale, setScale] = useState(1.0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 })
  const pinchStart = useRef({ dist: 0, scale: 1 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Fade in on mount
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])

  // Load image dimensions
  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const fitted = fitImage(img.width, img.height, CROP_SIZE)
      setImgSize({ w: fitted.w, h: fitted.h })
      // Center the image
      setOffset({ x: (CROP_SIZE - fitted.w) / 2, y: (CROP_SIZE - fitted.h) / 2 })
    }
    img.src = src
  }, [src])

  function fitImage(iw: number, ih: number, box: number) {
    // Scale so the shorter side fills the crop box
    const s = Math.max(box / iw, box / ih)
    return { w: Math.round(iw * s), h: Math.round(ih * s) }
  }

  // Clamp offset so image always covers the crop area
  const clamp = useCallback((ox: number, oy: number, s: number) => {
    const sw = imgSize.w * s
    const sh = imgSize.h * s
    const maxX = 0
    const minX = CROP_SIZE - sw
    const maxY = 0
    const minY = CROP_SIZE - sh
    return {
      x: Math.min(maxX, Math.max(minX, ox)),
      y: Math.min(maxY, Math.max(minY, oy)),
    }
  }, [imgSize])

  // Mouse drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }, [offset])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [dragging, scale, clamp])

  // Touch drag + pinch zoom
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]
      dragStart.current = { x: t.clientX, y: t.clientY, ox: offset.x, oy: offset.y }
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchStart.current = { dist: Math.hypot(dx, dy), scale }
    }
  }, [offset, scale])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const t = e.touches[0]
      const dx = t.clientX - dragStart.current.x
      const dy = t.clientY - dragStart.current.y
      setOffset(clamp(dragStart.current.ox + dx, dragStart.current.oy + dy, scale))
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStart.current.scale * (dist / pinchStart.current.dist)))
      setScale(newScale)
      // Adjust offset to keep image covering crop area
      setOffset(prev => clamp(prev.x, prev.y, newScale))
    }
  }, [scale, clamp])

  // Scale change via slider — re-center and clamp
  const handleScaleChange = useCallback((newScale: number) => {
    setScale(newScale)
    setOffset(prev => {
      // Keep center point stable
      const cx = (CROP_SIZE / 2 - prev.x) / (imgSize.w * scale)
      const cy = (CROP_SIZE / 2 - prev.y) / (imgSize.h * scale)
      const nx = CROP_SIZE / 2 - cx * imgSize.w * newScale
      const ny = CROP_SIZE / 2 - cy * imgSize.h * newScale
      return clamp(nx, ny, newScale)
    })
  }, [imgSize, scale, clamp])

  // Save: render to canvas
  const handleSave = useCallback(() => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')!
      // Calculate how the visible crop area maps to the original image
      const fitted = fitImage(img.width, img.height, CROP_SIZE)
      const drawScale = scale * (fitted.w / img.width)
      const outScale = OUTPUT_SIZE / CROP_SIZE
      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        offset.x * outScale,
        offset.y * outScale,
        img.width * drawScale * outScale,
        img.height * drawScale * outScale
      )
      let q = 0.85
      let out = canvas.toDataURL('image/jpeg', q)
      while (out.length > 900000 && q > 0.35) { q -= 0.08; out = canvas.toDataURL('image/jpeg', q) }
      onSave(out)
    }
    img.src = src
  }, [src, offset, scale, imgSize, onSave])

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,.70)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
    opacity: visible ? 1 : 0,
    transition: 'opacity .25s ease',
  }

  const modal: React.CSSProperties = {
    width: 'min(360px, 100%)',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,.10)',
    background: 'rgba(0,0,0,.65)',
    backdropFilter: 'saturate(180%) blur(40px)', WebkitBackdropFilter: 'saturate(180%) blur(40px)',
    color: '#e9e9e9', fontFamily: 'Inter,sans-serif',
    boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 0 0 0.5px rgba(255,255,255,.06)',
    overflow: 'hidden',
    transform: visible ? 'scale(1)' : 'scale(0.95)',
    transition: 'transform .25s ease',
  }

  const cropBorder = shape === 'circle' ? '50%' : '16px'

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="image-cropper-root" style={modal}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ fontFamily: '"Julius Sans One",sans-serif', letterSpacing: '.16em', textTransform: 'uppercase', fontSize: 12 }}>Position photo</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(255,255,255,.10)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Crop area */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 12px' }}>
          <div style={{ position: 'relative', width: CROP_SIZE, height: CROP_SIZE }}>
            {/* Image container */}
            <div
              ref={containerRef}
              onMouseDown={onMouseDown}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={() => {}}
              style={{
                width: CROP_SIZE, height: CROP_SIZE,
                overflow: 'hidden',
                borderRadius: cropBorder,
                cursor: dragging ? 'grabbing' : 'grab',
                touchAction: 'none',
                position: 'relative',
                border: '2px solid rgba(255,255,255,.18)',
                boxShadow: '0 0 0 4000px rgba(0,0,0,.45)',
              }}
            >
              {imgSize.w > 0 && (
                <img
                  src={src}
                  alt=""
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: 0, top: 0,
                    width: imgSize.w, height: imgSize.h,
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                />
              )}
            </div>
            {/* Crosshair guides */}
            <div style={{ position: 'absolute', top: '50%', left: 12, right: 12, height: 1, background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', left: '50%', top: 12, bottom: 12, width: 1, background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{ padding: '4px 28px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={0.01}
            value={scale}
            onChange={e => handleScaleChange(parseFloat(e.target.value))}
            style={{
              flex: 1, height: 4, appearance: 'none', WebkitAppearance: 'none',
              background: `linear-gradient(to right, rgba(255,255,255,.35) ${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%, rgba(255,255,255,.10) ${((scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE)) * 100}%)`,
              borderRadius: 2, outline: 'none', cursor: 'pointer',
            }}
          />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            <line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/>
          </svg>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <button onClick={onClose} style={{
            flex: 1, height: 42, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.12)',
            background: 'rgba(255,255,255,.06)',
            color: 'rgba(255,255,255,.65)', cursor: 'pointer',
            fontWeight: 900, fontSize: 13, fontFamily: 'inherit',
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            flex: 1, height: 42, borderRadius: 12,
            border: '1px solid rgba(255,255,255,.25)',
            background: 'rgba(255,255,255,.12)',
            color: '#fff', cursor: 'pointer',
            fontWeight: 900, fontSize: 13, fontFamily: 'inherit',
          }}>Save</button>
        </div>

        {/* Slider thumb styling */}
        <style>{`
          .image-cropper-root input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none; appearance: none;
            width: 20px; height: 20px; border-radius: 50%;
            background: #fff; border: 2px solid rgba(0,0,0,.25);
            box-shadow: 0 2px 8px rgba(0,0,0,.4);
            cursor: pointer;
          }
          .image-cropper-root input[type=range]::-moz-range-thumb {
            width: 20px; height: 20px; border-radius: 50%;
            background: #fff; border: 2px solid rgba(0,0,0,.25);
            box-shadow: 0 2px 8px rgba(0,0,0,.4);
            cursor: pointer;
          }
        `}</style>
      </div>
    </div>
  )
}
