import Redis from 'ioredis';

/**
 * Redis Cache Helper
 * Provides intelligent caching with TTL and invalidation
 */

// Cache TTL values (in seconds)
export const CACHE_TTL = {
  METRICS: 5 * 60,        // 5 minutes - frequently changing data
  DAILY_KPIS: 10 * 60,    // 10 minutes - updated throughout the day
  FUNNEL: 15 * 60,        // 15 minutes - less frequent updates
  CHANNEL: 15 * 60,       // 15 minutes - ad performance data
  VSL: 30 * 60,           // 30 minutes - video analytics
  ALERTS: 5 * 60,         // 5 minutes - important notifications
} as const;

// Cache key prefixes
export const CACHE_PREFIX = {
  METRICS: 'metrics',
  DAILY_KPIS: 'daily_kpis',
  FUNNEL: 'funnel',
  CHANNEL: 'channel',
  VSL: 'vsl',
  ALERTS: 'alerts',
} as const;

let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 * Uses in-memory fallback if Redis is not available
 */
export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  try {
    // Try to connect to Redis (default: localhost:6379)
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        // Retry up to 3 times, then give up
        if (times > 3) {
          console.warn('[Cache] Redis connection failed, using no-cache mode');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.warn('[Cache] Redis error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Cache] Redis connected successfully');
    });

    redisClient = redis;
    return redis;
  } catch (error) {
    console.warn('[Cache] Failed to initialize Redis:', error);
    return null;
  }
}

/**
 * Generate cache key with prefix and parameters
 */
export function getCacheKey(prefix: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    await redis.connect().catch(() => {});
    const value = await redis.get(key);
    if (!value) return null;

    const parsed = JSON.parse(value);
    console.log(`[Cache] HIT: ${key}`);
    return parsed as T;
  } catch (error) {
    console.warn(`[Cache] Get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(key: string, value: any, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.connect().catch(() => {});
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
    console.log(`[Cache] SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.warn(`[Cache] Set error for key ${key}:`, error);
  }
}

/**
 * Invalidate cache by key pattern
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.connect().catch(() => {});
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] INVALIDATE: ${pattern} (${keys.length} keys deleted)`);
    }
  } catch (error) {
    console.warn(`[Cache] Invalidate error for pattern ${pattern}:`, error);
  }
}

/**
 * Invalidate all cache
 */
export async function cacheInvalidateAll(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.connect().catch(() => {});
    await redis.flushdb();
    console.log('[Cache] FLUSH: All cache cleared');
  } catch (error) {
    console.warn('[Cache] Flush error:', error);
  }
}

/**
 * Cache wrapper for async functions
 * Automatically handles cache get/set with TTL
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  console.log(`[Cache] MISS: ${key}`);
  const data = await fetchFn();

  // Store in cache
  await cacheSet(key, data, ttlSeconds);

  return data;
}
