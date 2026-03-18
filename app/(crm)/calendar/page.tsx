'use client'

import { useEffect } from 'react'

// Calendar is still on Tilda during migration
// Will be replaced with full Next.js component in next phase
export default function CalendarPage() {
  useEffect(() => {
    window.location.href = 'https://element-barbershop.com/calendar'
  }, [])

  return (
    <div className="flex items-center justify-center h-full p-10">
      <div className="text-white/40 text-sm tracking-widest uppercase">Redirecting to Calendar…</div>
    </div>
  )
}
