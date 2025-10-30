'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import {
  SkeletonAudioPlayer,
  SkeletonTranscript,
  SkeletonCard
} from '@/components/ui/SkeletonLoader';
import { useParams, useRouter } from 'next/navigation';
import { calliqAPI } from '@/lib/calliq-api';
import { CallIQCall } from '@/types/calliq';
import { CallDetailsView } from '@/components/calliq/CallDetailsView';
import { transformKeyMoments } from '@/lib/call-utils';
import { usePolling } from '@/hooks/usePolling';
import { useAbortController } from '@/hooks/useAbortController';
import ImprovementReport from '@/components/calliq/ImprovementReport';
import { asyncSessionStorage } from '@/lib/storage-utils';


export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;
  
  const [call, setCall] = useState<CallIQCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<string>('');
  const shareSuccessTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add abort controller for cleanup
  const { signal, abort } = useAbortController();
  const isMountedRef = useRef(true);

  const loadCallData = useCallback(async (bypassCache = false) => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;
    
    try {
      // Don't show loading spinner on auto-refresh
      if (!autoRefreshInterval) {
        setLoading(true);
      }
      
      const callData = await calliqAPI.getCall(callId, bypassCache);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Transform key_moments if present
        if (callData.key_moments) {
          logger.debug('Raw key_moments from backend:', { keyMoments: callData.key_moments });
          const transformed = transformKeyMoments(callData.key_moments);
          logger.debug('Transformed key_moments:', { transformed });
          callData.key_moments = transformed;
        }
        setCall(callData);

        // Check if call is still processing
        // Original logic: check if status is in processing statuses
        // const processingStatuses = ['uploaded', 'transcribing', 'analyzing'];
        // console.log('[CallDetailPage] Call status:', callData.status);
        // setIsProcessing(processingStatuses.includes(callData.status));

        // New logic: Stop auto-refresh once transcript is available
        const hasTranscript = callData.transcript &&
                             callData.transcript.segments &&
                             callData.transcript.segments.length > 0;
        console.log('[CallDetailPage] Call status:', callData.status, 'Has transcript:', hasTranscript);

        // Only keep processing if transcript is not yet available
        const processingStatuses = ['uploaded', 'transcribing'];
        setIsProcessing(!hasTranscript && processingStatuses.includes(callData.status));

        setLastRefreshTime(new Date());
      }
    } catch (error: any) {
      // Don't log or handle if request was aborted
      if (error?.name === 'AbortError') {
        return;
      }
      
      logger.error('CallDetail API Error', error);
      // Don't throw error on auto-refresh to avoid breaking the page
      if (!autoRefreshInterval) {
        throw error;
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current && !autoRefreshInterval) {
        setLoading(false);
      }
    }
  }, [callId, autoRefreshInterval, signal]);

  // Retrieve company info from session storage on mount
  useEffect(() => {
    const loadCompanyInfo = async () => {
      const savedCompanyInfo = await asyncSessionStorage.getItem<string>('calliq_company_info');
      console.log('[CallDetailPage] Retrieved company info from session storage:', savedCompanyInfo);
      if (savedCompanyInfo && isMountedRef.current) {
        setCompanyInfo(savedCompanyInfo);
        console.log('[CallDetailPage] Set companyInfo state:', savedCompanyInfo);
      } else {
        console.log('[CallDetailPage] No company info found in session storage');
      }
    };
    loadCompanyInfo();
  }, []);

  // Initial load and cleanup on unmount
  useEffect(() => {
    // Ensure mount tracking is properly reset on component mount
    isMountedRef.current = true;

    if (callId) {
      loadCallData();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      abort(); // Cancel any pending requests

      // Clear share success timeout
      if (shareSuccessTimeoutRef.current) {
        clearTimeout(shareSuccessTimeoutRef.current);
        shareSuccessTimeoutRef.current = null;
      }

      // Clean up auto-refresh interval
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    };
  }, [callId, loadCallData, abort, autoRefreshInterval]);

  // Use polling hook for auto-refresh with automatic cleanup
  usePolling(
    async () => {
      if (isMountedRef.current) {
        try {
          await loadCallData();
        } catch (err: any) {
          // Don't log abort errors
          if (err?.name !== 'AbortError') {
            logger.warn('Auto-refresh error', err);
          }
        }
      }
    },
    5000, // Refresh every 5 seconds
    isProcessing // Only poll when call is processing
  );

  const handleReanalyze = async () => {
    if (!isMountedRef.current) return; // Prevent execution if component is unmounted
    
    setReanalyzing(true);
    
    // The abort controller is now managed by the useAbortController hook
    
    try {
      await calliqAPI.reanalyzeCall(callId);
      
      // Only proceed if component is still mounted
      if (isMountedRef.current) {
        await loadCallData();
      }
    } catch (error: any) {
      // Only log error if it's not due to abort
      if (error?.name !== 'AbortError') {
        logger.error('Failed to reanalyze', error);
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setReanalyzing(false);
      }
    }
  };

  const handleShare = async () => {
    try {
      // Create share URL using the new share route
      const shareUrl = `${window.location.origin}/share/${callId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      
      // Show success feedback with proper cleanup
      setShareSuccess(true);
      if (shareSuccessTimeoutRef.current) {
        clearTimeout(shareSuccessTimeoutRef.current);
      }
      shareSuccessTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setShareSuccess(false);
        }
      }, 3000);
      
      logger.info('Share URL copied to clipboard', { shareUrl });
    } catch (error) {
      logger.error('Failed to copy share link', error);
      
      // Create share URL for fallback
      const shareUrl = `${window.location.origin}/share/${callId}`;
      
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setShareSuccess(true);
          if (shareSuccessTimeoutRef.current) {
            clearTimeout(shareSuccessTimeoutRef.current);
          }
          shareSuccessTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setShareSuccess(false);
            }
          }, 3000);
          logger.info('Share URL copied to clipboard (fallback)', { shareUrl });
        } else {
          logger.error('Fallback copy command failed');
        }
      } catch (fallbackError) {
        logger.error('Fallback copy failed', fallbackError);
        // As a last resort, you could show the URL in an alert or modal
        alert(`Copy this link to share: ${shareUrl}`);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleBack = () => {
    router.push('/calliq/calls');
  };

  if (!call || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header skeleton */}
          <SkeletonCard className="h-24" />
          
          {/* Audio player skeleton */}
          <SkeletonAudioPlayer />
          
          {/* Score cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
          
          {/* Transcript skeleton */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
            <SkeletonTranscript />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <CallDetailsView
        call={call}
        loading={loading}
        isProcessing={isProcessing}
        reanalyzing={reanalyzing}
        lastRefreshTime={lastRefreshTime}
        shareSuccess={shareSuccess}
        onBack={handleBack}
        onReanalyze={handleReanalyze}
        onShare={handleShare}
        showBackButton={true}
        showActions={true}
        showFooter={false}
      />


      {/* Debug: Log company info being passed as prop */}
      {console.log('[CallDetailPage] Passing companyInfo to ImprovementReport:', companyInfo)}

      <ImprovementReport
        callId={Array.isArray(params.id) ? params.id[0] : params.id}
        companyInfo={companyInfo}
      />
    </>


  );
}