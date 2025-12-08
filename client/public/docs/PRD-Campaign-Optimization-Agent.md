# Product Requirements Document (PRD)
## Campaign Optimization Agent - 31DWC 2025

**Version**: 1.0  
**Date**: December 7, 2025  
**Status**: Approved  
**Owner**: Pedro Adão (Wisdom Challenge)

---

## Executive Summary

The Campaign Optimization Agent is an AI-powered system that analyzes Facebook Ads campaign performance data, identifies funnel leaks, and provides actionable recommendations to optimize ad spend and maximize conversions. The agent operates on a **suggest-first** model, where all recommendations require human approval before execution.

**Primary Goal**: Maximize **Click-to-Purchase Rate** (10% target) while maintaining **Cost Per Purchase** between $30-$60.

---

## Problem Statement

Running a $1.2M Facebook Ads campaign (Dec 15 - Jan 1) with Broad/Advantage+ audiences requires constant monitoring and optimization. Manual analysis of thousands of ads, ad sets, and campaigns is time-consuming and error-prone. Key challenges include:

1. **Identifying underperforming ads** before they waste significant budget
2. **Detecting funnel leaks** (Click-to-Page, Click-to-Lead, Lead-to-Purchase)
3. **Recognizing creative fatigue** before performance degrades
4. **Understanding time-of-day patterns** to avoid panic during low-performance hours
5. **Correlating Facebook ad data with landing page metrics** for holistic optimization

---

## Success Metrics

### Primary Metrics
- **Click-to-Purchase Rate**: 10% target (Purchases / Link Clicks)
- **Cost Per Purchase (CPP)**: $30-$60 target range

### Secondary Metrics
- **Lead Rate**: 25% target (Leads / Link Clicks)
- **Purchase Rate**: 40% target (Purchases / Leads)
- **Connect Rate**: 80% minimum (Landing Page Views / Link Clicks)
- **CTR**: 2% minimum (Click-Through Rate)

### Agent Performance Metrics
- **Recommendation Accuracy**: % of accepted recommendations that improved performance
- **Time Saved**: Hours saved per day vs manual analysis
- **Budget Saved**: $ saved by disabling underperforming ads early
- **Response Time**: Time from data refresh to recommendation generation

---

## User Personas

### Primary User: Campaign Manager (Pedro Adão)
- **Role**: Oversees $1.2M campaign execution
- **Goals**: Maximize ROAS, minimize wasted spend, scale winners
- **Pain Points**: Too many ads to monitor manually, unclear which metrics to prioritize
- **Technical Proficiency**: High (comfortable with dashboards, APIs, n8n workflows)

### Secondary User: CEO/Stakeholder
- **Role**: Reviews campaign performance and ROI
- **Goals**: Understand campaign health at a glance
- **Pain Points**: Needs simplified reports, not raw data
- **Technical Proficiency**: Medium (prefers visual dashboards)

---

## Functional Requirements

### FR1: Ad-Level Performance Analysis

**Description**: Analyze each ad's performance against defined thresholds and flag underperformers.

**Rules**:
1. **No Engagement**: Disable if no clicks after $10 spend
2. **Low Connect Rate**: Disable if Landing Page Views / Link Clicks < 50% (min 10 clicks)
3. **Low Lead Rate**: Disable if Leads / Link Clicks < 25% (min 20 page views)
4. **Low Video Retention**: Flag if 3-second retention < 40% (min 1,000 impressions)

**Input Data**:
- Ad ID, Ad Name, Campaign Name
- Spend, Clicks, Impressions, Link Clicks
- Landing Page Views, Leads, Purchases
- 3-Second Video Views (for video ads)

**Output**:
- List of ads to disable with reason codes
- Severity level (Critical, Warning, Info)

---

### FR2: Funnel Leak Detection

**Description**: Identify where users are dropping off in the conversion funnel.

**Leak Types**:

