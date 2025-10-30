'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: (hasCompany: boolean) => void
  onError?: (error: string) => void
}

export function GoogleLoginButton({ onSuccess, onError }: GoogleLoginButtonProps) {
  const { login, isLoading } = useAuth()
  const buttonRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const [isStuck, setIsStuck] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
      
      if (!clientId) {
        logger.error('Google Client ID not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID environment variable.')
        onError?.('Google OAuth not configured. Please contact support.')
        return
      }
      
      // Allow re-initialization on retry or if not initialized
      if (window.google && (!initialized.current || isStuck)) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'popup',
          redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || window.location.origin,
        })

        if (buttonRef.current) {
          // Clear any existing button content before re-rendering
          buttonRef.current.innerHTML = ''
          
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
            shape: 'rectangular',
          })
        }

        initialized.current = true
        setIsStuck(false) // Reset stuck state on successful initialization
      }
    }

    const handleCredentialResponse = async (response: any) => {
      try {
        if (!response?.credential) {
          throw new Error('No credential received from Google')
        }
        
        // Start 10 second timeout
        timeoutRef.current = setTimeout(() => {
          setIsStuck(true)
          logger.warn('Google login timeout - showing recovery UI')
        }, 10000)
        
        const hasCompany = await login(response.credential)
        
        // Clear timeout on success
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        // Only proceed if we got a valid response
        if (hasCompany !== undefined && hasCompany !== null) {
          onSuccess?.(hasCompany)
        } else {
          throw new Error('Login completed but user data could not be retrieved')
        }
      } catch (error) {
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        logger.error('Google login error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Login failed'
        onError?.(errorMessage)
        
        // Show recovery UI immediately on error
        setIsStuck(true)
        
        // Reset initialization to allow retry
        initialized.current = false
      }
    }

    if (window.google) {
      initializeGoogleSignIn()
    } else {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initializeGoogleSignIn
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(script)
      }
    }
  }, [login, onSuccess, onError, isStuck])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleRetry = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Reset all state
    initialized.current = false
    setIsStuck(false)
    setRetryCount(prev => prev + 1)
    
    // Clear button and re-initialize
    if (buttonRef.current) {
      buttonRef.current.innerHTML = ''
    }
    
    // Force re-initialization after a small delay to ensure clean state
    setTimeout(() => {
      if (window.google) {
        const initializeGoogleSignIn = () => {
          const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
          if (!clientId) return
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              // Reuse the same credential response handler logic
              try {
                if (!response?.credential) {
                  throw new Error('No credential received from Google')
                }
                
                timeoutRef.current = setTimeout(() => {
                  setIsStuck(true)
                  logger.warn('Google login timeout on retry - showing recovery UI')
                }, 10000)
                
                const hasCompany = await login(response.credential)
                
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                
                if (hasCompany !== undefined && hasCompany !== null) {
                  onSuccess?.(hasCompany)
                } else {
                  throw new Error('Login completed but user data could not be retrieved')
                }
              } catch (error) {
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                
                logger.error('Google login error on retry:', error)
                const errorMessage = error instanceof Error ? error.message : 'Login failed'
                onError?.(errorMessage)
                setIsStuck(true)
                initialized.current = false
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: 'popup',
            redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || window.location.origin,
          })

          if (buttonRef.current) {
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signin_with',
              shape: 'rectangular',
            })
          }
        }
        
        initializeGoogleSignIn()
      }
    }, 100)
  }

  const getStuckMessage = () => {
    if (retryCount === 0) {
      return "Login is taking longer than expected"
    } else if (retryCount === 1) {
      return "Still having trouble? Try refreshing the page"
    } else if (retryCount >= 2) {
      return "Please try clearing your browser cache or contact support"
    }
    return "Login is taking longer than expected"
  }

  // Auto-refresh after 3 failed attempts
  if (retryCount >= 3) {
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
  }

  return (
    <div className="w-full">
      {/* Google Sign-In Button Container - Always visible */}
      <div 
        ref={buttonRef} 
        className={`w-full ${isLoading && !isStuck ? 'opacity-50 pointer-events-none' : ''}`}
      />
      
      {/* Loading indicator shown separately */}
      {isLoading && !isStuck && (
        <p className="text-sm text-gray-500 text-center mt-2 animate-pulse">
          Signing you in...
        </p>
      )}
      
      {/* Recovery UI - Shows after timeout or error */}
      {isStuck && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <p className="text-sm text-orange-800 mb-3 text-center">
            {getStuckMessage()}
          </p>
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-white border border-orange-300 rounded-md text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
          >
            Click here to try again
          </button>
          {retryCount >= 2 && (
            <p className="text-xs text-gray-500 text-center mt-2">
              You can also try removing &quot;/login&quot; from the URL and navigating back
            </p>
          )}
        </div>
      )}
    </div>
  )
}