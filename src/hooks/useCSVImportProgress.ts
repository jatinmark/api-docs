import { useEffect, useState, useRef, useCallback } from 'react'
import { LeadAPI } from '@/lib/lead-api'

interface ImportProgress {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  total: number
  percentage: number
  success_count: number
  error_count: number
  errors?: Array<{ row?: number; error: string }>
  started_at?: string | null
  completed_at?: string | null
}

interface UseCSVImportProgressOptions {
  pollingInterval?: number // milliseconds
  onComplete?: (progress: ImportProgress) => void
  onError?: (error: Error) => void
}

export function useCSVImportProgress(
  jobId: string | null,
  accessToken: string | null,
  options: UseCSVImportProgressOptions = {}
) {
  const {
    pollingInterval = 2000, // Poll every 2 seconds by default
    onComplete,
    onError
  } = options

  const [progress, setProgress] = useState<ImportProgress | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  const checkStatus = useCallback(async () => {
    if (!jobId || !accessToken || !isMountedRef.current) return

    try {
      const status = await LeadAPI.getCSVImportStatus(jobId, accessToken)

      if (!isMountedRef.current) return

      const progressData: ImportProgress = {
        status: status.status,
        progress: status.processed_rows,
        total: status.total_rows,
        percentage: status.progress_percentage,
        success_count: status.success_count,
        error_count: status.error_count,
        errors: status.errors,
        started_at: status.started_at,
        completed_at: status.completed_at
      }

      setProgress(progressData)

      if (status.status === 'completed' || status.status === 'failed') {
        setIsComplete(true)

        // Clear interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }

        // Call completion callback
        if (onComplete) {
          onComplete(progressData)
        }

        if (status.status === 'failed' && status.errors?.length > 0) {
          const errorMessage = status.errors[0]?.error || 'Import failed'
          const err = new Error(errorMessage)
          setError(err)
          if (onError) {
            onError(err)
          }
        }
      }
    } catch (err) {
      if (!isMountedRef.current) return

      const error = err instanceof Error ? err : new Error('Failed to check import status')
      setError(error)
      setIsComplete(true)

      // Clear interval on error
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      if (onError) {
        onError(error)
      }
    }
  }, [jobId, accessToken, onComplete, onError])

  // Setup polling
  useEffect(() => {
    if (!jobId || !accessToken || isComplete) return

    // Initial check
    checkStatus()

    // Only setup polling interval if not already complete
    if (!isComplete) {
      intervalRef.current = setInterval(checkStatus, pollingInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, accessToken, pollingInterval, checkStatus, isComplete])

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  const reset = useCallback(() => {
    setProgress(null)
    setIsComplete(false)
    setError(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return {
    progress,
    isComplete,
    error,
    reset
  }
}