// Simplified demo data for CalliQ public demo

export interface DemoRep {
  id: string;
  name: string;
  avatar: string;
  winRate: number;
  calls: number;
  revenue: number;
  trend: 'up' | 'down';
}

// New interfaces for enhanced features
export interface CallMoment {
  timestamp: string;
  time: number; // in seconds
  type: 'greeting' | 'discovery' | 'pricing' | 'objection' | 'commitment' | 'next-steps' | 'pain-point' | 'value-prop';
  icon: string;
  label: string;
  description: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface ActionableInsight {
  type: 'critical-miss' | 'what-worked' | 'objection-not-handled' | 'opportunity';
  title: string;
  impact: string;
  description: string;
  suggestion: string;
  example?: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ScoreFactor {
  label: string;
  impact: number;
  positive: boolean;
  explanation: string;
}

export interface PredictiveScore {
  total: number;
  factors: ScoreFactor[];
  improvements: string[];
  benchmark: number;
}

export interface CoachingMoment {
  timestamp: string;
  context: string;
  customerSaid: string;
  youSaid: string;
  betterResponse: string;
  why: string;
  successRate: number;
}

export interface RepComparison {
  metric: string;
  yourValue: string | number;
  teamAverage: string | number;
  topPerformer: string | number;
  unit?: string;
  improvement?: string;
}

export interface PatternDetection {
  pattern: string;
  frequency: number;
  totalCalls: number;
  yourCloseRate: number;
  topPerformerRate: number;
  topPerformerName: string;
  suggestion: string;
}

// New interfaces for enhanced modal data
export interface QuestionAsked {
  question: string;
  timestamp: string;
}

export interface KeyMomentDetailed {
  title: string;
  timestamp: string;
  description: string;
  type: string;
}

export interface PositiveMoment {
  signal: string;
  description: string;
  timestamp: string;
  impact: string;
}

// Transcript interfaces for call detail pages
export interface TranscriptLine {
  timestamp: string;
  speaker: 'rep' | 'customer';
  text: string;
  momentType?: 'greeting' | 'discovery' | 'pricing' | 'objection' | 'commitment' | 'pain-point' | 'value-prop' | 'next-steps';
}

// Call analysis interface
export interface CallAnalysisResult {
  winProbability: number;
  strengths: string[];
  improvements: string[];
  keyMoments: { time: string; event: string; type: string; }[];
  timeline: CallMoment[];
  actionableInsights: ActionableInsight[];
  predictiveScore: PredictiveScore;
  coachingMoments: CoachingMoment[];
  repComparison: RepComparison[];
  questionsAsked?: QuestionAsked[];
  keyMomentsDetailed?: KeyMomentDetailed[];
  positiveMoments?: PositiveMoment[];
}

// Rep performance interfaces
export interface RecentCall {
  id: number;
  customer: string;
  date: string;
  duration: string;
  score: number;
  outcome: 'won' | 'lost' | 'pending';
  type: string;
}

export interface RepMetrics {
  avgCallDuration: string;
  talkTime: number;
  questionsPerCall: number;
  objectionHandlingRate: number;
  followUpRate: number;
  avgDealSize: number;
  callsPerDay: number;
}

export interface RepPerformanceDetail {
  rep: DemoRep;
  recentCalls: RecentCall[];
  metrics: RepMetrics;
  strengths: string[];
  improvements: string[];
  coachingTips: string[];
  patterns: PatternDetection[];
}

// Simplified team metrics
export const teamMetrics = {
  totalCalls: 1247,
  avgWinRate: 63,
  previousWinRate: 47,
  topPerformer: 'Raj Sharma',
  revenue: 4500000, // ₹45L
  previousRevenue: 3200000, // ₹32L
};

// Just 3 reps for simplicity
export const demoReps: DemoRep[] = [
  {
    id: 'rep-1',
    name: 'Raj Sharma',
    avatar: 'RS',
    winRate: 78,
    calls: 312,
    revenue: 2100000,
    trend: 'up'
  },
  {
    id: 'rep-2',
    name: 'Priya Patel',
    avatar: 'PP',
    winRate: 71,
    calls: 289,
    revenue: 1800000,
    trend: 'up'
  },
  {
    id: 'rep-3',
    name: 'Amit Kumar',
    avatar: 'AK',
    winRate: 45,
    calls: 256,
    revenue: 980000,
    trend: 'down'
  }
];

// Key insights to show value
export const keyInsights = [
  {
    title: 'Discovery Questions',
    insight: 'Top performers ask 3x more discovery questions',
    impact: '+27% higher win rate',
    icon: '💡'
  },
  {
    title: 'Next Steps',
    insight: '91% of won deals have clear next steps',
    impact: '2x faster close time',
    icon: '🎯'
  },
  {
    title: 'Talk Time',
    insight: 'Best reps talk only 40-45% of the time',
    impact: '+35% better engagement',
    icon: '⏱️'
  }
];

// Sample analysis results for different call types
export const analysisResultsByCallType: { [key: number]: CallAnalysisResult } = {
  // Enterprise Software Demo call
  1: {
    winProbability: 85,
    strengths: [
      'Excellent product demonstration flow',
      'Addressed all technical requirements',
      'Strong ROI calculation presented',
      'Got buy-in from technical stakeholder'
    ],
    improvements: [
      'Involve decision maker earlier',
      'Clarify implementation timeline',
      'Discuss support SLA options'
    ],
    keyMoments: [
      { time: '13:30', event: 'Customer excited about integration capabilities', type: 'opportunity' },
      { time: '15:30', event: 'Technical team expressed concerns about migration', type: 'objection' },
      { time: '22:45', event: 'CFO joined and asked about pricing', type: 'opportunity' },
      { time: '28:10', event: 'Scheduled proof of concept for next week', type: 'commitment' }
    ],
    // New enhanced data
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Initial welcome and introductions', sentiment: 'positive' },
      { timestamp: '2:30', time: 150, type: 'discovery', icon: '🔍', label: 'Discovery', description: 'Exploring customer needs', sentiment: 'positive' },
      { timestamp: '8:15', time: 495, type: 'pain-point', icon: '🎯', label: 'Pain Point', description: 'Identified integration challenges', sentiment: 'negative' },
      { timestamp: '12:00', time: 720, type: 'value-prop', icon: '💡', label: 'Solution', description: 'Demonstrated integration capabilities', sentiment: 'positive' },
      { timestamp: '15:30', time: 930, type: 'objection', icon: '🚫', label: 'Objection', description: 'Migration concerns raised', sentiment: 'negative' },
      { timestamp: '22:45', time: 1365, type: 'pricing', icon: '💰', label: 'Pricing', description: 'CFO asked about costs', sentiment: 'neutral' },
      { timestamp: '28:10', time: 1690, type: 'commitment', icon: '✅', label: 'Commitment', description: 'POC scheduled', sentiment: 'positive' },
      { timestamp: '31:45', time: 1905, type: 'next-steps', icon: '📧', label: 'Next Steps', description: 'Follow-up actions defined', sentiment: 'positive' }
    ],
    actionableInsights: [
      {
        type: 'critical-miss',
        title: 'Decision Maker Joined Late',
        impact: '-15% win probability',
        description: 'CFO joined at minute 22, missing key value propositions',
        suggestion: 'Always confirm all stakeholders at call start. Top reps ask: "Who else should be on this call to make a decision?"',
        severity: 'high'
      },
      {
        type: 'what-worked',
        title: 'Technical Deep Dive Resonated',
        impact: '+25% engagement',
        description: 'Customer became highly engaged during integration demo at 12:00',
        suggestion: 'Lead with technical capabilities earlier in future demos',
        example: 'Start with: "Let me show you how we solve your integration challenges"',
        severity: 'low'
      },
      {
        type: 'objection-not-handled',
        title: 'Migration Concerns Partially Addressed',
        impact: '-20% confidence',
        description: 'Technical team still uncertain about data migration process',
        suggestion: 'Prepare migration timeline and success stories. Say: "We\'ve migrated 50+ similar companies in under 2 weeks"',
        severity: 'medium'
      }
    ],
    predictiveScore: {
      total: 85,
      factors: [
        { label: 'Strong technical engagement', impact: 25, positive: true, explanation: 'Deep technical discussion shows genuine interest' },
        { label: 'POC scheduled', impact: 30, positive: true, explanation: 'Concrete next step significantly increases close probability' },
        { label: 'CFO involved', impact: 20, positive: true, explanation: 'Budget authority present in conversation' },
        { label: 'Late decision maker entry', impact: -15, positive: false, explanation: 'Key stakeholder missed critical value props' },
        { label: 'Migration concerns remain', impact: -10, positive: false, explanation: 'Unresolved objection could delay decision' },
        { label: 'Clear use case identified', impact: 20, positive: true, explanation: 'Specific integration needs match your solution' },
        { label: 'Competitor mentioned', impact: -5, positive: false, explanation: 'Evaluating alternatives reduces exclusivity' }
      ],
      improvements: [
        'Get commitment on decision timeline',
        'Share 3 migration case studies before POC',
        'Involve implementation team in next call'
      ],
      benchmark: 72
    },
    coachingMoments: [
      {
        timestamp: '15:30',
        context: 'When technical team raised migration concerns',
        customerSaid: 'We\'re worried about downtime during migration',
        youSaid: 'We have tools to help with that',
        betterResponse: 'I understand that concern. Let me share how TechCorp migrated 2TB with zero downtime using our parallel sync approach. Would you like to see the migration playbook?',
        why: 'Specific examples and offering resources builds confidence',
        successRate: 78
      },
      {
        timestamp: '22:45',
        context: 'When CFO asked about pricing',
        customerSaid: 'What\'s this going to cost us?',
        youSaid: 'Our enterprise plan starts at ₹50L annually',
        betterResponse: 'Before discussing price, let me understand your current spend on integration tools and manual processes. Most clients see 3x ROI within 6 months. What are you spending today?',
        why: 'Establishing current costs makes your price relative, not absolute',
        successRate: 84
      }
    ],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 5, teamAverage: 7, topPerformer: 12, improvement: 'Ask 7 more questions in first 10 minutes' },
      { metric: 'Talk Time', yourValue: '52%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Pause more for customer input' },
      { metric: 'Time to Value Prop', yourValue: '12:00', teamAverage: '8:30', topPerformer: '5:45', improvement: 'Share value earlier in conversation' },
      { metric: 'Objection Response Time', yourValue: '45 sec', teamAverage: '20 sec', topPerformer: '10 sec', improvement: 'Address concerns immediately' }
    ],
    questionsAsked: [
      { question: "What's your current setup for handling customer data integration?", timestamp: "2:30" },
      { question: "How much time does your team spend on manual data entry weekly?", timestamp: "6:00" },
      { question: "Who else would be involved in evaluating integration solutions?", timestamp: "9:00" },
      { question: "What's been your biggest challenge with your current system?", timestamp: "8:15" },
      { question: "How quickly do you need this implemented?", timestamp: "24:00" }
    ],
    keyMomentsDetailed: [
      { 
        title: "Customer got visibly excited", 
        timestamp: "13:30", 
        description: "Leaned forward and said 'that's exactly what we need' during integration demo",
        type: "positive"
      },
      { 
        title: "Technical objection raised", 
        timestamp: "15:30", 
        description: "IT team worried about migration downtime and data security protocols",
        type: "concern"
      },
      { 
        title: "Budget authority joined call", 
        timestamp: "22:45", 
        description: "CFO hopped on mid-call and immediately asked about total cost of ownership",
        type: "opportunity"
      },
      { 
        title: "Concrete next step scheduled", 
        timestamp: "28:10", 
        description: "All parties agreed to proof of concept demo next Tuesday at 2 PM",
        type: "commitment"
      }
    ],
    positiveMoments: [
      { 
        signal: "Great rapport established", 
        description: "Customer laughed at joke about spreadsheet nightmares", 
        timestamp: "2:30",
        impact: "high"
      },
      { 
        signal: "Active note-taking", 
        description: "Customer took detailed notes during feature walkthrough", 
        timestamp: "13:30",
        impact: "medium"
      },
      { 
        signal: "Forward-looking language", 
        description: "Customer said 'when we implement this' instead of 'if we choose this'", 
        timestamp: "20:00",
        impact: "high"
      },
      { 
        signal: "Invited decision maker", 
        description: "Customer brought CFO into the call without prompting", 
        timestamp: "22:45",
        impact: "very-high"
      },
      { 
        signal: "Timeline urgency", 
        description: "Customer mentioned wanting to have this ready before Q4", 
        timestamp: "26:00",
        impact: "high"
      }
    ]
  },
  
  // Pricing Negotiation call (by Amit Kumar)
  2: {
    winProbability: 18,  // Realistic for 78% talk time + early pricing
    strengths: [
      'At least answered the phone',
      'Remembered customer name from last call'
    ],
    improvements: [
      'Stop talking so much - customer talked 78% less than they should',
      'Ask discovery questions before jumping to price',
      'Build value before discussing cost',
      'Let customer share their actual needs first',
      'Practice active listening - you interrupted 12 times'
    ],
    keyMoments: [
      { time: '0:22', event: 'Rep jumped straight to pricing without discovery', type: 'objection' },
      { time: '2:30', event: 'Customer became defensive about budget', type: 'objection' },
      { time: '8:15', event: 'Customer mentioned competitor to end conversation', type: 'objection' },
      { time: '18:20', event: 'Rep gave desperate discount to keep deal alive', type: 'objection' },
      { time: '25:00', event: 'Customer politely tried to end call', type: 'objection' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Rushed greeting', sentiment: 'neutral' },
      { timestamp: '0:22', time: 22, type: 'pricing', icon: '💰', label: 'Pricing Bomb', description: 'Dropped price immediately', sentiment: 'negative' },
      { timestamp: '2:30', time: 150, type: 'objection', icon: '🚫', label: 'Sticker Shock', description: 'Customer recoiled at price', sentiment: 'negative' },
      { timestamp: '8:15', time: 495, type: 'objection', icon: '⚔️', label: 'Competitor Escape', description: 'Customer deflected with competition', sentiment: 'negative' },
      { timestamp: '12:00', time: 720, type: 'value-prop', icon: '😴', label: 'Monologue', description: 'Rep talked for 6 straight minutes', sentiment: 'negative' },
      { timestamp: '18:20', time: 1100, type: 'pricing', icon: '💸', label: 'Desperate Discount', description: 'Panic discount to salvage deal', sentiment: 'negative' },
      { timestamp: '25:00', time: 1500, type: 'objection', icon: '🚪', label: 'Exit Attempt', description: 'Customer trying to escape', sentiment: 'negative' },
      { timestamp: '28:00', time: 1680, type: 'next-steps', icon: '❌', label: 'Fake Follow-up', description: 'Polite brushoff', sentiment: 'negative' }
    ],
    actionableInsights: [
      {
        type: 'critical-miss',
        title: 'Budget Never Discussed',
        impact: '-40% win probability',
        description: 'You never asked about their budget or current spend',
        suggestion: 'Top reps ask about budget in first 3 minutes: "What\'s your budget for logistics solutions?"',
        severity: 'high'
      },
      {
        type: 'what-worked',
        title: 'Power-Only Capability Mention',
        impact: '+15% engagement',
        description: 'Customer perked up when you mentioned "power-only" at 12:00',
        suggestion: 'Lead with this differentiator earlier in pricing conversations',
        example: 'Open with: "Before we discuss price, you mentioned power-only was critical..."',
        severity: 'low'
      },
      {
        type: 'objection-not-handled',
        title: '"Just Looking" Not Countered',
        impact: '-25% close rate',
        description: 'Customer said "just looking" 3 times, no effective response',
        suggestion: 'Counter with: "I understand. What would need to happen for you to move forward?"',
        severity: 'high'
      }
    ],
    predictiveScore: {
      total: 18,
      factors: [
        { label: 'Customer engaged', impact: 10, positive: true, explanation: 'Active participation in discussion' },
        { label: 'No budget discussion', impact: -30, positive: false, explanation: 'Critical qualifier missing' },
        { label: 'Weak commitment', impact: -15, positive: false, explanation: 'No clear next steps defined' },
        { label: 'No pain identified', impact: -20, positive: false, explanation: 'Solution not tied to specific problems' },
        { label: 'Price-focused too early', impact: -15, positive: false, explanation: 'Value not established before pricing' },
        { label: 'Discount offered', impact: 8, positive: true, explanation: 'Showed flexibility in negotiation' },
        { label: 'Competitor mentioned', impact: -10, positive: false, explanation: 'Not differentiated enough' }
      ],
      improvements: [
        'Ask about current costs and pain points',
        'Establish clear timeline for decision',
        'Get specific about implementation needs'
      ],
      benchmark: 72
    },
    coachingMoments: [
      {
        timestamp: '2:30',
        context: 'When asked for 30% discount',
        customerSaid: 'We need at least 30% off to make this work',
        youSaid: 'I can offer 15% for annual payment',
        betterResponse: 'Help me understand what "make this work" means. What\'s your current spend on similar solutions, and what ROI would justify this investment?',
        why: 'Uncovers real budget constraints and value expectations',
        successRate: 73
      }
    ],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 0, teamAverage: 7, topPerformer: 12, improvement: 'Ask ANY discovery questions first' },
      { metric: 'Talk Time', yourValue: '78%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Let customer talk 37% more' },
      { metric: 'Price Mentioned', yourValue: '0:22', teamAverage: '8:30', topPerformer: 'After discovery', improvement: 'Delay pricing until value established' },
      { metric: 'Follow-up Clarity', yourValue: 'Vague', teamAverage: 'Next day', topPerformer: 'Specific date/time', improvement: 'Book next call while on phone' }
    ],
    questionsAsked: [
      // This was a bad call with almost no questions asked - being realistic
    ],
    keyMomentsDetailed: [
      { 
        title: "Pricing bomb dropped immediately", 
        timestamp: "0:22", 
        description: "Started with price before any discovery - customer immediately got defensive",
        type: "critical-mistake"
      },
      { 
        title: "Customer became uncomfortable", 
        timestamp: "2:30", 
        description: "Customer's tone shifted when pushed on budget without building value first",
        type: "concern"
      },
      { 
        title: "Competitor mentioned as escape route", 
        timestamp: "8:15", 
        description: "Customer brought up competitor to deflect from aggressive sales approach",
        type: "red-flag"
      },
      { 
        title: "Desperate discount offered", 
        timestamp: "18:20", 
        description: "Panic move - offered 15% discount to salvage deal without justification",
        type: "critical-mistake"
      },
      { 
        title: "Customer politely tried to escape", 
        timestamp: "25:00", 
        description: "Classic brush-off language: 'We'll think about it and get back to you'",
        type: "red-flag"
      }
    ],
    positiveMoments: [
      { 
        signal: "Customer answered the phone", 
        description: "At least the prospect took the scheduled call", 
        timestamp: "0:01",
        impact: "low"
      },
      { 
        signal: "Remembered customer's name", 
        description: "Used correct name from previous interaction", 
        timestamp: "0:05",
        impact: "low"
      }
    ]
  },
  
  // Discovery Call
  3: {
    winProbability: 92,
    strengths: [
      'Asked 18 high-quality discovery questions',
      'Uncovered 3 critical pain points',
      'Built strong rapport with prospect',
      'Identified complete buying committee',
      'Discovered budget and timeline'
    ],
    improvements: [
      'Could have explored competition more',
      'Schedule next step during the call'
    ],
    keyMoments: [
      { time: '4:20', event: 'Prospect shared frustration with current solution', type: 'opportunity' },
      { time: '12:45', event: 'Revealed budget of ₹50L approved', type: 'opportunity' },
      { time: '23:30', event: 'Identified 5 stakeholders in decision process', type: 'opportunity' },
      { time: '35:15', event: 'Customer eager to see demo next week', type: 'commitment' },
      { time: '42:00', event: 'Asked for customer references', type: 'opportunity' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Warm introduction', sentiment: 'positive' },
      { timestamp: '1:30', time: 90, type: 'discovery', icon: '🔍', label: 'Discovery Start', description: 'Began questioning framework', sentiment: 'positive' },
      { timestamp: '4:20', time: 260, type: 'pain-point', icon: '🎯', label: 'Pain Uncovered', description: 'Current solution frustrations', sentiment: 'negative' },
      { timestamp: '12:45', time: 765, type: 'discovery', icon: '💰', label: 'Budget Revealed', description: '₹50L budget confirmed', sentiment: 'positive' },
      { timestamp: '18:00', time: 1080, type: 'value-prop', icon: '💡', label: 'Solution Fit', description: 'Mapped solution to needs', sentiment: 'positive' },
      { timestamp: '23:30', time: 1410, type: 'discovery', icon: '👥', label: 'Stakeholders', description: 'Identified decision makers', sentiment: 'positive' },
      { timestamp: '35:15', time: 2115, type: 'commitment', icon: '✅', label: 'Demo Scheduled', description: 'Next week demo agreed', sentiment: 'positive' },
      { timestamp: '42:00', time: 2520, type: 'next-steps', icon: '📧', label: 'References', description: 'Will send case studies', sentiment: 'positive' }
    ],
    actionableInsights: [
      {
        type: 'what-worked',
        title: 'Masterful Discovery Execution',
        impact: '+45% win probability',
        description: 'Asked 18 questions systematically, uncovering deep pain points',
        suggestion: 'Document this discovery framework and use it as your standard',
        example: 'Your question at 4:20 "Walk me through your typical day with current solution" was perfect',
        severity: 'low'
      },
      {
        type: 'opportunity',
        title: 'Competition Not Fully Explored',
        impact: 'Risk of surprise competitor',
        description: 'Never asked about other vendors being evaluated',
        suggestion: 'Always ask: "Who else are you evaluating?" and "What do you like about them?"',
        severity: 'medium'
      },
      {
        type: 'critical-miss',
        title: 'Next Call Not Calendared',
        impact: '-10% follow-through rate',
        description: 'Demo mentioned but not scheduled during call',
        suggestion: 'Always share screen and book the next meeting while on call. Say: "Let\'s get this on calendar now"',
        severity: 'medium'
      }
    ],
    predictiveScore: {
      total: 92,
      factors: [
        { label: 'Exceptional discovery', impact: 35, positive: true, explanation: '18 questions uncovered critical needs' },
        { label: 'Budget qualified', impact: 25, positive: true, explanation: '₹50L budget confirmed and approved' },
        { label: 'All stakeholders identified', impact: 20, positive: true, explanation: 'Complete buying committee mapped' },
        { label: 'Strong pain-solution fit', impact: 20, positive: true, explanation: 'Direct match to their challenges' },
        { label: 'Demo commitment', impact: 15, positive: true, explanation: 'Clear next step agreed' },
        { label: 'No calendar booking', impact: -8, positive: false, explanation: 'Risk of demo not happening' },
        { label: 'Competition unknown', impact: -5, positive: false, explanation: 'Could be blindsided by competitor' },
        { label: 'Timeline unclear', impact: -10, positive: false, explanation: 'Decision timeline not established' }
      ],
      improvements: [
        'Book the demo on the call',
        'Ask about competition and evaluation criteria',
        'Establish clear decision timeline'
      ],
      benchmark: 72
    },
    coachingMoments: [
      {
        timestamp: '35:15',
        context: 'When customer expressed interest in demo',
        customerSaid: 'We\'d love to see a demo next week',
        youSaid: 'Great, I\'ll send you some times',
        betterResponse: 'Excellent! Let me share my calendar now. I have Tuesday at 2 PM or Thursday at 10 AM. Which works better for your team?',
        why: 'Booking immediately increases show rate by 40%',
        successRate: 88
      },
      {
        timestamp: '23:30',
        context: 'After identifying stakeholders',
        customerSaid: 'Our CFO will need to approve this',
        youSaid: 'Makes sense, I understand',
        betterResponse: 'Important to know. Should we include the CFO in our demo next week? I can tailor a 10-minute ROI section specifically for financial stakeholders.',
        why: 'Getting decision makers involved early accelerates deals',
        successRate: 91
      }
    ],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 18, teamAverage: 7, topPerformer: 18, improvement: 'You are the top performer!' },
      { metric: 'Talk Time', yourValue: '41%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Perfect balance achieved' },
      { metric: 'Budget Qualification', yourValue: '12:45', teamAverage: '25:00', topPerformer: '8:00', improvement: 'Qualify budget 4 minutes earlier' },
      { metric: 'Meeting Booked', yourValue: 'Yes', teamAverage: '60%', topPerformer: '95%', improvement: 'Great job booking follow-up demo' }
    ],
    questionsAsked: [
      { question: "What prompted you to look into sales analytics solutions?", timestamp: "1:30" },
      { question: "How are your win rates trending over the past year?", timestamp: "2:15" },
      { question: "What's your current process for analyzing sales performance?", timestamp: "3:00" },
      { question: "Walk me through your typical day with the current solution.", timestamp: "4:20" },
      { question: "How much time does your team spend on reporting weekly?", timestamp: "5:30" },
      { question: "What's the biggest pain point with your current system?", timestamp: "6:45" },
      { question: "Who else is involved in this decision-making process?", timestamp: "8:00" },
      { question: "What would success look like for you with a new platform?", timestamp: "9:30" },
      { question: "How did you arrive at the ₹50L budget?", timestamp: "12:50" },
      { question: "What's your timeline for making this decision?", timestamp: "14:00" },
      { question: "How does your team currently track conversation quality?", timestamp: "16:30" },
      { question: "What integrations are critical for your workflow?", timestamp: "19:00" },
      { question: "Who would be the primary users of this system daily?", timestamp: "21:15" },
      { question: "What concerns does your CFO have about sales technology spend?", timestamp: "24:00" },
      { question: "How do you currently measure ROI on sales tools?", timestamp: "26:30" },
      { question: "What other vendors are you evaluating?", timestamp: "29:00" },
      { question: "What would prevent you from moving forward with a solution?", timestamp: "31:45" },
      { question: "When would be ideal to start implementation?", timestamp: "34:00" }
    ],
    keyMomentsDetailed: [
      { 
        title: "Strong pain point revealed", 
        timestamp: "4:20", 
        description: "Customer shared deep frustration: 'Our current solution is terrible. Reports are useless and it takes forever'",
        type: "opportunity"
      },
      { 
        title: "Budget authority confirmed", 
        timestamp: "12:45", 
        description: "Customer revealed: 'We have ₹50L approved for this initiative'",
        type: "very-positive"
      },
      { 
        title: "Complete buying committee identified", 
        timestamp: "23:30", 
        description: "Customer mentioned: 'Our CFO will need to approve this' - identified decision maker",
        type: "opportunity"
      },
      { 
        title: "Demo commitment established", 
        timestamp: "35:15", 
        description: "Customer expressed: 'We'd love to see a demo next week'",
        type: "commitment"
      },
      { 
        title: "Reference request shows buying intent", 
        timestamp: "42:00", 
        description: "Customer proactively asked: 'Can you share some customer references?'",
        type: "very-positive"
      }
    ],
    positiveMoments: [
      { 
        signal: "Opened up about pain points", 
        description: "Customer shared specific frustrations: 'Win rates declining and we don't know why'", 
        timestamp: "1:45",
        impact: "high"
      },
      { 
        signal: "Budget transparency", 
        description: "Voluntarily shared approved ₹50L budget without being pressed", 
        timestamp: "12:45",
        impact: "very-high"
      },
      { 
        signal: "Decision maker identification", 
        description: "Openly shared that CFO approval is needed - no hidden stakeholders", 
        timestamp: "23:30",
        impact: "high"
      },
      { 
        signal: "Proactive demo request", 
        description: "Customer initiated: 'We'd love to see a demo' - strong buying signal", 
        timestamp: "35:15",
        impact: "very-high"
      },
      { 
        signal: "Reference request", 
        description: "Asked for customer references - classic buying behavior", 
        timestamp: "42:00",
        impact: "very-high"
      },
      { 
        signal: "Detailed answers to questions", 
        description: "Customer provided thorough responses to all 18 discovery questions", 
        timestamp: "ongoing",
        impact: "high"
      }
    ]
  },
  
  // Finance Plus Follow-up call (Raj Sharma)
  4: {
    winProbability: 88,
    strengths: [
      'Perfect follow-up timing (24 hours)',
      'Addressed all previous concerns',
      'Got verbal commitment for purchase',
      'Negotiated favorable terms'
    ],
    improvements: [
      'Could have pushed for immediate signature',
      'Missed upselling opportunity for premium support'
    ],
    keyMoments: [
      { time: '2:15', event: 'Customer confirmed budget approval', type: 'commitment' },
      { time: '8:30', event: 'Agreed on implementation timeline', type: 'commitment' },
      { time: '15:45', event: 'Negotiated 10% volume discount', type: 'pricing' },
      { time: '25:00', event: 'Verbal commitment to proceed', type: 'commitment' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Warm reconnection', sentiment: 'positive' },
      { timestamp: '2:15', time: 135, type: 'commitment', icon: '✅', label: 'Budget Confirmed', description: 'Customer got approval', sentiment: 'positive' },
      { timestamp: '5:20', time: 320, type: 'discovery', icon: '🔍', label: 'Requirements', description: 'Final requirements check', sentiment: 'positive' },
      { timestamp: '8:30', time: 510, type: 'commitment', icon: '📅', label: 'Timeline', description: 'Implementation schedule agreed', sentiment: 'positive' },
      { timestamp: '15:45', time: 945, type: 'pricing', icon: '💰', label: 'Discount', description: '10% volume discount', sentiment: 'positive' },
      { timestamp: '20:00', time: 1200, type: 'value-prop', icon: '💡', label: 'ROI Review', description: 'Reinforced value proposition', sentiment: 'positive' },
      { timestamp: '25:00', time: 1500, type: 'commitment', icon: '🤝', label: 'Verbal Yes', description: 'Commitment to proceed', sentiment: 'positive' },
      { timestamp: '28:00', time: 1680, type: 'next-steps', icon: '📧', label: 'Next Steps', description: 'Contract to be sent', sentiment: 'positive' }
    ],
    actionableInsights: [
      {
        type: 'what-worked',
        title: 'Follow-up Timing Was Perfect',
        impact: '+30% close probability',
        description: 'Following up within 24 hours while interest was high',
        suggestion: 'Always follow up within 24-48 hours of initial demo',
        severity: 'low'
      },
      {
        type: 'opportunity',
        title: 'Premium Support Not Discussed',
        impact: '₹2L potential revenue missed',
        description: 'Customer has 24/7 operations but standard support was assumed',
        suggestion: 'Always present premium support options for enterprise clients',
        severity: 'medium'
      }
    ],
    predictiveScore: {
      total: 88,
      factors: [
        { label: 'Budget approved', impact: 35, positive: true, explanation: 'Major buying signal' },
        { label: 'Timeline agreed', impact: 25, positive: true, explanation: 'Clear implementation path' },
        { label: 'Verbal commitment', impact: 30, positive: true, explanation: 'Strong buying intent' },
        { label: 'No contract signed yet', impact: -10, positive: false, explanation: 'Still risk of delay' },
        { label: 'Decision maker involved', impact: 20, positive: true, explanation: 'Has authority to buy' }
      ],
      improvements: [
        'Push for contract signature on call',
        'Discuss premium support options',
        'Set specific contract review date'
      ],
      benchmark: 72
    },
    coachingMoments: [
      {
        timestamp: '25:00',
        context: 'After getting verbal commitment',
        customerSaid: 'Yes, we\'ll definitely move forward with this',
        youSaid: 'Great! I\'ll send the contract today',
        betterResponse: 'Fantastic! Since we\'re aligned, let\'s review the contract together now. I can stay on while you sign digitally.',
        why: 'Strike while the iron is hot - 40% higher close rate with immediate signature',
        successRate: 92
      }
    ],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 6, teamAverage: 7, topPerformer: 12, improvement: 'Ask 6 more questions' },
      { metric: 'Talk Time', yourValue: '35%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Excellent listening' },
      { metric: 'Follow-up Speed', yourValue: '24 hours', teamAverage: '48 hours', topPerformer: '24 hours', improvement: 'Perfect timing!' },
      { metric: 'Close on Call', yourValue: 'No', teamAverage: '30%', topPerformer: '60%', improvement: 'Push for immediate signature' }
    ],
    questionsAsked: [
      { question: "How are things going since our last call?", timestamp: "1:00" },
      { question: "Any changes to the requirements we discussed?", timestamp: "5:20" },
      { question: "Is the March 1st implementation timeline still feasible?", timestamp: "8:30" },
      { question: "How does the board feel about moving forward?", timestamp: "12:00" },
      { question: "Any concerns from your team I should address?", timestamp: "18:30" },
      { question: "What questions do you have about the contract terms?", timestamp: "27:00" }
    ],
    keyMomentsDetailed: [
      { 
        title: "Budget approval confirmed", 
        timestamp: "2:15", 
        description: "Customer announced: 'The board approved ₹28L for this initiative' - major milestone",
        type: "very-positive"
      },
      { 
        title: "Implementation timeline agreed", 
        timestamp: "8:30", 
        description: "Customer confirmed March 1st start date works for their team",
        type: "commitment"
      },
      { 
        title: "10% discount negotiated successfully", 
        timestamp: "15:45", 
        description: "Customer appreciated volume discount, bringing total to ₹25.2L",
        type: "positive"
      },
      { 
        title: "ROI review reinforced value", 
        timestamp: "20:00", 
        description: "Walked through ROI projections again, customer remained convinced",
        type: "positive"
      },
      { 
        title: "Verbal commitment to proceed", 
        timestamp: "25:00", 
        description: "Customer definitively stated: 'We definitely want to move forward'",
        type: "commitment"
      }
    ],
    positiveMoments: [
      { 
        signal: "Immediate budget approval announcement", 
        description: "Customer opened with great news: 'We got budget approval!'", 
        timestamp: "0:05",
        impact: "very-high"
      },
      { 
        signal: "Board approval confirmed", 
        description: "Customer revealed: 'The board approved ₹28L for this initiative'", 
        timestamp: "2:15",
        impact: "very-high"
      },
      { 
        signal: "No requirement changes", 
        description: "Customer confirmed: 'No changes. Everything we talked about is still what we need'", 
        timestamp: "5:30",
        impact: "high"
      },
      { 
        signal: "Timeline commitment", 
        description: "Customer actively suggested March 1st start date", 
        timestamp: "8:30",
        impact: "very-high"
      },
      { 
        signal: "Appreciated discount", 
        description: "Customer responded positively: 'That works perfectly with our budget'", 
        timestamp: "16:00",
        impact: "high"
      },
      { 
        signal: "Definitive commitment", 
        description: "Customer stated: 'I'm convinced. We definitely want to move forward'", 
        timestamp: "25:00",
        impact: "very-high"
      }
    ]
  },
  
  // MediaTech Demo call (Priya Patel)
  11: {
    winProbability: 75,
    strengths: [
      'Good product demonstration',
      'Built rapport with stakeholders',
      'Handled technical questions well'
    ],
    improvements: [
      'Discovery phase too short',
      'Didn\'t discuss budget',
      'Talk time too high (55%)'
    ],
    keyMoments: [
      { time: '3:20', event: 'Jumped into demo too quickly', type: 'miss' },
      { time: '12:15', event: 'Great feature match identified', type: 'opportunity' },
      { time: '22:30', event: 'Customer asked for proposal', type: 'commitment' },
      { time: '30:00', event: 'Next meeting scheduled', type: 'commitment' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Quick introduction', sentiment: 'positive' },
      { timestamp: '3:20', time: 200, type: 'value-prop', icon: '💻', label: 'Demo Start', description: 'Jumped to demo quickly', sentiment: 'neutral' },
      { timestamp: '12:15', time: 735, type: 'value-prop', icon: '✨', label: 'Feature Match', description: 'Key feature resonated', sentiment: 'positive' },
      { timestamp: '18:00', time: 1080, type: 'objection', icon: '❓', label: 'Integration', description: 'Technical concerns', sentiment: 'negative' },
      { timestamp: '22:30', time: 1350, type: 'commitment', icon: '📝', label: 'Proposal', description: 'Requested proposal', sentiment: 'positive' },
      { timestamp: '30:00', time: 1800, type: 'next-steps', icon: '📅', label: 'Next Meeting', description: 'Follow-up scheduled', sentiment: 'positive' }
    ],
    actionableInsights: [
      {
        type: 'critical-miss',
        title: 'Skipped Discovery Phase',
        impact: '-20% win probability',
        description: 'Only 3 minutes on discovery before jumping to demo',
        suggestion: 'Spend at least 10 minutes understanding their challenges first',
        severity: 'high'
      },
      {
        type: 'critical-miss',
        title: 'No Budget Discussion',
        impact: '-15% win probability',
        description: 'Never asked about budget or decision process',
        suggestion: 'Always qualify budget in first meeting',
        severity: 'high'
      }
    ],
    predictiveScore: {
      total: 75,
      factors: [
        { label: 'Proposal requested', impact: 25, positive: true, explanation: 'Shows interest' },
        { label: 'Next meeting booked', impact: 20, positive: true, explanation: 'Continued engagement' },
        { label: 'Good demo reception', impact: 30, positive: true, explanation: 'Product fits needs' },
        { label: 'No budget discussed', impact: -20, positive: false, explanation: 'Major qualifier missing' },
        { label: 'Short discovery', impact: -15, positive: false, explanation: 'May not understand needs' },
        { label: 'Technical concerns raised', impact: -10, positive: false, explanation: 'Integration questions remain' },
        { label: 'Talk time too high', impact: -5, positive: false, explanation: 'Dominated conversation' }
      ],
      improvements: [
        'Qualify budget immediately',
        'Spend more time on discovery',
        'Reduce talk time to under 45%'
      ],
      benchmark: 72
    },
    coachingMoments: [],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 4, teamAverage: 7, topPerformer: 12, improvement: 'Ask 8 more questions' },
      { metric: 'Talk Time', yourValue: '55%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Let customer talk more' },
      { metric: 'Discovery Time', yourValue: '3 min', teamAverage: '8 min', topPerformer: '15 min', improvement: 'Spend 5x more time' }
    ],
    questionsAsked: [
      { question: "How are you currently handling media workflows?", timestamp: "1:30" },
      { question: "What's working well with your current setup?", timestamp: "2:15" },
      { question: "Who would be using this system daily?", timestamp: "25:45" },
      { question: "What's your timeline for making a decision?", timestamp: "29:30" }
    ],
    keyMomentsDetailed: [
      { 
        title: "Rushed into demo too quickly", 
        timestamp: "3:20", 
        description: "Started product demo before understanding customer's specific needs",
        type: "missed-opportunity"
      },
      { 
        title: "Found perfect feature match", 
        timestamp: "12:15", 
        description: "Customer got excited about real-time collaboration feature",
        type: "positive"
      },
      { 
        title: "Integration concerns raised", 
        timestamp: "18:00", 
        description: "IT team worried about API compatibility with existing tools",
        type: "concern"
      },
      { 
        title: "Proposal requested", 
        timestamp: "22:30", 
        description: "Customer asked for formal pricing proposal with implementation timeline",
        type: "positive"
      },
      { 
        title: "Next meeting scheduled", 
        timestamp: "30:00", 
        description: "Booked 45-minute follow-up with full team next Wednesday",
        type: "commitment"
      }
    ],
    positiveMoments: [
      { 
        signal: "Feature excitement", 
        description: "Customer's eyes lit up during collaboration demo", 
        timestamp: "12:15",
        impact: "high"
      },
      { 
        signal: "Technical team engagement", 
        description: "IT lead asked detailed integration questions", 
        timestamp: "18:00",
        impact: "medium"
      },
      { 
        signal: "Proposal request", 
        description: "Customer proactively asked for formal proposal", 
        timestamp: "22:30",
        impact: "high"
      },
      { 
        signal: "Team meeting scheduled", 
        description: "Invited full stakeholder team for follow-up", 
        timestamp: "30:00",
        impact: "high"
      },
      { 
        signal: "Took detailed notes", 
        description: "Customer documented feature requirements during demo", 
        timestamp: "ongoing",
        impact: "medium"
      }
    ]
  },
  
  // Cloud Solutions Pricing call (Priya Patel)
  12: {
    winProbability: 31,
    strengths: [
      'Customer didn\'t hang up immediately',
      'CFO eventually joined call'
    ],
    improvements: [
      'NEVER lead with price - build value first for 15+ minutes',
      'Ask discovery questions to understand their problems',
      'Pricing at 1:30 makes customers defensive immediately',
      'Quick discount shows desperation and devalues product',
      'Should have controlled the conversation flow better'
    ],
    keyMoments: [
      { time: '1:30', event: 'Rep dropped price bomb, customer recoiled', type: 'objection' },
      { time: '8:45', event: 'Desperate 15% discount damaged positioning', type: 'objection' },
      { time: '15:20', event: 'CFO joined late, missed value building', type: 'objection' },
      { time: '25:00', event: 'Lukewarm maybe with many conditions', type: 'objection' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Brief greeting', sentiment: 'neutral' },
      { timestamp: '1:30', time: 90, type: 'pricing', icon: '💣', label: 'Price Bomb', description: 'Dropped price way too early', sentiment: 'negative' },
      { timestamp: '8:45', time: 525, type: 'pricing', icon: '💸', label: 'Panic Discount', description: 'Desperate 15% discount', sentiment: 'negative' },
      { timestamp: '15:20', time: 920, type: 'objection', icon: '😒', label: 'CFO Skeptical', description: 'CFO arrived skeptical of price', sentiment: 'negative' },
      { timestamp: '20:00', time: 1200, type: 'value-prop', icon: '🤷', label: 'Too Late Value', description: 'Tried to justify price after damage done', sentiment: 'negative' },
      { timestamp: '25:00', time: 1500, type: 'objection', icon: '🤔', label: 'Weak Maybe', description: 'Conditional, low-confidence agreement', sentiment: 'negative' }
    ],
    actionableInsights: [
      {
        type: 'critical-miss',
        title: 'Price Before Value',
        impact: '-25% win probability',
        description: 'Revealed pricing in first 90 seconds',
        suggestion: 'Always establish value for at least 10 minutes before discussing price',
        severity: 'high'
      }
    ],
    predictiveScore: {
      total: 31,
      factors: [
        { label: 'CFO involved', impact: 20, positive: true, explanation: 'Decision maker present' },
        { label: 'Tentative agreement', impact: 15, positive: true, explanation: 'Conditional yes' },
        { label: 'Price revealed early', impact: -25, positive: false, explanation: 'Lost negotiation leverage' },
        { label: 'Quick discount', impact: -15, positive: false, explanation: 'Appeared desperate' },
        { label: 'No discovery done', impact: -20, positive: false, explanation: 'No understanding of needs' },
        { label: 'High talk time', impact: -10, positive: false, explanation: 'Dominated conversation' },
        { label: 'Weak commitment', impact: -5, positive: false, explanation: 'Vague follow-up only' }
      ],
      improvements: [],
      benchmark: 72
    },
    coachingMoments: [],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 1, teamAverage: 7, topPerformer: 12, improvement: 'Ask 11 more discovery questions' },
      { metric: 'Time to Price', yourValue: '1:30', teamAverage: '12:00', topPerformer: 'After value', improvement: 'Wait 10+ minutes' },
      { metric: 'Talk Time', yourValue: '65%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Let customer talk more' },
      { metric: 'Discount Given', yourValue: '15%', teamAverage: '10%', topPerformer: '5%', improvement: 'Hold your ground' }
    ],
    questionsAsked: [
      { question: "Are you interested in cloud solutions?", timestamp: "0:45" }
      // This was a very poor call with almost no questions - being realistic
    ],
    keyMomentsDetailed: [
      { 
        title: "Pricing mentioned way too early", 
        timestamp: "1:30", 
        description: "Dropped price before any value demonstration - customer immediately recoiled",
        type: "critical-mistake"
      },
      { 
        title: "Customer became defensive about budget", 
        timestamp: "3:15", 
        description: "Customer said 'we don't have that kind of budget' - defensive reaction to early pricing",
        type: "red-flag"
      },
      { 
        title: "Desperate 15% discount offered", 
        timestamp: "8:45", 
        description: "Panic discount to try to salvage deal without proper justification",
        type: "critical-mistake"
      },
      { 
        title: "CFO joined call unexpectedly", 
        timestamp: "15:20", 
        description: "Customer brought CFO in mid-call to hear pricing discussion",
        type: "mixed-opportunity"
      },
      { 
        title: "Vague follow-up commitment", 
        timestamp: "18:20", 
        description: "Customer gave non-committal 'we'll discuss internally' response",
        type: "red-flag"
      }
    ],
    positiveMoments: [
      { 
        signal: "CFO involvement", 
        description: "Customer brought budget authority into the call", 
        timestamp: "15:20",
        impact: "medium"
      },
      { 
        signal: "Didn't hang up immediately", 
        description: "Customer stayed on call despite early pricing approach", 
        timestamp: "ongoing",
        impact: "low"
      },
      { 
        signal: "Asked clarifying questions", 
        description: "Customer did ask a few questions about implementation", 
        timestamp: "15:30",
        impact: "low"
      }
    ]
  },
  
  // InnovateTech Follow-up call (Priya Patel)  
  14: {
    winProbability: 80,
    strengths: [
      'Great follow-up preparation',
      'Addressed all concerns from previous call',
      'Got commitment for pilot program',
      'Involved multiple stakeholders'
    ],
    improvements: [
      'Could have pushed for larger pilot',
      'Timeline is longer than ideal'
    ],
    keyMoments: [
      { time: '5:00', event: 'Addressed all previous objections', type: 'opportunity' },
      { time: '12:30', event: 'Technical team gave approval', type: 'commitment' },
      { time: '20:15', event: 'Pilot program agreed', type: 'commitment' },
      { time: '28:00', event: 'Implementation timeline set', type: 'commitment' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Prepared opening', sentiment: 'positive' },
      { timestamp: '5:00', time: 300, type: 'objection', icon: '✅', label: 'Objections', description: 'All concerns addressed', sentiment: 'positive' },
      { timestamp: '12:30', time: 750, type: 'commitment', icon: '👍', label: 'Tech Approval', description: 'Technical team satisfied', sentiment: 'positive' },
      { timestamp: '20:15', time: 1215, type: 'commitment', icon: '🚀', label: 'Pilot', description: 'Pilot program agreed', sentiment: 'positive' },
      { timestamp: '28:00', time: 1680, type: 'next-steps', icon: '📅', label: 'Timeline', description: 'Implementation planned', sentiment: 'positive' }
    ],
    actionableInsights: [],
    predictiveScore: {
      total: 80,
      factors: [
        { label: 'Pilot agreed', impact: 35, positive: true, explanation: 'Strong commitment' },
        { label: 'Tech approval', impact: 25, positive: true, explanation: 'No technical blockers' },
        { label: 'All objections handled', impact: 20, positive: true, explanation: 'Clear path forward' }
      ],
      improvements: [],
      benchmark: 72
    },
    coachingMoments: [],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 8, teamAverage: 7, topPerformer: 12, improvement: 'Ask 4 more questions' },
      { metric: 'Talk Time', yourValue: '38%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Perfect listening balance' },
      { metric: 'Objection Handling', yourValue: '88%', teamAverage: '65%', topPerformer: '92%', improvement: 'Excellent objection responses' }
    ],
    questionsAsked: [
      { question: "How did the initial demo go with your team?", timestamp: "1:45" },
      { question: "What were the main concerns from the technical review?", timestamp: "3:30" },
      { question: "How does the implementation timeline look for you?", timestamp: "15:20" },
      { question: "What would make this pilot most valuable for your team?", timestamp: "18:45" },
      { question: "Who else needs to sign off before we can start?", timestamp: "22:15" },
      { question: "What metrics will you use to measure success?", timestamp: "24:30" },
      { question: "When would be ideal to start the pilot program?", timestamp: "26:00" },
      { question: "Any final concerns before we move forward?", timestamp: "27:30" }
    ],
    keyMomentsDetailed: [
      { 
        title: "All previous objections resolved", 
        timestamp: "5:00", 
        description: "Came prepared with answers to every concern raised in first meeting",
        type: "excellent-preparation"
      },
      { 
        title: "Technical team gave approval", 
        timestamp: "12:30", 
        description: "IT lead confirmed our solution meets all security and integration requirements",
        type: "very-positive"
      },
      { 
        title: "Pilot program agreement", 
        timestamp: "20:15", 
        description: "Customer agreed to 3-month pilot with defined success metrics",
        type: "commitment"
      },
      { 
        title: "Clear implementation timeline set", 
        timestamp: "28:00", 
        description: "Both teams aligned on pilot start date and key milestones",
        type: "commitment"
      }
    ],
    positiveMoments: [
      { 
        signal: "Excellent call preparation", 
        description: "Had specific responses ready for every previous concern", 
        timestamp: "start-of-call",
        impact: "very-high"
      },
      { 
        signal: "Technical team satisfaction", 
        description: "IT lead said 'this addresses all our requirements perfectly'", 
        timestamp: "12:30",
        impact: "very-high"
      },
      { 
        signal: "Pilot program commitment", 
        description: "Customer committed to concrete next step with defined timeline", 
        timestamp: "20:15",
        impact: "very-high"
      },
      { 
        signal: "Success metrics agreed", 
        description: "Both parties aligned on how to measure pilot success", 
        timestamp: "24:30",
        impact: "high"
      },
      { 
        signal: "Stakeholder alignment", 
        description: "All decision makers on board with moving forward", 
        timestamp: "27:00",
        impact: "very-high"
      },
      { 
        signal: "Clear next steps", 
        description: "Specific dates and responsibilities defined for pilot kickoff", 
        timestamp: "28:00",
        impact: "high"
      }
    ]
  },
  
  // SmallBiz Discovery call (Amit Kumar)
  19: {
    winProbability: 8,
    strengths: [
      'Answered the phone',
      'Remembered the company name'
    ],
    improvements: [
      'TALKING 82% = WORST POSSIBLE - Should talk max 40%',
      'Asked 2 questions in 22 minutes = Customer felt interrogated, not heard', 
      'Customer said "just looking" FOUR times - clear disengagement signal',
      'Continued pitching after customer tried to leave - major red flag',
      'Zero discovery questions about their business or problems',
      'This call was a masterclass in what NOT to do'
    ],
    keyMoments: [
      { time: '0:45', event: 'Rep launched into pitch without permission', type: 'objection' },
      { time: '5:00', event: 'Customer gave first "just browsing" signal', type: 'objection' },
      { time: '12:00', event: 'Rep ignored signals, continued 8-minute monologue', type: 'objection' },
      { time: '20:00', event: 'Customer repeatedly tried to escape call', type: 'objection' },
      { time: '22:00', event: 'Customer finally hung up in frustration', type: 'objection' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Too energetic greeting', sentiment: 'neutral' },
      { timestamp: '0:45', time: 45, type: 'value-prop', icon: '📢', label: 'Pitch Vomit', description: 'Launched into pitch immediately', sentiment: 'negative' },
      { timestamp: '3:20', time: 200, type: 'objection', icon: '🛑', label: 'Just Browsing', description: 'Customer disengaged immediately', sentiment: 'negative' },
      { timestamp: '5:00', time: 300, type: 'value-prop', icon: '😴', label: 'Ignored Signals', description: 'Continued pitching despite objection', sentiment: 'negative' },
      { timestamp: '8:30', time: 510, type: 'objection', icon: '🚪', label: 'Exit Attempts', description: 'Customer trying to end call', sentiment: 'negative' },
      { timestamp: '12:00', time: 720, type: 'value-prop', icon: '😴', label: '8-Minute Monologue', description: 'Rep ignored signals, talked for 8 straight minutes', sentiment: 'negative' },
      { timestamp: '20:00', time: 1200, type: 'objection', icon: '🚪', label: 'Escape Attempts', description: 'Customer repeatedly tried to end call', sentiment: 'negative' },
      { timestamp: '22:00', time: 1320, type: 'next-steps', icon: '❌', label: 'Hung Up', description: 'Customer finally hung up in frustration', sentiment: 'negative' }
    ],
    actionableInsights: [
      {
        type: 'critical-miss',
        title: 'Talking 82% of the Time',
        impact: '-45% win probability',
        description: 'Customer couldn\'t get a word in',
        suggestion: 'Count to 3 after EVERY sentence. Let them talk!',
        severity: 'high'
      },
      {
        type: 'critical-miss',
        title: 'Zero Discovery',
        impact: '-35% win probability',
        description: 'Only asked 2 questions in 22 minutes',
        suggestion: 'Start with: "Before I share anything, help me understand your current situation"',
        severity: 'high'
      }
    ],
    predictiveScore: {
      total: 8,
      factors: [
        { label: 'Customer answered phone', impact: 15, positive: true, explanation: 'At least they took the call' },
        { label: 'No discovery done', impact: -35, positive: false, explanation: 'Zero understanding of needs' },
        { label: 'Customer hung up', impact: -25, positive: false, explanation: 'Ended call abruptly' },
        { label: 'Excessive monologuing', impact: -20, positive: false, explanation: 'Talked 82% of time' },
        { label: 'Ignored disengagement signals', impact: -15, positive: false, explanation: 'Customer said "just looking" 4 times' },
        { label: 'No budget qualification', impact: -10, positive: false, explanation: 'Never asked about budget' }
      ],
      improvements: [
        'Ask 10+ discovery questions',
        'Talk less than 45% of the time',
        'Qualify budget in first 5 minutes'
      ],
      benchmark: 72
    },
    coachingMoments: [
      {
        timestamp: '0:45',
        context: 'Right after introduction',
        customerSaid: 'So what do you guys do?',
        youSaid: 'Great question! We are the leading solution for... [8 minute pitch]',
        betterResponse: 'Before I dive into that, help me understand - what\'s your current process for handling this?',
        why: 'Discovery first, pitch second. Always.',
        successRate: 85
      }
    ],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 2, teamAverage: 7, topPerformer: 12, improvement: 'Ask 10 more questions' },
      { metric: 'Talk Time', yourValue: '82%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Talk 41% less!' },
      { metric: 'Discovery Time', yourValue: '0 min', teamAverage: '8 min', topPerformer: '15 min', improvement: 'Spend 15 minutes on discovery' }
    ],
    questionsAsked: [
      { question: "How big is your company?", timestamp: "18:45" },
      { question: "What industry are you in?", timestamp: "19:30" }
      // This was a terrible call with almost no real discovery questions
    ],
    keyMomentsDetailed: [
      { 
        title: "Launched into pitch without permission", 
        timestamp: "0:45", 
        description: "Customer asked what we do, rep responded with 8-minute product pitch",
        type: "critical-mistake"
      },
      { 
        title: "First disengagement signal", 
        timestamp: "5:00", 
        description: "Customer said 'just browsing' but rep ignored and kept pitching",
        type: "red-flag"
      },
      { 
        title: "Customer tried multiple exit attempts", 
        timestamp: "12:00", 
        description: "Rep continued 8-minute monologue despite customer trying to disengage",
        type: "critical-mistake"
      },
      { 
        title: "Customer mentioned wanting to end call", 
        timestamp: "20:00", 
        description: "Customer repeatedly tried to politely escape the conversation",
        type: "red-flag"
      },
      { 
        title: "Customer hung up in frustration", 
        timestamp: "22:00", 
        description: "Finally ended call abruptly after too much rep talking",
        type: "call-death"
      }
    ],
    positiveMoments: [
      { 
        signal: "Customer answered phone", 
        description: "At least the prospect took the scheduled call", 
        timestamp: "0:01",
        impact: "very-low"
      },
      { 
        signal: "Remembered company name", 
        description: "Rep got the company name right from previous research", 
        timestamp: "0:05",
        impact: "very-low"
      }
      // This was such a poor call that there were almost no positive signals
    ]
  },
  
  // LocalTech Demo call (Amit Kumar)
  20: {
    winProbability: 58,
    strengths: [
      'Better than previous calls',
      'Asked 4 questions',
      'Showed some features well'
    ],
    improvements: [
      'Still talking too much (68%)',
      'Weak objection handling',
      'No clear next steps'
    ],
    keyMoments: [
      { time: '3:00', event: 'Asked first discovery question', type: 'opportunity' },
      { time: '10:00', event: 'Good feature demonstration', type: 'value-prop' },
      { time: '18:00', event: 'Struggled with pricing objection', type: 'objection' },
      { time: '28:00', event: 'Vague follow-up planned', type: 'next-steps' }
    ],
    timeline: [
      { timestamp: '0:01', time: 1, type: 'greeting', icon: '👋', label: 'Greeting', description: 'Better opening', sentiment: 'positive' },
      { timestamp: '3:00', time: 180, type: 'discovery', icon: '🔍', label: 'Discovery', description: 'Asked some questions', sentiment: 'positive' },
      { timestamp: '10:00', time: 600, type: 'value-prop', icon: '💻', label: 'Demo', description: 'Feature demonstration', sentiment: 'positive' },
      { timestamp: '18:00', time: 1080, type: 'objection', icon: '💰', label: 'Price Objection', description: 'Struggled to handle', sentiment: 'negative' },
      { timestamp: '25:00', time: 1500, type: 'discovery', icon: '❓', label: 'More Questions', description: 'Tried to understand', sentiment: 'neutral' },
      { timestamp: '28:00', time: 1680, type: 'next-steps', icon: '📧', label: 'Follow-up', description: 'Vague next steps', sentiment: 'neutral' }
    ],
    actionableInsights: [
      {
        type: 'what-worked',
        title: 'Improvement in Discovery',
        impact: '+10% from last call',
        description: 'Asked 4 questions vs usual 2',
        suggestion: 'Keep building on this - aim for 8+ questions',
        severity: 'low'
      },
      {
        type: 'objection-not-handled',
        title: 'Weak Price Objection Response',
        impact: '-20% win probability',
        description: 'Immediately offered discount instead of reinforcing value',
        suggestion: 'When they say "too expensive", ask: "Compared to what?"',
        severity: 'medium'
      }
    ],
    predictiveScore: {
      total: 58,
      factors: [
        { label: 'Some discovery done', impact: 20, positive: true, explanation: 'Better than before' },
        { label: 'Good demo reception', impact: 25, positive: true, explanation: 'Features resonated' },
        { label: 'Customer stayed engaged', impact: 15, positive: true, explanation: 'No hang-ups or escapes' },
        { label: 'Talk time still high', impact: -15, positive: false, explanation: '68% is too much' },
        { label: 'Weak objection handling', impact: -20, positive: false, explanation: 'Lost control on pricing' },
        { label: 'Vague next steps', impact: -10, positive: false, explanation: 'No clear commitment' },
        { label: 'Improvement trend', impact: 8, positive: true, explanation: 'Better than previous calls' }
      ],
      improvements: [
        'Reduce talk time to under 50%',
        'Practice objection handling',
        'Always book next meeting on call'
      ],
      benchmark: 72
    },
    coachingMoments: [],
    repComparison: [
      { metric: 'Questions Asked', yourValue: 4, teamAverage: 7, topPerformer: 12, improvement: 'Getting better!' },
      { metric: 'Talk Time', yourValue: '68%', teamAverage: '56%', topPerformer: '41%', unit: '%', improvement: 'Still too high' },
      { metric: 'Objection Handling', yourValue: '30%', teamAverage: '65%', topPerformer: '92%', improvement: 'Practice responses' }
    ],
    questionsAsked: [
      { question: "What's driving your interest in new solutions?", timestamp: "3:00" },
      { question: "How are you handling this process currently?", timestamp: "5:30" },
      { question: "What would success look like for you?", timestamp: "25:00" },
      { question: "Who else would be involved in this decision?", timestamp: "26:30" }
    ],
    keyMomentsDetailed: [
      { 
        title: "Started with actual discovery question", 
        timestamp: "3:00", 
        description: "Big improvement - asked about their needs before jumping to demo",
        type: "improvement"
      },
      { 
        title: "Good feature demonstration", 
        timestamp: "10:00", 
        description: "Customer showed genuine interest in automation capabilities",
        type: "positive"
      },
      { 
        title: "Struggled with pricing objection", 
        timestamp: "18:00", 
        description: "When customer said 'too expensive', immediately offered discount instead of exploring value",
        type: "missed-opportunity"
      },
      { 
        title: "Asked follow-up questions", 
        timestamp: "25:00", 
        description: "Tried to understand customer needs better - improvement from previous calls",
        type: "improvement"
      },
      { 
        title: "Weak follow-up plan", 
        timestamp: "28:00", 
        description: "Said 'I'll send you some information' instead of booking specific next meeting",
        type: "missed-opportunity"
      }
    ],
    positiveMoments: [
      { 
        signal: "Led with discovery question", 
        description: "Asked about their needs before pitching - major improvement", 
        timestamp: "3:00",
        impact: "medium"
      },
      { 
        signal: "Customer showed feature interest", 
        description: "Customer said 'that's interesting' during automation demo", 
        timestamp: "10:00",
        impact: "medium"
      },
      { 
        signal: "Asked clarifying questions", 
        description: "Customer engaged enough to ask about implementation details", 
        timestamp: "15:00",
        impact: "medium"
      },
      { 
        signal: "Improvement in listening", 
        description: "Rep paused more to let customer speak - progress from previous calls", 
        timestamp: "ongoing",
        impact: "low"
      },
      { 
        signal: "Customer stayed engaged", 
        description: "Customer participated throughout the call instead of trying to escape", 
        timestamp: "ongoing",
        impact: "medium"
      }
    ]
  }
};

