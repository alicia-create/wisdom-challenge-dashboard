-- ============================================================================
-- ADD EXTRA JOURNALS (Order Bump) back to get_dashboard_metrics function
-- Execute this SQL directly in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Add variable declarations (after line 17, in the "-- Paid funnel" section)
-- Add these two lines after "v_paid_welcome_clicks INT;":

    v_paid_extra_journals INT;

-- And after line 24 (in the "-- Organic funnel" section), add:

    v_organic_extra_journals INT;


-- STEP 2: Add queries to fetch Extra Journals data
-- Add this section after the "SECTION 3: KINGDOM SEEKERS" section (around line 237):

    -- ========================================================================
    -- SECTION 3.5: EXTRA JOURNALS (Order Bump - product_id = 2)
    -- ========================================================================
    
    -- PAID Extra Journals
    SELECT COUNT(DISTINCT o.id)
    INTO v_paid_extra_journals
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 2
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
      );
    
    -- ORGANIC Extra Journals
    SELECT COUNT(DISTINCT o.id)
    INTO v_organic_extra_journals
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 2
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdomchallenge.com%'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
      );


-- STEP 3: Add extraJournals to paidAdsFunnel JSON (line 640)
-- Find the line with "'leads', v_paid_leads," and add this line after 'wisdomSales':

            'extraJournals', v_paid_extra_journals,

-- So it looks like:
--         'paidAdsFunnel', jsonb_build_object(
--             'leads', v_paid_leads,
--             'wisdomSales', v_paid_wisdom_sales,
--             'extraJournals', v_paid_extra_journals,
--             'kingdomSeekers', v_paid_kingdom_seekers,
--             ...


-- STEP 4: Add extraJournals to organicFunnel JSON (line 651)
-- Find the line with "'leads', v_organic_leads," and add this line after 'wisdomSales':

            'extraJournals', v_organic_extra_journals,

-- So it looks like:
--         'organicFunnel', jsonb_build_object(
--             'leads', v_organic_leads,
--             'wisdomSales', v_organic_wisdom_sales,
--             'extraJournals', v_organic_extra_journals,
--             'kingdomSeekers', v_organic_kingdom_seekers,
--             ...


-- ============================================================================
-- SUMMARY OF CHANGES:
-- 1. Added v_paid_extra_journals variable declaration
-- 2. Added v_organic_extra_journals variable declaration
-- 3. Added queries to count Extra Journals (product_id = 2) for paid and organic funnels
-- 4. Added 'extraJournals' field to paidAdsFunnel JSON output
-- 5. Added 'extraJournals' field to organicFunnel JSON output
-- ============================================================================
