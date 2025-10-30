'use client'

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { LeadAPI } from '@/lib/lead-api'
import { Lead, UpdateLeadRequest } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import {
  createOptimisticLead,
  addOptimisticLeadToList,
  replaceTemporaryLead
} from '@/lib/optimistic-helpers'

// Query Keys
export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...leadKeys.lists(), filters] as const,
  details: () => [...leadKeys.all, 'detail'] as const,
  detail: (id: string) => [...leadKeys.details(), id] as const,
}

// Get leads with filtering and caching
export function useLeads(filters: {
  agent_id?: string
  status_filter?: 'new' | 'in_progress' | 'done' | 'stopped'
  search?: string
  page?: number
  per_page?: number
} = {}, options: { enabled?: boolean } = {}) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => LeadAPI.getLeads(tokens?.access_token || '', filters),
    enabled: options.enabled !== undefined ? (options.enabled && !!tokens?.access_token) : !!tokens?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes - leads change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
    placeholderData: keepPreviousData, // Keep previous data while fetching new data
  })
}

// Get single lead
export function useLead(leadId: string) {
  const { tokens } = useAuth()
  
  return useQuery({
    queryKey: leadKeys.detail(leadId),
    queryFn: () => LeadAPI.getLead(leadId, tokens?.access_token || ''),
    enabled: !!tokens?.access_token && !!leadId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

// Create lead mutation with full optimistic updates
export function useCreateLead() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadData: {
      agent_id: string
      first_name: string
      phone_e164: string
      custom_fields?: Record<string, any>
      schedule_at?: string
    }) => LeadAPI.createLead(leadData, tokens?.access_token || ''),
    onMutate: async (leadData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })

      // Create optimistic lead
      const optimisticLead = createOptimisticLead(leadData)

      // Snapshot previous values for all list queries
      const previousLists = queryClient.getQueriesData({ queryKey: leadKeys.lists() })

      // Update all list caches with the optimistic lead
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        return addOptimisticLeadToList(old, optimisticLead)
      })

      return { optimisticLead, previousLists }
    },
    onSuccess: (newLead, variables, context) => {
      // Replace temporary lead with real lead in all caches
      if (context?.optimisticLead) {
        queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
          return replaceTemporaryLead(old, context.optimisticLead.id, newLead)
        })
      }

      // Add to detail cache
      queryClient.setQueryData(leadKeys.detail(newLead.id), newLead)
    },
    onError: (err, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    }
  })
}

// Update lead mutation with enhanced optimistic updates
export function useUpdateLead() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ leadId, leadData }: {
      leadId: string,
      leadData: UpdateLeadRequest
    }) => LeadAPI.updateLead(leadId, leadData, tokens?.access_token || ''),
    onMutate: async ({ leadId, leadData }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) })
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })

      // Snapshot previous values
      const previousLead = queryClient.getQueryData(leadKeys.detail(leadId))
      const previousLists = queryClient.getQueriesData({ queryKey: leadKeys.lists() })

      // Optimistically update single lead cache
      queryClient.setQueryData(leadKeys.detail(leadId), (old: Lead) =>
        old ? { ...old, ...leadData } : old
      )

      // Optimistically update lead in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === leadId ? { ...lead, ...leadData } : lead
          )
        }
      })

      return { previousLead, previousLists }
    },
    onSuccess: (updatedLead, { leadId }) => {
      // Update with actual server response in detail cache
      queryClient.setQueryData(leadKeys.detail(leadId), updatedLead)

      // Update with actual server response in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === leadId ? updatedLead : lead
          )
        }
      })
    },
    onError: (err, { leadId }, context) => {
      // Rollback optimistic updates for detail view
      if (context?.previousLead) {
        queryClient.setQueryData(leadKeys.detail(leadId), context.previousLead)
      }

      // Rollback optimistic updates for all list views
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, { leadId }) => {
      // Ensure consistency by refetching
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    }
  })
}

// Delete lead mutation (simple version - not used in UI currently)
export function useDeleteLead() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadAPI.deleteLead(leadId, tokens?.access_token || ''),
    onSuccess: (_, leadId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: leadKeys.detail(leadId) })

      // Invalidate lists to ensure fresh data
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    }
  })
}

// Schedule call mutation
export function useScheduleCall() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ leadId, voicebotServer }: { leadId: string; voicebotServer?: 'india' | 'us' }) =>
      LeadAPI.scheduleCall(leadId, tokens?.access_token || '', voicebotServer),
    onMutate: async ({ leadId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) })
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })
      
      // Optimistically update lead status to in_progress in detail cache
      queryClient.setQueryData(leadKeys.detail(leadId), (old: Lead) => 
        old ? { ...old, status: 'in_progress' as const } : old
      )
      
      // Optimistically update lead status in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) => 
            lead.id === leadId ? { ...lead, status: 'in_progress' as const } : lead
          )
        }
      })
    },
    onSuccess: (_, { leadId }) => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })

      // Also invalidate call history since new call was created
      queryClient.invalidateQueries({ queryKey: ['calls'] })
    },
    onError: (err, { leadId }) => {
      // Invalidate to get correct state
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    }
  })
}

