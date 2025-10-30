import { logger } from './logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Essential interfaces only
export interface ActivityMetricsResponse {
  call_volume_trends: {
    period: string;
    granularity: string;
    data: Array<{
      date: string;
      count: number;
    }>;
  };
  recent_activity: Array<{
    company_name: string;
    agent_name: string;
    timestamp: string;
    call_outcome: string;
    duration_seconds?: number;
  }>;
  realtime_metrics: {
    active_calls_now: number;
    calls_last_hour: number;
    active_agents: number;
    total_companies_active_today: number;
  };
}

// Main API function
export async function fetchActivityMetrics(
  accessToken: string,
  period: '7d' | '30d' | '90d' = '30d',
  granularity: 'daily' | 'hourly' = 'daily'
): Promise<ActivityMetricsResponse> {
  const params = new URLSearchParams({ period, granularity });

  const response = await fetch(
    `${API_BASE_URL}/super-admin/activity-metrics?${params}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch activity metrics' }));
    logger.error(`Activity API Error: ${response.status} - ${error.message || error.detail}`);
    throw new Error(error.message || error.detail || 'Failed to fetch activity metrics');
  }

  return await response.json();
}

// Data transformation helpers
export function transformActivityData(apiData: ActivityMetricsResponse) {
  return {
    callVolumeTrends: apiData.call_volume_trends.data.map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: item.count
    })),


    realtimeActivity: {
      recentCalls: apiData.recent_activity.map((activity, index) => ({
        id: `call-${index}`,
        companyName: activity.company_name,
        timestamp: new Date(activity.timestamp),
        agentName: activity.agent_name,
        duration: activity.duration_seconds
      })),
      callsLastHour: apiData.realtime_metrics.calls_last_hour,
      activeAgents: apiData.realtime_metrics.active_agents,
      currentActiveCalls: apiData.realtime_metrics.active_calls_now
    }
  };
}