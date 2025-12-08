# Project TODO

## Database & Backend
- [x] Define Supabase database schema (Lead, Order, ad_performance, daily_attendance, daily_kpis tables)
- [x] Create tRPC procedures to fetch data from Supabase
- [x] Implement authentication and authorization
- [x] Create procedures for Overview dashboard metrics
- [x] Create procedures for Daily Analysis data
- [x] Create procedures for Engagement & Sales tracking

## Frontend - View 1: Overview Dashboard
- [x] Design and implement KPI cards (Total Leads, Total Spend, CPL, CPP, ROAS, VIP Take Rate)
- [x] Create spend trend chart (daily spend over time)
- [x] Create leads trend chart (daily leads over time)
- [x] Create ROAS trend chart
- [x] Implement real-time data refresh (30-minute intervals)

## Frontend - View 2: Daily Analysis
- [x] Create spreadsheet-like table with daily columns
- [x] Display daily metrics: Date, Leads, Spend, CPL, VIP Sales, VIP Revenue, CPP, ROAS
- [x] Add filtering by date range
- [x] Add sorting capabilities
- [x] Show campaign-level breakdown

## Frontend - View 3: Engagement & Sales
- [x] Create attendance tracking visualization
- [x] Display email engagement metrics (welcome email clicks)
- [x] Show high-ticket sales attribution
- [x] Connect sales to original UTM parameters
- [x] Display conversion funnel

## Polish & Testing
- [x] Implement loading states for all data fetches
- [x] Add error handling and user feedback
- [ ] Test with sample data (pending n8n workflows to populate Supabase)
- [x] Verify real-time updates work correctly
- [x] Write vitest tests for critical procedures
- [ ] Create project checkpoint

## Documentation
- [ ] Document Supabase connection setup
- [ ] Document n8n workflow configuration
- [ ] Create deployment guide
- [ ] Prepare final delivery package


## n8n Workflow Updates
- [ ] Rewrite Keap workflow to use webhook trigger instead of polling
- [ ] Document webhook URL configuration in Keap
- [ ] Test webhook trigger with sample tag application


## n8n Workflow Updates
- [x] Rewrite Keap workflow to use webhook trigger instead of polling
- [x] Create step-by-step guide for configuring HTTP Post in Keap automation
- [x] Document webhook URL and payload structure
- [x] Test webhook trigger with sample tag application

- [x] Update Keap webhook workflow to use email as primary key instead of contact_id

- [x] Fix Meta Ads workflow to use simplified fields (campaign_name, spend, clicks, impressions only)

## Database Schema Updates (Campaign + Ad Set + Ad Granularity)
- [x] Remove UTM fields from ad_performance table (utm_campaign, utm_source, utm_medium)
- [x] Add adset_id, adset_name fields for ad set level tracking
- [x] Add ad_id, ad_name fields for individual ad tracking
- [x] Add landing_page_view_per_link_click field (measures load speed & relevance)
- [x] Add inline_link_clicks field for accurate click tracking
- [x] Update campaign_id and campaign_name fields
- [x] Create migration SQL script for Supabase
- [x] Update Meta Ads workflow to fetch campaign + adset + ad level data
- [x] Update dashboard to show ad set and ad level breakdowns
- [x] Add landing page view rate visualization to dashboard

## Google Ads & Meta Ads Workflow Normalization
- [x] Research Google Ads API fields at ad-level granularity
- [x] Find Google Ads equivalent to landing_page_view_per_link_click (NÃO EXISTE - deixar NULL)
- [x] Map Google Ads Ad Group to adset_id/adset_name fields
- [x] Create field mapping document (Meta vs Google)
- [x] Build Google Ads workflow with ad-level data
- [ ] Test both workflows with sample data (pending user testing)

## Campaign Filtering
- [x] Add global campaign name filter constant (31DWC2026)
- [x] Update all Supabase queries to filter by campaign name
- [ ] Test filtered queries and verify data accuracy

## Date Range Filtering
- [x] Add date range filter UI component (TODAY, YESTERDAY, 7 DAYS, 14 DAYS, 30 DAYS)
- [x] Update Overview page to support date range filtering
- [x] Pass date range to all tRPC queries
- [x] Add date range helper functions in constants

