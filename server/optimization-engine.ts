import { supabase } from "./supabase";
import { randomUUID } from "crypto";

// Campaign filter constants
const CAMPAIGN_NAME_FILTER = "31DWC2026";
const CAMPAIGN_TYPE_FILTERS = ["[SALES]", "[LEADS]"]; // Only SALES and LEADS campaigns

// Optimization thresholds (v3 - Updated Dec 16, 2025)
const THRESHOLDS = {
  // Cost targets
  CPP_EXCELLENT: 30,
  CPP_GREAT: 60,
  CPP_GOOD: 90,
  CPL_EXCELLENT: 3,
  CPL_GREAT: 6,
  CPL_GOOD: 9,
  
  // Conversion rate targets
  MIN_CLICK_TO_PURCHASE: 0.07, // 7% target (v3 update from 10%)
  MIN_PURCHASE_RATE: 0.12, // 12% target (v3 update from 40%)
  MIN_LEAD_RATE: 0.25, // 25% minimum (Leads / Link Clicks)
  MIN_CONNECT_RATE: 0.50, // 50% minimum for flagging (80% is ideal)
  MIN_CTR: 0.02, // 2% minimum
  
  // Video creative
  MIN_VIDEO_RETENTION: 0.4, // 40% minimum (3-second views / Impressions)
  MAX_FREQUENCY: 2.5, // Creative fatigue threshold
  
  // Evaluation thresholds
  MIN_SPEND_NO_CLICKS: 10, // Flag if no clicks after $10 spend
  MIN_CLICKS_FOR_EVALUATION: 10,
  MIN_PAGE_VIEWS_FOR_EVALUATION: 20,
  MIN_IMPRESSIONS_FOR_VIDEO: 1000,
  MIN_PURCHASES_FOR_CPP_EVAL: 3,
};

export interface AdRecommendation {
  id: string;
  recommendation_type: string;
  severity: "critical" | "warning" | "info";
  ad_id: string;
  adset_id: string;
  campaign_id: string;
  title: string;
  description: string;
  action_required: string;
  expected_impact: string;
  metadata: Record<string, any>;
  strike_count?: number; // v3: Track consecutive poor performance days
  platform?: string; // v3: Meta or Google
}

export interface FunnelLeak {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  root_cause: string;
  action_required: string;
  affected_ads: number;
  metrics: Record<string, any>;
  priority: number; // v3: 1 = highest priority
}

export interface FatigueAlert {
  ad_id: string;
  adset_id: string;
  campaign_id: string;
  severity: "warning" | "info";
  title: string;
  description: string;
  metrics: {
    frequency: number;
    cpp_trend: string;
    ctr_trend: string;
  };
}

interface DailyAdMetrics {
  date: string;
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  platform: string; // Meta or Google
  spend: number;
  clicks: number;
  impressions: number;
  link_clicks: number;
  landing_page_views: number;
  leads: number;
  purchases: number;
  cpp: number;
  cpl: number;
  connect_rate: number;
  lead_rate: number;
  purchase_rate: number;
  click_to_purchase_rate: number;
}

/**
 * Calculate strike count for an ad based on last 3 days performance
 * v3: 3-strike system before recommending disable
 */
function calculateStrikeCount(adHistory: DailyAdMetrics[]): number {
  // Sort by date descending (most recent first)
  const sortedHistory = adHistory
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3); // Last 3 days only

  let consecutiveStrikes = 0;
  
  for (const day of sortedHistory) {
    // Check if day was "poor performance"
    const isPoorPerformance = 
      (day.cpp > THRESHOLDS.CPP_GOOD && day.purchases >= THRESHOLDS.MIN_PURCHASES_FOR_CPP_EVAL) ||
      (day.click_to_purchase_rate < THRESHOLDS.MIN_CLICK_TO_PURCHASE && day.link_clicks >= THRESHOLDS.MIN_CLICKS_FOR_EVALUATION) ||
      (day.clicks === 0 && day.spend > THRESHOLDS.MIN_SPEND_NO_CLICKS);
    
    if (isPoorPerformance) {
      consecutiveStrikes++;
    } else {
      // If had a good day, reset strike count (not consecutive)
      break;
    }
  }
  
  return consecutiveStrikes;
}

