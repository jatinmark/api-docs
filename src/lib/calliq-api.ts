// CallIQ API Client

import { logger } from '@/lib/logger';
import { 
  CallIQCall, 
  CallIQListResponse, 
  CallIQFilters, 
  CallIQStats,
  CallIQInsightsResponse,
  CallIQInsight,
  UploadRequest,
  UploadProgress,
  BulkUploadRequest,
  CSVUploadResponse,
  BulkStatusResponse,
  SimilarCall,
  CallPattern,
  RepPerformance,
  ThreeKillerInsights,
  CallScore,
  TeamScoreAnalytics,
  RepScoreComparison
} from '@/types/calliq';
import { AuthStorage } from './auth-storage';
import { retry } from './retry-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Roleplay scoring types
interface ScoreData {
  overall_score: number;
  strengths: string[];
  areas_for_improvement: string[];
  feedback_summary: string;
}

interface ReportData {
  audio_link: string;
  score_data: ScoreData;
}

interface ScoreRequestData {
  call_id: string;
  user_role: string;
  session_id: string;
}

class CallIQAPI {
  private requestCache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();
  private readonly CACHE_DURATION = 5000; // 5 seconds cache for dashboard data
  private pendingRequests = new Map<string, Promise<any>>();

  // Clear cache to prevent navigation conflicts
  clearCache() {
    this.requestCache.clear();
    this.pendingRequests.clear();
  }

  
  // Request deduplication and caching
  private async getCachedOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.requestCache.get(cacheKey);
    
