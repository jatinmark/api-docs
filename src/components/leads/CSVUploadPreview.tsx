'use client'

import { useState, useRef, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Lead, Agent } from '@/types'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { LeadAPI } from '@/lib/lead-api'
import { useAuth } from '@/contexts/AuthContext'
import { leadKeys } from '@/hooks/useLeads'
import { useCSVImportProgress } from '@/hooks/useCSVImportProgress'
import toast from 'react-hot-toast'

interface CSVUploadPreviewProps {
  isOpen: boolean
  onClose: () => void
  onImport: (leads: Lead[]) => void
  agentId: string  // Pre-selected from Modal 1
  agents: Agent[]  // For display purposes
}

export function CSVUploadPreview({ isOpen, onClose, onImport, agentId, agents }: CSVUploadPreviewProps) {
  const [file, setFile] = useState<File | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string>('IN')
  const [importing, setImporting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [preview, setPreview] = useState<any[]>([])
  const [importResult, setImportResult] = useState<{ success_count: number; error_count: number; errors: Array<{ row?: number; error: string }> } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasShownSuccessToastRef = useRef(false)
  const { tokens } = useAuth()
  const queryClient = useQueryClient()

  // Use the progress hook
  const { progress, reset: resetProgress } = useCSVImportProgress(
    jobId,
    tokens?.access_token || null,
    {
      onComplete: (finalProgress) => {
        setImporting(false)
        if (finalProgress.status === 'completed') {
          setImportResult({
            success_count: finalProgress.success_count,
            error_count: finalProgress.error_count,
            errors: finalProgress.errors || []
          })
          // Invalidate leads cache to trigger refresh
          queryClient.invalidateQueries({ queryKey: leadKeys.lists() })

          if (!hasShownSuccessToastRef.current) {
            hasShownSuccessToastRef.current = true
            if (finalProgress.error_count === 0) {
              toast.success(`Successfully imported ${finalProgress.success_count} leads!`)
              setTimeout(() => {
                onImport([])
                handleClose()
              }, 2000)
            } else {
              toast(`Imported ${finalProgress.success_count} leads with ${finalProgress.error_count} errors`, {
                icon: '⚠️',
              })
            }
          }
        }
      },
      onError: (err) => {
        setImporting(false)
        setErrors([err.message])
        toast.error(err.message)
      }
    }
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Check file type
      if (selectedFile.type !== 'text/csv') {
        setErrors(['Please select a valid CSV file'])
        return
      }

      // Check file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      if (selectedFile.size > MAX_FILE_SIZE) {
        setErrors(['File too large. Maximum size is 5MB'])
        return
      }

      setFile(selectedFile)
      parseCSV(selectedFile)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim())
        const rows = lines.slice(1, 6).map(line => {
          const values = line.split(',').map(v => v.trim())
          return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || ''
            return obj
          }, {} as Record<string, string>)
        })
        setPreview(rows)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!file || !agentId || !tokens?.access_token) {
      setErrors(['Please upload a CSV file'])
      return
    }

    // Create new abort controller for this import
    abortControllerRef.current = new AbortController()

    setImporting(true)
    setErrors([])
    setImportResult(null)
    setJobId(null)
    hasShownSuccessToastRef.current = false

    try {
      // Start the import job
      const jobResponse = await LeadAPI.startCSVImport(
        file,
        agentId,
        tokens.access_token,
        selectedCountry,
        abortControllerRef.current.signal
      )

      // Set the job ID to start progress tracking
      setJobId(jobResponse.job_id)

      toast.success('CSV import started! Processing in background...')

    } catch (error: any) {
      setImporting(false)
      if (error.name === 'AbortError') {
        // Import was cancelled, don't show error
        console.log('CSV import cancelled')
      } else {
        setErrors([error instanceof Error ? error.message : 'Failed to start CSV import'])
        toast.error(error instanceof Error ? error.message : 'Failed to start CSV import')
      }
      abortControllerRef.current = null
    }
  }

  const resetState = () => {
    setFile(null)
    setSelectedCountry('IN')
    setImporting(false)
    setJobId(null)
    setErrors([])
    setPreview([])
    setImportResult(null)
    resetProgress()
    hasShownSuccessToastRef.current = false
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    // Abort any ongoing upload
    if (abortControllerRef.current && importing) {
      abortControllerRef.current.abort()
    }
    resetState()
    onClose()
  }

  // Get agent name for display
  const selectedAgentName = agents.find(a => a.id === agentId)?.name || 'Selected Agent'

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Upload CSV" size="lg">
      <div className="p-6 space-y-6">
        {/* Agent Display */}
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-800">
            <strong>Importing leads for:</strong> {selectedAgentName}
          </p>
        </div>

        {!file && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload CSV file
                </span>
                <span className="mt-1 block text-sm text-gray-500">
                  or drag and drop
                </span>
              </label>
              <input
                ref={fileInputRef}
                id="csv-upload"
                name="csv-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileSelect}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              CSV up to 5MB
            </p>
          </div>
        )}

        {file && !importing && !progress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{file.name}</span>
              <Button variant="outline" size="sm" onClick={resetState}>
                Remove
              </Button>
            </div>

            {/* Country Code Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country Code <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
              >
                <option value="IN">India (+91)</option>
                <option value="US">United States (+1)</option>
                <option value="GB">United Kingdom (+44)</option>
                <option value="AU">Australia (+61)</option>
                <option value="CA">Canada (+1)</option>
                <option value="SG">Singapore (+65)</option>
                <option value="AE">UAE (+971)</option>
                <option value="SA">Saudi Arabia (+966)</option>
                <option value="QA">Qatar (+974)</option>
                <option value="KW">Kuwait (+965)</option>
                <option value="MY">Malaysia (+60)</option>
                <option value="ID">Indonesia (+62)</option>
                <option value="PH">Philippines (+63)</option>
                <option value="TH">Thailand (+66)</option>
                <option value="VN">Vietnam (+84)</option>
                <option value="BD">Bangladesh (+880)</option>
                <option value="PK">Pakistan (+92)</option>
                <option value="LK">Sri Lanka (+94)</option>
                <option value="NP">Nepal (+977)</option>
                <option value="ZA">South Africa (+27)</option>
                <option value="NG">Nigeria (+234)</option>
                <option value="KE">Kenya (+254)</option>
                <option value="EG">Egypt (+20)</option>
                <option value="DE">Germany (+49)</option>
                <option value="FR">France (+33)</option>
                <option value="IT">Italy (+39)</option>
                <option value="ES">Spain (+34)</option>
                <option value="NL">Netherlands (+31)</option>
                <option value="BE">Belgium (+32)</option>
                <option value="CH">Switzerland (+41)</option>
                <option value="AT">Austria (+43)</option>
                <option value="SE">Sweden (+46)</option>
                <option value="NO">Norway (+47)</option>
                <option value="DK">Denmark (+45)</option>
                <option value="FI">Finland (+358)</option>
                <option value="RU">Russia (+7)</option>
                <option value="JP">Japan (+81)</option>
                <option value="CN">China (+86)</option>
                <option value="KR">South Korea (+82)</option>
                <option value="BR">Brazil (+55)</option>
                <option value="MX">Mexico (+52)</option>
                <option value="AR">Argentina (+54)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Phone numbers without country codes will automatically get this prefix
              </p>
            </div>

            {preview.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Preview (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(preview[0]).map(key => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview.map((row, index) => (
                        <tr key={index}>
                          {Object.values(row).map((value, cellIndex) => (
                            <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {value as string}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {importing && progress && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium">
                {progress.status === 'pending' && 'Preparing import...'}
                {progress.status === 'processing' && `Processing ${progress.progress} of ${progress.total} rows...`}
                {progress.status === 'completed' && 'Import completed!'}
                {progress.status === 'failed' && 'Import failed'}
              </div>

              {progress.status === 'processing' && (
                <>
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-600">{progress.percentage}%</div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-green-800 font-medium">{progress.success_count}</div>
                      <div className="text-green-600">Successful</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-red-800 font-medium">{progress.error_count}</div>
                      <div className="text-red-600">Failed</div>
                    </div>
                  </div>
                </>
              )}

              {progress.error_count > 0 && progress.status === 'processing' && (
                <p className="mt-4 text-sm text-yellow-600">
                  Some rows are failing. You can download the error report after completion.
                </p>
              )}

              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (abortControllerRef.current) {
                      abortControllerRef.current.abort()
                    }
                    setImporting(false)
                    setJobId(null)
                    toast('Import process will continue in the background')
                    handleClose()
                  }}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Close (Continue in Background)
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Show simplified loading state when waiting for first progress update */}
        {importing && !progress && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-lg font-medium">Starting import...</div>
              <div className="mt-2">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full animate-pulse"
                    style={{ width: '30%' }}
                  />
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Uploading file and preparing to process...
              </p>
            </div>
          </div>
        )}

        {importResult && (
          <div className="text-center space-y-4">
            {importResult.error_count === 0 ? (
              <>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <div>
                  <div className="text-lg font-medium text-green-800">Import completed!</div>
                  <div className="text-sm text-gray-600">
                    Successfully imported {importResult.success_count} leads
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
                <div>
                  <div className="text-lg font-medium text-yellow-800">Import completed with warnings</div>
                  <div className="text-sm text-gray-600">
                    Successfully imported {importResult.success_count} leads, {importResult.error_count} failed
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-4 text-left">
                    <h4 className="font-medium text-red-800 mb-2">Import Errors:</h4>
                    <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResult.errors.map((error, index) => (
                          <li key={index}>
                            {error.row ? `Row ${error.row}: ` : ''}{error.error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {errors.length > 0 && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Import Errors</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {file && !importing && !importResult && (
            <Button onClick={handleImport}>
              Import Leads
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
