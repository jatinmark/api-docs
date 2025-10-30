'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Agent } from '@/types'
import { FileText, Upload } from 'lucide-react'
import { LeadAPI } from '@/lib/lead-api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface CSVAgentSelectionProps {
  isOpen: boolean
  onClose: () => void
  agents: Agent[]
  onUploadClick: (agentId: string) => void
  preselectedAgentId?: string // Pre-selected agent from parent
}

export function CSVAgentSelection({ isOpen, onClose, agents, onUploadClick, preselectedAgentId }: CSVAgentSelectionProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const { tokens } = useAuth()

  // Pre-select agent from parent or auto-select single agent
  useEffect(() => {
    if (isOpen && !selectedAgent) {
      // First priority: Pre-selected agent from parent
      if (preselectedAgentId) {
        setSelectedAgent(preselectedAgentId)
      }
      // Second priority: Auto-select if only one agent
      else if (agents.length === 1) {
        setSelectedAgent(agents[0].id)
      }
    }
  }, [agents, selectedAgent, isOpen, preselectedAgentId])

  const handleDownloadSample = async () => {
    if (!selectedAgent || !tokens?.access_token) {
      toast.error('Please select an agent first')
      return
    }

    try {
      const blob = await LeadAPI.downloadSampleCSV(selectedAgent, tokens.access_token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sample_leads.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Sample CSV downloaded!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to download sample CSV')
    }
  }

  const handleUpload = () => {
    if (!selectedAgent) {
      toast.error('Please select an agent first')
      return
    }
    onUploadClick(selectedAgent)
  }

  const handleClose = () => {
    setSelectedAgent('') // Reset internal state
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Leads from CSV" size="lg">
      <div className="p-6 space-y-6">
        {/* Agent Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Agent <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="">Select agent...</option>
            {agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            All leads in the CSV will be assigned to the selected agent
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={handleDownloadSample}
            disabled={!selectedAgent}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Download Sample CSV</span>
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedAgent}
            className="flex-1 flex items-center justify-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Upload CSV</span>
          </Button>
        </div>

        {/* CSV Format Guidelines */}
        <div>
          <h3 className="text-lg font-medium mb-3">CSV Format Requirements</h3>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>first_name</strong> - Lead&apos;s first name</li>
              <li>• <strong>phone</strong> - Phone number (can be local format like 9876543210 or with country code like +919876543210)</li>
            </ul>
            <h4 className="font-medium text-blue-900 mt-3 mb-2">Optional Columns:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>schedule_at</strong> - Date and time for scheduling (format: DD-MM-YYYY HH:MM or DD/MM/YYYY HH:MM)</li>
              <li>• Any other columns will be stored as custom fields</li>
            </ul>
          </div>

          <div className="bg-red-50 border border-red-300 rounded p-3">
            <p className="text-sm font-semibold text-red-900 mb-2">
              ⚠️ Important CSV Guidelines:
            </p>
            <ul className="text-sm text-red-800 space-y-2">
              <li>
                <strong>Comma Usage:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• DO NOT use commas (,) in any field values</li>
                  <li>• Commas will split data into separate columns</li>
                  <li>• ❌ Wrong: &quot;Home Number, Society Name&quot;</li>
                  <li>• ✅ Correct: &quot;Home Number - Society Name&quot; or &quot;Home Number | Society Name&quot;</li>
                </ul>
              </li>
              <li>
                <strong>schedule_at Format:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Supported formats: DD-MM-YYYY HH:MM or DD/MM/YYYY HH:MM</li>
                  <li>• Date separator: - or /</li>
                  <li>• Time separator: :</li>
                  <li>• Examples: 01-06-2025 10:00 ✓ or 01/06/2025 14:30 ✓</li>
                  <li>• Business hours: 9 AM to 6 PM IST only</li>
                </ul>
              </li>
              <li>
                <strong>Phone Numbers:</strong>
                <ul className="ml-4 mt-1 space-y-1">
                  <li>• Can be with or without country code</li>
                  <li>• Without code: 9876543210 (uses selected country code)</li>
                  <li>• With code: +919876543210</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <strong>Call Scheduling:</strong>
            </p>
            <ul className="text-sm text-green-800 mt-1 space-y-1">
              <li>• If <strong>schedule_at</strong> is provided: Calls will be made at the specified date and time</li>
              <li>• If no <strong>schedule_at</strong>: Calls will be made within 60 seconds of import</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
