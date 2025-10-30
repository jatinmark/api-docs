'use client'

import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/logger'

interface RefreshOnFocusConfig {
  queryKey: readonly unknown[]
  enabled?: boolean
  minInterval?: number // Minimum time between refreshes (prevents too frequent refreshes)
}

/**
 * Hook to refresh data when user returns to the tab
 * Prevents excessive refreshes with a minimum interval
 */
export function useRefreshOnFocus({
  queryKey,
  enabled = true,
  minInterval = 30000 // 30 seconds minimum between refreshes
}: RefreshOnFocusConfig) {
  const queryClient = useQueryClient()
  const lastRefreshRef = useRef<Date>(new Date())

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      const now = new Date()
      const timeSinceLastRefresh = now.getTime() - lastRefreshRef.current.getTime()

      // Only refresh if enough time has passed
      if (timeSinceLastRefresh >= minInterval) {
        logger.info('Refreshing on tab focus', {
          queryKey,
          timeSinceLastRefresh
        })

        // Invalidate queries to trigger refresh
        queryClient.invalidateQueries({
          queryKey,
          refetchType: 'active'
        })

        lastRefreshRef.current = now
      } else {
        logger.debug('Skipping refresh - too soon', {
          timeSinceLastRefresh,
          minInterval
        })
      }
    }

    const handleVisibilityChange = () => {
      // Only refresh when tab becomes visible
      if (!document.hidden) {
        handleFocus()
      }
    }

    // Add event listeners
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, queryKey, queryClient, minInterval])
}

/**
 * Specialized hook for leads page with appropriate settings
 */
export function useLeadsRefreshOnFocus(enabled = true) {
  useRefreshOnFocus({
    queryKey: ['leads', 'list'] as const,
    enabled,
    minInterval: 30000 // Don't refresh more than once per 30 seconds
  })
}