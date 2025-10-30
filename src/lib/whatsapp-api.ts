import { 
  WhatsAppDashboardStats, 
  WhatsAppConversation, 
  WhatsAppMessage, 
  WhatsAppTemplate, 
  WhatsAppCampaign, 
  WhatsAppAnalytics, 
  WhatsAppContact,
  ApiResponse 
} from '@/types/whatsapp'

const API_BASE_URL = 'https://voice-ai-admin-api-762279639608.us-central1.run.app/api/v1/whatsapp'

const mockDelay = (ms: number = 1000) => new Promise(resolve => setTimeout(resolve, ms))

const createMockApiResponse = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data
})

export const whatsappApi = {
  async getDashboardStats(): Promise<ApiResponse<WhatsAppDashboardStats>> {
    await mockDelay(800)
    return createMockApiResponse({
      messages_sent: 1234,
      active_contacts: 834,
      templates_ready: 12,
      campaigns_running: 3,
      message_volume_7days: [120, 150, 180, 200, 175, 190, 165],
      recent_activity: [
        {
          id: 'act_001',
          type: 'message_sent',
          description: 'Message sent to John Doe',
          timestamp: '2024-06-25T10:30:00Z'
        },
        {
          id: 'act_002',
          type: 'campaign_started',
          description: 'Summer Sale campaign started',
          timestamp: '2024-06-25T09:15:00Z'
        },
        {
          id: 'act_003',
          type: 'template_approved',
          description: 'Welcome template approved',
          timestamp: '2024-06-25T08:45:00Z'
        }
      ]
    })
  },

  async getConversations(params?: any): Promise<ApiResponse<{ conversations: WhatsAppConversation[], pagination: any }>> {
    await mockDelay(600)
    return createMockApiResponse({
      conversations: [
        {
          id: 'conv_001',
          contact_id: 'contact_001',
          contact_name: 'John Doe',
          contact_phone: '+1234567890',
          last_message: 'Hey! I\'m interested in your service',
          last_message_timestamp: '2024-06-25T10:30:00Z',
          status: 'active' as const,
          unread_count: 2,
          agent_id: 'agent_001'
        },
        {
          id: 'conv_002',
          contact_id: 'contact_002',
          contact_name: 'Jane Smith',
          contact_phone: '+1234567891',
          last_message: 'Thanks for the information',
          last_message_timestamp: '2024-06-25T10:25:00Z',
          status: 'active' as const,
          unread_count: 0,
          agent_id: 'agent_001'
        },
        {
          id: 'conv_003',
          contact_id: 'contact_003',
          contact_name: 'Mike Johnson',
          contact_phone: '+1234567892',
          last_message: 'Not interested right now',
          last_message_timestamp: '2024-06-25T09:15:00Z',
          status: 'closed' as const,
          unread_count: 0
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 45,
        pages: 3
      }
    })
  },

  async getConversationMessages(conversationId: string, params?: any): Promise<ApiResponse<{ messages: WhatsAppMessage[], pagination: any }>> {
    await mockDelay(500)
    return createMockApiResponse({
      messages: [
        {
          id: 'msg_001',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'Hey! I\'m interested in your service',
          sender_type: 'contact' as const,
          sender_id: 'contact_001',
          timestamp: '2024-06-25T10:30:00Z',
          status: 'delivered' as const,
          metadata: {}
        },
        {
          id: 'msg_002',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'Hi John! Thanks for reaching out.',
          sender_type: 'agent' as const,
          sender_id: 'agent_001',
          timestamp: '2024-06-25T10:31:00Z',
          status: 'read' as const,
          metadata: {}
        },
        {
          id: 'msg_003',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'Can you tell me more about pricing?',
          sender_type: 'contact' as const,
          sender_id: 'contact_001',
          timestamp: '2024-06-25T10:32:00Z',
          status: 'delivered' as const,
          metadata: {}
        },
        {
          id: 'msg_004',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'I have quite a few pricing options to discuss. Would you like me to call you? It might be easier to explain over the phone.',
          sender_type: 'agent' as const,
          sender_id: 'agent_001',
          timestamp: '2024-06-25T10:33:00Z',
          status: 'read' as const,
          metadata: { suggested_handoff: true }
        },
        {
          id: 'msg_005',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'Yes, please call me at +1234567890',
          sender_type: 'contact' as const,
          sender_id: 'contact_001',
          timestamp: '2024-06-25T10:34:00Z',
          status: 'delivered' as const,
          metadata: {}
        },
        {
          id: 'msg_006',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: '📞 Voice call initiated - 5 min discussion about pricing plans',
          sender_type: 'system' as const,
          sender_id: 'system',
          timestamp: '2024-06-25T10:35:00Z',
          status: 'delivered' as const,
          metadata: { call_duration: 300, call_outcome: 'successful' }
        },
        {
          id: 'msg_007',
          conversation_id: conversationId,
          message_type: 'text' as const,
          content: 'Thanks for the call! Here\'s a summary: You\'re interested in our Pro plan ($99/month) with the healthcare add-on. I\'ll send you the proposal via email. Any questions?',
          sender_type: 'agent' as const,
          sender_id: 'agent_001',
          timestamp: '2024-06-25T10:41:00Z',
          status: 'read' as const,
          metadata: { post_call_summary: true }
        }
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 15,
        pages: 1
      }
    })
  },

  async sendMessage(conversationId: string, data: any): Promise<ApiResponse<{ message_id: string, status: string, timestamp: string }>> {
    await mockDelay(400)
    return createMockApiResponse({
      message_id: `msg_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    })
  },

  async getTemplates(params?: any): Promise<ApiResponse<{ templates: WhatsAppTemplate[], pagination: any }>> {
    await mockDelay(500)
    return createMockApiResponse({
      templates: [
        {
          id: 'template_001',
          name: 'Welcome Message',
          category: 'welcome' as const,
          content: 'Hi {{name}}! Welcome to our service. We\'re excited to help you with your {{service_type}} needs.',
          variables: ['name', 'service_type'],
          status: 'approved' as const,
          usage_count: 1234,
          created_at: '2024-06-01T10:00:00Z',
          updated_at: '2024-06-15T14:30:00Z'
        },
        {
          id: 'template_002',
          name: 'Follow-up Reminder',
          category: 'follow-up' as const,
          content: 'Hey {{name}}, just checking if you have any questions about our {{product}} offering?',
          variables: ['name', 'product'],
          status: 'pending' as const,
          usage_count: 567,
          created_at: '2024-06-10T10:00:00Z',
          updated_at: '2024-06-20T14:30:00Z'
        },
        {
          id: 'template_003',
          name: 'Promotional Offer',
          category: 'promotional' as const,
          content: 'Special offer for {{name}}! Get {{discount}}% off on {{product}}. Limited time only!',
          variables: ['name', 'discount', 'product'],
          status: 'rejected' as const,
          usage_count: 0,
          created_at: '2024-06-05T10:00:00Z',
          updated_at: '2024-06-15T14:30:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 12,
        pages: 1
      }
    })
  },

  async createTemplate(data: any): Promise<ApiResponse<{ template_id: string, status: string }>> {
    await mockDelay(600)
    return createMockApiResponse({
      template_id: `template_${Date.now()}`,
      status: 'pending_approval'
    })
  },

  async updateTemplate(templateId: string, data: any): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(500)
    return createMockApiResponse({ success: true })
  },

  async deleteTemplate(templateId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(400)
    return createMockApiResponse({ success: true })
  },

  async getCampaigns(params?: any): Promise<ApiResponse<{ campaigns: WhatsAppCampaign[], pagination: any }>> {
    await mockDelay(700)
    return createMockApiResponse({
      campaigns: [
        {
          id: 'campaign_001',
          name: 'Summer Sale 2024',
          template_id: 'template_003',
          status: 'active' as const,
          target_contacts: 3000,
          messages_sent: 2450,
          messages_delivered: 2411,
          messages_opened: 1840,
          messages_clicked: 320,
          start_date: '2024-06-20T09:00:00Z',
          end_date: '2024-06-30T23:59:59Z',
          created_at: '2024-06-19T15:00:00Z'
        },
        {
          id: 'campaign_002',
          name: 'Product Launch Announcement',
          template_id: 'template_001',
          status: 'active' as const,
          target_contacts: 1500,
          messages_sent: 1200,
          messages_delivered: 1188,
          messages_opened: 980,
          messages_clicked: 180,
          start_date: '2024-06-22T09:00:00Z',
          end_date: '2024-06-25T23:59:59Z',
          created_at: '2024-06-21T15:00:00Z'
        },
        {
          id: 'campaign_003',
          name: 'Weekend Special',
          template_id: 'template_002',
          status: 'scheduled' as const,
          target_contacts: 1800,
          messages_sent: 0,
          messages_delivered: 0,
          messages_opened: 0,
          messages_clicked: 0,
          start_date: '2024-06-28T10:00:00Z',
          end_date: '2024-06-30T23:59:59Z',
          created_at: '2024-06-25T15:00:00Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 25,
        pages: 2
      }
    })
  },

  async createCampaign(data: any): Promise<ApiResponse<{ campaign_id: string, status: string, estimated_reach: number }>> {
    await mockDelay(800)
    return createMockApiResponse({
      campaign_id: `campaign_${Date.now()}`,
      status: 'scheduled',
      estimated_reach: 1800
    })
  },

  async updateCampaign(campaignId: string, data: any): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(500)
    return createMockApiResponse({ success: true })
  },

  async pauseCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(400)
    return createMockApiResponse({ success: true })
  },

  async resumeCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(400)
    return createMockApiResponse({ success: true })
  },

  async cancelCampaign(campaignId: string): Promise<ApiResponse<{ success: boolean }>> {
    await mockDelay(400)
    return createMockApiResponse({ success: true })
  },

  async getAnalyticsOverview(params?: any): Promise<ApiResponse<WhatsAppAnalytics & { daily_volume: any[] }>> {
    await mockDelay(900)
    return createMockApiResponse({
      messages_sent: 15234,
      delivery_rate: 98.5,
      open_rate: 75.2,
      response_rate: 23.4,
      opt_out_rate: 1.2,
      trends: {
        messages_sent_change: 12.3,
        delivery_rate_change: 0.8,
        open_rate_change: 2.1,
        response_rate_change: 5.7
      },
      daily_volume: [
        { date: '2024-06-01', sent: 450, delivered: 443, opened: 340 },
        { date: '2024-06-02', sent: 520, delivered: 512, opened: 395 },
        { date: '2024-06-03', sent: 480, delivered: 472, opened: 360 },
        { date: '2024-06-04', sent: 620, delivered: 610, opened: 465 },
        { date: '2024-06-05', sent: 580, delivered: 570, opened: 430 },
        { date: '2024-06-06', sent: 550, delivered: 541, opened: 415 },
        { date: '2024-06-07', sent: 490, delivered: 483, opened: 370 }
      ]
    })
  },

  async getCampaignAnalytics(campaignId: string): Promise<ApiResponse<any>> {
    await mockDelay(600)
    return createMockApiResponse({
      campaign_id: campaignId,
      performance: {
        sent: 2450,
        delivered: 2411,
        opened: 1840,
        clicked: 320,
        conversion_rate: 13.1
      },
      timeline: [
        { date: '2024-06-20', sent: 400, delivered: 395, opened: 300 },
        { date: '2024-06-21', sent: 450, delivered: 443, opened: 340 },
        { date: '2024-06-22', sent: 500, delivered: 492, opened: 380 },
        { date: '2024-06-23', sent: 520, delivered: 512, opened: 395 },
        { date: '2024-06-24', sent: 580, delivered: 569, opened: 425 }
      ]
    })
  },

  async exportAnalytics(params?: any): Promise<Blob> {
    await mockDelay(1200)
    const csvContent = 'Date,Messages Sent,Delivered,Opened,Clicked\n2024-06-01,450,443,340,65\n2024-06-02,520,512,395,78'
    return new Blob([csvContent], { type: 'text/csv' })
  },

  async getContacts(params?: any): Promise<ApiResponse<{ contacts: WhatsAppContact[], pagination: any }>> {
    await mockDelay(600)
    return createMockApiResponse({
      contacts: [
        {
          id: 'contact_001',
          phone: '+1234567890',
          name: 'John Doe',
          opt_in_status: true,
          opt_in_date: '2024-06-01T10:00:00Z',
          last_interaction: '2024-06-25T10:30:00Z',
          tags: ['vip', 'interested'],
          custom_fields: {
            company: 'Tech Corp',
            interest_level: 'high'
          }
        },
        {
          id: 'contact_002',
          phone: '+1234567891',
          name: 'Jane Smith',
          opt_in_status: true,
          opt_in_date: '2024-06-02T10:00:00Z',
          last_interaction: '2024-06-25T10:25:00Z',
          tags: ['lead', 'warm'],
          custom_fields: {
            company: 'Design Studio',
            interest_level: 'medium'
          }
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 834,
        pages: 42
      }
    })
  }
}