// CSV Import mutation
export function useImportLeadsCSV() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ file, agentId }: { file: File, agentId: string }) =>
      LeadAPI.startCSVImport(file, agentId, tokens?.access_token || ''),
    onSuccess: () => {
      // Invalidate all lead lists to show imported leads
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    }
  })
}

// Stop lead mutation
export function useStopLead() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ leadId, disposition }: { leadId: string, disposition?: string }) => 
      LeadAPI.stopLead(leadId, tokens?.access_token || '', disposition),
    onMutate: async ({ leadId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) })
      
      // Optimistically update lead status to stopped
      queryClient.setQueryData(leadKeys.detail(leadId), (old: Lead) => 
        old ? { ...old, status: 'stopped' as const } : old
      )
    },
    onSuccess: (_, { leadId }) => {
      // Invalidate related caches
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    },
    onError: (err, { leadId }) => {
      // Invalidate to get correct state
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    }
  })
}

// Request OTP verification mutation
export function useRequestVerification() {
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadId: string) => 
      LeadAPI.requestVerification(leadId, tokens?.access_token || ''),
  })
}

// Verify lead with OTP mutation
export function useVerifyLead() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: ({ leadId, verificationId, otpCode }: {
      leadId: string,
      verificationId: string,
      otpCode: string
    }) =>
      LeadAPI.verifyLead(leadId, verificationId, otpCode, tokens?.access_token || ''),
    onSuccess: (verifiedLead) => {
      // Update the lead in cache with verified status
      queryClient.setQueryData(leadKeys.detail(verifiedLead.id), verifiedLead)

      // Update lead in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === verifiedLead.id ? verifiedLead : lead
          )
        }
      })

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    }
  })
}

// Pause sales cycle mutation
export function usePauseSalesCycle() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadAPI.pauseSalesCycle(leadId, tokens?.access_token || ''),
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) })
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })

      // Snapshot previous values
      const previousLead = queryClient.getQueryData(leadKeys.detail(leadId))
      const previousLists = queryClient.getQueriesData({ queryKey: leadKeys.lists() })

      // Optimistically update lead sales cycle status to paused in detail cache
      queryClient.setQueryData(leadKeys.detail(leadId), (old: Lead) =>
        old ? { ...old, sales_cycle_status: 'paused' as const } : old
      )

      // Optimistically update lead sales cycle status in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === leadId ? { ...lead, sales_cycle_status: 'paused' as const } : lead
          )
        }
      })

      return { previousLead, previousLists }
    },
    onSuccess: (updatedLead) => {
      // Update with actual server response in detail cache
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead)

      // Update with actual server response in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === updatedLead.id ? updatedLead : lead
          )
        }
      })
    },
    onError: (err, leadId, context) => {
      // Rollback optimistic updates for detail view
      if (context?.previousLead) {
        queryClient.setQueryData(leadKeys.detail(leadId), context.previousLead)
      }

      // Rollback optimistic updates for all list views
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, leadId) => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    }
  })
}

// Resume sales cycle mutation
export function useResumeSalesCycle() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (leadId: string) =>
      LeadAPI.resumeSalesCycle(leadId, tokens?.access_token || ''),
    onMutate: async (leadId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: leadKeys.detail(leadId) })
      await queryClient.cancelQueries({ queryKey: leadKeys.lists() })

      // Snapshot previous values
      const previousLead = queryClient.getQueryData(leadKeys.detail(leadId))
      const previousLists = queryClient.getQueriesData({ queryKey: leadKeys.lists() })

      // Optimistically update lead sales cycle status to active in detail cache
      queryClient.setQueryData(leadKeys.detail(leadId), (old: Lead) =>
        old ? { ...old, sales_cycle_status: 'active' as const } : old
      )

      // Optimistically update lead sales cycle status in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === leadId ? { ...lead, sales_cycle_status: 'active' as const } : lead
          )
        }
      })

      return { previousLead, previousLists }
    },
    onSuccess: (updatedLead) => {
      // Update with actual server response in detail cache
      queryClient.setQueryData(leadKeys.detail(updatedLead.id), updatedLead)

      // Update with actual server response in all list caches
      queryClient.setQueriesData({ queryKey: leadKeys.lists() }, (old: any) => {
        if (!old?.leads) return old
        return {
          ...old,
          leads: old.leads.map((lead: Lead) =>
            lead.id === updatedLead.id ? updatedLead : lead
          )
        }
      })
    },
    onError: (err, leadId, context) => {
      // Rollback optimistic updates for detail view
      if (context?.previousLead) {
        queryClient.setQueryData(leadKeys.detail(leadId), context.previousLead)
      }

      // Rollback optimistic updates for all list views
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (data, error, leadId) => {
      // Ensure consistency
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId) })
    }
  })
}