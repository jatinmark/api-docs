'use client'

import { useState } from 'react'
import { X, Sparkles, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineDiffViewer } from './InlineDiffViewer'
import { useImprovePromptFromCall, useApplyImprovements } from '@/hooks/usePromptImprovement'
import { ImprovePromptFromCallResponse } from '@/types/prompt-improvement'

interface CallBasedImprovementModalProps {
  isOpen: boolean
  onClose: () => void
  agentId: string
  agentName: string
  callId: string
}

/**
 * CallBasedImprovementModal - Modal for improving agent prompts based on existing call data
 * Uses call_id to automatically analyze call transcript from backend
 */
export const CallBasedImprovementModal = ({
  isOpen,
  onClose,
  agentId,
  agentName,
  callId,
}: CallBasedImprovementModalProps) => {
  const [userFeedback, setUserFeedback] = useState('')
  const [currentSuggestion, setCurrentSuggestion] =
    useState<ImprovePromptFromCallResponse | null>(null)
  const [isAiAnalysisCollapsed, setIsAiAnalysisCollapsed] = useState(true)

  // Hooks
  const improveMutation = useImprovePromptFromCall(agentId)
  const applyMutation = useApplyImprovements(agentId)

  if (!isOpen) return null

  const handleAnalyze = async () => {
    if (!callId) return

    try {
      const result = await improveMutation.mutateAsync({
        call_id: callId,
        user_feedback: userFeedback.trim() || undefined,
      })
      setCurrentSuggestion(result)
      setIsAiAnalysisCollapsed(true) // Reset to collapsed when new suggestion is generated
    } catch (error) {
      // Error is handled in the mutation
    }
  }

  const handleApply = async () => {
    if (!currentSuggestion) return

    try {
      await applyMutation.mutateAsync({
        suggestion_id: currentSuggestion.id,
      })
      // Reset state after successful apply
      setCurrentSuggestion(null)
      setUserFeedback('')
      // Close modal after successful application
      setTimeout(() => onClose(), 1500)
    } catch (error) {
      // Error is handled in the mutation
    }
  }

  const handleReject = () => {
    // Simply reset the state and allow user to try again
    setCurrentSuggestion(null)
    setUserFeedback('')
    setIsAiAnalysisCollapsed(true) // Reset collapsed state
  }

  // Utility function to get colored badge for improvement areas
  const getAreaColor = (area: string) => {
    const colors: Record<string, string> = {
      tone: 'bg-blue-100 text-blue-800',
      professionalism: 'bg-purple-100 text-purple-800',
      objection_handling: 'bg-orange-100 text-orange-800',
      closing: 'bg-green-100 text-green-800',
      qualification: 'bg-yellow-100 text-yellow-800',
      value_proposition: 'bg-indigo-100 text-indigo-800',
      rapport_building: 'bg-pink-100 text-pink-800',
      clarity: 'bg-cyan-100 text-cyan-800',
      empathy: 'bg-emerald-100 text-emerald-800',
      time_respect: 'bg-teal-100 text-teal-800',
    }
    return colors[area] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Improve Prompt from Call
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered analysis for {agentName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!currentSuggestion ? (
            <div className="space-y-6">
              {/* Info Message */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> The AI will analyze the call transcript and suggest improvements to the agent&apos;s prompt.
                  This typically takes 5-15 seconds.
                </p>
              </div>

              {/* Optional User Feedback */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specific Feedback (Optional)
                </label>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Describe specific issues you noticed (optional)...&#10;&#10;Examples:&#10;• Agent was too pushy, didn't build rapport&#10;• Poor objection handling for price concerns&#10;• Agent interrupted customer multiple times&#10;• No follow-up options offered"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-sm"
                  rows={5}
                  disabled={improveMutation.isPending}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Provide targeted feedback for better, faster improvements
                </p>
              </div>

              {/* Analyze Button */}
              <Button
                onClick={handleAnalyze}
                disabled={improveMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {improveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing call transcript... (5-15 seconds)
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze Call & Generate Improvements
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* AI Reasoning - Collapsible */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl overflow-hidden shadow-sm">
                {/* Clickable Header */}
                <button
                  onClick={() => setIsAiAnalysisCollapsed(!isAiAnalysisCollapsed)}
                  className="w-full flex items-center justify-between p-4 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-purple-600 p-1.5 rounded-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="text-base font-bold text-purple-900">
                      AI Analysis & Reasoning
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">
                      {isAiAnalysisCollapsed ? 'Click to expand' : 'Click to collapse'}
                    </span>
                    {isAiAnalysisCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-purple-600" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-purple-600" />
                    )}
                  </div>
                </button>

                {/* Collapsible Content */}
                {!isAiAnalysisCollapsed && (
                  <div className="px-4 pb-4 pt-2 border-t border-purple-200 bg-white">
                    <div className="prose prose-sm max-w-none">
                      <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {currentSuggestion.ai_reasoning}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Improvement Areas */}
              {currentSuggestion.improvement_areas && currentSuggestion.improvement_areas.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    Areas Improved
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSuggestion.improvement_areas.map((area, index) => (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getAreaColor(area)}`}
                      >
                        {area.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inline Diff Viewer */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Prompt Changes
                </h4>
                <InlineDiffViewer segments={currentSuggestion.diff.inline_segments} />
              </div>

              {/* Change Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  Change Summary
                </h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-green-600 font-semibold">
                      <CheckCircle className="h-4 w-4" />
                      {currentSuggestion.diff.inline_summary.total_additions}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Additions</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-red-600 font-semibold">
                      <XCircle className="h-4 w-4" />
                      {currentSuggestion.diff.inline_summary.total_deletions}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Deletions</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-blue-600 font-semibold">
                      <Sparkles className="h-4 w-4" />
                      {currentSuggestion.diff.inline_summary.total_modifications}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">Modifications</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {applyMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Applying improvements...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply All Changes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={applyMutation.isPending}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!currentSuggestion && (
          <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
            <Button onClick={onClose} variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
