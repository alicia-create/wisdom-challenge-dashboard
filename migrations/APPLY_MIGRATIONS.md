# How to Apply Performance Optimization Migrations

## ⚠️ Important Note

Supabase does not allow DDL commands (CREATE INDEX, CREATE TABLE, etc.) via the REST API for security reasons. You **must** use the SQL Editor in the Supabase Dashboard to apply these migrations.

## ✅ Schema Verified (2025-12-13)

The migration scripts have been verified against the actual Supabase table structure:
- ✅ Fixed `analytics_events` index (changed from non-existent `funnel` column to `type`)
- ✅ Fixed `products` index (changed from `name` to `product_name`)
- ✅ All other column names match the actual schema

## 📋 Step-by-Step Instructions

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: **sumibccxhppkpejrurjt**
3. Click on **SQL Editor** in the left sidebar

### Step 2: Apply Performance Indexes

1. In SQL Editor, click **"New Query"** button (top right)

2. Open the file `migrations/002_performance_indexes.sql` in your code editor

3. Copy the **entire contents** of the file (Cmd/Ctrl + A, then Cmd/Ctrl + C)

4. Paste into the SQL Editor

5. Click **"Run"** button (or press Cmd/Ctrl + Enter)

6. Wait ~30-60 seconds for execution to complete

7. You should see: **"Success. No rows returned"** message

8. ✅ **28 indexes created!**

### Step 3: Apply Materialized View

1. Click **"New Query"** again to create another query

2. Open the file `migrations/003_materialized_views.sql`

3. Copy the **entire contents** of the file

4. Paste into the SQL Editor

5. Click **"Run"** button

6. Wait ~10-20 seconds for execution

7. You should see: **"Success. No rows returned"** message

8. ✅ **Materialized view created!**

### Step 4: Verify Indexes Were Created

Run this query in SQL Editor:

```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

**Expected result:** You should see 28 rows with index names like:
- `idx_contacts_created_at`
- `idx_orders_contact_id`
- `idx_ad_performance_date`
- etc.

### Step 5: Verify Materialized View

Run this query in SQL Editor:

```sql
SELECT COUNT(*) as wisdom_contacts_count 
FROM wisdom_contacts;
```

**Expected result:** A number between 60-70 (depending on your data)

If you see an error like "relation wisdom_contacts does not exist", go back to Step 3.

### Step 6: Test Performance Improvements

1. Open your dashboard: https://wisdomdash-deft9arhdvcz.manus.space

2. Open browser DevTools (F12) → Network tab

3. Refresh the Overview page

4. Check the timing for `/api/trpc/overview.metrics` request

5. **Before optimization:** 3-5 seconds
6. **After optimization:** 0.5-1 second ✅

7. Try changing date filters (TODAY → 7 DAYS → 30 DAYS)

8. Each filter change should be < 500ms (was 2-4 seconds before)

## 🔄 Materialized View Refresh (Important!)

The `wisdom_contacts` materialized view needs to be refreshed periodically to stay up-to-date with new data.

### Option A: Manual Refresh (Recommended for now)

Run this query in SQL Editor once per day:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
```

### Option B: Automated Refresh with pg_cron

If you want automatic refresh every 30 minutes, run this once:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule refresh every 30 minutes
SELECT cron.schedule(
  'refresh-wisdom-contacts', 
  '*/30 * * * *', 
  'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts'
);
```

To check scheduled jobs:

```sql
SELECT * FROM cron.job;
```

To remove the scheduled job:

```sql
SELECT cron.unschedule('refresh-wisdom-contacts');
```

## 🐛 Troubleshooting

### Error: "extension pg_trgm does not exist"

**Solution:**

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Then re-run the indexes migration.

### Error: "column does not exist"

**Cause:** Table schema doesn't match expected structure.

**Solution:**

1. Check table names in Supabase (Tables tab in left sidebar)
2. Verify column names match (e.g., `created_at`, not `createdAt`)
3. If different, edit the migration SQL to match your schema

### Error: "relation already exists"

**This is normal!** The migrations use `IF NOT EXISTS`, so they're safe to run multiple times. If you see this error, it means the index or view already exists.

### Slow Index Creation

**Normal behavior** for large tables. If it takes > 10 minutes:

1. Check table size:

```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY bytes DESC;
```

2. If tables are > 10GB, consider creating indexes one at a time

### Dashboard Still Slow After Migration

1. **Check if indexes were created:**

```sql
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public' AND indexname LIKE 'idx_%';
```

Should return 28.

2. **Check if materialized view exists:**

```sql
SELECT COUNT(*) FROM wisdom_contacts;
```

Should return 60-70.

3. **Refresh materialized view:**

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
```

4. **Clear browser cache** and refresh dashboard

5. **Check index usage** (after a few hours of dashboard usage):

```sql
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan as scans
FROM pg_stat_user_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY idx_scan DESC 
LIMIT 20;
```

If `idx_scan` is 0 for all indexes, they're not being used. This could mean:
- Queries aren't using the indexed columns
- Query planner chose a different strategy
- Table is too small for indexes to help

## 📈 Expected Performance Metrics

### Before Optimization

| Operation | Time |
|-----------|------|
| Overview Page Load | 3-5 seconds |
| Daily Analysis Load | 5-8 seconds |
| Date Filter Change | 2-4 seconds |
| Wisdom Filter Query | 500-1000ms |

### After Optimization

| Operation | Time | Improvement |
|-----------|------|-------------|
| Overview Page Load | 0.5-1 second | **5-10x faster** ✅ |
| Daily Analysis Load | 1-2 seconds | **3-5x faster** ✅ |
| Date Filter Change | 0.3-0.5 seconds | **5-10x faster** ✅ |
| Wisdom Filter Query | 50-100ms | **10-50x faster** ✅ |

## 🎯 Success Checklist

- [ ] Opened Supabase SQL Editor
- [ ] Executed `002_performance_indexes.sql` (28 indexes created)
- [ ] Executed `003_materialized_views.sql` (wisdom_contacts view created)
- [ ] Verified indexes with verification query (28 rows returned)
- [ ] Verified materialized view with verification query (60-70 count)
- [ ] Tested dashboard performance (Overview page < 1 second)
- [ ] Set up materialized view refresh (manual or automated)

## 📚 Additional Resources

- **Full Migration Details**: `migrations/README.md`
- **Quick Start Guide**: `PERFORMANCE_OPTIMIZATION_GUIDE.md`
- **PostgreSQL Index Documentation**: https://www.postgresql.org/docs/current/indexes.html
- **Supabase SQL Editor Guide**: https://supabase.com/docs/guides/database/overview
- **pg_cron Documentation**: https://github.com/citusdata/pg_cron

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs (Logs tab in left sidebar)
2. Verify table/column names match your schema
3. Test queries individually to isolate problems
4. Review PostgreSQL error messages carefully
5. Contact Supabase support for database-specific issues

---

**Last Updated:** December 13, 2025  
**Project:** 31-Day Wisdom Challenge Analytics Dashboard  
**Database:** Supabase PostgreSQL (sumibccxhppkpejrurjt)
