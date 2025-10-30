import { Lead } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

interface LeadResponse {
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

interface LeadListResponse {
  leads: LeadResponse[]
  total: number
  page: number
  per_page: number
}

interface CreateLeadRequest {
  agent_id: string
  first_name: string
  phone_e164: string
  custom_fields?: Record<string, any>
  schedule_at?: string
}

interface UpdateLeadRequest {
  first_name?: string
  phone_e164?: string
  agent_id?: string
  custom_fields?: Record<string, any>
  schedule_at?: string
}

interface CSVImportResponse {
  success_count: number
  error_count: number
  errors: Array<{
    row: number
    error: string
  }>
  total_processed: number
}

interface CSVImportJobResponse {
  job_id: string
  status: string
  message: string
  status_url: string
}

interface CSVImportJobStatus {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  processed_rows: number
  success_count: number
  error_count: number
  errors: Array<{
    row?: number
    error: string
  }>
  started_at: string | null
  completed_at: string | null
  progress_percentage: number
}

export class LeadAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  static async createLead(leadData: CreateLeadRequest, accessToken: string): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(leadData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to create lead')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async getLeads(
    accessToken: string,
    options: {
      agent_id?: string
      status_filter?: 'new' | 'in_progress' | 'done' | 'stopped'
      search?: string
      page?: number
      per_page?: number
    } = {}
  ): Promise<LeadListResponse> {
    const params = new URLSearchParams()
    if (options.agent_id) params.append('agent_id', options.agent_id)
    if (options.status_filter) params.append('status_filter', options.status_filter)
    if (options.search) params.append('search', options.search)
    if (options.page) params.append('page', options.page.toString())
    if (options.per_page) params.append('per_page', options.per_page.toString())

    const response = await fetch(`${API_BASE_URL}/leads/?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch leads')
    }

    const data: LeadListResponse = await response.json()
    return {
      ...data,
      leads: data.leads.map(lead => this.transformLeadResponse(lead))
    }
  }

  static async getLead(leadId: string, accessToken: string): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch lead')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async updateLead(
    leadId: string,
    leadData: UpdateLeadRequest,
    accessToken: string
  ): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(leadData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to update lead')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async deleteLead(leadId: string, accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to delete lead')
    }

    return response.json()
  }

  static async startCSVImport(
    file: File,
    agentId: string,
    accessToken: string,
    countryCode: string = 'IN',
    signal?: AbortSignal
  ): Promise<CSVImportJobResponse> {
    const formData = new FormData()
    formData.append('file', file)

    // Create abort controller with 30 second timeout if no signal provided
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
    const finalSignal = signal || controller.signal

    try {
      const response = await fetch(`${API_BASE_URL}/leads/csv-import-async?agent_id=${agentId}&country_code=${countryCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
        signal: finalSignal,
      })

      clearTimeout(timeoutId)

      // Handle 401 - Authentication failed
      if (response.status === 401) {
        // Trigger logout event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout', {
            detail: { reason: 'token_expired', source: 'csv_import' }
          }))
        }
        throw new Error('Authentication expired. Please login again.')
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to start CSV import' }))
        throw new Error(error.detail || 'Failed to start CSV import')
      }

      return response.json()
    } catch (error: any) {
      clearTimeout(timeoutId)

      // Handle abort error specifically
      if (error.name === 'AbortError') {
        throw new Error('CSV upload timeout. The file is too large or the connection is slow.')
      }

      // Re-throw other errors
      throw error
    }
  }

  static async getCSVImportStatus(
    jobId: string,
    accessToken: string
  ): Promise<CSVImportJobStatus> {
    const response = await fetch(`${API_BASE_URL}/leads/csv-import/${jobId}/status`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout', {
          detail: { reason: 'token_expired', source: 'csv_status_check' }
        }))
      }
      throw new Error('Authentication expired. Please login again.')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get import status' }))
      throw new Error(error.detail || 'Failed to get import status')
    }

    return response.json()
  }

  static async scheduleCall(leadId: string, accessToken: string, voicebotServer?: 'india' | 'us'): Promise<{ message: string }> {
    const body: { lead_id: string; voicebot_server?: string } = { lead_id: leadId };
    if (voicebotServer) {
      body.voicebot_server = voicebotServer;
    }

    const response = await fetch(`${API_BASE_URL}/calls/schedule`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(body),
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

  static async stopLead(leadId: string, accessToken: string, disposition?: string): Promise<Lead> {
    const url = new URL(`${API_BASE_URL}/leads/${leadId}/stop`)
    if (disposition) {
      url.searchParams.append('disposition', disposition)
    }

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to stop lead')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async requestVerification(leadId: string, accessToken: string): Promise<{
    verification_id: string
    message: string
    expires_in_seconds: number
  }> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/request-verification`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to request verification')
    }

    return response.json()
  }

  static async verifyLead(
    leadId: string,
    verificationId: string,
    otpCode: string,
    accessToken: string
  ): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/verify`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify({
        verification_id: verificationId,
        otp_code: otpCode
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to verify lead')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  // Sales cycle control methods

  static async pauseSalesCycle(leadId: string, accessToken: string): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/pause-sales-cycle`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to pause sales cycle')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async resumeSalesCycle(leadId: string, accessToken: string): Promise<Lead> {
    const response = await fetch(`${API_BASE_URL}/leads/${leadId}/resume-sales-cycle`, {
      method: 'PUT',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to resume sales cycle')
    }

    const data = await response.json()
    return this.transformLeadResponse(data as LeadResponse)
  }

  static async downloadSampleCSV(agentId: string, accessToken: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/leads/sample-csv?agent_id=${agentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to download sample CSV' }))
      throw new Error(error.detail || 'Failed to download sample CSV')
    }

    return response.blob()
  }

  private static transformLeadResponse(data: LeadResponse): Lead {
    return {
      id: data.id,
      agent_id: data.agent_id,
      first_name: data.first_name,
      phone_e164: data.phone_e164,
      status: data.status,
      custom_fields: data.custom_fields,
      schedule_at: data.schedule_at,
      attempts_count: data.attempts_count,
      disposition: data.disposition,
      created_at: data.created_at,
      updated_at: data.updated_at,
      is_verified: data.is_verified ?? false,
      verification_method: data.verification_method ?? null,
      verified_at: data.verified_at ?? null,
      // Sales cycle information
      sales_cycle_id: data.sales_cycle_id,
      sales_cycle_status: data.sales_cycle_status,
      sales_cycle_next_call: data.sales_cycle_next_call
    }
  }
}