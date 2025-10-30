import { useMemo } from 'react'
import { formatDate, formatDuration } from '@/lib/utils'

interface CallHistoryItem {
  id: string
  call_id?: string
  lead_id: string
  agent_id: string
  lead_name: string
  lead_phone: string
  agent_name: string
  agent_region?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  outcome?: 'answered' | 'no_answer' | 'failed'
  duration_seconds?: number
  transcript_url?: string
  summary?: string
  created_at: string
  raw_webhook_data?: Record<string, any>
  retell_call_id?: string
  bolna_call_id?: string
  provider?: string
  call_type?: string
  aiInsightId?: string
  ai_insights?: {
    call_type?: 'first_call' | 'follow_up' | 'closing_call' | 'check_in'
    customer_sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
    user_extraction_fields?: Record<string, any>
    ai_extraction_fields?: Record<string, any>
    next_action_items?: string[]
    objections?: Record<string, string>
    pain_points?: string[]
    competitor_mentions?: string[]
    call_outcome?: 'answered_interested' | 'answered_not_interested' | 'callback_requested' | 'voicemail' | 'busy' | 'no_answer' | 'do_not_call' | 'wrong_number' | 'technical_issue'
  }
}

// Pre-computed style maps for instant lookup
const OUTCOME_STYLES = {
  'answered': 'bg-green-100 text-green-800',
  'no_answer': 'bg-yellow-100 text-yellow-800',
  'failed': 'bg-red-100 text-red-800',
  'default': 'bg-gray-100 text-gray-800'
} as const

const SENTIMENT_STYLES = {
  'positive': 'bg-green-100 text-green-800',
  'negative': 'bg-red-100 text-red-800',
  'neutral': 'bg-gray-100 text-gray-800',
  'mixed': 'bg-yellow-100 text-yellow-800',
  'default': 'bg-gray-100 text-gray-800'
} as const

const STATUS_STYLES = {
  'completed': 'text-green-600',
  'in_progress': 'text-blue-600',
  'failed': 'text-red-600',
  'pending': 'text-gray-600',
  'default': 'text-gray-600'
} as const

const AI_OUTCOME_STYLES = {
  'successful': 'bg-green-100 text-green-800',
  'answered_interested': 'bg-green-100 text-green-800',
  'failed': 'bg-red-100 text-red-800',
  'answered_not_interested': 'bg-red-100 text-red-800',
  'not_interested': 'bg-red-100 text-red-800',
  'rejected_ai': 'bg-red-200 text-red-900',
  'follow_up': 'bg-blue-100 text-blue-800',
  'callback_requested': 'bg-blue-100 text-blue-800',
  'voicemail': 'bg-yellow-100 text-yellow-800',
  'busy': 'bg-orange-100 text-orange-800',
  'no_answer': 'bg-gray-100 text-gray-800',
  'no_meaningful_engagement': 'bg-gray-100 text-gray-800',
  'do_not_call': 'bg-purple-100 text-purple-800',
  'wrong_number': 'bg-pink-100 text-pink-800',
  'technical_issue': 'bg-indigo-100 text-indigo-800',
  'default': 'bg-gray-100 text-gray-800'
} as const

const CALL_TYPE_STYLES = {
  'inbound': 'bg-green-100 text-green-800',
  'outbound': 'bg-blue-100 text-blue-800',
  'default': 'bg-blue-100 text-blue-800'
} as const

// Pre-compute formatted field names
const formatFieldNameCached = (() => {
  const cache = new Map<string, string>()
  return (name: string): string => {
    if (cache.has(name)) {
      return cache.get(name)!
    }
    const formatted = name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    cache.set(name, formatted)
    return formatted
  }
})()

// Pre-format text transformations
const formatTextCached = (() => {
  const cache = new Map<string, string>()
  return (text: string | undefined, type: 'underscore' | 'capitalize' | 'both'): string => {
    if (!text) return ''
    const key = `${text}:${type}`
    if (cache.has(key)) {
      return cache.get(key)!
    }

    let formatted = text
    if (type === 'underscore' || type === 'both') {
      formatted = formatted.replace(/_/g, ' ')
    }
    if (type === 'capitalize' || type === 'both') {
      formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1)
    }
    if (type === 'both') {
      formatted = formatted.replace(/\b\w/g, l => l.toUpperCase())
    }

    cache.set(key, formatted)
    return formatted
  }
})()

export interface OptimizedCallData extends CallHistoryItem {
  // Pre-computed display values
  displayDate: string
  displayAgentName: string
  displayLeadName: string
  displayLeadPhone: string
  displayStatus: string
  displayStatusClass: string
  displayDuration: string
  displayCallType: string
  displayCallTypeClass: string

