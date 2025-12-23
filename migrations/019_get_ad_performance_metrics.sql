-- ============================================================================
-- Migration 019: Create get_ad_performance_metrics Edge Function
-- Extracts ad performance logic from get_dashboard_metrics for better performance
-- Includes all calculated fields: CPC, CTR, CPM, CPL, CPP, Sales Rate, Lead Rate
-- ============================================================================

DROP FUNCTION IF EXISTS get_ad_performance_metrics(date, date);

CREATE OR REPLACE FUNCTION get_ad_performance_metrics(
    p_start_date date DEFAULT (CURRENT_DATE - '30 days'::interval),
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '30s'
AS $function$
DECLARE
    v_result JSONB;
BEGIN
    -- Build JSON response with Meta and Google performance metrics
    SELECT jsonb_build_object(
        'metaPerformance', (
            SELECT jsonb_build_object(
                'spend', COALESCE(SUM(spend), 0),
                'clicks', COALESCE(SUM(link_clicks), 0),
                'impressions', COALESCE(SUM(impressions), 0),
                'reportedLeads', COALESCE(SUM(reported_leads), 0),
                'reportedPurchases', COALESCE(SUM(reported_purchases), 0),
                -- Calculated fields
                'cpc', CASE WHEN SUM(link_clicks) > 0 THEN ROUND((SUM(spend) / SUM(link_clicks))::numeric, 2) ELSE 0 END,
                'ctr', CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(link_clicks)::numeric / SUM(impressions) * 100)::numeric, 2) ELSE 0 END,
                'cpm', CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(spend) / SUM(impressions) * 1000)::numeric, 2) ELSE 0 END,
                'cpl', CASE WHEN SUM(reported_leads) > 0 THEN ROUND((SUM(spend) / SUM(reported_leads))::numeric, 2) ELSE 0 END,
                'cpp', CASE WHEN SUM(reported_purchases) > 0 THEN ROUND((SUM(spend) / SUM(reported_purchases))::numeric, 2) ELSE 0 END,
                'salesRate', CASE WHEN SUM(link_clicks) > 0 THEN ROUND((SUM(reported_purchases)::numeric / SUM(link_clicks) * 100)::numeric, 2) ELSE 0 END,
                'leadRate', CASE WHEN SUM(link_clicks) > 0 THEN ROUND((SUM(reported_leads)::numeric / SUM(link_clicks) * 100)::numeric, 2) ELSE 0 END
            )
            FROM ad_performance
            WHERE platform = 'meta'
              AND date >= p_start_date
              AND date <= p_end_date
        ),
        'metaCampaignBreakdown', (
            SELECT jsonb_object_agg(
                campaign_type,
                jsonb_build_object(
                    'spend', COALESCE(spend, 0),
                    'clicks', COALESCE(clicks, 0),
                    'impressions', COALESCE(impressions, 0),
                    'reportedLeads', COALESCE(reported_leads, 0),
                    'reportedPurchases', COALESCE(reported_purchases, 0),
                    -- Calculated fields
                    'cpc', CASE WHEN clicks > 0 THEN ROUND((spend / clicks)::numeric, 2) ELSE 0 END,
                    'ctr', CASE WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions * 100)::numeric, 2) ELSE 0 END,
                    'cpm', CASE WHEN impressions > 0 THEN ROUND((spend / impressions * 1000)::numeric, 2) ELSE 0 END,
                    'cpl', CASE WHEN reported_leads > 0 THEN ROUND((spend / reported_leads)::numeric, 2) ELSE 0 END,
                    'cpp', CASE WHEN reported_purchases > 0 THEN ROUND((spend / reported_purchases)::numeric, 2) ELSE 0 END,
                    'salesRate', CASE WHEN clicks > 0 THEN ROUND((reported_purchases::numeric / clicks * 100)::numeric, 2) ELSE 0 END,
                    'leadRate', CASE WHEN clicks > 0 THEN ROUND((reported_leads::numeric / clicks * 100)::numeric, 2) ELSE 0 END
                )
            )
            FROM (
                SELECT
                    campaign_type,
                    SUM(spend) as spend,
                    SUM(link_clicks) as clicks,
                    SUM(impressions) as impressions,
                    SUM(reported_leads) as reported_leads,
                    SUM(reported_purchases) as reported_purchases
                FROM ad_performance
                WHERE platform = 'meta'
                  AND date >= p_start_date
                  AND date <= p_end_date
                GROUP BY campaign_type
            ) breakdown
        ),
        'googlePerformance', (
            SELECT jsonb_build_object(
                'spend', COALESCE(SUM(spend), 0),
                'clicks', COALESCE(SUM(link_clicks), 0),
                'impressions', COALESCE(SUM(impressions), 0),
                'conversions', COALESCE(SUM(reported_purchases), 0),
                -- Calculated fields
                'cpc', CASE WHEN SUM(link_clicks) > 0 THEN ROUND((SUM(spend) / SUM(link_clicks))::numeric, 2) ELSE 0 END,
                'ctr', CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(link_clicks)::numeric / SUM(impressions) * 100)::numeric, 2) ELSE 0 END,
                'cpm', CASE WHEN SUM(impressions) > 0 THEN ROUND((SUM(spend) / SUM(impressions) * 1000)::numeric, 2) ELSE 0 END
            )
            FROM ad_performance
            WHERE platform = 'google'
              AND date >= p_start_date
              AND date <= p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_ad_performance_metrics(date, date) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_ad_performance_metrics IS 'v1 - Returns Meta and Google ad performance metrics with calculated fields (CPC, CTR, CPM, CPL, CPP, Sales Rate, Lead Rate)';
