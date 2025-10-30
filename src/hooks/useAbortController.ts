/**
 * useAbortController Hook
 * 
 * A custom React hook that manages AbortController lifecycle for fetch requests.
 * Automatically cancels requests on component unmount to prevent memory leaks
 * and "setState on unmounted component" warnings.
 * 
 * @returns {object} Object containing:
 *   - signal: AbortSignal for fetch requests
 *   - abort: Manual abort function
 *   - isAborted: Boolean indicating if controller was aborted
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const isAbortedRef = useRef(false);

  // Create new AbortController on mount
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    isAbortedRef.current = false;

    // Cleanup function - abort any pending requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        isAbortedRef.current = true;
      }
    };
  }, []);

  // Manual abort function
  const abort = useCallback(() => {
    if (abortControllerRef.current && !isAbortedRef.current) {
      abortControllerRef.current.abort();
      isAbortedRef.current = true;
    }
  }, []);

  // Reset function to create new controller after abort
  const reset = useCallback(() => {
    if (isAbortedRef.current) {
      abortControllerRef.current = new AbortController();
      isAbortedRef.current = false;
    }
  }, []);

  // Get current signal
  const getSignal = useCallback(() => {
    return abortControllerRef.current?.signal;
  }, []);

  // Return memoized object to prevent unnecessary re-renders
  return useMemo(() => ({
    signal: getSignal(),
    abort,
    reset,
    isAborted: isAbortedRef.current
  }), [abort, reset, getSignal]);
}

/**
 * Helper hook for multiple concurrent requests with individual abort control
 */
export function useMultipleAbortControllers(count: number) {
  const controllersRef = useRef<AbortController[]>([]);

  useEffect(() => {
    // Create controllers
    controllersRef.current = Array.from({ length: count }, () => new AbortController());

    // Cleanup - abort all controllers
    return () => {
      controllersRef.current.forEach(controller => controller.abort());
    };
  }, [count]);

  const abortAll = useCallback(() => {
    controllersRef.current.forEach(controller => controller.abort());
  }, []);

  const abortOne = useCallback((index: number) => {
    if (controllersRef.current[index]) {
      controllersRef.current[index].abort();
    }
  }, []);

  const getSignal = useCallback((index: number) => {
    return controllersRef.current[index]?.signal;
  }, []);

  return {
    getSignal,
    abortOne,
    abortAll
  };
}