## UI Improvements
- [ ] Reorganize KPIs into 2 rows: 4 large cards (Leads, Spend, Revenue, VIP Sales) + 6 small cards (CPL, CPP, AOV, ROAS, Take Rate, Email Click Rate)
- [ ] Add Total Revenue KPI from Order table
- [ ] Add AOV (Average Order Value) KPI
- [ ] Fix Daily Spend & Leads chart - use different colors for bars (not both black)
- [ ] Fix date range filter - queries not updating when filter changes

- [x] Implement global navigation header with tabs (Overview, Daily Analysis, Engagement & Sales)

- [x] Implement CSV/Excel export for Daily Analysis page

- [x] Implement View 3 "Engagement & Sales" page with attendance tracking and high-ticket sales

- [x] Fix date ordering in Overview charts to display chronologically (left to right)

- [x] Fix React key prop error in DailyAnalysis page
- [x] Add informative tooltips to KPI cards explaining metric calculations

- [x] Implement Performance by Channel Table in Overview page (Meta vs Google comparison)

- [x] Configure YouTube Analytics workflow in n8n (documentation created)
- [x] Configure Zoom API workflow in n8n (documentation created)

- [x] Create Leads debug page with pagination and filters
- [x] Create Purchases debug page with pagination and filters

- [x] Fix Leads page to show full_name as fallback
- [x] Fix Purchases page columns (name, email, order_items)
- [x] Add UTM search to Leads page
- [x] Rename Debug menu to "Raw Data"

- [x] Create Google Campaigns page with pagination and filters
- [x] Create Meta Campaigns page with pagination and filters
- [x] Add CSV export to Leads page
- [x] Add CSV export to Purchases page
- [x] Add CSV export to Google Campaigns page
- [x] Add CSV export to Meta Campaigns page

- [x] Fix chart date ordering to be ascending (oldest to newest)

## Schema Migration (2025-12-06)
- [x] Analyze new Supabase schema (contacts, orders, analytics_events, products, order_items)
- [x] Update backend queries for renamed tables (Lead→contacts, Order→orders)
- [x] Remove high_ticket_sales references (now in orders with order_total >= 1000)
- [x] Update getHighTicketSales to use orders table with JOIN to order_items and products
- [x] Temporarily disable daily_attendance queries (return zero until analytics_events is configured)
- [x] Write and pass 10 vitest tests validating schema migration
- [ ] Integrate analytics_events table for engagement tracking (YouTube/Zoom attendance)
- [ ] Update frontend to handle new data structure (if needed)

## Contacts Page Updates (2025-12-06)
- [x] Explore analytics_events table structure in Supabase
- [x] Create backend query to filter contacts by "wisdom" funnel using analytics_events
- [x] Create backend query to fetch all activities for a specific contact from analytics_events
- [x] Update Leads page to show only wisdom funnel contacts
- [x] Add click handler to contact rows
- [x] Create activity modal/drawer to display contact's event history
- [x] Test filtering and activity view functionality
- [x] Filter to last 2 days for normalized data
- [x] Enhanced search across contacts and analytics_events

## Field Name Updates (2025-12-06)
- [ ] Check all table schemas in Supabase (contacts, orders, order_items, products, analytics_events)
- [ ] Update all queries to use correct field names (full_name not name, etc)
- [ ] Remove UTM field references from contacts table (UTM data is in analytics_events)
- [ ] Update search queries to use correct field names
- [ ] Fix all failing tests due to field name mismatches

## Recent Leads Filter & Enhanced Search (2025-12-06)
- [x] Add date filter to show only leads from last 2 days (more normalized data)
- [x] Enhance search to query analytics_events table for UTM data, funnel names, etc
- [x] Update search to be more comprehensive across contact and event data

## Daily Analysis Wisdom Filter (2025-12-06)
- [x] Update getDailyAnalysisMetrics to filter by wisdom funnel contacts only
- [x] Update getOverviewMetrics to filter by wisdom funnel contacts only
- [x] Ensure all dashboard metrics reflect wisdom funnel data only
- [x] Create shared wisdom-filter.ts helper for consistent filtering
- [x] Update all tests to pass with wisdom-only data
- [x] Remove outdated tests with old table names

## Ad Performance Integration (2025-12-06)
- [ ] Explore ad_performance table structure and sample data
- [ ] Verify CAMPAIGN_NAME_FILTER matches actual campaign names in database
- [ ] Update getOverviewMetrics to fetch real ad spend data
- [ ] Update getDailyAnalysisMetrics to include ad performance by date
- [ ] Calculate ROAS correctly (revenue / spend)
- [ ] Test with real ad performance data
- [ ] Verify metrics display correctly in dashboard

