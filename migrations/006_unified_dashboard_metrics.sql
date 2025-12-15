-- ============================================================================
-- UNIFIED DASHBOARD METRICS SQL FUNCTION
-- ============================================================================
-- Purpose: Centralize all KPI calculations in a single SQL function to ensure
--          data consistency across all dashboard components (KPI cards, funnels,
--          charts, and tables).
--
-- Problem Solved: Previously, each dashboard component calculated metrics
--                 independently, leading to discrepancies like:
--                 - KPI Card Total Leads: 994
--                 - Paid Ads Funnel: 1,059 leads
--                 - Organic Funnel: 18 leads
--                 - Sum: 1,077 ≠ 994
--
-- Solution: This function calculates all metrics from a single source of truth
--           and returns them in a structured JSON format.
-- ============================================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_dashboard_metrics(DATE, DATE);

-- Create the unified metrics function
CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_total_leads INT;
    v_wisdom_sales INT;
    v_kingdom_seekers INT;
    v_manychat_connected INT;
    v_bot_alerts INT;
    v_paid_leads INT;
    v_paid_wisdom_sales INT;
    v_organic_leads INT;
    v_organic_wisdom_sales INT;
    v_total_spend NUMERIC;
    v_total_revenue NUMERIC;
    v_link_clicks INT;
    v_landing_page_views INT;
