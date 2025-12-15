-- ============================================================================
-- UNIFIED DASHBOARD METRICS SQL FUNCTION v8
-- ============================================================================
-- Changes from v7:
-- 1. Fixed: oi.amount instead of oi.price for revenue
-- 2. Fixed: ae.value = 'gold.ntn.request_accepted' (exact match)
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
    v_total_leads INT;
    v_wisdom_sales INT;
    v_kingdom_seekers INT;
    v_manychat_connected INT;
    v_bot_alerts INT;
    v_paid_leads INT;
    v_paid_wisdom_sales INT;
    v_paid_kingdom_seekers INT;
    v_paid_manychat INT;
    v_paid_bot_alerts INT;
    v_organic_leads INT;
    v_organic_wisdom_sales INT;
    v_organic_kingdom_seekers INT;
    v_organic_manychat INT;
    v_organic_bot_alerts INT;
    v_total_spend NUMERIC;
    v_total_revenue NUMERIC;
    v_link_clicks INT;
    v_landing_page_views INT;
    v_leads_sales_spend NUMERIC;
    v_meta_spend NUMERIC;
    v_meta_clicks INT;
    v_meta_landing_page_views INT;
    v_meta_impressions BIGINT;
    v_google_spend NUMERIC;
    v_google_clicks INT;
    v_google_impressions BIGINT;
    v_vsl_5_percent INT;
    v_vsl_25_percent INT;
    v_vsl_75_percent INT;
    v_vsl_95_percent INT;
    v_vsl_purchasers INT;
    v_lead_to_wisdom_rate NUMERIC;
    v_wisdom_to_kingdom_rate NUMERIC;
    v_kingdom_to_manychat_rate NUMERIC;
    v_manychat_to_bot_rate NUMERIC;
