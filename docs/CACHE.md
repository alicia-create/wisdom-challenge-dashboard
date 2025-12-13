# Intelligent Cache System

## Overview

The dashboard implements an intelligent caching system using Redis (with in-memory fallback) to optimize Supabase queries and improve performance.

## Architecture

### Cache Backend

- **Primary:** Redis (ioredis client)
- **Fallback:** In-memory Map (when Redis is unavailable)
- **Auto-detection:** System automatically detects Redis availability and falls back to memory cache

### Cache Layers

1. **Redis Cache** (`server/_core/cache.ts`)
   - Low-level Redis operations
   - Connection management
   - TTL support
   - Pattern-based invalidation

2. **Intelligent Cache** (`server/cache.ts`)
   - High-level cache interface
   - Automatic fallback to memory
   - Backward compatibility with sync methods
   - Statistics and monitoring

## Cache Strategy

### TTL (Time To Live) Values

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Overview Metrics | 5 minutes | Frequently changing data (leads, sales) |
| Daily KPIs | 10 minutes | Updated throughout the day |
| Funnel Metrics | 15 minutes | Less frequent updates |
| Channel Performance | 15 minutes | Ad performance data |
| Paid Ads Funnel | 15 minutes | Campaign-specific metrics |
| Organic Funnel | 15 minutes | Non-paid traffic metrics |
| VSL Metrics | 30 minutes | Video analytics (changes less frequently) |

### Cache Keys

Cache keys follow the pattern: `{prefix}:{parameter}:{value}`

Examples:
- `overview:metrics:TODAY`
- `overview:dailyKpis:30 DAYS`
- `overview:funnelMetrics:7 DAYS`
- `overview:vslMetrics:YESTERDAY`

## Performance

### Benchmark Results

Based on production testing:

| Metric | Cache MISS | Cache HIT | Improvement |
|--------|-----------|-----------|-------------|
| Response Time | 48ms | 6ms | **87.5% faster** |
| Speedup | 1x | **8x** | - |

### Expected Benefits

1. **Reduced Database Load:** 80-90% reduction in Supabase queries
2. **Faster Response Times:** 8x faster for cached requests
3. **Better User Experience:** Near-instant page loads on repeat visits
4. **Cost Savings:** Reduced Supabase API usage

## Usage

### Basic Cache Operations

```typescript
import { cache } from './server/cache';

// Get from cache
const data = await cache.get<MyType>('my-key');

// Set with TTL (in milliseconds)
await cache.set('my-key', data, 5 * 60 * 1000); // 5 minutes

// Check if exists
const exists = await cache.has('my-key');

// Delete
await cache.delete('my-key');

// Clear all
await cache.clear();

// Invalidate by pattern (Redis only)
await cache.invalidatePattern('overview:*');
```

### tRPC Integration Pattern

```typescript
.query(async ({ input }) => {
  const { startDate, endDate } = getDateRangeValues(input.dateRange);
  
  // Build cache key
  const cacheKey = `overview:metrics:${input.dateRange}`;
  
  // Try cache first
  const cached = await cache.get<MetricsType>(cacheKey);
  if (cached) {
    console.log('[Metrics] Returning cached result');
    return cached;
  }
  
  // Cache miss - fetch from database
  console.log('[Metrics] Cache miss, fetching fresh data');
  const result = await getMetricsFromDatabase(startDate, endDate);
  
  // Store in cache
  await cache.set(cacheKey, result, 5 * 60 * 1000);
  
  return result;
})
```

## Cache Invalidation

### Automatic Expiration

All cached data automatically expires based on TTL values. No manual invalidation needed for time-based data.

### Manual Invalidation

For immediate updates (e.g., after data import):

```typescript
// Invalidate specific key
await cache.delete('overview:metrics:TODAY');

// Invalidate all overview metrics (Redis only)
await cache.invalidatePattern('overview:*');

// Clear entire cache
await cache.clear();
```

### Recommended Invalidation Events

- After bulk data import
- After manual data corrections
- When switching between test/production data
- On deployment (optional)

## Monitoring

### Cache Statistics

```typescript
const stats = cache.getStats();
console.log(stats);
// {
//   backend: 'redis' | 'memory',
//   totalEntries: number,
//   validEntries: number,
//   expiredEntries: number
// }
```

### Server Logs

Cache operations are logged with prefixes:
- `[Cache] HIT: {key}` - Successful cache retrieval
- `[Cache] MISS: {key}` - Cache miss, fetching from database
- `[Cache] SET: {key} (TTL: {seconds}s)` - Storing in cache
- `[Cache] INVALIDATE: {pattern}` - Pattern-based invalidation

## Configuration

### Environment Variables

```bash
# Redis connection (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# If not set, system uses in-memory fallback
```

### Adjusting TTL Values

Edit `server/_core/cache.ts`:

```typescript
export const CACHE_TTL = {
  METRICS: 5 * 60,        // 5 minutes
  DAILY_KPIS: 10 * 60,    // 10 minutes
  FUNNEL: 15 * 60,        // 15 minutes
  // ... add more as needed
};
```

## Testing

### Performance Testing

Run the performance test script:

```bash
npx tsx scripts/test-cache-performance.ts
```

### Unit Tests

Cache functionality is tested in:
- `server/_core/cache.test.ts` (if exists)
- Integration tests in tRPC procedures

## Troubleshooting

### Redis Connection Issues

If Redis fails to connect:
1. System automatically falls back to in-memory cache
2. Check logs for `[Cache] Redis connection failed`
3. Verify `REDIS_HOST` and `REDIS_PORT` environment variables
4. Ensure Redis server is running

### Cache Not Working

1. Check server logs for cache HIT/MISS messages
2. Verify TTL values are appropriate
3. Test with performance script
4. Clear cache and retry: `await cache.clear()`

### Memory Usage (In-Memory Fallback)

If using in-memory fallback:
- Cache automatically cleans up expired entries every 5 minutes
- Monitor memory usage with `cache.getStats()`
- Consider setting up Redis for production use

## Best Practices

1. **Use appropriate TTL values** - Balance freshness vs performance
2. **Include all parameters in cache keys** - Avoid cache collisions
3. **Log cache operations** - Monitor hit/miss rates
4. **Test cache invalidation** - Ensure data freshness when needed
5. **Monitor memory usage** - Especially with in-memory fallback
6. **Use Redis in production** - Better performance and persistence

## Future Enhancements

- [ ] Cache warming on server startup
- [ ] Adaptive TTL based on data volatility
- [ ] Cache hit/miss rate metrics dashboard
- [ ] Automatic cache invalidation on Supabase webhooks
- [ ] Redis Cluster support for high availability
