# VWO API Research - Integration Findings

## Summary

VWO provides REST API for accessing campaign data and A/B test results. The API allows retrieving metric reports with conversion data, visitor counts, and statistical significance.

## Key Endpoints

### 1. Get Metric Report by ID
**Endpoint**: `GET https://app.vwo.com/api/v2/accounts/{account_id}/insights/metrics/{report_id}`

**Purpose**: Retrieve comprehensive details for a specific metric report, including historical status and associated metadata.

**Authentication**: Bearer token in header
```
Header: token: {API_TOKEN}
```

**Response**: JSON with campaign performance data

### 2. Get All Metric Reports
**Endpoint**: `GET https://app.vwo.com/api/v2/accounts/{account_id}/insights/metrics`

**Purpose**: List all metric reports for the account

## Data Export Options

VWO supports **permanent export pipelines** to:
- **Google Cloud Storage (GCS)**
- **Amazon S3**

These connect seamlessly with popular Data Warehouses for BI and reporting.

## Integration Approach for Dashboard

### Option 1: REST API (Real-time)
**Pros**:
- Real-time data access
- Direct API calls from backend

**Cons**:
- Rate limits may apply
- Requires API token management
- Additional API calls overhead

### Option 2: Data Export Pipeline (Recommended)
**Pros**:
- Batch export to GCS/S3
- Can be imported into Supabase via n8n workflow
- No rate limit concerns
- Historical data preservation

**Cons**:
- Not real-time (scheduled exports)
- Requires GCS/S3 setup

## Recommended Implementation

**Use Data Export Pipeline**:
1. Configure VWO to export data to Google Cloud Storage
2. Create n8n workflow to:
   - Monitor GCS bucket for new VWO exports
   - Parse VWO data (campaign results, conversion rates, statistical significance)
   - Insert into Supabase `vwo_ab_tests` table
3. Dashboard reads from Supabase (same pattern as other data)

## Required Data Points

For optimization agent, we need:
- **Campaign/Test Name**
- **Variant A vs Variant B**
- **Conversion Rate** (Lead Rate) for each variant
- **Statistical Significance** (is winner declared?)
- **Sample Size** (visitors per variant)
- **Test Status** (running, paused, completed)
- **Date Range** (test start/end dates)

## Next Steps

1. ✅ VWO API research completed
2. ⏳ User needs to configure VWO Data Export to GCS
3. ⏳ Create n8n workflow to import VWO data to Supabase
4. ⏳ Create `vwo_ab_tests` table in Supabase schema
5. ⏳ Build tRPC procedures to fetch VWO test data
6. ⏳ Display A/B test results in optimization agent UI

## Alternative: Manual CSV Export

If automated export is not feasible, VWO allows manual CSV export of campaign results. User can:
1. Export CSV from VWO dashboard
2. Upload to dashboard via file upload UI
3. Parse and store in Supabase

This is less ideal but works as a fallback.
