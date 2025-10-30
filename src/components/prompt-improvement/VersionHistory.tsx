import { PromptVersion } from '@/types/prompt-improvement'
import { History, RotateCcw, FileText, Check, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface VersionHistoryProps {
  versions: PromptVersion[]
  onCompare?: (versionA: number, versionB: number) => void
  onRollback?: (version: number) => void
  onViewPrompt?: (version: PromptVersion) => void
}

export const VersionHistory = ({
  versions,
  onCompare,
  onRollback,
  onViewPrompt,
}: VersionHistoryProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'ai_improved':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            AI Improved
          </span>
        )
      case 'manual':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Manual
          </span>
        )
      case 'rollback':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
            Rollback
          </span>
        )
      default:
        return null
    }
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No version history available yet.</p>
        <p className="text-sm text-gray-500 mt-1">
          Version history will appear after you make changes to the prompt.
        </p>
      </div>
    )
  }

  const sortedVersions = [...versions].sort((a, b) => b.version - a.version)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Version History
        </h3>
        <p className="text-sm text-gray-600">
          {versions.length} version{versions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {sortedVersions.map((version) => (
          <div
            key={version.version}
            className={`border rounded-lg p-4 transition-all ${
              version.is_current
                ? 'border-blue-500 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  v{version.version}
                </span>
                {version.is_current && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Current
                  </span>
                )}
                {getSourceBadge(version.source)}
              </div>
              <div className="flex items-center gap-2">
                {!version.is_current && onRollback && (
                  <Button
                    onClick={() => onRollback(version.version)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                )}
                {onViewPrompt && (
                  <Button
                    onClick={() => onViewPrompt(version)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View
                  </Button>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-2">
              <p className="flex items-center gap-1">
                <span className="text-gray-500">Created:</span>
                {formatDate(version.created_at)}
              </p>
              {version.parent_version !== null && (
                <p className="flex items-center gap-1 text-xs mt-1">
                  <span className="text-gray-500">Based on:</span>v
                  {version.parent_version}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded p-3 mt-2">
              <p className="text-xs text-gray-500 mb-1">Prompt Preview</p>
              <p className="text-sm text-gray-900 line-clamp-2">{version.prompt}</p>
            </div>

            {version.metadata &&
              Object.keys(version.metadata).length > 0 &&
              version.metadata.improvement_source && (
                <div className="mt-2 text-xs text-gray-500">
                  <p>Source: {version.metadata.improvement_source}</p>
                </div>
              )}
          </div>
        ))}
      </div>

      {versions.length > 1 && onCompare && (
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Compare Versions</h4>
          <p className="text-xs text-gray-600 mb-3">
            Select two versions to see what changed between them
          </p>
          <div className="flex gap-2">
            <select className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select version A...</option>
              {sortedVersions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} - {v.source}
                  {v.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <span className="self-center text-gray-500">vs</span>
            <select className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Select version B...</option>
              {sortedVersions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} - {v.source}
                  {v.is_current ? ' (current)' : ''}
                </option>
              ))}
            </select>
            <Button size="sm" variant="primary">
              Compare
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
