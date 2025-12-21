-- ============================================================================
-- DAILY METRICS FUNCTION v2 - OPTIMIZED
-- ============================================================================
-- Performance improvements:
-- 1. Pre-filters contacts by paid/organic in single CTEs
-- 2. Reduces repeated EXISTS subqueries
-- 3. Better index utilization on analytics_events
-- 4. Maintains exact same logic as v1
-- ============================================================================

DROP FUNCTION IF EXISTS get_daily_metrics(DATE, DATE);

CREATE OR REPLACE FUNCTION get_daily_metrics(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_daily_data JSONB;
BEGIN
    -- ========================================================================
    -- Build daily metrics using CTEs for efficiency
    -- Pre-filters contacts once to avoid repeated EXISTS subqueries
    -- ========================================================================
    
    WITH date_series AS (
        -- Generate all dates in range
        SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS date
    ),
    
    -- ========================================================================
    -- PRE-FILTER CONTACTS BY FUNNEL
    -- This eliminates expensive repeated EXISTS subqueries
    -- ========================================================================
    paid_contact_ids AS (
        -- Contacts who submitted form on 31daywisdom.com (paid funnel)
        SELECT DISTINCT ae.contact_id
        FROM analytics_events ae
        WHERE ae.name = 'form.submitted'
          AND ae.comment ILIKE '%31daywisdom.com%'
          AND ae.contact_id IS NOT NULL
    ),
    
    organic_contact_ids AS (
        -- Contacts who submitted form on 31daywisdomchallenge.com but NEVER on paid
        SELECT DISTINCT ae.contact_id
        FROM analytics_events ae
        WHERE ae.name = 'form.submitted'
          AND ae.comment ILIKE '%31daywisdomchallenge.com%'
          AND ae.contact_id IS NOT NULL
          AND ae.contact_id NOT IN (SELECT contact_id FROM paid_contact_ids)
    ),
    
    -- ========================================================================
    -- PAID FUNNEL LEADS
    -- ========================================================================
    paid_leads_daily AS (
        SELECT 
            c.created_at::date AS date,
            COUNT(DISTINCT c.id) AS leads
        FROM contacts c
        INNER JOIN paid_contact_ids pc ON c.id = pc.contact_id
        WHERE c.created_at >= p_start_date
          AND c.created_at < p_end_date + INTERVAL '1 day'
        GROUP BY c.created_at::date
    ),
    
    -- ========================================================================
    -- ORGANIC FUNNEL LEADS
    -- ========================================================================
    organic_leads_daily AS (
        SELECT 
            c.created_at::date AS date,
            COUNT(DISTINCT c.id) AS leads
        FROM contacts c
        INNER JOIN organic_contact_ids oc ON c.id = oc.contact_id
        WHERE c.created_at >= p_start_date
          AND c.created_at < p_end_date + INTERVAL '1 day'
        GROUP BY c.created_at::date
    ),
    
    -- ========================================================================
    -- PAID FUNNEL WISDOM+ SALES (product_id = 1)
    -- ========================================================================
    paid_sales_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS sales,
            COALESCE(SUM(oi.amount), 0) AS revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN paid_contact_ids pc ON o.contact_id = pc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 1
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- ORGANIC FUNNEL WISDOM+ SALES (product_id = 1)
    -- ========================================================================
    organic_sales_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS sales,
            COALESCE(SUM(oi.amount), 0) AS revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN organic_contact_ids oc ON o.contact_id = oc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 1
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- PAID FUNNEL KINGDOM SEEKERS (product_id = 8)
    -- ========================================================================
    paid_ks_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN paid_contact_ids pc ON o.contact_id = pc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 8
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- ORGANIC FUNNEL KINGDOM SEEKERS (product_id = 8)
    -- ========================================================================
    organic_ks_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN organic_contact_ids oc ON o.contact_id = oc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 8
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- PAID FUNNEL EXTRA JOURNALS (product_id = 3)
    -- ========================================================================
    paid_ej_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN paid_contact_ids pc ON o.contact_id = pc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 3
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- ORGANIC FUNNEL EXTRA JOURNALS (product_id = 3)
    -- ========================================================================
    organic_ej_daily AS (
        SELECT 
            o.created_at::date AS date,
            COUNT(DISTINCT o.id) AS count
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN organic_contact_ids oc ON o.contact_id = oc.contact_id
        WHERE o.created_at >= p_start_date
          AND o.created_at < p_end_date + INTERVAL '1 day'
          AND oi.product_id = 3
        GROUP BY o.created_at::date
    ),
    
    -- ========================================================================
    -- META ADS - LEADS CAMPAIGNS
    -- ========================================================================
    meta_leads_campaign_daily AS (
        SELECT 
            date,
            COALESCE(SUM(spend), 0) AS spend,
            COALESCE(SUM(link_clicks), 0) AS clicks,
            COALESCE(SUM(impressions), 0) AS impressions,
            COALESCE(SUM(landing_page_views), 0) AS landing_page_views,
            COALESCE(SUM(reported_leads), 0) AS reported_leads,
            COALESCE(SUM(reported_purchases), 0) AS reported_purchases
        FROM ad_performance
        WHERE date >= p_start_date AND date <= p_end_date
          AND platform ILIKE 'meta'
          AND campaign_name ILIKE '%LEADS%'
          AND campaign_name NOT ILIKE '%SALES%'
        GROUP BY date
    ),
    
    -- ========================================================================
    -- META ADS - SALES CAMPAIGNS
    -- ========================================================================
    meta_sales_campaign_daily AS (
        SELECT 
            date,
            COALESCE(SUM(spend), 0) AS spend,
            COALESCE(SUM(link_clicks), 0) AS clicks,
            COALESCE(SUM(impressions), 0) AS impressions,
            COALESCE(SUM(landing_page_views), 0) AS landing_page_views,
            COALESCE(SUM(reported_leads), 0) AS reported_leads,
            COALESCE(SUM(reported_purchases), 0) AS reported_purchases
        FROM ad_performance
        WHERE date >= p_start_date AND date <= p_end_date
          AND platform ILIKE 'meta'
          AND campaign_name ILIKE '%SALES%'
        GROUP BY date
    ),
    
    -- ========================================================================
    -- META ADS - ALL CAMPAIGNS
    -- ========================================================================
    meta_all_daily AS (
        SELECT 
            date,
            COALESCE(SUM(spend), 0) AS spend,
            COALESCE(SUM(link_clicks), 0) AS clicks,
            COALESCE(SUM(impressions), 0) AS impressions,
            COALESCE(SUM(landing_page_views), 0) AS landing_page_views
        FROM ad_performance
        WHERE date >= p_start_date AND date <= p_end_date
          AND platform ILIKE 'meta'
        GROUP BY date
    ),
    
    -- ========================================================================
    -- GOOGLE ADS - ALL CAMPAIGNS
    -- ========================================================================
    google_daily AS (
        SELECT 
            date,
            COALESCE(SUM(spend), 0) AS spend,
            COALESCE(SUM(link_clicks), 0) AS clicks,
            COALESCE(SUM(impressions), 0) AS impressions,
            COALESCE(SUM(reported_leads), 0) AS reported_leads,
            COALESCE(SUM(reported_purchases), 0) AS reported_purchases
        FROM ad_performance
        WHERE date >= p_start_date AND date <= p_end_date
          AND platform ILIKE 'google'
        GROUP BY date
    ),
    
    -- ========================================================================
    -- COMBINE ALL DATA
    -- ========================================================================
    combined AS (
        SELECT 
            ds.date,
            -- Paid Funnel
            COALESCE(pl.leads, 0) AS paid_leads,
            COALESCE(ps.sales, 0) AS paid_wisdom_sales,
            COALESCE(ps.revenue, 0) AS paid_revenue,
            COALESCE(pks.count, 0) AS paid_ks,
            COALESCE(pej.count, 0) AS paid_ej,
            -- Organic Funnel
            COALESCE(ol.leads, 0) AS organic_leads,
            COALESCE(os.sales, 0) AS organic_wisdom_sales,
            COALESCE(os.revenue, 0) AS organic_revenue,
            COALESCE(oks.count, 0) AS organic_ks,
            COALESCE(oej.count, 0) AS organic_ej,
            -- Meta Leads Campaign
            COALESCE(mlc.spend, 0) AS meta_leads_spend,
            COALESCE(mlc.clicks, 0) AS meta_leads_clicks,
            COALESCE(mlc.impressions, 0) AS meta_leads_impressions,
            COALESCE(mlc.landing_page_views, 0) AS meta_leads_lpv,
            COALESCE(mlc.reported_leads, 0) AS meta_leads_reported_leads,
            COALESCE(mlc.reported_purchases, 0) AS meta_leads_reported_purchases,
            -- Meta Sales Campaign
            COALESCE(msc.spend, 0) AS meta_sales_spend,
            COALESCE(msc.clicks, 0) AS meta_sales_clicks,
            COALESCE(msc.impressions, 0) AS meta_sales_impressions,
            COALESCE(msc.landing_page_views, 0) AS meta_sales_lpv,
            COALESCE(msc.reported_leads, 0) AS meta_sales_reported_leads,
            COALESCE(msc.reported_purchases, 0) AS meta_sales_reported_purchases,
            -- Meta All
            COALESCE(ma.spend, 0) AS meta_total_spend,
            COALESCE(ma.clicks, 0) AS meta_total_clicks,
            COALESCE(ma.impressions, 0) AS meta_total_impressions,
            COALESCE(ma.landing_page_views, 0) AS meta_total_lpv,
            -- Google
            COALESCE(gd.spend, 0) AS google_spend,
            COALESCE(gd.clicks, 0) AS google_clicks,
            COALESCE(gd.impressions, 0) AS google_impressions,
            COALESCE(gd.reported_leads, 0) AS google_reported_leads,
            COALESCE(gd.reported_purchases, 0) AS google_reported_purchases
        FROM date_series ds
        LEFT JOIN paid_leads_daily pl ON ds.date = pl.date
        LEFT JOIN paid_sales_daily ps ON ds.date = ps.date
        LEFT JOIN paid_ks_daily pks ON ds.date = pks.date
        LEFT JOIN paid_ej_daily pej ON ds.date = pej.date
        LEFT JOIN organic_leads_daily ol ON ds.date = ol.date
        LEFT JOIN organic_sales_daily os ON ds.date = os.date
        LEFT JOIN organic_ks_daily oks ON ds.date = oks.date
        LEFT JOIN organic_ej_daily oej ON ds.date = oej.date
        LEFT JOIN meta_leads_campaign_daily mlc ON ds.date = mlc.date
        LEFT JOIN meta_sales_campaign_daily msc ON ds.date = msc.date
        LEFT JOIN meta_all_daily ma ON ds.date = ma.date
        LEFT JOIN google_daily gd ON ds.date = gd.date
        ORDER BY ds.date
    )
    
    -- ========================================================================
    -- BUILD FINAL JSON RESULT
    -- ========================================================================
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', c.date,
            -- Totals (Paid + Organic)
            'totalLeads', c.paid_leads + c.organic_leads,
            'totalWisdomSales', c.paid_wisdom_sales + c.organic_wisdom_sales,
            'totalRevenue', c.paid_revenue + c.organic_revenue,
            'totalKingdomSeekers', c.paid_ks + c.organic_ks,
            'totalExtraJournals', c.paid_ej + c.organic_ej,
            'totalExtraShipping', 0, -- Not tracked yet
            -- Paid Funnel
            'paidLeads', c.paid_leads,
            'paidWisdomSales', c.paid_wisdom_sales,
            'paidRevenue', c.paid_revenue,
            'paidKingdomSeekers', c.paid_ks,
            'paidExtraJournals', c.paid_ej,
            'paidExtraShipping', 0,
            -- Organic Funnel
            'organicLeads', c.organic_leads,
            'organicWisdomSales', c.organic_wisdom_sales,
            'organicRevenue', c.organic_revenue,
            'organicKingdomSeekers', c.organic_ks,
            'organicExtraJournals', c.organic_ej,
            'organicExtraShipping', 0,
            -- Ad Spend
            'leadsSalesSpend', c.meta_leads_spend + c.meta_sales_spend,
            'totalAdSpend', c.meta_total_spend + c.google_spend,
            -- Meta Leads Campaign
            'metaLeads', jsonb_build_object(
                'spend', c.meta_leads_spend,
                'clicks', c.meta_leads_clicks,
                'impressions', c.meta_leads_impressions,
                'landingPageViews', c.meta_leads_lpv,
                'reportedLeads', c.meta_leads_reported_leads,
                'reportedPurchases', c.meta_leads_reported_purchases
            ),
            -- Meta Sales Campaign
            'metaSales', jsonb_build_object(
                'spend', c.meta_sales_spend,
                'clicks', c.meta_sales_clicks,
                'impressions', c.meta_sales_impressions,
                'landingPageViews', c.meta_sales_lpv,
                'reportedLeads', c.meta_sales_reported_leads,
                'reportedPurchases', c.meta_sales_reported_purchases
            ),
            -- Meta Total
            'metaTotal', jsonb_build_object(
                'spend', c.meta_total_spend,
                'clicks', c.meta_total_clicks,
                'impressions', c.meta_total_impressions,
                'landingPageViews', c.meta_total_lpv
            ),
            -- Google
            'google', jsonb_build_object(
                'spend', c.google_spend,
                'clicks', c.google_clicks,
                'impressions', c.google_impressions,
                'reportedLeads', c.google_reported_leads,
                'reportedPurchases', c.google_reported_purchases
            ),
            -- Calculated Metrics
            'cpl', CASE 
                WHEN (c.paid_leads) > 0 
                THEN (c.meta_leads_spend + c.meta_sales_spend) / (c.paid_leads)
                ELSE 0 
            END,
            'cpp', CASE 
                WHEN (c.paid_wisdom_sales) > 0 
                THEN (c.meta_leads_spend + c.meta_sales_spend) / (c.paid_wisdom_sales)
                ELSE 0 
            END,
            'roas', CASE 
                WHEN (c.meta_leads_spend + c.meta_sales_spend) > 0 
                THEN c.paid_revenue / (c.meta_leads_spend + c.meta_sales_spend)
                ELSE 0 
            END,
            'conversionRate', CASE 
                WHEN c.paid_leads > 0 
                THEN (c.paid_wisdom_sales::NUMERIC / c.paid_leads::NUMERIC) * 100
                ELSE 0 
            END
        )
    ) INTO v_daily_data
    FROM combined c;
    
    -- ========================================================================
    -- RETURN FINAL RESULT
    -- ========================================================================
    v_result := jsonb_build_object(
        'dailyData', COALESCE(v_daily_data, '[]'::jsonb),
        'dateRange', jsonb_build_object(
            'startDate', p_start_date,
            'endDate', p_end_date
        )
    );
    
    RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_daily_metrics(DATE, DATE) TO anon, authenticated, service_role;

-- ============================================================================
-- TEST QUERY
-- ============================================================================
-- SELECT get_daily_metrics('2025-12-13'::date, '2025-12-20'::date);