BEGIN
    -- ========================================================================
    -- STEP 1: Get all Wisdom contacts (source of truth for leads)
    -- Pattern: '%wisdom%' captures both 31daywisdom.com and 31daywisdomchallenge.com
    -- ========================================================================
    
    -- Total Leads (all wisdom contacts in date range)
    SELECT COUNT(DISTINCT c.id)
    INTO v_total_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 2: Separate Paid Ads vs Organic contacts (MUTUAL EXCLUSION)
    -- Paid Ads: 31daywisdom.com (takes precedence)
    -- Organic: 31daywisdomchallenge.com (only if NOT in paid)
    -- ========================================================================
    
    -- Paid Ads Leads (contacts with 31daywisdom.com events)
    SELECT COUNT(DISTINCT c.id)
    INTO v_paid_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%31daywisdom.com%'
      );
    
    -- Organic Leads (contacts with 31daywisdomchallenge.com but NOT 31daywisdom.com)
    SELECT COUNT(DISTINCT c.id)
    INTO v_organic_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%31daywisdomchallenge.com%'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name ILIKE '%31daywisdom.com%'
      );
    
    -- ========================================================================
    -- STEP 3: Wisdom+ Sales (orders >= $31 from wisdom contacts)
    -- ========================================================================
    
    -- Total Wisdom+ Sales
    SELECT COUNT(DISTINCT o.id)
    INTO v_wisdom_sales
    FROM orders o
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND o.order_total >= 31
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%wisdom%'
      );
    
    -- Paid Ads Wisdom+ Sales
    SELECT COUNT(DISTINCT o.id)
    INTO v_paid_wisdom_sales
    FROM orders o
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND o.order_total >= 31
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%31daywisdom.com%'
      );
    
    -- Organic Wisdom+ Sales (mutual exclusion)
    SELECT COUNT(DISTINCT o.id)
    INTO v_organic_wisdom_sales
    FROM orders o
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND o.order_total >= 31
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%31daywisdomchallenge.com%'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name ILIKE '%31daywisdom.com%'
      );
    
    -- ========================================================================
    -- STEP 4: Kingdom Seekers Trials (product_id = 8)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT o.id)
    INTO v_kingdom_seekers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 8;
    
    -- ========================================================================
    -- STEP 5: ManyChat Connected (contacts with manychat_id)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT c.id)
    INTO v_manychat_connected
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND c.manychat_id IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 6: Bot Alerts Subscribed (gold.ntn.request_accepted event)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.created_at >= p_start_date
      AND ae.created_at < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value ILIKE '%gold.ntn.request_accepted%';
    
    -- ========================================================================
    -- STEP 7: Ad Performance Metrics
    -- ========================================================================
    
    -- Total Ad Spend (Meta + Google)
    SELECT COALESCE(SUM(spend), 0)
    INTO v_total_spend
    FROM ad_performance
    WHERE date >= p_start_date
      AND date <= p_end_date;
    
    -- Link Clicks
    SELECT COALESCE(SUM(link_clicks), 0)
    INTO v_link_clicks
    FROM ad_performance
    WHERE date >= p_start_date
      AND date <= p_end_date;
    
    -- Landing Page Views (for Connect Rate calculation)
    SELECT COALESCE(SUM(
        CASE 
            WHEN link_clicks > 0 THEN link_clicks * landing_page_view_per_link_click
            ELSE 0
        END
    ), 0)
    INTO v_landing_page_views
    FROM ad_performance
    WHERE date >= p_start_date
      AND date <= p_end_date;
    
    -- ========================================================================
    -- STEP 8: Total Revenue
    -- ========================================================================
    
    SELECT COALESCE(SUM(o.order_total), 0)
    INTO v_total_revenue
    FROM orders o
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- BUILD RESULT JSON
    -- ========================================================================
    
    v_result := jsonb_build_object(
        'dateRange', jsonb_build_object(
            'startDate', p_start_date,
            'endDate', p_end_date
        ),
        'kpis', jsonb_build_object(
            'totalLeads', v_total_leads,
            'wisdomSales', v_wisdom_sales,
            'kingdomSeekerTrials', v_kingdom_seekers,
            'manychatConnected', v_manychat_connected,
            'botAlertsSubscribed', v_bot_alerts,
            'totalSpend', v_total_spend,
            'totalRevenue', v_total_revenue,
            'linkClicks', v_link_clicks,
            'landingPageViews', v_landing_page_views,
            'cpl', CASE WHEN v_total_leads > 0 THEN ROUND(v_total_spend / v_total_leads, 2) ELSE 0 END,
            'cpp', CASE WHEN v_wisdom_sales > 0 THEN ROUND(v_total_spend / v_wisdom_sales, 2) ELSE 0 END,
            'roas', CASE WHEN v_total_spend > 0 THEN ROUND(v_total_revenue / v_total_spend, 2) ELSE 0 END,
            'wisdomConversion', CASE WHEN v_total_leads > 0 THEN ROUND((v_wisdom_sales::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'connectRate', CASE WHEN v_link_clicks > 0 THEN ROUND((v_landing_page_views::NUMERIC / v_link_clicks) * 100, 2) ELSE 0 END
        ),
        'paidAdsFunnel', jsonb_build_object(
            'leads', v_paid_leads,
            'wisdomSales', v_paid_wisdom_sales,
            'conversionRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_wisdom_sales::NUMERIC / v_paid_leads) * 100, 2) ELSE 0 END
        ),
        'organicFunnel', jsonb_build_object(
            'leads', v_organic_leads,
            'wisdomSales', v_organic_wisdom_sales,
            'conversionRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_wisdom_sales::NUMERIC / v_organic_leads) * 100, 2) ELSE 0 END
        ),
        'validation', jsonb_build_object(
            'leadsMatch', (v_total_leads = v_paid_leads + v_organic_leads),
            'wisdomMatch', (v_wisdom_sales = v_paid_wisdom_sales + v_organic_wisdom_sales),
            'totalLeads', v_total_leads,
            'paidPlusOrganic', v_paid_leads + v_organic_leads,
            'leadsDiff', v_total_leads - (v_paid_leads + v_organic_leads)
        )
    );
    
    RETURN v_result;
END;
$$;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Get metrics for last 30 days (default)
-- SELECT get_dashboard_metrics();

-- Get metrics for specific date range
-- SELECT get_dashboard_metrics('2025-12-01'::DATE, '2025-12-15'::DATE);

-- Get metrics for today only
-- SELECT get_dashboard_metrics(CURRENT_DATE, CURRENT_DATE);

-- Extract specific values
-- SELECT 
--     (get_dashboard_metrics()->'kpis'->>'totalLeads')::INT as total_leads,
--     (get_dashboard_metrics()->'kpis'->>'wisdomSales')::INT as wisdom_sales,
--     (get_dashboard_metrics()->'validation'->>'leadsMatch')::BOOLEAN as data_consistent;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO service_role;
