'use client'

import React from 'react'
import { ThreeKillerInsights } from '@/types/calliq'
import { AlertTriangle, Zap, Target, ChevronRight } from 'lucide-react'

interface ThreeKillerWidgetProps {
  insights: ThreeKillerInsights | undefined
  onClick?: () => void
  className?: string
  compact?: boolean
}

export const ThreeKillerWidget: React.FC<ThreeKillerWidgetProps> = ({
  insights,
  onClick,
  className = '',
  compact = false
}) => {
  if (!insights || (!insights.deal_killer && !insights.superpower && !insights.improvement_area)) {
    return null
  }

  const hasMultipleInsights = [
    insights.deal_killer,
    insights.superpower,
    insights.improvement_area
  ].filter(Boolean).length > 1

  if (compact) {
    // Ultra-compact view for lists
    return (
      <div 
        className={`flex items-center gap-2 text-xs ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
        onClick={onClick}
      >
        {insights.deal_killer && (
          <div className="flex items-center gap-1 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">{insights.deal_killer.impact}%</span>
          </div>
        )}
        {insights.superpower && (
          <div className="flex items-center gap-1 text-green-600">
            <Zap className="w-3 h-3" />
            <span className="font-medium">Top {insights.superpower.percentile}%</span>
          </div>
        )}
        {insights.improvement_area && (
          <div className="flex items-center gap-1 text-yellow-600">
            <Target className="w-3 h-3" />
            <span>Improve</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-gray-700">Three Killer Insights</h4>
        {onClick && (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </div>

      <div className={`${hasMultipleInsights ? 'space-y-2' : ''}`}>
        {insights.deal_killer && (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-3 h-3 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-700 truncate">
                  {insights.deal_killer.title}
                </span>
                <span className="flex-shrink-0 text-xs font-medium bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  {insights.deal_killer.impact}%{insights.deal_killer.impact_unit && !insights.deal_killer.impact_unit.toLowerCase().includes('impact') ? ' ' + insights.deal_killer.impact_unit.replace(/^%\s*/, '') : ' impact'}
                </span>
              </div>
              <p className="text-xs text-red-600 mt-0.5 line-clamp-1">
                Fix: {insights.deal_killer.fix}
              </p>
            </div>
          </div>
        )}

        {insights.superpower && (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-3 h-3 text-green-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-700 truncate">
                  {insights.superpower.title}
                </span>
                <span className="flex-shrink-0 text-xs font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  Top {insights.superpower.percentile}%
                </span>
              </div>
              <p className="text-xs text-green-600 mt-0.5 line-clamp-1">
                {insights.superpower.description}
              </p>
            </div>
          </div>
        )}

        {insights.improvement_area && (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                <Target className="w-3 h-3 text-yellow-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-yellow-700 block truncate">
                {insights.improvement_area.title}
              </span>
              <p className="text-xs text-yellow-600 mt-0.5">
                Current: {insights.improvement_area.current_metric} vs Target: {insights.improvement_area.benchmark_metric}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}