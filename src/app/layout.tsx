import type { Metadata } from 'next'
import './globals.css'

export const metadata = {
  title: 'HealthHub - Digital Healthcare Platform',
  description: 'Connecting patients with healthcare providers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-surfaceAlt text-ink">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
