'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { callKeys } from './useCalls'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

interface TestCallData {
  agentId: string
  leadData: {
    first_name: string
    phone_e164: string
    agent_id: string
    custom_fields: Record<string, any>
  }
}

export function useTestCall() {
  const queryClient = useQueryClient()
  const { tokens } = useAuth()

  return useMutation({
    mutationFn: async ({ agentId, leadData }: TestCallData) => {
      const response = await fetch(`${API_BASE_URL}/agents/${agentId}/test-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to initiate test call')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate call history to show new call
      queryClient.invalidateQueries({ queryKey: callKeys.history() })
      queryClient.invalidateQueries({ queryKey: callKeys.metrics() })
    }
  })
}