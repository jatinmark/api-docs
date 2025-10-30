/**
 * TypeScript types for Contact Submissions
 * Matches backend ContactSubmission model
 */

export type ContactSubmissionStatus = 'new' | 'contacted' | 'converted' | 'closed';
export type FormType = 'contact_modal' | 'contact_form' | 'demo_request' | 'pricing_inquiry';
export type CompanySize = 'small' | 'medium' | 'large';
export type InterestLevel = 'high' | 'medium' | 'low';

export interface ContactSubmission {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  company: string | null;
  company_size: CompanySize | null;
  message: string | null;
  industry: string | null;
  source_page: string;
  form_type: FormType;
  interest_level: InterestLevel;
  status: ContactSubmissionStatus;
  notes: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactSubmissionFilters {
  status?: ContactSubmissionStatus;
  start_date?: string;
  end_date?: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  submissions: ContactSubmission[];
}

export interface ContactSubmissionUpdate {
  status?: ContactSubmissionStatus;
  notes?: string;
}

export interface ContactSubmissionUpdateResponse {
  success: boolean;
  submission: ContactSubmission;
}
