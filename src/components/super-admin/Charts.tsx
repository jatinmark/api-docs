'use client';

import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, Activity, TrendingUp, Building2, Calendar, ArrowUpDown, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';

// Shared interfaces
interface ChartDataPoint {
  date: string;
  calls: number;
}

interface CompanyData {
  id: string;
  name: string;
  calls: number;
  leads: number;
  agents: number;
  callsToday: number;
  trend: 'up' | 'down' | 'stable';
}

interface RecentCall {
  id: string;
  companyName: string;
  timestamp: Date;
  duration?: number;
  agentName?: string;
}

// Shared utilities
const formatTimestamp = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  return date.toLocaleDateString();
};

const formatDuration = (seconds?: number) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Call Volume Trend Chart
interface CallVolumeTrendChartProps {
  data?: ChartDataPoint[];
  period?: '7d' | '30d' | '90d';
  onPeriodChange?: (period: '7d' | '30d' | '90d') => void;
  onRefresh?: () => void;
}

export function CallVolumeTrendChart({ data: propData, period = '30d', onPeriodChange, onRefresh }: CallVolumeTrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle period change
  const handlePeriodChange = async (newPeriod: '7d' | '30d' | '90d') => {
    if (newPeriod === selectedPeriod) return;

    setIsLoading(true);
    setSelectedPeriod(newPeriod);

    if (onPeriodChange) {
      await onPeriodChange(newPeriod);
    }

    setIsLoading(false);
  };

  // Update selected period when prop changes
  useEffect(() => {
    setSelectedPeriod(period);
  }, [period]);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Generate fallback data based on selected period
  const fallbackData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const today = new Date();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: date.toISOString().split('T')[0],
        calls: 0,
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return data;
  }, [selectedPeriod]);

  const chartData = propData && propData.length > 0 ? propData : fallbackData;
  const maxValue = Math.max(...chartData.map(d => d.calls));

  // Calculate total calls for display
  const totalCurrent = chartData.reduce((sum, d) => sum + d.calls, 0);

  return (
    <div className="bg-white rounded-lg shadow p-6 h-[30rem] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Call Volume Trends</h3>
            {totalCurrent > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                <span>{totalCurrent.toLocaleString()} total calls</span>
              </div>
            )}
          </div>
          {propData === undefined && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-orange-600 font-medium">
                Historical data pending backend enhancement
              </span>
            </div>
          )}
        </div>

        {/* Period Selection Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Calendar className="h-4 w-4 text-gray-500 hidden sm:block" aria-hidden="true" />
          <div
            className="flex bg-gray-100 rounded-lg p-1"
            role="radiogroup"
            aria-label="Time period selection for call volume trends"
          >
            {['7d', '30d', '90d'].map((periodOption) => (
              <button
                key={periodOption}
                onClick={() => handlePeriodChange(periodOption as '7d' | '30d' | '90d')}
                disabled={isLoading}
                role="radio"
                aria-checked={selectedPeriod === periodOption}
                aria-label={`${
                  periodOption === '7d' ? '7 days' :
                  periodOption === '30d' ? '30 days' : '90 days'
                } time period`}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedPeriod === periodOption
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {periodOption}
              </button>
            ))}
          </div>
          {isLoading && (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          )}

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !onRefresh}
            aria-label="Refresh chart"
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} domain={[0, maxValue > 0 ? maxValue * 1.1 : 100]} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0]?.payload;
                  const currentCalls = payload.find(p => p.dataKey === 'calls')?.value || 0;

                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[160px]">
                      <div className="mb-2">
                        <p className="font-semibold text-gray-900">{label}</p>
                        {data?.fullDate && (
                          <p className="text-xs text-gray-500">{data.fullDate} • {data.dayOfWeek}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span className="text-sm text-gray-700">Calls</span>
                        </div>
                        <span className="font-semibold text-gray-900">{currentCalls.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="calls"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#callsGradient)"
              name="Calls"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Company Activity Chart
interface CompanyActivityChartProps {
  data?: CompanyData[];
  onCompanyClick?: (companyId: string) => void;
  onRefresh?: () => void;
}

type SortField = 'calls' | 'leads' | 'agents' | 'callsToday' | 'name';
type SortOrder = 'asc' | 'desc';
type FilterTrend = 'all' | 'up' | 'down' | 'stable';

export function CompanyActivityChart({ data: propData, onCompanyClick, onRefresh }: CompanyActivityChartProps) {
  const [viewMode, setViewMode] = useState<'top10' | 'all'>('top10');
  const [sortField, setSortField] = useState<SortField>('calls');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterTrend, setFilterTrend] = useState<FilterTrend>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simple fallback data
  const fallbackData = useMemo(() => {
    const companies = ['TechCorp Solutions', 'Global Retail Inc', 'HealthCare Plus', 'Finance Pro Ltd'];
    return companies.map((name, index) => ({
      name,
      calls: 0,
      leads: 0,
      agents: 0,
      callsToday: 0,
      trend: 'stable' as const,
      id: `company-${index}`
    }));
  }, []);

  const chartData = useMemo(() => {
    if (!propData) return fallbackData;
    if (Array.isArray(propData) && propData.length === 0) return fallbackData;
    return propData.map(company => ({
      ...company,
      calls: company.calls ?? 0,
      leads: company.leads ?? 0,
      agents: company.agents ?? 0,
      callsToday: company.callsToday ?? 0,
      trend: company.trend ?? 'stable'
    }));
  }, [propData, fallbackData]);

  // Apply filtering and sorting
  const processedData = useMemo(() => {
    let filtered = chartData;

    // Apply trend filter
    if (filterTrend !== 'all') {
      filtered = filtered.filter(company => company.trend === filterTrend);
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === 'name') {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return sorted;
  }, [chartData, filterTrend, sortField, sortOrder]);

  const displayData = viewMode === 'top10' ? processedData.slice(0, 10) : processedData;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="mb-3">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Company Activity Distribution</h3>

          <button
            onClick={() => setViewMode(viewMode === 'top10' ? 'all' : 'top10')}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
          >
            {viewMode === 'top10' ? 'Show All' : 'Top 10'}
          </button>

          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || !onRefresh}
            aria-label="Refresh chart"
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing {displayData.length} of {chartData.length} companies</span>
            {filterTrend !== 'all' && (
              <div className="flex items-center gap-1">
                <span>•</span>
                <span className="capitalize">Trending {filterTrend}</span>
              </div>
            )}
          </div>
          {propData === undefined && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-orange-600 font-medium">
                Company data pending backend enhancement
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="h-72 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length && payload[0].payload) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-900 mb-2">{label}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-blue-600">Total Calls: {data.calls}</p>
                          <p className="text-green-600">Today&apos;s Calls: {data.callsToday}</p>
                          <p className="text-purple-600">Leads: {data.leads}</p>
                          <p className="text-orange-600">Active Agents: {data.agents}</p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3 scrollbar-hide" style={{ maxHeight: '380px', overflowY: 'auto', marginTop: '-80px' }}>
          {displayData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No companies match your current filters</p>
              <button
                onClick={() => {
                  setFilterTrend('all');
                  setSortField('calls');
                  setSortOrder('desc');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm mt-1"
              >
                Clear filters
              </button>
            </div>
          ) : (
            displayData.map((company, index) => {
              const getTrendIcon = (trend: string) => {
                switch (trend) {
                  case 'up':
                    return <TrendingUp className="h-3 w-3 text-green-500" />;
                  case 'down':
                    return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
                  default:
                    return <ArrowUpDown className="h-3 w-3 text-gray-400 rotate-90" />;
                }
              };

              const getTrendBadge = (trend: string) => {
                const baseClasses = "px-2 py-0.5 text-xs font-medium rounded-full";
                switch (trend) {
                  case 'up':
                    return `${baseClasses} bg-green-100 text-green-700`;
                  case 'down':
                    return `${baseClasses} bg-red-100 text-red-700`;
                  default:
                    return `${baseClasses} bg-gray-100 text-gray-600`;
                }
              };

              return (
                <div
                  key={company.id}
                  className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-all duration-200 hover:shadow-md"
                  onClick={() => onCompanyClick?.(company.id)}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {company.name}
                          </p>
                          {getTrendIcon(company.trend)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500">{company.agents} agents</p>
                          <span className={getTrendBadge(company.trend)}>
                            {company.trend === 'up' ? '↗' : company.trend === 'down' ? '↘' : '→'} {company.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {(company.calls || 0).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">{company.callsToday || 0} today</p>
                      </div>
                      {(company.leads || 0) > 0 && (
                        <div className="text-right border-l border-gray-200 pl-3">
                          <p className="text-sm font-medium text-purple-600">{company.leads || 0}</p>
                          <p className="text-xs text-gray-500">leads</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// Realtime Activity Indicator
interface RealtimeActivityIndicatorProps {
  recentCalls?: RecentCall[];
  onRefresh?: () => Promise<void>;
}

export function RealtimeActivityIndicator({
  recentCalls: propCalls,
  onRefresh
}: RealtimeActivityIndicatorProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const recentCalls = propCalls || [];

  // Check if we have real data
  const hasRealData = propCalls !== undefined;

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      logger.error('Failed to refresh recent activity', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-[30rem] flex flex-col">
      {/* Simplified Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        {/* Small refresh icon button only */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || !onRefresh}
          aria-label="Refresh activity"
          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh"
        >
          {isRefreshing ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Recent Calls List - Now fills remaining height */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h4 className="text-sm font-medium text-gray-700 flex items-center">
            <Activity className="h-4 w-4 mr-1" />
            Recent Calls
            {recentCalls.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {recentCalls.length}
              </span>
            )}
          </h4>
          {recentCalls.length > 0 && (
            <div className="text-xs text-gray-500">
              Last 24 hours
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1 overflow-y-auto scrollbar-hide">
          {recentCalls.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No recent calls to display</p>
              {hasRealData && (
                <p className="text-xs mt-1">Calls will appear here when activity starts</p>
              )}
            </div>
          ) : (
            recentCalls.map((call, index) => {
              const isRecent = index === 0;
              const timeDiff = new Date().getTime() - call.timestamp.getTime();
              const isVeryRecent = timeDiff < 60000; // Less than 1 minute

              return (
                <div
                  key={call.id}
                  className={`group flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                    isRecent
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 shadow-sm'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`relative p-2 rounded-full ${
                      isRecent ? 'bg-blue-100' : 'bg-gray-200 group-hover:bg-gray-300'
                    }`}>
                      <Phone className={`h-3 w-3 ${
                        isRecent ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                      {isVeryRecent && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
                          <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${
                          isRecent ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {call.companyName}
                        </p>
                        {isVeryRecent && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {call.agentName && (
                          <>
                            <span className="text-xs text-gray-600 font-medium">{call.agentName}</span>
                            <span className="text-xs text-gray-400">•</span>
                          </>
                        )}
                        <span className={`text-xs ${
                          isRecent ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {formatTimestamp(call.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {call.duration && (
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        isRecent
                          ? 'bg-white text-blue-700 border border-blue-200'
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}>
                        {formatDuration(call.duration)}
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${
                      isRecent ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}