/**
 * Utility function to process objections from both old and new API formats
 * Handles backward compatibility between array and object formats
 */

export interface ProcessedObjection {
  text: string;
  category: string;
}

/**
 * Process objections from both array (old) and object (new) formats
 * @param objections - Can be either an array of strings or an object with text:category pairs
 * @returns Array of processed objections with text and category
 */
export function processObjections(objections: any): ProcessedObjection[] {
  if (!objections) {
    return [];
  }

  // Handle array format (old API format)
  if (Array.isArray(objections)) {
    return objections.map(obj => ({
      text: typeof obj === 'string' ? obj : String(obj),
      category: 'other'
    }));
  }

  // Handle object/dictionary format (new API format)
  if (typeof objections === 'object' && objections !== null) {
    return Object.entries(objections).map(([text, category]) => ({
      text,
      category: typeof category === 'string' ? category : 'other'
    }));
  }

  return [];
}

/**
 * Get a display color class for objection categories
 * @param category - The category of the objection
 * @returns Tailwind CSS classes for the category
 */
export function getObjectionCategoryColor(category: string): string {
  switch (category) {
    case 'price_concerns':
      return 'bg-red-100 text-red-800';
    case 'timing_issues':
      return 'bg-orange-100 text-orange-800';
    case 'competitor_preference':
      return 'bg-purple-100 text-purple-800';
    case 'no_need':
      return 'bg-gray-100 text-gray-800';
    case 'decision_maker_unavailable':
      return 'bg-yellow-100 text-yellow-800';
    case 'already_have_solution':
      return 'bg-blue-100 text-blue-800';
    case 'technical_concerns':
      return 'bg-indigo-100 text-indigo-800';
    case 'other':
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Format category name for display
 * @param category - The raw category string
 * @returns Formatted category name
 */
export function formatObjectionCategory(category: string): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Check if objections exist in either format
 * @param objections - The objections data in any format
 * @returns True if objections exist
 */
export function hasObjections(objections: any): boolean {
  if (!objections) {
    return false;
  }

  if (Array.isArray(objections)) {
    return objections.length > 0;
  }

  if (typeof objections === 'object' && objections !== null) {
    return Object.keys(objections).length > 0;
  }

  return false;
}