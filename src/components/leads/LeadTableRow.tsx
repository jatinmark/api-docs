import React, { memo } from 'react';
import { TableCell, TableRow } from '@/components/ui/Table';
import { Lead } from '@/types';
import { Phone, Calendar, Edit2, Square, CheckCircle2, AlertCircle, Pause, Play, ChevronDown, ChevronUp } from 'lucide-react';

interface LeadTableRowProps {
  lead: Lead;
  agentMap: Map<string, string>;
  isDemoAccount: boolean;
  requiresVerification: boolean;
  expandedRows: Set<string>;
  schedulingLeadId: string | null;
  onEdit: (lead: Lead) => void;
  onScheduleCall: (leadId: string) => void;
  onStopLead: (leadId: string) => void;
  onPauseSalesCycle: (leadId: string) => void;
  onResumeSalesCycle: (leadId: string) => void;
  onToggleExpand: (leadId: string) => void;
  onShowVerification: (data: { leadId: string; phoneNumber: string }) => void;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  isPausingCycle: boolean;
  isResumingCycle: boolean;
  isStoppingLead: boolean;
}

export const LeadTableRow = memo(({
  lead,
  agentMap,
  isDemoAccount,
  requiresVerification,
  expandedRows,
  schedulingLeadId,
  onEdit,
  onScheduleCall,
  onStopLead,
  onPauseSalesCycle,
  onResumeSalesCycle,
  onToggleExpand,
  onShowVerification,
  getStatusColor,
  getStatusText,
  isPausingCycle,
  isResumingCycle,
  isStoppingLead
}: LeadTableRowProps) => {
  // Check if this is an optimistic/pending lead
  const isOptimistic = (lead as any)._optimistic;
  const isPending = (lead as any)._pending;
  const hasError = (lead as any)._error;

  return (
    <TableRow
      className={`
        transition-all duration-200
        ${isOptimistic ? 'opacity-70 bg-blue-50' : ''}
        ${isPending ? 'animate-pulse' : ''}
        ${hasError ? 'bg-red-50 border-red-200' : ''}
      `}
    >
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="font-medium">{lead.first_name}</div>
          {isOptimistic && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              syncing
            </span>
          )}
          {hasError && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              error
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center">
          <Phone className="h-3 w-3 mr-1 text-gray-400" />
          {lead.phone_e164}
          {isDemoAccount && requiresVerification && (
            lead.is_verified ? (
              <div className="ml-2 group relative inline-flex">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Verified {lead.verified_at && `on ${new Date(lead.verified_at).toLocaleDateString()}`}
                </span>
              </div>
            ) : (
              <button
                onClick={() => onShowVerification({ leadId: lead.id, phoneNumber: lead.phone_e164 })}
                className="ml-2 group relative inline-flex focus:outline-none"
              >
                <AlertCircle className="h-4 w-4 text-yellow-600 hover:text-yellow-700 cursor-pointer" />
                <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Phone Verification Required on demo accounts
                </span>
              </button>
            )
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm font-medium">{agentMap.get(lead.agent_id) || 'Unknown Agent'}</span>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex flex-col items-center space-y-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
            {getStatusText(lead.status)}
          </span>
          {lead.sales_cycle_status && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${{
              'active': 'bg-green-100 text-green-800',
              'paused': 'bg-yellow-100 text-yellow-800',
              'completed': 'bg-blue-100 text-blue-800',
              'cancelled': 'bg-gray-100 text-gray-800'
            }[lead.sales_cycle_status] || 'bg-gray-100 text-gray-800'}`}>
              Auto: {lead.sales_cycle_status.charAt(0).toUpperCase() + lead.sales_cycle_status.slice(1)}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm">{lead.attempts_count}</span>
        {lead.disposition && (
          <div className="text-xs text-gray-500 capitalize">{lead.disposition.replace('_', ' ')}</div>
        )}
      </TableCell>
      <TableCell className="text-center">
        {Object.entries(lead.custom_fields || {}).length > 0 ? (
          <div
            className={`text-sm max-w-xs ${
              Object.entries(lead.custom_fields).length > 2
                ? 'cursor-pointer hover:bg-gray-50 rounded px-2 py-1 -mx-2 -my-1 transition-colors'
                : ''
            }`}
            onClick={
              Object.entries(lead.custom_fields).length > 2
                ? (e) => {
                    e.stopPropagation();
                    onToggleExpand(lead.id);
                  }
                : undefined
            }
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Show first 2 fields or all if expanded */}
                {Object.entries(lead.custom_fields)
                  .slice(0, expandedRows.has(lead.id) ? undefined : 2)
                  .map(([key, value]) => (
                    <div key={key} className="truncate">
                      <span className="font-medium">{key}:</span> {String(value)}
                    </div>
                  ))}

                {/* Show count of remaining fields when collapsed */}
                {!expandedRows.has(lead.id) && Object.entries(lead.custom_fields).length > 2 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{Object.entries(lead.custom_fields).length - 2} more
                  </div>
                )}
              </div>

              {/* Show chevron icon if expandable */}
              {Object.entries(lead.custom_fields).length > 2 && (
                <div className="ml-2 text-gray-400">
                  {expandedRows.has(lead.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-sm max-w-xs">
            <span className="text-gray-400">-</span>
          </div>
        )}
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          <div className="flex flex-col">
            <span>{new Date(lead.schedule_at).toLocaleDateString()}</span>
            {/* Show time if scheduled in the future */}
            {new Date(lead.schedule_at) > new Date() && (
              <span className="text-xs text-gray-500">
                {new Date(lead.schedule_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center space-x-1">
          {/* Edit button */}
          <button
            onClick={() => onEdit(lead)}
            disabled={isOptimistic}
            className="p-1.5 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            title="Edit lead details"
          >
            <Edit2 className="h-4 w-4 text-gray-600" />
          </button>

          {/* Schedule Call button */}
          <button
            onClick={() => onScheduleCall(lead.id)}
            disabled={lead.status === 'in_progress' || schedulingLeadId === lead.id || isOptimistic}
            className={`p-1.5 rounded hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
              schedulingLeadId === lead.id ? 'animate-pulse' : ''
            } ${lead.status === 'in_progress' ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={
              schedulingLeadId === lead.id ? 'Scheduling...' :
              isOptimistic ? 'Processing...' :
              lead.status === 'done' ? 'Schedule Again' :
              lead.status === 'stopped' ? 'Schedule Again' :
              lead.status === 'in_progress' ? 'Call in Progress' :
              'Schedule Call'
            }
          >
            <Phone className={`h-4 w-4 ${lead.status === 'in_progress' ? 'text-gray-400' : 'text-blue-600'}`} />
          </button>

          {/* Visual separator if there are control buttons */}
          {(lead.sales_cycle_status === 'active' || lead.sales_cycle_status === 'paused' || lead.status === 'in_progress') && (
            <div className="w-px h-5 bg-gray-200 mx-1" />
          )}

          {/* Pause/Resume Sales Cycle button */}
          {(lead.sales_cycle_status === 'active' || lead.sales_cycle_status === 'paused') && (
            <button
              onClick={() => lead.sales_cycle_status === 'active'
                ? onPauseSalesCycle(lead.id)
                : onResumeSalesCycle(lead.id)
              }
              disabled={isPausingCycle || isResumingCycle || isOptimistic}
              className={`p-1.5 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
                lead.sales_cycle_status === 'active' ? 'hover:bg-yellow-50' : 'hover:bg-green-50'
              }`}
              title={lead.sales_cycle_status === 'active' ? 'Pause auto-scheduling' : 'Resume auto-scheduling'}
            >
              {lead.sales_cycle_status === 'active' ? (
                <Pause className="h-4 w-4 text-yellow-600" />
              ) : (
                <Play className="h-4 w-4 text-green-600" />
              )}
            </button>
          )}

          {/* Stop button (only for in-progress leads) */}
          {lead.status === 'in_progress' && (
            <button
              onClick={() => onStopLead(lead.id)}
              disabled={isStoppingLead || isOptimistic}
              className="p-1.5 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              title={isStoppingLead ? 'Stopping...' : 'Stop call'}
            >
              <Square className="h-4 w-4 text-red-600" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

LeadTableRow.displayName = 'LeadTableRow';