// Default for backward compatibility
export const analysisResults = analysisResultsByCallType[1];

// Pattern detection data for insights page
export const patternDetectionData: PatternDetection[] = [
  {
    pattern: '"Just looking for information"',
    frequency: 8,
    totalCalls: 10,
    yourCloseRate: 12,
    topPerformerRate: 67,
    topPerformerName: 'Sarah Chen',
    suggestion: 'Sarah responds: "I appreciate that. What specific challenges prompted you to look for new solutions?" This uncovers pain points 85% of the time.'
  },
  {
    pattern: '"Need to think about it"',
    frequency: 6,
    totalCalls: 10,
    yourCloseRate: 25,
    topPerformerRate: 72,
    topPerformerName: 'Raj Sharma',
    suggestion: 'Raj asks: "What specific concerns do you need to think through? Let\'s address them now." This gets immediate clarity on objections.'
  },
  {
    pattern: '"Too expensive"',
    frequency: 7,
    totalCalls: 10,
    yourCloseRate: 18,
    topPerformerRate: 61,
    topPerformerName: 'Priya Patel',
    suggestion: 'Priya pivots: "Let\'s calculate your current costs first. What are you spending on [specific pain point] today?" This reframes price as investment.'
  },
  {
    pattern: 'No budget discussion',
    frequency: 9,
    totalCalls: 10,
    yourCloseRate: 22,
    topPerformerRate: 78,
    topPerformerName: 'Team Average',
    suggestion: 'Top reps qualify budget within first 5 minutes: "To ensure I show you the right solution, what budget range are you working with?"'
  }
];

