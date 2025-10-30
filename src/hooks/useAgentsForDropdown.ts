'use client'

import { useQuery } from '@tanstack/react-query'
import { AgentAPI } from '@/lib/agent-api'
import { useAuth } from '@/contexts/AuthContext'
import { agentKeys } from './useAgents'

// Specialized hook for fetching agents for dropdowns
// Uses aggressive caching and only fetches when needed
export function useAgentsForDropdown(enabled: boolean = true) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: [...agentKeys.list({ dropdown: true })], // Special key for dropdown data
    queryFn: async () => {
      if (!tokens?.access_token) {
        throw new Error('No access token available')
      }

      // Fetch with a higher limit for dropdowns
      // But use pagination if we have too many agents
      const response = await AgentAPI.getAgents(tokens.access_token, {
        per_page: 100, // Reasonable limit for dropdowns
        page: 1,
        // Only fetch essential fields if API supports it
      })

      return response
    },
    enabled: !!tokens?.access_token && enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes - dropdowns don't need frequent updates
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    refetchOnWindowFocus: false, // Don't refetch on window focus for dropdowns
    refetchOnMount: false, // Use cache if available
  })
}