# Database Performance Optimization

This directory contains SQL migration scripts for optimizing database performance.

## Migration: 002_performance_indexes.sql

**Purpose:** Add indexes to frequently queried columns to improve dashboard performance.

**Impact:** 
- Reduces query time for date range filters (TODAY, YESTERDAY, 7/14/30 DAYS)
- Speeds up JOIN operations between contacts, orders, and analytics_events
- Optimizes ILIKE searches on campaign_name using trigram indexes
- Improves performance for wisdom funnel filtering

**Indexes Created:** 28 indexes across 7 tables

### How to Apply (Supabase)

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Copy and Paste:**
   - Open `002_performance_indexes.sql`
   - Copy the entire SQL script
   - Paste into the Supabase SQL Editor

3. **Execute:**
   - Click **Run** button (or press Cmd/Ctrl + Enter)
   - Wait for execution to complete (~30-60 seconds)
   - Check for any errors in the output panel

4. **Verify:**
   - Run this query to see all created indexes:
   ```sql
   SELECT schemaname, tablename, indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   ORDER BY tablename, indexname;
   ```

5. **Monitor Performance:**
   - After a few hours of usage, check index usage statistics:
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
   FROM pg_stat_user_indexes 
   WHERE schemaname = 'public' 
   ORDER BY idx_scan DESC 
   LIMIT 20;
   ```

### Expected Performance Improvements

**Before Indexes:**
- Overview page load: ~3-5 seconds
- Daily Analysis page load: ~5-8 seconds
- Date filter changes: ~2-4 seconds

**After Indexes:**
- Overview page load: ~0.5-1 second (5-10x faster)
- Daily Analysis page load: ~1-2 seconds (3-5x faster)
- Date filter changes: ~0.3-0.5 seconds (5-10x faster)

### Tables Optimized

1. **contacts** - 3 indexes
   - `created_at` for date range queries
   - `manychat_id` for ManyChat bot users
   - Composite `(id, created_at)` for wisdom funnel queries

2. **orders** - 5 indexes
   - `created_at` for date range queries
   - `contact_id` for JOIN operations
   - `order_total` for VIP sales filtering
   - Composite indexes for VIP and high-ticket queries

3. **ad_performance** - 7 indexes
   - `date` for date range queries
   - `platform` for Meta/Google filtering
   - Trigram index for `campaign_name` ILIKE searches
   - Campaign hierarchy indexes (`campaign_id`, `adset_id`, `ad_id`)

4. **analytics_events** - 6 indexes
   - `contact_id` for JOIN operations
   - `name` for event type filtering
   - `funnel` for wisdom challenge filtering
   - Trigram indexes for `comment` and `value` searches

5. **order_items** - 3 indexes
   - `product_id` for Kingdom Seeker Trials
   - `order_id` for JOIN operations
   - Composite index for product filtering

6. **products** - 1 index
   - `name` for product search

7. **workflow_errors** - 3 indexes
   - `workflow_name` for filtering
   - `error_timestamp` for date queries
   - Composite index for workflow error queries

### Notes

- All indexes use `IF NOT EXISTS` so the script is safe to run multiple times
- Indexes are created in the background and won't block queries
- The `pg_trgm` extension is required for trigram indexes (automatically enabled)
- Statistics are updated with `ANALYZE` commands at the end

### Troubleshooting

**Error: "extension pg_trgm does not exist"**
- Run: `CREATE EXTENSION IF NOT EXISTS pg_trgm;`
- This should be included in the script, but if it fails, run it separately first

**Error: "column does not exist"**
- Verify table schema matches expected structure
- Check if column names are correct (case-sensitive)

**Slow index creation**
- Large tables may take several minutes to index
- Don't interrupt the process
- Monitor progress in Supabase logs

### Rollback

To remove all indexes created by this migration:

```sql
-- Drop all performance indexes
DROP INDEX IF EXISTS idx_contacts_created_at;
DROP INDEX IF EXISTS idx_contacts_manychat_id;
DROP INDEX IF EXISTS idx_contacts_id_created_at;
DROP INDEX IF EXISTS idx_orders_created_at;
DROP INDEX IF EXISTS idx_orders_contact_id;
DROP INDEX IF EXISTS idx_orders_order_total;
DROP INDEX IF EXISTS idx_orders_contact_order_total_date;
DROP INDEX IF EXISTS idx_orders_high_ticket;
DROP INDEX IF EXISTS idx_ad_performance_date;
DROP INDEX IF EXISTS idx_ad_performance_platform;
DROP INDEX IF EXISTS idx_ad_performance_campaign_name_trgm;
DROP INDEX IF EXISTS idx_ad_performance_platform_date;
DROP INDEX IF EXISTS idx_ad_performance_campaign_id;
DROP INDEX IF EXISTS idx_ad_performance_adset_id;
DROP INDEX IF EXISTS idx_ad_performance_ad_id;
DROP INDEX IF EXISTS idx_analytics_events_contact_id;
DROP INDEX IF EXISTS idx_analytics_events_name;
DROP INDEX IF EXISTS idx_analytics_events_funnel;
DROP INDEX IF EXISTS idx_analytics_events_contact_timestamp;
DROP INDEX IF EXISTS idx_analytics_events_comment_trgm;
DROP INDEX IF EXISTS idx_analytics_events_value_trgm;
DROP INDEX IF EXISTS idx_order_items_product_id;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_order;
DROP INDEX IF EXISTS idx_products_name;
DROP INDEX IF EXISTS idx_workflow_errors_workflow_name;
DROP INDEX IF EXISTS idx_workflow_errors_timestamp;
DROP INDEX IF EXISTS idx_workflow_errors_workflow_timestamp;
```

## Future Optimizations

Consider these additional optimizations if needed:

1. **Materialized Views** - Pre-compute daily aggregations
2. **Partitioning** - Partition large tables by date
3. **Connection Pooling** - Use Supabase connection pooler
4. **Query Caching** - Implement Redis caching layer
5. **Edge Functions** - Move complex aggregations to Supabase Edge Functions