// Rep performance comparisons for insights page
export const teamPerformanceComparison = {
  metrics: [
    { 
      category: 'Discovery Excellence',
      you: { questions: 3, timing: '15:00', quality: 'Basic' },
      topRep: { name: 'Raj Sharma', questions: 12, timing: '3:00', quality: 'Deep' },
      improvement: 'Ask 9 more questions, focus on business impact'
    },
    {
      category: 'Objection Handling',
      you: { handled: '40%', responseTime: '45s', effectiveness: 'Weak' },
      topRep: { name: 'Sarah Chen', handled: '92%', responseTime: '8s', effectiveness: 'Strong' },
      improvement: 'Address objections immediately with specific examples'
    },
    {
      category: 'Next Steps Clarity',
      you: { clarity: 'Vague', booked: '20%', followThrough: '60%' },
      topRep: { name: 'Priya Patel', clarity: 'Specific', booked: '85%', followThrough: '95%' },
      improvement: 'Always book next meeting while on call with specific agenda'
    }
  ]
};

// Transcript data for each call
export const callTranscripts: { [key: number]: TranscriptLine[] } = {
  // Enterprise Software Demo
  1: [
    { timestamp: '0:01', speaker: 'rep', text: 'Good morning! This is Raj from CalliQ. How are you doing today?', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Hi Raj, doing well. Thanks for taking the time today.' },
    { timestamp: '0:08', speaker: 'rep', text: 'My pleasure! I see you\'re interested in our integration capabilities. Before we dive in, could you tell me about your current setup?' },
    { timestamp: '0:15', speaker: 'customer', text: 'Sure, we\'re using multiple tools that don\'t talk to each other. It\'s a real pain point.', momentType: 'pain-point' },
    { timestamp: '2:30', speaker: 'rep', text: 'I understand completely. How much time does your team spend on manual data entry between systems?', momentType: 'discovery' },
    { timestamp: '2:45', speaker: 'customer', text: 'Probably 2-3 hours per day per person. It\'s killing our productivity.' },
    { timestamp: '5:12', speaker: 'customer', text: 'Wait, you can integrate with our existing CRM? That would be amazing!', momentType: 'value-prop' },
    { timestamp: '12:00', speaker: 'rep', text: 'Let me show you exactly how our API handles real-time sync...' },
    { timestamp: '15:30', speaker: 'customer', text: 'We\'re worried about downtime during migration. That\'s a big concern.', momentType: 'objection' },
    { timestamp: '15:35', speaker: 'rep', text: 'We have tools to help with that.' },
    { timestamp: '22:45', speaker: 'customer', text: 'The CFO just joined. What\'s this going to cost us?', momentType: 'pricing' },
    { timestamp: '22:50', speaker: 'rep', text: 'Our enterprise plan starts at ₹50L annually.' },
    { timestamp: '28:10', speaker: 'customer', text: 'This looks promising. Can we schedule a POC for next week?', momentType: 'commitment' },
    { timestamp: '28:15', speaker: 'rep', text: 'Great, I\'ll send you some times.' },
  ],
  
  // Pricing Negotiation (Amit Kumar)
  2: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi, this is Amit from CalliQ, following up on our last conversation about pricing.', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Yes, we\'ve been discussing internally.' },
    { timestamp: '0:22', speaker: 'customer', text: 'Let\'s cut to the chase - what\'s your best price?', momentType: 'pricing' },
    { timestamp: '0:31', speaker: 'customer', text: 'I\'m just looking for information right now.' },
    { timestamp: '0:35', speaker: 'rep', text: 'Yes, all right, perfect.' },
    { timestamp: '2:30', speaker: 'customer', text: 'We need at least 30% off to make this work.', momentType: 'objection' },
    { timestamp: '2:35', speaker: 'rep', text: 'I can offer 15% for annual payment.' },
    { timestamp: '8:15', speaker: 'customer', text: 'Your competitor is offering lower prices.', momentType: 'objection' },
    { timestamp: '12:00', speaker: 'rep', text: 'Let me highlight our power-only capabilities that they don\'t have...', momentType: 'value-prop' },
    { timestamp: '18:20', speaker: 'rep', text: 'So we\'re agreed on 15% discount with annual payment?', momentType: 'commitment' },
    { timestamp: '18:25', speaker: 'customer', text: 'I suppose that could work.' },
    { timestamp: '25:00', speaker: 'customer', text: 'I need to think about it.', momentType: 'objection' },
    { timestamp: '25:05', speaker: 'rep', text: 'Of course, when should I follow up?' },
  ],
  
  // Discovery Call
  3: [
    { timestamp: '0:01', speaker: 'rep', text: 'Good afternoon! Thanks for taking my call. I\'m Raj from CalliQ.', momentType: 'greeting' },
    { timestamp: '0:08', speaker: 'customer', text: 'Hi Raj, I\'ve heard good things about CalliQ.' },
    { timestamp: '1:30', speaker: 'rep', text: 'That\'s great to hear! What prompted you to look into sales analytics solutions?', momentType: 'discovery' },
    { timestamp: '1:45', speaker: 'customer', text: 'Our win rates have been declining and we don\'t know why.' },
    { timestamp: '4:20', speaker: 'customer', text: 'Our current solution is terrible. The reports are useless and it takes forever.', momentType: 'pain-point' },
    { timestamp: '4:30', speaker: 'rep', text: 'Walk me through your typical day with the current solution.' },
    { timestamp: '12:45', speaker: 'customer', text: 'We have ₹50L approved for this initiative.', momentType: 'discovery' },
    { timestamp: '12:50', speaker: 'rep', text: 'That\'s a healthy budget. How did you arrive at that number?' },
    { timestamp: '18:00', speaker: 'rep', text: 'Based on what you\'ve shared, our platform can solve these exact challenges...', momentType: 'value-prop' },
    { timestamp: '23:30', speaker: 'customer', text: 'Our CFO will need to approve this.', momentType: 'discovery' },
    { timestamp: '23:35', speaker: 'rep', text: 'Makes sense, I understand.' },
    { timestamp: '35:15', speaker: 'customer', text: 'We\'d love to see a demo next week.', momentType: 'commitment' },
    { timestamp: '35:20', speaker: 'rep', text: 'Great, I\'ll send you some times.' },
    { timestamp: '42:00', speaker: 'customer', text: 'Can you share some customer references?' },
    { timestamp: '42:05', speaker: 'rep', text: 'Absolutely, I\'ll include case studies in my follow-up email.' },
  ],
  
  // Finance Plus Follow-up Call (Raj Sharma)
  4: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi Sarah! Thanks for making time today. How are things going?', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Good, Raj. I have great news - we got budget approval!' },
    { timestamp: '2:15', speaker: 'customer', text: 'The board approved ₹28L for this initiative.', momentType: 'commitment' },
    { timestamp: '2:20', speaker: 'rep', text: 'That\'s fantastic news! Congratulations on getting approval.' },
    { timestamp: '5:20', speaker: 'rep', text: 'Let me just confirm - are there any changes to the requirements we discussed?', momentType: 'discovery' },
    { timestamp: '5:30', speaker: 'customer', text: 'No changes. Everything we talked about is still what we need.' },
    { timestamp: '8:30', speaker: 'customer', text: 'We\'d like to start implementation by March 1st. Is that feasible?', momentType: 'commitment' },
    { timestamp: '8:35', speaker: 'rep', text: 'Absolutely. That gives us 6 weeks, which is perfect for a phased rollout.' },
    { timestamp: '15:45', speaker: 'rep', text: 'Given your volume, I can offer a 10% discount - that brings it to ₹25.2L total.', momentType: 'pricing' },
    { timestamp: '16:00', speaker: 'customer', text: 'That works perfectly with our budget. I appreciate that.' },
    { timestamp: '20:00', speaker: 'rep', text: 'Let me walk you through the ROI projections one more time...', momentType: 'value-prop' },
    { timestamp: '25:00', speaker: 'customer', text: 'I\'m convinced. We definitely want to move forward.', momentType: 'commitment' },
    { timestamp: '25:05', speaker: 'rep', text: 'Wonderful! I\'ll send the contract today for review.' },
    { timestamp: '28:00', speaker: 'rep', text: 'I\'ll also include the implementation timeline we discussed.', momentType: 'next-steps' },
  ],
  
  // MediaTech Demo Call (Priya Patel)
  11: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi everyone! This is Priya from CalliQ. Thanks for joining the demo today.', momentType: 'greeting' },
    { timestamp: '0:08', speaker: 'customer', text: 'Hi Priya, we\'re excited to see what you can do for us.' },
    { timestamp: '3:20', speaker: 'rep', text: 'Great! Let me share my screen and show you our platform...', momentType: 'value-prop' },
    { timestamp: '3:25', speaker: 'customer', text: 'Actually, could you first tell us about your integration capabilities?' },
    { timestamp: '12:15', speaker: 'customer', text: 'Wow, that automated reporting feature is exactly what we need!', momentType: 'value-prop' },
    { timestamp: '12:20', speaker: 'rep', text: 'I\'m so glad you see the value! This will save you hours every week.' },
    { timestamp: '18:00', speaker: 'customer', text: 'How does this integrate with our existing CRM?', momentType: 'objection' },
    { timestamp: '18:05', speaker: 'rep', text: 'Great question. We have pre-built connectors for all major CRMs...' },
    { timestamp: '22:30', speaker: 'customer', text: 'Could you send us a proposal with pricing?', momentType: 'commitment' },
    { timestamp: '22:35', speaker: 'rep', text: 'Absolutely! I\'ll get that to you by tomorrow.' },
    { timestamp: '30:00', speaker: 'rep', text: 'How about we schedule a follow-up for next week?', momentType: 'next-steps' },
    { timestamp: '30:05', speaker: 'customer', text: 'That sounds perfect.' },
  ],
  
  // Cloud Solutions Pricing Call (Priya Patel)
  12: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi Michael, thanks for the follow-up call.', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Hi Priya. So, what\'s this going to cost us?' },
    { timestamp: '1:30', speaker: 'rep', text: 'Our enterprise package is ₹42L annually.', momentType: 'pricing' },
    { timestamp: '1:35', speaker: 'customer', text: 'That seems high. What does that include?' },
    { timestamp: '8:45', speaker: 'rep', text: 'I can offer 15% off if you pay annually upfront.', momentType: 'pricing' },
    { timestamp: '8:50', speaker: 'customer', text: 'That\'s better, but still feels expensive.' },
    { timestamp: '15:20', speaker: 'customer', text: 'Let me bring in our CFO. John, can you join us?', momentType: 'discovery' },
    { timestamp: '15:30', speaker: 'customer', text: 'John, Priya was just explaining their pricing.' },
    { timestamp: '20:00', speaker: 'rep', text: 'John, let me show you the ROI calculations...', momentType: 'value-prop' },
    { timestamp: '25:00', speaker: 'customer', text: 'OK, this could work. Can we start with a 6-month pilot?', momentType: 'commitment' },
    { timestamp: '25:05', speaker: 'rep', text: 'Absolutely! I\'ll draft the pilot agreement.' },
  ],
  
  // InnovateTech Follow-up Call (Priya Patel)
  14: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi Lisa! Great to connect again. I\'ve prepared responses to all your questions.', momentType: 'greeting' },
    { timestamp: '0:08', speaker: 'customer', text: 'Perfect! Our team is eager to hear your thoughts.' },
    { timestamp: '5:00', speaker: 'rep', text: 'Let me address the security concerns you raised...', momentType: 'objection' },
    { timestamp: '5:30', speaker: 'customer', text: 'That actually covers all our compliance requirements.' },
    { timestamp: '12:30', speaker: 'customer', text: 'Our technical team is satisfied with your architecture.', momentType: 'commitment' },
    { timestamp: '12:35', speaker: 'rep', text: 'Fantastic! That was our biggest concern from last week.' },
    { timestamp: '20:15', speaker: 'customer', text: 'We\'d like to move forward with a 3-month pilot program.', momentType: 'commitment' },
    { timestamp: '20:20', speaker: 'rep', text: 'Excellent choice! The pilot will give you real data to evaluate.' },
    { timestamp: '28:00', speaker: 'rep', text: 'I\'ll send the pilot agreement with a March 1st start date.', momentType: 'next-steps' },
    { timestamp: '28:10', speaker: 'customer', text: 'Perfect. We\'re excited to get started.' },
  ],
  
  // SmallBiz Discovery Call (Amit Kumar)
  19: [
    { timestamp: '0:01', speaker: 'rep', text: 'Good morning! This is Amit from CalliQ. I\'m so excited to talk with you today!', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Hi Amit.' },
    { timestamp: '0:45', speaker: 'rep', text: 'So let me tell you about CalliQ! We are the premier AI-powered sales analytics platform that revolutionizes how teams...', momentType: 'value-prop' },
    { timestamp: '5:00', speaker: 'customer', text: 'Um, I\'m just looking for some basic information.' },
    { timestamp: '5:02', speaker: 'rep', text: 'Perfect! So we have three main modules - our conversation intelligence engine, our predictive scoring algorithm, and our coaching recommendations system...' },
    { timestamp: '12:00', speaker: 'rep', text: '...and what I love most about our platform is how it integrates with all the major CRMs like Salesforce, HubSpot, Pipedrive, and even custom solutions...' },
    { timestamp: '15:30', speaker: 'customer', text: 'How much does this cost?' },
    { timestamp: '15:32', speaker: 'rep', text: 'Great question! Our pricing is very competitive. We start at ₹8L annually for our basic package, but most companies like yours go with our professional tier...' },
    { timestamp: '20:00', speaker: 'customer', text: 'I think I have enough information for now. Thanks.' },
    { timestamp: '20:02', speaker: 'rep', text: 'Wait! Let me just show you one more feature that I think you\'ll love. Our AI can actually predict which leads are most likely to close...' },
    { timestamp: '22:00', speaker: 'customer', text: 'I really need to go. Goodbye.' },
  ],
  
  // LocalTech Demo Call (Amit Kumar)
  20: [
    { timestamp: '0:01', speaker: 'rep', text: 'Hi there! Amit from CalliQ. Ready for an awesome demo?', momentType: 'greeting' },
    { timestamp: '0:05', speaker: 'customer', text: 'Sure, let\'s see what you\'ve got.' },
    { timestamp: '3:00', speaker: 'rep', text: 'Before I jump in, what\'s your current process for tracking sales calls?', momentType: 'discovery' },
    { timestamp: '3:10', speaker: 'customer', text: 'We just use spreadsheets mostly. Nothing fancy.' },
    { timestamp: '10:00', speaker: 'rep', text: 'Let me show you how our AI analyzes conversations in real-time...', momentType: 'value-prop' },
    { timestamp: '10:30', speaker: 'customer', text: 'That\'s actually pretty cool. How accurate is it?' },
    { timestamp: '18:00', speaker: 'customer', text: 'This seems expensive for a small company like ours.', momentType: 'objection' },
    { timestamp: '18:05', speaker: 'rep', text: 'I can give you a 20% discount to make it more affordable.' },
    { timestamp: '25:00', speaker: 'rep', text: 'What other questions do you have about the platform?', momentType: 'discovery' },
    { timestamp: '25:10', speaker: 'customer', text: 'How long does implementation take?' },
    { timestamp: '28:00', speaker: 'rep', text: 'I\'ll send you some information and we can chat again next week.', momentType: 'next-steps' },
    { timestamp: '28:05', speaker: 'customer', text: 'Sounds good. Thanks for the demo.' },
  ],
};

