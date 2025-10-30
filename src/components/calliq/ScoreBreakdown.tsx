'use client';

import { ScoreBreakdown as ScoreBreakdownType, ScoreComponent } from '@/types/calliq';

interface ScoreBreakdownProps {
  breakdown: ScoreBreakdownType | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const componentLabels = {
  talk_ratio: 'Talk Ratio',
  budget_qualification: 'Budget Qualification',
  discovery_quality: 'Discovery Quality',
  objection_handling: 'Objection Handling',
  next_steps: 'Next Steps',
  rapport_building: 'Rapport Building',
};

const componentIcons = {
  talk_ratio: '🗣️',
  budget_qualification: '💰',
  discovery_quality: '🔍',
  objection_handling: '🛡️',
  next_steps: '📋',
  rapport_building: '🤝',
};

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 55) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-blue-500';
  if (score >= 55) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

function ScoreComponentCard({ 
  name, 
  component, 
  showDetails 
}: { 
  name: keyof ScoreBreakdownType; 
  component: ScoreComponent | null | undefined; 
  showDetails?: boolean;
}) {
  // Add null checks
  if (!component) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-sm text-gray-500">Component data not available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{componentIcons[name as keyof typeof componentIcons] || '📊'}</span>
          <h3 className="font-medium text-gray-900 text-sm">
            {componentLabels[name as keyof typeof componentLabels] || name}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold text-lg ${getScoreColor(component.score || 0)}`}>
            {Math.round(component.score || 0)}
          </span>
          <span className="text-xs text-gray-500">
            ({((component.weight || 0) * 100)}% weight)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
        <div
          className={`${getBarColor(component.score || 0)} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${component.score || 0}%` }}
        />
      </div>

      {/* Contribution */}
      <div className="text-xs text-gray-600 mb-3">
        Contributes {(component.weighted_contribution || 0).toFixed(1)} points to overall score
      </div>

      {/* Details */}
      {showDetails && component.details && (
        <div className="space-y-3">
          {component.details.strengths && component.details.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-green-800 mb-1">Strengths</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {component.details.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {component.details.weaknesses && component.details.weaknesses.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-red-800 mb-1">Areas for Improvement</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                {component.details.weaknesses.map((weakness, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {component.details.key_metrics && Object.keys(component.details.key_metrics).length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-800 mb-1">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(component.details.key_metrics).map(([key, value]) => (
                  <div key={key} className="text-xs">
                    <span className="text-gray-500 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="ml-1 font-medium text-gray-900">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ScoreBreakdown({ breakdown, size = 'md', showDetails = false }: ScoreBreakdownProps) {
  // Add null checks
  if (!breakdown) {
    return <div className="text-sm text-gray-500">Score breakdown not available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(breakdown).map(([key, component]) => (
          <ScoreComponentCard
            key={key}
            name={key as keyof ScoreBreakdownType}
            component={component}
            showDetails={showDetails}
          />
        ))}
      </div>
    </div>
  );
}