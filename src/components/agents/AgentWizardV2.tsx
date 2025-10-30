'use client'

import React, { useState, memo, useCallback, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { RefreshCw, Check, ChevronLeft, ChevronRight, User, Building, ChevronDown, FileText, Upload, Mic, X, Loader2, Wand2, Info, Database, Plus, Trash2, Search, Phone, Edit2 } from 'lucide-react'
import { useVoices } from '@/hooks/useAgents'
import { useAuth } from '@/contexts/AuthContext'
import { useDemoStatus } from '@/hooks/useDemo'
import { ExampleButton, ExampleContent, LoadingButton, InfoTooltip } from './AgentWizardComponents'
import { AgentAPI } from '@/lib/agent-api'
import { TranscriptionAPI } from '@/lib/transcription-api'
import { OpenAIAPI } from '@/lib/openai-api'
import { logger } from '@/lib/logger'
import toast from 'react-hot-toast'

interface AgentWizardV2Props {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
  editingAgent?: any | null
}

const AgentWizardV2Component = ({ isOpen, onClose, onComplete, editingAgent }: AgentWizardV2Props) => {
  // 3-Page Structure: Page 1 (Prompt Builder), Page 2 (Conversation Flow), Page 3 (Configuration)
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3>(1)

  // Voice and call configuration
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [callType, setCallType] = useState<'inbound' | 'outbound' | 'web' | ''>('')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Starts with English then adapts between English and Hinglish based on customer preference') // Default to english + hinglish
  const [selectedTimezone, setSelectedTimezone] = useState<string>('Asia/Kolkata') // Default timezone

  // Agent basic information
  const [agentName, setAgentName] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [configuration, setConfiguration] = useState<{
    basic_info: {
      agent_name: string
      company_name: string
      intended_role: string
      target_industry: string
      primary_service: string
    }
    company_website?: string
  }>({
    basic_info: {
      agent_name: '',
      company_name: '',
      intended_role: '',
      target_industry: '',
      primary_service: ''
    }
  })

  // Business Configuration State (Page 3)
  const [region, setRegion] = useState<'indian' | 'international' | 'internal_india' | 'internal_us' | 'worldwide'>('international')
  const [inboundPhone, setInboundPhone] = useState<string>('')
  const [outboundPhone, setOutboundPhone] = useState<string>('')

  // Auto-Schedule State (integrated in Page 3, auto-enabled)
  const [salesCycleEnabled, setSalesCycleEnabled] = useState<boolean>(true)
  const [salesCycleCallDays, setSalesCycleCallDays] = useState<number[]>([1, 3, 5])  // Day 1 = next day, Day 3 = 3 days later, etc.
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Refs for info tooltips in Step 1
  const agentNameTooltipRef = useRef<HTMLDivElement>(null)
  const companyNameTooltipRef = useRef<HTMLDivElement>(null)

  // Ref for info tooltip in Step 2
  const functionsTooltipRef = useRef<HTMLDivElement>(null)

  // Company Assignment for Super Admin
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([])
  const [companySearchQuery, setCompanySearchQuery] = useState<string>('')
  const [isCompanyInputFocused, setIsCompanyInputFocused] = useState<boolean>(false)

  // Website scraping state
  const [isGenerating, setIsGenerating] = useState(false)
  const [websiteData, setWebsiteData] = useState({
    url: '',
    content: '',
    business_context: '',
    tasks: '',
    isLoaded: false
  })

  // Validation states
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Example visibility state
  const [showExamples, setShowExamples] = useState<{
    agent_name: boolean
    company_name: boolean
  }>({
    agent_name: false,
    company_name: false
  })

  // Function management state
  const [showFunctionDropdown, setShowFunctionDropdown] = useState<boolean>(false)
  const [showBookingModal, setShowBookingModal] = useState<boolean>(false)
  const [bookingFormData, setBookingFormData] = useState({
    name: 'book_appointment_cal',
    description: 'When users ask to book an appointment, book it on the calendar.',
    apiKey: '',
    eventTypeId: ''
  })
  const [editingFunctionIndex, setEditingFunctionIndex] = useState<number | null>(null)
  const [customFunctions, setCustomFunctions] = useState<Array<{
    id: string
    name: string
    description: string
    apiKey: string
    eventTypeId: string
  }>>([])
  const functionDropdownRef = useRef<HTMLDivElement>(null)
  const [showBookingPrompt, setShowBookingPrompt] = useState<boolean>(false)

  // Tooltip visibility state
  const [showTooltips, setShowTooltips] = useState<{
    voice: boolean
    call_type: boolean
    role: boolean
    industry: boolean
    welcome_message: boolean
    agent_name_prompt: boolean
    company_prompt: boolean
    language: boolean
    company_info: boolean
    conversation_flow: boolean
    auto_schedule: boolean
    functions: boolean
  }>({
    voice: false,
    call_type: false,
    role: false,
    industry: false,
    welcome_message: false,
    agent_name_prompt: false,
    company_prompt: false,
    language: false,
    company_info: false,
    conversation_flow: false,
    auto_schedule: false,
    functions: false
  })

  // Backend submission state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mounted ref for cleanup
  const isMountedRef = useRef(true)

  // Business context textarea ref for auto-resize
  const businessContextRef = useRef<HTMLTextAreaElement>(null)

  // Conversation Flow Input State (Phase 1)
  const [inputMethod, setInputMethod] = useState<'type' | 'upload' | null>(null)
  const [promptDescription, setPromptDescription] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState<{
    message: string
    percentage: number
  } | null>(null)
  const [callTranscripts, setCallTranscripts] = useState<string[]>([])
  const [generatedConversationFlow, setGeneratedConversationFlow] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState('') // Full prompt from API
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Default sections that are pre-filled if API is not called
  const getDefaultParsedSections = useCallback(() => ({
    header: `VOICE AI GUIDELINES
You are a voice assistant. Your responses will be converted to speech, so write exactly as you would speak - plain text only, no formatting or special characters. Silently correct speech-to-text errors by focusing on intended meaning rather than literal transcription. Keep responses brief and conversational. Adapt your speaking style to match the user's tone and language preference. If you don't understand something, say "I'm sorry, I didn't understand that" and ask for clarification. When converting text to speech, NEVER speak slash-separated options (like 'yes/no', 'he/she', 'and/or') - always select ONE appropriate option based on context`,
    role: `Name: ${agentName || 'Alex'}
Role: ${configuration.basic_info.intended_role || 'AI Appointment Assistant'} at ${configuration.basic_info.company_name || 'ConversAI Labs'}
Company: ${configuration.basic_info.company_name || 'ConversAI Labs'}
Purpose: Help users schedule demo appointments and consultations through natural, intelligent conversation

## ABOUT CONVERSAI LABS
ConversAI Labs is democratizing AI-powered conversations for businesses of all sizes. We believe every business should have access to intelligent, human-like AI agents that understand, engage, and convert customers 24/7.

Our Mission: Making advanced AI conversation technology accessible to every business, regardless of size or technical expertise. We're building the no-code platform that empowers businesses to create intelligent AI agents across voice, text, and multimedia channels.

Our Vision: A world where every customer interaction is meaningful, timely, and personalized. We envision AI agents that don't just respond—they understand context, build relationships, and drive real business results.

## CURRENT DATE & TIME CONTEXT
*IMPORTANT:* Today is Tuesday, October 28, 2025 (Year: 2025)
- Use this date as reference for "today", "tomorrow", "next week", etc.
- When user says "October 12" or similar without a year, use 2025
- NEVER use dates from the past - all bookings must be in the future`,
    supportingSections: `## GUIDELINES
- Be conversational and friendly
- Don't ask for information you already have
- If user wants to change something, guide them smoothly
- Always confirm details before booking
- Handle errors gracefully and offer alternatives

## CRITICAL INPUT RULES
*TEXT INPUT FOR ACCURACY:*
- ALWAYS ask users to TYPE their name and email in the text box
- Explain it's for accuracy: "Please type your [name/email] in the text box below for accuracy"
- Wait for the user to type and send the information before proceeding

*DATE COLLECTION:*
- Ask for date in a simple, open-ended way: "What date works best for you?"
- Do NOT suggest examples like "tomorrow", "next Monday", or specific dates
- Let the user provide the date naturally in their own words

## TIME HANDLING
*CRITICAL - HOW TO SPEAK TIMES:*
- When speaking times, use natural conversational format (12-hour with AM/PM)
- NEVER say times like "sixteen forty-five" or "fourteen hundred"
- Examples of correct speaking:
  * 9:00 AM → Say "nine AM"
  * 9:30 AM → Say "nine thirty AM"
  * 2:00 PM → Say "two PM"
  * 4:30 PM → Say "four thirty PM"
  * 10:15 AM → Say "ten fifteen AM"
  * 3:45 PM → Say "three forty-five PM"

*How to Write Times in Text:*
- Always write times in 12-hour format with colon notation: "9:00 AM", "4:30 PM"
- NEVER write in 24-hour format (16:00, 14:30, etc.)

*For Internal Processing:*
- Convert times like "2 PM" to "14:00" (24-hour format) for booking system
- Convert times like "9 AM" to "09:00" for booking system
- Available slots are typically 9 AM to 5 PM (09:00 to 17:00)

## ERROR HANDLING
- If availability check fails, apologize and suggest alternative dates
- If booking fails, explain clearly and offer to try again
- Always remain helpful and patient

## IMPORTANT RULES
- NEVER make up availability - always call check_availability first
- NEVER book without user confirmation
- ALWAYS collect name and email before booking
- Keep responses concise (2-3 sentences max per turn)`
  }), [agentName, configuration.basic_info.intended_role, configuration.basic_info.company_name])

  // Store all parsed sections to reconstruct full prompt when conversation flow is edited
  const [parsedSections, setParsedSections] = useState<{
    header?: string
    role?: string
    conversationFlow?: string
    supportingSections?: string
    compliance?: string
  }>(getDefaultParsedSections())

  // Removed redundant supportingSections state - use parsedSections.supportingSections instead

  // Agent Prompt Free Text State
  const [agentPromptText, setAgentPromptText] = useState('')

  // AI Edit Modal State
  const [isAIEditModalOpen, setIsAIEditModalOpen] = useState(false)

  // Conversation Flow Modal State
  const [isConversationFlowModalOpen, setIsConversationFlowModalOpen] = useState(false)

  /* ============================================
   * Data Extraction State (REMOVED FROM UI)
   * Kept for future API integration reference
   * ============================================
   */
  // const [extractionFields, setExtractionFields] = useState<{ name: string; description: string }[]>([
  //   { name: '', description: '' }
  // ])
  // const [isSendingFields, setIsSendingFields] = useState(false)

  // Close confirmation state
  const [hasUserMadeChanges, setHasUserMadeChanges] = useState(false)
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false)

  // Hooks
  const { tokens, user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'
  const { data: voices } = useVoices()
  const { data: demoStatus } = useDemoStatus()
  const isDemoAccount = demoStatus?.demo_mode || false

  // Lifecycle effects
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Sync agentName to configuration
  useEffect(() => {
    setConfiguration(prev => ({
      ...prev,
      basic_info: { ...prev.basic_info, agent_name: agentName }
    }))
  }, [agentName])

  // Auto-fill welcome message when agent name or company name changes
  useEffect(() => {
    if (agentName && configuration.basic_info.company_name) {
      const autoMessage = `Hi, I'm ${agentName} calling you from ${configuration.basic_info.company_name}`
      setWelcomeMessage(autoMessage)
    }
  }, [agentName, configuration.basic_info.company_name])

  // Update default parsedSections when agent details change (only if not from API)
  useEffect(() => {
    // Only update if we haven't received API response (i.e., using defaults)
    if (!generatedPrompt) {
      const defaults = getDefaultParsedSections()
      setParsedSections(prev => ({
        ...prev,
        header: prev.header || defaults.header,
        role: defaults.role, // Always update role to reflect current values
        supportingSections: prev.supportingSections || defaults.supportingSections
      }))
    }
  }, [agentName, configuration.basic_info.intended_role, configuration.basic_info.company_name, generatedPrompt, getDefaultParsedSections])

  // Sync agentPromptText with generatePromptForDisplay when fields change
  useEffect(() => {
    const generatedText = generatePromptForDisplay()
    if (generatedText && !agentPromptText) {
      setAgentPromptText(generatedText)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentName, configuration.basic_info.company_name, configuration.basic_info.intended_role, configuration.basic_info.primary_service])

  // Parse agent prompt text to extract values
  const parseAgentPromptText = useCallback((text: string) => {
    const lines = text.split('\n')
    let extractedAgentName = ''
    let extractedCompanyName = ''
    let extractedRole = ''
    let extractedCompanyInfo = ''
    let inCompanyInfoSection = false

    for (const line of lines) {
      if (line.startsWith('Agent Name:')) {
        extractedAgentName = line.replace('Agent Name:', '').trim()
      } else if (line.startsWith('Company:')) {
        extractedCompanyName = line.replace('Company:', '').trim()
      } else if (line.startsWith('Role:')) {
        extractedRole = line.replace('Role:', '').trim()
      } else if (line.startsWith('### COMPANY INFORMATION')) {
        inCompanyInfoSection = true
      } else if (line.startsWith('###')) {
        inCompanyInfoSection = false
      } else if (inCompanyInfoSection && line.trim()) {
        extractedCompanyInfo += line + '\n'
      }
    }

    return {
      agentName: extractedAgentName,
      companyName: extractedCompanyName,
      role: extractedRole,
      companyInfo: extractedCompanyInfo.trim()
    }
  }, [])

  // Handle agent prompt text change
  const handleAgentPromptTextChange = useCallback((newText: string) => {
    setAgentPromptText(newText)

    // Parse and update fields
    const parsed = parseAgentPromptText(newText)

    if (parsed.agentName !== agentName) {
      setAgentName(parsed.agentName)
    }

    setConfiguration(prev => ({
      ...prev,
      basic_info: {
        ...prev.basic_info,
        company_name: parsed.companyName,
        intended_role: parsed.role,
        primary_service: parsed.companyInfo
      }
    }))
  }, [agentName, parseAgentPromptText])

  // Console logs for testing data flow
  useEffect(() => {
    console.log('=== AgentWizardV2 State ===')
    console.log('Voice:', selectedVoice)
    console.log('Call Type:', callType)
    console.log('Configuration:', configuration)
    console.log('Website Data:', websiteData)
  }, [selectedVoice, callType, configuration, websiteData])

  // Auto-resize business context textarea based on content
  useEffect(() => {
    const textarea = businessContextRef.current
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = 'auto'
      // Set height to scrollHeight + extra space (for 1-2 extra lines)
      const newHeight = Math.min(Math.max(textarea.scrollHeight + 20, 60), 300)
      textarea.style.height = `${newHeight}px`
    }
  }, [configuration.basic_info.primary_service])

  // Close function dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (functionDropdownRef.current && !functionDropdownRef.current.contains(event.target as Node)) {
        setShowFunctionDropdown(false)
      }
    }

    if (showFunctionDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showFunctionDropdown])

  // Close info tooltips when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideAgentName = agentNameTooltipRef.current && !agentNameTooltipRef.current.contains(event.target as Node)
      const isOutsideCompanyName = companyNameTooltipRef.current && !companyNameTooltipRef.current.contains(event.target as Node)
      const isOutsideFunctions = functionsTooltipRef.current && !functionsTooltipRef.current.contains(event.target as Node)

      if (isOutsideAgentName && showTooltips.agent_name_prompt) {
        setShowTooltips(prev => ({ ...prev, agent_name_prompt: false }))
      }
      if (isOutsideCompanyName && showTooltips.company_prompt) {
        setShowTooltips(prev => ({ ...prev, company_prompt: false }))
      }
      if (isOutsideFunctions && showTooltips.functions) {
        setShowTooltips(prev => ({ ...prev, functions: false }))
      }
    }

    if (showTooltips.agent_name_prompt || showTooltips.company_prompt || showTooltips.functions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTooltips.agent_name_prompt, showTooltips.company_prompt, showTooltips.functions])

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

  // Handle call type change - set default days for outbound, clear for inbound
  useEffect(() => {
    if (callType === 'outbound') {
      // Set default days [1, 3, 5] when switching to outbound
      setSalesCycleCallDays([1, 3, 5])
      setSalesCycleEnabled(true)
    } else {
      // Clear days when switching to inbound
      setSalesCycleCallDays([])
      setSalesCycleEnabled(false)
    }
  }, [callType])

  // Check for meaningful changes
  const checkForMeaningfulChanges = useCallback(() => {
    const hasBasicInfo = agentName || configuration.basic_info.company_name || configuration.basic_info.intended_role || configuration.basic_info.primary_service
    const hasVoiceOrCallType = selectedVoice || callType
    const hasConversationFlow = generatedConversationFlow || promptDescription
    const hasWebsiteData = websiteData.url || websiteData.content
    const hasRegionConfig = region !== 'international' || inboundPhone || outboundPhone

    return hasBasicInfo || hasVoiceOrCallType || hasConversationFlow || hasWebsiteData || hasRegionConfig
  }, [agentName, configuration, selectedVoice, callType, generatedConversationFlow, promptDescription, websiteData, region, inboundPhone, outboundPhone])

  // Reset wizard state
  const resetWizardState = useCallback(() => {
    // Reset to initial values
    setCurrentPage(1)
    setSelectedVoice('')
    setCallType('')
    setSelectedLanguage('Starts with English then adapts between English and Hinglish based on customer preference')
    setSelectedTimezone('Asia/Kolkata')
    setAgentName('')
    setWelcomeMessage('')
    setConfiguration({
      basic_info: {
        agent_name: '',
        company_name: '',
        intended_role: '',
        target_industry: '',
        primary_service: ''
      }
    })
    setRegion('international')
    setInboundPhone('')
    setOutboundPhone('')
    setSalesCycleEnabled(true)
    setSalesCycleCallDays([1, 3, 5])
    setIsDropdownOpen(false)
    setSelectedCompanyId('')
    setCompanySearchQuery('')
    setIsCompanyInputFocused(false)
    setIsGenerating(false)
    setWebsiteData({
      url: '',
      content: '',
      business_context: '',
      tasks: '',
      isLoaded: false
    })
    setTouchedFields(new Set())
    setFieldErrors({})
    setShowExamples({ agent_name: false, company_name: false })
    setShowTooltips({
      voice: false,
      call_type: false,
      role: false,
      industry: false,
      welcome_message: false,
      agent_name_prompt: false,
      company_prompt: false,
      language: false,
      company_info: false,
      conversation_flow: false,
      auto_schedule: false,
      functions: false
    })
    setInputMethod(null)
    setPromptDescription('')
    setSelectedFiles(null)
    setIsTranscribing(false)
    setTranscriptionProgress(null)
    setCallTranscripts([])
    setGeneratedConversationFlow('')
    setGeneratedPrompt('')
    setParsedSections(getDefaultParsedSections())
    setAgentPromptText('')
    setIsAIEditModalOpen(false)
    setIsConversationFlowModalOpen(false)
    setHasUserMadeChanges(false)
    setShowCloseConfirmation(false)
    // Reset custom functions state
    setCustomFunctions([])
    setShowFunctionDropdown(false)
    setShowBookingModal(false)
    setShowBookingPrompt(false)
    setEditingFunctionIndex(null)
    setBookingFormData({
      name: 'book_appointment_cal',
      description: 'When users ask to book an appointment, book it on the calendar.',
      apiKey: '',
      eventTypeId: ''
    })
  }, [])

  // Handle modal close with confirmation
  const handleClose = useCallback(() => {
    const hasMeaningfulChanges = checkForMeaningfulChanges()

    if (hasMeaningfulChanges) {
      setShowCloseConfirmation(true)
    } else {
      resetWizardState()
      onClose()
    }
  }, [onClose, resetWizardState, checkForMeaningfulChanges])

  // Handle confirm close
  const handleConfirmClose = useCallback(() => {
    setShowCloseConfirmation(false)
    resetWizardState()
    onClose()
  }, [onClose, resetWizardState])

  // Reset state when opening modal for new agents
  useEffect(() => {
    if (isOpen && !editingAgent) {
      resetWizardState()
    }
  }, [isOpen, editingAgent, resetWizardState])

  // Pre-populate fields when editing an agent
  useEffect(() => {
    if (isOpen && editingAgent) {
      // Pre-fill basic info
      setAgentName(editingAgent.name || '')
      setSelectedVoice(editingAgent.voice_id || '')
      setWelcomeMessage(editingAgent.welcome_message || '')
      setRegion(editingAgent.region || 'international')
      setInboundPhone(editingAgent.inbound_phone || '')
      setOutboundPhone(editingAgent.outbound_phone || '')

      // Pre-fill call type based on agent configuration
      if (editingAgent.region === 'worldwide') {
        setCallType('web')
      } else if (editingAgent.inbound_phone) {
        setCallType('inbound')
      } else {
        setCallType('outbound')
      }

      // Pre-fill configuration data
      if (editingAgent.configuration_data) {
        const config = editingAgent.configuration_data
        setConfiguration({
          basic_info: {
            agent_name: editingAgent.name || '',
            company_name: config.basic_info?.company_name || '',
            intended_role: config.basic_info?.intended_role || '',
            target_industry: config.basic_info?.target_industry || '',
            primary_service: config.basic_info?.primary_service || ''
          },
          company_website: config.company_website || ''
        })

        // Extraction fields removed from UI
      }

      // Pre-fill auto-schedule settings
      if (editingAgent.enable_sales_cycle !== undefined) {
        setSalesCycleEnabled(editingAgent.enable_sales_cycle)
      }
      if (editingAgent.default_call_days && editingAgent.default_call_days.length > 0) {
        setSalesCycleCallDays(editingAgent.default_call_days)
      }

      // Pre-fill generated prompt and parsed sections if available
      if (editingAgent.prompt) {
        setGeneratedPrompt(editingAgent.prompt)
      }

      // Pre-fill parsed sections from API response
      if (editingAgent.parsed_sections) {
        const sections = editingAgent.parsed_sections

        // Set all parsed sections
        setParsedSections({
          header: sections.header || '',
          role: sections.role || '',
          conversationFlow: sections.conversationFlow || '',
          supportingSections: sections.supportingSections || '',
          compliance: sections.compliance || ''
        })

        // Set the editable conversation flow for Step 2
        if (sections.conversationFlow) {
          setGeneratedConversationFlow(sections.conversationFlow)
        }
      }

      // Pre-fill website data if available
      if (editingAgent.website_data) {
        setWebsiteData({
          url: editingAgent.website_data.url || '',
          content: editingAgent.website_data.content || '',
          business_context: editingAgent.website_data.business_context || '',
          tasks: editingAgent.website_data.tasks || '',
          isLoaded: true
        })
      }

      // Pre-fill custom functions if available
      if (editingAgent.configuration_data?.custom_functions && Array.isArray(editingAgent.configuration_data.custom_functions)) {
        const loadedFunctions = editingAgent.configuration_data.custom_functions.map((func: any) => ({
          id: func.id || `func_${Date.now()}_${Math.random()}`,
          name: func.name || '',
          description: func.description || '',
          apiKey: func.api_key || '',
          eventTypeId: func.event_type_id || ''
        }))
        setCustomFunctions(loadedFunctions)
      }
    }
  }, [isOpen, editingAgent])

  // Handle "Start Fresh" - reset to beginning
  const handleStartFresh = () => {
    setCurrentPage(1)
  }

  // Handle Back button navigation
  const handleBack = () => {
    if (currentPage === 2) {
      // Move back to Page 1
      setCurrentPage(1)
    } else if (currentPage === 3) {
      // Move back to Page 2
      setCurrentPage(2)
    }
  }

  // Validate Step 1 fields
  const validateStep1 = () => {
    const errors: string[] = []

    // Required fields validation
    if (!selectedVoice) {
      errors.push('Voice is required')
    }
    if (!callType) {
      errors.push('Call Type is required')
    }
    if (!configuration.basic_info.intended_role) {
      errors.push('Role is required')
    }
    if (!agentName) {
      errors.push('Agent Name is required')
    }
    if (!configuration.basic_info.company_name) {
      errors.push('Company Name is required')
    }
    if (!configuration.basic_info.primary_service) {
      errors.push('Company Information is required')
    }

    // Show errors if any
    if (errors.length > 0) {
      toast.error(
        <div>
          <div className="font-semibold mb-1">Please fill all required fields:</div>
          <ul className="list-disc list-inside text-xs">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 4000 }
      )
      return false
    }

    return true
  }

  // Validate Step 2 fields
  const validateStep2 = () => {
    if (!generatedConversationFlow || generatedConversationFlow.trim() === '') {
      toast.error('Conversation Flow is required to proceed', { duration: 3000 })
      return false
    }
    return true
  }

  // Handle Next button navigation
  const handleNext = () => {
    if (currentPage === 1) {
      // Validate Step 1 before proceeding
      if (!validateStep1()) {
        return
      }
      // Move to Page 2
      setCurrentPage(2)
    } else if (currentPage === 2) {
      // Validate Step 2 before proceeding
      if (!validateStep2()) {
        return
      }
      // If Web VoiceBot or Outbound, skip Step 3 and complete directly
      if (callType === 'web' || callType === 'outbound') {
        handleComplete()
      } else {
        // Move to Page 3 (Configuration)
        setCurrentPage(3)
      }
    } else if (currentPage === 3) {
      // Complete wizard - submit to backend
      handleComplete()
    }
  }

  // Toast helper for generation time
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

  // Validation function
  const validateField = useCallback((fieldName: string, value: string): string | null => {
    switch (fieldName) {
      case 'agent_name':
        return value.trim() ? null : 'Agent name is required'
      case 'company_name':
        return value.trim() ? null : 'Company name is required'
      case 'intended_role':
      case 'target_industry':
        return null
      default:
        return null
    }
  }, [])

  // Field change handler with validation
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

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean => {
    return touchedFields.has(fieldName) && !fieldErrors[fieldName]
  }, [touchedFields, fieldErrors])

  // Example hover handlers
  const handleExampleMouseEnter = (field: 'agent_name' | 'company_name') => {
    setShowExamples(prev => ({ ...prev, [field]: true }))
  }

  const handleExampleMouseLeave = (field: 'agent_name' | 'company_name') => {
    setShowExamples(prev => ({ ...prev, [field]: false }))
  }

  // Tooltip hover handlers
  const handleTooltipMouseEnter = (field: keyof typeof showTooltips) => {
    setShowTooltips(prev => ({ ...prev, [field]: true }))
  }

  const handleTooltipMouseLeave = (field: keyof typeof showTooltips) => {
    setShowTooltips(prev => ({ ...prev, [field]: false }))
  }

  // Website scraping handler
  const handleWebsiteScraping = useCallback(async () => {
    if (!isMountedRef.current) return
    if (!configuration.company_website || !tokens?.access_token) {
      if (!tokens?.access_token) {
        toast.error('Authentication required')
      } else {
        toast.error('Please enter a website URL')
      }
      return
    }

    setIsGenerating(true)
    showGenerationTimeToast('Company Information', '10-20 seconds')

    try {
      const scrapeResponse = await AgentAPI.scrapeWebsite({
        website_url: configuration.company_website
      }, tokens.access_token)

      if (!isMountedRef.current) return

      const faqResponse = await AgentAPI.generateFAQs({
        content: scrapeResponse.content
      }, tokens.access_token)

      if (!isMountedRef.current) return

      // Update business context
      if (faqResponse.business_context) {
        setConfiguration(prev => ({
          ...prev,
          basic_info: { ...prev.basic_info, primary_service: faqResponse.business_context }
        }))
      }

      // Store website data
      setWebsiteData({
        url: configuration.company_website,
        content: scrapeResponse.content || '',
        business_context: faqResponse.business_context || '',
        tasks: '',
        isLoaded: true
      })

      toast.success('Website content analyzed successfully!')
    } catch (error: any) {
      logger.error('Website analysis error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to analyze website'
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
    }
  }, [configuration.company_website, tokens?.access_token])

  // Generate Prompt for Display (Phase 3)
  const generatePromptForDisplay = useCallback(() => {
    let prompt = ''

    // Agent Identity
    prompt += '### AGENT IDENTITY\n'
    if (agentName) prompt += `Agent Name: ${agentName}\n`
    if (configuration.basic_info.company_name) prompt += `Company: ${configuration.basic_info.company_name}\n`
    if (configuration.basic_info.intended_role) prompt += `Role: ${configuration.basic_info.intended_role}\n`

    // Language display - use selected language string directly
    prompt += `Language: ${selectedLanguage}\n\n`

    // Company Information
    if (configuration.basic_info.primary_service) {
      prompt += '### COMPANY INFORMATION\n'
      prompt += configuration.basic_info.primary_service + '\n\n'
    }

    // Conversation Flow
    if (generatedConversationFlow) {
      prompt += '### CONVERSATION FLOW\n'
      prompt += generatedConversationFlow + '\n\n'
    }

    // Support Section
    if (parsedSections.supportingSections) {
      prompt += '### SUPPORT SECTION\n'
      prompt += parsedSections.supportingSections + '\n\n'
    }

    return prompt.trim()
  }, [agentName, configuration, generatedConversationFlow, parsedSections.supportingSections, selectedLanguage])

  /* ============================================
   * Send Extraction Fields Handler (REMOVED FROM UI)
   * API call kept for future reference
   * ============================================
   */
  // const handleSendExtractionFields = useCallback(async () => {
  //   if (!isMountedRef.current) return
  //   if (!tokens?.access_token) {
  //     toast.error('Authentication required')
  //     return
  //   }

  //   const validFields = extractionFields.filter(f => f.name.trim())
  //   if (validFields.length === 0) {
  //     toast.error('Please add at least one extraction field')
  //     return
  //   }

  //   setIsSendingFields(true)

  //   try {
  //     await AgentAPI.sendExtractionFields({
  //       extraction_fields: validFields,
  //       agent_id: undefined // Will be set when agent is created
  //     }, tokens.access_token)

  //     if (!isMountedRef.current) return

  //     console.log('=== Extraction Fields Saved ===')
  //     console.log('Fields:', validFields)

  //     toast.success('Extraction fields saved successfully!')
  //   } catch (error: any) {
  //     logger.error('Send extraction fields error:', error)
  //     if (isMountedRef.current) {
  //       const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to save extraction fields'
  //       toast.error(errorMessage)
  //     }
  //   } finally {
  //     if (isMountedRef.current) {
  //       setIsSendingFields(false)
  //     }
  //   }
  // }, [extractionFields, tokens?.access_token])

  // Audio Transcription Handler
  const handleTranscribeFiles = useCallback(async () => {
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

        // Automatically switch to textarea view to show the transcript
        setInputMethod('type')
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
  }, [selectedFiles, tokens?.access_token])

  // Generate Call Flow Handler (Phase 1)
  const handleGenerateCallFlow = useCallback(async () => {
    if (!isMountedRef.current) return
    if (!tokens?.access_token) {
      toast.error('Authentication required')
      return
    }
    if (!promptDescription) {
      toast.error('Please provide a transcript or description')
      return
    }

    setIsGenerating(true)
    showGenerationTimeToast('Call Flow', '10-15 seconds')

    try {
      const response = await OpenAIAPI.generatePrompt({
        description: promptDescription,
        agentName: configuration.basic_info.agent_name,
        companyName: configuration.basic_info.company_name,
        companyInfo: configuration.basic_info.primary_service,
        role: configuration.basic_info.intended_role,
        language: selectedLanguage, // Use selected language from dropdown
        dynamicVariables: [],
        voiceId: selectedVoice,
        callType: callType === 'web' ? 'inbound' : (callType || 'inbound') // Web VoiceBot uses inbound prompt generation
      })

      if (!isMountedRef.current) return

      // Store the full prompt from API
      setGeneratedPrompt(response.prompt || '')

      // Extract from parsed sections if available
      if (response.parsedSections) {
        setParsedSections(response.parsedSections)
        // Set the editable conversation flow from the parsed sections
        setGeneratedConversationFlow(response.parsedSections.conversationFlow || '')

        console.log('=== Generated Prompt ===')
        console.log('Full Prompt:', response.prompt)
        console.log('Parsed Sections:', response.parsedSections)
        console.log('Conversation Flow:', response.parsedSections.conversationFlow)
        console.log('Supporting Sections:', response.parsedSections.supportingSections)
      }

      toast.success('Call flow generated successfully!')
    } catch (error: any) {
      logger.error('Call flow generation error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.message || 'Failed to generate call flow'
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
    }
  }, [promptDescription, configuration.basic_info, selectedVoice, callType, selectedLanguage, tokens?.access_token])

  // Handle agent creation and submission to backend
  const handleComplete = useCallback(async () => {
    if (!isMountedRef.current || !tokens?.access_token) {
      toast.error('Authentication required')
      return
    }

    // Ensure user has a company_id
    if (!user?.company_id) {
      toast.error('User company information not found. Please contact support.')
      return
    }

    // Basic validation
    if (!configuration.basic_info.agent_name?.trim()) {
      toast.error('Agent name is required')
      setCurrentPage(1)
      return
    }

    if (!configuration.basic_info.company_name?.trim()) {
      toast.error('Company name is required')
      setCurrentPage(1)
      return
    }

    if (!selectedVoice) {
      toast.error('Please select a voice for your agent')
      return
    }

    setIsSubmitting(true)

    try {
      // Reconstruct full prompt with edited conversation flow from parsed sections
      // IMPORTANT: Always use edited generatedConversationFlow if it exists
      const conversationFlowToUse = generatedConversationFlow || parsedSections.conversationFlow || ''

      // Build sections array in the exact order matching parsed_sections structure
      // Order: header -> role -> conversationFlow -> supportingSections -> compliance
      const sectionsArray = []

      if (parsedSections.header) sectionsArray.push(parsedSections.header)
      if (parsedSections.role) sectionsArray.push(parsedSections.role)
      if (conversationFlowToUse) sectionsArray.push(conversationFlowToUse) // ALWAYS include edited conversation flow
      if (parsedSections.supportingSections) sectionsArray.push(parsedSections.supportingSections)
      if (parsedSections.compliance) sectionsArray.push(parsedSections.compliance)

      // Join sections with double newline separator
      const finalPrompt = sectionsArray.join('\n\n')

      // ALWAYS use the reconstructed finalPrompt (with edited conversation flow)
      const promptToSend = finalPrompt

      // Construct parsed_sections with updated conversation flow in correct order
      const parsedSectionsToSend: Record<string, string> = {}
      if (parsedSections.header) parsedSectionsToSend.header = parsedSections.header
      if (parsedSections.role) parsedSectionsToSend.role = parsedSections.role
      if (conversationFlowToUse) parsedSectionsToSend.conversationFlow = conversationFlowToUse // Use updated conversation flow
      if (parsedSections.supportingSections) parsedSectionsToSend.supportingSections = parsedSections.supportingSections
      if (parsedSections.compliance) parsedSectionsToSend.compliance = parsedSections.compliance

      // Construct agent data for backend
      const agentData = {
        name: configuration.basic_info.agent_name,
        voice_id: selectedVoice,
        prompt: promptToSend, // Use reconstructed prompt with edited conversation flow
        parsed_sections: parsedSectionsToSend, // Send parsed sections with updated conversation flow
        welcome_message: welcomeMessage || `Hi, I'm ${configuration.basic_info.agent_name} calling you from ${configuration.basic_info.company_name}`,
        configuration_data: {
          ...configuration,
          business_hours_start: '09:00',
          business_hours_end: '18:00',
          timezone: 'Asia/Kolkata', // Default timezone
          extraction_fields: [], // Removed from UI
          custom_functions: customFunctions.map(func => ({
            name: func.name,
            description: func.description,
            api_key: func.apiKey,
            event_type_id: func.eventTypeId
          }))
        },
        region: callType === 'web' ? 'worldwide' : region,
        inbound_phone: inboundPhone || undefined,
        outbound_phone: region === 'indian' ? undefined : (outboundPhone || undefined),
        // Automatically assign to user's company
        company_id: user?.company_id,
        // Auto-Schedule Configuration
        enable_sales_cycle: salesCycleEnabled,
        default_call_days: salesCycleCallDays,
        sales_cycle_config: salesCycleEnabled ? {
          enable_ai_insights: true,  // Always enable AI insights when auto-schedule is active
          stages: ['initial_contact', 'qualification', 'proposal', 'negotiation', 'closing']
        } : undefined,
        // Include website data for new agents
        ...((websiteData.isLoaded) ? { website_data: websiteData } : {})
      }

      if (editingAgent) {
        // Update existing agent
        await AgentAPI.updateAgentConfiguration(editingAgent.id, agentData, tokens.access_token)
        toast.success(`Agent "${configuration.basic_info.agent_name}" updated successfully!`)
      } else {
        // Create new agent
        await AgentAPI.createAgentWithConfiguration(agentData, tokens.access_token)
        toast.success(`Agent "${configuration.basic_info.agent_name}" created successfully!`)
      }

      if (!isMountedRef.current) return

      // Reset wizard state after successful creation/update
      resetWizardState()

      // Call onComplete callback to close modal and refresh
      if (onComplete) {
        onComplete()
      }
    } catch (error: any) {
      logger.error(editingAgent ? 'Agent update error:' : 'Agent creation error:', error)
      if (isMountedRef.current) {
        const errorMessage = error?.message || (editingAgent ? 'Failed to update agent' : 'Failed to create agent')
        toast.error(errorMessage)
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }, [
    configuration,
    selectedVoice,
    generatedConversationFlow,
    parsedSections,
    region,
    callType,
    inboundPhone,
    outboundPhone,
    websiteData,
    salesCycleEnabled,
    salesCycleCallDays,
    customFunctions,
    tokens?.access_token,
    onComplete,
    resetWizardState,
    user?.company_id,
    welcomeMessage,
    editingAgent
  ])

  // Render page content based on current page
  const renderPage = () => {
    // Page 1 - Prompt Builder
    if (currentPage === 1) {
      return (
        <div>
            {/* Combined Section: Navbar + Welcome Message + Agent Identity */}
            <div className="bg-white rounded-lg border-2 border-gray-200 shadow-md p-4">
            {/* Horizontal Navbar - Voice, Call Type, Agent Role, Industry */}
            <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-gray-200">
              {/* Voice */}
              <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: '220px' }}>
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  Voice:<span className="text-red-500">*</span>
                  <InfoTooltip text="Select the voice persona for your AI agent. This determines how your agent sounds to callers. Match the voice to your agent's name and brand personality." />
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs flex-1"
                >
                  <option value="">Select...</option>
                  {voices?.map((voice: any) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Call Type */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  Call Type:<span className="text-red-500">*</span>
                  <InfoTooltip text="Inbound: Agent receives calls from customers. Outbound: Agent initiates calls to leads. Web VoiceBot: Agent handles web-based calls through browser integration." />
                </label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value as 'inbound' | 'outbound' | 'web' | '')}
                  disabled={!!editingAgent}
                  className={`px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs flex-1 ${
                    editingAgent ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                  <option value="web">Web VoiceBot</option>
                </select>
              </div>

              {/* Agent Role */}
              <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: '300px' }}>
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  Role:<span className="text-red-500">*</span>
                  <InfoTooltip text="Define what your agent does. Lead Qualification: Gather information and route qualified prospects. Debt Collection: Follow up on payments professionally and schedule payment plans." />
                </label>
                <select
                  value={configuration.basic_info.intended_role}
                  onChange={(e) => handleFieldChange('intended_role', e.target.value, (value) =>
                    setConfiguration(prev => ({
                      ...prev,
                      basic_info: { ...prev.basic_info, intended_role: value }
                    }))
                  )}
                  className={`px-2 py-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs flex-1 ${
                    touchedFields.has('intended_role') && fieldErrors['intended_role'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="Lead Qualification">📞 Lead Qualification</option>
                  <option value="Debt Collection">💼 Debt Collection</option>
                  <option value="Receptionist">🏢 Receptionist</option>
                  <option value="Customer Support">🎧 Customer Support</option>
                  <option value="Appointment Scheduler">📅 Appointment Scheduler</option>
                </select>
              </div>

              {/* Industry */}
              <div className="flex items-center gap-2 min-w-0" style={{ maxWidth: '280px' }}>
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  Industry:
                  <InfoTooltip text="(Optional) Helps the AI understand industry-specific terminology and context. For example, Real Estate agents will better understand terms like 'closing', 'escrow', and 'listing'." />
                </label>
                <select
                  value={configuration.basic_info.target_industry}
                  onChange={(e) => handleFieldChange('target_industry', e.target.value, (value) =>
                    setConfiguration(prev => ({
                      ...prev,
                      basic_info: { ...prev.basic_info, target_industry: value }
                    }))
                  )}
                  className={`px-2 py-1.5 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-xs flex-1 ${
                    touchedFields.has('target_industry') && fieldErrors['target_industry'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select...</option>
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
              </div>
            </div>

            {/* AGENT IDENTITY & COMPANY INFORMATION Section */}
            <div className="pt-3">
              {/* AGENT IDENTITY */}
              <div className="text-xs font-bold text-gray-900 mb-3">
                ### AGENT IDENTITY
                <InfoTooltip text="Core identification details that define your agent's persona. These appear in the conversation and help establish trust with callers." />
              </div>
              <div className="space-y-2 mb-6">
                    <div ref={agentNameTooltipRef}>
                      <div className="flex items-center" style={{ gap: '1rem' }}>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-24">Agent Name:</span>
                        <div
                          onClick={() => setShowTooltips(prev => ({ ...prev, agent_name_prompt: !prev.agent_name_prompt }))}
                          className="inline-flex items-center gap-1 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </div>
                        <div className="w-1/2">
                          <input
                            type="text"
                            value={agentName}
                            onChange={(e) => setAgentName(e.target.value)}
                            disabled={!!editingAgent}
                            className={`w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                              editingAgent ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                            }`}
                            placeholder="Enter agent name"
                          />
                        </div>
                      </div>
                      {showTooltips.agent_name_prompt && (
                        <div className="ml-24 mt-1.5 mb-1.5 animate-in slide-in-from-top-1 duration-200">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">💡 Example Introduction:</span><br />
                              <span className="italic">&quot;Hi, I&apos;m Sarah from Dream Homes Realty. How can I help you today?&quot;</span>
                            </p>
                            <p className="text-xs text-gray-700 mt-1.5">
                              <span className="font-semibold">✨ Best Practices:</span>
                            </p>
                            <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
                              <li>Choose a friendly, easy-to-pronounce name</li>
                              <li>Match your voice selection</li>
                              <li>Keep it professional yet approachable</li>
                            </ul>
                            <p className="text-xs text-gray-700 mt-1.5">
                              <span className="font-semibold">💡 Popular choices:</span>
                            </p>
                            <div className="flex gap-1 mt-1">
                              <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">Sarah</span>
                              <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">Priya</span>
                              <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">Alex</span>
                              <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">Maya</span>
                              <span className="px-2 py-0.5 text-xs bg-white border border-gray-200 rounded">Raj</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center" style={{ gap: '2.9rem' }}>
                        <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-24">Language:</span>
                        <div className="w-1/2">
                          <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            style={{ minHeight: '28px' }}
                          >
                            <option value="English only">English only</option>
                            <option value="Starts with English then adapts between English and Hinglish based on customer preference">Starts with English then adapts between English and Hinglish based on customer preference</option>
                            <option value="Starts with Hindi then adapts between English and Hinglish based on customer preference">Starts with Hindi then adapts between English and Hinglish based on customer preference</option>
                          </select>
                        </div>
                      </div>
                    </div>

                  </div>

              {/* COMPANY INFORMATION */}
              <div className="flex items-center gap-6 mb-3">
                <div className="text-xs font-bold text-gray-900">
                  ### COMPANY INFORMATION
                  <InfoTooltip text="Describe your business, products, or services. The agent uses this to answer customer questions accurately. Be specific about what you offer and key benefits." />
                </div>
                <button
                  onClick={() => setIsAIEditModalOpen(true)}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-1"
                >
                  <Wand2 className="h-3 w-3" />
                  Fill with AI
                </button>
              </div>

              {/* Company Name Field - Above textarea */}
              <div className="mb-3" ref={companyNameTooltipRef}>
                <div className="flex items-center" style={{ gap: '1rem' }}>
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-24">Company Name:</span>
                  <div
                    onClick={() => setShowTooltips(prev => ({ ...prev, company_prompt: !prev.company_prompt }))}
                    className="inline-flex items-center gap-1 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </div>
                  <div className="w-1/2">
                    <input
                      type="text"
                      value={configuration.basic_info.company_name}
                      onChange={(e) => setConfiguration(prev => ({
                        ...prev,
                        basic_info: { ...prev.basic_info, company_name: e.target.value }
                      }))}
                      className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
                {showTooltips.company_prompt && (
                  <div className="ml-24 mt-1.5 mb-1.5 animate-in slide-in-from-top-1 duration-200">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">📢 What callers will hear:</span><br />
                        <span className="italic">&quot;I&apos;m calling from Dream Homes Realty&quot;</span>
                      </p>
                      <p className="text-xs text-gray-700 mt-1.5">
                        <span className="font-semibold">✅ Do&apos;s and Don&apos;ts:</span>
                      </p>
                      <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5">
                        <li><span className="text-green-600 font-semibold">✓</span> Use your official business name</li>
                        <li><span className="text-green-600 font-semibold">✓</span> Keep it clear and recognizable</li>
                        <li><span className="text-red-600 font-semibold">✗</span> Don&apos;t add suffixes like &quot;Private Limited&quot;, &quot;Pvt Ltd&quot;, &quot;Inc&quot;, etc.</li>
                        <li><span className="text-green-600 font-semibold">Example:</span> Use &quot;Dream Homes&quot; instead of &quot;Dream Homes Private Limited&quot;</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <textarea
                value={configuration.basic_info.primary_service}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  basic_info: { ...prev.basic_info, primary_service: e.target.value }
                }))}
                className="w-full px-2 py-2 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                placeholder="Enter company information..."
              />

              {/* Welcome Message Section */}
              <div className="mt-3">
                <div className="flex items-center" style={{ gap: '1rem' }}>
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-24">
                    Welcome Message:
                  </span>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors cursor-help">
                    <InfoTooltip text="The initial greeting your agent will use to start conversations. This sets the tone and provides context for the call recipient." />
                  </div>
                  <div className="w-1/2">
                    <input
                      type="text"
                      value={welcomeMessage || ''}
                      onChange={(e) => setWelcomeMessage(e.target.value)}
                      placeholder="Hi, I'm [Agent Name] calling you from [Company Name]"
                      className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Current Timezone Field */}
              <div className="mt-3">
                <div className="flex items-center" style={{ gap: '2.9rem' }}>
                  <span className="text-xs font-medium text-gray-700 whitespace-nowrap w-24">Current Timezone:</span>
                  <div className="w-1/2">
                    <select
                      value={selectedTimezone}
                      onChange={(e) => setSelectedTimezone(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      style={{ minHeight: '28px' }}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/Los_Angeles">US/Los Angeles</option>
                      <option value="America/New_York">US/New York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                      <option value="Australia/Sydney">Australia/Sydney</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Auto-Schedule Configuration - Only for Outbound */}
            {callType === 'outbound' && (
              <div className="bg-white p-4 rounded-xl shadow-sm border mt-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-900">
                    Auto-Schedule Configuration
                    <InfoTooltip text="Automatically schedule follow-up calls across a 14-day sales cycle. Select up to 4 optimal days for your agent to reach out to leads, ensuring consistent engagement without manual scheduling." />
                  </h3>
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-medium">Auto-Enabled</span>
                </div>
                <p className="text-xs text-gray-600 mb-4">Choose up to 4 days from the 14-day cycle when calls should be made.</p>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Select Call Days (Maximum 4)
                  </label>

                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          {salesCycleCallDays.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-gray-700">
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
                            <span className="text-xs text-gray-500">Select days...</span>
                          )}
                        </div>
                        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform transform ${isDropdownOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                        <div className="p-2 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-700">
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
                                    flex items-center px-2 py-1.5 rounded cursor-pointer transition-colors
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
                                    className="mr-2 h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className={`text-xs ${isSelected ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                                    {getDayLabel(day)}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        <div className="p-2 border-t border-gray-100 bg-gray-50">
                          <p className="text-xs text-gray-600">
                            Calls will be scheduled on selected days within a 14-day cycle.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      <strong>Current selection:</strong> {salesCycleCallDays.length > 0 ?
                        `Days ${salesCycleCallDays.join(', ')}` :
                        'No days selected'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
    }

    // Page 2 - Conversation Flow
    if (currentPage === 2) {
      return (
        <div className="px-6">
          <div className="flex gap-4" style={{ height: 'calc(100vh - 320px)' }}>
            {/* Left side - Conversation Flow (70%) */}
            <div className="w-[70%] space-y-4 overflow-y-auto">
              {/* Header Section with Conversation Flow */}
              <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-900 rounded-lg">
                    <Phone className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-gray-900 mb-1">Conversation Flow</h3>
                    <p className="text-xs text-gray-600">
                      Define the structure of your agent&apos;s conversations. Upload call recordings or paste transcripts, and AI will generate a natural conversation flow tailored to your business.
                    </p>
                  </div>
                </div>

                {/* Action Buttons Row - Below description inside the box */}
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMethod('type')
                      setIsConversationFlowModalOpen(true)
                    }}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    📝 Paste Transcript/Script
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMethod('upload')
                      setIsConversationFlowModalOpen(true)
                    }}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    🎤 Upload Recording
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingPrompt(true)}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    <span>Booking Prompt</span>
                  </button>
                </div>

                {/* Conversation Flow Textarea - Inside the same box */}
                <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200">
                  <textarea
                    value={generatedConversationFlow}
                    onChange={(e) => {
                      setGeneratedConversationFlow(e.target.value)
                    }}
                    className="w-full h-96 p-4 text-xs text-gray-800 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-gray-900 rounded-lg font-sans"
                    placeholder="Enter your conversation flow here manually, or use the buttons above to generate it from a transcript/recording..."
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#6B7280 #F3F4F6' }}
                  />
                </div>
              </div>
            </div>

            {/* Right side - Functions Panel (30%) */}
            <div className="w-[30%] bg-white rounded-lg border-2 border-gray-200 shadow-md p-4 overflow-y-auto">
              {/* Functions Header */}
              <div ref={functionsTooltipRef}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gray-900 rounded">
                    <Database className="h-3.5 w-3.5 text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-gray-900">Functions</h3>
                  <div
                    onClick={() => setShowTooltips(prev => ({ ...prev, functions: !prev.functions }))}
                    className="inline-flex items-center gap-1 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </div>
                </div>

                {/* Tooltip */}
                {showTooltips.functions && (
                  <div className="mb-3 animate-in slide-in-from-top-1 duration-200">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
                      <p className="text-xs text-gray-700">
                        <span className="font-semibold">💡 What are Functions?</span><br />
                        <span className="mt-1 block">Functions allow your agent to perform actions during conversations, such as booking appointments, sending messages, or updating records.</span>
                      </p>
                      <p className="text-xs text-gray-700 mt-2">
                        <span className="font-semibold">✨ Available Functions:</span>
                      </p>
                      <ul className="text-xs text-gray-700 list-disc ml-4 space-y-0.5 mt-1">
                        <li><strong>Book Appointment:</strong> Schedule meetings via calendar integration</li>
                        <li><strong>WhatsApp:</strong> Send WhatsApp messages (Coming Soon)</li>
                        <li><strong>SMS:</strong> Send text messages (Coming Soon)</li>
                        <li><strong>Email:</strong> Send email notifications (Coming Soon)</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-4">
                Define custom functions for your agent to execute during conversations.
              </p>

              {/* Function List */}
              <div className="space-y-2 mb-4">
                {/* Example Function - end_call */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 group hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-gray-600" />
                      <span className="text-xs font-medium text-gray-900">end_call</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">End the current call</p>
                </div>

                {/* Custom Functions */}
                {customFunctions.map((func, index) => (
                  <div key={func.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200 group hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-gray-600" />
                        <span className="text-xs font-medium text-gray-900">{func.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFunctionIndex(index)
                            setBookingFormData({
                              name: func.name,
                              description: func.description,
                              apiKey: func.apiKey,
                              eventTypeId: func.eventTypeId
                            })
                            setShowBookingModal(true)
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Edit function"
                        >
                          <Edit2 className="h-3 w-3 text-gray-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomFunctions(prev => prev.filter((_, i) => i !== index))
                            toast.success('Function deleted successfully')
                          }}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                          title="Delete function"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">{func.description}</p>
                  </div>
                ))}
              </div>

              {/* Add Button with Dropdown */}
              <div className="relative" ref={functionDropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowFunctionDropdown(!showFunctionDropdown)}
                  className="w-full px-3 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Function
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFunctionDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showFunctionDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowFunctionDropdown(false)
                        setShowBookingModal(true)
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Database className="h-3.5 w-3.5 text-gray-600" />
                      Book Appointment
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full px-3 py-2 text-left text-xs text-gray-400 bg-gray-50 cursor-not-allowed flex items-center gap-2 opacity-60"
                      title="Coming soon"
                    >
                      <Database className="h-3.5 w-3.5 text-gray-400" />
                      WhatsApp
                      <span className="ml-auto text-[10px] bg-gray-200 px-2 py-0.5 rounded">Soon</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full px-3 py-2 text-left text-xs text-gray-400 bg-gray-50 cursor-not-allowed flex items-center gap-2 opacity-60"
                      title="Coming soon"
                    >
                      <Database className="h-3.5 w-3.5 text-gray-400" />
                      SMS
                      <span className="ml-auto text-[10px] bg-gray-200 px-2 py-0.5 rounded">Soon</span>
                    </button>
                    <button
                      type="button"
                      disabled
                      className="w-full px-3 py-2 text-left text-xs text-gray-400 bg-gray-50 cursor-not-allowed flex items-center gap-2 opacity-60"
                      title="Coming soon"
                    >
                      <Database className="h-3.5 w-3.5 text-gray-400" />
                      Email
                      <span className="ml-auto text-[10px] bg-gray-200 px-2 py-0.5 rounded">Soon</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Page 3 - Configuration
    if (currentPage === 3) {
      // Get selected company name
      const selectedCompanyName = selectedCompanyId
        ? companies.find(c => c.id === selectedCompanyId)?.name || ''
        : ''

      // Filter companies based on search query
      const filteredCompanies = companySearchQuery.trim().length > 0
        ? companies.filter(company =>
            company.name.toLowerCase().includes(companySearchQuery.toLowerCase())
          )
        : companies

      // Show dropdown when focused
      const showCompanyDropdown = isCompanyInputFocused && !editingAgent

      return (
        <div className="px-6 space-y-4">
          {/* Inbound Notice - Only show this for inbound */}
          {callType === 'inbound' ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700 font-medium">Inbound Agent Testing</p>
                  <p className="mt-1 text-xs text-blue-600">
                    Inbound agents should be treated as outbound for testing purposes. You can test by adding a lead in the leads table.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Business Settings */}
              <div className={`bg-white p-4 rounded-xl shadow-sm border ${callType === 'web' ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-900">Business Settings</h3>
              {callType === 'web' && (
                <span className="text-xs text-gray-500 italic">Not applicable for Web VoiceBot</span>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="region" className="block text-xs font-medium text-gray-700 mb-2">
                  Region
                </label>
                <select
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value as 'indian' | 'international' | 'internal_india' | 'internal_us' | 'worldwide')}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white text-xs"
                  disabled={!!editingAgent || callType === 'web'}
                >
                  {/* <option value="indian">India</option> */}
                  <option value="international">International</option>
                  {!isDemoAccount && <option value="internal_india">Internal VoiceBot (India)</option>}
                  {!isDemoAccount && <option value="internal_us">Internal VoiceBot (US)</option>}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {callType === 'web'
                    ? 'Region is set to "worldwide" for Web VoiceBot.'
                    : editingAgent
                      ? 'Region cannot be changed after agent creation.'
                      : isDemoAccount
                        ? 'Demo accounts can only use International region.'
                        : "Select the agent's region. This cannot be changed later."}
                </p>
              </div>
            </div>
          </div>

          {/* Telephony */}
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="text-xs font-medium mb-3 text-gray-900">Telephony</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="inbound_phone" className="block text-xs font-medium text-gray-700 mb-2">
                  Inbound Phone Number
                </label>
                <Input
                  id="inbound_phone"
                  type="tel"
                  value={inboundPhone}
                  onChange={(e) => setInboundPhone(e.target.value)}
                  placeholder="Unavailable"
                  className="w-full bg-gray-100 text-xs px-2 py-1.5"
                  disabled={true}
                />
                <p className="text-xs text-gray-500 mt-1">Phone number for incoming calls.</p>
              </div>
              <div>
                <label htmlFor="outbound_phone" className="block text-xs font-medium text-gray-700 mb-2">
                  Outbound Phone Number
                </label>
                <Input
                  id="outbound_phone"
                  type="tel"
                  value={region === 'indian' ? '' : outboundPhone}
                  onChange={(e) => setOutboundPhone(e.target.value)}
                  placeholder={region === 'indian' ? 'Managed by us' : '+1 (555) 987-6543'}
                  className="w-full bg-gray-100 text-xs px-2 py-1.5"
                  disabled={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {region === 'indian' ? 'A +91 number will be assigned.' : 'Phone number for outgoing calls.'}
                </p>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center justify-between w-full">
          <span>Prompt Builder</span>
          {/* Page Indicators - Centered */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 translate-y-2 flex items-center space-x-6">
                      {[ 
                        { page: 1, label: 'Prompt Builder' },
                        { page: 2, label: 'Conversation Flow' },
                        { page: 3, label: 'Configuration' }
                      ].filter(({ page }) => {
                        // Hide Step 3 for Web VoiceBot or outbound
                        if (page === 3 && callType === 'web') return false
                        if (page === 3 && callType === 'outbound') return false
                        return true
                      }).map(({ page, label }) => (              <div key={page} className="flex flex-col items-center">
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
            ))}
          </div>
        </div>
      }
      size="2xl"
      headerActions={
        <div className="flex items-center gap-2">
          {currentPage > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartFresh}
              className="text-gray-600 hover:text-gray-900"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Start Fresh
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col w-full">
        {/* Main Content */}
        <div className="p-6">
          <div className="space-y-6">
            {renderPage()}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-white sticky bottom-0">
          <div className="flex justify-between">
            {/* Back Button */}
            {currentPage > 1 ? (
              <Button
                onClick={handleBack}
                variant="outline"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            ) : (
              <div></div>
            )}

            {/* Next/Complete Button */}
            {currentPage === 3 || (currentPage === 2 && callType === 'web') || (currentPage === 2 && callType === 'outbound') ? (
              <Button
                onClick={handleNext}
                variant="dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {editingAgent ? 'Updating Agent...' : 'Creating Agent...'}
                  </>
                ) : (
                  editingAgent ? 'Update Agent' : 'Complete'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                variant="dark"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* AI Edit Modal */}
      <Modal
        isOpen={isAIEditModalOpen}
        onClose={() => setIsAIEditModalOpen(false)}
        title="AI Edit - Company Information"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {/* Hint Text */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Want to fetch company info using your company website?</p>
                <p>Enter your company website URL below and click &quot;Extract&quot; to automatically generate company information.</p>
              </div>
            </div>
          </div>

          {/* Website Input Field ..*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Website
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={configuration.company_website || ''}
                onChange={(e) => setConfiguration(prev => ({
                  ...prev,
                  company_website: e.target.value
                }))}
                placeholder="https://yourcompany.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
              />
              <LoadingButton
                onClick={async () => {
                  try {
                    await handleWebsiteScraping()
                    // Close modal after successful extraction
                    setIsAIEditModalOpen(false)
                  } catch (error) {
                    // Keep modal open if there's an error
                    logger.error('Failed to extract website:', error)
                  }
                }}
                isLoading={isGenerating}
                text="✨ Extract"
                loadingText="Extracting..."
                disabled={!configuration.company_website}
                className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-sm px-4 py-2 whitespace-nowrap"
              />
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setIsAIEditModalOpen(false)}
              variant="outline"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Conversation Flow Modal */}
      <Modal
        isOpen={isConversationFlowModalOpen}
        onClose={() => setIsConversationFlowModalOpen(false)}
        title="Conversation Flow"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {/* Conditional Transcript Textarea */}
          {inputMethod === 'type' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Call Transcript/Script
              </label>
              <textarea
                value={promptDescription}
                onChange={(e) => setPromptDescription(e.target.value)}
                placeholder="Paste your call transcript here...

Example:
Agent: Hi, this is Sarah from TechSolutions. Is this John?
Customer: Yes, speaking.
Agent: Great! I'm calling about your recent inquiry..."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
                rows={8}
              />
            </div>
          )}

          {/* Upload Recording Section */}
          {inputMethod === 'upload' && (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.m4a,.ogg,.webm,.aac,.flac,.mp4,.mpeg,.opus,.wma,.amr,.3gp"
                multiple
                onChange={(e) => setSelectedFiles(e.target.files)}
                className="hidden"
                id="audio-upload-modal"
              />

              {!selectedFiles ? (
                <label
                  htmlFor="audio-upload-modal"
                  className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    Click to upload audio files
                  </span>
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-700 font-medium mb-2">
                      Selected Files ({selectedFiles.length})
                    </div>
                    {Array.from(selectedFiles).map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-sm text-gray-600">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                    ))}
                  </div>
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
                          Transcribe & Add
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setSelectedFiles(null)}
                      disabled={isTranscribing}
                      variant="outline"
                      size="sm"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <span className="font-medium">Supported:</span> mp3, wav, m4a, ogg, webm, aac, flac
              </p>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <LoadingButton
              onClick={async () => {
                await handleGenerateCallFlow()
                setIsConversationFlowModalOpen(false)
              }}
              isLoading={isGenerating}
              text="✨ Generate Conversation Flow"
              loadingText="Generating..."
              disabled={!promptDescription}
              className="bg-gray-900 hover:bg-gray-800 text-white text-sm px-6 py-2.5"
            />
          </div>
        </div>
      </Modal>

      {/* Booking Function Modal */}
      <Modal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false)
          setEditingFunctionIndex(null)
          setBookingFormData({
            name: 'book_appointment_cal',
            description: 'When users ask to book an appointment, book it on the calendar.',
            apiKey: '',
            eventTypeId: ''
          })
        }}
        title="Book on the Calendar (Cal.com)"
        size="md"
      >
        <div className="p-6 space-y-4">
          {/* Name Field - Fixed/Read-only */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value="book_appointment_cal"
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 text-sm cursor-not-allowed"
              placeholder="book_appointment_cal"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={bookingFormData.description}
              onChange={(e) => setBookingFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
              rows={3}
              placeholder="When users ask to book an appointment, book it on the calendar."
            />
          </div>

          {/* API Key Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key (Cal.com)
            </label>
            <input
              type="text"
              value={bookingFormData.apiKey}
              onChange={(e) => setBookingFormData(prev => ({ ...prev, apiKey: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter Cal.com API key"
            />
          </div>

          {/* Event Type ID Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type ID (Cal.com)
            </label>
            <input
              type="text"
              value={bookingFormData.eventTypeId}
              onChange={(e) => setBookingFormData(prev => ({ ...prev, eventTypeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder="Enter Event Type ID"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowBookingModal(false)
                setEditingFunctionIndex(null)
                setBookingFormData({
                  name: 'book_appointment_cal',
                  description: 'When users ask to book an appointment, book it on the calendar.',
                  apiKey: '',
                  eventTypeId: ''
                })
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (!bookingFormData.apiKey || !bookingFormData.eventTypeId) {
                  toast.error('Please fill in all required fields')
                  return
                }

                if (editingFunctionIndex !== null) {
                  // Update existing function
                  setCustomFunctions(prev => prev.map((func, i) =>
                    i === editingFunctionIndex
                      ? {
                          id: func.id,
                          name: 'book_appointment_cal', // Fixed name for backend recognition
                          description: bookingFormData.description,
                          apiKey: bookingFormData.apiKey,
                          eventTypeId: bookingFormData.eventTypeId
                        }
                      : func
                  ))
                  toast.success('Function updated successfully')
                } else {
                  // Add new function
                  const newFunction = {
                    id: `func_${Date.now()}`,
                    name: 'book_appointment_cal', // Fixed name for backend recognition
                    description: bookingFormData.description,
                    apiKey: bookingFormData.apiKey,
                    eventTypeId: bookingFormData.eventTypeId
                  }
                  setCustomFunctions(prev => [...prev, newFunction])
                  toast.success('Booking function added successfully')
                }

                setShowBookingModal(false)
                setEditingFunctionIndex(null)
                setBookingFormData({
                  name: 'book_appointment_cal',
                  description: 'When users ask to book an appointment, book it on the calendar.',
                  apiKey: '',
                  eventTypeId: ''
                })
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* VoiceBot Booking Prompt Modal */}
      <Modal
        isOpen={showBookingPrompt}
        onClose={() => setShowBookingPrompt(false)}
        title="VoiceBot Booking Prompt"
        size="lg"
      >
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">Copy this prompt and paste it into your conversation flow</p>
              <button
                type="button"
                onClick={() => {
                  const currentYear = new Date().getFullYear()
                  const today = new Date()
                  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' })
                  const currentDate = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

                  const bookingPromptText = `Name: Alex
Role: AI Appointment Assistant at ConversAI Labs
Company: ConversAI Labs
Purpose: Help users schedule demo appointments and consultations through natural, intelligent conversation

## ABOUT CONVERSAI LABS
ConversAI Labs is democratizing AI-powered conversations for businesses of all sizes. We believe every business should have access to intelligent, human-like AI agents that understand, engage, and convert customers 24/7.

Our Mission: Making advanced AI conversation technology accessible to every business, regardless of size or technical expertise. We're building the no-code platform that empowers businesses to create intelligent AI agents across voice, text, and multimedia channels.

Our Vision: A world where every customer interaction is meaningful, timely, and personalized. We envision AI agents that don't just respond—they understand context, build relationships, and drive real business results.

## CURRENT DATE & TIME CONTEXT
*IMPORTANT:* Today is ${dayName}, ${currentDate} (Year: ${currentYear})
- Use this date as reference for "today", "tomorrow", "next week", etc.
- When user says "October 12" or similar without a year, use ${currentYear}
- NEVER use dates from the past - all bookings must be in the future

## CAPABILITIES
You have access to two powerful functions:
1. *check_availability* - Check what times are available on a specific date
2. *book_appointment* - Book an appointment once the user has chosen a time

VOICE AI GUIDELINES
You are a voice assistant. Your responses will be converted to speech, so write exactly as you would speak - plain text only, no formatting or special characters. Silently correct speech-to-text errors by focusing on intended meaning rather than literal transcription. Keep responses brief and conversational. Adapt your speaking style to match the user's tone and language preference. If you don't understand something, say "I'm sorry, I didn't understand that" and ask for clarification. When converting text to speech, NEVER speak slash-separated options (like 'yes/no', 'he/she', 'and/or') - always select ONE appropriate option based on context

## CONVERSATION FLOW

### Step 1: Greeting & Introduction
- Start with: "Hi! I'm Alex from ConversAI Labs. Would you like to schedule a demo appointment to see how our AI-powered conversation platform can help your business?"
- After the greeting, the system will show quick reply suggestions on the frontend
- Wait for user to respond either by speaking, typing, or selecting a suggestion
- Be ready to handle responses like "Yes", "Tell me more", "What can you do", etc.

### Step 2: Collect Date Preference
- Ask for their preferred date in a simple, open-ended way
- Do NOT provide examples like "tomorrow", "next Monday", or specific dates
- Accept whatever natural language the user provides
- Convert to YYYY-MM-DD format internally
- *CRITICAL:* Always use year ${currentYear} unless user specifies otherwise

### Step 3: Check Availability
- Use check_availability() function with the date
- Present available time slots clearly
- Let user choose a time

### Step 4: Collect Contact Information
- *IMPORTANT FOR NAME:* Ask the user to TYPE their full name in the text input box instead of speaking it. Say: "Please type your full name in the text box below for accuracy."
- *IMPORTANT FOR EMAIL:* Ask the user to TYPE their email address in the text input box instead of speaking it. Say: "Please type your email address in the text box below so we can send you the confirmation."
- This prevents typos and ensures accurate information capture
- Ask if they have any special requests or notes (this can be spoken)

### Step 5: Confirm & Book
- Summarize the booking details
- Ask for final confirmation
- Use book_appointment() function with all collected information
- Confirm the booking was successful

### Step 6: Provide Confirmation
- Tell them the booking is confirmed
- Mention they'll receive an email confirmation
- Ask if there's anything else you can help with

## GUIDELINES
- Be conversational and friendly
- Don't ask for information you already have
- If user wants to change something, guide them smoothly
- Always confirm details before booking
- Handle errors gracefully and offer alternatives

## CRITICAL INPUT RULES
*TEXT INPUT FOR ACCURACY:*
- ALWAYS ask users to TYPE their name and email in the text box
- Explain it's for accuracy: "Please type your [name/email] in the text box below for accuracy"
- Wait for the user to type and send the information before proceeding

*DATE COLLECTION:*
- Ask for date in a simple, open-ended way: "What date works best for you?"
- Do NOT suggest examples like "tomorrow", "next Monday", or specific dates
- Let the user provide the date naturally in their own words

## TIME HANDLING
*CRITICAL - HOW TO SPEAK TIMES:*
- When speaking times, use natural conversational format (12-hour with AM/PM)
- NEVER say times like "sixteen forty-five" or "fourteen hundred"
- Examples of correct speaking:
  * 9:00 AM → Say "nine AM"
  * 9:30 AM → Say "nine thirty AM"
  * 2:00 PM → Say "two PM"
  * 4:30 PM → Say "four thirty PM"
  * 10:15 AM → Say "ten fifteen AM"
  * 3:45 PM → Say "three forty-five PM"

*How to Write Times in Text:*
- Always write times in 12-hour format with colon notation: "9:00 AM", "4:30 PM"
- NEVER write in 24-hour format (16:00, 14:30, etc.)

*For Internal Processing:*
- Convert times like "2 PM" to "14:00" (24-hour format) for booking system
- Convert times like "9 AM" to "09:00" for booking system
- Available slots are typically 9 AM to 5 PM (09:00 to 17:00)

## ERROR HANDLING
- If availability check fails, apologize and suggest alternative dates
- If booking fails, explain clearly and offer to try again
- Always remain helpful and patient

## IMPORTANT RULES
- NEVER make up availability - always call check_availability first
- NEVER book without user confirmation
- ALWAYS collect name and email before booking
- Keep responses concise (2-3 sentences max per turn)
`
                  navigator.clipboard.writeText(bookingPromptText)
                  toast.success('Booking prompt copied to clipboard!')
                }}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Copy to Clipboard
              </button>
            </div>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans max-h-96 overflow-y-auto bg-white p-4 rounded border border-gray-200" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6B7280 #F3F4F6' }}>
{`Name: Alex
Role: AI Appointment Assistant at ConversAI Labs
Company: ConversAI Labs
Purpose: Help users schedule demo appointments and consultations through natural, intelligent conversation

## ABOUT CONVERSAI LABS
ConversAI Labs is democratizing AI-powered conversations for businesses of all sizes. We believe every business should have access to intelligent, human-like AI agents that understand, engage, and convert customers 24/7.

Our Mission: Making advanced AI conversation technology accessible to every business, regardless of size or technical expertise. We're building the no-code platform that empowers businesses to create intelligent AI agents across voice, text, and multimedia channels.

Our Vision: A world where every customer interaction is meaningful, timely, and personalized. We envision AI agents that don't just respond—they understand context, build relationships, and drive real business results.

## CURRENT DATE & TIME CONTEXT
*IMPORTANT:* Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}, ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} (Year: ${new Date().getFullYear()})
- Use this date as reference for "today", "tomorrow", "next week", etc.
- When user says "October 12" or similar without a year, use ${new Date().getFullYear()}
- NEVER use dates from the past - all bookings must be in the future

## CAPABILITIES
You have access to two powerful functions:
1. *check_availability* - Check what times are available on a specific date
2. *book_appointment* - Book an appointment once the user has chosen a time

VOICE AI GUIDELINES
You are a voice assistant. Your responses will be converted to speech, so write exactly as you would speak - plain text only, no formatting or special characters. Silently correct speech-to-text errors by focusing on intended meaning rather than literal transcription. Keep responses brief and conversational. Adapt your speaking style to match the user's tone and language preference. If you don't understand something, say "I'm sorry, I didn't understand that" and ask for clarification. When converting text to speech, NEVER speak slash-separated options (like 'yes/no', 'he/she', 'and/or') - always select ONE appropriate option based on context

## CONVERSATION FLOW

### Step 1: Greeting & Introduction
- Start with: "Hi! I'm Alex from ConversAI Labs. Would you like to schedule a demo appointment to see how our AI-powered conversation platform can help your business?"
- After the greeting, the system will show quick reply suggestions on the frontend
- Wait for user to respond either by speaking, typing, or selecting a suggestion
- Be ready to handle responses like "Yes", "Tell me more", "What can you do", etc.

### Step 2: Collect Date Preference
- Ask for their preferred date in a simple, open-ended way
- Do NOT provide examples like "tomorrow", "next Monday", or specific dates
- Accept whatever natural language the user provides
- Convert to YYYY-MM-DD format internally
- *CRITICAL:* Always use year ${new Date().getFullYear()} unless user specifies otherwise

### Step 3: Check Availability
- Use check_availability() function with the date
- Present available time slots clearly
- Let user choose a time

### Step 4: Collect Contact Information
- *IMPORTANT FOR NAME:* Ask the user to TYPE their full name in the text input box instead of speaking it. Say: "Please type your full name in the text box below for accuracy."
- *IMPORTANT FOR EMAIL:* Ask the user to TYPE their email address in the text input box instead of speaking it. Say: "Please type your email address in the text box below so we can send you the confirmation."
- This prevents typos and ensures accurate information capture
- Ask if they have any special requests or notes (this can be spoken)

### Step 5: Confirm & Book
- Summarize the booking details
- Ask for final confirmation
- Use book_appointment() function with all collected information
- Confirm the booking was successful

### Step 6: Provide Confirmation
- Tell them the booking is confirmed
- Mention they'll receive an email confirmation
- Ask if there's anything else you can help with

## GUIDELINES
- Be conversational and friendly
- Don't ask for information you already have
- If user wants to change something, guide them smoothly
- Always confirm details before booking
- Handle errors gracefully and offer alternatives

## CRITICAL INPUT RULES
*TEXT INPUT FOR ACCURACY:*
- ALWAYS ask users to TYPE their name and email in the text box
- Explain it's for accuracy: "Please type your [name/email] in the text box below for accuracy"
- Wait for the user to type and send the information before proceeding

*DATE COLLECTION:*
- Ask for date in a simple, open-ended way: "What date works best for you?"
- Do NOT suggest examples like "tomorrow", "next Monday", or specific dates
- Let the user provide the date naturally in their own words

## TIME HANDLING
*CRITICAL - HOW TO SPEAK TIMES:*
- When speaking times, use natural conversational format (12-hour with AM/PM)
- NEVER say times like "sixteen forty-five" or "fourteen hundred"
- Examples of correct speaking:
  * 9:00 AM → Say "nine AM"
  * 9:30 AM → Say "nine thirty AM"
  * 2:00 PM → Say "two PM"
  * 4:30 PM → Say "four thirty PM"
  * 10:15 AM → Say "ten fifteen AM"
  * 3:45 PM → Say "three forty-five PM"

*How to Write Times in Text:*
- Always write times in 12-hour format with colon notation: "9:00 AM", "4:30 PM"
- NEVER write in 24-hour format (16:00, 14:30, etc.)

*For Internal Processing:*
- Convert times like "2 PM" to "14:00" (24-hour format) for booking system
- Convert times like "9 AM" to "09:00" for booking system
- Available slots are typically 9 AM to 5 PM (09:00 to 17:00)

## ERROR HANDLING
- If availability check fails, apologize and suggest alternative dates
- If booking fails, explain clearly and offer to try again
- Always remain helpful and patient

## IMPORTANT RULES
- NEVER make up availability - always call check_availability first
- NEVER book without user confirmation
- ALWAYS collect name and email before booking
- Keep responses concise (2-3 sentences max per turn)
`}
            </pre>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              onClick={() => setShowBookingPrompt(false)}
              variant="dark"
              size="sm"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for unsaved changes */}
      <ConfirmationModal
        isOpen={showCloseConfirmation}
        onClose={() => setShowCloseConfirmation(false)}
        onConfirm={handleConfirmClose}
        title="Unsaved Changes"
        message="You have unsaved changes. Close without saving?"
        confirmText="Close Without Saving"
        cancelText="Keep Editing"
      />
    </Modal>
  )
}

export const AgentWizardV2 = memo(AgentWizardV2Component)