// Rep performance data
export const repPerformanceData: { [key: string]: RepPerformanceDetail } = {
  'rep-1': {
    rep: demoReps[0], // Raj Sharma
    recentCalls: [
      { id: 3, customer: 'StartUp Innovations', date: 'Today', duration: '45:20', score: 92, outcome: 'won', type: 'Discovery' },
      { id: 1, customer: 'TechCorp Solutions', date: 'Yesterday', duration: '32:15', score: 85, outcome: 'pending', type: 'Demo' },
      { id: 4, customer: 'Finance Plus', date: '2 days ago', duration: '28:30', score: 88, outcome: 'won', type: 'Follow-up' },
    ],
    metrics: {
      avgCallDuration: '38:45',
      talkTime: 41,
      questionsPerCall: 12,
      objectionHandlingRate: 92,
      followUpRate: 95,
      avgDealSize: 680000,
      callsPerDay: 8
    },
    strengths: [
      'Exceptional discovery skills - asks 12+ questions per call',
      'Maintains optimal talk ratio (41%) for engagement',
      'Strong objection handling with 92% success rate',
      'Consistent follow-up within 24 hours'
    ],
    improvements: [
      'Could involve decision makers earlier in the process',
      'Sometimes takes too long to reach pricing discussion',
      'Occasional missed opportunities for upselling'
    ],
    coachingTips: [
      'Share your discovery framework with the team',
      'Consider creating templates for common objections',
      'Document your success patterns for training'
    ],
    patterns: [
      {
        pattern: 'Strong discovery phase',
        frequency: 9,
        totalCalls: 10,
        yourCloseRate: 78,
        topPerformerRate: 78,
        topPerformerName: 'You',
        suggestion: 'Keep doing what you\'re doing - your discovery process is best in class'
      }
    ]
  },
  
  'rep-2': {
    rep: demoReps[1], // Priya Patel
    recentCalls: [
      { id: 11, customer: 'MediaTech Inc', date: 'Today', duration: '36:20', score: 75, outcome: 'pending', type: 'Demo' },
      { id: 12, customer: 'Cloud Solutions', date: 'Yesterday', duration: '29:45', score: 72, outcome: 'won', type: 'Pricing' },
      { id: 14, customer: 'InnovateTech', date: '2 days ago', duration: '31:30', score: 80, outcome: 'won', type: 'Follow-up' },
    ],
    metrics: {
      avgCallDuration: '35:20',
      talkTime: 48,
      questionsPerCall: 7,
      objectionHandlingRate: 75,
      followUpRate: 85,
      avgDealSize: 520000,
      callsPerDay: 6
    },
    strengths: [
      'Good rapport building with customers',
      'Strong product knowledge and demo skills',
      'Handles pricing negotiations well',
      'Consistent call volume and activity'
    ],
    improvements: [
      'Need more discovery questions (currently 7 vs 12 for top performers)',
      'Talk time slightly high at 48%',
      'Could improve objection handling techniques',
      'Sometimes rushes through pain point identification'
    ],
    coachingTips: [
      'Focus on asking more open-ended discovery questions',
      'Practice the 60/40 rule - let customer talk 60% of the time',
      'Prepare objection handling scripts for common concerns',
      'Slow down during discovery phase'
    ],
    patterns: [
      {
        pattern: 'Rushing through discovery',
        frequency: 6,
        totalCalls: 10,
        yourCloseRate: 71,
        topPerformerRate: 85,
        topPerformerName: 'Raj Sharma',
        suggestion: 'Spend at least 15 minutes on discovery before presenting solutions'
      }
    ]
  },
  
  'rep-3': {
    rep: demoReps[2], // Amit Kumar
    recentCalls: [
      { id: 2, customer: 'Global Retail Inc', date: 'Today', duration: '28:45', score: 18, outcome: 'lost', type: 'Pricing' },
      { id: 19, customer: 'SmallBiz Co', date: 'Yesterday', duration: '12:15', score: 8, outcome: 'lost', type: 'Discovery' },
      { id: 20, customer: 'LocalTech', date: '2 days ago', duration: '31:15', score: 34, outcome: 'lost', type: 'Demo' },
    ],
    metrics: {
      avgCallDuration: '21:45',  // Shorter - customers escape faster
      talkTime: 81,              // Even worse talk time  
      questionsPerCall: 1,       // Almost no questions
      objectionHandlingRate: 12, // Terrible objection handling
      followUpRate: 25,          // Poor follow-up due to burned bridges
      avgDealSize: 180000,       // Smaller deals due to poor positioning
      callsPerDay: 6             // More calls needed due to low success rate
    },
    strengths: [
      'Enthusiastic and energetic approach',
      'Good technical knowledge',
      'Punctual with meetings',
      'Willing to learn and improve'
    ],
    improvements: [
      'Critical: Talking 78% of the time (should be <45%)',
      'Only asking 2 questions per call (need 8+)',
      'Weak objection handling (40% success rate)',
      'Jumping to price too early in conversations',
      'Not identifying customer pain points effectively'
    ],
    coachingTips: [
      'URGENT: Practice active listening - aim for 60/40 customer/you talk ratio',
      'Use the discovery question framework before every call',
      'Never mention price until value is established',
      'Role-play objection handling scenarios daily',
      'Shadow Raj\'s calls to learn discovery techniques'
    ],
    patterns: [
      {
        pattern: '"Just looking" not countered',
        frequency: 8,
        totalCalls: 10,
        yourCloseRate: 12,
        topPerformerRate: 67,
        topPerformerName: 'Raj Sharma',
        suggestion: 'When they say "just looking", ask: "What prompted you to look for solutions now?"'
      },
      {
        pattern: 'No budget discussion',
        frequency: 9,
        totalCalls: 10,
        yourCloseRate: 22,
        topPerformerRate: 78,
        topPerformerName: 'Raj Sharma',
        suggestion: 'Always qualify budget in first 5 minutes with: "What budget range are you working with?"'
      }
    ]
  }
};

