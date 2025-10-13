import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mediconnect - Digital Healthcare Platform',
  description: 'Connecting patients, healthcare providers, and pharmacies through secure digital solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-gray-50 text-gray-900">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}
