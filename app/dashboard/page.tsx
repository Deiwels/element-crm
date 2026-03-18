'use client'
import Shell from '@/components/Shell'

export default function DashboardPage() {
  return (
    <Shell page="dashboard">
      <iframe
        src="https://element-barbershop.com/crm"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
