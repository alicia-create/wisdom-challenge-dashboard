-- Count Wisdom+ orders (product_id = 1)
SELECT 
  COUNT(DISTINCT o.id) as total_wisdom_sales,
  COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0) as non_zero_sales,
  SUM(o.order_total) as total_revenue,
  ROUND(SUM(o.order_total) / COUNT(DISTINCT o.id) FILTER (WHERE o.order_total > 0), 2) as aov
FROM orders o
WHERE EXISTS (
  SELECT 1 FROM order_items oi 
  WHERE oi.order_id = o.id AND oi.product_id = 1
)
AND o.billing_status IN ('paid', 'partially-refunded');

-- Count extra journals (product_id = 4)
SELECT 
  SUM(oi.quantity) as extra_journals
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE oi.product_id = 4
AND o.billing_status IN ('paid', 'partially-refunded');
