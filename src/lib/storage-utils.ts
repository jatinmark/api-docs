/**
 * Storage Utilities
 * 
 * Non-blocking async wrappers for browser storage operations.
 * Prevents UI freezing from synchronous storage access.
 */

import { logger } from '@/lib/logger';

interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiry?: number;
}

class AsyncStorage {
  private memoryFallback: Map<string, string> = new Map();
  private useMemoryFallback = false;

  /**
   * Async wrapper for localStorage.getItem
   */
  async getItem<T = any>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      // Use setTimeout to make it async and non-blocking
      setTimeout(() => {
        try {
          if (this.useMemoryFallback) {
            const value = this.memoryFallback.get(key);
            resolve(value ? JSON.parse(value) : null);
            return;
          }

          const item = localStorage.getItem(key);
          if (!item) {
            resolve(null);
            return;
          }

          const parsed: StorageItem<T> = JSON.parse(item);
          
          // Check expiry if set
          if (parsed.expiry && Date.now() > parsed.expiry) {
            localStorage.removeItem(key);
            resolve(null);
            return;
          }

          resolve(parsed.value);
        } catch (error) {
          logger.error('Storage getItem error', error as Error, { key });
          resolve(null);
        }
      }, 0);
    });
  }

  /**
   * Async wrapper for localStorage.setItem
   */
  async setItem<T = any>(key: string, value: T, expiryMs?: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const item: StorageItem<T> = {
            value,
            timestamp: Date.now(),
            expiry: expiryMs ? Date.now() + expiryMs : undefined
          };

          const serialized = JSON.stringify(item);

          if (this.useMemoryFallback) {
            this.memoryFallback.set(key, serialized);
            resolve(true);
            return;
          }

          localStorage.setItem(key, serialized);
          resolve(true);
        } catch (error: any) {
          // Handle quota exceeded error
          if (error.name === 'QuotaExceededError') {
            logger.warn('Storage quota exceeded, falling back to memory', { key });
            this.useMemoryFallback = true;
            
            // Retry with memory fallback
            const item: StorageItem<T> = {
              value,
              timestamp: Date.now(),
              expiry: expiryMs ? Date.now() + expiryMs : undefined
            };
            this.memoryFallback.set(key, JSON.stringify(item));
            resolve(true);
          } else {
            logger.error('Storage setItem error', error, { key });
            resolve(false);
          }
        }
      }, 0);
    });
  }

  /**
   * Async wrapper for localStorage.removeItem
   */
  async removeItem(key: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (this.useMemoryFallback) {
            this.memoryFallback.delete(key);
          } else {
            localStorage.removeItem(key);
          }
        } catch (error) {
          logger.error('Storage removeItem error', error as Error, { key });
        }
        resolve();
      }, 0);
    });
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (this.useMemoryFallback) {
            this.memoryFallback.clear();
          } else {
            localStorage.clear();
          }
        } catch (error) {
          logger.error('Storage clear error', error as Error);
        }
        resolve();
      }, 0);
    });
  }

  /**
   * Get storage size info
   */
  async getStorageInfo(): Promise<{
    used: number;
    available: number;
    quota: number;
  }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          quota: estimate.quota || 0
        };
      } catch (error) {
        logger.error('Failed to get storage estimate', error as Error);
      }
    }

    // Fallback for browsers that don't support storage estimate
    return {
      used: 0,
      available: 0,
      quota: 0
    };
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Session storage async wrapper
class AsyncSessionStorage extends AsyncStorage {
  private sessionMemoryFallback: Map<string, string> = new Map();
  private useSessionMemoryFallback = false;

  async getItem<T = any>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (this.useSessionMemoryFallback) {
            const value = this.sessionMemoryFallback.get(key);
            resolve(value ? JSON.parse(value) : null);
            return;
          }

          const item = sessionStorage.getItem(key);
          if (!item) {
            resolve(null);
            return;
          }

          const parsed: StorageItem<T> = JSON.parse(item);
          
          if (parsed.expiry && Date.now() > parsed.expiry) {
            sessionStorage.removeItem(key);
            resolve(null);
            return;
          }

          resolve(parsed.value);
        } catch (error) {
          logger.error('SessionStorage getItem error', error as Error, { key });
          resolve(null);
        }
      }, 0);
    });
  }

  async setItem<T = any>(key: string, value: T, expiryMs?: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const item: StorageItem<T> = {
            value,
            timestamp: Date.now(),
            expiry: expiryMs ? Date.now() + expiryMs : undefined
          };

          const serialized = JSON.stringify(item);

          if (this.useSessionMemoryFallback) {
            this.sessionMemoryFallback.set(key, serialized);
            resolve(true);
            return;
          }

          sessionStorage.setItem(key, serialized);
          resolve(true);
        } catch (error: any) {
          if (error.name === 'QuotaExceededError') {
            logger.warn('SessionStorage quota exceeded, falling back to memory', { key });
            this.useSessionMemoryFallback = true;
            
            const item: StorageItem<T> = {
              value,
              timestamp: Date.now(),
              expiry: expiryMs ? Date.now() + expiryMs : undefined
            };
            this.sessionMemoryFallback.set(key, JSON.stringify(item));
            resolve(true);
          } else {
            logger.error('SessionStorage setItem error', error, { key });
            resolve(false);
          }
        }
      }, 0);
    });
  }

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (this.useSessionMemoryFallback) {
            this.sessionMemoryFallback.delete(key);
          } else {
            sessionStorage.removeItem(key);
          }
        } catch (error) {
          logger.error('SessionStorage removeItem error', error as Error, { key });
        }
        resolve();
      }, 0);
    });
  }

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          if (this.useSessionMemoryFallback) {
            this.sessionMemoryFallback.clear();
          } else {
            sessionStorage.clear();
          }
        } catch (error) {
          logger.error('SessionStorage clear error', error as Error);
        }
        resolve();
      }, 0);
    });
  }
}

// Export singleton instances
export const asyncLocalStorage = new AsyncStorage();
export const asyncSessionStorage = new AsyncSessionStorage();

// Convenience functions
export async function safeGetItem<T = any>(key: string, defaultValue: T | null = null): Promise<T | null> {
  try {
    const value = await asyncLocalStorage.getItem<T>(key);
    return value !== null ? value : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function safeSetItem<T = any>(key: string, value: T, expiryMs?: number): Promise<boolean> {
  try {
    return await asyncLocalStorage.setItem(key, value, expiryMs);
  } catch {
    return false;
  }
}

export async function safeRemoveItem(key: string): Promise<void> {
  try {
    await asyncLocalStorage.removeItem(key);
  } catch {
    // Silent fail
  }
}