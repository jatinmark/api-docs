'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { CallAPI } from '@/lib/call-api'
import { useAuth } from '@/contexts/AuthContext'

// Query Keys
export const callKeys = {
  all: ['calls'] as const,
  history: () => [...callKeys.all, 'history'] as const,
  historyList: (filters: Record<string, any>) => [...callKeys.history(), filters] as const,
  metrics: () => [...callKeys.all, 'metrics'] as const,
  metricsList: (filters: Record<string, any>) => [...callKeys.metrics(), filters] as const,
}

// Get call history with filtering and caching
export function useCallHistory(filters: {
  agent_id?: string
  outcome?: 'answered' | 'no_answer' | 'failed'
  start_date?: string
  end_date?: string
  search?: string
  page?: number
  per_page?: number
} = {}, options: { enabled?: boolean } = {}) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: callKeys.historyList(filters),
    queryFn: () => CallAPI.getCallHistory(tokens?.access_token || '', filters),
    enabled: options.enabled !== undefined ? (options.enabled && !!tokens?.access_token) : !!tokens?.access_token,
    staleTime: 1 * 60 * 1000, // 1 minute - call data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    // Removed auto-refresh - using SSE for real-time updates instead
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  })
}

// Get call metrics with caching
export function useCallMetrics(filters: {
  agent_id?: string
  start_date?: string
  end_date?: string
} = {}) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: callKeys.metricsList(filters),
    queryFn: () => CallAPI.getCallMetrics(tokens?.access_token || '', filters),
    enabled: !!tokens?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes - metrics update less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes in cache
    // Removed auto-refresh - using SSE for real-time updates instead
  })
}

// Schedule call mutation
export function useScheduleCall() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadId: string) => 
      CallAPI.scheduleCall(leadId, tokens?.access_token || ''),
    onSuccess: () => {
      // Invalidate call history and metrics to show new call
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
      queryClient.invalidateQueries({ queryKey: callKeys.metrics() })
      
      // Also invalidate leads since lead status may have changed
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    }
  })
}