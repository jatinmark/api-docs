'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { calliqAPI } from '@/lib/calliq-api';
import { logger } from '@/lib/logger';

interface ProcessingJob {
  id: string;
  type: 'single' | 'bulk';
  fileName?: string;
  status: 'uploading' | 'processing' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  backendStatus?: string; // Track the actual backend status
  progress: number;
  startTime: number;
}

interface ProcessingContextType {
  processingJobs: Map<string, ProcessingJob>;
  addProcessingJob: (job: ProcessingJob) => void;
  removeProcessingJob: (id: string) => void;
  updateProcessingJob: (id: string, updates: Partial<ProcessingJob>) => void;
  isProcessing: boolean;
  processingCount: number;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processingJobs, setProcessingJobs] = useState<Map<string, ProcessingJob>>(new Map());

  // Load persisted jobs on mount
  useEffect(() => {
    const loadPersistedJobs = () => {
      try {
        const savedJobs = sessionStorage.getItem('calliq_processing_jobs');
        if (savedJobs) {
          const jobsArray = JSON.parse(savedJobs);
          const jobsMap = new Map<string, ProcessingJob>();
          
          jobsArray.forEach((job: ProcessingJob) => {
            // Restore jobs that are not in terminal states
            const nonTerminalStates = ['uploading', 'processing', 'transcribing', 'analyzing'];
            if (nonTerminalStates.includes(job.status)) {
              jobsMap.set(job.id, job);
              
              // Start monitoring the job
              monitorJob(job);
            }
          });
          
          setProcessingJobs(jobsMap);
        }
      } catch (error) {
        logger.error('Failed to load persisted processing jobs:', error);
      }
    };
    
    loadPersistedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist jobs whenever they change
  useEffect(() => {
    const jobsArray = Array.from(processingJobs.values());
    sessionStorage.setItem('calliq_processing_jobs', JSON.stringify(jobsArray));
  }, [processingJobs]);

  const monitorJob = async (job: ProcessingJob) => {
    if (job.type === 'single') {
      // Monitor single file upload
      try {
        const pollInterval = setInterval(async () => {
          const status = await calliqAPI.getCallStatus(job.id);
          
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            updateProcessingJob(job.id, {
              status: status.status === 'completed' ? 'completed' : 'failed',
              progress: 100
            });
            
            // Remove job after a delay
            setTimeout(() => {
              removeProcessingJob(job.id);
            }, 5000);
          } else {
            // Update progress and status based on backend status
            const progressMap: Record<string, number> = {
              'uploaded': 30,
              'transcribing': 60,
              'analyzing': 85
            };
            
            // Map backend status to frontend status
            let frontendStatus: ProcessingJob['status'] = 'processing';
            if (status.status === 'uploaded') frontendStatus = 'processing';
            else if (status.status === 'transcribing') frontendStatus = 'transcribing';
            else if (status.status === 'analyzing') frontendStatus = 'analyzing';
            
            updateProcessingJob(job.id, {
              status: frontendStatus,
              backendStatus: status.status,
              progress: progressMap[status.status] || 50
            });
          }
        }, 3000);
        
        // Clean up after 10 minutes max
        setTimeout(() => {
          clearInterval(pollInterval);
          removeProcessingJob(job.id);
        }, 600000);
        
      } catch (error) {
        logger.error('Failed to monitor job:', error);
        updateProcessingJob(job.id, { status: 'failed', progress: 0 });
      }
    } else if (job.type === 'bulk') {
      // Monitor bulk upload
      calliqAPI.monitorBulkUpload(
        job.id,
        (status) => {
          const progress = Math.round(
            (status.completed_calls / (status.total_calls || 1)) * 100
          );
          updateProcessingJob(job.id, { progress });
        },
        (finalStatus) => {
          updateProcessingJob(job.id, {
            status: finalStatus.failed_calls === 0 ? 'completed' : 'failed',
            progress: 100
          });
          
          // Remove job after a delay
          setTimeout(() => {
            removeProcessingJob(job.id);
          }, 5000);
        }
      );
    }
  };

  const addProcessingJob = (job: ProcessingJob) => {
    setProcessingJobs(prev => {
      const newMap = new Map(prev);
      newMap.set(job.id, job);
      return newMap;
    });
    
    // Start monitoring
    monitorJob(job);
  };

  const removeProcessingJob = (id: string) => {
    setProcessingJobs(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const updateProcessingJob = (id: string, updates: Partial<ProcessingJob>) => {
    setProcessingJobs(prev => {
      const newMap = new Map(prev);
      const job = newMap.get(id);
      if (job) {
        newMap.set(id, { ...job, ...updates });
      }
      return newMap;
    });
  };

  const isProcessing = Array.from(processingJobs.values()).some(
    job => job.status !== 'completed' && job.status !== 'failed'
  );
  
  const processingCount = Array.from(processingJobs.values()).filter(
    job => job.status !== 'completed' && job.status !== 'failed'
  ).length;

  return (
    <ProcessingContext.Provider
      value={{
        processingJobs,
        addProcessingJob,
        removeProcessingJob,
        updateProcessingJob,
        isProcessing,
        processingCount
      }}
    >
      {children}
    </ProcessingContext.Provider>
  );
}

export function useProcessing() {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
}

// Processing status indicator component
export function ProcessingIndicator() {
  const { isProcessing, processingCount, processingJobs } = useProcessing();
  
  if (!isProcessing) return null;
  
  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-w-sm">
      <div className="flex items-center mb-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
        <span className="font-medium text-gray-900">
          Processing {processingCount} {processingCount === 1 ? 'file' : 'files'}
        </span>
      </div>
      <div className="space-y-2">
        {Array.from(processingJobs.values())
          .filter(job => job.status !== 'completed' && job.status !== 'failed')
          .map(job => {
            // Get status message based on current state
            const getStatusMessage = (status: ProcessingJob['status']) => {
              switch (status) {
                case 'uploading': return 'Uploading audio...';
                case 'transcribing': return 'Transcribing conversation...';
                case 'analyzing': return 'Analyzing with AI...';
                case 'processing': return 'Processing...';
                default: return 'Processing...';
              }
            };
            
            return (
              <div key={job.id} className="text-sm">
                <div className="flex justify-between text-gray-600 mb-1">
                  <span className="truncate max-w-[200px]">
                    {job.fileName || `${job.type} upload`}
                  </span>
                  <span>{job.progress}%</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {getStatusMessage(job.status)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}