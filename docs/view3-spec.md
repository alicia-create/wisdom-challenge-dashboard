# View 3: Engagement & Sales Specification

## Overview
View 3 focuses on **post-VIP purchase engagement** during the 31-day challenge (January) and **high-ticket sales attribution** back to original acquisition campaigns.

## Key Metrics

### 1. Sales & Performance KPIs (4 Cards)
- **High-Ticket Sales (Today)**: Count of HT sales today
- **Cost per Acquisition (High-Ticket)**: Total ad spend / Total HT sales
- **ROAS (Full Funnel)**: (VIP Revenue + OTO Revenue + HT Revenue) / Total Ad Spend
- **Attendance Today (LIVE)**: Count of participants attending today's session

### 2. Daily Attendance Chart (Bar Chart)
- **X-Axis**: Day of challenge (Day 1, Day 2, ..., Day 31)
- **Y-Axis**: Number of participants
- **Two bars per day**:
  - Free participants (YouTube)
  - VIP participants (Zoom)

### 3. High-Ticket Sales Attribution Table
Connects high-ticket sales back to the original acquisition campaign via UTMs.

**Columns**:
- Customer Name
- HT Product
- HT Price
- Purchase Date
- Original Campaign (UTM)
- Original Ad Set (UTM)
- Original Ad (UTM)
- Days from Lead to HT Sale

## Database Schema

### Table: `attendance`
```sql
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  challenge_day INT NOT NULL, -- 1-31
  platform VARCHAR(20) NOT NULL, -- 'youtube' or 'zoom'
  participant_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (date, platform)
);
```

### Table: `high_ticket_sales`
```sql
CREATE TABLE high_ticket_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(320) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP NOT NULL,
  lead_id INT, -- Foreign key to lead table
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  days_from_lead_to_sale INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_purchase_date (purchase_date),
  INDEX idx_lead_id (lead_id)
);
```

## Data Sources

### Attendance Data
- **YouTube**: YouTube Analytics API (live stream concurrent viewers)
- **Zoom**: Zoom API (webinar participant count)
- **Update frequency**: Real-time during live sessions, historical data stored daily

### High-Ticket Sales Data
- **Source**: Stripe webhooks, ClickFunnels webhooks, or manual CSV import
- **UTM Attribution**: Linked to original lead via email/customer ID
- **Update frequency**: Real-time via webhooks

## Implementation Notes

1. **Attendance tracking starts on Day 1 of the challenge** (January)
2. **HT sales can happen anytime** during or after the challenge
3. **Attribution logic**: Match HT sale email → Lead email → UTM parameters from original opt-in
4. **ROAS calculation**: Include VIP + OTO + HT revenue for full funnel ROAS
5. **Date range filter**: Should allow filtering by challenge days (Day 1-31) or calendar dates

## UI Components

### KPI Cards (Top Row)
- Large numbers with icons
- Color-coded borders (purple gradient)
- Real-time updates

### Attendance Chart
- Recharts BarChart component
- Stacked bars (Free + VIP)
- Tooltip showing exact counts
- Legend: YouTube (blue), Zoom (purple)

### Attribution Table
- Sortable columns
- Search/filter by campaign, product, date range
- Export to CSV functionality
- Pagination for large datasets

## Success Criteria
- ✅ View 3 displays real-time attendance data
- ✅ HT sales are correctly attributed to original campaigns
- ✅ Full funnel ROAS includes all revenue streams
- ✅ Charts and tables update automatically when new data arrives
- ✅ Export functionality works for attribution table
