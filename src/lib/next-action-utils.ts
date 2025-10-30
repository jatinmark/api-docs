/**
 * Utility functions for handling next_action in both old and new API formats
 */

export type NextActionType =
  | 'follow_up'
  | 'schedule_demo'
  | 'send_proposal'
  | 'close_deal'
  | 'nurture_lead'
  | 'mark_not_interested'
  | 'do_not_call';

export type UrgencyLevel = 'immediate' | 'high' | 'medium' | 'low';

export interface NextActionObject {
  recommended: NextActionType;
  reasoning?: string;
  urgency?: UrgencyLevel;
  details?: string;
}

export interface ProcessedNextAction {
  action: NextActionType;
  reasoning: string;
  urgency: UrgencyLevel;
  details: string;
  isLegacyFormat: boolean;
}

/**
 * Process next_action from both string (old) and object (new) formats
 */
export function processNextAction(nextAction: any): ProcessedNextAction | null {
  if (!nextAction) {
    return null;
  }

  // Handle string format (old API)
  if (typeof nextAction === 'string') {
    return {
      action: nextAction as NextActionType,
      reasoning: '',
      urgency: 'medium',
      details: '',
      isLegacyFormat: true
    };
  }

  // Handle object format (new API)
  if (typeof nextAction === 'object' && nextAction.recommended) {
    return {
      action: nextAction.recommended,
      reasoning: nextAction.reasoning || '',
      urgency: nextAction.urgency || 'medium',
      details: nextAction.details || '',
      isLegacyFormat: false
    };
  }

  return null;
}

/**
 * Get display color classes for urgency levels
 */
export function getUrgencyColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'immediate':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get background gradient for urgency levels
 */
export function getUrgencyGradient(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'immediate':
      return 'from-red-50 to-red-100';
    case 'high':
      return 'from-orange-50 to-orange-100';
    case 'medium':
      return 'from-yellow-50 to-yellow-100';
    case 'low':
      return 'from-gray-50 to-gray-100';
    default:
      return 'from-gray-50 to-gray-100';
  }
}

/**
 * Get icon color for urgency levels
 */
export function getUrgencyIconColor(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'immediate':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Get display color classes for action types
 */
export function getActionTypeColor(action: NextActionType): string {
  switch (action) {
    case 'schedule_demo':
      return 'bg-blue-100 text-blue-800';
    case 'send_proposal':
      return 'bg-indigo-100 text-indigo-800';
    case 'close_deal':
      return 'bg-green-100 text-green-800';
    case 'follow_up':
      return 'bg-purple-100 text-purple-800';
    case 'nurture_lead':
      return 'bg-cyan-100 text-cyan-800';
    case 'mark_not_interested':
      return 'bg-gray-100 text-gray-800';
    case 'do_not_call':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get icon for action types
 */
export function getActionIcon(action: NextActionType): string {
  switch (action) {
    case 'schedule_demo':
      return '📅';
    case 'send_proposal':
      return '📄';
    case 'close_deal':
      return '🎯';
    case 'follow_up':
      return '📞';
    case 'nurture_lead':
      return '🌱';
    case 'mark_not_interested':
      return '❌';
    case 'do_not_call':
      return '🚫';
    default:
      return '📌';
  }
}

/**
 * Format action type for display
 */
export function formatActionType(action: NextActionType): string {
  return action
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Format urgency for display
 */
export function formatUrgency(urgency: UrgencyLevel): string {
  return urgency.charAt(0).toUpperCase() + urgency.slice(1);
}

/**
 * Check if next_action requires immediate attention
 */
export function isHighPriority(nextAction: ProcessedNextAction | null): boolean {
  if (!nextAction) return false;
  return nextAction.urgency === 'immediate' || nextAction.urgency === 'high';
}

/**
 * Check if next_action is a negative outcome
 */
export function isNegativeAction(action: NextActionType): boolean {
  return ['mark_not_interested', 'do_not_call'].includes(action);
}

/**
 * Check if next_action is a positive outcome
 */
export function isPositiveAction(action: NextActionType): boolean {
  return ['schedule_demo', 'send_proposal', 'close_deal'].includes(action);
}