'use client'

import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Agent, AgentConfiguration, AgentBasicInfo } from '@/types'
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Pencil,
  RefreshCw,
  Check,
  X,
  Plus,
  MessageSquare,
  FileText,
  Settings,
  Code,
  Zap,
  AlertTriangle,
  Shield,
  BookOpen,
  Info,
  Tag,
  Database,
  Globe,
  User,
  Building,
  Briefcase,
  Wand2,
  Sparkles,
  Trash2,
  Upload,
  Mic,
  Loader2,
  Search,
  Phone
} from 'lucide-react'
import { FAQEditorModal } from '../src/components/agents/FAQEditorModal'
import { TaskEditorModal } from '../src/components/agents/TaskEditorModal'
import { useVoices } from '@/hooks/useAgents'
import { useAuth } from '@/contexts/AuthContext'
import { AgentAPI } from '@/lib/agent-api'
import { OpenAIAPI } from '@/lib/openai-api'
import { TranscriptionAPI } from '@/lib/transcription-api'
import toast from 'react-hot-toast'
import { logger } from '@/lib/logger'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { generateRoleSection, getLanguageFromVoice, generateLanguageLine, extractVariablesFromPrompt } from '@/lib/prompt-utils'
import { getTimezoneFromPhone } from '@/lib/utils'
import {
  CollapsibleSection,
  MainCollapsibleSection,
  ValidatedInput,
  InfoTooltip,
  InlineInfoTooltip,
  GenerateButton,
  LoadingButton,
  ExampleButton,
  ExampleContent
} from '../src/components/agents/AgentWizardComponents'

interface FAQItem {
  question: string
  answer: string
}

interface TaskItem {
  task: string
}

interface AgentWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (agent: Agent) => void
  editingAgent?: Agent
}

// Reusable Auto-Expanding TextArea Component
interface AutoExpandTextAreaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
  maxHeight?: number
}

const AutoExpandTextArea = memo(({ 
  value, 
  onChange, 
  placeholder = "", 
  className = "",
  minHeight = 44,
  maxHeight = 84 
}: AutoExpandTextAreaProps) => {
  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = `${minHeight}px`;
    const scrollHeight = target.scrollHeight;
    target.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }, [minHeight, maxHeight])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <textarea
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-none overflow-auto bg-gray-50 text-gray-900 placeholder-gray-400 ${className}`}
      rows={1}
      style={{
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`
      }}
      onInput={handleInput}
    />
  )
})
AutoExpandTextArea.displayName = 'AutoExpandTextArea'


// Reusable Dynamic List Component with hover delete
interface DynamicListProps {
  items: string[]
  onItemChange: (index: number, value: string) => void
  onItemRemove: (index: number) => void
  onItemAdd: () => void
  placeholder?: string
  addButtonText?: string
  twoColumns?: boolean
  textArea?: boolean
}

