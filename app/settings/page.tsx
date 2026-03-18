'use client'
import Shell from '@/components/Shell'

export default function SettingsPage() {
  return (
    <Shell page="settings">
      <iframe
        src="https://element-barbershop.com/settings"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
