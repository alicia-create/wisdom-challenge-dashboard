# 📋 Campaign Optimization Rules v3

**Last Updated**: December 16, 2025  
**Campaign**: 31DWC2026 (31-Day Wisdom Challenge 2026)

---

## Campaign Context

**Budget**: $1.2M total (Dec 15 - Jan 1)
- **Phase 1** (Dec 15-25): $150K total
  - Starting budget: $3,500-$4,000/day
  - Daily increase: 20% on Meta platform
  - Google: Support campaign (separate analysis)
- **Phase 2** (Dec 26-Jan 1): $150K/day ($1.05M total) - Scale with inflated budgets

**Campaign Scope**:
- **Analyze ONLY**: SALES and LEADS campaigns
- **Exclude**: Content, Retargeting, Other campaign types
- **Platform Separation**: Analyze Meta and Google separately

**Strategy**: 
- Max Conversion Quality optimization
- 1-2 consolidated Lead campaigns
- Broad/Advantage+ Audiences (no manual segmentation)
- Advantage+ Placements (no manual placement optimization)
- Creative-driven performance + algorithm intelligence

**Analysis Window**:
- **Primary**: Yesterday's performance
- **Trend Analysis**: 3-7 day rolling window
- **DO NOT**: Analyze all-time data (causes noise and outdated insights)

---

## Primary Performance Targets

### Cost Targets (Priority Metrics)

**Cost Per Purchase (CPP)**:
- 🟢 **Excellent**: ≤ $30
- 🟡 **Great**: $31-$60
- 🟠 **Good**: $61-$90
- 🔴 **Poor**: > $90

**Cost Per Lead (CPL)**:
- 🟢 **Excellent**: ≤ $3
- 🟡 **Great**: $4-$6
- 🟠 **Good**: $7-$9
- 🔴 **Poor**: > $9

### Conversion Rate Targets

**Click-to-Purchase Rate**: 7% target (Purchases / Link Clicks)
- This is the PRIMARY conversion metric
- Combines lead generation + purchase conversion

**Purchase Rate**: 12% target (Purchases / Leads)
- Last year: 11.58%
- Target improvement: +0.42pp
- Focus: VIP offer optimization and email nurture

**Lead Rate**: 25% minimum (Leads / Link Clicks)
- Landing page conversion baseline
- Below 25% indicates landing page issues

**Connect Rate**: 80% minimum (Landing Page Views / Link Clicks)
- Measures page load speed and relevance
- Below 80% indicates technical issues

---

## 1. AD-LEVEL OPTIMIZATION RULES

### 🚨 3-Strike Flag System

**IMPORTANT**: Before recommending to disable any ad, evaluate performance trend:

**Strike 1** (Day 1 poor performance):
- 🚩 **FLAG**: Monitor closely
- **Action**: Add to watchlist, no changes yet
- **Reason**: Could be temporary fluctuation

**Strike 2** (Day 2 consecutive poor performance):
- 🚩🚩 **CRITICAL FLAG**: High attention
- **Action**: Prepare backup creative, monitor hourly
- **Reason**: Pattern emerging, but not conclusive

**Strike 3** (Day 3 consecutive poor performance):
- ❌ **RECOMMEND DISABLE**: Clear downtrend
- **Action**: Disable ad and document reason
- **Reason**: Consistent underperformance confirmed

**Exception**: If ad had 3+ days of good performance before decline, extend to 4-5 days before disabling.

---

### Rule 1.1: No Engagement - Flag System
**Condition**: Ad has NO clicks AND spend > $10

**Day 1**: 🚩 FLAG - "No engagement after $10 spend"
**Day 2**: 🚩🚩 FLAG - "No engagement for 2 days"
**Day 3**: ❌ DISABLE - "Zero engagement after 3 days"

**Rationale**: Not generating any engagement despite sufficient budget

**Thresholds**:
- Minimum spend before evaluation: $10
- Minimum time before evaluation: 24 hours

---

### Rule 1.2: Low Connect Rate - Flag System
**Condition**: Ad has clicks BUT Landing Page Views / Link Clicks < 50%