BEGIN
    -- ========================================================================
    -- SECTION 1: LEADS
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
    -- SECTION 2: WISDOM+ SALES (product_id = 1 only: Backstage Pass)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT o.id)
    INTO v_wisdom_sales
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 1
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    SELECT COUNT(DISTINCT o.id)
    INTO v_paid_wisdom_sales
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 1
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    SELECT COUNT(DISTINCT o.id)
    INTO v_organic_wisdom_sales
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 1
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
    -- SECTION 3: KINGDOM SEEKERS (product_id = 8)
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
    -- SECTION 4: MANYCHAT CONNECTED
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
    -- SECTION 5: BOT ALERTS SUBSCRIBED
    -- Using exact match: ae.value = 'gold.ntn.request_accepted'
    -- ========================================================================
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value = 'gold.ntn.request_accepted'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%wisdom%'
      );
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_paid_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value = 'gold.ntn.request_accepted'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
            AND ae2.comment NOT ILIKE '%31daywisdomchallenge.com%'
      );
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_organic_bot_alerts
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'manychat.add_tag'
      AND ae.value = 'gold.ntn.request_accepted'
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
    -- SECTION 6: AD PERFORMANCE
    -- ========================================================================
    
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(CASE WHEN link_clicks > 0 THEN link_clicks * landing_page_view_per_link_click ELSE 0 END), 0)
    INTO v_total_spend, v_link_clicks, v_landing_page_views
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date;
    
    SELECT COALESCE(SUM(spend), 0)
    INTO v_leads_sales_spend
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date
      AND (campaign_name ILIKE '%LEADS%' OR campaign_name ILIKE '%SALES%');
    
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(CASE WHEN link_clicks > 0 THEN link_clicks * landing_page_view_per_link_click ELSE 0 END), 0),
        COALESCE(SUM(impressions), 0)
    INTO v_meta_spend, v_meta_clicks, v_meta_landing_page_views, v_meta_impressions
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date AND platform ILIKE 'meta';
    
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0)
    INTO v_google_spend, v_google_clicks, v_google_impressions
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date AND platform ILIKE 'google';
    
    -- ========================================================================
    -- SECTION 7: TOTAL REVENUE (products 1, 2, 4 only)
    -- Using oi.amount (NOT oi.price)
    -- ========================================================================
    
    SELECT COALESCE(SUM(oi.amount), 0)
    INTO v_total_revenue
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN contacts c ON o.contact_id = c.id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id IN (1, 2, 4)
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
      );
    
    -- ========================================================================
    -- SECTION 8: VSL PERFORMANCE
    -- ========================================================================
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_5_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video' AND ae.value ILIKE '%5%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_25_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video' AND ae.value ILIKE '%25%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_75_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video' AND ae.value ILIKE '%75%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_95_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video' AND ae.value ILIKE '%95%';
    
    SELECT COUNT(DISTINCT o.contact_id)
    INTO v_vsl_purchasers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.created_at >= p_start_date AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 1
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = o.contact_id AND ae.name = 'vidalytics.view_video'
      );
    
    -- ========================================================================
    -- SECTION 9: CONVERSION RATES
    -- ========================================================================
    
    v_lead_to_wisdom_rate := CASE WHEN v_total_leads > 0 THEN ROUND((v_wisdom_sales::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END;
    v_wisdom_to_kingdom_rate := CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_kingdom_seekers::NUMERIC / v_wisdom_sales) * 100, 2) ELSE 0 END;
    v_kingdom_to_manychat_rate := CASE WHEN v_total_leads > 0 THEN ROUND((v_manychat_connected::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END;
    v_manychat_to_bot_rate := CASE WHEN v_manychat_connected > 0 THEN ROUND((v_bot_alerts::NUMERIC / v_manychat_connected) * 100, 2) ELSE 0 END;
    
    -- ========================================================================
    -- BUILD RESULT JSON
    -- ========================================================================
    v_result := jsonb_build_object(
        'dateRange', jsonb_build_object('startDate', p_start_date, 'endDate', p_end_date),
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
            'cpl', CASE WHEN v_paid_leads > 0 THEN ROUND(v_leads_sales_spend / v_paid_leads, 2) ELSE 0 END,
            'cpp', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND(v_leads_sales_spend / v_paid_wisdom_sales, 2) ELSE 0 END,
            'aov', CASE WHEN v_wisdom_sales > 0 THEN ROUND(v_total_revenue / v_wisdom_sales, 2) ELSE 0 END,
            'roas', CASE WHEN v_leads_sales_spend > 0 THEN ROUND(v_total_revenue / v_leads_sales_spend, 2) ELSE 0 END,
            'wisdomConversion', v_lead_to_wisdom_rate
        ),
        'paidAdsFunnel', jsonb_build_object(
            'leads', v_paid_leads,
            'wisdomSales', v_paid_wisdom_sales,
            'kingdomSeekers', v_paid_kingdom_seekers,
            'manychatConnected', v_paid_manychat,
            'botAlertsSubscribed', v_paid_bot_alerts,
            'leadToWisdomRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_wisdom_sales::NUMERIC / v_paid_leads) * 100, 2) ELSE 0 END,
            'wisdomToKingdomRate', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND((v_paid_kingdom_seekers::NUMERIC / v_paid_wisdom_sales) * 100, 2) ELSE 0 END,
            'leadsToManychatRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_manychat::NUMERIC / v_paid_leads) * 100, 2) ELSE 0 END,
            'manychatToBotAlertsRate', CASE WHEN v_paid_manychat > 0 THEN ROUND((v_paid_bot_alerts::NUMERIC / v_paid_manychat) * 100, 2) ELSE 0 END
        ),
        'organicFunnel', jsonb_build_object(
            'leads', v_organic_leads,
            'wisdomSales', v_organic_wisdom_sales,
            'kingdomSeekers', v_organic_kingdom_seekers,
            'manychatConnected', v_organic_manychat,
            'botAlertsSubscribed', v_organic_bot_alerts,
            'leadToWisdomRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_wisdom_sales::NUMERIC / v_organic_leads) * 100, 2) ELSE 0 END,
            'wisdomToKingdomRate', CASE WHEN v_organic_wisdom_sales > 0 THEN ROUND((v_organic_kingdom_seekers::NUMERIC / v_organic_wisdom_sales) * 100, 2) ELSE 0 END,
            'leadsToManychatRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_manychat::NUMERIC / v_organic_leads) * 100, 2) ELSE 0 END,
            'manychatToBotAlertsRate', CASE WHEN v_organic_manychat > 0 THEN ROUND((v_organic_bot_alerts::NUMERIC / v_organic_manychat) * 100, 2) ELSE 0 END
        ),
        'metaPerformance', jsonb_build_object(
            'spend', v_meta_spend,
            'clicks', v_meta_clicks,
            'landingPageViews', v_meta_landing_page_views,
            'impressions', v_meta_impressions,
            'connectRate', CASE WHEN v_meta_clicks > 0 THEN ROUND((v_meta_landing_page_views::NUMERIC / v_meta_clicks) * 100, 2) ELSE 0 END,
            'ctr', CASE WHEN v_meta_impressions > 0 THEN ROUND((v_meta_clicks::NUMERIC / v_meta_impressions) * 100, 2) ELSE 0 END,
            'cpc', CASE WHEN v_meta_clicks > 0 THEN ROUND(v_meta_spend / v_meta_clicks, 2) ELSE 0 END,
            'cpm', CASE WHEN v_meta_impressions > 0 THEN ROUND((v_meta_spend / v_meta_impressions) * 1000, 2) ELSE 0 END
        ),
        'googlePerformance', jsonb_build_object(
            'spend', v_google_spend,
            'clicks', v_google_clicks,
            'impressions', v_google_impressions,
            'ctr', CASE WHEN v_google_impressions > 0 THEN ROUND((v_google_clicks::NUMERIC / v_google_impressions) * 100, 2) ELSE 0 END,
            'cpc', CASE WHEN v_google_clicks > 0 THEN ROUND(v_google_spend / v_google_clicks, 2) ELSE 0 END,
            'cpm', CASE WHEN v_google_impressions > 0 THEN ROUND((v_google_spend / v_google_impressions) * 1000, 2) ELSE 0 END
        ),
        'vslPerformance', jsonb_build_object(
            'totalLeads', v_total_leads,
            'vsl5Percent', v_vsl_5_percent,
            'vsl25Percent', v_vsl_25_percent,
            'vsl75Percent', v_vsl_75_percent,
            'vsl95Percent', v_vsl_95_percent,
            'wisdomPurchases', v_vsl_purchasers,
            'vslToPurchaseRate', CASE WHEN v_vsl_5_percent > 0 THEN ROUND((v_vsl_purchasers::NUMERIC / v_vsl_5_percent) * 100, 2) ELSE 0 END,
            'retention5Percent', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_5_percent::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'retention25Percent', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_25_percent::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'retention75Percent', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_75_percent::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'retention95Percent', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_95_percent::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'dropOff5Percent', CASE WHEN v_total_leads > 0 THEN ROUND(((v_total_leads - v_vsl_5_percent)::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'dropOff25Percent', CASE WHEN v_total_leads > 0 THEN ROUND(((v_total_leads - v_vsl_25_percent)::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'dropOff75Percent', CASE WHEN v_total_leads > 0 THEN ROUND(((v_total_leads - v_vsl_75_percent)::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END,
            'dropOff95Percent', CASE WHEN v_total_leads > 0 THEN ROUND(((v_total_leads - v_vsl_95_percent)::NUMERIC / v_total_leads) * 100, 2) ELSE 0 END
        ),
        'funnelRates', jsonb_build_object(
            'leadToWisdomRate', v_lead_to_wisdom_rate,
            'wisdomToKingdomRate', v_wisdom_to_kingdom_rate,
            'leadsToManychatRate', v_kingdom_to_manychat_rate,
            'manychatToBotAlertsRate', v_manychat_to_bot_rate
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

GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO anon;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(DATE, DATE) TO service_role;
