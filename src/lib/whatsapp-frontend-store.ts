// Frontend-only storage for WhatsApp configuration
// This data is not sent to the backend - it's only for UI demo purposes

interface WhatsAppAgentConfig {
  agentId: string
  channels: ('voice' | 'whatsapp')[]
  whatsapp_config?: {
    phone_number?: string
    auto_reply_enabled?: boolean
    handoff_enabled?: boolean
    template_ids?: string[]
    business_account_id?: string
    webhook_url?: string
  }
  contact_strategy?: 'call_first' | 'whatsapp_first' | 'whatsapp_only' | 'voice_only'
  call_schedule?: 'realistic' | 'aggressive' | 'gentle' | 'custom'
  custom_schedule_days?: number[]
  daily_call_times?: ('morning' | 'afternoon' | 'evening')[]
}

class WhatsAppFrontendStore {
  private store: Map<string, WhatsAppAgentConfig> = new Map()

  // Save WhatsApp config for an agent (frontend only)
  saveAgentWhatsAppConfig(config: WhatsAppAgentConfig) {
    this.store.set(config.agentId, config)
  }

  // Get WhatsApp config for an agent
  getAgentWhatsAppConfig(agentId: string): WhatsAppAgentConfig | null {
    return this.store.get(agentId) || null
  }

  // Check if agent has WhatsApp enabled
  hasWhatsApp(agentId: string): boolean {
    const config = this.store.get(agentId)
    return config?.channels?.includes('whatsapp') || false
  }

  // Get all agents with WhatsApp enabled
  getWhatsAppAgents(): WhatsAppAgentConfig[] {
    return Array.from(this.store.values()).filter(config => 
      config.channels?.includes('whatsapp')
    )
  }

  // Remove agent config
  removeAgent(agentId: string) {
    this.store.delete(agentId)
  }

  // Clear all data
  clear() {
    this.store.clear()
  }
}

// Export singleton instance
export const whatsappStore = new WhatsAppFrontendStore()

// Helper function to enhance agent with WhatsApp data
export function enhanceAgentWithWhatsApp(agent: any) {
  const whatsappConfig = whatsappStore.getAgentWhatsAppConfig(agent.id)
  if (whatsappConfig) {
    return {
      ...agent,
      channels: whatsappConfig.channels,
      whatsapp_config: whatsappConfig.whatsapp_config,
      contact_strategy: whatsappConfig.contact_strategy,
      call_schedule: whatsappConfig.call_schedule,
      custom_schedule_days: whatsappConfig.custom_schedule_days,
      daily_call_times: whatsappConfig.daily_call_times
    }
  }
  return {
    ...agent,
    channels: ['voice'] // Default to voice only if no WhatsApp config
  }
}