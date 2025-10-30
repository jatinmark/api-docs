/**
 * Optimistic UI Update Helpers
 * Utilities for managing optimistic updates in React Query
 */

import { Lead } from '@/types'

/**
 * Generate a temporary client-side ID for optimistic creates
 */
export function generateTempId(prefix = 'temp'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if an ID is temporary (client-generated)
 */
export function isTempId(id: string): boolean {
  return id.startsWith('temp_')
}

/**
 * Create an optimistic lead with pending state
 */
export function createOptimisticLead(leadData: {
  agent_id: string
  first_name: string
  phone_e164: string
  custom_fields?: Record<string, any>
  schedule_at?: string
}): Lead {
  const tempId = generateTempId('temp_lead')

  return {
    id: tempId,
    agent_id: leadData.agent_id,
    first_name: leadData.first_name,
    phone_e164: leadData.phone_e164,
    custom_fields: leadData.custom_fields || {},
    schedule_at: leadData.schedule_at || new Date().toISOString(),
    status: 'new' as const,
    attempts_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Mark as optimistic
    _optimistic: true,
    _pending: true
  } as Lead & { _optimistic?: boolean; _pending?: boolean }
}

/**
 * Update leads list with optimistic lead
 */
export function addOptimisticLeadToList(
  currentData: { leads: Lead[]; total?: number } | undefined,
  optimisticLead: Lead
): { leads: Lead[]; total?: number } {
  if (!currentData) {
    return { leads: [optimisticLead], total: 1 }
  }

  return {
    ...currentData,
    leads: [optimisticLead, ...currentData.leads],
    total: (currentData.total || currentData.leads.length) + 1
  }
}

/**
 * Remove optimistic lead from list (for rollback)
 */
export function removeOptimisticLeadFromList(
  currentData: { leads: Lead[]; total?: number } | undefined,
  leadId: string
): { leads: Lead[]; total?: number } {
  if (!currentData) {
    return { leads: [], total: 0 }
  }

  const filteredLeads = currentData.leads.filter(lead => lead.id !== leadId)

  return {
    ...currentData,
    leads: filteredLeads,
    total: filteredLeads.length
  }
}

/**
 * Replace temporary lead with real lead from server
 */
export function replaceTemporaryLead(
  currentData: { leads: Lead[]; total?: number } | undefined,
  tempId: string,
  realLead: Lead
): { leads: Lead[]; total?: number } {
  if (!currentData) {
    return { leads: [realLead], total: 1 }
  }

  return {
    ...currentData,
    leads: currentData.leads.map(lead =>
      lead.id === tempId ? realLead : lead
    )
  }
}

/**
 * Mark lead as pending for optimistic operations
 */
export function markLeadAsPending(
  lead: Lead,
  pending = true
): Lead & { _pending?: boolean } {
  return {
    ...lead,
    _pending: pending
  }
}

/**
 * Mark lead with error state
 */
export function markLeadWithError(
  lead: Lead,
  error: string
): Lead & { _error?: string } {
  return {
    ...lead,
    _error: error
  }
}

/**
 * Check if a lead has pending operations
 */
export function isLeadPending(lead: any): boolean {
  return lead?._pending === true
}

/**
 * Check if a lead has an error
 */
export function hasLeadError(lead: any): boolean {
  return typeof lead?._error === 'string'
}

/**
 * Clean up temporary flags from lead
 */
export function cleanLeadFlags(lead: Lead): Lead {
  const cleaned = { ...lead }
  delete (cleaned as any)._optimistic
  delete (cleaned as any)._pending
  delete (cleaned as any)._error
  return cleaned
}