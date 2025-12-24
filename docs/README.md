# Documentation Index

**31-Day Wisdom Challenge Analytics Dashboard**  
**Last Updated:** December 23, 2025

This folder contains comprehensive documentation for the analytics dashboard, including business definitions, technical architecture, and implementation guides.

---

## 📚 Documentation Files

### [BUSINESS_DEFINITIONS.md](./BUSINESS_DEFINITIONS.md)
**Purpose**: Single source of truth for all business metrics, KPIs, and data classifications

**Contents**:
- Core business concepts (Lead classification, Order classification)
- Traffic sources & funnels (Paid vs Organic)
- Product definitions (Wisdom+, Kingdom Seekers, Extra Journals)
- KPI formulas (CPL, CPP, Conversion Rate, AOV, etc.)
- Funnel stages (5-stage paid/organic funnels)
- Campaign classifications (Meta Sales, Leads, Retargeting, etc.)
- Data sources (Tables, SQL functions, APIs)
- Migration history (031, 032)
- Key insights & findings

**Use this when**:
- Building new pages (Charts, Daily Analysis, etc.)
- Explaining metrics to stakeholders
- Writing SQL queries that calculate KPIs
- Debugging data discrepancies

---

### [SQL_ARCHITECTURE.md](./SQL_ARCHITECTURE.md)
**Purpose**: Technical guide to SQL function architecture, optimization, and performance

