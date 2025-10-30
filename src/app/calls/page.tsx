'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Phone, Download, Search, Calendar, Clock, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import { formatDuration, formatDate } from '@/lib/utils'
import { useCallHistory, useCallMetrics } from '@/hooks/useCalls'
import { useAllAgents } from '@/hooks/useAgents'
import { Agent } from '@/types'
import { useAIInsights } from '@/hooks/useAIInsights'
import { useCallUpdates } from '@/hooks/useCallUpdates'
import { CallTableSkeleton } from '@/components/calls/CallTableSkeleton'
import { DateRangeSelector } from '@/components/ui/DateRangeSelector'
import { CustomDropdown } from '@/components/ui/CustomDropdown'
import { useCallTableData, formatFieldNameCached } from '@/hooks/useCallTableData'
import { Clock as ClockIcon, Users, Filter, Hash } from 'lucide-react'
import { toast } from 'react-hot-toast'
import '@/styles/call-table.css'

const CallDetailModal = lazy(() =>
  import('@/components/calls/CallDetailModal').then(module => ({
    default: module.CallDetailModal
  }))
)

interface CallHistoryItem {
  id: string
  call_id?: string
  lead_id: string | null  // Can be null for inbound calls without lead
  agent_id: string
  lead_name: string
  lead_phone: string
  agent_name: string
  agent_region?: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  outcome?: 'answered' | 'no_answer' | 'failed'
  duration_seconds?: number
  transcript_url?: string
  summary?: string
  created_at: string
  raw_webhook_data?: Record<string, any>
  retell_call_id?: string
  bolna_call_id?: string
  provider?: string
  call_type?: string
  aiInsightId?: string
  ai_insights?: {
    call_type?: 'first_call' | 'follow_up' | 'closing_call' | 'check_in'
    customer_sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
    user_extraction_fields?: Record<string, any>
    ai_extraction_fields?: Record<string, any>
    next_action_items?: string[]
    objections?: Record<string, string>
    pain_points?: string[]
    competitor_mentions?: string[]
    call_outcome?: 'successful' | 'failed' | 'follow_up' | 'rejected_ai' | 'wrong_number' | 'not_interested' | 'no_meaningful_engagement' | 'answered_interested' | 'answered_not_interested' | 'callback_requested' | 'voicemail' | 'busy' | 'no_answer' | 'do_not_call' | 'technical_issue'
  }
}


const formatFieldName = (name: string): string => {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}

const escapeCSVValue = (value: any): string => {
  if (value === null || value === undefined) return ''

  const stringValue = String(value)

  if (stringValue.startsWith('=')) {
    return stringValue
  }

  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const formatPhoneForCSV = (phone: string | undefined | null): string => {
  if (!phone || phone === 'N/A') return phone || 'N/A'

  const isPhoneNumber = /^\+?\d{10,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))

  if (isPhoneNumber) {
    return `="'${phone}"`
  }

  return phone
}

/**
 * CSV Export Generation
 *
 * HIDDEN COLUMNS (Currently commented out):
 * - Call Outcome (AI insights call outcome)
 * - Call Type Analysis (AI classification: first_call, follow_up, closing_call, check_in)
 * - Sentiment (Customer sentiment: positive, neutral, negative, mixed)
 *
 * TO RESTORE THESE COLUMNS:
 * 1. Uncomment the headers in the array below
 * 2. Uncomment the corresponding data rows
 * 3. Uncomment the table header cells (search for "Hidden - Call Outcome column", "Hidden - Call Type Analysis column", "Hidden - Sentiment column")
 * 4. Uncomment the table body cells (search for "Hidden - Call Outcome cell", "Hidden - AI Call Type cell", "Hidden - Sentiment cell")
 * 5. Update the empty state colSpan from 12 to 15
 */
