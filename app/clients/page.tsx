'use client'
import Shell from '@/components/Shell'

export default function ClientsPage() {
  return (
    <Shell page="clients">
      <iframe
        src="https://element-barbershop.com/clients"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
