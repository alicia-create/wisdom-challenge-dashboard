# Supabase Database Structure

## Tables Overview

### 1. **ad_performance** (82 rows)
Stores ad performance metrics from Meta and Google Ads
- `id` (bigint, PK)
- `date` (date) - Performance date
- `platform` (text) - 'Meta' or 'Google'
- `campaign_id` (text)
- `campaign_name` (text)
- `adset_id` (text) - Meta only
- `adset_name` (text) - Meta only
- `ad_id` (text) - Meta only
- `ad_name` (text) - Meta only
- `spend` (numeric)
- `clicks` (integer)
- `impressions` (integer)
- `link_clicks` (integer)
- `inline_link_clicks` (integer)
- `landing_page_view_per_link_click` (numeric)
- `reported_leads` (integer)
- `reported_purchases` (integer)

### 2. **daily_kpis** (2 rows)
Pre-aggregated daily KPIs calculated by n8n workflow
- `id` (bigint, PK)
- `date` (date, unique)
- `total_leads` (integer)
- `total_vip_sales` (integer)
- `total_spend_meta` (numeric)
- `total_spend_google` (numeric)
- `cpl` (numeric) - Cost Per Lead
- `cpp` (numeric) - Cost Per Purchase
- `roas` (numeric) - Return on Ad Spend
- `vip_take_rate` (numeric) - % of leads that become VIP

### 3. **Lead** (8 rows)
Tracks all leads from ClickFunnels
- `id` (bigint, PK)
- `email` (text)
- `name` (text)
- `phone` (text)
- `contact_id` (bigint)
- `created_at` (timestamptz)
- `lead_date` (date)
- UTM fields: `utm_campaign`, `utm_source`, `utm_medium`, `utm_content`, `utm_term`
- `ad_id` (text)
- Funnel fields: `funnel`, `funnel_id`, `funnel_public_id`, `page`, `page_id`, `page_public_id`
- `redirect_to`, `ip_address`
- Calendar fields: `calendar_status`, `event_id`, `eventSentAt`, `failed_at`, `error_message`
- `welcome_email_clicked` (boolean)
- `obvio_link` (text)

### 4. **Order** (3 rows)
Tracks VIP purchases
- `id` (bigint, PK)
- `email` (text)
- `first_name`, `last_name`, `full_name` (text)
- `phone` (text)
- `contact_id` (bigint)
- `created_at` (timestamptz)
- `purchase_date` (date)
- `order_id` (bigint)
- `order_number` (text)
- `order_total` (numeric)
- `order_source` (text)
- `billing_status` (text)
- UTM fields: `utm_campaign`, `utm_source`, `utm_medium`, `utm_content`, `utm_term`
- `ad_id` (text)
- Funnel fields: `funnel_name`, `funnel_id`, `funnel_public_id`, `page`, `page_id`, `page_public_id`
- Billing address fields
- Shipping address fields

### 5. **Order_Itens** (9 rows)
Order line items
- `id` (bigint, PK)
- `order_id` (bigint, FK)
- `product_id`, `product_name` (bigint, text)
- `variant_id`, `variant_name` (bigint, text)
- `quantity` (bigint)
- `amount` (numeric)
- `currency` (text)

### 6. **lead_tags** (0 rows)
Tracks tags from Keap and ManyChat
- `id` (bigint, PK)
- `lead_email` (varchar)
- `tag_name` (varchar)
- `source` (varchar) - 'keap', 'manychat', 'manual'
- `added_at` (timestamptz)
- `removed_at` (timestamptz, nullable)
- `is_active` (boolean)

### 7. **daily_attendance** (0 rows)
Challenge participation tracking
- `id` (bigint, PK)
- `date` (date)
- `platform` (text)
- `participant_count` (integer)

### 8. **Workflow_Error** (11 rows)
n8n workflow error logging
- `id` (bigint, PK)
- `workflow_name` (text)
- `error_node` (text)
- `error_message` (text)
- `error_timestamp` (text)
- `execution_id` (text)

### 9. **Keap_Email** (0 rows)
Email templates from Keap
- `id` (bigint, PK)
- `email_id` (bigint)
- `subject` (text)
- `html_content` (varchar)
- `doc_link` (text)

## Key Insights for Dashboard

**For Overview Page:**
1. Use `daily_kpis` table for main KPIs (total_leads, total_vip_sales, cpl, cpp, roas)
2. Aggregate `ad_performance` for platform-specific spend
3. Count `Lead` and `Order` tables for real-time totals
4. Join with `lead_tags` for engagement metrics

**Date Handling:**
- `daily_kpis.date` is DATE type
- `Lead.created_at` and `Order.created_at` are TIMESTAMPTZ
- Need to cast/convert for joins

**Platform Differences:**
- Meta Ads: Has campaign, adset, and ad level data
- Google Ads: Only campaign level data (adset_id, ad_id are NULL)
