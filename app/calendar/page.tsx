'use client'
import { useEffect, useRef } from 'react'
import { pageContent } from './content'

export default function CalendarPage() {
  const divRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!divRef.current) return
    // Re-execute scripts after React renders the HTML
    const scripts = Array.from(divRef.current.querySelectorAll('script'))
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = oldScript.textContent
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }, [])

  return (
    <div
      ref={divRef}
      style={{ minHeight: '100vh', background: '#000', overflow: 'hidden' }}
      dangerouslySetInnerHTML={{ __html: pageContent }}
    />
  )
}