1. **Click-to-Purchase Leak** (Highest Priority)
   - **Symptom**: Click-to-Purchase Rate < 10%
   - **Diagnostic Tree**:
     - Check Lead Rate → If < 25%, landing page issue
     - Check Purchase Rate → If < 40%, VIP offer/email issue
     - Check Connect Rate → If < 80%, page speed issue

2. **Click-to-Page Leak**
   - **Symptom**: Connect Rate < 80%
   - **Root Cause**: Landing page speed or broken tracking
   - **Action**: Optimize page load time, verify Facebook Pixel

3. **Click-to-Lead Leak**
   - **Symptom**: Lead Rate < 25%
   - **Root Cause**: Landing page conversion issue
   - **Action**: Optimize copy, CTA, form, run VWO A/B test

4. **Lead-to-Purchase Leak**
   - **Symptom**: Purchase Rate < 40%
   - **Root Cause**: VIP offer or email nurture weak
   - **Action**: Optimize VIP sales page, improve email sequence

**Input Data**:
- Link Clicks, Landing Page Views, Leads, Purchases (per ad/campaign)
- Time series data (3+ days minimum)

**Output**:
- Prioritized list of funnel leaks with root cause analysis
- Recommended actions for each leak

---

### FR3: Creative Fatigue Detection

**Description**: Detect when creative performance is declining due to audience saturation.

**Indicators**:
- CPP increasing by 30%+ over 3-day period
- CTR declining by 25%+ over 3-day period
- Frequency > 2.5

**Action**:
- Suggest adding 1-2 new creative variations
- Timing: Dec 26 (first refresh), Dec 29 (second refresh if needed)

**Input Data**:
- CPP, CTR, Frequency (time series)
- Ad Set ID, Creative ID

**Output**:
- List of fatigued creatives with trend charts
- Suggested refresh timing

---

### FR4: Time-of-Day Performance Analysis

**Description**: Analyze performance patterns by hour to provide context during scaling decisions.

**Purpose**: Avoid panic when checking numbers in the morning (overnight performance may be weak)

**Metrics to Track**:
- CPP by hour (0-23)
- Click-to-Purchase Rate by hour
- Spend distribution by hour

**Output**:
- Hourly performance heatmap
- Peak performance hours (lowest CPP)
- Poor performance hours (highest CPP)
- Contextual notes: "CPP is high at 8am due to overnight performance - wait until afternoon to evaluate"

**Note**: Do NOT implement dayparting (ad scheduling) - this is for awareness only.

---

### FR5: Budget Redistribution Suggestions

**Description**: Recommend shifting budget from high-CPP ad sets to low-CPP ad sets.

**Rules**:
- Shift budget from ad sets with CPP > 1.5x target ($90+)
- Shift budget to ad sets with CPP < 0.8x target ($48-)
- Don't kill ad sets in learning phase unless CPP > 3x target ($180+)

**Input Data**:
- Ad Set ID, Daily Spend, CPP, Learning Phase Status

**Output**:
- Budget reallocation table (From Ad Set → To Ad Set, Amount)
- Expected CPP improvement

---

### FR6: Winner Scaling Recommendations

**Description**: Identify top-performing ads/ad sets and suggest scaling strategies.

**Criteria**:
- Click-to-Purchase Rate > 12%
- CPP < $50
- Current spend < $500/day

**Action**:
- Increase budget gradually (20% per day)
- Don't duplicate (to avoid resetting learning)

**Input Data**:
- Ad Set ID, Click-to-Purchase Rate, CPP, Daily Spend

**Output**:
- List of winners to scale with suggested budget increases

---

### FR7: Campaign Interference Detection

**Description**: Detect when multiple campaigns are competing for the same audience.

**Indicators**:
- CPM increases when new campaign launches
- Frequency spikes across campaigns
- CPP worsens in existing campaigns

**Action**:
- Alert user to consolidate campaigns
- Suggest using Campaign Budget Optimization (CBO)

**Input Data**:
- Campaign ID, Launch Date, CPM, Frequency, CPP (time series)

