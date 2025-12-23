# Product IDs and Metrics Calculation Guide

**Last Updated:** December 23, 2025  
**Migration:** 031_fix_product_id_logic.sql

---

## 📦 Product ID Reference

### Core Products

| Product ID | Product Name | Description | Included in |
|------------|--------------|-------------|-------------|
| **1** | Wisdom+ (Backstage Pass) | Main VIP product | Wisdom+ Sales, Total Journals |
| **4** | Extra Journals | Order bump (additional journals) | Total Journals only |
| **8** | Kingdom Seekers - 60 Days | High-ticket product | Kingdom Seekers Trials |
| **9** | Kingdom Seekers - 30 Day Free Trial | Trial version | Kingdom Seekers Trials |

---

## 🧮 Metrics Calculation Logic

### 1. Wisdom+ Sales

**Definition:** Count of orders containing product_id = 1

**SQL Logic:**
```sql
COUNT(DISTINCT o.id) FILTER (
    WHERE EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.id AND oi.product_id = 1
    )
)
AND o.billing_status IN ('paid', 'partially-refunded')
```

**Expected Value (as of Dec 23, 2025):**
- Total: **3,559 orders**
- Breakdown:
  - `paid`: 3,555 orders
  - `partially-refunded`: 4 orders

**Important Notes:**
- ✅ Use `product_id = 1` (not order_total >= $31)
- ✅ Include both `paid` and `partially-refunded` statuses
- ❌ Do NOT include `refunded` status (9 orders = $341)
- ❌ Do NOT use order_total threshold (order bumps change the total)

---

### 2. Total Journals

**Definition:** Wisdom+ journals (1 per sale) + Extra Journals (product_id = 4 quantity)

**SQL Logic:**
```sql
-- Wisdom+ journals (1 per order)
COUNT(DISTINCT o.id) FILTER (
    WHERE EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.id AND oi.product_id = 1
    )
)

-- Extra Journals (sum of quantities)
+ SUM(oi.quantity) FILTER (
    WHERE oi.product_id = 4
)
```

**Expected Value (as of Dec 23, 2025):**
- Wisdom+ journals: **3,559**
- Extra journals: **474**
- **Total: 4,033 journals**

**Important Notes:**
- Each Wisdom+ sale includes 1 journal automatically
- Extra Journals are order bumps (product_id = 4)
- Must sum `quantity` field (not count orders)

---

### 3. Average Order Value (AOV)

**Definition:** Total revenue divided by non-zero orders

**SQL Logic:**
```sql
-- Total revenue
SUM(o.order_total)

-- Non-zero orders (exclude trials)
/ COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0)
```

**Expected Value (as of Dec 23, 2025):**
- Total revenue: **$115,640.95**
- Non-zero orders: **3,427**
- **AOV: $33.74**

**Important Notes:**
- ✅ Exclude orders with order_total = 0 (free trials)
- ✅ Use order_total (not order_items sum)
- Difference: 3,559 total orders - 3,427 non-zero = **132 free trials**

---

### 4. Total Revenue

**Definition:** Sum of order_total for paid/partially-refunded orders

**SQL Logic:**
```sql
SUM(o.order_total)
WHERE o.billing_status IN ('paid', 'partially-refunded')
AND EXISTS (
    SELECT 1 FROM order_items oi 
    WHERE oi.order_id = o.id AND oi.product_id = 1
)
```

**Expected Value (as of Dec 23, 2025):**
- **$115,640.95**

**Discrepancy with ClickFunnels:**
- ClickFunnels shows: **$119,177.40**
- Supabase shows: **$115,640.95**
- Difference: **$3,536.45** (~3%)

**Possible Reasons:**
1. ClickFunnels may include pending/processing orders
2. Sync delay from n8n workflows
3. Different date range interpretation
4. Refunds not yet synced to Supabase

---

### 5. Kingdom Seekers Trials

**Definition:** Count of orders containing product_id IN (8, 9)

**SQL Logic:**
```sql
COUNT(DISTINCT o.id) FILTER (
    WHERE EXISTS (
        SELECT 1 FROM order_items oi 
        WHERE oi.order_id = o.id AND oi.product_id IN (8, 9)
    )
)
```

**Expected Value (as of Dec 23, 2025):**
- **0 orders** (product currently deactivated)

---

## 🔍 Troubleshooting Guide

### Issue: Wisdom+ Sales count is wrong

**Check:**
1. Verify product_id = 1 in order_items table
2. Check billing_status filter (paid, partially-refunded only)
3. Verify date range filtering
4. Check for duplicate orders

