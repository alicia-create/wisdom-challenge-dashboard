import { supabase } from "./supabase";
import { randomUUID } from "crypto";

// Campaign filter constant
const CAMPAIGN_NAME_FILTER = "31DWC2026";

// Optimization thresholds
const THRESHOLDS = {
  MIN_SPEND_NO_CLICKS: 10, // Disable if no clicks after $10 spend
  MIN_CONNECT_RATE: 0.5, // 50% minimum (Landing Page Views / Link Clicks)
  MIN_LEAD_RATE: 0.25, // 25% minimum (Leads / Link Clicks)
  MIN_PURCHASE_RATE: 0.4, // 40% minimum (Purchases / Leads)
  MIN_CLICK_TO_PURCHASE: 0.1, // 10% minimum (Purchases / Link Clicks)
  MIN_CTR: 0.02, // 2% minimum
  MIN_VIDEO_RETENTION: 0.4, // 40% minimum (3-second views / Impressions)
  MAX_FREQUENCY: 2.5, // Creative fatigue threshold
  MIN_CLICKS_FOR_EVALUATION: 10,
  MIN_PAGE_VIEWS_FOR_EVALUATION: 20,
  MIN_IMPRESSIONS_FOR_VIDEO: 1000,
  CPP_TARGET_MIN: 30,
  CPP_TARGET_MAX: 60,
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

/**
 * FR1: Ad-Level Performance Analysis
 * Analyze each ad's performance against defined thresholds
 */
export async function analyzeAdPerformance(): Promise<AdRecommendation[]> {
  // Use supabase client
  const recommendations: AdRecommendation[] = [];

  // Fetch recent ad performance data (last 7 days)
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("campaign_name", CAMPAIGN_NAME_FILTER)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: false });

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Group by ad_id and aggregate metrics
  const adMetrics = new Map<
    string,
    {
      ad_id: string;
      ad_name: string;
      adset_id: string;
      adset_name: string;
      campaign_id: string;
      campaign_name: string;
      total_spend: number;
      total_clicks: number;
      total_impressions: number;
      total_link_clicks: number;
      total_landing_page_views: number;
      total_leads: number;
      total_purchases: number;
      total_video_3_sec_views: number;
      frequency: number;
    }
  >();

  for (const ad of ads) {
    const key = ad.ad_id;
    if (!adMetrics.has(key)) {
      adMetrics.set(key, {
        ad_id: ad.ad_id,
        ad_name: ad.ad_name,
        adset_id: ad.adset_id,
        adset_name: ad.adset_name,
        campaign_id: ad.campaign_id,
        campaign_name: ad.campaign_name,
        total_spend: 0,
        total_clicks: 0,
        total_impressions: 0,
        total_link_clicks: 0,
        total_landing_page_views: 0,
        total_leads: 0,
        total_purchases: 0,
        total_video_3_sec_views: 0,
        frequency: 0,
      });
    }

    const metrics = adMetrics.get(key)!;
    metrics.total_spend += ad.spend || 0;
    metrics.total_clicks += ad.clicks || 0;
    metrics.total_impressions += ad.impressions || 0;
    metrics.total_link_clicks += ad.inline_link_clicks || 0;
    metrics.total_landing_page_views += ad.landing_page_views || 0;
    metrics.total_leads += ad.leads || 0;
    metrics.total_purchases += ad.purchases || 0;
    metrics.total_video_3_sec_views += ad.video_3_sec_views || 0;
    metrics.frequency = Math.max(metrics.frequency, ad.frequency || 0);
  }

  // Apply optimization rules
  for (const [ad_id, metrics] of Array.from(adMetrics.entries())) {
    // Rule 1.1: No Engagement - Disable Immediately
    if (metrics.total_clicks === 0 && metrics.total_spend > THRESHOLDS.MIN_SPEND_NO_CLICKS) {
      recommendations.push({
        id: randomUUID(),
        recommendation_type: "disable_ad",
        severity: "critical",
        ad_id: metrics.ad_id,
        adset_id: metrics.adset_id,
        campaign_id: metrics.campaign_id,
        title: `Disable Ad: ${metrics.ad_name} - No Engagement`,
        description: `Ad has spent $${metrics.total_spend.toFixed(2)} without generating any clicks.`,
        action_required: `Disable ad ${metrics.ad_id} immediately to stop wasting budget.`,
        expected_impact: `Save $${(metrics.total_spend / 7).toFixed(2)}/day in wasted spend.`,
        metadata: {
          spend: metrics.total_spend,
          clicks: metrics.total_clicks,
          threshold: THRESHOLDS.MIN_SPEND_NO_CLICKS,
        },
      });
      continue;
    }

    // Rule 1.2: Low Connect Rate - Disable
    if (metrics.total_link_clicks >= THRESHOLDS.MIN_CLICKS_FOR_EVALUATION) {
      const connectRate = metrics.total_landing_page_views / metrics.total_link_clicks;
      if (connectRate < THRESHOLDS.MIN_CONNECT_RATE) {
        recommendations.push({
          id: randomUUID(),
          recommendation_type: "disable_ad",
          severity: "critical",
          ad_id: metrics.ad_id,
          adset_id: metrics.adset_id,
          campaign_id: metrics.campaign_id,
          title: `Disable Ad: ${metrics.ad_name} - Low Connect Rate`,
          description: `Connect rate is ${(connectRate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_CONNECT_RATE * 100}% threshold). Users are clicking but not reaching the landing page.`,
          action_required: `Disable ad ${metrics.ad_id} and investigate landing page speed or tracking issues.`,
          expected_impact: `Stop wasting budget on broken traffic flow.`,
          metadata: {
            connect_rate: connectRate,
            link_clicks: metrics.total_link_clicks,
            landing_page_views: metrics.total_landing_page_views,
            threshold: THRESHOLDS.MIN_CONNECT_RATE,
          },
        });
        continue;
      }
    }

    // Rule 1.3: Low Lead Rate - Disable
    if (metrics.total_landing_page_views >= THRESHOLDS.MIN_PAGE_VIEWS_FOR_EVALUATION) {
      const leadRate = metrics.total_link_clicks > 0 ? metrics.total_leads / metrics.total_link_clicks : 0;
      if (leadRate < THRESHOLDS.MIN_LEAD_RATE) {
        const cpp = metrics.total_purchases > 0 ? metrics.total_spend / metrics.total_purchases : 0;
        recommendations.push({
          id: randomUUID(),
          recommendation_type: "disable_ad",
          severity: "critical",
          ad_id: metrics.ad_id,
          adset_id: metrics.adset_id,
          campaign_id: metrics.campaign_id,
          title: `Disable Ad: ${metrics.ad_name} - Low Lead Rate`,
          description: `Lead rate is ${(leadRate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_LEAD_RATE * 100}% threshold). Landing page is not converting traffic into leads.`,
          action_required: `Disable ad ${metrics.ad_id} and optimize landing page copy, CTA, or form.`,
          expected_impact: `Stop wasting budget on poor-converting traffic.`,
          metadata: {
            lead_rate: leadRate,
            leads: metrics.total_leads,
            link_clicks: metrics.total_link_clicks,
            threshold: THRESHOLDS.MIN_LEAD_RATE,
          },
        });
        continue;
      }
    }

    // Rule 1.4: Video Creative - Low Retention (Flag, don't disable)
    if (metrics.total_impressions >= THRESHOLDS.MIN_IMPRESSIONS_FOR_VIDEO && metrics.total_video_3_sec_views > 0) {
      const videoRetention = metrics.total_video_3_sec_views / metrics.total_impressions;
      if (videoRetention < THRESHOLDS.MIN_VIDEO_RETENTION) {
        const cpp = metrics.total_purchases > 0 ? metrics.total_spend / metrics.total_purchases : 0;
        const isPerforming = cpp > 0 && cpp <= THRESHOLDS.CPP_TARGET_MAX;

        recommendations.push({
          id: randomUUID(),
          recommendation_type: "improve_creative",
          severity: isPerforming ? "info" : "warning",
          ad_id: metrics.ad_id,
          adset_id: metrics.adset_id,
          campaign_id: metrics.campaign_id,
          title: `${isPerforming ? "Opportunity" : "Warning"}: ${metrics.ad_name} - Low Video Retention`,
          description: `3-second retention is ${(videoRetention * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_VIDEO_RETENTION * 100}% threshold). ${isPerforming ? "CPP is good, but creative can be improved." : "Creative hook is weak."}`,
          action_required: `${isPerforming ? "Consider" : "Recommend"} improving video hook (first 3 seconds) to increase retention.`,
          expected_impact: `Potential to improve CTR and reduce CPP with better creative.`,
          metadata: {
            video_retention: videoRetention,
            video_3_sec_views: metrics.total_video_3_sec_views,
            impressions: metrics.total_impressions,
            threshold: THRESHOLDS.MIN_VIDEO_RETENTION,
            cpp: cpp,
          },
        });
      }
    }
  }

  return recommendations;
}

