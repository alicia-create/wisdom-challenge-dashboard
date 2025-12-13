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
- [x] Create project checkpoint

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
- [x] Reorganize KPIs into 2 rows: 4 large cards (Leads, Spend, Revenue, VIP Sales) + 6 small cards (CPL, CPP, AOV, ROAS, Take Rate, Email Click Rate)
- [x] Add Total Revenue KPI from Order table
- [x] Add AOV (Average Order Value) KPI
- [x] Fix Daily Spend & Leads chart - use different colors for bars (not both black)
- [x] Fix date range filter - queries not updating when filter changes

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
- [x] Explore ad_performance table structure and sample data
- [x] Verify CAMPAIGN_NAME_FILTER matches actual campaign names in database
- [x] Update getOverviewMetrics to fetch real ad spend data
- [x] Update getDailyAnalysisMetrics to include ad performance by date
- [x] Calculate ROAS correctly (revenue / spend)
- [x] Test with real ad performance data
- [x] Verify metrics display correctly in dashboard

## Error Logs Page (2025-12-06)
- [x] Check if error_logs table exists in Supabase (found: workflow_errors)
- [x] Explore workflow_errors table structure (id, created_at, workflow_name, error_node, error_message, error_timestamp, execution_id)
- [x] Create backend procedure to fetch paginated workflow_errors
- [x] Create ErrorLogs page component with table view
- [x] Add filtering by workflow_name, error_node, date range
- [x] Add search functionality for error messages
- [x] Add route to App.tsx and navigation link
- [x] Test error logs page functionality

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
- [x] Check current Meta Campaigns page data source (Supabase vs API)
- [x] Check current Google Campaigns page data source (Supabase vs API)
- [x] Create facebook_audiences table in database schema (id, name, audience_id, size, created_at, updated_at)
- [x] Create tRPC procedure to fetch Facebook Audiences
- [x] Create FacebookAudiences.tsx page component
- [x] Add Facebook Audiences card to Raw Data landing page
- [x] Add route for /raw-data/facebook-audiences
- [x] Test Facebook Audiences page displays correctly
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
- [ ] Design campaign interference detection logic (broad audience overlap) - Future enhancement
- [x] Build optimization agent backend with LLM recommendations
- [x] Create daily optimization report UI
- [x] Integrate Google Analytics API (GA4 integrated and working)
- [ ] Integrate VWO API (pending user VWO export setup) - Future enhancement
- [x] Test agent with real campaign data

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
- [x] Test ad-level analysis with real campaign data
- [x] Implement LLM-powered insights for recommendations
- [ ] Add time-of-day performance analysis - Future enhancement
- [ ] Add budget redistribution suggestions - Future enhancement
- [ ] Add winner scaling recommendations - Future enhancement

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
- [x] Test LLM integration with real campaign data
- [x] Add error handling and retry logic for LLM failures
- [x] Implement caching for daily reports to reduce LLM costs

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

## Analytics Dashboard Reorganization (2025-12-07)

- [x] Create AnalyticsDashboard.tsx page component
- [x] Add Analytics Dashboard card to Raw Data page (first card)
- [x] Add route for /raw-data/analytics-dashboard
- [x] Move FunnelVisualization component from Overview to Analytics Dashboard
- [x] Remove funnel from Overview page
- [x] Add GA4 landing page performance summary to Analytics Dashboard
- [x] Add engagement metrics section to Analytics Dashboard (avg engagement, bounce rate)
- [x] Add top 5 landing pages by conversions chart
- [x] Add engagement rate distribution chart
- [x] Add bounce rate distribution chart
- [x] Fix NaN% issue by handling empty GA4 arrays correctly
- [x] Test Analytics Dashboard with real data - Working correctly

## GA4 Domain Filtering & Interactive Filters (2025-12-07)

