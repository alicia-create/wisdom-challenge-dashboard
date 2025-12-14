-- Materialized Views for Performance Optimization
-- Created: 2025-12-13
-- Purpose: Pre-compute expensive aggregations for faster queries

-- ============================================
-- WISDOM FUNNEL CONTACTS (Most Frequently Used)
-- ============================================

-- Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS wisdom_contacts CASCADE;

-- Create materialized view for wisdom funnel contacts
-- This view is used in almost every dashboard query
-- Matches the logic in server/wisdom-filter.ts
CREATE MATERIALIZED VIEW wisdom_contacts AS
SELECT DISTINCT contact_id
FROM analytics_events
WHERE (comment ILIKE '%wisdom%' OR comment ILIKE '%31daywisdomchallenge%')
  AND contact_id IS NOT NULL;

-- Create index on the materialized view
CREATE UNIQUE INDEX idx_wisdom_contacts_contact_id 
ON wisdom_contacts(contact_id);

-- ============================================
-- DAILY AGGREGATIONS (Optional - Consider if queries are still slow)
-- ============================================

-- Uncomment this section if daily queries are still slow after indexes

/*
DROP MATERIALIZED VIEW IF EXISTS daily_wisdom_metrics CASCADE;

CREATE MATERIALIZED VIEW daily_wisdom_metrics AS
WITH wisdom_contacts_cte AS (
  SELECT contact_id FROM wisdom_contacts
),
daily_leads AS (
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_leads
  FROM contacts
  WHERE id IN (SELECT contact_id FROM wisdom_contacts_cte)
  GROUP BY DATE(created_at)
),
daily_orders AS (
  SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN order_total >= 31 THEN 1 END) as vip_sales,
    SUM(order_total) as total_revenue,
    SUM(CASE WHEN order_total >= 31 THEN order_total ELSE 0 END) as vip_revenue
  FROM orders
  WHERE contact_id IN (SELECT contact_id FROM wisdom_contacts_cte)
  GROUP BY DATE(created_at)
),
daily_ad_spend AS (
  SELECT 
    date,
    SUM(CASE WHEN platform ILIKE 'meta' THEN spend ELSE 0 END) as meta_spend,
    SUM(CASE WHEN platform ILIKE 'google' THEN spend ELSE 0 END) as google_spend,
    SUM(spend) as total_spend
  FROM ad_performance
  WHERE campaign_name ILIKE '%31DWC2026%'
  GROUP BY date
)
SELECT 
  COALESCE(l.date, o.date, a.date) as date,
  COALESCE(l.total_leads, 0) as total_leads,
  COALESCE(o.total_orders, 0) as total_orders,
  COALESCE(o.vip_sales, 0) as vip_sales,
  COALESCE(o.total_revenue, 0) as total_revenue,
  COALESCE(o.vip_revenue, 0) as vip_revenue,
  COALESCE(a.meta_spend, 0) as meta_spend,
  COALESCE(a.google_spend, 0) as google_spend,
  COALESCE(a.total_spend, 0) as total_spend
FROM daily_leads l
FULL OUTER JOIN daily_orders o ON l.date = o.date
FULL OUTER JOIN daily_ad_spend a ON COALESCE(l.date, o.date) = a.date
ORDER BY date DESC;

-- Create indexes on the materialized view
CREATE INDEX idx_daily_wisdom_metrics_date 
ON daily_wisdom_metrics(date DESC);
*/

-- ============================================
-- REFRESH STRATEGY
-- ============================================

-- Manual refresh (run this after data updates):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
-- REFRESH MATERIALIZED VIEW CONCURRENTLY daily_wisdom_metrics;

-- Automatic refresh with cron (requires pg_cron extension):
-- SELECT cron.schedule('refresh-wisdom-contacts', '*/30 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts');
-- SELECT cron.schedule('refresh-daily-metrics', '0 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY daily_wisdom_metrics');

-- ============================================
-- VERIFICATION
-- ============================================

-- Check materialized view contents
-- SELECT COUNT(*) FROM wisdom_contacts;

-- Check if materialized view is being used
-- EXPLAIN ANALYZE SELECT * FROM wisdom_contacts WHERE contact_id = 123;

-- ============================================
-- NOTES
-- ============================================

-- 1. Materialized views need to be refreshed periodically to stay up-to-date
-- 2. Use CONCURRENTLY to avoid blocking queries during refresh
-- 3. CONCURRENTLY requires a UNIQUE index on the view
-- 4. Consider automating refresh with pg_cron or application-level scheduling
-- 5. Monitor view size and refresh time to ensure it's worth the trade-off

-- ============================================
-- USAGE IN APPLICATION
-- ============================================

-- Replace this pattern:
-- const { data } = await supabase
--   .from('analytics_events')
--   .select('contact_id')
--   .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');
-- const wisdomContactIds = data.map(e => e.contact_id);

-- With this pattern:
-- const { data } = await supabase
--   .from('wisdom_contacts')
--   .select('contact_id');
-- const wisdomContactIds = data.map(e => e.contact_id);

-- Performance improvement: ~10-50x faster depending on analytics_events table size
