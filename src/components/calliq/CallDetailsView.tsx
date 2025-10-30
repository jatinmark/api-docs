'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { 
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
  RefreshCwIcon,
  UserIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  MessageSquareIcon,
  TargetIcon,
  BrainIcon,
  CalendarIcon,
  PhoneIcon,
  UsersIcon,
  DollarSignIcon,
  ShieldIcon,
  ChevronRightIcon,
  SearchIcon,
  ShareIcon,
  ZapIcon,
  XCircleIcon,
  InfoIcon,
  XIcon,
  HelpCircleIcon,
  CheckSquare
} from 'lucide-react';
import { CallIQCall, CallScore as CallScoreType } from '@/types/calliq';
import { ThreeKillerInsights } from '@/components/calliq/ThreeKillerInsights';
import { useThreeKillerInsights } from '@/hooks/useThreeKillerInsights';
import { CallScore } from '@/components/calliq/CallScore';
import { ScoreBreakdown } from '@/components/calliq/ScoreBreakdown';
import { IntelligencePanel } from '@/components/calliq/IntelligencePanel';
import { KeyMomentsSummary } from '@/components/calliq/KeyMomentsSummary';


// Utility functions
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Parse timestamp from MM:SS or M:SS format to seconds
const parseTimestamp = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return 0;
  const [minutes, seconds] = parts.map(Number);
  return minutes * 60 + seconds;
};