/**
 * FR2: Funnel Leak Detection
 * Identify where users are dropping off in the conversion funnel
 */
export async function detectFunnelLeaks(): Promise<FunnelLeak[]> {
  // Use supabase client
  const leaks: FunnelLeak[] = [];

  // Fetch aggregated campaign metrics (last 7 days)
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("campaign_name", CAMPAIGN_NAME_FILTER)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Aggregate metrics across all ads
  let total_link_clicks = 0;
  let total_landing_page_views = 0;
  let total_leads = 0;
  let total_purchases = 0;
  let affected_ads_count = 0;

  for (const ad of ads) {
    total_link_clicks += ad.inline_link_clicks || 0;
    total_landing_page_views += ad.landing_page_views || 0;
    total_leads += ad.leads || 0;
    total_purchases += ad.purchases || 0;
    affected_ads_count++;
  }

  // Calculate funnel metrics
  const connect_rate = total_link_clicks > 0 ? total_landing_page_views / total_link_clicks : 0;
  const lead_rate = total_link_clicks > 0 ? total_leads / total_link_clicks : 0;
  const purchase_rate = total_leads > 0 ? total_purchases / total_leads : 0;
  const click_to_purchase_rate = total_link_clicks > 0 ? total_purchases / total_link_clicks : 0;

  // Leak 2.2: Click-to-Page Leak (Connect Rate Issue)
  if (connect_rate < THRESHOLDS.MIN_CONNECT_RATE) {
    leaks.push({
      type: "click_to_page",
      severity: "critical",
      title: "Click-to-Page Leak Detected",
      description: `Connect rate is ${(connect_rate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_CONNECT_RATE * 100}% threshold). Users are clicking ads but not reaching the landing page.`,
      root_cause: "Landing page speed issue or broken Facebook Pixel tracking.",
      action_required: "Optimize landing page load time, check mobile performance, verify Facebook Pixel is firing correctly.",
      affected_ads: affected_ads_count,
      metrics: {
        connect_rate,
        link_clicks: total_link_clicks,
        landing_page_views: total_landing_page_views,
        threshold: THRESHOLDS.MIN_CONNECT_RATE,
      },
    });
  }

  // Leak 2.3: Click-to-Lead Leak (Landing Page Conversion Issue)
  if (connect_rate >= THRESHOLDS.MIN_CONNECT_RATE && lead_rate < THRESHOLDS.MIN_LEAD_RATE) {
    leaks.push({
      type: "click_to_lead",
      severity: "critical",
      title: "Click-to-Lead Leak Detected",
      description: `Lead rate is ${(lead_rate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_LEAD_RATE * 100}% threshold). Landing page is not converting traffic into leads.`,
      root_cause: "Landing page conversion issue (weak copy, unclear CTA, complicated form).",
      action_required: "Optimize landing page copy, headline, value proposition. Improve CTA clarity and placement. Simplify form (reduce fields). Test different lead magnets/offers.",
      affected_ads: affected_ads_count,
      metrics: {
        lead_rate,
        leads: total_leads,
        link_clicks: total_link_clicks,
        threshold: THRESHOLDS.MIN_LEAD_RATE,
      },
    });
  }

  // Leak 2.4: Lead-to-Purchase Leak (VIP Offer/Nurture Issue)
  if (lead_rate >= THRESHOLDS.MIN_LEAD_RATE && purchase_rate < THRESHOLDS.MIN_PURCHASE_RATE) {
    leaks.push({
      type: "lead_to_purchase",
      severity: "warning",
      title: "Lead-to-Purchase Leak Detected",
      description: `Purchase rate is ${(purchase_rate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_PURCHASE_RATE * 100}% threshold). VIP offer or email nurture sequence is weak.`,
      root_cause: "VIP offer not compelling or email nurture sequence weak.",
      action_required: "Optimize VIP sales page (copy, bonuses, urgency). Improve email sequence (timing, copy, CTAs). Test pricing/payment plans. Add social proof/testimonials. Improve urgency/scarcity messaging.",
      affected_ads: affected_ads_count,
      metrics: {
        purchase_rate,
        purchases: total_purchases,
        leads: total_leads,
        threshold: THRESHOLDS.MIN_PURCHASE_RATE,
      },
    });
  }

  // Leak 2.1: Click-to-Purchase Leak (Highest Priority)
  if (click_to_purchase_rate < THRESHOLDS.MIN_CLICK_TO_PURCHASE) {
    leaks.push({
      type: "click_to_purchase",
      severity: "critical",
      title: "Click-to-Purchase Leak Detected (Primary Metric)",
      description: `Click-to-Purchase rate is ${(click_to_purchase_rate * 100).toFixed(1)}% (below ${THRESHOLDS.MIN_CLICK_TO_PURCHASE * 100}% target). Overall funnel performance is below target.`,
      root_cause: "Multiple funnel issues detected. See specific leaks above for root causes.",
      action_required: "Address funnel leaks in priority order: Lead-to-Purchase → Click-to-Lead → Click-to-Page.",
      affected_ads: affected_ads_count,
      metrics: {
        click_to_purchase_rate,
        purchases: total_purchases,
        link_clicks: total_link_clicks,
        lead_rate,
        purchase_rate,
        connect_rate,
        threshold: THRESHOLDS.MIN_CLICK_TO_PURCHASE,
      },
    });
  }

  return leaks;
}

