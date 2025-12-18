-- ============================================================================
-- UNIFIED DASHBOARD METRICS FUNCTION v14
-- ============================================================================
-- Correct column names based on actual Supabase schema:
-- - ad_performance.reported_leads (not leads)
-- - ad_performance.reported_purchases (not purchases)
-- - analytics_events.timestamp (not created_at)
-- - contacts does NOT have utm_source
-- ============================================================================

DROP FUNCTION IF EXISTS get_dashboard_metrics(DATE, DATE);

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
    v_welcome_email_clicks INT;
    -- Paid funnel
    v_paid_leads INT;
    v_paid_wisdom_sales INT;
    v_paid_kingdom_seekers INT;
    v_paid_manychat INT;
    v_paid_bot_alerts INT;
    v_paid_welcome_clicks INT;
    -- Organic funnel
    v_organic_leads INT;
    v_organic_wisdom_sales INT;
    v_organic_kingdom_seekers INT;
    v_organic_manychat INT;
    v_organic_bot_alerts INT;
    v_organic_welcome_clicks INT;
    -- Financial
    v_total_spend NUMERIC;
    v_total_revenue NUMERIC;
    v_leads_sales_spend NUMERIC;
    -- Ad Performance
    v_link_clicks INT;
    v_landing_page_views INT;
    -- Meta totals
    v_meta_spend NUMERIC;
    v_meta_clicks INT;
    v_meta_impressions BIGINT;
    v_meta_landing_page_views INT;
    v_meta_leads INT;
    v_meta_purchases INT;
    -- Meta campaign breakdown
    v_meta_sales_spend NUMERIC;
    v_meta_sales_clicks INT;
    v_meta_sales_impressions BIGINT;
    v_meta_sales_leads INT;
    v_meta_sales_purchases INT;
    v_meta_leads_spend NUMERIC;
    v_meta_leads_clicks INT;
    v_meta_leads_impressions BIGINT;
    v_meta_leads_leads INT;
    v_meta_leads_purchases INT;
    v_meta_retargeting_spend NUMERIC;
    v_meta_retargeting_clicks INT;
    v_meta_retargeting_impressions BIGINT;
    v_meta_retargeting_leads INT;
    v_meta_retargeting_purchases INT;
    v_meta_content_spend NUMERIC;
    v_meta_content_clicks INT;
    v_meta_content_impressions BIGINT;
    v_meta_content_leads INT;
    v_meta_content_purchases INT;
    v_meta_other_spend NUMERIC;
    v_meta_other_clicks INT;
    v_meta_other_impressions BIGINT;
    v_meta_other_leads INT;
    v_meta_other_purchases INT;
    -- Google
    v_google_spend NUMERIC;
    v_google_clicks INT;
    v_google_impressions BIGINT;
    v_google_conversions INT;
    -- VSL (5%, 25%, 50%, 95%)
    v_vsl_5_percent INT;
    v_vsl_25_percent INT;
    v_vsl_50_percent INT;
    v_vsl_95_percent INT;
    v_vsl_purchasers INT;
