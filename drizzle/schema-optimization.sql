-- Optimization Recommendations Table
CREATE TABLE IF NOT EXISTS optimization_recommendations (
  id VARCHAR(36) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  recommendation_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  ad_id VARCHAR(50),
  adset_id VARCHAR(50),
  campaign_id VARCHAR(50),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_required TEXT NOT NULL,
  expected_impact TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  approved_at TIMESTAMP,
  approved_by VARCHAR(100),
  rejection_reason TEXT,
  metadata JSON
);

-- GA4 Landing Page Metrics Table (for future use)
CREATE TABLE IF NOT EXISTS ga4_landing_page_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  landing_page VARCHAR(500) NOT NULL,
  session_source VARCHAR(100),
  session_campaign VARCHAR(100),
  sessions INT DEFAULT 0,
  bounce_rate DECIMAL(5,4),
  average_session_duration DECIMAL(10,2),
  conversions INT DEFAULT 0,
  engagement_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE KEY unique_metric (date, landing_page, session_source, session_campaign)
);
