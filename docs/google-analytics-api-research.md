# Google Analytics 4 Data API Research - Integration Findings

## Summary

Google Analytics 4 (GA4) provides a comprehensive Data API (v1) for programmatic access to landing page performance metrics, user behavior, and conversion data. The API supports real-time and historical reporting with rich dimensions and metrics.

## Key API Methods

### 1. runReport
**Endpoint**: `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runReport`

**Purpose**: Returns customized reports of GA4 event data (preferred method for simple queries)

**Use Case**: Retrieve landing page metrics (bounce rate, session duration, conversions)

### 2. runRealtimeReport
**Endpoint**: `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:runRealtimeReport`

**Purpose**: Returns real-time event data (last 30-60 minutes)

**Use Case**: Monitor live landing page performance during campaign

### 3. batchRunReports
**Endpoint**: `POST https://analyticsdata.googleapis.com/v1beta/properties/{propertyId}:batchRunReports`

**Purpose**: Generate multiple reports in a single API call

**Use Case**: Fetch multiple landing page metrics efficiently

## Available Metrics for Landing Page Optimization

### Session Metrics
- **`sessions`**: Number of sessions
- **`sessionDuration`**: Total session duration (seconds)
- **`averageSessionDuration`**: Average session duration (seconds)
- **`bounceRate`**: Percentage of non-engaged sessions (returned as fraction, e.g., 0.2761 = 27.61%)
- **`engagementRate`**: Percentage of engaged sessions

### User Engagement Metrics
- **`activeUsers`**: Number of active users
- **`newUsers`**: Number of new users
- **`engagedSessions`**: Number of engaged sessions (session > 10 seconds OR 2+ page views OR conversion event)
- **`screenPageViews`**: Total page views
- **`screenPageViewsPerSession`**: Average page views per session

### Conversion Metrics
- **`conversions`**: Total conversions (custom events marked as conversions)
- **`totalRevenue`**: Total revenue from conversions
- **`eventCount`**: Total event count
- **`eventValue`**: Total event value

### Traffic Source Metrics
- **`sessions`** by `sessionSource`, `sessionMedium`, `sessionCampaign`
- **`conversions`** by traffic source

## Available Dimensions for Segmentation

### Landing Page Dimensions
- **`landingPage`**: The page path where users entered the site
- **`pagePath`**: The page path
- **`pageTitle`**: The page title

### Traffic Source Dimensions
- **`sessionSource`**: Traffic source (e.g., google, facebook)
- **`sessionMedium`**: Traffic medium (e.g., cpc, organic)
- **`sessionCampaign`**: Campaign name (e.g., 31DWC2026)
- **`sessionCampaignId`**: Campaign ID

### Time Dimensions
- **`date`**: Date in YYYYMMDD format
- **`hour`**: Hour of day (0-23)
- **`dayOfWeek`**: Day of week (0=Sunday, 6=Saturday)

### Device Dimensions
- **`deviceCategory`**: Device type (desktop, mobile, tablet)
- **`browser`**: Browser name
- **`operatingSystem`**: OS name

## Authentication

**OAuth 2.0** required with scope:
```
https://www.googleapis.com/auth/analytics.readonly
```

**Service Account** (recommended for server-side):
1. Create service account in Google Cloud Console
2. Download JSON key file
3. Grant service account access to GA4 property (Viewer role)
4. Use service account credentials in API calls

## Example Query for Landing Page Metrics

```json
{
  "property": "properties/123456789",
  "dateRanges": [
    {
      "startDate": "2025-12-15",
      "endDate": "2025-12-25"
    }
  ],
  "dimensions": [
    {
      "name": "landingPage"
    },
    {
      "name": "sessionSource"
    },
    {
      "name": "sessionCampaign"
    }
  ],
  "metrics": [
    {
      "name": "sessions"
    },
    {
      "name": "bounceRate"
    },
    {
      "name": "averageSessionDuration"
    },
    {
      "name": "conversions"
    },
    {
      "name": "engagementRate"
    }
  ],
  "dimensionFilter": {
    "filter": {
      "fieldName": "sessionCampaign",
      "stringFilter": {
        "matchType": "EXACT",
        "value": "31DWC2026"
      }
    }
  }
}
```

## Integration Approach for Dashboard

### Option 1: Direct API Integration (Recommended)
**Pros**:
- Real-time data access
- Flexible querying (filter by campaign, date range, landing page)
- No intermediate storage needed

**Cons**:
- Requires OAuth setup
- API quota limits (25,000 tokens per day per project)

**Implementation**:
1. Create Google Cloud project
2. Enable Google Analytics Data API
3. Create service account and download JSON key
4. Store service account credentials as environment variable
5. Create tRPC procedures to query GA4 API
6. Cache results in Supabase to reduce API calls

### Option 2: BigQuery Export (Alternative)
**Pros**:
- No API quota concerns
- Historical data warehouse
- Complex SQL queries

**Cons**:
- Requires BigQuery setup (paid)
- Data delayed by 24 hours
- More complex setup

## Required Data Points for Optimization Agent

For funnel leak detection, we need:

1. **Connect Rate** (Landing Page Views / Link Clicks)
   - GA4 Metric: `screenPageViews` / Facebook `link_clicks`
   - Dimension: `landingPage`, `sessionCampaign`

2. **Bounce Rate** (Non-engaged sessions / Total sessions)
   - GA4 Metric: `bounceRate`
   - Dimension: `landingPage`, `sessionSource`

3. **Average Session Duration**
   - GA4 Metric: `averageSessionDuration`
   - Dimension: `landingPage`

4. **Lead Rate** (Form submissions / Page views)
   - GA4 Metric: `conversions` (custom event: `generate_lead`) / `screenPageViews`
   - Dimension: `landingPage`

5. **Time on Page** (Engagement depth)
   - GA4 Metric: `sessionDuration`
   - Dimension: `landingPage`

6. **Scroll Depth** (User engagement)
   - GA4 Custom Event: `scroll` (requires custom implementation)
   - Metric: `eventCount` where `eventName` = `scroll`

## Implementation Steps

1. ✅ GA4 API research completed
2. ⏳ User needs to provide GA4 Property ID
3. ⏳ Create Google Cloud service account for API access
4. ⏳ Store service account JSON key as environment variable
5. ⏳ Create `server/google-analytics.ts` helper functions
6. ⏳ Create tRPC procedures to fetch GA4 landing page metrics
7. ⏳ Cache GA4 data in Supabase `ga4_landing_page_metrics` table
8. ⏳ Display landing page performance in optimization agent UI
9. ⏳ Correlate GA4 data with Facebook ad data for funnel analysis

## GA4 Events to Track

For comprehensive funnel analysis, ensure these events are tracked:

1. **`page_view`** (auto-tracked) - Landing page views
2. **`generate_lead`** (custom) - Form submission
3. **`session_start`** (auto-tracked) - Session initiation
4. **`scroll`** (custom) - Scroll depth (25%, 50%, 75%, 100%)
5. **`form_start`** (custom) - User starts filling form
6. **`purchase`** (ecommerce) - VIP purchase completion

## Next Steps

1. ✅ GA4 API research completed
2. ⏳ User provides GA4 Property ID
3. ⏳ User grants service account access to GA4 property
4. ⏳ Implement GA4 API integration in backend
5. ⏳ Build optimization agent with GA4 + Facebook data correlation
