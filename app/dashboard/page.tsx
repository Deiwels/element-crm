'use client'
import { useEffect, useRef } from 'react'
import { wrapInShell } from '@/lib/shell'
import { pageContent } from './content'

export default function DashboardPage() {
  const divRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!divRef.current) return
    const scripts = Array.from(divRef.current.querySelectorAll('script'))
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = oldScript.textContent
      oldScript.parentNode?.replaceChild(newScript, oldScript)
    })
  }, [])

  // Dashboard has no sidebar of its own, so we wrap it in the shell
  const html = wrapInShell('dashboard', pageContent)
  return (
    <div
      ref={divRef}
      style={{ minHeight: '100vh', background: '#000' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
