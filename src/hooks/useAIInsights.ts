import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { AIInsight, AIInsightsResponse, AIInsightFilters, AIInsightStats } from '@/types'
import { logger } from '@/lib/logger'
import { useAuth } from '@/contexts/AuthContext'

const QUERY_KEY = 'ai-insights'

export function useAIInsights(filters?: AIInsightFilters) {
  const { tokens } = useAuth()
  const params = new URLSearchParams()

  if (filters) {
    if (filters.agentId) params.append('agent_id', filters.agentId)
    if (filters.sentiment) params.append('sentiment', filters.sentiment)
    if (filters.minInterestLevel) params.append('min_interest_level', filters.minInterestLevel.toString())
    if (filters.maxInterestLevel) params.append('max_interest_level', filters.maxInterestLevel.toString())
    if (filters.startDate) params.append('start_date', filters.startDate)
    if (filters.endDate) params.append('end_date', filters.endDate)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.perPage) params.append('per_page', filters.perPage.toString())
  }

  return useQuery<AIInsightsResponse>({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
      // logger.info('Fetching AI insights', { filters })
      const response = await apiClient.get<AIInsightsResponse>(`/ai-insights/all?${params.toString()}`)
      return response
    },
    enabled: !!tokens?.access_token,
    staleTime: 60 * 1000, // 1 minute
    retry: 2
    // Real-time updates via SSE instead of polling
  })
}

export function useAIInsightDetail(insightId: string) {
  const { tokens } = useAuth()

  return useQuery<AIInsight>({
    queryKey: [QUERY_KEY, insightId],
    queryFn: async () => {
      logger.info('Fetching AI insight detail', { insightId })
      const response = await apiClient.get<any>(`/ai-insights/${insightId}`)

      // The API now returns the insights data directly, not wrapped in ai_insights
      // We need to wrap it in the expected structure for backward compatibility
      const transformedResponse: AIInsight = {
        ...response,
        ai_insights: response.ai_insights || response // If ai_insights exists use it, otherwise use the whole response
      }

      return transformedResponse
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!insightId && !!tokens?.access_token
  })
}

export function useAIInsightStats(startDate?: string, endDate?: string) {
  const { tokens } = useAuth()
  const params = new URLSearchParams()
  if (startDate) params.append('start_date', startDate)
  if (endDate) params.append('end_date', endDate)

  return useQuery<AIInsightStats>({
    queryKey: [QUERY_KEY, 'stats', startDate, endDate],
    queryFn: async () => {
      logger.info('Fetching AI insight stats')
      const response = await apiClient.get<AIInsightStats>(`/ai-insights/stats/summary?${params.toString()}`)
      return response
    },
    enabled: !!tokens?.access_token,
    staleTime: 60 * 1000 // 1 minute
  })
}