const generateCSV = (calls: any[], dynamicColumns: string[]): string => {
  const headers = [
    'Date/Time',
    'Agent',
    'Lead',
    'Phone',
    'Conversation Summary',
    'Call Status',
    // 'Call Outcome', // Hidden - uncomment to show in CSV
    'Duration',
    'Call Type',
    // 'Call Type Analysis', // Hidden - uncomment to show in CSV
    // 'Sentiment', // Hidden - uncomment to show in CSV
    ...dynamicColumns.map(col => formatFieldName(col)),
    'Fields Extracted by AI',
    'Key Points',
    'Next Actions'
  ]

  const rows = calls.map(call => {
    const row = [
      call.displayDate || formatDate(call.created_at, call.agent_region),
      call.displayAgentName || call.agent_name || 'Unknown Agent',
      call.displayLeadName || call.lead_name || 'Unknown Lead',
      formatPhoneForCSV(call.displayLeadPhone || call.lead_phone),
      call.ai_insights?.summary || call.summary || '-',
      call.displayStatus || call.status?.replace('_', ' ') || '',
      // Hidden - Call Outcome data (uncomment to add back to CSV)
      // call.displayCallOutcome ||
      //   call.ai_insights?.call_outcome?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) ||
      //   call.outcome?.replace('_', ' ') || '-',
      call.displayDuration || (call.duration_seconds ? formatDuration(call.duration_seconds) : '-'),
      call.displayCallType || (call.call_type ? call.call_type.charAt(0).toUpperCase() + call.call_type.slice(1) : 'Outbound'),
      // Hidden - Call Type Analysis data (uncomment to add back to CSV)
      // call.displayAICallType || call.ai_insights?.call_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '-',
      // Hidden - Sentiment data (uncomment to add back to CSV)
      // call.displaySentiment || (call.ai_insights?.customer_sentiment
      //   ? call.ai_insights.customer_sentiment.charAt(0).toUpperCase() + call.ai_insights.customer_sentiment.slice(1)
      //   : '-'),
      ...dynamicColumns.map(col => {
        const value = call.ai_insights?.user_extraction_fields?.[col]
        if (value === null || value === undefined || value === '') return '-'

        const stringValue = String(value)
        if (/^\+?\d{10,15}$/.test(stringValue.replace(/[\s\-\(\)]/g, ''))) {
          return formatPhoneForCSV(stringValue)
        }
        return stringValue
      }),
      call.ai_insights?.ai_extraction_fields && Object.keys(call.ai_insights.ai_extraction_fields).length > 0
        ? Object.entries(call.ai_insights.ai_extraction_fields)
            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
            .map(([key, value]) => `${formatFieldName(key)}: ${value}`)
            .join('; ')
        : '-',
      call.ai_insights?.key_points && call.ai_insights.key_points.length > 0
        ? call.ai_insights.key_points.join('; ')
        : '-',
      call.ai_insights?.next_action_items && call.ai_insights.next_action_items.length > 0
        ? call.ai_insights.next_action_items.join('; ')
        : '-'
    ]

    return row.map(escapeCSVValue)
  })

  const csvContent = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}

const downloadCSV = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}


