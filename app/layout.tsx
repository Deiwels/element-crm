import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Element CRM',
  description: 'Element Barbershop Staff Portal',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,      // ← disable pinch zoom on mobile
  userScalable: false,  // ← disable pinch zoom on mobile
  viewportFit: 'cover', // ← allows env(safe-area-inset-*) to work in Safari
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#000', overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
