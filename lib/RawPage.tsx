'use client'
export default function RawPage({ html }: { html: string }) {
  return (
    <div
      style={{ minHeight: '100vh', background: '#000' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
