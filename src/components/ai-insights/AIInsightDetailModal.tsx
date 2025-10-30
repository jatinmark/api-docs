'use client'

import { useState } from 'react'
import { useAIInsightDetail } from '@/hooks/useAIInsights'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatDuration } from '@/lib/utils'
import { processObjections, getObjectionCategoryColor, formatObjectionCategory, hasObjections } from '@/lib/objections-utils'
import {
  Phone, User, Bot, Brain, TrendingUp, TrendingDown, Minus,
  Clock, MessageSquare, Target, AlertCircle, ChevronRight,
  Loader2, Download, Play
} from 'lucide-react'

interface AIInsightDetailModalProps {
  insightId: string
  isOpen: boolean
  onClose: () => void
}

export function AIInsightDetailModal({ insightId, isOpen, onClose }: AIInsightDetailModalProps) {
  const { data: insight, isLoading } = useAIInsightDetail(insightId)
  const [activeTab, setActiveTab] = useState<'overview' | 'extracted' | 'transcript'>('overview')

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." size="xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Modal>
    )
  }

  if (!insight) {
    return null
  }

  const getSentimentIcon = () => {
    switch (insight.sentiment) {
      case 'positive':
        return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-600" />
      default:
        return <Minus className="h-5 w-5 text-gray-600" />
    }
  }

  const getSentimentColor = () => {
    switch (insight.sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Insight Details" size="xl">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('extracted')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'extracted'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Extracted Info
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'transcript'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Full Analysis
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Call Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date/Time:</span>
                    <span className="font-medium">{formatDate(insight.call_timestamp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">
                      {insight.duration_seconds ? formatDuration(insight.duration_seconds) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{insight.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Attempt #:</span>
                    <span className="font-medium">{insight.attempt_number}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Participants
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lead:</span>
                    <span className="font-medium">{insight.lead_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{insight.lead_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agent:</span>
                    <span className="font-medium">{insight.agent_name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Analysis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Call Purpose</p>
                  <p className="text-sm font-medium text-gray-900">
                    {insight.call_purpose || 'Not identified'}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Sentiment</p>
                  <div className="flex items-center">
                    {getSentimentIcon()}
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor()}`}>
                      {insight.sentiment || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Interest Level</p>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {insight.interest_level || '?'}/10
                    </span>
                    <div className="ml-3 flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                          style={{ width: `${(insight.interest_level || 0) * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Next Action</p>
                  <p className="text-sm font-medium text-gray-900">
                    {insight.next_action || 'None recommended'}
                  </p>
                </div>
              </div>

              {/* Summary */}
              {insight.summary && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-1">Summary</p>
                  <p className="text-sm text-gray-800 bg-white rounded p-3">
                    {insight.summary}
                  </p>
                </div>
              )}

              {/* Key Points */}
              {insight.key_points && insight.key_points.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Key Points</p>
                  <ul className="space-y-1">
                    {insight.key_points.map((point, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-800">
                        <ChevronRight className="h-4 w-4 text-blue-500 mr-1 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Objections - Handles both array and object formats */}
              {hasObjections(insight.objections) && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Objections Raised</p>
                  <ul className="space-y-2">
                    {processObjections(insight.objections).map((objection, index) => (
                      <li key={index} className="flex items-start text-sm text-gray-800">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-1 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span>{objection.text}</span>
                          {objection.category && objection.category !== 'other' && (
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              getObjectionCategoryColor(objection.category)
                            }`}>
                              {formatObjectionCategory(objection.category)}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Recording */}
            {insight.recording_url && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Play className="h-4 w-4 mr-2" />
                  Call Recording
                </h3>
                <audio controls className="w-full">
                  <source src={insight.recording_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extracted' && (
          <div className="space-y-4">
            {insight.extracted_info && Object.keys(insight.extracted_info).length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Extracted Information</h3>
                <div className="space-y-2">
                  {Object.entries(insight.extracted_info).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm text-gray-900 font-medium">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No information extracted from this call</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {insight.ai_insights ? (
              <div className="space-y-6">
                {/* Parse and display AI insights in a structured format */}
                {(() => {
                  const insights = typeof insight.ai_insights === 'string'
                    ? JSON.parse(insight.ai_insights)
                    : insight.ai_insights;

                  return (
                    <>
                      {/* Call Summary Section */}
                      {insights.summary && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                            Call Summary
                          </h3>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {insights.summary}
                          </p>
                        </div>
                      )}

                      {/* Key Discussion Points */}
                      {insights.key_points && insights.key_points.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Target className="h-5 w-5 mr-2 text-green-600" />
                            Key Discussion Points
                          </h3>
                          <ul className="space-y-2">
                            {insights.key_points.map((point: string, index: number) => (
                              <li key={index} className="flex items-start">
                                <ChevronRight className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-gray-700">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Customer Sentiment & Interest */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {insights.sentiment && (
                          <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <Brain className="h-5 w-5 mr-2 text-purple-600" />
                              Customer Sentiment
                            </h3>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Overall Mood:</span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                insights.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                                insights.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {insights.sentiment || 'Neutral'}
                              </span>
                            </div>
                          </div>
                        )}

                        {insights.interest_level && (
                          <div className="bg-white border border-gray-200 rounded-lg p-5">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                              Interest Level
                            </h3>
                            <div className="flex items-center">
                              <span className="text-3xl font-bold text-blue-600">
                                {insights.interest_level}/10
                              </span>
                              <div className="ml-4 flex-1">
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                  <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500"
                                    style={{ width: `${insights.interest_level * 10}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Objections & Concerns - Handles both formats */}
                      {hasObjections(insights.objections) && (
                        <div className="bg-white border border-yellow-200 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <AlertCircle className="h-5 w-5 mr-2 text-yellow-600" />
                            Objections & Concerns
                          </h3>
                          <ul className="space-y-2">
                            {processObjections(insights.objections).map((objection, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-yellow-500 mr-2">•</span>
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700">{objection.text}</span>
                                  {objection.category && objection.category !== 'other' && (
                                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      getObjectionCategoryColor(objection.category)
                                    }`}>
                                      {formatObjectionCategory(objection.category)}
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Next Steps & Actions */}
                      {insights.next_action && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-blue-600" />
                            Recommended Next Steps
                          </h3>
                          <p className="text-sm text-gray-700 font-medium">
                            {insights.next_action}
                          </p>
                        </div>
                      )}

                      {/* Additional Insights */}
                      {insights.extracted_info && Object.keys(insights.extracted_info).length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(insights.extracted_info).map(([key, value]) => (
                              <div key={key} className="flex flex-col">
                                <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                                  {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm text-gray-900 font-medium">
                                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Call Metrics */}
                      {(insights.duration_seconds || insights.attempt_number) && (
                        <div className="bg-gray-50 rounded-lg p-5">
                          <h3 className="font-semibold text-gray-900 mb-3">Call Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {insights.duration_seconds && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">
                                  {Math.floor(insights.duration_seconds / 60)}:{(insights.duration_seconds % 60).toString().padStart(2, '0')}
                                </p>
                                <p className="text-xs text-gray-500">Duration</p>
                              </div>
                            )}
                            {insights.attempt_number && (
                              <div className="text-center">
                                <p className="text-2xl font-bold text-gray-900">#{insights.attempt_number}</p>
                                <p className="text-xs text-gray-500">Attempt</p>
                              </div>
                            )}
                            {insights.status && (
                              <div className="text-center">
                                <p className="text-lg font-bold text-gray-900 capitalize">{insights.status}</p>
                                <p className="text-xs text-gray-500">Status</p>
                              </div>
                            )}
                            {insights.call_timestamp && (
                              <div className="text-center">
                                <p className="text-sm font-medium text-gray-900">
                                  {new Date(insights.call_timestamp).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-gray-500">Date</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Raw Data Toggle (Optional) */}
                      <details className="bg-gray-50 rounded-lg p-4">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          View Raw Data
                        </summary>
                        <pre className="mt-3 text-xs text-gray-600 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(insights, null, 2)}
                        </pre>
                      </details>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No detailed analysis available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}