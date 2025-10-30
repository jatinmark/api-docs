import { Diff, DiffSection, DiffChange } from '@/types/prompt-improvement'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

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

/**
 * Smart diff chunk interface
 */
interface DiffChunk {
  type: 'unchanged' | 'changed'
  deletions: string[]
  additions: string[]
  startLine: number
  linesCount: number
}

/**
 * Perform smart line-by-line diff to identify actual changes
 * Only shows changed sections with context, not entire text
 */
const performSmartDiff = (originalText: string, newText: string, contextLines: number = 3): DiffChunk[] => {
  const originalLines = originalText.split('\n')
  const newLines = newText.split('\n')

  const chunks: DiffChunk[] = []
  let i = 0
  let j = 0

  while (i < originalLines.length || j < newLines.length) {
    // Find next difference
    const unchangedStart = i
    while (i < originalLines.length && j < newLines.length && originalLines[i] === newLines[j]) {
      i++
      j++
    }

    // Add unchanged chunk if significant
    const unchangedCount = i - unchangedStart
    if (unchangedCount > contextLines * 2 + 1) {
      // Large unchanged section - only show context
      if (chunks.length === 0) {
        // First chunk - show last N lines as context
        chunks.push({
          type: 'unchanged',
          deletions: [],
          additions: [],
          startLine: unchangedStart,
          linesCount: Math.min(contextLines, unchangedCount)
        })
      } else {
        // Middle chunk - show first N + last N lines
        chunks.push({
          type: 'unchanged',
          deletions: [],
          additions: [],
          startLine: unchangedStart,
          linesCount: contextLines * 2
        })
      }
    } else if (unchangedCount > 0) {
      // Small unchanged section - show all
      chunks.push({
        type: 'unchanged',
        deletions: [],
        additions: [],
        startLine: unchangedStart,
        linesCount: unchangedCount
      })
    }

    // Find changed section
    const changeStart = { i, j }
    while (i < originalLines.length && j < newLines.length && originalLines[i] !== newLines[j]) {
      i++
      j++
    }

    // Handle deletions (more original lines)
    while (i < originalLines.length && (j >= newLines.length || originalLines[i] !== newLines[j])) {
      i++
    }

    // Handle additions (more new lines)
    while (j < newLines.length && (i >= originalLines.length || originalLines[i] !== newLines[j])) {
      j++
    }

    // Add changed chunk
    if (i > changeStart.i || j > changeStart.j) {
      chunks.push({
        type: 'changed',
        deletions: originalLines.slice(changeStart.i, i),
        additions: newLines.slice(changeStart.j, j),
        startLine: changeStart.i,
        linesCount: Math.max(i - changeStart.i, j - changeStart.j)
      })
    }
  }

  return chunks
}

/**
 * Component to render smart modification view with collapsible unchanged sections
 */
