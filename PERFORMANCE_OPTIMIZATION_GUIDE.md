# Performance Optimization Quick Start Guide

## 🎯 Goal
Improve dashboard query performance by **3-10x** through database indexes and materialized views.

## 📊 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Overview Page Load | 3-5s | 0.5-1s | **5-10x faster** |
| Daily Analysis Load | 5-8s | 1-2s | **3-5x faster** |
| Date Filter Change | 2-4s | 0.3-0.5s | **5-10x faster** |
| Wisdom Filter Query | 500-1000ms | 50-100ms | **10-50x faster** |

## 🚀 Step-by-Step Instructions

### Step 1: Apply Database Indexes (Required)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project: https://supabase.com/dashboard
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy Migration Script**
   - Open `migrations/002_performance_indexes.sql`
   - Copy the entire contents (Cmd/Ctrl + A, then Cmd/Ctrl + C)

3. **Execute in Supabase**
   - Paste into SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)
   - Wait ~30-60 seconds for completion
   - ✅ You should see "Success. No rows returned" message

4. **Verify Indexes Created**
   ```sql
   SELECT tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   ORDER BY tablename, indexname;
   ```
   - You should see 28 new indexes starting with `idx_`

### Step 2: Apply Materialized View (Optional but Recommended)

1. **Copy Materialized View Script**
   - Open `migrations/003_materialized_views.sql`
   - Copy the entire contents

2. **Execute in Supabase**
   - Paste into SQL Editor
   - Click **Run**
   - Wait ~10-20 seconds
   - ✅ You should see "Success. No rows returned" message

3. **Verify Materialized View**
   ```sql
   SELECT COUNT(*) as wisdom_contacts_count 
   FROM wisdom_contacts;
   ```
   - You should see a count of wisdom funnel contacts (e.g., 62-64)

4. **Set Up Auto-Refresh (Optional)**
   - The materialized view needs periodic refresh to stay up-to-date
   - Option A: Manual refresh (run this daily):
     ```sql
     REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
     ```
   - Option B: Automated refresh with pg_cron (requires extension):
     ```sql
     SELECT cron.schedule(
       'refresh-wisdom-contacts', 
       '*/30 * * * *', 
       'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts'
     );
     ```

### Step 3: Test Performance Improvements

1. **Open Dashboard**
   - Go to https://wisdomdash-deft9arhdvcz.manus.space
   - Open browser DevTools (F12)
   - Go to Network tab

2. **Test Overview Page**
   - Refresh the page
   - Check network timing for `/api/trpc/overview.metrics` request
   - Should be < 1 second (was 3-5 seconds before)

3. **Test Daily Analysis**
   - Click "Daily" tab
   - Change date filter (TODAY → 7 DAYS → 30 DAYS)
   - Each filter change should be < 500ms (was 2-4 seconds before)

4. **Test Date Filters**
   - Try all date presets: TODAY, YESTERDAY, 7 DAYS, 14 DAYS, 30 DAYS
   - Each should load quickly without lag

### Step 4: Monitor Index Usage (Optional)

After a few hours of dashboard usage, check which indexes are being used:

```sql
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
ORDER BY idx_scan DESC 
LIMIT 20;
```

**What to look for:**
- `idx_scan` > 0 means the index is being used
- Higher `idx_scan` = more frequently used
- If an index has `idx_scan = 0` after several hours, it may not be needed

## 🔧 Troubleshooting

### Error: "extension pg_trgm does not exist"

**Solution:**
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```
Then re-run the migration script.

### Error: "column does not exist"

**Cause:** Table schema doesn't match expected structure.

**Solution:**
1. Check table names in Supabase (should be: contacts, orders, ad_performance, etc.)
2. Verify column names match (e.g., `created_at`, not `createdAt`)
3. If schema is different, edit the migration script to match your schema

### Slow Index Creation

**Normal Behavior:** Large tables may take several minutes to index.

**What to do:**
- Don't interrupt the process
- Monitor progress in Supabase logs
- If it takes > 10 minutes, check table size:
  ```sql
  SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  ```

### Materialized View Out of Date

**Symptoms:** Dashboard shows old data after new records are added.

**Solution:** Refresh the materialized view manually:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
```

**Prevention:** Set up automated refresh (see Step 2.4 above).

## 📈 Performance Metrics to Track

### Before Optimization
- Run this query to measure baseline:
  ```sql
  EXPLAIN ANALYZE 
  SELECT * FROM contacts 
  WHERE id IN (
    SELECT DISTINCT contact_id 
    FROM analytics_events 
    WHERE funnel = 'wisdom'
  )
  AND created_at >= '2025-12-01';
  ```
- Note the "Execution Time" in the output

### After Optimization
- Run the same query again
- Compare "Execution Time" - should be 5-10x faster

## 🎉 Success Indicators

✅ **Indexes Applied Successfully**
- 28 indexes visible in `pg_indexes`
- No errors in SQL Editor

✅ **Performance Improved**
- Overview page loads in < 1 second
- Date filter changes are instant (< 500ms)
- No loading spinners or delays

✅ **Materialized View Working**
- `wisdom_contacts` view exists
- Contains 60+ contact IDs
- Dashboard queries are 10x faster

## 🔄 Rollback (If Needed)

If you need to remove the optimizations:

```sql
-- Drop all indexes
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_manychat_id;
DROP INDEX IF EXISTS idx_contacts_id_created_at;
-- ... (see migrations/README.md for full list)

-- Drop materialized view
DROP MATERIALIZED VIEW IF EXISTS wisdom_contacts CASCADE;
```

## 📚 Additional Resources

- **Full Migration Details**: See `migrations/README.md`
- **Index List**: See `migrations/002_performance_indexes.sql`
- **Materialized Views**: See `migrations/003_materialized_views.sql`
- **PostgreSQL Index Documentation**: https://www.postgresql.org/docs/current/indexes.html
- **Supabase Performance Guide**: https://supabase.com/docs/guides/database/performance

## 💡 Next Steps

After applying these optimizations:

1. **Monitor Performance**: Use browser DevTools to track query times
2. **Check Index Usage**: Run the monitoring query (Step 4) weekly
3. **Refresh Materialized View**: Set up automated refresh or run manually daily
4. **Consider Additional Optimizations**:
   - Connection pooling (if high traffic)
   - Query caching layer (Redis)
   - Table partitioning (if tables grow > 1M rows)
   - Additional materialized views for complex aggregations

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs for error details
2. Verify table/column names match your schema
3. Test queries individually to isolate problems
4. Review PostgreSQL documentation for index types
5. Contact Supabase support for database-specific issues

---

**Last Updated:** December 13, 2025  
**Version:** 1.0  
**Tested On:** Supabase PostgreSQL 15
