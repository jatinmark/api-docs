'use client';

import { useState, useEffect } from 'react';
import { BulkStatusResponse } from '@/types/calliq';
import { BulkCallProgress } from './BulkCallProgress';
import { 
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ClockIcon,
  RefreshCwIcon
} from 'lucide-react';

interface BulkUploadMonitorProps {
  initialStatus: BulkStatusResponse;
  onUpdate: (status: BulkStatusResponse) => void;
  onComplete: (status: BulkStatusResponse) => void;
  onRetry?: (callId: string) => void;
}

export function BulkUploadMonitor({ 
  initialStatus, 
  onUpdate, 
  onComplete, 
  onRetry 
}: BulkUploadMonitorProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isExpanded, setIsExpanded] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    setStatus(initialStatus);
    setLastUpdate(new Date());
    onUpdate(initialStatus);
    
    if (initialStatus.processing_calls === 0) {
      onComplete(initialStatus);
    }
  }, [initialStatus, onUpdate, onComplete]);

  const completionPercentage = status.total_calls > 0 
    ? Math.round((status.completed_calls + status.failed_calls) / status.total_calls * 100)
    : 0;

  const isComplete = status.processing_calls === 0;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-gray-900">
                Processing Bulk Upload
                {isComplete && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Complete)
                  </span>
                )}
              </h3>
              
              {/* Live Status Indicator */}
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  isComplete ? 'bg-gray-400' : 'bg-green-500 animate-pulse'
                }`} />
                <span className="text-xs text-gray-600">
                  {isComplete ? 'Stopped' : 'Live'}
                </span>
              </div>
              
              <span className="text-xs text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span>{status.completed_calls} completed</span>
              </div>
              
              {status.processing_calls > 0 && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-4 h-4 text-blue-600" />
                  <span>{status.processing_calls} processing</span>
                </div>
              )}
              
              {status.failed_calls > 0 && (
                <div className="flex items-center space-x-1">
                  <AlertCircleIcon className="w-4 h-4 text-red-600" />
                  <span>{status.failed_calls} failed</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
          >
            <span className="text-sm">
              {isExpanded ? 'Collapse' : 'Expand'}
            </span>
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Overall Progress Bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Overall Progress</span>
            <span>{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-green-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Individual Call Progress */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {status.calls.map((call) => (
              <BulkCallProgress
                key={call.call_id}
                call={call}
                onRetry={onRetry}
              />
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      {isComplete && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Batch processing completed at {new Date().toLocaleTimeString()}
            </div>
            
            <div className="flex space-x-3">
              {status.failed_calls > 0 && onRetry && (
                <button 
                  className="px-4 py-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
                  onClick={() => {
                    // Retry all failed calls
                    status.calls
                      .filter(call => call.status.includes('failed'))
                      .forEach(call => onRetry(call.call_id));
                  }}
                >
                  <RefreshCwIcon className="w-4 h-4 inline mr-1" />
                  Retry Failed ({status.failed_calls})
                </button>
              )}
              
              <button className="px-4 py-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                View All Calls
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}