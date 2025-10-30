'use client'

export const dynamic = 'force-dynamic';

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthStorage } from '@/lib/auth-storage'
import { LoadingSpinner } from '@/components/auth/LoadingSpinner'

export default function HomePage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()

  useEffect(() => {
    // Check for stored tokens immediately without waiting for API validation
    const hasStoredTokens = AuthStorage.getTokens() !== null
    
    if (!hasStoredTokens) {
      // No tokens stored, redirect to login immediately
      router.push('/login')
      return
    }

    // Only wait for auth loading if we have stored tokens
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (user) {
        if (user.company_id) {
          router.push('/agents')
        } else {
          router.push('/onboarding')
        }
      }
    }
  }, [isAuthenticated, isLoading, user, router])

  // Only show loading spinner if we have stored tokens
  const hasStoredTokens = AuthStorage.getTokens() !== null
  if (hasStoredTokens && isLoading) {
    return <LoadingSpinner text="Loading..." />
  }

  return null
}