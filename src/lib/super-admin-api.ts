import { logger } from './logger';
import {
  ContactSubmissionResponse,
  ContactSubmissionUpdate,
  ContactSubmissionUpdateResponse
} from '@/types/contact-submission';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Common error handler for support access API responses
const handleApiError = async (
  response: Response,
  defaultMessage: string,
  specificHandlers?: Record<number, string | ((errorData: any) => string)>
): Promise<never> => {
  const errorData = await response.json().catch(() => null);

  if (specificHandlers && specificHandlers[response.status]) {
    const handler = specificHandlers[response.status];
    const message = typeof handler === 'function' ? handler(errorData) : handler;
    throw new Error(message);
  }

  throw new Error(errorData?.detail || defaultMessage);
};

export interface TokenGenerateResponse {
  success: boolean;
  access_token: string;
  token_type: string;
  company_name: string;
  company_id: string;
  admin_email: string;
  expires_in: number;
}

export const SuperAdminAPI = {
  /**
   * Generate JWT access token for company admin (direct access)
   * @param companyId - Company UUID
   * @param token - JWT access token
   * @returns JWT access token for the company admin
   */
  generateCompanyToken: async (
    companyId: string,
    token: string
  ): Promise<TokenGenerateResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/super-admin/generate-company-token`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ company_id: companyId }),
        }
      );

      if (!response.ok) {
        await handleApiError(response, 'Failed to generate company token', {
          404: (errorData: any) => errorData?.detail || `Company not found: ${companyId}`,
          403: 'Super admin access required'
        });
      }

      const data = await response.json();
      logger.debug('Successfully generated company access token');

      return data;
    } catch (error) {
      logger.error('Error generating company token:', error);
      throw error;
    }
  },

  /**
   * Fetch contact submissions with pagination and filtering
   * @param token - JWT access token
   * @param params - Query parameters for filtering and pagination
   * @returns Paginated contact submissions
   */
  fetchContactSubmissions: async (
    token: string,
    params: {
      page?: number;
      page_size?: number;
      status?: string;
      start_date?: string;
      end_date?: string;
      sort_by?: string;
      sort_order?: string;
    } = {}
  ): Promise<ContactSubmissionResponse> => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.page_size) queryParams.append('page_size', params.page_size.toString());
      if (params.status) queryParams.append('status', params.status);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/super-admin/contact-submissions${queryString ? `?${queryString}` : ''}`;

      logger.debug('Fetching contact submissions:', { url, params });

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        await handleApiError(response, 'Failed to fetch contact submissions', {
          403: 'Super admin access required',
          400: (errorData: any) => errorData?.detail || 'Invalid request parameters'
        });
      }

      const data = await response.json();
      logger.debug('Successfully fetched contact submissions:', { total: data.total });

      return data;
    } catch (error) {
      logger.error('Error fetching contact submissions:', error);
      throw error;
    }
  },

  /**
   * Update contact submission status and notes
   * @param id - Submission ID
   * @param updates - Fields to update (status and/or notes)
   * @param token - JWT access token
   * @returns Updated submission
   */
  updateContactSubmission: async (
    id: number,
    updates: ContactSubmissionUpdate,
    token: string
  ): Promise<ContactSubmissionUpdateResponse> => {
    try {
      logger.debug('Updating contact submission:', { id, updates });

      const response = await fetch(
        `${API_BASE_URL}/super-admin/contact-submissions/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        await handleApiError(response, 'Failed to update contact submission', {
          404: 'Contact submission not found',
          403: 'Super admin access required',
          400: (errorData: any) => errorData?.detail || 'Invalid update data'
        });
      }

      const data = await response.json();
      logger.debug('Successfully updated contact submission:', { id });

      return data;
    } catch (error) {
      logger.error('Error updating contact submission:', error);
      throw error;
    }
  }
};