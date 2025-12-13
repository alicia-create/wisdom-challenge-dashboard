/**
 * Intelligent cache with Redis backend and in-memory fallback
 * Provides TTL support and automatic cleanup
 */

import {
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheInvalidate,
  cacheInvalidateAll,
  CACHE_TTL,
  CACHE_PREFIX,
} from './_core/cache';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

class IntelligentCache {
  // In-memory fallback when Redis is not available
  private memoryStore: Map<string, CacheEntry<any>> = new Map();
  private useRedis: boolean = true;

  constructor() {
    // Test Redis connection on startup
    this.testRedisConnection();
  }

  private async testRedisConnection() {
    const redis = getRedisClient();
    if (!redis) {
      console.warn('[Cache] Redis not available, using in-memory fallback');
      this.useRedis = false;
      return;
    }

    try {
      await redis.connect().catch(() => {});
      await redis.ping();
      this.useRedis = true;
      console.log('[Cache] Redis connection successful');
    } catch (error) {
      console.warn('[Cache] Redis connection failed, using in-memory fallback');
      this.useRedis = false;
    }
  }

  /**
   * Get value from cache (Redis or memory fallback)
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (this.useRedis) {
      const value = await cacheGet<T>(key);
      return value ?? undefined;
    }

    // Fallback to memory cache
    return this.getFromMemory<T>(key);
  }

  /**
   * Synchronous get for backward compatibility
   * Only works with memory cache
   */
  getSync<T>(key: string): T | undefined {
    return this.getFromMemory<T>(key);
  }

  private getFromMemory<T>(key: string): T | undefined {
    const entry = this.memoryStore.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Set value in cache with TTL (Redis or memory fallback)
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (default: 30 minutes)
   */
  async set<T>(key: string, value: T, ttlMs: number = 30 * 60 * 1000): Promise<void> {
    if (this.useRedis) {
      await cacheSet(key, value, Math.floor(ttlMs / 1000));
    } else {
      // Fallback to memory cache
      const now = Date.now();
      const expiresAt = now + ttlMs;
      this.memoryStore.set(key, { value, expiresAt, createdAt: now });
    }
  }

  /**
   * Check if key exists and is not expired
   * @param key Cache key
   * @returns True if key exists and is valid
   */
  async has(key: string): Promise<boolean> {
    if (this.useRedis) {
      const value = await cacheGet(key);
      return value !== null;
    }

    // Fallback to memory cache
    const entry = this.memoryStore.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    if (this.useRedis) {
      await cacheInvalidate(key);
    } else {
      this.memoryStore.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    if (this.useRedis) {
      await cacheInvalidateAll();
    } else {
      this.memoryStore.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    if (this.useRedis) {
      return {
        backend: 'redis',
        totalEntries: 'N/A (Redis)',
        validEntries: 'N/A (Redis)',
        expiredEntries: 'N/A (Redis)',
      };
    }

    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    Array.from(this.memoryStore.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    });

    return {
      backend: 'memory',
      totalEntries: this.memoryStore.size,
      validEntries,
      expiredEntries,
    };
  }

  /**
   * Get cache metadata (created timestamp, expires timestamp)
   * @param key Cache key
   * @returns Metadata object or undefined if not found
   */
  getMetadata(key: string): { createdAt: number; expiresAt: number } | undefined {
    if (this.useRedis) {
      // Redis doesn't support metadata in this implementation
      return undefined;
    }

    const entry = this.memoryStore.get(key);
    
    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return undefined;
    }

    return {
      createdAt: entry.createdAt,
      expiresAt: entry.expiresAt,
    };
  }

  /**
   * Clean up expired entries (only for memory cache)
   */
  cleanup(): void {
    if (this.useRedis) {
      // Redis handles expiration automatically
      return;
    }

    const now = Date.now();
    const keysToDelete: string[] = [];

    Array.from(this.memoryStore.entries()).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.memoryStore.delete(key));
  }

  /**
   * Invalidate cache by pattern (e.g., "overview:*")
   * Only works with Redis
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (this.useRedis) {
      await cacheInvalidate(pattern);
    } else {
      console.warn('[Cache] Pattern invalidation not supported in memory mode');
    }
  }
}

// Singleton instance
export const cache = new IntelligentCache();

// Run cleanup every 5 minutes (only for memory cache)
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Export cache constants for convenience
export { CACHE_TTL, CACHE_PREFIX };
