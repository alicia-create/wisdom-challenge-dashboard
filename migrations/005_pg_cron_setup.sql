-- Automated Materialized View Refresh with pg_cron
-- Created: 2025-12-13
-- Purpose: Configure pg_cron to automatically refresh wisdom_contacts view every 30 minutes

-- ============================================
-- STEP 1: ENABLE PG_CRON EXTENSION
-- ============================================

-- Enable pg_cron extension (if not already enabled)
-- Note: In Supabase, pg_cron is pre-installed but needs to be enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- STEP 2: VERIFY PG_CRON IS WORKING
-- ============================================

-- Check if pg_cron is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Expected: 1 row showing pg_cron extension

-- Check existing cron jobs
SELECT * FROM cron.job;
-- Expected: Empty table (no jobs yet) or existing jobs

-- ============================================
-- STEP 3: CREATE CRON JOB
-- ============================================

-- Schedule refresh every 30 minutes
-- Syntax: cron.schedule(job_name, schedule, command)
-- Schedule format: Cron expression (minute hour day month weekday)
-- */30 * * * * = Every 30 minutes

SELECT cron.schedule(
  'refresh_wisdom_contacts',           -- Job name
  '*/30 * * * *',                      -- Every 30 minutes
  'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;'  -- Command to run
);

-- ============================================
-- STEP 4: VERIFY JOB WAS CREATED
-- ============================================

-- List all cron jobs
SELECT 
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'refresh_wisdom_contacts';

-- Expected output:
-- jobid | jobname                    | schedule      | command                                                  | active
-- ------|----------------------------|---------------|----------------------------------------------------------|-------
-- 1     | refresh_wisdom_contacts    | */30 * * * *  | REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts; | t

-- ============================================
-- STEP 5: MONITOR JOB EXECUTION
-- ============================================

-- View job run history (last 10 runs)
SELECT 
  runid,
  jobid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_wisdom_contacts')
ORDER BY start_time DESC
LIMIT 10;

-- Check for failed runs
SELECT 
  runid,
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh_wisdom_contacts')
  AND status = 'failed'
ORDER BY start_time DESC;

-- ============================================
-- STEP 6: MANUAL REFRESH (IF NEEDED)
-- ============================================

-- If you need to refresh immediately (don't wait for next scheduled run):
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;

-- ============================================
-- STEP 7: UPDATE OR DELETE JOB (IF NEEDED)
-- ============================================

-- Change schedule to every hour (instead of 30 minutes):
-- SELECT cron.schedule(
--   'refresh_wisdom_contacts',
--   '0 * * * *',  -- Every hour at minute 0
--   'REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;'
-- );

-- Unschedule (delete) the job:
-- SELECT cron.unschedule('refresh_wisdom_contacts');

-- Disable job without deleting:
-- UPDATE cron.job SET active = false WHERE jobname = 'refresh_wisdom_contacts';

-- Re-enable job:
-- UPDATE cron.job SET active = true WHERE jobname = 'refresh_wisdom_contacts';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Problem: pg_cron extension not found
-- Solution: Contact Supabase support or enable via Supabase Dashboard → Database → Extensions

-- Problem: Permission denied to create cron job
-- Solution: Ensure you're connected as postgres user or have sufficient privileges

-- Problem: Job runs but view doesn't update
-- Solution: Check cron.job_run_details for error messages
-- SELECT return_message FROM cron.job_run_details WHERE status = 'failed';

-- Problem: Job not running at scheduled time
-- Solution: Verify timezone settings
-- SHOW timezone;  -- Should match your expected timezone

-- ============================================
-- BEST PRACTICES
-- ============================================

-- 1. Monitor job execution regularly (check cron.job_run_details)
-- 2. Set up alerts for failed runs (optional)
-- 3. Adjust schedule based on data update frequency
-- 4. Use CONCURRENTLY to avoid blocking queries during refresh
-- 5. Ensure UNIQUE index exists (idx_wisdom_contacts_contact_id)

-- ============================================
-- EXPECTED BEHAVIOR
-- ============================================

-- After setup:
-- - wisdom_contacts view will refresh every 30 minutes
-- - New contacts from analytics_events will appear within 30 minutes
-- - Deleted contacts will be removed within 30 minutes
-- - Dashboard will always show data up to 30 minutes old
-- - No manual intervention required

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check when view was last refreshed
SELECT 
  schemaname,
  matviewname,
  matviewowner,
  tablespace,
  hasindexes,
  ispopulated,
  definition
FROM pg_matviews
WHERE matviewname = 'wisdom_contacts';

-- Compare view count vs direct query count
SELECT 
  (SELECT COUNT(*) FROM wisdom_contacts) as view_count,
  (SELECT COUNT(DISTINCT contact_id) FROM analytics_events 
   WHERE comment ILIKE '%wisdom%' 
      OR comment ILIKE '%31daywisdomchallenge%') as direct_count;
-- If counts match, view is up-to-date ✅

-- ============================================
-- NOTES
-- ============================================

-- 1. pg_cron runs in UTC timezone by default
-- 2. Schedule uses standard cron syntax (minute hour day month weekday)
-- 3. CONCURRENTLY requires UNIQUE index (already created in 003_materialized_views.sql)
-- 4. Job runs in the database where it was created
-- 5. Failed runs are logged in cron.job_run_details for debugging

-- ============================================
-- ALTERNATIVE: TRIGGER-BASED REFRESH
-- ============================================

-- If you prefer immediate updates instead of scheduled refresh,
-- you can create a trigger on analytics_events table:
-- (Not recommended for high-traffic tables due to performance impact)

-- CREATE OR REPLACE FUNCTION refresh_wisdom_contacts_trigger()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
--   RETURN NULL;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER wisdom_contacts_refresh
-- AFTER INSERT OR UPDATE OR DELETE ON analytics_events
-- FOR EACH STATEMENT
-- EXECUTE FUNCTION refresh_wisdom_contacts_trigger();

-- ============================================
-- SUCCESS CRITERIA
-- ============================================

-- ✅ pg_cron extension enabled
-- ✅ Cron job created with correct schedule
-- ✅ Job appears in cron.job table
-- ✅ Job runs successfully (check cron.job_run_details)
-- ✅ wisdom_contacts view updates every 30 minutes
-- ✅ Dashboard shows fresh data without manual refresh
