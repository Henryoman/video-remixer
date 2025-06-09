import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Video Remixer',
  description: 'Upload and remix short videos with AI-powered effects',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
