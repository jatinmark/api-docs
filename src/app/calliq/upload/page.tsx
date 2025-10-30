'use client';

export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  UploadCloudIcon,
  FileAudioIcon,
  XIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  DownloadIcon,
  FileTextIcon
} from 'lucide-react';
import { calliqAPI } from '@/lib/calliq-api';
import { BulkUploadMonitor } from '@/components/calliq/BulkUploadMonitor';
import { CSVUploadResponse, BulkStatusResponse } from '@/types/calliq';
import { useAbortController } from '@/hooks/useAbortController';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { asyncSessionStorage } from '@/lib/storage-utils';

type UploadMethod = 'single' | 'bulk';
type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface FileUpload {
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  result?: any;
  message?: string;
}

// Error Notification Component
function ErrorNotification({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 10000); // Auto-close after 10 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start">
        <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-red-400 hover:text-red-600"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function CallIQUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('single');
  const [isDragging, setIsDragging] = useState(false);
  const [fileUpload, setFileUpload] = useState<FileUpload | null>(null);
  const [bulkFiles, setBulkFiles] = useState<FileUpload[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [csvUploadResult, setCsvUploadResult] = useState<CSVUploadResponse | null>(null);
  const [bulkStatus, setBulkStatus] = useState<BulkStatusResponse | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [RepName,setRepName]= useState('')
  const [callSuccess, setCallSuccess] = useState<'success' | 'failed' | 'unknown'>('unknown');
  const [companyInfo, setCompanyInfo] = useState('');
  const [companyInfoList, setCompanyInfoList] = useState<string[]>([]);
  const [loadingCompanyInfo, setLoadingCompanyInfo] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Add mount tracking to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  // Enhanced progress tracking
  const [progressMessage, setProgressMessage] = useState('');
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Rotating processing messages
  const processingMessages = [
    '👂 Identifying speakers and dialogue...',
    '🎯 Detecting key moments in conversation...',
    '💬 Analyzing conversation flow...',
    '📝 Transcribing audio content...',
    '🔍 Finding pricing discussions...',
    '🎪 Identifying objections and concerns...',
    '🏢 Detecting competitor mentions...',
    '💡 Extracting customer pain points...',
    '📋 Capturing next steps and action items...',
    '🧠 AI processing speech patterns...',
    '📊 Calculating talk ratios...',
    '✨ Generating insights from dialogue...',
    '🎤 Separating speaker voices...',
    '📈 Analyzing sales performance metrics...',
    '🔄 Processing conversation dynamics...'
  ];
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const messageRotationRef = useRef<NodeJS.Timeout | null>(null);
  
  // Dynamic progress messages based on upload stage
  const getProgressMessage = (progress: number, status: UploadStatus) => {
    if (status === 'uploading') {
      if (progress < 10) return '🚀 Initializing secure upload...';
      if (progress < 25) return '📤 Uploading your audio file...';
      if (progress < 50) return '⚡ Processing file data...';
      if (progress < 75) return '🔄 Almost there, finalizing upload...';
      if (progress < 90) return '✨ Preparing for AI analysis...';
      return '🎯 Upload complete! Starting analysis...';
    }
    if (status === 'processing') {
      // Return the current rotating message for processing
      return processingMessages[currentMessageIndex];
    }
    return 'Processing...';
  };
  
  // Start enhanced progress tracking
  const startEnhancedProgress = useCallback((status: UploadStatus) => {
    // Clear any existing intervals
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    if (messageRotationRef.current) {
      clearInterval(messageRotationRef.current);
      messageRotationRef.current = null;
    }
    
    setCurrentMessageIndex(0);
    setProgressMessage(getProgressMessage(0, status));
    
    // Remove the automatic 1% progress increment
    // Progress will now only update based on actual backend status
    
    // If processing, rotate messages every 5 seconds
    if (status === 'processing') {
      messageRotationRef.current = setInterval(() => {
        if (!isMountedRef.current) return;
        
        setCurrentMessageIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % processingMessages.length;
          setProgressMessage(processingMessages[nextIndex]);
          return nextIndex;
        });
      }, 5000); // Rotate every 5 seconds
    }
  }, [processingMessages]);
  
  // Stop enhanced progress tracking
  const stopEnhancedProgress = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (messageRotationRef.current) {
      clearInterval(messageRotationRef.current);
      messageRotationRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);
  
  // Cleanup on unmount and refresh demo status on mount
  useEffect(() => {
    // Ensure mount tracking is properly reset on component mount
    isMountedRef.current = true;
    
    // Refresh demo status when page loads
    queryClient.invalidateQueries({ queryKey: ['demo', 'status'] });
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
      
      // Abort any ongoing upload when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Clear progress interval
      stopEnhancedProgress();
      
      // Clear any polling timeouts
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [queryClient, stopEnhancedProgress]);
  
  // Load persisted processing job on mount
  useEffect(() => {
    const loadPersistedJob = async () => {
      const savedJobId = await asyncSessionStorage.getItem<string>('calliq_processing_job');
      const savedJobType = await asyncSessionStorage.getItem<string>('calliq_processing_type');
    
    if (savedJobId && savedJobType === 'bulk') {
      // Resume monitoring bulk upload
      setIsMonitoring(true);
      calliqAPI.monitorBulkUpload(
        savedJobId,
        (status: BulkStatusResponse) => {
          setBulkStatus(status);
        },
        (finalStatus: BulkStatusResponse) => {
          setBulkStatus(finalStatus);
          setIsMonitoring(false);
          asyncSessionStorage.removeItem('calliq_processing_job');
          asyncSessionStorage.removeItem('calliq_processing_type');
          
          if (finalStatus.failed_calls === 0) {
            setErrorMessage(`✅ All ${finalStatus.completed_calls} calls processed successfully!`);
          } else {
            setErrorMessage(`📊 Processing complete: ${finalStatus.completed_calls} successful, ${finalStatus.failed_calls} failed`);
          }
        }
      );
    } else if (savedJobId && savedJobType === 'single') {
      // Resume monitoring single file upload
      const savedFileName = await asyncSessionStorage.getItem<string>('calliq_processing_filename');
      const savedStatus = await asyncSessionStorage.getItem<string>('calliq_processing_status');
      const savedCallId = await asyncSessionStorage.getItem<string>('calliq_processing_call_id'); // Retrieve saved call ID
      
      // Set initial state based on saved status
      const progressMap: Record<string, number> = {
        'uploaded': 60,
        'transcribing': 75,
        'analyzing': 90,
        'completed': 100
      };
      
      const initialProgress = progressMap[savedStatus || 'processing'] || 50;
      
      setFileUpload({
        file: new File([], savedFileName || 'Processing...'),
        status: 'processing',
        progress: initialProgress,
        result: { id: savedCallId || savedJobId } // Ensure we have the ID for the View Analysis button
      });
      
      // Resume progress tracking for the resumed session
      if (initialProgress < 95) {
        startEnhancedProgress('processing');
      }
      
      // Start polling for status updates
      const pollStatus = async () => {
        try {
          // Check if component is still mounted
          if (!isMountedRef.current) {
            return;
          }
          
          const call = await calliqAPI.getCallStatus(savedJobId);
          
          // Update progress based on actual status
          const progressValues: Record<string, number> = {
            'uploaded': 60,
            'transcribing': 75,
            'analyzing': 90,
            'completed': 100
          };
          const currentProgress = progressValues[call.status] || 50;
          
          // Only update state if component is still mounted
          if (isMountedRef.current) {
            setFileUpload(prev => prev ? { 
              ...prev, 
              status: call.status === 'completed' ? 'completed' : 
                     call.status === 'failed' ? 'failed' : 'processing',
              progress: currentProgress,
              result: { ...call, id: savedCallId || call.id || savedJobId }, // Ensure ID is preserved
              error: call.status === 'failed' ? call.error_message : undefined
            } : null);
          }
          
          // Save current status
          await asyncSessionStorage.setItem('calliq_processing_status', call.status);
          
          if (call.status === 'completed' || call.status === 'failed') {
            // Clear storage on terminal states
            await asyncSessionStorage.removeItem('calliq_processing_job');
            await asyncSessionStorage.removeItem('calliq_processing_call_id'); // Clear call ID
            await asyncSessionStorage.removeItem('calliq_processing_type');
            await asyncSessionStorage.removeItem('calliq_processing_filename');
            await asyncSessionStorage.removeItem('calliq_processing_status');
          } else {
            // Continue polling for non-terminal states only if component is still mounted
            if (isMountedRef.current) {
              // Clear existing timeout
              if (pollTimeoutRef.current) {
                clearTimeout(pollTimeoutRef.current);
              }
              pollTimeoutRef.current = setTimeout(pollStatus, 3000);
            }
          }
        } catch (err: any) {
          logger.error('Failed to check processing status', err);
          
          // If call doesn't exist (404), clear storage and stop
          if (err.message && (err.message.includes('not found') || err.message.includes('404'))) {
            await asyncSessionStorage.removeItem('calliq_processing_job');
            await asyncSessionStorage.removeItem('calliq_processing_call_id'); // Clear call ID
            await asyncSessionStorage.removeItem('calliq_processing_type');
            await asyncSessionStorage.removeItem('calliq_processing_filename');
            await asyncSessionStorage.removeItem('calliq_processing_status');
            
            // Only update state if component is still mounted
            if (isMountedRef.current) {
              setFileUpload(null);
            }
            return; // Stop polling
          }
          
          // For other errors, retry if component still mounted
          if (isMountedRef.current) {
            if (pollTimeoutRef.current) {
              clearTimeout(pollTimeoutRef.current);
            }
            pollTimeoutRef.current = setTimeout(pollStatus, 5000); // Retry after 5 seconds
          }
        }
      };
      
      // Start polling
      pollStatus();
    }
    };
    
    // Set a small delay then mark as loaded
    setTimeout(() => {
      if (isMountedRef.current) {
        setInitialLoading(false);
      }
    }, 500);
    
    loadPersistedJob();
  }, []);

  // Fetch company info list on mount
  useEffect(() => {
    const fetchCompanyInfoList = async () => {
      setLoadingCompanyInfo(true);
      try {
        const list = await calliqAPI.getCompanyInfoList();
        console.log('[UploadPage] Fetched company info list:', list);
        console.log('[UploadPage] List length:', list?.length);
        console.log('[UploadPage] List is array?', Array.isArray(list));

        setCompanyInfoList(list);
        // If list has items, auto-use the first one
        if (list && list.length > 0) {
          console.log('[UploadPage] Auto-filling with:', list[0]);
          setCompanyInfo(list[0]);
        } else {
          console.log('[UploadPage] List is empty, showing input field');
        }
      } catch (err: any) {
        console.error('[UploadPage] Failed to fetch company info list:', err);
        logger.error('Failed to fetch company info list', err);
      } finally {
        setLoadingCompanyInfo(false);
      }
    };

    fetchCompanyInfoList();
  }, []);

  // Updated to match backend allowed extensions
  const supportedFormats = [
    'mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac', 'flac',
    'mp4', 'mpeg', 'opus', 'wma', 'amr', '3gp', 'ac3',
    'aiff', 'au', 'm4b', 'mka', 'ra', 'voc', 'wv'
  ];
  const maxFileSize = 100 * 1024 * 1024; // 100MB

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (uploadMethod === 'single' && files.length > 0) {
      handleSingleFile(files[0]);
    } else if (uploadMethod === 'bulk' && files.length > 0) {
      handleBulkCSV(files[0]);
    }
  };

  const handleSingleFile = (file: File) => {
    // Clear any previous errors and metadata
    setErrorMessage(null);
    setCustomerName('');
    setCallSuccess('unknown');
    // Don't clear companyInfo - it's persistent company data, not per-call metadata

    // Clear enhanced progress
    stopEnhancedProgress();
    setProgressMessage('');
    setCurrentMessageIndex(0);
    
    // Validate file
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      const errorMsg = `File format '.${extension}' is not supported.\n\nSupported audio formats: ${supportedFormats.slice(0, 7).join(', ')} and more...`;
      setErrorMessage(errorMsg);
      return;
    }

    if (file.size > maxFileSize) {
      setErrorMessage(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 100MB limit.\nPlease compress or trim your audio file.`);
      return;
    }

    // Just set the file with idle status - don't upload yet
    const upload: FileUpload = {
      file,
      status: 'idle',
      progress: 0
    };
    setFileUpload(upload);
  };

  const handleUploadWithMetadata = async () => {
    if (!fileUpload) {
      return;
    }
    
    // Update status to uploading
    setFileUpload(prev => prev ? {...prev, status: 'uploading'} : null);
    
    // Start enhanced progress tracking
    startEnhancedProgress('uploading');
    
    // Create new abort controller for this upload
    abortControllerRef.current = new AbortController();
    
    // Upload to backend with metadata
    try {
      const uploadMetadata = {
        rep_name: RepName?.trim() || undefined,
        customer_name: customerName?.trim() || undefined,
        call_success: callSuccess !== 'unknown' ? callSuccess : undefined
      };

      // Store company info in session storage to use later in ImprovementReport
      if (companyInfo?.trim()) {
        const trimmedCompanyInfo = companyInfo.trim();
        await asyncSessionStorage.setItem('calliq_company_info', trimmedCompanyInfo);
        console.log('[UploadPage] Saved company info to session storage:', trimmedCompanyInfo);
      } else {
        console.log('[UploadPage] No company info to save (empty or undefined)');
      }
      
      const result = await calliqAPI.uploadAudio(
        { 
          file: fileUpload.file,
          metadata: uploadMetadata
        },
        (progress) => {
          // Only update state if component is still mounted
          if (!isMountedRef.current) return;
          
          setFileUpload(prev => {
            if (!prev) return null;
            
            // Save processing state when we get a call ID
            if (progress.result?.id) {
              asyncSessionStorage.setItem('calliq_processing_job', progress.result.id);
              asyncSessionStorage.setItem('calliq_processing_call_id', progress.result.id); // Save call ID separately
              asyncSessionStorage.setItem('calliq_processing_type', 'single');
              asyncSessionStorage.setItem('calliq_processing_filename', fileUpload.file.name);
              
              // Save the actual backend status
              if (progress.result.status) {
                asyncSessionStorage.setItem('calliq_processing_status', progress.result.status);
              }
            }
            
            // Handle status transitions for enhanced progress
            if (progress.status === 'processing' && prev.status === 'uploading') {
              // Switch to processing progress tracking
              stopEnhancedProgress();
              startEnhancedProgress('processing');
            }
            
            // Clear processing state when completed or failed
            if (progress.status === 'completed' || progress.status === 'failed') {
              asyncSessionStorage.removeItem('calliq_processing_job');
              asyncSessionStorage.removeItem('calliq_processing_call_id'); // Clear call ID
              asyncSessionStorage.removeItem('calliq_processing_type');
              asyncSessionStorage.removeItem('calliq_processing_filename');
              asyncSessionStorage.removeItem('calliq_processing_status');
              
              // Stop enhanced progress tracking
              stopEnhancedProgress();
              
              // Set final progress and message
              if (progress.status === 'completed') {
                setProgressMessage('🎉 Analysis complete! Ready to view insights.');
              } else if (progress.status === 'failed') {
                setProgressMessage('❌ Upload failed. Please try again.');
              }
            }
            
            return {
              ...prev,
              status: progress.status as UploadStatus,
              progress: progress.progress || 0, // Use only actual backend progress
              result: progress.result,
              error: progress.error,
              message: progress.message
            };
          });
        },
        abortControllerRef.current.signal
      );
    } catch (error) {
      // If upload was aborted (user navigated away), don't show error
      if (error instanceof Error && error.message.includes('aborted')) {
        return;
      }
      
      let errorMsg = 'Upload failed';
      
      if (error instanceof Error) {
        // Parse error message for user-friendly display
        if (error.message.includes('Invalid file format')) {
          errorMsg = error.message;
        } else if (error.message.includes('File too large')) {
          errorMsg = 'File size exceeds the maximum limit of 100MB';
        } else if (
          error.message.includes('demo limit') || 
          error.message.includes('Demo limit') || 
          error.message.includes('limit reached') ||
          error.message.includes('402') ||
          error.message.includes('Payment Required') ||
          error.message.includes('exhausted')
        ) {
          // Demo limit reached - refresh the demo status
          errorMsg = error.message || 'Demo analysis limit reached. Please upgrade your account to continue.';
          queryClient.invalidateQueries({ queryKey: ['demo', 'status'] });
        } else if (error.message.includes('Network')) {
          errorMsg = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMsg = 'Authentication error. Please log in again.';
        } else if (error.message.includes('503')) {
          errorMsg = 'Service temporarily unavailable. Please try again later.';
        } else {
          errorMsg = error.message || 'An unexpected error occurred';
        }
      }
      
      // Stop enhanced progress tracking on error
      stopEnhancedProgress();
      setProgressMessage('❌ Upload failed. Please try again.');
      
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setErrorMessage(errorMsg);
        setFileUpload(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: 'failed',
            error: errorMsg
          };
        });
      }
    }
  };

  const handleBulkCSV = async (file: File) => {
    // Clear any previous errors and states
    setErrorMessage(null);
    setCsvUploadResult(null);
    setBulkStatus(null);
    setBulkFiles([]);
    
    if (!file.name.endsWith('.csv')) {
      if (isMountedRef.current) {
        setErrorMessage('Invalid file type. Please upload a CSV file with the required columns: audio_url, title, rep_name, customer_name, date');
      }
      return;
    }

    try {
      
      // Upload CSV to backend
      const result = await calliqAPI.bulkUpload({ csv_file: file });
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setCsvUploadResult(result);
      }
      
      
      if (result.status === 'success' && result.job_id) {
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setIsMonitoring(true);
        }
        
        // Save job ID for persistence
        asyncSessionStorage.setItem('calliq_processing_job', result.job_id);
        asyncSessionStorage.setItem('calliq_processing_type', 'bulk');
        
        // Start monitoring the bulk upload progress
        await calliqAPI.monitorBulkUpload(
          result.job_id,
          (status: BulkStatusResponse) => {
            // Only update state if component is still mounted
            if (isMountedRef.current) {
              setBulkStatus(status);
            }
          },
          (finalStatus: BulkStatusResponse) => {
            // Only update state if component is still mounted
            if (isMountedRef.current) {
              setBulkStatus(finalStatus);
              setIsMonitoring(false);
              
              // Show completion message
              if (finalStatus.failed_calls === 0) {
                setErrorMessage(`✅ All ${finalStatus.completed_calls} calls processed successfully!`);
              } else {
                setErrorMessage(`📊 Processing complete: ${finalStatus.completed_calls} successful, ${finalStatus.failed_calls} failed`);
              }
            }
            
            // Clear persisted state (always do this regardless of mount status)
            asyncSessionStorage.removeItem('calliq_processing_job');
            asyncSessionStorage.removeItem('calliq_processing_type');
          }
        );
        
        // Show initial success message only if component is still mounted
        if (isMountedRef.current) {
          if (result.errors_count === 0) {
            setErrorMessage(`✅ CSV uploaded successfully! ${result.created_calls} calls created and processing started.`);
          } else {
            setErrorMessage(`⚠️ CSV uploaded with ${result.errors_count} errors. ${result.created_calls} calls created and processing started.`);
          }
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      logger.error('CSV upload failed', error);
      
      let errorMsg = 'Failed to upload CSV file';
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMsg = 'Connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMsg = 'Authentication error. Please refresh the page and try again.';
        } else {
          errorMsg = error.message;
        }
      }
      
      // Only update error state if component is still mounted
      if (isMountedRef.current) {
        setErrorMessage(`❌ ${errorMsg}`);
        setIsMonitoring(false);
      }
    }
  };

  const handleRetryCall = async (callId: string) => {
    // This would typically call a retry API endpoint
    // For now, just log the action
    
    // Only update state if component is still mounted
    if (isMountedRef.current) {
      setErrorMessage(`🔄 Retrying call ${callId.slice(-8)}...`);
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'audio_url,title,rep_name,customer_name,date\nhttps://storage.googleapis.com/bucket/call1.mp3,Discovery Call,John Smith,ABC Corp,2024-01-15\nhttps://s3.amazonaws.com/bucket/call2.wav,Follow-up Meeting,Jane Doe,XYZ Inc,2024-01-16\nhttps://cdn.example.com/call3.m4a,Closing Call,Mike Johnson,Tech Solutions,2024-01-17';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calliq_bulk_upload_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusIcon = (status: UploadStatus) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <LoaderIcon className="w-5 h-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <FileAudioIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadStatus) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing audio...';
      case 'completed': return 'Ready for analysis';
      case 'failed': return 'Upload failed';
      default: return 'Waiting...';
    }
  };

  // Show skeleton loader during initial load
  if (initialLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div>
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Upload area skeleton */}
        <SkeletonCard className="h-64" />
        
        {/* Additional info skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
      {/* Error Notification */}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Calls</h1>
        <p className="text-gray-600">Upload your call recordings for AI-powered analysis</p>
      </div>

      {/* Upload Method Toggle - Hidden for now */}
      {/* <div className="bg-white rounded-lg shadow p-1 inline-flex">
        <button
          onClick={() => setUploadMethod('single')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            uploadMethod === 'single' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Single File
        </button>
        <button
          onClick={() => setUploadMethod('bulk')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            uploadMethod === 'bulk' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Bulk CSV
        </button>
      </div> */}

      {/* Single File Upload - Always shown now */}
      {
        <div className="bg-white rounded-lg shadow">
          {!fileUpload ? (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloudIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag and drop your audio file here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse
              </p>
              <p className="text-xs text-gray-400">
                Supported formats: {supportedFormats.join(', ')} • Max size: 100MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={supportedFormats.map(f => `.${f}`).join(',')}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSingleFile(file);
                }}
              />
            </div>
          ) : (
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4">
                  {getStatusIcon(fileUpload.status)}
                  <div>
                    <p className="font-medium text-gray-900">{fileUpload.file.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileUpload.file.size)} • {getStatusText(fileUpload.status)}
                    </p>
                    {fileUpload.status === 'idle' && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ☁️ Secure cloud upload
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFileUpload(null);
                    setRepName('');
                    setCustomerName('');
                    setCallSuccess('unknown');
                    // Don't clear companyInfo - it's persistent company data
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Metadata Form - Show when file is selected but not uploaded yet */}
              {fileUpload.status === 'idle' && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Call Details (Optional)</h3>
                  <div className="space-y-4">
                    {/* Customer Name Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                        }}
                        placeholder="Enter customer name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Representative Name
                      </label>
                      <input
                        type="text"
                        value={RepName}
                        onChange={(e) => {
                          setRepName(e.target.value);
                        }}
                        placeholder="Enter Representative name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Company URL Info */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Website URL
                      </label>
                      {loadingCompanyInfo ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                      ) : companyInfoList.length > 0 ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                          <CheckCircleIcon className="h-4 w-4" />
                          <span className="font-medium">Already have business information</span>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={companyInfo}
                          onChange={(e) => setCompanyInfo(e.target.value)}
                          placeholder="Enter company website URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* Call Success Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Call Outcome
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="success"
                            checked={callSuccess === 'success'}
                            onChange={() => setCallSuccess('success')}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Successful</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="failed"
                            checked={callSuccess === 'failed'}
                            onChange={() => setCallSuccess('failed')}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Failed</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            value="unknown"
                            checked={callSuccess === 'unknown'}
                            onChange={() => setCallSuccess('unknown')}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">Unknown</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Upload Button */}
                    <button
                      onClick={handleUploadWithMetadata}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      Upload and Process
                    </button>
                  </div>
                </div>
              )}

              {/* Enhanced Progress Bar - Show during upload/processing */}
              {fileUpload.status !== 'idle' && (
              <div className="mb-6">
                <div className="flex justify-between items-center text-sm mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      fileUpload.status === 'completed' ? 'bg-green-500' :
                      fileUpload.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-600'
                    }`} />
                    <span className="font-medium text-gray-700">
                      {progressMessage || (fileUpload.status === 'uploading' ? 'Uploading' : 'Processing')}
                    </span>
                  </div>
                  <span className="font-mono text-gray-600">
                    {fileUpload.progress || 0}%
                  </span>
                </div>
                
                {/* Enhanced Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out relative ${
                      fileUpload.status === 'completed' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                      fileUpload.status === 'failed' ? 'bg-gradient-to-r from-red-500 to-red-400' :
                      'bg-gradient-to-r from-blue-600 to-blue-500'
                    }`}
                    style={{ width: `${fileUpload.progress || 0}%` }}
                  >
                    {/* Animated shimmer effect */}
                    {fileUpload.status !== 'completed' && fileUpload.status !== 'failed' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
                    )}
                  </div>
                </div>
                
                {/* File info */}
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span className="truncate max-w-xs">
                    📁 {fileUpload.file.name}
                  </span>
                  <span>
                    {(fileUpload.file.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                
                {/* Motivational tip during processing */}
                {(fileUpload.status === 'uploading' || 
                  (fileUpload.status === 'processing' && (fileUpload.progress || 0) < 60)) && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <div className="text-blue-600 mt-0.5">💡</div>
                      <div className="text-xs text-blue-700">
                        <strong>Did you know?</strong> CallIQ will extract key moments, pricing discussions, objections, and next steps - saving you hours of manual review. Your analysis will be ready in minutes!
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Early access notification at 60% */}
                {fileUpload.status === 'processing' && (fileUpload.progress || 0) >= 60 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 animate-fadeIn">
                    <div className="flex items-start space-x-2">
                      <div className="text-green-600 mt-0.5">🎉</div>
                      <div className="text-xs text-green-700">
                        <strong>Early access available!</strong> You can start viewing your analysis now while we continue processing the remaining insights.
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {/* Success Actions - Show at 60% progress */}
              {((fileUpload.status === 'processing' && (fileUpload.progress || 0) >= 60) || 
                fileUpload.status === 'completed') && (
                <div className="flex space-x-4">
                  <button 
                    onClick={async () => {
                      // Try multiple sources for the call ID
                      const callId = fileUpload.result?.id || 
                                   await asyncSessionStorage.getItem<string>('calliq_processing_call_id') || 
                                   await asyncSessionStorage.getItem<string>('calliq_processing_job');
                      if (callId) {
                        router.push(`/calliq/calls/${callId}`);
                      }
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg transition-all ${
                      fileUpload.status === 'completed' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white animate-pulse'
                    }`}
                  >
                    {fileUpload.status === 'completed' ? 'View Analysis' : 'View Analysis (Processing...)'}
                  </button>
                  <button
                    onClick={() => {
                      setFileUpload(null);
                      setRepName('')
                      setCustomerName('');
                      setCallSuccess('unknown');
                      // Don't clear companyInfo - it's persistent company data
                      // Clear enhanced progress
                      stopEnhancedProgress();
                      setProgressMessage('');
                      setCurrentMessageIndex(0);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Upload Another
                  </button>
                </div>
              )}

              {/* Error Actions */}
              {fileUpload.status === 'failed' && (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Upload Failed</h3>
                        <p className="text-sm text-red-700 mt-1">{fileUpload.error}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => handleSingleFile(fileUpload.file)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                    <button 
                      onClick={() => setFileUpload(null)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Choose Different File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      }

      {/* Bulk CSV Upload - Hidden for now */}
      {false && uploadMethod === 'bulk' && (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">Bulk Upload Instructions</h3>
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-1">
              <li>Prepare a CSV file with columns: audio_url, rep_name, customer_name, date</li>
              <li>Ensure all audio files are publicly accessible URLs</li>
              <li>Maximum 100 files per batch</li>
              <li>Files will be processed sequentially</li>
            </ol>
            <button 
              onClick={downloadCSVTemplate}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <DownloadIcon className="w-4 h-4 inline mr-1" />
              Download CSV Template
            </button>
          </div>

          {/* CSV Upload Zone */}
          {!csvUploadResult ? (
            <div className="bg-white rounded-lg shadow">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => csvInputRef.current?.click()}
              >
                <FileTextIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse
                </p>
                <input
                  ref={csvInputRef}
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBulkCSV(file);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Upload Summary */}
              {csvUploadResult && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start space-x-3">
                    {csvUploadResult?.errors_count === 0 ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600 mt-1" />
                    ) : (
                      <AlertCircleIcon className="w-6 h-6 text-yellow-600 mt-1" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">CSV Upload Results</h3>
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        <p>• Total rows processed: {csvUploadResult?.total_rows}</p>
                        <p>• Valid calls created: {csvUploadResult?.created_calls}</p>
                        {(csvUploadResult?.errors_count ?? 0) > 0 && (
                          <p>• Errors encountered: {csvUploadResult?.errors_count}</p>
                        )}
                      </div>
                      
                      {csvUploadResult?.errors && (csvUploadResult?.errors.length ?? 0) > 0 && (
                        <div className="mt-3">
                          <details className="text-sm">
                            <summary className="cursor-pointer text-red-600 hover:text-red-800">
                              View Error Details
                            </summary>
                            <div className="mt-2 bg-red-50 rounded p-3 space-y-1">
                              {csvUploadResult?.errors?.slice(0, 5).map((error, idx) => (
                                <p key={idx} className="text-red-700">
                                  Row {error.row}: {error.error}
                                </p>
                              ))}
                              {csvUploadResult?.errors && (csvUploadResult?.errors.length ?? 0) > 5 && (
                                <p className="text-red-600 font-medium">
                                  ... and {(csvUploadResult?.errors?.length ?? 0) - 5} more errors
                                </p>
                              )}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Monitoring */}
              {bulkStatus && (
                <BulkUploadMonitor
                  initialStatus={bulkStatus!}
                  onUpdate={(status) => setBulkStatus(status)}
                  onComplete={(status) => {
                    setBulkStatus(status);
                    setIsMonitoring(false);
                  }}
                  onRetry={handleRetryCall}
                />
              )}

              {/* Upload Another File */}
              {!isMonitoring && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setCsvUploadResult(null);
                        setBulkStatus(null);
                        setErrorMessage(null);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Upload Another CSV
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}