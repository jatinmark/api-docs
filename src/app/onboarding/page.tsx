'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Building2, User, Phone, ArrowRight } from 'lucide-react'
import { logger } from '@/lib/logger'
import { AuthAPI } from '@/lib/auth-api'
import { AuthStorage } from '@/lib/auth-storage'

export default function OnboardingPage() {
  const { user, completeOnboarding, isLoading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    company_name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(1)
  const [loadingCompany, setLoadingCompany] = useState(false)

  // Pre-fill company name if user already has a company (existing Gmail users)
  useEffect(() => {
    const loadCompanyName = async () => {
      if (user?.company_id) {
        setLoadingCompany(true)
        try {
          const tokens = AuthStorage.getTokens()
          if (tokens) {
            const company = await AuthAPI.getCompany(tokens.access_token)
            setFormData(prev => ({
              ...prev,
              company_name: company.name
            }))
          }
        } catch (error) {
          logger.error('Failed to load company name:', error)
          // Non-critical error - user can still enter company name manually
        } finally {
          setLoadingCompany(false)
        }
      }
    }

    loadCompanyName()
  }, [user?.company_id])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required'
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required'
      } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid phone number'
      }
    }

    if (step === 2) {
      if (!formData.company_name.trim()) {
        newErrors.company_name = 'Company name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    setCurrentStep(1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(2)) return

    try {
      await completeOnboarding(formData)
      // ProtectedRoute will handle redirect automatically when is_profile_complete becomes true
    } catch (error) {
      logger.error('Onboarding failed:', error)
    }
  }

  return (
    <ProtectedRoute requireOnboarding={false}>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Welcome to ConversAI Labs
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Let&apos;s set up your account to get started
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    1
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    2
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  Step {currentStep} of 2
                </span>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <User className="mx-auto h-12 w-12 text-primary-600" />
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    {user?.company_id
                      ? "We need your phone number to complete your profile"
                      : "Tell us a bit about yourself"}
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    error={errors.name}
                    placeholder="Enter your full name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        e.preventDefault()
                        handleNext()
                      }
                    }}
                  />

                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    error={errors.phone}
                    placeholder="+1 (555) 123-4567"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        e.preventDefault()
                        handleNext()
                      }
                    }}
                  />
                </div>

                <Button 
                  onClick={handleNext}
                  className="w-full"
                  disabled={isLoading}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <Building2 className="mx-auto h-12 w-12 text-primary-600" />
                  <h2 className="mt-4 text-xl font-semibold text-gray-900">
                    Company Information
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Set up your company profile
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Company Name"
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    error={errors.company_name}
                    placeholder="Enter your company name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isLoading) {
                        e.preventDefault()
                        handleSubmit()
                      }
                    }}
                  />

                  <div className="bg-blue-50 p-4 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>You will be the admin</strong> of this company account. 
                      You can manage agents, leads, and all settings.
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Complete Setup'}
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Your information is securely stored and encrypted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}