**Output**:
- Interference alert with affected campaigns
- Consolidation recommendations

---

### FR8: Daily Optimization Report

**Description**: Generate a comprehensive daily report with prioritized actions.

**Report Structure**:

```
🎯 PRIMARY METRIC ALERT
Click-to-Purchase Rate: 7.2% (28% below 10% target)
Cost Per Purchase: $68 (within $30-$60 target range, trending up 15% vs yesterday)

🚨 CRITICAL ACTIONS (Disable Now)
- Ad ID 123456: No clicks after $15 spend (Rule 1.1)
- Ad ID 789012: Connect rate 35% (Rule 1.2)
- Ad ID 345678: Lead rate 18% after 30 page views (Rule 1.3)

⚠️ PERFORMANCE WARNINGS (Review Today)
- Ad Set "Lookalike 1%": Purchase Rate 28% (below 40% target)
- Creative "VSL v3": 3-sec retention 28% (below 40% threshold)

🔍 FUNNEL LEAKS DETECTED (Priority Order)
1. Leak 2.4 (Lead-to-Purchase): Purchase Rate 28% → Optimize VIP offer & email sequence
2. Leak 2.3 (Click-to-Lead): Lead Rate 18% → Optimize landing page copy/CTA
3. Leak 2.2 (Click-to-Page): Connect Rate 72% → Check landing page speed

✅ TOP PERFORMERS (Scale These)
- Ad ID 901234: Click-to-Purchase 11.5%, CPP $42, spending $200/day
- Ad Set "Broad Audience": Click-to-Purchase Rate 12%, CPP $38, ROAS 4.2x

💡 OPTIMIZATION SUGGESTIONS
- Add 2 new creative variations to combat fatigue (Frequency 2.8)
- Shift $2K/day budget from Ad Set A (CPP $95) to Ad Set B (CPP $68)
- Run VWO A/B test on landing page headline (current Lead Rate 18%)

⏰ TIME-OF-DAY INSIGHTS
- Peak performance: 10am-2pm (CPP $45 avg)
- Poor performance: 2am-6am (CPP $78 avg)
- Note: Morning numbers may look bad due to overnight performance - wait until afternoon to evaluate
- Recommendation: Be cautious when scaling during off-peak hours

📊 CAMPAIGN INTERFERENCE CHECK
- No interference detected (only 1 active campaign)
- Frequency across all campaigns: 1.8 (healthy)
```

**Delivery**:
- Generated every 30 minutes (aligned with n8n data refresh)
- Displayed in dedicated "Optimization Agent" page
- Email/Slack notification for critical actions (optional)

---

## Non-Functional Requirements

### NFR1: Performance
- Report generation time: < 5 seconds
- Dashboard page load time: < 2 seconds
- Real-time data refresh: Every 30 minutes (aligned with n8n)

### NFR2: Reliability
- Agent uptime: 99.5% (allow for maintenance windows)
- Graceful degradation if external APIs fail (VWO, GA4)
- Error logging for all failed recommendations

### NFR3: Security
- All API keys stored as environment variables
- No sensitive data exposed in frontend
- Audit log of all accepted/rejected recommendations

### NFR4: Scalability
- Support analyzing 1,000+ ads simultaneously
- Handle 10x data volume during scale period (Dec 26-Jan 1)
- LLM-powered analysis should complete within 10 seconds

### NFR5: Usability
- Mobile-responsive UI (campaign manager checks on phone)
- One-click action approval (checkboxes for bulk actions)
- Contextual help tooltips for each recommendation

---

## Data Sources

### 1. Facebook Ads Data (Primary)
**Source**: Supabase `ad_performance` table (populated by n8n every 30 minutes)

**Fields**:
- `campaign_id`, `campaign_name`
- `adset_id`, `adset_name`
- `ad_id`, `ad_name`
- `date`, `spend`, `impressions`, `clicks`, `inline_link_clicks`
- `landing_page_views`, `leads`, `purchases`
- `cpc`, `cpm`, `ctr`, `frequency`
- `video_3_sec_views`, `video_p25_watched_views`

