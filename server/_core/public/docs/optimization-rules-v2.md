# Campaign Optimization Rules - 31DWC 2025 (v2 - Adjusted)

## Campaign Context

**Budget**: $1.2M total (Dec 15 - Jan 1)
- **Phase 1** (Dec 15-25): $150K total (~$13K/day) - Build optimization baseline
- **Phase 2** (Dec 26-Jan 1): $150K/day ($1.05M total) - Scale with inflated budgets

**Strategy**: 
- Max Conversion Quality optimization
- 1-2 consolidated Lead campaigns
- Broad/Advantage+ Audiences (no manual segmentation)
- Advantage+ Placements (no manual placement optimization)
- Creative-driven performance + algorithm intelligence

**Primary Metrics**: 
1. **Click-to-Purchase Rate**: 10% target (Purchases / Link Clicks)
2. **Cost Per Purchase (CPP)**: $30-$60 target range

---

## 1. AD-LEVEL OPTIMIZATION RULES

### Rule 1.1: No Engagement - Disable Immediately
**Condition**: Ad has NO clicks AND spend > $10
**Action**: Disable ad
**Rationale**: Not generating any engagement despite sufficient budget

**Thresholds**:
- Minimum spend before evaluation: $10
- Minimum time before evaluation: 24 hours

---

### Rule 1.2: Low Connect Rate - Disable
**Condition**: Ad has clicks BUT Landing Page Views / Link Clicks < 50%
**Action**: Disable ad
**Rationale**: Traffic is clicking but not reaching landing page (broken link, slow load, or poor relevance)

**Thresholds**:
- Connect Rate threshold: 50%
- Minimum clicks before evaluation: 10 clicks

---

### Rule 1.3: Low Lead Rate - Disable
**Condition**: Ad has page views BUT (Leads / Link Clicks) < 25%
**Action**: Disable ad
**Rationale**: Landing page is not converting traffic into leads

**Thresholds**:
- Lead Rate threshold: 25%
- Minimum page views before evaluation: 20 page views

**Note**: CPL and CPC are NOT fixed - they depend on ad-specific performance. Focus on conversion rates, not absolute costs.

---

