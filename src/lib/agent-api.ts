import { Agent, Voice } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

interface AgentResponse {
  id: string
  company_id: string
  name: string
  prompt: string
  parsed_sections?: {
    header?: string
    role?: string
    conversationFlow?: string
    supportingSections?: string
    compliance?: string
  }
  welcome_message: string
  voice_id: string
  status: 'active' | 'inactive'
  variables: Record<string, any>
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
  provider_agent_id?: string
  provider_metadata?: Record<string, any>
  enable_sales_cycle?: boolean
  default_call_days?: number[]
  sales_cycle_config?: {
    enable_ai_insights?: boolean
    stages?: string[]
  }
  configuration?: any
  configuration_data?: any  // The actual field from backend
  website_data?: any  // Website data from related table
  created_at: string
  updated_at: string
}

interface AgentListResponse {
  agents: AgentResponse[]
  total: number
  page: number
  per_page: number
}

interface VoiceResponse {
  id: string
  name: string
  provider: string
  gender: 'male' | 'female'
  language: string
  accent: string
  sample_url?: string
  is_active: boolean
}

interface CreateAgentRequest {
  name: string
  prompt: string
  welcome_message?: string
  voice_id?: string
  functions?: string[]
  region?: 'indian' | 'international' | 'internal_india' | 'internal_us' | 'worldwide'
  inbound_phone?: string
  outbound_phone?: string
  max_attempts?: number
  retry_delay_minutes?: number
  business_hours_start?: string
  business_hours_end?: string
  timezone?: string
  max_call_duration_minutes?: number
  enable_sales_cycle?: boolean
  default_call_days?: number[]
  sales_cycle_config?: {
    enable_ai_insights?: boolean
    stages?: string[]
  }
  company_id?: string
  website_data?: any
  configuration_data?: any
}

interface UpdateAgentRequest extends Partial<CreateAgentRequest> {}

interface MermaidGenerationRequest {
  agent_name: string
  agent_role: string
  prompt: string
  agent_id?: string | null  // Optional agent_id for call flow caching (can be null)
}

interface MermaidGenerationResponse {
  chart_definition: string
}

export class AgentAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  static async createAgent(agentData: CreateAgentRequest, accessToken: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create agent')
    }

    const data: AgentResponse = await response.json()
    return this.transformAgentResponse(data)
  }

  static async getAgents(
    accessToken: string,
    options: {
      page?: number
      per_page?: number
      status_filter?: 'active' | 'inactive'
    } = {}
  ): Promise<AgentListResponse> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())
    if (options.status_filter) params.append('status_filter', options.status_filter)

    const response = await fetch(`${API_BASE_URL}/agents/?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch agents')
    }

    const data: AgentListResponse = await response.json()
    return {
      ...data,
      agents: data.agents.map(agent => this.transformAgentResponse(agent))
    }
  }

  static async getAgent(agentId: string, accessToken: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch agent')
    }

    const data: AgentResponse = await response.json()
    return this.transformAgentResponse(data)
  }

  static async updateAgent(
    agentId: string,
    agentData: UpdateAgentRequest,
    accessToken: string
  ): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update agent')
    }

    const data: AgentResponse = await response.json()
    return this.transformAgentResponse(data)
  }

  static async toggleAgentStatus(agentId: string, accessToken: string): Promise<{ status: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to toggle agent status')
    }

    return response.json()
  }

  static async deleteAgent(agentId: string, accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete agent')
    }

    return response.json()
  }

  static async getVoices(accessToken: string): Promise<Voice[]> {
    const response = await fetch(`${API_BASE_URL}/agents/voices/`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch voices')
    }

    const data: VoiceResponse[] = await response.json()
    return data.map(voice => ({
      id: voice.id,
      name: voice.name,
      gender: voice.gender,
      language: voice.language,
      retell_voice_id: voice.id
    }))
  }

  // Agent Wizard specific methods
  static async createAgentWithConfiguration(agentData: any, accessToken: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/create-with-configuration`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create agent with configuration')
    }

    const data: AgentResponse = await response.json()
    return this.transformAgentResponse(data)
  }

  static async updateAgentConfiguration(agentId: string, agentData: any, accessToken: string): Promise<Agent> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/configuration`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(agentData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update agent configuration')
    }

    const data: AgentResponse = await response.json()
    return this.transformAgentResponse(data)
  }

  static async getWebsiteData(agentId: string, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/website-data`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to get website data')
    }

    return response.json()
  }

  static async scrapeWebsite(data: { website_url: string }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/scrape-website-wizard`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to scrape website')
    }

    return response.json()
  }

  static async generateFAQs(data: { content: string }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/generate-faqs-wizard`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate FAQs')
    }

    return response.json()
  }

  static async generateTasks(data: {
    agent_id: string
    transcript?: string
    user_tasks: string[]
    website_data: any
    agent_role: string
  }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/generate-tasks`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate tasks')
    }

    return response.json()
  }

  static async generateConversationFlow(data: {
    agent_id: string
    transcript?: string
    tasks: string
  }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/generate-conversation-flow`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate conversation flow')
    }

    return response.json()
  }

  static async updateFAQs(data: { agent_id: string; faqs: any[] }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/${data.agent_id}/faqs`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify({ faqs: data.faqs }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update FAQs')
    }

    return response.json()
  }

  static async updateTasks(data: { agent_id: string; tasks: string }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/update-tasks`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify({ agent_id: data.agent_id, tasks: data.tasks }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update tasks')
    }

    return response.json()
  }

  private static transformAgentResponse(data: AgentResponse): Agent {
    return {
      id: data.id,
      company_id: data.company_id,
      name: data.name,
      status: data.status,
      prompt: data.prompt,
      parsed_sections: data.parsed_sections, // Add parsed_sections field
      variables: data.variables,
      welcome_message: data.welcome_message,
      voice_id: data.voice_id,
      functions: data.functions,
      region: data.region, // Add region field
      inbound_phone: data.inbound_phone,
      outbound_phone: data.outbound_phone,
      max_attempts: data.max_attempts,
      retry_delay_minutes: data.retry_delay_minutes,
      business_hours_start: data.business_hours_start,
      business_hours_end: data.business_hours_end,
      timezone: data.timezone,
      max_call_duration_minutes: data.max_call_duration_minutes,
      retell_agent_id: data.retell_agent_id,
      retell_llm_id: '', // Not provided by backend
      provider_agent_id: data.provider_agent_id,
      provider_metadata: data.provider_metadata,
      enable_sales_cycle: data.enable_sales_cycle,
      default_call_days: data.default_call_days,
      sales_cycle_config: data.sales_cycle_config,
      configuration: data.configuration,
      configuration_data: data.configuration_data,
      website_data: data.website_data,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  }

  // Send extraction fields to backend
  static async sendExtractionFields(data: { extraction_fields: { name: string; description: string }[], agent_id?: string }, accessToken: string) {
    const response = await fetch(`${API_BASE_URL}/agents/extraction-fields`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to send extraction fields')
    }

    return response.json()
  }

  static async generateMermaidChart(
    request: MermaidGenerationRequest,
    accessToken: string
  ): Promise<MermaidGenerationResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/generate-mermaid-chart`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate Mermaid chart')
    }

    return response.json()
  }

  static async regenerateMermaidChart(
    request: MermaidGenerationRequest,
    accessToken: string
  ): Promise<MermaidGenerationResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/regenerate-mermaid-chart`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to regenerate Mermaid chart')
    }

    return response.json()
  }
}