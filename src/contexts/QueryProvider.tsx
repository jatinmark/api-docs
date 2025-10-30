'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time - how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache time - how long inactive data stays in memory
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Retry failed requests
        retry: (failureCount, error: any) => {
          // Don't retry on 401/403 (auth errors)
          if (error?.status === 401 || error?.status === 403) {
            return false
          }
          return failureCount < 3
        },
        // Refetch on window focus (for real-time data)
        refetchOnWindowFocus: true,
        // Background refetch interval for active queries
        refetchInterval: 5 * 60 * 1000, // 5 minutes for active queries
      },
      mutations: {
        retry: false, // Don't retry mutations by default
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}