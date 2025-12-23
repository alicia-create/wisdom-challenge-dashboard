-- ============================================================================
-- Migration 029: Optimize vsl_metrics CTE (Remove CROSS JOIN)
-- The CROSS JOIN between vsl_analytics and wisdom_orders was causing timeouts
-- ============================================================================

DROP FUNCTION IF EXISTS get_dashboard_metrics;

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
    v_next_day_str TEXT;
BEGIN
    v_next_day_str := (p_end_date + interval '1 day')::date::text;
    
    WITH 
    wisdom_leads AS (
        SELECT 
            wlc.contact_id,
            wlc.created_at,
            wlc.is_paid,
            wlc.is_organic,
            wlc.has_manychat
        FROM wisdom_lead_classification wlc
        WHERE wlc.created_at >= p_start_date::timestamp
          AND wlc.created_at < v_next_day_str::timestamp
    ),
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
    wisdom_orders AS (
        SELECT 
            o.id,
            o.contact_id,
            o.order_total,
            o.funnel_name,
            o.billing_status,
            o.created_at
        FROM orders o
        WHERE o.created_at >= p_start_date::timestamp
          AND o.created_at < v_next_day_str::timestamp
          AND o.funnel_name LIKE '%wisdom%'
          AND o.billing_status IN ('paid', 'partially-refunded')
    ),
    product_sales AS (
        SELECT
            COUNT(DISTINCT wo.id) as wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_wisdom_sales,
            COUNT(DISTINCT wo.id) FILTER (
                WHERE EXISTS (
                    SELECT 1 FROM order_items oi 
                    WHERE oi.order_id = wo.id AND oi.product_id = 8
                )
            ) as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (
                WHERE wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%'
                AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = wo.id AND oi.product_id = 8)
            ) as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (
                WHERE wo.funnel_name LIKE '%31daywisdomchallenge.com%'
                AND EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = wo.id AND oi.product_id = 8)
            ) as organic_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%') as extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%' AND wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%extra%journal%' AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_journals,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%') as extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%' AND wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_extra_shipping,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%shipping%' AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_extra_shipping,
            SUM(wo.order_total) as total_revenue,
            SUM(wo.order_total) FILTER (WHERE wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_revenue,
            SUM(wo.order_total) FILTER (WHERE wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_revenue
        FROM wisdom_orders wo
    ),
    engagement_metrics AS (
        SELECT
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted' AND wl.is_paid) as paid_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted' AND wl.is_organic AND NOT wl.is_paid) as organic_bot_alerts,
            0 as paid_welcome_clicks,
            0 as organic_welcome_clicks
        FROM analytics_events ae
        JOIN wisdom_leads wl ON ae.contact_id = wl.contact_id
        WHERE ae.timestamp >= p_start_date::timestamp
          AND ae.timestamp < v_next_day_str::timestamp
    ),
    ad_metrics AS (
        SELECT
            SUM(spend) FILTER (WHERE platform ILIKE 'meta') as meta_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta') as meta_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta') as meta_impressions,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as meta_landing_page_views,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta') as meta_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta') as meta_purchases,
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%sales%') as meta_sales_purchases,
            SUM(spend) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_impressions,
            SUM(reported_leads) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_leads,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'meta' AND campaign_name ILIKE '%lead%' AND campaign_name NOT ILIKE '%sales%') as meta_leads_purchases,
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
            SUM(spend) FILTER (WHERE platform ILIKE 'google') as google_spend,
            SUM(link_clicks) FILTER (WHERE platform ILIKE 'google') as google_clicks,
            SUM(impressions) FILTER (WHERE platform ILIKE 'google') as google_impressions,
            SUM(reported_purchases) FILTER (WHERE platform ILIKE 'google') as google_conversions,
            SUM(spend) as total_spend,
            SUM(link_clicks) as link_clicks,
            SUM(landing_page_views) FILTER (WHERE platform ILIKE 'meta') as landing_page_views
        FROM ad_performance
        WHERE date >= p_start_date AND date <= p_end_date
    ),
    vsl_metrics AS (
        SELECT
            -- Count unique viewers at each milestone
            COUNT(DISTINCT va.contact_id) FILTER (WHERE va.watched_5_percent = 1) as vsl_5_percent,
            COUNT(DISTINCT va.contact_id) FILTER (WHERE va.watched_25_percent = 1) as vsl_25_percent,
            COUNT(DISTINCT va.contact_id) FILTER (WHERE va.watched_50_percent = 1) as vsl_50_percent,
            COUNT(DISTINCT va.contact_id) FILTER (WHERE va.watched_95_percent = 1) as vsl_95_percent,
            -- Count purchases from VSL viewers using JOIN instead of CROSS JOIN
            (
                SELECT COUNT(DISTINCT wo.id)
                FROM wisdom_orders wo
                WHERE EXISTS (
                    SELECT 1 FROM vsl_analytics va2
                    WHERE va2.contact_id = wo.contact_id
                    AND va2.watched_50_percent = 1
                    AND va2.watch_date >= p_start_date
                    AND va2.watch_date <= p_end_date
                )
            ) as purchases_from_vsl_viewers
        FROM vsl_analytics va
        WHERE va.watch_date >= p_start_date AND va.watch_date <= p_end_date
    )
    
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalLeads', lm.total_leads,
            'totalWisdomSales', ps.wisdom_sales,
            'totalKingdomSeekers', ps.kingdom_seekers,
            'totalRevenue', COALESCE(ps.total_revenue, 0),
            'totalSpend', COALESCE(am.total_spend, 0),
            'cpl', CASE WHEN lm.total_leads > 0 THEN COALESCE(am.total_spend, 0) / lm.total_leads ELSE 0 END,
            'cpp', CASE WHEN ps.wisdom_sales > 0 THEN COALESCE(am.total_spend, 0) / ps.wisdom_sales ELSE 0 END,
            'aov', CASE WHEN ps.wisdom_sales > 0 THEN ROUND((ps.total_revenue / ps.wisdom_sales)::numeric, 2) ELSE 0 END,
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
            'leads', COALESCE(am.meta_leads, 0),
            'purchases', COALESCE(am.meta_purchases, 0),
            'cpc', CASE WHEN am.meta_clicks > 0 THEN am.meta_spend / am.meta_clicks ELSE 0 END,
            'cpm', CASE WHEN am.meta_impressions > 0 THEN (am.meta_spend / am.meta_impressions) * 1000 ELSE 0 END,
            'ctr', CASE WHEN am.meta_impressions > 0 THEN (am.meta_clicks::numeric / am.meta_impressions) * 100 ELSE 0 END,
            'cpp', CASE WHEN am.meta_purchases > 0 THEN am.meta_spend / am.meta_purchases ELSE 0 END,
            'cpl', CASE WHEN am.meta_leads > 0 THEN am.meta_spend / am.meta_leads ELSE 0 END,
            'salesRate', CASE WHEN am.meta_leads > 0 THEN (am.meta_purchases::numeric / am.meta_leads) * 100 ELSE 0 END,
            'leadRate', CASE WHEN am.meta_clicks > 0 THEN (am.meta_leads::numeric / am.meta_clicks) * 100 ELSE 0 END
        ),
        'metaCampaignBreakdown', jsonb_build_object(
            'sales', jsonb_build_object(
                'spend', COALESCE(am.meta_sales_spend, 0),
                'clicks', COALESCE(am.meta_sales_clicks, 0),
                'impressions', COALESCE(am.meta_sales_impressions, 0),
                'leads', COALESCE(am.meta_sales_leads, 0),
                'purchases', COALESCE(am.meta_sales_purchases, 0),
                'cpc', CASE WHEN am.meta_sales_clicks > 0 THEN am.meta_sales_spend / am.meta_sales_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_spend / am.meta_sales_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_sales_impressions > 0 THEN (am.meta_sales_clicks::numeric / am.meta_sales_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_sales_purchases > 0 THEN am.meta_sales_spend / am.meta_sales_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_sales_leads > 0 THEN am.meta_sales_spend / am.meta_sales_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_sales_leads > 0 THEN (am.meta_sales_purchases::numeric / am.meta_sales_leads) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_sales_clicks > 0 THEN (am.meta_sales_leads::numeric / am.meta_sales_clicks) * 100 ELSE 0 END
            ),
            'leads', jsonb_build_object(
                'spend', COALESCE(am.meta_leads_spend, 0),
                'clicks', COALESCE(am.meta_leads_clicks, 0),
                'impressions', COALESCE(am.meta_leads_impressions, 0),
                'leads', COALESCE(am.meta_leads_leads, 0),
                'purchases', COALESCE(am.meta_leads_purchases, 0),
                'cpc', CASE WHEN am.meta_leads_clicks > 0 THEN am.meta_leads_spend / am.meta_leads_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_spend / am.meta_leads_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_leads_impressions > 0 THEN (am.meta_leads_clicks::numeric / am.meta_leads_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_leads_purchases > 0 THEN am.meta_leads_spend / am.meta_leads_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_leads_leads > 0 THEN am.meta_leads_spend / am.meta_leads_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_leads_leads > 0 THEN (am.meta_leads_purchases::numeric / am.meta_leads_leads) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_leads_clicks > 0 THEN (am.meta_leads_leads::numeric / am.meta_leads_clicks) * 100 ELSE 0 END
            ),
            'retargeting', jsonb_build_object(
                'spend', COALESCE(am.meta_retargeting_spend, 0),
                'clicks', COALESCE(am.meta_retargeting_clicks, 0),
                'impressions', COALESCE(am.meta_retargeting_impressions, 0),
                'leads', COALESCE(am.meta_retargeting_leads, 0),
                'purchases', COALESCE(am.meta_retargeting_purchases, 0),
                'cpc', CASE WHEN am.meta_retargeting_clicks > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_spend / am.meta_retargeting_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_retargeting_impressions > 0 THEN (am.meta_retargeting_clicks::numeric / am.meta_retargeting_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_retargeting_purchases > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_retargeting_leads > 0 THEN am.meta_retargeting_spend / am.meta_retargeting_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_retargeting_leads > 0 THEN (am.meta_retargeting_purchases::numeric / am.meta_retargeting_leads) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_retargeting_clicks > 0 THEN (am.meta_retargeting_leads::numeric / am.meta_retargeting_clicks) * 100 ELSE 0 END
            ),
            'content', jsonb_build_object(
                'spend', COALESCE(am.meta_content_spend, 0),
                'clicks', COALESCE(am.meta_content_clicks, 0),
                'impressions', COALESCE(am.meta_content_impressions, 0),
                'leads', COALESCE(am.meta_content_leads, 0),
                'purchases', COALESCE(am.meta_content_purchases, 0),
                'cpc', CASE WHEN am.meta_content_clicks > 0 THEN am.meta_content_spend / am.meta_content_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_spend / am.meta_content_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_content_impressions > 0 THEN (am.meta_content_clicks::numeric / am.meta_content_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_content_purchases > 0 THEN am.meta_content_spend / am.meta_content_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_content_leads > 0 THEN am.meta_content_spend / am.meta_content_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_content_leads > 0 THEN (am.meta_content_purchases::numeric / am.meta_content_leads) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_content_clicks > 0 THEN (am.meta_content_leads::numeric / am.meta_content_clicks) * 100 ELSE 0 END
            ),
            'other', jsonb_build_object(
                'spend', COALESCE(am.meta_other_spend, 0),
                'clicks', COALESCE(am.meta_other_clicks, 0),
                'impressions', COALESCE(am.meta_other_impressions, 0),
                'leads', COALESCE(am.meta_other_leads, 0),
                'purchases', COALESCE(am.meta_other_purchases, 0),
                'cpc', CASE WHEN am.meta_other_clicks > 0 THEN am.meta_other_spend / am.meta_other_clicks ELSE 0 END,
                'cpm', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_spend / am.meta_other_impressions) * 1000 ELSE 0 END,
                'ctr', CASE WHEN am.meta_other_impressions > 0 THEN (am.meta_other_clicks::numeric / am.meta_other_impressions) * 100 ELSE 0 END,
                'cpp', CASE WHEN am.meta_other_purchases > 0 THEN am.meta_other_spend / am.meta_other_purchases ELSE 0 END,
                'cpl', CASE WHEN am.meta_other_leads > 0 THEN am.meta_other_spend / am.meta_other_leads ELSE 0 END,
                'salesRate', CASE WHEN am.meta_other_leads > 0 THEN (am.meta_other_purchases::numeric / am.meta_other_leads) * 100 ELSE 0 END,
                'leadRate', CASE WHEN am.meta_other_clicks > 0 THEN (am.meta_other_leads::numeric / am.meta_other_clicks) * 100 ELSE 0 END
            )
        ),
        'googlePerformance', jsonb_build_object(
            'spend', COALESCE(am.google_spend, 0),
            'clicks', COALESCE(am.google_clicks, 0),
            'impressions', COALESCE(am.google_impressions, 0),
            'conversions', COALESCE(am.google_conversions, 0),
            'cpc', CASE WHEN am.google_clicks > 0 THEN am.google_spend / am.google_clicks ELSE 0 END,
            'cpm', CASE WHEN am.google_impressions > 0 THEN (am.google_spend / am.google_impressions) * 1000 ELSE 0 END,
            'ctr', CASE WHEN am.google_impressions > 0 THEN (am.google_clicks::numeric / am.google_impressions) * 100 ELSE 0 END
        ),
        'vslPerformance', jsonb_build_object(
            'watched5Percent', COALESCE(vm.vsl_5_percent, 0),
            'watched25Percent', COALESCE(vm.vsl_25_percent, 0),
            'watched50Percent', COALESCE(vm.vsl_50_percent, 0),
            'watched95Percent', COALESCE(vm.vsl_95_percent, 0),
            'dropoff5to25', CASE WHEN vm.vsl_5_percent > 0 THEN ((1 - vm.vsl_25_percent::numeric / vm.vsl_5_percent) * 100) ELSE 0 END,
            'dropoff25to50', CASE WHEN vm.vsl_25_percent > 0 THEN ((1 - vm.vsl_50_percent::numeric / vm.vsl_25_percent) * 100) ELSE 0 END,
            'dropoff50to95', CASE WHEN vm.vsl_50_percent > 0 THEN ((1 - vm.vsl_95_percent::numeric / vm.vsl_50_percent) * 100) ELSE 0 END,
            'purchasesFromVslViewers', COALESCE(vm.purchases_from_vsl_viewers, 0),
            'conversionRate', CASE WHEN vm.vsl_50_percent > 0 THEN (vm.purchases_from_vsl_viewers::numeric / vm.vsl_50_percent) * 100 ELSE 0 END
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

GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated, anon;
