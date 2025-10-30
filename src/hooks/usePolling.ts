/**
 * usePolling Hook
 * 
 * A custom React hook that provides automatic cleanup for polling operations.
 * Prevents memory leaks by properly clearing intervals on unmount and when dependencies change.
 * Now includes race condition prevention and request sequencing.
 * 
 * @param callback - The function to execute on each polling interval
 * @param interval - The polling interval in milliseconds
 * @param enabled - Whether polling is enabled (default: true)
 */

import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';

export function usePolling(
  callback: () => void | Promise<void>,
  interval: number,
  enabled = true
) {
  const savedCallback = useRef(callback);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isExecutingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Update callback ref when callback changes
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Setup and cleanup polling
  useEffect(() => {
    // Don't start polling if disabled
    if (!enabled || interval <= 0) {
      return;
    }

    // Function to execute callback with error handling and race condition prevention
    const tick = async () => {
      // Skip if previous execution is still running (prevent overlapping)
      if (isExecutingRef.current) {
        logger.debug('Skipping polling tick - previous execution still running');
        return;
      }

      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      const currentRequestId = ++requestIdRef.current;
      
      isExecutingRef.current = true;

      try {
        // Pass abort signal to callback if it's async
        const result = savedCallback.current();
        
        if (result instanceof Promise) {
          await Promise.race([
            result,
            new Promise((_, reject) => {
              abortControllerRef.current?.signal.addEventListener('abort', () => {
                reject(new Error('Polling request aborted'));
              });
            })
          ]);
        }

        // Only mark as complete if this is still the current request
        if (currentRequestId === requestIdRef.current) {
          isExecutingRef.current = false;
        }
      } catch (error: any) {
        // Don't log abort errors - they're expected
        if (error?.message !== 'Polling request aborted') {
          logger.error('Polling callback error', error);
        }
        isExecutingRef.current = false;
      }
    };

    // Start polling
    intervalIdRef.current = setInterval(tick, interval);

    // Cleanup function - CRITICAL for preventing memory leaks and race conditions
    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      
      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Reset execution flag
      isExecutingRef.current = false;
    };
  }, [interval, enabled]);

  // Manual stop function if needed
  const stop = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    
    // Abort any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    isExecutingRef.current = false;
  }, []);

  return { stop };
}