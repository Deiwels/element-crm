'use client'
import { useEffect, useState } from 'react'
import Shell from '@/components/Shell'

export default function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('ELEMENT_TOKEN')
    setToken(t)
    console.log('ELEMENT_TOKEN:', t ? t.substring(0, 30) + '...' : 'NULL')
    console.log('ELEMENT_USER:', localStorage.getItem('ELEMENT_USER'))
  }, [])

  return (
    <Shell page="dashboard">
      <div style={{ padding: 20, color: '#fff', fontSize: 12, fontFamily: 'monospace' }}>
        Token: {token ? token.substring(0, 40) + '...' : 'NOT FOUND'}
      </div>
      <iframe
        src="https://element-barbershop.com/crm"
        style={{ width: '100%', height: 'calc(100vh - 60px)', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
