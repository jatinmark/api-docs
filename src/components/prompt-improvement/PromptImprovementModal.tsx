import { useState } from 'react'
import { Agent } from '@/types'
import { X, Sparkles, History, GitCompare, Loader2, Upload, FileAudio } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DiffViewer } from './DiffViewer'
import { VersionHistory } from './VersionHistory'
import {
  useGenerateImprovements,
  useApplyImprovements,
  usePromptHistory,
  useRollbackPrompt,
  useRejectImprovements,
} from '@/hooks/usePromptImprovement'
import { GenerateImprovementsResponse, PromptVersion } from '@/types/prompt-improvement'
import { TranscriptionAPI } from '@/lib/transcription-api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

/**
 * Format text by converting escape sequences to actual characters
 * Handles: \n (newlines), \t (tabs), \r (carriage returns)
 */
const formatPromptText = (text: string): string => {
  if (!text) return ''

  return text
    .replace(/\\n/g, '\n')       // Convert \n to actual newlines
    .replace(/\\t/g, '\t')       // Convert \t to actual tabs
    .replace(/\\r/g, '\r')       // Convert \r to carriage returns
    .replace(/\\\\/g, '\\')      // Convert \\ to single backslash
}

interface PromptImprovementModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent
}

type Tab = 'generate' | 'history' | 'compare'

