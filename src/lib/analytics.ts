declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        page_path?: string
        page_title?: string
        user_id?: string
        event_category?: string
        event_label?: string
        value?: number
        [key: string]: string | number | boolean | undefined
      }
    ) => void
    dataLayer: any[]
  }
}

// GA4 Measurement ID from environment
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

// Check if analytics is enabled
export const isAnalyticsEnabled = (): boolean => {
  return typeof window !== 'undefined' &&
         typeof window.gtag !== 'undefined' &&
         GA_MEASUREMENT_ID !== ''
}

/**
 * Initialize Google Analytics
 */
export const initGA = (): void => {
  if (isAnalyticsEnabled()) {
    console.log('Admin Panel Analytics initialized:', GA_MEASUREMENT_ID)
  }
}

/**
 * Set User ID for user-specific tracking
 * Call this after user logs in
 */
export const setUserId = (userId: string): void => {
  if (isAnalyticsEnabled()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    })
    console.log('Analytics User ID set:', userId)
  }
}

/**
 * Set user properties (role, company, etc.)
 */
export const setUserProperties = (properties: Record<string, any>): void => {
  if (isAnalyticsEnabled()) {
    window.gtag('set', 'user_properties', properties)
  }
}

/**
 * Track page view
 */
export const pageview = (url: string, title?: string): void => {
  if (isAnalyticsEnabled()) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    })
  }
}

/**
 * Generic event tracking
 */
export const event = ({
  action,
  category,
  label,
  value,
  additionalParams = {},
}: {
  action: string
  category: string
  label?: string
  value?: number
  additionalParams?: Record<string, any>
}): void => {
  if (isAnalyticsEnabled()) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
      ...additionalParams,
    })
  }
}

/**
 * Helper function to track events
 */
const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
  additionalParams?: Record<string, any>
): void => {
  event({ action, category, label, value, additionalParams })
}

// ========================================
// REFERRER SOURCE DETECTION
// ========================================

export const getReferrerSource = (referrer: string): string => {
  if (!referrer) return 'direct'

  const ref = referrer.toLowerCase()

  // ChatGPT traffic
  if (ref.includes('chat.openai.com') || ref.includes('chatgpt')) return 'chatgpt'

  // Search engines
  if (ref.includes('google.com')) return 'google'
  if (ref.includes('bing.com')) return 'bing'

  // Social media
  if (ref.includes('linkedin.com')) return 'linkedin'
  if (ref.includes('twitter.com') || ref.includes('t.co')) return 'twitter'

  return 'referral'
}

export const trackReferrer = (): void => {
  if (typeof document === 'undefined') return

  const referrer = document.referrer
  const source = getReferrerSource(referrer)

  trackEvent('Traffic', 'referrer_detected', source, undefined, {
    referrer_url: referrer,
    referrer_source: source,
  })
}

// ========================================
// PAGE TRACKING
// ========================================

export const trackPageView = (url: string, title?: string): void => {
  pageview(url, title)
  trackEvent('Navigation', 'page_view', url)
}

export const trackTimeOnPage = (pageName: string, seconds: number): void => {
  trackEvent('Engagement', 'time_on_page', pageName, seconds, {
    time_seconds: seconds,
    page_name: pageName,
  })
}

// ========================================
// AUTHENTICATION
// ========================================

export const trackLogin = (userId: string, method: string = 'google'): void => {
  setUserId(userId) // Set user ID for all future events
  trackEvent('Authentication', 'login', method, undefined, {
    user_id: userId,
    login_method: method,
  })
}

export const trackLogout = (): void => {
  trackEvent('Authentication', 'logout')
}

export const trackLoginFailure = (reason: string): void => {
  trackEvent('Authentication', 'login_failure', reason, undefined, {
    failure_reason: reason,
  })
}

// ========================================
// AGENT MANAGEMENT
// ========================================

export const trackAgentCreated = (agentType?: string, templateUsed?: string): void => {
  trackEvent('Agent', 'agent_created', agentType, undefined, {
    agent_type: agentType,
    template_used: templateUsed,
  })
}

export const trackAgentEdited = (agentId: string, changeType?: string): void => {
  trackEvent('Agent', 'agent_edited', changeType, undefined, {
    agent_id: agentId,
    change_type: changeType,
  })
}

export const trackAgentDeleted = (agentId: string): void => {
  trackEvent('Agent', 'agent_deleted', undefined, undefined, {
    agent_id: agentId,
  })
}

export const trackAgentStatusChanged = (agentId: string, newStatus: string): void => {
  trackEvent('Agent', 'agent_status_changed', newStatus, undefined, {
    agent_id: agentId,
    new_status: newStatus,
  })
}

export const trackAgentVoiceChanged = (agentId: string, voiceId: string): void => {
  trackEvent('Agent', 'agent_voice_changed', voiceId, undefined, {
    agent_id: agentId,
    voice_id: voiceId,
  })
}