    // Return cached data if valid
    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    
    // Return pending request if already in progress
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }
    
    // Create new request
    const promise = fetchFn().then(data => {
      this.requestCache.set(cacheKey, { data, timestamp: now });
      this.pendingRequests.delete(cacheKey);
      return data;
    }).catch(error => {
      this.pendingRequests.delete(cacheKey);
      throw error;
    });
    
    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  private getHeaders(): HeadersInit {
    const tokens = AuthStorage.getTokens();
    return {
      'Content-Type': 'application/json',
      ...(tokens && { 'Authorization': `Bearer ${tokens.access_token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    
    if (!response.ok) {
      // Handle payment required (demo limit reached)
      if (response.status === 402) {
        const errorData = await response.json().catch(() => ({ detail: 'Demo limit reached' }));
        
        // Include the status code in the error message so the UI can detect it
        const message = errorData.detail || 'Demo limit reached. Please upgrade your account.';
        throw new Error(`402: ${message}`);
      }
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {

        // Check if we have tokens
        const headers = this.getHeaders() as Record<string, string>;

        if (response.status === 401) {
          // Check if tokens might be temporarily invalid (e.g., during server restart)
          // Don't immediately fail - could be a transient issue
          const errorData = await response.json().catch(() => ({ detail: 'Authentication error' }));

          // Only throw hard auth error if the backend explicitly says token is invalid/expired
          if (errorData.detail && (
            errorData.detail.includes('expired') ||
            errorData.detail.includes('invalid') ||
            errorData.detail.includes('Could not validate')
          )) {
            throw new Error('Session expired. Please log in again.');
          }

          // For other 401s, treat as temporary issue
          throw new Error('Temporary authentication issue. Please refresh the page.');
        }

        // For 403, this might be a temporary issue during processing
        // Don't immediately assume access is permanently denied
        const errorData = await response.json().catch(() => ({ detail: 'Access denied' }));

        // If it's a company-related error, be more specific
        if (errorData.detail && errorData.detail.includes('company')) {
          throw new Error('Company setup required. Please complete your profile.');
        }

        // For processing-related 403s, provide a softer error message
        if (errorData.detail && (errorData.detail.includes('processing') || errorData.detail.includes('busy'))) {
          throw new Error('System busy processing. Please wait a moment and try again.');
        }

        // Generic 403 - be more helpful than "Access denied"
        throw new Error('Unable to load data. Please try refreshing the page.');
      }
      
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      
      // Log technical errors to console but show user-friendly messages
      if (error.detail && (error.detail.includes('psycopg2') || error.detail.includes('SQL'))) {
        throw new Error('A database error occurred. Please try again.');
      }
      
      // Clean up error messages for users
      let userMessage = error.detail || 'Request failed';
      if (userMessage.includes('UUID')) {
        userMessage = 'Invalid request. Please refresh and try again.';
      }
      
      throw new Error(userMessage);
    }
    return response.json();
  }

  // Dashboard Stats with caching and deduplication
  async getStats(dateRange?: { start: string; end: string }): Promise<CallIQStats> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const cacheKey = `stats_${params.toString()}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const url = `${API_BASE_URL}/calliq/stats?${params}`;
      
      return retry(async () => {
        const response = await fetch(url, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000) // 30 second timeout for processing states
        });
        return this.handleResponse<CallIQStats>(response);
      }, {
        maxAttempts: 3,
        initialDelay: 1000,
        shouldRetry: (error: any) => {
          // Don't retry on explicit session expiration
          if (error.message?.includes('Session expired')) {
            return false;
          }
          // Don't retry on 403 errors
          if (error.message?.includes('403') || error.message?.includes('Company setup required')) {
            return false;
          }
          // DO retry on temporary auth issues (might be server restart or network glitch)
          if (error.message?.includes('Temporary authentication issue')) {
            return true;
          }
          return true;
        }
      });
    });
  }

  // Calls List with caching and timeout
  async getCalls(filters?: CallIQFilters, page = 1, pageSize = 20): Promise<CallIQListResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());

    if (filters) {
      if (filters.date_range) {
        params.append('start_date', filters.date_range.start);
        params.append('end_date', filters.date_range.end);
      }
      if (filters.status?.length) {
        filters.status.forEach(s => params.append('status', s));
      }
      if (filters.reps?.length) {
        filters.reps.forEach(r => params.append('rep', r));
      }
      if (filters.outcomes?.length) {
        filters.outcomes.forEach(o => o && params.append('outcome', o));
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.sort_by) {
        params.append('sort_by', filters.sort_by);
        params.append('sort_order', filters.sort_order || 'desc');
      }
    }

    const cacheKey = `calls_${params.toString()}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      const url = `${API_BASE_URL}/calliq/calls?${params}`;
      
      return retry(async () => {
        try {
          const response = await fetch(url, {
            headers: this.getHeaders(),
            signal: AbortSignal.timeout(30000) // 30 second timeout for processing states
          });
          return this.handleResponse<CallIQListResponse>(response);
        } catch (error) {
          logger.error('CallIQ API - Network error in getCalls', error);
          throw error;
        }
      }, {
        maxAttempts: 3,
        initialDelay: 1000,
        shouldRetry: (error: any) => {
          // Don't retry on explicit session expiration
          if (error.message?.includes('Session expired')) {
            return false;
          }
          // Don't retry on 403 errors
          if (error.message?.includes('403') || error.message?.includes('Company setup required')) {
            return false;
          }
          // DO retry on temporary auth issues (might be server restart or network glitch)
          if (error.message?.includes('Temporary authentication issue')) {
            return true;
          }
          return true;
        }
      });
    });
  }

  // Get Single Call
  async getCall(callId: string, bypassCache = false): Promise<CallIQCall> {
    // Clear cache if bypassing
    if (bypassCache) {
      this.clearCache();
    }
    
    return retry(async () => {
      const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(30000)
      });
      return this.handleResponse<CallIQCall>(response);
    }, {
      maxAttempts: 3,
      initialDelay: 1000,
      shouldRetry: (error: any) => {
        // Don't retry auth errors
        if (error.message?.includes('401') || error.message?.includes('403')) {
          return false;
        }
        return true;
      }
    });
  }

  // Get Call Status (for polling during upload)
  async getCallStatus(callId: string): Promise<any> {
    return retry(async () => {
      const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/status`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000)
      });
      return this.handleResponse(response);
    }, {
      maxAttempts: 2, // Lighter retry for polling
      initialDelay: 500,
      shouldRetry: (error: any) => {
        // Don't retry auth errors
        if (error.message?.includes('401') || error.message?.includes('403')) {
          return false;
        }
        return true;
      }
    });
  }

  // Upload Audio File (using presigned URLs for all file sizes)
  async uploadAudio(
    request: UploadRequest, 
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<CallIQCall> {
    if (!request.file) {
      throw new Error('No file provided');
    }

    // File size validation
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    if (request.file.size > MAX_FILE_SIZE) {
      throw new Error('File too large. Maximum size: 100MB');
    }

    if (request.file.size === 0) {
      throw new Error('File is empty');
    }

    // Use presigned URL flow for all files
    return this.uploadWithPresignedUrl(request, onProgress, abortSignal);
  }

  // Presigned URL upload (for all file sizes)
  private async uploadWithPresignedUrl(
    request: UploadRequest,
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<CallIQCall> {
    if (!request.file) {
      throw new Error('No file provided');
    }

    const tokens = AuthStorage.getTokens();
    if (!tokens?.access_token) {
      throw new Error('No authentication token available');
    }

    try { 
      // Phase 1: Get presigned URL (5% progress)
      onProgress?.({
        status: 'uploading',
        progress: 5,
        message: 'Preparing secure upload...'
      });

      if (abortSignal?.aborted) {
        throw new Error('Upload aborted');
      }

      // Build query parameters for the unified upload endpoint
      const params = new URLSearchParams({
        filename: request.file.name,
        file_size: request.file.size.toString(),
        content_type: request.file.type
      });

      // Add metadata parameters if provided
      if (request.title) params.append('title', request.title);
      if (request.metadata?.rep_name) params.append('rep_name', request.metadata.rep_name);
      if (request.metadata?.customer_name) params.append('customer_name', request.metadata.customer_name);
      if (request.metadata?.call_success !== undefined) {
        params.append('success_call', request.metadata.call_success ? 'success' : 'failed');
      }

      const urlResponse = await fetch(
        `${API_BASE_URL}/calliq/upload/audio?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
          signal: abortSignal
        }
      );

      if (!urlResponse.ok) {
        const error = await urlResponse.json();
        throw new Error(error.detail || 'Failed to get upload URL');
      }

      const { data: urlData } = await urlResponse.json();

      // Phase 2: Upload directly to GCS (5% - 55% progress)
      onProgress?.({
        status: 'uploading',
        progress: 10,
        message: 'Starting upload to secure cloud storage...'
      });

      if (abortSignal?.aborted) {
        throw new Error('Upload aborted');
      }

      // Use XMLHttpRequest for progress tracking on the GCS upload
      const uploadResult = await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            xhr.abort();
            reject(new Error('Upload aborted'));
          });
        }

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            // Map upload progress to 10-55% range (45% total for upload)
            const uploadPercentage = (e.loaded / e.total) * 100;
            const mappedProgress = Math.round((uploadPercentage / 100) * 45) + 10; // 10% to 55%
            onProgress?.({
              status: 'uploading',
              progress: mappedProgress,
              message: `Uploading to cloud storage... ${Math.round(uploadPercentage)}%`
            });
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200 || xhr.status === 201) {
            resolve();
          } else {
            reject(new Error('Failed to upload file to storage'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Failed to upload file to storage'));
        });

        xhr.open('PUT', urlData.presigned_upload_url);
        xhr.setRequestHeader('Content-Type', urlData.content_type);
        xhr.send(request.file);
      });

      // Phase 3: Confirm upload and start processing (55% - 60% progress)
      onProgress?.({
        status: 'uploading',
        progress: 58,
        message: 'Finalizing upload and starting analysis...'
      });

      if (abortSignal?.aborted) {
        throw new Error('Upload aborted');
      }

      const confirmFormData = new FormData();
      if (request.title) {
        confirmFormData.append('title', request.title);
      }
      if (request.metadata) {
        confirmFormData.append('metadata', JSON.stringify(request.metadata));
      }
      // Pass the original filename from the presigned URL response
      if (urlData.original_filename) {
        confirmFormData.append('original_filename', urlData.original_filename);
      }

      const confirmResponse = await fetch(
        `${API_BASE_URL}/calliq/upload/confirm?file_id=${urlData.file_id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
          body: confirmFormData,
          signal: abortSignal
        }
      );

      if (!confirmResponse.ok) {
        const error = await confirmResponse.json();
        throw new Error(error.detail || 'Failed to confirm upload');
      }

      const confirmResult = await confirmResponse.json();

      // Phase 4: Processing starts (60%+ progress)
      onProgress?.({
        status: 'processing',
        progress: 60,
        message: 'Upload complete! Starting transcription...'
      });

      // Get call ID from confirm response
      const callId = confirmResult.data?.call_id || confirmResult.call_id || confirmResult.id;
      if (!callId) {
        throw new Error('No call ID returned from upload confirmation');
      }

      // Immediately notify with the call ID and uploaded status
      onProgress?.({
        status: 'processing',
        progress: 60,
        message: 'Upload complete! Starting transcription...',
        result: { id: callId, status: 'uploaded' } as any
      });

      // Poll for status updates with better progress mapping
      return new Promise((resolve, reject) => {
        this.pollCallStatus(callId, (call) => {
          const progressMap = {
            'uploaded': 60,       // Upload complete
            'transcribing': 80,   // Transcription phase (60% → 80%)
            'analyzing': 95,      // Analysis phase (80% → 95%) 
            'completed': 100,     // Complete
            'failed': 100
          };

          let frontendStatus: 'uploading' | 'processing' | 'completed' | 'failed' = 'processing';
          if (call.status === 'completed') frontendStatus = 'completed';
          else if (call.status === 'failed') frontendStatus = 'failed';
          else frontendStatus = 'processing';

          let statusMessage = this.getStatusMessage(call.status);
          if (call.status === 'transcribing') {
            statusMessage = 'Converting speech to text...';
          } else if (call.status === 'analyzing') {
            statusMessage = 'Analyzing conversation and generating insights...';
          } else if (call.status === 'uploaded') {
            statusMessage = 'File uploaded, starting transcription...';
          }

          onProgress?.({
            status: frontendStatus,
            progress: progressMap[call.status] || 60,
            message: statusMessage,
            result: { ...call, id: call.id || callId },
            error: call.error_message
          });
        }, 60, 2000, abortSignal).then(resolve).catch(reject);
      });

    } catch (error) {
      // Handle errors and update progress
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      onProgress?.({
        status: 'failed',
        progress: 0,
        error: errorMessage
      });

      throw error;
    }
  }

  // Bulk Upload CSV
  async bulkUpload(request: BulkUploadRequest): Promise<CSVUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.csv_file);


    const tokens = AuthStorage.getTokens();
    if (!tokens?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/calliq/upload/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
      body: formData
    });
    return this.handleResponse<CSVUploadResponse>(response);
  }

  // Get Bulk Upload Status
  async getBulkStatus(jobId: string): Promise<BulkStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/bulk-status/${jobId}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<BulkStatusResponse>(response);
  }

  // Start monitoring bulk upload with polling
  async monitorBulkUpload(
    jobId: string,
    onUpdate: (status: BulkStatusResponse) => void,
    onComplete: (status: BulkStatusResponse) => void,
    intervalMs: number = 5000
  ): Promise<void> {
    const poll = async () => {
      try {
        const status = await this.getBulkStatus(jobId);
        onUpdate(status);
        
        // Check if all calls are finished (completed or failed)
        if (status.processing_calls === 0) {
          onComplete(status);
          return;
        }
        
        // Continue polling
        setTimeout(poll, intervalMs);
      } catch (error) {
        // Continue polling even on errors (might be temporary)
        setTimeout(poll, intervalMs);
      }
    };
    
    // Start polling
    poll();
  }

  // Get Call Insights
  async getInsights(callId: string): Promise<CallIQInsight[]> {
    return retry(async () => {
      const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/insights`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(30000)
      });
      return this.handleResponse<CallIQInsight[]>(response);
    }, {
      maxAttempts: 3,
      initialDelay: 1000,
      shouldRetry: (error: any) => {
        // Don't retry auth errors
        if (error.message?.includes('401') || error.message?.includes('403')) {
          return false;
        }
        return true;
      }
    });
  }

  // Get All Insights (across all calls) with caching
  async getAllInsights(page = 1, pageSize = 50): Promise<CallIQInsightsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('page_size', pageSize.toString());
    
    const cacheKey = `insights_${params.toString()}`;
    
    return this.getCachedOrFetch(cacheKey, async () => {
      return retry(async () => {
        const response = await fetch(`${API_BASE_URL}/calliq/insights?${params}`, {
          headers: this.getHeaders(),
          signal: AbortSignal.timeout(30000) // 30 second timeout for processing states
        });
        return this.handleResponse<CallIQInsightsResponse>(response);
      }, {
        maxAttempts: 3,
        initialDelay: 1000,
        shouldRetry: (error: any) => {
          // Don't retry on explicit session expiration
          if (error.message?.includes('Session expired')) {
            return false;
          }
          // Don't retry on 403 errors
          if (error.message?.includes('403') || error.message?.includes('Company setup required')) {
            return false;
          }
          // DO retry on temporary auth issues (might be server restart or network glitch)
          if (error.message?.includes('Temporary authentication issue')) {
            return true;
          }
          return true;
        }
      });
    });
  }

  // Get Similar Calls
  async getSimilarCalls(callId: string, limit = 5): Promise<SimilarCall[]> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/similar?limit=${limit}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<SimilarCall[]>(response);
  }

  // Get Patterns
  async getPatterns(callId: string): Promise<CallPattern[]> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/patterns`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<CallPattern[]>(response);
  }

  // Get Team Performance
  async getTeamPerformance(dateRange?: { start: string; end: string }): Promise<RepPerformance[]> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const response = await fetch(`${API_BASE_URL}/calliq/team/performance?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<RepPerformance[]>(response);
  }

  // Delete Call
  async deleteCall(callId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      throw new Error('Failed to delete call');
    }
  }

  // Bulk Delete
  async bulkDelete(callIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/bulk-delete`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ call_ids: callIds })
    });
    if (!response.ok) {
      throw new Error('Failed to delete calls');
    }
  }

  // Export Calls
  async exportCalls(callIds: string[], format: 'csv' | 'pdf' = 'csv'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/calliq/export`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ call_ids: callIds, format })
    });
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    return response.blob();
  }

  // Get Recording URL (with signed URL from GCS)
  async getRecordingUrl(callId: string): Promise<{ url: string; expires_in: number }> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/recording-url`, {
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Re-analyze Call
  async reanalyzeCall(callId: string): Promise<{ message: string; call_id: string }> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/reanalyze`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return this.handleResponse(response);
  }

  // Get Three Killer Insights for a specific call
  async getThreeKillerInsights(callId: string): Promise<ThreeKillerInsights> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/three-killer`, {
      headers: this.getHeaders()
    });
    const data = await this.handleResponse<{ three_killer_insights: ThreeKillerInsights }>(response);
    return data.three_killer_insights;
  }

  // Get Three Killer Insights for multiple calls
  async getBulkThreeKillerInsights(callIds: string[]): Promise<Record<string, ThreeKillerInsights>> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/three-killer/bulk`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ call_ids: callIds })
    });
    return this.handleResponse(response);
  }

  // Get Call Score
  async getCallScore(callId: string): Promise<CallScore> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/score`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<CallScore>(response);
  }
  

  // Get and save Improvement Report for a specific call
  async getImprovementReport(callId: string, forceRegenerate: boolean = false, companyInfo: string = ''): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/improvement-report`, {
      method: 'POST', // Changed to POST
      //headers: this.getHeaders()
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json', // Ensure the content type is set for JSON body
      },
      // Pass the forceRegenerate flag in the body of the POST request
      body: JSON.stringify({
        force_regenerate: forceRegenerate,
        company_info: companyInfo,
      }),
    });
    return this.handleResponse(response);
  }

  // Get list of company info from database
  async getCompanyInfoList(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/calliq/company-info`, {
      headers: this.getHeaders()
    });
    const data = await this.handleResponse<{ company_info_list: string[] }>(response);
    console.log('[API] getCompanyInfoList raw response:', data);
    console.log('[API] company_info_list value:', data.company_info_list);
    return data.company_info_list || [];
  }



  // Get Call Scores for multiple calls
  async getBulkCallScores(callIds: string[]): Promise<Record<string, CallScore>> {
    const response = await fetch(`${API_BASE_URL}/calliq/calls/scores/bulk`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ call_ids: callIds })
    });
    return this.handleResponse<Record<string, CallScore>>(response);
  }

  // Get Team Score Analytics
  async getTeamScoreAnalytics(dateRange?: { start: string; end: string }): Promise<TeamScoreAnalytics> {
    const params = new URLSearchParams();
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const response = await fetch(`${API_BASE_URL}/calliq/team/score-analytics?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<TeamScoreAnalytics>(response);
  }

  // Get Rep Score Comparison
  async getRepScoreComparison(repId?: string, dateRange?: { start: string; end: string }): Promise<RepScoreComparison[]> {
    const params = new URLSearchParams();
    if (repId) params.append('rep_id', repId);
    if (dateRange) {
      params.append('start_date', dateRange.start);
      params.append('end_date', dateRange.end);
    }

    const response = await fetch(`${API_BASE_URL}/calliq/reps/score-comparison?${params}`, {
      headers: this.getHeaders()
    });
    return this.handleResponse<RepScoreComparison[]>(response);
  }

  // // Start Role-play Session
  // async getRoleplaySession(callId: string): Promise<{ websocket_url: string }> {
  //   const response = await fetch(`${API_BASE_URL}/calliq/calls/${callId}/roleplay-session`, {
  //     method: 'POST',
  //     headers: this.getHeaders()
  //   });
  //   return this.handleResponse<{ websocket_url: string }>(response);
  // }

  

  // Start Role-play Session
  async getRoleplaySession(
    // MODIFIED: Added userRole parameter to the function signature.
    callId: string,
    userRole: 'agent' | 'customer'
  ): Promise<{ websocket_url: string }> {

    // MODIFIED: The userRole is now appended to the URL as a query parameter.
    const url = `${API_BASE_URL}/calliq/calls/${callId}/roleplay-session?user_role=${userRole}`;
    
    // Adding a log to help you debug in the browser's console
    console.log(`[API Call] Requesting role-play session from: ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders()
    });

    return this.handleResponse<{ websocket_url: string }>(response);
  }

  

  // Add the new function here
  async scoreRoleplay(
    requestData: ScoreRequestData
  ): Promise<ReportData> {
    const url = `${API_BASE_URL}/calliq/roleplay/score`;
    console.log(`[API Call] Requesting score from: ${url}`);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestData)
    });
    return this.handleResponse<ReportData>(response);
  }

  // Helper: Poll call status (with cancellation support)
  private async pollCallStatus(
    callId: string, 
    onUpdate: (call: CallIQCall) => void,
    maxAttempts = 60,
    interval = 2000,
    abortSignal?: AbortSignal
  ): Promise<CallIQCall> {
    let attempts = 0;
    let timeoutId: NodeJS.Timeout | null = null;
    
    return new Promise((resolve, reject) => {
      // Check if already aborted
      if (abortSignal?.aborted) {
        reject(new Error('Polling aborted'));
        return;
      }
      
      // Listen for abort signal
      const abortHandler = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(new Error('Polling aborted'));
      };
      
      if (abortSignal) {
        abortSignal.addEventListener('abort', abortHandler);
      }
      
      const cleanup = () => {
        if (abortSignal) {
          abortSignal.removeEventListener('abort', abortHandler);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };
      
      const poll = async () => {
        // Check if aborted before making request
        if (abortSignal?.aborted) {
          cleanup();
          return;
        }
        
        try {
          const call = await this.getCallStatus(callId);
          onUpdate(call);
          
          if (call.status === 'completed' || call.status === 'failed') {
            cleanup();
            resolve(call);
          } else if (attempts >= maxAttempts) {
            cleanup();
            reject(new Error('Processing timeout'));
          } else {
            attempts++;
            // Store timeout ID so it can be cancelled
            timeoutId = setTimeout(poll, interval);
          }
        } catch (error) {
          // Handle specific error types more gracefully
          if (error instanceof Error) {
            // If it's a temporary auth error during polling, be more tolerant
            if (error.message.includes('Temporary authentication issue') ||
                error.message.includes('Unable to load data') ||
                error.message.includes('System busy')) {
              // Continue polling with exponential backoff for temporary errors
              if (attempts < maxAttempts) {
                attempts++;
                const backoffDelay = Math.min(interval * Math.pow(1.5, attempts), 10000); // Max 10s delay
                timeoutId = setTimeout(poll, backoffDelay);
                return;
              }
            }

            // For hard auth failures, stop polling immediately
            if (error.message.includes('Session expired')) {
              cleanup();
              reject(new Error('Session expired. Please log in again.'));
              return;
            }
            
            // If we get a 404, the call might not be created yet, keep trying
            if (error.message.includes('not found')) {
              if (attempts < 5) {
                // Try a few more times for new calls
                attempts++;
                timeoutId = setTimeout(poll, interval);
                return;
              }
            }
          }
          
          // For other errors after multiple attempts, give up
          cleanup();
          const userError = error instanceof Error ? error.message : 'Unable to check processing status';
          reject(new Error(userError));
        }
      };
      
      poll();
    });
  }

  // Helper: Get status message
  private getStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      'uploaded': 'File uploaded successfully',
      'transcribing': 'Transcribing audio...',
      'analyzing': 'Analyzing conversation...',
      'completed': 'Processing complete!',
      'failed': 'Processing failed'
    };
    return messages[status] || 'Processing...';
  }
}

export const calliqAPI = new CallIQAPI();