**Contents**:
- Architecture overview (Why SQL functions?)
- Core SQL functions (get_dashboard_metrics, get_journals_metrics, get_daily_metrics)
- Performance optimization (Indexing, CTEs, FILTER clause)
- Migration strategy (Naming, testing, rollback)
- Caching layer (Backend + Frontend)
- Error handling (SQL, Backend, Frontend)
- Best practices (DO/DON'T lists)
- Monitoring & debugging

**Use this when**:
- Creating new SQL functions
- Optimizing slow queries
- Writing migrations
- Debugging performance issues
- Understanding caching strategy

---

## 🚀 Quick Start

### For Frontend Developers

1. **Read BUSINESS_DEFINITIONS.md** to understand metrics
2. **Use tRPC procedures** to fetch data (don't write raw SQL)
3. **Reference KPI formulas** when displaying calculations
4. **Follow funnel definitions** when building visualizations

Example:
```typescript
// Fetch unified metrics for Overview page
const { data } = trpc.overview.unifiedMetrics.useQuery({
  startDate: '2025-12-13',
  endDate: '2025-12-23'
});

// Access pre-calculated KPIs
const cplAds = data?.kpis?.cplAds; // $6.32
const trueCpl = data?.kpis?.trueCpl; // $6.29
```

### For Backend Developers

1. **Read SQL_ARCHITECTURE.md** to understand function design
2. **Use existing SQL functions** before creating new ones
3. **Follow migration strategy** when modifying functions
4. **Implement caching** for expensive queries

Example:
```typescript
// Call SQL function via Supabase
const { data, error } = await supabase.rpc('get_dashboard_metrics', {
  p_start_date: startDate,
  p_end_date: endDate
});

// Cache result
await cache.set(cacheKey, data, 2 * 60 * 1000); // 2 min TTL
```

### For Data Analysts

1. **Read BUSINESS_DEFINITIONS.md** for metric definitions
2. **Test SQL functions** in Supabase SQL Editor
3. **Reference campaign classifications** for ad analysis
4. **Use migration files** to understand data structure changes

Example:
```sql
-- Test in Supabase SQL Editor
SELECT jsonb_pretty(
  get_dashboard_metrics('2025-12-13', '2025-12-23')
);

-- Extract specific KPI
SELECT 
  (get_dashboard_metrics('2025-12-13', '2025-12-23')->'kpis'->>'cplAds')::numeric as cpl_ads;
```

---

## 📊 Key Metrics Reference

### Primary KPIs (Overview Page)

| Metric | Formula | Current Value | Definition |
|--------|---------|---------------|------------|
| Total Leads | COUNT(wisdom_lead_classification) | 32,094 | All wisdom funnel contacts |
| Total Wisdom+ Sales | COUNT(orders with product_id=1) | 3,594 | Wisdom+ journal purchases |
| Kingdom Seeker Trials | COUNT(orders with product_id=8) | 602 | High-ticket trial signups |
| Total Ad Spend | SUM(ad_performance.spend) | $159,997.72 | Meta + Google ad spend |
| Total Revenue | SUM(orders.order_total) | $132,955.20 | All order revenue |
| Conversion Rate | (Wisdom+ Sales / Leads) * 100 | 11.20% | Lead → Purchase conversion |
| CPL (Ads) | (Meta Leads+Sales Spend) / Paid Leads | $6.32 | Cost per paid lead |
| CPP (Ads) | (Meta Leads+Sales Spend) / Paid Sales | $65.15 | Cost per paid purchase |
| True CPL | Total Spend / Total Leads | $6.29 | Cost per all leads |
| True CPP | Total Spend / Total Sales | $56.18 | Cost per all purchases |
| AOV | Revenue / Non-Zero Sales | $38.43 | Average order value |
| Welcome Email Clicks | COUNT(email click events) | 1,699 | Email engagement |

### Funnel Metrics

**Paid Ads Funnel** (31daywisdom.com):
1. Leads: 25,298
2. Wisdom+ Purchases: 2,456 (9.7% conversion)
3. Kingdom Seekers: 0 (deactivated)
4. ManyChat Connected: 1,002 (4.0%)
5. Bot Alerts: 788 (78.6%)

**Organic Funnel** (31daywisdomchallenge.com):
1. Leads: 6,796
2. Wisdom+ Purchases: 1,135 (16.7% conversion)
3. Kingdom Seekers: 602 (53.0%)
4. ManyChat Connected: 1,000 (14.7%)
5. Bot Alerts: 822 (82.2%)

---

## 🔧 Common Tasks

### Adding a New KPI

1. **Define in BUSINESS_DEFINITIONS.md**
   - Add to "KPI Definitions & Formulas" section
   - Document formula, data source, current value

2. **Implement in SQL function**
   - Add calculation to appropriate CTE
   - Add field to JSONB response
   - Test in SQL Editor

3. **Update backend**
   - No changes needed (tRPC auto-passes SQL result)

4. **Update frontend**
   - Access new field: `data?.kpis?.newKpi`
   - Add to UI component

5. **Create migration**
   - Document changes in migration file
   - Test before applying to production

### Creating a New Page

1. **Review BUSINESS_DEFINITIONS.md**
   - Understand which metrics you need
   - Check if existing SQL functions provide data

2. **Create tRPC procedure** (if needed)
   - Call existing SQL function OR create new one
   - Implement caching

3. **Build frontend component**
   - Use `trpc.*.useQuery()` to fetch data
   - Display metrics using definitions from docs

4. **Test thoroughly**
   - Verify calculations match Overview page
   - Check date range filtering works
   - Test loading/error states

---

## 📝 Migration History

### Migration 031 (Dec 2025)
- Fixed Wisdom+ Sales to use product_id = 1 (not order_total threshold)
- Fixed Total Journals calculation
- Removed order_total >= $31 logic

### Migration 032 (Dec 23, 2025) ✅ **CURRENT**
- Moved 5 KPI calculations from TypeScript to SQL
- Added: welcomeEmailClicks, cplAds, cppAds, trueCpl, trueCpp
- Performance improvement: Database-side calculations
- No breaking changes to frontend

---

## 🐛 Troubleshooting

### "Metrics don't match between pages"
→ Check BUSINESS_DEFINITIONS.md for correct formula  
→ Verify date range filtering is consistent  
→ Ensure both pages use same SQL function

### "Query is slow (>5 seconds)"
→ Check SQL_ARCHITECTURE.md for optimization tips  
→ Verify indexes exist on filtered columns  
→ Consider adding caching layer

### "New KPI not showing in frontend"
→ Check SQL function returns field in JSONB  
→ Verify backend passes field through  
→ Check frontend reads correct field name  
→ Clear cache and refresh

### "Migration failed in production"
→ Check SQL_ARCHITECTURE.md for rollback strategy  
→ Restore previous migration from git  
→ Test thoroughly in SQL Editor before reapplying

---

## 📞 Contact & Support

**Project Repository**: alicia-create/wisdom-challenge-dashboard  
**Documentation Location**: `/docs/`  
**Migrations Location**: `/migrations/`  
**Backend Code**: `/server/routers.ts`, `/server/supabase.ts`  
**Frontend Code**: `/client/src/pages/`

For questions or issues:
1. Check this documentation first
2. Review migration files for recent changes
3. Test SQL functions in Supabase SQL Editor
4. Check backend logs for errors
5. Reach out to project maintainer

---

## 🎯 Next Steps

1. **Implement Charts page** using daily_metrics SQL function
2. **Enhance Daily Analysis** with campaign-level breakdown
3. **Add alerting system** for KPI thresholds
4. **Create PDF export** for executive reports
5. **Build campaign comparison** tool (A/B testing)

---

**Last Updated:** December 23, 2025  
**Documentation Version:** 1.0  
**Dashboard Version:** Migration 032 (464f0b7c)
