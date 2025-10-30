import type { Metadata } from 'next'
import { Inter, Lexend } from 'next/font/google'
import { Suspense } from 'react'
import { ClientProviders } from '@/components/providers/ClientProviders'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })
const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend'
})

export const metadata: Metadata = {
  title: 'ConversAI Labs Admin Panel',
  description: 'Admin panel for managing ConversAI Labs sales agents',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${lexend.variable}`}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}