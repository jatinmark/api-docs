export interface AuthUser {
  id: string
  email: string
  name: string
  phone?: string
  google_id: string
  company_id?: string | null
  is_profile_complete: boolean
  role?: 'super_admin' | 'company_admin' | 'company_member'
  created_at: string
  updated_at: string
  show_admin_banner?: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  expires_at: number
  token_type: 'Bearer'
}

export interface AuthState {
  user: AuthUser | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export interface GoogleAuthResponse {
  credential: string
  select_by: string
}

export interface LoginResponse {
  user: AuthUser
  tokens: AuthTokens
  requires_onboarding: boolean
}

export interface OnboardingData {
  name: string
  phone: string
  company_name: string
}