// Weekly progress data for personal dashboard
export const weeklyScores: { [repId: string]: number[] } = {
  'rep-1': [82, 85, 88, 79, 91, 87, 92], // Raj - consistently high
  'rep-2': [68, 72, 75, 70, 77, 72, 75], // Priya - moderate, improving
  'rep-3': [48, 52, 42, 55, 35, 58, 42], // Amit - struggling
};

export const weeklyMetrics: { [repId: string]: { score: number; talk: number; questions: number; scoreChange: number; talkChange: number; questionsChange: number } } = {
  'rep-1': { score: 84, talk: 43, questions: 11, scoreChange: 3, talkChange: -2, questionsChange: 1 },  // Top performer - realistic but not perfect
  'rep-2': { score: 67, talk: 52, questions: 6, scoreChange: 2, talkChange: -3, questionsChange: 0 },   // Middle performer - room for improvement
  'rep-3': { score: 23, talk: 81, questions: 1, scoreChange: -8, talkChange: 7, questionsChange: -1 },  // Poor performer - realistic consequences
};

// 30-day historical data for progress charts
export const monthlyProgress: { [repId: string]: { date: string; score: number }[] } = {
  'rep-1': [
    { date: '1', score: 75 }, { date: '2', score: 78 }, { date: '3', score: 72 },
    { date: '4', score: 80 }, { date: '5', score: 82 }, { date: '6', score: 79 },
    { date: '7', score: 85 }, { date: '8', score: 83 }, { date: '9', score: 87 },
    { date: '10', score: 84 }, { date: '11', score: 88 }, { date: '12', score: 86 },
    { date: '13', score: 82 }, { date: '14', score: 85 }, { date: '15', score: 89 },
    { date: '16', score: 87 }, { date: '17', score: 90 }, { date: '18', score: 88 },
    { date: '19', score: 85 }, { date: '20', score: 91 }, { date: '21', score: 88 },
    { date: '22', score: 82 }, { date: '23', score: 85 }, { date: '24', score: 88 },
    { date: '25', score: 79 }, { date: '26', score: 91 }, { date: '27', score: 87 },
    { date: '28', score: 92 }, { date: '29', score: 90 }, { date: '30', score: 92 }
  ],
  'rep-2': [
    { date: '1', score: 65 }, { date: '2', score: 62 }, { date: '3', score: 68 },
    { date: '4', score: 64 }, { date: '5', score: 70 }, { date: '6', score: 67 },
    { date: '7', score: 68 }, { date: '8', score: 71 }, { date: '9', score: 69 },
    { date: '10', score: 72 }, { date: '11', score: 70 }, { date: '12', score: 73 },
    { date: '13', score: 68 }, { date: '14', score: 72 }, { date: '15', score: 74 },
    { date: '16', score: 71 }, { date: '17', score: 75 }, { date: '18', score: 73 },
    { date: '19', score: 70 }, { date: '20', score: 76 }, { date: '21', score: 72 },
    { date: '22', score: 68 }, { date: '23', score: 72 }, { date: '24', score: 75 },
    { date: '25', score: 70 }, { date: '26', score: 77 }, { date: '27', score: 72 },
    { date: '28', score: 75 }, { date: '29', score: 73 }, { date: '30', score: 75 }
  ],
  'rep-3': [
    { date: '1', score: 58 }, { date: '2', score: 55 }, { date: '3', score: 52 },
    { date: '4', score: 48 }, { date: '5', score: 45 }, { date: '6', score: 50 },
    { date: '7', score: 48 }, { date: '8', score: 52 }, { date: '9', score: 45 },
    { date: '10', score: 42 }, { date: '11', score: 48 }, { date: '12', score: 45 },
    { date: '13', score: 50 }, { date: '14', score: 48 }, { date: '15', score: 52 },
    { date: '16', score: 45 }, { date: '17', score: 42 }, { date: '18', score: 48 },
    { date: '19', score: 45 }, { date: '20', score: 50 }, { date: '21', score: 42 },
    { date: '22', score: 48 }, { date: '23', score: 52 }, { date: '24', score: 42 },
    { date: '25', score: 55 }, { date: '26', score: 35 }, { date: '27', score: 58 },
    { date: '28', score: 42 }, { date: '29', score: 45 }, { date: '30', score: 42 }
  ]
};

