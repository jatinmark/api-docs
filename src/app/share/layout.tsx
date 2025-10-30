'use client'

import { ShareHeader } from '@/components/share/ShareHeader'

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ShareHeader />
      {children}
    </div>
  );
}