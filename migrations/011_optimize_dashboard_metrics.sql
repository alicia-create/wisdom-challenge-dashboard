-- ============================================================================
-- OPTIMIZATION: get_dashboard_metrics v2.0
-- ============================================================================
-- Performance improvements:
-- 1. Use wisdom_contacts materialized view instead of EXISTS subqueries
-- 2. Create composite indexes for fast lookups
-- 3. Use JOINs instead of correlated subqueries
-- 4. Batch similar queries together
-- ============================================================================

-- Step 1: Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_contact_name_comment 
ON analytics_events(contact_id, name, comment);

CREATE INDEX IF NOT EXISTS idx_analytics_events_wisdom_forms 
ON analytics_events(contact_id, timestamp) 
WHERE name = 'form.submitted' AND comment ILIKE '%wisdom%';

CREATE INDEX IF NOT EXISTS idx_contacts_created_wisdom 
ON contacts(id, created_at) 
WHERE id IN (SELECT contact_id FROM wisdom_contacts);

CREATE INDEX IF NOT EXISTS idx_orders_created_funnel 
ON orders(created_at, funnel_name, billing_status);

CREATE INDEX IF NOT EXISTS idx_order_items_product 
ON order_items(order_id, product_id);

CREATE INDEX IF NOT EXISTS idx_ad_performance_date_platform 
ON ad_performance(date, platform, campaign_type);

-- Step 2: Drop and recreate optimized function
DROP FUNCTION IF EXISTS get_dashboard_metrics(date, date);

