import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Daily metrics data structure returned by get_daily_metrics edge function
 */
export interface DailyMetricsDay {
  date: string;
  // Totals
  totalLeads: number;
  totalWisdomSales: number;
  totalRevenue: number;
  totalKingdomSeekers: number;
  totalExtraJournals: number;
  totalExtraShipping: number;
  // Paid Funnel
  paidLeads: number;
  paidWisdomSales: number;
  paidRevenue: number;
  paidKingdomSeekers: number;
  paidExtraJournals: number;
  paidExtraShipping: number;
  // Organic Funnel
  organicLeads: number;
  organicWisdomSales: number;
  organicRevenue: number;
  organicKingdomSeekers: number;
  organicExtraJournals: number;
  organicExtraShipping: number;
  // Ad Spend
  leadsSalesSpend: number;
  totalAdSpend: number;
  // Meta Leads Campaign
  metaLeads: {
    spend: number;
    clicks: number;
    impressions: number;
    landingPageViews: number;
    reportedLeads: number;
    reportedPurchases: number;
  };
  // Meta Sales Campaign
  metaSales: {
    spend: number;
    clicks: number;
    impressions: number;
    landingPageViews: number;
    reportedLeads: number;
    reportedPurchases: number;
  };
  // Meta Total
  metaTotal: {
    spend: number;
    clicks: number;
    impressions: number;
    landingPageViews: number;
  };
  // Google
  google: {
    spend: number;
    clicks: number;
    impressions: number;
    reportedLeads: number;
    reportedPurchases: number;
  };
  // Calculated Metrics
  cpl: number;
  cpp: number;
  roas: number;
  conversionRate: number;
}

export interface DailyMetricsResponse {
  dailyData: DailyMetricsDay[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Fetch daily metrics using the optimized edge function
 * Uses the same logic as get_dashboard_metrics for consistency
 */
export async function getDailyMetricsFromEdgeFunction(
  startDate: string,
  endDate: string
): Promise<DailyMetricsResponse> {
  console.log(`[Daily Metrics] Fetching from edge function: ${startDate} to ${endDate}`);
  
  const { data, error } = await supabase.rpc('get_daily_metrics', {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('[Daily Metrics] Edge function error:', error);
    throw new Error(`Failed to fetch daily metrics: ${error.message}`);
  }

  // Handle new nested structure: data is an array with get_daily_metrics key
  let result: DailyMetricsResponse;
  if (Array.isArray(data) && data.length > 0 && data[0].get_daily_metrics) {
    console.log('[Daily Metrics] Extracting from nested structure');
    result = data[0].get_daily_metrics as DailyMetricsResponse;
  } else if (data?.dailyData) {
    // Fallback to direct structure
    result = data as DailyMetricsResponse;
  } else {
    console.error('[Daily Metrics] Unexpected data structure:', JSON.stringify(data).substring(0, 200));
    throw new Error('Unexpected data structure from get_daily_metrics');
  }

  console.log(`[Daily Metrics] Received ${result.dailyData?.length || 0} days of data`);
  
  return result;
}

/**
 * Transform edge function data to match the existing DailyAnalysis page format
 * This ensures backward compatibility with the current UI
 */
export function transformDailyMetricsForUI(data: DailyMetricsResponse) {
  return data.dailyData.map(day => ({
    date: day.date,
    // Summary Data (using paid funnel for consistency with Overview)
    totalOptins: day.paidLeads,
    totalVipSales: day.paidWisdomSales,
    vipTakeRate: day.conversionRate,
    totalVipRevenue: day.paidRevenue,
    // Costs & ROAS (using leadsSalesSpend for consistency)
    totalSpend: day.leadsSalesSpend,
    trueCPL: day.cpl,
    trueCPP: day.cpp,
    roas: day.roas,
    profitLoss: day.paidRevenue - day.leadsSalesSpend,
    // Meta Ads (combined LEADS + SALES campaigns)
    metaSpend: day.metaLeads.spend + day.metaSales.spend,
    metaCPL: day.metaLeads.reportedLeads > 0 
      ? day.metaLeads.spend / day.metaLeads.reportedLeads 
      : 0,
    metaCPP: (day.metaLeads.reportedPurchases + day.metaSales.reportedPurchases) > 0
      ? (day.metaLeads.spend + day.metaSales.spend) / (day.metaLeads.reportedPurchases + day.metaSales.reportedPurchases)
      : 0,
    metaOptins: day.metaLeads.reportedLeads + day.metaSales.reportedLeads,
    metaVipSales: day.metaLeads.reportedPurchases + day.metaSales.reportedPurchases,
    metaClicks: day.metaLeads.clicks + day.metaSales.clicks,
    metaImpressions: day.metaLeads.impressions + day.metaSales.impressions,
    metaLandingPageViews: day.metaLeads.landingPageViews + day.metaSales.landingPageViews,
    metaConnectRate: (day.metaLeads.clicks + day.metaSales.clicks) > 0
      ? ((day.metaLeads.landingPageViews + day.metaSales.landingPageViews) / (day.metaLeads.clicks + day.metaSales.clicks)) * 100
      : 0,
    metaClickToLeadRate: (day.metaLeads.clicks + day.metaSales.clicks) > 0
      ? ((day.metaLeads.reportedLeads + day.metaSales.reportedLeads) / (day.metaLeads.clicks + day.metaSales.clicks)) * 100
      : 0,
    metaClickToPurchaseRate: (day.metaLeads.clicks + day.metaSales.clicks) > 0
      ? ((day.metaLeads.reportedPurchases + day.metaSales.reportedPurchases) / (day.metaLeads.clicks + day.metaSales.clicks)) * 100
      : 0,
    // Google Ads
    googleSpend: day.google.spend,
    googleCPL: day.google.reportedLeads > 0 
      ? day.google.spend / day.google.reportedLeads 
      : 0,
    googleCPP: day.google.reportedPurchases > 0
      ? day.google.spend / day.google.reportedPurchases
      : 0,
    googleOptins: day.google.reportedLeads,
    googleVipSales: day.google.reportedPurchases,
    googleClicks: day.google.clicks,
    googleImpressions: day.google.impressions,
    googleClickToLeadRate: day.google.clicks > 0
      ? (day.google.reportedLeads / day.google.clicks) * 100
      : 0,
    googleClickToPurchaseRate: day.google.clicks > 0
      ? (day.google.reportedPurchases / day.google.clicks) * 100
      : 0,
    // Additional fields for new UI
    paidLeads: day.paidLeads,
    organicLeads: day.organicLeads,
    paidWisdomSales: day.paidWisdomSales,
    organicWisdomSales: day.organicWisdomSales,
    leadsSalesSpend: day.leadsSalesSpend,
    totalAdSpend: day.totalAdSpend,
    // Meta breakdown
    metaLeadsCampaign: day.metaLeads,
    metaSalesCampaign: day.metaSales,
    // Kingdom Seekers & Extras
    totalKingdomSeekers: day.totalKingdomSeekers,
    paidKingdomSeekers: day.paidKingdomSeekers,
    organicKingdomSeekers: day.organicKingdomSeekers,
    totalExtraJournals: day.totalExtraJournals,
    paidExtraJournals: day.paidExtraJournals,
    organicExtraJournals: day.organicExtraJournals,
    totalExtraShipping: day.totalExtraShipping,
    paidExtraShipping: day.paidExtraShipping,
    organicExtraShipping: day.organicExtraShipping,
  }));
}