**Refresh Rate**: Every 30 minutes

---

### 2. VWO A/B Test Data (Optional)
**Source**: VWO Data Export → GCS → n8n → Supabase `vwo_ab_tests` table

**Fields**:
- `test_id`, `test_name`, `status` (running, paused, completed)
- `variant_a_name`, `variant_b_name`
- `variant_a_conversion_rate`, `variant_b_conversion_rate`
- `variant_a_visitors`, `variant_b_visitors`
- `statistical_significance`, `winner` (A, B, or null)
- `test_start_date`, `test_end_date`

**Refresh Rate**: Daily (or manual CSV upload)

**Integration Status**: ⏳ Pending user setup (VWO export to GCS)

---

### 3. Google Analytics 4 Data (Optional)
**Source**: GA4 Data API → Supabase `ga4_landing_page_metrics` table

**Fields**:
- `landing_page`, `session_source`, `session_campaign`
- `date`, `sessions`, `bounce_rate`, `average_session_duration`
- `conversions`, `engagement_rate`

**Refresh Rate**: Hourly (cached to reduce API quota usage)

**Integration Status**: ⏳ Pending user setup (GA4 Property ID + Service Account)

---

### 4. Keap Lead Score Data (Future)
**Source**: Keap API (webhook POST preferred over polling GET)

**Fields**:
- `contact_id`, `email`, `lead_score` (0-100)
- `tags` (Wisdom Challenge tags)
- `last_updated`

**Refresh Rate**: Real-time (webhook) or hourly (polling)

**Integration Status**: 📋 Backlog (pending Keap API research)

---

## Technical Architecture

### Backend Components

#### 1. Optimization Engine (`server/optimization-engine.ts`)
**Responsibilities**:
- Fetch ad performance data from Supabase
- Apply optimization rules (FR1-FR7)
- Generate recommendation objects with severity levels
- Store recommendations in `optimization_recommendations` table

**Key Functions**:
```typescript
async function analyzeAdPerformance(): Promise<AdRecommendation[]>
async function detectFunnelLeaks(): Promise<FunnelLeak[]>
async function detectCreativeFatigue(): Promise<FatigueAlert[]>
async function analyzeTimeOfDay(): Promise<HourlyPerformance[]>
async function suggestBudgetReallocation(): Promise<BudgetRecommendation[]>
```

---

#### 2. LLM-Powered Insights (`server/optimization-llm.ts`)
**Responsibilities**:
- Use `invokeLLM()` to generate natural language explanations
- Provide context-aware recommendations beyond rule-based logic
- Synthesize multiple data points into actionable insights

**Example Prompt**:
```
You are a Facebook Ads optimization expert analyzing campaign performance.

Context:
- Campaign: 31DWC2026
- Budget: $150K/day (Phase 2 scale period)
- Primary Metric: Click-to-Purchase Rate (current: 7.2%, target: 10%)
- Cost Per Purchase: $68 (target: $30-$60)

Data:
- Ad Set "Broad Audience": CPP $42, Click-to-Purchase 11.5%, Spend $200/day
- Ad Set "Lookalike 1%": CPP $95, Click-to-Purchase 6.2%, Spend $500/day
- Creative "VSL v3": 3-sec retention 28%, CTR 1.8%, Frequency 2.9

Task:
1. Identify the top 3 optimization priorities
2. Explain why each is important
3. Provide specific action steps

Format your response as a structured recommendation.
```

**Output**:
```json
{
  "priorities": [
    {
      "rank": 1,
      "issue": "High CPP on Lookalike 1% Ad Set",
      "impact": "Wasting $500/day at $95 CPP (58% above target)",
      "action": "Shift $300/day budget to Broad Audience (CPP $42)",
      "expected_result": "Save ~$159/day in wasted spend"
    },
    ...
  ],
  "narrative": "Your Broad Audience ad set is significantly outperforming Lookalike 1% (CPP $42 vs $95). This suggests the Meta algorithm has found a winning audience segment. Reallocating budget will improve overall campaign efficiency while maintaining scale."
}
```

