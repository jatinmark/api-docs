'use client'

export const dynamic = 'force-dynamic';

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Company } from '@/types'
import { Building2, Save, Users, Phone, Clock } from 'lucide-react'

const mockCompany: Company = {
  id: '1',
  name: 'HealthCare Corp',
  admin_user_id: '1',
  max_agents_limit: 100,
  max_concurrent_calls: 5,
  total_minutes_limit: 10000,
  total_minutes_used: 2450,
  max_contact_attempts: 6,
  settings: {
    timezone: 'UTC',
    business_hours_start: '09:00',
    business_hours_end: '18:00'
  },
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}

export default function CompanyPage() {
  const [company, setCompany] = useState<Company>(mockCompany)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: company.name,
    max_agents_limit: company.max_agents_limit,
    max_concurrent_calls: company.max_concurrent_calls,
    total_minutes_limit: company.total_minutes_limit,
    business_hours_start: company.settings.business_hours_start,
    business_hours_end: company.settings.business_hours_end
  })

  const handleSave = () => {
    setCompany(prev => ({
      ...prev,
      name: formData.name,
      max_agents_limit: formData.max_agents_limit,
      max_concurrent_calls: formData.max_concurrent_calls,
      total_minutes_limit: formData.total_minutes_limit,
      settings: {
        ...prev.settings,
        business_hours_start: formData.business_hours_start,
        business_hours_end: formData.business_hours_end
      },
      updated_at: new Date().toISOString()
    }))
    setIsEditing(false)
  }

  const handleCancel = () => {
    setFormData({
      name: company.name,
      max_agents_limit: company.max_agents_limit,
      max_concurrent_calls: company.max_concurrent_calls,
      total_minutes_limit: company.total_minutes_limit,
      business_hours_start: company.settings.business_hours_start,
      business_hours_end: company.settings.business_hours_end
    })
    setIsEditing(false)
  }

  const usagePercentage = company.total_minutes_limit 
    ? Math.round((company.total_minutes_used / company.total_minutes_limit) * 100)
    : 0

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Company Settings</h1>
            <p className="text-gray-600">Manage your company information and limits</p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Settings
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Building2 className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Company Information</h2>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={isEditing ? formData.name : company.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company ID
                    </label>
                    <input
                      type="text"
                      value={company.id}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Created Date
                    </label>
                    <input
                      type="text"
                      value={new Date(company.created_at).toLocaleDateString()}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Limits & Quotas</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Agents Limit"
                    type="number"
                    value={isEditing ? formData.max_agents_limit : company.max_agents_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_agents_limit: parseInt(e.target.value) }))}
                    disabled={!isEditing}
                  />
                  <Input
                    label="Max Concurrent Calls"
                    type="number"
                    value={isEditing ? formData.max_concurrent_calls : company.max_concurrent_calls}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_concurrent_calls: parseInt(e.target.value) }))}
                    disabled={!isEditing}
                  />
                </div>
                
                <Input
                  label="Total Minutes Limit"
                  type="number"
                  value={isEditing ? formData.total_minutes_limit : company.total_minutes_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_minutes_limit: parseInt(e.target.value) }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Clock className="h-5 w-5 text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Business Hours</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={isEditing ? formData.business_hours_start : company.settings.business_hours_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_hours_start: e.target.value }))}
                  disabled={!isEditing}
                />
                <Input
                  label="End Time"
                  type="time"
                  value={isEditing ? formData.business_hours_end : company.settings.business_hours_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_hours_end: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <input
                  type="text"
                  value={company.settings.timezone}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Timezone cannot be changed. Contact support if needed.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Minutes Used</span>
                    <span>{company.total_minutes_used} / {company.total_minutes_limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        usagePercentage > 80 ? 'bg-red-500' : 
                        usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{usagePercentage}% used</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Agents</span>
                    <span className="font-medium">2 / {company.max_agents_limit}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Concurrent Calls</span>
                    <span className="font-medium">0 / {company.max_concurrent_calls}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Calls Today</span>
                    <span className="font-medium">15</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Phone className="h-4 w-4 mr-2" />
                  Manage Phone Numbers
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View All Agents
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Export Usage Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Layout>
    </ProtectedRoute>
  )
}