'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { asyncLocalStorage } from '@/lib/storage-utils';
import { createPortal } from 'react-dom';
import { 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon,
  TrashIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon
} from 'lucide-react';
import { CallIQCall, CallIQFilters } from '@/types/calliq';
import { formatDuration, formatDate } from '@/lib/utils';
import { calliqAPI } from '@/lib/calliq-api';
import { usePolling } from '@/hooks/usePolling';
import { useAbortController } from '@/hooks/useAbortController';
import { CallScore } from '@/components/calliq/CallScore';
// import { useBulkCallScores } from '@/hooks/useCallScore';

// Portal-based Tooltip Component
function SentimentTooltip() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX - 100
      });
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div
        ref={iconRef}
        className="inline-block ml-2 cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <svg className="h-4 w-4 text-gray-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      {isOpen && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed w-72 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-xl z-[10000] whitespace-pre-line pointer-events-none"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`
            }}
          >
            {`😊 Positive: Happy, satisfied customers
😐 Neutral: Professional, balanced tone
😞 Negative: Frustrated, unhappy customers`}
          </div>,
          document.body
        )
      }
    </>
  );
}

export default function CallIQCallsPage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallIQCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<CallIQCall[]>([]);
  const [selectedCalls, setSelectedCalls] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<CallIQFilters>({
    search: '',
    status: [],
    outcomes: [],
    date_range: undefined
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('last7days');
  const { startLoading, stopLoading, isLoading: globalLoading } = useLoading();
  const [loading, setLoading] = useState(false); // Keep local loading for backwards compatibility
  const [error, setError] = useState<string | null>(null);
  const [processingCallIds, setProcessingCallIds] = useState<Set<string>>(new Set());
  
  // Pagination (replaced old currentPage and itemsPerPage)
  const {
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    getPaginatedData,
    getTotalPages,
    setCurrentPage
  } = usePagination(1, 20);
  
  // Add mount tracking to prevent state updates after unmount
  const isMountedRef = useRef(true);


  // Add AbortController for request cancellation
  const { signal, abort } = useAbortController();

  const loadCalls = useCallback(async (isSilent = false) => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;
    
    try {
      // Only show loading spinner on initial load, no UI for silent refresh
      if (!isSilent) {
        setLoading(true);
        startLoading('calls-data', 'Loading calls data...');
      }
      setError(null);
      
      // Create AbortController with timeout for this specific request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await calliqAPI.getCalls(
          { sort_by: 'date', sort_order: 'desc' },
          1,
          100
        );
        clearTimeout(timeoutId);
      
        const callsData = response?.calls || [];
        
        // Only update state if component is still mounted
        if (isMountedRef.current) {
          setCalls(callsData);
          setFilteredCalls(callsData);
          
          // Track processing calls
          const processing = callsData.filter(
            (call: CallIQCall) => call.status === 'transcribing' || 
                    call.status === 'analyzing' || 
                    call.status === 'uploaded'
          );
          setProcessingCallIds(new Set(processing.map((c: CallIQCall) => c.id)));
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error: any) {
      // Don't log or set error if request was aborted
      if (error?.name === 'AbortError') {
        return;
      }
      
      // For silent refresh (background polling), don't show errors to user
      if (isSilent) {
        return; // Keep existing data, don't show error
      }
      
      // Don't set empty arrays on error - keep existing data
      let errorMessage = 'Failed to load calls';
      if (error instanceof Error) {
        if (error.message.includes('Authentication failed')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (error.message.includes('Unable to load data')) {
          // This is our new 403 message - don't treat it as critical
          errorMessage = 'Having trouble loading calls. Please refresh the page.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Only show error if we have no existing data and component is mounted
      if (calls.length === 0 && isMountedRef.current) {
        setError(errorMessage);
      } else {
        // If we have existing data, just log the error
        logger.warn('Error loading calls but keeping existing data', { errorMessage });
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
        stopLoading('calls-data');
      }
    }
  }, [signal]); // Add signal as dependency

  // Load persisted filters on mount
  useEffect(() => {
    const loadPersistedFilters = async () => {
      const savedFilters = await asyncLocalStorage.getItem<CallIQFilters>('calliq_filters');
      const savedDateRange = await asyncLocalStorage.getItem<string>('calliq_date_range');
      
      if (savedFilters && isMountedRef.current) {
        setFilters(savedFilters);
      }
      if (savedDateRange && isMountedRef.current) {
        setDateRange(savedDateRange);
      }
    };
    
    loadPersistedFilters();
  }, []);
  
  // Save filters when they change
  useEffect(() => {
    asyncLocalStorage.setItem('calliq_filters', filters);
  }, [filters]);
  
  useEffect(() => {
    asyncLocalStorage.setItem('calliq_date_range', dateRange);
  }, [dateRange]);

  // Initial load effect with proper cleanup
  useEffect(() => {
    // Ensure mount tracking is properly reset on component mount
    isMountedRef.current = true;
    
    // Clear frontend cache to prevent conflicts with dashboard
    calliqAPI.clearCache();
    
    // Initial load
    loadCalls();
    
    // Cleanup function to mark component as unmounted
    return () => {
      isMountedRef.current = false;
      abort(); // Cancel any pending requests
    };
  }, [loadCalls, abort]);
  
  // Auto-refresh using polling hook with automatic cleanup
  const shouldPoll = processingCallIds.size > 0;
  
  usePolling(
    async () => {
      if (isMountedRef.current) {
        try {
          await loadCalls(true);
        } catch (err: any) {
          // Don't log abort errors
          if (err?.name !== 'AbortError') {
            logger.warn('Calls polling error (non-fatal)', err);
            
            // Be more specific about which errors to ignore during processing
            if (err.message && (
                err.message.includes('Authentication failed') || 
                err.message.includes('Unable to load data') ||
                err.message.includes('System busy processing')
              )) {
              logger.debug('Ignoring auth/processing error during polling - this is normal during upload');
            } else {
              logger.error('Unexpected error during polling', err);
            }
          }
        }
      }
    },
    5000, // Poll every 5 seconds
    shouldPoll // Only poll when there are processing calls
  );

  useEffect(() => {
    // Apply filters
    let filtered = [...calls];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(call => 
        call.title?.toLowerCase().includes(searchLower) ||
        call.rep_name?.toLowerCase().includes(searchLower) ||
        call.customer_name?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(call => filters.status!.includes(call.status));
    }

    // Outcome filter
    if (filters.outcomes && filters.outcomes.length > 0) {
      filtered = filtered.filter(call => call.outcome && filters.outcomes!.includes(call.outcome));
    }

    setFilteredCalls(filtered);
    setCurrentPage(1);
  }, [filters, calls]);

  // Pagination
  const totalPages = getTotalPages(filteredCalls.length);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageItems = filteredCalls.slice(startIndex, endIndex);

  // Removed bulk score fetching - scores are now included in call data
  // const callIds = pageItems.map(call => call.id).filter(Boolean);
  // const { data: callScores, isLoading: scoresLoading } = useBulkCallScores(callIds);

  const handleSelectAll = () => {
    if (selectedCalls.size === pageItems.length) {
      setSelectedCalls(new Set());
    } else {
      setSelectedCalls(new Set(pageItems.map(call => call.id)));
    }
  };

  const handleSelectCall = (callId: string) => {
    const newSelected = new Set(selectedCalls);
    if (newSelected.has(callId)) {
      newSelected.delete(callId);
    } else {
      newSelected.add(callId);
    }
    setSelectedCalls(newSelected);
  };

  const handleBulkExport = () => {
    // Implement export logic
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedCalls.size} calls? This action cannot be undone.`)) {
      try {
        const callIds = Array.from(selectedCalls);
        await calliqAPI.bulkDelete(callIds);
        
        // Remove deleted calls from the list
        setCalls(prev => prev.filter(call => !selectedCalls.has(call.id)));
        setSelectedCalls(new Set());
        
        // Show success message (optional)
        alert(`Successfully deleted ${callIds.length} call(s)`);
      } catch (error) {
        logger.error('Failed to delete calls', error);
        alert('Failed to delete calls. Please try again.');
      }
    }
  };

  const getSentimentEmoji = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '—';
    }
  };

  const getStatusBadgeClass = (status: CallIQCall['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'analyzing': return 'bg-purple-100 text-purple-800';
      case 'transcribing': return 'bg-blue-100 text-blue-800';
      case 'uploaded': return 'bg-gray-100 text-gray-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOutcomeBadgeClass = (outcome?: CallIQCall['outcome']) => {
    switch (outcome) {
      case 'won': return 'bg-green-100 text-green-800';
      case 'lost': return 'bg-red-100 text-red-800';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800';
      case 'no_decision': return 'bg-gray-100 text-gray-800';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CallIQ Calls</h1>
          <p className="text-gray-600">View and analyze all your recorded calls</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search calls, reps, or customers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          {/* Date Range */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
            <option value="last90days">Last 90 days</option>
            <option value="custom">Custom range</option>
          </select>

          {/* Status Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                setFilters({ ...filters, status: [value as CallIQCall['status']] });
              } else {
                setFilters({ ...filters, status: [] });
              }
            }}
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="analyzing">Analyzing</option>
            <option value="transcribing">Transcribing</option>
            <option value="uploaded">Uploaded</option>
            <option value="failed">Failed</option>
          </select>

          {/* Outcome Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                setFilters({ ...filters, outcomes: [value as CallIQCall['outcome']] });
              } else {
                setFilters({ ...filters, outcomes: [] });
              }
            }}
          >
            <option value="">All Outcomes</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
            <option value="follow_up">Follow-up</option>
            <option value="no_decision">No Decision</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setFilters({ search: '', status: [], outcomes: [] });
              setDateRange('last7days');
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-600">
          {filteredCalls.length > 0 ? (
            `Showing ${startIndex + 1}-${Math.min(endIndex, filteredCalls.length)} of ${filteredCalls.length} calls`
          ) : (
            'No calls found'
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCalls.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-blue-900 font-medium">
            {selectedCalls.size} call{selectedCalls.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkExport}
              className="px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 btn-optimized"
            >
              <DownloadIcon className="w-4 h-4 inline mr-2" />
              Export Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 btn-optimized"
            >
              <TrashIcon className="w-4 h-4 inline mr-2" />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedCalls(new Set())}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow table-container">
        <div className="overflow-x-auto overflow-y-visible smooth-scroll">
          <table className="min-w-full relative">
            <thead className="bg-gray-50 relative overflow-visible">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all calls"
                    checked={selectedCalls.size === pageItems.length && pageItems.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus-visible"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rep Talk %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sentiment
                  <SentimentTooltip />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Win Prob
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outcome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <div className="text-red-600">
                      <div className="text-lg font-medium mb-2">⚠️ {error}</div>
                      <button 
                        onClick={() => loadCalls()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : loading && pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center">
                    <SkeletonTable rows={10} columns={6} showHeader={false} />
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500">
                    No calls found. Upload audio files to get started.
                  </td>
                </tr>
              ) : (
                pageItems.map((call) => (
                <tr 
                  key={call.id}
                  className="hover:bg-gray-50 cursor-pointer table-row focus-visible list-item-container"
                  tabIndex={0}
                  role="button"
                  aria-label={`View call with ${call.customer_name || 'Unknown Customer'}`}
                  onClick={() => router.push(`/calliq/calls/${call.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/calliq/calls/${call.id}`);
                    }
                  }}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      aria-label={`Select call with ${call.customer_name || 'Unknown Customer'}`}
                      checked={selectedCalls.has(call.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectCall(call.id);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus-visible"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(call.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs font-medium">{call.rep_name?.charAt(0) || 'R'}</span>
                      </div>
                      {call.rep_name && <span className="ml-2 text-sm font-medium text-gray-900">{call.rep_name}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {call.customer_name?.trim() || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {call.duration ? formatDuration(call.duration) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-20">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${call.analysis?.talk_ratio?.rep || 0}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-gray-600">
                          {call.analysis?.talk_ratio?.rep || 0}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-2xl text-center">
                    {getSentimentEmoji(call.analysis?.sentiment?.overall)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(call.status)}`}>
                      {call.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {call.analysis?.win_probability?.score ? (
                      <span className={`font-medium ${
                        call.analysis.win_probability.score > 0.7 ? 'text-green-600' :
                        call.analysis.win_probability.score > 0.4 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {(call.analysis.win_probability.score * 100).toFixed(0)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getOutcomeBadgeClass(call.outcome)}`}>
                      {call.outcome ? call.outcome.replace('_', ' ') : 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {call.call_score_details ? (
                      <CallScore score={{
                        call_id: call.id,
                        overall_score: call.call_score_details.overall_score,
                        grade: call.call_score_details.grade as any,
                        areas_for_improvement: (call.call_score_details.key_issues || []).map((issue: any) => 
                          typeof issue === 'string' ? issue : issue.description || ''
                        ),
                        strengths: call.call_score_details.strengths || [],
                        scoring_breakdown: call.call_score_details.scoring_breakdown,
                        calculated_at: call.call_score_details.calculated_at || new Date().toISOString()
                      }} size="sm" />
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 align-middle">
                    <div className="flex items-center justify-center space-x-2">
                      <button 
                        className="inline-flex items-center justify-center text-gray-400 hover:text-gray-600"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="inline-flex items-center justify-center text-gray-400 hover:text-red-600"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this call? This action cannot be undone.')) {
                            try {
                              await calliqAPI.deleteCall(call.id);
                              // Remove the call from the list
                              setCalls(prev => prev.filter(c => c.id !== call.id));
                            } catch (error) {
                              logger.error('Failed to delete call', error);
                              alert('Failed to delete call. Please try again.');
                            }
                          }
                        }}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageItems.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCalls.length}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              showPageSize={true}
              showItemCount={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}