// Helper function to highlight specific moment text within a segment
const highlightMomentText = (text: string, momentText: string | null) => {
  if (!momentText || !text) return text;
  
  // Case-insensitive search for the moment text
  const regex = new RegExp(`(${momentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  if (parts.length === 1) return text; // No match found
  
  return (
    <>
      {parts.map((part, index) => {
        // Check if this part matches the moment text (case-insensitive)
        const isMatch = part.toLowerCase() === momentText.toLowerCase();
        return (
          <span
            key={index}
            className={isMatch ? 'bg-yellow-400 px-1 py-0.5 rounded font-bold text-gray-900 shadow-md inline-block transform scale-105' : ''}
            style={isMatch ? {
              animation: 'text-highlight-pulse 1s ease-in-out infinite'
            } : {}}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

// Component for insight cards
const InsightCard = ({ title, children, icon: Icon, color = "text-gray-600" }: any) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center mb-3">
      {Icon && <Icon className={`w-5 h-5 ${color} mr-2`} />}
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

// Component to render text with highlights
const HighlightedText = ({ text, highlights }: { text: string; highlights: Array<{ phrase: string; color: string }> }) => {
  if (!highlights || highlights.length === 0) return <>{text}</>;

  // Create a map of positions to highlight
  const highlightMap = new Map<number, { end: number; color: string }>();
  
  highlights.forEach(({ phrase, color }) => {
    if (!phrase) return;
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      // Check if this position is already highlighted
      if (!highlightMap.has(match.index)) {
        highlightMap.set(match.index, { end: match.index + match[0].length, color });
      }
    }
  });

  // Sort positions
  const positions = Array.from(highlightMap.keys()).sort((a, b) => a - b);
  
  if (positions.length === 0) return <>{text}</>;

  // Build the highlighted text
  const parts = [];
  let lastEnd = 0;

  positions.forEach(start => {
    const { end, color } = highlightMap.get(start)!;
    
    // Add text before highlight
    if (start > lastEnd) {
      parts.push(<span key={`text-${lastEnd}`}>{text.substring(lastEnd, start)}</span>);
    }
    
    // Add highlighted text
    parts.push(
      <span key={`highlight-${start}`} className={`${color} px-1 rounded`}>
        {text.substring(start, end)}
      </span>
    );
    
    lastEnd = end;
  });

  // Add remaining text
  if (lastEnd < text.length) {
    parts.push(<span key={`text-${lastEnd}`}>{text.substring(lastEnd)}</span>);
  }

  return <>{parts}</>;
};

interface CallDetailsViewProps {
  call: CallIQCall;
  loading: boolean;
  isProcessing?: boolean;
  reanalyzing?: boolean;
  lastRefreshTime?: Date | null;
  shareSuccess?: boolean;
  onBack?: () => void;
  onReanalyze?: () => void;
  onShare?: () => void;
  showBackButton?: boolean;
  showActions?: boolean;
  showFooter?: boolean;
}

export function CallDetailsView({
  call,
  loading,
  isProcessing = false,
  reanalyzing = false,
  lastRefreshTime = null,
  shareSuccess = false,
  onBack,
  onReanalyze,
  onShare,
  showBackButton = false,
  showActions = false,
  showFooter = false
}: CallDetailsViewProps) {
  // Three Killer Insights hook - must always call the hook (React rules)
  // Pass empty string when not needed to satisfy TypeScript
  const threeKillerInsightsResult = useThreeKillerInsights(showActions && call ? call.id : '');
  const threeKillerInsights = showActions ? threeKillerInsightsResult.data : null;
  const insightsLoading = showActions ? threeKillerInsightsResult.isLoading : false;
  
  // Get score from call data instead of separate API call
  const callScore: CallScoreType | null = call?.call_score_details ? {
    call_id: call.id,
    overall_score: call.call_score_details.overall_score,
    grade: call.call_score_details.grade as CallScoreType['grade'],
    areas_for_improvement: (call.call_score_details.key_issues || []).map((issue: any) => 
      typeof issue === 'string' ? issue : issue.description || ''
    ),
    strengths: (call.call_score_details.strengths || []).map((strength: any) =>
      typeof strength === 'string' ? strength : ''
    ),
    scoring_breakdown: call.call_score_details.scoring_breakdown,
    calculated_at: call.updated_at || new Date().toISOString()
  } : null;
  const scoreLoading = loading;
  
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['transcript']));
  const [activeHighlights, setActiveHighlights] = useState<Set<string>>(new Set(['keywords', 'competitors', 'price']));
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);
  const [highlightedMoment, setHighlightedMoment] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isMountedRef = useRef(true);

  // Focus search input when it becomes visible
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Preload audio when recording URL is available
  useEffect(() => {
    logger.debug('Audio preload effect running:', {
      hasRecordingUrl: !!call?.recording_url,
      audioElement: audioElement,
      audioRef: audioRef.current,
      isMounted: isMountedRef.current,
      showActions: showActions
    });
    
    const preloadAudio = async () => {
      // Check if we have a recording URL and haven't created an audio element yet
      if (call?.recording_url && !audioElement && !audioRef.current && isMountedRef.current) {
        logger.debug('Conditions met, creating audio element...');
        try {
          let audioUrl = call.recording_url;
          
          // If this is authenticated mode and URL doesn't look like a signed URL, get the secure URL
          if (showActions && !call.recording_url.includes('X-Goog-Signature')) {
            logger.debug('Fetching secure audio URL for call:', { callId: call.id });
            try {
              const { calliqAPI } = await import('@/lib/calliq-api');
              const urlData = await calliqAPI.getRecordingUrl(call.id);
              logger.debug('Received secure URL:', { urlData });
              audioUrl = urlData.url;
            } catch (apiError) {
              logger.warn('Failed to get secure audio URL, using original URL', apiError as Error);
              // Fall back to original URL if secure URL fetch fails
              audioUrl = call.recording_url;
            }
          }
          
          logger.debug('Creating audio element with URL:', { audioUrl });
          const audio = new Audio(audioUrl);
          audio.preload = 'metadata'; // Preload metadata to get duration
          
          // Set up audio event listeners with mounted check
          audio.addEventListener('loadedmetadata', () => {
            logger.debug('Audio metadata loaded', { duration: audio.duration });
            if (isMountedRef.current) {
              setDuration(audio.duration);
              setAudioElement(audio);
              audioRef.current = audio;
            }
          });
          
          audio.addEventListener('timeupdate', () => {
            if (isMountedRef.current) {
              setCurrentTime(audio.currentTime);
              updateActiveSegment(audio.currentTime);
            }
          });
          
          audio.addEventListener('ended', () => {
            if (isMountedRef.current) {
              setIsPlaying(false);
              setCurrentTime(0);
              setActiveSegmentIndex(0);
            }
          });
          
          audio.addEventListener('error', (e) => {
            logger.error('Audio loading error', e);
            logger.error('Audio error details', {
              error: audio.error,
              src: audio.src,
              readyState: audio.readyState,
              networkState: audio.networkState
            });
            if (isMountedRef.current) {
              setIsPlaying(false);
            }
          });
        } catch (error) {
          logger.error('Failed to preload audio', error);
        }
      }
    };
    
    preloadAudio();
  }, [call?.recording_url, call?.id, showActions]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlayPause = async () => {
    if (!call?.recording_url) {
      logger.error('No recording URL available');
      return;
    }

    // Use either audioRef.current or audioElement
    const audio = audioRef.current || audioElement;
    
    if (!audio) {
      logger.info('Audio is still loading, please wait...');
      logger.debug('Audio state', {
        audioRef: audioRef.current,
        audioElement: audioElement,
        recordingUrl: call.recording_url
      });
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        logger.debug('Attempting to play audio', { src: audio.src });
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      logger.error('Failed to toggle audio', error, {
        audioState: {
          src: audio.src,
          readyState: audio.readyState,
          networkState: audio.networkState,
          error: audio.error
        }
      });
      setIsPlaying(false);
    }
  };

  // Helper function to check if element is visible within container
  const isElementInView = (element: Element, container: Element): boolean => {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Check if element is at least partially visible in container
    return (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    );
  };

  const updateActiveSegment = useCallback((time: number) => {
    if (!call?.transcript?.segments) return;
    
    const segments = call.transcript.segments;
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];
      
      if (segment.start !== undefined && segment.start <= time) {
        if (!nextSegment || (nextSegment.start !== undefined && nextSegment.start > time)) {
          if (activeSegmentIndex !== i) {
            setActiveSegmentIndex(i);
            
            // Auto-scroll to active segment
            if (transcriptRef.current && expandedSections.has('transcript')) {
              const segmentElement = transcriptRef.current.querySelector(`[data-segment-index="${i}"]`) as HTMLElement;
              
              if (segmentElement && !isElementInView(segmentElement, transcriptRef.current)) {
                performAutoScroll(segmentElement, i);
              }
            }
          }
          break;
        }
      }
    }
  }, [call?.transcript?.segments, activeSegmentIndex, expandedSections]);

  const performAutoScroll = (segmentElement: HTMLElement, segmentIndex: number) => {
    const container = transcriptRef.current;
    if (!container) return;

    // Get container and element bounding rectangles
    const containerRect = container.getBoundingClientRect();
    const elementRect = segmentElement.getBoundingClientRect();
    
    // Calculate the element's position relative to the container's content
    const currentScrollTop = container.scrollTop;
    const elementTopInContainer = elementRect.top - containerRect.top + currentScrollTop;
    
    // Calculate target scroll position to center the element
    const containerHeight = container.clientHeight;
    const elementHeight = segmentElement.clientHeight;
    const targetScrollTop = elementTopInContainer - (containerHeight / 2) + (elementHeight / 2);
    
    // Use smooth scroll for better user experience
    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  };

  const seekToTime = (time: number) => {
    const audio = audioRef.current || audioElement;
    if (audio) {
      audio.currentTime = time;
      setCurrentTime(time);
      updateActiveSegment(time);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current || audioElement;
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seekToTime(newTime);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Helper function to highlight text based on keywords
  const highlightText = (text: string, analysis: any) => {
    if (!text || !analysis) return { text, highlightPhrases: [] };

    // Collect all phrases to highlight
    const highlightPhrases: { phrase: string; type: string; color: string }[] = [];

    // Add competitor names
    if (activeHighlights.has('competitors') && analysis.competitor_analysis?.competitors_mentioned) {
      analysis.competitor_analysis.competitors_mentioned.forEach((comp: string) => {
        highlightPhrases.push({ 
          phrase: comp.toLowerCase(), 
          type: 'competitor',
          color: 'bg-purple-100 text-purple-900 font-medium'
        });
      });
    }

    // Add price-related keywords
    if (activeHighlights.has('price')) {
      const priceKeywords = ['price', 'cost', 'budget', 'pricing', 'dollar', '$', 'expensive', 'cheap', 'afford'];
      priceKeywords.forEach(keyword => {
        highlightPhrases.push({ 
          phrase: keyword,
          type: 'price',
          color: 'bg-green-100 text-green-900 font-medium'
        });
      });
    }

    // Add key moment quotes (partial matching)
    if (activeHighlights.has('keywords') && analysis.highlights) {
      analysis.highlights.forEach((highlight: any) => {
        if (highlight.quote && highlight.quote.length > 20) {
          // Take a meaningful portion of the quote for matching
          const quotePart = highlight.quote.substring(0, 50).toLowerCase();
          highlightPhrases.push({ 
            phrase: quotePart,
            type: 'highlight',
            color: highlight.importance === 'high' ? 
              'bg-red-100 text-red-900 font-medium' : 
              'bg-yellow-100 text-yellow-900 font-medium'
          });
        }
      });
    }

    // Add search query highlighting (highest priority)
    if (searchQuery) {
      highlightPhrases.push({ 
        phrase: searchQuery.toLowerCase(),
        type: 'search',
        color: 'bg-blue-200 text-blue-900 font-bold'
      });
    }

    // Sort by length (longest first) to handle overlapping matches
    highlightPhrases.sort((a, b) => b.phrase.length - a.phrase.length);

    return { text, highlightPhrases };
  };

  const toggleHighlightFilter = (filter: string) => {
    const newFilters = new Set(activeHighlights);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveHighlights(newFilters);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <AlertCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Call not found</p>
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Calls
          </button>
        )}
      </div>
    );
  }

  const analysis = call.analysis;
  const transcript = call.transcript;

  // Calculate additional metrics
  const questionMetrics = analysis?.question_metrics;
  const keywordDetection = analysis?.keyword_detection;
  const highlights = analysis?.highlights || [];
  const competitorAnalysis = analysis?.competitor_analysis;
  const customerProfile = analysis?.customer_profile;

  // Use either API insights or embedded insights
  const displayInsights = threeKillerInsights || (call as any)?.three_killer_insights;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Navigation */}
          <div className="flex items-center justify-between mb-4">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Calls
              </button>
            )}
            
            {showActions && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onReanalyze}
                  disabled={reanalyzing || call.status !== 'completed'}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center"
                >
                  <RefreshCwIcon className={`w-4 h-4 mr-1 ${reanalyzing ? 'animate-spin' : ''}`} />
                  Re-analyze
                </button>
                <button 
                  onClick={onShare}
                  className={`px-3 py-1.5 text-sm border rounded-lg flex items-center transition-colors ${
                    shareSuccess 
                      ? 'bg-green-50 border-green-300 text-green-700' 
                      : 'hover:bg-gray-50'
                  }`}
                  title="Copy shareable link to clipboard"
                >
                  {shareSuccess ? (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ShareIcon className="w-4 h-4 mr-1" />
                      Share
                    </>
                  )}
                </button>
                
              </div>
            )}
          </div>

          {/* Call Title and Info */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {call.title || `Call on ${formatDate(call.date)}`}
              </h1>
              
              {/* Conversation Metrics - Moved from sidebar */}
              {(analysis?.talk_ratio || questionMetrics) && (
                <div className="mt-2 mb-1">
                  <div className="flex items-center gap-6">
                    {/* Talk Ratio */}
                    {analysis?.talk_ratio && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-600">Talk Ratio:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex h-2 w-32 rounded-full overflow-hidden bg-gray-200">
                            <div 
                              className="bg-blue-500" 
                              style={{ width: `${analysis.talk_ratio.rep}%` }}
                              title={`Rep: ${analysis.talk_ratio.rep}%`}
                            />
                            <div 
                              className="bg-green-500" 
                              style={{ width: `${analysis.talk_ratio.customer}%` }}
                              title={`Customer: ${analysis.talk_ratio.customer}%`}
                            />
                          </div>
                          <span className="text-xs text-gray-600">
                            Rep: {analysis.talk_ratio.rep}% | Customer: {analysis.talk_ratio.customer}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Question Metrics */}
                    {questionMetrics && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-600">Questions:</span>
                        <span className="text-xs text-gray-600">
                          Rep: {questionMetrics.representative_questions} | Customer: {questionMetrics.customer_questions}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          questionMetrics.question_effectiveness === 'high' ? 'bg-green-100 text-green-800' :
                          questionMetrics.question_effectiveness === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {questionMetrics.question_effectiveness}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status Badges and Call Info */}
            <div className="flex flex-col items-end">
              {/* Status Badges */}
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  call.status === 'completed' ? 'bg-green-100 text-green-800' :
                  call.status === 'analyzing' ? 'bg-purple-100 text-purple-800' :
                  call.status === 'transcribing' ? 'bg-blue-100 text-blue-800' :
                  call.status === 'uploaded' ? 'bg-yellow-100 text-yellow-800' :
                  call.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {call.status}
                </span>
                
                {/* Outcome Badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  call.outcome === 'won' ? 'bg-green-100 text-green-800' :
                  call.outcome === 'lost' ? 'bg-red-100 text-red-800' :
                  call.outcome === 'follow_up' ? 'bg-yellow-100 text-yellow-800' :
                  call.outcome === 'no_decision' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {call.outcome ? call.outcome.replace('_', ' ') : 'Unknown Outcome'}
                </span>
                
                {isProcessing && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-full animate-pulse">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                    <span className="text-xs text-blue-700">Auto-refreshing...</span>
                  </div>
                )}
              </div>
              
              {/* Call Info - Date, Time, Participants */}
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {formatDate(call.date)}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {call.duration ? formatDuration(call.duration) : 'N/A'}
                </span>
                {call.rep_name && (
                  <span className="flex items-center">
                    <UserIcon className="w-4 h-4 mr-1" />
                    {call.rep_name}
                  </span>
                )}
                <span className="flex items-center">
                  <PhoneIcon className="w-4 h-4 mr-1" />
                  {call.customer_name?.trim() || 'Unknown Customer'}
                </span>
              </div>
              
              {lastRefreshTime && isProcessing && (
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Processing Status Message */}
            {isProcessing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">Processing Your Call</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      {call.status === 'uploaded' && 'Your audio file has been uploaded and is queued for processing.'}
                      {call.status === 'transcribing' && 'We\'re converting your audio to text. This usually takes a few minutes.'}
                      {call.status === 'analyzing' && 'AI is analyzing the conversation for insights and recommendations.'}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">This page will automatically update when processing completes.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Executive Brief */}
            {analysis?.executive_summary && (
              <InsightCard title="Executive Brief" icon={BrainIcon} color="text-blue-600">
                <p className="text-gray-700 leading-relaxed">{analysis.executive_summary}</p>
              </InsightCard>
            )}

            {/* Key Moments */}
            {call.key_moments && call.key_moments.timeline && call.key_moments.timeline.length > 0 && (
              <KeyMomentsSummary 
                keyMoments={call.key_moments}
                actionItems={analysis?.action_items}
                onTimestampClick={(timestamp: string, timestampSeconds: number) => {
                  // Seek to the moment in audio
                  seekToTime(timestampSeconds);
                  
                  // Find and highlight the moment text
                  const allMoments = [
                    ...(call.key_moments?.pricing?.moments || []),
                    ...(call.key_moments?.objections?.moments || []),
                    ...(call.key_moments?.competitors?.moments || []),
                    ...(call.key_moments?.pain_points?.moments || []),
                    ...(call.key_moments?.next_steps?.moments || [])
                  ];
                  
                  const matchingMoment = allMoments.find(m => 
                    m.timestamp_seconds === timestampSeconds
                  );
                  
                  if (matchingMoment) {
                    setHighlightedMoment(matchingMoment.text);
                  }
                  
                  // Scroll to transcript
                  if (transcriptRef.current) {
                    
                    const activeSegment = transcriptRef.current.querySelector(`[data-segment-index="${activeSegmentIndex}"]`);
                    if (activeSegment) {
                      activeSegment.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
              />
            )}

            {/* Highlights Timeline */}
            {highlights.length > 0 && (
              <InsightCard title="Key Moments" icon={ZapIcon} color="text-yellow-600">
                <div className="space-y-3">
                  {highlights.map((highlight: any, idx: number) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className={`mt-1 w-2 h-2 rounded-full ${
                        highlight.importance === 'high' ? 'bg-red-500' :
                        highlight.importance === 'medium' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 uppercase">
                            {highlight.type?.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {highlight.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mb-2">{highlight.description}</p>
                        {highlight.quote && (
                          <blockquote className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-2">
                            &quot;{highlight.quote}&quot;
                          </blockquote>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </InsightCard>
            )}

            {/* Smart Transcript with Integrated Audio Player */}
            {transcript && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div
                  onClick={() => toggleSection('transcript')}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <MessageSquareIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 flex-shrink-0 hidden sm:block">Transcript</h3>
                    
                    {/* Inline Audio Player with Key Moments */}
                    {call.recording_url && (
                      <div className="flex items-center gap-2 sm:gap-3 flex-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={handlePlayPause}
                          className="p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex-shrink-0 shadow-sm"
                          aria-label={isPlaying ? 'Pause' : 'Play'}
                        >
                          {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                        </button>
                        
                        <div className="flex-1 max-w-xs sm:max-w-md">
                          {/* Enhanced timeline with key moments markers */}
                          {call.key_moments?.timeline && call.key_moments.timeline.length > 0 ? (
                            <div className="relative h-10">
                              {/* Background track */}
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-gray-200 rounded-full cursor-pointer hover:bg-gray-300 transition-colors shadow-inner"
                                onClick={handleProgressClick}
                              >
                                {/* Progress bar */}
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all relative shadow-sm" 
                                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                                />
                              </div>
                              
                              {/* Key moment markers with enhanced tooltips */}
                              {call.key_moments.timeline.map((moment, idx) => {
                                const position = duration ? (parseTimestamp(moment.time) / duration) * 100 : 0;
                                const getMomentColor = (type: string) => {
                                  // Handle both singular and plural forms, and normalize the type
                                  const normalizedType = type?.toLowerCase().replace(/_/g, '');
                                  
                                  if (normalizedType?.includes('pricing') || normalizedType?.includes('price')) {
                                    return 'bg-green-500 border-green-600';
                                  } else if (normalizedType?.includes('objection')) {
                                    return 'bg-orange-500 border-orange-600';
                                  } else if (normalizedType?.includes('competitor')) {
                                    return 'bg-purple-500 border-purple-600';
                                  } else if (normalizedType?.includes('pain') || normalizedType?.includes('painpoint')) {
                                    return 'bg-red-500 border-red-600';
                                  } else if (normalizedType?.includes('next') || normalizedType?.includes('step')) {
                                    return 'bg-blue-500 border-blue-600';
                                  } else {
                                    return 'bg-gray-500 border-gray-600';
                                  }
                                };
                                const getMomentLabel = (type: string) => {
                                  // Handle both singular and plural forms, and normalize the type
                                  const normalizedType = type?.toLowerCase().replace(/_/g, '');
                                  
                                  if (normalizedType?.includes('pricing') || normalizedType?.includes('price')) {
                                    return 'Pricing Discussion';
                                  } else if (normalizedType?.includes('objection')) {
                                    return 'Objection Raised';
                                  } else if (normalizedType?.includes('competitor')) {
                                    return 'Competitor Mentioned';
                                  } else if (normalizedType?.includes('pain') || normalizedType?.includes('painpoint')) {
                                    return 'Pain Point';
                                  } else if (normalizedType?.includes('next') || normalizedType?.includes('step')) {
                                    return 'Next Steps';
                                  } else {
                                    return 'Key Moment';
                                  }
                                };
                                return (
                                  <div
                                    key={idx}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
                                    style={{ left: `${position}%` }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const timeInSeconds = parseTimestamp(moment.time);
                                      seekToTime(timeInSeconds);
                                      
                                      // Find the actual moment text from key_moments data
                                      if (call.key_moments) {
                                        // Search through all moment types to find the matching moment
                                        const allMoments = [
                                          ...(call.key_moments.pricing?.moments || []),
                                          ...(call.key_moments.objections?.moments || []),
                                          ...(call.key_moments.competitors?.moments || []),
                                          ...(call.key_moments.pain_points?.moments || []),
                                          ...(call.key_moments.next_steps?.moments || [])
                                        ];
                                        
                                        // Find moment with matching timestamp
                                        const matchingMoment = allMoments.find(m => 
                                          Math.abs(m.timestamp_seconds - timeInSeconds) < 2 // Within 2 seconds tolerance
                                        );
                                        
                                        if (matchingMoment) {
                                          // Set highlighted text - remains until next click
                                          setHighlightedMoment(matchingMoment.text);
                                        }
                                      }
                                    }}
                                  >
                                    {/* Marker dot */}
                                    <div className={`w-3 h-3 ${getMomentColor(moment.type)} rounded-full cursor-pointer transform transition-all hover:scale-150 shadow-md border-2`} />
                                    
                                    {/* Enhanced tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl">
                                        <div className="flex items-center gap-2">
                                          <span className="text-base">{moment.icon}</span>
                                          <div>
                                            <div className="font-semibold">{getMomentLabel(moment.type)}</div>
                                            <div className="text-gray-300">at {moment.time}</div>
                                          </div>
                                        </div>
                                        {/* Tooltip arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2">
                                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Current position indicator */}
                              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-3 border-blue-600 rounded-full shadow-lg pointer-events-none z-30" 
                                   style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%', transform: 'translate(-50%, -50%)' }} />
                            </div>
                          ) : (
                            /* Simple progress bar when no key moments */
                            <div 
                              className="bg-gray-300 rounded-full h-2 cursor-pointer hover:bg-gray-400 transition-colors relative group"
                              onClick={handleProgressClick}
                              aria-label="Seek audio"
                            >
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all relative" 
                                style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                              >
                                {/* Progress indicator dot */}
                                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <span className="text-xs text-gray-600 flex-shrink-0 min-w-[60px] sm:min-w-[80px] text-right tabular-nums">
                          <span className="hidden sm:inline">{formatDuration(Math.floor(currentTime))} / </span>
                          <span className="sm:hidden">{formatDuration(Math.floor(currentTime))}/</span>
                          {duration ? formatDuration(Math.floor(duration)) : formatDuration(call.duration || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <ChevronRightIcon className={`w-5 h-5 text-gray-400 transform transition-transform flex-shrink-0 ml-3 ${
                    expandedSections.has('transcript') ? 'rotate-90' : ''
                  }`} />
                </div>
                
                {expandedSections.has('transcript') && (
                  <div className="p-4 border-t">
                    {/* Search Bar and Highlight Filters */}
                    <div className="mb-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {/* Search Toggle Button */}
                        <button
                          onClick={() => {
                            setShowSearch(!showSearch);
                            if (showSearch) {
                              setSearchQuery(''); // Clear search when closing
                            }
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            showSearch 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          aria-label="Toggle search"
                        >
                          <SearchIcon className="w-4 h-4" />
                        </button>

                        {/* Collapsible Search Input */}
                        <div className={`relative transition-all duration-300 ease-in-out ${
                          showSearch ? 'flex-1 opacity-100' : 'w-0 opacity-0 overflow-hidden'
                        }`}>
                          {showSearch && (
                            <div className="relative flex items-center">
                              <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search in transcript..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-3 pr-8 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery('')}
                                  className="absolute right-2 text-gray-400 hover:text-gray-600"
                                  aria-label="Clear search"
                                >
                                  <XIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Highlight Filters */}
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600 flex items-center">
                            Highlight:
                            <div className="relative inline-block ml-1 group">
                              <InfoIcon className="w-4 h-4 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-yellow-400 rounded"></span>
                                    <span>Key Moments (medium priority)</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-red-400 rounded"></span>
                                    <span>Key Moments (high priority)</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-purple-400 rounded"></span>
                                    <span>Competitor Mentions</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-green-400 rounded"></span>
                                    <span>Price/Budget Keywords</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="inline-block w-3 h-3 bg-blue-400 rounded"></span>
                                    <span>Search Results</span>
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </span>
                          <button
                          onClick={() => toggleHighlightFilter('keywords')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            activeHighlights.has('keywords')
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Key Moments
                        </button>
                        <button
                          onClick={() => toggleHighlightFilter('competitors')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            activeHighlights.has('competitors')
                              ? 'bg-purple-100 text-purple-800 border border-purple-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Competitors
                        </button>
                        <button
                          onClick={() => toggleHighlightFilter('price')}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            activeHighlights.has('price')
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Price/Budget
                        </button>
                        </div>
                      </div>
                    </div>

                    {/* Transcript Segments */}
                    <div className="space-y-3 h-[calc(100vh-400px)] min-h-96 overflow-y-auto overflow-x-hidden" ref={transcriptRef}>
                      {(transcript.segments || []).map((segment, index) => {
                        const isRep = segment.role === 'representative' || segment.speaker_label?.includes('Rep');
                        const { highlightPhrases } = highlightText(segment.text || '', analysis);
                        const isActive = activeSegmentIndex === index;
                        
                        // Check if this segment contains the highlighted moment text
                        const isHighlightedMoment = highlightedMoment && segment.text && 
                          segment.text.toLowerCase().includes(highlightedMoment.toLowerCase());
                        
                        return (
                          <div 
                            key={index}
                            data-segment-index={index}
                            className={`flex space-x-3 p-2 rounded transition-all ${
                              isHighlightedMoment 
                                ? 'key-moment-highlight' 
                                : isActive 
                                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                                  : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isRep ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <UserIcon className={`w-4 h-4 ${isRep ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-medium">
                                  {isRep ? 'Representative' : 'Customer'}
                                </span>
                                {segment.start !== undefined && (
                                  <button
                                    onClick={() => seekToTime(segment.start)}
                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center"
                                  >
                                    <PlayIcon className="w-3 h-3 mr-1" />
                                    {formatDuration(Math.round(segment.start))}
                                  </button>
                                )}
                                {isActive && (
                                  <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                                    Playing
                                  </span>
                                )}
                              </div>
                              <div className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-800'}`}>
                                {isHighlightedMoment ? (
                                  // If this segment contains the highlighted moment, show it with specific text highlighting
                                  highlightMomentText(segment.text || '', highlightedMoment)
                                ) : (
                                  // Otherwise, show normal highlighted text (keywords, competitors, etc.)
                                  <HighlightedText text={segment.text || ''} highlights={highlightPhrases || []} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - 1/3 width */}
          {/* <div className="space-y-6 h-[calc(100vh-100px)] overflow-y-auto sticky top-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-2">

            {/* Customer Profile - Moved to top */}
            {/* {customerProfile && (
              <InsightCard title="Customer Profile" icon={UsersIcon} color="text-indigo-600">
                {customerProfile.needs?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-1">Needs</h4>
                    <ul className="text-sm space-y-1">
                      {customerProfile.needs.slice(0, 3).map((need, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          <span className="text-gray-700">{need}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {customerProfile.challenges?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-600 mb-1">Challenges</h4>
                    <ul className="text-sm space-y-1">
                      {customerProfile.challenges.slice(0, 3).map((challenge, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-red-500 mr-1">•</span>
                          <span className="text-gray-700">{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(customerProfile.timeline || customerProfile.budget_mentioned) && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {customerProfile.timeline && (
                      <div className="bg-gray-50 rounded p-2">
                        <CalendarIcon className="w-3 h-3 text-gray-500 mb-1" />
                        <div>{customerProfile.timeline}</div>
                      </div>
                    )}
                    {customerProfile.budget_mentioned && (
                      <div className="bg-gray-50 rounded p-2">
                        <DollarSignIcon className="w-3 h-3 text-gray-500 mb-1" />
                        <div>Budget discussed</div>
                      </div>
                    )}
                  </div>
                )}
              </InsightCard>
            )} */}

            {/* Three Killer Insights - Commented out as requested */}
            {/* {displayInsights && Object.keys(displayInsights).length > 0 && (
              <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="p-4 border-b border-blue-100 bg-blue-50">
                  <h2 className="font-semibold text-gray-900 flex items-center">
                    <ZapIcon className="w-5 h-5 text-blue-600 mr-2" />
                    Insights
                  </h2>
                </div>
                <div className="p-4">
                  <ThreeKillerInsights
                    insights={displayInsights}
                    isLoading={insightsLoading}
                    className=""
                  />
                </div>
              </div>
            )} */}

            {/* Intelligence Panel - Call Score Analysis */}
            {/* <IntelligencePanel score={callScore} isLoading={scoreLoading} />

            {scoreLoading && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            )} */}

            {/* Competitive Landscape */}
            {/* {competitorAnalysis && competitorAnalysis.competitors_mentioned && competitorAnalysis.competitors_mentioned.length > 0 && (
              <InsightCard title="Competitive Intel" icon={ShieldIcon} color="text-orange-600">
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-1">Competitors Mentioned</h4>
                    <div className="flex flex-wrap gap-1">
                      {competitorAnalysis.competitors_mentioned.map((comp, i) => (
                        <span key={i} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {competitorAnalysis.our_advantages?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-1">Our Advantages</h4>
                      <ul className="text-xs space-y-1">
                        {competitorAnalysis.our_advantages.slice(0, 2).map((adv, i) => (
                          <li key={i} className="flex items-start">
                            <TrendingUpIcon className="w-3 h-3 text-green-500 mr-1 mt-0.5" />
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </InsightCard>
            )} */}

            {/* Action Items */}
            {/* {analysis?.action_items && analysis.action_items.length > 0 && (
              <InsightCard title="Action Items" icon={CheckSquare} color="text-green-600">
                <div className="space-y-3">
                  {analysis.action_items.map((item: any, i: number) => (
                    <div key={i} className="border-l-4 border-green-500 pl-3 py-2 bg-green-50">
                      <div className="flex items-start justify-between mb-1">
                        <div className="font-medium text-gray-800 text-sm flex-1">{item.task}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                          item.priority === 'high' ? 'bg-red-100 text-red-700' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {item.priority || 'low'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600 mb-1">
                        {(item.deadline || item.due_date_suggestion) && (
                          <div className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            <span className="font-medium">
                              {item.deadline ? item.deadline.replace(/_/g, ' ') :
                               item.due_date_suggestion === 'immediate' ? 'within 24 hours' :
                               item.due_date_suggestion === 'this_week' ? 'within this week' :
                               'follow up required'}
                            </span>
                          </div>
                        )}

                        {item.owner && (
                          <div className="flex items-center">
                            <UserIcon className="w-3 h-3 mr-1" />
                            <span>
                              {item.owner === 'representative' || item.owner === 'rep' ? 'Rep' :
                               item.owner === 'customer' ? 'Customer' :
                               item.owner === 'team' ? 'Team' : item.owner}
                            </span>
                          </div>
                        )}
                      </div>

                      {item.context_quote && (
                        <div className="text-xs text-gray-600 italic bg-white bg-opacity-70 p-2 rounded mt-2">
                          &quot;{item.context_quote}&quot;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </InsightCard>
            )} */}

            {/* Discovery Questions */}
            {/* {analysis?.questions_asked && analysis.questions_asked.by_rep?.length > 0 && (
              <InsightCard title="Discovery Questions" icon={HelpCircleIcon} color="text-indigo-600">
                <div className="space-y-3">
                  {/* Customer Questions - Commented out as per requirement */}
                  {/* {analysis.questions_asked.by_customer && analysis.questions_asked.by_customer.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                        Customer Questions ({analysis.questions_asked.by_customer.length})
                      </h4>
                      <div className="space-y-1">
                        {analysis.questions_asked.by_customer.slice(0, 3).map((question, i) => (
                          <div key={i} className="text-xs text-gray-700 bg-green-50 rounded p-1.5">
                            &quot;{question}&quot;
                          </div>
                        ))}
                        {analysis.questions_asked.by_customer.length > 3 && (
                          <div className="text-xs text-gray-500 italic">
                            +{analysis.questions_asked.by_customer.length - 3} more questions
                          </div>
                        )}
                      </div>
                    </div>
                  )} */}

                  {/* Rep Questions - Show all questions */}
                  {/* {analysis.questions_asked.by_rep && analysis.questions_asked.by_rep.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-600 mb-1 flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                        Rep Questions ({analysis.questions_asked.by_rep.length})
                      </h4>
                      <div className="space-y-1">
                        {analysis.questions_asked.by_rep.map((question, i) => (
                          <div key={i} className="text-xs text-gray-700 bg-blue-50 rounded p-1.5">
                            &quot;{question}&quot;
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InsightCard>
            )}
          </div> */}
        </div>

        {/* Bottom Section - Full Width */}
        <div className="mt-8 space-y-6">
          
          {/* Keyword Hotspots */}
          {keywordDetection && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <SearchIcon className="w-5 h-5 text-gray-600 mr-2" />
                Keyword Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price Mentions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Price Discussion</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      keywordDetection.price_mentions?.discussed ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {keywordDetection.price_mentions?.count || 0} mentions
                    </span>
                  </div>
                  {keywordDetection.price_mentions?.contexts?.slice(0, 2).map((ctx: any, i: number) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <p className="text-sm text-gray-600 italic">&quot;{ctx.quote}&quot;</p>
                      <p className="text-xs text-gray-500 mt-1">— {ctx.speaker}</p>
                    </div>
                  ))}
                </div>

                {/* Competition Mentions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Competition</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      keywordDetection.competition_mentions?.count ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {keywordDetection.competition_mentions?.count || 0} mentions
                    </span>
                  </div>
                  {keywordDetection.competition_mentions?.contexts?.slice(0, 2).map((ctx: any, i: number) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <p className="text-sm font-medium text-gray-700">{ctx.competitor}</p>
                      <p className="text-sm text-gray-600 italic">&quot;{ctx.quote}&quot;</p>
                    </div>
                  ))}
                </div>

                {/* Next Steps */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-700">Next Steps</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      keywordDetection.next_steps_mentions?.clear_next_steps ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {keywordDetection.next_steps_mentions?.clear_next_steps ? 'Clear' : 'Unclear'}
                    </span>
                  </div>
                  {keywordDetection.next_steps_mentions?.action_items?.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="mb-2 pb-2 border-b last:border-0">
                      <p className="text-sm text-gray-700">{item.action}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.owner} • {item.timeline}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Footer with CTA */}
      {showFooter && (
        <div className="bg-gray-100 border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">This call analysis was generated using AI-powered insights</p>
              <p className="mt-2 text-sm text-gray-600">
                Powered by <span className="font-semibold">ConversAI Labs</span>
              </p>
              
              {/* Call to Action Button */}
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                >
                  <BrainIcon className="w-5 h-5 mr-2" />
                  Analyze Your Own Calls
                </button>
                <p className="mt-3 text-xs text-gray-500">
                  Get AI-powered insights for your sales calls • No credit card required
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}