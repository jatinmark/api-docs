'use client';

import { BulkCallStatus } from '@/types/calliq';
import { 
  CheckCircleIcon, 
  AlertCircleIcon, 
  LoaderIcon,
  DownloadIcon,
  UploadCloudIcon,
  MicIcon,
  RefreshCwIcon 
} from 'lucide-react';

interface BulkCallProgressProps {
  call: BulkCallStatus;
  onRetry?: (callId: string) => void;
}

export function BulkCallProgress({ call, onRetry }: BulkCallProgressProps) {
  const getStepIcon = (step: string, isActive: boolean, isCompleted: boolean) => {
    const baseClass = "w-4 h-4";
    const colorClass = isCompleted ? "text-green-600" : 
                      isActive ? "text-blue-600" : "text-gray-400";
    
    switch (step) {
      case 'downloading':
        return <DownloadIcon className={`${baseClass} ${colorClass}`} />;
      case 'uploading':
        return <UploadCloudIcon className={`${baseClass} ${colorClass}`} />;
      case 'transcribing':
        return <MicIcon className={`${baseClass} ${colorClass}`} />;
      default:
        return <CheckCircleIcon className={`${baseClass} ${colorClass}`} />;
    }
  };

  const getStatusMessage = (status: string, currentStep: string, stepProgress: number) => {
    if (status === 'completed') return 'Processing complete';
    if (status.includes('failed')) return `Failed during ${currentStep}`;
    
    const stepMessages = {
      'downloading': 'Downloading audio file',
      'uploading': 'Uploading to cloud storage',
      'transcribing': 'Transcribing with AI'
    };
    
    return `${stepMessages[currentStep as keyof typeof stepMessages]} (${stepProgress}%)`;
  };

  const steps = ['downloading', 'uploading', 'transcribing'];
  const currentStepIndex = steps.indexOf(call.current_step);
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Call Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 truncate">
            {call.title || `Call ${call.call_id.slice(-8)}`}
          </h4>
          <p className="text-xs text-gray-500 truncate mt-1">
            {call.audio_url}
          </p>
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {call.retry_count > 0 && (
            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              Retry {call.retry_count}/{call.max_retries}
            </span>
          )}
          
          {call.status === 'completed' && (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          )}
          
          {call.status.includes('failed') && (
            <AlertCircleIcon className="w-5 h-5 text-red-600" />
          )}
          
          {!call.status.includes('failed') && call.status !== 'completed' && (
            <LoaderIcon className="w-5 h-5 text-blue-600 animate-spin" />
          )}
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex && !call.status.includes('failed');
          const isCompleted = index < currentStepIndex || call.status === 'completed';
          
          return (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted ? 'border-green-600 bg-green-50' :
                isActive ? 'border-blue-600 bg-blue-50' :
                'border-gray-300 bg-gray-50'
              }`}>
                {getStepIcon(step, isActive, isCompleted)}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">
            {getStatusMessage(call.status, call.current_step, call.step_progress)}
          </span>
          <span className="text-gray-500">{call.overall_progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              call.status === 'completed' ? 'bg-green-600' :
              call.status.includes('failed') ? 'bg-red-600' :
              'bg-blue-600'
            }`}
            style={{ width: `${call.overall_progress}%` }}
          />
        </div>
      </div>

      {/* Error Details */}
      {call.status.includes('failed') && call.error_message && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertCircleIcon className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-red-800">
                Error: {call.error_type?.replace('_', ' ') || 'Unknown error'}
              </p>
              <p className="text-xs text-red-700 mt-1">
                {call.error_message}
              </p>
              
              {/* Retry Button */}
              {onRetry && call.retry_count < call.max_retries && (
                <button
                  onClick={() => onRetry(call.call_id)}
                  className="mt-2 flex items-center space-x-1 text-xs text-red-700 hover:text-red-900 font-medium"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  <span>Retry Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}