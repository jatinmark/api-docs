const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

export interface TemplateResponse {
  id: string
  industry: string
  use_case: string
  name: string
  prompt: string
  variables: string[]
  functions: string[]
  welcome_message: string
  suggested_settings: {
    max_call_duration_minutes?: number
    max_attempts?: number
    retry_delay_minutes?: number
    voice_temperature?: number
    voice_speed?: number
    responsiveness?: number
    business_hours_start?: string
    business_hours_end?: string
    timezone?: string
  }
}

interface TemplateListResponse {
  templates: TemplateResponse[]
  total: number
}

interface TemplatesByIndustryResponse {
  industry: string
  templates: TemplateResponse[]
}

export class TemplateAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  static async getAllTemplates(
    accessToken: string,
    options: {
      industry?: string
      use_case?: string
    } = {}
  ): Promise<TemplateListResponse> {
    const params = new URLSearchParams()
    if (options.industry) params.append('industry', options.industry)
    if (options.use_case) params.append('use_case', options.use_case)

    const response = await fetch(`${API_BASE_URL}/templates/?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch templates')
    }

    return response.json()
  }

  static async getTemplatesByIndustry(accessToken: string): Promise<TemplatesByIndustryResponse[]> {
    const response = await fetch(`${API_BASE_URL}/templates/industries`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch templates by industry')
    }

    return response.json()
  }

  static async getTemplate(templateId: string, accessToken: string): Promise<TemplateResponse> {
    const response = await fetch(`${API_BASE_URL}/templates/${templateId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch template')
    }

    return response.json()
  }
}