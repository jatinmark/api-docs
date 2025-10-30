'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { PhoneAPI, PhoneProvider, AvailablePhoneNumber, OwnedPhoneNumber } from '@/lib/phone-api'
import { useAuth } from '@/contexts/AuthContext'
import { Phone, Plus, Search, Settings, Trash2, ShoppingCart, Star, DollarSign, Shield } from 'lucide-react'
import { ProviderSetup } from '@/components/phone/ProviderSetup'
import { NumberBrowser } from '@/components/phone/NumberBrowser'

export default function PhonePage() {
  const [providers, setProviders] = useState<PhoneProvider[]>([])
  const [ownedNumbers, setOwnedNumbers] = useState<OwnedPhoneNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'browse' | 'owned'>('overview')
  const [showProviderSetup, setShowProviderSetup] = useState(false)
  const [showNumberBrowser, setShowNumberBrowser] = useState(false)
  const { tokens } = useAuth()

  useEffect(() => {
    fetchData()
  }, [tokens])

  const fetchData = async () => {
    if (!tokens?.access_token) return

    try {
      setLoading(true)
      const [providersData, ownedData] = await Promise.all([
        PhoneAPI.getProviders(tokens.access_token),
        PhoneAPI.getOwnedNumbers(tokens.access_token)
      ])
      
      setProviders(providersData)
      setOwnedNumbers(ownedData.numbers)
      setError(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleProviderAdded = (provider: PhoneProvider) => {
    setProviders(prev => [...prev, provider])
    setShowProviderSetup(false)
  }

  const handleProviderRemoved = async (providerName: 'twilio' | 'plivo') => {
    if (!tokens?.access_token) return

    try {
      await PhoneAPI.removeProvider(providerName, tokens.access_token)
      setProviders(prev => prev.filter(p => p.provider !== providerName))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove provider')
    }
  }

  const handleNumberPurchased = (number: OwnedPhoneNumber) => {
    setOwnedNumbers(prev => [...prev, number])
    setShowNumberBrowser(false)
  }

  const handleNumberReleased = async (phoneNumber: string, provider: 'twilio' | 'plivo') => {
    if (!tokens?.access_token) return

    try {
      await PhoneAPI.releaseNumber(phoneNumber, provider, tokens.access_token)
      setOwnedNumbers(prev => prev.filter(n => n.phone_number !== phoneNumber))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to release number')
    }
  }

  const getProviderDisplay = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  const getCapabilityIcons = (capabilities: string[]) => {
    return capabilities.map(cap => {
      switch (cap) {
        case 'voice': return <span key={cap} title="Voice"><Phone className="h-3 w-3" /></span>
        case 'sms': return <span key={cap} className="text-xs font-bold" title="SMS">SMS</span>
        case 'mms': return <span key={cap} className="text-xs font-bold" title="MMS">MMS</span>
        default: return null
      }
    })
  }

  const totalMonthlyCost = ownedNumbers.reduce((sum, num) => sum + num.monthly_cost, 0)

  if (loading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Phone Numbers</h1>
              <p className="text-gray-600">Manage your phone number providers and inventory</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => setShowProviderSetup(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Add Provider
              </Button>
              <Button onClick={() => setShowNumberBrowser(true)} disabled={providers.length === 0}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse Numbers
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: Star },
                { id: 'providers', name: 'Providers', icon: Settings },
                { id: 'owned', name: 'Owned Numbers', icon: Phone },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className={`mr-2 h-4 w-4 ${
                    activeTab === tab.id ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Settings className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Configured Providers</p>
                      <p className="text-2xl font-bold text-gray-900">{providers.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <Phone className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Owned Numbers</p>
                      <p className="text-2xl font-bold text-gray-900">{ownedNumbers.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Monthly Cost</p>
                      <p className="text-2xl font-bold text-gray-900">${totalMonthlyCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Setup Guide */}
              {providers.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
                  <div className="flex">
                    <Shield className="h-6 w-6 text-blue-600" />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-blue-900">Get Started with Phone Numbers</h3>
                      <div className="mt-2 text-sm text-blue-800">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Add your Twilio or Plivo provider credentials</li>
                          <li>Browse and purchase available phone numbers</li>
                          <li>Assign numbers to your agents for inbound/outbound calling</li>
                        </ol>
                      </div>
                      <div className="mt-4">
                        <Button onClick={() => setShowProviderSetup(true)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Add Your First Provider
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {providers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex space-x-4">
                    <Button onClick={() => setShowNumberBrowser(true)}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Purchase Numbers
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('owned')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Manage Numbers
                    </Button>
                    <Button variant="outline" onClick={() => setActiveTab('providers')}>
                      <Settings className="h-4 w-4 mr-2" />
                      Provider Settings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Providers Tab */}
          {activeTab === 'providers' && (
            <div className="bg-white rounded-lg shadow">
              {providers.length === 0 ? (
                <div className="p-8 text-center">
                  <Settings className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No providers configured</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add Twilio or Plivo credentials to start managing phone numbers.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setShowProviderSetup(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Provider
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              provider.provider === 'twilio' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              <span className={`text-xs font-bold ${
                                provider.provider === 'twilio' ? 'text-red-800' : 'text-blue-800'
                              }`}>
                                {provider.provider === 'twilio' ? 'T' : 'P'}
                              </span>
                            </div>
                            <span className="font-medium">{getProviderDisplay(provider.provider)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {provider.credentials.account_sid || provider.credentials.auth_id || 'Hidden'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(provider.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProviderRemoved(provider.provider)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}

          {/* Owned Numbers Tab */}
          {activeTab === 'owned' && (
            <div className="bg-white rounded-lg shadow">
              {ownedNumbers.length === 0 ? (
                <div className="p-8 text-center">
                  <Phone className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No phone numbers owned</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Purchase phone numbers to start making and receiving calls.
                  </p>
                  <div className="mt-6">
                    <Button 
                      onClick={() => setShowNumberBrowser(true)}
                      disabled={providers.length === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Browse Numbers
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ownedNumbers.map((number) => (
                      <TableRow key={number.phone_number}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{number.friendly_name}</div>
                            <div className="text-sm text-gray-500">{number.phone_number}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                              number.provider === 'twilio' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              <span className={`text-xs font-bold ${
                                number.provider === 'twilio' ? 'text-red-800' : 'text-blue-800'
                              }`}>
                                {number.provider === 'twilio' ? 'T' : 'P'}
                              </span>
                            </div>
                            <span className="text-sm">{getProviderDisplay(number.provider)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="capitalize text-sm">{number.number_type}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getCapabilityIcons(number.capabilities)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">${number.monthly_cost.toFixed(2)}/mo</span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            number.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {number.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNumberReleased(number.phone_number, number.provider)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Release
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        <ProviderSetup
          isOpen={showProviderSetup}
          onClose={() => setShowProviderSetup(false)}
          onProviderAdded={handleProviderAdded}
          existingProviders={providers.map(p => p.provider)}
        />

        <NumberBrowser
          isOpen={showNumberBrowser}
          onClose={() => setShowNumberBrowser(false)}
          onNumberPurchased={handleNumberPurchased}
          providers={providers}
        />
      </Layout>
    </ProtectedRoute>
  )
}