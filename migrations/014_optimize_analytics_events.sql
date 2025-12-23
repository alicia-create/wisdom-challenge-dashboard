-- ============================================================================
-- Migration 014: Optimize analytics_events + Add missing fields
-- ============================================================================
-- PERFORMANCE: Create materialized view for engagement events
-- MISSING FIELDS: Add Google conversions, ensure bot/VSL metrics are complete
-- ============================================================================

-- Step 1: Create indexes on analytics_events for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_timestamp 
ON analytics_events(name, timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_events_contact_name_timestamp 
ON analytics_events(contact_id, name, timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_value 
ON analytics_events(name, value) 
WHERE name IN ('manychat.add_tag', 'keap.add_tag', 'video.watched');

-- Step 2: Create materialized view for engagement events
DROP MATERIALIZED VIEW IF EXISTS wisdom_engagement_events CASCADE;

CREATE MATERIALIZED VIEW wisdom_engagement_events AS
SELECT 
    ae.contact_id,
    ae.timestamp,
    wlc.is_paid,
    wlc.is_organic,
    -- Bot subscription events
    CASE WHEN ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted' THEN 1 ELSE 0 END as is_bot_subscribed,
    -- Welcome email clicks
    CASE WHEN ae.name = 'keap.add_tag' AND ae.value ILIKE '%Clicked NTN In Email%' THEN 1 ELSE 0 END as is_welcome_click,
    -- VSL watch percentages
    CASE WHEN ae.name = 'video.watched' AND ae.value::int >= 5 THEN 1 ELSE 0 END as watched_5,
    CASE WHEN ae.name = 'video.watched' AND ae.value::int >= 25 THEN 1 ELSE 0 END as watched_25,
    CASE WHEN ae.name = 'video.watched' AND ae.value::int >= 50 THEN 1 ELSE 0 END as watched_50,
    CASE WHEN ae.name = 'video.watched' AND ae.value::int >= 95 THEN 1 ELSE 0 END as watched_95
FROM analytics_events ae
LEFT JOIN wisdom_lead_classification wlc ON ae.contact_id = wlc.contact_id
WHERE ae.name IN ('manychat.add_tag', 'keap.add_tag', 'video.watched')
  AND (
      (ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted')
      OR (ae.name = 'keap.add_tag' AND ae.value ILIKE '%Clicked NTN In Email%')
      OR (ae.name = 'video.watched')
  );

-- Create indexes on materialized view
CREATE INDEX idx_wisdom_engagement_contact 
ON wisdom_engagement_events(contact_id);

CREATE INDEX idx_wisdom_engagement_timestamp 
ON wisdom_engagement_events(timestamp);

CREATE INDEX idx_wisdom_engagement_paid 
ON wisdom_engagement_events(is_paid) 
WHERE is_paid = true;

CREATE INDEX idx_wisdom_engagement_organic 
ON wisdom_engagement_events(is_organic) 
WHERE is_organic = true AND is_paid = false;

-- Step 3: Update get_dashboard_metrics to use materialized view and add Google conversions
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
    
    -- Build result using CTEs with materialized views
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
    -- CTE 2: Lead counts
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
            COUNT(DISTINCT wo.id) as wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE wl.is_paid) as paid_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE wl.is_organic AND NOT wl.is_paid) as organic_wisdom_sales,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%') as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%' AND wl.is_paid) as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%' AND wl.is_organic AND NOT wl.is_paid) as organic_kingdom_seekers,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%') as extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%' AND wl.is_paid) as paid_extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%' AND wl.is_organic AND NOT wl.is_paid) as organic_extra_journals,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%') as extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%' AND wl.is_paid) as paid_extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%' AND wl.is_organic AND NOT wl.is_paid) as organic_extra_shipping,
            
            SUM(wo.order_total) as total_revenue,
            SUM(wo.order_total) FILTER (WHERE wl.is_paid) as paid_revenue,
            SUM(wo.order_total) FILTER (WHERE wl.is_organic AND NOT wl.is_paid) as organic_revenue
        FROM wisdom_orders wo
        LEFT JOIN wisdom_leads wl ON wo.contact_id = wl.contact_id
    ),
    -- CTE 5: Engagement metrics using materialized view (OPTIMIZED)
    engagement_metrics AS (
        SELECT
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.is_bot_subscribed = 1 AND wee.is_paid) as paid_bot_alerts,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.is_bot_subscribed = 1 AND wee.is_organic AND NOT wee.is_paid) as organic_bot_alerts,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.is_welcome_click = 1 AND wee.is_paid) as paid_welcome_clicks,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.is_welcome_click = 1 AND wee.is_organic AND NOT wee.is_paid) as organic_welcome_clicks
        FROM wisdom_engagement_events wee
        WHERE (wee.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (wee.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 6: Ad performance metrics (ADDED GOOGLE CONVERSIONS)
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
            
            -- Google totals (ADDED CONVERSIONS)
            SUM(spend) FILTER (WHERE platform ILIKE 'google') as google_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'google') as google_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'google') as google_impressions,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'google') as google_purchases,
            
            -- Total spend
            SUM(spend) as total_spend,
            
            -- Link clicks and landing page views
            SUM(link_clicks) as link_clicks,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as landing_page_views
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
    ),
    -- CTE 7: VSL metrics using materialized view (OPTIMIZED)
    vsl_metrics AS (
        SELECT
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.watched_5 = 1) as vsl_5_percent,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.watched_25 = 1) as vsl_25_percent,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.watched_50 = 1) as vsl_50_percent,
            COUNT(DISTINCT wee.contact_id) FILTER (WHERE wee.watched_95 = 1) as vsl_95_percent,
            COUNT(DISTINCT wo.contact_id) as vsl_purchasers
        FROM wisdom_engagement_events wee
        LEFT JOIN wisdom_orders wo ON wee.contact_id = wo.contact_id
        WHERE (wee.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (wee.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
          AND (wee.watched_5 = 1 OR wee.watched_25 = 1 OR wee.watched_50 = 1 OR wee.watched_95 = 1)
    )
    
    -- Final SELECT: Build JSON response with ALL fields
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
            'reportedLeads', COALESCE(am.meta_leads, 0),
            'reportedPurchases', COALESCE(am.meta_purchases, 0),
            'leads', COALESCE(am.meta_leads, 0),
            'purchases', COALESCE(am.meta_purchases, 0),
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
            'reportedPurchases', COALESCE(am.google_purchases, 0),
            'purchases', COALESCE(am.google_purchases, 0),
            'conversions', COALESCE(am.google_purchases, 0),
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

-- Step 4: Create function to refresh engagement materialized view
CREATE OR REPLACE FUNCTION refresh_wisdom_engagement_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_engagement_events;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_wisdom_engagement_events() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_wisdom_engagement_events() TO anon;
