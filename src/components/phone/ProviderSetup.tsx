'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhoneAPI, PhoneProvider } from '@/lib/phone-api'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Eye, EyeOff } from 'lucide-react'

interface ProviderSetupProps {
  isOpen: boolean
  onClose: () => void
  onProviderAdded: (provider: PhoneProvider) => void
  existingProviders: string[]
}

export function ProviderSetup({ isOpen, onClose, onProviderAdded, existingProviders }: ProviderSetupProps) {
  const [selectedProvider, setSelectedProvider] = useState<'twilio' | 'plivo'>('twilio')
  const [credentials, setCredentials] = useState({
    account_sid: '',
    auth_token: '',
    auth_id: ''
  })
  const [showTokens, setShowTokens] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { tokens } = useAuth()

  const handleSubmit = async () => {
    if (!tokens?.access_token) return

    // Validate required fields
    if (selectedProvider === 'twilio') {
      if (!credentials.account_sid || !credentials.auth_token) {
        setError('Account SID and Auth Token are required for Twilio')
        return
      }
    } else {
      if (!credentials.auth_id || !credentials.auth_token) {
        setError('Auth ID and Auth Token are required for Plivo')
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const providerData = {
        provider: selectedProvider,
        credentials: selectedProvider === 'twilio' 
          ? { 
              account_sid: credentials.account_sid, 
              auth_token: credentials.auth_token 
            }
          : { 
              auth_id: credentials.auth_id, 
              auth_token: credentials.auth_token 
            }
      }

      const provider = await PhoneAPI.addProvider(providerData, tokens.access_token)
      onProviderAdded(provider)
      handleClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add provider')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCredentials({ account_sid: '', auth_token: '', auth_id: '' })
    setError(null)
    setLoading(false)
    setShowTokens(false)
    onClose()
  }

  const availableProviders = ['twilio', 'plivo'].filter(p => !existingProviders.includes(p))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Phone Provider" size="md">
      <div className="space-y-6">
        {availableProviders.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">All providers configured</h3>
            <p className="mt-1 text-sm text-gray-500">
              You have already added all available providers (Twilio and Plivo).
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                {availableProviders.map((provider) => (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => setSelectedProvider(provider as 'twilio' | 'plivo')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedProvider === provider
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        provider === 'twilio' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <span className={`text-sm font-bold ${
                          provider === 'twilio' ? 'text-red-800' : 'text-blue-800'
                        }`}>
                          {provider === 'twilio' ? 'T' : 'P'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium capitalize">{provider}</div>
                        <div className="text-xs text-gray-500">
                          {provider === 'twilio' ? '$1.00/month' : '$0.80/month'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedProvider === 'twilio' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Twilio Setup</h4>
                  <p className="text-sm text-blue-800">
                    You can find your Account SID and Auth Token in your Twilio Console at{' '}
                    <a href="https://console.twilio.com" target="_blank" rel="noopener noreferrer" className="underline">
                      console.twilio.com
                    </a>
                  </p>
                </div>
                
                <Input
                  label="Account SID"
                  value={credentials.account_sid}
                  onChange={(e) => setCredentials(prev => ({ ...prev, account_sid: e.target.value }))}
                  placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                
                <div className="relative">
                  <Input
                    label="Auth Token"
                    type={showTokens ? 'text' : 'password'}
                    value={credentials.auth_token}
                    onChange={(e) => setCredentials(prev => ({ ...prev, auth_token: e.target.value }))}
                    placeholder="your_auth_token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens(!showTokens)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {selectedProvider === 'plivo' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Plivo Setup</h4>
                  <p className="text-sm text-blue-800">
                    You can find your Auth ID and Auth Token in your Plivo Console at{' '}
                    <a href="https://console.plivo.com" target="_blank" rel="noopener noreferrer" className="underline">
                      console.plivo.com
                    </a>
                  </p>
                </div>
                
                <Input
                  label="Auth ID"
                  value={credentials.auth_id}
                  onChange={(e) => setCredentials(prev => ({ ...prev, auth_id: e.target.value }))}
                  placeholder="MAxxxxxxxxxxxxxxx"
                />
                
                <div className="relative">
                  <Input
                    label="Auth Token"
                    type={showTokens ? 'text' : 'password'}
                    value={credentials.auth_token}
                    onChange={(e) => setCredentials(prev => ({ ...prev, auth_token: e.target.value }))}
                    placeholder="your_auth_token"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokens(!showTokens)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showTokens ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || availableProviders.length === 0}
              >
                {loading ? 'Adding...' : 'Add Provider'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}