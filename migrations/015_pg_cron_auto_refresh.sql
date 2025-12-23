-- ============================================================================
-- Migration 015: Configure pg_cron for automatic materialized view refresh
-- ============================================================================
-- AUTO-REFRESH: wisdom_lead_classification every 30 minutes
-- AUTO-REFRESH: wisdom_engagement_events every 30 minutes
-- ============================================================================

-- Step 1: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule wisdom_lead_classification refresh every 30 minutes
-- This materialized view classifies leads as paid/organic based on form submissions
SELECT cron.schedule(
    'refresh-wisdom-lead-classification',
    '*/30 * * * *',  -- Every 30 minutes
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_lead_classification$$
);

-- Step 3: Schedule wisdom_engagement_events refresh every 30 minutes
-- This materialized view pre-aggregates bot subscriptions, email clicks, and VSL views
SELECT cron.schedule(
    'refresh-wisdom-engagement-events',
    '*/30 * * * *',  -- Every 30 minutes
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_engagement_events$$
);

-- Step 4: Verify scheduled jobs
SELECT jobid, schedule, command 
FROM cron.job 
WHERE jobname IN ('refresh-wisdom-lead-classification', 'refresh-wisdom-engagement-events');

-- ============================================================================
-- NOTES:
-- - pg_cron runs in UTC timezone
-- - CONCURRENTLY allows reads during refresh (requires unique index)
-- - Both materialized views already have appropriate indexes from previous migrations
-- - To manually trigger: REFRESH MATERIALIZED VIEW CONCURRENTLY <view_name>
-- - To check job history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
-- ============================================================================
