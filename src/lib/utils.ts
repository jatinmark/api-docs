import clsx, { ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`
  }
  if (cleaned.length === 10) {
    return `+1${cleaned}`
  }
  return phone
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function formatDate(dateString: string, region?: string): string {
  // Parse the date string as UTC by adding 'Z' if not present
  const utcDateString = dateString.includes('Z') ? dateString : dateString + 'Z'
  const date = new Date(utcDateString)

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }

  // Simple region-based timezone
  if (region === 'indian') {
    options.timeZone = 'Asia/Kolkata'
  }
  // international uses browser timezone (no timeZone specified)

  return date.toLocaleDateString('en-US', options)
}

/**
 * Extract variables from text using {{variable}} syntax
 * @param text - The text to extract variables from
 * @returns Array of unique variable names found in the text
 */
export function extractVariables(text: string): string[] {
  if (!text) return []
  
  // Match {{variable}} pattern, allowing for nested objects like {{user.name}}
  const variableRegex = /\{\{([^}]+)\}\}/g
  const matches = text.match(variableRegex)
  
  if (!matches) return []
  
  // Extract variable names and remove duplicates
  const variables = matches
    .map(match => match.slice(2, -2).trim()) // Remove {{ and }}
    .filter(variable => variable.length > 0) // Filter out empty variables
    .filter((variable, index, array) => array.indexOf(variable) === index) // Remove duplicates
  
  return variables.sort() // Sort alphabetically for consistent display
}

/**
 * Extract variables from both prompt and welcome message
 * @param prompt - The agent prompt text
 * @param welcomeMessage - The welcome message text
 * @returns Array of unique variable names found in both texts
 */
export function extractCombinedVariables(prompt: string, welcomeMessage: string): string[] {
  const promptVariables = extractVariables(prompt)
  const welcomeVariables = extractVariables(welcomeMessage)
  
  // Combine and remove duplicates
  const allVariables = [...promptVariables, ...welcomeVariables]
  return allVariables.filter((variable, index, array) => array.indexOf(variable) === index).sort()
}

/**
 * Get timezone based on phone country code
 * @param phone - Phone number with country code
 * @returns Timezone string
 */
export function getTimezoneFromPhone(phone: string | undefined): string {
  if (!phone) return 'Asia/Kolkata' // default
  
  if (phone.startsWith('+1')) return 'America/New_York'
  if (phone.startsWith('+91')) return 'Asia/Kolkata'
  if (phone.startsWith('+44')) return 'Europe/London'
  
  return 'Asia/Kolkata' // default fallback
}