---

#### 3. tRPC Procedures (`server/routers.ts`)
**New Router**: `optimization`

**Procedures**:
```typescript
optimization: router({
  // Get latest optimization report
  getReport: protectedProcedure
    .input(z.object({ dateRange: z.string() }))
    .query(async ({ input }) => {
      return await generateOptimizationReport(input.dateRange);
    }),

  // Get ad-level recommendations
  getAdRecommendations: protectedProcedure
    .query(async () => {
      return await analyzeAdPerformance();
    }),

  // Get funnel leak analysis
  getFunnelLeaks: protectedProcedure
    .query(async () => {
      return await detectFunnelLeaks();
    }),

  // Get time-of-day performance
  getHourlyPerformance: protectedProcedure
    .input(z.object({ dateRange: z.string() }))
    .query(async ({ input }) => {
      return await analyzeTimeOfDay(input.dateRange);
    }),

  // Approve recommendation (mark as accepted)
  approveRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.string() }))
    .mutation(async ({ input }) => {
      return await markRecommendationApproved(input.recommendationId);
    }),

  // Reject recommendation
  rejectRecommendation: protectedProcedure
    .input(z.object({ recommendationId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await markRecommendationRejected(input.recommendationId, input.reason);
    }),
})
```

---

### Database Schema

#### Table: `optimization_recommendations`
```sql
CREATE TABLE optimization_recommendations (
  id VARCHAR(36) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  recommendation_type VARCHAR(50) NOT NULL, -- 'disable_ad', 'scale_winner', 'budget_shift', etc.
  severity VARCHAR(20) NOT NULL, -- 'critical', 'warning', 'info'
  ad_id VARCHAR(50),
  adset_id VARCHAR(50),
  campaign_id VARCHAR(50),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  action_required TEXT NOT NULL,
  expected_impact TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approved_at TIMESTAMP,
  approved_by VARCHAR(100),
  rejection_reason TEXT,
  metadata JSON -- Store additional context (metrics, thresholds, etc.)
);
```

#### Table: `ga4_landing_page_metrics` (Optional)
```sql
CREATE TABLE ga4_landing_page_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  landing_page VARCHAR(500) NOT NULL,
  session_source VARCHAR(100),
  session_campaign VARCHAR(100),
  sessions INT DEFAULT 0,
  bounce_rate DECIMAL(5,4), -- Stored as fraction (0.2761 = 27.61%)
  average_session_duration DECIMAL(10,2), -- Seconds
  conversions INT DEFAULT 0,
  engagement_rate DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE KEY unique_metric (date, landing_page, session_source, session_campaign)
);
```

#### Table: `vwo_ab_tests` (Optional)
```sql
CREATE TABLE vwo_ab_tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id VARCHAR(50) UNIQUE NOT NULL,
  test_name VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'running', 'paused', 'completed'
  variant_a_name VARCHAR(100),
  variant_b_name VARCHAR(100),
  variant_a_conversion_rate DECIMAL(5,4),
  variant_b_conversion_rate DECIMAL(5,4),
  variant_a_visitors INT,
  variant_b_visitors INT,
  statistical_significance DECIMAL(5,4), -- 0.95 = 95% confidence
  winner VARCHAR(10), -- 'A', 'B', or NULL
  test_start_date DATE,
  test_end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);
```

---

### Frontend Components

