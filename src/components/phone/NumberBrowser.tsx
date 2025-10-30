'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { PhoneAPI, PhoneProvider, AvailablePhoneNumber, OwnedPhoneNumber } from '@/lib/phone-api'
import { useAuth } from '@/contexts/AuthContext'
import { Search, ShoppingCart, Phone, RefreshCw, Star } from 'lucide-react'

interface NumberBrowserProps {
  isOpen: boolean
  onClose: () => void
  onNumberPurchased: (number: OwnedPhoneNumber) => void
  providers: PhoneProvider[]
}

export function NumberBrowser({ isOpen, onClose, onNumberPurchased, providers }: NumberBrowserProps) {
  const [selectedProvider, setSelectedProvider] = useState<'twilio' | 'plivo'>('twilio')
  const [availableNumbers, setAvailableNumbers] = useState<AvailablePhoneNumber[]>([])
  const [loading, setLoading] = useState(false)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    area_code: '',
    country_code: 'US'
  })
  const { tokens } = useAuth()

  const availableProviders = providers.filter(p => ['twilio', 'plivo'].includes(p.provider))

  useEffect(() => {
    if (isOpen && availableProviders.length > 0) {
      setSelectedProvider(availableProviders[0].provider as 'twilio' | 'plivo')
    }
  }, [isOpen, availableProviders])

  const searchNumbers = async () => {
    if (!tokens?.access_token) return

    setLoading(true)
    setError(null)

    try {
      const response = await PhoneAPI.getAvailableNumbers(tokens.access_token, {
        provider: selectedProvider,
        country_code: filters.country_code,
        area_code: filters.area_code || undefined,
        limit: 20
      })
      
      setAvailableNumbers(response.numbers)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch available numbers')
      setAvailableNumbers([])
    } finally {
      setLoading(false)
    }
  }

  const purchaseNumber = async (number: AvailablePhoneNumber) => {
    if (!tokens?.access_token) return

    setPurchasing(number.phone_number)
    setError(null)

    try {
      const purchasedNumber = await PhoneAPI.purchaseNumber({
        phone_number: number.phone_number,
        provider: number.provider,
        capabilities: number.capabilities
      }, tokens.access_token)
      
      onNumberPurchased(purchasedNumber)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to purchase number')
    } finally {
      setPurchasing(null)
    }
  }

  const getCapabilityIcons = (capabilities: string[]) => {
    return capabilities.map(cap => {
      switch (cap) {
        case 'voice': return <span key={cap} title="Voice"><Phone className="h-3 w-3 text-green-600" /></span>
        case 'sms': return <span key={cap} className="text-xs font-bold text-blue-600" title="SMS">SMS</span>
        case 'mms': return <span key={cap} className="text-xs font-bold text-purple-600" title="MMS">MMS</span>
        default: return null
      }
    })
  }

  const getNumberTypeIcon = (type: string) => {
    switch (type) {
      case 'toll-free':
        return <span title="Toll-free"><Star className="h-3 w-3 text-yellow-500" /></span>
      case 'local':
        return <span title="Local"><Phone className="h-3 w-3 text-blue-500" /></span>
      case 'mobile':
        return <span title="Mobile"><Phone className="h-3 w-3 text-green-500" /></span>
      default:
        return null
    }
  }

  const handleClose = () => {
    setAvailableNumbers([])
    setError(null)
    setPurchasing(null)
    setFilters({ area_code: '', country_code: 'US' })
    onClose()
  }

  if (availableProviders.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Browse Phone Numbers" size="md">
        <div className="text-center py-8">
          <Phone className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No providers configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add Twilio or Plivo credentials before browsing phone numbers.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Browse & Purchase Phone Numbers" size="xl">
      <div className="space-y-6">
        {/* Provider and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as 'twilio' | 'plivo')}
            >
              {availableProviders.map(provider => (
                <option key={provider.provider} value={provider.provider}>
                  {provider.provider.charAt(0).toUpperCase() + provider.provider.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              value={filters.country_code}
              onChange={(e) => setFilters(prev => ({ ...prev, country_code: e.target.value }))}
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
            </select>
          </div>
          
          <Input
            label="Area Code (Optional)"
            value={filters.area_code}
            onChange={(e) => setFilters(prev => ({ ...prev, area_code: e.target.value }))}
            placeholder="415"
          />
          
          <div className="flex items-end">
            <Button onClick={searchNumbers} disabled={loading} className="w-full">
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Searching...' : 'Search Numbers'}
            </Button>
          </div>
        </div>

        {/* Provider Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">
            {selectedProvider.charAt(0).toUpperCase() + selectedProvider.slice(1)} Numbers
          </h4>
          <div className="text-sm text-blue-800">
            <p>Monthly cost: ${selectedProvider === 'twilio' ? '1.00' : '0.80'} per number</p>
            <p>Setup fee: One-time charge may apply</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {availableNumbers.length > 0 && (
          <div className="bg-white border rounded-lg">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">
                Available Numbers ({availableNumbers.length})
              </h3>
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Monthly Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableNumbers.map((number) => (
                  <TableRow key={number.phone_number}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{number.friendly_name}</div>
                        <div className="text-sm text-gray-500">{number.phone_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getNumberTypeIcon(number.number_type)}
                        <span className="capitalize text-sm">{number.number_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getCapabilityIcons(number.capabilities)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">${number.monthly_cost.toFixed(2)}/mo</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => purchaseNumber(number)}
                        disabled={purchasing === number.phone_number}
                      >
                        {purchasing === number.phone_number ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Purchase
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {!loading && availableNumbers.length === 0 && !error && (
          <div className="text-center py-8">
            <Phone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No numbers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try searching with different criteria or check back later.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}