// Progress summary for rep deep dive
export const progressSummary: { [repId: string]: { startScore: number; currentScore: number; change: number } } = {
  'rep-1': { startScore: 75, currentScore: 92, change: 23 },
  'rep-2': { startScore: 65, currentScore: 75, change: 15 },
  'rep-3': { startScore: 58, currentScore: 42, change: -28 }
};

// Strengths progress over time
export const strengthsProgress: { [repId: string]: { metric: string; before: string | number; after: string | number }[] } = {
  'rep-1': [
    { metric: 'Discovery Questions', before: 8, after: 12 },
    { metric: 'Talk Time', before: '52%', after: '41%' },
    { metric: 'Budget Qualification', before: '60%', after: '95%' },
    { metric: 'Meeting Booking', before: '70%', after: '95%' }
  ],
  'rep-2': [
    { metric: 'Discovery Questions', before: 5, after: 7 },
    { metric: 'Talk Time', before: '58%', after: '48%' },
    { metric: 'Objection Handling', before: '65%', after: '75%' },
    { metric: 'Follow-up Rate', before: '75%', after: '85%' }
  ],
  'rep-3': [
    { metric: 'Discovery Questions', before: 3, after: 2 },
    { metric: 'Talk Time', before: '72%', after: '78%' },
    { metric: 'Budget Qualification', before: '20%', after: '10%' },
    { metric: 'Close Rate', before: '35%', after: '22%' }
  ]
};

// Today's focus for each rep
export const todaysFocus: { [repId: string]: string } = {
  'rep-1': 'Focus on involving decision makers earlier - you missed CFO inclusion in 2 calls yesterday',
  'rep-2': 'Work on discovery questions - aim for 10+ today (you averaged 7 this week)',
  'rep-3': 'Critical: Reduce talk time! Count to 3 after each question. You talked 78% yesterday.'
};

// Quick win tips
export const quickWinTips = [
  { tip: "Try Raj's discovery opening - it gets 2x more engagement", author: 'Raj Sharma', clipUrl: '#' },
  { tip: 'Always mention ROI within first 5 minutes', author: 'Sarah Miller', clipUrl: '#' },
  { tip: 'Use the 3-second pause after pricing', author: 'Top Performer', clipUrl: '#' }
];

// Personal patterns
export const winningPatterns: { [repId: string]: { pattern: string; closeRate: number; context: string }[] } = {
  'rep-1': [
    { pattern: 'When you mention ROI early', closeRate: 85, context: '15-20 minute calls' },
    { pattern: 'Discovery with 10+ questions', closeRate: 92, context: 'Your sweet spot' },
    { pattern: 'Morning calls before 11am', closeRate: 88, context: '12% better than afternoon' }
  ],
  'rep-2': [
    { pattern: 'Demo-first approach', closeRate: 78, context: 'Technical buyers love this' },
    { pattern: 'Written follow-ups same day', closeRate: 82, context: 'Your strength' },
    { pattern: 'Calls with 2+ stakeholders', closeRate: 75, context: 'Better outcomes' }
  ],
  'rep-3': [
    { pattern: 'Enthusiasm in first minute', closeRate: 55, context: 'When you\'re energetic' },
    { pattern: 'Technical deep dives', closeRate: 48, context: 'Your knowledge shows' },
    { pattern: 'Morning energy', closeRate: 45, context: 'Better than afternoons' }
  ]
};

export const warningPatterns: { [repId: string]: { pattern: string; lossRate: number; context: string }[] } = {
  'rep-1': [
    { pattern: 'Calls over 45 minutes', lossRate: 65, context: 'You lose momentum' },
    { pattern: 'Friday afternoon calls', lossRate: 70, context: 'Energy drops' },
    { pattern: 'No CFO involvement', lossRate: 60, context: 'Deals stall' }
  ],
  'rep-2': [
    { pattern: 'Skipping discovery', lossRate: 75, context: 'You rush to demo' },
    { pattern: 'No budget discussion', lossRate: 80, context: 'Critical miss' },
    { pattern: 'Talk time over 55%', lossRate: 70, context: 'Less engagement' }
  ],
  'rep-3': [
    { pattern: '"Just looking" objection', lossRate: 85, context: 'You close only 15%' },
    { pattern: 'No budget qualification', lossRate: 90, context: '90% loss rate' },
    { pattern: 'Friday performance', lossRate: 80, context: 'Scores drop 20%' }
  ]
};

// Manager dashboard data
export const teamAlerts = [
  { type: 'success' as const, message: 'Raj set new record: 92% score on discovery call!', timestamp: '2 hours ago' },
  { type: 'warning' as const, message: 'Amit struggling with discovery (2 questions avg)', timestamp: '5 hours ago' },
  { type: 'info' as const, message: 'Priya improving rapidly (+15% this week)', timestamp: '1 day ago' },
  { type: 'success' as const, message: 'Team average up to 63% win rate', timestamp: '1 day ago' }
];

export const repStatus: { [repId: string]: 'Maintain' | 'Encourage' | 'Check-in' | 'Coach now' } = {
  'rep-1': 'Maintain',
  'rep-2': 'Encourage',
  'rep-3': 'Coach now'
};

// Shareable moments for team learning
export const shareableMoments = [
  { repName: 'Raj Sharma', description: "Perfect discovery sequence", callId: 3, date: 'Today' },
  { repName: 'Priya Patel', description: "Great objection handling on pricing", callId: 11, date: 'Yesterday' },
  { repName: 'Raj Sharma', description: "Textbook budget qualification", callId: 1, date: '2 days ago' }
];

// Top performer behaviors for comparison
export const topPerformerBehaviors = [
  { behavior: 'Asks 11+ discovery questions', impact: 'Team asks only 5 average' },
  { behavior: 'Mentions ROI in first 5 minutes', impact: '2x higher engagement' },
  { behavior: 'Talk time under 45%', impact: 'Team averages 56%' },
  { behavior: 'Always books next meeting on call', impact: '95% follow-through rate' }
];

// Time and day performance
export const timePerformance: { [repId: string]: { morning: number; afternoon: number; evening: number } } = {
  'rep-1': { morning: 88, afternoon: 84, evening: 79 },
  'rep-2': { morning: 75, afternoon: 72, evening: 68 },
  'rep-3': { morning: 48, afternoon: 42, evening: 38 }
};

export const dayPerformance: { [repId: string]: { [day: string]: number } } = {
  'rep-1': { Mon: 85, Tue: 88, Wed: 90, Thu: 87, Fri: 78 },
  'rep-2': { Mon: 70, Tue: 72, Wed: 75, Thu: 73, Fri: 68 },
  'rep-3': { Mon: 48, Tue: 45, Wed: 42, Thu: 44, Fri: 35 }
};

// DYNAMIC INTELLIGENCE SYSTEM - The Future of Sales Analytics

