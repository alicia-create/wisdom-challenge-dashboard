-- ============================================================================
-- Migration 017: Fix Kingdom Seekers Count (Include Product ID 9)
-- ============================================================================
-- BUG FIX: Kingdom Seekers was showing 0 because SQL only counted product_id = 8
-- SOLUTION: Include both product IDs (8 and 9) for Kingdom Seekers products
-- ============================================================================

-- Update get_dashboard_metrics to count BOTH Kingdom Seekers products
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
    -- CTE 5: Engagement metrics from materialized view
    engagement_metrics AS (
        SELECT
            total_bot_subscribed,
            paid_bot_subscribed,
            organic_bot_subscribed,
            total_welcome_email_clicks,
            paid_welcome_email_clicks,
            organic_welcome_email_clicks,
            vsl_5_percent,
            vsl_25_percent,
            vsl_50_percent,
            vsl_95_percent
        FROM wisdom_engagement_events
        WHERE date_range_start >= p_start_date
          AND date_range_end <= p_end_date
        LIMIT 1
    ),
    -- CTE 6: Meta Ads performance
    meta_performance AS (
        SELECT
            SUM(spend) as spend,
            SUM(reported_purchases) as purchases,
            SUM(reported_leads) as leads,
            SUM(clicks) as clicks,
            SUM(impressions) as impressions,
            -- Calculated fields
            CASE WHEN SUM(reported_purchases) > 0 
                THEN ROUND(SUM(spend) / SUM(reported_purchases), 2)
                ELSE 0 
            END as cpp,
            CASE WHEN SUM(reported_leads) > 0 
                THEN ROUND(SUM(spend) / SUM(reported_leads), 2)
                ELSE 0 
            END as cpl,
            CASE WHEN SUM(reported_purchases) > 0 AND SUM(reported_leads) > 0
                THEN ROUND((SUM(reported_purchases)::numeric / SUM(reported_leads)) * 100, 2)
                ELSE 0 
            END as sales_rate,
            CASE WHEN SUM(impressions) > 0 AND SUM(clicks) > 0
                THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2)
                ELSE 0 
            END as ctr,
            CASE WHEN SUM(clicks) > 0 
                THEN ROUND(SUM(spend) / SUM(clicks), 2)
                ELSE 0 
            END as cpc,
            CASE WHEN SUM(impressions) > 0 
                THEN ROUND((SUM(spend) / SUM(impressions)) * 1000, 2)
                ELSE 0 
            END as cpm,
            CASE WHEN SUM(clicks) > 0 AND SUM(reported_leads) > 0
                THEN ROUND((SUM(reported_leads)::numeric / SUM(clicks)) * 100, 2)
                ELSE 0 
            END as lead_rate
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
          AND platform = 'meta'
    ),
    -- CTE 7: Meta campaign breakdown by type
    meta_breakdown AS (
        SELECT
            cfm.funnel_type,
            SUM(ap.spend) as spend,
            SUM(ap.reported_purchases) as purchases,
            SUM(ap.reported_leads) as leads,
            SUM(ap.clicks) as clicks,
            SUM(ap.impressions) as impressions,
            -- Calculated fields
            CASE WHEN SUM(ap.reported_purchases) > 0 
                THEN ROUND(SUM(ap.spend) / SUM(ap.reported_purchases), 2)
                ELSE 0 
            END as cpp,
            CASE WHEN SUM(ap.reported_leads) > 0 
                THEN ROUND(SUM(ap.spend) / SUM(ap.reported_leads), 2)
                ELSE 0 
            END as cpl,
            CASE WHEN SUM(ap.reported_purchases) > 0 AND SUM(ap.reported_leads) > 0
                THEN ROUND((SUM(ap.reported_purchases)::numeric / SUM(ap.reported_leads)) * 100, 2)
                ELSE 0 
            END as sales_rate,
            CASE WHEN SUM(ap.impressions) > 0 AND SUM(ap.clicks) > 0
                THEN ROUND((SUM(ap.clicks)::numeric / SUM(ap.impressions)) * 100, 2)
                ELSE 0 
            END as ctr,
            CASE WHEN SUM(ap.clicks) > 0 
                THEN ROUND(SUM(ap.spend) / SUM(ap.clicks), 2)
                ELSE 0 
            END as cpc,
            CASE WHEN SUM(ap.impressions) > 0 
                THEN ROUND((SUM(ap.spend) / SUM(ap.impressions)) * 1000, 2)
                ELSE 0 
            END as cpm,
            CASE WHEN SUM(ap.clicks) > 0 AND SUM(ap.reported_leads) > 0
                THEN ROUND((SUM(ap.reported_leads)::numeric / SUM(ap.clicks)) * 100, 2)
                ELSE 0 
            END as lead_rate
        FROM ad_performance ap
        LEFT JOIN campaign_funnel_mapping cfm ON ap.campaign_id = cfm.campaign_id
        WHERE ap.date >= p_start_date
          AND ap.date <= p_end_date
          AND ap.platform = 'meta'
        GROUP BY cfm.funnel_type
    ),
    -- CTE 8: Google Ads performance
    google_performance AS (
        SELECT
            SUM(spend) as spend,
            SUM(clicks) as clicks,
            SUM(impressions) as impressions,
            SUM(reported_purchases) as conversions,
            -- Calculated fields
            CASE WHEN SUM(clicks) > 0 
                THEN ROUND(SUM(spend) / SUM(clicks), 2)
                ELSE 0 
            END as cpc,
            CASE WHEN SUM(impressions) > 0 
                THEN ROUND((SUM(spend) / SUM(impressions)) * 1000, 2)
                ELSE 0 
            END as cpm,
            CASE WHEN SUM(impressions) > 0 AND SUM(clicks) > 0
                THEN ROUND((SUM(clicks)::numeric / SUM(impressions)) * 100, 2)
                ELSE 0 
            END as ctr
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
          AND platform = 'google'
    )
    
    -- Final assembly
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalLeads', lm.total_leads,
            'totalWisdomSales', ps.wisdom_sales,
            'totalKingdomSeekers', ps.kingdom_seekers,
            'totalExtraJournals', ps.extra_journals,
            'totalExtraShipping', ps.extra_shipping,
            'totalRevenue', COALESCE(ps.total_revenue, 0),
            'totalSpend', COALESCE(mp.spend, 0) + COALESCE(gp.spend, 0),
            'conversionRate', CASE WHEN lm.total_leads > 0 THEN ROUND((ps.wisdom_sales::numeric / lm.total_leads) * 100, 2) ELSE 0 END,
            'cpp', CASE WHEN ps.wisdom_sales > 0 THEN ROUND((COALESCE(mp.spend, 0) + COALESCE(gp.spend, 0)) / ps.wisdom_sales, 2) ELSE 0 END,
            'cpl', CASE WHEN lm.total_leads > 0 THEN ROUND((COALESCE(mp.spend, 0) + COALESCE(gp.spend, 0)) / lm.total_leads, 2) ELSE 0 END,
            'roas', CASE WHEN (COALESCE(mp.spend, 0) + COALESCE(gp.spend, 0)) > 0 THEN ROUND(COALESCE(ps.total_revenue, 0) / (COALESCE(mp.spend, 0) + COALESCE(gp.spend, 0)), 2) ELSE 0 END
        ),
        'paidAdsFunnel', jsonb_build_object(
            'leads', lm.paid_leads,
            'wisdomSales', ps.paid_wisdom_sales,
            'kingdomSeekers', ps.paid_kingdom_seekers,
            'extraJournals', ps.paid_extra_journals,
            'extraShipping', ps.paid_extra_shipping,
            'manychatConnected', lm.paid_manychat,
            'botSubscribed', COALESCE(em.paid_bot_subscribed, 0),
            'welcomeEmailClicks', COALESCE(em.paid_welcome_email_clicks, 0)
        ),
        'organicFunnel', jsonb_build_object(
            'leads', lm.organic_leads,
            'wisdomSales', ps.organic_wisdom_sales,
            'kingdomSeekers', ps.organic_kingdom_seekers,
            'extraJournals', ps.organic_extra_journals,
            'extraShipping', ps.organic_extra_shipping,
            'manychatConnected', lm.organic_manychat,
            'botSubscribed', COALESCE(em.organic_bot_subscribed, 0),
            'welcomeEmailClicks', COALESCE(em.organic_welcome_email_clicks, 0)
        ),
        'metaPerformance', jsonb_build_object(
            'spend', COALESCE(mp.spend, 0),
            'reportedPurchases', COALESCE(mp.purchases, 0),
            'reportedLeads', COALESCE(mp.leads, 0),
            'clicks', COALESCE(mp.clicks, 0),
            'impressions', COALESCE(mp.impressions, 0),
            'cpp', COALESCE(mp.cpp, 0),
            'cpl', COALESCE(mp.cpl, 0),
            'salesRate', COALESCE(mp.sales_rate, 0),
            'ctr', COALESCE(mp.ctr, 0),
            'cpc', COALESCE(mp.cpc, 0),
            'cpm', COALESCE(mp.cpm, 0),
            'leadRate', COALESCE(mp.lead_rate, 0)
        ),
        'metaCampaignBreakdown', jsonb_build_object(
            'sales', (SELECT jsonb_build_object(
                'spend', COALESCE(spend, 0),
                'reportedPurchases', COALESCE(purchases, 0),
                'reportedLeads', COALESCE(leads, 0),
                'clicks', COALESCE(clicks, 0),
                'impressions', COALESCE(impressions, 0),
                'cpp', COALESCE(cpp, 0),
                'cpl', COALESCE(cpl, 0),
                'salesRate', COALESCE(sales_rate, 0),
                'ctr', COALESCE(ctr, 0),
                'cpc', COALESCE(cpc, 0),
                'cpm', COALESCE(cpm, 0),
                'leadRate', COALESCE(lead_rate, 0)
            ) FROM meta_breakdown WHERE funnel_type = 'sales'),
            'leads', (SELECT jsonb_build_object(
                'spend', COALESCE(spend, 0),
                'reportedPurchases', COALESCE(purchases, 0),
                'reportedLeads', COALESCE(leads, 0),
                'clicks', COALESCE(clicks, 0),
                'impressions', COALESCE(impressions, 0),
                'cpp', COALESCE(cpp, 0),
                'cpl', COALESCE(cpl, 0),
                'salesRate', COALESCE(sales_rate, 0),
                'ctr', COALESCE(ctr, 0),
                'cpc', COALESCE(cpc, 0),
                'cpm', COALESCE(cpm, 0),
                'leadRate', COALESCE(lead_rate, 0)
            ) FROM meta_breakdown WHERE funnel_type = 'leads'),
            'retargeting', (SELECT jsonb_build_object(
                'spend', COALESCE(spend, 0),
                'reportedPurchases', COALESCE(purchases, 0),
                'reportedLeads', COALESCE(leads, 0),
                'clicks', COALESCE(clicks, 0),
                'impressions', COALESCE(impressions, 0),
                'cpp', COALESCE(cpp, 0),
                'cpl', COALESCE(cpl, 0),
                'salesRate', COALESCE(sales_rate, 0),
                'ctr', COALESCE(ctr, 0),
                'cpc', COALESCE(cpc, 0),
                'cpm', COALESCE(cpm, 0),
                'leadRate', COALESCE(lead_rate, 0)
            ) FROM meta_breakdown WHERE funnel_type = 'retargeting'),
            'content', (SELECT jsonb_build_object(
                'spend', COALESCE(spend, 0),
                'reportedPurchases', COALESCE(purchases, 0),
                'reportedLeads', COALESCE(leads, 0),
                'clicks', COALESCE(clicks, 0),
                'impressions', COALESCE(impressions, 0),
                'cpp', COALESCE(cpp, 0),
                'cpl', COALESCE(cpl, 0),
                'salesRate', COALESCE(sales_rate, 0),
                'ctr', COALESCE(ctr, 0),
                'cpc', COALESCE(cpc, 0),
                'cpm', COALESCE(cpm, 0),
                'leadRate', COALESCE(lead_rate, 0)
            ) FROM meta_breakdown WHERE funnel_type = 'content'),
            'other', (SELECT jsonb_build_object(
                'spend', COALESCE(spend, 0),
                'reportedPurchases', COALESCE(purchases, 0),
                'reportedLeads', COALESCE(leads, 0),
                'clicks', COALESCE(clicks, 0),
                'impressions', COALESCE(impressions, 0),
                'cpp', COALESCE(cpp, 0),
                'cpl', COALESCE(cpl, 0),
                'salesRate', COALESCE(sales_rate, 0),
                'ctr', COALESCE(ctr, 0),
                'cpc', COALESCE(cpc, 0),
                'cpm', COALESCE(cpm, 0),
                'leadRate', COALESCE(lead_rate, 0)
            ) FROM meta_breakdown WHERE funnel_type IS NULL OR funnel_type NOT IN ('sales', 'leads', 'retargeting', 'content'))
        ),
        'googlePerformance', jsonb_build_object(
            'spend', COALESCE(gp.spend, 0),
            'clicks', COALESCE(gp.clicks, 0),
            'impressions', COALESCE(gp.impressions, 0),
            'conversions', COALESCE(gp.conversions, 0),
            'cpc', COALESCE(gp.cpc, 0),
            'cpm', COALESCE(gp.cpm, 0),
            'ctr', COALESCE(gp.ctr, 0)
        ),
        'vslPerformance', jsonb_build_object(
            'watched5Percent', COALESCE(em.vsl_5_percent, 0),
            'watched25Percent', COALESCE(em.vsl_25_percent, 0),
            'watched50Percent', COALESCE(em.vsl_50_percent, 0),
            'watched95Percent', COALESCE(em.vsl_95_percent, 0)
        )
    ) INTO v_result
    FROM lead_metrics lm
    CROSS JOIN product_sales ps
    LEFT JOIN engagement_metrics em ON true
    LEFT JOIN meta_performance mp ON true
    LEFT JOIN google_performance gp ON true;
    
    RETURN v_result;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO anon;

-- ============================================================================
-- NOTES:
-- - Changed line 80: product_id = 8 → product_id IN (8, 9)
-- - Changed line 81: product_id = 8 → product_id IN (8, 9)
-- - Changed line 82: product_id = 8 → product_id IN (8, 9)
-- - This includes both "Kingdom Seekers - 60 Days" (ID 8) and "30-Day Free Trial" (ID 9)
-- - Expected result: ~607 total Kingdom Seekers (601 from ID 8 + 6 from ID 9)
-- ============================================================================
