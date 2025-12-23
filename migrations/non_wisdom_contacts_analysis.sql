-- ============================================
-- NON-WISDOM CONTACTS ANALYSIS QUERIES
-- Run these in Supabase SQL Editor to investigate the 23k non-Wisdom contacts
-- ============================================

-- QUERY 1: Overview - Total counts
-- Quick summary of contact distribution
SELECT 
  (SELECT COUNT(*) FROM contacts) as total_contacts,
  (SELECT COUNT(*) FROM wisdom_contacts) as wisdom_contacts,
  (SELECT COUNT(*) FROM contacts) - (SELECT COUNT(*) FROM wisdom_contacts) as non_wisdom_contacts,
  (SELECT COUNT(*) FROM contacts WHERE NOT EXISTS (
    SELECT 1 FROM analytics_events WHERE contact_id = contacts.id
  )) as contacts_without_events;


-- QUERY 2: Non-Wisdom contacts with basic info
-- Export this to CSV to analyze in Excel/Sheets
SELECT 
  c.id,
  c.email,
  c.full_name,
  c.phone,
  c.created_at,
  c.clickfunnels_contact_id,
  c.keap_contact_id,
  c.manychat_id,
  -- Count how many events this contact has
  (SELECT COUNT(*) FROM analytics_events WHERE contact_id = c.id) as event_count,
  -- Get the most recent event name
  (SELECT name FROM analytics_events WHERE contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_event_name,
  -- Get the most recent event date
  (SELECT timestamp FROM analytics_events WHERE contact_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_event_date
FROM contacts c
WHERE c.id NOT IN (SELECT contact_id FROM wisdom_contacts)
ORDER BY c.created_at DESC
LIMIT 1000; -- Adjust limit as needed (max 1000 for performance)


-- QUERY 3: Non-Wisdom contacts by creation date
-- See when these contacts were created
SELECT 
  DATE(created_at) as creation_date,
  COUNT(*) as contact_count,
  -- Sample emails from that date
  STRING_AGG(email, ', ') FILTER (WHERE email IS NOT NULL) as sample_emails
FROM contacts
WHERE id NOT IN (SELECT contact_id FROM wisdom_contacts)
GROUP BY DATE(created_at)
ORDER BY contact_count DESC
LIMIT 50;


-- QUERY 4: Top event names for non-Wisdom contacts
-- What events are these contacts triggering?
SELECT 
  ae.name as event_name,
  COUNT(DISTINCT ae.contact_id) as unique_contacts,
  COUNT(*) as total_events,
  -- Sample contact IDs
  STRING_AGG(DISTINCT ae.contact_id::text, ', ') as sample_contact_ids
FROM analytics_events ae
WHERE ae.contact_id NOT IN (SELECT contact_id FROM wisdom_contacts)
GROUP BY ae.name
ORDER BY unique_contacts DESC
LIMIT 30;


-- QUERY 5: Contacts with NO events at all
-- These might be orphaned/test contacts
SELECT 
  c.id,
  c.email,
  c.full_name,
  c.created_at,
  c.clickfunnels_contact_id,
  c.keap_contact_id
FROM contacts c
WHERE NOT EXISTS (
  SELECT 1 FROM analytics_events WHERE contact_id = c.id
)
ORDER BY c.created_at DESC
LIMIT 500;


-- QUERY 6: Non-Wisdom contacts by source
-- Understand where they came from (CF vs Keap vs Both vs Neither)
SELECT 
  CASE 
    WHEN clickfunnels_contact_id IS NOT NULL AND keap_contact_id IS NOT NULL THEN 'Both CF + Keap'
    WHEN clickfunnels_contact_id IS NOT NULL THEN 'ClickFunnels Only'
    WHEN keap_contact_id IS NOT NULL THEN 'Keap Only'
    ELSE 'Neither (Orphaned)'
  END as source,
  COUNT(*) as contact_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM contacts
WHERE id NOT IN (SELECT contact_id FROM wisdom_contacts)
GROUP BY 
  CASE 
    WHEN clickfunnels_contact_id IS NOT NULL AND keap_contact_id IS NOT NULL THEN 'Both CF + Keap'
    WHEN clickfunnels_contact_id IS NOT NULL THEN 'ClickFunnels Only'
    WHEN keap_contact_id IS NOT NULL THEN 'Keap Only'
    ELSE 'Neither (Orphaned)'
  END
ORDER BY contact_count DESC;


-- QUERY 7: Sample non-Wisdom contacts with their recent events
-- Deep dive into 20 random non-Wisdom contacts
WITH non_wisdom_sample AS (
  SELECT id, email, full_name, created_at
  FROM contacts
  WHERE id NOT IN (SELECT contact_id FROM wisdom_contacts)
  ORDER BY RANDOM()
  LIMIT 20
)
SELECT 
  nws.id,
  nws.email,
  nws.full_name,
  nws.created_at as contact_created,
  ae.name as event_name,
  ae.comment as event_comment,
  ae.timestamp as event_timestamp
FROM non_wisdom_sample nws
LEFT JOIN analytics_events ae ON ae.contact_id = nws.id
ORDER BY nws.id, ae.timestamp DESC;


-- QUERY 8: Non-Wisdom contacts created BEFORE Wisdom Challenge started
-- Wisdom Challenge started Dec 13, 2024
SELECT 
  COUNT(*) as contacts_before_wisdom,
  ROUND(COUNT(*) * 100.0 / (
    SELECT COUNT(*) FROM contacts WHERE id NOT IN (SELECT contact_id FROM wisdom_contacts)
  ), 2) as percentage_of_non_wisdom
FROM contacts
WHERE id NOT IN (SELECT contact_id FROM wisdom_contacts)
AND created_at < '2024-12-13 00:00:00';


-- QUERY 9: Non-Wisdom contacts created AFTER Wisdom Challenge started
-- These are suspicious - why aren't they in Wisdom funnel?
SELECT 
  c.id,
  c.email,
  c.full_name,
  c.created_at,
  c.clickfunnels_contact_id,
  c.keap_contact_id,
  (SELECT COUNT(*) FROM analytics_events WHERE contact_id = c.id) as event_count,
  (SELECT STRING_AGG(DISTINCT name, ', ') FROM analytics_events WHERE contact_id = c.id) as event_names
FROM contacts c
WHERE c.id NOT IN (SELECT contact_id FROM wisdom_contacts)
AND c.created_at >= '2024-12-13 00:00:00'
ORDER BY c.created_at DESC
LIMIT 100;


-- QUERY 10: Event comment patterns for non-Wisdom contacts
-- Check if there are specific domains/URLs in event comments
SELECT 
  CASE 
    WHEN ae.comment ILIKE '%31daywisdom%' THEN '31daywisdom.com (Ads)'
    WHEN ae.comment ILIKE '%31daywisdomchallenge%' THEN '31daywisdomchallenge.com (Organic)'
    WHEN ae.comment ILIKE '%kingdomseeker%' THEN 'Kingdom Seeker'
    WHEN ae.comment ILIKE '%journal%' THEN 'Journal'
    WHEN ae.comment IS NULL THEN 'No comment'
    ELSE 'Other'
  END as comment_category,
  COUNT(DISTINCT ae.contact_id) as unique_contacts,
  COUNT(*) as total_events
FROM analytics_events ae
WHERE ae.contact_id NOT IN (SELECT contact_id FROM wisdom_contacts)
GROUP BY 
  CASE 
    WHEN ae.comment ILIKE '%31daywisdom%' THEN '31daywisdom.com (Ads)'
    WHEN ae.comment ILIKE '%31daywisdomchallenge%' THEN '31daywisdomchallenge.com (Organic)'
    WHEN ae.comment ILIKE '%kingdomseeker%' THEN 'Kingdom Seeker'
    WHEN ae.comment ILIKE '%journal%' THEN 'Journal'
    WHEN ae.comment IS NULL THEN 'No comment'
    ELSE 'Other'
  END
ORDER BY unique_contacts DESC;


-- ============================================
-- RECOMMENDED WORKFLOW:
-- ============================================
-- 1. Run QUERY 1 first to get overview
-- 2. Run QUERY 6 to understand source distribution
-- 3. Run QUERY 8 to see how many are pre-Wisdom
-- 4. Run QUERY 2 and export to CSV for detailed analysis
-- 5. Run QUERY 4 to see what events they're triggering
-- 6. Run QUERY 9 to investigate suspicious recent contacts
-- ============================================
