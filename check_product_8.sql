-- Check if ANY orders exist with product_id = 8 (no date filter)
SELECT 
  COUNT(DISTINCT o.id) as total_orders,
  MIN(o.created_at) as first_order,
  MAX(o.created_at) as last_order,
  SUM(o.order_total) as total_revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 8
)
AND o.billing_status IN ('paid', 'partially-refunded');

-- Also check all product IDs to see what exists
SELECT DISTINCT oi.product_id, p.name, COUNT(*) as order_count
FROM order_items oi
LEFT JOIN products p ON p.id = oi.product_id
GROUP BY oi.product_id, p.name
ORDER BY oi.product_id;
