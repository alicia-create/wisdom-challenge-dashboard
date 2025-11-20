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