CREATE OR REPLACE FUNCTION get_dashboard_metrics(
    p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_result JSONB;
    v_start_ts TIMESTAMP;
    v_end_ts TIMESTAMP;
BEGIN
    -- Convert dates to LA timezone timestamps
    v_start_ts := (p_start_date::timestamp AT TIME ZONE 'America/Los_Angeles');
    v_end_ts := ((p_end_date + INTERVAL '1 day')::timestamp AT TIME ZONE 'America/Los_Angeles');
    
    -- Build result using CTEs for better performance
    WITH 
    -- CTE 1: Get wisdom contact IDs in date range (use materialized view)
    wisdom_leads AS (
        SELECT DISTINCT c.id, c.created_at
        FROM contacts c
        INNER JOIN wisdom_contacts wc ON c.id = wc.contact_id
        WHERE (c.created_at AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (c.created_at AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 2: Classify leads as paid/organic based on form submission events
    lead_classification AS (
        SELECT 
            wl.id,
            BOOL_OR(ae.comment ILIKE '%31daywisdom.com%') as is_paid,
            BOOL_OR(ae.comment ILIKE '%31daywisdomchallenge.com%') as is_organic
        FROM wisdom_leads wl
        INNER JOIN analytics_events ae ON wl.id = ae.contact_id
        WHERE ae.name = 'form.submitted'
          AND (ae.comment ILIKE '%31daywisdom.com%' OR ae.comment ILIKE '%31daywisdomchallenge.com%')
        GROUP BY wl.id
    ),
    -- CTE 3: Lead counts
    lead_metrics AS (
        SELECT
            COUNT(*) as total_leads,
            COUNT(*) FILTER (WHERE is_paid) as paid_leads,
            COUNT(*) FILTER (WHERE is_organic AND NOT is_paid) as organic_leads
        FROM lead_classification
    ),
    -- CTE 4: Orders in date range for wisdom funnel
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
    -- CTE 5: Product sales (Wisdom+, Kingdom Seekers, Extra Journals, Extra Shipping)
    product_sales AS (
        SELECT
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1) as wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 1 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_wisdom_sales,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 8) as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 8 AND wo.funnel_name LIKE '%31daywisdom.com%') as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE oi.product_id = 8 AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_kingdom_seekers,
            
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
    -- CTE 6: ManyChat connected contacts
    manychat_metrics AS (
        SELECT
            COUNT(DISTINCT lc.id) FILTER (WHERE c.manychat_id IS NOT NULL) as total_manychat,
            COUNT(DISTINCT lc.id) FILTER (WHERE c.manychat_id IS NOT NULL AND lc.is_paid) as paid_manychat,
            COUNT(DISTINCT lc.id) FILTER (WHERE c.manychat_id IS NOT NULL AND lc.is_organic AND NOT lc.is_paid) as organic_manychat
        FROM lead_classification lc
        INNER JOIN contacts c ON lc.id = c.id
    ),
    -- CTE 7: Bot alerts (gold.ntn.request_accepted tag)
    bot_alert_metrics AS (
        SELECT
            COUNT(DISTINCT lc.id) as total_bot_alerts,
            COUNT(DISTINCT lc.id) FILTER (WHERE lc.is_paid) as paid_bot_alerts,
            COUNT(DISTINCT lc.id) FILTER (WHERE lc.is_organic AND NOT lc.is_paid) as organic_bot_alerts
        FROM lead_classification lc
        INNER JOIN analytics_events ae ON lc.id = ae.contact_id
        WHERE ae.name = 'manychat.add_tag'
          AND ae.value = 'gold.ntn.request_accepted'
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 8: Welcome email clicks
    welcome_email_metrics AS (
        SELECT
            COUNT(DISTINCT lc.id) as total_welcome_clicks,
            COUNT(DISTINCT lc.id) FILTER (WHERE lc.is_paid) as paid_welcome_clicks,
            COUNT(DISTINCT lc.id) FILTER (WHERE lc.is_organic AND NOT lc.is_paid) as organic_welcome_clicks
        FROM lead_classification lc
        INNER JOIN analytics_events ae ON lc.id = ae.contact_id
        WHERE ae.name = 'keap.add_tag'
          AND ae.value ILIKE '%Clicked NTN In Email%'
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
          AND (ae.timestamp AT TIME ZONE 'America/Los_Angeles') < v_end_ts
    ),
    -- CTE 9: Ad performance (Meta + Google)
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
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%sales%') as meta_sales_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%sales%') as meta_sales_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%sales%') as meta_sales_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%sales%') as meta_sales_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%sales%') as meta_sales_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%lead%') as meta_leads_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%lead%') as meta_leads_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%lead%') as meta_leads_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%lead%') as meta_leads_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%lead%') as meta_leads_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%retarget%') as meta_retargeting_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%retarget%') as meta_retargeting_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%retarget%') as meta_retargeting_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%retarget%') as meta_retargeting_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%retarget%') as meta_retargeting_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%content%') as meta_content_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%content%') as meta_content_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%content%') as meta_content_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%content%') as meta_content_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_type ILIKE '%content%') as meta_content_purchases,
            
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_type NOT ILIKE '%sales%' AND campaign_type NOT ILIKE '%lead%' AND campaign_type NOT ILIKE '%retarget%' AND campaign_type NOT ILIKE '%content%') as meta_other_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_type NOT ILIKE '%sales%' AND campaign_type NOT ILIKE '%lead%' AND campaign_type NOT ILIKE '%retarget%' AND campaign_type NOT ILIKE '%content%') as meta_other_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_type NOT ILIKE '%sales%' AND campaign_type NOT ILIKE '%lead%' AND campaign_type NOT ILIKE '%retarget%' AND campaign_type NOT ILIKE '%content%') as meta_other_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_type NOT ILIKE '%sales%' AND campaign_type NOT ILIKE '%lead%' AND campaign_type NOT ILIKE '%retarget%' AND campaign_type NOT ILIKE '%content%') as meta_other_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_type NOT ILIKE '%sales%' AND campaign_type NOT ILIKE '%lead%' AND campaign_type NOT ILIKE '%retarget%' AND campaign_type NOT ILIKE '%content%') as meta_other_purchases,
            
            -- Google totals
            SUM(spend) FILTER (WHERE platform ILIKE 'google') as google_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'google') as google_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'google') as google_impressions,
            SUM(reported_conversions) FILTER (WHERE platform ILIKE 'google') as google_conversions,
            
            -- Leads/Sales campaign spend
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND (campaign_type ILIKE '%lead%' OR campaign_type ILIKE '%sales%')) as leads_sales_spend,
            
            -- Total spend
            SUM(spend) as total_spend,
            
            -- Link clicks and landing page views
            SUM(link_clicks) as link_clicks,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as landing_page_views
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
    ),
    -- CTE 10: VSL metrics (video watch percentages)
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
            'manychatConnected', mm.paid_manychat,
            'botAlertsSubscribed', bam.paid_bot_alerts,
            'welcomeEmailClicks', wem.paid_welcome_clicks
        ),
        'organicFunnel', jsonb_build_object(
            'leads', lm.organic_leads,
            'wisdomSales', ps.organic_wisdom_sales,
            'kingdomSeekers', ps.organic_kingdom_seekers,
            'extraJournals', ps.organic_extra_journals,
            'extraShipping', ps.organic_extra_shipping,
            'manychatConnected', mm.organic_manychat,
            'botAlertsSubscribed', bam.organic_bot_alerts,
            'welcomeEmailClicks', wem.organic_welcome_clicks
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
            'impressions', COALESCE(am.google_impressions, 0),
            'conversions', COALESCE(am.google_conversions, 0)
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
    CROSS JOIN manychat_metrics mm
    CROSS JOIN bot_alert_metrics bam
    CROSS JOIN welcome_email_metrics wem
    CROSS JOIN ad_metrics am
    CROSS JOIN vsl_metrics vm;
    
    RETURN v_result;
END;
$function$;

-- Step 3: Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO anon;

-- Step 4: Test the optimized function
-- SELECT get_dashboard_metrics('2025-12-20'::date, '2025-12-22'::date);