### Rule 1.4: Video Creative - Low Retention
**Condition**: Creative is video AND 3-second video views / Impressions < 40%
**Action**: Flag for creative improvement (don't disable if Purchase Rate is good)
**Rationale**: Low hook retention indicates creative fatigue or poor hook

**Thresholds**:
- 3-second retention: 40% (industry standard)
- 25% video view rate: 30% (secondary metric)
- Only evaluate if ad has 1,000+ impressions

---

## 2. FUNNEL LEAK IDENTIFICATION (Priority Order)

### Leak 2.1: Click-to-Purchase Leak (HIGHEST PRIORITY)
**Symptoms**: 
- Click-to-Purchase Rate < 10% (Purchases / Link Clicks)
- Ad has sufficient clicks (50+) and time (3+ days)

**Diagnostic Tree**:
1. Check Lead Rate (Leads / Link Clicks)
   - If < 25% → Landing page issue (Leak 2.3)
   - If ≥ 25% → VIP offer/nurture issue (Leak 2.4)

2. Check Connect Rate (Landing Page Views / Link Clicks)
   - If < 80% → Landing page speed issue (Leak 2.2)

**Action**: Follow diagnostic tree to identify root cause

---

### Leak 2.2: Click-to-Page Leak (Connect Rate Issue)
**Symptoms**: 
- Connect Rate < 80% (Landing Page Views / Link Clicks)
- CTR is good (> 2%)

**Root Cause**: Landing page speed issue or broken tracking
**Action**: 
- Optimize landing page load time
- Check mobile performance
- Verify Facebook Pixel is firing correctly

---

### Leak 2.3: Click-to-Lead Leak (Landing Page Conversion Issue)
**Symptoms**:
- Connect Rate is good (> 80%)
- Lead Rate < 25% (Leads / Link Clicks)

**Root Cause**: Landing page conversion issue
**Action**: 
- Optimize landing page copy, headline, value proposition
- Improve CTA clarity and placement
- Simplify form (reduce fields)
- Test different lead magnets/offers
- Run VWO A/B test

---

### Leak 2.4: Lead-to-Purchase Leak (VIP Offer/Nurture Issue)
**Symptoms**:
- Lead Rate is good (> 25%)
- Purchase Rate < 40% (Purchases / Leads)

**Root Cause**: VIP offer not compelling or email nurture sequence weak
**Action**: 
- Optimize VIP sales page (copy, bonuses, urgency)
- Improve email sequence (timing, copy, CTAs)
- Test pricing/payment plans
- Add social proof/testimonials
- Improve urgency/scarcity messaging

---

## 3. PERFORMANCE BENCHMARKS

### Phase 1 Baseline Targets (Dec 15-25)
**Conversion Rates** (Fixed):
- **CTR (Click-Through Rate)**: 2% minimum
- **Connect Rate**: 80% minimum (Landing Page Views / Link Clicks)
- **Lead Rate**: 25% target (Leads / Link Clicks)
- **Purchase Rate**: 40% target (Purchases / Leads)
- **Click-to-Purchase Rate**: 10% target (Purchases / Link Clicks) = 25% × 40%

**Costs**:
- **CPC (Cost Per Click)**: Varies by ad - monitor trend, not absolute value
- **CPL (Cost Per Lead)**: Varies by ad - monitor trend, not absolute value
- **CPP (Cost Per Purchase)**: $30-$60 target range - primary optimization metric

**Creative Performance**:
- **3-Second Video Retention**: 40% minimum
- **25% Video View Rate**: 30% minimum
- **Frequency**: Keep < 2.5 to avoid creative fatigue

### Phase 2 Scale Targets (Dec 26-Jan 1)
- Maintain Phase 1 conversion rates despite 10x spend increase
- Allow 10-20% CPP inflation during first 2 days of scale
- Monitor frequency: Keep < 2.5 to avoid creative fatigue

---

## 4. DIAGNOSTIC PRIORITY (When Purchase Rate is Low)

When **Click-to-Purchase Rate** is below 2.5%, diagnose in this order:

### Priority 1: Purchase Rate (Purchases / Leads)
- If < 40% → VIP offer or email nurture issue (Leak 2.4)
- Action: Optimize VIP sales page and email sequence

### Priority 2: Lead Rate (Leads / Link Clicks)
- If < 25% → Landing page conversion issue (Leak 2.3)
- Action: Optimize landing page copy, CTA, form

### Priority 3: Connect Rate (Landing Page Views / Link Clicks)
- If < 80% → Landing page speed issue (Leak 2.2)
- Action: Optimize page load time, check mobile performance

### Priority 4: CPC (Cost Per Click)
- If CPC is trending up 30%+ over 3 days → Creative or audience fatigue
- Action: Add new creative variations, check frequency

### Priority 5: CTR (Click-Through Rate)
- If CTR < 2% → Creative hook is weak
- Action: Improve thumbnail, first 3 seconds, headline

### Priority 6: CPM (Cost Per 1000 Impressions)
- If CPM > $20 → Audience saturation or high competition
- Action: Monitor frequency, consider creative refresh

---

## 5. WHEN TO KEEP (DON'T DISABLE)

### Rule 5.1: Good Purchase Rate Despite Bad Metrics
**Condition**: Click-to-Purchase Rate ≥ 10% OR CPP is within $30-$60 range BUT CPM/CPC/CTR are poor
**Action**: Keep ad running
**Rationale**: Final conversion metric is what matters - ad is profitable

---

### Rule 5.2: Learning Phase Protection
**Condition**: Ad set is in learning phase (< 50 conversions in 7 days)
**Action**: Don't make changes unless performance is catastrophically bad (Click-to-Purchase Rate < 3%)
**Rationale**: Algorithm needs time to optimize - premature changes reset learning

---

### Rule 5.3: Broad Audience Strategy
**Condition**: Using Broad/Advantage+ Audiences
**Action**: Don't manually segment by age, gender, geography, device, or placement
**Rationale**: Let Meta's algorithm find best audiences - manual segmentation limits learning

---

## 6. CREATIVE REFRESH RULES

### Rule 6.1: Fatigue Detection
**Symptoms**:
- CPP increasing by 30%+ over 3-day period
- CTR declining by 25%+ over 3-day period
- Frequency > 2.5

**Action**: Add 1-2 new creative variations (doesn't reset learning)
**Timing**: 
- Dec 26: Add 1-2 refreshed assets tailored to year-end urgency
- Dec 29: Add light refresh if frequency rises or CPP softens

---

### Rule 6.2: Winner Scaling
**Condition**: Creative has Click-to-Purchase Rate > 12% AND CPP < $50 AND spending < $500/day
**Action**: Increase budget gradually (20% per day) - don't duplicate
**Rationale**: Scale winners without disrupting learning

---

## 7. BUDGET ALLOCATION RULES

### Rule 7.1: Budget Redistribution
**Frequency**: Daily review
**Action**: 
- Shift budget from high-CPP ad sets to low-CPP ad sets
- Don't kill ad sets in learning phase unless Purchase Rate < 1%

---

### Rule 7.2: Inflated Budget Strategy (Phase 2)
**Setup**: Set campaign budgets to $180-200K/day while targeting $150K/day actual spend
**Rationale**: Reduces throttling, unlocks more efficient delivery during Q5 surge
**Monitor**: Ensure actual spend stays near $150K/day target

---

## 8. TIME-OF-DAY PERFORMANCE ANALYSIS

### Rule 8.1: Hourly Performance Tracking
**Purpose**: Understand performance patterns to avoid panic when checking numbers in the morning (not for dayparting)
**Metrics to Track**:
- CPP by hour of day (0-23)
- Purchase Rate by hour of day
- Spend distribution by hour

**Action**: 
- Identify peak performance hours (lowest CPP)
- Identify poor performance hours (highest CPP)
- Use insights to avoid panic: "CPP is high at 8am because night performance was weak - wait until afternoon to evaluate"
- Use insights during scaling decisions (e.g., "Don't scale at 3am when CPP is 2x higher")

**Note**: Do NOT implement dayparting (ad scheduling) - just use for awareness during scaling

---

## 9. CAMPAIGN INTERFERENCE DETECTION

### Rule 9.1: Broad Audience Overlap
**Challenge**: With Broad/Advantage+ audiences, campaigns may compete for same users
**Detection**:
- Monitor if multiple campaigns are running simultaneously
- Check if CPM increases when new campaign launches
- Look for frequency spikes across campaigns

**Action**:
- Use Campaign Budget Optimization (CBO) to let Meta allocate budget efficiently
- Consolidate campaigns when possible (1-2 Lead campaigns max)
- If running multiple campaigns, ensure they target different funnel stages (cold vs warm)

**Prevention**:
- Stick to 1-2 consolidated Lead campaigns as per Meta strategy
- Avoid launching competing campaigns during scale period

---

## 10. INTEGRATION REQUIREMENTS

### 10.1: VWO A/B Testing Integration
**Purpose**: Track which landing page variant is winning
**API Endpoint**: Research VWO API for A/B test results
**Metrics to Pull**:
- Variant A vs Variant B conversion rates
- Statistical significance
- Winner declaration

**Dashboard Display**:
- Show current A/B test status
- Display conversion rate by variant
- Highlight winning variant when significant

---

### 10.2: Keap Lead Score Integration
**Purpose**: Track lead quality and email nurture performance
**Current Status**: Keap has Lead Score feature but implementation is slow
**Proposed Solution**:
- Research Keap Lead Score API endpoint
- Investigate webhook capabilities (POST from Keap instead of GET polling)
- Track lead score changes over time
- Correlate lead score with purchase rate

**Dashboard Display**:
- Average lead score by ad source
- Lead score distribution (0-100)
- Purchase rate by lead score segment

---

### 10.3: Google Analytics Integration
**Purpose**: Track landing page performance (bounce rate, time on page, scroll depth)
**Metrics to Pull**:
- Bounce rate by traffic source
- Average time on page
- Scroll depth (% of users reaching CTA)
- Form abandonment rate

**Dashboard Display**:
- Landing page performance by ad
- Funnel visualization (Click → Page View → Form Start → Form Submit → Purchase)

---

## 11. AGENT OUTPUT FORMAT

The optimization agent should provide daily recommendations in this format:

```
🎯 PRIMARY METRIC ALERT
Click-to-Purchase Rate: 7.2% (28% below 10% target)
Cost Per Purchase: $68 (within $30-$60 target range, trending up 15% vs yesterday)

🚨 CRITICAL ACTIONS (Disable Now)
- Ad ID 123456: No clicks after $15 spend (Rule 1.1)
- Ad ID 789012: Connect rate 35% (Rule 1.2)
- Ad ID 345678: Lead rate 18% after 30 page views (Rule 1.3)

⚠️ PERFORMANCE WARNINGS (Review Today)
- Ad Set "Lookalike 1%": Purchase Rate 6% (40% below target)
- Creative "VSL v3": 3-sec retention 28% (below 40% threshold)

🔍 FUNNEL LEAKS DETECTED (Priority Order)
1. Leak 2.4 (Lead-to-Purchase): Purchase Rate 28% (below 40% target) → Optimize VIP offer & email sequence
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

---

## 12. AUTOMATION PRIORITIES

### High Priority (Implement First)
1. ✅ Ad-level disable rules (1.1, 1.2, 1.3)
2. ✅ Funnel leak identification (2.1, 2.2, 2.3, 2.4)
3. ✅ Creative fatigue detection (6.1)
4. ✅ Daily performance alerts with priority diagnostics
5. ✅ Time-of-day performance analysis (8.1)

### Medium Priority
6. ⏳ Budget redistribution suggestions (7.1)
7. ⏳ Campaign interference detection (9.1)
8. ⏳ VWO A/B test integration (10.1)
9. ⏳ Google Analytics integration (10.3)

### Low Priority (Manual Review)
10. 📋 Keap Lead Score integration (10.2) - pending API research
11. 📋 Winner scaling automation (6.2)
12. 📋 Inflated budget monitoring (7.2)

---

## Next Steps

1. ✅ Review and approve updated rules
2. ⏳ Research VWO API documentation
3. ⏳ Research Keap Lead Score API and webhooks
4. ⏳ Integrate Google Analytics for landing page metrics
5. ⏳ Build optimization agent with LLM-powered recommendations
6. ⏳ Create dashboard UI for daily optimization reports
7. ⏳ Test agent with real campaign data from Dec 15-25 baseline period