/**
 * FR3: Creative Fatigue Detection
 * Detect when creative performance is declining due to audience saturation
 */
export async function detectCreativeFatigue(): Promise<FatigueAlert[]> {
  // Use supabase client
  const alerts: FatigueAlert[] = [];

  // Fetch ad performance data for last 7 days with daily breakdown
  const { data: ads, error } = await supabase
    .from("ad_performance")
    .select("*")
    .eq("campaign_name", CAMPAIGN_NAME_FILTER)
    .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error || !ads) {
    console.error("[Optimization Engine] Error fetching ad performance:", error);
    return [];
  }

  // Group by ad_id and calculate 3-day trends
  const adTrends = new Map<
    string,
    {
      ad_id: string;
      ad_name: string;
      adset_id: string;
      campaign_id: string;
      frequency: number;
      cpp_trend: number[];
      ctr_trend: number[];
    }
  >();

  for (const ad of ads) {
    if (!adTrends.has(ad.ad_id)) {
      adTrends.set(ad.ad_id, {
        ad_id: ad.ad_id,
        ad_name: ad.ad_name,
        adset_id: ad.adset_id,
        campaign_id: ad.campaign_id,
        frequency: 0,
        cpp_trend: [],
        ctr_trend: [],
      });
    }

    const trend = adTrends.get(ad.ad_id)!;
    trend.frequency = Math.max(trend.frequency, ad.frequency || 0);

    const cpp = ad.purchases > 0 ? ad.spend / ad.purchases : 0;
    const ctr = ad.impressions > 0 ? ad.clicks / ad.impressions : 0;

    if (cpp > 0) trend.cpp_trend.push(cpp);
    if (ctr > 0) trend.ctr_trend.push(ctr);
  }

  // Detect fatigue indicators
  for (const [ad_id, trend] of Array.from(adTrends.entries())) {
    // Check frequency threshold
    if (trend.frequency > THRESHOLDS.MAX_FREQUENCY) {
      // Calculate CPP and CTR trends (last 3 days vs previous 3 days)
      if (trend.cpp_trend.length >= 6) {
        const recent_cpp = trend.cpp_trend.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
        const previous_cpp = trend.cpp_trend.slice(-6, -3).reduce((a: number, b: number) => a + b, 0) / 3;
        const cpp_change = (recent_cpp - previous_cpp) / previous_cpp;

        const recent_ctr = trend.ctr_trend.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
        const previous_ctr = trend.ctr_trend.slice(-6, -3).reduce((a: number, b: number) => a + b, 0) / 3;
        const ctr_change = (recent_ctr - previous_ctr) / previous_ctr;

        // Fatigue detected: CPP increasing 30%+ OR CTR declining 25%+
        if (cpp_change > 0.3 || ctr_change < -0.25) {
          alerts.push({
            ad_id: trend.ad_id,
            adset_id: trend.adset_id,
            campaign_id: trend.campaign_id,
            severity: "warning",
            title: `Creative Fatigue Detected: ${trend.ad_name}`,
            description: `Frequency is ${trend.frequency.toFixed(2)} (above ${THRESHOLDS.MAX_FREQUENCY} threshold). ${cpp_change > 0.3 ? `CPP increased ${(cpp_change * 100).toFixed(1)}% over last 3 days.` : ""} ${ctr_change < -0.25 ? `CTR declined ${Math.abs(ctr_change * 100).toFixed(1)}% over last 3 days.` : ""}`,
            metrics: {
              frequency: trend.frequency,
              cpp_trend: cpp_change > 0.3 ? `+${(cpp_change * 100).toFixed(1)}%` : "stable",
              ctr_trend: ctr_change < -0.25 ? `${(ctr_change * 100).toFixed(1)}%` : "stable",
            },
          });
        }
      }
    }
  }

  return alerts;
}
