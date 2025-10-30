'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  SkeletonStats,
  SkeletonCard,
  SkeletonList
} from '@/components/ui/SkeletonLoader';
import { 
  TrendingUpIcon,
  TrendingDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayCircleIcon,
  CoffeeIcon,
  SunIcon,
  MoonIcon,
  StarIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  FlameIcon,
  PhoneIcon,
  ClockIcon,
  ActivityIcon,
  DownloadIcon
} from 'lucide-react';
import { calliqAPI } from '@/lib/calliq-api';
import { CallIQStats, CallIQCall } from '@/types/calliq';
import { formatDuration, formatDate } from '@/lib/utils';
import { useProcessing } from '@/contexts/ProcessingContext';
import { useAuth } from '@/contexts/AuthContext';
import { AuthStorage } from '@/lib/auth-storage';
import { usePolling } from '@/hooks/usePolling';
import { useAbortController } from '@/hooks/useAbortController';

export default function CallIQDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { processingJobs } = useProcessing();
  
  // State for real data
  const [stats, setStats] = useState<CallIQStats>({
    total_calls: 0,
    avg_win_rate: 0,
    calls_today: 0,
    calls_today_is_yesterday: false,
    processing_count: 0,
    total_duration: 0,
    team_performance_score: 0,
    calls_trend: [],
    win_rate_trend: [],
    sentiment_trend: []
  });
  const [recentCalls, setRecentCalls] = useState<CallIQCall[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState({
    score: { current: 0, trend: '+0%', context: 'Keep pushing!', hasData: false },
    talkTime: { current: 0, trend: '+0%', context: 'Good balance' },
    questions: { current: 0, trend: '+0', context: 'Ask more questions', hasData: false }
  });
  const [personalizedContent, setPersonalizedContent] = useState({
    greeting: '',
    focus: '',
    quickWin: null as any,
    alerts: [] as any[]
  });
  
  const { startLoading, stopLoading, isLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);
  const [processingCallIds, setProcessingCallIds] = useState<Set<string>>(new Set());
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  const isMountedRef = useRef(true);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: <CoffeeIcon className="w-5 h-5" /> };
    if (hour < 17) return { text: 'Good afternoon', icon: <SunIcon className="w-5 h-5" /> };
    return { text: 'Good evening', icon: <MoonIcon className="w-5 h-5" /> };
  };

  // Calculate weekly progress from real data
  const calculateWeeklyProgress = (calls: CallIQCall[], currentStats: CallIQStats) => {
    // Get calls from this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Include both 'completed' and 'analyzing' status calls for score calculation
    const thisWeekCalls = calls.filter(call => 
      new Date(call.date) >= oneWeekAgo && 
      (call.status === 'completed' || call.status === 'analyzing')
    );
    
    const lastWeekStart = new Date(oneWeekAgo);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const lastWeekCalls = calls.filter(call => 
      new Date(call.date) >= lastWeekStart && 
      new Date(call.date) < oneWeekAgo && 
      (call.status === 'completed' || call.status === 'analyzing')
    );

    // Helper function to get score from call (matching CallDetailsView logic)
    const getCallScore = (call: CallIQCall): number => {
      // First try call_score_details.overall_score (this is what CallDetailsView uses)
      if (call?.call_score_details?.overall_score !== undefined && call?.call_score_details?.overall_score !== null) {
        const score = call.call_score_details.overall_score;
        // Parse to number if it's a string
        return typeof score === 'string' ? parseFloat(score) : score;
      }
      
      // Fallback to call.call_score if it exists
      if (call?.call_score !== undefined && call?.call_score !== null) {
        const score = call.call_score;
        return typeof score === 'string' ? parseFloat(score) : score;
      }
      
      return 0;
    };

    // Filter calls that actually have scores
    const thisWeekScoredCalls = thisWeekCalls.filter(call => {
      const score = getCallScore(call);
      return score > 0;
    });
    
    
    const lastWeekScoredCalls = lastWeekCalls.filter(call => {
      const score = getCallScore(call);
      return score > 0;
    });

    // Calculate average scores (null if no scored calls)
    const currentAvgScore = thisWeekScoredCalls.length > 0 
      ? Math.round(thisWeekScoredCalls.reduce((sum, call) => sum + getCallScore(call), 0) / thisWeekScoredCalls.length)
      : null;
    
    const lastWeekAvgScore = lastWeekScoredCalls.length > 0
      ? Math.round(lastWeekScoredCalls.reduce((sum, call) => sum + getCallScore(call), 0) / lastWeekScoredCalls.length)
      : null;

    const scoreTrend = (lastWeekAvgScore !== null && currentAvgScore !== null && lastWeekAvgScore > 0)
      ? `${currentAvgScore >= lastWeekAvgScore ? '+' : ''}${Math.round(((currentAvgScore - lastWeekAvgScore) / lastWeekAvgScore) * 100)}%`
      : '--';

    // Calculate average talk time
    const currentAvgTalkTime = thisWeekCalls.length > 0
      ? Math.round(thisWeekCalls.reduce((sum, call) => {
          const talkRatio = call.analysis?.talk_ratio?.rep || 50;
          return sum + talkRatio;
        }, 0) / thisWeekCalls.length)
      : 45;

    const lastWeekAvgTalkTime = lastWeekCalls.length > 0
      ? Math.round(lastWeekCalls.reduce((sum, call) => {
          const talkRatio = call.analysis?.talk_ratio?.rep || 50;
          return sum + talkRatio;
        }, 0) / lastWeekCalls.length)
      : 45;

    const talkTimeTrend = `${currentAvgTalkTime <= lastWeekAvgTalkTime ? '-' : '+'}${Math.abs(currentAvgTalkTime - lastWeekAvgTalkTime)}%`;

    // Get questions from the most recent call with data
    const recentCallWithQuestions = thisWeekCalls.find(
      call => Array.isArray(call.analysis?.questions_asked?.by_rep) && 
              call.analysis.questions_asked.by_rep.length > 0
    ) || calls.find(
      call => Array.isArray(call.analysis?.questions_asked?.by_rep) && 
              call.analysis.questions_asked.by_rep.length > 0
    );
    
    const currentQuestions = recentCallWithQuestions?.analysis?.questions_asked?.by_rep?.length || 0;
    
    // For trend, still calculate weekly average for comparison
    const lastWeekAvgQuestions = lastWeekCalls.length > 0
      ? Math.round(lastWeekCalls.reduce((sum, call) => {
          const questions = Array.isArray(call.analysis?.questions_asked?.by_rep) 
            ? call.analysis.questions_asked.by_rep.length 
            : 0;
          return sum + questions;
        }, 0) / lastWeekCalls.length)
      : 0;

    const questionsTrend = lastWeekAvgQuestions > 0 
      ? `${currentQuestions >= lastWeekAvgQuestions ? '+' : ''}${currentQuestions - lastWeekAvgQuestions}`
      : '--';

    // Generate context messages
    const scoreContext = currentAvgScore === null ? "No scored calls yet" :
                        currentAvgScore >= 80 ? "You're crushing it! 🔥" :
                        currentAvgScore >= 70 ? "Great progress, keep it up!" :
                        currentAvgScore >= 60 ? "Room to grow, you got this!" :
                        "Focus on fundamentals";

    const talkTimeContext = currentAvgTalkTime <= 45 ? "Perfect balance!" :
                           currentAvgTalkTime <= 55 ? "Good conversation flow" :
                           currentAvgTalkTime <= 65 ? "Let customers talk more" :
                           "Too much talking";

    const questionsContext = currentQuestions >= 8 ? "Master discoverer!" :
                           currentQuestions >= 5 ? "Good discovery skills" :
                           currentQuestions >= 3 ? "Ask more questions" :
                           currentQuestions > 0 ? "Focus on discovery" :
                           "No questions data yet";

    return {
      score: { 
        current: currentAvgScore ?? 0, // Use 0 for display if null
        trend: scoreTrend, 
        context: scoreContext,
        hasData: currentAvgScore !== null 
      },
      talkTime: { 
        current: currentAvgTalkTime, 
        trend: talkTimeTrend, 
        context: talkTimeContext 
      },
      questions: { 
        current: currentQuestions, 
        trend: questionsTrend, 
        context: questionsContext,
        hasData: currentQuestions > 0
      }
    };
  };

  // Generate personalized content from real data
  const generatePersonalizedContent = (calls: CallIQCall[], stats: CallIQStats) => {
    const completedCalls = calls.filter(call => call.status === 'completed');
    
    // Generate personalized greeting
    let contextualGreeting = `Ready to make today amazing? You have ${stats.calls_today || 0} calls so far.`;
    if (stats.calls_today > 5) {
      contextualGreeting = "You're on fire today! Keep up the momentum 🔥";
    } else if (stats.avg_win_rate > 0.7) {
      contextualGreeting = "Your win rate is impressive this week! Let's keep it going 💪";
    } else if (stats.processing_count > 0) {
      contextualGreeting = `${stats.processing_count} calls are being analyzed. Check back soon for insights!`;
    }

    // Generate today's focus from recent patterns
    let todaysFocus = "Focus on asking more discovery questions to understand customer needs better.";
    
    // Check recent calls for patterns
    const recentCompletedCalls = completedCalls.slice(0, 5);
    const avgRecentScore = recentCompletedCalls.length > 0
      ? recentCompletedCalls.reduce((sum, call) => sum + (call.call_score || 0), 0) / recentCompletedCalls.length
      : 0;

    if (avgRecentScore < 60) {
      todaysFocus = "Let's work on the fundamentals today. Focus on balanced conversation and clear next steps.";
    } else if (avgRecentScore < 75) {
      todaysFocus = "You're doing well! Today, focus on handling objections more effectively and building stronger rapport.";
    } else {
      todaysFocus = "You're in the zone! Today, push for clearer commitments and specific next steps in every call.";
    }

    // Extract quick win from recent action items instead of coaching recommendations
    let quickWin = null;
    for (const call of recentCompletedCalls) {
      if (call.analysis?.action_items?.length) {
        const item: any = call.analysis.action_items[0];
        quickWin = {
          tip: item.task,
          source: "Action Items",
          impact: item.priority === 'high' ? "High impact" : "Medium impact",
          context: item.context_quote || "From recent call analysis"
        };
        break;
      }
    }

    // If no coaching recommendations, provide generic quick win
    if (!quickWin) {
      quickWin = {
        tip: "Start each call by asking about their biggest challenge right now",
        source: "Best Practices",
        impact: "Builds instant rapport",
        context: "Top performers use this technique in 90% of successful calls"
      };
    }

    // Generate alerts based on performance
    const alerts = [];
    if (stats.processing_count > 0) {
      alerts.push({
        type: 'info',
        message: `${stats.processing_count} call${stats.processing_count > 1 ? 's are' : ' is'} being processed`,
        action: 'New insights coming soon!'
      });
    }

    // Check for deal killers in recent calls
    const recentDealKiller = recentCompletedCalls.find(call => call.three_killer_insights?.deal_killer);
    if (recentDealKiller) {
      alerts.push({
        type: 'warning',
        message: `Deal killer spotted: ${recentDealKiller.three_killer_insights?.deal_killer?.title}`,
        action: recentDealKiller.three_killer_insights?.deal_killer?.fix
      });
    }

    // Check for superpowers
    const recentSuperpower = recentCompletedCalls.find(call => call.three_killer_insights?.superpower);
    if (recentSuperpower) {
      alerts.push({
        type: 'success',
        message: `Your superpower: ${recentSuperpower.three_killer_insights?.superpower?.title}`,
        action: recentSuperpower.three_killer_insights?.superpower?.keep_doing
      });
    }

    return {
      greeting: contextualGreeting,
      focus: todaysFocus,
      quickWin,
      alerts
    };
  };

  // Get feedback and emoji for a call based on score and insights
  const getCallFeedback = (call: CallIQCall) => {
    let feedback = '';
    let emoji = '';
    let nextAction = '';

    // Check for Three Killer Insights first
    if (call.three_killer_insights) {
      if (call.three_killer_insights.deal_killer) {
        feedback = call.three_killer_insights.deal_killer.title;
        emoji = '🚨';
        nextAction = call.three_killer_insights.deal_killer.fix;
      } else if (call.three_killer_insights.superpower) {
        feedback = call.three_killer_insights.superpower.title;
        emoji = '⚡';
        nextAction = call.three_killer_insights.superpower.keep_doing;
      } else if (call.three_killer_insights.improvement_area) {
        feedback = call.three_killer_insights.improvement_area.title;
        emoji = '🎯';
        nextAction = call.three_killer_insights.improvement_area.actions?.[0] || '';
      }
    }

    // Fallback to score-based feedback
    if (!feedback) {
      const score = call.call_score || 0;
      if (score >= 90) {
        feedback = 'Outstanding performance!';
        emoji = '🔥';
        nextAction = 'Keep doing what you\'re doing';
      } else if (score >= 80) {
        feedback = 'Great discovery and rapport!';
        emoji = '⭐';
        nextAction = 'Push for clearer next steps';
      } else if (score >= 70) {
        feedback = 'Good energy, watch talk time';
        emoji = '💪';
        nextAction = 'Let the customer talk more';
      } else if (score >= 60) {
        feedback = 'Missed budget qualification';
        emoji = '⚠️';
        nextAction = 'Always discuss budget early';
      } else {
        feedback = 'Review fundamentals';
        emoji = '🎯';
        nextAction = 'Focus on discovery questions';
      }
    }

    return { feedback, emoji, nextAction };
  };

  // Add AbortController for request cancellation
  const { signal, abort } = useAbortController();

  const loadDashboardData = useCallback(async (isInitialLoad = false) => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;

    // Check if we have valid authentication before making API calls
    const tokens = AuthStorage.getTokens();
    if (!tokens || AuthStorage.isTokenExpired(tokens)) {
      // Don't set error state - let the auth context handle redirect
      logger.info('Skipping dashboard load - no valid auth tokens');
      return;
    }

    try {
      if (isInitialLoad) {
        startLoading('dashboard-data', 'Loading dashboard data...');
      }
      setError(null);

      // Fetch all data in parallel with abort signal
      const [statsData, callsData] = await Promise.allSettled([
        calliqAPI.getStats(),
        calliqAPI.getCalls({ 
          sort_by: 'date', 
          sort_order: 'desc' 
        }, 1, 50) // Get more calls for better weekly calculations
      ]);
      
      const stats = statsData.status === 'fulfilled' ? statsData.value : {
        total_calls: 0, avg_win_rate: 0, calls_today: 0, calls_today_is_yesterday: false, 
        processing_count: 0, total_duration: 0, team_performance_score: 0, calls_trend: [],
        win_rate_trend: [], sentiment_trend: []
      };
      
      let calls = callsData.status === 'fulfilled' ? callsData.value?.calls || [] : [];
      
      // Fetch details for the most recent completed call to get score and questions
      if (calls.length > 0) {
        try {
          // Find the most recent completed/analyzing call
          const recentCompletedCall = calls.find(
            call => call.status === 'completed' || call.status === 'analyzing'
          );
          
          if (recentCompletedCall && isMountedRef.current) {
            const detailedCall = await calliqAPI.getCall(recentCompletedCall.id);
            
            // Replace the call in our list with the detailed version
            if (isMountedRef.current) {
              calls = calls.map(call => 
                call.id === detailedCall.id ? detailedCall : call
              );
            }
          }
        } catch (error) {
          logger.warn('Dashboard - Error fetching call details', error as Error);
          // Continue without detailed data if the fetch fails
        }
      }
      
      if (isMountedRef.current) {
        setStats(stats);
        setRecentCalls(calls);
        
        // Calculate weekly progress
        const progress = calculateWeeklyProgress(calls, stats);
        setWeeklyProgress(progress);
        
        // Generate personalized content
        const content = generatePersonalizedContent(calls, stats);
        setPersonalizedContent(content);
        
        // Track processing calls
        const processingCalls = calls.filter(
          (call: any) => call.status === 'transcribing' || call.status === 'analyzing' || call.status === 'uploaded'
        );
        setProcessingCallIds(new Set(processingCalls.map((c: any) => c.id)));
        
        if (isInitialLoad) {
          setHasInitialLoad(true);
        }
      }
      
    } catch (err: any) {
      // Don't log or set error if request was aborted
      if (err?.name === 'AbortError') {
        return;
      }
      
      logger.error('Dashboard API Error', err);
      
      let errorMessage = 'Failed to load dashboard data';
      if (err instanceof Error) {
        if (err.message.includes('Authentication failed')) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = '⏳ System is processing files. Please wait...';
        }
      }
      
      if (isMountedRef.current) {
        setError(errorMessage);
      }
    } finally {
      if (isMountedRef.current) {
        stopLoading('dashboard-data');
      }
    }
  }, [startLoading, stopLoading]); // signal is from useAbortController and doesn't need to be a dependency

  // Event handlers with useCallback to prevent memory leaks
  const handleRetry = useCallback(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  const handleViewInsights = useCallback(() => {
    router.push('/calliq/insights');
  }, [router]);

  const handleViewCall = useCallback((callId: string) => {
    router.push(`/calliq/calls/${callId}`);
  }, [router]);

  // Initial load effect with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    calliqAPI.clearCache();
    loadDashboardData(true);
    
    return () => {
      isMountedRef.current = false;
      abort(); // Cancel any pending requests
    };
  }, [loadDashboardData, abort]);

  // Auto-refresh only when calls are being processed (new uploads)
  // This ensures we get updated data and question counts when uploads complete
  const hasGlobalProcessing = processingJobs.size > 0;
  const shouldPoll = hasGlobalProcessing || processingCallIds.size > 0;
  
  // Use our custom polling hook with automatic cleanup
  usePolling(
    async () => {
      if (isMountedRef.current) {
        try {
          await loadDashboardData(false);
        } catch (err: any) {
          // Don't log abort errors
          if (err?.name !== 'AbortError') {
            logger.warn('Dashboard polling error', err);
          }
        }
      }
    },
    3000, // Poll every 3 seconds
    shouldPoll // Only poll when there are processing jobs
  );

  // Removed periodic refresh - only refresh on initial load and when processing new uploads

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'there';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircleIcon className="w-5 h-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="Retry loading dashboard data"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get recent calls with feedback
  const recentCallsWithFeedback = recentCalls.slice(0, 3).map(call => ({
    ...call,
    ...getCallFeedback(call)
  }));

  // Show skeletons during initial load
  if (isLoading && stats.total_calls === 0 && recentCalls.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          {/* Header skeleton */}
          <SkeletonCard className="h-32" />
          
          {/* Stats skeleton */}
          <SkeletonStats cards={3} />
          
          {/* Recent calls skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-optimized">
            <div className="h-6 w-32 bg-gray-200 rounded mb-4 animate-pulse" />
            <SkeletonList items={3} showIcon={true} showSecondaryText={true} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6" role="main" aria-label="CallIQ Dashboard">
        
        {/* Header with Intelligent Greeting */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3">
            {greeting.icon}
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting.text}, {firstName}! ☕
            </h1>
          </div>
          <p className="text-gray-600 mt-2">{personalizedContent.greeting}</p>
          
          {/* Personal Alerts */}
          {personalizedContent.alerts.length > 0 && personalizedContent.alerts[0] && (
            <div className={`mt-3 p-3 rounded-lg border ${
              personalizedContent.alerts[0].type === 'success' ? 'bg-green-50 border-green-200' :
              personalizedContent.alerts[0].type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <p className="text-sm font-medium text-gray-900">
                {personalizedContent.alerts[0].message}
              </p>
              {personalizedContent.alerts[0].action && (
                <p className="text-xs text-gray-600 mt-1">
                  💡 {personalizedContent.alerts[0].action}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-optimized">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Avg Score</span>
              <div className={`flex items-center text-sm font-medium ${
                weeklyProgress.score.trend === '--' ? 'text-gray-500' :
                weeklyProgress.score.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyProgress.score.trend !== '--' && (
                  weeklyProgress.score.trend.startsWith('+') ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
                <span>{weeklyProgress.score.trend}</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {weeklyProgress.score.hasData ? `${weeklyProgress.score.current}%` : '--'}
              </span>
              {weeklyProgress.score.hasData && weeklyProgress.score.trend.startsWith('+') && weeklyProgress.score.current >= 80 && <span className="text-2xl">🎉</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">{weeklyProgress.score.context}</p>
          </div>

          {/* Talk Time Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-optimized">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Talk Time</span>
              <div className={`flex items-center text-sm font-medium ${
                weeklyProgress.talkTime.trend.startsWith('-') ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyProgress.talkTime.trend.startsWith('-') ? <ArrowDownIcon className="w-4 h-4" /> : <ArrowUpIcon className="w-4 h-4" />}
                <span>{weeklyProgress.talkTime.trend}</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">{weeklyProgress.talkTime.current}%</span>
              {weeklyProgress.talkTime.current <= 45 && <span className="text-2xl">💪</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">{weeklyProgress.talkTime.context}</p>
          </div>

          {/* Questions Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 card-optimized">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Questions (Latest Call)</span>
              <div className={`flex items-center text-sm font-medium ${
                weeklyProgress.questions.trend === '--' ? 'text-gray-500' :
                weeklyProgress.questions.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {weeklyProgress.questions.trend !== '--' && (
                  weeklyProgress.questions.trend.startsWith('+') ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
                )}
                <span>{weeklyProgress.questions.trend}</span>
              </div>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-gray-900">
                {weeklyProgress.questions.hasData ? weeklyProgress.questions.current : '--'}
              </span>
              {weeklyProgress.questions.hasData && weeklyProgress.questions.current >= 8 && <span className="text-2xl">📈</span>}
            </div>
            <p className="text-xs text-gray-500 mt-1">{weeklyProgress.questions.context}</p>
          </div>
        </div>

        {/* Performance Analysis Card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
             onClick={handleViewInsights}
             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewInsights(); }}}
             tabIndex={0}
             role="button"
             aria-label="View detailed insights and analytics"
             aria-describedby="insights-description">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">View Performance Insights</h3>
                <p id="insights-description" className="text-sm text-gray-600">Deep dive into your patterns and trends</p>
              </div>
            </div>
            <div className="flex items-center text-purple-600">
              <span className="text-base font-medium mr-2">Explore</span>
              <ArrowUpIcon className="w-5 h-5 transform rotate-45" />
            </div>
          </div>
        </div>

        {/* Today's Focus */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xl">🎯</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Focus Today</h2>
              <p className="text-gray-700 mb-3">{personalizedContent.focus}</p>
              
              {/* Stats Summary */}
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_calls}</p>
                    <p className="text-xs text-gray-600">Total Calls</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.calls_today}</p>
                    <p className="text-xs text-gray-600">{stats.calls_today_is_yesterday ? 'Yesterday' : 'Today'}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">{stats.processing_count}</p>
                    <p className="text-xs text-gray-600">Processing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Calls with Intelligence */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-optimized">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📞 Recent Calls with Intelligence</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentCallsWithFeedback.map((call) => (
              <div 
                key={call.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => handleViewCall(call.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleViewCall(call.id); }}}
                tabIndex={0}
                role="button"
                aria-label={`View details for call from ${formatDate(call.created_at)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{call.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-900">{call.customer_name || 'Unknown Customer'}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(call.date).toLocaleDateString()} • {call.duration ? formatDuration(call.duration) : 'N/A'}
                      </p>
                      {call.nextAction && (
                        <p className="text-xs text-blue-600 mt-1">💡 {call.nextAction}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{call.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
            {recentCalls.length === 0 && (
              <div className="px-6 py-8 text-center text-gray-500">
                No calls yet. Upload a recording to get started!
              </div>
            )}
          </div>
          {recentCalls.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => router.push('/calliq/calls')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all calls →
              </button>
            </div>
          )}
        </div>

        {/* Personalized Quick Win */}
        {personalizedContent.quickWin && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-xl">💡</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Quick Win Today</h3>
                <p className="text-gray-700 mb-3">&quot;{personalizedContent.quickWin.tip}&quot;</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">— {personalizedContent.quickWin.source}</p>
                  <span className="text-sm text-gray-500 italic">
                    🎯 {personalizedContent.quickWin.impact}
                  </span>
                </div>
                
                {personalizedContent.quickWin.context && (
                  <div className="mt-3 p-2 bg-white rounded border border-green-100">
                    <p className="text-xs text-gray-600">{personalizedContent.quickWin.context}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
    </ProtectedRoute>
  );
}