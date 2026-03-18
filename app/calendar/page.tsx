'use client'
import Shell from '@/components/Shell'

export default function CalendarPage() {
  return (
    <Shell page="calendar">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'rgba(255,255,255,.40)', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 40 }}>📅</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Calendar</div>
        <div style={{ fontSize: 13 }}>Coming soon</div>
      </div>
    </Shell>
  )
}