// Personal Intelligence System - Context-aware insights for each rep
export const personalIntelligence: { [key: string]: any } = {
  'rep-1': {
    contextualGreeting: "Your Tuesday performance is 35% better - schedule important calls today!",
    todaysFocus: "Your Tuesday calls are 35% better - schedule important demos after 2 PM",
    personalAlerts: [
      {
        type: 'success',
        message: '🔥 You are on a 3-call winning streak!',
        action: 'Keep using your ROI-first approach'
      }
    ],
    personalPatterns: [
      { pattern: "89% win rate when ROI mentioned in first 10 minutes", confidence: 94, frequency: 67 },
      { pattern: "Your afternoon calls convert 40% better than morning", confidence: 87, frequency: 89 },
      { pattern: "Discovery questions 8+ = 94% close rate for you", confidence: 91, frequency: 72 },
      { pattern: "Budget qualification before minute 5 = 91% success rate", confidence: 89, frequency: 45 }
    ],
    weeklyProgress: {
      score: { current: 78, previous: 74, trend: "+4", context: "Your best week in 2 months!" },
      talkTime: { current: 45, previous: 52, trend: "-7%", context: "Perfect listening improvement" },
      questions: { current: 7, previous: 5, trend: "+2", context: "Almost at target of 8+" },
      winRate: { current: 85, previous: 78, trend: "+7%", context: "Outstanding improvement!" }
    },
    riskAlerts: [
      { risk: "Price objections in 3 of last 5 calls", impact: "23% lower close rate", action: "Build value for 15+ min before pricing" },
      { risk: "Competitor mentions trending up", impact: "31% more objections", action: "Prepare differentiation early" }
    ],
    quickWins: [
      { 
        tip: "Ask 'What's your timeline?' earlier - you forgot in last 3 calls", 
        source: "Your Performance Analysis",
        impact: "+31% urgency creation",
        context: "Based on your last 20 successful calls"
      },
      { 
        tip: "Your 'budget question at 5:00' pattern = 89% qualification rate", 
        source: "Pattern Recognition",
        impact: "Keep doing this!",
        context: "This is your strongest winning behavior"
      },
      { 
        tip: "Mention ROI in first 10 minutes - your secret weapon", 
        source: "Top Performer Insights",
        impact: "89% win rate when done",
        context: "You've mastered this technique"
      }
    ],
    growthOpportunities: [
      {
        area: 'Talk Time Management',
        currentScore: 45,
        insight: 'Reducing talk time by 5% more would increase close rate by 12%',
        priority: 'medium',
        potentialGain: '+12% close rate'
      },
      {
        area: 'Meeting Booking',
        currentScore: 78,
        insight: 'Book next meeting before ending call - you miss this 22% of time',
        priority: 'high',
        potentialGain: '+18% pipeline velocity'
      }
    ],
    actionPlan: [
      { week: 1, focus: 'Maintain ROI-first approach in all calls' },
      { week: 2, focus: 'Reduce talk time to under 40%' },
      { week: 3, focus: 'Book next meeting before ending every call' },
      { week: 4, focus: 'Share best practices with team' }
    ],
    monthlyProjection: { 
      revenue: '₹3.2L', 
      confidence: 'high', 
      reasoning: 'Based on 78% avg score + strong pipeline',
      breakdown: { qualified: '₹1.8L', likely: '₹1.1L', possible: '₹0.3L' }
    }
  },
  'rep-2': {
    contextualGreeting: "Morning calls are your strength - schedule key meetings before lunch",
    todaysFocus: "Focus on discovery - your questions are 40% below target",
    personalAlerts: [
      {
        type: 'warning',
        message: 'Discovery questions still below target',
        action: 'Use the SPIN framework checklist today'
      }
    ],
    personalPatterns: [
      { pattern: "67% win rate when you slow down and listen more", confidence: 82, frequency: 23 },
      { pattern: "Morning calls perform 25% better than afternoons", confidence: 88, frequency: 78 },
      { pattern: "You struggle with technical objections - needs training", confidence: 91, frequency: 45 }
    ],
    weeklyProgress: {
      score: { current: 67, previous: 64, trend: "+3", context: "Slow but steady improvement" },
      talkTime: { current: 52, previous: 58, trend: "-6%", context: "Better listening this week" },
      questions: { current: 6, previous: 5, trend: "+1", context: "Still below target of 8+" },
      winRate: { current: 68, previous: 62, trend: "+6%", context: "Solid improvement trend" }
    },
    riskAlerts: [
      { risk: "Discovery questions still below team average", impact: "27% lower close rate", action: "Use SPIN framework checklist" },
      { risk: "Technical objections causing issues", impact: "45% of stalled deals", action: "Schedule technical training" }
    ],
    quickWins: [
      { 
        tip: "Ask just ONE more discovery question per call", 
        source: "Performance Coach",
        impact: "+23% close rate improvement",
        context: "Your easiest path to improvement"
      },
      { 
        tip: "Schedule important calls before 2 PM - you're 25% better", 
        source: "Time Analysis",
        impact: "Easy wins",
        context: "Morning is your power time"
      },
      { 
        tip: "Practice technical objection responses", 
        source: "Skills Gap Analysis",
        impact: "Convert 45% more stalled deals",
        context: "This is holding you back most"
      }
    ],
    growthOpportunities: [
      {
        area: 'Discovery Questions',
        currentScore: 60,
        insight: 'Adding 2 more questions per call would increase close rate by 23%',
        priority: 'high',
        potentialGain: '+23% close rate'
      },
      {
        area: 'Technical Objection Handling',
        currentScore: 45,
        insight: 'Technical training would help convert 45% of stalled deals',
        priority: 'high',
        potentialGain: '+45% stalled deal conversion'
      }
    ],
    actionPlan: [
      { week: 1, focus: 'Ask 1 more discovery question per call' },
      { week: 2, focus: 'Complete technical objection training' },
      { week: 3, focus: 'Schedule all important calls before 2 PM' },
      { week: 4, focus: 'Practice active listening techniques' }
    ],
    monthlyProjection: { 
      revenue: '₹2.1L', 
      confidence: 'medium-high', 
      reasoning: 'Strong improvement trajectory + good technical skills',
      breakdown: { qualified: '₹1.2L', likely: '₹0.7L', possible: '₹0.2L' }
    }
  },
  'rep-3': {
    contextualGreeting: "Critical performance issues - immediate coaching session scheduled for 10 AM",
    todaysFocus: "URGENT: Stop talking and start listening - 82% talk time is killing deals",
    personalAlerts: [
      {
        type: 'critical',
        message: '⚠️ 3 consecutive calls under 40% score',
        action: 'Review coaching materials before next call'
      }
    ],
    personalPatterns: [
      { pattern: "Only 18% win rate when talk time over 70%", confidence: 94, frequency: 78 },
      { pattern: "Morning calls slightly better but still struggling", confidence: 82, frequency: 67 },
      { pattern: "Customer hang-ups when you monologue over 5 minutes", confidence: 89, frequency: 45 }
    ],
    weeklyProgress: {
      score: { current: 23, previous: 28, trend: "-5", context: "Concerning downward trend" },
      talkTime: { current: 81, previous: 78, trend: "+3%", context: "Getting worse - major concern" },
      questions: { current: 2, previous: 3, trend: "-1", context: "Well below minimum viable" },
      winRate: { current: 18, previous: 22, trend: "-4%", context: "Critical performance issue" }
    },
    riskAlerts: [
      { risk: "Talk time over 80% - customers disengaging", impact: "82% deal loss rate", action: "Immediate coaching required" },
      { risk: "Discovery questions under 3 per call", impact: "90% qualification failure", action: "Use question script religiously" }
    ],
    quickWins: [
      { 
        tip: "Count to 5 after EVERY question - stop the monologues", 
        source: "Emergency Coaching",
        impact: "+45% customer engagement",
        context: "This is your #1 priority"
      },
      { 
        tip: "Ask 'What's your biggest challenge?' and then LISTEN", 
        source: "Basic Sales Training",
        impact: "+67% pain discovery rate",
        context: "You must master this immediately"
      },
      { 
        tip: "Schedule all important calls in morning", 
        source: "Performance Data",
        impact: "+15% better performance window",
        context: "Your only strong time slot"
      }
    ],
    growthOpportunities: [
      {
        area: 'Talk Time Reduction',
        currentScore: 18,
        insight: 'Reducing talk time to 50% would triple your close rate',
        priority: 'critical',
        potentialGain: '+200% close rate'
      },
      {
        area: 'Discovery Questions',
        currentScore: 25,
        insight: 'Ask at least 5 questions to qualify any opportunity',
        priority: 'critical',
        potentialGain: '+150% qualification rate'
      },
      {
        area: 'Active Listening',
        currentScore: 15,
        insight: 'Listen for pain points instead of pitching features',
        priority: 'critical',
        potentialGain: '+180% engagement'
      }
    ],
    actionPlan: [
      { week: 1, focus: 'Count to 5 after every question' },
      { week: 2, focus: 'Ask minimum 5 discovery questions per call' },
      { week: 3, focus: 'Record yourself and review talk time' },
      { week: 4, focus: 'Complete remedial sales training' }
    ],
    monthlyProjection: { 
      revenue: '₹0.4L', 
      confidence: 'low', 
      reasoning: 'Major performance issues need immediate attention',
      breakdown: { qualified: '₹0.1L', likely: '₹0.2L', possible: '₹0.1L' }
    }
  }
};

// Competitive Intelligence - Battle-ready insights
export const competitiveIntel: { [key: string]: any } = {
  'rep-1': [
    { 
      competitor: 'Salesforce', 
      lastMentioned: 'Call 12 at 15:30', 
      frequency: 34, 
      winRate: 67, 
      battlecard: 'Emphasize 5-min setup vs 3-month implementation',
      keyDiff: 'Simplicity and speed of deployment',
      lastWinStrategy: 'ROI calculator showing immediate value'
    },
    { 
      competitor: 'HubSpot', 
      lastMentioned: 'Call 8 at 22:15', 
      frequency: 28, 
      winRate: 78, 
      battlecard: 'Advanced AI analytics vs basic reporting',
      keyDiff: 'Conversation intelligence vs manual tracking',
      lastWinStrategy: 'Demonstrated predictive scoring capabilities'
    }
  ],
  'rep-2': [
    { 
      competitor: 'Salesforce', 
      lastMentioned: 'Call 11 at 8:30', 
      frequency: 31, 
      winRate: 72, 
      battlecard: 'Technical superiority in integrations',
      keyDiff: 'API flexibility and customization options',
      lastWinStrategy: 'Live integration demo won the deal'
    }
  ],
  'rep-3': [
    { 
      competitor: 'HubSpot', 
      lastMentioned: 'Call 19 at 12:00', 
      frequency: 23, 
      winRate: 15, 
      battlecard: 'NEEDS TRAINING - struggles with differentiation',
      keyDiff: 'Cannot articulate value differences effectively',
      lastWinStrategy: 'None - lost to basic feature comparison'
    }
  ],
  // Competitive data by call ID for call detail pages
  byCallId: {
    1: {
      mentionedCompetitors: [
        { name: 'Salesforce', context: 'Customer evaluating', strength: 'Brand recognition', weakness: 'Complex implementation' },
        { name: 'HubSpot', context: 'Current system', strength: 'User friendly', weakness: 'Limited analytics' }
      ],
      battleCards: [
        { competitor: 'Salesforce', differentiator: '5-min setup vs 3-month implementation', winRate: 67 },
        { competitor: 'HubSpot', differentiator: 'AI-powered insights vs basic reporting', winRate: 78 }
      ],
      riskAssessment: {
        level: 'Medium',
        reason: 'Customer comparing multiple vendors actively',
        recommendation: 'Emphasize quick time-to-value and ease of use'
      }
    },
    2: {
      mentionedCompetitors: [
        { name: 'Gong', context: 'Budget competitor', strength: 'Similar features', weakness: 'Higher price' }
      ],
      battleCards: [
        { competitor: 'Gong', differentiator: '50% lower cost with 90% of features', winRate: 45 }
      ],
      riskAssessment: {
        level: 'High',
        reason: 'Price-focused customer with budget constraints',
        recommendation: 'Focus on ROI rather than feature comparison'
      }
    },
    3: {
      mentionedCompetitors: [
        { name: 'Chorus', context: 'Previous vendor', strength: 'Existing relationship', weakness: 'Poor support' }
      ],
      battleCards: [
        { competitor: 'Chorus', differentiator: '24/7 support vs business hours only', winRate: 82 }
      ],
      riskAssessment: {
        level: 'Low',
        reason: 'Customer unhappy with current vendor',
        recommendation: 'Highlight superior customer success program'
      }
    },
    4: {
      mentionedCompetitors: [],
      battleCards: [],
      riskAssessment: {
        level: 'Very Low',
        reason: 'No competitors mentioned, clear buying signals',
        recommendation: 'Fast-track to contract stage'
      }
    },
    11: {
      mentionedCompetitors: [
        { name: 'Salesforce', context: 'IT team preference', strength: 'Enterprise features', weakness: 'Steep learning curve' }
      ],
      battleCards: [
        { competitor: 'Salesforce', differentiator: 'User adoption in days vs months', winRate: 72 }
      ],
      riskAssessment: {
        level: 'Medium',
        reason: 'Technical team has Salesforce bias',
        recommendation: 'Schedule technical deep-dive session'
      }
    },
    12: {
      mentionedCompetitors: [
        { name: 'Custom build', context: 'Internal option', strength: 'Full control', weakness: 'Resource intensive' }
      ],
      battleCards: [
        { competitor: 'Custom build', differentiator: 'Ready today vs 6-month development', winRate: 69 }
      ],
      riskAssessment: {
        level: 'Medium',
        reason: 'Engineering team considering building internally',
        recommendation: 'Calculate total cost of ownership comparison'
      }
    },
    14: {
      mentionedCompetitors: [],
      battleCards: [],
      riskAssessment: {
        level: 'Low',
        reason: 'Pilot program moving forward smoothly',
        recommendation: 'Focus on pilot success metrics'
      }
    },
    19: {
      mentionedCompetitors: [
        { name: 'HubSpot', context: 'Current system', strength: 'Already using', weakness: 'Not meeting needs' }
      ],
      battleCards: [
        { competitor: 'HubSpot', differentiator: 'Conversation intelligence vs manual logging', winRate: 15 }
      ],
      riskAssessment: {
        level: 'Very High',
        reason: 'Rep failed to articulate value, customer disengaged',
        recommendation: 'Do not pursue - focus on rep training instead'
      }
    },
    20: {
      mentionedCompetitors: [
        { name: 'Status quo', context: 'No urgency', strength: 'No cost', weakness: 'Missing opportunities' }
      ],
      battleCards: [],
      riskAssessment: {
        level: 'High',
        reason: 'Customer not convinced of need for change',
        recommendation: 'Need to build stronger business case'
      }
    }
  }
};

// Team Intelligence Hub - Manager's command center
export const teamIntelligence = {
  realTimeAlerts: [
    { 
      type: 'success', 
      rep: 'Raj Sharma', 
      message: 'Just scored 94% - new team record!', 
      timestamp: '2 min ago', 
      impact: 'Share his ROI-first approach',
      action: 'Review call transcript for team training',
      callId: 3
    },
    { 
      type: 'warning', 
      rep: 'Amit Kumar', 
      message: 'Three consecutive calls under 40% - customer hung up', 
      timestamp: '15 min ago', 
      impact: 'Immediate coaching needed', 
      action: 'Schedule emergency 1:1 coaching session',
      callId: 19
    },
    { 
      type: 'insight', 
      message: 'Team discovery questions up 40% this week', 
      timestamp: '1 hour ago', 
      impact: 'Best improvement in 3 months!',
      action: 'Continue SPIN methodology training'
    },
    { 
      type: 'risk', 
      rep: 'Team Average', 
      message: 'Budget qualification rate dropped to 42%', 
      timestamp: '3 hours ago', 
      impact: '23% lower pipeline quality',
      action: 'Implement mandatory budget qualification training'
    }
  ],
  coachingOpportunities: [
    { 
      area: 'Budget qualification timing',
      compliance: 42,
      target: 80,
      impact: 'Early qualifiers have 31% higher win rates',
      solution: 'Ask budget in first 5 minutes - use Raj\'s exact approach',
      urgency: 'high',
      affectedReps: ['Amit Kumar', 'Priya Patel'],
      trainingUrl: '#budget-training'
    },
    {
      area: 'Discovery question depth', 
      compliance: 65,
      target: 85,
      impact: '8+ questions correlate with 27% better outcomes',
      solution: 'SPIN framework training + question templates',
      urgency: 'medium',
      affectedReps: ['Amit Kumar'],
      trainingUrl: '#discovery-training'
    },
    {
      area: 'Talk time management',
      compliance: 58,
      target: 75,
      impact: 'Reps over 60% talk time lose 34% more deals',
      solution: '5-second pause rule after questions',
      urgency: 'high', 
      affectedReps: ['Amit Kumar'],
      trainingUrl: '#listening-training'
    }
  ],
  weeklyMetrics: {
    teamAvgScore: { current: 63, previous: 59, trend: "+4%", context: "Best week this quarter" },
    discoveryQuestions: { current: 6.2, target: 8, compliance: 62, trend: "+1.8 from last week" },
    budgetQual: { current: 42, target: 80, compliance: 38, trend: "-8% - needs urgent attention" },
    meetingBook: { current: 69, target: 85, compliance: 69, trend: "+12% improvement" },
    talkTime: { current: 58, target: 45, compliance: 42, trend: "-3% better listening" }
  },
  topPerformers: [
    { rep: 'Raj Sharma', metric: 'Overall Score', value: 85, improvement: '+7%', badge: '🏆 Team Leader' },
    { rep: 'Priya Patel', metric: 'Technical Demos', value: 82, improvement: '+4%', badge: '🔧 Tech Expert' },
    { rep: 'Raj Sharma', metric: 'Discovery Questions', value: 12, improvement: '+2', badge: '🎯 Discovery Master' }
  ],
  weeklyInsights: [
    { metric: 'Budget Qualification', value: 'Improving', change: '+30% this week', trend: 'up', context: 'Still below target' },
    { metric: 'Average Call Score', value: '74%', change: '↑ from 69% last week', trend: 'up', context: 'Best improvement in Q2' },
    { metric: 'Discovery Questions', value: '5 avg', change: 'Still below target (8+)', trend: 'warning', context: 'Focus area for training' }
  ],
  priorityOpportunity: {
    description: 'Focus team training on discovery questions. Top performers ask 11+ questions and have 27% higher win rates.',
    action: 'Implement SPIN framework training immediately',
    impact: '+23% expected win rate improvement'
  }
};

