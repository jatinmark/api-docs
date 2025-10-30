// CalliQ Types

// Key Moments Types
export interface KeyMoment {
  timestamp: string;
  timestamp_seconds: number;
  text: string;
  context: string;
  speaker: 'representative' | 'customer';
  addressed?: boolean;
  resolution?: string;
  response?: string; // NEW: Sales rep's response to objections, competitors, or pain points
  competitor?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  specificity?: 'high' | 'medium' | 'low';
  deadline?: string;
  business_impact?: string; // NEW: For pain points
}

export interface KeyMomentSection {
  found: boolean;
  count: number;
  moments: KeyMoment[];
  icon: string;
  label: string;
  addressed_count?: number;
  unaddressed_count?: number;
  competitor_names?: string[];
  clearly_defined?: boolean;
}

export interface TimelineMoment {
  time: string;
  type: 'pricing' | 'objection' | 'competitor' | 'pain_point' | 'next_steps';
  icon: string;
}

export interface KeyMoments {
  pricing?: KeyMomentSection;
  objections?: KeyMomentSection;
  competitors?: KeyMomentSection;
  pain_points?: KeyMomentSection;
  next_steps?: KeyMomentSection;
  timeline?: TimelineMoment[];
}

// Three Killer Insights Types
export interface ThreeKillerInsights {
  deal_killer?: {
    type: string;
    title: string;
    impact: number;
    impact_unit: string;
    fix: string;
    current_metric?: string;
    icon: string;
  };
  superpower?: {
    type: string;
    title: string;
    percentile: number;
    description: string;
    keep_doing: string;
    icon: string;
  };
  improvement_area?: {
    type: string;
    title: string;
    current_metric: string;
    benchmark_metric: number;
    comparison: string;
    actions: string[];
    icon: string;
  };
  generated_at?: string;
}

export interface PerformanceMetrics {
  talk_ratio: number;
  budget_discussed: boolean;
  questions_per_10min: number;
  rapport_score: number;
  pace_score?: number;
  clarity_score?: number;
  objection_handling?: number;
}

export interface CallIQCall {
  id: string;
  user_id: string;
  company_id: string;
  title?: string;
  date: string;
  duration?: number; // in seconds
  recording_url?: string;
  original_filename?: string;
  file_size?: number; // in bytes
  status: 'uploaded' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  outcome?: 'won' | 'lost' | 'follow_up' | 'no_decision';
  error_message?: string;
  created_at: string;
  updated_at?: string;
  has_transcript: boolean;
  has_analysis: boolean;
  insights_count: number;
  
  // Expanded fields for detail view
  transcript?: CallIQTranscript;
  analysis?: CallIQAnalysis;
  insights?: CallIQInsight[];
  three_killer_insights?: ThreeKillerInsights;
  performance_metrics?: PerformanceMetrics;
  key_moments?: KeyMoments;
  
  // Call scoring fields
  call_score?: number; // Overall score out of 100
  call_score_details?: {
    overall_score: number;
    grade: string;
    scoring_breakdown: any;
    strengths: string[];
    key_issues: Array<string | {
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      impact?: string;
    }>;
    calculated_at: string;
  };
  
  // Frontend computed fields
  rep_name?: string;
  customer_name?: string;
  talk_ratio?: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
  win_probability?: number;
  company_info?: string; // Company website URL for AI coaching context
}

export interface CallIQTranscript {
  full_text: string;
  segments: TranscriptSegment[];
  speakers: number[];
  speaker_count: number;
  duration: number;
  confidence: number;
  words_count: number;
  language: string;
  model_used: string;
  processing_time: number;
  paragraphs?: Paragraph[];
}

