'use client';

import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { CallScore, TeamScoreAnalytics, RepScoreComparison } from '@/types/calliq';
import { calliqAPI } from '@/lib/calliq-api';

// Single call score hook - DEPRECATED: Use score from call data instead
// export function useCallScore(callId: string): UseQueryResult<CallScore, Error> {
//   return useQuery({
//     queryKey: ['callScore', callId],
//     queryFn: async () => {
//       try {
//         const result = await calliqAPI.getCallScore(callId);
//         return result;
//       } catch (error) {
//         throw error;
//       }
//     },
//     enabled: !!callId,
//     staleTime: 10 * 60 * 1000, // 10 minutes
//     gcTime: 30 * 60 * 1000, // 30 minutes
//     refetchOnWindowFocus: false,
//     retry: false, // Don't retry if endpoint doesn't exist
//   });
// }

// Bulk call scores hook - DEPRECATED: Scores are now included in call data
// export function useBulkCallScores(callIds: string[]): UseQueryResult<Record<string, CallScore>, Error> {
//   return useQuery({
//     queryKey: ['bulkCallScores', ...callIds.sort()],
//     queryFn: async () => {
//       try {
//         const result = await calliqAPI.getBulkCallScores(callIds);
//         return result;
//       } catch (error) {
//         throw error;
//       }
//     },
//     enabled: callIds.length > 0,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//     gcTime: 15 * 60 * 1000, // 15 minutes
//     refetchOnWindowFocus: false,
//     retry: false, // Don't retry if endpoint doesn't exist
//   });
// }

// Team score analytics hook - NOT IMPLEMENTED IN BACKEND
// export function useTeamScoreAnalytics(
//   dateRange?: { start: string; end: string }
// ): UseQueryResult<TeamScoreAnalytics, Error> {
//   return useQuery({
//     queryKey: ['teamScoreAnalytics', dateRange],
//     queryFn: () => calliqAPI.getTeamScoreAnalytics(dateRange),
//     staleTime: 2 * 60 * 1000, // 2 minutes
//     gcTime: 10 * 60 * 1000, // 10 minutes
//     refetchOnWindowFocus: false,
//   });
// }

// Rep score comparison hook
export function useRepScoreComparison(
  repId?: string,
  dateRange?: { start: string; end: string }
): UseQueryResult<RepScoreComparison[], Error> {
  return useQuery({
    queryKey: ['repScoreComparison', repId, dateRange],
    queryFn: () => calliqAPI.getRepScoreComparison(repId, dateRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
  });
}

// Hook to prefetch call scores for a list of calls
export function usePrefetchCallScores() {
  const queryClient = useQueryClient();
  
  return (callIds: string[]) => {
    if (callIds.length === 0) return;
    
    // Prefetch bulk scores
    queryClient.prefetchQuery({
      queryKey: ['bulkCallScores', ...callIds.sort()],
      queryFn: () => calliqAPI.getBulkCallScores(callIds),
      staleTime: 5 * 60 * 1000,
    });

    // Prefetch individual scores for cache efficiency
    callIds.forEach(callId => {
      queryClient.prefetchQuery({
        queryKey: ['callScore', callId],
        queryFn: () => calliqAPI.getCallScore(callId),
        staleTime: 10 * 60 * 1000,
      });
    });
  };
}