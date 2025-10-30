'use client';

import { CallScore } from '@/types/calliq';
import { 
  AlertCircleIcon, 
  CheckCircleIcon, 
  TrendingDownIcon,
  TrendingUpIcon,
  MessageSquareIcon,
  DollarSignIcon,
  ClockIcon,
  UserCheckIcon,
  TargetIcon,
  InfoIcon
} from 'lucide-react';

interface IntelligencePanelProps {
  score: CallScore | null | undefined;
  isLoading?: boolean;
}

interface KeyIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  impact?: string;
}

const issueIcons: Record<string, any> = {
  talk_ratio: MessageSquareIcon,
  budget_qualification: DollarSignIcon,
  discovery: ClockIcon,
  objection_handling: AlertCircleIcon,
  next_steps: TargetIcon,
  rapport_building: UserCheckIcon,
};

const severityColors = {
  high: 'bg-red-50 border-red-200 text-red-800',
  medium: 'bg-orange-50 border-orange-200 text-orange-800',
  low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function IntelligencePanel({ score, isLoading }: IntelligencePanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!score) {
    return null;
  }

  const scoreColor = score.overall_score >= 80 ? 'text-green-600' : 
                    score.overall_score >= 60 ? 'text-yellow-600' : 
                    score.overall_score >= 40 ? 'text-orange-600' : 
                    'text-red-600';

  const gradeColors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-800 border-green-200',
    'A': 'bg-green-100 text-green-800 border-green-200',
    'A-': 'bg-green-100 text-green-700 border-green-200',
    'B+': 'bg-blue-100 text-blue-800 border-blue-200',
    'B': 'bg-blue-100 text-blue-800 border-blue-200',
    'B-': 'bg-blue-100 text-blue-700 border-blue-200',
    'C+': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'C-': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'D+': 'bg-orange-100 text-orange-800 border-orange-200',
    'D': 'bg-orange-100 text-orange-800 border-orange-200',
    'F': 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header with Score */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">The Intelligence</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-gray-600">Call Score:</span>
                <span className={`text-3xl font-bold ${scoreColor}`}>
                  {score.overall_score}
                </span>
                <span className="text-lg text-gray-500">/100</span>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full border ${gradeColors[score.grade] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                Grade: {score.grade}
              </span>
            </div>
          </div>
          {/* Score Progress Ring */}
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke={score.overall_score >= 80 ? '#10b981' : 
                       score.overall_score >= 60 ? '#f59e0b' : 
                       score.overall_score >= 40 ? '#f97316' : '#ef4444'}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(score.overall_score / 100) * 176} 176`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold">{score.overall_score}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Issues Section */}
      {score.areas_for_improvement && score.areas_for_improvement.length > 0 && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-gray-900">Key Issues</h4>
          </div>
          <div className="space-y-3">
            {score.areas_for_improvement.map((item, index) => {
              // Handle both string and object formats
              const issue = typeof item === 'string' 
                ? { type: 'general', severity: 'medium' as const, description: item }
                : item as KeyIssue;
              
              const Icon = issueIcons[issue.type] || AlertCircleIcon;
              const severityClass = severityColors[issue.severity] || severityColors.medium;
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${severityClass} transition-all hover:shadow-sm`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium">{issue.description}</p>
                      {issue.impact && (
                        <p className="text-sm mt-1 opacity-75">Impact: {issue.impact}</p>
                      )}
                    </div>
                    {issue.severity === 'high' && (
                      <TrendingDownIcon className="h-4 w-4 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* What Worked Section */}
      {score.strengths && score.strengths.length > 0 && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">What Worked</h4>
          </div>
          <div className="space-y-2">
            {score.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scoring Breakdown Preview */}
      {score.scoring_breakdown && (
        <div className="px-6 pb-6">
          <button className="w-full group">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <InfoIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">View scoring breakdown</span>
              </div>
              <div className="flex gap-1">
                {Object.entries(score.scoring_breakdown).slice(0, 4).map(([key, component]) => {
                  const percentage = component.score;
                  let color = 'bg-gray-300';
                  if (percentage >= 85) color = 'bg-green-500';
                  else if (percentage >= 70) color = 'bg-blue-500';
                  else if (percentage >= 55) color = 'bg-yellow-500';
                  else if (percentage >= 40) color = 'bg-orange-500';
                  else color = 'bg-red-500';

                  return (
                    <div key={key} className="w-2 h-6 bg-gray-200 rounded-sm overflow-hidden">
                      <div
                        className={`${color} transition-all duration-300`}
                        style={{ height: `${percentage}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}