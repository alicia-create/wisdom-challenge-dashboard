-- Check revenue by date range
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

-- Check ALL revenue (no date filter)
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

-- Check if there are other billing statuses we're missing
SELECT 
  billing_status,
  COUNT(*) as order_count,
  SUM(order_total) as revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
GROUP BY billing_status
ORDER BY order_count DESC;
