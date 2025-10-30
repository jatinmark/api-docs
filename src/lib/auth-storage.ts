import { AuthTokens, AuthUser } from '@/types/auth'

const TOKEN_KEY = 'voice_ai_tokens'
const USER_KEY = 'voice_ai_user'

export class AuthStorage {
  static setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
    }
  }

  static getTokens(): AuthTokens | null {
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem(TOKEN_KEY)
      if (tokens) {
        try {
          return JSON.parse(tokens)
        } catch {
          this.clearTokens()
          return null
        }
      }
    }
    return null
  }

  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  static setUser(user: AuthUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  }

  static getUser(): AuthUser | null {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem(USER_KEY)
      if (user) {
        try {
          return JSON.parse(user)
        } catch {
          this.clearUser()
          return null
        }
      }
    }
    return null
  }

  static clearUser(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_KEY)
    }
  }

  static clearAll(): void {
    this.clearTokens()
    this.clearUser()

    // Clear all user-specific preferences on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('leads_selected_agent') // Agent filter selection
      localStorage.removeItem('showSuperAdmin')       // Super admin menu visibility
    }
  }

  static isTokenExpired(tokens: AuthTokens): boolean {
    try {
      // Decode the JWT to get the actual expiration time
      const tokenParts = tokens.access_token.split('.')
      if (tokenParts.length !== 3) {
        return true // Invalid token format
      }

      // Decode the payload (second part of JWT)
      const payload = JSON.parse(atob(tokenParts[1]))

      // Check if token has exp claim
      if (!payload.exp) {
        // Fallback to the stored expires_at if no exp claim
        return Date.now() >= tokens.expires_at
      }

      // JWT exp is in seconds, convert to milliseconds
      const expirationMs = payload.exp * 1000

      // Add a small buffer (1 minute) to account for clock skew
      const now = Date.now()
      const bufferMs = 60 * 1000 // 1 minute buffer

      return now >= (expirationMs - bufferMs)
    } catch (error) {
      // If we can't decode the token, consider it expired for safety
      console.error('Error decoding token:', error)
      return true
    }
  }

  static isTokenExpiringSoon(tokens: AuthTokens, thresholdMinutes: number = 5): boolean {
    try {
      // Decode the JWT to get the actual expiration time
      const tokenParts = tokens.access_token.split('.')
      if (tokenParts.length !== 3) {
        return true // Invalid token format
      }

      // Decode the payload
      const payload = JSON.parse(atob(tokenParts[1]))

      // Check if token has exp claim
      if (!payload.exp) {
        // Fallback to the stored expires_at if no exp claim
        const thresholdMs = thresholdMinutes * 60 * 1000
        return Date.now() >= (tokens.expires_at - thresholdMs)
      }

      // JWT exp is in seconds, convert to milliseconds
      const expirationMs = payload.exp * 1000
      const thresholdMs = thresholdMinutes * 60 * 1000

      return Date.now() >= (expirationMs - thresholdMs)
    } catch (error) {
      console.error('Error decoding token:', error)
      return true
    }
  }
}