# View 2: Detailed Daily Analysis - Metrics Specification

## Layout Structure
- **Format**: Spreadsheet-style table
- **Rows**: Metrics (grouped by category)
- **Columns**: Dates (each day is a column, starting with "Total" column)
- **Date Range Filter**: At the top to select date range

## Metrics by Category (Based on 2024 CSV)

### 🔑 Summary Data (Main Funnel)
1. **Total Optins** - Total leads from all sources
2. **Total VIP Sales** - Number of VIP upgrades
3. **% VIP Take Rate** - (Total VIP Sales / Total Optins) * 100
4. **Total VIP Revenue** - Sum of order_total from VIP sales
5. **Total VIP Units** - Total units sold (if tracking multiple products)

### 💰 Costs & ROAS
6. **Total Ad Spend** - Sum of Meta + Google spend
7. **True Cost Per Lead** - Total Ad Spend / Total Optins
8. **True Cost Per Purchase** - Total Ad Spend / Total VIP Sales
9. **ROAS (Front-end)** - Total VIP Revenue / Total Ad Spend
10. **Front End Profit / Loss** - Total VIP Revenue - Total Ad Spend

### 📢 Facebook Paid Ads (Meta)
11. **Meta Ad Spend** - Spend from ad_performance where platform = 'Meta'
12. **Meta Reported Cost Per Lead** - Meta spend / reported_leads
13. **Meta Reported Cost Per Purchase** - Meta spend / reported_purchases
14. **Meta Ad Optins (by FB Tracking)** - reported_leads from Meta
15. **Meta Ad VIP Sales** - reported_purchases from Meta
16. **Meta Ads Revenue** - Revenue attributed to Meta (via UTM)
17. **Meta Clicks** - clicks from ad_performance
18. **Meta Page Views** - Sum of landing page views
19. **Meta Connect Rate** - (Page Views / Clicks) * 100
20. **Meta Click To Lead Rate** - (Optins / Clicks) * 100
21. **Meta Click To Purchase Rate** - (VIP Sales / Clicks) * 100
22. **Meta Landing Page View per Link Click** - landing_page_view_per_link_click metric

### 📢 Google Ads
23. **Google Ad Spend** - Spend from ad_performance where platform = 'Google'
24. **Google Reported Cost Per Lead** - Google spend / reported_leads
25. **Google Reported Cost Per Purchase** - Google spend / reported_purchases
26. **Google Ad Optins** - reported_leads from Google
27. **Google Ad VIP Sales** - reported_purchases from Google
28. **Google Ads Revenue** - Revenue attributed to Google (via UTM)
29. **Google Clicks** - clicks from ad_performance
30. **Google Click To Lead Rate** - (Optins / Clicks) * 100
31. **Google Click To Purchase Rate** - (VIP Sales / Clicks) * 100

### 💬 Comms Engagement
32. **% Welcome Email Click Rate** - (Leads with welcome_email_clicked = true / Total Leads) * 100

## Data Sources

### From Supabase Tables:
- **Lead table**: created_at, utm_source, utm_campaign, welcome_email_clicked
- **Order table**: created_at, order_total, utm_source, utm_campaign
- **ad_performance table**: date, platform, spend, clicks, impressions, link_clicks, reported_leads, reported_purchases, landing_page_view_per_link_click

### Calculations:
- **True metrics**: Based on actual Supabase data (leads and orders)
- **Reported metrics**: Based on ad platform tracking (ad_performance.reported_*)
- **Attribution**: Using UTM parameters to link orders back to campaigns

## Implementation Notes

1. **Date Grouping**: All metrics aggregated by date (GROUP BY date)
2. **Platform Separation**: Meta and Google metrics in separate row groups
3. **Total Column**: First column shows totals across entire date range
4. **Daily Columns**: Each subsequent column shows data for one day
5. **Empty Cells**: Show "-" or "0" for days with no data
6. **Currency Formatting**: Use $ for monetary values
7. **Percentage Formatting**: Use % with 2 decimal places
8. **Number Formatting**: Use comma separators for thousands

## Priority for Phase 1

**Must Have (Core Metrics):**
- Summary Data (rows 1-5)
- Costs & ROAS (rows 6-10)
- Meta Ad Spend, CPL, CPP (rows 11-13)
- Google Ad Spend, CPL, CPP (rows 23-25)

**Should Have (Enhanced Metrics):**
- Meta detailed metrics (rows 14-22)
- Google detailed metrics (rows 26-31)
- Email engagement (row 32)

**Could Have (Future):**
- Bot engagement rates
- Email open rates (requires Keap API integration)
- YouTube/Instagram followers (requires additional APIs)
