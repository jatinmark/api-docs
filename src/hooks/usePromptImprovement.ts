'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PromptImprovementAPI } from '@/lib/prompt-improvement-api'
import {
  GenerateImprovementsRequest,
  ApplyImprovementsRequest,
  RollbackPromptRequest,
  RejectImprovementsRequest,
  ComparePromptsParams,
  ImprovePromptFromCallRequest,
} from '@/types/prompt-improvement'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

// Query Keys
export const promptImprovementKeys = {
  all: ['prompt-improvement'] as const,
  history: (agentId: string) => [...promptImprovementKeys.all, 'history', agentId] as const,
  compare: (agentId: string, params: ComparePromptsParams) =>
    [...promptImprovementKeys.all, 'compare', agentId, params] as const,
}

/**
 * Get prompt history and improvement suggestions
 */
export function usePromptHistory(agentId: string | null) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: promptImprovementKeys.history(agentId || ''),
    queryFn: () =>
      PromptImprovementAPI.getPromptHistory(agentId!, tokens?.access_token || ''),
    enabled: !!tokens?.access_token && !!agentId,
    staleTime: 1 * 60 * 1000, // 1 minute - history changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes in cache
  })
}

/**
 * Compare two prompt versions or compare with suggestion
 */
export function useComparePrompts(
  agentId: string | null,
  params: ComparePromptsParams | null
) {
  const { tokens } = useAuth()

  return useQuery({
    queryKey: promptImprovementKeys.compare(agentId || '', params || {}),
    queryFn: () =>
      PromptImprovementAPI.comparePrompts(
        agentId!,
        params!,
        tokens?.access_token || ''
      ),
    enabled: !!tokens?.access_token && !!agentId && !!params,
    staleTime: 5 * 60 * 1000, // 5 minutes - comparisons are static
  })
}

/**
 * Generate prompt improvements from transcript
 */
export function useGenerateImprovements(agentId: string) {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (data: GenerateImprovementsRequest) =>
      PromptImprovementAPI.generateImprovements(
        agentId,
        data,
        tokens?.access_token || ''
      ),
    onSuccess: () => {
      // Invalidate history to show the new suggestion
      queryClient.invalidateQueries({
        queryKey: promptImprovementKeys.history(agentId),
      })
      toast.success('Improvements generated successfully!')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to generate improvements')
    },
  })
}

/**
 * Generate prompt improvements from existing call
 * Uses call_id instead of requiring manual transcript input
 */
export function useImprovePromptFromCall(agentId: string) {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (data: ImprovePromptFromCallRequest) =>
      PromptImprovementAPI.improvePromptFromCall(
        agentId,
        data,
        tokens?.access_token || ''
      ),
    onSuccess: () => {
      // Invalidate history to show the new suggestion
      queryClient.invalidateQueries({
        queryKey: promptImprovementKeys.history(agentId),
      })
      toast.success('Call analyzed successfully! Review the suggested improvements.')
    },
    onError: (error: any) => {
      // Provide specific error messages based on common error types
      const message = error?.message || 'Failed to analyze call'
      if (message.includes('transcript')) {
        toast.error('This call does not have a transcript available')
      } else if (message.includes('not found')) {
        toast.error('Call not found in call history')
      } else if (message.includes('OpenAI')) {
        toast.error('AI Assistant not configured. Please contact support.')
      } else {
        toast.error(message)
      }
    },
  })
}

/**
 * Apply selected improvements to prompt
 */
export function useApplyImprovements(agentId: string) {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (data: ApplyImprovementsRequest) =>
      PromptImprovementAPI.applyImprovements(agentId, data, tokens?.access_token || ''),
    onSuccess: (response) => {
      // Invalidate history to show the new version
      queryClient.invalidateQueries({
        queryKey: promptImprovementKeys.history(agentId),
      })
      // Invalidate ALL agent-related queries to show updated prompt
      queryClient.invalidateQueries({ queryKey: ['agents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'detail', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agent-prompt', agentId] })
      toast.success(
        `Improvements applied successfully! Now on version ${response.new_version}`
      )
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to apply improvements')
    },
  })
}

/**
 * Rollback to a previous prompt version
 */
export function useRollbackPrompt(agentId: string) {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (data: RollbackPromptRequest) =>
      PromptImprovementAPI.rollbackPrompt(agentId, data, tokens?.access_token || ''),
    onSuccess: (response) => {
      // Invalidate history to update current version
      queryClient.invalidateQueries({
        queryKey: promptImprovementKeys.history(agentId),
      })
      // Invalidate ALL agent-related queries to show rolled back prompt
      queryClient.invalidateQueries({ queryKey: ['agents', 'list'] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'detail', agentId] })
      queryClient.invalidateQueries({ queryKey: ['agent-prompt', agentId] })
      toast.success(response.message)
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to rollback prompt')
    },
  })
}

/**
 * Reject/dismiss a prompt improvement suggestion
 */
export function useRejectImprovements(agentId: string) {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: (data: RejectImprovementsRequest) =>
      PromptImprovementAPI.rejectImprovements(agentId, data, tokens?.access_token || ''),
    onSuccess: () => {
      // Invalidate history to remove rejected suggestion from UI
      queryClient.invalidateQueries({
        queryKey: promptImprovementKeys.history(agentId),
      })
      toast.success('Suggestion dismissed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to dismiss suggestion')
    },
  })
}
