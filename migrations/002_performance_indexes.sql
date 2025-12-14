-- Performance Optimization Indexes
-- Created: 2025-12-13
-- Purpose: Improve query performance for frequently accessed columns

-- ============================================
-- CONTACTS TABLE INDEXES
-- ============================================

-- Index for date range queries (most frequent operation)
CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
ON contacts(created_at DESC);

-- Index for manychat_id filtering (used in ManyChat bot users count)
CREATE INDEX IF NOT EXISTS idx_contacts_manychat_id 
ON contacts(manychat_id) 
WHERE manychat_id IS NOT NULL;

-- Composite index for wisdom funnel queries (id + created_at)
CREATE INDEX IF NOT EXISTS idx_contacts_id_created_at 
ON contacts(id, created_at DESC);

-- ============================================
-- ORDERS TABLE INDEXES
-- ============================================

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_orders_created_at 
ON orders(created_at DESC);

-- Index for contact_id JOIN operations
CREATE INDEX IF NOT EXISTS idx_orders_contact_id 
ON orders(contact_id);

-- Index for VIP sales filtering (order_total >= 31)
CREATE INDEX IF NOT EXISTS idx_orders_order_total 
ON orders(order_total);

-- Composite index for wisdom funnel VIP queries (contact_id + order_total + created_at)
CREATE INDEX IF NOT EXISTS idx_orders_contact_order_total_date 
ON orders(contact_id, order_total, created_at DESC) 
WHERE order_total >= 31;

-- Index for high-ticket sales (order_total >= 1000)
CREATE INDEX IF NOT EXISTS idx_orders_high_ticket 
ON orders(order_total, purchase_date DESC) 
WHERE order_total >= 1000;

-- ============================================
-- AD_PERFORMANCE TABLE INDEXES
-- ============================================

-- Index for date range queries (most frequent)
CREATE INDEX IF NOT EXISTS idx_ad_performance_date 
ON ad_performance(date DESC);

-- Index for platform filtering (Meta/Google)
CREATE INDEX IF NOT EXISTS idx_ad_performance_platform 
ON ad_performance(platform);

-- Index for campaign name filtering (case-insensitive)
-- Using trigram index for ILIKE queries
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_ad_performance_campaign_name_trgm 
ON ad_performance USING gin(campaign_name gin_trgm_ops);

-- Composite index for platform + date queries
CREATE INDEX IF NOT EXISTS idx_ad_performance_platform_date 
ON ad_performance(platform, date DESC);

-- Index for campaign hierarchy queries
CREATE INDEX IF NOT EXISTS idx_ad_performance_campaign_id 
ON ad_performance(campaign_id);

CREATE INDEX IF NOT EXISTS idx_ad_performance_adset_id 
ON ad_performance(adset_id);

CREATE INDEX IF NOT EXISTS idx_ad_performance_ad_id 
ON ad_performance(ad_id);

-- ============================================
-- ANALYTICS_EVENTS TABLE INDEXES
-- ============================================

-- Index for contact_id JOIN operations
CREATE INDEX IF NOT EXISTS idx_analytics_events_contact_id 
ON analytics_events(contact_id);

-- Index for event name filtering
CREATE INDEX IF NOT EXISTS idx_analytics_events_name 
ON analytics_events(name);

-- Index for funnel filtering (wisdom challenge events)
CREATE INDEX IF NOT EXISTS idx_analytics_events_funnel 
ON analytics_events(funnel);

-- Composite index for contact activity queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_contact_timestamp 
ON analytics_events(contact_id, timestamp DESC);

-- Trigram index for comment/value search
CREATE INDEX IF NOT EXISTS idx_analytics_events_comment_trgm 
ON analytics_events USING gin(comment gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_analytics_events_value_trgm 
ON analytics_events USING gin(value gin_trgm_ops);

-- ============================================
-- ORDER_ITEMS TABLE INDEXES
-- ============================================

-- Index for product_id filtering (Kingdom Seeker Trials)
CREATE INDEX IF NOT EXISTS idx_order_items_product_id 
ON order_items(product_id);

-- Index for order_id JOIN operations
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON order_items(order_id);

-- Composite index for product filtering with order join
CREATE INDEX IF NOT EXISTS idx_order_items_product_order 
ON order_items(product_id, order_id);

-- ============================================
-- PRODUCTS TABLE INDEXES
-- ============================================

-- Index for product name search
CREATE INDEX IF NOT EXISTS idx_products_name 
ON products(name);

-- ============================================
-- WORKFLOW_ERRORS TABLE INDEXES
-- ============================================

-- Index for workflow_name filtering
CREATE INDEX IF NOT EXISTS idx_workflow_errors_workflow_name 
ON workflow_errors(workflow_name);

-- Index for error_timestamp queries
CREATE INDEX IF NOT EXISTS idx_workflow_errors_timestamp 
ON workflow_errors(error_timestamp DESC);

-- Composite index for workflow error queries
CREATE INDEX IF NOT EXISTS idx_workflow_errors_workflow_timestamp 
ON workflow_errors(workflow_name, error_timestamp DESC);

-- ============================================
-- PERFORMANCE STATISTICS
-- ============================================

-- Update table statistics for query planner
ANALYZE contacts;
ANALYZE orders;
ANALYZE ad_performance;
ANALYZE analytics_events;
ANALYZE order_items;
ANALYZE products;
ANALYZE workflow_errors;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries to verify indexes were created:
-- SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- Check index usage statistics:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;
