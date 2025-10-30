'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Agent } from '@/types'
import { Phone, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useTestCall } from '@/hooks/useTestCall'
import { useVoices } from '@/hooks/useAgents'
import { useRequestVerification, useVerifyLead } from '@/hooks/useLeads'
import { VerificationRequiredModal } from '@/components/leads/VerificationRequiredModal'
import { OTPVerificationModal } from '@/components/leads/OTPVerificationModal'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

interface TestAgentModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent
  onSuccess?: () => void
  testCallsRemaining?: number
}

export function TestAgentModal({ 
  isOpen, 
  onClose, 
  agent, 
  onSuccess,
  testCallsRemaining = 3 
}: TestAgentModalProps) {
  const [firstName, setFirstName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showVerificationRequired, setShowVerificationRequired] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState<{ leadId: string; verificationId: string; message: string; expiresIn: number } | null>(null)
  const [verificationError, setVerificationError] = useState<string | null>(null)

  const testCallMutation = useTestCall()
  const { data: voicesData } = useVoices()
  const requestVerificationMutation = useRequestVerification()
  const verifyLeadMutation = useVerifyLead()
  const { tokens } = useAuth()
  
  const voices = voicesData ? voicesData.reduce((acc, voice) => {
    acc[voice.id] = voice.name
    return acc
  }, {} as Record<string, string>) : {}

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!firstName.trim() || !phoneNumber.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    // Basic phone validation
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast.error('Please enter a valid phone number')
      return
    }

    setIsSubmitting(true)
    
    try {
      await testCallMutation.mutateAsync({
        agentId: agent.id,
        leadData: {
          first_name: firstName.trim(),
          phone_e164: phoneNumber.trim(),
          agent_id: agent.id,
          custom_fields: {}
        }
      })
      
      toast.success('Test call initiated successfully!')
      onSuccess?.()
      onClose()
      
      // Reset form
      setFirstName('')
      setPhoneNumber('')
    } catch (error: any) {
      // Check if it's a verification required error
      if (error.message && error.message.includes('Demo accounts can only call verified leads')) {
        setShowVerificationRequired(true)
        // Don't set verifyingPhone here - wait for user to click verify
      } else {
        toast.error(error.message || 'Failed to initiate test call')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      // Reset form when closing
      setFirstName('')
      setPhoneNumber('')
    }
  }

  const handleVerificationRequired = async () => {
    setShowVerificationRequired(false)
    
    // First create the lead, then request verification
    try {
      // Create a temporary lead for verification
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens?.access_token}`
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          phone_e164: phoneNumber.trim(),
          agent_id: agent.id,
          custom_fields: { _is_test_call: true }
        })
      })
      
      if (!response.ok) throw new Error('Failed to create lead')
      
      const lead = await response.json()
      
      // Request verification
      requestVerificationMutation.mutate(lead.id, {
        onSuccess: (data) => {
          setVerifyingPhone({
            leadId: lead.id,
            verificationId: data.verification_id,
            message: data.message,
            expiresIn: data.expires_in_seconds
          })
          setVerificationError(null)
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to request verification')
        }
      })
    } catch (error) {
      toast.error('Failed to create lead for verification')
    }
  }

  const handleVerifyOTP = async (otp: string) => {
    if (!verifyingPhone) return
    
    verifyLeadMutation.mutate(
      { leadId: verifyingPhone.leadId, otpCode: otp, verificationId: verifyingPhone.verificationId },
      {
        onSuccess: () => {
          toast.success('Phone verified successfully!')
          setVerifyingPhone(null)
          setVerificationError(null)
          
          // Retry the test call
          handleSubmit(new Event('submit') as any)
        },
        onError: (error: any) => {
          if (error?.message?.includes('expired')) {
            setVerificationError('OTP has expired. Please request a new one.')
          } else if (error?.message?.includes('Invalid')) {
            setVerificationError('Invalid OTP. Please check and try again.')
          } else {
            setVerificationError(error?.message || 'Verification failed')
          }
        }
      }
    )
  }

  return (
    <>
      <Modal
        isOpen={isOpen && !showVerificationRequired && !verifyingPhone}
        onClose={handleClose}
        size="sm"
        title={
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Test Agent Call
          </div>
        }
      >
      <div className="p-6">
        <div className="space-y-4">
          {/* Agent Info */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{agent.name}</p>
                <p className="text-sm text-gray-600">
                  Voice: {agent.voice_id && voices[agent.voice_id] 
                    ? voices[agent.voice_id] 
                    : 'Default Voice'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Test Calls Remaining</p>
                <p className="font-semibold text-blue-600">{testCallsRemaining}/3</p>
              </div>
            </div>
          </div>

          {/* Warning if low on test calls */}
          {testCallsRemaining <= 1 && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                {testCallsRemaining === 1 ? 'This is your last test call for today' : 'No test calls remaining today'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <User className="h-4 w-4" />
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={isSubmitting}
                className="mt-1"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phoneNumber" className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                <Phone className="h-4 w-4" />
                Phone Number
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                disabled={isSubmitting}
                className="mt-1"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +1 for US, +91 for India)
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Test Call Features:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Instant call initiation</li>
                    <li>• Uses agent&apos;s configured voice and prompt</li>
                    <li>• Appears in call history</li>
                    <li>• Limited to 3 test calls per agent</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || testCallsRemaining === 0}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Initiating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Start Test Call
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>

    {showVerificationRequired && (
      <VerificationRequiredModal
        isOpen={true}
        onClose={() => setShowVerificationRequired(false)}
        phoneNumber={phoneNumber}
        onVerify={handleVerificationRequired}
      />
    )}
    
    {verifyingPhone && (
      <OTPVerificationModal
        isOpen={true}
        onClose={() => {
          setVerifyingPhone(null)
          setVerificationError(null)
        }}
        message={verifyingPhone.message}
        expiresIn={verifyingPhone.expiresIn}
        onSubmit={handleVerifyOTP}
        isLoading={verifyLeadMutation.isPending}
        error={verificationError}
      />
    )}
  </>
  )
}