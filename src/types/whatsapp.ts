export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  message_type: 'text' | 'image' | 'document' | 'template';
  content: string;
  sender_type: 'contact' | 'agent' | 'system';
  sender_id: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  metadata: Record<string, any>;
}

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_timestamp: string;
  status: 'active' | 'closed' | 'waiting';
  unread_count: number;
  agent_id?: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'welcome' | 'follow-up' | 'promotional' | 'support';
  content: string;
  variables: string[];
  status: 'approved' | 'pending' | 'rejected';
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCampaign {
  id: string;
  name: string;
  template_id: string;
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  target_contacts: number;
  messages_sent: number;
  messages_delivered: number;
  messages_opened: number;
  messages_clicked: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  phone: string;
  name: string;
  opt_in_status: boolean;
  opt_in_date: string;
  last_interaction: string;
  tags: string[];
  custom_fields: Record<string, any>;
}

export interface WhatsAppAnalytics {
  messages_sent: number;
  delivery_rate: number;
  open_rate: number;
  response_rate: number;
  opt_out_rate: number;
  trends: {
    messages_sent_change: number;
    delivery_rate_change: number;
    open_rate_change: number;
    response_rate_change: number;
  };
}

export interface WhatsAppDashboardStats {
  messages_sent: number;
  active_contacts: number;
  templates_ready: number;
  campaigns_running: number;
  message_volume_7days: number[];
  recent_activity: {
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationMeta;
}