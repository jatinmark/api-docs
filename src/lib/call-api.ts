const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

interface CallHistoryResponse {
  id: string
  call_id?: string  // Primary call identifier for AI insights matching
  lead_id: string | null  // Can be null for inbound calls without lead
  agent_id: string
  lead_name: string
  lead_phone: string
  agent_name: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  outcome?: 'answered' | 'no_answer' | 'failed'
  duration_seconds?: number
  transcript_url?: string
  summary?: string
  created_at: string
  raw_webhook_data?: Record<string, any>
  retell_call_id?: string  // Retell provider call ID
  bolna_call_id?: string   // Bolna provider call ID
  provider?: string        // Call provider name
  call_type?: string  // 'inbound' or 'outbound'
  ai_insights?: {
    call_type?: 'first_call' | 'follow_up' | 'closing_call' | 'check_in'
    customer_sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
    call_outcome?: 'successful' | 'failed' | 'follow_up' | 'rejected_ai' | 'wrong_number' | 'not_interested' | 'no_meaningful_engagement' | 'answered_interested' | 'answered_not_interested' | 'callback_requested' | 'voicemail' | 'busy' | 'no_answer' | 'do_not_call' | 'technical_issue'
    user_extraction_fields?: Record<string, any>
    ai_extraction_fields?: Record<string, any>
    next_action_items?: string[]
    objections?: Record<string, string>
    pain_points?: string[]
    competitor_mentions?: string[]
  }
}

interface CallHistoryListResponse {
  calls: CallHistoryResponse[]
  total: number
  page: number
  per_page: number
}

interface CallMetricsResponse {
  total_calls: number
  answered_calls: number
  no_answer_calls: number
  failed_calls: number
  pickup_rate: number
  average_attempts_per_lead: number
  active_agents: number
}

export class CallAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  static async getCallHistory(
    accessToken: string,
    options: {
      agent_id?: string
      outcome?: 'answered' | 'no_answer' | 'failed'
      start_date?: string
      end_date?: string
      search?: string
      page?: number
      per_page?: number
    } = {}
  ): Promise<CallHistoryListResponse> {
    const params = new URLSearchParams()
    if (options.agent_id) params.append('agent_id', options.agent_id)
    if (options.outcome) params.append('outcome', options.outcome)
    if (options.start_date) params.append('start_date', options.start_date)
    if (options.end_date) params.append('end_date', options.end_date)
    if (options.search) params.append('search', options.search)
    if (options.page) params.append('page', options.page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())

    const response = await fetch(`${API_BASE_URL}/calls/history?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch call history')
    }

    const data: CallHistoryListResponse = await response.json()
    return data
  }

  static async getCallMetrics(
    accessToken: string,
    options: {
      agent_id?: string
      start_date?: string
      end_date?: string
    } = {}
  ): Promise<CallMetricsResponse> {
    const params = new URLSearchParams()
    if (options.agent_id) params.append('agent_id', options.agent_id)
    if (options.start_date) params.append('start_date', options.start_date)
    if (options.end_date) params.append('end_date', options.end_date)

    const response = await fetch(`${API_BASE_URL}/calls/metrics?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch call metrics')
    }

    return response.json()
  }

  static async scheduleCall(leadId: string, accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/calls/schedule`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify({ lead_id: leadId }),
    })

    if (!response.ok) {
      const error = await response.json()
      // Pass through the detailed error message from the backend
      const errorMessage = error.detail || 'Failed to schedule call'
      const errorObj = new Error(errorMessage)
      // Attach status code for additional context if needed
      ;(errorObj as any).statusCode = response.status
      throw errorObj
    }

    return response.json()
  }

}