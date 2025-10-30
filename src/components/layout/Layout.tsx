'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { DemoBanner } from '@/components/ui/DemoBanner'
import { SupportAccessBanner } from './SupportAccessBanner'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <SupportAccessBanner />
        <div className="p-6">
          <DemoBanner />
          {children}
        </div>
      </main>
    </div>
  )
}