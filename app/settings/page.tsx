'use client'
import Shell from '@/components/Shell'
import { useEffect, useState } from 'react'

const API = 'https://element-crm-api-431945333485.us-central1.run.app'

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ELEMENT_TOKEN')
    if (!token) return
    fetch(`${API}/api/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setSettings(d.settings || d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <Shell page="settings">
      <div style={{ padding: 24, color: '#e9e9e9', fontFamily: 'Inter, sans-serif', overflowY: 'auto', height: '100vh' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Settings</h2>
        {loading ? <div style={{ color: 'rgba(255,255,255,.40)' }}>Loading…</div> : (
          <pre style={{ background: 'rgba(255,255,255,.04)', padding: 20, borderRadius: 12, fontSize: 12, color: 'rgba(255,255,255,.70)', overflow: 'auto' }}>
            {JSON.stringify(settings, null, 2)}
          </pre>
        )}
      </div>
    </Shell>
  )
}
