'use client'

import { useQuery } from '@tanstack/react-query'
import { DemoAPI, DemoStatus } from '@/lib/demo-api'
import { useAuth } from '@/contexts/AuthContext'

// Query Keys
export const demoKeys = {
  all: ['demo'] as const,
  status: () => [...demoKeys.all, 'status'] as const,
}

// Get demo status with caching
export function useDemoStatus() {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: demoKeys.status(),
    queryFn: async (): Promise<DemoStatus> => {
      if (!tokens?.access_token) {
        throw new Error('No access token available')
      }
      
      return await DemoAPI.getDemoStatus(tokens.access_token)
    },
    enabled: !!tokens?.access_token,
    staleTime: 1 * 60 * 1000, // 1 minute - demo status changes frequently
    gcTime: 2 * 60 * 1000, // 2 minutes in cache
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  })
}