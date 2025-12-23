-- ============================================================================
-- Migration 016: Performance Alerts System
-- ============================================================================
-- ALERTS: Notify owner when CPP > $90 or Conversion Rate < 15%
-- SCHEDULE: Check every hour and send alert if thresholds breached
-- ============================================================================

-- Step 1: Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Create function to check performance and send alerts
CREATE OR REPLACE FUNCTION check_performance_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_metrics JSONB;
    v_cpp NUMERIC;
    v_conversion_rate NUMERIC;
    v_total_spend NUMERIC;
    v_wisdom_sales INTEGER;
    v_total_leads INTEGER;
    v_alert_message TEXT;
    v_should_alert BOOLEAN := FALSE;
BEGIN
    -- Get last 7 days metrics
    v_metrics := get_dashboard_metrics(CURRENT_DATE - 7, CURRENT_DATE);
    
    -- Extract KPIs
    v_cpp := (v_metrics->'kpis'->>'cpp')::NUMERIC;
    v_conversion_rate := (v_metrics->'kpis'->>'conversionRate')::NUMERIC;
    v_total_spend := (v_metrics->'kpis'->>'totalSpend')::NUMERIC;
    v_wisdom_sales := (v_metrics->'kpis'->>'totalWisdomSales')::INTEGER;
    v_total_leads := (v_metrics->'kpis'->>'totalLeads')::INTEGER;
    
    -- Build alert message
    v_alert_message := E'🚨 **Performance Alert - Last 7 Days**\n\n';
    
    -- Check CPP threshold
    IF v_cpp > 90 THEN
        v_should_alert := TRUE;
        v_alert_message := v_alert_message || E'❌ **CPP too high:** $' || ROUND(v_cpp, 2) || E' (threshold: $90)\n';
    ELSE
        v_alert_message := v_alert_message || E'✅ **CPP healthy:** $' || ROUND(v_cpp, 2) || E'\n';
    END IF;
    
    -- Check Conversion Rate threshold
    IF v_conversion_rate < 15 THEN
        v_should_alert := TRUE;
        v_alert_message := v_alert_message || E'❌ **Conversion too low:** ' || ROUND(v_conversion_rate, 2) || E'% (threshold: 15%)\n';
    ELSE
        v_alert_message := v_alert_message || E'✅ **Conversion healthy:** ' || ROUND(v_conversion_rate, 2) || E'%\n';
    END IF;
    
    -- Add context metrics
    v_alert_message := v_alert_message || E'\n**Context:**\n';
    v_alert_message := v_alert_message || E'- Total Leads: ' || v_total_leads || E'\n';
    v_alert_message := v_alert_message || E'- Wisdom+ Sales: ' || v_wisdom_sales || E'\n';
    v_alert_message := v_alert_message || E'- Total Spend: $' || ROUND(v_total_spend, 2) || E'\n';
    
    -- Send alert only if thresholds breached
    IF v_should_alert THEN
        -- Use Manus notification API to alert owner
        PERFORM net.http_post(
            url := current_setting('app.settings.forge_api_url') || '/notification/send',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.settings.forge_api_key'),
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'title', '🚨 Wisdom Challenge Performance Alert',
                'content', v_alert_message,
                'app_id', current_setting('app.settings.app_id')
            )
        );
        
        RAISE NOTICE 'Performance alert sent: %', v_alert_message;
    ELSE
        RAISE NOTICE 'All metrics healthy, no alert sent';
    END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION check_performance_alerts() TO authenticated;
GRANT EXECUTE ON FUNCTION check_performance_alerts() TO anon;

-- Step 3: Schedule performance check every hour
SELECT cron.schedule(
    'check-performance-alerts',
    '0 * * * *',  -- Every hour at minute 0
    $$SELECT check_performance_alerts()$$
);

-- Step 4: Create manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_performance_alert_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM check_performance_alerts();
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Performance alert check triggered manually'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION trigger_performance_alert_check() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_performance_alert_check() TO anon;

-- ============================================================================
-- NOTES:
-- - Alerts check last 7 days of data
-- - Thresholds: CPP > $90, Conversion < 15%
-- - Runs every hour via pg_cron
-- - Uses Manus notification API to alert project owner
-- - To manually test: SELECT trigger_performance_alert_check();
-- - To disable: SELECT cron.unschedule('check-performance-alerts');
-- ============================================================================
