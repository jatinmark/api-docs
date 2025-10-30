'use client';

import { CallScore as CallScoreType } from '@/types/calliq';

interface CallScoreProps {
  score: CallScoreType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

const gradeColors = {
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

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function CallScore({ score, size = 'md', showBreakdown = false }: CallScoreProps) {
  // Add null checks
  if (!score) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Score Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`
            inline-flex items-center rounded-full border font-medium
            ${gradeColors[score.grade] || 'bg-gray-100 text-gray-800 border-gray-200'}
            ${sizeClasses[size]}
          `}
        >
          {score.grade || 'N/A'}
        </span>
        <span className={`font-semibold ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'} text-gray-900`}>
          {Math.round(score.overall_score || 0)}
        </span>
      </div>

      {/* Breakdown Preview */}
      {showBreakdown && score.scoring_breakdown && (
        <div className="flex gap-1">
          {Object.entries(score.scoring_breakdown).map(([key, component]) => {
            const percentage = component.score;
            let color = 'bg-gray-200';
            if (percentage >= 85) color = 'bg-green-500';
            else if (percentage >= 70) color = 'bg-blue-500';
            else if (percentage >= 55) color = 'bg-yellow-500';
            else if (percentage >= 40) color = 'bg-orange-500';
            else color = 'bg-red-500';

            return (
              <div key={key} className="flex flex-col items-center gap-1">
                <div className="w-2 h-8 bg-gray-100 rounded-sm overflow-hidden">
                  <div
                    className={`${color} rounded-sm transition-all duration-300`}
                    style={{ height: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 capitalize">
                  {key.replace('_', ' ').split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}