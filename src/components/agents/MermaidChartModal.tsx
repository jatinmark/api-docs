import { Agent } from '@/types'
import mermaid from 'mermaid'
import { useEffect, useRef, useState, useCallback } from 'react'
import { AgentAPI } from '@/lib/agent-api'
import { useAgentPrompt } from '@/hooks/useAgents'
import { AuthStorage } from '@/lib/auth-storage'

interface MermaidChartModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent
}

export const MermaidChartModal = ({ isOpen, onClose, agent }: MermaidChartModalProps) => {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const [chartDefinition, setChartDefinition] = useState<string | null>(null)
  const [chartLoading, setChartLoading] = useState(false) // Renamed to avoid conflict
  const [chartError, setChartError] = useState<string | null>(null) // Renamed to avoid conflict
  const [mermaidReady, setMermaidReady] = useState(false)

  const { data: agentPromptData, isLoading: isPromptLoading, error: promptError } = useAgentPrompt(
    isOpen ? agent.id : null // Only fetch when modal is open
  )

  const generateChart = useCallback(async (forceRegenerate: boolean = false) => {
    if (!agentPromptData?.prompt) return

    if (agentPromptData.prompt.trim() === '') {
      setChartError('Cannot generate a chart from an empty prompt.')
      return
    }

    setChartLoading(true)
    setChartError(null)
    setChartDefinition(null)
    try {
      const tokens = AuthStorage.getTokens()
      if (!tokens) {
        throw new Error('Authentication required')
      }

      // Ensure we have a valid agent_id (use null if undefined to prevent field omission)
      const agentId = agent.id || null

      const response = forceRegenerate
        ? await AgentAPI.regenerateMermaidChart({
            agent_name: agent.name,
            agent_role: 'Agent',
            prompt: agentPromptData.prompt,
            agent_id: agentId,
          }, tokens.access_token)
        : await AgentAPI.generateMermaidChart({
            agent_name: agent.name,
            agent_role: 'Agent',
            prompt: agentPromptData.prompt,
            agent_id: agentId,
          }, tokens.access_token)
      
      setChartDefinition(response.chart_definition)
    } catch (err) {
       let errorMessage = 'Failed to generate chart. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setChartError(errorMessage);
      console.error(err)
    } finally {
      setChartLoading(false)
    }
  }, [agent.name, agentPromptData?.prompt])

  useEffect(() => {
    // Initialize Mermaid and wait for it to be ready
    const initializeMermaid = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          logLevel: 'fatal' // Only show fatal errors, suppress warnings
        })

        // Longer delay to ensure Mermaid is fully initialized, especially on slower connections
        await new Promise(resolve => setTimeout(resolve, 300))
        setMermaidReady(true)
      } catch (error) {
        console.error('Mermaid initialization failed:', error)
        setMermaidReady(true) // Set to true anyway to allow render attempt
      }
    }

    initializeMermaid()

    // Global cleanup: remove any mermaid error panels that might appear
    const cleanupErrorPanels = () => {
      const errorPanels = document.querySelectorAll('.mermaid-error, [id^="dmermaid-"]')
      errorPanels.forEach(panel => panel.remove())
    }

    // Run cleanup on interval while modal could be rendering
    const cleanupInterval = setInterval(cleanupErrorPanels, 500)

    return () => {
      clearInterval(cleanupInterval)
      cleanupErrorPanels() // Final cleanup on unmount
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !agentPromptData?.prompt) {
      return
    }

    generateChart(false) // Initial generation, not a regenerate
  }, [isOpen, agentPromptData, generateChart]) // Add generateChart to dependencies

  useEffect(() => {
    // Only attempt to render when Mermaid is ready, we have a chart definition, and the ref exists
    if (!mermaidReady || !chartDefinition || !mermaidRef.current) {
      return
    }

    // Use requestAnimationFrame to ensure DOM is stable and container has proper dimensions
    let rafId: number | undefined
    let timeoutId: NodeJS.Timeout | undefined

    // Wait for modal animation to complete, then render
    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(() => {
        // Safety check: ensure ref still exists and has non-zero dimensions
        if (!mermaidRef.current) return

        const rect = mermaidRef.current.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) {
          console.warn('Mermaid container has zero dimensions, deferring render')
          // Retry once after a delay
          setTimeout(() => {
            if (!mermaidRef.current) return
            renderChart()
          }, 150)
          return
        }

        renderChart()
      })
    }, 250) // Wait 250ms for modal animation and Mermaid initialization

    const renderChart = () => {
      if (!mermaidRef.current) return

      const chartId = `mermaid-conversation-${agent.id}-${Date.now()}`
      mermaidRef.current.innerHTML = '' // clear old render

      mermaid
        .render(chartId, chartDefinition)
        .then(({ svg }) => {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg
            setChartError(null) // Clear any previous errors on successful render
          }
        })
        .catch(error => {
          // Only log in development
          if (process.env.NODE_ENV !== 'production') {
            console.error('Mermaid rendering error:', error)
          }
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `
              <div class="text-center p-6">
                <p class="text-red-500 text-lg mb-2">⚠️ Chart Syntax Error</p>
                <p class="text-sm text-gray-600 mb-4">The AI generated invalid chart syntax. Please try regenerating.</p>
                <button
                  onclick="document.querySelector('[data-regenerate]').click()"
                  class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Regenerate Chart
                </button>
              </div>
            `
          }
          setChartError('Chart rendering failed due to syntax errors. Please regenerate.')

          // Suppress Mermaid's default error panel
          const errorPanel = document.querySelector('.mermaid-error');
          if (errorPanel) {
            errorPanel.remove();
          }
        })
    }

    // Cleanup: cancel animation frame and timeout if component unmounts or chartDefinition changes
    return () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId)
      }
    }
  }, [mermaidReady, chartDefinition, agent.id])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Conversation Flow for {agent.name}
          </h3>
          <div className="flex items-center space-x-2">
            {chartDefinition && (
              <button
                onClick={() => generateChart(true)} // Force regenerate
                disabled={chartLoading}
                data-regenerate="true"
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {chartLoading ? 'Regenerating...' : 'Regenerate'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div ref={mermaidRef} className="flex justify-center min-h-[400px]">
          {(isPromptLoading || chartLoading) && <p>Generating chart...</p>}
          {promptError && <p className="text-red-500">Error fetching prompt: {promptError.message}</p>}
          {chartError && <p className="text-red-500">{chartError}</p>}
        </div>
      </div>
    </div>
  )
}