export interface TranscriptSegment {
  speaker: number;
  speaker_label: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words?: Word[];
  role?: 'representative' | 'customer' | 'unknown';  // Added for speaker identification
  original_speaker?: string;  // Original speaker label before mapping
}

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Paragraph {
  sentences: Sentence[];
  start: number;
  end: number;
  num_words: number;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface CallIQAnalysis {
  executive_summary: string;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    confidence: number;
    reasoning: string;
  };
  talk_ratio: {
    customer: number;
    rep: number;
    silence?: number;
  };
  win_probability: {
    score: number;
    reasoning: string;
    positive_signals: string[];
    negative_signals: string[];
  };
  outcome: {
    status: 'won' | 'lost' | 'follow_up' | 'no_decision';
    confidence: number;
    next_meeting_scheduled?: boolean;
  };
  question_metrics?: {
    total_questions: number;
    customer_questions: number;
    representative_questions: number;
    question_effectiveness: 'high' | 'medium' | 'low';
    key_questions: {
      speaker: 'customer' | 'representative';
      question: string;
      context: string;
    }[];
  };
  highlights?: {
    type: 'key_moment' | 'decision_point' | 'turning_point' | 'breakthrough' | 'objection_handled';
    description: string;
    quote: string;
    importance: 'high' | 'medium' | 'low';
    timestamp?: string;
    speaker_role?: 'representative' | 'customer';
  }[];
  keyword_detection?: {
    price_mentions: {
      count: number;
      discussed: boolean;
      contexts: {
        quote: string;
        speaker: 'customer' | 'representative';
        sentiment: 'positive' | 'neutral' | 'negative';
      }[];
    };
    competition_mentions: {
      count: number;
      competitors_named: string[];
      contexts: {
        competitor: string;
        quote: string;
        our_position: string;
      }[];
    };
    next_steps_mentions: {
      count: number;
      clear_next_steps: boolean;
      action_items: {
        action: string;
        owner: string;
        timeline: string;
      }[];
    };
  };
  key_insights: {
    type: 'pain_point' | 'opportunity' | 'objection' | 'competitor_mention' | 'decision_criteria';
    content: string;
    priority: 'high' | 'medium' | 'low';
    quote?: string;
    timestamp?: string;
  }[];
  action_items?: {
    task: string;
    owner: 'rep' | 'customer' | 'team' | 'representative';
    priority?: 'high' | 'medium' | 'low';
    due_date_suggestion?: 'immediate' | 'this_week' | 'follow_up';
  }[];
  opportunities?: {
    type: 'upsell' | 'cross_sell' | 'referral' | 'expansion';
    description: string;
    estimated_value: 'high' | 'medium' | 'low';
    reasoning: string;
  }[];
  customer_profile: {
    needs: string[];
    challenges: string[];
    decision_process: string;
    budget_mentioned: boolean;
    timeline?: string;
    stakeholders: string[];
  };
  competitor_analysis?: {
    competitors_mentioned: string[];
    our_advantages: string[];
    our_disadvantages: string[];
    switching_barriers: string[];
  };
  // coaching_recommendations removed - not needed
  topics_discussed: string[];
  questions_asked: {
    by_customer: string[];
    by_rep: string[];
  };
  next_steps: string;
  model_used?: string;
  word_count?: number;
  analysis_version?: string;
}

export interface ActionItem {
  id: string;
  description: string;
  owner?: string;
  due_date?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface Objection {
  id: string;
  objection: string;
  response: string;
  resolved: boolean;
  timestamp?: number;
}

export interface CompetitorMention {
  competitor: string;
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  timestamp?: number;
}

export interface PricingDiscussion {
  budget_mentioned?: number;
  discount_requested?: boolean;
  price_objection?: boolean;
  final_price?: number;
}

export interface CallIQInsight {
  id: string;
  call_id: string;
  type: 'objection' | 'topic' | 'action_item' | 'competitor' | 'risk' | 'opportunity' | 'question' | 'commitment' | 'pain_point' | 'competitor_mention' | 'summary';
  content: string;
  timestamp?: number; // seconds into the call
  speaker?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  priority?: 'high' | 'medium' | 'low';
  resolved?: boolean;
  insight_metadata?: Record<string, any>;
  created_at: string;
}

// Dashboard Stats
export interface CallIQStats {
  total_calls: number;
  avg_win_rate: number;
  calls_today: number;
  calls_today_is_yesterday?: boolean; // Indicates if calls_today shows yesterday's data
  processing_count: number;
  total_duration: number; // in seconds
  team_performance_score: number;
  
