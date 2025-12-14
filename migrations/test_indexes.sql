-- Test Performance Indexes (Corrected Schema)
-- This file contains only the fixed indexes to test

-- Test 1: analytics_events type index (was funnel - doesn't exist)
CREATE INDEX IF NOT EXISTS idx_analytics_events_type 
ON analytics_events(type);

-- Test 2: products product_name index (was name - doesn't exist)
CREATE INDEX IF NOT EXISTS idx_products_product_name 
ON products(product_name);

-- Test 3: Sample indexes from other tables to verify they work
CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
ON contacts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_contact_id 
ON orders(contact_id);

CREATE INDEX IF NOT EXISTS idx_ad_performance_date 
ON ad_performance(date DESC);

-- Verify indexes were created
SELECT 
  tablename, 
  indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname IN (
    'idx_analytics_events_type',
    'idx_products_product_name',
    'idx_contacts_created_at',
    'idx_orders_contact_id',
    'idx_ad_performance_date'
  )
ORDER BY tablename, indexname;
