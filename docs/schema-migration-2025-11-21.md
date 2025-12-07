# Schema Migration - November 21, 2025

## Summary of Changes

### Renamed Tables
- `Lead` → `contacts`
- `Order` → `orders`

### Removed Tables
- `high_ticket_sales` (consolidated into `orders`)
- `daily_attendance` (replaced by `analytics_events`)

### New Tables
1. **`analytics_events`** - Granular event tracking for all user actions
2. **`products`** - Product catalog with cross-platform IDs
3. **`order_items`** - Junction table for order line items
4. **`youtube_attendance`** - YouTube live stream attendance
5. **`workflow_errors`** - Centralized error logging

---

## Table Details

### `contacts` (formerly `Lead`)
**Columns:**
- `id` (bigint, PK)
- `created_at` (timestamptz)
- `email` (text, unique)
- `phone` (text, nullable)
- `full_name` (text, nullable)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `calendar_status` (text, nullable)
- `obvio_link` (text, nullable)
- `clickfunnels_id` (bigint, nullable)
- `keap_id` (bigint, nullable)
- `manychat_id` (bigint, nullable)

**Foreign Keys:**
- Referenced by `analytics_events.contact_id`
- Referenced by `orders.contact_id`

---

### `orders` (formerly `Order`)
**Columns:**
- `id` (bigint, PK)
- `created_at` (timestamptz)
- `contact_id` (bigint, FK → contacts.id)
- `clickfunnels_order_id` (bigint, nullable)
- `clickfunnels_order_number` (text, nullable)
- `order_total` (numeric, nullable)
- `purchase_date` (date, nullable)
- `billing_status` (text, nullable)
- `order_source` (text, nullable)
- `funnel_name` (text, nullable)
- `funnel_id` (bigint, nullable)
- `funnel_public_id` (text, nullable)
- `page` (text, nullable)
- `page_id` (bigint, nullable)
- `page_public_id` (text, nullable)
- `billing_address_*` (various address fields)
- `shipping_address_*` (various address fields)

**Foreign Keys:**
- Referenced by `order_items.order_id`

**Note:** High-ticket sales are now stored in this table (no separate table)

---

### `order_items` (NEW)
**Columns:**
- `id` (bigint, PK)
- `created_at` (timestamptz)
- `order_id` (bigint, FK → orders.id)
- `product_id` (bigint, FK → products.id)
- `quantity` (bigint, nullable)
- `amount` (numeric, nullable)
- `currency` (text, nullable)

**Purpose:** Junction table linking orders to products

---

### `products` (NEW)
**Columns:**
- `id` (bigint, PK)
- `created_at` (timestamptz)
- `product_name` (text)
- `clickfunnels_product_id` (bigint, unique, nullable)
- `keap_product_id` (bigint, unique, nullable)
- `description` (text, nullable)

**Purpose:** Cross-platform product catalog for mapping products across ClickFunnels, Keap, and Supabase

---

### `analytics_events` (NEW)
**Columns:**
- `id` (bigint, PK)
- `contact_id` (bigint, FK → contacts.id)
- `name` (text, nullable) - Event name (e.g., "Attended_Day_1", "Clicked_Youtube_Subscription")
- `value` (text, nullable) - Event value (e.g., purchase amount, session ID)
- `type` (enum: lead, purchase, action, message, analytics)
- `timestamp` (timestamptz)
- `comment` (text, nullable)

**Purpose:** Replaces `daily_attendance` and tracks ALL user engagement events

**Event Types:**
- `lead` - Lead generation events
- `purchase` - Purchase events
- `action` - User actions (clicks, views, etc.)
- `message` - Message/communication events
- `analytics` - Analytics tracking events

---

### `youtube_attendance` (NEW)
**Columns:**
- `id` (bigint, PK)
- `created_at` (timestamptz)
- `date` (date)
- `platform` (text) - Always "YouTube"
- `participant_count` (integer, nullable)

**Purpose:** Aggregated YouTube live stream attendance

---

### `ad_performance` (UNCHANGED)
**Columns:** Same as before
- Campaign, ad set, and ad level granularity
- Meta and Google Ads data

---

### `daily_kpis` (UNCHANGED)
**Columns:** Same as before
- Aggregated daily KPIs

---

## Migration Tasks

### Backend Updates Required:
1. ✅ Rename `Lead` → `contacts` in all queries
2. ✅ Rename `Order` → `orders` in all queries
3. ✅ Remove `high_ticket_sales` references
4. ✅ Add `analytics_events` queries for engagement tracking
5. ✅ Add `products` queries for product mapping
6. ✅ Update `orders` queries to join with `order_items` and `products`

### Frontend Updates Required:
1. ✅ Update debug pages (Leads → Contacts, Purchases → Orders)
2. ✅ Update Engagement & Sales page to use `analytics_events`
3. ✅ Remove high-ticket sales specific UI (now part of orders)
4. ✅ Add product name display in orders table

---

## Data Flow Changes

### Old Flow (High-Ticket Sales):
```
high_ticket_sales table → Engagement & Sales page
```

### New Flow (All Sales):
```
orders → order_items → products → Engagement & Sales page
```

### Old Flow (Attendance):
```
daily_attendance table → Engagement & Sales page
```

### New Flow (Attendance):
```
analytics_events (type='analytics', name='Attended_Day_X') → Engagement & Sales page
```

---

## Query Examples

### Get all contacts (formerly leads):
```sql
SELECT * FROM contacts WHERE email = 'user@example.com';
```

### Get orders with products:
```sql
SELECT 
  o.*,
  oi.quantity,
  oi.amount,
  p.product_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.contact_id = 123;
```

### Get attendance events:
```sql
SELECT 
  contact_id,
  name,
  timestamp
FROM analytics_events
WHERE type = 'analytics'
  AND name LIKE 'Attended_Day_%'
ORDER BY timestamp DESC;
```

### Get YouTube attendance:
```sql
SELECT 
  date,
  participant_count
FROM youtube_attendance
ORDER BY date DESC;
```