  // Pre-computed AI insights
  displayAICallType?: string
  displaySentiment?: string
  displaySentimentClass: string
  displayCallOutcome?: string
  displayCallOutcomeClass: string
  displayOutcomeClass: string

  // Pre-computed complex fields
  hasAIExtractionFields: boolean
  aiFieldsCount: number
  aiFieldsPreview: Array<{ key: string; value: string }>
  hasNextActions: boolean
  nextActionsCount: number
}

export function useCallTableData(calls: CallHistoryItem[]): OptimizedCallData[] {
  return useMemo(() => {
    return calls.map(call => {
      // Pre-compute all display values
      const displayDate = formatDate(call.created_at, call.agent_region)
      const displayAgentName = call.agent_name || 'Unknown Agent'
      const displayLeadName = call.lead_name || 'Unknown Lead'
      const displayLeadPhone = call.lead_phone || 'N/A'
      const displayStatus = call.status?.replace('_', ' ') || ''
      const displayStatusClass = `text-xs font-medium ${STATUS_STYLES[call.status] || STATUS_STYLES.default}`
      const displayDuration = call.duration_seconds ? formatDuration(call.duration_seconds) : '-'

      // Call type - normalize to standard types
      const normalizeCallType = (type: string | undefined): string => {
        if (!type) return 'Outbound'
        const normalized = type.toLowerCase()
        // Map known types
        if (normalized === 'inbound') return 'Inbound'
        if (normalized === 'outbound') return 'Outbound'
        // For any other value (like phone_call), default to Outbound
        return 'Outbound'
      }

      const displayCallType = normalizeCallType(call.call_type)
      const callTypeForStyle = displayCallType.toLowerCase() as keyof typeof CALL_TYPE_STYLES
      const displayCallTypeClass = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        CALL_TYPE_STYLES[callTypeForStyle] || CALL_TYPE_STYLES.default
      }`

      // AI insights
      const displayAICallType = call.ai_insights?.call_type
        ? formatTextCached(call.ai_insights.call_type, 'both')
        : undefined

      const displaySentiment = call.ai_insights?.customer_sentiment
        ? formatTextCached(call.ai_insights.customer_sentiment, 'capitalize')
        : undefined
      const displaySentimentClass = `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        SENTIMENT_STYLES[call.ai_insights?.customer_sentiment as keyof typeof SENTIMENT_STYLES] || SENTIMENT_STYLES.default
      }`

      const displayCallOutcome = call.ai_insights?.call_outcome
        ? formatTextCached(call.ai_insights.call_outcome, 'both')
        : call.outcome
        ? formatTextCached(call.outcome, 'underscore')
        : undefined

      const displayCallOutcomeClass = call.ai_insights?.call_outcome
        ? `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            AI_OUTCOME_STYLES[call.ai_insights.call_outcome as keyof typeof AI_OUTCOME_STYLES] || AI_OUTCOME_STYLES.default
          }`
        : `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            OUTCOME_STYLES[call.outcome as keyof typeof OUTCOME_STYLES] || OUTCOME_STYLES.default
          }`

      const displayOutcomeClass = OUTCOME_STYLES[call.outcome as keyof typeof OUTCOME_STYLES] || OUTCOME_STYLES.default

      // Pre-compute AI extraction fields
      const aiFields = call.ai_insights?.ai_extraction_fields || {}
      const validAIFields = Object.entries(aiFields)
        .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      const hasAIExtractionFields = validAIFields.length > 0
      const aiFieldsCount = validAIFields.length
      const aiFieldsPreview = validAIFields
        .slice(0, 2)
        .map(([key, value]) => ({
          key: formatFieldNameCached(key),
          value: String(value)
        }))

      // Pre-compute next actions with safety
      const hasNextActions = !!(call.ai_insights?.next_action_items && Array.isArray(call.ai_insights.next_action_items) && call.ai_insights.next_action_items.length > 0)
      const nextActionsCount = (call.ai_insights?.next_action_items && Array.isArray(call.ai_insights.next_action_items)) ? call.ai_insights.next_action_items.length : 0

      return {
        ...call,
        displayDate,
        displayAgentName,
        displayLeadName,
        displayLeadPhone,
        displayStatus,
        displayStatusClass,
        displayDuration,
        displayCallType,
        displayCallTypeClass,
        displayAICallType,
        displaySentiment,
        displaySentimentClass,
        displayCallOutcome,
        displayCallOutcomeClass,
        displayOutcomeClass,
        hasAIExtractionFields,
        aiFieldsCount,
        aiFieldsPreview,
        hasNextActions,
        nextActionsCount
      }
    })
  }, [calls])
}

// Export style constants for use in components
export { formatFieldNameCached }