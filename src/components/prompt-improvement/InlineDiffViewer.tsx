import { InlineSegment } from '@/types/prompt-improvement'

interface InlineDiffViewerProps {
  segments: InlineSegment[]
}

/**
 * InlineDiffViewer - Renders inline diff segments with proper styling
 * Shows text changes inline with color-coded additions and deletions
 */
export const InlineDiffViewer = ({ segments }: InlineDiffViewerProps) => {
  return (
    <div className="inline-diff-container">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case 'equal':
            return (
              <span key={index} className="diff-equal">
                {segment.text}
              </span>
            )

          case 'delete':
            return (
              <span key={index} className="diff-delete">
                {segment.text}
              </span>
            )

          case 'insert':
            return (
              <span key={index} className="diff-insert">
                {segment.text}
              </span>
            )

          default:
            return (
              <span key={index}>
                {segment.text}
              </span>
            )
        }
      })}
    </div>
  )
}
