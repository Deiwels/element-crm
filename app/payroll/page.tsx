'use client'
import Shell from '@/components/Shell'

export default function PayrollPage() {
  return (
    <Shell page="payroll">
      <iframe
        src="https://element-barbershop.com/payroll"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
