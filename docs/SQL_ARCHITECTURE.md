# SQL Architecture & Database Functions

**Last Updated:** December 23, 2025  
**Version:** 1.0 (Migration 032)

This document explains the SQL function architecture, optimization strategies, and implementation details for the 31-Day Wisdom Challenge Analytics Dashboard.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core SQL Functions](#core-sql-functions)
3. [Performance Optimization](#performance-optimization)
4. [Migration Strategy](#migration-strategy)
5. [Caching Layer](#caching-layer)
6. [Error Handling](#error-handling)

---

## Architecture Overview

### Design Principles

1. **Single Query Optimization**: Each page loads data from ONE SQL function call (not multiple queries)
2. **Database-Side Calculations**: All metrics calculated in PostgreSQL (not in Node.js/TypeScript)
3. **JSONB Response Format**: Functions return structured JSON for easy consumption
4. **Date Range Filtering**: All functions accept `p_start_date` and `p_end_date` parameters
5. **Consistent Naming**: All functions prefixed with `get_*` and use snake_case

### Why SQL Functions?

**Before (Multiple Queries)**
```typescript
// ❌ OLD: 10+ separate queries, calculated in TypeScript
const leads = await supabase.from('contacts').select('*').eq('funnel', 'wisdom');
const orders = await supabase.from('orders').select('*');
const adSpend = await supabase.from('ad_performance').select('spend').sum();
// ... 7 more queries
// Then calculate CPL, CPP, conversion rates in TypeScript
const cpl = totalSpend / leads.length;
```

**After (Single SQL Function)**
```typescript
// ✅ NEW: 1 query, all calculations in database
const { data } = await supabase.rpc('get_dashboard_metrics', {
  p_start_date: '2025-12-13',
  p_end_date: '2025-12-23'
});
// data.kpis.cpl already calculated in SQL
```

**Benefits:**
- **10x faster**: Single round-trip vs 10+ queries
- **Database-optimized**: PostgreSQL is faster at aggregations than Node.js
- **Type-safe**: JSONB schema enforced at database level
- **Cacheable**: Single result object easy to cache
- **Testable**: Can test SQL functions directly in Supabase SQL Editor

---

## Core SQL Functions

### 1. get_dashboard_metrics(p_start_date, p_end_date)

**Purpose**: Returns ALL metrics for Overview page in single query

**Location**: `migrations/032_add_welcome_email_clicks_to_kpis.sql`

**Execution Time**: ~2-5 seconds for 30-day range

**Response Structure**:
```json
{
  "kpis": {
    "totalLeads": 32094,
    "totalWisdomSales": 3594,
    "totalKingdomSeekers": 602,
    "totalSpend": 159997.72,
    "totalRevenue": 132955.20,
    "conversion": 11.20,
    "aov": 38.43,
    "welcomeEmailClicks": 1699,
    "cplAds": 6.32,
    "cppAds": 65.15,
    "trueCpl": 6.29,
    "trueCpp": 56.18
  },
  "paidAdsFunnel": {
    "leads": 25298,
    "wisdomSales": 2456,
    "extraJournals": 210,
    "kingdomSeekers": 0,
    "manychatUsers": 1002,
    "botAlerts": 788
  },
  "organicFunnel": {
    "leads": 6796,
    "wisdomSales": 1135,
    "extraJournals": 262,
    "kingdomSeekers": 602,
    "manychatUsers": 1000,
    "botAlerts": 822
  },
  "metaPerformance": {
    "totalSpend": 192730.17,
    "totalClicks": 66756,
    "totalImpressions": 12021457,
    "reportedLeads": 22271,
    "reportedPurchases": 2215,
    "cpc": 2.89,
    "cpm": 16.03,
    "ctr": 0.56
  },
  "metaCampaignBreakdown": {
    "sales": { "spend": 148137.99, "clicks": 62039, ... },
    "leads": { "spend": 11859.73, "clicks": 4240, ... },
    "retargeting": { "spend": 868.70, "clicks": 345, ... },
    "content": { "spend": 32943.46, "clicks": 253, ... },
    "other": { "spend": 185.15, "clicks": 51, ... }
  },
  "googlePerformance": {
    "totalSpend": 9178.71,
    "totalClicks": 4428,
    "totalImpressions": 63569,
    "conversions": 173
  },
  "vslPerformance": {
    "watched5": 22590,
    "watched25": 18417,
    "watched50": 14811,
    "watched95": 9757,
    "wisdomPurchases": 2430
  }
}
```

**Key CTEs (Common Table Expressions)**:

1. **wisdom_leads**: Pre-filter contacts by wisdom funnel + date range
2. **lead_metrics**: Aggregate lead counts (total, paid, organic, manychat)
3. **wisdom_orders**: Pre-filter orders by wisdom funnel + billing status
4. **product_sales**: Calculate Wisdom+, Kingdom Seekers, Extra Journals counts
5. **engagement_metrics**: Bot alerts + welcome email clicks
6. **ad_metrics**: Aggregate ad spend by platform and campaign type
7. **vsl_metrics**: Video engagement milestones

**Critical Filters**:
```sql
-- Only wisdom funnel contacts
WHERE wlc.created_at >= p_start_date::timestamp
  AND wlc.created_at < (p_end_date + interval '1 day')::timestamp

-- Only paid/partially-refunded orders
WHERE o.billing_status IN ('paid', 'partially-refunded')

-- Campaign filter (if needed)
WHERE campaign_name ILIKE '%31DWC2026%'
```

---

### 2. get_journals_metrics(p_start_date, p_end_date)

**Purpose**: Calculate journal counts and progress toward goal

**Response Structure**:
```json
{
  "wisdomJournals": 3594,
  "extraJournals": 476,
  "totalJournals": 4070,
  "journalGoal": 20000,
  "journalProgress": 20.35,
  "journalsRemaining": 15930
}
```

**Calculation Logic**:
```sql
-- Wisdom Journals = count of orders with product_id = 1
SELECT COUNT(DISTINCT o.id)
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE oi.product_id = 1

-- Extra Journals = sum of quantity for product_id = 4
SELECT COALESCE(SUM(oi.quantity), 0)
FROM order_items oi
WHERE oi.product_id = 4
```

---

### 3. get_daily_metrics(p_start_date, p_end_date)

**Purpose**: Daily breakdown for time-series charts

**Response Structure**:
```json
{
  "dailyData": [
    {
      "date": "2025-12-13",
      "totalLeads": 1234,
      "totalWisdomSales": 138,
      "totalAdSpend": 5432.10,
      "totalRevenue": 4567.89,
      "roas": 0.84,
      "cpl": 4.40,
      "cpp": 39.36
    },
    // ... more days
  ]
}
```

**Grouping Logic**:
```sql
GROUP BY DATE(created_at)
ORDER BY DATE(created_at) ASC
```

---

## Performance Optimization

### Indexing Strategy

**Critical Indexes** (must exist for performance):

```sql
-- wisdom_lead_classification
CREATE INDEX idx_wlc_created_at ON wisdom_lead_classification(created_at);
CREATE INDEX idx_wlc_is_paid ON wisdom_lead_classification(is_paid);
CREATE INDEX idx_wlc_is_organic ON wisdom_lead_classification(is_organic);

-- orders
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_billing_status ON orders(billing_status);
CREATE INDEX idx_orders_funnel_name ON orders(funnel_name);

-- order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ad_performance
CREATE INDEX idx_ad_performance_date ON ad_performance(date);
CREATE INDEX idx_ad_performance_platform ON ad_performance(platform);
CREATE INDEX idx_ad_performance_campaign_name ON ad_performance(campaign_name);

-- analytics_events
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_contact_id ON analytics_events(contact_id);
CREATE INDEX idx_analytics_events_name ON analytics_events(name);
```

### Query Optimization Techniques

**1. Pre-filtering with CTEs**
```sql
-- ✅ GOOD: Filter once, reuse everywhere
WITH wisdom_leads AS (
  SELECT * FROM wisdom_lead_classification
  WHERE created_at >= p_start_date AND created_at < p_end_date
)
SELECT COUNT(*) FROM wisdom_leads WHERE is_paid;
SELECT COUNT(*) FROM wisdom_leads WHERE is_organic;

-- ❌ BAD: Scan table twice
SELECT COUNT(*) FROM wisdom_lead_classification 
WHERE created_at >= p_start_date AND is_paid;
SELECT COUNT(*) FROM wisdom_lead_classification 
WHERE created_at >= p_start_date AND is_organic;
```

**2. FILTER clause for conditional aggregates**
```sql
-- ✅ GOOD: Single table scan
SELECT
  COUNT(*) FILTER (WHERE is_paid) as paid_leads,
  COUNT(*) FILTER (WHERE is_organic) as organic_leads
FROM wisdom_leads;

-- ❌ BAD: Two table scans
SELECT COUNT(*) FROM wisdom_leads WHERE is_paid;
SELECT COUNT(*) FROM wisdom_leads WHERE is_organic;
```

**3. EXISTS for product checks**
```sql
-- ✅ GOOD: Stops at first match
COUNT(DISTINCT o.id) FILTER (
  WHERE EXISTS (
    SELECT 1 FROM order_items oi 
    WHERE oi.order_id = o.id AND oi.product_id = 1
  )
)

-- ❌ BAD: Full join, slower
COUNT(DISTINCT o.id)
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
WHERE oi.product_id = 1
```

**4. Date range optimization**
```sql
-- ✅ GOOD: Includes end date, excludes next day
WHERE created_at >= p_start_date::timestamp
  AND created_at < (p_end_date + interval '1 day')::timestamp

-- ❌ BAD: Excludes end date
WHERE created_at >= p_start_date AND created_at <= p_end_date
```

### Statement Timeout

All functions have `statement_timeout = '120s'` to prevent long-running queries from blocking the database.

```sql
CREATE OR REPLACE FUNCTION get_dashboard_metrics(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '120s'  -- 2 minute max
AS $function$
...
$function$;
```

---

## Migration Strategy

### Migration Naming Convention

```
XXX_description_of_change.sql
```

Examples:
- `031_fix_product_id_logic.sql`
- `032_add_welcome_email_clicks_to_kpis.sql`

### Migration Template

```sql
-- ============================================================================
-- Migration XXX: Brief Description
-- - Change 1
-- - Change 2
-- - Change 3
-- ============================================================================

DROP FUNCTION IF EXISTS get_dashboard_metrics;

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '120s'
AS $function$
DECLARE
    v_result JSONB;
    v_next_day_str TEXT;
BEGIN
    -- Function body
    ...
    
    RETURN v_result;
END;
$function$;
```

### Testing Migrations

**Before applying in production:**

1. **Test in Supabase SQL Editor**
```sql
SELECT get_dashboard_metrics('2025-12-13', '2025-12-23');
```

2. **Verify response structure**
```sql
SELECT jsonb_pretty(get_dashboard_metrics('2025-12-13', '2025-12-23'));
```

3. **Check execution time**
```sql
EXPLAIN ANALYZE SELECT get_dashboard_metrics('2025-12-13', '2025-12-23');
```

4. **Compare with previous version**
```sql
-- Run old function
SELECT * FROM get_dashboard_metrics_v031('2025-12-13', '2025-12-23');

-- Run new function
SELECT * FROM get_dashboard_metrics('2025-12-13', '2025-12-23');

-- Compare results
```

### Rollback Strategy

If migration fails, copy previous version from git history:

```bash
# Find previous migration
git log --oneline migrations/

# Restore previous version
git show <commit-hash>:migrations/031_fix_product_id_logic.sql > rollback.sql

# Apply in Supabase SQL Editor
```

---

## Caching Layer

### Backend Cache (Redis/Memory)

**Implementation**: `server/cache.ts`

```typescript
const cacheKey = `overview:unifiedMetrics:${startDate}:${endDate}`;
const cached = await cache.get<any>(cacheKey);

if (cached) {
  return cached; // Return cached result
}

// Fetch from database
const result = await supabase.rpc('get_dashboard_metrics', { ... });

// Cache for 2 minutes
await cache.set(cacheKey, result, 2 * 60 * 1000);
```

**Cache Keys**:
- `overview:unifiedMetrics:{startDate}:{endDate}` - 2 min TTL
- `overview:metrics:{dateRange}` - 5 min TTL
- `overview:dailyKpis:{dateRange}` - 10 min TTL

**Cache Invalidation**:
```typescript
// Manual refresh via "Refresh Data" button
trpc.overview.clearCache.useMutation();
```

### Frontend Cache (React Query)

**tRPC automatically caches** query results:

```typescript
const { data } = trpc.overview.unifiedMetrics.useQuery({
  startDate, endDate
});
// Cached for 5 minutes by default
```

**Manual invalidation**:
```typescript
const utils = trpc.useUtils();
await utils.overview.unifiedMetrics.invalidate();
```

---

## Error Handling

### SQL Function Error Handling

```sql
BEGIN
    -- Try to execute query
    SELECT ... INTO v_result;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        RAISE WARNING 'Error in get_dashboard_metrics: %', SQLERRM;
        
        -- Return empty result
        RETURN '{}'::jsonb;
END;
```

### Backend Error Handling

```typescript
const metricsResult = await supabase.rpc('get_dashboard_metrics', {
  p_start_date: startDate,
  p_end_date: endDate,
});

if (metricsResult.error) {
  console.error('[Unified Metrics] Error:', metricsResult.error);
  throw new Error(`Failed to fetch unified metrics: ${metricsResult.error.message}`);
}
```

### Frontend Error Handling

```typescript
const { data, error, isLoading } = trpc.overview.unifiedMetrics.useQuery({
  startDate, endDate
});

if (error) {
  return <div>Error loading metrics: {error.message}</div>;
}

if (isLoading) {
  return <Skeleton />;
}
```

---

## Best Practices

### DO ✅

1. **Always use CTEs** for complex queries (better readability + performance)
2. **Pre-filter early** in CTEs to reduce data scanned
3. **Use FILTER clause** for conditional aggregates (single table scan)
4. **Use EXISTS** for product checks (stops at first match)
5. **Set statement_timeout** to prevent runaway queries
6. **Test in SQL Editor** before deploying migrations
7. **Cache results** with appropriate TTL (2-10 minutes)
8. **Return JSONB** for structured responses

### DON'T ❌

1. **Don't calculate in TypeScript** - do it in SQL
2. **Don't make multiple queries** - use single SQL function
3. **Don't use SELECT *** - specify needed columns
4. **Don't forget indexes** on filtered/joined columns
5. **Don't hardcode dates** - use parameters
6. **Don't ignore errors** - handle and log them
7. **Don't cache forever** - use reasonable TTL
8. **Don't skip testing** - always verify before production

---

## Monitoring & Debugging

### Query Performance

**Check slow queries in Supabase Dashboard:**
1. Go to Database → Query Performance
2. Look for `get_dashboard_metrics` calls > 5 seconds
3. Analyze EXPLAIN ANALYZE output

**Add timing logs:**
```sql
RAISE NOTICE 'Lead metrics CTE: % ms', (EXTRACT(EPOCH FROM clock_timestamp()) - start_time) * 1000;
```

### Error Logs

**Backend logs:**
```bash
# Check server console for errors
grep "Error" server.log

# Check for SQL function errors
grep "get_dashboard_metrics" server.log
```

**Supabase logs:**
1. Go to Logs → Postgres Logs
2. Filter by "error" or "timeout"
3. Look for function execution failures

---

## Future Improvements

1. **Materialized Views**: Pre-calculate daily metrics, refresh nightly
2. **Partitioning**: Partition large tables by date for faster queries
3. **Read Replicas**: Route analytics queries to read replica
4. **Incremental Updates**: Only recalculate changed data, not full range
5. **Background Jobs**: Pre-warm cache during off-peak hours

---

## Contact

For questions about SQL architecture:
- Review migrations: `/migrations/`
- Check backend: `/server/routers.ts`, `/server/supabase.ts`
- Test in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
