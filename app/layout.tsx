import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/Toast'

export const metadata: Metadata = {
  title: 'Guj-Gyani — Adaptive Gujarati Learning',
  description:
    'Learn Gujarati the smart way. An adaptive 40-level platform with five question types — built for true mastery.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text-1 min-w-0 overflow-x-hidden">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
