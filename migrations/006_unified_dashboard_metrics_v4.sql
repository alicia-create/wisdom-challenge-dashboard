-- ============================================================================
-- UNIFIED DASHBOARD METRICS SQL FUNCTION v4
-- ============================================================================
-- Added: Paid vs Organic breakdown for ManyChat, Bot Alerts, Kingdom Seekers
-- ============================================================================

-- Drop existing function first
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
    -- Total metrics
    v_total_leads INT;
    v_wisdom_sales INT;
    v_kingdom_seekers INT;
    v_manychat_connected INT;
    v_bot_alerts INT;
    -- Paid Ads metrics
    v_paid_leads INT;
    v_paid_wisdom_sales INT;
    v_paid_kingdom_seekers INT;
    v_paid_manychat INT;
    v_paid_bot_alerts INT;
    -- Organic metrics
    v_organic_leads INT;
    v_organic_wisdom_sales INT;
    v_organic_kingdom_seekers INT;
    v_organic_manychat INT;
    v_organic_bot_alerts INT;
    -- Ad performance
    v_total_spend NUMERIC;
    v_total_revenue NUMERIC;
    v_link_clicks INT;
    v_landing_page_views INT;
BEGIN
    -- ========================================================================
    -- STEP 1: Total Leads (wisdom contacts in date range)
    -- ========================================================================
    SELECT COUNT(DISTINCT c.id)
    INTO v_total_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 2: Paid Ads Leads (31daywisdom.com - without "challenge")
    -- ========================================================================
    SELECT COUNT(DISTINCT c.id)
    INTO v_paid_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 3: Organic Leads (31daywisdomchallenge.com)
    -- ========================================================================
    SELECT COUNT(DISTINCT c.id)
    INTO v_organic_leads
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
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
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 4: Total Wisdom+ Sales (orders >= $31)
    -- ========================================================================
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
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 5: Paid Ads Wisdom+ Sales
    -- ========================================================================
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
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 6: Organic Wisdom+ Sales
    -- ========================================================================
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
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdomchallenge.com%'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 7: Total Kingdom Seekers Trials (product_id = 8)
    -- ========================================================================
    SELECT COUNT(DISTINCT o.id)
    INTO v_kingdom_seekers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 8
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 8: Paid Ads Kingdom Seekers
    -- ========================================================================
    SELECT COUNT(DISTINCT o.id)
    INTO v_paid_kingdom_seekers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 8
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 9: Organic Kingdom Seekers
    -- ========================================================================
    SELECT COUNT(DISTINCT o.id)
    INTO v_organic_kingdom_seekers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 8
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
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 10: Total ManyChat Connected
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
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 11: Paid Ads ManyChat Connected
    -- ========================================================================
    SELECT COUNT(DISTINCT c.id)
    INTO v_paid_manychat
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND c.manychat_id IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 12: Organic ManyChat Connected
    -- ========================================================================
    SELECT COUNT(DISTINCT c.id)
    INTO v_organic_manychat
    FROM contacts c
    WHERE c.created_at >= p_start_date
      AND c.created_at < p_end_date + INTERVAL '1 day'
      AND c.manychat_id IS NOT NULL
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
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 13: Total Bot Alerts Subscribed
    -- ========================================================================
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value ILIKE '%gold.ntn.request_accepted%'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- STEP 14: Paid Ads Bot Alerts Subscribed
    -- ========================================================================
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_paid_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value ILIKE '%gold.ntn.request_accepted%'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 15: Organic Bot Alerts Subscribed
    -- ========================================================================
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_organic_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value ILIKE '%gold.ntn.request_accepted%'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdomchallenge.com%'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae3
          WHERE ae3.contact_id = c.id
            AND ae3.name = 'form.submitted'
            AND ae3.comment ILIKE '%31daywisdom.com%'
            AND ae3.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    -- ========================================================================
    -- STEP 16: Ad Performance Metrics
    -- ========================================================================
    SELECT COALESCE(SUM(spend), 0)
    INTO v_total_spend
    FROM ad_performance
    WHERE date >= p_start_date
      AND date <= p_end_date;
    
    SELECT COALESCE(SUM(link_clicks), 0)
    INTO v_link_clicks
    FROM ad_performance
    WHERE date >= p_start_date
      AND date <= p_end_date;
    
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
    -- STEP 17: Total Revenue
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
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
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
            'kingdomSeekers', v_paid_kingdom_seekers,
            'manychatConnected', v_paid_manychat,
            'botAlertsSubscribed', v_paid_bot_alerts,
            'conversionRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_wisdom_sales::NUMERIC / v_paid_leads) * 100, 2) ELSE 0 END
        ),
        'organicFunnel', jsonb_build_object(
            'leads', v_organic_leads,
            'wisdomSales', v_organic_wisdom_sales,
            'kingdomSeekers', v_organic_kingdom_seekers,
            'manychatConnected', v_organic_manychat,
            'botAlertsSubscribed', v_organic_bot_alerts,
            'conversionRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_wisdom_sales::NUMERIC / v_organic_leads) * 100, 2) ELSE 0 END
        ),
        'validation', jsonb_build_object(
            'leadsMatch', (v_total_leads = v_paid_leads + v_organic_leads),
            'wisdomMatch', (v_wisdom_sales = v_paid_wisdom_sales + v_organic_wisdom_sales),
            'kingdomMatch', (v_kingdom_seekers = v_paid_kingdom_seekers + v_organic_kingdom_seekers),
            'manychatMatch', (v_manychat_connected = v_paid_manychat + v_organic_manychat),
            'botAlertsMatch', (v_bot_alerts = v_paid_bot_alerts + v_organic_bot_alerts),
            'totalLeads', v_total_leads,
            'paidPlusOrganic', v_paid_leads + v_organic_leads,
            'leadsDiff', v_total_leads - (v_paid_leads + v_organic_leads)
        )
    );
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO service_role;

-- Test the function
-- SELECT get_dashboard_metrics('2025-12-01'::DATE, '2025-12-15'::DATE);
