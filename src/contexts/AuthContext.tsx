'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AuthState, AuthUser, AuthTokens, OnboardingData } from '@/types/auth'
import { AuthStorage } from '@/lib/auth-storage'
import { AuthAPI } from '@/lib/auth-api'
import toast from 'react-hot-toast'
import { trackLogin, trackLogout, trackLoginFailure } from '@/lib/analytics'

interface AuthContextType extends AuthState {
  login: (credential: string) => Promise<boolean>
  emailLogin: (email: string, password: string) => Promise<boolean>
  emailSignup: (email: string, password: string, name: string, phone: string, companyName: string) => Promise<boolean>
  logout: () => Promise<void>
  completeOnboarding: (data: OnboardingData) => Promise<void>
  refreshTokens: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: true,
    isAuthenticated: false,
    error: null
  })

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isLoading: false }))
  }, [])

  const setTokens = useCallback((tokens: AuthTokens) => {
    AuthStorage.setTokens(tokens)
    setState(prev => ({ 
      ...prev, 
      tokens, 
      isAuthenticated: true,
      error: null 
    }))
  }, [])

  const setUser = useCallback((user: AuthUser) => {
    AuthStorage.setUser(user)
    setState(prev => ({ 
      ...prev, 
      user,
      error: null 
    }))
  }, [])

  const refreshTokens = useCallback(async () => {
    const currentTokens = AuthStorage.getTokens()
    if (!currentTokens) {
      throw new Error('No refresh token available')
    }

    logger.debug('Token refresh not supported by backend - skipping refresh')
    return
    
  }, [])

  const checkAndRefreshToken = useCallback(async () => {
    const tokens = AuthStorage.getTokens()
    if (!tokens) return false

    // Skip token expiration checks since backend doesn't support refresh
    // Tokens are valid for 60 days, so expiration during upload is not the issue
    if (AuthStorage.isTokenExpired(tokens)) {
      logger.info('Token expired - user should re-login')
      return false
    }

    // Skip the "expiring soon" check that was causing premature refresh attempts
    // if (AuthStorage.isTokenExpiringSoon(tokens)) {
    //   try {
    //     await refreshTokens()
    //   } catch {
    //     // Continue with current token if refresh fails
    //   }
    // }

    return true
  }, [])

  const login = useCallback(async (credential: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Clear all React Query caches before login to prevent showing previous user's data
      queryClient.clear()
      
      // Try to determine if credential is a JWT token or email
      const isJWTToken = credential.includes('.') && credential.split('.').length === 3
      
      // For development, always use test login with email
      // For production, try Google OAuth first, fallback to test login if it looks like an email
      const tokens = process.env.NODE_ENV === 'development' 
        ? await AuthAPI.testLogin(credential) // Use credential as email in dev
        : isJWTToken 
          ? await AuthAPI.googleLogin(credential) // Use as Google JWT token
          : await AuthAPI.testLogin(credential) // Fallback to test login with email
      
      setTokens(tokens)
      
      // Get user info to check profile completion status
      const user = await AuthAPI.getCurrentUser(tokens.access_token)
      setUser(user)

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true
      }))

      // Track successful login with user ID
      trackLogin(user.email, process.env.NODE_ENV === 'development' ? 'email' : 'google')

      // Return true if onboarding is complete (has company)
      // Changed from hasCompany to is_profile_complete to avoid double redirect
      return user.is_profile_complete && (user.company_id !== null && user.company_id !== undefined)
    } catch (error) {
      // Track login failure
      trackLoginFailure(error instanceof Error ? error.message : 'Unknown error')
      setError(error instanceof Error ? error.message : 'Login failed')
      return false
    }
  }, [setTokens, setUser, setError, queryClient])

  const emailLogin = useCallback(async (email: string, password: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Clear all React Query caches before login
      queryClient.clear()

      const tokens = await AuthAPI.emailLogin(email, password)
      setTokens(tokens)

      // Get user info to check profile completion status
      const user = await AuthAPI.getCurrentUser(tokens.access_token)
      setUser(user)

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true
      }))

      // Track successful email login with user ID
      trackLogin(user.email, 'email')

      // Return true if onboarding is complete (profile complete AND has company)
      // Changed from hasCompany to is_profile_complete to avoid double redirect
      return user.is_profile_complete && (user.company_id !== null && user.company_id !== undefined)
    } catch (error) {
      // Track login failure
      trackLoginFailure(error instanceof Error ? error.message : 'Unknown error')
      setError(error instanceof Error ? error.message : 'Login failed')
      return false
    }
  }, [setTokens, setUser, setError, queryClient])

  const emailSignup = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone: string,
    companyName: string
  ): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Clear all React Query caches before signup
      queryClient.clear()

      const tokens = await AuthAPI.emailSignup(email, password, name, phone, companyName)
      setTokens(tokens)

      // Get user info to check profile completion status
      const user = await AuthAPI.getCurrentUser(tokens.access_token)
      setUser(user)

      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthenticated: true
      }))

      // Track successful signup/login with user ID
      trackLogin(user.email, 'email_signup')

      // Return true if onboarding is complete (profile complete AND has company)
      // Changed from hasCompany to is_profile_complete to avoid double redirect
      return user.is_profile_complete && (user.company_id !== null && user.company_id !== undefined)
    } catch (error) {
      // Track signup failure
      trackLoginFailure(error instanceof Error ? error.message : 'Unknown error')
      setError(error instanceof Error ? error.message : 'Signup failed')
      return false
    }
  }, [setTokens, setUser, setError, queryClient])

  const completeOnboarding = useCallback(async (data: OnboardingData) => {
    const tokens = AuthStorage.getTokens()
    if (!tokens) {
      throw new Error('No authentication token available')
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const updatedUser = await AuthAPI.completeProfile(data, tokens.access_token)
      setUser(updatedUser)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Onboarding failed')
      throw error
    }
  }, [setUser, setError])


  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    // Track logout before clearing data
    trackLogout()

    const tokens = AuthStorage.getTokens()
    if (tokens) {
      try {
        await AuthAPI.logout(tokens.access_token)
      } catch {
        // Continue with logout even if API call fails
      }
    }

    AuthStorage.clearAll()

    // Clear all React Query caches to prevent showing previous user's data
    queryClient.clear()

    setState({
      user: null,
      tokens: null,
      isLoading: false,
      isAuthenticated: false,
      error: null
    })

    // Redirect to home page after logout
    router.push('/')
  }, [router, queryClient])

  const initializeAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }))

    const storedTokens = AuthStorage.getTokens()

    if (!storedTokens) {
      setState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      // Reduce timeout and add retry logic for auth during transcription
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth initialization timeout')), 8000) // Increased to 8s
      )
      
      // Retry logic for auth failures during active processing
      let retryCount = 0
      const maxRetries = 2

      while (retryCount <= maxRetries) {
        try {
          // Race between API call and timeout
          const currentUser = await Promise.race([
            AuthAPI.getCurrentUser(storedTokens.access_token),
            timeoutPromise
          ])

          setUser(currentUser)

          setState({
            user: currentUser,
            tokens: storedTokens,
            isLoading: false,
            isAuthenticated: true,
            error: null
          })
          return // Success - exit retry loop
          
        } catch (authError) {
          retryCount++
          
          // If error suggests busy database/processing, retry after delay
          if (authError instanceof Error && 
              (authError.message.includes('timeout') || 
               authError.message.includes('connect') ||
               authError.message.includes('fetch')) && 
              retryCount <= maxRetries) {
            
            logger.warn(`Auth retry ${retryCount}/${maxRetries} due to: ${authError.message}`)
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
            continue
          }
          
          // For other errors or max retries reached, fail auth
          throw authError
        }
      }
      
    } catch (error) {
      logger.error('Auth initialization failed', error)
      
      // Be more lenient during processing - don't clear tokens immediately
      if (error instanceof Error && 
          (error.message.includes('timeout') || error.message.includes('processing'))) {
        
        // Keep tokens but show not authenticated temporarily
        setState({
          user: null,
          tokens: storedTokens, // Keep tokens for retry
          isLoading: false,
          isAuthenticated: false,
          error: 'Connection issue during processing. Please refresh if this persists.'
        })
      } else {
        // Clear everything for other auth failures
        AuthStorage.clearAll()
        setState({
          user: null,
          tokens: null,
          isLoading: false,
          isAuthenticated: false,
          error: null
        })
      }
    }
  }, [])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Listen for auth error events from any part of the app
  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const customEvent = event as CustomEvent
      logger.warn('Authentication error detected:', customEvent.detail)

      // Only logout if we're currently authenticated to avoid loops
      if (state.isAuthenticated) {
        toast.error(customEvent.detail?.reason === 'token_expired'
          ? 'Your session has expired. Please login again.'
          : 'Authentication error. Please login again.')
        logout()
      }
    }

    window.addEventListener('auth:logout', handleAuthError)
    return () => {
      window.removeEventListener('auth:logout', handleAuthError)
    }
  }, [logout, state.isAuthenticated])

  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) return

    const interval = setInterval(async () => {
      try {
        await checkAndRefreshToken()
      } catch {
        // Token refresh failed, user will be logged out by checkAndRefreshToken
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => clearInterval(interval)
  }, [state.isAuthenticated, state.tokens, checkAndRefreshToken])

  const value: AuthContextType = {
    ...state,
    login,
    emailLogin,
    emailSignup,
    logout,
    completeOnboarding,
    refreshTokens,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}