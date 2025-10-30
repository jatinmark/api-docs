// Prompt Improvement Feature Types
// Based on PROMPT_IMPROVEMENT_API.md

export interface DiffChange {
  type: 'addition' | 'deletion' | 'modification'
  original_text?: string
  new_text?: string
  reason?: string
  line_numbers?: { from: number; to: number }
  original_line?: number
  new_line?: number
  line_number?: number
}

export interface DiffSection {
  section_name: string
  changes: DiffChange[]
}

export interface DiffSummary {
  total_additions: number
  total_deletions: number
  total_modifications: number
  total_changes?: number
  improvement_areas: string[]
  estimated_impact: 'low' | 'medium' | 'high'
}

export interface Diff {
  sections: DiffSection[]
  summary: DiffSummary
  generated_at?: string
}

export interface PromptVersion {
  version: number
  prompt: string
  is_current: boolean
  created_at: string
  created_by: string
  source: 'manual' | 'ai_improved' | 'rollback'
  parent_version: number | null
  metadata: Record<string, any>
  suggestion_id: string | null
}

export interface ImprovementSuggestion {
  id: string
  created_at: string
  current_prompt: string
  improved_prompt: string
  transcript_analyzed: string
  current_version: number
  diff: Diff
  ai_reasoning: string
  improvement_areas: string[]
  status: 'pending' | 'applied' | 'rejected'
  applied_to_version?: number
  user_feedback?: string | null
}

// Request types
export interface GenerateImprovementsRequest {
  transcript?: string
  audio_url?: string
  use_multi_transcribe?: boolean
  user_feedback?: string
}

export interface ApplyImprovementsRequest {
  suggestion_id: string
  selected_changes?: string[]
}

export interface RollbackPromptRequest {
  target_version: number
}

export interface RejectImprovementsRequest {
  suggestion_id: string
}

// Response types
export interface GenerateImprovementsResponse {
  id: string
  current_prompt: string
  improved_prompt: string
  diff: Diff
  ai_reasoning: string
  improvement_areas: string[]
  status: 'pending'
  created_at: string
}

export interface ApplyImprovementsResponse {
  message: string
  new_version: number
  updated_prompt: string
}

export interface PromptHistoryResponse {
  versions: PromptVersion[]
  improvement_history: ImprovementSuggestion[]
  current_version_number: number
}

export interface RollbackPromptResponse {
  message: string
  current_version: number
  current_prompt: string
}

export interface RejectImprovementsResponse {
  message: string
  suggestion_id: string
}

export interface ComparePromptsResponse {
  current_version: PromptVersion
  target_version: PromptVersion
  comparison_type: 'version' | 'suggestion'
  diff: Diff
}

// Query params types
export interface ComparePromptsParams {
  suggestion_id?: string
  version_a?: number
  version_b?: number
}

// Call-based Prompt Improvement Types (from FRONTEND_API_REFERENCE.md)
export interface InlineSegment {
  type: 'equal' | 'delete' | 'insert'
  text: string
}

export interface InlineDiffSummary {
  total_additions: number
  total_deletions: number
  total_modifications: number
  improvement_areas: string[]
}

export interface InlineDiff {
  inline_segments: InlineSegment[]
  inline_summary: InlineDiffSummary
}

export interface ImprovePromptFromCallRequest {
  call_id: string
  user_feedback?: string
}

export interface ImprovePromptFromCallResponse {
  id: string
  current_prompt: string
  improved_prompt: string
  diff: InlineDiff
  ai_reasoning: string
  improvement_areas: string[]
  status: 'pending' | 'applied' | 'rejected'
  created_at: string
}