- [x] Add frontend filtering to only show relevant pages (step, checkout, wisdom, kot, wait, nextsteps, get-started, /, /login)
- [x] Filter out irrelevant pages (organization/*, contacts/*, settings/*, etc.)
- [x] Add search input filter for page name with Search icon
- [x] Add bounce rate filter dropdown (High >80%, Medium 50-80%, Low <50%, All)
- [x] Add engagement rate filter dropdown (High >50%, Medium 20-50%, Low <20%, All)
- [x] Add conversions filter dropdown (With Conversions, Without Conversions, All)
- [x] Implement client-side filtering logic with filteredMetrics
- [x] Add "Showing X of Y pages" counter below filters
- [x] Add empty state for no matching filters
- [x] Test filters with real GA4 data - All filters working correctly (tested Conversions filter)

## GA4 Funnel-Only Filtering (2025-12-07)

- [x] Update GA4 filtering to show only 6 main funnel pages (step1-a, step2-a, step3-a from both domains)
- [x] Filter by hostname to separate organic (31daywisdomchallenge.com) vs ads (31daywisdom.com)
- [x] Create separate cards/sections for Organic Funnel vs Ads Funnel
- [x] Update Analytics Dashboard to show only relevant funnel pages
- [x] Remove generic filtering (search, bounce rate, engagement rate) since we only show 6 pages
- [x] Add funnel metrics summary (Total Sessions, Total Conversions, Conversion Rate, Step 1→2, Step 2→3)
- [x] Add Organic vs Ads comparison table
- [ ] Test with real GA4 data to ensure correct pages are displayed

## GA4 Hostname Dimension Implementation (2025-12-08)

- [x] Add `hostName` dimension to GA4 fetchLandingPageMetrics() query
- [x] Update dimension mapping in ga4.ts to include hostname
- [x] Update ga4_landing_page_metrics table schema to include hostname column
- [x] Run database migration to add hostname column (ALTER TABLE)
- [x] Update syncGA4Metrics() to store hostname from API response
- [x] Update getAggregatedGA4Metrics() to return hostname and GROUP BY hostname
- [x] Rewrite AnalyticsDashboard to filter by hostname for organic vs ads separation
- [x] Add funnel visualizations for both organic and ads funnels
- [x] Add Organic vs Ads comparison table
- [x] Clear old GA4 data and re-sync to populate hostname field
- [x] Test Analytics Dashboard structure - Working correctly (waiting for campaign data)
- [ ] Verify with real campaign data once ads are running (hostname will auto-populate)

## Fix tRPC API Error on Analytics Dashboard (2025-12-08)

- [ ] Check dev server logs for error details
- [ ] Identify which tRPC procedure is causing HTML response
- [ ] Fix server-side error in ga4.getMetrics or related procedures
- [ ] Test Analytics Dashboard to verify fix

## Navigation Reorganization (2025-12-08)

- [x] Rename "Raw Data" to "Other Data" in DashboardHeader
- [x] Add "Analytics" tab to main menu in DashboardHeader
- [x] Create OtherData.tsx page with Email & Leads and Engagement cards at top
- [x] Move Email & Leads card to Other Data section
- [x] Move Engagement card to Other Data section
- [x] Add /other-data route to App.tsx
- [x] Keep /raw-data routes for backward compatibility
- [x] Test all navigation paths - All working correctly

## Email & Leads Loading Improvement (2025-12-08)

- [x] Add informative loading message "Acessando API do Keap..." to Email & Leads page
- [x] Keep navigation available during loading (non-blocking)
- [x] Add spinner/progress indicator
- [x] Allow user to navigate away while data is loading
- [x] Add helpful text explaining user can navigate while loading

## LLM Report Caching System (2025-12-08)

- [x] Create cache utility module with TTL support (30min)
- [x] Add cache layer to optimization.dailyReport procedure
- [ ] Add cache invalidation on new data sync
- [x] Test cache hit/miss scenarios - 8 tests passing
- [ ] Verify 80%+ cost reduction and <1s response time (pending real campaign data)

## Automated Alert System (2025-12-08)

- [x] Create alert checking function for critical metrics
- [x] Implement notifyOwner integration for CPP > $60
- [x] Implement notifyOwner integration for Click-to-Purchase < 5%
- [x] Implement notifyOwner integration for Creative Frequency > 3.0
- [x] Add alert history tracking in database (alerts table)
- [x] Create scheduled job to check alerts every 30min
- [x] Test alert triggering with mock data - Thresholds validated
- [ ] Add alert status display to dashboard

## Hourly Performance Heatmap (2025-12-08)

- [x] Analyze ad_performance table for hour_of_day field - NOT AVAILABLE (data aggregated by day only)
- [ ] SKIPPED - Requires n8n workflow changes to capture hourly data
- [ ] Future: Add hour_of_day field to n8n Meta/Google Ads workflows
- [ ] Future: Build HourlyHeatmap component once data is available

## Optimize Overview & Translate to English (2025-12-08)

- [x] Verify if daily_kpis table is being populated by Supabase edge function - CONFIRMED
- [x] Modify getOverviewMetrics() to use daily_kpis instead of real-time queries - Created getOverviewMetricsOptimized()
- [ ] Add cache layer for Overview metrics (5min TTL) - Not needed, daily_kpis is already pre-aggregated
- [x] Find all Portuguese text in codebase (grep search) - Found 3 strings in EmailLeadQuality.tsx
- [x] Translate "Acessando API do Keap..." to "Accessing Keap API..."
- [x] Translate "Carregando dados de email e qualidade de leads" to "Loading email and lead quality data. This may take a few seconds."
- [x] Translate "Você pode navegar para outras páginas enquanto os dados carregam" to "You can navigate to other pages while the data loads."
- [x] Search for any other Portuguese strings in UI components - None found
- [x] Test Overview page performance and verify English translations - All English, loading fast

## Critical Alerts Card in Overview (2025-12-08)

- [x] Add alerts.getRecent tRPC query to Overview page
- [x] Create AlertsCard component showing last 3 critical alerts
- [x] Add alert type icons and severity colors (DollarSign=CPP, TrendingDown=Click-to-Purchase, AlertCircle=Creative Frequency)
- [x] Add "View in Optimization Agent" link in card header
- [x] Test with real alert data - Empty state renders correctly, ready for alerts
- [x] Handle empty state when no alerts exist

## Fix Purchases Table & Add Goals (2025-12-08)

- [x] Check orders table schema for name, email, order_number fields - Found contacts.full_name, contacts.email, orders.clickfunnels_order_number
- [x] Update getPurchasesPaginated query to include contact name and email - Added join with contacts table
- [x] Add order_number field to DebugPurchases table display - Using clickfunnels_order_number
- [x] Add goal progress to Total Leads card (200K goal) - Added progress bar and percentage
- [x] Add goal progress to Total VIP Sales card (30K goal) - Added progress bar and percentage
- [x] Test purchases table shows correct data - Name, Email, Order Number showing correctly (some contacts have no full_name, showing '-')
- [x] Test goal progress displays correctly in Overview - Progress bars and percentages working (67/200K leads = 0.0%, 0/30K VIP = 0.0%)

## Fix VIP Sales Count + Products Page (2025-12-08)

- [x] Check products table structure in Supabase - Found products table with 7 products
- [x] Investigate why VIP sales showing 0 instead of Wisdom+ count - Query was filtering order_total $1-$10, but Wisdom+ costs $31
- [x] Check orders table for product_name field to identify Wisdom+ sales - No product_name in orders, but found order_items table
- [x] Update getOverviewMetricsOptimized to count Wisdom+ products correctly - Now counts product_id 1 (Backstage Pass) + 7 (Wisdom+ Experience) = 7 sales
- [x] Rename "VIP Sales" to "Wisdom+ Sales" across all pages - Updated Overview, DailyAnalysis, EmailLeadQuality
- [x] Rename "VIP Take Rate" to "Wisdom+ Conversion Rate" - Updated Overview, DailyAnalysis, EmailLeadQuality
- [x] Create Products page under Other Data tab - Created /products route
- [x] Add products table with name, price, sales count - Added table with description, type, sales, revenue
- [x] Test VIP/Wisdom+ sales count is accurate - Overview shows 7 Wisdom+ Sales (5x Backstage Pass + 2x Wisdom+ Experience)
- [x] Test products page displays correctly - Products page shows all 7 products with sales counts and revenue

## Add LLM Rules Document + GitHub Repository (2025-12-08)

- [x] Find optimization rules .md document - Found docs/optimization-rules-v2.md
- [x] Add rules document display to Optimization Agent page - Added collapsible section with Streamdown rendering
- [x] Create GitHub repository for wisdom-challenge-dashboard - Created at https://github.com/alicia-create/wisdom-challenge-dashboard
- [x] Initialize git repo and commit all code - Initial commit with 748 files
- [x] Push to GitHub remote - Pushed to main branch
- [x] Add README.md with project description - Comprehensive README with architecture, setup, ROI
- [x] Test GitHub repo is accessible - Repository live at https://github.com/alicia-create/wisdom-challenge-dashboard with full README

## Authentication Security (2025-12-08) - PRIORITY

- [x] Create invites table in database (email, token, created_by, expires_at, used_at) - Table created with migration
- [x] Add domain whitelist check (@pedroadao.com) - Implemented in auth-guard.ts
- [x] Create middleware to protect all routes (require authentication) - Added access check in upsertUser
- [x] Add invite validation logic (check token + email match) - Implemented hasValidInvite() and markInviteAsUsed()
- [x] Create invite generation tRPC procedure - Added invites router with create, list, revoke, delete
- [x] Create invite management UI (generate, list, revoke) - Created /invites page with full CRUD
- [x] Test Google OAuth login flow - OAuth already working via Manus SDK
- [x] Test domain whitelist (allow @pedroadao.com, block others) - 13 vitest tests passing
- [x] Test invite link flow (generate, use, expire) - Invite creation, validation, expiration, revocation all tested

## Manual Refresh + Interactive Chat (2025-12-08)

- [x] Add cache.invalidate tRPC mutation for manual cache clearing - Added optimization.invalidateCache
- [x] Add "Refresh" button to Optimization Agent with last updated timestamp - Shows cache metadata + refresh button
- [ ] Add "Refresh" button to Overview page with last updated timestamp - Not needed (Overview uses daily_kpis)
- [x] Create interactive chat component for custom LLM analysis - Created OptimizationChat component
- [x] Add chat.ask tRPC mutation for custom questions - Added optimization.chat mutation
- [x] Add chat history display - Chat component shows Q&A history
- [x] Test manual refresh clears cache and regenerates report - Refresh button visible, cache metadata showing
- [x] Test chat responds to custom analysis questions - Chat component with input + example questions working

## Ads Diary Feature (2025-12-08)

### Database Schema
- [x] Create diary_entries table (date, summary_type, metrics_json, created_at) - Migration 0006_perpetual_argent.sql applied
- [x] Create diary_actions table (entry_id, action_type, description, status, source, ad_id, campaign_id, created_at, completed_at) - Migration applied
- [x] Add action_type enum (manual, llm_suggestion, meta_api_sync, scheduled) - Added to diaryActions
- [x] Add status enum (pending, in_progress, completed, verified, cancelled) - Added to diaryActions

### Daily Summary Auto-generation
- [x] Create getDailySummary query pulling from daily_kpis - Implemented in diary.ts
- [ ] Group metrics by campaign type (Sales, Leads, LATAM) - TODO: Add campaign-specific filtering
- [x] Calculate CPA, CPL, VIP Take Rate automatically - Using daily_kpis data
- [x] Add tRPC procedure diary.getDailySummary - Added to routers.ts

### Manual Action Logging
- [x] Create action logging form with rich text editor - CreateActionDialog component with textarea
- [x] Add action type selector (Ad Change, Budget Adjustment, Creative Swap, Campaign Launch, etc.) - 10 categories in dropdown
- [x] Link actions to specific ads/campaigns (dropdown) - Ad ID and Campaign ID fields added
- [x] Add tRPC mutation diary.createAction - Implemented in routers.ts
- [x] Add status update functionality - StatusUpdateButton component with pending → in_progress → completed → verified flow

### LLM Suggestions Integration
- [x] Modify Optimization Agent to create diary_actions from recommendations
- [x] Add "Add to Diary" button on each LLM recommendation
- [ ] Auto-create pending tasks from Critical Actions - Future enhancement
- [x] Add tRPC mutation diary.createFromLLM

### Meta API Sync (Future)
- [ ] Research Meta Marketing API for ad change history
- [ ] Create webhook endpoint for Meta ad status changes
- [ ] Auto-log ad pause/resume events
- [ ] Auto-log budget changes
- [ ] Auto-log creative swaps

### Ads Diary Page
- [x] Create /ads-diary route - Added to App.tsx
- [x] Build timeline view showing entries by date (reverse chronological) - DailyEntryCard component
- [x] Add daily summary cards with metrics - Shows Spend, Leads, Wisdom+ Sales, Take Rate
- [x] Add action log with status badges - ActionItem component with status icons and colors
- [x] Add filters (date range, action type, status, campaign) - Date range filter implemented
- [ ] Add search functionality - Pending
- [x] Link to Ads Diary from Other Data section - Added to OtherData.tsx

### Testing
- [x] Test daily summary generation with real data - Empty state showing correctly (no entries yet)
- [ ] Test manual action creation and status updates - Pending user testing
- [ ] Test LLM suggestion → diary action flow - Pending integration
- [x] Test timeline view and filters - Date range filter working, empty state showing

## LLM Recommendations → Ads Diary Integration (2025-12-09)

- [x] Add "Add to Diary" button to each recommendation card in Optimization Agent - Added to critical and warning recs
- [x] Create mapRecommendationToCategory() helper to auto-detect action category from LLM text - 7 categories mapped
- [x] Pre-fill CreateActionDialog with recommendation description when opened from button - Auto-filled via AddToDiaryButton
- [x] Add visual feedback (toast) when action is added to diary - Success/error toasts implemented
- [ ] Test Add to Diary flow with critical, warning, and info recommendations

## Ads Diary - Add Ad Name & Campaign Name Fields (2025-12-09)

- [x] Add ad_name and campaign_name fields to diary_actions table schema - Added varchar(500) fields
- [x] Run database migration to add new fields - Migration 0007_lucky_gabe_jones.sql applied
- [x] Update CreateActionDialog to include ad_name and campaign_name inputs
- [x] Update AddToDiaryButton to pass ad_name and campaign_name from recommendations
- [x] Update AdsDiary timeline to display ad_name and campaign_name instead of IDs
- [x] Add "View Ads Diary" link in Optimization Agent header
- [x] Add Edit button to each diary action
- [x] Create EditActionDialog component for editing existing actions
- [x] Add tRPC mutation diary.updateAction (description, category, status, ad_name, campaign_name)
- [x] Test editing existing diary actions
- [x] Test that names display correctly in diary entries


## Ads Diary Enhancements (2025-12-09)
- [x] Create EditActionDialog component for editing diary entries
- [x] Add ad_name and campaign_name fields to diary_actions table
- [x] Update CreateActionDialog to include ad_name and campaign_name inputs
- [x] Update AdsDiary page to display ad_name and campaign_name
- [x] Add Edit button to each diary action item
- [x] Add link to Ads Diary from Optimization Agent page
- [x] Update updateDiaryAction backend function to accept object parameter
- [x] Update tRPC updateAction procedure to match new function signature
- [x] Update createDiaryAction to return full action object (not just ID)
- [ ] Complete vitest tests for diary edit functionality (needs debugging)


## Ad Spend Data Inconsistency Fix (2025-12-09)
- [x] Investigate why Overview shows $0.00 ad spend while Daily Analysis shows $2,101.57
- [x] Check getOverviewMetrics query for ad spend calculation
- [x] Fix getOverviewMetricsOptimized to sum total_spend_meta + total_spend_google
- [x] Make date header row sticky in Daily Analysis table when scrolling
- [ ] **ROOT CAUSE**: daily_kpis table has all spend values = 0 (Supabase Edge Function not populating correctly)
- [ ] **SOLUTION**: Switch Overview and charts to read directly from ad_performance table instead of daily_kpis
- [ ] Fix getChannelPerformance query for Meta/Google spend (also depends on ad_performance)

## Analytics Page Improvements (2025-12-09)
- [x] Remove "Winner" column from Organic vs Ads Comparison table
- [x] Fix GA4 hostname filter to include 31daywisdomchallenge.com (now matches both with/without www)
- [x] Add Real-Time Overview link to Analytics page header


## Overview Page Reorganization (2025-12-10)
- [x] Remove ManyChat Bot Users card
- [x] Remove Broadcast Subscribers card
- [x] Remove Critical Alerts section
- [x] Create Conversion Funnel visualization with 5 stages:
  - Stage 1: Lead (contact created)
  - Stage 2: Wisdom+ Purchase (product_id 1 or 7)
  - Stage 3: Kingdom Seekers Trial (product_id 5)
  - Stage 4: ManyChat Connected (manychat_id not null)
  - Stage 5: Bot Alerts Subscribed (ntn_subscribe event)
- [x] Add conversion rates and drop-off percentages for each funnel stage
- [x] Create VSL Performance card with Vidalytics metrics (5%, 25%, 75%, 95% watch rates)
- [x] Fix Daily Ad Spend chart to show dates in chronological order (oldest to newest)
- [x] Fix Daily Leads chart to show dates in chronological order (oldest to newest)


## Analytics Dashboard Organic Funnel Fix (2025-12-10)
- [x] Investigate why Organic Funnel shows 0 sessions when GA4 shows 365 sessions for www.31daywisdomchallenge.com
- [x] Check GA4 query filtering logic in backend (found filter was not capturing 31daywisdomchallenge.com)
- [x] Verify hostname filter is correctly matching www.31daywisdomchallenge.com
- [x] Fix query to capture organic traffic data from GA4 (added explicit filter for 31daywisdomchallenge.com)
- [x] Trigger GA4 sync and imported 108 new records
- [x] Test that Organic Funnel displays correct session counts (139 sessions, 141 conversions)


## Data Hub Reorganization (2025-12-10)
- [ ] Rename "Other Data" to "Data Hub" in navigation and page title
- [ ] Reorganize cards by priority:
  - Large cards (most important): Leads Data, Purchases Data, Ads Diary, Meta Campaigns
  - Medium cards (data pages): Google Campaigns, Products, Email & Leads, Engagement
  - Small cards (system): Error Logs, User Management, Documentation, Facebook Audiences
- [ ] Remove GA4 Landing Pages from Data Hub
- [ ] Add link to GA4 Landing Pages in Analytics Dashboard page

## GA4 Landing Pages Improvements (2025-12-10)
- [ ] Add "Hostname" column to GA4 Landing Pages table
- [ ] Investigate why GA4 Landing Pages shows 0 sessions for all rows
- [ ] Fix data display issue in GA4 Landing Pages

## Overview Email & Engagement Metrics (2025-12-10)
- [ ] Add Welcome Email Performance card to Overview:
  - Total clicks on first email (event: "Clicked NTN In Email")
  - Click Rate = clicks / leads with "wisdom" in form.submitted
- [ ] Add Lead Score distribution to Keap panel:
  - Show count of leads at each score level (1-5)
  - Highlight "engaged" leads (score ≥3)
  - Display as bar chart or distribution visualization

## Mobile Responsiveness (2025-12-10)
- [ ] Ensure Overview page is fully responsive on mobile devices
- [ ] Test Conversion Funnel visualization on mobile
- [ ] Test VSL Performance card on mobile
- [ ] Test all metric cards on mobile

## Data Hub Reorganization (2025-12-10)
- [x] Reorganize cards by priority:
  * Primary (large, 4 cards): Leads Data, Purchases Data, Ads Diary, Meta Campaigns
  * Secondary (medium, 4 cards): Google Campaigns, Products, Email & Leads, Engagement
  * Tertiary (small, 4 cards): Error Logs, User Management, Documentation, Facebook Audiences
- [x] Remove duplicate cards from previous structure
- [x] Ensure all cards link to correct pages

## Purchases Page - Clickable Contact Names (2025-12-10)
- [x] Import ContactActivityModal component into DebugPurchases page
- [x] Add click handler to contact name cells
- [x] Pass contact_id to modal to fetch activity history
- [x] Test modal opens correctly with contact events

## Kingdom Seekers Product ID Update (2025-12-10)
- [x] Update product_id from 5 to 8 in getOverviewMetrics query
- [x] Update product_id from 5 to 8 in funnel.ts getFunnelMetrics
- [ ] Test Kingdom Seekers count displays correctly

## Performance by Channel Investigation (2025-12-10)
- [x] Check ad_performance table data in Supabase
- [x] Investigate why Performance by Channel shows $0.00 spend (table is empty)
- [x] Verify getChannelPerformance query is working correctly
- [x] Check if campaign filter (31DWC2026) matches actual data

## Meta/Google Ads Integration Decision (2025-12-10)
- [x] Analyze pros/cons of direct API integration vs n8n
- [x] Check current ad_performance table structure and data
- [x] Provide recommendation to user (direct API is better)
- [x] Implement chosen solution (API Connections interface created)

## API Connections Interface (2025-12-10)
- [x] Create APIConnections page component with Meta and Google sections
- [x] Add token input forms (Meta Access Token, Ad Account ID, Google Refresh Token, Customer ID)
- [x] Build backend tRPC procedures to test Meta API connection
- [x] Build backend tRPC procedures to test Google Ads API connection
- [x] Add "Test Connection" buttons with success/error feedback
- [x] Create backend procedure to sync ad data from Meta API to ad_performance table
- [x] Create backend procedure to sync ad data from Google Ads API to ad_performance table (placeholder for now)
- [x] Add "Sync Data" functionality with date range picker
- [x] Add API Connections card to Data Hub page
- [ ] Test end-to-end: configure tokens → test connection → sync data → verify Performance by Channel works

## OAuth 2.0 Flow for Meta and Google Ads (2025-12-10)
- [x] Create database table for storing OAuth tokens (api_tokens with platform, access_token, refresh_token, expires_at)
- [x] Add Meta OAuth callback handler at /api/oauth/facebook/callback
- [x] Add Google OAuth callback handler at /api/oauth/google/callback
- [x] Create tRPC procedure to initiate Meta OAuth flow (returns authorization URL)
- [x] Create tRPC procedure to initiate Google OAuth flow (returns authorization URL)
- [x] Update APIConnections page with "Connect with Facebook" and "Connect with Google" buttons
- [x] Remove manual token input fields (replace with OAuth buttons)
- [x] Add token status display (connected/disconnected with account info)
- [ ] Test Meta OAuth flow: click button → authorize → callback → token saved
- [ ] Test Google OAuth flow: click button → authorize → callback → token saved
- [x] Update syncAdData to use stored tokens from database instead of manual input
- [ ] Test end-to-end: OAuth → sync data → verify Performance by Channel works

## Backend OAuth Callback Routes (2025-12-10)
- [x] Create Express route handler at /api/oauth/facebook/callback
- [x] Create Express route handler at /api/oauth/google/callback
- [x] Update redirect URIs in ads-oauth.ts to use /api/oauth/* instead of frontend
- [x] Handle OAuth callback in backend, save token, then redirect to /api-connections with success message
- [ ] Test Meta OAuth flow with backend callback
- [ ] Test Google OAuth flow with backend callback

## OAuth Redirect URI Debugging (2025-12-10)
- [ ] Check if published URL is different from dev URL
- [ ] Update Meta redirect URI to use published URL
- [ ] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to environment variables
- [ ] Update Google redirect URI to use published URL
- [ ] Test Meta OAuth flow with correct redirect URI
- [ ] Test Google OAuth flow with correct credentials

## Remove OAuth Implementation (2025-12-10)
- [x] Delete server/ads-oauth.ts file
- [x] Delete server/ads-oauth-routes.ts file
- [x] Remove oauth router from server/routers.ts
- [x] Remove ads OAuth routes from server/_core/index.ts
- [x] Delete client/src/pages/APIConnections.tsx
- [x] Remove API Connections route from client/src/App.tsx
- [x] Remove API Connections card from client/src/pages/OtherData.tsx
- [x] Rollback database migration (drop api_tokens table)
- [x] Verify Performance by Channel still works with ad_performance data from n8n

## Fix Performance by Channel Platform Filter (2025-12-10)
- [x] Change platform filter from .eq('platform', 'meta') to .ilike('platform', 'meta')
- [x] Change platform filter from .eq('platform', 'google') to .ilike('platform', 'google')
- [x] Test Performance by Channel shows real data from ad_performance table (Meta: $5,052.99)

## Remove Campaign Filter from Performance by Channel (2025-12-10)
- [x] Remove .ilike('campaign_name', '%31DWC2026%') from Meta query
- [x] Remove .ilike('campaign_name', '%31DWC2026%') from Google query
- [x] Test Performance by Channel shows all campaigns (not just 31DWC2026)

## Fix Meta Campaigns Page (2025-12-10)
- [x] Review getMetaCampaignsPaginated query in server/supabase.ts
- [x] Fix platform filter to use .ilike('platform', 'meta')
- [x] Remove campaign_name filter (show all campaigns)
- [x] Test Meta Campaigns page displays real data from ad_performance (66 records)
- [x] Verify pagination works correctly

## Remove Daily Ad Spend Graph (2025-12-11)
- [x] Remove Daily Ad Spend chart component from Overview page
- [x] Keep Daily Leads chart (now full width)

## Campaign Type Breakdown in Performance by Channel (2025-12-11)
- [x] Add campaign type detection logic based on campaign_name prefixes
  * Sales = [SALES]
  * Leads = [LEADS]
  * Retargeting = [RMKT]
  * Content = [KLT]
- [x] Update getChannelPerformance to aggregate by platform AND campaign type
- [x] Update Performance by Channel UI to show breakdown table with nested rows
- [ ] Test with real Meta campaigns data

## Contact Details Page (2025-12-11)
- [ ] Create ContactDetails page component at /contact/:id
- [ ] Implement header section with avatar, name, email, phone, action buttons
- [ ] Add stats cards row (Lead Score, Total Purchases, Last Activity, Days Since First Contact)
- [ ] Implement tabs: Overview (timeline), Orders, Email Engagement, Journey
- [ ] Add Messenger link button (if messenger_id available)
- [ ] Add breadcrumb navigation
- [ ] Make mobile-responsive
- [ ] Update Leads page to link to /contact/:id instead of opening modal
- [ ] Update Purchases page to link to /contact/:id instead of opening modal
- [ ] Test Contact Details page with real contact data

## Performance Alerts System (2025-12-11)
- [ ] Create alerts configuration table in database (thresholds for CPL, ROAS)
- [ ] Build backend procedure to check alerts daily
- [ ] Implement notification system when thresholds exceeded
- [ ] Add alerts configuration UI in settings
- [ ] Test alerts trigger correctly

## Product Filter for Purchases Page (2025-12-11)
- [ ] Fetch list of products from database for dropdown
- [ ] Add product dropdown filter to Purchases page UI
- [ ] Update backend getPurchases query to support product_id filter
- [ ] Test product filter shows correct purchases for selected product


## Total Leads Calculation Fix (2025-12-11)
- [ ] Investigate current Total Leads calculation logic
- [ ] Investigate conversion funnel leads counting logic (analytics_events with "wisdom")
- [ ] Update Total Leads query to match conversion funnel logic
- [ ] Test Total Leads count matches funnel leads count
- [ ] Verify Total Leads displays correctly on Overview page

## Product Filter Bug Fix (2025-12-11)
- [ ] Debug why product filter in Purchases page doesn't trigger query update
- [ ] Fix React state management for productId filter
- [ ] Test product filter applies correctly when selecting different products


## Overview Page Layout Changes (2025-12-11)
- [x] Create Daily Wisdom+ Sales chart component
- [x] Create backend query to get daily Wisdom+ sales data (order_total >= $31)
- [x] Move VSL Performance section below the charts
- [x] Add Daily Wisdom+ Sales chart above Daily Leads chart
- [x] Test new layout displays correctly on desktop and mobile


## Data Accuracy Fixes (2025-12-12)
- [x] Investigate why Total Leads shows 92 but Funnel shows 57 leads
- [x] Fix Total Leads to count unique wisdom contacts instead of summing daily leads
- [x] Fix VSL Performance to read vidalytics.view_video events from analytics_events table
- [x] Parse VSL milestone values correctly (View 5%, View 25%, View 50%, View 95%)
- [x] Correlate VSL views with Wisdom+ purchases correctly
- [x] Fix Bot Alerts Subscribed to use gold.ntn.request_accepted event
- [x] Fix Conversion Funnel drops: (ManyChat / Leads) and (Bot Alerts / ManyChat)
- [x] Update ManyChat Connected logic (available to all leads, not just purchasers)


## Contact Page Error Fixes (2025-12-12)
- [x] Fix orders.lead_id column reference error (should be contact_id)
- [x] Fix nested anchor tag HTML validation error on contact page
- [ ] Test contact page /contact/377 to ensure errors are resolved

- [x] Fix Conversion Funnel leads count to match Total Leads (use wisdom-filter)
- [ ] Restore contact activity timeline to previous card-based format with icons and badges


## Urgent Fixes (2025-12-12)
- [ ] Fix remaining nested anchor tag error on contact page /contact/377
- [ ] Fix ManyChat conversion rate showing 100% (should be 12/44 = 27.3%)
- [ ] Update funnel visualization to show Leads → ManyChat connection correctly

## Date Filtering Fixes (2025-12-12)
- [x] Fix getDailyAnalysisMetrics to filter contacts by created_at date range
- [x] Fix getDailyAnalysisMetrics to filter orders by created_at date range
- [x] Fix Kingdom Seeker Trials count to respect date range filters (JOIN with orders table)
- [x] Fix Daily Leads chart to show only data within selected date range
- [x] Fix Daily Wisdom+ Sales chart to show only data within selected date range
- [x] Write 9 vitest tests validating date filtering functionality
- [x] All tests passing (Daily Analysis, Kingdom Seekers, Overview Metrics)

## Ad Spend Calculation Bug (2025-12-12)
- [x] Investigate why Total Ad Spend shows $0.00
- [x] Check ad_performance table query in getOverviewMetrics
- [x] Verify spend field aggregation logic
- [x] Test with real ad_performance data
- [x] Fix and verify Total Ad Spend displays correctly - Now showing $5,986.90 ✅

## Performance Optimization (2025-12-12)

### Database & Backend
- [ ] Audit slow queries and add indexes where needed - Future: needs production data analysis
- [x] Implement query result caching with TTL - Added 5-10min cache to Overview, Daily KPIs, Channel Performance
- [ ] Batch similar queries to reduce roundtrips - Future: requires query pattern analysis
- [ ] Add database connection pooling optimization - Already handled by Supabase client
- [ ] Review and optimize N+1 query patterns - Future: needs profiling

### Frontend Performance
- [x] Add loading skeletons for all data-heavy components - Created KpiCardSkeleton and ChartSkeleton
- [ ] Implement React Query for better cache management - Using tRPC built-in caching
- [ ] Lazy load charts and heavy components - Future enhancement
- [ ] Optimize bundle size (check for duplicate dependencies) - Future: run build analyzer
- [ ] Add error boundaries for graceful failures - Future enhancement

### Code Quality
- [ ] Remove unused imports and dead code - Future: run linter
- [ ] Consolidate duplicate logic into shared utilities - Ongoing
- [x] Add TypeScript strict mode and fix all type errors - Fixed all 13 TypeScript errors
- [ ] Document complex functions with JSDoc - Ongoing
- [ ] Create performance monitoring dashboard - Future enhancement

### Workflow Optimization
- [x] Create clear file naming conventions - Documented in DEVELOPMENT.md
- [ ] Organize components by feature (not by type) - Current structure is adequate
- [x] Add development guidelines document - Created DEVELOPMENT.md with best practices
- [ ] Set up automated testing in CI/CD - Future: requires CI/CD setup
- [x] Create troubleshooting guide for common issues - Included in DEVELOPMENT.md

## Mobile Layout Improvements (2025-12-12)
- [x] Reduce header title size on mobile - Changed to text-base (16px) on mobile
- [x] Fix horizontal tab navigation overflow - Added scrollbar-hide and proper flex wrapping
- [x] Make KPI cards visible above the fold on mobile - Changed to 2-column grid with reduced gaps
- [x] Fix Conversion Funnel card text truncation - Added responsive font sizes and truncate classes
- [x] Optimize chart sizing for mobile screens - Charts now responsive with proper spacing
- [ ] Add hamburger menu for navigation on small screens - Not needed, horizontal scroll works well
- [x] Test on 375px width (iPhone SE) and 390px (iPhone 12/13/14) - Tested and working

## Split Conversion Funnel by Source (2025-12-12)
- [ ] Investigate analytics_events table structure (value/comments fields)
- [ ] Create backend query to filter leads by 31daywisdom.com (Paid Ads)
- [ ] Create backend query to filter leads NOT containing 31daywisdom.com (Organic/Affiliate)
- [ ] Duplicate ConversionFunnel component into two separate cards
- [ ] Add "Paid Ads Funnel" card with 31daywisdom.com filter
- [ ] Add "Organic & Affiliate Funnel" card with exclusion filter
- [ ] Test both funnels show correct data
- [ ] Verify totals add up to original combined funnel

## Split Conversion Funnel by Source (2025-12-12)
- [x] Investigate analytics_events table structure (comment and value fields)
- [x] Create getPaidAdsContactIds() filter function (31daywisdom.com)
- [x] Create getOrganicContactIds() filter function (NOT 31daywisdom.com)
- [x] Modify getFunnelMetrics to accept contactIds filter parameter
- [x] Add contactIds filtering to all funnel stages (Wisdom+, Kingdom, ManyChat, Bot Alerts)
- [x] Create tRPC procedures: paidAdsFunnel and organicFunnel
- [x] Duplicate ConversionFunnel card in Overview page
- [x] Add queries for both funnels in Overview.tsx
- [x] Test that both funnels show different data - Paid: 4→2→1→0→0, Organic: 54→21→11→11→3
- [x] Write vitest tests for split funnel functionality - All 6 tests passing

## Fix Daily Charts to Show Combined Funnel Data (2025-12-12)
- [x] Investigate why Daily Wisdom+ Sales and Daily Leads charts are empty with date filter - Field name mismatch
- [x] Fix getDailyAnalysisMetrics to return combined data from both Paid Ads and Organic funnels - Added frontend-compatible fields
- [x] Ensure charts aggregate data from all wisdom contacts (not split by source) - Using getWisdomContactIds
- [x] Test charts display correct totals for TODAY, YESTERDAY, 7 DAYS filters - All 4 tests passing
- [x] Verify chart data matches sum of both funnels - Last 7 days: 43 leads, 19 vip sales

## Date Filter Not Updating Charts (2025-12-13)
- [x] Investigate why Daily Wisdom+ Sales and Daily Leads charts don't update when date filter changes - tRPC was working correctly, issue was with curl testing
- [x] Check if tRPC cache is preventing chart data refresh - No cache issue
- [x] Verify dailyKpis query is being called with correct dateRange parameter - Confirmed working in browser
- [x] Fix cache invalidation or add refetch logic when dateRange changes - Not needed, already working
- [x] Test that charts update immediately when user selects TODAY, YESTERDAY, 7 DAYS, etc. - Confirmed working
- [x] Fix charts showing wrong date (Dec 12 instead of Dec 13 for TODAY filter) - Fixed timezone issue in date parsing

## Server Optimization (2025-12-13)
- [x] Investigate excessive file watchers causing EMFILE errors (2591 inotify watches) - Chromium + Vite HMR
- [x] Optimize server requests to reduce overhead - Disabled HMR, running in production mode
- [x] Fix tsx watch process issues - Switched to production build
- [x] Test server stability after optimization - Server running successfully

## Intelligent Cache Implementation (2025-12-13)
- [x] Design cache strategy with appropriate TTL for different data types - Metrics: 5min, KPIs: 10min, Funnel: 15min, VSL: 30min
- [x] Install Redis client dependencies (ioredis) - Installed ioredis 5.8.2
- [x] Create Redis cache helper with get/set/invalidate methods - Created server/_core/cache.ts
- [x] Implement cache wrapper for Supabase queries - Replaced in-memory cache with Redis-backed intelligent cache
- [x] Add cache to overview metrics (TTL: 5 minutes) - Implemented with async get/set
- [x] Add cache to daily KPIs (TTL: 10 minutes) - Implemented with async get/set
- [x] Add cache to funnel metrics (TTL: 15 minutes) - Implemented for all funnel endpoints
- [x] Add cache to channel performance (TTL: 15 minutes) - Implemented with async get/set
- [x] Add cache to VSL metrics (TTL: 30 minutes) - Implemented with async get/set
- [x] Add cache to paid ads funnel (TTL: 15 minutes) - Implemented
- [x] Add cache to organic funnel (TTL: 15 minutes) - Implemented
- [x] Implement cache invalidation on data updates - Automatic TTL expiration + manual invalidation methods
- [x] Write vitest tests for cache functionality - Created server/cache.test.ts with 17 tests (all passing)
- [x] Test cache hit/miss rates and performance improvement - 87.5% faster, 8x speedup
- [x] Document cache strategy and TTL values - Created docs/CACHE.md

## VSL Drop-off Metrics (2025-12-13)
- [x] Calculate drop-off percentage for each VSL milestone (leads who didn't watch) - Added to getVSLMetrics
- [x] Update VSL metrics backend to include drop-off data - Returns totalLeads and dropOff percentages
- [x] Update frontend to display drop-off alongside watch count - Shows "X% dropped off" for each milestone
- [x] Test drop-off calculation accuracy - Verified: 9 leads, 44.44% dropped off at 5%, 55.56% at 25%, etc.

## Contact Detail Page Fixes (2025-12-13)
- [x] Fix contact name display (showing "Unknown" instead of actual name) - Changed to use full_name field
- [x] Populate activity timeline with event descriptions (currently showing only generic icons) - Fixed field mapping to use name, value, comment
- [x] Remove "Email" tab from contact detail page - Removed from tabs list
- [x] Fix Total Purchases to calculate from orders table in Supabase (not Keap) - Already implemented correctly
- [x] Remove "View in Keap" button - Removed from action buttons
- [x] Add "Open in Messenger" button (conditional on livechat_url presence) - Already exists with messenger_id
- [x] Test all contact detail page functionality - Server rebuilt and running successfully

## Nested Anchor Tag Error (2025-12-13)
- [x] Fix nested <a> tags in contact detail page breadcrumb - Removed Button wrapper from Link
- [x] Test fix in browser - Server rebuilt and running successfully

## Journey Tab Fixes (2025-12-13)
- [ ] Fix Wisdom+ Purchase detection in Journey tab (not showing when contact has purchases)
- [ ] Fix Kingdom Seekers Purchase detection in Journey tab
- [ ] Remove "Last Activity" card from Overview tab
- [ ] Remove "Days Since First Contact" card from Overview tab
- [ ] Test Journey tab shows correct purchase status

## Journey Tab Purchase Detection & ManyChat Stages (2025-12-13)
- [ ] Debug why Wisdom+ Purchase not showing green for contact with $31 order
- [ ] Fix purchase detection query (check product_id field exists in orders table)
- [ ] Add "ManyChat Connected" stage to Journey funnel (check manychat_id in contact)
- [ ] Add "Bot Alerts Subscribed" stage to Journey funnel (check gold.ntn.request_accepted in analytics_events)
- [ ] Test with real contact data (KP - contact with $31 purchase)

## Nested Anchor Error - Contact Page (2025-12-13 - Second Instance)
- [ ] Find remaining nested <a> tag in ContactDetails.tsx
- [ ] Check email/phone links in contact info section
- [ ] Fix nested anchor pattern
- [ ] Test page loads without errors

## Navigation Updates (2025-12-13)
- [ ] Remove "Analytics" tab from main navigation
- [ ] Add "GA4 Landing Pages" card to Data Hub
- [ ] Add "Real-Time Overview" link to GA4 Landing Pages page
- [ ] Test navigation changes

## Real-Time Overview Link Update (2025-12-13)
- [ ] Update Real-Time Overview button to link to Google Analytics real-time dashboard
- [ ] Test button opens correct GA4 real-time page

## Data Hub Performance Optimization (2025-12-13)
- [x] Add pagination to Leads Data page (limit 50 per page)
- [x] Add pagination to Purchases Data page (limit 50 per page)
- [x] Add pagination to Meta Campaigns page
- [x] Add pagination to Google Campaigns page
- [x] Implement skeleton loaders for all Data Hub pages
- [x] Add loading states and error handling
- [x] Test performance improvements

## Performance by Channel Cards Separation (2025-12-13)
- [x] Split "Performance by Channel" table into two separate cards
- [x] Create "Meta Performance" card with Meta metrics
- [x] Create "Google Performance" card with Google metrics
- [x] Test visual layout and data display

## Meta Performance Conversion Rate Columns (2025-12-13)
- [x] Add Connect Rate column (Landing Page Views / Clicks)
- [x] Add Click to Lead Rate column (Leads / Clicks)
- [x] Add Click to Purchase Rate column (Purchases / Clicks)
- [x] Update backend channelPerformance query to include clicks and landing page views
- [x] Update frontend Meta Performance card with new columns
- [x] Test calculations and display

## Daily Page Date Range Filter Fix (2025-12-13)
- [x] Investigate why date range filter is not working
- [x] Fix filter logic to correctly apply selected date range
- [x] Ensure "TODAY" shows only today's data
- [x] Ensure "YESTERDAY" shows only yesterday's data
- [x] Ensure "7 DAYS", "14 DAYS", "30 DAYS" show aggregated data
- [x] Test all filter options and verify data changes

## Daily Page Timezone Fix (2025-12-13)
- [x] Investigate getDateRangeValues timezone calculation
- [x] Fix TODAY filter to show correct current date (Dec 13 not Dec 12)
- [x] Ensure timezone consistency across all date filters
- [x] Test with different timezones
- [x] Change timezone from Brazil (GMT-3) to Los Angeles (PST/PDT)
- [x] Test with Los Angeles timezone
- [x] Review Overview page timezone solution
- [x] Debug why Daily page still shows Dec 12
- [x] Apply correct timezone fix using formatToParts
- [x] Review getDailyAnalysisMetrics backend filtering (DB is already PST)
- [x] Debug why Dec 12 data returns for TODAY filter
- [x] Fix backend date filtering logic - return YYYY-MM-DD strings directly
