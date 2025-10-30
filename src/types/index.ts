export interface User {
  id: string
  email: string
  name: string
  phone?: string
  google_id: string
  role?: 'super_admin' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  admin_user_id: string
  max_agents_limit: number
  max_concurrent_calls: number
  total_minutes_limit?: number
  total_minutes_used: number
  max_contact_attempts: number // New field for max attempts limit
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

// Agent Basic Information - Only fields used in UI modal
export interface AgentBasicInfo {
  agent_name: string
  intended_role: string
  target_industry: string
  company_name?: string
  primary_service?: string
  ultimate_goal?: string
}

// Simplified Agent Configuration - Only what's actually used
export interface AgentConfiguration {
  basic_info: AgentBasicInfo
  extraction_fields?: string[]
}

export interface ConversationStep {
  id: string
  text: string
  next?: string[]
}

export interface Agent {
  id: string
  company_id: string
  name: string
  status: 'active' | 'inactive'
  prompt: string
  parsed_sections?: {
    header?: string
    role?: string
    conversationFlow?: string
    supportingSections?: string
    compliance?: string
  }
  variables: Record<string, any>
  welcome_message: string
  voice_id: string
  functions: string[]
  region: 'indian' | 'international' | 'internal_india' | 'internal_us' | 'worldwide'
  inbound_phone?: string
  outbound_phone?: string
  max_attempts: number
  retry_delay_minutes: number
  business_hours_start: string
  business_hours_end: string
  timezone: string
  max_call_duration_minutes: number
  retell_agent_id?: string
  retell_llm_id?: string
  provider_agent_id?: string
  provider_metadata?: Record<string, any>
  conversationFlow?: ConversationStep[]
  // WhatsApp configuration
  channels?: ('voice' | 'whatsapp')[]
  whatsapp_config?: {
    phone_number?: string
    business_account_id?: string
    webhook_url?: string
    template_ids?: string[]
    auto_reply_enabled?: boolean
    handoff_enabled?: boolean
  }
  // Sales cycle configuration
  enable_sales_cycle?: boolean
  default_call_days?: number[]
  sales_cycle_config?: {
    enable_ai_insights?: boolean
    stages?: string[]
  }
  // New comprehensive configuration
  configuration?: AgentConfiguration
  configuration_data?: any  // This is the actual field from backend
  website_data?: {
    website_url?: string
    generated_faqs?: any[]
    business_context?: string
    tasks?: string
  }
  created_at: string
  updated_at: string
}

export interface Lead {
  id: string
  agent_id: string
  first_name: string
  phone_e164: string
  status: 'new' | 'in_progress' | 'done' | 'stopped'
  custom_fields: Record<string, any>
  schedule_at: string
  attempts_count: number
  disposition?: string
  created_at: string
  updated_at: string
  is_verified?: boolean
  verification_method?: 'otp' | null
  verified_at?: string | null

  // Sales cycle information
  sales_cycle_id?: string
  sales_cycle_status?: 'active' | 'paused' | 'completed' | 'cancelled'
  sales_cycle_next_call?: string
}

export interface UpdateLeadRequest {
  first_name?: string
  phone_e164?: string
  agent_id?: string
  custom_fields?: Record<string, any>
  schedule_at?: string
}

export interface InteractionAttempt {
  id: string
  lead_id: string | null  // Can be null for inbound calls without lead
  agent_id: string
  attempt_number: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  outcome?: 'answered' | 'no_answer' | 'failed'
  summary?: string
  duration_seconds?: number
  transcript_url?: string
  raw_webhook_data: Record<string, any>
  retell_call_id?: string
  bolna_call_id?: string
  call_id?: string // Call ID from AI insights endpoint
  provider?: string
  created_at: string
  updated_at: string
  // Related data from API
  lead_name?: string
  lead_phone?: string
  agent_name?: string
  call_type?: string
  // AI Insights embedded in the call data
  ai_insights?: AIInsightData
}

export interface Template {
  id: string
  name: string
  industry: string
  use_case: string
  agent_name_template: string
  prompt_template: string
  variables: string[]
  functions: string[]
  welcome_message: string
  max_attempts: number
  retry_delay_minutes: number
  business_hours_start: string
  business_hours_end: string
  max_call_duration_minutes: number
}

export interface Voice {
  id: string
  name: string
  gender: 'male' | 'female'
  language: string
  country?: string
  description?: string
  retell_voice_id: string
}

// AI Insights Data - the actual insights object embedded in calls
export interface AIInsightData {
  // Basic insights
  call_purpose?: string
  call_type?: 'first_call' | 'follow_up' | 'closing_call' | 'check_in'
  sentiment?: 'positive' | 'negative' | 'neutral'
  interest_level?: number
  summary?: string
  key_points?: string[]
  objections?: Record<string, string>  // Changed from array to object mapping objection text to category

  // Actions
  next_action?: 'follow_up' | 'close' | 'nurture' | 'do_not_call'
  next_action_items?: string[]
  recommended_stage?: 'initial_contact' | 'qualified_lead' | 'interested' | 'negotiation' | 'closed_won' | 'closed_lost' | 'do_not_call'

  // Callback info
  callback_requested?: boolean
  callback_time?: string | null

  // DNC flag
  do_not_call?: boolean

  // Advanced insights
  call_outcome?: 'successful' | 'failed' | 'too_short_for_analysis' | 'follow_up' | 'rejected_ai' | 'wrong_number' | 'not_interested' | 'no_meaningful_engagement' | 'answered_interested' | 'answered_not_interested' | 'callback_requested' | 'voicemail' | 'busy' | 'no_answer' | 'do_not_call' | 'technical_issue'
  categorized_objections?: ('price_concerns' | 'timing_issues' | 'competitor_preference' | 'no_need' | 'decision_maker_unavailable' | 'other')[]
  ai_response_validation?: 'appropriate_responses' | 'missed_opportunities' | 'technical_issues'
  pain_points?: string[]
  competitor_mentions?: string[]
  next_best_time?: string | null
  rejected_ai?: boolean
  rejected_ai_details?: string | null

  // Custom extraction fields (dynamic)
  extraction_fields?: Record<string, any>
  user_extraction_fields?: Record<string, any>
  ai_extraction_fields?: Record<string, any>

  // Business context
  company_context?: string
  business_context?: string
  company_context_data?: string

  // System responses analysis
  system_responses?: {
    appropriate_responses?: string[]
    inappropriate_responses?: string[]
    missed_opportunities?: string[]
    repetitive_behavior?: string[]
    irrelevant_questions?: string[]
    response_quality?: number
    response_quality_notes?: string
  }

  // Call outcome details
  outcome_reason?: string

  // Error field for failed analysis
  error?: string
}

// AI Insights types
export interface AIInsight {
  id: string
  sales_cycle_id: string
  call_id?: string
  call_timestamp: string
  attempt_number: number
  status: string
  duration_seconds?: number

  // Lead info
  lead_id: string
  lead_name: string
  lead_phone: string

  // Agent info
  agent_id: string
  agent_name: string

  // AI insights - nested object with all details
  ai_insights?: AIInsightData

  // Top-level extracted data (for backward compatibility)
  call_purpose?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  interest_level?: number
  key_points?: string[]
  objections?: string[]
  extracted_info?: Record<string, any>
  next_action?: string
  next_steps?: string[]
  summary?: string

  // Unique identifier from call history
  original_history_id?: string

  // Recording
  recording_url?: string
}

export interface AIInsightsResponse {
  insights: AIInsight[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface AIInsightFilters {
  agentId?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  minInterestLevel?: number
  maxInterestLevel?: number
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  perPage?: number
}

export interface AIInsightStats {
  total_calls_analyzed: number
  sentiment_breakdown: {
    positive: number
    negative: number
    neutral: number
  }
  average_interest_level: number
  date_range: {
    start?: string
    end?: string
  }
}