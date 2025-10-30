/**
 * Shared constants for super admin support access feature
 */

export const STORAGE_KEYS = {
  SUPPORT_ACCESS_TOKEN: 'support_access_token',
  ORIGINAL_TOKEN: 'original_token',
  COMPANY_NAME: 'support_access_company_name',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];