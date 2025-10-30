import { logger } from './logger'
import { AuthStorage } from './auth-storage'

export interface PromptGenerationRequest {
  description: string
  agentName?: string
  companyName?: string
  companyInfo?: string
  role?: string
  language?: string
  dynamicVariables?: Array<{ name: string; description: string }>
  voiceId?: string
  callType: 'inbound' | 'outbound'
}

export interface GeneratedPromptResponse {
  prompt: string
  parsedSections?: {
    agentIdentity: Record<string, string>
    dynamicVariables: Array<{ name: string; description: string }>
    companyInfo: { content?: string }
    additionalQA?: Array<{
      number: number
      question: string
      answer: string
    }>
    conversationFlow: string
    supportingSections?: string
    responseRules: string
    edgeCases: string
    operatingRules: string
    compliance: string
  }
}

export class OpenAIAPI {
  static async generatePrompt(request: PromptGenerationRequest): Promise<GeneratedPromptResponse> {
    try {
      // Get authentication token
      const tokens = AuthStorage.getTokens()
      if (!tokens?.access_token) {
        throw new Error('Authentication required. Please log in.')
      }

      // Get API URL from environment
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const endpoint = `${apiUrl}/agents/generate-prompt`

      logger.info('Calling generate-prompt endpoint:', endpoint)
      logger.info('Request data:', {
        description: request.description?.substring(0, 100) + '...',
        agentName: request.agentName,
        companyName: request.companyName,
        hasCompanyInfo: !!request.companyInfo,
        role: request.role,
        language: request.language,
        dynamicVariables: request.dynamicVariables?.length || 0
      })

      // Call backend endpoint
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify({
          description: request.description,
          agent_name: request.agentName,
          company_name: request.companyName,
          company_info: request.companyInfo,
          role: request.role,
          language: request.language,
          dynamic_variables: request.dynamicVariables,
          voice_id: request.voiceId,
          call_type: request.callType
        })
      })

      logger.info('Response status:', response.status)

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        logger.error('API Error Response:', error)
        logger.error('Response Status:', response.status)

        const errorMessage = error?.detail || error?.message || 'Failed to generate prompt'

        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to generate prompts')
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }

      const data = await response.json()
      logger.info('API Response received:', {
        hasPrompt: !!data.prompt,
        hasGeneratedPrompt: !!data.generated_prompt,
        hasParsedSections: !!data.parsed_sections
      })

      // Store parsed sections if needed for UI display
      if (data.parsed_sections) {
        // Log parsed sections for debugging (optional)
        logger.info('Parsed sections received from backend:', data.parsed_sections)
      }

      // Return both prompt and parsed sections
      const promptContent = data.prompt || data.generated_prompt
      if (!promptContent) {
        throw new Error('No prompt content received from backend')
      }

      logger.info('Returning prompt of length:', promptContent.length)

      // Return an object with both prompt and parsed sections
      return {
        prompt: promptContent,
        parsedSections: data.parsed_sections
      }

    } catch (error) {
      logger.error('Prompt Generation Error:', error)
      throw error
    }
  }

  static parsePromptSections(promptText: string): {
    agentIdentity: Record<string, string>
    dynamicVariables: Array<{ name: string; description: string }>
    companyInfo: Record<string, string>
    conversationFlow: string
    responseRules: string
    edgeCases: string
    operatingRules: string
    compliance: string
  } {
    try {
      // Parse different sections from the generated prompt
      const sections: {
        agentIdentity: Record<string, string>
        dynamicVariables: Array<{ name: string; description: string }>
        companyInfo: Record<string, string>
        conversationFlow: string
        responseRules: string
        edgeCases: string
        operatingRules: string
        compliance: string
      } = {
        agentIdentity: {},
        dynamicVariables: [],
        companyInfo: {},
        conversationFlow: '',
        responseRules: '',
        edgeCases: '',
        operatingRules: '',
        compliance: ''
      }

      // Extract Agent Identity
      const identityMatch = promptText.match(/## AGENT IDENTITY([\s\S]*?)##/m)
      if (identityMatch) {
        const lines = identityMatch[1].split('\n').filter(l => l.trim())
        lines.forEach(line => {
          const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/)
          if (match) {
            sections.agentIdentity[match[1].toLowerCase()] = match[2]
          }
        })
      }

      // Extract Dynamic Variables
      const variablesMatch = promptText.match(/## DYNAMIC VARIABLES[\s\S]*?\n([\s\S]*?)##/m)
      if (variablesMatch) {
        const lines = variablesMatch[1].split('\n').filter(l => l.startsWith('-'))
        lines.forEach(line => {
          const match = line.match(/\{(.+?)\}\s*-\s*(.+)/)
          if (match) {
            sections.dynamicVariables.push({
              name: match[1],
              description: match[2]
            })
          }
        })
      }

      // Extract Company Information
      const companyMatch = promptText.match(/## COMPANY INFORMATION([\s\S]*?)##/m)
      if (companyMatch) {
        const lines = companyMatch[1].split('\n').filter(l => l.trim())
        lines.forEach(line => {
          const match = line.match(/\*\*(.+?)\*\*:\s*(.+)/)
          if (match) {
            sections.companyInfo[match[1].toLowerCase()] = match[2]
          }
        })
      }

      // Extract Conversation Flow
      const flowMatch = promptText.match(/## CONVERSATION FLOW([\s\S]*?)## RESPONSE RULES/m)
      if (flowMatch) {
        sections.conversationFlow = flowMatch[1].trim()
      }

      // Extract Response Rules
      const rulesMatch = promptText.match(/## RESPONSE RULES([\s\S]*?)## EDGE CASE/m)
      if (rulesMatch) {
        sections.responseRules = rulesMatch[1].trim()
      }

      // Extract Edge Cases
      const edgeMatch = promptText.match(/## EDGE CASE RESPONSES([\s\S]*?)## OPERATING RULES/m)
      if (edgeMatch) {
        sections.edgeCases = edgeMatch[1].trim()
      }

      // Extract Operating Rules
      const operatingMatch = promptText.match(/## OPERATING RULES([\s\S]*?)## COMPLIANCE/m)
      if (operatingMatch) {
        sections.operatingRules = operatingMatch[1].trim()
      }

      // Extract Compliance
      const complianceMatch = promptText.match(/## COMPLIANCE([\s\S]*?)PREVIOUS INTERACTIONS/m)
      if (complianceMatch) {
        sections.compliance = complianceMatch[1].trim()
      }

      return sections
    } catch (error) {
      logger.error('Error parsing prompt sections:', error)
      return {
        agentIdentity: {},
        dynamicVariables: [],
        companyInfo: {},
        conversationFlow: '',
        responseRules: '',
        edgeCases: '',
        operatingRules: '',
        compliance: ''
      }
    }
  }
}