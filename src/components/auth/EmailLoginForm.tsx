'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'

interface EmailLoginFormProps {
  onSuccess?: (hasCompany: boolean) => void
  onError?: (error: string) => void
}

export function EmailLoginForm({ onSuccess, onError }: EmailLoginFormProps) {
  const { emailLogin } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      onError?.('Please enter both email and password')
      return
    }

    setIsLoading(true)

    try {
      // Use the emailLogin method from AuthContext
      const hasCompany = await emailLogin(email, password)
      onSuccess?.(hasCompany)
    } catch (error) {
      logger.error('Email login error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Email address"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Signing in...' : 'Sign In with Email & Password'}
      </button>
    </form>
  )
}