#### Page: `client/src/pages/OptimizationAgent.tsx`
**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🎯 Campaign Optimization Agent                              │
│ Last Updated: 2 minutes ago | Next Refresh: 28 minutes      │
├─────────────────────────────────────────────────────────────┤
│ PRIMARY METRICS                                             │
│ ┌─────────────────┬─────────────────┬─────────────────┐    │
│ │ Click-to-Purchase│ Cost Per Purchase│ Campaign Spend │    │
│ │ 7.2% ⚠️         │ $68 ✅          │ $147K/day      │    │
│ │ Target: 10%     │ Target: $30-$60 │ Target: $150K  │    │
│ └─────────────────┴─────────────────┴─────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│ 🚨 CRITICAL ACTIONS (3)                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ☐ Disable Ad #123456 - No clicks after $15 spend       ││
│ │   Campaign: 31DWC2026 | Ad Set: Broad Audience         ││
│ │   Expected Savings: $15/day                            ││
│ │   [View Details] [Approve] [Reject]                    ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ⚠️ PERFORMANCE WARNINGS (5)                                 │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ☐ Ad Set "Lookalike 1%" - CPP $95 (58% above target)  ││
│ │   Recommendation: Shift $300/day to Broad Audience     ││
│ │   Expected Impact: Save $159/day                       ││
│ │   [View Details] [Approve] [Reject]                    ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ 🔍 FUNNEL LEAKS (2)                                         │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Lead-to-Purchase Leak: Purchase Rate 28% (below 40%)   ││
│ │ Root Cause: VIP offer or email nurture weak            ││
│ │ Action: Optimize VIP sales page, improve email sequence││
│ │ [View Funnel Visualization]                            ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ✅ TOP PERFORMERS (4)                                       │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ☐ Scale Ad #901234 - Click-to-Purchase 11.5%, CPP $42 ││
│ │   Current Spend: $200/day | Suggested: $240/day (+20%) ││
│ │   Expected Impact: +8 purchases/day                    ││
│ │   [View Details] [Approve] [Reject]                    ││
│ └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│ ⏰ TIME-OF-DAY INSIGHTS                                     │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Hourly CPP Heatmap - 24 hours]                        ││
│ │ Peak: 10am-2pm ($45 avg) | Poor: 2am-6am ($78 avg)    ││
│ │ Note: Morning numbers may look bad due to overnight    ││
│ │ performance - wait until afternoon to evaluate.        ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Collapsible sections (expand/collapse)
- Bulk action checkboxes (approve multiple recommendations at once)
- Inline charts (trend lines for CPP, Click-to-Purchase Rate)
- Real-time countdown to next data refresh
- Export report as PDF (for stakeholder sharing)

---

## Integration Requirements

### VWO Integration
**Status**: ⏳ Pending user setup

**Steps**:
1. User configures VWO Data Export to Google Cloud Storage
2. Create n8n workflow to monitor GCS bucket
3. Parse VWO data and insert into Supabase `vwo_ab_tests` table
4. Display A/B test results in Optimization Agent UI

**Alternative**: Manual CSV upload if automated export is not feasible

---

### Google Analytics 4 Integration
**Status**: ⏳ Pending user setup

**Steps**:
1. User provides GA4 Property ID
2. Create Google Cloud service account for API access
3. User grants service account "Viewer" role in GA4
4. Store service account JSON key as environment variable
5. Create `server/google-analytics.ts` helper functions
6. Cache GA4 data in Supabase to reduce API quota usage
7. Display landing page metrics in Optimization Agent UI

---

### Keap Integration (Future)
**Status**: 📋 Backlog

**Steps**:
1. Research Keap Lead Score API endpoints
2. Investigate webhook capabilities (POST from Keap)
3. Implement webhook receiver in backend
4. Track lead score changes over time
5. Correlate lead score with purchase rate

---

## Implementation Phases

### Phase 1: Core Optimization Engine (Week 1)
- ✅ Define optimization rules (completed)
- ⏳ Implement ad-level analysis (FR1)
- ⏳ Implement funnel leak detection (FR2)
- ⏳ Implement creative fatigue detection (FR3)
- ⏳ Build basic UI page with recommendations
- ⏳ Test with real campaign data

