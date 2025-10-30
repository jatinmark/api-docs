import { AuthStorage } from '@/lib/auth-storage'
import { logger } from '@/lib/logger'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'

interface ApiClientOptions extends RequestInit {
  skipAuth?: boolean
}

class ApiClient {
  async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options
    
    // Get auth token if needed
    const tokens = AuthStorage.getTokens()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string> || {}),
    }

    if (!skipAuth && tokens) {
      headers['Authorization'] = `Bearer ${tokens.access_token}`
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      })
      
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }))
        throw new Error(error.detail || `Request failed with status ${response.status}`)
      }
      
      // Handle empty responses
      const text = await response.text()
      if (!text) {
        return {} as T
      }
      
      return JSON.parse(text)
    } catch (error) {
      logger.error('API request failed:', { endpoint, error })
      throw error
    }
  }
  
  get<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }
  
  post<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  put<T>(endpoint: string, data?: any, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
  
  delete<T>(endpoint: string, options?: ApiClientOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()