'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/Button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'
import { Agent } from '@/types'
import { Plus, Phone, Settings, Play, Pause, Search, MoreHorizontal, MessageCircle, Edit, Trash2, FileText, Share2, Sparkles, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import { AgentWizardV2 } from '@/components/agents/AgentWizardV2'
import { TestAgentModal } from '@/components/agents/TestAgentModal'
import { PromptImprovementModal } from '@/components/prompt-improvement/PromptImprovementModal'
import dynamicImport from 'next/dynamic'

export const dynamic = 'force-dynamic';

const MermaidChartModal = dynamicImport(() => import('@/components/agents/MermaidChartModal').then(mod => mod.MermaidChartModal), { ssr: false })

import { WhatsAppConversations } from '@/components/whatsapp/WhatsAppConversations'
import { enhanceAgentWithWhatsApp } from '@/lib/whatsapp-frontend-store'
import { useAgents, useVoices, useToggleAgentStatus, useDeleteAgent, useAgentPrompt } from '@/hooks/useAgents'
import { CustomDropdown } from '@/components/ui/CustomDropdown'
import { useDemoStatus } from '@/hooks/useDemo'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

export default function AgentsPage() {
  const [showWizardV2, setShowWizardV2] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showWhatsAppConversations, setShowWhatsAppConversations] = useState(false)
  const [selectedAgentForWhatsApp, setSelectedAgentForWhatsApp] = useState<Agent | null>(null)
  const [testingAgent, setTestingAgent] = useState<Agent | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [showMermaidModal, setShowMermaidModal] = useState(false)
  const [selectedAgentForMermaid, setSelectedAgentForMermaid] = useState<Agent | null>(null)
  const [showImprovePrompt, setShowImprovePrompt] = useState(false)
  const [selectedAgentForImprovement, setSelectedAgentForImprovement] = useState<Agent | null>(null)
  const [callTypeFilter, setCallTypeFilter] = useState<'all' | 'inbound' | 'outbound' | 'web'>('all')
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [deleteConfirmAgent, setDeleteConfirmAgent] = useState<Agent | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [viewingPromptAgentId, setViewingPromptAgentId] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10) // Changed to 10 for better performance

  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  // Helper function to format sales cycle days
  const formatSalesCycleDays = (agent: Agent) => {
    if (!agent.enable_sales_cycle || !agent.default_call_days || agent.default_call_days.length === 0) {
      return 'Disabled'
    }

    // Sort the days and format as a sequence
    const sortedDays = [...agent.default_call_days].sort((a, b) => a - b)

    // Format as "Day 1, 3, 5" or handle special cases
    if (sortedDays.length === 1) {
      return `Day ${sortedDays[0]}`
    } else if (sortedDays.length === 2) {
      return `Days ${sortedDays[0]} & ${sortedDays[1]}`
    } else {
      const lastDay = sortedDays.pop()
      return `Days ${sortedDays.join(', ')} & ${lastDay}`
    }
  }

  // Helper function to get call type
  const getCallType = (agent: Agent) => {
    if (agent.region === 'worldwide') {
      return 'Web'
    } else if (agent.inbound_phone) {
      return 'Inbound'
    } else {
      return 'Outbound'
    }
  }

  // Fetch agents - if total is ≤10, we'll get all of them in the first page anyway
  const { data: agentsData, isLoading: agentsLoading, error: agentsError } = useAgents({
    page: currentPage,
    per_page: pageSize
  })
  const { data: voicesData, isLoading: voicesLoading } = useVoices()
  const { data: demoStatus } = useDemoStatus()
  const toggleStatusMutation = useToggleAgentStatus()
  const deleteAgentMutation = useDeleteAgent()
  const { data: agentPromptData, isLoading: promptLoading } = useAgentPrompt(viewingPromptAgentId)

  const allAgents = agentsData?.agents ? agentsData.agents.map(enhanceAgentWithWhatsApp) : []


  const agents = allAgents.filter(agent => {
    if (callTypeFilter === 'all') return true
    const agentCallType = getCallType(agent).toLowerCase()
    return agentCallType === callTypeFilter
  })
  const voices = voicesData ? voicesData.reduce((acc, voice) => {
    acc[voice.id] = voice.name
    return acc
  }, {} as Record<string, string>) : {}
  const loading = agentsLoading || voicesLoading
  const error = agentsError?.message || null

  // Pagination calculations
  const totalItems = agentsData?.total ?? 0
  const shouldShowPagination = totalItems > 10 // Only show pagination if more than 10 agents
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const startItem = agents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = agents.length > 0 ? (currentPage - 1) * pageSize + agents.length : 0
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const goToPage = (pageNum: number) => {
    const safePage = Math.max(1, Math.min(pageNum, totalPages))
    setCurrentPage(safePage)
  }

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [callTypeFilter, pageSize])

  // If total items ≤ 10 and we're not already on page 1 with appropriate page size, adjust
  useEffect(() => {
    if (totalItems > 0 && totalItems <= 10 && currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [totalItems, currentPage])

  const toggleAgentStatus = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    const newStatus = agent?.status === 'active' ? 'paused' : 'resumed'
    
    toggleStatusMutation.mutate(agentId, {
      onSuccess: () => {
        toast.success(`Agent ${newStatus} successfully. ${newStatus === 'paused' ? 'All scheduled calls are now paused.' : 'Sales cycles will resume processing.'}`)
      },
      onError: (error: any) => {
        toast.error(error?.message || `Failed to ${newStatus === 'paused' ? 'pause' : 'resume'} agent`)
      }
    })
  }

  const handleAgentUpdated = () => {
    // Agent is already updated by AgentWizardV2, just close the wizard
    setEditingAgent(null)
    // Refresh the agents list to show the updated agent
    queryClient.invalidateQueries({ queryKey: ['agents'] })
  }

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent)
    setActiveDropdown(null)
  }

  const handleDeleteAgent = (agent: Agent) => {
    setDeleteConfirmAgent(agent)
    setActiveDropdown(null)
  }

  const confirmDelete = () => {
    if (deleteConfirmAgent) {
      deleteAgentMutation.mutate(deleteConfirmAgent.id, {
        onSuccess: () => {
          toast.success('Agent deleted successfully')
          setDeleteConfirmAgent(null)
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Failed to delete agent')
        }
      })
    }
  }

  const handleOpenWhatsAppConversations = (agent: Agent) => {
    setSelectedAgentForWhatsApp(agent)
    setShowWhatsAppConversations(true)
  }

  const handleTestCall = (agent: Agent) => {
    setTestingAgent(agent)
    setShowTestModal(true)
  }

  const handleViewPrompt = (agent: Agent) => {
    setViewingPromptAgentId(agent.id)
    setActiveDropdown(null)
  }

  // Log agent prompt data when it's fetched
  useEffect(() => {
    if (agentPromptData) {
      console.log('Agent Prompt Data:', agentPromptData)
      // For now, just log the response
      // You can later display this in a modal or component
      toast.success('Agent prompt fetched! Check console for data.')
      setViewingPromptAgentId(null) // Reset after fetching
    }
  }, [agentPromptData])

  const handleMermaidChartClick = (agent: Agent) => {
    setSelectedAgentForMermaid(agent)
    setShowMermaidModal(true)
    setActiveDropdown(null)
  }

  const handleImprovePrompt = (agent: Agent) => {
    setSelectedAgentForImprovement(agent)
    setShowImprovePrompt(true)
    setActiveDropdown(null)
  }

  const handleCopyAgentId = (agent: Agent) => {
    navigator.clipboard.writeText(agent.id)
    toast.success('Agent ID copied to clipboard!')
    setActiveDropdown(null)
  }

  const handleCreateAgent = () => {
    // Check demo agent limit before opening wizard
    if (demoStatus?.demo_mode && demoStatus?.agents_remaining === 0) {
      toast.error(
        `Demo agent limit reached (${demoStatus.agents_count}/${demoStatus.agents_limit} agents). Please upgrade to create more agents.`,
        { duration: 5000 }
      )
      return
    }
    setShowWizardV2(true)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const target = event.target as HTMLElement
        if (!target.closest('.dropdown-menu') && !target.closest('[role="dropdown-portal"]')) {
          setActiveDropdown(null)
          setDropdownPosition(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  return (
    <ProtectedRoute>
      <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">All Campaigns</h1>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={callTypeFilter}
              onChange={(e) => setCallTypeFilter(e.target.value as 'all' | 'inbound' | 'outbound' | 'web')}
              className="px-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Call Types</option>
              <option value="inbound">Inbound</option>
              <option value="outbound">Outbound</option>
              <option value="web">Web VoiceBot</option>
            </select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>

            <Button
              onClick={handleCreateAgent}
              variant="dark"
              disabled={demoStatus?.demo_mode && demoStatus?.agents_remaining === 0}
            >
              Create Agent
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 overflow-visible">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600">No agents found. Create your first agent to get started.</p>
            </div>
          ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="border-b border-gray-200">
                {isSuperAdmin ? (
                  <>
                    <TableHead className="font-medium text-gray-700 py-3">Campaigns Name</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Agent Type</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Voice</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Call Type</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Phone</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Call Flow</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Edited at</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="font-medium text-gray-700 py-3">Campaigns Name</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Purpose</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Sales Cycle</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Call Type</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Call Flow</TableHead>
                    <TableHead className="font-medium text-gray-700 py-3">Summary</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent: Agent) => (
                <TableRow
                  key={agent.id}
                  className="border-b border-gray-100 hover:bg-gray-50">
                  {isSuperAdmin ? (
                    // Super admin sees full details
                    <>
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleAgentStatus(agent.id)}
                              className={`p-1 rounded ${agent.status === 'active' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}
                              title={agent.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <span className={`text-xs font-medium ${agent.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                              {agent.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{agent.name}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Voice
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-sm text-gray-600">Multi Prompt</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-xs font-medium text-amber-800">🎤</span>
                          </div>
                          <div>
                            <div className="text-sm text-gray-900">
                              {agent.voice_id && voices[agent.voice_id]
                                ? voices[agent.voice_id]
                                : 'Default Voice'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Voice AI Ready
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getCallType(agent) === 'Inbound'
                            ? 'bg-green-100 text-green-800'
                            : getCallType(agent) === 'Outbound'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {getCallType(agent)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        {agent.outbound_phone ? (
                          <span className="text-sm text-blue-600">{agent.outbound_phone}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <button
                          onClick={() => {
                            setSelectedAgentForMermaid(agent)
                            setShowMermaidModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Flow
                        </button>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600">
                          {agent.created_at ? (
                            <>
                              {new Date(agent.created_at).toLocaleDateString('en-US', {
                                month: '2-digit',
                                day: '2-digit',
                                year: 'numeric'
                              })}, {new Date(agent.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                              })}
                            </>
                          ) : 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4 relative">
                    <div className="flex justify-end space-x-1">
                      {/* <button 
                        onClick={() => handleTestCall(agent)}
                        className="flex items-center gap-1 px-2 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                        title="Test Call"
                      >
                        <Phone className="h-4 w-4" />
                        <span>Test</span>
                      </button> */}
                      <div className="relative dropdown-menu">
                        <button
                          onClick={(e) => {
                            if (activeDropdown === agent.id) {
                              setActiveDropdown(null)
                              setDropdownPosition(null)
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setActiveDropdown(agent.id)
                              setDropdownPosition({
                                top: rect.bottom + window.scrollY,
                                left: rect.right - 192 + window.scrollX // 192px = 48 * 4 (w-48 in tailwind)
                              })
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="More Options"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </TableCell>
                    </>
                  ) : (
                    // Company users see simplified view
                    <>
                      <TableCell className="py-4">
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Status: {agent.status === 'active' ? 'Active' : 'Paused'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm text-gray-600">
                          {agent.configuration_data?.basic_info?.intended_role ||
                           agent.variables?.intended_role ||
                           'Not specified'}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="text-sm text-gray-900 font-medium">
                            {formatSalesCycleDays(agent)}
                          </div>
                          {agent.enable_sales_cycle && agent.default_call_days && (
                            <>
                              <div className="text-xs text-green-600">
                                Enabled
                              </div>
                              <div className="text-xs text-gray-500" title="Call sequence: days after lead creation">
                                {/* {agent.default_call_days.length}-step sequence */}
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getCallType(agent) === 'Inbound'
                            ? 'bg-green-100 text-green-800'
                            : getCallType(agent) === 'Outbound'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {getCallType(agent)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <button
                          onClick={() => {
                            setSelectedAgentForMermaid(agent)
                            setShowMermaidModal(true)
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          View Flow
                        </button>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm text-gray-600">
                            {agent.website_data?.business_context ? (
                              // Show business context (truncated to 200 chars if needed)
                              <span title={agent.website_data.business_context}>
                                {agent.website_data.business_context.length > 150
                                  ? agent.website_data.business_context.substring(0, 150) + '...'
                                : agent.website_data.business_context}
                            </span>
                          ) : agent.welcome_message ? (
                            // Show welcome message as summary
                            <span title={agent.welcome_message}>
                              {agent.welcome_message.length > 150
                                ? agent.welcome_message.substring(0, 150) + '...'
                                : agent.welcome_message}
                            </span>
                          ) : agent.configuration_data?.basic_info?.primary_service ? (
                            // Show primary service
                            <span>{agent.configuration_data.basic_info.primary_service}</span>
                          ) : (
                            // Fallback to truncated prompt
                            <span title={agent.prompt}>
                              {agent.prompt.length > 150
                                ? agent.prompt.substring(0, 150) + '...'
                                : agent.prompt}
                            </span>
                          )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 relative">
                        <div className="flex justify-end space-x-1">
                          <div className="relative dropdown-menu">
                            <button
                              onClick={(e) => {
                                if (activeDropdown === agent.id) {
                                  setActiveDropdown(null)
                                  setDropdownPosition(null)
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setActiveDropdown(agent.id)
                                  setDropdownPosition({
                                    top: rect.bottom + window.scrollY,
                                    left: rect.right - 192 + window.scrollX
                                  })
                                }
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="More Options"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}

          {/* Pagination Controls - Only show if more than 10 agents total */}
          {shouldShowPagination && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-700">
                <span>Showing </span>
                <span className="font-medium mx-1">{startItem}</span>
                <span> to </span>
                <span className="font-medium mx-1">{endItem}</span>
                <span> of </span>
                <span className="font-medium mx-1">{totalItems}</span>
                <span> results</span>
              </div>

              <div className="flex items-center space-x-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(1)}
                  disabled={!hasPrev}
                  title="First page"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <ChevronLeft className="h-4 w-4 -ml-2" />
                </Button>

                {/* Previous Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrev}
                  title="Previous page"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Info */}
                <div className="px-3 text-sm">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </div>

                {/* Next Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNext}
                  title="Next page"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  onClick={() => goToPage(totalPages)}
                  disabled={!hasNext}
                  title="Last page"
                  size="sm"
                >
                  <ChevronRight className="h-4 w-4" />
                  <ChevronRight className="h-4 w-4 -ml-2" />
                </Button>

                {/* Page Size Selector */}
                <div className="ml-3">
                  <CustomDropdown
                    options={[
                      { value: '10', label: '10 per page' },
                      { value: '25', label: '25 per page' },
                      { value: '50', label: '50 per page' },
                      { value: '100', label: '100 per page' }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => setPageSize(Number(value))}
                    className="w-36"
                    forceUpward={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingAgent && (
        <AgentWizardV2
          isOpen={!!editingAgent}
          onClose={() => setEditingAgent(null)}
          onComplete={handleAgentUpdated}
          editingAgent={editingAgent}
        />
      )}

      <AgentWizardV2
        isOpen={showWizardV2}
        onClose={() => setShowWizardV2(false)}
        onComplete={() => {
          setShowWizardV2(false)
          queryClient.invalidateQueries({ queryKey: ['agents'] })
        }}
      />

      {selectedAgentForWhatsApp && (
        <WhatsAppConversations
          isOpen={showWhatsAppConversations}
          onClose={() => {
            setShowWhatsAppConversations(false)
            setSelectedAgentForWhatsApp(null)
          }}
          agentId={selectedAgentForWhatsApp.id}
          agentName={selectedAgentForWhatsApp.name}
        />
      )}

      {testingAgent && (
        <TestAgentModal
          isOpen={showTestModal}
          onClose={() => {
            setShowTestModal(false)
            setTestingAgent(null)
          }}
          agent={testingAgent}
          onSuccess={() => {
            setShowTestModal(false)
            setTestingAgent(null)
          }}
          testCallsRemaining={3}
        />
      )}

      {/* Dropdown Menu Portal */}
      {activeDropdown && dropdownPosition && (
        <div 
          role="dropdown-portal"
          className="fixed w-48 bg-white rounded-md shadow-lg z-[100] border border-gray-200"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <>
            <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleEditAgent(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-t-md"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Agent
            </button>
            <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleCopyAgentId(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Agent ID
            </button>
            {/* <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleViewPrompt(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Prompt
            </button> */}
            {/* <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleMermaidChartClick(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Mermaid Chart
            </button> */}
            <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleImprovePrompt(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Improve Prompt
            </button>
            <button
              onClick={() => {
                const agent = agents.find(a => a.id === activeDropdown)
                if (agent) handleDeleteAgent(agent)
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-md"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Agent
            </button>
          </>
        </div>
      )}

      {selectedAgentForMermaid && (
        <MermaidChartModal
          isOpen={showMermaidModal}
          onClose={() => {
            setShowMermaidModal(false)
            setSelectedAgentForMermaid(null)
          }}
          agent={selectedAgentForMermaid}
        />
      )}

      {selectedAgentForImprovement && (
        <PromptImprovementModal
          isOpen={showImprovePrompt}
          onClose={() => {
            setShowImprovePrompt(false)
            setSelectedAgentForImprovement(null)
          }}
          agent={selectedAgentForImprovement}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Agent
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &quot;{deleteConfirmAgent.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmAgent(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDelete}
                disabled={deleteAgentMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteAgentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </Layout>
    </ProtectedRoute>
  )
}