### Phase 2: LLM-Powered Insights (Week 2)
- ⏳ Integrate LLM for natural language recommendations
- ⏳ Add time-of-day analysis (FR4)
- ⏳ Add budget redistribution suggestions (FR5)
- ⏳ Add winner scaling recommendations (FR6)
- ⏳ Improve UI with charts and visualizations

### Phase 3: External Integrations (Week 3)
- ⏳ VWO A/B test integration
- ⏳ Google Analytics 4 integration
- ⏳ Campaign interference detection (FR7)
- ⏳ Export report as PDF

### Phase 4: Automation & Refinement (Week 4)
- ⏳ Automated daily email/Slack reports
- ⏳ Recommendation approval workflow
- ⏳ Audit log of all actions
- ⏳ Performance optimization (caching, indexing)

---

## Open Questions

1. **VWO Setup**: Can user configure VWO Data Export to GCS, or should we use manual CSV upload?
2. **GA4 Property ID**: What is the GA4 Property ID for the landing pages?
3. **Service Account Access**: Can user grant service account "Viewer" role in GA4?
4. **Keap Webhooks**: Does Keap support webhook POST for lead score changes, or do we need to poll?
5. **Notification Preferences**: Email, Slack, or in-app only for critical actions?
6. **Approval Workflow**: Should recommendations auto-expire after 24 hours if not acted upon?

---

## Success Criteria

The Campaign Optimization Agent is considered successful if:

1. **Reduces manual analysis time by 80%** (from 2 hours/day to 24 minutes/day)
2. **Identifies underperforming ads within 1 hour** of crossing thresholds
3. **Improves Click-to-Purchase Rate by 15%** (from 7.2% to 8.3%+) within 7 days
4. **Saves $10K+ in wasted ad spend** during Phase 1 (Dec 15-25)
5. **Generates actionable recommendations with 90%+ acceptance rate** (user approves 9/10 suggestions)

---

## Risks & Mitigations

### Risk 1: Data Quality Issues
**Impact**: Incorrect recommendations if Facebook data is incomplete or delayed

**Mitigation**:
- Validate data completeness before running analysis
- Flag missing data in UI (e.g., "Landing Page Views missing for 20% of ads")
- Implement data quality checks in n8n workflows

### Risk 2: LLM Hallucinations
**Impact**: AI generates nonsensical or incorrect recommendations

**Mitigation**:
- Always apply rule-based logic first (FR1-FR7)
- Use LLM only for narrative explanations and context
- Human approval required for all actions (no auto-execution)

### Risk 3: API Quota Limits
**Impact**: GA4 API quota exhausted, no landing page data

**Mitigation**:
- Cache GA4 data in Supabase (refresh hourly, not per request)
- Implement exponential backoff for API failures
- Graceful degradation (show Facebook data only if GA4 unavailable)

### Risk 4: User Overwhelm
**Impact**: Too many recommendations, user ignores them

**Mitigation**:
- Prioritize by severity (Critical > Warning > Info)
- Limit to top 10 recommendations per category
- Provide "Quick Actions" button to approve all critical actions at once

---

## Appendix A: Optimization Rules Reference

See `docs/optimization-rules-v2.md` for complete rule definitions.

---

## Appendix B: API Research

- VWO API: `docs/vwo-api-research.md`
- Google Analytics 4 API: `docs/google-analytics-api-research.md`

---

## Appendix C: Campaign Context

**Campaign**: 31DWC 2025 (31-Day Wisdom Challenge)  
**Budget**: $1.2M total  
**Phase 1** (Dec 15-25): $150K total (~$13K/day) - Build optimization baseline  
**Phase 2** (Dec 26-Jan 1): $150K/day ($1.05M total) - Scale with inflated budgets  

**Strategy**:
- Max Conversion Quality optimization
- 1-2 consolidated Lead campaigns
- Broad/Advantage+ Audiences (no manual segmentation)
- Advantage+ Placements (no manual placement optimization)
- Creative-driven performance + algorithm intelligence

---

**Document End**
