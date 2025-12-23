-- ============================================================================
-- Migration 017: Fix Kingdom Seekers Count (Include Product ID 9)
-- BUG FIX: Kingdom Seekers was showing 0 because SQL only counted product_id = 8
-- SOLUTION: Include both product IDs (8 and 9) for Kingdom Seekers products
-- ============================================================================

-- Step 1: Increase statement timeout for the function
ALTER DATABASE postgres SET statement_timeout = '120s';

-- Step 2: Increase timeout for current session
SET statement_timeout = '120s';

-- Step 3: Create materialized view for lead classification (paid vs organic)
DROP MATERIALIZED VIEW IF EXISTS wisdom_lead_classification CASCADE;

CREATE MATERIALIZED VIEW wisdom_lead_classification AS
SELECT 
    c.id as contact_id,
    c.created_at,
    BOOL_OR(ae.comment ILIKE '%31daywisdom.com%') as is_paid,
    BOOL_OR(ae.comment ILIKE '%31daywisdomchallenge.com%') as is_organic,
    c.manychat_id IS NOT NULL as has_manychat
FROM contacts c
INNER JOIN wisdom_contacts wc ON c.id = wc.contact_id
INNER JOIN analytics_events ae ON c.id = ae.contact_id
WHERE ae.name = 'form.submitted'
  AND (ae.comment ILIKE '%31daywisdom.com%' OR ae.comment ILIKE '%31daywisdomchallenge.com%')
GROUP BY c.id, c.created_at, c.manychat_id;

CREATE UNIQUE INDEX idx_wisdom_lead_classification_contact 
ON wisdom_lead_classification(contact_id);

CREATE INDEX idx_wisdom_lead_classification_created 
ON wisdom_lead_classification(created_at);

CREATE INDEX idx_wisdom_lead_classification_paid 
ON wisdom_lead_classification(is_paid) WHERE is_paid = true;

CREATE INDEX idx_wisdom_lead_classification_organic 
ON wisdom_lead_classification(is_organic) WHERE is_organic = true AND is_paid = false;

