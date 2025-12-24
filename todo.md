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

## Journals Card Implementation (2025-12-16)
- [x] Create get_journals_metrics edge function in Supabase
- [x] Add journals metrics call to backend (server/routers.ts)
- [x] Create Journals card in Overview page showing: total journals, progress bar, breakdown
- [x] Reorganize secondary KPI cards: Conversion, Journals, CPP, CPL, AOV, Email Clicks
- [x] Optimize card spacing and copy to prevent vertical stretching
- [x] Test journals data displays correctly (518 total, 2.59% of 20k goal)

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

## Migration 032 - Move KPI Calculations to SQL (2025-12-23)
- [x] Identify KPI calculations in TypeScript (cplAds, cppAds, trueCpl, trueCpp, welcomeEmailClicks)
- [x] Move calculations to get_dashboard_metrics SQL function
- [x] Remove TypeScript calculation code from routers.ts
- [x] Test migration 032 in Supabase SQL Editor
- [x] Apply migration 032 to production database
- [x] Verify all KPI cards display correct values in dashboard
- [x] Confirm Email Clicks shows 1699 (not 0)
- [x] Confirm CPP/CPL Ads and True values display correctly
- [x] Remove debug logging after verification
- [x] Create checkpoint with migration 032 changes
