-- Refresh Materialized View to Remove Orphaned Contacts
-- Created: 2025-12-13
-- Purpose: Remove 5 orphaned contacts (393, 362, 360, 383, 384) that no longer have events

-- ============================================
-- ISSUE DESCRIPTION
-- ============================================

-- Problem: Materialized view has 5 contacts that no longer have any analytics_events:
--   - Contact IDs: 393, 362, 360, 383, 384
--   - These contacts were included when the view was created
--   - Their events were deleted from analytics_events after view creation
--   - View was never refreshed, so orphaned contacts remain

-- Verification Query (before refresh):
-- SELECT COUNT(*) FROM wisdom_contacts;  -- Returns: 64
-- 
-- SELECT contact_id FROM wisdom_contacts 
-- WHERE contact_id IN (393, 362, 360, 383, 384);  -- Returns: 5 rows
--
-- SELECT contact_id FROM analytics_events 
-- WHERE contact_id IN (393, 362, 360, 383, 384);  -- Returns: 0 rows (orphaned!)

-- ============================================
-- SOLUTION: REFRESH MATERIALIZED VIEW
-- ============================================

-- Refresh the materialized view to sync with current analytics_events data
-- CONCURRENTLY option allows queries to continue during refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;

-- ============================================
-- VERIFICATION (after refresh)
-- ============================================

-- Check new count (should be 59 instead of 64)
SELECT COUNT(*) as total_contacts FROM wisdom_contacts;

-- Verify orphaned contacts are gone
SELECT contact_id FROM wisdom_contacts 
WHERE contact_id IN (393, 362, 360, 383, 384);
-- Expected: 0 rows

-- Verify all remaining contacts have events
SELECT 
  wc.contact_id,
  COUNT(ae.id) as event_count
FROM wisdom_contacts wc
LEFT JOIN analytics_events ae ON ae.contact_id = wc.contact_id
GROUP BY wc.contact_id
HAVING COUNT(ae.id) = 0;
-- Expected: 0 rows (no orphaned contacts)

-- ============================================
-- SAMPLE REMAINING CONTACTS
-- ============================================

-- Show sample of valid wisdom contacts
SELECT 
  wc.contact_id,
  COUNT(ae.id) as event_count,
  MIN(ae.comment) as sample_comment
FROM wisdom_contacts wc
JOIN analytics_events ae ON ae.contact_id = wc.contact_id
GROUP BY wc.contact_id
ORDER BY event_count DESC
LIMIT 10;

-- ============================================
-- NOTES
-- ============================================

-- 1. This refresh should be run periodically to keep the view up-to-date
-- 2. Recommended: Set up automatic refresh with pg_cron (see 003_materialized_views.sql)
-- 3. Manual refresh command: REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;
-- 4. CONCURRENTLY requires UNIQUE index (already created: idx_wisdom_contacts_contact_id)

-- ============================================
-- EXPECTED RESULTS
-- ============================================

-- Before Refresh:
--   - wisdom_contacts: 64 contacts
--   - Direct query: 59 contacts
--   - Orphaned: 5 contacts (393, 362, 360, 383, 384)

-- After Refresh:
--   - wisdom_contacts: 59 contacts
--   - Direct query: 59 contacts
--   - Orphaned: 0 contacts
--   - Perfect match! ✅
