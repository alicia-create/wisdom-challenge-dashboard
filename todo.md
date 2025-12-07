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