-- Step 4: Update get_dashboard_metrics to use materialized view
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
    -- CTE 4: Product sales (Wisdom+, Kingdom Seekers, Extra Journals, Extra Shipping)
    product_sales AS (
        SELECT
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1) as wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_wisdom_sales,
            
            -- FIX: Include BOTH Kingdom Seekers products (ID 8 and 9)
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9)) as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9) AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id IN (8, 9) AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_kingdom_seekers,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4) as extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 4 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_journals,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2) as extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 2 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_shipping,
            
            SUM(wo.order_total) as total_revenue
        FROM wisdom_orders wo
        INNER JOIN order_items oi ON wo.id = oi.order_id
    ),
    -- CTE 5: Bot alerts and welcome email clicks (only scan events in date range)
    engagement_metrics AS (
        SELECT
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'manychat.add_tag' 
                AND ae.value = 'gold.ntn.request_accepted'
            ) as total_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'manychat.add_tag' 
                AND ae.value = 'gold.ntn.request_accepted'
                AND EXISTS (SELECT 1 FROM wisdom_leads wl WHERE wl.contact_id = ae.contact_id AND wl.is_paid)
            ) as paid_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'manychat.add_tag' 
                AND ae.value = 'gold.ntn.request_accepted'
                AND EXISTS (SELECT 1 FROM wisdom_leads wl WHERE wl.contact_id = ae.contact_id AND wl.is_organic AND NOT wl.is_paid)
            ) as organic_bot_alerts,
            
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'keap.add_tag' 
                AND ae.value ILIKE '%Clicked NTN In Email%'
            ) as total_welcome_clicks,
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'keap.add_tag' 
                AND ae.value ILIKE '%Clicked NTN In Email%'
                AND EXISTS (SELECT 1 FROM wisdom_leads wl WHERE wl.contact_id = ae.contact_id AND wl.is_paid)
            ) as paid_welcome_clicks,
            COUNT(DISTINCT ae.contact_id) FILTER (
                WHERE ae.name = 'keap.add_tag' 
                AND ae.value ILIKE '%Clicked NTN In Email%'
                AND EXISTS (SELECT 1 FROM wisdom_leads wl WHERE wl.contact_id = ae.contact_id AND wl.is_organic AND NOT wl.is_paid)
            ) as organic_welcome_clicks
        FROM analytics_events ae
        WHERE (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
          AND (
              (ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted')
              OR (ae.name = 'keap.add_tag' AND ae.value ILIKE '%Clicked NTN In Email%')
          )
    ),
    -- CTE 6: Ad performance (Meta + Google)
    ad_metrics AS (
        SELECT
            -- Meta totals
            SUM(spend) FILTER (WHERE platform ILIKE 'meta') as meta_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta') as meta_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta') as meta_impressions,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as meta_landing_page_views,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta') as meta_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta') as meta_purchases,
            
            -- Meta by campaign type
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%') as meta_leads_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%') as meta_leads_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%') as meta_leads_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%') as meta_leads_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%') as meta_leads_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%retarget%') as meta_retargeting_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%content%') as meta_content_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name NOT ILIKE '%sales%' AND campaign_name NOT ILIKE '%lead%' AND campaign_name NOT ILIKE '%retarget%' AND campaign_name NOT ILIKE '%content%') as meta_other_purchases,
            
            -- Google totals
            SUM(spend) FILTER (WHERE platform ILIKE 'google') as google_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'google') as google_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'google') as google_impressions,
            -- Google conversions not available in ad_performance table
            
            -- Leads/Sales campaign spend
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND (campaign_name ILIKE '%lead%' OR campaign_name ILIKE '%sales%')) as leads_sales_spend,
            
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
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'video.watched' AND ae.value::int >= 5) as vsl_5_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'video.watched' AND ae.value::int >= 25) as vsl_25_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'video.watched' AND ae.value::int >= 50) as vsl_50_percent,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'video.watched' AND ae.value::int >= 95) as vsl_95_percent,
            COUNT(DISTINCT wo.contact_id) as vsl_purchasers
        FROM analytics_events ae
        LEFT JOIN wisdom_orders wo ON ae.contact_id = wo.contact_id
        WHERE (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
          AND ae.name = 'video.watched'
    )
    
    -- Final SELECT: Build JSON response
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
            'reportedLeads', COALESCE(am.meta_leads, 0),
            'reportedPurchases', COALESCE(am.meta_purchases, 0),
            'linkClicks', COALESCE(am.link_clicks, 0)
        ),
        'metaCampaignBreakdown', jsonb_build_object(
            'sales', jsonb_build_object(
                'spend', COALESCE(am.meta_sales_spend, 0),
                'clicks', COALESCE(am.meta_sales_clicks, 0),
                'impressions', COALESCE(am.meta_sales_impressions, 0),
                'reportedLeads', COALESCE(am.meta_sales_leads, 0),
                'reportedPurchases', COALESCE(am.meta_sales_purchases, 0)
            ),
            'leads', jsonb_build_object(
                'spend', COALESCE(am.meta_leads_spend, 0),
                'clicks', COALESCE(am.meta_leads_clicks, 0),
                'impressions', COALESCE(am.meta_leads_impressions, 0),
                'reportedLeads', COALESCE(am.meta_leads_leads, 0),
                'reportedPurchases', COALESCE(am.meta_leads_purchases, 0)
            ),
            'retargeting', jsonb_build_object(
                'spend', COALESCE(am.meta_retargeting_spend, 0),
                'clicks', COALESCE(am.meta_retargeting_clicks, 0),
                'impressions', COALESCE(am.meta_retargeting_impressions, 0),
                'reportedLeads', COALESCE(am.meta_retargeting_leads, 0),
                'reportedPurchases', COALESCE(am.meta_retargeting_purchases, 0)
            ),
            'content', jsonb_build_object(
                'spend', COALESCE(am.meta_content_spend, 0),
                'clicks', COALESCE(am.meta_content_clicks, 0),
                'impressions', COALESCE(am.meta_content_impressions, 0),
                'reportedLeads', COALESCE(am.meta_content_leads, 0),
                'reportedPurchases', COALESCE(am.meta_content_purchases, 0)
            ),
            'other', jsonb_build_object(
                'spend', COALESCE(am.meta_other_spend, 0),
                'clicks', COALESCE(am.meta_other_clicks, 0),
                'impressions', COALESCE(am.meta_other_impressions, 0),
                'reportedLeads', COALESCE(am.meta_other_leads, 0),
                'reportedPurchases', COALESCE(am.meta_other_purchases, 0)
            )
        ),
        'googlePerformance', jsonb_build_object(
            'spend', COALESCE(am.google_spend, 0),
            'clicks', COALESCE(am.google_clicks, 0),
            'impressions', COALESCE(am.google_impressions, 0)
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

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO anon;

-- Step 6: Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_wisdom_lead_classification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY wisdom_lead_classification;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_wisdom_lead_classification() TO authenticated;

-- Note: Schedule this to run every 5 minutes via pg_cron or external scheduler:
-- SELECT cron.schedule('refresh-wisdom-leads', '*/5 * * * *', 'SELECT refresh_wisdom_lead_classification()');
