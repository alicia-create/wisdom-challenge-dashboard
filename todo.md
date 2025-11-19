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
