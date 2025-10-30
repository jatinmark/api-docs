'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { 
  LightbulbIcon,
  TargetIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  UsersIcon,
  ClipboardListIcon,
  MessageSquareIcon,
  ShieldIcon,
  ChevronRightIcon,
  FilterIcon,
  CalendarIcon
} from 'lucide-react';
import { calliqAPI } from '@/lib/calliq-api';
import { Pagination, usePagination } from '@/components/ui/Pagination';
import { SkeletonCard, SkeletonList } from '@/components/ui/SkeletonLoader';

interface Insight {
  id: string;
  type: 'objection' | 'opportunity' | 'risk' | 'action_item' | 'competitor' | 'topic' | 'question' | 'commitment' | 'coaching';
  title: string;
  description: string;
  count?: number;
  trend?: 'up' | 'down' | 'stable';
  priority?: 'high' | 'medium' | 'low';
  examples?: string[];
  impact?: string;
  recommendation?: string;
  severity?: 'info' | 'warning' | 'success' | 'error';
}

const getTypeIcon = (type: Insight['type']) => {
  switch (type) {
    case 'objection': return AlertTriangleIcon;
    case 'opportunity': return TrendingUpIcon;
    case 'risk': return ShieldIcon;
    case 'action_item': return ClipboardListIcon;
    case 'competitor': return UsersIcon;
    case 'topic': return MessageSquareIcon;
    case 'question': return MessageSquareIcon;
    case 'commitment': return TargetIcon;
    default: return LightbulbIcon;
  }
};

const getTypeColor = (type: Insight['type']) => {
  switch (type) {
    case 'objection': return 'text-red-600 bg-red-100';
    case 'opportunity': return 'text-green-600 bg-green-100';
    case 'risk': return 'text-yellow-600 bg-yellow-100';
    case 'action_item': return 'text-blue-600 bg-blue-100';
    case 'competitor': return 'text-purple-600 bg-purple-100';
    case 'topic': return 'text-indigo-600 bg-indigo-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};

const getPriorityBadgeClass = (priority: Insight['priority']) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
  }
};

