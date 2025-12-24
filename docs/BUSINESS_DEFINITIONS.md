# Business Definitions & Metrics Guide

**Last Updated:** December 23, 2025  
**Version:** 1.0 (Migration 032)

This document defines all business metrics, KPIs, and data classifications used across the 31-Day Wisdom Challenge Analytics Dashboard. These definitions are the **single source of truth** for all pages (Overview, Charts, Daily Analysis, etc.).

---

## Table of Contents

1. [Core Business Concepts](#core-business-concepts)
2. [Traffic Sources & Funnels](#traffic-sources--funnels)
3. [Product Definitions](#product-definitions)
4. [KPI Definitions & Formulas](#kpi-definitions--formulas)
5. [Funnel Stages](#funnel-stages)
6. [Campaign Classifications](#campaign-classifications)
7. [Data Sources](#data-sources)

---

## Core Business Concepts

### Lead Classification

**Wisdom Lead**: A contact who has engaged with the 31-Day Wisdom Challenge funnel. Identified by:
- Having analytics events with funnel names containing "wisdom"
- Created within the date range being analyzed

**Paid Lead**: Lead acquired through paid advertising (Meta Ads or Google Ads)
- Funnel name contains `31daywisdom.com` (NOT `challenge`)
- Tracked via `wisdom_lead_classification.is_paid = true`

**Organic Lead**: Lead acquired through organic/affiliate channels
- Funnel name contains `31daywisdomchallenge.com`
- Tracked via `wisdom_lead_classification.is_organic = true`

### Order Classification

**Wisdom+ Sale**: An order containing product_id = 1 (Wisdom+ Journal)
- Counted by: `COUNT(DISTINCT orders.id) WHERE EXISTS (SELECT 1 FROM order_items WHERE order_id = orders.id AND product_id = 1)`
- Billing status must be `paid` or `partially-refunded`

**Kingdom Seeker Trial**: An order containing product_id = 8
- Same counting logic as Wisdom+ Sales
- Currently a separate funnel step (deactivated in paid funnel)

**Extra Journals**: Additional journals purchased (product_id = 4)
- Counted by: `SUM(order_items.quantity) WHERE product_id = 4`
- Shown as "+X Extra Journals" in funnel visualizations

**Extra Shipping**: Orders with funnel name containing "shipping"
- Separate revenue stream for additional shipping charges

---

## Traffic Sources & Funnels

### Paid Ads Funnel
**Domain:** `31daywisdom.com` (excluding URLs with "challenge")

**Traffic Sources:**
- Meta Ads (Facebook/Instagram)
- Google Ads (Search/Display)

**Characteristics:**
- Higher volume, lower conversion rate (~9.7%)
- Tracked via ad_performance table
- UTM parameters: `utm_source=meta` or `utm_source=google`

### Organic & Affiliate Funnel
**Domain:** `31daywisdomchallenge.com`

**Traffic Sources:**
- Organic social media
- Affiliate partners
- Direct traffic
- Email referrals

**Characteristics:**
- Lower volume, higher conversion rate (~16.7%)
- No ad spend associated
- Better engagement (53% ManyChat connection rate vs 4% paid)

---

## Product Definitions

### Product ID Mapping

| Product ID | Name | Description | Counting Method |
|------------|------|-------------|-----------------|
| 1 | Wisdom+ Journal | Primary product - 31-day guided journal | COUNT DISTINCT orders with this product |
| 4 | Extra Journals | Additional journal units | SUM quantity from order_items |
| 8 | Kingdom Seekers | High-ticket trial program | COUNT DISTINCT orders with this product |

### Revenue Attribution

**Total Revenue**: Sum of ALL order_total from orders table
- Includes: Wisdom+ sales, Kingdom Seekers, Extra Journals, Extra Shipping
- Excludes: Refunded orders (billing_status = 'refunded')
- Includes: Partially refunded orders (billing_status = 'partially-refunded')

**AOV (Average Order Value)**: Total Revenue / Non-Zero Wisdom+ Sales
- Excludes $0 orders from calculation
- Formula: `SUM(order_total WHERE order_total > 0) / COUNT(DISTINCT orders WHERE order_total > 0 AND has product_id=1)`

---

## KPI Definitions & Formulas

### Lead Metrics

**Total Leads**
```sql
COUNT(*) FROM wisdom_lead_classification
WHERE created_at >= start_date AND created_at < end_date
```

**Paid Leads**
```sql
COUNT(*) FROM wisdom_lead_classification
WHERE is_paid = true
```

**Organic Leads**
```sql
COUNT(*) FROM wisdom_lead_classification
WHERE is_organic = true AND is_paid = false
```

### Cost Metrics

**Total Ad Spend**
```sql
SUM(spend) FROM ad_performance
WHERE date >= start_date AND date <= end_date
AND campaign_name ILIKE '%31DWC2026%'
```

**Meta Spend** (by campaign type)
- **Sales Campaign**: `campaign_name ILIKE '%sales%'`
- **Leads Campaign**: `campaign_name ILIKE '%lead%' AND NOT ILIKE '%sales%'`
- **Retargeting**: `campaign_name ILIKE '%retarget%'`
- **Content**: `campaign_name ILIKE '%content%'`

### Cost Per Metrics

**CPL (Ads)** - Cost Per Lead from Paid Ads Only
```sql
(Meta Leads Spend + Meta Sales Spend) / Paid Leads
```
- Only includes spend from Lead + Sales campaigns
- Only counts paid leads (31daywisdom.com traffic)
- Current value: ~$6.32

**True CPL** - Cost Per Lead from All Spend
```sql
Total Ad Spend / Total Leads
```
- Includes ALL campaign spend (Sales, Leads, Retargeting, Content, Other)
- Includes ALL leads (paid + organic)
- Current value: ~$6.29
- **Why it's lower:** Organic leads dilute the cost (no spend, but counted in denominator)

**CPP (Ads)** - Cost Per Purchase from Paid Ads Only
```sql
(Meta Leads Spend + Meta Sales Spend) / Paid Wisdom+ Sales
```
- Only includes spend from Lead + Sales campaigns
- Only counts Wisdom+ sales from paid traffic
- Current value: ~$65.15

**True CPP** - Cost Per Purchase from All Spend
```sql
Total Ad Spend / Total Wisdom+ Sales
```
- Includes ALL campaign spend
- Includes ALL Wisdom+ sales (paid + organic)
- Current value: ~$56.18
- **Why it's lower:** Organic sales dilute the cost (no spend, but counted in denominator)

### Conversion Metrics

**Conversion Rate** (Lead → Wisdom+ Sale)
```sql
(Total Wisdom+ Sales / Total Leads) * 100
```
- Current value: ~11.20%

**Paid Conversion Rate**
```sql
(Paid Wisdom+ Sales / Paid Leads) * 100
```
- Current value: ~9.7%

**Organic Conversion Rate**
```sql
(Organic Wisdom+ Sales / Organic Leads) * 100
```
- Current value: ~16.7%

### Engagement Metrics

**ManyChat Connected**
```sql
COUNT(DISTINCT contact_id) FROM wisdom_lead_classification
WHERE has_manychat = true
```

**Bot Alerts Subscribed**
```sql
COUNT(DISTINCT contact_id) FROM analytics_events
WHERE name = 'manychat.add_tag' 
AND value = 'gold.ntn.request_accepted'
```

**Welcome Email Clicks**
```sql
COUNT(DISTINCT contact_id) FROM analytics_events
WHERE name = 'keap.add_tag' 
AND value ILIKE '%Clicked NTN In Email%'
```
- Current value: 1,699 clicks (5.3% of leads)
- Tracks engagement with welcome email sequence

### Journal Metrics

**Wisdom Journals** (included with Wisdom+ purchase)
```sql
COUNT(DISTINCT orders.id) 
WHERE EXISTS (SELECT 1 FROM order_items WHERE order_id = orders.id AND product_id = 1)
```
- Each Wisdom+ sale includes 1 journal
- Current: 3,594 journals

**Extra Journals** (additional purchases)
```sql
SUM(order_items.quantity) 
WHERE product_id = 4
```
- Current: 476 extra journals

**Total Journals**
```sql
Wisdom Journals + Extra Journals
```
- Current: 4,070 journals (20.35% of 20k goal)

---

## Funnel Stages

### Paid Ads Funnel (5 stages)

1. **Leads** (25,298)
   - Entry point: Contact created via paid traffic

2. **Wisdom+ Purchases** (2,456 | 9.7% conversion)
   - First purchase: Wisdom+ Journal (product_id = 1)
   - Includes: +210 Extra Journals (8.6% bump)

3. **Kingdom Seekers Trial** (0 | 0% conversion)
   - High-ticket trial (product_id = 8)
   - **Currently deactivated** in paid funnel

4. **ManyChat Connected** (1,002 | 4.0% of Wisdom+ buyers)
   - Bot subscription via ManyChat
   - Tracked via `has_manychat = true`

5. **Bot Alerts Subscribed** (788 | 78.6% of ManyChat users)
   - Opted into daily notifications
   - Tracked via `gold.ntn.request_accepted` tag

### Organic & Affiliate Funnel (5 stages)

1. **Leads** (6,796)
   - Entry point: Contact created via organic traffic

2. **Wisdom+ Purchases** (1,135 | 16.7% conversion)
   - Includes: +262 Extra Journals (23.1% bump)
   - **Higher conversion** than paid (16.7% vs 9.7%)

3. **Kingdom Seekers Trial** (602 | 53.0% of Wisdom+ buyers)
   - **Active** in organic funnel
   - Much higher engagement than paid

4. **ManyChat Connected** (1,000 | 14.7% of Kingdom Seekers)
   - Similar to paid funnel stage

5. **Bot Alerts Subscribed** (822 | 82.2% of ManyChat users)
   - Slightly higher engagement than paid (82.2% vs 78.6%)

---

## Campaign Classifications

### Meta Ads Campaign Types

**Sales Campaigns** (`campaign_name ILIKE '%sales%'`)
- Primary objective: Drive Wisdom+ purchases
- Spend: $148,137.99 (76.9% of total Meta spend)
- CPP: $71.63
- Conversion rate: 9.85%

**Leads Campaigns** (`campaign_name ILIKE '%lead%' AND NOT '%sales%'`)
- Primary objective: Generate leads for nurture
- Spend: $11,859.73 (6.2% of total Meta spend)
- CPL: $9.36
- Conversion rate: 10.97%

**Retargeting Campaigns** (`campaign_name ILIKE '%retarget%'`)
- Target: Previous visitors/engagers
- Spend: $868.70 (0.5% of total Meta spend)
- CPP: $37.77 (lowest CPP - warm audience)

**Content Campaigns** (`campaign_name ILIKE '%content%'`)
- Objective: Brand awareness, engagement
- Spend: $32,943.46 (17.1% of total Meta spend)
- Very high CPP: $3,660.38 (not optimized for conversions)

**Other Campaigns**
- Miscellaneous/test campaigns
- Minimal spend: $185.15

### Google Ads Campaign Types

- Currently tracked as aggregate (no campaign-level breakdown)
- Total spend: $9,178.71
- CPC: $2.07 (lower than Meta's $2.89)
- CTR: 6.97% (much higher than Meta's 0.56%)

---

## Data Sources

### Primary Tables

**wisdom_lead_classification**
- Source: Derived from `contacts` + `analytics_events`
- Purpose: Pre-classified leads with paid/organic/manychat flags
- Refresh: Real-time via n8n workflows
- Key fields: `contact_id`, `is_paid`, `is_organic`, `has_manychat`, `created_at`

**orders**
- Source: ClickFunnels via n8n
- Purpose: All purchase transactions
- Key fields: `id`, `contact_id`, `order_total`, `funnel_name`, `billing_status`, `created_at`

**order_items**
- Source: ClickFunnels via n8n
- Purpose: Line items for each order (products + quantities)
- Key fields: `order_id`, `product_id`, `quantity`, `price`

**ad_performance**
- Source: Meta Ads API + Google Ads API via n8n
- Purpose: Daily ad metrics (spend, clicks, impressions, conversions)
- Key fields: `date`, `platform`, `campaign_name`, `spend`, `clicks`, `impressions`, `reported_leads`, `reported_purchases`

**analytics_events**
- Source: Multiple (Keap, ManyChat, Vidalytics via n8n)
- Purpose: User engagement tracking
- Key fields: `contact_id`, `name`, `value`, `timestamp`

### SQL Functions

**get_dashboard_metrics(p_start_date, p_end_date)**
- Location: Supabase Database Functions
- Purpose: Single optimized query for all Overview metrics
- Returns: JSONB with kpis, paidAdsFunnel, organicFunnel, metaPerformance, etc.
- Performance: ~2-5 seconds for 30-day range
- Cache: 2 minutes in Redis/memory

**get_journals_metrics(p_start_date, p_end_date)**
- Location: Supabase Database Functions
- Purpose: Calculate journal counts and progress
- Returns: JSONB with wisdomJournals, extraJournals, totalJournals, journalProgress

**get_daily_metrics(p_start_date, p_end_date)**
- Location: Supabase Database Functions
- Purpose: Daily breakdown for charts
- Returns: Array of daily data points

---

## Migration History

### Migration 031 (Dec 2025)
- Fixed Wisdom+ Sales logic to use product_id = 1 (not order_total >= $31)
- Fixed Total Journals calculation (Wisdom+ count + Extra Journals quantity)
- Removed order_total threshold logic

### Migration 032 (Dec 23, 2025) ✅ CURRENT
- **Moved KPI calculations from TypeScript to SQL**
- Added 5 new fields to `get_dashboard_metrics` kpis object:
  - `welcomeEmailClicks`: Sum of paid + organic email clicks
  - `cplAds`: (Meta Leads + Sales Spend) / Paid Leads
  - `cppAds`: (Meta Leads + Sales Spend) / Paid Wisdom+ Sales
  - `trueCpl`: Total Spend / Total Leads
  - `trueCpp`: Total Spend / Total Wisdom+ Sales
- **Performance improvement**: Calculations now happen in database (faster)
- **No breaking changes**: Frontend unchanged, same field names

---

## Usage Guidelines for Other Pages

### For Charts Page
- Use same KPI definitions from this document
- Fetch data from `get_daily_metrics` for time-series charts
- Apply same paid/organic filters using `wisdom_lead_classification`

### For Daily Analysis Page
- Use same campaign classifications (Sales, Leads, Retargeting, etc.)
- Calculate daily CPL/CPP using same formulas
- Show both "Ads" and "True" metrics for comparison

### For Data Hub Page
- Reference this document for column definitions
- Use same product_id mappings
- Apply same funnel name filters

---

## Key Insights & Findings

1. **Organic traffic converts 72% better** than paid (16.7% vs 9.7%)
2. **True CPL is lower than CPL (Ads)** because organic leads dilute the cost
3. **Kingdom Seekers is deactivated** in paid funnel (0 conversions) but active in organic (602 trials)
4. **Extra Journals bump rate** is higher in organic (23.1%) vs paid (8.6%)
5. **ManyChat engagement** is much higher in organic (53% connection rate) vs paid (4%)
6. **Email clicks** represent 5.3% of total leads (1,699 / 32,094)
7. **Sales campaigns** drive 76.9% of Meta spend but have lower CPP ($71.63) than Content campaigns ($3,660)

---

## Contact

For questions about these definitions, contact the project maintainer or refer to:
- SQL migrations: `/migrations/`
- Backend implementation: `/server/routers.ts`, `/server/supabase.ts`
- Frontend usage: `/client/src/pages/Overview.tsx`
