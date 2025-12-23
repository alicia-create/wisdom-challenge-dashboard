-- ============================================
-- SIMPLIFY WISDOM_CONTACTS MATERIALIZED VIEW
-- Date: 2025-12-21
-- Purpose: Remove redundant filter, use only '%wisdom%'
-- ============================================

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS wisdom_contacts CASCADE;

-- Create simplified materialized view
-- Only filter by '%wisdom%' in comment field
CREATE MATERIALIZED VIEW wisdom_contacts AS
SELECT DISTINCT contact_id
FROM analytics_events
WHERE comment ILIKE '%wisdom%'
  AND contact_id IS NOT NULL;

-- Create unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX idx_wisdom_contacts_contact_id 
ON wisdom_contacts(contact_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check total count
SELECT COUNT(*) as total_wisdom_contacts FROM wisdom_contacts;

-- Compare with old logic (should be same or very close)
SELECT COUNT(DISTINCT contact_id) as old_logic_count
FROM analytics_events
WHERE (comment ILIKE '%wisdom%' OR comment ILIKE '%31daywisdomchallenge%')
  AND contact_id IS NOT NULL;

-- ============================================
-- REFRESH INSTRUCTIONS
-- ============================================

-- To refresh the view after data changes:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_contacts;

-- ============================================
-- NOTES
-- ============================================

-- Simplified from:
--   WHERE (comment ILIKE '%wisdom%' OR comment ILIKE '%31daywisdomchallenge%')
-- To:
--   WHERE comment ILIKE '%wisdom%'
--
-- Reason: '%31daywisdomchallenge%' is already captured by '%wisdom%'
-- This simplifies the query and improves performance slightly
