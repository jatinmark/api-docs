'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { InteractionAttempt } from '@/types'
import { Phone, Clock, User, MessageSquare, Download, Brain, TrendingUp, TrendingDown, Minus, Target, AlertCircle, ThumbsUp, ThumbsDown, CheckCircle, Check, Calendar, Layers, Info, Star, XCircle, Lightbulb, Building, Flag, BarChart, FileText, Zap, Sparkles } from 'lucide-react'
import { formatDuration, formatDate } from '@/lib/utils'
import { processObjections, getObjectionCategoryColor, formatObjectionCategory, hasObjections } from '@/lib/objections-utils'
import { processNextAction, getUrgencyColor, getUrgencyGradient, getUrgencyIconColor, getActionTypeColor, getActionIcon, formatActionType, formatUrgency, isHighPriority } from '@/lib/next-action-utils'
import { useState } from 'react'
import { CallBasedImprovementModal } from '@/components/prompt-improvement/CallBasedImprovementModal'

interface CallDetailModalProps {
  call: InteractionAttempt & {
    aiInsightId?: string
    ai_insights?: {
      call_type?: 'first_call' | 'follow_up' | 'closing_call' | 'check_in'
      sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed'
      user_extraction_fields?: Record<string, any>
      ai_extraction_fields?: Record<string, any>
      next_action_items?: string[]
      objections?: Record<string, string>
      pain_points?: string[]
      call_outcome?: 'successful' | 'failed' | 'too_short_for_analysis' | 'follow_up' | 'rejected_ai' | 'wrong_number' | 'not_interested' | 'no_meaningful_engagement' | 'answered_interested' | 'answered_not_interested' | 'callback_requested' | 'voicemail' | 'busy' | 'no_answer' | 'do_not_call' | 'technical_issue'
      call_purpose?: string
      key_points?: string[]
      summary?: string
      recommended_stage?: string
      callback_requested?: boolean
      callback_requested_details?: string | null
      callback_time?: string | null
      do_not_call?: boolean
      do_not_call_reason?: string
      rejected_ai?: boolean
      system_responses?: {
        appropriate_responses?: string[]
        inappropriate_responses?: string[]
        missed_opportunities?: string[]
        repetitive_behavior?: string[]
        irrelevant_questions?: string[]
        response_quality_notes?: string
      }
      ai_response_validation?: string
      next_best_time?: string
      next_action?: string | {
        recommended: string
        reasoning?: string
        urgency?: 'immediate' | 'high' | 'medium' | 'low'
        details?: string
      }
      extraction_fields?: Record<string, any>
      company_context?: string
      business_context?: string
    }
  }
  isOpen: boolean
  onClose: () => void
}

