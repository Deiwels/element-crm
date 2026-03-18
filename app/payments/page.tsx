'use client'
import Shell from '@/components/Shell'

export default function PaymentsPage() {
  return (
    <Shell page="payments">
      <iframe
        src="https://element-barbershop.com/payments"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