  // Trends
  calls_trend: TrendData[];
  win_rate_trend: TrendData[];
  sentiment_trend: TrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

// Rep Performance
export interface RepPerformance {
  id: string;
  name: string;
  avatar?: string;
  calls_analyzed: number;
  win_rate: number;
  avg_talk_ratio: number;
  top_strength: string;
  performance_score: number;
  rank?: number;
  trend: 'up' | 'down' | 'stable';
}

// Filters
export interface CallIQFilters {
  date_range?: {
    start: string;
    end: string;
  };
  status?: CallIQCall['status'][];
  reps?: string[];
  outcomes?: CallIQCall['outcome'][];
  search?: string;
  sort_by?: 'date' | 'duration' | 'win_probability' | 'sentiment';
  sort_order?: 'asc' | 'desc';
}

// Upload
export interface UploadRequest {
  file?: File;
  title?: string;
  metadata?: {
    rep_name?: string;
    customer_name?: string;
    date?: string;
    notes?: string;
    call_success?: 'success' | 'failed'; // Added for call outcome tracking
    company_info?: string; // Company website URL for AI coaching context
  };
}

export interface BulkUploadRequest {
  csv_file: File;
}

// Enhanced CSV Upload Response
export interface CSVUploadResponse {
  status: string;
  message: string;
  job_id: string;
  batch_id: string;
  total_rows: number;
  valid_calls: number;
  created_calls: number;
  errors_count: number;
  call_ids: string[];
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Individual Call Status for Bulk Monitoring
export interface BulkCallStatus {
  call_id: string;
  audio_url: string;
  title?: string;
  status: 'pending' | 'downloading' | 'uploading' | 'transcribing' | 'completed' | 'download_failed' | 'upload_failed' | 'failed';
  current_step: 'downloading' | 'uploading' | 'transcribing' | 'completed';
  step_progress: number; // 0-100 for current step
  overall_progress: number; // 0-100 overall
  retry_count: number;
  max_retries: number;
  error_message?: string;
  error_type?: 'network_error' | 'invalid_url' | 'file_too_large' | 'unsupported_format' | 'timeout_error';
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
}

// Bulk Status Response
export interface BulkStatusResponse {
  job_id: string;
  batch_id: string;
  total_calls: number;
  completed_calls: number;
  failed_calls: number;
  processing_calls: number;
  calls: BulkCallStatus[];
  last_updated: string;
}

export interface UploadProgress {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message?: string;
  error?: string;
  result?: CallIQCall;
}

// API Responses
export interface CallIQListResponse {
  calls: CallIQCall[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export interface CallIQInsightsResponse {
  insights: CallIQInsight[];
  grouped_by_type: Record<CallIQInsight['type'], CallIQInsight[]>;
  total: number;
}

// Similar Calls
export interface SimilarCall {
  call: CallIQCall;
  similarity_score: number;
  matching_patterns: string[];
}

// Patterns
export interface CallPattern {
  id: string;
  name: string;
  description: string;
  frequency: number; // across all calls
  success_rate: number;
  examples: PatternExample[];
  icon?: string;
}

export interface PatternExample {
  call_id: string;
  timestamp: number;
  text: string;
  outcome: 'positive' | 'negative';
}

// Call Scoring Types
export interface CallScore {
  call_id: string;
  overall_score: number;
  scoring_breakdown: ScoreBreakdown;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';
  strengths: string[];
  areas_for_improvement: string[];
  calculated_at: string;
}

export interface ScoreBreakdown {
  talk_ratio: ScoreComponent;
  budget_qualification: ScoreComponent;
  discovery_quality: ScoreComponent;
  objection_handling: ScoreComponent;
  next_steps: ScoreComponent;
  rapport_building: ScoreComponent;
}

export interface ScoreComponent {
  score: number;
  weight: number;
  weighted_contribution: number;
  details: {
    strengths: string[];
    weaknesses: string[];
    key_metrics: Record<string, number | string>;
  };
}

export interface RepScoreComparison {
  rep_id: string;
  rep_name: string;
  calls_analyzed: number;
  average_score: number;
  score_trend: 'improving' | 'declining' | 'stable';
  top_strength_area: 'talk_ratio' | 'budget_qualification' | 'discovery_quality' | 'objection_handling' | 'next_steps' | 'rapport_building';
  improvement_area: 'talk_ratio' | 'budget_qualification' | 'discovery_quality' | 'objection_handling' | 'next_steps' | 'rapport_building';
  percentile_rank: number;
}

export interface TeamScoreAnalytics {
  team_average_score: number;
  score_distribution: {
    grade: CallScore['grade'];
    count: number;
    percentage: number;
  }[];
  top_performers: RepScoreComparison[];
  improvement_opportunities: {
    component: 'talk_ratio' | 'budget_qualification' | 'discovery_quality' | 'objection_handling' | 'next_steps' | 'rapport_building';
    average_score: number;
    opportunity_impact: number;
    recommended_actions: string[];
  }[];
  trends: {
    period: string;
    average_score: number;
    calls_analyzed: number;
  }[];
}