## Error Logs Page (2025-12-06)
- [x] Check if error_logs table exists in Supabase (found: workflow_errors)
- [x] Explore workflow_errors table structure (id, created_at, workflow_name, error_node, error_message, error_timestamp, execution_id)
- [x] Create backend procedure to fetch paginated workflow_errors
- [x] Create ErrorLogs page component with table view
- [x] Add filtering by workflow_name, error_node, date range
- [x] Add search functionality for error messages
- [x] Add route to App.tsx and navigation link
- [ ] Test error logs page functionality

## Overview Page Improvements (2025-12-06)
- [x] Fix Total Revenue to show sum of order_total from orders table
- [x] Add "ManyChat Bot Users" metric (count contacts with manychat_id)
- [x] Add "Broadcast Subscribers" metric (count from analytics_events ManyChat engagement)
- [x] Explore analytics_events for ManyChat broadcast subscription events
- [x] Update getOverviewMetrics backend to include new metrics
- [x] Separate "Daily Spend & Leads" into two separate charts
- [x] Remove "ROAS Trend" chart from Overview page
- [x] Replace ROAS card with ManyChat Bot Users
- [x] Replace Email Click Rate card with Broadcast Subscribers
- [x] Test all metrics display correctly

## Dashboard Fixes (2025-12-06)
- [x] Add "Kingdom Seeker Trials" metric (third funnel step) next to VIP Sales
- [x] Fix Total Revenue to show ALL orders (including organic traffic, not just wisdom contacts)
- [x] Investigate and fix Purchases page errors (working, just missing contact data due to null contact_id)
- [x] Add custom date range picker to Overview page (beyond presets)
- [x] Test all fixes work correctly

## Future Tasks (Backlog)
- [ ] Fix n8n automations to populate contact_id in orders table

## ErrorLogs Page Navigation Fix (2025-12-06)
- [x] Add navigation header to ErrorLogs page to allow returning to other pages
- [x] Test navigation works correctly

## Navigation & UX Improvements (2025-12-06)
- [x] Add "Back to Dashboard" button to DebugLeads page
- [x] Add "Back to Dashboard" button to DebugPurchases page
- [x] Create Breadcrumb component for navigation hierarchy
- [x] Add breadcrumbs to Overview page (can expand to other pages later)
- [x] Implement ESC keyboard shortcut to go back/close modals
- [x] Implement / keyboard shortcut to focus search inputs
- [x] Test all navigation and keyboard shortcuts work correctly

## Bug Fix: Nested Anchor Error (2025-12-07)
- [x] Fix nested <a> tag error in Breadcrumb component (Link wrapping <a>)
- [x] Test Overview page to ensure error is resolved

## Verify Wisdom Filter Coverage (2025-12-07)
- [x] Verify all dashboard metrics filter by Wisdom funnel only
- [x] Check if Total Leads count is correct (should be Wisdom leads only - showing 12)
- [x] Test Overview page shows only Wisdom data

## Fix Daily Leads Chart Dates (2025-12-07)
- [x] Investigate why Daily Leads chart shows Nov 2024 dates when actual data is from Nov-Dec 2025
- [x] Fix getDailyAnalysisMetrics or chart component to use correct date range (replaced getDailyKpis with getDailyAnalysisMetrics)
- [x] Test chart displays correct dates matching Supabase data

## Update VIP Sales Logic (2025-12-07)
- [x] Change VIP Sales calculation from product-based to order_total >= $31
- [x] Update getOverviewMetrics to use new VIP Sales logic
- [x] Update getDailyAnalysisMetrics to use new VIP Sales logic
- [x] Test VIP Sales count matches orders with total >= $31

## Keap API Integration (2025-12-07)
- [x] Analyze Keap tags structure (Wisdom Challenge + List Defender)
- [x] Implement OAuth 2.0 authentication for Keap API
- [x] Create server/keap.ts helper functions
- [x] Create tRPC procedures for tags and email engagement
- [x] Build Email Engagement metrics UI (open rate, click rate, broadcast subscribers)
- [x] Build Tag Segmentation UI (Wisdom Challenge tags distribution)
- [x] Build List Defender Quality dashboard (lead quality monitoring)
- [x] Test Keap API integration end-to-end

