'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { callKeys } from './useCalls'
import { logger } from '@/lib/logger'

interface CallUpdate {
  type: 'call_updated' | 'call_created' | 'metrics_updated'
  call_id: string
  data: any
}

interface ConnectionManager {
  eventSource: EventSource | null
  isConnecting: boolean
  reconnectAttempts: number
  reconnectTimeout: NodeJS.Timeout | null
  subscribers: Set<(update: CallUpdate) => void>
  errorHandlers: Set<(error: Error) => void>
  token: string | null
}

// Global connection manager to prevent duplicate SSE connections
const connectionManager: ConnectionManager = {
  eventSource: null,
  isConnecting: false,
  reconnectAttempts: 0,
  reconnectTimeout: null,
  subscribers: new Set(),
  errorHandlers: new Set(),
  token: null
}

interface UseCallUpdatesOptions {
  enabled?: boolean
  onUpdate?: (update: CallUpdate) => void
  onError?: (error: Error) => void
}

export function useCallUpdates(options: UseCallUpdatesOptions = {}) {
  const { enabled = true, onUpdate, onError } = options
  const { tokens } = useAuth()
  const queryClient = useQueryClient()
  const isSubscribedRef = useRef(false)

  // Update a specific call in the cache
  const updateCallInCache = useCallback((callId: string, updateData: any) => {
    // Update call history cache
    queryClient.setQueriesData(
      { queryKey: callKeys.history() },
      (oldData: any) => {
        if (!oldData?.calls) return oldData

        const updatedCalls = oldData.calls.map((call: any) => {
          // Check multiple ID fields for matching
          if (
            call.id === callId ||
            call.call_id === callId ||
            call.raw_webhook_data?.id === callId ||
            call.retell_call_id === callId ||
            call.bolna_call_id === callId
          ) {
            // Merge the update data
            return {
              ...call,
              ...updateData,
              // Preserve certain fields that shouldn't be overwritten
              id: call.id,
              lead_id: call.lead_id,
              agent_id: call.agent_id
            }
          }
          return call
        })

        return {
          ...oldData,
          calls: updatedCalls
        }
      }
    )

    // Also invalidate metrics as they might have changed
    queryClient.invalidateQueries({ queryKey: callKeys.metrics() })
  }, [queryClient])

  // Global connection management
  const connectGlobal = useCallback(() => {
    // Skip during SSR - EventSource is browser-only
    if (typeof window === 'undefined') return

    if (!tokens?.access_token) return

    // Check if already connected or connecting (1 = OPEN state)
    if (connectionManager.eventSource?.readyState === 1) {
      // logger.info('SSE already connected, reusing existing connection')
      return
    }

    if (connectionManager.isConnecting) {
      // logger.info('SSE connection already in progress, skipping duplicate')
      return
    }

    // Check if token has changed
    if (connectionManager.token !== tokens.access_token) {
      // Token changed, need to reconnect
      if (connectionManager.eventSource) {
        logger.info('Token changed, closing old connection')
        connectionManager.eventSource.close()
        connectionManager.eventSource = null
      }
      connectionManager.token = tokens.access_token
    }

    try {
      connectionManager.isConnecting = true
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const sseUrl = `${apiUrl}/calls/events?token=${encodeURIComponent(tokens.access_token)}`

      // logger.info('Creating new SSE connection', {
      //   subscribers: connectionManager.subscribers.size,
      //   timestamp: new Date().toISOString()
      // })

      // Ensure EventSource is available (browser-only)
      if (!window.EventSource) {
        logger.warn('EventSource not available in this environment')
        connectionManager.isConnecting = false
        return
      }

      const eventSource = new EventSource(sseUrl, {
        withCredentials: true
      })

      eventSource.onopen = () => {
        logger.info('SSE connection established', {
          subscribers: connectionManager.subscribers.size
        })
        connectionManager.reconnectAttempts = 0
        connectionManager.isConnecting = false
      }

      eventSource.onmessage = (event) => {
        try {
          const update: CallUpdate = JSON.parse(event.data)
          logger.info('Broadcasting update to subscribers', {
            type: update.type,
            subscribers: connectionManager.subscribers.size
          })

          // Broadcast to all subscribers
          connectionManager.subscribers.forEach(callback => {
            try {
              callback(update)
            } catch (error) {
              logger.error('Error in subscriber callback', error)
            }
          })
        } catch (error) {
          logger.error('Error processing SSE message', error)
        }
      }

      eventSource.onerror = (error) => {
        logger.error('SSE connection error', error)
        connectionManager.isConnecting = false
        eventSource.close()
        connectionManager.eventSource = null

        // Notify all error handlers
        connectionManager.errorHandlers.forEach(handler => {
          try {
            handler(new Error('SSE connection lost'))
          } catch (err) {
            logger.error('Error in error handler', err)
          }
        })

        // Attempt to reconnect with exponential backoff
        if (connectionManager.reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, connectionManager.reconnectAttempts), 30000)
          logger.info(`Reconnecting in ${delay}ms (attempt ${connectionManager.reconnectAttempts + 1})`)

          if (connectionManager.reconnectTimeout) {
            clearTimeout(connectionManager.reconnectTimeout)
          }

          connectionManager.reconnectTimeout = setTimeout(() => {
            connectionManager.reconnectAttempts++
            connectGlobal()
          }, delay)
        } else {
          logger.error('Max reconnection attempts reached')
        }
      }

      connectionManager.eventSource = eventSource
    } catch (error) {
      logger.error('Failed to create SSE connection', error)
      connectionManager.isConnecting = false
    }
  }, [tokens?.access_token])

  // Local subscription handler
  const handleUpdate = useCallback((update: CallUpdate) => {
    // Update cache based on update type
    switch (update.type) {
      case 'call_updated':
      case 'call_created':
        updateCallInCache(update.call_id, update.data)
        break
      case 'metrics_updated':
        queryClient.invalidateQueries({ queryKey: callKeys.metrics() })
        break
    }

    // Call user callback if provided
    onUpdate?.(update)
  }, [updateCallInCache, queryClient, onUpdate])

  // Subscribe to global connection
  useEffect(() => {
    if (!enabled || !tokens?.access_token) return

    // Subscribe to updates
    connectionManager.subscribers.add(handleUpdate)
    isSubscribedRef.current = true

    // Subscribe to errors
    if (onError) {
      connectionManager.errorHandlers.add(onError)
    }

    // Connect if not already connected
    connectGlobal()

    // Cleanup on unmount
    return () => {
      connectionManager.subscribers.delete(handleUpdate)
      if (onError) {
        connectionManager.errorHandlers.delete(onError)
      }
      isSubscribedRef.current = false

      // If no more subscribers, close the connection
      if (connectionManager.subscribers.size === 0) {
        // logger.info('No more subscribers, closing SSE connection')
        if (connectionManager.eventSource) {
          connectionManager.eventSource.close()
          connectionManager.eventSource = null
        }
        if (connectionManager.reconnectTimeout) {
          clearTimeout(connectionManager.reconnectTimeout)
          connectionManager.reconnectTimeout = null
        }
        connectionManager.reconnectAttempts = 0
        connectionManager.token = null
      }
    }
  }, [enabled, tokens?.access_token, handleUpdate, onError, connectGlobal])

  // Handle visibility change - reconnect when page becomes visible
  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' &&
          !connectionManager.eventSource &&
          connectionManager.subscribers.size > 0) {
        logger.info('Page became visible, reconnecting SSE')
        connectGlobal()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [enabled, connectGlobal])

  return {
    connected: typeof window !== 'undefined' && connectionManager.eventSource?.readyState === 1, // 1 = OPEN
    reconnect: connectGlobal,
    disconnect: () => {
      // Force disconnect (for testing/debugging)
      if (connectionManager.eventSource) {
        connectionManager.eventSource.close()
        connectionManager.eventSource = null
      }
    },
    subscriberCount: connectionManager.subscribers.size
  }
}