'use client'

import { ReactNode } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryProvider } from '@/contexts/QueryProvider'
import { ProcessingProvider, ProcessingIndicator } from '@/contexts/ProcessingContext'
import { Toaster } from 'react-hot-toast'

interface ClientProvidersProps {
  children: ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ProcessingProvider>
          {children}
          <ProcessingIndicator />
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
            }}
          />
        </ProcessingProvider>
      </AuthProvider>
    </QueryProvider>
  )
}