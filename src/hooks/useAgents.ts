'use client'

import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AgentAPI } from '@/lib/agent-api'
import { Agent } from '@/types'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'

// Import CreateAgentRequest type from agent-api
type CreateAgentRequest = Parameters<typeof AgentAPI.createAgent>[0]

// Query Keys
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
  voices: () => [...agentKeys.all, 'voices'] as const,
}

// Global agent cache - single source of truth for ALL pages
export function useAllAgents() {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: ['agents', 'all'], // Unified key - shared across entire app
    queryFn: async () => {
      if (!tokens?.access_token) {
        throw new Error('No access token available')
      }
      const response = await AgentAPI.getAgents(tokens.access_token, {
        per_page: 100, // Backend max limit
        page: 1
      })
      return response
    },
    enabled: !!tokens?.access_token,
    staleTime: 30 * 60 * 1000, // 30min - agents change rarely
    gcTime: 60 * 60 * 1000, // 1hr in cache
    refetchOnWindowFocus: false, // Reduce unnecessary refreshes
  })
}

// Client-side filtering/pagination using global cache
export function useAgents(options?: {
  page?: number
  per_page?: number
  status_filter?: 'active' | 'inactive'
}) {
  const { tokens } = useAuth()

  // Always use global cache - NO separate cache entries
  const allAgentsQuery = useAllAgents()

  // Client-side filtering and pagination
  const filteredData = useMemo(() => {
    if (!allAgentsQuery.data) return { agents: [], total: 0 }

    let agents = allAgentsQuery.data.agents || []

    // 1. Client-side status filtering
    if (options?.status_filter) {
      agents = agents.filter(agent => agent.status === options.status_filter)
    }

    const total = agents.length

    // 2. Client-side pagination (for agents management page)
    if (options?.page && options?.per_page) {
      const start = (options.page - 1) * options.per_page
      agents = agents.slice(start, start + options.per_page)
    }

    return { agents, total }
  }, [allAgentsQuery.data, options?.status_filter, options?.page, options?.per_page])

  return {
    ...allAgentsQuery,
    data: filteredData
  }
}

// Get single agent
export function useAgent(agentId: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: agentKeys.detail(agentId),
    queryFn: () => AgentAPI.getAgent(agentId, tokens?.access_token || ''),
    enabled: !!tokens?.access_token && !!agentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get voices (cached separately for reuse)
export function useVoices() {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: agentKeys.voices(),
    queryFn: () => AgentAPI.getVoices(tokens?.access_token || ''),
    enabled: !!tokens?.access_token,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours - voices are static
    gcTime: 48 * 60 * 60 * 1000, // 48 hours in cache
  })
}

// Create agent mutation
export function useCreateAgent() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (agentData: CreateAgentRequest) =>
      AgentAPI.createAgent(agentData, tokens?.access_token || ''),
    onSuccess: (newAgent) => {
      // Add to global agent cache immediately (optimistic update)
      queryClient.setQueryData(['agents', 'all'], (old: any) => {
        if (!old) return old
        return {
          ...old,
          agents: [...(old.agents || []), newAgent],
          total: (old.total || 0) + 1
        }
      })

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['agents', 'all'] })

      // Invalidate demo status to update the banner
      queryClient.invalidateQueries({ queryKey: ['demo', 'status'] })
    },
    onError: () => {
      // On error, invalidate to refetch correct data
      queryClient.invalidateQueries({ queryKey: ['agents', 'all'] })
    }
  })
}

// Update agent mutation
export function useUpdateAgent() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ agentId, agentData }: { agentId: string, agentData: Partial<Agent> }) => {
      
      return AgentAPI.updateAgent(agentId, agentData, tokens?.access_token || '')
    },
    onMutate: async ({ agentId, agentData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['agents', 'all'] })
      await queryClient.cancelQueries({ queryKey: agentKeys.detail(agentId) })

      // Snapshot previous values
      const previousAgents = queryClient.getQueryData(['agents', 'all'])
      const previousAgent = queryClient.getQueryData(agentKeys.detail(agentId))

      // Optimistically update global agents cache
      queryClient.setQueryData(['agents', 'all'], (old: any) => {
        if (!old || !old.agents) return old
        return {
          ...old,
          agents: old.agents.map((agent: Agent) =>
            agent.id === agentId ? { ...agent, ...agentData } : agent
          )
        }
      })

      // Optimistically update single agent
      queryClient.setQueryData(agentKeys.detail(agentId), (old: Agent) =>
        old ? { ...old, ...agentData } : old
      )

      return { previousAgents, previousAgent }
    },
    onError: (err, variables, context) => {
      logger.error('[useUpdateAgent] Mutation error:', err)
      // Rollback optimistic updates
      if (context?.previousAgents) {
        queryClient.setQueryData(['agents', 'all'], context.previousAgents)
      }
      if (context?.previousAgent) {
        queryClient.setQueryData(agentKeys.detail(variables.agentId), context.previousAgent)
      }
    },
    onSettled: (data, error, { agentId }) => {
      // Ensure consistency by refetching
      queryClient.invalidateQueries({ queryKey: ['agents', 'all'] })
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) })
    }
  })
}

// Toggle agent status mutation
export function useToggleAgentStatus() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (agentId: string) =>
      AgentAPI.toggleAgentStatus(agentId, tokens?.access_token || ''),
    onMutate: async (agentId) => {
      await queryClient.cancelQueries({ queryKey: ['agents', 'all'] })

      const previousAgents = queryClient.getQueryData(['agents', 'all'])

      // Optimistically toggle status in global cache
      queryClient.setQueryData(['agents', 'all'], (old: any) => {
        if (!old || !old.agents) return old
        return {
          ...old,
          agents: old.agents.map((agent: Agent) =>
            agent.id === agentId
              ? { ...agent, status: agent.status === 'active' ? 'inactive' : 'active' }
              : agent
          )
        }
      })

      return { previousAgents }
    },
    onError: (err, agentId, context) => {
      if (context?.previousAgents) {
        queryClient.setQueryData(['agents', 'all'], context.previousAgents)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', 'all'] })
    }
  })
}

// Fetch agent prompt hook
export function useAgentPrompt(agentId: string | null) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: ['agent-prompt', agentId],
    queryFn: async () => {
      if (!tokens?.access_token || !agentId) {
        throw new Error('No access token or agent ID available')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/agents/${agentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch agent data: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Agent Data Response:', data)
      return data
    },
    enabled: !!tokens?.access_token && !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Delete agent mutation
export function useDeleteAgent() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (agentId: string) =>
      AgentAPI.deleteAgent(agentId, tokens?.access_token || ''),
    onSuccess: (_, agentId) => {
      // Remove individual agent cache
      queryClient.removeQueries({ queryKey: agentKeys.detail(agentId) })

      // Invalidate global cache to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['agents', 'all'] })

      // Invalidate demo status to update the banner
      queryClient.invalidateQueries({ queryKey: ['demo', 'status'] })
    }
  })
}