**SQL to verify:**
```sql
SELECT 
  COUNT(DISTINCT o.id) as total_wisdom_sales,
  COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0) as non_zero_sales,
  SUM(o.order_total) as total_revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded');
```

---

### Issue: Total Journals is incorrect

**Check:**
1. Verify Wisdom+ count (product_id = 1)
2. Verify Extra Journals sum (product_id = 4 quantity)
3. Check for NULL quantities

**SQL to verify:**
```sql
-- Wisdom+ journals
SELECT COUNT(DISTINCT o.id) as wisdom_journals
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded');

-- Extra journals
SELECT SUM(oi.quantity) as extra_journals
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE oi.product_id = 4
AND o.billing_status IN ('paid', 'partially-refunded');
```

---

### Issue: AOV is too high/low

**Check:**
1. Verify excluding order_total = 0 orders
2. Check for outliers (very high order values)
3. Verify using order_total (not order_items sum)

**SQL to verify:**
```sql
SELECT 
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0) as non_zero_orders,
  SUM(o.order_total) as total_revenue,
  ROUND(SUM(o.order_total) / COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0), 2) as aov
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded');
```

---

### Issue: Revenue doesn't match ClickFunnels

**Check:**
1. Compare date ranges (Last 4 weeks vs ALL)
2. Check billing_status filters
3. Verify n8n sync is up to date
4. Check for pending/processing orders in ClickFunnels

**SQL to compare:**
```sql
-- Last 4 weeks
SELECT 
  'Last 4 weeks' as period,
  COUNT(DISTINCT o.id) as wisdom_sales,
  SUM(o.order_total) as total_revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded')
AND o.created_at >= NOW() - INTERVAL '4 weeks';

-- ALL time
SELECT 
  'ALL time' as period,
  COUNT(DISTINCT o.id) as wisdom_sales,
  SUM(o.order_total) as total_revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded');
```

---

## 📊 Billing Status Reference

| Status | Include in Metrics? | Notes |
|--------|---------------------|-------|
| `paid` | ✅ Yes | Fully paid orders |
| `partially-refunded` | ✅ Yes | Keep partial revenue |
| `refunded` | ❌ No | Full refund, exclude |
| `pending` | ❌ No | Not yet paid |
| `cancelled` | ❌ No | Order cancelled |

**Current Distribution (Dec 23, 2025):**
- `paid`: 3,555 orders = $115,516.95
- `partially-refunded`: 4 orders = $124.00
- `refunded`: 9 orders = $341.00 (excluded)

---

## 🔄 Migration History

### Migration 031 (Dec 23, 2025)

**Changes:**
1. Fixed Wisdom+ Sales to use `product_id = 1` (not order_total >= $31)
2. Fixed Total Journals calculation (Wisdom+ + Extra Journals)
3. Fixed AOV to exclude order_total = 0 (free trials)
4. Added `wisdom_sales_non_zero` field for accurate AOV

**SQL Function:** `get_dashboard_metrics()`

**Files Modified:**
- `migrations/031_fix_product_id_logic.sql`
- `server/routers.ts` (uses new function)
- `client/src/pages/Overview.tsx` (displays metrics)

---

## 📝 Best Practices

1. **Always use product_id for product identification**
   - Don't rely on order_total thresholds
   - Order bumps change the total value

2. **Include both paid and partially-refunded statuses**
   - Partial refunds still count as sales
   - Full refunds should be excluded

3. **Exclude $0 orders from AOV calculation**
   - Free trials skew the average
   - Use separate count for non-zero orders

4. **Use order_total for revenue (not order_items sum)**
   - order_total includes all charges (shipping, tax, etc)
   - order_items may not reflect final amount

5. **Document all product IDs**
   - Product names can change
   - IDs are stable identifiers

---

## 🚀 Quick Reference Commands

### Check current metrics:
```sql
SELECT * FROM get_dashboard_metrics('2024-01-01', '2025-12-31');
```

### Verify product IDs:
```sql
SELECT id, name FROM products ORDER BY id;
```

### Check billing statuses:
```sql
SELECT billing_status, COUNT(*) 
FROM orders 
GROUP BY billing_status 
ORDER BY COUNT(*) DESC;
```

### Find orders with specific product:
```sql
SELECT o.id, o.order_total, o.billing_status, o.created_at
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
ORDER BY o.created_at DESC
LIMIT 10;
```

---

## 📞 Support

If metrics still don't match:
1. Check this documentation first
2. Run verification SQL queries
3. Compare with ClickFunnels export
4. Check n8n workflow logs
5. Verify Supabase sync status

**Last verified:** December 23, 2025  
**Next review:** When product lineup changes