## Keap Token Persistence (2025-12-07)
- [x] Create keap_tokens table in database schema
- [x] Migrate token storage from file to database
- [x] Update loadTokens() to read from database
- [x] Update saveTokens() to write to database
- [x] Test token persistence and refresh flow
- [x] Run vitest tests to validate Keap API integration

## Email & Lead Quality UI (2025-12-07)
- [x] Create EmailLeadQuality page component
- [x] Add "Email & Lead Quality" tab to navigation
- [x] Implement Email Engagement section (broadcast subscribers, opt-ins/opt-outs, click rate)
- [x] Implement Lead Quality section (List Defender: Green/Yellow/Red distribution)
- [x] Add Tag Distribution charts (Wisdom Challenge tags)
- [x] Add key email metrics to Overview page
- [x] Test all UI components display correctly

## List Defender & Click Rate Fixes (2025-12-07)
- [x] Research Keap API email tracking capabilities (completed - no open/click endpoints)
- [x] Implement tag-based click rate calculation for Wisdom subset
- [x] Create function to get contacts with multiple tags (union, not intersection)
- [x] Update getEmailEngagementMetrics to filter by Wisdom tags
- [x] Update getLeadQualityMetrics to return both total and Wisdom subset
- [x] Update EmailLeadQuality page UI to show both metrics
- [x] Fix contact structure (API returns {contact: {id}, date_applied})
- [x] Remove Trigger tag from Wisdom filter (only Historical + Status)
- [x] Add sample disclaimer to UI (1000 contacts limit)
- [x] Test all changes work correctly

## English Translation & Navigation (2025-12-07)
- [x] Audit all pages for Portuguese text (EmailLeadQuality, Overview, DailyAnalysis, etc)
- [x] Translate EmailLeadQuality page to English
- [x] Add breadcrumb navigation to EmailLeadQuality page
- [x] Test EmailLeadQuality page displays correctly in English
- [ ] Translate Overview page tooltips and labels to English (if any Portuguese remains)
- [ ] Translate DailyAnalysis page to English (if any Portuguese remains)
- [ ] Translate EngagementSales page to English (if any Portuguese remains)
- [ ] Translate all Raw Data pages to English (if any Portuguese remains)

## Mobile & Desktop Responsive Fixes (2025-12-07)
- [x] Fix Contact Activity Timeline modal width for mobile
- [x] Move Raw Data dropdown into main tabs navigation
- [x] Remove separate Raw Data dropdown button
- [x] Create Raw Data landing page with links to sub-pages
- [x] Shorten tab labels for mobile (Daily, Engagement, Email & Leads)
- [x] Add DashboardHeader to Raw Data page
- [x] Ensure horizontal scroll works smoothly on mobile
- [ ] Test all pages on mobile (Overview, Daily Analysis, Engagement & Sales, Email & Lead Quality, Raw Data)
- [x] Verify navigation is consistent across all pages
- [ ] Test on different mobile screen sizes (320px, 375px, 414px)

## Facebook Audiences & Data Source Verification (2025-12-07)
- [ ] Check current Meta Campaigns page data source (Supabase vs API)
- [ ] Check current Google Campaigns page data source (Supabase vs API)
- [ ] Create facebook_audiences table in database schema (id, name, audience_id, size, created_at, updated_at)
- [ ] Create tRPC procedure to fetch Facebook Audiences
- [ ] Create FacebookAudiences.tsx page component
- [ ] Add Facebook Audiences card to Raw Data landing page
- [ ] Add route for /raw-data/facebook-audiences
- [ ] Test Facebook Audiences page displays correctly
- [ ] Document data sources for Meta and Google campaigns

## Optimization Agent Features (2025-12-07)

- [x] Update optimization rules with adjusted priorities (Purchase Rate → Lead Rate → Connect Rate → CPC → CTR → CPM)
- [x] Adjust funnel leak detection (Click-to-Purchase, Lead-to-Purchase)
- [x] Update benchmarks (CTR 2%, Connect Rate 80%, Lead Rate 25% - remove fixed CPL/CPC)
- [x] Add time-of-day performance analysis (for scaling decisions)
- [x] Research and integrate VWO API for A/B test data
- [x] Research Google Analytics 4 API for landing page metrics
- [x] Create comprehensive AI PRD for Campaign Optimization Agent
- [ ] Research Keap Lead Score API and webhook capabilities (Backlog)
- [ ] Design campaign interference detection logic (broad audience overlap)
- [ ] Build optimization agent backend with LLM recommendations
- [ ] Create daily optimization report UI
- [ ] Integrate Google Analytics API (pending user GA4 Property ID)
- [ ] Integrate VWO API (pending user VWO export setup)
- [ ] Test agent with real campaign data