const DynamicList = memo(({
  items,
  onItemChange,
  onItemRemove,
  onItemAdd,
  placeholder = "Enter item",
  addButtonText = "Add more",
  twoColumns = false,
  textArea = false
}: DynamicListProps) => {
  const handleItemChange = useCallback((index: number, value: string) => {
    onItemChange(index, value)
  }, [onItemChange])

  const handleItemRemove = useCallback((index: number) => {
    onItemRemove(index)
  }, [onItemRemove])

  const containerClassName = useMemo(() => 
    twoColumns ? "grid grid-cols-1 md:grid-cols-2 gap-3" : "space-y-2", 
    [twoColumns]
  )

  return (
    <div className="space-y-2">
      <div className={containerClassName}>
        {items.map((item, index) => (
          <div key={index} className="group relative">
            {textArea ? (
              <textarea
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px] pr-10 bg-gray-50 text-gray-900 placeholder-gray-400"
              />
            ) : (
              <AutoExpandTextArea
                value={item}
                onChange={(value) => handleItemChange(index, value)}
                placeholder={placeholder}
                minHeight={40}
                maxHeight={84}
                className="pr-10"
              />
            )}
            <button
              onClick={() => handleItemRemove(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              title="Remove item"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <Button
        onClick={onItemAdd}
        variant="outline"
        size="sm"
      >
        {addButtonText}
      </Button>
    </div>
  )
})
DynamicList.displayName = 'DynamicList'

// Helper function to parse tasks string into TaskItem array
const parseTasksString = (tasksString: string): TaskItem[] => {
  const tasks: TaskItem[] = []
  
  // Remove ##task header if present (with or without space)
  const cleanedTasks = tasksString.replace(/^##\s*tasks?\s*\n?/i, '').trim()
  
  // Split by newlines and treat each line as a task
  const lines = cleanedTasks.split('\n')
  
  // Simple parsing - each non-empty line is a task
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue
    
    tasks.push({
      task: trimmedLine
    })
  }
  
  return tasks
}

// Helper function to strip leading numbers from task text for display
const stripTaskNumber = (taskText: string): string => {
  // Remove patterns like "1. ", "2. ", "10. " from the beginning
  return taskText.replace(/^\d+\.\s+/, '')
}

// Helper function to convert TaskItem array back to string
const tasksToString = (tasks: TaskItem[]): string => {
  if (tasks.length === 0) return ''
  
  const taskList = tasks.map((task) => {
    return task.task
  }).join('\n')
  
  // Check if the first task already starts with ##Tasks header (with or without space)
  if (tasks.length > 0 && /^##\s*tasks/i.test(tasks[0].task.trim())) {
    return taskList
  }
  
  return `##Tasks\n${taskList}`
}

const AgentWizardComponent = ({ isOpen, onClose, onComplete, editingAgent }: AgentWizardProps) => {
  // Track if this is a new session or continuing
  const [sessionId] = useState(() => Date.now())
  const prevSessionIdRef = useRef<number | null>(null)

  // 3-Page Structure: Page 1 (Prompt Builder), Page 2 (Data Extraction), Page 3 (Configuration with Auto-Schedule)
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1)
  const [currentSubStep, setCurrentSubStep] = useState(1) // For step 1 sub-steps (1-5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('')
  const [userTasks, setUserTasks] = useState<string[]>([''])
  const [callTranscripts, setCallTranscripts] = useState<string[]>([''])
  const [generatedFAQs, setGeneratedFAQs] = useState<FAQItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [showFAQEditor, setShowFAQEditor] = useState(false)
  const [editingFAQs, setEditingFAQs] = useState<FAQItem[]>([])
  // Update extraction fields to support name and description
  interface ExtractionField {
    name: string;
    description: string;
  }
  const [extractionFields, setExtractionFields] = useState<ExtractionField[]>([{ name: '', description: '' }])
  const [isSendingFields, setIsSendingFields] = useState(false)
  const [generatedTasks, setGeneratedTasks] = useState<TaskItem[]>([])
  const [generatedConversationFlow, setGeneratedConversationFlow] = useState<string>('')
  const [showTaskEditor, setShowTaskEditor] = useState(false)
  const [editingTasks, setEditingTasks] = useState<TaskItem[]>([])
  const [staticSections, setStaticSections] = useState<{ notes: string } | null>(null)

  // Step 1: Prompt Builder States (from PromptBuilderWizard)
  const [promptName, setPromptName] = useState('')
  const [promptDescription, setPromptDescription] = useState('')
  // region is already defined below in Business Configuration State
  const [agentName, setAgentName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [agentRole, setAgentRole] = useState('')
  const [agentIndustry, setAgentIndustry] = useState('')
  const [agentLanguage, setAgentLanguage] = useState('Adapts between English and Hinglish based on customer preference')
  const [companyInfo, setCompanyInfo] = useState('')
  const [callType, setCallType] = useState<'inbound' | 'outbound' | ''>('')
  const [dynamicVariables, setDynamicVariables] = useState<{ name: string; description: string }[]>([])
  const [newVariableName, setNewVariableName] = useState('')
  const [newVariableDescription, setNewVariableDescription] = useState('')
  const [conversationFlow, setConversationFlow] = useState('')
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)
  const [supportingSections, setSupportingSections] = useState('')
  const [additionalQA, setAdditionalQA] = useState<Array<{number: number; question: string; answer: string}>>([])
  const [responseRules, setResponseRules] = useState('')
  const [edgeCases, setEdgeCases] = useState('')
  const [operatingRules, setOperatingRules] = useState('')
  const [compliance, setCompliance] = useState('')
  const [previousInteractions, setPreviousInteractions] = useState('')
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false)

  // Example visibility state for collapsible examples
  const [showExamples, setShowExamples] = useState<{
    agent_name: boolean
    agent_role: boolean
    company_name: boolean
    industry: boolean
    voice: boolean
    what_agent_does: boolean
    what_are_variables: boolean
  }>({
    agent_name: false,
    agent_role: false,
    company_name: false,
    industry: false,
    voice: false,
    what_agent_does: false,
    what_are_variables: false
  })

  const handleExampleMouseEnter = (field: keyof typeof showExamples) => {
    setShowExamples(prev => ({
      ...prev,
      [field]: true
    }))
  }

  const handleExampleMouseLeave = (field: keyof typeof showExamples) => {
    setShowExamples(prev => ({
      ...prev,
      [field]: false
    }))
  }

  // Add Variables section collapsible state
  const [isAddVariablesSectionCollapsed, setIsAddVariablesSectionCollapsed] = useState(true)

  // File upload and transcription states
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState<{ message: string; percentage: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Input method selection state
  const [inputMethod, setInputMethod] = useState<'type' | 'upload' | null>(null)

  // Helper functions for Step 1
  const formatAdditionalQA = (qaList: Array<{number: number; question: string; answer: string}>): string => {
    if (!qaList || qaList.length === 0) return ''
    return qaList.map(qa =>
      `${qa.number}. **Q: ${qa.question}**\n   A: ${qa.answer.replace(/^"|"$/g, '')}`
    ).join('\n\n')
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const validation = TranscriptionAPI.validateFiles(files)
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid files')
        return
      }
      setSelectedFiles(files)
      toast.success(`${files.length} file(s) selected`)
    }
  }

  const handleTranscribeFiles = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Please select audio files first')
      return
    }

    if (!tokens?.access_token) {
      toast.error('Authentication required')
      return
    }

    try {
      setIsTranscribing(true)
      setTranscriptionProgress({ message: 'Starting transcription...', percentage: 0 })

      const response = await TranscriptionAPI.transcribeFiles(
        selectedFiles,
        tokens.access_token,
        (message, percentage) => {
          setTranscriptionProgress({ message, percentage })
        }
      )

      // Process successful transcriptions
      const successfulTranscriptions = response.data.transcriptions.filter(
        t => t.status === 'success'
      )

      if (successfulTranscriptions.length > 0) {
        // Format and append transcription to description
        const formattedText = TranscriptionAPI.formatTranscriptionForPrompt(successfulTranscriptions)

        setPromptDescription(prev => {
          const newDescription = prev
            ? `${prev}\n\n--- Audio Transcription ---\n\n${formattedText}`
            : formattedText
          return newDescription
        })

        toast.success(`Successfully transcribed ${successfulTranscriptions.length} file(s)`)
      }

      // Report any failures
      const failedTranscriptions = response.data.transcriptions.filter(
        t => t.status === 'failed'
      )

      if (failedTranscriptions.length > 0) {
        failedTranscriptions.forEach(t => {
          toast.error(`Failed to transcribe ${t.filename}: ${t.error}`)
        })
      }

      // Clear file selection after successful transcription
      setSelectedFiles(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      logger.error('Transcription failed:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to transcribe audio')
    } finally {
      setIsTranscribing(false)
      setTranscriptionProgress(null)
    }
  }

  const handleRemoveFiles = () => {
    setSelectedFiles(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Files removed')
  }

  const handleNewVariableNameChange = (value: string) => {
    // Convert to snake_case
    const processedValue = value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    setNewVariableName(processedValue)
  }

  const handleAddVariable = () => {
    if (!newVariableName.trim() || !newVariableDescription.trim()) {
      toast.error('Please fill in both variable name and description')
      return
    }
    setDynamicVariables([...dynamicVariables, {
      name: newVariableName,
      description: newVariableDescription
    }])
    // Clear form
    setNewVariableName('')
    setNewVariableDescription('')
    toast.success('Variable added successfully')
  }

  const handleRemoveVariable = (index: number) => {
    setDynamicVariables(dynamicVariables.filter((_, i) => i !== index))
  }

  const handleVariableChange = (index: number, field: 'name' | 'description', value: string) => {
    // Convert to snake_case if it's the name field
    const processedValue = field === 'name'
      ? value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      : value

    setDynamicVariables(dynamicVariables.map((v, i) =>
      i === index ? { ...v, [field]: processedValue } : v
    ))
  }

  const handleGeneratePromptStep0 = async () => {
    if (!promptDescription) {
      toast.error('Please provide a description first')
      return
    }

    try {
      setIsGeneratingPrompt(true)
      toast('Generating your prompt... This may take up to 2 minutes. Please wait.', {
        duration: 5000,
        icon: '⏳'
      })

      const response = await OpenAIAPI.generatePrompt({
        description: promptDescription,
        agentName,
        companyName,
        companyInfo,
        role: agentRole,
        language: agentLanguage,
        dynamicVariables,
        voiceId: selectedVoice,
        callType: callType as 'inbound' | 'outbound'
      })

      // Store the full generated prompt
      setGeneratedPrompt(response.prompt)

      // Use parsed sections from backend if available
      if (response.parsedSections) {
        const sections = response.parsedSections

        // Populate fields with parsed sections
        if (sections.conversationFlow) {
          setConversationFlow(sections.conversationFlow)
        }
        if (sections.supportingSections) {
          setSupportingSections(sections.supportingSections)
        }
        if (sections.additionalQA && sections.additionalQA.length > 0) {
          setAdditionalQA(sections.additionalQA)
        }

        // Update dynamic variables if provided
        if (sections.dynamicVariables && sections.dynamicVariables.length > 0) {
          setDynamicVariables(sections.dynamicVariables)
        }

        // Update company info if provided
        if (sections.companyInfo?.content) {
          setCompanyInfo(sections.companyInfo.content)
        }
      }

      toast.success('Prompt generated successfully!')
    } catch (error) {
      logger.error('Failed to generate prompt', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate prompt'
      toast.error(errorMessage)
    } finally {
      setIsGeneratingPrompt(false)
    }
  }

  const generatePromptFromStep0 = () => {
    let prompt = ''

    // Agent Identity
    prompt += '### AGENT IDENTITY\n'
    if (agentName) prompt += `Agent Name: ${agentName}\n`
    if (companyName) prompt += `Company: ${companyName}\n`
    if (agentRole) prompt += `Role: ${agentRole}\n`
    if (agentLanguage) prompt += `Language: ${agentLanguage}\n\n`

    // Dynamic Variables
    if (dynamicVariables.length > 0) {
      prompt += '### DYNAMIC VARIABLES (System Populated)\n'
      dynamicVariables.forEach(variable => {
        if (variable.name) {
          prompt += `- {${variable.name}}: ${variable.description}\n`
        }
      })
      prompt += '\n'
    }

    // Company Information
    if (configuration.basic_info.primary_service) {
      prompt += '### COMPANY INFORMATION\n'
      prompt += configuration.basic_info.primary_service + '\n\n'
    }

    // Additional Q&A Responses
    if (additionalQA.length > 0) {
      prompt += '### ADDITIONAL Q&A RESPONSES\n'
      prompt += formatAdditionalQA(additionalQA) + '\n\n'
    }

    // Conversation Flow
    if (conversationFlow) {
      prompt += '### CONVERSATION FLOW\n'
      prompt += conversationFlow + '\n\n'
    }

    // Response Rules
    if (responseRules) {
      prompt += '### RESPONSE RULES\n'
      prompt += responseRules + '\n\n'
    }

    // Edge Cases
    if (edgeCases) {
      prompt += '### EDGE CASE RESPONSES\n'
      prompt += edgeCases + '\n\n'
    }

    // Operating Rules
    if (operatingRules) {
      prompt += '### OPERATING RULES\n'
      prompt += operatingRules + '\n\n'
    }

    // Compliance
    if (compliance) {
      prompt += '### COMPLIANCE REQUIREMENTS\n'
      prompt += compliance + '\n\n'
    }

    // Previous Interactions - Added at the end
    if (previousInteractions) {
      prompt += previousInteractions + '\n\n'
    }

    return prompt.trim()
  }

  // Display version without secret sections
  const generatePromptForDisplay = () => {
    let prompt = ''

    // Agent Identity
    prompt += '### AGENT IDENTITY\n'
    if (agentName) prompt += `Agent Name: ${agentName}\n`
    if (companyName) prompt += `Company: ${companyName}\n`
    if (agentRole) prompt += `Role: ${agentRole}\n`
    if (agentLanguage) prompt += `Language: ${agentLanguage}\n\n`

    // Dynamic Variables
    if (dynamicVariables.length > 0) {
      prompt += '### DYNAMIC VARIABLES (System Populated)\n'
      dynamicVariables.forEach(variable => {
        if (variable.name) {
          prompt += `- {${variable.name}}: ${variable.description}\n`
        }
      })
      prompt += '\n'
    }

    // Company Information
    if (configuration.basic_info.primary_service) {
      prompt += '### COMPANY INFORMATION\n'
      prompt += configuration.basic_info.primary_service + '\n\n'
    }

    // Additional Q&A Responses
    if (additionalQA.length > 0) {
      prompt += '### ADDITIONAL Q&A RESPONSES\n'
      prompt += formatAdditionalQA(additionalQA) + '\n\n'
    }

    // Conversation Flow
    if (conversationFlow) {
      prompt += '### CONVERSATION FLOW\n'
      prompt += conversationFlow + '\n\n'
    }

    // Edge Cases
    if (edgeCases) {
      prompt += '### EDGE CASE RESPONSES\n'
      prompt += edgeCases + '\n\n'
    }

    // Response Rules
    if (responseRules) {
      prompt += '### RESPONSE RULES\n'
      prompt += responseRules + '\n\n'
    }

    // Operating Rules
    if (operatingRules) {
      prompt += '### OPERATING RULES\n'
      prompt += operatingRules + '\n\n'
    }

    // Compliance Requirements
    if (compliance) {
      prompt += '### COMPLIANCE REQUIREMENTS\n'
      prompt += compliance + '\n\n'
    }

    return prompt.trim()
  }

  // These effects will be moved after resetWizardState is defined

  // Website data state with sessionStorage persistence
  const [websiteData, setWebsiteData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('agent-wizard-website-data')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          // Failed to parse saved website data
        }
      }
    }
    return {
      url: '',
      content: '',  // Changed from scrapedContent
      faqs: [],
      business_context: '',  // Changed from businessContext
      tasks: '',  // Add tasks field
      isLoaded: false
    }
  })
  
  // Persist website data to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('agent-wizard-website-data', JSON.stringify(websiteData))
    }
  }, [websiteData])
  
  // Business Configuration State (Page 3)
  const [inboundPhone, setInboundPhone] = useState<string>('')
  const [outboundPhone, setOutboundPhone] = useState<string>('')
  const [region, setRegion] = useState<'indian' | 'international' | 'internal_india' | 'internal_us'>('indian')
  
  // Auto-Schedule State (integrated in Page 3, auto-enabled)
  const [salesCycleEnabled, setSalesCycleEnabled] = useState<boolean>(true)
  const [salesCycleCallDays, setSalesCycleCallDays] = useState<number[]>([1, 3, 5])  // Day 1 = next day, Day 3 = 3 days later, etc.
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Preview panel state
  const [showPreview, setShowPreview] = useState(false)

  const { tokens, user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const { data: voices } = useVoices()

  const [configuration, setConfiguration] = useState<AgentConfiguration & { company_website?: string }>({
    basic_info: {
      agent_name: '',
      intended_role: '',
      target_industry: '',
      company_name: '',
      primary_service: '',
    }
  })

  useEffect(() => {
    setConfiguration(prev => ({
      ...prev,
      basic_info: { ...prev.basic_info, agent_name: agentName }
    }));
  }, [agentName]);

  useEffect(() => {
    if (configuration.basic_info.company_name) {
      setCompanyName(configuration.basic_info.company_name);
    }
  }, [configuration.basic_info.company_name]);

  useEffect(() => {
    if (configuration.basic_info.intended_role) {
      setAgentRole(configuration.basic_info.intended_role);
    }
  }, [configuration.basic_info.intended_role]);

  useEffect(() => {
    if (websiteData.business_context) {
      setCompanyInfo(websiteData.business_context);
    }
  }, [websiteData.business_context]);

  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [welcomeMessage, setWelcomeMessage] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([])
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('')
  const [isCompanyInputFocused, setIsCompanyInputFocused] = useState<boolean>(false)

  // Validation state
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Validation helper functions
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'agent_name':
        const name = value.trim()
        if (!name) return 'Agent name is required'
        return null
      case 'intended_role':
        return null
      case 'target_industry':
        return null
      case 'company_name':
        return value.trim() ? null : 'Company name is required'
      default:
        return null
    }
  }, [])

  const handleFieldChange = useCallback((fieldName: string, value: string, updateFunction: (value: string) => void) => {
    updateFunction(value)
    
    // Mark field as touched
    setTouchedFields(prev => new Set(prev).add(fieldName))
    
    // Validate and update error
    const error = validateField(fieldName, value)
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      if (error) {
        newErrors[fieldName] = error
      } else {
        delete newErrors[fieldName]
      }
      return newErrors
    })
  }, [validateField])

  const isFieldValid = useCallback((fieldName: string): boolean => {
    return touchedFields.has(fieldName) && !fieldErrors[fieldName]
  }, [touchedFields, fieldErrors])

  const validateRequiredFields = useCallback((): { isValid: boolean; errors: string[] } => {
    const requiredFields = ['agent_name', 'company_name']
    const errors: string[] = []
    
    // Mark all required fields as touched
    setTouchedFields(prev => {
      const newTouched = new Set(prev)
      requiredFields.forEach(field => newTouched.add(field))
      return newTouched
    })
    
    // Validate each field
    requiredFields.forEach(field => {
      let value = ''
      switch (field) {
        case 'agent_name':
          value = configuration.basic_info.agent_name
          break
        case 'company_name':
          value = configuration.basic_info.company_name || ''
          break
      }
      
      const error = validateField(field, value)
      if (error) {
        errors.push(error)
        setFieldErrors(prev => ({ ...prev, [field]: error }))
      }
    })
    
    return { isValid: errors.length === 0, errors }
  }, [configuration.basic_info, validateField])

  // Auto-fill welcome message when agent name or company name changes
  useEffect(() => {
    if (configuration.basic_info.agent_name && configuration.basic_info.company_name) {
      const autoMessage = `Hi, I'm ${configuration.basic_info.agent_name} calling you from ${configuration.basic_info.company_name}`
      setWelcomeMessage(autoMessage)
    }
  }, [configuration.basic_info.agent_name, configuration.basic_info.company_name])

  // Initialize form data when editing
  useEffect(() => {
    if (editingAgent) {
      
      // Check if agent has configuration_data field with basic_info (database field)
      if (editingAgent.configuration_data?.basic_info) {
        setConfiguration({
          basic_info: editingAgent.configuration_data.basic_info
        })
        // Load extraction fields if they exist
        if (editingAgent.configuration_data.extraction_fields && Array.isArray(editingAgent.configuration_data.extraction_fields)) {
          // Check if fields are in new format (objects with name and description) or old format (strings)
          const fields = editingAgent.configuration_data.extraction_fields
          if (fields.length > 0 && typeof fields[0] === 'object') {
            setExtractionFields(fields)
          } else if (fields.length > 0 && typeof fields[0] === 'string') {
            // Convert old format to new format
            setExtractionFields(fields.map((field: string) => ({ name: field, description: '' })))
          } else {
            setExtractionFields([{ name: '', description: '' }])
          }
        }
      }
      // Check if agent has configuration field with basic_info (fallback)
      else if (editingAgent.configuration?.basic_info) {
        setConfiguration({
          basic_info: editingAgent.configuration.basic_info
        })
        // Load extraction fields if they exist (fallback)
        if (editingAgent.configuration.extraction_fields && Array.isArray(editingAgent.configuration.extraction_fields)) {
          // Check if fields are in new format (objects with name and description) or old format (strings)
          const fields = editingAgent.configuration.extraction_fields as any[]
          if (fields.length > 0 && typeof fields[0] === 'object' && 'name' in fields[0]) {
            setExtractionFields(fields as ExtractionField[])
          } else if (fields.length > 0 && typeof fields[0] === 'string') {
            // Convert old format to new format
            setExtractionFields(fields.map((field: string) => ({ name: field, description: '' })))
          } else {
            setExtractionFields([{ name: '', description: '' }])
          }
        }
      } else {
        // Fallback to extracting from variables for backward compatibility
        const variables = editingAgent.variables || {}
        const basicInfo: AgentBasicInfo = {
          agent_name: editingAgent.name || '',
          intended_role: variables.intended_role || '',
          target_industry: variables.target_industry || '',
          company_name: variables.company_name || '',
          primary_service: variables.primary_service || '',
        }
        
        setConfiguration({
          basic_info: basicInfo
        })
      }
      
      setSelectedVoice(editingAgent.voice_id || '')
      setWelcomeMessage(editingAgent.welcome_message || '')

      // Set company_id for super admin (auto-fill the company dropdown)
      if (editingAgent.company_id) {
        setSelectedCompanyId(editingAgent.company_id)
      }

      // Initialize business config fields from editing agent
      if (editingAgent.inbound_phone) {
        setInboundPhone(editingAgent.inbound_phone)
      }
      if (editingAgent.outbound_phone) {
        setOutboundPhone(editingAgent.outbound_phone)
      }
      if (editingAgent.region) {
        setRegion(editingAgent.region as 'indian' | 'international' | 'internal_india' | 'internal_us')
      }
      
      // Initialize auto-schedule fields from editing agent
      if (editingAgent.enable_sales_cycle !== undefined) {
        setSalesCycleEnabled(editingAgent.enable_sales_cycle)
      }
      if (editingAgent.default_call_days && editingAgent.default_call_days.length > 0) {
        // Ensure it's a number array
        const days = editingAgent.default_call_days.map(d => 
          typeof d === 'number' ? d : parseInt(String(d))
        )
        setSalesCycleCallDays(days)
      }
      // AI insights are now always enabled when auto-schedule is active
      
      // Initialize website data from editing agent if available
      if (editingAgent.website_data) {
        setWebsiteData({
          url: editingAgent.website_data.website_url || '',
          content: '',  // Content not needed for display
          faqs: editingAgent.website_data.generated_faqs || [],
          business_context: editingAgent.website_data.business_context || '',
          tasks: editingAgent.website_data.tasks || '',
          isLoaded: true
        })
        
        // Also set the website URL in configuration so it shows in the UI input field
        if (editingAgent.website_data?.website_url) {
          setConfiguration(prev => ({
            ...prev,
            company_website: editingAgent.website_data?.website_url
          }))
        }
        
        // Also set generated FAQs and tasks
        if (editingAgent.website_data.generated_faqs) {
          setGeneratedFAQs(editingAgent.website_data.generated_faqs)
        }
        if (editingAgent.website_data.tasks) {
          const parsedTasks = parseTasksString(editingAgent.website_data.tasks)
          setGeneratedTasks(parsedTasks)
        }
                
        // Set business context to primary_service so it shows in the UI
        if (editingAgent.website_data?.business_context) {
          setConfiguration(prev => ({
            ...prev,
            basic_info: { ...prev.basic_info, primary_service: editingAgent.website_data?.business_context }
          }))
        }
      }
    }
    
    // Initialize static sections for prompt assembly (always set when component initializes)
    if (!staticSections) {
      setStaticSections({
        notes: `##Notes
- At no point in conversation any example values should be used to hallucinate data if it's not given in the main prompt. Just say i'm not sure about it, i'll let this query addressed by our agent.
- Be concise: 2-3 sentences max, don't introduce yourself again and again, use varied language, avoid repetition, and collect all necessary details before proceeding.
- ACTIVE LISTENING RULE: If a customer volunteers information that answers an upcoming question, acknowledge it and skip that step. Never ask for information the customer already provided. For example, if they mention their goals early, don't ask about it later - acknowledge what they said and move forward.
- ADAPTIVE CONVERSATION: Don't rigidly follow the script steps. If customer provides information out of order, adapt your flow. Skip questions they've already answered and acknowledge what they've told you.
- ACKNOWLEDGE BEFORE MOVING ON: When customers provide information, always acknowledge it before proceeding. Say things like "Got it", "Understood", "Perfect", "I see", etc.- Be conversational: Use everyday language, making the chat feel friendly and casual, like talking to a friend.
- Steer the conversation back on track if it is veering off topic.
- Confirm unclear information and collect all necessary details before taking action.
- Never mention any internal functions or processes being called.
- Use empathetic and calming language when dealing with distressed users. If at any time the customer shows anger or requests a human agent, call transfer_call function.
- Use the user's name but not too much throughout the conversation to build rapport and provide reassurance.
- When mentioning dates in the past, use relative phrasing like '2 days ago', 'one week ago'.
- Remember what you are outputting is being spoken, Say 6:45 am as "six forty-five" not "six colon forty-five" or "six four five am". Do not use 'o-clock' in the same sentence as 'am' or 'pm'.
- Only answer questions relevant to your role. If the user asks you to do tasks outside of your scope, politely refuse and redirect the conversation.
- Never lie or make up information - accuracy is crucial for business success.`
    })
    }
  }, [editingAgent, staticSections])

  // Note: Website data is now loaded directly from editingAgent.website_data in the previous useEffect
  // This separate API call is kept as a fallback for older agents that might not have website_data populated
  useEffect(() => {
    const loadWebsiteData = async () => {
      // Only make the API call if editingAgent doesn't already have website_data
      if (editingAgent && tokens?.access_token && !editingAgent.website_data) {
        try {
          const websiteData = await AgentAPI.getWebsiteData(editingAgent.id, tokens.access_token)
          
          if (websiteData.generated_faqs && websiteData.generated_faqs.length > 0) {
            setGeneratedFAQs(websiteData.generated_faqs)
          }
          
          if (websiteData.business_context) {
            setConfiguration(prev => ({
              ...prev,
              basic_info: { ...prev.basic_info, primary_service: websiteData.business_context || undefined }
            }))
          }
          
          if (websiteData.tasks) {
            const parsedTasks = parseTasksString(websiteData.tasks)
            setGeneratedTasks(parsedTasks)
          }
          
          // Also update websiteData state and configuration
          if (websiteData.website_url) {
            setWebsiteData((prev: any) => ({
              ...prev,
              url: websiteData.website_url || '',
              isLoaded: true
            }))
            
            // Set in configuration so it shows in the UI input field
            setConfiguration(prev => ({
              ...prev,
              company_website: websiteData.website_url
            }))
          }
        } catch (error) {
          // Failed to load website data, silently continue
        }
      }
    }
    
    loadWebsiteData()
  }, [editingAgent, tokens])

  // Set default voice when voices are loaded
  useEffect(() => {
    if (voices && voices.length > 0 && !selectedVoice && !editingAgent) {
      setSelectedVoice(voices[0].id)
    }
  }, [voices, selectedVoice, editingAgent])

  // Fetch companies for super admin
  useEffect(() => {
    if (isSuperAdmin && tokens?.access_token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/super-admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.companies) {
            console.log('Companies loaded:', data.companies.length)
            setCompanies(data.companies.map((c: any) => ({ id: c.id, name: c.name })))
          }
        })
        .catch(err => logger.error('Failed to fetch companies:', err))
    }
  }, [isSuperAdmin, tokens])

  // Ref to track mounted state and cleanup
  const isMountedRef = useRef(true)

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      // Clear error state
      setError(null)
    }
  }, [])

  // Handler for toggling day selection (max 4 days)
  const handleDayToggle = useCallback((day: number) => {
    setSalesCycleCallDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      }
      // Limit to 4 days maximum
      if (prev.length >= 4) {
        toast.error('Maximum 4 days can be selected')
        return prev
      }
      return [...prev, day].sort((a, b) => a - b)
    })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const renderPage3_BusinessConfig = () => {
    // Get selected company name
    const selectedCompanyName = selectedCompanyId
      ? companies.find(c => c.id === selectedCompanyId)?.name || ''
      : '';

    // Filter companies based on search query - simple logic
    const filteredCompanies = companySearchQuery.trim().length > 0
      ? companies.filter(company =>
          company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
        )
      : companies; // Show all when search is empty

    // Show dropdown when focused
    const showCompanyDropdown = isCompanyInputFocused && !editingAgent;

    return (
      <div className="px-6 space-y-8">
        {isSuperAdmin && (
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Company Assignment</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assign to Company <span className="text-red-500">*</span>
                {editingAgent && <span className="ml-2 text-xs text-gray-500">(Cannot be changed)</span>}
              </label>

              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={isCompanyInputFocused ? companySearchQuery : selectedCompanyName}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCompanySearchQuery(newValue);
                    // Clear selection when user types (we cleared the input on focus, so any typing means changing selection)
                    if (selectedCompanyId) {
                      setSelectedCompanyId('');
                    }
                  }}
                  onFocus={() => {
                    setIsCompanyInputFocused(true);
                    // Always clear search query on focus to show full list
                    setCompanySearchQuery('');
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown item
                    setTimeout(() => {
                      setIsCompanyInputFocused(false);
                      // Always clear search query after blur
                      setCompanySearchQuery('');
                    }, 200);
                  }}
                  placeholder="Click to select or type to search companies..."
                  className={`w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                    editingAgent ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                  disabled={!!editingAgent}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              {/* Company List - Show when focused */}
              {showCompanyDropdown && (
                <div className="mt-2 border border-gray-300 rounded-md max-h-60 overflow-y-auto bg-white shadow-lg z-10">
                  {filteredCompanies.length > 0 ? (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        onMouseDown={(e) => {
                          // Use onMouseDown to fire before onBlur
                          e.preventDefault(); // Prevent input from losing focus
                          if (!editingAgent) {
                            console.log('Company selected:', company.id);
                            setSelectedCompanyId(company.id);
                            setCompanySearchQuery('');
                            setIsCompanyInputFocused(false);
                          }
                        }}
                        className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                          selectedCompanyId === company.id
                            ? 'bg-blue-50 border-l-4 border-l-blue-500'
                            : 'hover:bg-gray-50'
                        } ${editingAgent ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {company.name}
                          </span>
                          {selectedCompanyId === company.id && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-gray-500">
                      No companies found matching &quot;{companySearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}

              {!selectedCompanyId && !editingAgent && (
                <p className="mt-2 text-sm text-red-600">Please select a company to assign this agent to</p>
              )}
              {selectedCompanyId && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Selected: {companies.find(c => c.id === selectedCompanyId)?.name || 'Unknown'}
                </p>
              )}
            </div>
          </div>
        )}

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Business Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value as 'indian' | 'international' | 'internal_india' | 'internal_us')}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
              disabled={!!editingAgent}
            >
              <option value="indian">India</option>
              <option value="international">International</option>
              <option value="internal_india">Internal India</option>
              <option value="internal_us">Internal US</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {editingAgent ? 'Region cannot be changed after agent creation.' : 'Select the agent\'s region. This cannot be changed later.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Telephony</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="inbound_phone" className="block text-sm font-medium text-gray-700 mb-2">
              Inbound Phone Number
            </label>
            <Input
              id="inbound_phone"
              type="tel"
              value={inboundPhone}
              onChange={(e) => setInboundPhone(e.target.value)}
              placeholder="Unavailable"
              className="w-full bg-gray-100"
              disabled={true}
            />
            <p className="text-xs text-gray-500 mt-1">Phone number for incoming calls.</p>
          </div>
          <div>
            <label htmlFor="outbound_phone" className="block text-sm font-medium text-gray-700 mb-2">
              Outbound Phone Number
            </label>
            <div className="relative">
              <Input
                id="outbound_phone"
                type="tel"
                value={region === 'indian' ? '' : outboundPhone}
                onChange={(e) => setOutboundPhone(e.target.value)}
                placeholder={region === 'indian' ? 'Managed by us' : "+1 (555) 987-6543"}
                className="w-full bg-gray-100 pr-10"
                disabled={true}
              />
              <InlineInfoTooltip text='Contact support to get a custom number.' />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {region === 'indian' ? 'A +91 number will be assigned.' : 'Phone number for outgoing calls.'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Auto-Schedule Configuration
          </h3>
          <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full font-medium">Auto-Enabled</span>
        </div>
        <p className="text-sm text-gray-600 mb-6">Choose up to 4 days from the 14-day cycle when calls should be made.</p>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Call Days (Maximum 4)
          </label>
          
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {salesCycleCallDays.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {salesCycleCallDays.length} {salesCycleCallDays.length === 1 ? 'day' : 'days'} selected
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {salesCycleCallDays.slice(0, 4).map(day => (
                          <span key={day} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                            Day {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Select days...</span>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Select Days ({salesCycleCallDays.length}/4 selected)
                    </span>
                    {salesCycleCallDays.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSalesCycleCallDays([])}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => {
                      const isSelected = salesCycleCallDays.includes(day)
                      const isDisabled = !isSelected && salesCycleCallDays.length >= 4
                      
                      const getDayLabel = (d: number) => {
                        if (d === 1) return 'Day 1 (next day)'
                        return `Day ${d}`
                      }
                      
                      return (
                        <label
                          key={day}
                          className={`
                            flex items-center px-3 py-2 rounded cursor-pointer transition-colors
                            ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 
                              isDisabled ? 'bg-gray-50 cursor-not-allowed opacity-50' : 
                              'hover:bg-gray-50'}
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={() => handleDayToggle(day)}
                            className="mr-2 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className={`text-sm ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                            {getDayLabel(day)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
                
                <div className="p-3 border-t border-gray-100 bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Calls will be scheduled on selected days within a 14-day cycle.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3">
            <p className="text-xs text-gray-600">
              <strong>Current selection:</strong> {salesCycleCallDays.length > 0 ? 
                `Days ${salesCycleCallDays.join(', ')}` : 
                'No days selected'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


  // 3-Page Navigation Logic (Page 1 removed)
  const handleNextPage = useCallback(() => {
    if (currentPage === 1) {
      // Page 1 is Prompt Builder, navigate to Page 2 (Data Extraction)
      setCurrentPage(2)
    } else if (currentPage === 2) {
      // Page 2 is Data Extraction, navigate to Page 3 (Configuration)
      setCurrentPage(3)
    } else if (currentPage === 3) {
      // Page 3 is the last page - Configuration & Auto-Schedule
      // No more pages to navigate to
    }
    setError(null)
  }, [currentPage, validateRequiredFields])

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => (prev - 1) as 1 | 2 | 3)
      setError(null) // Clear any existing errors when going back
    }
  }, [currentPage])

  // Get current page title and description
  const getCurrentPageInfo = useMemo(() => {
    const pageInfo = {
      1: {
        title: 'Prompt Builder',
        description: 'Build a comprehensive prompt for your AI agent using our guided wizard.'
      },
      2: {
        title: 'Data Extraction',
        description: 'Configure what information your AI agent should capture from conversations.'
      },
      3: {
        title: 'Configuration & Auto-Schedule',
        description: 'Configure business settings and automated call scheduling with intelligent timing.'
      }
    }
    return pageInfo[currentPage]
  }, [currentPage])


  const handleComplete = useCallback(async () => {
    // Check if component is still mounted
    if (!isMountedRef.current) return;

    // Debug logging
    console.log('handleComplete - selectedCompanyId:', selectedCompanyId, 'isSuperAdmin:', isSuperAdmin)

    // Check if super admin has selected a company
    if (isSuperAdmin && !selectedCompanyId) {
      toast.error('Please select a company to assign this agent to')
      return
    }

    if (!tokens?.access_token || !selectedVoice) {
      toast.error('Please select a voice for your agent')
      return
    }


    // Robust prompt selection: use generatedPrompt
    let finalPrompt = (generatedPrompt || '').trim()
    if (!finalPrompt) {
      toast.error('Please generate or enter a prompt')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Send the final prompt directly to backend
      // Use generatedPrompt from backend if available, otherwise fall back to frontend-assembled prompt
      const promptToSave = generatedPrompt || finalPrompt
      const agentData = {
        name: configuration.basic_info.agent_name,
        voice_id: selectedVoice,
        prompt: promptToSave,  // Send clean prompt without prepended instructions
        welcome_message: welcomeMessage || '',  // Include welcome message
        configuration_data: {
          ...configuration,
          business_hours_start: '09:00',
          business_hours_end: '18:00',
          timezone: getTimezoneFromPhone(user?.phone),
          extraction_fields: extractionFields
            .filter(field => field.name.trim() !== '')
            .map(field => ({
              name: field.name.trim().toLowerCase().replace(/\s+/g, '_'), // Convert to snake_case
              description: field.description.trim()
            }))
        },
        region: region,
        inbound_phone: inboundPhone || undefined,
        outbound_phone: region === 'indian' ? undefined : (outboundPhone || undefined),
        // Include company_id for super admins
        ...(isSuperAdmin && selectedCompanyId ? { company_id: selectedCompanyId } : {}),
        // Auto-Schedule Configuration
        enable_sales_cycle: salesCycleEnabled,
        default_call_days: salesCycleCallDays,
        sales_cycle_config: salesCycleEnabled ? {
          enable_ai_insights: true,  // Always enable AI insights when auto-schedule is active
          stages: ['initial_contact', 'qualification', 'proposal', 'negotiation', 'closing']
        } : undefined,
        // Include website data for new agents from browser storage
        ...((!editingAgent && websiteData.isLoaded) ? { website_data: websiteData } : {})
      }
      
      // Check if we have website data for new agents
      if (!editingAgent && websiteData.isLoaded) {
        // Website data is available
      }
      
      let agent: Agent
      if (editingAgent) {
        agent = await AgentAPI.updateAgent(editingAgent.id, agentData, tokens.access_token)
        toast.success('Agent updated successfully')
      } else {
        agent = await AgentAPI.createAgentWithConfiguration(agentData, tokens.access_token)
        toast.success('Agent created successfully')
      }

      // Clear website data from browser storage after successful creation
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('agent-wizard-website-data')
      }
      
      onComplete(agent)
      // Reset state after successful completion
      resetWizardState()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save agent')
      toast.error('Failed to save agent')
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [
    tokens?.access_token,
    selectedVoice,
    generatedPrompt,
    configuration,
    editingAgent,
    onComplete,
    region,
    inboundPhone,
    outboundPhone,
    websiteData,
    welcomeMessage,
    user,
    voices,
    selectedCompanyId,
    isSuperAdmin,
    salesCycleEnabled,
    salesCycleCallDays,
    extractionFields
    // Note: resetWizardState and onClose are stable callbacks with no deps, so they don't need to be in this array
  ])


  const renderPage = () => {
    switch (currentPage) {
      case 1:
        return renderPage0_PromptBuilder()
      case 2:
        return renderPage2_AIGeneration()
      case 3:
        return renderPage3_BusinessConfig()
      default:
        return renderPage0_PromptBuilder()
    }
  }

    // Page 1: Prompt Builder (with 5 sub-steps)
  const renderPage0_PromptBuilder = () => {
    const renderSubStep = () => {
      switch (currentSubStep) {
        case 1:
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 shadow-sm border border-blue-100">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-base font-bold text-gray-900">Basic Information</h3>
                </div>
                <p className="text-xs text-gray-600">
                  Define your agent&apos;s identity and core details.
                </p>
              </div>

              {/* BLOCK 0: Voice Configuration & Agent Role - Moved to Top */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-2 border border-gray-200 shadow-sm space-y-2">
                {/* Row 1: Voice Selection + Call Type */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Voice Selection Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Mic className="h-5 w-5 text-blue-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        Voice
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                    </div>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-900 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Choose a voice...</option>
                      {voices?.map((voice: any) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Call Type Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        Call Type
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                    </div>
                    <select
                      value={callType}
                      onChange={(e) => setCallType(e.target.value as 'inbound' | 'outbound')}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm font-medium text-gray-900 appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="inbound">Inbound</option>
                      <option value="outbound">Outbound</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Agent Role + Industry */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Agent Role Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-5 w-5 text-green-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        What does this agent do?
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <ExampleButton
                        isOpen={showExamples.agent_role}
                        onMouseEnter={() => handleExampleMouseEnter('agent_role')}
                        onMouseLeave={() => handleExampleMouseLeave('agent_role')}
                      />
                    </div>

                    {/* Collapsible Example */}
                    <ExampleContent isOpen={showExamples.agent_role}>
                      <div className="space-y-2 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                            📞 Lead Qualification
                          </p>
                          <ul className="text-xs text-gray-700 space-y-0.5 ml-3 mt-0.5">
                            <li>• Qualify prospects</li>
                            <li>• Gather customer information</li>
                            <li>• Route qualified leads</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                            💼 Debt Collection
                          </p>
                          <ul className="text-xs text-gray-700 space-y-0.5 ml-3 mt-0.5">
                            <li>• Follow up on payments</li>
                            <li>• Schedule payment plans</li>
                            <li>• Professional reminders</li>
                          </ul>
                        </div>
                      </div>
                    </ExampleContent>

                    <select
                      value={configuration.basic_info.intended_role}
                      onChange={(e) => handleFieldChange('intended_role', e.target.value, (value) =>
                        setConfiguration(prev => ({
                          ...prev,
                          basic_info: { ...prev.basic_info, intended_role: value }
                        }))
                      )}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-sm font-medium text-gray-900 appearance-none cursor-pointer ${
                        touchedFields.has('intended_role') && fieldErrors['intended_role'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Select agent role...</option>
                      <option value="Lead Qualification">📞 Lead Qualification - Qualify leads, gather information</option>
                      <option value="Debt Collection">💼 Debt Collection - Follow up on payments</option>
                    </select>

                    {touchedFields.has('intended_role') && fieldErrors['intended_role'] && (
                      <p className="text-red-500 text-xs mt-2">{fieldErrors['intended_role']}</p>
                    )}
                  </div>

                  {/* Industry Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-5 w-5 text-orange-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        Industry (optional)
                      </label>
                      <ExampleButton
                        isOpen={showExamples.industry}
                        onMouseEnter={() => handleExampleMouseEnter('industry')}
                        onMouseLeave={() => handleExampleMouseLeave('industry')}
                      />
                    </div>

                    {/* Collapsible Example */}
                    <ExampleContent isOpen={showExamples.industry}>
                      <div className="space-y-1.5 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">🎯 Benefits:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5 ml-3">
                            <li>• Better terminology recognition</li>
                            <li>• Industry-appropriate responses</li>
                            <li>• Improved conversation quality</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">💡 Example:</p>
                          <p className="text-xs text-gray-700 bg-white/60 rounded px-2 py-1">
                            Real Estate → understands terms like &apos;closing&apos;, &apos;escrow&apos;, &apos;listing&apos;
                          </p>
                        </div>
                      </div>
                    </ExampleContent>

                    <select
                      value={configuration.basic_info.target_industry}
                      onChange={(e) => handleFieldChange('target_industry', e.target.value, (value) =>
                        setConfiguration(prev => ({
                          ...prev,
                          basic_info: { ...prev.basic_info, target_industry: value }
                        }))
                      )}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-sm font-medium text-gray-900 appearance-none cursor-pointer ${
                        touchedFields.has('target_industry') && fieldErrors['target_industry'] ? 'border-red-500' : 'border-gray-300'
                      }`}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1.5em 1.5em',
                        paddingRight: '2.5rem'
                      }}
                    >
                      <option value="">Select Industry</option>
                      <option value="Automotive">Automotive</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Technology/SaaS">Technology/SaaS</option>
                      <option value="Insurance">Insurance</option>
                      <option value="Finance">Finance</option>
                      <option value="Retail">Retail</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>

                    {touchedFields.has('target_industry') && fieldErrors['target_industry'] && (
                      <p className="text-red-500 text-xs mt-2">{fieldErrors['target_industry']}</p>
                    )}
                  </div>
                </div>

                {/* Row 3: Agent Name + Company Name */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Agent Name Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-indigo-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        Agent Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <ExampleButton
                        isOpen={showExamples.agent_name}
                        onMouseEnter={() => handleExampleMouseEnter('agent_name')}
                        onMouseLeave={() => handleExampleMouseLeave('agent_name')}
                      />
                    </div>
                    <div className="relative mb-2">
                      <Input
                        type="text"
                        value={agentName}
                        onChange={(e) => handleFieldChange('agent_name', e.target.value, setAgentName)}
                        placeholder="e.g., Sarah, Maya, Alex"
                        className={`bg-gray-50 text-gray-900 placeholder-gray-400 font-medium pr-10 ${
                          touchedFields.has('agent_name') && fieldErrors['agent_name'] ? 'border-red-500' : ''
                        }`}
                      />
                      {isFieldValid('agent_name') && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {touchedFields.has('agent_name') && fieldErrors['agent_name'] && (
                      <p className="text-red-500 text-xs mb-2">{fieldErrors['agent_name']}</p>
                    )}
                    <ExampleContent isOpen={showExamples.agent_name}>
                      <div className="space-y-1.5 mb-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">💡 Example Introduction:</p>
                          <p className="text-xs text-gray-700 italic bg-white/60 rounded px-2 py-1">
                            &quot;Hi, I&apos;m Sarah from Dream Homes Realty. How can I help you today?&quot;
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">✨ Best Practices:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5 ml-3">
                            <li>• Choose a friendly, easy-to-pronounce name</li>
                            <li>• Match your voice selection</li>
                            <li>• Keep it professional yet approachable</li>
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-1.5">💫 Popular choices:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {['Sarah', 'Priya', 'Alex', 'Maya', 'Raj'].map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => handleFieldChange('agent_name', name, setAgentName)}
                                className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </ExampleContent>
                  </div>

                  {/* Company Name Card */}
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-5 w-5 text-pink-600" />
                      <label className="text-sm font-semibold text-gray-900">
                        Company Name
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <ExampleButton
                        isOpen={showExamples.company_name}
                        onMouseEnter={() => handleExampleMouseEnter('company_name')}
                        onMouseLeave={() => handleExampleMouseLeave('company_name')}
                      />
                    </div>
                    <div className="relative mb-2">
                      <Input
                        type="text"
                        value={configuration.basic_info.company_name || ''}
                        onChange={(e) => handleFieldChange('company_name', e.target.value, (value) =>
                          setConfiguration(prev => ({
                            ...prev,
                            basic_info: { ...prev.basic_info, company_name: value }
                          }))
                        )}
                        placeholder="e.g., Dream Homes Realty"
                        className={`bg-gray-50 text-gray-900 placeholder-gray-400 font-medium pr-10 ${
                          touchedFields.has('company_name') && fieldErrors['company_name'] ? 'border-red-500' : ''
                        }`}
                      />
                      {isFieldValid('company_name') && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      )}
                    </div>
                    {touchedFields.has('company_name') && fieldErrors['company_name'] && (
                      <p className="text-red-500 text-xs mb-2">{fieldErrors['company_name']}</p>
                    )}
                    <ExampleContent isOpen={showExamples.company_name}>
                      <div className="space-y-1.5">
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">💬 What callers will hear:</p>
                          <p className="text-xs text-gray-700 italic bg-white/60 rounded px-2 py-1">
                            &quot;I&apos;m calling from Dream Homes Realty&quot;
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-800 mb-0.5">📝 Tips:</p>
                          <ul className="text-xs text-gray-700 space-y-0.5 ml-3">
                            <li>• Use your official business name</li>
                            <li>• Keep it clear and recognizable</li>
                            <li>• Avoid abbreviations if possible</li>
                          </ul>
                        </div>
                      </div>
                    </ExampleContent>
                  </div>
                </div>
              </div>

              {/* Agent Identity Section */}
              <div className="space-y-5">
                {/* BLOCK 3: Welcome Message (formerly BLOCK 4) */}
                <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-4 border-l-4 border-l-gray-400">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Welcome Message
                      <InfoTooltip text="The initial greeting your agent will use to start conversations. This sets the tone and provides context for the call recipient." />
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={welcomeMessage || ''}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Hi, I'm [Agent Name] calling you on behalf of [Company Name]"
                        className="w-full px-3 py-2.5 text-sm bg-gray-50 text-gray-900 placeholder-gray-400 font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 overflow-x-auto whitespace-nowrap"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#CBD5E0 #F7FAFC' }}
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Company Information Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-3">
                  {/* Header */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">🧠</span>
                      <h3 className="text-sm font-bold text-gray-900">Company Information</h3>
                    </div>
                    <p className="text-xs text-gray-600">How should the AI learn about your company?</p>
                  </div>

                  {/* URL Input */}
                  <div className="mb-2">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input
                          value={configuration.company_website || ''}
                          onChange={(e) => setConfiguration(prev => ({
                            ...prev,
                            company_website: e.target.value
                          }))}
                          placeholder="https://yourcompany.com"
                          className="bg-white text-xs text-gray-900 placeholder-gray-400 font-medium border-2 border-gray-300"
                        />
                      </div>
                      <LoadingButton
                        onClick={handleWebsiteScraping}
                        isLoading={isGenerating}
                        text="✨ Extract"
                        loadingText="Extracting..."
                        disabled={!configuration.company_website}
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs px-3 py-2"
                      />
                    </div>
                  </div>

                  {/* Detailed Textarea */}
                  <textarea
                    value={configuration.basic_info.primary_service || ''}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      basic_info: { ...prev.basic_info, primary_service: e.target.value }
                    }))}
                    placeholder={isGenerating ? "🔍 Extracting information from your website..." : "Paste your website URL above and click 'Extract' to auto-generate this information, or manually type:\n\n• Company Overview: What does your business do? What industry are you in?\n• Products & Services: What do you offer? Key features and benefits?\n• Target Audience: Who are your ideal customers?\n• Unique Value: What makes you different from competitors?\n• Company Mission: Your goals and values\n• Key Information: Pricing, availability, locations, or other important details\n\nThe more context you provide, the better your AI agent can represent your business!"}
                    className="w-full p-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-xs text-gray-900 placeholder-gray-500"
                    rows={6}
                    style={{
                      minHeight: '120px'
                    }}
                  />

                  {/* Bottom Note */}
                  <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      <span className="font-semibold">⚡ AI will auto-fill this field from your website, or you can type it yourself</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Dynamic Variables Section */}
              <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                {/* Header - Clickable */}
                <button
                  onClick={() => setIsAddVariablesSectionCollapsed(!isAddVariablesSectionCollapsed)}
                  className="w-full text-left mb-4 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {isAddVariablesSectionCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                        <h3 className="text-sm font-bold text-gray-900">Add Variables</h3>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">Define placeholders for customer-specific data</p>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Click to learn more</span>
                  </div>
                </button>

                {/* Collapsible Content */}
                {!isAddVariablesSectionCollapsed && (
                <>
                {/* What are Variables Info Box - Hover-based */}
                <div className="mb-3">
                  <ExampleButton
                    isOpen={showExamples.what_are_variables}
                    onMouseEnter={() => handleExampleMouseEnter('what_are_variables')}
                    onMouseLeave={() => handleExampleMouseLeave('what_are_variables')}
                  />

                  <ExampleContent isOpen={showExamples.what_are_variables}>
                    <div className="space-y-3">
                      <p className="text-xs text-gray-700">
                        Variables are placeholders that automatically fill with customer-specific information in your AI calls.
                      </p>

                      {/* Before/After Example */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-0.5">Before</p>
                          <div className="bg-white border border-gray-200 rounded-lg p-1.5">
                            <p className="text-xs text-gray-800">
                              &quot;Hello <span className="font-mono text-blue-600">{'{name}'}</span>, your payment of <span className="font-mono text-blue-600">{'{amount}'}</span> is due on March <span className="font-mono text-blue-600">{'{due_date}'}</span>&quot;
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-0.5">After</p>
                          <div className="bg-white border border-gray-200 rounded-lg p-1.5">
                            <p className="text-xs text-gray-800">
                              &quot;Hello <span className="font-semibold text-green-600">Sarah</span>, your payment of <span className="font-semibold text-green-600">$150</span> is due on <span className="font-semibold text-green-600">March 15th</span>&quot;
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="space-y-1">
                        <div className="flex items-start gap-2">
                          <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Automatically included in your AI prompt</span> — just type the variable name
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-700">
                            <span className="font-semibold">Set once, use forever</span> across thousands of calls
                          </p>
                        </div>
                      </div>
                    </div>
                  </ExampleContent>
                </div>

                {/* Existing Variables List */}
                {dynamicVariables.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-900 mb-2">Your Variables ({dynamicVariables.length})</h4>
                    <div className="space-y-2">
                      {dynamicVariables.map((variable, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-mono text-xs font-semibold text-gray-900">{variable.name}</p>
                            <p className="text-[10px] text-gray-600 mt-0.5">{variable.description}</p>
                          </div>
                          <Button
                            onClick={() => handleRemoveVariable(index)}
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 text-red-600 hover:text-red-700 hover:border-red-300"
                            title="Remove this variable"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Create New Variable Form */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3">Create New Variable</h4>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Variable Name */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Variable Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVariableName}
                        onChange={(e) => handleNewVariableNameChange(e.target.value)}
                        placeholder="customer_name"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs bg-white"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Use lowercase with underscores</p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Description<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newVariableDescription}
                        onChange={(e) => setNewVariableDescription(e.target.value)}
                        placeholder="e.g., The customer's full name"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                      />
                      <p className="text-[10px] text-gray-500 mt-0.5">Explain what this variable represents</p>
                    </div>
                  </div>

                  {/* Add Variable Button */}
                  <Button
                    onClick={handleAddVariable}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs py-2"
                  >
                    <Plus className="h-3 w-3 mr-1.5" />
                    Add Variable
                  </Button>
                </div>
                </>
                )}
              </div>

              {/* Prompt Name and Description */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-100 shadow-sm p-4">
                {/* Header with Title and Action Buttons */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm">What should be the agent conversation flow</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Example Button */}
                    <ExampleButton
                      isOpen={showExamples.what_agent_does}
                      onMouseEnter={() => handleExampleMouseEnter('what_agent_does')}
                      onMouseLeave={() => handleExampleMouseLeave('what_agent_does')}
                    />

                    {/* Paste Transcript Button */}
                    <button
                      type="button"
                      onClick={() => setInputMethod('type')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                      <span className="text-sm">📝</span>
                      <span>Paste Transcript</span>
                    </button>

                    {/* Upload Recording Button */}
                    <button
                      type="button"
                      onClick={() => setInputMethod('upload')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                      <span className="text-sm">🎤</span>
                      <span>Upload Recording</span>
                    </button>
                  </div>
                </div>

                {/* Example Content - Shows on Hover */}
                <ExampleContent isOpen={showExamples.what_agent_does}>
                  <div className="space-y-2">
                    <div className="text-center">
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        Provide Sample Conversation
                      </h3>
                      <p className="text-xs text-gray-700">
                        Paste a transcript or upload a call recording to create your agent&apos;s conversation flow
                      </p>
                    </div>

                    <div className="bg-white/60 border border-blue-300 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-800">
                          <p className="font-semibold mb-0.5">How it works:</p>
                          <p>Provide an example of how your agent should handle calls. We&apos;ll use it to generate a complete conversation script that your AI agent will follow.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ExampleContent>

                <div className="space-y-4">

                    {/* Conditional Content Based on Selection */}
                    {inputMethod === 'type' && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-indigo-600 rounded">
                              <FileText className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-800">
                                Type or Paste Text
                              </span>
                              <p className="text-[10px] text-gray-600">Describe the agent&apos;s behavior or paste a call transcript</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInputMethod(null)}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change method
                          </button>
                        </div>
                        <textarea
                          value={promptDescription}
                          onChange={(e) => setPromptDescription(e.target.value)}
                          placeholder="Paste your call transcript here...

Example:
Agent: Hi, this is Sarah from TechSolutions. Is this John?
Customer: Yes, speaking.
Agent: Great! I'm calling about your recent inquiry..."
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                          rows={6}
                        />
                      </div>
                    )}

                    {inputMethod === 'upload' && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-blue-600 rounded">
                              <Mic className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-800">
                                Upload Audio Recordings
                              </span>
                              <p className="text-[10px] text-gray-600">We&apos;ll automatically transcribe them for you</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setInputMethod(null)}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change method
                          </button>
                        </div>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.mp4,.mpeg,.opus,.wma,.amr,.3gp"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="audio-upload"
                        />

                        {!selectedFiles ? (
                          <label
                            htmlFor="audio-upload"
                            className="flex items-center justify-center w-full px-3 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Upload className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-xs text-gray-600">
                              Click to upload audio files or drag and drop
                            </span>
                          </label>
                        ) : (
                          <div className="space-y-2">
                            {/* Selected Files List */}
                            <div className="bg-white p-2 rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-700 font-medium mb-1.5">
                                Selected Files ({selectedFiles.length})
                              </div>
                              {Array.from(selectedFiles).map((file, index) => (
                                <div key={index} className="flex items-center justify-between py-0.5">
                                  <span className="text-xs text-gray-600">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={handleTranscribeFiles}
                                disabled={isTranscribing}
                                size="sm"
                                className="flex-1"
                              >
                                {isTranscribing ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Transcribing...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Transcribe & Add to Description
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={handleRemoveFiles}
                                disabled={isTranscribing}
                                variant="outline"
                                size="sm"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Progress Bar */}
                            {transcriptionProgress && (
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                  <span>{transcriptionProgress.message}</span>
                                  <span>{transcriptionProgress.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${transcriptionProgress.percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                          <span className="font-medium">Supported:</span> mp3, wav, m4a, ogg, webm, aac, flac, mp4, mpeg, opus
                        </p>

                        {/* Show transcript after transcription */}
                        {promptDescription && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Transcribed Text
                            </label>
                            <textarea
                              value={promptDescription}
                              onChange={(e) => setPromptDescription(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                              rows={6}
                              placeholder="Transcription will appear here. You can edit it after..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              {/* Sample Conversation Flow Preview - Only show when no generated content */}
              {!(conversationFlow || additionalQA.length > 0) && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start gap-2 mb-3">
                  <div className="p-1.5 bg-gray-600 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">Sample Conversation Flow</h4>
                    <p className="text-xs text-gray-600">
                      Here&apos;s what your AI-generated conversation flow will look like
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
{`### CONVERSATION FLOW
### Step 1: Initial Greeting
"Good afternoon, How Can I help you?"

Listen for keywords to determine path:
- Keywords: "switching off", "power points out" → PATH A (POWER ISSUE)
- Keywords: "electrician", "quote", "cost" → PATH B (STANDARD BOOKING)
- Keywords: "burning smell", "sparks" → PATH C (SAFETY CONCERN)
- Keywords: "rusted pole", "replacement", "green box" → PATH D (STRUCTURAL ISSUE)

---

## PATH A – POWER ISSUE (When customer reports electrical problems)

### A1. Confirm Issue
"Okay. Are the lights working in the property?"

**Required actions:**
1. Confirm which areas are affected.
2. Determine if it's a complete power outage or specific to certain areas.

### A2. Diagnose Problem
"Okay, so downstairs all the power points are out. Is that correct?"

**Required actions:**
1. Verify the specific issue.
2. Prepare to dispatch a technician.

### A3. Schedule Technician
"Yeah, sure. I can have my technician out there for you this afternoon sometime between now and two pm."

**Required actions:**
1. Check technician availability.
2. Confirm appointment time with the customer.

---

## PATH B – STANDARD BOOKING (When customer requests service and pricing)

### B1. Provide Pricing Information
"Our call out fee is ninety five dollars plus gst. And then any additional work on top. The technician will give you a quote before any works are commenced."

**Required actions:**
1. Clearly state the call-out fee.`}
                  </pre>
                </div>

                <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    <span className="font-semibold">Note:</span> This is just an example. Your actual conversation flow will be customized based on the transcript or recording you provide above.
                  </p>
                </div>
              </div>
              )}

              {/* Generated Conversation Flow - Only show after generation */}
              {(conversationFlow || additionalQA.length > 0) && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-100 shadow-sm p-4">
                  <div className="mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="p-1.5 bg-green-600 rounded-lg">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="font-bold text-gray-900 text-sm">AI-Generated Conversation Script</h4>
                          <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded">Auto-Generated</span>
                        </div>
                        <p className="text-xs text-gray-600">
                          Review how your AI agent will talk to customers during calls.
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="flex items-start gap-2">
                        <Info className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-900">
                          <p className="font-semibold mb-0.5">What is this?</p>
                          <p>This conversation script shows the step-by-step flow your agent will follow. You can edit it to adjust any part of the conversation.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center text-sm font-semibold text-gray-900">
                        <FileText className="h-4 w-4 text-green-600 mr-2" />
                        Conversation Steps & FAQs
                      </label>
                      <span className="text-xs text-gray-500 italic">Click to edit and customize</span>
                    </div>
                    <textarea
                      value={
                        (additionalQA.length > 0 ? `## ADDITIONAL Q&A RESPONSES\n\n${formatAdditionalQA(additionalQA)}\n\n` : '') +
                        (conversationFlow ? `## CONVERSATION FLOW\n\n${conversationFlow}` : '')
                      }
                      onChange={(e) => {
                        // For now, only update conversationFlow section
                        const content = e.target.value
                        const flowMatch = content.match(/## CONVERSATION FLOW\n\n([\s\S]*)/);
                        if (flowMatch) {
                          setConversationFlow(flowMatch[1].trim())
                        } else {
                          setConversationFlow(content)
                        }
                      }}
                      placeholder="Your AI-generated FAQs and conversation flow will appear here after generating the prompt..."
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-xs bg-white resize-y"
                      rows={10}
                      style={{ minHeight: '250px' }}
                    />
                    <p className="text-xs text-gray-600 mt-1.5 flex items-start gap-1">
                      <span className="font-medium">💡 Tip:</span>
                      <span>Adjust the conversation steps to match your specific needs. You can add, remove, or modify any part.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-center shadow-lg">
                <h4 className="text-white font-bold text-lg mb-2">Ready to Generate?</h4>
                <p className="text-purple-100 text-sm mb-4">
                  AI will analyze your description and create a comprehensive prompt
                </p>
                <button
                  onClick={handleGeneratePromptStep0}
                  disabled={
                    !promptDescription ||
                    !agentName ||
                    !configuration.basic_info.intended_role ||
                    !configuration.basic_info.company_name ||
                    !configuration.basic_info.target_industry ||
                    !selectedVoice ||
                    isGeneratingPrompt
                  }
                  className="inline-flex items-center justify-center min-w-[250px] py-3 px-6 bg-white text-purple-600 hover:bg-gray-100 font-semibold shadow-lg rounded-lg transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 border border-purple-200"
                >
                  {isGeneratingPrompt ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent mr-2" />
                      Generating with AI...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Generate Prompt
                    </>
                  )}
                </button>
              </div>
            </div>
          )

        case 3:
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100 shadow-sm p-6">
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">AI-Generated Exception Handling</h4>
                        <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Auto-Generated</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        How your agent handles unexpected situations during calls. This was created from your Step 1 description.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-1">What are edge cases?</p>
                        <p>Edge cases are unusual situations your agent might face—like when a customer gets angry, gives unclear answers, or technical issues occur. The AI created responses for common scenarios based on your agent&apos;s role and purpose.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center text-base font-semibold text-gray-900">
                      <AlertTriangle className="h-5 w-5 text-purple-600 mr-2" />
                      Exception Handling Rules
                    </label>
                    <span className="text-xs text-gray-500 italic">Click to edit and customize</span>
                  </div>
                  <textarea
                    value={edgeCases}
                    onChange={(e) => setEdgeCases(e.target.value)}
                    placeholder="Your AI-generated edge case responses will appear here after generating the prompt in Step 1..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm bg-white resize-y"
                    rows={8}
                    style={{ minHeight: '200px' }}
                  />
                  <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                    <span className="font-medium">💡 Tip:</span>
                    <span>You can add more scenarios or modify existing responses to match your specific needs.</span>
                  </p>
                </div>
              </div>
            </div>
          )

        case 4:
          // Skip directly to Review & Finalize - Rules & Compliance hidden but kept in backend
        case 5:
          return (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-100 shadow-sm p-6">
                <div className="mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-indigo-600 rounded-lg">
                      <Eye className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900 text-lg">Final Review & Configuration</h4>
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-1 rounded">Ready to Launch</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Your AI agent is ready! Review all settings below before creating your agent.
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-900">
                        <p className="font-semibold mb-1">What happens next?</p>
                        <p>Once you click &apos;Create Agent&apos;, your AI agent will be created with all the settings below. You can edit these anytime later from the agent management page.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center text-base font-semibold text-gray-900">
                      <FileText className="h-5 w-5 text-indigo-600 mr-2" />
                      Complete Agent Prompt
                    </label>
                    <span className="text-xs text-gray-500 italic">Auto-generated from your inputs</span>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200 max-h-80 overflow-auto font-mono">
                    {generatePromptForDisplay() || (
                      <span className="text-gray-400 italic">No content to preview - please fill in the required fields</span>
                    )}
                  </pre>
                  <p className="text-xs text-gray-600 mt-2">
                    📜 This is the final prompt that will guide your AI agent&apos;s behavior during calls
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-base">Agent Configuration Summary</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Prompt Name</span>
                      <p className="text-sm text-gray-900 font-medium">{promptName || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Agent Name</span>
                      <p className="text-sm text-gray-900 font-medium">{agentName || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Company Name</span>
                      <p className="text-sm text-gray-900 font-medium">{configuration.basic_info.company_name || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Agent&apos;s Role</span>
                      <p className="text-sm text-gray-900 font-medium">{configuration.basic_info.intended_role || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Industry</span>
                      <p className="text-sm text-gray-900 font-medium">{configuration.basic_info.target_industry || 'Not set'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-medium text-gray-500 block mb-1">Custom Data Fields</span>
                      <p className="text-sm text-gray-900 font-medium">{dynamicVariables.filter(v => v.name).length} defined</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-4 flex items-start gap-1">
                    <span className="font-medium">💡 Tip:</span>
                    <span>You can edit any of these settings after creating the agent from the agent management page.</span>
                  </p>
                </div>
              </div>
            </div>
          )

        default:
          return null
      }
    }

    return (
      <div className="space-y-6">
        {/* Render current sub-step */}
        {renderSubStep()}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          {currentSubStep > 1 && (
            <Button
              onClick={() => {
                // Skip step 2 (Flow) and step 4 (Rules) - they're integrated into step 1
                if (currentSubStep === 5) {
                  setCurrentSubStep(3)
                } else if (currentSubStep === 3) {
                  setCurrentSubStep(1)
                } else {
                  setCurrentSubStep(currentSubStep - 1)
                }
              }}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
          )}
          <div className="ml-auto">
            {currentSubStep < 5 ? (
              <Button
                onClick={() => {
                  // Skip step 2 (Flow) and step 4 (Rules) - they're integrated into step 1
                  if (currentSubStep === 1) {
                    setCurrentSubStep(3)
                  } else if (currentSubStep === 3) {
                    setCurrentSubStep(5)
                  } else {
                    setCurrentSubStep(currentSubStep + 1)
                  }
                }}
                variant="primary"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  // Store the generated prompt and move to next page
                  // setGeneratedPrompt(generatePromptFromStep0())
                  setCurrentPage(2)
                }}
                variant="primary"
              >
                Continue to Agent Setup
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }


  // Page 2: Data Extraction
  const renderPage2_AIGeneration = () => {
    return (
      <div className="px-6 space-y-6">
        {/* Header Section with Icon */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg">
              <Database className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Data Extraction Setup</h3>
              <p className="text-sm text-gray-700">
                Set what data your AI captures from calls. <span className="font-semibold text-blue-700">View results in call history.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <span className="font-semibold">Pro Tip:</span> Add fields like email, phone, company name,
              or any custom data points relevant to your business.
            </div>
          </div>
        </div>

        {/* Extraction Fields */}
        <div className="space-y-4">
          {extractionFields.map((field, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Field Number Badge */}
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {index + 1}
                  </div>

                  {/* Input Fields */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Field Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.name}
                        onChange={(e) => {
                          const newFields = [...extractionFields]
                          newFields[index] = { ...field, name: e.target.value }
                          setExtractionFields(newFields)
                        }}
                        placeholder="e.g., email_address"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={field.description}
                        onChange={(e) => {
                          const newFields = [...extractionFields]
                          newFields[index] = { ...field, description: e.target.value }
                          setExtractionFields(newFields)
                        }}
                        placeholder="e.g., Customer's primary email address"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  {extractionFields.length > 1 && (
                    <button
                      onClick={() => setExtractionFields(extractionFields.filter((_, i) => i !== index))}
                      className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      type="button"
                      title="Remove field"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => setExtractionFields([...extractionFields, { name: '', description: '' }])}
            variant="outline"
            className="flex-1 sm:flex-none border-2 border-dashed border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 font-semibold py-3"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Field
          </Button>

          <Button
            type="button"
            onClick={handleSendExtractionFields}
            disabled={isSendingFields || extractionFields.filter(f => f.name.trim()).length === 0}
            className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSendingFields ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Saving Fields...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Save & Continue
              </>
            )}
          </Button>
        </div>

        {/* Helper Text */}
        <div className="text-center text-xs text-gray-500 pt-2">
          Fields marked with <span className="text-red-500">*</span> are required
        </div>
      </div>
    )
  }

  // Common function to show generation time toast
  const showGenerationTimeToast = (task: string, timeRange: string) => {
    toast(() => (
      <div className="flex items-center space-x-2">
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
        <div>
          <div className="font-medium">Generating {task}...</div>
          <div className="text-sm text-gray-500">This will take {timeRange}</div>
        </div>
      </div>
    ), {
      duration: 4000,
      position: 'top-center',
    })
  }

  // Website Scraping Handler
  const handleWebsiteScraping = useCallback(async () => {
    if (!isMountedRef.current) return
    if (!configuration.company_website || !tokens?.access_token) {
      if (!tokens?.access_token) {
        toast.error('Authentication required')
      } else if (!configuration.company_website) {
        toast.error('Please enter a website URL')
      }
      return
    }

    setIsGenerating(true)
    setError(null)
    showGenerationTimeToast('Company Information', '10-20 seconds')

    try {
      // Use the same wizard endpoints for both new and existing agents
      const scrapeResponse = await AgentAPI.scrapeWebsite({
        website_url: configuration.company_website
      }, tokens.access_token)

      // Scrape response received

      if (!isMountedRef.current) return

      const faqResponse = await AgentAPI.generateFAQs({
        content: scrapeResponse.content
      }, tokens.access_token)

      // FAQ response received

      if (!isMountedRef.current) return

      // Update business context from FAQ response
      if (faqResponse.business_context) {
        setConfiguration(prev => ({
          ...prev,
          basic_info: { ...prev.basic_info, primary_service: faqResponse.business_context }
        }))
      }

      // For new agents, store everything in browser state
      if (!editingAgent) {
        setWebsiteData({
          url: configuration.company_website,
          content: scrapeResponse.content || '',  // Raw scraped content
          // faqs: [],
          business_context: faqResponse.business_context || '',  // Processed business context from FAQ API
          tasks: '',  // Tasks will be generated separately if needed
          isLoaded: true
        })
      }
      
      toast.success('Website content analyzed and business context generated successfully!')
    } catch (error: any) {
      logger.error('Website analysis error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to analyze website'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
    }
  }, [configuration.company_website, tokens?.access_token, editingAgent])

  // Task Generation Handler
  const handleGenerateTasks = useCallback(async () => {
    if (!isMountedRef.current) return
    if (!tokens?.access_token) return

    const transcript = callTranscripts.find(t => t.trim()) || ''
    
    // Check if we have either transcript or FAQs
    if (!transcript && generatedFAQs.length === 0) {
      toast.error('Please provide a call transcript or generate FAQs first')
      return
    }

    setIsGenerating(true)
    setError(null)
    showGenerationTimeToast('Tasks', '25-30 seconds')

    try {
      // For new agents, use temporary ID
      const tempAgentId = editingAgent?.id || 'temp-' + Date.now()
      
      // Prepare website data to send
      const websiteDataToSend = {
        business_context: websiteData?.business_context || '',
        faqs: generatedFAQs || []
      }
      
      // Generate tasks
      const tasksResponse = await AgentAPI.generateTasks({
        agent_id: tempAgentId,
        transcript: transcript || undefined,  // Send undefined if no transcript
        user_tasks: userTasks.filter(t => t.trim()),
        website_data: websiteDataToSend,
        agent_role: configuration.basic_info.intended_role
      }, tokens.access_token)

      if (!isMountedRef.current) return

      // Parse tasks string into TaskItem array
      const parsedTasks = parseTasksString(tasksResponse.tasks)
      // Force state update with callback to ensure it's set
      setGeneratedTasks([...parsedTasks])
      
      // Update websiteData with the tasks string so it gets saved
      setWebsiteData((prev: any) => ({
        ...prev,
        tasks: tasksResponse.tasks
      }))
      
      toast.success('Tasks generated successfully!')
    } catch (error: any) {
      logger.error('Task generation error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to generate tasks'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
    }
  }, [callTranscripts, userTasks, tokens?.access_token, editingAgent?.id, generatedFAQs, configuration.basic_info.intended_role, websiteData])

  // Conversation Flow Generation Handler
  const handleGenerateConversationFlow = useCallback(async () => {
    if (!isMountedRef.current) return
    if (!tokens?.access_token) return

    // Check if we have tasks generated
    if (generatedTasks.length === 0) {
      toast.error('Please generate tasks first')
      return
    }

    setIsGenerating(true)
    setError(null)
    showGenerationTimeToast('Example Conversation', '10-15 seconds')

    try {
      // For new agents, use temporary ID
      const tempAgentId = editingAgent?.id || 'temp-' + Date.now()
      const transcript = callTranscripts.find(t => t.trim()) || ''
      
      // Generate conversation flow
      const conversationResponse = await AgentAPI.generateConversationFlow({
        agent_id: tempAgentId,
        transcript: transcript || undefined,  // Send undefined if no transcript
        tasks: tasksToString(generatedTasks)
      }, tokens.access_token)

      if (!isMountedRef.current) return

      setGeneratedConversationFlow(conversationResponse.conversation_flow)
      toast.success('Conversation flow generated successfully!')
    } catch (error: any) {
      logger.error('Conversation flow generation error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to generate conversation flow'
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
    }
  }, [callTranscripts, tokens?.access_token, editingAgent?.id, generatedTasks])

  // Generate role section dynamically - Disabled to prevent preview updates
  const roleSection = useMemo(() => {
    // Disabled to prevent preview from updating when company name changes
    return ''
  }, [configuration.basic_info])

  // Generate language line based on voice selection
  const languageLine = useMemo(() => {
    if (selectedVoice && voices) {
      const language = getLanguageFromVoice(selectedVoice, voices)
      return generateLanguageLine(language)
    }
    return ''
  }, [selectedVoice, voices])

  // Real-time prompt assembly (frontend-based)
  const assembledPrompt = useMemo(() => {
    if (!staticSections) {
      return ''
    }
    
    const parts = []
    
    // Add role section
    if (roleSection) {
      parts.push(`#ROLE\n${roleSection}`)
    }
    
    // Add language line
    if (languageLine) {
      parts.push(`\n${languageLine}`)
    }
    
    // Add company information section
    if (configuration.basic_info.primary_service) {
      parts.push(`\n\n#Company Information\n${configuration.basic_info.primary_service}`)
    }
    
    // Add tasks section
    if (generatedTasks.length > 0) {
      parts.push(`\n\n${tasksToString(generatedTasks)}`)
    }
    
    // Add example conversation
    if (generatedConversationFlow) {
      parts.push(`\n\n#Example Conversation\n${generatedConversationFlow}`)
    }
    
    // Add hardcoded sections with proper spacing (only if business context exists)
    if (configuration.basic_info.primary_service) {
      parts.push(`\n\n${staticSections.notes}`)
    }
    
    // Add FAQs section
    if (generatedFAQs.length > 0) {
      let faqSection = "#FAQs\nHere are some frequently asked questions you should be prepared to answer:\n"
      generatedFAQs.forEach((faq, index) => {
        faqSection += `${index + 1}. Q ${faq.question}\n   A ${faq.answer}\n\n`
      })
      parts.push(`\n\n${faqSection}`)
    }

    // Add extraction fields section
    const validExtractionFields = extractionFields.filter(field => field.name.trim() !== '')
    if (validExtractionFields.length > 0) {
      let extractionSection = "#INFORMATION TO EXTRACT\nDuring the conversation, make sure to naturally collect and save the following information:\n"
      validExtractionFields.forEach((field, index) => {
        // Show field name and description in prompt
        const snakeCaseName = field.name.trim().toLowerCase().replace(/\s+/g, '_')
        extractionSection += `${index + 1}. ${field.name.trim()} (stored as: ${snakeCaseName})\n`
        if (field.description.trim()) {
          extractionSection += `   Description: ${field.description.trim()}\n`
        }
        extractionSection += '\n'
      })
      extractionSection += "Make sure to ask for this information naturally during the conversation when appropriate, and save it for future reference."
      parts.push(`\n\n${extractionSection}`)
    }

    const finalPrompt = parts.join('')
    return finalPrompt
  }, [roleSection, languageLine, generatedTasks, generatedConversationFlow, generatedFAQs, staticSections, configuration.basic_info.primary_service, extractionFields])

  // Update generatedPrompt whenever assembledPrompt changes
  // DISABLED: We want to keep the prompt from Step 1 (generate-prompt API)
  // useEffect(() => {
  //   // Only update if content actually changed to prevent infinite loops
  //   if (assembledPrompt && assembledPrompt !== generatedPrompt) {
  //     setGeneratedPrompt(assembledPrompt)
  //   }
  // }, [assembledPrompt]) // Removed generatedPrompt from deps to avoid circular dependency



  // Check if user has made meaningful changes (ignore default values)
  const checkForMeaningfulChanges = useCallback(() => {
    // Check if any non-default values exist
    const hasBasicInfo = agentName || companyName || agentRole || companyInfo
    const hasTranscripts = callTranscripts.some(t => t.trim().length > 0)
    const hasVariables = dynamicVariables.length > 0
    const hasExtractionFields = extractionFields.some(f => f.name.trim() || f.description.trim())
    const hasAIGeneratedContent = conversationFlow || responseRules || operatingRules || edgeCases
    const hasConfigChanges = configuration.basic_info.agent_name ||
                             configuration.basic_info.company_name ||
                             configuration.basic_info.intended_role ||
                             configuration.basic_info.target_industry ||
                             configuration.basic_info.primary_service
    const hasSelectedVoice = selectedVoice !== ''
    const hasWebsiteData = websiteData.url || websiteData.content

    return hasBasicInfo || hasTranscripts || hasVariables || hasExtractionFields ||
           hasAIGeneratedContent || hasConfigChanges || hasSelectedVoice || hasWebsiteData
  }, [agentName, companyName, agentRole, companyInfo, callTranscripts, dynamicVariables,
      extractionFields, conversationFlow, responseRules, operatingRules, edgeCases,
      configuration, selectedVoice, websiteData])

  // Reset all wizard state - called when completing or starting fresh
  const resetWizardState = useCallback(() => {
    // Clear website data from browser storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('agent-wizard-website-data')
    }

    // Reset all state to initial values
    setCurrentPage(1)  // Start from page 1 (Prompt Builder)
    setCurrentSubStep(1)  // Reset sub-step to 1
    setConfiguration({
      basic_info: {
        agent_name: '',
        intended_role: '',
        target_industry: '',
        company_name: '',
        primary_service: ''
      }
    })
    setSelectedVoice('')
    setCallType('')
    setError(null)
    setGeneratedPrompt('')
    setUserTasks([''])
    setCallTranscripts([''])
    setExtractionFields([{ name: '', description: '' }])
    setIsSendingFields(false)
    setGeneratedTasks([])
    setGeneratedFAQs([])
    setGeneratedConversationFlow('')
    setLoading(false)
    setIsGenerating(false)
    setShowFAQEditor(false)
    setEditingFAQs([])
    setShowTaskEditor(false)
    setEditingTasks([])
    setStaticSections(null)
    setWebsiteData({
      url: '',
      content: '',
      faqs: [],
      business_context: '',
      tasks: '',
      isLoaded: false
    })
    setInboundPhone('')
    setOutboundPhone('')
    setRegion('indian')  // Reset to original default
    setWelcomeMessage('')
    setSelectedCompanyId('')  // Reset company selection
    setTouchedFields(new Set())
    setFieldErrors({})
    setShowPreview(false)

    // Reset Step 1 states
    setPromptName('')
    setPromptDescription('')
    setAgentName('')
    setCompanyName('')
    setAgentRole('')
    setAgentLanguage('Adapts between English and Hinglish based on customer preference')
    setCompanyInfo('')
    setDynamicVariables([])
    setConversationFlow('')
    setResponseRules('')
    setEdgeCases('')
    setOperatingRules('')
    setCompliance('')
    setPreviousInteractions('')
    setIsGeneratingPrompt(false)
    setSelectedFiles(null)
    setIsTranscribing(false)
    setTranscriptionProgress(null)
    setHasUserMadeChanges(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle closing the modal with smart confirmation
  const handleClose = useCallback(() => {
    const hasMeaningfulChanges = checkForMeaningfulChanges()

    // If user has made changes, show confirmation modal
    if (hasMeaningfulChanges) {
      setShowCloseConfirmation(true)
    } else {
      // No changes made, close immediately
      resetWizardState()
      onClose()
    }
  }, [onClose, resetWizardState, checkForMeaningfulChanges])

  // Handle confirmed close - when user confirms in the confirmation modal
  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirmation(false)
    resetWizardState()
    onClose()
  }, [onClose, resetWizardState])

  // Handle closing with reset - used when user wants to start fresh
  const handleCloseWithReset = useCallback(() => {
    resetWizardState()
    onClose()
  }, [onClose, resetWizardState])

  // Track field changes to update hasUserMadeChanges flag
  useEffect(() => {
    if (isOpen) {
      const hasMeaningfulChanges = checkForMeaningfulChanges()
      setHasUserMadeChanges(hasMeaningfulChanges)
    }
  }, [isOpen, agentName, companyName, agentRole, companyInfo, callTranscripts,
      dynamicVariables, extractionFields, conversationFlow, responseRules,
      operatingRules, edgeCases, configuration, selectedVoice, websiteData,
      checkForMeaningfulChanges])

  // Effect to handle opening the modal - always reset for new agents
  useEffect(() => {
    if (isOpen && !editingAgent) {
      // Always reset state when opening modal for new agent creation
      resetWizardState()
    } else if (isOpen && editingAgent) {
      // When editing an existing agent, load its data
      // This will be handled by existing edit logic
    }
  }, [isOpen, editingAgent, resetWizardState])

  const currentPageInfo = getCurrentPageInfo

  /* const handleTogglePreview = useCallback(() => {
    setShowPreview(!showPreview)
  }, [showPreview]) */

  // Extract variables from final prompt
  const extractedVariables = useMemo(() => {
    const finalPrompt = generatedPrompt
    if (finalPrompt) {
      return extractVariablesFromPrompt(finalPrompt)
    }
    // Also extract from tasks if available
    if (generatedTasks && generatedTasks.length > 0) {
      return extractVariablesFromPrompt(tasksToString(generatedTasks))
    }
    return []
  }, [generatedPrompt, generatedTasks])

  // FAQ save handler
  const handleSaveFAQs = useCallback(async (updatedFAQs: FAQItem[]) => {
    if (!tokens?.access_token) {
      toast.error('Authentication required')
      return
    }
    
    // During agent creation, store locally instead of API call
    if (!editingAgent?.id) {
      setGeneratedFAQs(updatedFAQs)
      setEditingFAQs(updatedFAQs)
      setShowFAQEditor(false)
      toast.success('FAQs saved locally!')
      return
    }
    
    try {
      setIsGenerating(true)
      await AgentAPI.updateFAQs({
        agent_id: editingAgent.id,
        faqs: updatedFAQs
      }, tokens.access_token)
      setGeneratedFAQs(updatedFAQs)
      setEditingFAQs(updatedFAQs)
      setShowFAQEditor(false)
      toast.success('FAQs updated successfully!')
    } catch (error) {
      toast.error('Failed to update FAQs')
    } finally {
      setIsGenerating(false)
    }
  }, [tokens?.access_token, editingAgent?.id])

  // Handler for sending extraction fields to backend
  const handleSendExtractionFields = useCallback(async () => {
    if (!tokens?.access_token) {
      toast.error('Authentication required')
      return
    }

    const validFields = extractionFields
      .filter(field => field.name.trim() !== '')
      .map(field => ({
        name: field.name.trim().toLowerCase().replace(/\s+/g, '_'),
        description: field.description.trim()
      }))

    if (validFields.length === 0) {
      toast.error('Please add at least one extraction field')
      return
    }

    try {
      setIsSendingFields(true)
      const data = {
        extraction_fields: validFields,
        ...(editingAgent?.id && { agent_id: editingAgent.id })
      }

      await AgentAPI.sendExtractionFields(data, tokens.access_token)
      toast.success('Extraction fields sent successfully!')
    } catch (error) {
      console.error('Failed to send extraction fields:', error)
      toast.error('Failed to send extraction fields')
    } finally {
      setIsSendingFields(false)
    }
  }, [tokens?.access_token, extractionFields, editingAgent?.id])

  // Task save handler
  const handleSaveTasks = useCallback(async (updatedTasks: TaskItem[]) => {
    if (!tokens?.access_token) {
      toast.error('Authentication required')
      return
    }
    
    // During agent creation, store locally instead of API call
    if (!editingAgent?.id) {
      setGeneratedTasks(updatedTasks)
      setEditingTasks(updatedTasks)
      
      // Update websiteData with the updated tasks string for creation flow
      const tasksString = tasksToString(updatedTasks)
      setWebsiteData((prev: any) => ({
        ...prev,
        tasks: tasksString
      }))
      
      setShowTaskEditor(false)
      toast.success('Tasks saved locally!')
      return
    }
    
    try {
      setIsGenerating(true)
      // Convert tasks back to string format for API
      const tasksString = tasksToString(updatedTasks)
      await AgentAPI.updateTasks({
        agent_id: editingAgent.id,
        tasks: tasksString
      }, tokens.access_token)
      setGeneratedTasks(updatedTasks)
      setEditingTasks(updatedTasks)
      
      // Update websiteData with the updated tasks string
      setWebsiteData((prev: any) => ({
        ...prev,
        tasks: tasksString
      }))
      
      setShowTaskEditor(false)
      toast.success('Tasks updated successfully!')
    } catch (error) {
      toast.error('Failed to update tasks')
    } finally {
      setIsGenerating(false)
    }
  }, [tokens?.access_token, editingAgent?.id])

  return (
    <>
      <FAQEditorModal 
        isOpen={showFAQEditor}
        onClose={() => setShowFAQEditor(false)}
        faqs={editingFAQs}
        onSave={handleSaveFAQs}
        isGenerating={isGenerating}
      />
      <TaskEditorModal 
        isOpen={showTaskEditor}
        onClose={() => setShowTaskEditor(false)}
        tasks={editingTasks}
        onSave={handleSaveTasks}
        isGenerating={isGenerating}
      />
      <ErrorBoundary>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          <div className="flex items-center justify-between w-full">
            <span>{currentPageInfo.title}</span>
            {/* Main Step Indicators - Always Visible - Centered */}
            <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-2 flex items-center space-x-6">
              {currentPage === 1 ? (
                // Page 1 Substep Indicators (Step 1, Step 2, Step 3)
                [
                  { subStep: 1, label: 'Step 1' },
                  { subStep: 3, label: 'Step 2' },
                  { subStep: 5, label: 'Step 3' }
                ].map(({ subStep, label }) => (
                  <div key={subStep} className="flex flex-col items-center min-w-[60px]">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        subStep === currentSubStep
                          ? 'bg-blue-600 text-white scale-110'
                          : subStep < currentSubStep
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {subStep < currentSubStep ? <Check className="h-3.5 w-3.5" /> : label.split(' ')[1]}
                    </div>
                    <span className={`text-[10px] mt-0.5 font-medium whitespace-nowrap ${subStep === currentSubStep ? 'text-blue-600' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                ))
              ) : (
                // Page 2 & 3 Main Page Indicators (Page 1, Page 2, Page 3)
                [
                  { page: 1, label: 'Prompt Builder' },
                  { page: 2, label: 'Data Extraction' },
                  { page: 3, label: 'Configuration' }
                ].map(({ page, label }) => (
                  <div key={page} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                        page === currentPage
                          ? 'bg-blue-600 text-white scale-110'
                          : page < currentPage
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {page < currentPage ? <Check className="h-3.5 w-3.5" /> : page}
                    </div>
                    <span className={`text-[10px] mt-0.5 font-medium whitespace-nowrap ${page === currentPage ? 'text-blue-600' : 'text-gray-500'}`}>
                      {label}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        }
        size="2xl"
        headerActions={
          <div className="flex items-center gap-2">
            {(currentPage > 1 || currentSubStep > 1) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to start fresh? This will clear all your current progress.')) {
                    resetWizardState()
                  }
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Start Fresh
              </Button>
            )}
            {/* <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePreview}
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button> */}
          </div>
        }
      >
        <div className="flex h-full max-h-[calc(86vh-80px)] min-h-[553px]">
          {/* Main Form Content */}
          <div className={`flex flex-col transition-all duration-300 ${
            showPreview ? 'w-2/3' : 'w-full'
          }`}>
            {/* Scrollable content area */}
            <div className={`flex-1 overflow-y-auto ${currentPage === 1 ? 'p-6' : 'px-0 py-6'}`}>
              <div className="space-y-6">
                {/* Page Content */}
                <div>
                  {renderPage()}
                </div>

                {/* Error Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="text-red-800 text-sm">{error}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Footer - Fixed at bottom */}
            {currentPage > 1 && (
              <div className="border-t border-gray-200 px-6 py-4 bg-white">
                <div className="flex justify-between">
                  {currentPage > 1 ? (
                    <Button
                      onClick={handlePreviousPage}
                      disabled={loading}
                      variant="outline"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                  ) : (
                    <div></div>
                  )}

                  {currentPage === 3 ? (
                    isSuperAdmin ? (
                      <Button
                        onClick={handleComplete}
                        disabled={loading || !selectedVoice || (isSuperAdmin && !selectedCompanyId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? 'Creating Agent...' : editingAgent ? 'Update Agent' : 'Create Agent'}
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">View-only mode</span>
                        <div className="relative group">
                          <svg className="h-4 w-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute right-0 bottom-6 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                            Only super admins can create or update agents
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <Button
                      onClick={handleNextPage}
                      disabled={loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={showCloseConfirmation}
        onClose={() => setShowCloseConfirmation(false)}
        onConfirm={handleConfirmClose}
        title="Unsaved Changes"
        message={
          conversationFlow || responseRules || operatingRules || edgeCases
            ? "You have unsaved AI-generated content. Close without saving?"
            : "You have unsaved changes. Close without saving?"
        }
        confirmText="Close Without Saving"
        cancelText="Keep Editing"
        variant="warning"
      />
    </ErrorBoundary>
    </>
  )
}

// Export memoized component to prevent unnecessary re-renders
export const AgentWizard = memo(AgentWizardComponent)