const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1'

export interface DemoStatus {
  demo_mode: boolean
  account_stage: string
  verified_leads_only: boolean
  calls_made: number
  calls_limit: number
  calls_remaining: number
  global_calls_today: number
  global_daily_limit: number
  global_calls_remaining: number
  demo_phone_number: string
  restrictions: string[]
  upgrade_available: boolean
  // Agent limit fields
  agents_count?: number
  agents_limit?: number
  agents_remaining?: number
  // CallIQ analysis limits
  calliq_analysis_daily_limit?: number
  calliq_analysis_monthly_limit?: number
  calliq_analysis_daily_remaining?: number
  calliq_analysis_monthly_remaining?: number
  calliq_max_duration_minutes?: number
}

export class DemoAPI {
  static async getDemoStatus(accessToken: string): Promise<DemoStatus> {
    const response = await fetch(`${API_BASE_URL}/demo/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch demo status' }))
      throw new Error(error.detail || 'Failed to fetch demo status')
    }

    const data = await response.json()
    
    // Check if there's a nested calliq object
    const calliqData = data.calliq || data.calliq_limits || data.calliq_status || {};
    
    // Map backend fields to frontend expected fields if needed
    // Check for various possible field names the backend might use
    const mappedData: DemoStatus = {
      ...data,
      // If backend sends different field names, map them here
      calliq_analysis_daily_remaining: 
        data.calliq_analysis_daily_remaining ?? 
        data.calliq_daily_remaining ?? 
        data.daily_calliq_remaining ??
        data.calliq_remaining_daily ??
        data.analysis_daily_remaining ??
        data.transcript_daily_remaining ??
        calliqData.daily_remaining ??
        data.daily_remaining,
      calliq_analysis_monthly_remaining: 
        data.calliq_analysis_monthly_remaining ?? 
        data.calliq_monthly_remaining ?? 
        data.monthly_calliq_remaining ??
        data.calliq_remaining_monthly ??
        data.analysis_monthly_remaining ??
        data.transcript_monthly_remaining ??
        calliqData.monthly_remaining ??
        data.monthly_remaining,
      calliq_analysis_daily_limit: 
        data.calliq_analysis_daily_limit ?? 
        data.calliq_daily_limit ?? 
        data.daily_calliq_limit ??
        data.demo_calliq_daily_limit ??
        data.analysis_daily_limit ??
        data.transcript_daily_limit ??
        calliqData.daily_limit ??
        data.calliq_limit_daily,
      calliq_analysis_monthly_limit: 
        data.calliq_analysis_monthly_limit ?? 
        data.calliq_monthly_limit ?? 
        data.monthly_calliq_limit ??
        data.demo_calliq_monthly_limit ??
        data.analysis_monthly_limit ??
        data.transcript_monthly_limit ??
        calliqData.monthly_limit ??
        data.calliq_limit_monthly,
      calliq_max_duration_minutes: 
        data.calliq_max_duration_minutes ?? 
        data.max_duration_minutes ?? 
        data.calliq_duration_max ??
        data.demo_calliq_max_duration_minutes ??
        data.analysis_max_duration ??
        data.transcript_max_duration ??
        calliqData.max_duration ??
        data.calliq_max_duration,
    }
    
    
    return mappedData
  }
}