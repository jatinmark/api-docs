/**
 * useLoadingOperation Hook
 * 
 * Provides loading state management for individual operations with automatic cleanup.
 * Integrates with LoadingContext for global state coordination.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLoading } from '@/contexts/LoadingContext';
import { logger } from '@/lib/logger';

interface LoadingOperationConfig {
  /** Unique identifier for the operation */
  operationId: string;
  /** Auto cleanup timeout in ms (default: 30000) */
  timeout?: number;
  /** Whether to integrate with global LoadingContext */
  useGlobalContext?: boolean;
  /** Custom error handler */
  onError?: (error: Error) => void;
  /** Custom success handler */
  onSuccess?: (result?: any) => void;
}

interface LoadingOperationResult<T = any> {
  /** Current loading state */
  isLoading: boolean;
  /** Error state if operation failed */
  error: string | null;
  /** Result data from last successful operation */
  data: T | null;
  /** Execute the async operation */
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  /** Reset the operation state */
  reset: () => void;
  /** Cancel ongoing operation */
  cancel: () => void;
}

export function useLoadingOperation<T = any>(
  config: LoadingOperationConfig
): LoadingOperationResult<T> {
  const {
    operationId,
    timeout = 30000,
    useGlobalContext = true,
    onError,
    onSuccess
  } = config;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);
  
  const { startLoading, stopLoading } = useLoading();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Cancel ongoing operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Stop global loading
      if (useGlobalContext) {
        stopLoading(operationId);
      }
    };
  }, [operationId, stopLoading, useGlobalContext]);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    // Cancel previous operation if running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Only update state if component is still mounted
    if (!isMountedRef.current) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    // Start global loading if enabled
    if (useGlobalContext) {
      startLoading(operationId);
    }

    // Set timeout for operation
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        abortControllerRef.current.abort();
        
        if (isMountedRef.current) {
          setError(`Operation timed out after ${timeout}ms`);
          setIsLoading(false);
          
          if (useGlobalContext) {
            stopLoading(operationId);
          }
        }
      }
    }, timeout);

    try {
      logger.debug(`Starting operation: ${operationId}`);
      
      const result = await operation();
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Only update state if component is still mounted and not aborted
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setData(result);
        setError(null);
        
        // Call success handler
        if (onSuccess) {
          onSuccess(result);
        }
        
        logger.debug(`Operation completed successfully: ${operationId}`);
      }
      
      return result;
    } catch (err) {
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Don't treat abort as error
      if (err instanceof Error && err.name === 'AbortError') {
        logger.debug(`Operation aborted: ${operationId}`);
        return null;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setError(errorMessage);
        
        // Call error handler
        if (onError && err instanceof Error) {
          onError(err);
        }
        
        logger.error(`Operation failed: ${operationId}`, err);
      }
      
      return null;
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setIsLoading(false);
        
        if (useGlobalContext) {
          stopLoading(operationId);
        }
      }
      
      // Clean up abort controller
      abortControllerRef.current = null;
    }
  }, [operationId, timeout, useGlobalContext, startLoading, stopLoading, onError, onSuccess]);

  const reset = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setError(null);
    setData(null);
    
    if (isLoading && useGlobalContext) {
      stopLoading(operationId);
    }
    
    setIsLoading(false);
    
    logger.debug(`Operation reset: ${operationId}`);
  }, [operationId, isLoading, useGlobalContext, stopLoading]);

  const cancel = useCallback(() => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
      logger.debug(`Operation cancelled: ${operationId}`);
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [operationId]);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    cancel
  };
}

// Convenience hook for simple loading operations
export function useSimpleLoadingOperation(operationId: string) {
  return useLoadingOperation<any>({
    operationId,
    useGlobalContext: true,
    timeout: 30000
  });
}

// Hook for operations that shouldn't use global context
export function useLocalLoadingOperation<T = any>(operationId: string) {
  return useLoadingOperation<T>({
    operationId,
    useGlobalContext: false,
    timeout: 15000
  });
}