export const PromptImprovementModal = ({
  isOpen,
  onClose,
  agent,
}: PromptImprovementModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('generate')
  const [transcript, setTranscript] = useState('')
  const [userFeedback, setUserFeedback] = useState('')
  const [selectedChanges, setSelectedChanges] = useState<string[]>([])
  const [currentSuggestion, setCurrentSuggestion] =
    useState<GenerateImprovementsResponse | null>(null)
  const [viewingPrompt, setViewingPrompt] = useState<PromptVersion | null>(null)

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)
  const [transcriptionMessage, setTranscriptionMessage] = useState('')

  // Hooks
  const { tokens } = useAuth()
  const generateMutation = useGenerateImprovements(agent.id)
  const applyMutation = useApplyImprovements(agent.id)
  const rollbackMutation = useRollbackPrompt(agent.id)
  const rejectMutation = useRejectImprovements(agent.id)
  const { data: historyData, isLoading: historyLoading } = usePromptHistory(
    isOpen ? agent.id : null
  )

  if (!isOpen) return null

  const handleGenerate = async () => {
    if (!transcript.trim() && !userFeedback.trim()) {
      return
    }

    try {
      const result = await generateMutation.mutateAsync({
        transcript,
        user_feedback: userFeedback.trim() || undefined,
      })
      setCurrentSuggestion(result)
      setSelectedChanges([]) // Reset selected changes
    } catch (error) {
      // Error is handled in the mutation
    }
  }

  const handleFileUpload = async (file: File) => {
    // Create a FileList-like object for validation
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => (index === 0 ? file : null),
      [Symbol.iterator]: function* () {
        yield file
      }
    } as FileList

    // Validate file first
    const validation = TranscriptionAPI.validateFiles(fileList)

    if (!validation.valid) {
      toast.error(validation.error || 'Invalid file')
      return
    }

    setSelectedFile(file)
    setIsTranscribing(true)
    setTranscriptionProgress(0)
    setTranscriptionMessage('')

    try {
      const result = await TranscriptionAPI.transcribeFiles(
        fileList,
        tokens?.access_token || '',
        (message, percentage) => {
          setTranscriptionMessage(message)
          setTranscriptionProgress(percentage)
        }
      )

      // Check if transcription was successful
      if (result.data.successful === 0) {
        toast.error('Failed to transcribe audio. Please try again.')
        setSelectedFile(null)
        return
      }

      // Format and populate transcript field
      const formattedText = TranscriptionAPI.formatTranscriptionForPrompt(
        result.data.transcriptions
      )

      if (formattedText.trim()) {
        setTranscript(formattedText)
        toast.success('Audio transcribed successfully!')
      } else {
        toast.error('Transcription returned empty result')
        setSelectedFile(null)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to transcribe audio'
      toast.error(errorMessage)
      setSelectedFile(null)
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(0)
      setTranscriptionMessage('')
    }
  }

  const handleApply = async () => {
    if (!currentSuggestion) return

    try {
      await applyMutation.mutateAsync({
        suggestion_id: currentSuggestion.id,
        selected_changes: selectedChanges.length > 0 ? selectedChanges : undefined,
      })
      // Reset state after successful apply
      setCurrentSuggestion(null)
      setTranscript('')
      setUserFeedback('')
      setSelectedChanges([])
      // Switch to history tab to show the new version
      setActiveTab('history')
    } catch (error) {
      // Error is handled in the mutation
    }
  }

  const handleReject = async () => {
    if (!currentSuggestion) return

    // Confirm before rejecting
    if (
      confirm(
        'Are you sure you want to dismiss this suggestion? This action cannot be undone.'
      )
    ) {
      try {
        await rejectMutation.mutateAsync({
          suggestion_id: currentSuggestion.id,
        })
        // Reset state after successful rejection
        setCurrentSuggestion(null)
        setTranscript('')
        setUserFeedback('')
        setSelectedChanges([])
      } catch (error) {
        // Error is handled in the mutation
      }
    }
  }

  const handleRollback = async (version: number) => {
    if (confirm(`Are you sure you want to rollback to version ${version}?`)) {
      try {
        await rollbackMutation.mutateAsync({ target_version: version })
      } catch (error) {
        // Error is handled in the mutation
      }
    }
  }

  const handleChangeSelection = (changeId: string, selected: boolean) => {
    if (selected) {
      setSelectedChanges([...selectedChanges, changeId])
    } else {
      setSelectedChanges(selectedChanges.filter((id) => id !== changeId))
    }
  }

  const handleSelectAll = () => {
    if (!currentSuggestion) return
    const allChangeIds: string[] = []
    currentSuggestion.diff.sections.forEach((section, sectionIndex) => {
      section.changes.forEach((_, changeIndex) => {
        allChangeIds.push(`${sectionIndex}-${changeIndex}`)
      })
    })
    setSelectedChanges(allChangeIds)
  }

  const handleDeselectAll = () => {
    setSelectedChanges([])
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-600" />
              Improve Prompt
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered prompt optimization for {agent.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'generate' && (
            <div className="space-y-6">
              {/* Audio Upload Option */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Upload Audio File
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.mp4,.mpeg,.opus,.wma,.amr,.3gp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                      }}
                      disabled={isTranscribing}
                      className="hidden"
                    />
                    <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${
                      isTranscribing
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}>
                      <FileAudio className={`h-5 w-5 ${isTranscribing ? 'text-gray-400' : 'text-gray-600'}`} />
                      <span className={`text-sm ${isTranscribing ? 'text-gray-500' : 'text-gray-700'}`}>
                        {selectedFile ? selectedFile.name : 'Choose audio file to transcribe'}
                      </span>
                      <Upload className={`h-4 w-4 ${isTranscribing ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                  </label>

                  {selectedFile && !isTranscribing && (
                    <button
                      onClick={() => {
                        setSelectedFile(null)
                        setTranscript('')
                      }}
                      className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Transcription Progress */}
                {isTranscribing && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
                      <span className="font-medium">{transcriptionMessage}</span>
                      <span className="font-semibold">{transcriptionProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${transcriptionProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: MP3, WAV, M4A, OGG, WebM, AAC, FLAC (max 100MB)
                </p>
              </div>

              {/* Transcript Input */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Or Paste Call Transcript
                  </label>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Paste the call transcript here...&#10;&#10;Example:&#10;Agent: Hello, I'm calling from ABC Company...&#10;Customer: What's this about?&#10;Agent: ..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-sm"
                  rows={6}
                  disabled={isTranscribing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isTranscribing
                    ? 'Transcribing audio...'
                    : 'Paste a real conversation transcript for AI analysis'}
                </p>
              </div>

              {/* User Feedback (Optional) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specific Issues (Optional) 🆕
                </label>
                <textarea
                  value={userFeedback}
                  onChange={(e) => setUserFeedback(e.target.value)}
                  placeholder="Describe specific issues you noticed (optional but recommended)...&#10;&#10;Examples:&#10;• Agent was too pushy, didn't build rapport&#10;• Poor objection handling for price concerns&#10;• Agent interrupted customer 3 times&#10;• No follow-up options offered"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-sm"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Provide targeted feedback for better, faster improvements
                </p>
              </div>

              {/* Generate Button */}
              <div>
                <Button
                  onClick={handleGenerate}
                  disabled={
                    (!transcript.trim() && !userFeedback.trim()) ||
                    generateMutation.isPending ||
                    isTranscribing
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing transcript...
                    </>
                  ) : isTranscribing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Transcribing audio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Improvements
                    </>
                  )}
                </Button>
              </div>

              {/* AI Suggestions */}
              {currentSuggestion && (
                <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
                  {/* AI Reasoning */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-900 mb-2">
                      AI Analysis
                    </h4>
                    <pre className="text-sm text-purple-800 whitespace-pre-wrap font-sans m-0">
                      {formatPromptText(currentSuggestion.ai_reasoning)}
                    </pre>
                  </div>

                  {/* Diff Viewer */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Suggested Changes
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                          onClick={handleDeselectAll}
                          className="text-xs text-gray-600 hover:text-gray-700 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    <DiffViewer
                      diff={currentSuggestion.diff}
                      selectedChanges={selectedChanges}
                      onChangeSelection={handleChangeSelection}
                      showCheckboxes
                    />
                  </div>

                  {/* Apply Button */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={handleApply}
                      disabled={applyMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {applyMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Applying changes...
                        </>
                      ) : (
                        <>
                          Apply{' '}
                          {selectedChanges.length > 0
                            ? `Selected (${selectedChanges.length})`
                            : 'All'}{' '}
                          Changes
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={rejectMutation.isPending}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      {rejectMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Dismissing...
                        </>
                      ) : (
                        'Dismiss Suggestion'
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <VersionHistory
                  versions={historyData?.versions || []}
                  onRollback={handleRollback}
                  onViewPrompt={setViewingPrompt}
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600">
            Current version: v{historyData?.current_version_number || 1}
          </p>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>

      {/* View Prompt Modal */}
      {viewingPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Version {viewingPrompt.version} - Prompt
              </h3>
              <button
                onClick={() => setViewingPrompt(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-sm text-gray-900 whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded border border-gray-200">
                {viewingPrompt.prompt}
              </pre>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <Button onClick={() => setViewingPrompt(null)} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
