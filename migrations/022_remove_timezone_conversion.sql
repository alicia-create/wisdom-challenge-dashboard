-- ============================================================================
-- Migration 022: Remove Timezone Conversion - Use UTC directly
-- CRITICAL FIX: created_at is already in UTC, timezone conversion causes date mismatch
-- ClickFunnels shows 602 orders for 2025-12-23, but timezone conversion shifts them to previous day
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
    v_next_day_str TEXT;
BEGIN
    -- Calculate next day for inclusive end date filtering
    v_next_day_str := (p_end_date + interval '1 day')::date::text;
    
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
        WHERE wlc.created_at >= p_start_date::timestamp
          AND wlc.created_at < v_next_day_str::timestamp
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
        WHERE o.created_at >= p_start_date::timestamp
          AND o.created_at < v_next_day_str::timestamp
          AND o.funnel_name LIKE '%wisdom%'
          AND o.billing_status IN ('paid', 'partially-refunded')
    ),
    -- CTE 4: Product sales breakdown - Use funnel_name from orders, not analytics_events
    product_sales AS (
        SELECT
            COUNT(DISTINCT wo.id) as wisdom_sales,
            -- PAID: funnel_name contains 31daywisdom.com (NOT 31daywisdomchallenge.com)
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_wisdom_sales,
            -- ORGANIC: funnel_name contains 31daywisdomchallenge.com
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_wisdom_sales,
            
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%') as kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%' AND wo.funnel_name LIKE '%31daywisdom.com%' AND wo.funnel_name NOT LIKE '%challenge%') as paid_kingdom_seekers,
            COUNT(DISTINCT wo.id) FILTER (WHERE wo.funnel_name ILIKE '%kingdom%' AND wo.funnel_name LIKE '%31daywisdomchallenge.com%') as organic_kingdom_seekers,
            
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
    -- CTE 5: Engagement metrics (bot alerts, welcome email clicks)
    engagement_metrics AS (
        SELECT
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted' AND wl.is_paid) as paid_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'manychat.add_tag' AND ae.value = 'gold.ntn.request_accepted' AND wl.is_organic AND NOT wl.is_paid) as organic_bot_alerts,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'keap.email.clicked' AND ae.comment ILIKE '%welcome%' AND wl.is_paid) as paid_welcome_clicks,
            COUNT(DISTINCT ae.contact_id) FILTER (WHERE ae.name = 'keap.email.clicked' AND ae.comment ILIKE '%welcome%' AND wl.is_organic AND NOT wl.is_paid) as organic_welcome_clicks
        FROM analytics_events ae
        JOIN wisdom_leads wl ON ae.contact_id = wl.contact_id
        WHERE ae.timestamp >= p_start_date::timestamp
          AND ae.timestamp < v_next_day_str::timestamp
    ),
    -- CTE 6: Ad spend metrics
    ad_metrics AS (
        SELECT
            SUM(spend) FILTER (WHERE platform = 'meta') as meta_spend,
            SUM(spend) FILTER (WHERE platform = 'google') as google_spend,
            SUM(spend) as total_spend
        FROM ad_performance
        WHERE date >= p_start_date
          AND date <= p_end_date
    )
    
    -- Build final JSON response
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'totalLeads', lm.total_leads,
            'totalWisdomSales', ps.wisdom_sales,
            'totalKingdomSeekers', ps.kingdom_seekers,
            'totalRevenue', COALESCE(ps.total_revenue, 0),
            'totalSpend', COALESCE(am.meta_spend, 0) + COALESCE(am.google_spend, 0),
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
        )
    ) INTO v_result
    FROM lead_metrics lm
    CROSS JOIN product_sales ps
    CROSS JOIN engagement_metrics em
    CROSS JOIN ad_metrics am;

    RETURN v_result;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_metrics(date, date) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_dashboard_metrics IS 'v22 - FIXED: Removed timezone conversion, use UTC directly for accurate date filtering';
