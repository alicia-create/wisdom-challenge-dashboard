-- ============================================================================
-- Migration 020: Create get_engagement_metrics Edge Function
-- Extracts engagement logic (VSL, bot subscribed, email clicks) from get_dashboard_metrics
-- Fixes VSL to use vidalytics.view_video event name with proper parsing
-- ============================================================================

DROP FUNCTION IF EXISTS get_engagement_metrics(date, date);

CREATE OR REPLACE FUNCTION get_engagement_metrics(
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
    v_next_day_str TEXT;
BEGIN
    -- Calculate next day for inclusive end date filtering
    v_next_day_str := (p_end_date + interval '1 day')::date::text;

    -- Build JSON response with engagement metrics
    SELECT jsonb_build_object(
        'botSubscribed', (
            SELECT jsonb_build_object(
                'paid', COALESCE(COUNT(DISTINCT CASE WHEN c.funnel_name = '31daywisdom.com' THEN ae.contact_id END), 0),
                'organic', COALESCE(COUNT(DISTINCT CASE WHEN c.funnel_name = '31daywisdomchallenge.com' THEN ae.contact_id END), 0)
            )
            FROM analytics_events ae
            JOIN contacts c ON ae.contact_id = c.id
            WHERE ae.name = 'manychat.add_tag'
              AND ae.value = 'gold.ntn.request_accepted'
              AND ae.timestamp >= p_start_date::timestamp
              AND ae.timestamp < v_next_day_str::timestamp
        ),
        'emailClicks', (
            SELECT jsonb_build_object(
                'paid', COALESCE(COUNT(DISTINCT CASE WHEN c.funnel_name = '31daywisdom.com' THEN ae.contact_id END), 0),
                'organic', COALESCE(COUNT(DISTINCT CASE WHEN c.funnel_name = '31daywisdomchallenge.com' THEN ae.contact_id END), 0)
            )
            FROM analytics_events ae
            JOIN contacts c ON ae.contact_id = c.id
            WHERE ae.name = 'keap.email.clicked'
              AND ae.comment ILIKE '%welcome%'
              AND ae.timestamp >= p_start_date::timestamp
              AND ae.timestamp < v_next_day_str::timestamp
        ),
        'vslMetrics', (
            SELECT jsonb_build_object(
                'watched5', COALESCE(COUNT(DISTINCT CASE WHEN ae.value ILIKE '%5%' THEN ae.contact_id END), 0),
                'watched25', COALESCE(COUNT(DISTINCT CASE WHEN ae.value ILIKE '%25%' THEN ae.contact_id END), 0),
                'watched50', COALESCE(COUNT(DISTINCT CASE WHEN ae.value ILIKE '%50%' THEN ae.contact_id END), 0),
                'watched95', COALESCE(COUNT(DISTINCT CASE WHEN ae.value ILIKE '%95%' THEN ae.contact_id END), 0)
            )
            FROM analytics_events ae
            WHERE ae.name = 'vidalytics.view_video'
              AND ae.timestamp >= p_start_date::timestamp
              AND ae.timestamp < v_next_day_str::timestamp
        )
    ) INTO v_result;

    RETURN v_result;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_engagement_metrics(date, date) TO authenticated, anon;

-- Add comment
COMMENT ON FUNCTION get_engagement_metrics IS 'v1 - Returns engagement metrics: VSL watch percentages, bot subscribed, email clicks (paid/organic split)';