const SmartModificationView = ({
  change,
  changeId,
  isSelected,
  showCheckbox,
  onChangeSelection
}: {
  change: DiffChange
  changeId: string
  isSelected: boolean
  showCheckbox: boolean
  onChangeSelection?: (changeId: string, selected: boolean) => void
}) => {
  const formattedOriginal = formatPromptText(change.original_text || '')
  const formattedNew = formatPromptText(change.new_text || '')
  const originalLines = formattedOriginal.split('\n')
  const newLines = formattedNew.split('\n')

  const LARGE_CHANGE_THRESHOLD = 50
  const isLargeChange = originalLines.length + newLines.length > LARGE_CHANGE_THRESHOLD

  // State for managing expanded chunks
  const [expandedChunks, setExpandedChunks] = useState<Set<number>>(new Set())

  // Use smart diff for large changes
  const chunks = isLargeChange
    ? performSmartDiff(formattedOriginal, formattedNew, 3)
    : null

  const toggleChunk = (chunkIndex: number) => {
    const newExpanded = new Set(expandedChunks)
    if (newExpanded.has(chunkIndex)) {
      newExpanded.delete(chunkIndex)
    } else {
      newExpanded.add(chunkIndex)
    }
    setExpandedChunks(newExpanded)
  }

  // Render simple diff for small changes
  if (!isLargeChange || !chunks) {
    return (
      <div key={changeId}>
        <div className="flex items-start">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onChangeSelection?.(changeId, e.target.checked)}
              className="diff-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 mr-2"
            />
          )}
          <div className="flex-1">
            {originalLines.map((line, lineIndex) => (
              <div key={`${changeId}-del-${lineIndex}`} className="diff-line deletion">
                <span className="diff-prefix">-</span>
                <span className="diff-content">{line}</span>
              </div>
            ))}
            {newLines.map((line, lineIndex) => (
              <div key={`${changeId}-add-${lineIndex}`} className="diff-line addition">
                <span className="diff-prefix">+</span>
                <span className="diff-content">{line}</span>
              </div>
            ))}
            {change.reason && (
              <div className="diff-reason">
                <span className="text-xs">💡 {change.reason}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render smart diff for large changes
  return (
    <div key={changeId}>
      <div className="flex items-start">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onChangeSelection?.(changeId, e.target.checked)}
            className="diff-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 mr-2"
          />
        )}
        <div className="flex-1">
          {chunks.map((chunk, chunkIndex) => {
            if (chunk.type === 'unchanged') {
              const isExpanded = expandedChunks.has(chunkIndex)
              const hasHiddenLines = chunk.linesCount < (originalLines.slice(chunk.startLine, chunk.startLine + chunk.linesCount).length)

              return (
                <div key={`chunk-${chunkIndex}`}>
                  {hasHiddenLines && (
                    <button
                      onClick={() => toggleChunk(chunkIndex)}
                      className="diff-expand-button w-full py-1 px-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-2"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {isExpanded ? 'Hide' : 'Show'} unchanged lines
                    </button>
                  )}
                  {isExpanded && (
                    <>
                      {originalLines.slice(chunk.startLine, chunk.startLine + chunk.linesCount).map((line, lineIndex) => (
                        <div key={`${changeId}-ctx-${chunk.startLine + lineIndex}`} className="diff-line context">
                          <span className="diff-prefix"> </span>
                          <span className="diff-content">{line}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )
            }

            // Render changed chunk
            return (
              <div key={`chunk-${chunkIndex}`}>
                {chunk.deletions.map((line, lineIndex) => (
                  <div key={`${changeId}-del-${chunkIndex}-${lineIndex}`} className="diff-line deletion">
                    <span className="diff-prefix">-</span>
                    <span className="diff-content">{line}</span>
                  </div>
                ))}
                {chunk.additions.map((line, lineIndex) => (
                  <div key={`${changeId}-add-${chunkIndex}-${lineIndex}`} className="diff-line addition">
                    <span className="diff-prefix">+</span>
                    <span className="diff-content">{line}</span>
                  </div>
                ))}
              </div>
            )
          })}
          {change.reason && (
            <div className="diff-reason">
              <span className="text-xs">💡 {change.reason}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface DiffViewerProps {
  diff: Diff
  selectedChanges?: string[]
  onChangeSelection?: (changeId: string, selected: boolean) => void
  showCheckboxes?: boolean
}

export const DiffViewer = ({
  diff,
  selectedChanges = [],
  onChangeSelection,
  showCheckboxes = false,
}: DiffViewerProps) => {
  const generateChangeId = (sectionIndex: number, changeIndex: number): string => {
    return `${sectionIndex}-${changeIndex}`
  }

  const renderDiffLine = (
    type: 'addition' | 'deletion' | 'context',
    text: string,
    changeId: string,
    reason?: string,
    showCheckbox: boolean = false
  ) => {
    const isSelected = selectedChanges.includes(changeId)
    const prefix = type === 'addition' ? '+' : type === 'deletion' ? '-' : ' '

    // Split text into individual lines for line-by-line rendering
    const formattedText = formatPromptText(text)
    const lines = formattedText.split('\n')

    return (
      <div key={changeId}>
        <div className="flex items-start">
          {showCheckbox && showCheckboxes && type !== 'context' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onChangeSelection?.(changeId, e.target.checked)}
              className="diff-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1 mr-2"
            />
          )}
          <div className="flex-1">
            {lines.map((line, lineIndex) => (
              <div key={`${changeId}-line-${lineIndex}`} className={`diff-line ${type}`}>
                <span className="diff-prefix">{prefix}</span>
                <span className="diff-content">{line}</span>
              </div>
            ))}
          </div>
        </div>
        {reason && (
          <div className="diff-reason">
            <span className="text-xs">💡 {reason}</span>
          </div>
        )}
      </div>
    )
  }

  const renderChange = (change: DiffChange, sectionIndex: number, changeIndex: number) => {
    const changeId = generateChangeId(sectionIndex, changeIndex)

    switch (change.type) {
      case 'addition':
        return renderDiffLine(
          'addition',
          change.new_text || '',
          changeId,
          change.reason,
          true  // Show checkbox
        )

      case 'deletion':
        return renderDiffLine(
          'deletion',
          change.original_text || '',
          changeId,
          change.reason,
          true  // Show checkbox
        )

      case 'modification':
        return <SmartModificationView
          change={change}
          changeId={changeId}
          isSelected={selectedChanges.includes(changeId)}
          showCheckbox={showCheckboxes}
          onChangeSelection={onChangeSelection}
        />

      default:
        return null
    }
  }

  const renderSection = (section: DiffSection, sectionIndex: number) => {
    return (
      <div key={sectionIndex} className="mb-4">
        <div className="diff-section-header">
          {section.section_name}
          <span className="ml-2 text-xs">
            ({section.changes.length} change{section.changes.length !== 1 ? 's' : ''})
          </span>
        </div>
        <div>
          {section.changes.map((change, changeIndex) =>
            renderChange(change, sectionIndex, changeIndex)
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="diff-summary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-green-600">
                +{diff.summary.total_additions}
              </span>
              <span className="text-xs text-gray-600">additions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-red-600">
                -{diff.summary.total_deletions}
              </span>
              <span className="text-xs text-gray-600">deletions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-yellow-600">
                {diff.summary.total_modifications}
              </span>
              <span className="text-xs text-gray-600">modifications</span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${
                diff.summary.estimated_impact === 'high'
                  ? 'bg-green-100 text-green-800'
                  : diff.summary.estimated_impact === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {diff.summary.estimated_impact.toUpperCase()} IMPACT
            </span>
          </div>
        </div>
        {diff.summary.improvement_areas.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex flex-wrap gap-2">
              {diff.summary.improvement_areas.map((area, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {area.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diff Container */}
      <div className="diff-viewer-container">
        {diff.sections.map((section, index) => renderSection(section, index))}
      </div>
    </div>
  )
}