// Dynamic Forecasting Engine - Predictive intelligence
export const dynamicForecasting: { [key: string]: any } = {
  'rep-1': {
    callPredictions: [
      { 
        callId: 1,
        probability: 87, 
        reasoning: 'Strong demo + timeline + budget hint', 
        riskFactors: ['no next meeting booked'], 
        opportunities: ['technical stakeholder engaged'],
        recommendedActions: ['Schedule follow-up immediately', 'Send ROI calculator'],
        insight: 'Strong technical engagement - 87% close probability',
        confidence: 87,
        nextAction: 'Send ROI calculator within 24 hours'
      },
      { 
        callId: 3,
        probability: 94, 
        reasoning: '18 questions + budget qualified + pain + timeline', 
        riskFactors: ['competitor evaluation'], 
        opportunities: ['urgent timeline', 'approved budget'],
        recommendedActions: ['Fast-track proposal', 'Include implementation timeline'],
        insight: 'All buying signals present - fast-track this deal',
        confidence: 94,
        nextAction: 'Propose contract terms today'
      },
      { 
        callId: 4,
        probability: 91, 
        reasoning: 'Budget approved + implementation timeline + verbal commitment', 
        riskFactors: ['contract review process'], 
        opportunities: ['eager to start', 'March deadline'],
        recommendedActions: ['Send contract today', 'Propose implementation kickoff meeting'],
        insight: 'Deal ready to close - just needs paperwork',
        confidence: 91,
        nextAction: 'Send contract immediately'
      }
    ],
    pipelineHealth: {
      strongDeals: { count: 3, value: '₹2.1L', probability: '85%+' },
      riskyDeals: { count: 2, value: '₹0.9L', probability: '30%' },
      lostCauses: { count: 1, value: '₹0.2L', probability: '<10%' }
    }
  },
  'rep-2': {
    callPredictions: [
      { 
        callId: 11,
        probability: 75, 
        reasoning: 'Good demo reception + proposal requested', 
        riskFactors: ['rushed discovery phase'], 
        opportunities: ['technical team engagement'],
        recommendedActions: ['Follow-up discovery call', 'Technical deep-dive session'],
        insight: 'Good engagement but needs deeper discovery',
        confidence: 75,
        nextAction: 'Schedule technical deep-dive'
      },
      { 
        callId: 14,
        probability: 80, 
        reasoning: 'All objections addressed + pilot agreed', 
        riskFactors: ['longer sales cycle'], 
        opportunities: ['pilot program commitment'],
        recommendedActions: ['Pilot success metrics definition', 'Implementation planning'],
        insight: 'Pilot agreement secured - nurture carefully',
        confidence: 80,
        nextAction: 'Define pilot success metrics'
      }
    ]
  },
  'rep-3': {
    callPredictions: [
      { 
        callId: 19,
        probability: 8, 
        reasoning: 'Customer hung up + 82% talk time + no discovery', 
        riskFactors: ['complete disengagement', 'burned bridge'], 
        opportunities: ['none - relationship damaged'],
        recommendedActions: ['Do not follow up', 'Focus on skill improvement'],
        insight: 'Call failed - focus on coaching',
        confidence: 8,
        nextAction: 'Review call for training purposes'
      }
    ]
  },
  // Forecasting data by call ID for call detail pages
  byCallId: {
    1: {
      closeProbability: 87,
      probabilityFactors: ['Strong technical engagement', 'POC scheduled', 'CFO involved'],
      timelineWeeks: 3,
      timelineConfidence: 85,
      expectedValue: '680K',
      valueRange: { min: '450K', max: '850K' },
      riskFactors: ['Late decision maker entry', 'Migration concerns remain', 'Competitor evaluation'],
      nextBestActions: [
        'Send ROI calculator within 24 hours',
        'Schedule migration success story call',
        'Get commitment on decision timeline'
      ]
    },
    2: {
      closeProbability: 18,
      probabilityFactors: ['Price objection dominant', 'No budget authority', 'Poor discovery'],
      timelineWeeks: 8,
      timelineConfidence: 25,
      expectedValue: '180K',
      valueRange: { min: '100K', max: '250K' },
      riskFactors: ['Budget not qualified', 'No pain established', 'Customer disengaged'],
      nextBestActions: [
        'Do not pursue actively',
        'Add to long-term nurture campaign',
        'Focus on other opportunities'
      ]
    },
    3: {
      closeProbability: 94,
      probabilityFactors: ['All buying signals present', 'Budget approved', 'Urgent timeline'],
      timelineWeeks: 1,
      timelineConfidence: 92,
      expectedValue: '750K',
      valueRange: { min: '650K', max: '850K' },
      riskFactors: ['Competitor evaluation mentioned'],
      nextBestActions: [
        'Send contract immediately',
        'Schedule implementation planning',
        'Involve customer success team'
      ]
    },
    4: {
      closeProbability: 91,
      probabilityFactors: ['Verbal commitment received', 'Implementation timeline set', 'Budget approved'],
      timelineWeeks: 2,
      timelineConfidence: 88,
      expectedValue: '520K',
      valueRange: { min: '480K', max: '600K' },
      riskFactors: ['Contract review process'],
      nextBestActions: [
        'Send contract today',
        'Propose implementation kickoff',
        'Confirm payment terms'
      ]
    },
    11: {
      closeProbability: 75,
      probabilityFactors: ['Good demo reception', 'Technical team engaged', 'Proposal requested'],
      timelineWeeks: 4,
      timelineConfidence: 70,
      expectedValue: '420K',
      valueRange: { min: '350K', max: '500K' },
      riskFactors: ['Rushed discovery phase', 'Technical concerns'],
      nextBestActions: [
        'Schedule technical deep-dive',
        'Address integration questions',
        'Clarify implementation timeline'
      ]
    },
    12: {
      closeProbability: 72,
      probabilityFactors: ['Pricing agreement reached', 'Stakeholder buy-in', 'Clear use case'],
      timelineWeeks: 3,
      timelineConfidence: 75,
      expectedValue: '380K',
      valueRange: { min: '320K', max: '450K' },
      riskFactors: ['Internal build option considered'],
      nextBestActions: [
        'Provide TCO comparison',
        'Share customer success stories',
        'Set up reference call'
      ]
    },
    14: {
      closeProbability: 80,
      probabilityFactors: ['Pilot agreement secured', 'Success metrics defined', 'Budget allocated'],
      timelineWeeks: 6,
      timelineConfidence: 78,
      expectedValue: '550K',
      valueRange: { min: '450K', max: '650K' },
      riskFactors: ['Longer sales cycle', 'Pilot must succeed'],
      nextBestActions: [
        'Define pilot success metrics',
        'Weekly pilot check-ins',
        'Prepare expansion proposal'
      ]
    },
    19: {
      closeProbability: 8,
      probabilityFactors: ['Customer hung up', 'No discovery done', 'Complete disengagement'],
      timelineWeeks: 0,
      timelineConfidence: 95,
      expectedValue: '0',
      valueRange: { min: '0', max: '0' },
      riskFactors: ['Relationship damaged', 'Rep needs coaching', 'Customer lost interest'],
      nextBestActions: [
        'Do not follow up',
        'Focus on rep training',
        'Review call for coaching'
      ]
    },
    20: {
      closeProbability: 34,
      probabilityFactors: ['Some interest shown', 'Technical knowledge good', 'Meeting completed'],
      timelineWeeks: 10,
      timelineConfidence: 30,
      expectedValue: '220K',
      valueRange: { min: '150K', max: '300K' },
      riskFactors: ['No urgency', 'Poor discovery', 'Status quo preference'],
      nextBestActions: [
        'Build stronger business case',
        'Find champion internally',
        'Create urgency with market data'
      ]
    }
  }
};

// Behavioral Pattern Recognition - What actually drives success
export const behaviorPatterns: { [key: string]: any } = {
  'rep-1': {
    winningBehaviors: [
      { behavior: 'ROI mention in first 10 min', personalRate: 67, winRate: 89, frequency: 'Often', impact: 'Very High' },
      { behavior: 'Budget ask before minute 5', personalRate: 45, winRate: 94, frequency: 'Sometimes', impact: 'Very High' },
      { behavior: '8+ discovery questions', personalRate: 72, winRate: 91, frequency: 'Often', impact: 'High' },
      { behavior: 'Technical stakeholder engagement', personalRate: 56, winRate: 87, frequency: 'Sometimes', impact: 'High' }
    ],
    uniquePatterns: [
      { pattern: 'Tuesday afternoon calls', winRate: 91, frequency: 'Weekly', insight: 'Your secret weapon - schedule important demos then' },
      { pattern: 'ROI calculator usage', winRate: 94, frequency: 'Often', insight: 'Visual tools dramatically improve your close rate' },
      { pattern: 'Follow-up within 24 hours', winRate: 88, frequency: 'Always', insight: 'Your consistency creates trust and urgency' }
    ],
    behaviorInsights: [
      {
        insight: 'You close 3x better when customer talks >60%',
        evidence: 'Based on last 23 successful calls',
        impact: '+67% win rate'
      },
      {
        insight: 'Your energy drops after 3 PM - avoid important calls',
        evidence: 'Win rate drops 41% in late afternoon',
        impact: '-41% performance'
      }
    ]
  },
  'rep-2': {
    winningBehaviors: [
      { behavior: 'Technical demonstrations', personalRate: 82, winRate: 85, frequency: 'Often', impact: 'Very High' },
      { behavior: 'Morning calls', personalRate: 78, winRate: 72, frequency: 'Often', impact: 'Medium' },
      { behavior: 'Demo-first approach', personalRate: 67, winRate: 78, frequency: 'Sometimes', impact: 'High' }
    ],
    improvementOpportunities: [
      { opportunity: 'Ask 2 more discovery questions', impact: '+23% close rate', difficulty: 'Easy', timeframe: 'This week' },
      { opportunity: 'Qualify budget earlier', impact: '+31% pipeline quality', difficulty: 'Medium', timeframe: '2 weeks' }
    ],
    behaviorInsights: [
      {
        insight: 'Morning energy gives you 25% advantage',
        evidence: 'Your best calls are all before noon',
        impact: '+25% morning performance'
      },
      {
        insight: 'Technical objections stall 45% of your deals',
        evidence: 'Analyzed last 15 lost opportunities',
        impact: '-45% conversion on technical'
      }
    ]
  },
  'rep-3': {
    riskBehaviors: [
      { behavior: 'Excessive talking (70%+)', personalRate: 78, winRate: 18, frequency: 'Often', impact: 'Very High Risk' },
      { behavior: 'Minimal discovery (<3 questions)', personalRate: 89, winRate: 15, frequency: 'Almost Always', impact: 'Very High Risk' },
      { behavior: 'Price discussions without value', personalRate: 67, winRate: 12, frequency: 'Often', impact: 'Deal Killer' }
    ],
    urgentActions: [
      { action: 'Implement 5-second pause rule', impact: '+45% engagement', priority: 'Critical' },
      { action: 'Use discovery question checklist', impact: '+67% qualification rate', priority: 'Critical' },
      { action: 'No pricing until pain established', impact: '+78% value perception', priority: 'High' }
    ],
    behaviorInsights: [
      {
        insight: 'You dominate conversations, reducing close rates by 82%',
        evidence: 'Talking 78% average vs 41% for top performers',
        impact: '-82% close rate'
      },
      {
        insight: 'Skipping discovery kills 85% of your deals',
        evidence: 'Average 2 questions vs team best of 11',
        impact: '-85% qualification'
      },
      {
        insight: 'Price-first approach triggers immediate objections',
        evidence: '67% of calls mention price before value',
        impact: '-73% value perception'
      }
    ]
  },
  // General team patterns
  unique: [
    { pattern: 'ROI-first conversations', confidence: 94, insight: 'Most successful pattern across team', impact: '+31% win rate' },
    { pattern: 'Tuesday afternoon calls', confidence: 87, insight: 'Highest engagement time slot', impact: '+19% connection rate' },
    { pattern: 'Visual demo before pricing', confidence: 91, insight: 'Reduces price objections by 67%', impact: '+27% close rate' }
  ],
  performanceMetrics: [
    { metric: 'Discovery Questions', topPerformer: '11', teamAverage: '5', improvement: '+120%' },
    { metric: 'Talk Time', topPerformer: '41%', teamAverage: '56%', improvement: '-27%' },
    { metric: 'Meeting Booking', topPerformer: '95%', teamAverage: '60%', improvement: '+58%' },
    { metric: 'Budget Qualification', topPerformer: '89%', teamAverage: '42%', improvement: '+112%' }
  ],
  coachingOpportunities: [
    { 
      issue: 'Budget qualification before minute 5',
      context: 'Only 40% of reps doing this consistently',
      actionType: 'Quick Fix',
      solution: 'Start every call with: "Before we dive in, what budget range are you working with?"',
      priority: 'critical',
      metric: '40%',
      metricLabel: 'compliance',
      impact: '+31% win rate'
    },
    {
      issue: 'Discovery questions average too low',
      context: 'Team averaging 5 questions, target is 8+',
      actionType: 'Training Focus',
      solution: 'Use the SPIN framework: Situation, Problem, Implication, Need-payoff',
      priority: 'high',
      metric: '5',
      metricLabel: 'avg questions',
      impact: '+27% close rate'
    },
    {
      issue: 'Talk time too high',
      context: '3 reps talking over 65% of the time',
      actionType: 'Coaching Tip',
      solution: 'Practice the 3-second pause after every question. Let customers fill the silence.',
      priority: 'medium',
      metric: '3 reps',
      metricLabel: 'need help',
      impact: '+19% engagement'
    }
  ]
};

// Export coachingOpportunities separately for backward compatibility
export const coachingOpportunities = {
  immediate: [
    { 
      rep: 'Amit Kumar',
      issue: 'Three consecutive calls under 40%',
      action: 'Schedule emergency 1:1 coaching session today'
    },
    {
      rep: 'Team Average',
      issue: 'Budget qualification dropped to 42%',
      action: 'Implement mandatory budget qualification training'
    }
  ],
  growth: [
    {
      rep: 'Priya Patel',
      opportunity: 'Ready for advanced demo techniques',
      potential: 'Could reach 85%+ win rate with targeted training'
    },
    {
      rep: 'Raj Sharma',
      opportunity: 'Team mentorship potential',
      potential: 'Share his ROI-first approach in team meeting'
    }
  ]
};

// Export winningBehaviors for global access
export const winningBehaviors = [
  { 
    behavior: 'Ask for budget within 5 minutes',
    description: 'Early budget qualification filters unqualified leads',
    successRate: 89,
    adoption: 42
  },
  {
    behavior: 'Use ROI calculator in demo',
    description: 'Visual value demonstration doubles close rates',
    successRate: 94,
    adoption: 31
  },
  {
    behavior: 'Book next meeting before ending call',
    description: 'Momentum maintenance prevents deal stagnation',
    successRate: 87,
    adoption: 69
  },
  {
    behavior: 'Ask 8+ discovery questions',
    description: 'Deep discovery uncovers hidden pain points',
    successRate: 91,
    adoption: 38
  }
];