**Day 1**: 🚩 FLAG - "Low connect rate (< 50%)"
**Day 2**: 🚩🚩 FLAG - "Connect rate still low"
**Day 3**: ❌ DISABLE - "Persistent connect rate issue"

**Rationale**: Traffic clicking but not reaching landing page (broken link, slow load, poor relevance)

**Thresholds**:
- Connect Rate threshold: 50%
- Minimum clicks before evaluation: 10 clicks

**EXCEPTION**: If CPP is within target ($30-$90), keep ad running despite low connect rate.

---

### Rule 1.3: Low Lead Rate - Flag System
**Condition**: Ad has page views BUT (Leads / Link Clicks) < 25%

**Day 1**: 🚩 FLAG - "Low lead rate (< 25%)"
**Day 2**: 🚩🚩 FLAG - "Lead rate not improving"
**Day 3**: ❌ DISABLE - "Consistent low lead rate"

**Rationale**: Landing page not converting traffic into leads

**Thresholds**:
- Lead Rate threshold: 25%
- Minimum page views before evaluation: 20 page views

**EXCEPTION**: If CPP is within target ($30-$90), keep ad running despite low lead rate.

---

### Rule 1.4: High Cost Per Purchase - Flag System
**Condition**: CPP > $90 (above "Good" threshold)

**Day 1**: 🚩 FLAG - "CPP above target ($90+)"
**Day 2**: 🚩🚩 FLAG - "CPP still high"
**Day 3**: ❌ DISABLE - "Consistently expensive purchases"

**Rationale**: Ad is not cost-effective for purchase generation

**Thresholds**:
- CPP threshold: $90
- Minimum purchases before evaluation: 3 purchases

---

### Rule 1.5: Video Creative - Low Retention
**Condition**: Creative is video AND 3-second video views / Impressions < 40%

