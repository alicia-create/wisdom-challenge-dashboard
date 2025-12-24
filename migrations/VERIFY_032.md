# Migration 032 Verification Guide

## Before Applying Migration

Run this query in Supabase SQL Editor to see current structure:
```sql
SELECT get_dashboard_metrics('2025-12-13', '2025-12-23');
```

Check if these fields exist in kpis object:
- `welcomeEmailClicks` (should be missing)
- `cplAds` (should be missing)
- `cppAds` (should be missing)
- `trueCpl` (should be missing)
- `trueCpp` (should be missing)

## After Applying Migration

Run the same query again:
```sql
SELECT get_dashboard_metrics('2025-12-13', '2025-12-23');
```

Verify these fields now exist in kpis object with correct values:
- `welcomeEmailClicks`: Should be > 0 (sum of paid + organic email clicks)
- `cplAds`: Should match current CPL (Ads) value in dashboard
- `cppAds`: Should match current CPP (Ads) value in dashboard
- `trueCpl`: Should match current True CPL value in dashboard
- `trueCpp`: Should match current True CPP value in dashboard

## Expected Values (30-day period)

Based on current dashboard:
- `welcomeEmailClicks`: ~1,682
- `cplAds`: ~$6.27
- `cppAds`: ~$64.43
- `trueCpl`: ~$6.25
- `trueCpp`: ~$55.61

## Rollback (if needed)

If something goes wrong, rollback to previous version:
```sql
-- This will restore Migration 031 (previous working version)
-- Copy the entire get_dashboard_metrics function from migrations/031_fix_product_id_logic.sql
```

## Dashboard Test

After applying migration:
1. Open dashboard at /overview
2. Click "Refresh Data" button
3. Verify all KPI cards show correct values:
   - CPP (Ads) card shows value + "True: $XX.XX" in footer
   - CPL (Ads) card shows value + "True: $XX.XX" in footer
   - Email Clicks card shows count + percentage
4. No errors in browser console
5. All charts render correctly

## Success Criteria

✅ SQL function executes without errors
✅ All 5 new fields present in kpis object
✅ Values match current dashboard display
✅ Dashboard loads without errors
✅ Refresh Data button works
✅ No console errors
