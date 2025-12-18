-- ============================================================================
-- FIX: Update CPL (Ads) and CPP (Ads) to use Meta LEADS + SALES spend only
-- Execute this SQL directly in Supabase SQL Editor
-- ============================================================================

-- Find line 637 in your function and replace it with these two lines:

-- OLD (line 637):
-- ,'cplAds', CASE WHEN v_paid_leads > 0 THEN ROUND((v_leads_sales_spend / v_paid_leads)::NUMERIC, 2) ELSE 0 END            ,'cppAds', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND((v_leads_sales_spend / v_paid_wisdom_sales)::NUMERIC, 2) ELSE 0 END            ,'trueCpl', CASE WHEN v_total_leads > 0 THEN ROUND((v_total_spend / v_total_leads)::NUMERIC, 2) ELSE 0 END            ,'trueCpp', CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_total_spend / v_wisdom_sales)::NUMERIC, 2) ELSE 0 END

-- NEW (replace with this):
,'cplAds', CASE WHEN v_paid_leads > 0 THEN ROUND(((v_meta_leads_spend + v_meta_sales_spend) / v_paid_leads)::NUMERIC, 2) ELSE 0 END
,'cppAds', CASE WHEN v_paid_wisdom_sales > 0 THEN ROUND(((v_meta_leads_spend + v_meta_sales_spend) / v_paid_wisdom_sales)::NUMERIC, 2) ELSE 0 END
,'trueCpl', CASE WHEN v_total_leads > 0 THEN ROUND((v_total_spend / v_total_leads)::NUMERIC, 2) ELSE 0 END
,'trueCpp', CASE WHEN v_wisdom_sales > 0 THEN ROUND((v_total_spend / v_wisdom_sales)::NUMERIC, 2) ELSE 0 END

-- ============================================================================
-- INSTRUCTIONS:
-- 1. Open Supabase SQL Editor
-- 2. Find the get_dashboard_metrics function
-- 3. Locate line 637 (search for "cplAds")
-- 4. Replace the entire line with the 4 lines above (NEW version)
-- 5. Click "Run" to update the function
-- ============================================================================