export function CallDetailModal({ call, isOpen, onClose }: CallDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'ai-insights'>('details')
  const [showTranscript, setShowTranscript] = useState(false)
  const [showImprovePromptModal, setShowImprovePromptModal] = useState(false)

  // Toggle to show/hide Call Information and Lead Information sections
  // Set to true to show these sections, false to hide them
  const showCallAndLeadInfo = false

  // Toggle to show/hide Conversation Summary in AI Insights
  // Set to true to show it in AI Insights, false to hide it
  const showConversationSummaryInAIInsights = false

  // Toggle to show/hide Recommended Next Action in AI Insights
  // Set to true to show it in AI Insights, false to hide it
  const showRecommendedNextAction = false

  // Toggle to show/hide Company Context in AI Insights
  // Set to true to show it in AI Insights, false to hide it
  const showCompanyContext = false

  // Toggle to show/hide Key Points Discussed in AI Insights
  const showKeyPoints = false

  // Toggle to show/hide Customer Objections in AI Insights
  const showCustomerObjections = false

  // Toggle to show/hide Customer Pain Points & Needs in AI Insights
  const showPainPoints = false

  // Toggle to show/hide Business Context in AI Insights
  const showBusinessContext = false

  // Get the call ID to display
  // Prioritize call_id from AI insights endpoint, then fall back to provider IDs
  const callId = call.call_id || call.retell_call_id || call.bolna_call_id || call.id

  // AI insights are now directly available from the call object
  const hasAIInsights = !!call.ai_insights

  const getOutcomeColor = (outcome?: string) => {
    switch (outcome) {
      case 'answered': return 'bg-green-100 text-green-800'
      case 'no_answer': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Extract transcript and recording_url from the call object
  // Try multiple possible locations for transcript
  const transcript = call.raw_webhook_data?.transcript ||
                    call.raw_webhook_data?.call?.transcript ||
                    ''
  const recordingUrl = call.transcript_url || ''
  const callSummary = call.summary || 'No summary available'

  // Helper functions for AI Insights display
  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <ThumbsUp className="h-4 w-4 text-green-600" />
      case 'negative':
        return <ThumbsDown className="h-4 w-4 text-red-600" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInterestColor = (level?: number) => {
    if (!level) return 'text-gray-500'
    if (level >= 8) return 'text-green-600'
    if (level >= 6) return 'text-blue-600'
    if (level >= 4) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Helper function to check if prompt improvement should be disabled
  const shouldDisablePromptImprovement = () => {
    const outcome = call.ai_insights?.call_outcome
    const disabledOutcomes = ['too_short_for_analysis', 'failed', 'no_answer']
    return disabledOutcomes.includes(outcome || '')
  }

  // Helper function to get the reason why button is disabled
  const getDisabledReason = () => {
    const outcome = call.ai_insights?.call_outcome
    if (outcome === 'too_short_for_analysis') return 'Call too short for meaningful analysis'
    if (outcome === 'failed') return 'Call failed - no transcript available'
    if (outcome === 'no_answer') return 'No answer - no conversation to analyze'
    return ''
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Call Details" size="xl">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            <Phone className="h-4 w-4 inline-block mr-2" />
            Call Details
          </button>
          <button
            onClick={() => setActiveTab('ai-insights')}
            className={`${
              activeTab === 'ai-insights'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            <Brain className="h-4 w-4 inline-block mr-2" />
            AI Insights
          </button>
        </nav>
      </div>

      <div className="space-y-6">
        {/* Tab Content */}
        {activeTab === 'details' && (
          <>
            <div className={showCallAndLeadInfo ? "grid grid-cols-1 md:grid-cols-2 gap-8" : ""}>
            {showCallAndLeadInfo && (
              <div className="space-y-5">
                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4 text-base">Call Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Call ID:</span>
                      <span className="font-medium text-right text-xs">
                        {call.retell_call_id || call.bolna_call_id || call.id || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date/Time:</span>
                      <span className="font-medium">{formatDate(call.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {call.duration_seconds ? formatDuration(call.duration_seconds) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attempt:</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        #{call.attempt_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outcome:</span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOutcomeColor(call.outcome)}`}>
                        {call.outcome?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4 text-base">Lead Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lead ID:</span>
                      <span className="font-medium">#{call.lead_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Agent:</span>
                      <span className="font-medium">
                        {call.agent_name || 'Unknown Agent'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={showCallAndLeadInfo ? "space-y-5" : "space-y-5 max-w-4xl mx-auto"}>
              <div className="space-y-3">
                {recordingUrl && (
                  <div className="bg-white p-4 mr-3 rounded-lg border ml-8">
                    <p className="text-sm font-medium text-gray-700 mb-3">Recording</p>
                    <div className="pr-3">
                      <audio controls src={recordingUrl} className="w-full">
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
                {transcript && (
                  <div className="flex ml-8">
                    <Button variant="outline" size="sm" onClick={() => setShowTranscript(true)}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View Transcript
                    </Button>
                  </div>
                )}
              </div>
            </div>
            </div>
          </>
        )}

        {/* AI Insights Tab Content */}
        {activeTab === 'ai-insights' && (
          <div className="space-y-6">
            {!hasAIInsights ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-500">No AI insights available for this call</p>
                </div>
              </div>
            ) : (
              <>
                {/* Improve Prompt Button */}
                <div className="flex flex-col items-end gap-2">
                  <Button
                    onClick={() => setShowImprovePromptModal(true)}
                    disabled={shouldDisablePromptImprovement()}
                    className={`text-sm ${
                      shouldDisablePromptImprovement()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                    size="sm"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Prompt from This Call
                  </Button>
                  {shouldDisablePromptImprovement() && (
                    <p className="text-xs text-gray-500 italic">
                      {getDisabledReason()}
                    </p>
                  )}
                </div>

                {/* Call Overview and Extracted Information - Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left Column - Call Overview */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm border-l-4 border-red-500 pl-2">Call Overview</h4>

                    <div className="space-y-3">
                      {/* Call Type */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Call Type</span>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          call.ai_insights?.call_type === 'first_call' ? 'bg-blue-100 text-blue-800' :
                          call.ai_insights?.call_type === 'follow_up' ? 'bg-yellow-100 text-yellow-800' :
                          call.ai_insights?.call_type === 'closing_call' ? 'bg-green-100 text-green-800' :
                          call.ai_insights?.call_type === 'check_in' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {call.ai_insights?.call_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Unknown'}
                        </div>
                      </div>

                      {/* Callback */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Callback</span>
                        <span className={`text-xs font-medium ${
                          call.ai_insights?.callback_requested ? 'text-blue-900' : 'text-gray-600'
                        }`}>
                          {call.ai_insights?.callback_requested ? 'Requested' : 'Not Requested'}
                        </span>
                      </div>

                      {/* DNC Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">DNC Status</span>
                        <span className={`text-xs font-medium ${
                          call.ai_insights?.do_not_call ? 'text-red-900' : 'text-green-700'
                        }`}>
                          {call.ai_insights?.do_not_call ? 'DO NOT CALL' : 'Can Call'}
                        </span>
                      </div>

                      {/* Sentiment */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Sentiment</span>
                        <div className="flex items-center">
                          <span className={`text-lg mr-1 ${
                            call.ai_insights?.sentiment === 'positive' ? 'text-green-500' :
                            call.ai_insights?.sentiment === 'negative' ? 'text-red-500' :
                            'text-gray-400'
                          }`}>
                            {call.ai_insights?.sentiment === 'positive' ? '😊' :
                             call.ai_insights?.sentiment === 'negative' ? '😞' : '😐'}
                          </span>
                          <span className="text-xs font-medium text-gray-900">
                            {(call.ai_insights?.sentiment || 'Neutral').charAt(0).toUpperCase() + (call.ai_insights?.sentiment || 'Neutral').slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Extracted Information */}
                  {((call.ai_insights?.user_extraction_fields &&
                     Object.entries(call.ai_insights.user_extraction_fields).filter(([_, value]) => value !== null && value !== undefined).length > 0) ||
                    (call.ai_insights?.ai_extraction_fields &&
                     Object.entries(call.ai_insights.ai_extraction_fields).filter(([_, value]) => value !== null && value !== undefined).length > 0)) && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <h4 className="font-semibold text-gray-900 mb-3 text-sm border-l-4 border-blue-500 pl-2">Extracted Information</h4>

                      {/* Asked Information (User-Defined Fields) */}
                      {call.ai_insights?.user_extraction_fields &&
                       Object.entries(call.ai_insights.user_extraction_fields).filter(([_, value]) => value !== null && value !== undefined).length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">Asked Information</h5>
                          <div className="space-y-2">
                            {Object.entries(call.ai_insights.user_extraction_fields)
                              .filter(([_, value]) => value !== null && value !== undefined)
                              .map(([key, value]) => (
                              <div key={`user_field_${key}`} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                <span className="font-medium text-gray-900">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI-Extracted Fields */}
                      {call.ai_insights?.ai_extraction_fields &&
                       Object.entries(call.ai_insights.ai_extraction_fields).filter(([_, value]) => value !== null && value !== undefined).length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 mb-2">AI-Extracted Fields</h5>
                          <div className="space-y-2">
                            {Object.entries(call.ai_insights.ai_extraction_fields)
                              .filter(([_, value]) => value !== null && value !== undefined)
                              .map(([key, value]) => (
                              <div key={`ai_field_${key}`} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span>
                                <span className="font-medium text-gray-900">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Purpose */}
                {call.ai_insights?.call_purpose && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm border-l-4 border-orange-500 pl-2">Purpose</h4>
                    <p className="text-xs text-gray-700">
                      {call.ai_insights.call_purpose}
                    </p>
                  </div>
                )}

                {/* Conversation Summary */}
                {showConversationSummaryInAIInsights && (call.ai_insights?.summary || call.summary) && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm border-l-4 border-green-500 pl-2">Conversation Summary</h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {call.ai_insights?.summary || call.summary}
                    </p>
                  </div>
                )}

                {/* Key Points */}
                {showKeyPoints && call.ai_insights?.key_points && call.ai_insights.key_points.length > 0 && (
                  <div className="bg-white p-3 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center text-xs">
                      <Target className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                      Key Points Discussed
                    </h4>
                    <ul className="space-y-1.5">
                      {(call.ai_insights?.key_points || []).map((point: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-blue-500 mr-1.5 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-700">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Objections - Handles both array and object formats */}
                {showCustomerObjections && hasObjections(call.ai_insights?.objections) && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center text-xs">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-red-600" />
                      Customer Objections
                    </h4>
                    <ul className="space-y-2">
                      {processObjections(call.ai_insights?.objections).map((objection, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-red-500 mr-1.5 font-bold text-xs">!</span>
                          <div className="flex-1">
                            <span className="text-xs text-gray-700">{objection.text}</span>
                            {objection.category && objection.category !== 'other' && (
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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

                {/* Recommended Next Action - Enhanced with new structure */}
                {showRecommendedNextAction && call.ai_insights?.next_action && (() => {
                  const nextActionData = processNextAction(call.ai_insights.next_action);
                  if (!nextActionData) return null;

                  const urgencyGradient = getUrgencyGradient(nextActionData.urgency);
                  const isUrgent = isHighPriority(nextActionData);

                  return (
                    <div className={`bg-gradient-to-r ${urgencyGradient} p-3 rounded-xl border ${
                      isUrgent ? 'border-orange-300' : 'border-green-200'
                    } shadow-sm hover:shadow-md transition-shadow`}>
                      <h4 className="font-semibold text-gray-900 mb-2.5 flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <div className={`p-1.5 ${isUrgent ? 'bg-orange-100' : 'bg-green-100'} rounded-lg mr-2`}>
                            <Target className={`h-4 w-4 ${isUrgent ? 'text-orange-600' : 'text-green-600'}`} />
                          </div>
                          Recommended Next Action
                        </div>
                        {/* Urgency Badge */}
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center ${getUrgencyColor(nextActionData.urgency)}`}>
                          {nextActionData.urgency === 'immediate' && <Zap className="h-2.5 w-2.5 mr-0.5" />}
                          {formatUrgency(nextActionData.urgency)} Priority
                        </div>
                      </h4>

                      <div className="space-y-2.5">
                        {/* Action Type and Icon */}
                        <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{getActionIcon(nextActionData.action)}</span>
                              <div>
                                <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Recommended Action</p>
                                <p className="text-sm font-bold text-gray-900 mt-0.5">
                                  {formatActionType(nextActionData.action)}
                                </p>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActionTypeColor(nextActionData.action)}`}>
                              {nextActionData.action.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Reasoning */}
                          {nextActionData.reasoning && (
                            <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                              <p className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold mb-0.5">Why This Action?</p>
                              <p className="text-xs text-gray-800">{nextActionData.reasoning}</p>
                            </div>
                          )}
                        </div>

                        {/* Action Details */}
                        {nextActionData.details && (
                          <div className="bg-white p-2.5 rounded-lg border border-blue-200">
                            <div className="flex items-start">
                              <Info className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="text-[10px] text-blue-700 uppercase tracking-wider font-semibold mb-0.5">Action Details</p>
                                <p className="text-xs text-gray-900">{nextActionData.details}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Best Time and Action Items Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {/* Best Time to Call */}
                          {call.ai_insights?.next_best_time && (
                            <div className="bg-white p-2.5 rounded-lg border border-green-100">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-green-600 mr-2" />
                                <div>
                                  <p className="text-[10px] text-green-600 uppercase tracking-wider font-semibold">Best Time</p>
                                  <p className="text-xs font-medium text-gray-900 mt-0.5">
                                    {new Date(call.ai_insights.next_best_time).toLocaleString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Legacy Format Indicator */}
                          {nextActionData.isLegacyFormat && (
                            <div className="bg-yellow-50 p-2.5 rounded-lg border border-yellow-200">
                              <div className="flex items-center">
                                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                                <div>
                                  <p className="text-[10px] text-yellow-700 font-semibold">Limited Details</p>
                                  <p className="text-[10px] text-yellow-600 mt-0.5">Detailed reasoning not available</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Additional Next Steps - removed as they don't exist on InteractionAttempt */}

                {/* Next Best Call Time */}
                {call.ai_insights?.next_best_time && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-green-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-green-900 text-xs">Recommended Next Call Time</h4>
                        <p className="text-xs text-green-700 mt-0.5">
                          {new Date(call.ai_insights.next_best_time).toLocaleString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pain Points & Needs */}
                {showPainPoints && call.ai_insights?.pain_points && call.ai_insights.pain_points.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2 flex items-center text-xs">
                      <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
                      Customer Pain Points & Needs
                    </h4>
                    <ul className="space-y-1.5">
                      {call.ai_insights.pain_points.map((point: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-amber-600 mt-0.5 mr-1.5 text-xs">•</span>
                          <span className="text-xs text-amber-800">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competitor Mentions */}
                {call.ai_insights?.competitor_mentions && call.ai_insights.competitor_mentions.length > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900 mb-2 flex items-center text-xs">
                      <Building className="h-3.5 w-3.5 mr-1.5" />
                      Competitor Mentions
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {call.ai_insights.competitor_mentions.map((competitor: string, index: number) => (
                        <span key={index} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {competitor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Context */}
                {showBusinessContext && call.ai_insights?.business_context && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center text-xs">
                      <Building className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                      Business Context
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {call.ai_insights.business_context}
                    </p>
                  </div>
                )}

                {/* Company Context */}
                {showCompanyContext && call.ai_insights?.company_context && (
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-200">
                    <h4 className="font-medium text-indigo-900 mb-2 flex items-center text-xs">
                      <Info className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
                      Company Context
                    </h4>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      {call.ai_insights.company_context}
                    </p>
                  </div>
                )}

                {/* Categorized Objections */}
                {call.ai_insights?.categorized_objections && call.ai_insights.categorized_objections.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center text-xs">
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Categorized Objections
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {call.ai_insights.categorized_objections.map((objection: string, index: number) => (
                        <span key={index} className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          objection === 'price_concerns' ? 'bg-red-100 text-red-800' :
                          objection === 'timing_issues' ? 'bg-orange-100 text-orange-800' :
                          objection === 'competitor_preference' ? 'bg-purple-100 text-purple-800' :
                          objection === 'no_need' ? 'bg-gray-100 text-gray-800' :
                          objection === 'decision_maker_unavailable' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {objection.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Response Validation */}
                {call.ai_insights?.ai_response_validation && (
                  <div className={`p-3 rounded-lg border ${
                    call.ai_insights.ai_response_validation === 'appropriate_responses'
                      ? 'bg-green-50 border-green-200'
                      : call.ai_insights.ai_response_validation === 'missed_opportunities'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <h4 className="font-medium mb-1.5 flex items-center text-xs">
                      {call.ai_insights.ai_response_validation === 'appropriate_responses' ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-600" />
                          <span className="text-green-900">AI Response Quality: Good</span>
                        </>
                      ) : call.ai_insights.ai_response_validation === 'missed_opportunities' ? (
                        <>
                          <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-yellow-600" />
                          <span className="text-yellow-900">AI Response Quality: Missed Opportunities</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-600" />
                          <span className="text-red-900">AI Response Quality: Technical Issues</span>
                        </>
                      )}
                    </h4>
                  </div>
                )}


                {/* Do Not Call Information - Only show when do_not_call is true */}
                {call.ai_insights?.do_not_call === true && (
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 p-3 rounded-xl border border-red-200 shadow-sm">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <div className="p-1.5 bg-red-100 rounded-lg">
                          <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="font-semibold text-red-900 mb-2 text-sm">Do Not Call Status</h4>
                        <div className="space-y-2">
                          {/* DNC Status */}
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-red-700 mr-1.5">Status:</span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-800">
                              DO NOT CALL
                            </span>
                          </div>

                          {/* DNC Reason */}
                          {call.ai_insights?.do_not_call_reason && (
                            <div>
                              <span className="text-xs font-medium text-red-700">Reason:</span>
                              <p className="text-xs text-gray-900 mt-0.5 bg-white p-2 rounded-lg border border-red-100">
                                {call.ai_insights.do_not_call_reason}
                              </p>
                            </div>
                          )}

                          {/* Warning Message */}
                          <div className="bg-red-100 p-2 rounded-lg">
                            <p className="text-[10px] text-red-800 font-medium">
                              ⚠️ This contact has requested to be removed from the call list. Do not attempt further contact.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejected AI Alert */}
                {call.ai_insights?.rejected_ai && (
                  <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-700 mr-1.5" />
                      <h4 className="text-red-900 font-semibold text-xs">AI Rejected by Customer</h4>
                    </div>
                    {call.ai_insights?.rejected_ai_details && (
                      <p className="text-xs text-red-700 mt-1.5 ml-5">
                        {call.ai_insights.rejected_ai_details}
                      </p>
                    )}
                  </div>
                )}

              </>
            )}
          </div>
        )}

        {/* Transcript Modal */}
        {showTranscript && (
          <Modal isOpen={showTranscript} onClose={() => setShowTranscript(false)} title="Call Transcript" size="lg">
            <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {transcript.trim() || 'No transcript available'}
              </pre>
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowTranscript(false)}>
                Close
              </Button>
            </div>
          </Modal>
        )}

        <div className="flex justify-end pt-4 pb-2">
          <Button variant="outline" onClick={onClose} className="px-6">
            Close
          </Button>
        </div>
      </div>

      {/* Call-Based Improvement Modal */}
      {showImprovePromptModal && (
        <CallBasedImprovementModal
          isOpen={showImprovePromptModal}
          onClose={() => setShowImprovePromptModal(false)}
          agentId={call.agent_id}
          agentName={call.agent_name || 'Unknown Agent'}
          callId={callId}
        />
      )}
    </Modal>
  )
}