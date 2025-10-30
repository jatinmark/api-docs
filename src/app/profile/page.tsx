'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { useAuth } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import { MembersTab } from '@/components/profile/MembersTab'
import { 
  User, 
  Users,
  HelpCircle, 
  Settings as SettingsIcon, 
  Webhook, 
  BarChart3,
  Mail,
  Phone,
  Calendar,
  Clock,
  Globe,
  ExternalLink,
  Copy,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Key,
  MoreHorizontal
} from 'lucide-react'
import { Fragment, useRef } from 'react'

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret: string
  status: 'active' | 'inactive'
  created_at: string
}

interface AIDefaults {
  default_voice_id: string
  business_hours_start: string
  business_hours_end: string
  timezone: string
  max_call_duration: number
  retry_attempts: number
  retry_delay: number
}

interface UsageStats {
  current_plan: string
  calls_this_month: number
  calls_limit: number
  leads_this_month: number
  leads_limit: number
  phone_numbers: number
  phone_numbers_limit: number
  monthly_cost: number
}

interface BillingStatus {
  billing_enabled: boolean
  billing_interval_seconds: number
  tokens_allocated: number
  tokens_soft_limit: number
  tokens_consumed: number
  tokens_reserved: number
  token_balance: number
  credit_limit: number
  credit_used: number
  credit_available: number
  total_available: number
  can_make_calls: boolean
  needs_topup: boolean
  usage_percentage: number
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'support' | 'usage' | 'api_keys' | 'members'>('profile')
  const [aiDefaults, setAIDefaults] = useState<AIDefaults>({
    default_voice_id: '',
    business_hours_start: '09:00',
    business_hours_end: '18:00',
    timezone: 'UTC',
    max_call_duration: 20,
    retry_attempts: 3,
    retry_delay: 30
  })