BEGIN
    -- ========================================================================
    -- SECTION 1: TOTAL LEADS
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
    
    -- PAID LEADS: passed through 31daywisdom.com (paid funnel)
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
      );
    
    -- ORGANIC LEADS: only from 31daywisdomchallenge.com, never from paid
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
      );
    
    -- ========================================================================
    -- SECTION 2: WISDOM+ SALES (product_id = 1: Backstage Pass)
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
    
    -- PAID Wisdom Sales
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
      );
    
    -- ORGANIC Wisdom Sales
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
    
    -- PAID Kingdom Seekers
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
      );
    
    -- ORGANIC Kingdom Seekers
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
      );
    
    -- ========================================================================
    -- SECTION 4: MANYCHAT CONNECTED
    -- ========================================================================
    
    SELECT COUNT(DISTINCT c.id)
    INTO v_manychat_connected
    FROM contacts c
    WHERE c.manychat_id IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%wisdom%'
            AND ae.timestamp >= p_start_date
            AND ae.timestamp < p_end_date + INTERVAL '1 day'
      );
    
    -- PAID ManyChat
    SELECT COUNT(DISTINCT c.id)
    INTO v_paid_manychat
    FROM contacts c
    WHERE c.manychat_id IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdom.com%'
            AND ae.timestamp >= p_start_date
            AND ae.timestamp < p_end_date + INTERVAL '1 day'
      );
    
    -- ORGANIC ManyChat
    SELECT COUNT(DISTINCT c.id)
    INTO v_organic_manychat
    FROM contacts c
    WHERE c.manychat_id IS NOT NULL
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = c.id
            AND ae.name = 'form.submitted'
            AND ae.comment ILIKE '%31daywisdomchallenge.com%'
            AND ae.timestamp >= p_start_date
            AND ae.timestamp < p_end_date + INTERVAL '1 day'
      )
      AND NOT EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
      );
    
    -- ========================================================================
    -- SECTION 5: BOT ALERTS SUBSCRIBED (gold.ntn.request_accepted)
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
    
    -- PAID Bot Alerts
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
      );
    
    -- ORGANIC Bot Alerts
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
      );
    
    -- ========================================================================
    -- SECTION 6: WELCOME EMAIL CLICKS (Clicked NTN In Email)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_welcome_email_clicks
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'keap.add_tag'
      AND ae.value ILIKE '%Clicked NTN In Email%'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%wisdom%'
      );
    
    -- PAID Welcome Clicks
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_paid_welcome_clicks
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'keap.add_tag'
      AND ae.value ILIKE '%Clicked NTN In Email%'
      AND EXISTS (
          SELECT 1 FROM analytics_events ae2
          WHERE ae2.contact_id = c.id
            AND ae2.name = 'form.submitted'
            AND ae2.comment ILIKE '%31daywisdom.com%'
      );
    
    -- ORGANIC Welcome Clicks
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_organic_welcome_clicks
    FROM analytics_events ae
    JOIN contacts c ON ae.contact_id = c.id
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'keap.add_tag'
      AND ae.value ILIKE '%Clicked NTN In Email%'
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
      );
    
    -- ========================================================================
    -- SECTION 7: REVENUE (products 1, 2, 4)
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
    -- SECTION 8: AD PERFORMANCE (from ad_performance table)
    -- ========================================================================
    
    -- Total spend and clicks
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(landing_page_views), 0)
    INTO v_total_spend, v_link_clicks, v_landing_page_views
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date;
    
    -- Spend from LEADS and SALES campaigns only (for CPL/CPP/ROAS)
    SELECT COALESCE(SUM(spend), 0)
    INTO v_leads_sales_spend
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND (campaign_name ILIKE '%LEADS%' OR campaign_name ILIKE '%SALES%');
    
    -- ========================================================================
    -- SECTION 9: META PERFORMANCE (using reported_leads and reported_purchases)
    -- ========================================================================
    
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(landing_page_views), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_spend, v_meta_clicks, v_meta_impressions, v_meta_landing_page_views, v_meta_leads, v_meta_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date AND platform ILIKE 'meta';
    
    -- ========================================================================
    -- SECTION 10: META CAMPAIGN BREAKDOWN
    -- ========================================================================
    
    -- SALES campaigns
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_sales_spend, v_meta_sales_clicks, v_meta_sales_impressions, v_meta_sales_leads, v_meta_sales_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND platform ILIKE 'meta'
      AND campaign_name ILIKE '%SALES%';
    
    -- LEADS campaigns (excluding SALES)
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_leads_spend, v_meta_leads_clicks, v_meta_leads_impressions, v_meta_leads_leads, v_meta_leads_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND platform ILIKE 'meta'
      AND campaign_name ILIKE '%LEADS%'
      AND campaign_name NOT ILIKE '%SALES%';
    
    -- RETARGETING campaigns
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_retargeting_spend, v_meta_retargeting_clicks, v_meta_retargeting_impressions, v_meta_retargeting_leads, v_meta_retargeting_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND platform ILIKE 'meta'
      AND (campaign_name ILIKE '%RETARGETING%' OR campaign_name ILIKE '%RTG%' OR campaign_name ILIKE '%REMARKET%')
      AND campaign_name NOT ILIKE '%SALES%'
      AND campaign_name NOT ILIKE '%LEADS%';
    
    -- CONTENT campaigns
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_content_spend, v_meta_content_clicks, v_meta_content_impressions, v_meta_content_leads, v_meta_content_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND platform ILIKE 'meta'
      AND (campaign_name ILIKE '%CONTENT%' OR campaign_name ILIKE '%AWARENESS%' OR campaign_name ILIKE '%BRAND%')
      AND campaign_name NOT ILIKE '%SALES%'
      AND campaign_name NOT ILIKE '%LEADS%'
      AND campaign_name NOT ILIKE '%RETARGETING%'
      AND campaign_name NOT ILIKE '%RTG%';
    
    -- OTHER campaigns
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(SUM(reported_leads), 0),
        COALESCE(SUM(reported_purchases), 0)
    INTO v_meta_other_spend, v_meta_other_clicks, v_meta_other_impressions, v_meta_other_leads, v_meta_other_purchases
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date 
      AND platform ILIKE 'meta'
      AND campaign_name NOT ILIKE '%SALES%'
      AND campaign_name NOT ILIKE '%LEADS%'
      AND campaign_name NOT ILIKE '%RETARGETING%'
      AND campaign_name NOT ILIKE '%RTG%'
      AND campaign_name NOT ILIKE '%REMARKET%'
      AND campaign_name NOT ILIKE '%CONTENT%'
      AND campaign_name NOT ILIKE '%AWARENESS%'
      AND campaign_name NOT ILIKE '%BRAND%';
    
    -- ========================================================================
    -- SECTION 11: GOOGLE PERFORMANCE
    -- ========================================================================
    
    SELECT 
        COALESCE(SUM(spend), 0),
        COALESCE(SUM(link_clicks), 0),
        COALESCE(SUM(impressions), 0)
    INTO v_google_spend, v_google_clicks, v_google_impressions
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date AND platform ILIKE 'google';
    
    -- Google conversions (reported_purchases)
    SELECT COALESCE(SUM(reported_purchases), 0)
    INTO v_google_conversions
    FROM ad_performance
    WHERE date >= p_start_date AND date <= p_end_date AND platform ILIKE 'google';
    
    -- ========================================================================
    -- SECTION 12: VSL PERFORMANCE (vidalytics.view_video: 5%, 25%, 50%, 95%)
    -- ========================================================================
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_5_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video'
      AND ae.value ILIKE '%View 5%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_25_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video'
      AND ae.value ILIKE '%View 25%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_50_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video'
      AND ae.value ILIKE '%View 50%';
    
    SELECT COUNT(DISTINCT ae.contact_id)
    INTO v_vsl_95_percent
    FROM analytics_events ae
    WHERE ae.timestamp >= p_start_date
      AND ae.timestamp < p_end_date + INTERVAL '1 day'
      AND ae.name = 'vidalytics.view_video'
      AND ae.value ILIKE '%View 95%';
    
    -- VSL viewers who purchased
    SELECT COUNT(DISTINCT o.contact_id)
    INTO v_vsl_purchasers
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.created_at >= p_start_date
      AND o.created_at < p_end_date + INTERVAL '1 day'
      AND oi.product_id = 1
      AND EXISTS (
          SELECT 1 FROM analytics_events ae
          WHERE ae.contact_id = o.contact_id
            AND ae.name = 'vidalytics.view_video'
            AND ae.timestamp >= p_start_date
            AND ae.timestamp < p_end_date + INTERVAL '1 day'
      );
    
    -- ========================================================================
    -- SECTION 13: BUILD RESULT JSON
    -- ========================================================================
    
    v_result := jsonb_build_object(
        'dateRange', jsonb_build_object(
            'startDate', p_start_date::TEXT,
            'endDate', p_end_date::TEXT
        ),
        'kpis', jsonb_build_object(
            'totalLeads', v_total_leads,
            'wisdomSales', v_wisdom_sales,
            'kingdomSeekerTrials', v_kingdom_seekers,
            'manychatConnected', v_manychat_connected,
            'botAlertsSubscribed', v_bot_alerts,
            'welcomeEmailClicks', v_welcome_email_clicks,
            'totalSpend', ROUND(v_total_spend::NUMERIC, 2),
            'leadsSalesSpend', ROUND(v_leads_sales_spend::NUMERIC, 2),
            'totalRevenue', ROUND(v_total_revenue::NUMERIC, 2),
            'linkClicks', v_link_clicks,
            'landingPageViews', v_landing_page_views,
            'cpl', CASE WHEN v_paid_leads > 0 THEN ROUND((v_leads_sales_spend / v_paid_leads)::NUMERIC, 2) ELSE 0 END,
            'cpp', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND((v_leads_sales_spend / v_paid_wisdom_sales)::NUMERIC, 2) ELSE 0 END,
            'aov', CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_total_revenue / v_wisdom_sales)::NUMERIC, 2) ELSE 0 END,
            'roas', CASE WHEN v_leads_sales_spend > 0 THEN ROUND((v_total_revenue / v_leads_sales_spend)::NUMERIC, 2) ELSE 0 END,
            'wisdomConversion', CASE WHEN v_total_leads > 0 THEN ROUND((v_wisdom_sales::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END
            ,'cplAds', CASE WHEN v_paid_leads > 0 THEN ROUND((v_leads_sales_spend / v_paid_leads)::NUMERIC, 2) ELSE 0 END            ,'cppAds', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND((v_leads_sales_spend / v_paid_wisdom_sales)::NUMERIC, 2) ELSE 0 END            ,'trueCpl', CASE WHEN v_total_leads > 0 THEN ROUND((v_total_spend / v_total_leads)::NUMERIC, 2) ELSE 0 END            ,'trueCpp', CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_total_spend / v_wisdom_sales)::NUMERIC, 2) ELSE 0 END
        ),
        'paidAdsFunnel', jsonb_build_object(
            'leads', v_paid_leads,
            'wisdomSales', v_paid_wisdom_sales,
            'kingdomSeekers', v_paid_kingdom_seekers,
            'manychatConnected', v_paid_manychat,
            'botAlertsSubscribed', v_paid_bot_alerts,
            'welcomeEmailClicks', v_paid_welcome_clicks,
            'leadToWisdomRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_wisdom_sales::NUMERIC / v_paid_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'wisdomToKingdomRate', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND((v_paid_kingdom_seekers::NUMERIC / v_paid_wisdom_sales * 100)::NUMERIC, 2) ELSE 0 END,
            'leadsToManychatRate', CASE WHEN v_paid_leads > 0 THEN ROUND((v_paid_manychat::NUMERIC / v_paid_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'manychatToBotAlertsRate', CASE WHEN v_paid_manychat > 0 THEN ROUND((v_paid_bot_alerts::NUMERIC / v_paid_manychat * 100)::NUMERIC, 2) ELSE 0 END
        ),
        'organicFunnel', jsonb_build_object(
            'leads', v_organic_leads,
            'wisdomSales', v_organic_wisdom_sales,
            'kingdomSeekers', v_organic_kingdom_seekers,
            'manychatConnected', v_organic_manychat,
            'botAlertsSubscribed', v_organic_bot_alerts,
            'welcomeEmailClicks', v_organic_welcome_clicks,
            'leadToWisdomRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_wisdom_sales::NUMERIC / v_organic_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'wisdomToKingdomRate', CASE WHEN v_organic_wisdom_sales > 0 THEN ROUND((v_organic_kingdom_seekers::NUMERIC / v_organic_wisdom_sales * 100)::NUMERIC, 2) ELSE 0 END,
            'leadsToManychatRate', CASE WHEN v_organic_leads > 0 THEN ROUND((v_organic_manychat::NUMERIC / v_organic_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'manychatToBotAlertsRate', CASE WHEN v_organic_manychat > 0 THEN ROUND((v_organic_bot_alerts::NUMERIC / v_organic_manychat * 100)::NUMERIC, 2) ELSE 0 END
        ),
        'metaPerformance', jsonb_build_object(
            'spend', ROUND(v_meta_spend::NUMERIC, 2),
            'purchases', v_meta_purchases,
            'cpp', CASE WHEN v_meta_purchases > 0 THEN ROUND((v_meta_spend / v_meta_purchases)::NUMERIC, 2) ELSE 0 END,
            'salesRate', CASE WHEN v_meta_clicks > 0 THEN ROUND((v_meta_purchases::NUMERIC / v_meta_clicks * 100)::NUMERIC, 2) ELSE 0 END,
            'leads', v_meta_leads,
            'cpl', CASE WHEN v_meta_leads > 0 THEN ROUND((v_meta_spend / v_meta_leads)::NUMERIC, 2) ELSE 0 END,
            'leadRate', CASE WHEN v_meta_clicks > 0 THEN ROUND((v_meta_leads::NUMERIC / v_meta_clicks * 100)::NUMERIC, 2) ELSE 0 END,
            'clicks', v_meta_clicks,
            'cpc', CASE WHEN v_meta_clicks > 0 THEN ROUND((v_meta_spend / v_meta_clicks)::NUMERIC, 2) ELSE 0 END,
            'ctr', CASE WHEN v_meta_impressions > 0 THEN ROUND((v_meta_clicks::NUMERIC / v_meta_impressions * 100)::NUMERIC, 2) ELSE 0 END,
            'cpm', CASE WHEN v_meta_impressions > 0 THEN ROUND((v_meta_spend / v_meta_impressions * 1000)::NUMERIC, 2) ELSE 0 END,
            'impressions', v_meta_impressions,
            'landingPageViews', v_meta_landing_page_views
        ),
        'metaCampaignBreakdown', jsonb_build_object(
            'sales', jsonb_build_object(
                'spend', ROUND(v_meta_sales_spend::NUMERIC, 2),
                'purchases', v_meta_sales_purchases,
                'cpp', CASE WHEN v_meta_sales_purchases > 0 THEN ROUND((v_meta_sales_spend / v_meta_sales_purchases)::NUMERIC, 2) ELSE 0 END,
                'salesRate', CASE WHEN v_meta_sales_clicks > 0 THEN ROUND((v_meta_sales_purchases::NUMERIC / v_meta_sales_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'leads', v_meta_sales_leads,
                'cpl', CASE WHEN v_meta_sales_leads > 0 THEN ROUND((v_meta_sales_spend / v_meta_sales_leads)::NUMERIC, 2) ELSE 0 END,
                'leadRate', CASE WHEN v_meta_sales_clicks > 0 THEN ROUND((v_meta_sales_leads::NUMERIC / v_meta_sales_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'clicks', v_meta_sales_clicks,
                'cpc', CASE WHEN v_meta_sales_clicks > 0 THEN ROUND((v_meta_sales_spend / v_meta_sales_clicks)::NUMERIC, 2) ELSE 0 END,
                'ctr', CASE WHEN v_meta_sales_impressions > 0 THEN ROUND((v_meta_sales_clicks::NUMERIC / v_meta_sales_impressions * 100)::NUMERIC, 2) ELSE 0 END,
                'cpm', CASE WHEN v_meta_sales_impressions > 0 THEN ROUND((v_meta_sales_spend / v_meta_sales_impressions * 1000)::NUMERIC, 2) ELSE 0 END
            ),
            'leads', jsonb_build_object(
                'spend', ROUND(v_meta_leads_spend::NUMERIC, 2),
                'purchases', v_meta_leads_purchases,
                'cpp', CASE WHEN v_meta_leads_purchases > 0 THEN ROUND((v_meta_leads_spend / v_meta_leads_purchases)::NUMERIC, 2) ELSE 0 END,
                'salesRate', CASE WHEN v_meta_leads_clicks > 0 THEN ROUND((v_meta_leads_purchases::NUMERIC / v_meta_leads_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'leads', v_meta_leads_leads,
                'cpl', CASE WHEN v_meta_leads_leads > 0 THEN ROUND((v_meta_leads_spend / v_meta_leads_leads)::NUMERIC, 2) ELSE 0 END,
                'leadRate', CASE WHEN v_meta_leads_clicks > 0 THEN ROUND((v_meta_leads_leads::NUMERIC / v_meta_leads_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'clicks', v_meta_leads_clicks,
                'cpc', CASE WHEN v_meta_leads_clicks > 0 THEN ROUND((v_meta_leads_spend / v_meta_leads_clicks)::NUMERIC, 2) ELSE 0 END,
                'ctr', CASE WHEN v_meta_leads_impressions > 0 THEN ROUND((v_meta_leads_clicks::NUMERIC / v_meta_leads_impressions * 100)::NUMERIC, 2) ELSE 0 END,
                'cpm', CASE WHEN v_meta_leads_impressions > 0 THEN ROUND((v_meta_leads_spend / v_meta_leads_impressions * 1000)::NUMERIC, 2) ELSE 0 END
            ),
            'retargeting', jsonb_build_object(
                'spend', ROUND(v_meta_retargeting_spend::NUMERIC, 2),
                'purchases', v_meta_retargeting_purchases,
                'cpp', CASE WHEN v_meta_retargeting_purchases > 0 THEN ROUND((v_meta_retargeting_spend / v_meta_retargeting_purchases)::NUMERIC, 2) ELSE 0 END,
                'salesRate', CASE WHEN v_meta_retargeting_clicks > 0 THEN ROUND((v_meta_retargeting_purchases::NUMERIC / v_meta_retargeting_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'leads', v_meta_retargeting_leads,
                'cpl', CASE WHEN v_meta_retargeting_leads > 0 THEN ROUND((v_meta_retargeting_spend / v_meta_retargeting_leads)::NUMERIC, 2) ELSE 0 END,
                'leadRate', CASE WHEN v_meta_retargeting_clicks > 0 THEN ROUND((v_meta_retargeting_leads::NUMERIC / v_meta_retargeting_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'clicks', v_meta_retargeting_clicks,
                'cpc', CASE WHEN v_meta_retargeting_clicks > 0 THEN ROUND((v_meta_retargeting_spend / v_meta_retargeting_clicks)::NUMERIC, 2) ELSE 0 END,
                'ctr', CASE WHEN v_meta_retargeting_impressions > 0 THEN ROUND((v_meta_retargeting_clicks::NUMERIC / v_meta_retargeting_impressions * 100)::NUMERIC, 2) ELSE 0 END,
                'cpm', CASE WHEN v_meta_retargeting_impressions > 0 THEN ROUND((v_meta_retargeting_spend / v_meta_retargeting_impressions * 1000)::NUMERIC, 2) ELSE 0 END
            ),
            'content', jsonb_build_object(
                'spend', ROUND(v_meta_content_spend::NUMERIC, 2),
                'purchases', v_meta_content_purchases,
                'cpp', CASE WHEN v_meta_content_purchases > 0 THEN ROUND((v_meta_content_spend / v_meta_content_purchases)::NUMERIC, 2) ELSE 0 END,
                'salesRate', CASE WHEN v_meta_content_clicks > 0 THEN ROUND((v_meta_content_purchases::NUMERIC / v_meta_content_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'leads', v_meta_content_leads,
                'cpl', CASE WHEN v_meta_content_leads > 0 THEN ROUND((v_meta_content_spend / v_meta_content_leads)::NUMERIC, 2) ELSE 0 END,
                'leadRate', CASE WHEN v_meta_content_clicks > 0 THEN ROUND((v_meta_content_leads::NUMERIC / v_meta_content_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'clicks', v_meta_content_clicks,
                'cpc', CASE WHEN v_meta_content_clicks > 0 THEN ROUND((v_meta_content_spend / v_meta_content_clicks)::NUMERIC, 2) ELSE 0 END,
                'ctr', CASE WHEN v_meta_content_impressions > 0 THEN ROUND((v_meta_content_clicks::NUMERIC / v_meta_content_impressions * 100)::NUMERIC, 2) ELSE 0 END,
                'cpm', CASE WHEN v_meta_content_impressions > 0 THEN ROUND((v_meta_content_spend / v_meta_content_impressions * 1000)::NUMERIC, 2) ELSE 0 END
            ),
            'other', jsonb_build_object(
                'spend', ROUND(v_meta_other_spend::NUMERIC, 2),
                'purchases', v_meta_other_purchases,
                'cpp', CASE WHEN v_meta_other_purchases > 0 THEN ROUND((v_meta_other_spend / v_meta_other_purchases)::NUMERIC, 2) ELSE 0 END,
                'salesRate', CASE WHEN v_meta_other_clicks > 0 THEN ROUND((v_meta_other_purchases::NUMERIC / v_meta_other_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'leads', v_meta_other_leads,
                'cpl', CASE WHEN v_meta_other_leads > 0 THEN ROUND((v_meta_other_spend / v_meta_other_leads)::NUMERIC, 2) ELSE 0 END,
                'leadRate', CASE WHEN v_meta_other_clicks > 0 THEN ROUND((v_meta_other_leads::NUMERIC / v_meta_other_clicks * 100)::NUMERIC, 2) ELSE 0 END,
                'clicks', v_meta_other_clicks,
                'cpc', CASE WHEN v_meta_other_clicks > 0 THEN ROUND((v_meta_other_spend / v_meta_other_clicks)::NUMERIC, 2) ELSE 0 END,
                'ctr', CASE WHEN v_meta_other_impressions > 0 THEN ROUND((v_meta_other_clicks::NUMERIC / v_meta_other_impressions * 100)::NUMERIC, 2) ELSE 0 END,
                'cpm', CASE WHEN v_meta_other_impressions > 0 THEN ROUND((v_meta_other_spend / v_meta_other_impressions * 1000)::NUMERIC, 2) ELSE 0 END
            )
        ),
        'googlePerformance', jsonb_build_object(
            'spend', ROUND(v_google_spend::NUMERIC, 2),
            'clicks', v_google_clicks,
            'impressions', v_google_impressions,
            'cpc', CASE WHEN v_google_clicks > 0 THEN ROUND((v_google_spend / v_google_clicks)::NUMERIC, 2) ELSE 0 END,
            'cpm', CASE WHEN v_google_impressions > 0 THEN ROUND((v_google_spend / v_google_impressions * 1000)::NUMERIC, 2) ELSE 0 END,
            'ctr', CASE WHEN v_google_impressions > 0 THEN ROUND((v_google_clicks::NUMERIC / v_google_impressions * 100)::NUMERIC, 2) ELSE 0 END
            ,'conversions', v_google_conversions
        ),
        'vslPerformance', jsonb_build_object(
            'totalLeads', v_total_leads,
            'vsl5PercentViews', v_vsl_5_percent,
            'vsl25PercentViews', v_vsl_25_percent,
            'vsl50PercentViews', v_vsl_50_percent,
            'vsl95PercentViews', v_vsl_95_percent,
            'wisdomPurchases', v_vsl_purchasers,
            -- Sequential rates
            'leadsTo5PercentRate', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_5_percent::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'vsl5To25PercentRate', CASE WHEN v_vsl_5_percent > 0 THEN ROUND((v_vsl_25_percent::NUMERIC / v_vsl_5_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'vsl25To50PercentRate', CASE WHEN v_vsl_25_percent > 0 THEN ROUND((v_vsl_50_percent::NUMERIC / v_vsl_25_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'vsl50To95PercentRate', CASE WHEN v_vsl_50_percent > 0 THEN ROUND((v_vsl_95_percent::NUMERIC / v_vsl_50_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'vsl95ToPurchaseRate', CASE WHEN v_vsl_95_percent > 0 THEN ROUND((v_vsl_purchasers::NUMERIC / v_vsl_95_percent * 100)::NUMERIC, 2) ELSE 0 END,
            -- Overall retention
            'overallRetention5', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_5_percent::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'overallRetention25', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_25_percent::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'overallRetention50', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_50_percent::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'overallRetention95', CASE WHEN v_total_leads > 0 THEN ROUND((v_vsl_95_percent::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            -- Drop-off
            'dropOffLeadsTo5', CASE WHEN v_total_leads > 0 THEN ROUND(((v_total_leads - v_vsl_5_percent)::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'dropOff5To25', CASE WHEN v_vsl_5_percent > 0 THEN ROUND(((v_vsl_5_percent - v_vsl_25_percent)::NUMERIC / v_vsl_5_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'dropOff25To50', CASE WHEN v_vsl_25_percent > 0 THEN ROUND(((v_vsl_25_percent - v_vsl_50_percent)::NUMERIC / v_vsl_25_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'dropOff50To95', CASE WHEN v_vsl_50_percent > 0 THEN ROUND(((v_vsl_50_percent - v_vsl_95_percent)::NUMERIC / v_vsl_50_percent * 100)::NUMERIC, 2) ELSE 0 END,
            'vslToPurchaseRate', CASE WHEN v_vsl_5_percent > 0 THEN ROUND((v_vsl_purchasers::NUMERIC / v_vsl_5_percent * 100)::NUMERIC, 2) ELSE 0 END
        ),
        'funnelRates', jsonb_build_object(
            'leadToWisdomRate', CASE WHEN v_total_leads > 0 THEN ROUND((v_wisdom_sales::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'wisdomToKingdomRate', CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_kingdom_seekers::NUMERIC / v_wisdom_sales * 100)::NUMERIC, 2) ELSE 0 END,
            'leadsToManychatRate', CASE WHEN v_total_leads > 0 THEN ROUND((v_manychat_connected::NUMERIC / v_total_leads * 100)::NUMERIC, 2) ELSE 0 END,
            'manychatToBotAlertsRate', CASE WHEN v_manychat_connected > 0 THEN ROUND((v_bot_alerts::NUMERIC / v_manychat_connected * 100)::NUMERIC, 2) ELSE 0 END
        ),
        'validation', jsonb_build_object(
            'totalLeads', v_total_leads,
            'paidPlusOrganic', v_paid_leads + v_organic_leads,
            'leadsMatch', v_total_leads = v_paid_leads + v_organic_leads,
            'leadsDiff', v_total_leads - (v_paid_leads + v_organic_leads),
            'wisdomMatch', v_wisdom_sales = v_paid_wisdom_sales + v_organic_wisdom_sales,
            'kingdomMatch', v_kingdom_seekers = v_paid_kingdom_seekers + v_organic_kingdom_seekers,
            'manychatMatch', v_manychat_connected = v_paid_manychat + v_organic_manychat,
            'botAlertsMatch', v_bot_alerts = v_paid_bot_alerts + v_organic_bot_alerts
        )
    );
    
    RETURN v_result;
END;
$$;

-- Test the function
-- SELECT get_dashboard_metrics('2025-12-01'::DATE, '2025-12-15'::DATE);
