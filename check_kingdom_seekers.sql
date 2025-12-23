-- Check Kingdom Seekers orders (product_id = 8 or 9)
SELECT 
  'Product ID 8' as product,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.order_total) as revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 8
)
AND o.billing_status IN ('paid', 'partially-refunded')

UNION ALL

SELECT 
  'Product ID 9' as product,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.order_total) as revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 9
)
AND o.billing_status IN ('paid', 'partially-refunded')

UNION ALL

SELECT 
  'Product ID 8 OR 9' as product,
  COUNT(DISTINCT o.id) as order_count,
  SUM(o.order_total) as revenue
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id IN (8, 9)
)
AND o.billing_status IN ('paid', 'partially-refunded');