export default function CallIQInsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('last30days');
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const { currentPage, pageSize, handlePageChange, handlePageSizeChange, getPaginatedData, getTotalPages } = usePagination(1, 10);

  // Add mount tracking to prevent state updates after unmount
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    // Ensure mount tracking is properly reset on component mount
    isMountedRef.current = true;
    
    loadInsights();
    
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;
    };
  }, []);

  const loadInsights = async () => {
    try {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(true);
      }
      
      // For now, get insights from all calls - this would need a proper API endpoint
      // to get all insights across all calls for the company
      const response = await calliqAPI.getAllInsights();
      
      // Transform CallIQInsight to Insight format
      const transformedInsights = (response.insights || []).map(insight => ({
        id: insight.id,
        type: insight.type as any,
        title: insight.content,
        description: insight.content,
        priority: insight.priority as any,
        severity: insight.priority === 'high' ? 'error' as const : 
                 insight.priority === 'medium' ? 'warning' as const : 'info' as const,
        examples: [],
        trend: 'stable' as const
      }));
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setInsights(transformedInsights);
      }
    } catch (error) {
      logger.error('Failed to load insights', error);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setInsights([]);
      }
    } finally {
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Event handlers with useCallback to prevent memory leaks
  const handleTimeRangeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeRange(e.target.value);
  }, []);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  }, []);

  const handlePriorityChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPriority(e.target.value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedType('all');
    setSelectedPriority('all');
  }, []);

  const handleToggleInsight = useCallback((insightId: string) => {
    setExpandedInsight(prev => prev === insightId ? null : insightId);
  }, []);

  const filteredInsights = insights.filter(insight => {
    if (selectedType !== 'all' && insight.type !== selectedType) return false;
    if (selectedPriority !== 'all' && insight.priority !== selectedPriority) return false;
    return true;
  });
  
  // Apply pagination to filtered insights
  const paginatedInsights = getPaginatedData(filteredInsights);
  const totalPages = getTotalPages(filteredInsights.length);

  const insightTypes = [
    { value: 'all', label: 'All Types', count: insights.length },
    { value: 'objection', label: 'Objections', count: insights.filter(i => i.type === 'objection').length },
    { value: 'opportunity', label: 'Opportunities', count: insights.filter(i => i.type === 'opportunity').length },
    { value: 'risk', label: 'Risks', count: insights.filter(i => i.type === 'risk').length },
    { value: 'action_item', label: 'Action Items', count: insights.filter(i => i.type === 'action_item').length },
    { value: 'competitor', label: 'Competitors', count: insights.filter(i => i.type === 'competitor').length },
    { value: 'topic', label: 'Topics', count: insights.filter(i => i.type === 'topic').length },
  ];

  // Summary Stats
  const totalInsights = insights.length;
  const highPriorityCount = insights.filter(i => i.severity === 'warning' || i.severity === 'error').length;
  const actionItemsCount = insights.filter(i => i.type === 'action_item').length;
  const trendingUpCount = insights.filter(i => i.trend === 'up').length;

  return (
    <div className="space-y-6" role="main" aria-label="CallIQ Insights">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CallIQ Insights</h1>
          <p className="text-gray-600">AI-powered insights from your sales conversations</p>
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={timeRange}
          onChange={handleTimeRangeChange}
          aria-label="Select time range for insights"
        >
          <option value="last7days">Last 7 days</option>
          <option value="last30days">Last 30 days</option>
          <option value="last90days">Last 90 days</option>
          <option value="custom">Custom range</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 card-optimized">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Insights</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{totalInsights}</p>
              <p className="text-sm text-gray-500 mt-2">Across all calls</p>
            </div>
            <LightbulbIcon className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 card-optimized">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">High Priority</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{highPriorityCount}</p>
              <p className="text-sm text-gray-500 mt-2">Need attention</p>
            </div>
            <AlertTriangleIcon className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 card-optimized">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Trending Up</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{trendingUpCount}</p>
              <p className="text-sm text-gray-500 mt-2">Increasing frequency</p>
            </div>
            <TrendingUpIcon className="w-10 h-10 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 card-optimized">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Action Required</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{actionItemsCount}</p>
              <p className="text-sm text-gray-500 mt-2">Pending items</p>
            </div>
            <ClipboardListIcon className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 card-optimized">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <FilterIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>

          {/* Type Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedType}
            onChange={handleTypeChange}
            aria-label="Filter insights by type"
          >
            {insightTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label} ({type.count})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedPriority}
            onChange={handlePriorityChange}
            aria-label="Filter insights by priority level"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded"
            aria-label="Clear all applied filters"
          >
            Clear filters
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-12">
          <LightbulbIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No Insights Available</h3>
          <p className="text-gray-500">Upload and analyze some calls to see insights here.</p>
        </div>
      ) : (
        /* Insights Grid */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {paginatedInsights.map(insight => {
            const Icon = getTypeIcon(insight.type);
            const isExpanded = expandedInsight === insight.id;

          return (
            <div 
              key={insight.id} 
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow card-optimized"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(insight.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.severity && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      insight.severity === 'error' || insight.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      insight.severity === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {insight.severity}
                    </span>
                  )}
                </div>

                {/* Metrics - only show if data available */}
                {(insight.count || insight.impact) && (
                  <div className="flex items-center space-x-6 mb-4">
                    {insight.count && (
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-gray-900">{insight.count}</span>
                        <span className="text-sm text-gray-500">occurrences</span>
                        {insight.trend === 'up' && <TrendingUpIcon className="w-4 h-4 text-green-500" />}
                        {insight.trend === 'down' && <TrendingUpIcon className="w-4 h-4 text-red-500 rotate-180" />}
                      </div>
                    )}
                    {insight.impact && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Impact:</span> {insight.impact}
                      </div>
                    )}
                  </div>
                )}

                {/* Examples - only show if available */}
                {insight.examples && insight.examples.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Common Examples:</p>
                    <div className="space-y-1">
                      {insight.examples.slice(0, isExpanded ? undefined : 2).map((example, index) => (
                        <p key={index} className="text-sm text-gray-600 italic">
                          &quot;{example}&quot;
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendation - only show if available */}
                {insight.recommendation && (isExpanded || insight.severity === 'warning') && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Recommended Action:</p>
                    <p className="text-sm text-blue-800">{insight.recommendation}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleToggleInsight(insight.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} insight: ${insight.title}`}
                    aria-expanded={isExpanded}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                  <div className="flex space-x-2">
                    <button 
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      aria-label={`View calls related to ${insight.title}`}
                    >
                      View Calls
                    </button>
                    <button 
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`Create training material for ${insight.title}`}
                    >
                      Create Training
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
            })}
          </div>
          
          {/* Pagination */}
          {filteredInsights.length > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredInsights.length}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}