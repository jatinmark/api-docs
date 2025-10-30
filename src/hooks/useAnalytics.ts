'use client'

import { useEffect, useRef, useCallback } from 'react'
import analytics from '@/lib/analytics'

/**
 * Hook to access all analytics tracking functions
 */
export const useAnalytics = () => {
  return analytics
}

/**
 * Hook to track time spent on a page
 * Automatically tracks when user leaves the page
 */
export const usePageTimeTracking = (pageName: string) => {
  const startTime = useRef<number>(Date.now())

  useEffect(() => {
    startTime.current = Date.now()

    return () => {
      const timeSpentSeconds = Math.floor((Date.now() - startTime.current) / 1000)
      if (timeSpentSeconds > 0) {
        analytics.trackTimeOnPage(pageName, timeSpentSeconds)
      }
    }
  }, [pageName])
}

/**
 * Hook to track button clicks
 */
export const useButtonClickTracking = (buttonName: string, location: string) => {
  const trackClick = useCallback(() => {
    analytics.trackButtonClicked(buttonName, location)
  }, [buttonName, location])

  return trackClick
}

/**
 * Hook to track modal open/close
 */
export const useModalTracking = (modalName: string) => {
  const trackOpen = useCallback(() => {
    analytics.trackModalOpened(modalName)
  }, [modalName])

  const trackClose = useCallback(() => {
    analytics.trackModalClosed(modalName)
  }, [modalName])

  return { trackOpen, trackClose }
}

/**
 * Hook to track errors in components
 */
export const useErrorTracking = (componentName: string) => {
  const trackError = useCallback((error: Error | string, errorType: string = 'component_error') => {
    const errorMessage = typeof error === 'string' ? error : error.message
    analytics.trackError(`${componentName}: ${errorMessage}`, errorType)
  }, [componentName])

  return trackError
}

/**
 * Hook to automatically track API errors
 */
export const useAPIErrorTracking = () => {
  const trackAPICall = useCallback(async <T,>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    try {
      return await apiCall()
    } catch (error: any) {
      const statusCode = error?.response?.status || 0
      const errorMessage = error?.message || 'Unknown error'
      analytics.trackAPIError(endpoint, statusCode, errorMessage)
      throw error
    }
  }, [])

  return trackAPICall
}

/**
 * Hook to track feature usage
 */
export const useFeatureTracking = (featureName: string) => {
  const trackFeatureUse = useCallback((location?: string) => {
    analytics.trackFeatureUsed(featureName, location)
  }, [featureName])

  return trackFeatureUse
}

// Export all hooks
const analyticsHooks = {
  useAnalytics,
  usePageTimeTracking,
  useButtonClickTracking,
  useModalTracking,
  useErrorTracking,
  useAPIErrorTracking,
  useFeatureTracking,
}

export default analyticsHooks
