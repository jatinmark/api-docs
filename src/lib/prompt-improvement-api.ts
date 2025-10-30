import {
  GenerateImprovementsRequest,
  GenerateImprovementsResponse,
  ApplyImprovementsRequest,
  ApplyImprovementsResponse,
  PromptHistoryResponse,
  RollbackPromptRequest,
  RollbackPromptResponse,
  RejectImprovementsRequest,
  RejectImprovementsResponse,
  ComparePromptsResponse,
  ComparePromptsParams,
  ImprovePromptFromCallRequest,
  ImprovePromptFromCallResponse,
} from '@/types/prompt-improvement'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555/api/v1'

export class PromptImprovementAPI {
  private static getAuthHeaders(accessToken: string) {
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Generate prompt improvements from transcript
   * POST /agents/{agent_id}/improve-prompt
   */
  static async generateImprovements(
    agentId: string,
    data: GenerateImprovementsRequest,
    accessToken: string
  ): Promise<GenerateImprovementsResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/improve-prompt`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate improvements')
    }

    return response.json()
  }

  /**
   * Generate prompt improvements from existing call
   * POST /agents/{agent_id}/improve-prompt-from-call
   * Uses call_id to automatically fetch transcript from backend
   */
  static async improvePromptFromCall(
    agentId: string,
    data: ImprovePromptFromCallRequest,
    accessToken: string
  ): Promise<ImprovePromptFromCallResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/improve-prompt-from-call`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to generate improvements from call')
    }

    return response.json()
  }

  /**
   * Apply selected improvements to agent prompt
   * POST /agents/{agent_id}/apply-improvements
   */
  static async applyImprovements(
    agentId: string,
    data: ApplyImprovementsRequest,
    accessToken: string
  ): Promise<ApplyImprovementsResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/apply-improvements`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to apply improvements')
    }

    return response.json()
  }

  /**
   * Get prompt version history and improvement suggestions
   * GET /agents/{agent_id}/prompt-history
   */
  static async getPromptHistory(
    agentId: string,
    accessToken: string
  ): Promise<PromptHistoryResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/prompt-history`, {
      method: 'GET',
      headers: this.getAuthHeaders(accessToken),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch prompt history')
    }

    return response.json()
  }

  /**
   * Rollback to a previous prompt version
   * POST /agents/{agent_id}/rollback-prompt
   */
  static async rollbackPrompt(
    agentId: string,
    data: RollbackPromptRequest,
    accessToken: string
  ): Promise<RollbackPromptResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/rollback-prompt`, {
      method: 'POST',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to rollback prompt')
    }

    return response.json()
  }

  /**
   * Compare two prompt versions or suggestion
   * GET /agents/{agent_id}/compare-prompts
   */
  static async comparePrompts(
    agentId: string,
    params: ComparePromptsParams,
    accessToken: string
  ): Promise<ComparePromptsResponse> {
    const queryParams = new URLSearchParams()

    if (params.suggestion_id) {
      queryParams.append('suggestion_id', params.suggestion_id)
    }
    if (params.version_a !== undefined) {
      queryParams.append('version_a', params.version_a.toString())
    }
    if (params.version_b !== undefined) {
      queryParams.append('version_b', params.version_b.toString())
    }

    const response = await fetch(
      `${API_BASE_URL}/agents/${agentId}/compare-prompts?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(accessToken),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to compare prompts')
    }

    return response.json()
  }

  /**
   * Reject/dismiss a prompt improvement suggestion
   * DELETE /agents/{agent_id}/reject-improvement
   */
  static async rejectImprovements(
    agentId: string,
    data: RejectImprovementsRequest,
    accessToken: string
  ): Promise<RejectImprovementsResponse> {
    const response = await fetch(`${API_BASE_URL}/agents/${agentId}/reject-improvement`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(accessToken),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to reject improvements')
    }

    return response.json()
  }
}