// ========================================
// LEAD MANAGEMENT
// ========================================

export const trackLeadsImported = (count: number, source: string = 'csv'): void => {
  trackEvent('Lead', 'leads_imported', source, count, {
    lead_count: count,
    import_source: source,
  })
}

export const trackLeadCalled = (leadId: string, agentId: string): void => {
  trackEvent('Lead', 'lead_called', undefined, undefined, {
    lead_id: leadId,
    agent_id: agentId,
  })
}

export const trackLeadStatusChanged = (leadId: string, newStatus: string): void => {
  trackEvent('Lead', 'lead_status_changed', newStatus, undefined, {
    lead_id: leadId,
    new_status: newStatus,
  })
}

export const trackLeadExported = (count: number, format: string = 'csv'): void => {
  trackEvent('Lead', 'leads_exported', format, count, {
    lead_count: count,
    export_format: format,
  })
}

// ========================================
// CALL MANAGEMENT
// ========================================

export const trackCallScheduled = (leadId?: string, agentId?: string): void => {
  trackEvent('Call', 'call_scheduled', undefined, undefined, {
    lead_id: leadId,
    agent_id: agentId,
  })
}

export const trackCallCompleted = (callId: string, duration?: number, outcome?: string): void => {
  trackEvent('Call', 'call_completed', outcome, duration, {
    call_id: callId,
    call_duration: duration,
    call_outcome: outcome,
  })
}

export const trackCallRecordingPlayed = (callId: string): void => {
  trackEvent('Call', 'call_recording_played', undefined, undefined, {
    call_id: callId,
  })
}

export const trackCallFilterApplied = (filterType: string, filterValue: string): void => {
  trackEvent('Call', 'call_filter_applied', filterType, undefined, {
    filter_type: filterType,
    filter_value: filterValue,
  })
}

// ========================================
// UI INTERACTIONS
// ========================================

export const trackButtonClicked = (buttonName: string, location: string): void => {
  trackEvent('UI', 'button_clicked', buttonName, undefined, {
    button_name: buttonName,
    button_location: location,
  })
}

export const trackModalOpened = (modalName: string): void => {
  trackEvent('UI', 'modal_opened', modalName)
}

export const trackModalClosed = (modalName: string): void => {
  trackEvent('UI', 'modal_closed', modalName)
}

export const trackTabChanged = (tabName: string, section: string): void => {
  trackEvent('UI', 'tab_changed', tabName, undefined, {
    tab_name: tabName,
    section: section,
  })
}

export const trackSearchPerformed = (searchTerm: string, resultsCount: number, searchType: string): void => {
  trackEvent('Search', 'search_performed', searchType, resultsCount, {
    search_term: searchTerm,
    results_count: resultsCount,
    search_type: searchType,
  })
}

// ========================================
// ERROR TRACKING
// ========================================

export const trackError = (errorMessage: string, errorType: string = 'javascript_error'): void => {
  trackEvent('Error', errorType, errorMessage, undefined, {
    error_message: errorMessage,
    error_type: errorType,
  })
}

export const trackAPIError = (endpoint: string, statusCode: number, errorMessage?: string): void => {
  trackEvent('Error', 'api_error', endpoint, statusCode, {
    endpoint: endpoint,
    status_code: statusCode,
    error_message: errorMessage,
  })
}

// ========================================
// FEATURE USAGE
// ========================================

export const trackFeatureUsed = (featureName: string, location?: string): void => {
  trackEvent('Feature', 'feature_used', featureName, undefined, {
    feature_name: featureName,
    feature_location: location,
  })
}

export const trackTemplateUsed = (templateName: string, context: string): void => {
  trackEvent('Template', 'template_used', templateName, undefined, {
    template_name: templateName,
    usage_context: context,
  })
}

// Export all tracking functions
const analytics = {
  initGA,
  setUserId,
  setUserProperties,
  pageview,
  event,
  trackPageView,
  trackTimeOnPage,
  trackReferrer,
  getReferrerSource,

  // Authentication
  trackLogin,
  trackLogout,
  trackLoginFailure,

  // Agent Management
  trackAgentCreated,
  trackAgentEdited,
  trackAgentDeleted,
  trackAgentStatusChanged,
  trackAgentVoiceChanged,

  // Lead Management
  trackLeadsImported,
  trackLeadCalled,
  trackLeadStatusChanged,
  trackLeadExported,

  // Call Management
  trackCallScheduled,
  trackCallCompleted,
  trackCallRecordingPlayed,
  trackCallFilterApplied,

  // UI Interactions
  trackButtonClicked,
  trackModalOpened,
  trackModalClosed,
  trackTabChanged,
  trackSearchPerformed,

  // Errors
  trackError,
  trackAPIError,

  // Feature Usage
  trackFeatureUsed,
  trackTemplateUsed,
}

export default analytics
