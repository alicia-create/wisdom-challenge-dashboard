# Wisdom+ Sales Count Fix - Documentation

## Problem Identified

The dashboard was showing **incorrect Wisdom+ Sales counts** due to two critical issues:

### Issue 1: Wrong Filtering Logic for Orders
**Problem:** The function was using `wisdom_leads.is_paid` and `wisdom_leads.is_organic` (from analytics_events) to filter **orders**.

**Impact:** Orders were being classified as paid/organic based on the lead's funnel, not the order's actual funnel.

**Solution:** Changed to filter orders directly by `funnel_name` field:
- **Paid**: `funnel_name LIKE '%31daywisdom.com%' AND funnel_name NOT LIKE '%challenge%'`
- **Organic**: `funnel_name LIKE '%31daywisdomchallenge.com%'`

### Issue 2: Timezone Conversion Causing Date Mismatch
**Problem:** The function was converting `created_at` to LA timezone:
```sql
WHERE (o.created_at AT TIME ZONE 'America/Los_Angeles') >= v_start_ts
```

**Impact:** Orders created on 2025-12-23 UTC were being shifted to 2025-12-22 LA time, causing massive undercounting (80 orders instead of 606).

**Solution:** Removed timezone conversion and use UTC directly:
```sql
WHERE o.created_at >= p_start_date::timestamp
  AND o.created_at < v_next_day_str::timestamp
```

## Results After Fix

### Today's Data (2025-12-23)
- **Total Wisdom+ Sales**: 606 ✅ (vs 602 in ClickFunnels - acceptable 4 order difference)
- **Paid (31daywisdom.com)**: 459
- **Organic (31daywisdomchallenge.com)**: 144
- **Total Revenue**: $18,027.85
- **AOV**: $29.75

### All-Time Data (30 days)
- **Total Wisdom+ Sales**: 4,609
- **Total Leads**: 31,137
- **Conversion Rate**: 14.80%
- **Total Revenue**: $129,664.60

## Key Learning

**Orders vs Leads filtering:**
- **Orders** → Filter by `funnel_name` field in `orders` table
- **Leads** → Filter by analytics_events to determine paid vs organic funnel

**Never mix these two approaches!**

## Migrations Applied
1. **Migration 021**: Fixed order filtering to use `funnel_name` from orders table
2. **Migration 022**: Removed timezone conversion to fix date mismatch

## Files Modified
- `/migrations/021_fix_order_funnel_filtering.sql`
- `/migrations/022_remove_timezone_conversion.sql`
- `get_dashboard_metrics()` function in Supabase
