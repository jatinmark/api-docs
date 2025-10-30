'use client'

import React from 'react'
import { ThreeKillerInsights as ThreeKillerInsightsType } from '@/types/calliq'
import { AlertTriangle, CheckCircle, Zap, TrendingUp, AlertCircle, Target } from 'lucide-react'

interface ThreeKillerInsightsProps {
  insights: ThreeKillerInsightsType | undefined
  className?: string
  onRefresh?: () => void
  isLoading?: boolean
}

export const ThreeKillerInsights: React.FC<ThreeKillerInsightsProps> = ({
  insights,
  className = '',
  onRefresh,
  isLoading = false
}) => {
  // Utility function to safely render any value as a string
  const safeRender = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'boolean') return value.toString();
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };
  if (isLoading) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-28 bg-gray-100 rounded-xl"></div>
          <div className="h-28 bg-gray-100 rounded-xl"></div>
          <div className="h-28 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center ${className}`}>
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm mb-4">
          <AlertCircle className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-2">No Insights Available</h3>
        <p className="text-gray-500 text-xs mb-4 leading-relaxed">Three Killer insights not available for this call</p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
          >
            Generate Insights
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Deal Killer */}
      {insights.deal_killer && (
        <div className="group relative bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200/60 rounded-xl p-4 hover:shadow-lg hover:shadow-red-100/50 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-9 h-9 bg-red-500 rounded-lg flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-red-900 leading-tight">
                  Deal Killer: {safeRender(insights.deal_killer.title)}
                </h3>
                <span className="flex-shrink-0 ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-md shadow-sm">
                  -{safeRender(insights.deal_killer.impact)}%{insights.deal_killer.impact_unit && !insights.deal_killer.impact_unit.startsWith('%') ? ' ' + safeRender(insights.deal_killer.impact_unit) : insights.deal_killer.impact_unit?.substring(1)}
                </span>
              </div>
              
              {insights.deal_killer.current_metric && (
                <p className="text-red-700/80 text-xs mb-3 font-medium">
                  Current: {safeRender(insights.deal_killer.current_metric)}
                </p>
              )}
              
              <div className="bg-white/70 border border-red-200/40 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs">💡</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-red-800 mb-1">How to fix:</p>
                    <p className="text-red-700 text-xs leading-relaxed">{safeRender(insights.deal_killer.fix)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Superpower */}
      {insights.superpower && (
        <div className="group relative bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/60 rounded-xl p-4 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-green-900 leading-tight">
                  Your Superpower: {safeRender(insights.superpower.title)}
                </h3>
                <span className="flex-shrink-0 ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-green-500 text-white rounded-md shadow-sm">
                  Top {safeRender(insights.superpower.percentile)}%
                </span>
              </div>
              
              <p className="text-green-700/80 text-xs mb-3 leading-relaxed">
                {safeRender(insights.superpower.description)}
              </p>
              
              <div className="bg-white/70 border border-green-200/40 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-800 mb-1">Keep doing:</p>
                    <p className="text-green-700 text-xs leading-relaxed">{safeRender(insights.superpower.keep_doing)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Improvement Area */}
      {insights.improvement_area && (
        <div className="group relative bg-gradient-to-br from-amber-50 to-orange-100/50 border border-amber-200/60 rounded-xl p-4 hover:shadow-lg hover:shadow-amber-100/50 transition-all duration-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                <Target className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-amber-900 mb-2 leading-tight">
                Improvement Area: {safeRender(insights.improvement_area.title)}
              </h3>
              
              <div className="flex flex-wrap gap-3 text-xs mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-amber-700 font-medium">Current:</span>
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-medium">{safeRender(insights.improvement_area.current_metric)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-700 font-medium">Target:</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">{safeRender(insights.improvement_area.benchmark_metric)}</span>
                </div>
              </div>
              
              <p className="text-amber-700/80 text-xs font-medium mb-3 leading-relaxed">
                {safeRender(insights.improvement_area.comparison)}
              </p>
              
              <div className="bg-white/70 border border-amber-200/40 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-800 mb-2">Actions to take:</p>
                    <ul className="space-y-1">
                      {insights.improvement_area.actions && Array.isArray(insights.improvement_area.actions) ? 
                        insights.improvement_area.actions.map((action, index) => (
                          <li key={index} className="text-amber-700 text-xs flex items-start gap-2 leading-relaxed">
                            <span className="inline-block w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{safeRender(action)}</span>
                          </li>
                        ))
                        :
                        <li className="text-amber-700 text-xs flex items-start gap-2 leading-relaxed">
                          <span className="inline-block w-1 h-1 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>{safeRender(insights.improvement_area.actions)}</span>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp */}
      {insights.generated_at && (
        <div className="flex items-center justify-center pt-2">
          <div className="inline-flex items-center px-3 py-1 bg-gray-100/50 rounded-full">
            <span className="text-xs text-gray-500 font-medium">
              Generated {new Date(insights.generated_at).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}