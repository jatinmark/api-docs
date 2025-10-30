'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calliqAPI } from '@/lib/calliq-api'
import { ThreeKillerInsights } from '@/types/calliq'
import { useAuth } from '@/contexts/AuthContext'

// Query Keys
export const threeKillerInsightsKeys = {
  all: ['three-killer-insights'] as const,
  call: (callId: string) => [...threeKillerInsightsKeys.all, 'call', callId] as const,
  bulk: (callIds: string[]) => [...threeKillerInsightsKeys.all, 'bulk', callIds] as const,
}

// Get Three Killer Insights for a specific call
export function useThreeKillerInsights(callId: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: threeKillerInsightsKeys.call(callId),
    queryFn: () => calliqAPI.getThreeKillerInsights(callId),
    enabled: !!callId && !!tokens?.access_token,
    staleTime: 10 * 60 * 1000, // 10 minutes - insights are relatively stable
    gcTime: 30 * 60 * 1000,    // 30 minutes in cache
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}

// Get Three Killer Insights for multiple calls
export function useBulkThreeKillerInsights(callIds: string[]) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: threeKillerInsightsKeys.bulk(callIds),
    queryFn: () => calliqAPI.getBulkThreeKillerInsights(callIds),
    enabled: callIds.length > 0 && !!tokens?.access_token,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })
}

// Refresh insights for a call (triggers re-generation)
export function useRefreshThreeKillerInsights() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (callId: string) => {
      // This would trigger a re-generation on the backend
      return calliqAPI.getThreeKillerInsights(callId)
    },
    onSuccess: (data, callId) => {
      // Invalidate and refetch the insights
      queryClient.invalidateQueries({ 
        queryKey: threeKillerInsightsKeys.call(callId) 
      })
      
      // Also invalidate the call details if they include insights
      queryClient.invalidateQueries({ 
        queryKey: ['calliq', 'calls', callId] 
      })
    }
  })
}

// Prefetch insights for multiple calls (for dashboard optimization)
export function usePrefetchThreeKillerInsights() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()
  
  return async (callIds: string[]) => {
    if (!tokens?.access_token) return
    
    // Prefetch insights for each call
    await Promise.all(
      callIds.map(callId => 
        queryClient.prefetchQuery({
          queryKey: threeKillerInsightsKeys.call(callId),
          queryFn: () => calliqAPI.getThreeKillerInsights(callId),
          staleTime: 10 * 60 * 1000,
        })
      )
    )
  }
}