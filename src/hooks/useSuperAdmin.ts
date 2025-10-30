/**
 * React Query hooks for Super Admin Dashboard
 *
 * Provides caching and automatic refresh for super admin data:
 * - Dashboard data (companies, agents, stats)
 * - Activity metrics (charts, trends)
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { transformActivityData } from '@/lib/super-admin-activity-api';

export const superAdminKeys = {
  dashboard: ['super-admin', 'dashboard'] as const,
  activityMetrics: (period: string) => ['super-admin', 'activity', period] as const,
};

/**
 * Hook to fetch super admin dashboard data with caching
 *
 * Features:
 * - 5 minute cache (staleTime)
 * - 15 minute garbage collection
 * - Automatic refetch on window focus
 * - Background refresh when stale
 */
export function useSuperAdminDashboard() {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: superAdminKeys.dashboard,
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/dashboard`,
        {
          headers: {
            'Authorization': `Bearer ${tokens?.access_token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }
      return response.json();
    },
    enabled: !!tokens?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

/**
 * Hook to fetch activity metrics with period-based caching
 *
 * Features:
 * - 2 minute cache (more frequent for charts)
 * - 10 minute garbage collection
 * - Period-specific cache keys
 */
export function useActivityMetrics(period: '7d' | '30d' | '90d' = '30d') {
  const { tokens } = useAuth();

  return useQuery({
    queryKey: superAdminKeys.activityMetrics(period),
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/super-admin/activity-metrics?period=${period}&granularity=daily`,
        {
          headers: {
            'Authorization': `Bearer ${tokens?.access_token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      const rawData = await response.json();
      // Transform the data to match expected format
      return transformActivityData(rawData);
    },
    enabled: !!tokens?.access_token,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to invalidate super admin cache after mutations
 *
 * Usage:
 * ```ts
 * const invalidate = useInvalidateSuperAdmin();
 * // After deleting/updating agent:
 * await invalidate();
 * ```
 */
export function useInvalidateSuperAdmin() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: superAdminKeys.dashboard
    });
  };
}
