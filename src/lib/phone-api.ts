const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

export interface PhoneProvider {
  id: string
  company_id: string
  provider: 'twilio' | 'plivo'
  credentials: {
    account_sid?: string
    auth_token?: string
    auth_id?: string
  }
  created_at: string
  updated_at: string
}

export interface AvailablePhoneNumber {
  phone_number: string
  provider: 'twilio' | 'plivo'
  capabilities: string[]
  status: 'available'
  friendly_name: string
  country_code: string
  number_type: 'local' | 'toll-free' | 'mobile'
  monthly_cost: number
}

export interface OwnedPhoneNumber {
  phone_number: string
  provider: 'twilio' | 'plivo'
  capabilities: string[]
  status: 'active' | 'inactive'
  provider_number_id: string
  monthly_cost: number
  friendly_name: string
  number_type: 'local' | 'toll-free' | 'mobile'
}

export interface AvailableNumbersResponse {
  numbers: AvailablePhoneNumber[]
  total: number
  provider: string
}

export interface OwnedNumbersResponse {
  numbers: OwnedPhoneNumber[]
  total: number
  provider: string
}

export interface ProviderCredentials {
  provider: 'twilio' | 'plivo'
  credentials: {
    account_sid?: string
    auth_token?: string
    auth_id?: string
  }
}

export class PhoneAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Provider Management
  static async addProvider(data: ProviderCredentials, accessToken: string): Promise<PhoneProvider> {
    const response = await fetch(`${API_BASE_URL}/phone-numbers/providers`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to add provider')
    }

    return response.json()
  }

  static async getProviders(accessToken: string): Promise<PhoneProvider[]> {
    const response = await fetch(`${API_BASE_URL}/phone-numbers/providers`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch providers')
    }

    return response.json()
  }

  static async removeProvider(provider: 'twilio' | 'plivo', accessToken: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/phone-numbers/providers/${provider}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to remove provider')
    }

    return response.json()
  }

  // Phone Number Management
  static async getAvailableNumbers(
    accessToken: string,
    options: {
      provider: 'twilio' | 'plivo'
      country_code?: string
      area_code?: string
      limit?: number
    }
  ): Promise<AvailableNumbersResponse> {
    const params = new URLSearchParams()
    params.append('provider', options.provider)
    if (options.country_code) params.append('country_code', options.country_code)
    if (options.area_code) params.append('area_code', options.area_code)
    if (options.limit) params.append('limit', options.limit.toString())

    const response = await fetch(`${API_BASE_URL}/phone-numbers/available?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch available numbers')
    }

    return response.json()
  }

  static async purchaseNumber(
    data: {
      phone_number: string
      provider: 'twilio' | 'plivo'
      capabilities: string[]
    },
    accessToken: string
  ): Promise<OwnedPhoneNumber> {
    const response = await fetch(`${API_BASE_URL}/phone-numbers/purchase`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to purchase number')
    }

    return response.json()
  }

  static async getOwnedNumbers(
    accessToken: string,
    provider?: 'twilio' | 'plivo'
  ): Promise<OwnedNumbersResponse> {
    const params = new URLSearchParams()
    if (provider) params.append('provider', provider)

    const response = await fetch(`${API_BASE_URL}/phone-numbers/owned?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch owned numbers')
    }

    return response.json()
  }

  static async releaseNumber(
    phoneNumber: string,
    provider: 'twilio' | 'plivo',
    accessToken: string
  ): Promise<{ message: string }> {
    const params = new URLSearchParams()
    params.append('provider', provider)

    const response = await fetch(`${API_BASE_URL}/phone-numbers/${encodeURIComponent(phoneNumber)}?${params}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to release number')
    }

    return response.json()
  }
}