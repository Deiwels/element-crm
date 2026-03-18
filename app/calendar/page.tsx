'use client'
import Shell from '@/components/Shell'

export default function CalendarPage() {
  return (
    <Shell page="calendar">
      <iframe
        src="https://element-barbershop.com/calendar"
        style={{ width: '100%', height: '100vh', border: 'none', display: 'block', background: '#000' }}
        allowFullScreen
      />
    </Shell>
  )
}
