import { logger } from './logger'

// File validation constants
const MAX_FILES = 6
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB in bytes
const ACCEPTED_FORMATS = [
  'mp3', 'wav', 'm4a', 'ogg', 'webm', 'aac', 'flac',
  'mp4', 'mpeg', 'opus', 'wma', 'amr', '3gp'
]

export interface TranscriptionResult {
  filename: string
  status: 'success' | 'failed'
  transcript?: {
    text: string
    segments: Array<{
      speaker: string
      text: string
      start: number
      end: number
    }>
    speaker_count: number
    duration: number
    language: string
    confidence: number
    words_count: number
  }
  error?: string
  processing_time: number
}

export interface TranscriptionResponse {
  status: string
  message: string
  data: {
    transcriptions: TranscriptionResult[]
    processing_time: number
    total_files: number
    successful: number
    failed: number
    demo_status?: {
      calls_remaining: number
      calls_limit: number
    }
  }
}

export class TranscriptionAPI {
  static validateFiles(files: FileList): { valid: boolean; error?: string } {
    // Check file count
    if (files.length === 0) {
      return { valid: false, error: 'Please select at least one audio file' }
    }

    if (files.length > MAX_FILES) {
      return { valid: false, error: `Maximum ${MAX_FILES} files allowed` }
    }

    // Validate each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File "${file.name}" exceeds 100MB limit`
        }
      }

      // Check file format
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !ACCEPTED_FORMATS.includes(extension)) {
        return {
          valid: false,
          error: `File "${file.name}" has unsupported format. Accepted: ${ACCEPTED_FORMATS.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  static async transcribeFiles(
    files: FileList,
    accessToken: string,
    onProgress?: (message: string, percentage: number) => void
  ): Promise<TranscriptionResponse> {
    try {
      // Validate files first
      const validation = this.validateFiles(files)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Create FormData
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      // Update progress
      if (onProgress) {
        onProgress('Uploading audio files...', 10)
      }

      // Get API URL from environment or use default
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const endpoint = `${apiUrl}/calliq/upload/multi-transcribe`

      logger.info(`Uploading ${files.length} file(s) for transcription`)

      // Send request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
          // Do NOT set Content-Type - let browser set it with boundary
        },
        body: formData
      })

      // Update progress
      if (onProgress) {
        onProgress('Processing transcription...', 50)
      }

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.detail || errorData?.message || `Transcription failed (${response.status})`

        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to use this feature')
        } else if (response.status === 400) {
          throw new Error(errorMessage)
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.')
        } else {
          throw new Error(errorMessage)
        }
      }

      const data: TranscriptionResponse = await response.json()

      // Update progress
      if (onProgress) {
        onProgress('Transcription complete!', 100)
      }

      logger.info(`Transcription successful: ${data.data.successful}/${data.data.total_files} files`)

      return data

    } catch (error) {
      logger.error('Transcription error:', error)
      throw error instanceof Error ? error : new Error('Failed to transcribe audio')
    }
  }

  static formatTranscriptionForPrompt(transcriptions: TranscriptionResult[]): string {
    let formattedText = ''

    transcriptions.forEach((result, index) => {
      if (result.status === 'success' && result.transcript) {
        if (index > 0) formattedText += '\n\n---\n\n'

        // Only add the transcript text without file metadata
        formattedText += result.transcript.text

        // Optionally include speaker segments if available
        if (result.transcript.segments && result.transcript.segments.length > 0) {
          formattedText += '\n\nConversation Flow:\n'
          result.transcript.segments.forEach(segment => {
            formattedText += `${segment.speaker}: ${segment.text}\n`
          })
        }
      }
    })

    return formattedText
  }
}