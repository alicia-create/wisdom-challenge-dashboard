-- ============================================================================
-- Migration 018: Fix VSL + Meta Calculated Fields + Kingdom Seekers
-- BUG FIX 1: VSL uses vidalytics.view_video (not video.watched)
-- BUG FIX 2: Kingdom Seekers needs product_id IN (8, 9) not just 8
-- BUG FIX 3: Re-add Meta calculated fields that were lost in Migration 017
-- ============================================================================

DROP FUNCTION IF EXISTS get_dashboard_metrics(date, date);

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '120s'
AS $function$
DECLARE
    v_result JSONB;
    v_start_ts TIMESTAMP;
    v_end_ts TIMESTAMP;
BEGIN
    -- Convert dates to LA timezone timestamps
    v_start_ts := (p_start_date::timestamp AT TIME ZONE 'America/Los_Angeles');
    v_end_ts := ((p_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Los_Angeles');
    
    -- Build result using CTEs with materialized view
    WITH 
    -- CTE 1: Filter leads by date range using materialized view
    wisdom_leads AS (
        SELECT 
            wlc.contact_id,
            wlc.created_at,
            wlc.is_paid,
            wlc.is_organic,
            wlc.has_manychat
        FROM wisdom_lead_classification wlc
        WHERE (wlc.created_at AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (wlc.created_at AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 2: Lead counts (much faster now)
    lead_metrics AS (
        SELECT
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE is_paid) as paid_leads,
            COUNT(*) FILTER (WHERE is_organic AND NOT is_paid) as organic_leads,
            COUNT(*) FILTER (WHERE has_manychat) as total_manychat,
            COUNT(*) FILTER (WHERE has_manychat AND is_paid) as paid_manychat,
            COUNT(*) FILTER (WHERE has_manychat AND is_organic AND NOT is_paid) as organic_manychat
        FROM wisdom_leads
    ),
    -- CTE 3: Orders in date range for wisdom funnel
    wisdom_orders AS (
        SELECT 
            o.id,
            o.contact_id,
            o.order_total,
            o.funnel_name,
            o.billing_status,
            o.created_at
        FROM orders o
        WHERE (o.created_at AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (o.created_at AT TIME ZONE 'America/Los_Angeles') < v_end_ts
          AND o.funnel_name LIKE '%wisdom%'
          AND o.billing_status IN ('paid', 'partially-refunded')
    ),
    -- CTE 4: Product sales breakdown
    product_sales AS (
        SELECT
            -- Wisdom+ Sales (product_id = 1)
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1) as wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_wisdom_sales,
            
            -- FIX: Kingdom Seekers (product_id IN (8, 9))
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9)) as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9) AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9) AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_kingdom_seekers,
            
            -- Extra Journals (product_id = 4)
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4) as extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_journals,
            
            -- Extra Shipping (product_id = 2)
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2) as extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_shipping,
            
            SUM(wo.order_total) as total_revenue
        FROM wisdom_orders wo
        INNER JOIN order_items oi ON wo.id = oi.order_id
    ),
    -- CTE 5: Engagement metrics (bot alerts, welcome email clicks)
    engagement_metrics AS (
        SELECT
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'bot.subscribed' AND wl.is_paid) as paid_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'bot.subscribed' AND wl.is_organic AND NOT wl.is_paid) as organic_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'email.clicked' AND ae.comment ILIKE '%welcome%' AND wl.is_paid) as paid_welcome_clicks,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'email.clicked' AND ae.comment ILIKE '%welcome%' AND wl.is_organic AND NOT wl.is_paid) as organic_welcome_clicks
        FROM analytics_events ae
        INNER JOIN wisdom_leads wl ON ae.contact_id = wl.contact_id
        WHERE (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 6: Ad performance metrics
    ad_metrics AS (
        SELECT
            -- Meta totals
            SUM(spend) FILTER (WHERE platform ILIKE 'meta') as meta_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta') as meta_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta') as meta_impressions,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as meta_landing_page_views,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta') as meta_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta') as meta_purchases,
            
            -- Meta Sales campaigns
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_purchases,
            
            -- Meta Leads campaigns
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_purchases,
            
            -- Meta Retargeting campaigns
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_purchases,
            
            -- Meta Content campaigns
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_purchases,
            
            -- Meta Other campaigns
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_purchases,
            
            -- Google totals
            SUM(spend) FILTER (WHERE platform ILIKE 'google') as google_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'google') as google_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'google') as google_impressions,
            
            -- Total spend
            SUM(spend) as total_spend,
            
            -- Link clicks and landing page views
            SUM(link_clicks) as link_clicks,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as landing_page_views
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
    ),
    -- CTE 7: VSL metrics (video watch percentages) - only in date range
    vsl_metrics AS (
        SELECT
            -- FIX: Use vidalytics.view_video and extract percentage from value field
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'vidalytics.view_video' AND (ae.value ILIKE '%5%' OR ae.value ILIKE '%25%' OR ae.value ILIKE '%50%' OR ae.value ILIKE '%95%')) as vsl_5_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'vidalytics.view_video' AND (ae.value ILIKE '%25%' OR ae.value ILIKE '%50%' OR ae.value ILIKE '%95%')) as vsl_25_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'vidalytics.view_video' AND (ae.value ILIKE '%50%' OR ae.value ILIKE '%95%')) as vsl_50_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'vidalytics.view_video' AND ae.value ILIKE '%95%') as vsl_95_percent,
            COUNT(DISTINCT wo.contact_id) as vsl_purchasers
        FROM analytics_events ae
        LEFT JOIN wisdom_orders wo ON ae.contact_id = wo.contact_id
        WHERE (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
          AND ae.name = 'vidalytics.view_video'
    )
    
    -- Final SELECT: Build JSON response with ALL calculated fields
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalLeads', lm.total_leads,
            'totalWisdomSales', ps.wisdom_sales,
            'totalKingdomSeekers', ps.kingdom_seekers,
            'totalExtraJournals', ps.extra_journals,
            'totalExtraShipping', ps.extra_shipping,
            'totalRevenue', COALESCE(ps.total_revenue, 0),
            'totalSpend', COALESCE(am.total_spend, 0),
            'cpl', CASE WHEN lm.total_leads > 0 THEN COALESCE(am.total_spend, 0) / lm.total_leads ELSE 0 END,
            'cpp', CASE WHEN ps.wisdom_sales > 0 THEN COALESCE(am.total_spend, 0) / ps.wisdom_sales ELSE 0 END,
            'roas', CASE WHEN am.total_spend > 0 THEN COALESCE(ps.total_revenue, 0) / am.total_spend ELSE 0 END,
            'conversionRate', CASE WHEN lm.total_leads > 0 THEN (ps.wisdom_sales::float / lm.total_leads * 100) ELSE 0 END
        ),
        'paidAdsFunnel', jsonb_build_object(
            'leads', lm.paid_leads,
            'wisdomSales', ps.paid_wisdom_sales,
            'kingdomSeekers', ps.paid_kingdom_seekers,
            'extraJournals', ps.paid_extra_journals,
            'extraShipping', ps.paid_extra_shipping,
            'manychatConnected', lm.paid_manychat,
            'botAlertsSubscribed', em.paid_bot_alerts,
            'welcomeEmailClicks', em.paid_welcome_clicks
        ),
        'organicFunnel', jsonb_build_object(
            'leads', lm.organic_leads,
            'wisdomSales', ps.organic_wisdom_sales,
            'kingdomSeekers', ps.organic_kingdom_seekers,
            'extraJournals', ps.organic_extra_journals,
            'extraShipping', ps.organic_extra_shipping,
            'manychatConnected', lm.organic_manychat,
            'botAlertsSubscribed', em.organic_bot_alerts,
            'welcomeEmailClicks', em.organic_welcome_clicks
        ),
        'metaPerformance', jsonb_build_object(
            'spend', COALESCE(am.meta_spend, 0),
            'clicks', COALESCE(am.meta_clicks, 0),
            'impressions', COALESCE(am.meta_impressions, 0),
            'landingPageViews', COALESCE(am.meta_landing_page_views, 0),
            'linkClicks', COALESCE(am.link_clicks, 0),
            -- NEW: Add reportedLeads/reportedPurchases as leads/purchases for consistency
            'reportedLeads', COALESCE(am.meta_leads, 0),
            'reportedPurchases', COALESCE(am.meta_purchases, 0),
            'leads', COALESCE(am.meta_leads, 0),
            'purchases', COALESCE(am.meta_purchases, 0),
            -- NEW: Add all calculated fields
            'cpc', CASE WHEN am.meta_clicks > 0 THEN am.meta_spend / am.meta_clicks ELSE 0 END,
            'cpm', CASE WHEN am.meta_impressions > 0 THEN (am.meta_spend / am.meta_impressions) * 1000 ELSE 0 END,
            'ctr', CASE WHEN am.meta_impressions > 0 THEN (am.meta_clicks::numeric / am.meta_impressions) * 100 ELSE 0 END,
            'cpp', CASE WHEN am.meta_purchases > 0 THEN am.meta_spend / am.meta_purchases ELSE 0 END,
            'cpl', CASE WHEN am.meta_leads > 0 THEN am.meta_spend / am.meta_leads ELSE 0 END,
            'salesRate', CASE WHEN am.meta_impressions > 0 THEN (am.meta_purchases::numeric / am.meta_impressions) * 100 ELSE 0 END,
            'leadRate', CASE WHEN am.meta_impressions > 0 THEN (am.meta_leads::numeric / am.meta_impressions) * 100 ELSE 0 END
        ),
        'metaCampaignBreakdown', jsonb_build_object(
            'sales', jsonb_build_object(
                'spend', COALESCE(am.meta_sales_spend, 0),
                'clicks', COALESCE(am.meta_sales_clicks, 0),
                'impressions', COALESCE(am.meta_sales_impressions, 0),
                'reportedLeads', COALESCE(am.meta_sales_leads, 0),
                'reportedPurchases', COALESCE(am.meta_sales_purchases, 0),
                'leads', COALESCE(am.meta_sales_leads, 0),
                'purchases', COALESCE(am.meta_sales_purchases, 0),
                'cpc', CASE WHEN am.meta_sales_clicks > 0 THEN am.meta_sales_spend / am.meta_sales_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_spend / am.meta_sales_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_clicks::numeric / am.meta_sales_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_sales_purchases > 0 THEN am.meta_sales_spend / am.meta_sales_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_sales_leads > 0 THEN am.meta_sales_spend / am.meta_sales_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_purchases::numeric / am.meta_sales_impressions) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_leads::numeric / am.meta_sales_impressions) * 100 ELSE 0 END
            ),
            'leads', jsonb_build_object(
                'spend', COALESCE(am.meta_leads_spend, 0),
                'clicks', COALESCE(am.meta_leads_clicks, 0),
                'impressions', COALESCE(am.meta_leads_impressions, 0),
                'reportedLeads', COALESCE(am.meta_leads_leads, 0),
                'reportedPurchases', COALESCE(am.meta_leads_purchases, 0),
                'leads', COALESCE(am.meta_leads_leads, 0),
                'purchases', COALESCE(am.meta_leads_purchases, 0),
                'cpc', CASE WHEN am.meta_leads_clicks > 0 THEN am.meta_leads_spend / am.meta_leads_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_spend / am.meta_leads_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_clicks::numeric / am.meta_leads_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_leads_purchases > 0 THEN am.meta_leads_spend / am.meta_leads_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_leads_leads > 0 THEN am.meta_leads_spend / am.meta_leads_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_purchases::numeric / am.meta_leads_impressions) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_leads::numeric / am.meta_leads_impressions) * 100 ELSE 0 END
            ),
            'retargeting', jsonb_build_object(
                'spend', COALESCE(am.meta_retargeting_spend, 0),
                'clicks', COALESCE(am.meta_retargeting_clicks, 0),
                'impressions', COALESCE(am.meta_retargeting_impressions, 0),
                'reportedLeads', COALESCE(am.meta_retargeting_leads, 0),
                'reportedPurchases', COALESCE(am.meta_retargeting_purchases, 0),
                'leads', COALESCE(am.meta_retargeting_leads, 0),
                'purchases', COALESCE(am.meta_retargeting_purchases, 0),
                'cpc', CASE WHEN am.meta_retargeting_clicks > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_spend / am.meta_retargeting_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_clicks::numeric / am.meta_retargeting_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_retargeting_purchases > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_retargeting_leads > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_purchases::numeric / am.meta_retargeting_impressions) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_leads::numeric / am.meta_retargeting_impressions) * 100 ELSE 0 END
            ),
            'content', jsonb_build_object(
                'spend', COALESCE(am.meta_content_spend, 0),
                'clicks', COALESCE(am.meta_content_clicks, 0),
                'impressions', COALESCE(am.meta_content_impressions, 0),
                'reportedLeads', COALESCE(am.meta_content_leads, 0),
                'reportedPurchases', COALESCE(am.meta_content_purchases, 0),
                'leads', COALESCE(am.meta_content_leads, 0),
                'purchases', COALESCE(am.meta_content_purchases, 0),
                'cpc', CASE WHEN am.meta_content_clicks > 0 THEN am.meta_content_spend / am.meta_content_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_spend / am.meta_content_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_clicks::numeric / am.meta_content_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_content_purchases > 0 THEN am.meta_content_spend / am.meta_content_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_content_leads > 0 THEN am.meta_content_spend / am.meta_content_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_purchases::numeric / am.meta_content_impressions) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_leads::numeric / am.meta_content_impressions) * 100 ELSE 0 END
            ),
            'other', jsonb_build_object(
                'spend', COALESCE(am.meta_other_spend, 0),
                'clicks', COALESCE(am.meta_other_clicks, 0),
                'impressions', COALESCE(am.meta_other_impressions, 0),
                'reportedLeads', COALESCE(am.meta_other_leads, 0),
                'reportedPurchases', COALESCE(am.meta_other_purchases, 0),
                'leads', COALESCE(am.meta_other_leads, 0),
                'purchases', COALESCE(am.meta_other_purchases, 0),
                'cpc', CASE WHEN am.meta_other_clicks > 0 THEN am.meta_other_spend / am.meta_other_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_spend / am.meta_other_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_clicks::numeric / am.meta_other_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_other_purchases > 0 THEN am.meta_other_spend / am.meta_other_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_other_leads > 0 THEN am.meta_other_spend / am.meta_other_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_purchases::numeric / am.meta_other_impressions) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_leads::numeric / am.meta_other_impressions) * 100 ELSE 0 END
            )
        ),
        'googlePerformance', jsonb_build_object(
            'spend', COALESCE(am.google_spend, 0),
            'clicks', COALESCE(am.google_clicks, 0),
            'impressions', COALESCE(am.google_impressions, 0),
            -- NEW: Add calculated fields for Google
            'cpc', CASE WHEN am.google_clicks > 0 THEN am.google_spend / am.google_clicks ELSE 0 END,
            'cpm', CASE WHEN am.google_impressions > 0 THEN (am.google_spend / am.google_impressions) * 1000 ELSE 0 END,
            'ctr', CASE WHEN am.google_impressions > 0 THEN (am.google_clicks::numeric / am.google_impressions) * 100 ELSE 0 END
        ),
        'vslPerformance', jsonb_build_object(
            'watched5Percent', COALESCE(vm.vsl_5_percent, 0),
            'watched25Percent', COALESCE(vm.vsl_25_percent, 0),
            'watched50Percent', COALESCE(vm.vsl_50_percent, 0),
            'watched95Percent', COALESCE(vm.vsl_95_percent, 0),
            'purchasers', COALESCE(vm.vsl_purchasers, 0)
        )
    ) INTO v_result
    FROM lead_metrics lm
    CROSS JOIN product_sales ps
    CROSS JOIN engagement_metrics em
    CROSS JOIN ad_metrics am
    CROSS JOIN vsl_metrics vm;
    
    RETURN v_result;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO anon;
