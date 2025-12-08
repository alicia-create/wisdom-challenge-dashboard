# Campaign Optimization Rules - 31DWC 2025

## Campaign Context

**Budget**: $1.2M total (Dec 15 - Jan 1)
- **Phase 1** (Dec 15-25): $150K total (~$13K/day) - Build optimization baseline
- **Phase 2** (Dec 26-Jan 1): $150K/day ($1.05M total) - Scale with inflated budgets

**Strategy**: Max Conversion Quality optimization with 1-2 consolidated Lead campaigns using Broad/Advantage+ Audiences

**Creative Approach**: Non-disruptive creative refreshes (adding new creatives doesn't reset learning at ad set level)

---

## 1. AD-LEVEL OPTIMIZATION RULES

### Rule 1.1: No Engagement - Disable Immediately
**Condition**: Ad has NO clicks AND spend > Expected CPC
**Action**: Disable ad
**Rationale**: Not generating any engagement despite sufficient budget

**Thresholds**:
- Expected CPC: $2.00 (adjust based on baseline)
- Minimum spend before evaluation: $10

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
**Condition**: Ad has page views BUT (Leads / Link Clicks) < 25% OR Cost Per Lead > 2x Target CPL
**Action**: Disable ad
**Rationale**: Landing page is not converting traffic into leads

**Thresholds**:
- Lead Rate threshold: 25% (ideal)
- Target CPL: $15 (Phase 1), adjust based on baseline
- Maximum CPL: 2x Target CPL = $30
- Minimum page views before evaluation: 20 page views

---

### Rule 1.4: Video Creative - Low Retention
**Condition**: Creative is video AND 3-second video views / Impressions < 40%
**Action**: Flag for creative improvement (don't disable if CPL is good)
**Rationale**: Low hook retention indicates creative fatigue or poor hook

**Thresholds**:
- 3-second retention: 40% (industry standard)
- 25% video view rate: 30% (secondary metric)
- Only evaluate if ad has 1,000+ impressions

---

## 2. FUNNEL LEAK IDENTIFICATION

### Leak 2.1: Click-to-Page Leak (Connect Rate Issue)
**Symptoms**: 
- CPC is good (< $2.00)
- CTR is good (> 2%)
- Connect Rate < 80% (Landing Page Views / Link Clicks)

**Root Cause**: Landing page speed issue
**Action**: Optimize landing page load time, check mobile performance

---

### Leak 2.2: Page-to-Lead Leak (Landing Page Issue)
**Symptoms**:
- CPC is good (< $2.00)
- CTR is good (> 2%)
- Connect Rate is good (> 80%)
- Lead Rate < 25% (Leads / Link Clicks)

**Root Cause**: Landing page conversion issue
**Action**: Optimize landing page copy, CTA, form, or offer clarity

---

### Leak 2.3: Lead-to-Purchase Leak (Offer/Nurture Issue)
**Symptoms**:
- Lead Rate is good (> 25%)
- CPC is good (< $2.00)
- CTR is good (> 2%)
- Purchase Rate < 10% (Purchases / Link Clicks)

**Root Cause**: VIP offer not compelling or email nurture sequence weak
**Action**: Optimize VIP sales page, improve email sequence, test pricing/bonuses

---

## 3. PERFORMANCE BENCHMARKS

### Phase 1 Baseline Targets (Dec 15-25)
- **CPL (Cost Per Lead)**: $15 target, $30 maximum
- **CPP (Cost Per Purchase)**: $150 target (assuming 10% conversion rate)
- **CPC (Cost Per Click)**: $2.00 target
- **CTR (Click-Through Rate)**: 2% minimum
- **Connect Rate**: 80% minimum (Landing Page Views / Link Clicks)
- **Lead Rate**: 25% target (Leads / Link Clicks)
- **Purchase Rate**: 10% target (Purchases / Leads)
- **3-Second Video Retention**: 40% minimum
- **25% Video View Rate**: 30% minimum

### Phase 2 Scale Targets (Dec 26-Jan 1)
- Maintain Phase 1 CPL/CPP targets despite 10x spend increase
- Allow 10-20% CPA inflation during first 2 days of scale
- Monitor frequency: Keep < 2.5 to avoid creative fatigue

---

## 4. WHEN TO KEEP (DON'T DISABLE)

### Rule 4.1: Good CPL Despite Bad Metrics
**Condition**: CPL is at or below target BUT CPM/CPC/CTR are poor
**Action**: Keep ad running
**Rationale**: Final conversion metric is what matters - ad is profitable

---

### Rule 4.2: Learning Phase Protection
**Condition**: Ad set is in learning phase (< 50 conversions in 7 days)
**Action**: Don't make changes unless performance is catastrophically bad (CPL > 3x target)
**Rationale**: Algorithm needs time to optimize - premature changes reset learning

---

### Rule 4.3: High-Intent Audiences
**Condition**: Ad is targeting high-value audiences (VIP buyers, engaged leads, lookalikes of purchasers)
**Action**: Give 20% more budget tolerance before disabling
**Rationale**: Higher quality audiences may have higher CPCs but better LTV

---

## 5. CREATIVE REFRESH RULES

### Rule 5.1: Fatigue Detection
**Symptoms**:
- CPL increasing by 30%+ over 3-day period
- CTR declining by 25%+ over 3-day period
- Frequency > 2.5

**Action**: Add 1-2 new creative variations (doesn't reset learning)
**Timing**: Dec 26 (1-2 refreshed assets), Dec 29 (light refresh if needed)

---

### Rule 5.2: Winner Scaling
**Condition**: Creative has CPL < 50% of target AND spending < $500/day
**Action**: Duplicate ad into new ad set with higher budget
**Rationale**: Scale winners without disrupting original learning

---

## 6. BUDGET ALLOCATION RULES

### Rule 6.1: Budget Redistribution
**Frequency**: Daily review
**Action**: 
- Shift budget from high-CPL ad sets (> 1.5x target) to low-CPL ad sets (< 0.8x target)
- Don't kill ad sets in learning phase unless CPL > 3x target

---

### Rule 6.2: Inflated Budget Strategy (Phase 2)
**Setup**: Set campaign budgets to $180-200K/day while targeting $150K/day actual spend
**Rationale**: Reduces throttling, unlocks more efficient delivery during Q5 surge
**Monitor**: Ensure actual spend stays near $150K/day target

---

## 7. DIAGNOSTIC PRIORITY (When CPL is High)

When Cost Per Lead is above target, diagnose in this order:

1. **Check CPC** (Cost Per Click)
   - If CPC > $2.00 → Creative or audience issue
   - Action: Test new creative angles or refine audience

2. **Check CTR** (Click-Through Rate)
   - If CTR < 2% → Creative hook is weak
   - Action: Improve thumbnail, first 3 seconds, headline

3. **Check CPM** (Cost Per 1000 Impressions)
   - If CPM > $20 → Audience saturation or high competition
   - Action: Expand audience, test new targeting, or pause for 24-48h

4. **Check Connect Rate** (Landing Page Views / Link Clicks)
   - If < 80% → Landing page speed issue
   - Action: Optimize page load time

5. **Check Lead Rate** (Leads / Link Clicks)
   - If < 25% → Landing page conversion issue
   - Action: Optimize copy, CTA, form, offer

---

## 8. ADDITIONAL RULES TO DEFINE

### 8.1: Audience Saturation Detection
**Question**: How do we detect when an audience is saturated?
**Proposed Rule**: 
- Frequency > 3.0 for 2+ consecutive days
- CPL increasing 40%+ while frequency rises
**Action**: Pause ad set for 48 hours or expand audience

---

### 8.2: Time-of-Day Performance
**Question**: Should we analyze performance by hour/day-of-week?
**Proposed Rule**:
- Track CPL by hour and day-of-week
- If certain hours consistently have CPL > 2x average, consider dayparting
**Action**: Implement ad scheduling for poor-performing time slots

---

### 8.3: Device Performance
**Question**: Should we separate mobile vs desktop performance?
**Proposed Rule**:
- If mobile CPL > 1.5x desktop CPL consistently
**Action**: Create separate ad sets for mobile with mobile-optimized creatives

---

### 8.4: Placement Performance
**Question**: Should we exclude low-performing placements?
**Proposed Rule**:
- If specific placement (Instagram Stories, Audience Network, etc.) has CPL > 2x average
**Action**: Exclude placement or create placement-specific creative

---

### 8.5: Age/Gender Performance
**Question**: Should we segment by demographics?
**Proposed Rule**:
- After 7 days, analyze CPL by age group and gender
- If specific segment has CPL < 0.7x average, create dedicated ad set
**Action**: Create high-performing demographic segments

---

### 8.6: Geographic Performance
**Question**: Should we analyze by state/region?
**Proposed Rule**:
- Track CPL by state
- If certain states consistently have CPL > 2x average, consider exclusion
**Action**: Exclude poor-performing geos or adjust bids

---

### 8.7: Landing Page A/B Test Detection
**Question**: How do we know which landing page variant is winning?
**Proposed Rule**:
- Compare conversion rates between LP variants with same traffic source
- Minimum 100 visitors per variant before declaring winner
**Action**: Redirect 100% traffic to winning variant

---

### 8.8: Email Sequence Performance
**Question**: How do we track VIP conversion by email sequence?
**Proposed Rule**:
- Track purchase rate by lead source and days since opt-in
- If Day 1-3 purchase rate < 5%, email sequence needs optimization
**Action**: Optimize email copy, timing, or offer presentation

---

### 8.9: Lead Quality Scoring
**Question**: Should we track lead quality beyond just conversion?
**Proposed Rule**:
- Use List Defender tags (Green/Yellow/Red) to score lead quality
- If ad source has > 40% Red leads, flag for review
**Action**: Adjust targeting to improve lead quality

---

### 8.10: Cross-Campaign Interference
**Question**: How do we prevent campaigns from competing against each other?
**Proposed Rule**:
- Monitor audience overlap between campaigns
- If overlap > 30%, consolidate or adjust targeting
**Action**: Use campaign budget optimization or consolidate campaigns

---

## 9. AUTOMATION PRIORITIES

### High Priority (Implement First)
1. ✅ Ad-level disable rules (1.1, 1.2, 1.3)
2. ✅ Funnel leak identification (2.1, 2.2, 2.3)
3. ✅ Creative fatigue detection (5.1)
4. ✅ Daily performance alerts

### Medium Priority
5. ⏳ Budget redistribution suggestions (6.1)
6. ⏳ Audience saturation detection (8.1)
7. ⏳ Time-of-day analysis (8.2)
8. ⏳ Device performance segmentation (8.3)

### Low Priority (Manual Review)
9. 📋 Placement optimization (8.4)
10. 📋 Demographic segmentation (8.5)
11. 📋 Geographic optimization (8.6)
12. 📋 Landing page A/B test analysis (8.7)

---

## 10. AGENT OUTPUT FORMAT

The optimization agent should provide daily recommendations in this format:

```
🚨 CRITICAL ACTIONS (Disable Now)
- Ad ID 123456: No clicks after $15 spend (Rule 1.1)
- Ad ID 789012: Connect rate 35% (Rule 1.2)

⚠️ PERFORMANCE WARNINGS (Review Today)
- Ad Set "Lookalike 1%": CPL $22 (47% above target)
- Creative "VSL v3": 3-sec retention 28% (below 40% threshold)

🔍 FUNNEL LEAKS DETECTED
- Leak 2.2 (Page-to-Lead): Lead rate 18% across all ads → Optimize LP
- Leak 2.3 (Lead-to-Purchase): Purchase rate 6% → Improve VIP offer

✅ TOP PERFORMERS (Scale These)
- Ad ID 345678: CPL $9.50 (37% below target), spending $200/day
- Ad Set "Engaged Leads": CPL $11, ROAS 4.2x

💡 OPTIMIZATION SUGGESTIONS
- Add 2 new creative variations to combat fatigue (Frequency 2.8)
- Shift $2K/day budget from Ad Set A (CPL $25) to Ad Set B (CPL $12)
```

---

## Next Steps

1. ✅ Review and approve these rules
2. ⏳ Define missing thresholds (8.1-8.10)
3. ⏳ Integrate Google Analytics for landing page metrics
4. ⏳ Integrate Google Ads for cross-platform analysis
5. ⏳ Build agent with LLM-powered recommendations
6. ⏳ Create dashboard UI for daily optimization reports