/**
 * Determine severity based on strike count
 * Strike 1: info (🚩 FLAG)
 * Strike 2: warning (🚩🚩 CRITICAL FLAG)
 * Strike 3+: critical (❌ DISABLE)
 */
function getSeverityFromStrikes(strikes: number): "critical" | "warning" | "info" {
  if (strikes >= 3) return "critical";
  if (strikes === 2) return "warning";
  return "info";
}

/**
 * Get action text based on strike count
 */
function getActionFromStrikes(strikes: number): string {
  if (strikes >= 3) return "Disable ad immediately - 3 consecutive days of poor performance";
  if (strikes === 2) return "Critical flag - Prepare backup creative, monitor hourly";
  return "Flag for monitoring - Watch performance closely";
}

/**
 * FR1: Ad-Level Performance Analysis (v3)
 * Analyze each ad's performance with 3-strike system and CPP override rule
 */
export async function analyzeAdPerformance(): Promise<AdRecommendation[]> {
  const recommendations: AdRecommendation[] = [];

  // Fetch recent ad performance data (last 7 days for trend analysis)
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Filter only SALES and LEADS campaigns
  const filteredAds = ads.filter(ad => 
    CAMPAIGN_TYPE_FILTERS.some(type => ad.campaign_name?.includes(type))
  );

  console.log(`[Optimization Engine] Filtered ${filteredAds.length} ads from ${ads.length} total (SALES + LEADS only)`);

  // Group by ad_id and build daily metrics history
  const adHistoryMap = new Map<string, DailyAdMetrics[]>();

  for (const ad of filteredAds) {
    const adId = ad.ad_id;
    
    // Calculate metrics for this day
    const linkClicks = ad.inline_link_clicks || 0;
    const landingPageViews = ad.landing_page_views || 0;
    const leads = ad.reported_leads || 0;
    const purchases = ad.reported_purchases || 0;
    const spend = ad.spend || 0;
    
    const cpp = purchases > 0 ? spend / purchases : 0;
    const cpl = leads > 0 ? spend / leads : 0;
    const connectRate = linkClicks > 0 ? landingPageViews / linkClicks : 0;
    const leadRate = linkClicks > 0 ? leads / linkClicks : 0;
    const purchaseRate = leads > 0 ? purchases / leads : 0;
    const clickToPurchaseRate = linkClicks > 0 ? purchases / linkClicks : 0;
    
    // Determine platform (Meta or Google)
    const platform = ad.campaign_name?.toLowerCase().includes("google") ? "Google" : "Meta";
    
    const dailyMetrics: DailyAdMetrics = {
      date: ad.date,
      ad_id: adId,
      ad_name: ad.ad_name || "Unknown",
      adset_id: ad.adset_id || "",
      adset_name: ad.adset_name || "",
      campaign_id: ad.campaign_id || "",
      campaign_name: ad.campaign_name || "",
      platform,
      spend,
      clicks: ad.clicks || 0,
      impressions: ad.impressions || 0,
      link_clicks: linkClicks,
      landing_page_views: landingPageViews,
      leads,
      purchases,
      cpp,
      cpl,
      connect_rate: connectRate,
      lead_rate: leadRate,
      purchase_rate: purchaseRate,
      click_to_purchase_rate: clickToPurchaseRate,
    };
    
    if (!adHistoryMap.has(adId)) {
      adHistoryMap.set(adId, []);
    }
    adHistoryMap.get(adId)!.push(dailyMetrics);
  }

  // Analyze each ad with 3-strike system
  for (const [adId, history] of Array.from(adHistoryMap.entries())) {
    // Get most recent day (yesterday)
    const yesterday = history.sort((a: DailyAdMetrics, b: DailyAdMetrics) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    if (!yesterday) continue;
    
    // Calculate strike count
    const strikeCount = calculateStrikeCount(history);
    
    // CPP Override Rule: If CPP is good, keep ad running despite other issues
    const hasgoodCPP = yesterday.cpp > 0 && yesterday.cpp <= THRESHOLDS.CPP_GOOD && 
                        yesterday.purchases >= THRESHOLDS.MIN_PURCHASES_FOR_CPP_EVAL;
    
    // Rule 1.1: No Engagement (3-strike system)
    if (yesterday.clicks === 0 && yesterday.spend > THRESHOLDS.MIN_SPEND_NO_CLICKS) {
      const severity = getSeverityFromStrikes(strikeCount);
      const action = getActionFromStrikes(strikeCount);
      
      recommendations.push({
        id: randomUUID(),
        recommendation_type: strikeCount >= 3 ? "disable_ad" : "flag_ad",
        severity,
        ad_id: yesterday.ad_id,
        adset_id: yesterday.adset_id,
        campaign_id: yesterday.campaign_id,
        platform: yesterday.platform,
        title: `${strikeCount >= 3 ? "❌ DISABLE" : strikeCount === 2 ? "🚩🚩 CRITICAL" : "🚩 FLAG"}: ${yesterday.ad_name} - No Engagement`,
        description: `Ad spent $${yesterday.spend.toFixed(2)} yesterday without any clicks. Strike ${strikeCount}/3.`,
        action_required: action,
        expected_impact: strikeCount >= 3 ? `Save $${yesterday.spend.toFixed(2)}/day in wasted spend` : "Monitor for improvement",
        strike_count: strikeCount,
        metadata: {
          spend: yesterday.spend,
          clicks: yesterday.clicks,
          strike_count: strikeCount,
          days_analyzed: history.length,
        },
      });
      continue; // Skip other rules for this ad
    }

    // Rule 1.2: Low Connect Rate (3-strike system with CPP override)
    if (yesterday.link_clicks >= THRESHOLDS.MIN_CLICKS_FOR_EVALUATION) {
      if (yesterday.connect_rate < THRESHOLDS.MIN_CONNECT_RATE) {
        // CPP Override: If CPP is good, just flag (don't disable)
        if (hasgoodCPP) {
          recommendations.push({
            id: randomUUID(),
            recommendation_type: "flag_ad",
            severity: "info",
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `✅ KEEP (Good CPP): ${yesterday.ad_name} - Low Connect Rate`,
            description: `Connect rate is ${(yesterday.connect_rate * 100).toFixed(1)}% (below 50%), BUT CPP is $${yesterday.cpp.toFixed(2)} (within target). Keep running.`,
            action_required: "Monitor connect rate but keep ad active due to good CPP",
            expected_impact: "Ad is profitable despite low connect rate",
            strike_count: 0, // Override resets strikes
            metadata: {
              connect_rate: yesterday.connect_rate,
              cpp: yesterday.cpp,
              cpp_override: true,
            },
          });
        } else {
          const severity = getSeverityFromStrikes(strikeCount);
          const action = getActionFromStrikes(strikeCount);
          
          recommendations.push({
            id: randomUUID(),
            recommendation_type: strikeCount >= 3 ? "disable_ad" : "flag_ad",
            severity,
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `${strikeCount >= 3 ? "❌ DISABLE" : strikeCount === 2 ? "🚩🚩 CRITICAL" : "🚩 FLAG"}: ${yesterday.ad_name} - Low Connect Rate`,
            description: `Connect rate is ${(yesterday.connect_rate * 100).toFixed(1)}% (below 50%). Users clicking but not reaching landing page. Strike ${strikeCount}/3.`,
            action_required: action,
            expected_impact: strikeCount >= 3 ? "Stop wasting budget on broken traffic flow" : "Monitor for improvement",
            strike_count: strikeCount,
            metadata: {
              connect_rate: yesterday.connect_rate,
              link_clicks: yesterday.link_clicks,
              landing_page_views: yesterday.landing_page_views,
              strike_count: strikeCount,
            },
          });
        }
        continue;
      }
    }

    // Rule 1.3: Low Lead Rate (3-strike system with CPP override)
    if (yesterday.landing_page_views >= THRESHOLDS.MIN_PAGE_VIEWS_FOR_EVALUATION) {
      if (yesterday.lead_rate < THRESHOLDS.MIN_LEAD_RATE) {
        // CPP Override
        if (hasgoodCPP) {
          recommendations.push({
            id: randomUUID(),
            recommendation_type: "flag_ad",
            severity: "info",
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `✅ KEEP (Good CPP): ${yesterday.ad_name} - Low Lead Rate`,
            description: `Lead rate is ${(yesterday.lead_rate * 100).toFixed(1)}% (below 25%), BUT CPP is $${yesterday.cpp.toFixed(2)} (within target). Keep running.`,
            action_required: "Monitor lead rate but keep ad active due to good CPP",
            expected_impact: "Ad is profitable despite low lead rate",
            strike_count: 0,
            metadata: {
              lead_rate: yesterday.lead_rate,
              cpp: yesterday.cpp,
              cpp_override: true,
            },
          });
        } else {
          const severity = getSeverityFromStrikes(strikeCount);
          const action = getActionFromStrikes(strikeCount);
          
          recommendations.push({
            id: randomUUID(),
            recommendation_type: strikeCount >= 3 ? "disable_ad" : "flag_ad",
            severity,
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `${strikeCount >= 3 ? "❌ DISABLE" : strikeCount === 2 ? "🚩🚩 CRITICAL" : "🚩 FLAG"}: ${yesterday.ad_name} - Low Lead Rate`,
            description: `Lead rate is ${(yesterday.lead_rate * 100).toFixed(1)}% (below 25%). Landing page not converting. Strike ${strikeCount}/3.`,
            action_required: action,
            expected_impact: strikeCount >= 3 ? "Stop wasting budget on poor-converting traffic" : "Monitor for improvement",
            strike_count: strikeCount,
            metadata: {
              lead_rate: yesterday.lead_rate,
              leads: yesterday.leads,
              link_clicks: yesterday.link_clicks,
              strike_count: strikeCount,
            },
          });
        }
        continue;
      }
    }

    // Rule 1.4: High CPP (3-strike system)
    if (yesterday.purchases >= THRESHOLDS.MIN_PURCHASES_FOR_CPP_EVAL) {
      if (yesterday.cpp > THRESHOLDS.CPP_GOOD) {
        const severity = getSeverityFromStrikes(strikeCount);
        const action = getActionFromStrikes(strikeCount);
        
        const cppLevel = yesterday.cpp > THRESHOLDS.CPP_GOOD ? "Poor" : 
                         yesterday.cpp > THRESHOLDS.CPP_GREAT ? "Good" :
                         yesterday.cpp > THRESHOLDS.CPP_EXCELLENT ? "Great" : "Excellent";
        
        recommendations.push({
          id: randomUUID(),
          recommendation_type: strikeCount >= 3 ? "disable_ad" : "flag_ad",
          severity,
          ad_id: yesterday.ad_id,
          adset_id: yesterday.adset_id,
          campaign_id: yesterday.campaign_id,
          platform: yesterday.platform,
          title: `${strikeCount >= 3 ? "❌ DISABLE" : strikeCount === 2 ? "🚩🚩 CRITICAL" : "🚩 FLAG"}: ${yesterday.ad_name} - High CPP`,
          description: `CPP is $${yesterday.cpp.toFixed(2)} (${cppLevel} - above $${THRESHOLDS.CPP_GOOD} target). Strike ${strikeCount}/3.`,
          action_required: action,
          expected_impact: strikeCount >= 3 ? `Save budget by disabling expensive ad` : "Monitor for improvement",
          strike_count: strikeCount,
          metadata: {
            cpp: yesterday.cpp,
            cpp_level: cppLevel,
            purchases: yesterday.purchases,
            spend: yesterday.spend,
            strike_count: strikeCount,
            targets: {
              excellent: THRESHOLDS.CPP_EXCELLENT,
              great: THRESHOLDS.CPP_GREAT,
              good: THRESHOLDS.CPP_GOOD,
            },
          },
        });
      }
    }

    // Rule 1.5: Low Click-to-Purchase Rate (3-strike system with CPP override)
    if (yesterday.link_clicks >= THRESHOLDS.MIN_CLICKS_FOR_EVALUATION) {
      if (yesterday.click_to_purchase_rate < THRESHOLDS.MIN_CLICK_TO_PURCHASE) {
        // CPP Override
        if (hasgoodCPP) {
          recommendations.push({
            id: randomUUID(),
            recommendation_type: "flag_ad",
            severity: "info",
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `✅ KEEP (Good CPP): ${yesterday.ad_name} - Low Click-to-Purchase`,
            description: `Click-to-Purchase is ${(yesterday.click_to_purchase_rate * 100).toFixed(1)}% (below 7%), BUT CPP is $${yesterday.cpp.toFixed(2)} (within target). Keep running.`,
            action_required: "Monitor conversion rate but keep ad active due to good CPP",
            expected_impact: "Ad is profitable despite low conversion rate",
            strike_count: 0,
            metadata: {
              click_to_purchase_rate: yesterday.click_to_purchase_rate,
              cpp: yesterday.cpp,
              cpp_override: true,
            },
          });
        } else {
          const severity = getSeverityFromStrikes(strikeCount);
          const action = getActionFromStrikes(strikeCount);
          
          recommendations.push({
            id: randomUUID(),
            recommendation_type: strikeCount >= 3 ? "disable_ad" : "flag_ad",
            severity,
            ad_id: yesterday.ad_id,
            adset_id: yesterday.adset_id,
            campaign_id: yesterday.campaign_id,
            platform: yesterday.platform,
            title: `${strikeCount >= 3 ? "❌ DISABLE" : strikeCount === 2 ? "🚩🚩 CRITICAL" : "🚩 FLAG"}: ${yesterday.ad_name} - Low Click-to-Purchase`,
            description: `Click-to-Purchase rate is ${(yesterday.click_to_purchase_rate * 100).toFixed(1)}% (below 7% target). Strike ${strikeCount}/3.`,
            action_required: action,
            expected_impact: strikeCount >= 3 ? "Stop wasting budget on low-converting traffic" : "Monitor for improvement",
            strike_count: strikeCount,
            metadata: {
              click_to_purchase_rate: yesterday.click_to_purchase_rate,
              purchases: yesterday.purchases,
              link_clicks: yesterday.link_clicks,
              strike_count: strikeCount,
            },
          });
        }
      }
    }
  }

  console.log(`[Optimization Engine] Generated ${recommendations.length} recommendations`);
  return recommendations;
}

/**
 * FR2: Funnel Leak Detection (v3 - Reorganized priority)
 * Priority 1: Lead-to-Purchase (HIGHEST)
 * Priority 2: Click-to-Purchase
 * Priority 3: Click-to-Lead
 * Priority 4: Click-to-Page
 */
export async function detectFunnelLeaks(): Promise<FunnelLeak[]> {
  const leaks: FunnelLeak[] = [];

  // Fetch aggregated campaign metrics (last 7 days)
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Filter only SALES and LEADS campaigns
  const filteredAds = ads.filter(ad => 
    CAMPAIGN_TYPE_FILTERS.some(type => ad.campaign_name?.includes(type))
  );

  // Aggregate metrics
  let totalSpend = 0;
  let totalClicks = 0;
  let totalLinkClicks = 0;
  let totalLandingPageViews = 0;
  let totalLeads = 0;
  let totalPurchases = 0;

  for (const ad of filteredAds) {
    totalSpend += ad.spend || 0;
    totalClicks += ad.clicks || 0;
    totalLinkClicks += ad.inline_link_clicks || 0;
    totalLandingPageViews += ad.landing_page_views || 0;
    totalLeads += ad.reported_leads || 0;
    totalPurchases += ad.reported_purchases || 0;
  }

  // Calculate funnel metrics
  const connectRate = totalLinkClicks > 0 ? totalLandingPageViews / totalLinkClicks : 0;
  const leadRate = totalLinkClicks > 0 ? totalLeads / totalLinkClicks : 0;
  const purchaseRate = totalLeads > 0 ? totalPurchases / totalLeads : 0;
  const clickToPurchaseRate = totalLinkClicks > 0 ? totalPurchases / totalLinkClicks : 0;

  // Priority 1: Lead-to-Purchase Leak (HIGHEST PRIORITY)
  if (purchaseRate < THRESHOLDS.MIN_PURCHASE_RATE && totalLeads >= 10) {
    leaks.push({
      type: "lead_to_purchase",
      severity: "critical",
      priority: 1,
      title: "🔴 Priority 1: Lead-to-Purchase Leak (VIP Offer/Nurture Issue)",
      description: `Purchase rate is ${(purchaseRate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_PURCHASE_RATE * 100}% target). Losing ${(100 - purchaseRate * 100).toFixed(0)}% of leads after opt-in.`,
      root_cause: "VIP offer not compelling or email nurture sequence weak",
      action_required: "1. Optimize VIP sales page (copy, bonuses, urgency)\n2. Improve email sequence (timing, copy, CTAs)\n3. Test pricing/payment plans\n4. Add social proof/testimonials\n5. A/B test different VIP offers",
      affected_ads: filteredAds.length,
      metrics: {
        purchase_rate: purchaseRate,
        target: THRESHOLDS.MIN_PURCHASE_RATE,
        total_leads: totalLeads,
        total_purchases: totalPurchases,
        lost_purchases: Math.round(totalLeads * THRESHOLDS.MIN_PURCHASE_RATE - totalPurchases),
      },
    });
  }

  // Priority 2: Click-to-Purchase Leak
  if (clickToPurchaseRate < THRESHOLDS.MIN_CLICK_TO_PURCHASE && totalLinkClicks >= 50) {
    leaks.push({
      type: "click_to_purchase",
      severity: "critical",
      priority: 2,
      title: "🟠 Priority 2: Click-to-Purchase Leak",
      description: `Click-to-Purchase rate is ${(clickToPurchaseRate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_CLICK_TO_PURCHASE * 100}% target). Overall conversion funnel is underperforming.`,
      root_cause: "Multiple funnel issues - check Purchase Rate, Lead Rate, and Connect Rate",
      action_required: "Follow diagnostic tree:\n1. Check Purchase Rate (Purchases / Leads) - if < 12% → VIP/nurture issue\n2. Check Lead Rate (Leads / Link Clicks) - if < 25% → Landing page issue\n3. Check Connect Rate (Landing Page Views / Link Clicks) - if < 80% → Speed issue",
      affected_ads: filteredAds.length,
      metrics: {
        click_to_purchase_rate: clickToPurchaseRate,
        target: THRESHOLDS.MIN_CLICK_TO_PURCHASE,
        total_link_clicks: totalLinkClicks,
        total_purchases: totalPurchases,
      },
    });
  }

  // Priority 3: Click-to-Lead Leak (Landing Page Conversion Issue)
  if (leadRate < THRESHOLDS.MIN_LEAD_RATE && connectRate >= 0.8 && totalLandingPageViews >= 20) {
    leaks.push({
      type: "click_to_lead",
      severity: "warning",
      priority: 3,
      title: "🟡 Priority 3: Click-to-Lead Leak (Landing Page Conversion Issue)",
      description: `Lead rate is ${(leadRate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_LEAD_RATE * 100}% target). Landing page not converting visitors into leads.`,
      root_cause: "Landing page conversion issue - copy, CTA, or form problems",
      action_required: "1. Optimize landing page copy, headline, value proposition\n2. Improve CTA clarity and placement\n3. Simplify form (reduce fields)\n4. Test different lead magnets/offers\n5. Run VWO A/B test\n6. Check mobile vs desktop conversion rates",
      affected_ads: filteredAds.length,
      metrics: {
        lead_rate: leadRate,
        target: THRESHOLDS.MIN_LEAD_RATE,
        total_link_clicks: totalLinkClicks,
        total_leads: totalLeads,
        connect_rate: connectRate,
      },
    });
  }

  // Priority 4: Click-to-Page Leak (Connect Rate Issue)
  if (connectRate < 0.8 && totalLinkClicks >= 10) {
    leaks.push({
      type: "click_to_page",
      severity: "warning",
      priority: 4,
      title: "🟢 Priority 4: Click-to-Page Leak (Connect Rate Issue)",
      description: `Connect rate is ${(connectRate * 100).toFixed(1)}% (below 80% ideal). Losing ${(100 - connectRate * 100).toFixed(0)}% of clicks before they reach landing page.`,
      root_cause: "Landing page speed issue or broken tracking",
      action_required: "1. Optimize landing page load time (target < 2 seconds)\n2. Check mobile performance\n3. Verify Facebook Pixel is firing correctly\n4. Test page on different devices/networks\n5. Compress images and reduce page weight\n6. Use CDN for faster delivery",
      affected_ads: filteredAds.length,
      metrics: {
        connect_rate: connectRate,
        target: 0.8,
        total_link_clicks: totalLinkClicks,
        total_landing_page_views: totalLandingPageViews,
        lost_page_views: Math.round(totalLinkClicks * 0.8 - totalLandingPageViews),
      },
    });
  }

  // Sort by priority
  leaks.sort((a, b) => a.priority - b.priority);

  console.log(`[Optimization Engine] Detected ${leaks.length} funnel leaks`);
  return leaks;
}

/**
 * FR3: Creative Fatigue Detection
 * Identify ads showing signs of creative fatigue (high frequency, declining performance)
 */
export async function detectCreativeFatigue(): Promise<FatigueAlert[]> {
  const alerts: FatigueAlert[] = [];

  // Fetch recent ad performance (last 7 days)
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .ilike("campaign_name", `%${CAMPAIGN_NAME_FILTER}%`)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Filter only SALES and LEADS campaigns
  const filteredAds = ads.filter(ad => 
    CAMPAIGN_TYPE_FILTERS.some(type => ad.campaign_name?.includes(type))
  );

  // Group by ad_id and analyze trends
  const adTrends = new Map<string, any[]>();

  for (const ad of filteredAds) {
    const adId = ad.ad_id;
    if (!adTrends.has(adId)) {
      adTrends.set(adId, []);
    }
    adTrends.get(adId)!.push(ad);
  }

  // Analyze each ad for fatigue signals
  for (const [adId, history] of Array.from(adTrends.entries())) {
    if (history.length < 3) continue; // Need at least 3 days of data

    const sortedHistory = history.sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recent = sortedHistory.slice(0, 3); // Last 3 days
    const older = sortedHistory.slice(3, 6); // Previous 3 days

    // Calculate average CPP and CTR for recent vs older periods
    const recentAvgCPP = recent.reduce((sum: number, d: any) => {
      const cpp = d.reported_purchases > 0 ? d.spend / d.reported_purchases : 0;
      return sum + cpp;
    }, 0) / recent.length;

    const olderAvgCPP = older.length > 0 ? older.reduce((sum: number, d: any) => {
      const cpp = d.reported_purchases > 0 ? d.spend / d.reported_purchases : 0;
      return sum + cpp;
    }, 0) / older.length : 0;

    const recentAvgCTR = recent.reduce((sum: number, d: any) => {
      const ctr = d.impressions > 0 ? d.clicks / d.impressions : 0;
      return sum + ctr;
    }, 0) / recent.length;

    const olderAvgCTR = older.length > 0 ? older.reduce((sum: number, d: any) => {
      const ctr = d.impressions > 0 ? d.clicks / d.impressions : 0;
      return sum + ctr;
    }, 0) / older.length : 0;

    // Check for fatigue signals
    const cppIncreasing = olderAvgCPP > 0 && recentAvgCPP > olderAvgCPP * 1.3; // 30% increase
    const ctrDecreasing = olderAvgCTR > 0 && recentAvgCTR < olderAvgCTR * 0.7; // 30% decrease

    if (cppIncreasing || ctrDecreasing) {
      const latestAd = sortedHistory[0];
      
      alerts.push({
        ad_id: adId,
        adset_id: latestAd.adset_id || "",
        campaign_id: latestAd.campaign_id || "",
        severity: cppIncreasing && ctrDecreasing ? "warning" : "info",
        title: `Creative Fatigue Signal: ${latestAd.ad_name || "Unknown"}`,
        description: `${cppIncreasing ? "CPP increasing (+30%)" : ""} ${cppIncreasing && ctrDecreasing ? "and" : ""} ${ctrDecreasing ? "CTR decreasing (-30%)" : ""}. Consider creative refresh.`,
        metrics: {
          frequency: 0, // Not available in current schema
          cpp_trend: cppIncreasing ? "increasing" : "stable",
          ctr_trend: ctrDecreasing ? "decreasing" : "stable",
        },
      });
    }
  }

  console.log(`[Optimization Engine] Detected ${alerts.length} creative fatigue alerts`);
  return alerts;
}
