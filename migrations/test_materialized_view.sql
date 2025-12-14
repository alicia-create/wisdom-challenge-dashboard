-- Test Materialized View Creation (Corrected Schema)
-- This file tests the wisdom_contacts materialized view with correct column names

-- Step 1: Drop existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS wisdom_contacts CASCADE;

-- Step 2: Create materialized view with correct wisdom filter logic
-- Matches the logic in server/wisdom-filter.ts
CREATE MATERIALIZED VIEW wisdom_contacts AS
SELECT DISTINCT contact_id
FROM analytics_events
WHERE (comment ILIKE '%wisdom%' OR comment ILIKE '%31daywisdomchallenge%')
  AND contact_id IS NOT NULL;

-- Step 3: Create unique index (required for CONCURRENTLY refresh)
CREATE UNIQUE INDEX idx_wisdom_contacts_contact_id 
ON wisdom_contacts(contact_id);

-- Step 4: Verify materialized view was created
SELECT COUNT(*) as wisdom_contacts_count 
FROM wisdom_contacts;

-- Step 5: Sample some contact IDs
SELECT contact_id 
FROM wisdom_contacts 
LIMIT 10;

-- Step 6: Check if index is being used
EXPLAIN ANALYZE 
SELECT * FROM wisdom_contacts 
WHERE contact_id = (SELECT contact_id FROM wisdom_contacts LIMIT 1);

-- Step 7: Compare performance with original query
-- Original query (slow):
EXPLAIN ANALYZE
SELECT DISTINCT contact_id
FROM analytics_events
WHERE (comment ILIKE '%wisdom%' OR comment ILIKE '%31daywisdomchallenge%')
  AND contact_id IS NOT NULL
LIMIT 100;

-- Materialized view query (fast):
EXPLAIN ANALYZE
SELECT contact_id
FROM wisdom_contacts
LIMIT 100;

-- Expected result: Materialized view should be 10-50x faster
