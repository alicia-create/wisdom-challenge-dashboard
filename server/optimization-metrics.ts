import { supabase } from "./supabase";

/**
 * Fetch optimization metrics using the Supabase edge function
 * This offloads all aggregation and filtering to the database
 */
export async function getOptimizationMetrics(daysBack: number = 7) {
  const { data, error } = await supabase.rpc("get_optimization_metrics", {
    days_back: daysBack,
    campaign_filter: "31DWC2026",
  });

  if (error) {
    console.error("[Optimization Metrics] Error fetching from edge function:", error);
    return null;
  }

  return data;
}

export type OptimizationMetrics = {
  ads: Array<{
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
    connect_rate: number;
    lead_rate: number;
    purchase_rate: number;
    click_to_purchase_rate: number;
    cpp: number;
    cpl: number;
  }>;
  yesterday: {
    spend: number;
    link_clicks: number;
    leads: number;
    purchases: number;
    purchase_rate: number;
    click_to_purchase_rate: number;
    cpp: number;
  };
  trend_3day: Array<{
    date: string;
    spend: number;
    purchases: number;
    cpp: number;
  }>;
  trend_7day: Array<{
    date: string;
    spend: number;
    purchases: number;
    cpp: number;
  }>;
  total_ads_analyzed: number;
  date_range: {
    start: string;
    end: string;
    days: number;
  };
};
