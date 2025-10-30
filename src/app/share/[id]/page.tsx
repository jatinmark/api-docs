'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CallIQCall } from '@/types/calliq';
import { CallDetailsView } from '@/components/calliq/CallDetailsView';
import { AlertCircleIcon } from 'lucide-react';
import { transformKeyMoments } from '@/lib/call-utils';
import { logger } from '@/lib/logger';

export default function ShareCallPage() {
  const params = useParams();
  const callId = params.id as string;
  
  const [call, setCall] = useState<CallIQCall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const loadCallData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/calliq/calls/${callId}/public`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Call not found (${response.status})`);
      }

      const callData = await response.json();
      
      // Transform key_moments if present
      if (callData.key_moments) {
        const transformed = transformKeyMoments(callData.key_moments);
        callData.key_moments = transformed;
      }
      
      setCall(callData);
    } catch (error) {
      logger.error('Failed to fetch call:', error);
      setError(error instanceof Error ? error.message : 'Failed to load call');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    if (callId) {
      loadCallData();
    }
    
    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading call details...</p>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md w-full">
          <div className="flex items-center mb-4">
            <AlertCircleIcon className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Call Not Found</h2>
          </div>
          <p className="text-gray-600">
            {error || 'This call analysis may have been removed or the link may be invalid.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <CallDetailsView 
      call={call}
      loading={false}
      showBackButton={false}
      showActions={false}
      showFooter={true}
    />
  );
}