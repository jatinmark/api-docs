/**
 * LoadingContext
 * 
 * Coordinates loading states across the application.
 * Provides centralized loading management to prevent UI inconsistencies.
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface LoadingOperation {
  id: string;
  description?: string;
  startTime: number;
}

interface LoadingContextType {
  // Loading state management
  isLoading: boolean;
  operations: Map<string, LoadingOperation>;
  
  // Methods
  startLoading: (id: string, description?: string) => void;
  stopLoading: (id: string) => void;
  isOperationLoading: (id: string) => boolean;
  getLoadingCount: () => number;
  clearAllLoading: () => void;
  
  // Global loading indicator
  showGlobalLoader: boolean;
  setShowGlobalLoader: (show: boolean) => void;
  
  // Loading progress (for operations that report progress)
  progress: Map<string, number>;
  setProgress: (id: string, progress: number) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [operations, setOperations] = useState<Map<string, LoadingOperation>>(new Map());
  const [showGlobalLoader, setShowGlobalLoader] = useState(false);
  const [progress, setProgressState] = useState<Map<string, number>>(new Map());
  const operationsRef = useRef(operations);
  
  // Update ref when operations change
  React.useEffect(() => {
    operationsRef.current = operations;
  }, [operations]);

  const startLoading = useCallback((id: string, description?: string) => {
    setOperations(prev => {
      const newOps = new Map(prev);
      newOps.set(id, {
        id,
        description,
        startTime: Date.now()
      });
      
      logger.debug('Loading started', { 
        id, 
        description, 
        totalOperations: newOps.size 
      });
      
      return newOps;
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    setOperations(prev => {
      const newOps = new Map(prev);
      const operation = newOps.get(id);
      
      if (operation) {
        const duration = Date.now() - operation.startTime;
        logger.debug('Loading completed', { 
          id, 
          description: operation.description,
          duration: `${duration}ms`,
          remainingOperations: newOps.size - 1
        });
        
        newOps.delete(id);
      }
      
      return newOps;
    });
    
    // Clear progress for this operation
    setProgressState(prev => {
      const newProgress = new Map(prev);
      newProgress.delete(id);
      return newProgress;
    });
  }, []);

  const isOperationLoading = useCallback((id: string): boolean => {
    return operationsRef.current.has(id);
  }, []);

  const getLoadingCount = useCallback((): number => {
    return operationsRef.current.size;
  }, []);

  const clearAllLoading = useCallback(() => {
    logger.debug('Clearing all loading operations', { 
      count: operationsRef.current.size 
    });
    setOperations(new Map());
    setProgressState(new Map());
  }, []);

  const setProgress = useCallback((id: string, progressValue: number) => {
    setProgressState(prev => {
      const newProgress = new Map(prev);
      newProgress.set(id, Math.min(100, Math.max(0, progressValue)));
      return newProgress;
    });
  }, []);

  const isLoading = operations.size > 0;

  const value: LoadingContextType = {
    isLoading,
    operations,
    startLoading,
    stopLoading,
    isOperationLoading,
    getLoadingCount,
    clearAllLoading,
    showGlobalLoader,
    setShowGlobalLoader,
    progress,
    setProgress
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {showGlobalLoader && isLoading && <GlobalLoadingIndicator />}
    </LoadingContext.Provider>
  );
}

// Global loading indicator component
function GlobalLoadingIndicator() {
  const context = useContext(LoadingContext);
  if (!context) return null;

  const loadingCount = context.operations.size;
  const firstOperation = Array.from(context.operations.values())[0];

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-blue-500 h-1">
        <div className="bg-blue-600 h-full animate-pulse" style={{ width: '100%' }} />
      </div>
      {firstOperation?.description && (
        <div className="bg-blue-500 text-white text-xs px-2 py-1 text-center">
          {firstOperation.description}
          {loadingCount > 1 && ` (+${loadingCount - 1} more)`}
        </div>
      )}
    </div>
  );
}

// Hook to use loading context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within LoadingProvider');
  }
  return context;
}

// Hook for managing a specific loading operation
export function useLoadingOperation(operationId: string) {
  const { startLoading, stopLoading, isOperationLoading, setProgress } = useLoading();
  
  const start = useCallback((description?: string) => {
    startLoading(operationId, description);
  }, [startLoading, operationId]);
  
  const stop = useCallback(() => {
    stopLoading(operationId);
  }, [stopLoading, operationId]);
  
  const updateProgress = useCallback((progress: number) => {
    setProgress(operationId, progress);
  }, [setProgress, operationId]);
  
  const isLoading = isOperationLoading(operationId);
  
  // Auto-cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopLoading(operationId);
    };
  }, [stopLoading, operationId]);
  
  return {
    start,
    stop,
    updateProgress,
    isLoading
  };
}

// HOC to wrap components with loading state
export function withLoading<P extends object>(
  Component: React.ComponentType<P & { isLoading: boolean }>,
  operationId: string
) {
  return function WrappedComponent(props: P) {
    const { isLoading } = useLoadingOperation(operationId);
    return <Component {...props} isLoading={isLoading} />;
  };
}