  // Helper function to format role display
  const formatRole = (role?: string) => {
    if (!role) return 'Team Member'
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'company_admin':
        return 'Company Admin'
      case 'member':
        return 'Team Member'
      default:
        return role
    }
  }
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: '1',
      name: 'Call Events',
      url: 'https://api.example.com/webhooks/calls',
      events: ['call.started', 'call.completed', 'call.failed'],
      secret: 'whsec_1234567890abcdef',
      status: 'active',
      created_at: '2025-01-15T10:00:00Z'
    }
  ])
  const [usageStats, setUsageStats] = useState<UsageStats>({
    current_plan: 'Pro',
    calls_this_month: 1250,
    calls_limit: 5000,
    leads_this_month: 850,
    leads_limit: 10000,
    phone_numbers: 5,
    phone_numbers_limit: 25,
    monthly_cost: 127.50
  })
  const [showWebhookForm, setShowWebhookForm] = useState(false)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})
  const { user, tokens } = useAuth()

  // API Keys mock state
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; created_at: string; revealed?: boolean; realKey?: string }>>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  const [apiKeysError, setApiKeysError] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [loadingKeyId, setLoadingKeyId] = useState<string | null>(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [modalKeyName, setModalKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)

  // Billing state
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const allTabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'members', name: 'Team Members', icon: Users },
    { id: 'support', name: 'Support', icon: HelpCircle },
    { id: 'usage', name: 'Usage', icon: BarChart3 },
    { id: 'api_keys', name: 'API Keys', icon: Key },
  ]
  
  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'members') {
      // Only show members tab for company admins and super admins
      return user?.role === 'company_admin' || user?.role === 'super_admin'
    }
    return true
  })

  const toggleSecretVisibility = (webhookId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [webhookId]: !prev[webhookId]
    }))
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (err) {
      logger.error('Failed to copy to clipboard:', err)
    }
  }

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

  // Helper for headers - memoized to prevent unnecessary re-renders
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (tokens?.access_token) headers['Authorization'] = `Bearer ${tokens.access_token}`
    return headers
  }, [tokens?.access_token])

  // Fetch billing status - memoized with all dependencies
  const fetchBillingStatus = useCallback(async () => {
    if (!user?.company_id) return

    setBillingLoading(true)
    setBillingError(null)
    try {
      const res = await fetch(`${API_BASE}/billing/status/${user.company_id}`, {
        credentials: 'include',
        headers: getAuthHeaders()
      })
      if (!res.ok) {
        throw new Error('Failed to fetch billing status')
      }
      const data = await res.json()
      setBillingStatus(data)
    } catch (e: any) {
      setBillingError(e.message || 'Failed to fetch billing status')
      logger.error('Failed to fetch billing status:', e)
    } finally {
      setBillingLoading(false)
    }
  }, [user?.company_id, API_BASE, getAuthHeaders])

  // Fetch billing status on mount and set up polling
  useEffect(() => {
    if (user?.company_id) {
      fetchBillingStatus()

      // Poll every 30 seconds to get updated balance
      const interval = setInterval(() => {
        fetchBillingStatus()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user?.company_id, fetchBillingStatus])

  // Fetch API keys on mount
  useEffect(() => {
    async function fetchKeys() {
      setApiKeysLoading(true)
      setApiKeysError(null)
      try {
        const resFetch = await fetch(`${API_BASE}/auth/api-keys`, {
          credentials: 'include',
          headers: getAuthHeaders()
        })
        if (!resFetch.ok) throw new Error('Failed to fetch API keys')
        const data = await resFetch.json()
        setApiKeys(Array.isArray(data) ? data : data.api_keys || [])
      } catch (e: any) {
        setApiKeysError(e.message || 'Failed to fetch API keys')
      } finally {
        setApiKeysLoading(false)
      }
    }
    fetchKeys()
  }, [tokens?.access_token, API_BASE, getAuthHeaders])

  useEffect(() => {
    if (!openMenuId) return;
    function handleClick(e: MouseEvent) {
      setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenuId])

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and application preferences</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
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

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">User Profile</h3>
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-gray-900">{user?.name || 'User Name'}</h4>
                    <p className="text-gray-600">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      {user?.name || 'John Doe'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      {user?.email || 'john@example.com'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company ID</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      {user?.company_id || 'Not assigned'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                      {formatRole(user?.role)}
                    </div>
                  </div>
                </div>

                {/* Token Balance Display */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Token Balance</h4>
                  {billingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : billingError ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">{billingError}</p>
                    </div>
                  ) : billingStatus ? (
                    <div className="space-y-4">
                      {/* Main Balance Card */}
                      <div className={`rounded-lg p-6 ${
                        billingStatus.can_make_calls
                          ? billingStatus.token_balance >= 0
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-yellow-50 border border-yellow-200'
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Available Balance</span>
                          <button
                            onClick={fetchBillingStatus}
                            className="text-xs text-gray-500 hover:text-gray-700"
                            title="Refresh balance"
                          >
                            Refresh
                          </button>
                        </div>
                        <div className="flex items-baseline space-x-2">
                          <span className={`text-4xl font-bold ${
                            billingStatus.can_make_calls
                              ? billingStatus.token_balance >= 0
                                ? 'text-green-700'
                                : 'text-yellow-700'
                              : 'text-red-700'
                          }`}>
                            {billingStatus.token_balance}
                          </span>
                          <span className="text-lg text-gray-600">tokens</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          {billingStatus.can_make_calls ? (
                            billingStatus.token_balance >= 0 ? (
                              <span className="text-green-700">✓ Ready to make calls</span>
                            ) : (
                              <span className="text-yellow-700">⚠ Using credit ({Math.abs(billingStatus.token_balance)} tokens)</span>
                            )
                          ) : (
                            <span className="text-red-700">✗ Credit limit reached - Top-up required</span>
                          )}
                        </div>
                      </div>

                      {/* Billing Interval */}
                      <div className="text-xs text-gray-500">
                        Billing interval: {billingStatus.billing_interval_seconds} seconds per token
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-600">Billing not configured for this account</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Profile information is managed by your system administrator. Contact support if you need to update your details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <MembersTab />
          )}

          {/* Support Tab */}
          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Help & Support</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <HelpCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-medium">Documentation</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Comprehensive guides and API documentation
                    </p>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Docs
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <Mail className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-medium">Email Support</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Get help from our support team
                    </p>
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      connect@conversailabs.com
                    </p>
                    <a href="mailto:connect@conversailabs.com">
                      <Button variant="outline" size="sm">
                        <Mail className="h-3 w-3 mr-1" />
                        Contact Support
                      </Button>
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Version:</span>
                    <span className="ml-2 text-gray-600">1.0.0</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">API Version:</span>
                    <span className="ml-2 text-gray-600">v1</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className="ml-2 text-green-600">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Defaults Tab */}


          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="bg-white rounded-lg shadow p-12">
              <div className="text-center">
                <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-2xl font-medium text-gray-900 mb-2">Usage Analytics</h3>
                <p className="text-lg text-gray-600">Coming Soon</p>
                <p className="text-sm text-gray-500 mt-4">
                  We&apos;re working on detailed usage analytics and billing information for you.
                </p>
              </div>
            </div>
          )}

          {/* API Keys Tab */}
          {activeTab === 'api_keys' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                <Key className="h-5 w-5 mr-2 text-primary-600" /> API Keys
              </h3>
              <p className="text-gray-600 mb-4">Create and manage your API keys for programmatic access.</p>
              <div className="mb-6">
                <Button onClick={() => setShowKeyModal(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Generate Key
                </Button>
              </div>
              {/* Toast */}
              {toast && (
                <div className="mb-4"><div className="bg-green-50 border border-green-200 text-green-800 rounded px-4 py-2 text-sm">{toast}</div></div>
              )}
              <div>
                {apiKeysLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading API keys...</div>
                ) : apiKeysError ? (
                  <div className="text-center py-8 text-red-600">{apiKeysError}</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No API keys created yet.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Key Value</TableHead>
                        <TableHead>Created at</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {apiKeys.map(k => (
                        <TableRow key={k.id}>
                          <TableCell>{k.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {k.revealed ? (
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded select-all">{k.realKey}</span>
                              ) : (
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">•••••••••••••••••••</span>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (!k.revealed) {
                                    setLoadingKeyId(k.id)
                                    try {
                                      const resReveal = await fetch(`${API_BASE}/auth/api-keys/${k.id}`, {
                                        credentials: 'include',
                                        headers: getAuthHeaders()
                                      })
                                      if (!resReveal.ok) throw new Error('Failed to fetch key value')
                                      const data = await resReveal.json()
                                      setApiKeys(prev => prev.map(ak => ak.id === k.id ? { ...ak, revealed: true, realKey: data.key } : ak))
                                    } catch (e: any) {
                                      setToast(e.message || 'Failed to fetch key value')
                                      setTimeout(() => setToast(null), 2000)
                                    } finally {
                                      setLoadingKeyId(null)
                                    }
                                  } else {
                                    setApiKeys(prev => prev.map(ak => ak.id === k.id ? { ...ak, revealed: false, realKey: undefined } : ak))
                                  }
                                }}
                                className="px-1"
                                title={k.revealed ? 'Hide' : 'Reveal'}
                              >
                                {loadingKeyId === k.id ? (
                                  <span className="animate-spin"><Eye className="h-4 w-4" /></span>
                                ) : k.revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (k.revealed && k.realKey) {
                                    await copyToClipboard(k.realKey)
                                    setCopiedKeyId(k.id)
                                    setTimeout(() => setCopiedKeyId(null), 1500)
                                  }
                                }}
                                className="px-1"
                                title={k.revealed ? 'Copy key' : 'Reveal to copy'}
                              >
                                {copiedKeyId === k.id ? 'Copied!' : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(k.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="relative">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="px-2"
                                title="More actions"
                                onClick={() => setOpenMenuId(openMenuId === k.id ? null : k.id)}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                              {openMenuId === k.id && (
                                <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow-lg z-10">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    disabled={deletingKeyId === k.id}
                                    onClick={async () => {
                                      setDeletingKeyId(k.id)
                                      try {
                                        const resDelete = await fetch(`${API_BASE}/auth/api-keys/${k.id}`, {
                                          method: 'DELETE',
                                          credentials: 'include',
                                          headers: getAuthHeaders()
                                        })
                                        if (!resDelete.ok) throw new Error('Failed to delete API key')
                                        setApiKeys(prev => prev.filter(key => key.id !== k.id))
                                        setOpenMenuId(null)
                                        setToast('Key deleted')
                                        setTimeout(() => setToast(null), 2000)
                                      } catch (e: any) {
                                        setToast(e.message || 'Failed to delete key')
                                        setTimeout(() => setToast(null), 2000)
                                      } finally {
                                        setDeletingKeyId(null)
                                      }
                                    }}
                                  >
                                    {deletingKeyId === k.id ? 'Deleting...' : 'Delete'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              <div className="mt-6 text-xs text-gray-500">
                <p>Keep your API keys secure. Keys are shown only once when created. Delete and re-generate if compromised.</p>
              </div>
            </div>
          )}
        </div>
        {/* Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-medium mb-4 flex items-center"><Key className="h-4 w-4 mr-2 text-primary-600" /> Create API Key</h4>
              <form
                onSubmit={async e => {
                  e.preventDefault()
                  if (!modalKeyName.trim()) return
                  setCreatingKey(true)
                  try {
                    const resCreate = await fetch(`${API_BASE}/auth/api-keys`, {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      credentials: 'include',
                      body: JSON.stringify({ name: modalKeyName })
                    })
                    if (!resCreate.ok) throw new Error('Failed to create API key')
                    const data = await resCreate.json()
                    setApiKeys(prev => [data, ...prev])
                    setShowKeyModal(false)
                    setModalKeyName('')
                    setToast('Key created')
                    setTimeout(() => setToast(null), 2000)
                  } catch (e: any) {
                    setToast(e.message || 'Failed to create key')
                    setTimeout(() => setToast(null), 2000)
                  } finally {
                    setCreatingKey(false)
                  }
                }}
                className="space-y-4"
              >
                <Input
                  label="Key Name"
                  placeholder="e.g. My App"
                  value={modalKeyName}
                  onChange={e => setModalKeyName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" type="button" onClick={() => { setShowKeyModal(false); setModalKeyName('') }} disabled={creatingKey}>Cancel</Button>
                  <Button type="submit" disabled={!modalKeyName.trim() || creatingKey}>
                    {creatingKey ? 'Creating...' : 'Create Key'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Layout>
    </ProtectedRoute>
  )
}