const CallTableRow = memo(({
  call,
  dynamicUserFieldColumns,
  formatFieldName,
  onSelectCall,
  hoveredRowId,
  onRowHover
}: {
  call: any // Using optimized call data
  dynamicUserFieldColumns: string[]
  formatFieldName: (name: string) => string
  onSelectCall: (call: CallHistoryItem) => void
  hoveredRowId: string | null
  onRowHover: (id: string | null) => void
}) => {

  const [expandedSummary, setExpandedSummary] = useState(false)
  const [expandedKeyPoints, setExpandedKeyPoints] = useState(false)
  const [expandedNextActions, setExpandedNextActions] = useState(false)

  const isHovered = hoveredRowId === call.id

  return (
    <TableRow
      className="call-table-row hover:bg-gray-50"
      onMouseEnter={() => onRowHover(call.id)}
      onMouseLeave={() => onRowHover(null)}
    >
      <TableCell className="call-table-cell text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center text-sm">
            <Calendar className="h-3 w-3 mr-1" />
            <span className="whitespace-nowrap">
              {(() => {
                // Split "Sep 20, 2025, 3:05 PM" into date and time
                const parts = call.displayDate.split(', ')
                if (parts.length >= 3) {
                  // Has format "Sep 20, 2025, 3:05 PM"
                  return `${parts[0]}, ${parts[1]}` // "Sep 20, 2025"
                }
                return call.displayDate // Fallback to full string
              })()}
            </span>
          </div>
          <div className="text-xs text-gray-600 mt-0.5">
            {(() => {
              const parts = call.displayDate.split(', ')
              if (parts.length >= 3) {
                return parts[2] // "3:05 PM"
              }
              return '' // No time part
            })()}
          </div>
        </div>
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <span className="text-sm font-medium">{call.displayAgentName}</span>
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <div className="text-sm font-medium">{call.displayLeadName}</div>
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <div className="flex items-center justify-center">
          <Phone className="h-3 w-3 mr-1 text-gray-400" />
          <span className="text-sm">{call.displayLeadPhone}</span>
        </div>
      </TableCell>
      {/* Conversation Summary */}
      <TableCell className="call-table-cell text-center" style={{ whiteSpace: 'normal' }}>
        {(call.ai_insights?.summary || call.summary) ? (
          <div
            className="max-w-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedSummary(!expandedSummary)
            }}
          >
            <div className="flex items-start justify-center gap-1">
              <p className={`text-xs text-gray-700 break-words text-left ${expandedSummary ? '' : 'line-clamp-2'}`}>
                {call.ai_insights?.summary || call.summary}
              </p>
              {expandedSummary ? (
                <ChevronUp className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5" />
              ) : (
                <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <span className={call.displayStatusClass}>
          {call.displayStatus}
        </span>
      </TableCell>
      {/* Hidden - Call Outcome cell (uncomment to show) */}
      {/* <TableCell className="call-table-cell text-center" style={{ whiteSpace: 'normal' }}>
        {call.displayCallOutcome ? (
          <span className={`${call.displayCallOutcomeClass} inline-block max-w-[120px] break-words`}>
            {call.displayCallOutcome}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell> */}
      <TableCell className="call-table-cell text-center">
        <div className="flex items-center justify-center text-sm">
          <Clock className="h-3 w-3 mr-1" />
          {call.displayDuration}
        </div>
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <span className={call.displayCallTypeClass}>
          {call.displayCallType}
        </span>
      </TableCell>
      {/* Hidden - AI Call Type cell (uncomment to show) */}
      {/* <TableCell className="call-table-cell text-center" style={{ whiteSpace: 'normal' }}>
        {call.displayAICallType ? (
          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 max-w-[120px] break-words">
            {call.displayAICallType}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell> */}
      {/* Hidden - Sentiment cell (uncomment to show) */}
      {/* <TableCell className="call-table-cell text-center" style={{ whiteSpace: 'normal' }}>
        {call.displaySentiment ? (
          <span className={`${call.displaySentimentClass} inline-block max-w-[100px] break-words`}>
            {call.displaySentiment}
          </span>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell> */}
      {/* Dynamic User Field Values */}
      {dynamicUserFieldColumns.map((fieldKey) => (
        <TableCell key={fieldKey} className="call-table-cell" style={{ whiteSpace: 'normal' }}>
          {call.ai_insights?.user_extraction_fields?.[fieldKey] !== undefined &&
           call.ai_insights?.user_extraction_fields?.[fieldKey] !== null &&
           call.ai_insights?.user_extraction_fields?.[fieldKey] !== '' ? (
            <div className="text-xs bg-blue-50 px-2 py-1 rounded inline-block max-w-[150px]">
              <span className="text-blue-900 break-words block">
                {String(call.ai_insights.user_extraction_fields[fieldKey])}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">-</span>
          )}
        </TableCell>
      ))}
      {/* AI Extraction Fields */}
      <TableCell className="call-table-cell text-center" style={{ whiteSpace: 'normal' }}>
        {call.hasAIExtractionFields && call.aiFieldsPreview ? (
          <div className="max-w-xs">
            <div className="text-xs space-y-1">
              {call.aiFieldsPreview.map(({key, value}: {key: string, value: string}) => (
                <div key={key} className="bg-indigo-50 px-2 py-1 rounded text-left">
                  <span className="font-medium text-indigo-700">{key}:</span>
                  <span className="ml-1 text-indigo-900 block break-words max-w-[180px]">{value}</span>
                </div>
              ))}
              {call.aiFieldsCount > 2 && (
                <span className="text-indigo-600 text-xs font-medium">
                  +{call.aiFieldsCount - 2} more
                </span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      {/* Key Points */}
      <TableCell className="call-table-cell text-center call-table-complex-cell" style={{ whiteSpace: 'normal' }}>
        {call.ai_insights?.key_points && call.ai_insights.key_points.length > 0 ? (
          <div
            className="max-w-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedKeyPoints(!expandedKeyPoints)
            }}
          >
            <div className="text-xs">
              {expandedKeyPoints ? (
                // Show all points when expanded
                <div className="space-y-1">
                  {call.ai_insights.key_points.map((point: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-blue-50 px-2 py-0.5 rounded">
                      <span className="text-blue-600 text-base mr-1 flex-shrink-0 leading-none">•</span>
                      <span className="text-blue-900 break-words text-left text-xs">{point}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center text-blue-600 text-xs font-medium mt-1">
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Click to collapse
                  </div>
                </div>
              ) : (
                // Show truncated view when collapsed
                <div>
                  {call.ai_insights.key_points.slice(0, 1).map((point: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-blue-50 px-2 py-0.5 rounded">
                      <span className="text-blue-600 text-base mr-1 flex-shrink-0 leading-none">•</span>
                      <span className="text-blue-900 break-words max-w-[180px] text-left text-xs truncate">{point}</span>
                    </div>
                  ))}
                  {call.ai_insights.key_points.length > 1 && (
                    <div className="flex items-center justify-center text-blue-600 text-xs font-medium mt-1">
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{call.ai_insights.key_points.length - 1} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      {/* Next Action Items */}
      <TableCell className="call-table-cell text-center call-table-complex-cell" style={{ whiteSpace: 'normal' }}>
        {call.hasNextActions && call.ai_insights?.next_action_items ? (
          <div
            className="max-w-xs cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              setExpandedNextActions(!expandedNextActions)
            }}
          >
            <div className="text-xs">
              {expandedNextActions ? (
                // Show all actions when expanded
                <div className="space-y-1">
                  {call.ai_insights.next_action_items.map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-green-50 px-2 py-0.5 rounded">
                      <span className="text-green-600 text-base mr-1 flex-shrink-0 leading-none">•</span>
                      <span className="text-green-900 break-words text-left text-xs">{item}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-center text-green-600 text-xs font-medium mt-1">
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Click to collapse
                  </div>
                </div>
              ) : (
                // Show truncated view when collapsed
                <div>
                  {call.ai_insights.next_action_items.slice(0, 1).map((item: string, idx: number) => (
                    <div key={idx} className="flex items-start bg-green-50 px-2 py-0.5 rounded">
                      <span className="text-green-600 text-base mr-1 flex-shrink-0 leading-none">•</span>
                      <span className="text-green-900 break-words max-w-[180px] text-left text-xs truncate">{item}</span>
                    </div>
                  ))}
                  {call.nextActionsCount > 1 && (
                    <div className="flex items-center justify-center text-green-600 text-xs font-medium mt-1">
                      <ChevronDown className="h-3 w-3 mr-1" />
                      +{call.nextActionsCount - 1} more
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400">-</span>
        )}
      </TableCell>
      <TableCell className="call-table-cell text-center">
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectCall(call)}
            className="px-5 py-2 min-w-[130px] whitespace-nowrap"
          >
            Raw data
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

CallTableRow.displayName = 'CallTableRow'

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null)
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null)
  // Agent-first loading: Load from localStorage or empty string
  // SHARED KEY: Using same key as Leads page for seamless navigation
  const [filters, setFilters] = useState(() => {
    const savedAgentId = typeof window !== 'undefined'
      ? localStorage.getItem('leads_selected_agent') || ''
      : '';
    return {
      agent_id: savedAgentId,
      outcome: 'all',
      start_date: '',
      end_date: '',
      search: '',
      duration_range: 'all'
    };
  })
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }))
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchInput])

  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(25) // Reduced to 25 for better performance

  // Only fetch calls when agent is selected
  const { data: callsData, isLoading: callsLoading, error: callsError } = useCallHistory({
    page: currentPage,
    per_page: pageSize,
    ...(filters.agent_id && { agent_id: filters.agent_id }),
    ...(filters.outcome !== 'all' && { outcome: filters.outcome as 'answered' | 'no_answer' | 'failed' }),
    ...(filters.start_date && { start_date: filters.start_date }),
    ...(filters.end_date && { end_date: filters.end_date }),
    ...(filters.search && { search: filters.search })
  }, { enabled: !!filters.agent_id })

  // Always fetch agents from global cache - no more lazy loading
  const { data: agentsData, isLoading: agentsLoading } = useAllAgents()

  const { data: aiInsightsData, isLoading: aiInsightsLoading } = useAIInsights({
    perPage: 100,
    ...(filters.start_date && { startDate: filters.start_date }),
    ...(filters.end_date && { endDate: filters.end_date })
  })

  const { data: metrics, isLoading: metricsLoading } = useCallMetrics({
    ...(filters.agent_id && { agent_id: filters.agent_id }),
    ...(filters.start_date && { start_date: filters.start_date }),
    ...(filters.end_date && { end_date: filters.end_date })
  })

  // Memoize derived data to prevent unnecessary re-renders
  const calls = useMemo(() => callsData?.calls || [], [callsData?.calls])
  const agents = useMemo(() => agentsData?.agents || [], [agentsData?.agents])
  const aiInsights = useMemo(() => aiInsightsData?.insights || [], [aiInsightsData?.insights])
  const loading = callsLoading || agentsLoading || metricsLoading || aiInsightsLoading
  const error = callsError?.message || null

  // Auto-select single agent on mount or when agents change
  useEffect(() => {
    if (agents.length === 1 && !filters.agent_id) {
      const singleAgentId = agents[0].id;
      setFilters(prev => ({ ...prev, agent_id: singleAgentId }));
      localStorage.setItem('leads_selected_agent', singleAgentId);
    }
  }, [agents, filters.agent_id]);

  // Clear localStorage on logout
  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      // If access token is removed (logout), clear agent selection
      if (e.key === 'access_token' && e.newValue === null) {
        localStorage.removeItem('leads_selected_agent');
        setFilters(prev => ({ ...prev, agent_id: '' }));
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

  // Handle agent filter change with localStorage sync (SHARED KEY)
  const handleAgentChange = useCallback((newAgentId: string) => {
    setFilters(prev => ({ ...prev, agent_id: newAgentId }));
    if (newAgentId) {
      localStorage.setItem('leads_selected_agent', newAgentId);
    } else {
      localStorage.removeItem('leads_selected_agent');
    }
  }, []);

  useCallUpdates({
    enabled: true,
    onUpdate: () => {
      // Handle real-time updates
    },
    onError: () => {
      // SSE connection error handled silently
    }
  })

  const totalItems = callsData?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = calls.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = calls.length > 0 ? (currentPage - 1) * pageSize + calls.length : 0
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const goToPage = (pageNum: number) => {
    const safePage = Math.max(1, Math.min(pageNum, totalPages))
    setCurrentPage(safePage)
  }

  const insightMap = useMemo(() => {
    const map = new Map<string, any>()

    aiInsights.forEach(insight => {
      if (insight.call_id) {
        map.set(insight.call_id, insight)
      }
      if (insight.original_history_id) {
        map.set(insight.original_history_id, insight)
      }
      if (insight.id) {
        map.set(insight.id, insight)
      }
    })

    return map
  }, [aiInsights])

  const callsWithInsights = useMemo(() => {
    return calls.map(call => {
    const matchingInsight =
      (call.raw_webhook_data?.id && insightMap.get(call.raw_webhook_data.id)) ||
      (call.call_id && insightMap.get(call.call_id)) ||
      insightMap.get(call.id) ||
      (call.retell_call_id && insightMap.get(call.retell_call_id)) ||
      (call.bolna_call_id && insightMap.get(call.bolna_call_id)) ||
      (() => {
        if (call.raw_webhook_data) {
          return (call.raw_webhook_data.call_id && insightMap.get(call.raw_webhook_data.call_id)) ||
                 (call.raw_webhook_data.retell_call_id && insightMap.get(call.raw_webhook_data.retell_call_id)) ||
                 (call.raw_webhook_data.bolna_call_id && insightMap.get(call.raw_webhook_data.bolna_call_id))
        }
        return null
      })()


    if (matchingInsight) {

      const aiInsightsData = matchingInsight.ai_insights || {}

      const userFields = aiInsightsData.user_extraction_fields ||
                         aiInsightsData.extraction_fields ||
                         matchingInsight.extracted_info || {}
      const aiFields = aiInsightsData.ai_extraction_fields || {}

      return {
        ...call,
        call_id: matchingInsight.call_id, // Call ID from AI insights endpoint (for prompt improvement API)
        aiInsightId: matchingInsight.id,  // Store the AI insight ID for the modal
        ai_insights: {
          call_type: aiInsightsData.call_type,
          customer_sentiment: aiInsightsData.sentiment || matchingInsight.sentiment,
          sentiment: aiInsightsData.sentiment || matchingInsight.sentiment, // For modal compatibility
          call_outcome: aiInsightsData.call_outcome,
          user_extraction_fields: userFields,
          ai_extraction_fields: aiFields,
          next_action_items: aiInsightsData.next_action_items,
          objections: (typeof aiInsightsData.objections === 'object' && !Array.isArray(aiInsightsData.objections))
            ? aiInsightsData.objections
            : (typeof matchingInsight.objections === 'object' && !Array.isArray(matchingInsight.objections))
            ? matchingInsight.objections
            : undefined,
          pain_points: aiInsightsData.pain_points,
          competitor_mentions: aiInsightsData.competitor_mentions,
          // Add all the missing fields for modal display
          system_responses: aiInsightsData.system_responses,
          call_purpose: aiInsightsData.call_purpose,
          key_points: aiInsightsData.key_points || matchingInsight.key_points,
          summary: aiInsightsData.summary || matchingInsight.summary,
          recommended_stage: aiInsightsData.recommended_stage,
          callback_requested: aiInsightsData.callback_requested,
          callback_time: aiInsightsData.callback_time,
          do_not_call: aiInsightsData.do_not_call,
          rejected_ai: aiInsightsData.rejected_ai,
          rejected_ai_details: aiInsightsData.rejected_ai_details,
          ai_response_validation: aiInsightsData.ai_response_validation,
          next_best_time: aiInsightsData.next_best_time,
          next_action: aiInsightsData.next_action || matchingInsight.next_action,
          business_context: aiInsightsData.business_context,
          company_context: aiInsightsData.company_context,
          company_context_data: aiInsightsData.company_context_data
        }
      }
    }

    return call
    })
  }, [calls, insightMap])

  useEffect(() => {
    if (!loading && calls.length >= 0 && !hasInitiallyLoaded) {
      setHasInitiallyLoaded(true)
    }
  }, [loading, calls.length, hasInitiallyLoaded])

  useEffect(() => {
    setCurrentPage(1)
  }, [filters.agent_id, filters.outcome, filters.start_date, filters.end_date, filters.search, filters.duration_range, pageSize])

  useEffect(() => {
    if (!callsLoading && currentPage > 1 && calls.length === 0) {
      setCurrentPage(1)
    }
  }, [callsLoading, calls.length, currentPage])

  // Use cached format function from optimization hook
  const memoizedFormatFieldName = useCallback(formatFieldNameCached, [])

  const handleSelectCall = useCallback((call: CallHistoryItem) => {
    setSelectedCall(call)
  }, [])

  const handleRowHover = useCallback((id: string | null) => {
    setHoveredRowId(id)
  }, [])

  // Use optimized call data
  const optimizedCallsData = useCallTableData(callsWithInsights as any)

  const filteredCalls = useMemo(() => {
    return optimizedCallsData.filter(call => {
      // When duration filter is active, exclude failed calls
      if (filters.duration_range !== 'all') {
        // Exclude calls with failed status or outcome
        if (call.status === 'failed' || call.outcome === 'failed') {
          return false
        }

        // Apply duration filter only to successful calls
        if (call.duration_seconds !== undefined) {
          const duration = call.duration_seconds
          switch (filters.duration_range) {
            case '0-30':
              if (duration >= 30) return false
              break
            case '30-60':
              if (duration < 30 || duration >= 60) return false
              break
            case '60-180':
              if (duration < 60 || duration >= 180) return false
              break
            case '180+':
              if (duration < 180) return false
              break
          }
        } else {
          // Exclude calls with no duration when duration filter is active
          return false
        }
      }
      return true
    })
  }, [optimizedCallsData, filters.duration_range])

  const dynamicUserFieldColumns = useMemo(() => {
    const fieldFrequency = new Map<string, number>()

    filteredCalls.forEach(call => {
      if (call.ai_insights?.user_extraction_fields) {
        Object.keys(call.ai_insights.user_extraction_fields).forEach(key => {
          const value = call.ai_insights?.user_extraction_fields?.[key]
          if (value !== null && value !== undefined && value !== '') {
            fieldFrequency.set(key, (fieldFrequency.get(key) || 0) + 1)
          }
        })
      }
    })

    const sortedFields = Array.from(fieldFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key]) => key)


    return sortedFields
  }, [filteredCalls])

  const handleExportCSV = () => {
    if (filteredCalls.length === 0) {
      alert('No data to export')
      return
    }

    setIsExporting(true)
    try {
      const csvContent = generateCSV(filteredCalls, dynamicUserFieldColumns)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const filename = `call_history_${timestamp}.csv`
      downloadCSV(csvContent, filename)
    } catch (error) {
      alert('Failed to export CSV. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading && !hasInitiallyLoaded) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="space-y-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
            <p className="text-gray-600">
              View and analyze all call interactions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={isExporting || filteredCalls.length === 0}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Phone className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.total_calls || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">%</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pick-up Rate</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(metrics?.pickup_rate || 0)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.average_attempts_per_lead?.toFixed(1) || '0'}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">#</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Active Agents</p>
                <p className="text-2xl font-bold text-gray-900">{metrics?.active_agents || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Agent Filter - First position (moved from middle) */}
            <div>
              {agents.length === 1 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-sm text-gray-900">{agents[0].name}</span>
                  </div>
                </div>
              ) : (
                <CustomDropdown
                  label="Agent"
                  icon={<Users className="h-4 w-4" />}
                  value={filters.agent_id}
                  onChange={handleAgentChange}
                  searchable={true}
                  options={[
                    { value: '', label: 'Select an Agent' },
                    ...agents.map((agent: Agent) => ({
                      value: agent.id,
                      label: agent.name
                    }))
                  ]}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <DateRangeSelector
                value={{ start_date: filters.start_date, end_date: filters.end_date }}
                onChange={(dates) => setFilters(prev => ({ ...prev, ...dates }))}
              />
            </div>
            <div>
              <CustomDropdown
                label={`Duration${filters.duration_range !== 'all' ? ' (excludes failed)' : ''}`}
                icon={<ClockIcon className="h-4 w-4" />}
                value={filters.duration_range}
                onChange={(value) => setFilters(prev => ({ ...prev, duration_range: value }))}
                options={[
                  { value: 'all', label: 'All Durations' },
                  { value: '0-30', label: 'Under 30 seconds' },
                  { value: '30-60', label: '30 sec - 1 min' },
                  { value: '60-180', label: '1 - 3 minutes' },
                  { value: '180+', label: 'More than 3 min' }
                ]}
              />
            </div>
            <div>
              <CustomDropdown
                label="Outcome"
                icon={<Filter className="h-4 w-4" />}
                value={filters.outcome}
                onChange={(value) => setFilters(prev => ({ ...prev, outcome: value }))}
                options={[
                  { value: 'all', label: 'All Outcomes' },
                  { value: 'answered', label: 'Answered', icon: <span className="w-2 h-2 bg-green-500 rounded-full" /> },
                  { value: 'no_answer', label: 'No Answer', icon: <span className="w-2 h-2 bg-yellow-500 rounded-full" /> },
                  { value: 'failed', label: 'Failed', icon: <span className="w-2 h-2 bg-red-500 rounded-full" /> }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {callsLoading && calls.length > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent"></div>
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Search leads, agents, summary..."
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  disabled={!filters.agent_id}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          {!filters.agent_id ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">Please select an agent to view call history.</p>
            </div>
          ) : callsLoading && !hasInitiallyLoaded ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : calls.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No call history found for this agent.</p>
            </div>
          ) : (
            <>
          <div className="call-table-container">
          <div className="overflow-x-auto relative call-table-wrapper">
          <Table className="call-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-center whitespace-nowrap">Date/Time</TableHead>
                <TableHead className="text-center whitespace-nowrap">Agent</TableHead>
                <TableHead className="text-center whitespace-nowrap">Lead</TableHead>
                <TableHead className="text-center whitespace-nowrap">Phone</TableHead>
                <TableHead className="text-center whitespace-nowrap">Conversation Summary</TableHead>
                <TableHead className="text-center whitespace-nowrap">Call Status</TableHead>
                {/* Hidden - Call Outcome column (uncomment to show) */}
                {/* <TableHead className="text-center whitespace-nowrap">Call Outcome</TableHead> */}
                <TableHead className="text-center whitespace-nowrap">Duration</TableHead>
                <TableHead className="text-center whitespace-nowrap">Call Type</TableHead>
                {/* Hidden - Call Type Analysis column (uncomment to show) */}
                {/* <TableHead className="text-center whitespace-nowrap">
                  Call Type Analysis
                  {aiInsightsLoading && (
                    <div className="inline-block ml-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary-500 border-t-transparent"></div>
                    </div>
                  )}
                </TableHead> */}
                {/* Hidden - Sentiment column (uncomment to show) */}
                {/* <TableHead className="text-center whitespace-nowrap">Sentiment</TableHead> */}
                {/* Dynamic User Field Columns */}
                {dynamicUserFieldColumns.map((fieldKey) => (
                  <TableHead key={fieldKey} className="text-center whitespace-nowrap">
                    {formatFieldName(fieldKey)}
                  </TableHead>
                ))}
                <TableHead className="text-center whitespace-nowrap">Fields Extracted by AI</TableHead>
                <TableHead className="text-center whitespace-nowrap">Key Points</TableHead>
                <TableHead className="text-center whitespace-nowrap">Next Actions</TableHead>
                <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callsLoading && !hasInitiallyLoaded ? (
                <CallTableSkeleton rows={pageSize} />
              ) : filteredCalls.length === 0 ? (
                <TableRow>
                  {/* Note: Change colSpan to 15 if Call Outcome, Call Type Analysis, and Sentiment are uncommented */}
                  <TableCell colSpan={12 + dynamicUserFieldColumns.length} className="text-center py-8">
                    <p className="text-gray-500">No calls found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => (
                  <CallTableRow
                    key={call.id}
                    call={call}
                    dynamicUserFieldColumns={dynamicUserFieldColumns}
                    formatFieldName={memoizedFormatFieldName}
                    onSelectCall={handleSelectCall}
                    hoveredRowId={hoveredRowId}
                    onRowHover={handleRowHover}
                  />
                ))
              )}
            </TableBody>
          </Table>
          </div>
          </div>

          {/* Pagination Controls */}
          {totalItems > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>Showing </span>
                <span className="font-medium mx-1">{startItem}</span>
                <span> to </span>
                <span className="font-medium mx-1">{endItem}</span>
                <span> of </span>
                <span className="font-medium mx-1">{totalItems}</span>
                <span> results</span>
              </div>

              <div className="flex items-center space-x-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(1)}
                  disabled={!hasPrev}
                  title="First page"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrev}
                  title="Previous page"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Info */}
                <div className="px-3 text-sm">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNext}
                  title="Next page"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(totalPages)}
                  disabled={!hasNext}
                  title="Last page"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>

                {/* Page Size Selector */}
                <div className="ml-3">
                  <CustomDropdown
                    options={[
                      { value: '25', label: '25 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => setPageSize(Number(value))}
                    className="w-36"
                    forceUpward={true}
                  />
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      {selectedCall && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            </div>
          </div>
        }>
          <CallDetailModal
            call={{
              ...selectedCall,
              aiInsightId: selectedCall.aiInsightId
            } as any} // Convert CallHistoryItem to InteractionAttempt with aiInsightId
            isOpen={!!selectedCall}
            onClose={() => setSelectedCall(null)}
          />
        </Suspense>
      )}
      </Layout>
    </ProtectedRoute>
  )
}