**Action**: 🚩 FLAG for creative improvement (don't disable if Purchase Rate is good)

**Rationale**: Low hook retention indicates creative fatigue or poor hook

**Thresholds**:
- 3-second retention: 40% (industry standard)
- 25% video view rate: 30% (secondary metric)
- Only evaluate if ad has 1,000+ impressions

**EXCEPTION**: If Click-to-Purchase Rate ≥ 7% OR CPP ≤ $90, keep ad running.

---

## 2. FUNNEL LEAK IDENTIFICATION (Priority Order)

### 🔴 Leak 2.1: Lead-to-Purchase Leak (HIGHEST PRIORITY)
**Symptoms**: 
- Purchase Rate < 12% (Purchases / Leads)
- Ad has sufficient leads (10+) and time (3+ days)

**Root Cause**: VIP offer not compelling or email nurture sequence weak

**Impact**: Losing 88% of leads after they opt-in

**Action**: 
1. Optimize VIP sales page (copy, bonuses, urgency)
2. Improve email sequence (timing, copy, CTAs)
3. Test pricing/payment plans
4. Add social proof/testimonials
5. Improve urgency/scarcity messaging
6. A/B test different VIP offers

**Expected Result**: Increase Purchase Rate from current to 12%+ target

---

### 🟠 Leak 2.2: Click-to-Purchase Leak
**Symptoms**: 
- Click-to-Purchase Rate < 7% (Purchases / Link Clicks)
- Ad has sufficient clicks (50+) and time (3+ days)

**Diagnostic Tree**:
1. Check Purchase Rate (Purchases / Leads)
   - If < 12% → VIP offer/nurture issue (Leak 2.1)
   - If ≥ 12% → Lead generation issue (check Leak 2.3 or 2.4)

2. Check Lead Rate (Leads / Link Clicks)
   - If < 25% → Landing page conversion issue (Leak 2.3)
   - If ≥ 25% → Connect rate issue (Leak 2.4)

**Action**: Follow diagnostic tree to identify root cause

---

### 🟡 Leak 2.3: Click-to-Lead Leak (Landing Page Conversion Issue)
**Symptoms**:
- Connect Rate is good (> 80%)
- Lead Rate < 25% (Leads / Link Clicks)

**Root Cause**: Landing page conversion issue

**Impact**: Traffic reaching page but not converting to leads

**Action**: 
1. Optimize landing page copy, headline, value proposition
2. Improve CTA clarity and placement
3. Simplify form (reduce fields)
4. Test different lead magnets/offers
5. Run VWO A/B test
6. Check mobile vs desktop conversion rates
7. Test different page layouts

**Expected Result**: Increase Lead Rate to 25%+ target

---

### 🟢 Leak 2.4: Click-to-Page Leak (Connect Rate Issue)
**Symptoms**: 
- Connect Rate < 80% (Landing Page Views / Link Clicks)
- CTR is good (> 2%)

**Root Cause**: Landing page speed issue or broken tracking

**Impact**: Losing 20%+ of clicks before they even see the page

**Action**: 
1. Optimize landing page load time (target < 2 seconds)
2. Check mobile performance (often slower than desktop)
3. Verify Facebook Pixel is firing correctly
4. Test page on different devices/networks
5. Compress images and reduce page weight
6. Use CDN for faster delivery

**Expected Result**: Increase Connect Rate to 80%+ target

---

## 3. PERFORMANCE BENCHMARKS

### Phase 1 Baseline Targets (Dec 15-25)

**Conversion Rates** (Fixed):
- **CTR (Click-Through Rate)**: 2% minimum
- **Connect Rate**: 80% minimum (Landing Page Views / Link Clicks)
- **Lead Rate**: 25% target (Leads / Link Clicks)
- **Purchase Rate**: 12% target (Purchases / Leads)
- **Click-to-Purchase Rate**: 7% target (Purchases / Link Clicks)

**Costs**:
- **CPC (Cost Per Click)**: Varies by ad - monitor trend, not absolute value
- **CPL (Cost Per Lead)**: Excellent ≤$3 | Great $4-6 | Good $7-9 | Poor >$9
- **CPP (Cost Per Purchase)**: Excellent ≤$30 | Great $31-60 | Good $61-90 | Poor >$90

**Creative Performance**:
- **3-Second Video Retention**: 40% minimum
- **25% Video View Rate**: 30% minimum
- **Frequency**: Keep < 2.5 to avoid creative fatigue

### Phase 2 Scale Targets (Dec 26-Jan 1)
- Maintain Phase 1 conversion rates despite 10x spend increase
- Allow 10-20% CPP inflation during first 2 days of scale
- Monitor frequency: Keep < 2.5 to avoid creative fatigue

---

## 4. DIAGNOSTIC PRIORITY (When Click-to-Purchase Rate < 7%)

When **Click-to-Purchase Rate** is below 7%, diagnose in this order:

### Priority 1: Purchase Rate (Purchases / Leads)
- If < 12% → VIP offer or email nurture issue (Leak 2.1)
- **Action**: Optimize VIP sales page and email sequence
- **Impact**: HIGHEST - affects all leads

### Priority 2: Lead Rate (Leads / Link Clicks)
- If < 25% → Landing page conversion issue (Leak 2.3)
- **Action**: Optimize landing page copy, CTA, form
- **Impact**: HIGH - affects all page visitors

### Priority 3: Connect Rate (Landing Page Views / Link Clicks)
- If < 80% → Landing page speed issue (Leak 2.4)
- **Action**: Optimize page load time, check mobile performance
- **Impact**: MEDIUM - technical issue

### Priority 4: CPC (Cost Per Click)
- If CPC trending up 30%+ over 3 days → Creative or audience fatigue
- **Action**: Add new creative variations, check frequency
- **Impact**: MEDIUM - affects ad efficiency

### Priority 5: CTR (Click-Through Rate)
- If CTR < 2% → Creative hook is weak
- **Action**: Improve thumbnail, first 3 seconds, headline
- **Impact**: LOW - affects ad reach

### Priority 6: CPM (Cost Per 1000 Impressions)
- If CPM > $20 → Audience saturation or high competition
- **Action**: Monitor frequency, consider creative refresh
- **Impact**: LOW - market condition

---

## 5. WHEN TO KEEP (DON'T DISABLE)

### Rule 5.1: Good CPP Overrides Other Metrics
**Condition**: CPP is within target range ($30-$90) BUT other metrics (Connect Rate, Lead Rate, CTR) are poor

**Action**: ✅ KEEP ad running

**Rationale**: Final cost efficiency is what matters - ad is profitable despite poor intermediary metrics. The ad may have unique audience targeting or creative that converts differently.

**Example**: 
- Connect Rate: 60% (below 80% target) ❌
- Lead Rate: 20% (below 25% target) ❌
- CPP: $45 (within $30-$90 range) ✅
- **Decision**: KEEP running

---

### Rule 5.2: Learning Phase Protection
**Condition**: Ad set is in learning phase (< 50 conversions in 7 days)

**Action**: ✅ KEEP ad running (do not disable or edit)

**Rationale**: Meta's algorithm needs 50 conversions to optimize. Disabling during learning resets progress.

**Exceptions**: 
- Zero engagement after 3 days (Rule 1.1)
- Broken link / technical issue (Rule 1.2)

---

### Rule 5.3: Recent Good Performance
**Condition**: Ad had 3+ days of good performance (CPP < $90) before recent decline

**Action**: 🚩 FLAG but extend evaluation to 4-5 days before disabling

**Rationale**: Temporary dip may be due to external factors (weekend, holiday, competitor activity). Give proven performers more time to recover.

---

### Rule 5.4: High Purchase Volume Despite High CPP
**Condition**: CPP > $90 BUT ad generates 10+ purchases/day

**Action**: 🚩 FLAG but keep running while optimizing

**Rationale**: High volume indicates strong creative-market fit. Focus on optimization rather than disabling.

**Action Plan**:
1. Duplicate ad set with lower budget to test optimization
2. Test different audiences
3. Adjust bidding strategy
4. Keep original running while testing

---

## 6. PLATFORM-SPECIFIC RULES

### Meta Ads (Primary Platform)

**Budget Management**:
- Phase 1: Start $3,500-$4,000/day
- Daily increase: 20% (compound)
- Example: Day 1: $4,000 → Day 2: $4,800 → Day 3: $5,760

**Campaign Focus**:
- SALES campaigns (primary)
- LEADS campaigns (secondary)
- Exclude: Content, Retargeting, Other

**Optimization**:
- Use Max Conversion Quality
- Advantage+ Audiences
- Advantage+ Placements
- Let algorithm optimize

**Frequency Management**:
- Keep frequency < 2.5
- If frequency > 2.5 for 2+ days → Add new creative or expand audience

---

### Google Ads (Support Platform)

**Role**: Support campaign to Meta (not primary driver)

**Budget**: Separate analysis from Meta (don't combine metrics)

**Reporting**: 
- Report Meta and Google separately in all analyses
- Don't compare CPP/CPL directly (different audience intent)
- Focus on incremental contribution

**Optimization**:
- Lower priority than Meta
- Focus on search intent keywords
- Complement Meta's awareness campaigns

---

## 7. DAILY ANALYSIS FRAMEWORK

### Yesterday's Performance (Primary)

**What to Analyze**:
1. CPP by ad (flag if > $90)
2. CPL by ad (flag if > $9)
3. Click-to-Purchase Rate (flag if < 7%)
4. Purchase Rate (flag if < 12%)
5. New flags vs. existing flags (track strike count)

**Output**:
- List of ads with new flags (Strike 1)
- List of ads with critical flags (Strike 2)
- List of ads to disable (Strike 3)

---

### 3-7 Day Trend Analysis (Secondary)

**What to Analyze**:
1. CPP trend (increasing, stable, decreasing)
2. Volume trend (purchases/day)
3. Frequency trend (creative fatigue indicator)
4. Budget pacing (on track for $150K Phase 1 total?)

**Output**:
- Overall campaign health (green/yellow/red)
- Trend direction (improving/stable/declining)
- Budget forecast (will we hit target?)

---

### DO NOT Analyze

❌ All-time data (causes noise)
❌ Data older than 7 days (outdated)
❌ Content/Retargeting campaigns (out of scope)
❌ Combined Meta + Google metrics (analyze separately)

---

## 8. RECOMMENDATION FRAMEWORK

### Critical Actions (Immediate)
- 🔴 Disable ads with Strike 3
- 🔴 Fix broken links (Connect Rate < 50%)
- 🔴 Address zero engagement ads (Strike 3)

### High Priority (Within 24h)
- 🟠 Investigate Strike 2 flags
- 🟠 Optimize high CPP ads ($90+)
- 🟠 Address funnel leaks (Priority 1-2)

### Medium Priority (Within 48h)
- 🟡 Monitor Strike 1 flags
- 🟡 Test creative variations for fatigue
- 🟡 Optimize landing pages (Leak 2.3)

### Low Priority (Ongoing)
- 🟢 A/B test VIP offers
- 🟢 Expand creative library
- 🟢 Document learnings in Ads Diary

---

## 9. META ADS BEST PRACTICES COMPLIANCE

### ✅ Aligned with Meta Best Practices

1. **Max Conversion Quality**: Using Meta's recommended optimization
2. **Advantage+ Audiences**: Letting algorithm find best audiences
3. **Advantage+ Placements**: Automatic placement optimization
4. **Learning Phase Protection**: Not editing during learning (50 conversions)
5. **Frequency Management**: Keeping < 2.5 to avoid fatigue
6. **Budget Increases**: 20% daily (within Meta's 20-30% recommendation)

### ⚠️ Custom Adjustments (Justified)

1. **3-Strike System**: More conservative than Meta's immediate disable
   - **Justification**: Reduces false positives, protects proven performers
   
2. **CPP Override Rule**: Keep ads with good CPP despite poor intermediary metrics
   - **Justification**: Final conversion efficiency matters more than funnel metrics
   
3. **7-Day Analysis Window**: Shorter than Meta's 28-day default
   - **Justification**: Campaign is only 17 days (Phase 1), need faster iteration

### ❌ No Conflicts Detected

All rules align with or improve upon Meta's official recommendations. No practices that would harm campaign performance or violate Meta policies.

---

## 10. CHANGE LOG

### v3 (December 16, 2025)
- ✅ Added 3-strike flag system before disabling
- ✅ Updated Purchase Rate target: 40% → 12%
- ✅ Updated Click-to-Purchase target: 10% → 7%
- ✅ Updated CPP targets: Excellent ≤$30 | Great $31-60 | Good $61-90
- ✅ Updated CPL targets: Excellent ≤$3 | Great $4-6 | Good $7-9
- ✅ Added CPP override rule (Rule 5.1)
- ✅ Reorganized leak priority (Lead-to-Purchase now #1)
- ✅ Added platform-specific rules (Meta vs Google)
- ✅ Added daily analysis framework (yesterday + 3-7 day trends)
- ✅ Specified campaign scope (SALES and LEADS only)
- ✅ Updated Phase 1 budget ($3.5K-4K start, 20% daily increase)
- ✅ Added Meta best practices compliance section

### v2 (December 15, 2025)
- Initial structured rules document
- Defined funnel leak framework
- Established performance benchmarks

---

## 📊 Quick Reference Card

**Primary Targets**:
- Click-to-Purchase: 7%
- Purchase Rate: 12%
- CPP: $30-$90 (Excellent-Good)
- CPL: $3-$9 (Excellent-Good)

**Flag System**:
- Day 1: 🚩 Monitor
- Day 2: 🚩🚩 Critical
- Day 3: ❌ Disable

**Leak Priority**:
1. Lead-to-Purchase (< 12%)
2. Click-to-Purchase (< 7%)
3. Click-to-Lead (< 25%)
4. Click-to-Page (< 80%)

**Override Rules**:
- Good CPP ($30-$90) → Keep running
- Learning phase → Don't touch
- Recent good performance → Extend evaluation

---

**Document Version**: 3.0  
**Effective Date**: December 16, 2025  
**Next Review**: December 26, 2025 (Phase 2 start)