## PRD Download & Agent Implementation (2025-12-07)

- [x] Create PRD download page/section in dashboard
- [x] Add download button for PRD and supporting docs
- [x] Implement optimization engine backend (FR1-FR3)
- [x] Create optimization_recommendations table in database
- [x] Create ga4_landing_page_metrics table in database
- [x] Build tRPC optimization router with core procedures
- [x] Create OptimizationAgent.tsx page with basic UI
- [x] Add Optimization Agent tab to dashboard header
- [x] Add route for /optimization-agent
- [ ] Test ad-level analysis with real campaign data
- [ ] Implement LLM-powered insights for recommendations
- [ ] Add time-of-day performance analysis
- [ ] Add budget redistribution suggestions
- [ ] Add winner scaling recommendations

## LLM Integration for Optimization Agent (2025-12-07)

- [x] Design LLM prompt structure for optimization insights
- [x] Create optimization-llm.ts module with LLM analysis functions
- [x] Implement generateDailyReport() with LLM-powered narrative
- [x] Implement explainRecommendation() for individual recommendations
- [x] Implement explainFunnelLeak() for funnel leak explanations
- [x] Create tRPC procedure for LLM-generated daily report (optimization.dailyReport)
- [x] Create tRPC procedures for detailed explanations (explainRecommendation, explainFunnelLeak)
- [x] Update OptimizationAgent UI to display LLM insights
- [x] Add loading states and skeleton loaders for LLM generation
- [x] Integrate Streamdown for markdown rendering of LLM narratives
- [ ] Test LLM integration with real campaign data
- [ ] Add error handling and retry logic for LLM failures
- [ ] Implement caching for daily reports to reduce LLM costs

## Navigation Reorganization & GA4 Integration (2025-12-07)

- [x] Move Documentation page under Raw Data section
- [x] Update DashboardHeader to remove Docs tab
- [x] Add "Documentation" link to Raw Data page
- [x] Request GA4 Property ID from user
- [x] Request GA4 Service Account JSON key from user
- [x] Create ga4.ts module for Google Analytics API integration
- [x] Implement fetchLandingPageMetrics() function
- [x] Implement testGA4Connection() function
- [x] Create ga4-db.ts module for database operations
- [x] Implement syncGA4Metrics() to store data in ga4_landing_page_metrics table
- [x] Implement getAggregatedGA4Metrics() function
- [x] Implement getLatestGA4SyncDate() function
- [x] Create tRPC procedures for GA4 (isConfigured, sync, getMetrics, getLatestSync)
- [x] Create GA4LandingPageMetrics page component
- [x] Add GA4 Landing Pages card to Raw Data page
- [x] Add route for /raw-data/ga4-landing-pages
- [x] Write vitest test for GA4 connection (ga4.test.ts)
- [x] Fix number parsing in GA4LandingPageMetrics component (parseFloat/parseInt)
- [x] Test GA4 sync with real data in browser - Successfully synced 127 landing pages
- [ ] Add GA4 metrics to Optimization Agent analysis (future enhancement)

## GA4 Filtering & Funnel Visualization (2025-12-07)

- [x] Update GA4 fetchLandingPageMetrics() to filter pages with "wisdom" OR "31dwc26.obv.io" in hostname
- [x] Update GA4 sync to only fetch data from today forward (last 7 days for display)
- [x] Update GA4LandingPageMetrics card description to reflect both domains
- [x] Design funnel visualization component for Overview page
- [x] Create getFunnelConversionMetrics() query in Supabase
- [x] Build FunnelVisualization component showing Ad Clicks → Step1 (LP/Lead) → Step2 (Purchase) → Step3 (OTO)
- [x] Add conversion rates between each funnel step with color coding (green/yellow/red)
- [x] Integrate funnel component into Overview page (before charts section)
- [x] Test funnel visualization with real campaign data - Working correctly
- [x] Test GA4 filtering with new domain filter (wisdom + 31dwc26.obv.io) - Sync successful
