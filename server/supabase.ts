import { createClient } from '@supabase/supabase-js';
import { CAMPAIGN_NAME_FILTER } from '@shared/constants';

// Supabase connection details
// Using the new publishable/secret key format (2025+)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_KEY) {
  console.warn('[Supabase] Missing SUPABASE_KEY environment variable');
}

// Create Supabase client with new key format
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false, // Server-side doesn't need session persistence
    autoRefreshToken: false,
  },
});

/**
 * Helper to fetch daily KPIs with date range filter
 */
export async function getDailyKpis(startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_kpis')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('[Supabase] Error fetching daily KPIs:', error);
    throw new Error(`Failed to fetch daily KPIs: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to fetch overview metrics (aggregated totals)
 */
export async function getOverviewMetrics(startDate?: string, endDate?: string) {
  // Get total leads
  let leadsQuery = supabase
    .from('Lead')
    .select('*', { count: 'exact', head: true });
  
  if (startDate) {
    leadsQuery = leadsQuery.gte('created_at', startDate);
  }
  if (endDate) {
    // Add one day to endDate to include the entire end date
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    leadsQuery = leadsQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { count: totalLeads, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error('[Supabase] Error counting leads:', leadsError);
  }

  // Get total spend from ad_performance (filtered by campaign)
  let adQuery = supabase
    .from('ad_performance')
    .select('spend')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`);
  
  if (startDate) {
    adQuery = adQuery.gte('date', startDate);
  }
  if (endDate) {
    adQuery = adQuery.lte('date', endDate);
  }
  
  const { data: adData, error: adError } = await adQuery;

  if (adError) {
    console.error('[Supabase] Error fetching ad spend:', adError);
  }

  const totalSpend = adData?.reduce((sum: number, row: any) => sum + parseFloat(row.spend || '0'), 0) || 0;

  // Get VIP sales count
  let ordersCountQuery = supabase
    .from('Order')
    .select('*', { count: 'exact', head: true });
  
  if (startDate) {
    ordersCountQuery = ordersCountQuery.gte('created_at', startDate);
  }
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    ordersCountQuery = ordersCountQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { count: vipSales, error: ordersCountError } = await ordersCountQuery;

  if (ordersCountError) {
    console.error('[Supabase] Error counting orders:', ordersCountError);
  }

  // Get VIP revenue
  let ordersQuery = supabase
    .from('Order')
    .select('order_total');
  
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    ordersQuery = ordersQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { data: ordersData, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('[Supabase] Error fetching orders:', ordersError);
  }

  const vipRevenue = ordersData?.reduce((sum: number, row: any) => sum + parseFloat(row.order_total || '0'), 0) || 0;

  // Calculate metrics
  const cpl = totalLeads && totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpp = vipSales && vipSales > 0 ? totalSpend / vipSales : 0;
  const roas = totalSpend > 0 ? vipRevenue / totalSpend : 0;
  const vipTakeRate = totalLeads && totalLeads > 0 ? (vipSales || 0) / totalLeads * 100 : 0;
  const aov = vipSales && vipSales > 0 ? vipRevenue / vipSales : 0;

  return {
    totalLeads: totalLeads || 0,
    totalSpend,
    totalRevenue: vipRevenue,
    vipSales: vipSales || 0,
    cpl,
    cpp,
    aov,
    roas,
    vipTakeRate,
    vipRevenue,
  };
}

/**
 * Helper to fetch leads with UTM attribution
 */
export async function getLeadsWithAttribution(limit = 100) {
  const { data, error } = await supabase
    .from('Lead')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] Error fetching leads:', error);
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to fetch orders with UTM attribution
 */
export async function getOrdersWithAttribution(limit = 100) {
  const { data, error } = await supabase
    .from('Order')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] Error fetching orders:', error);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to fetch ad performance by campaign
 */
export async function getAdPerformanceByCampaign(startDate?: string, endDate?: string) {
  let query = supabase
    .from('ad_performance')
    .select('*')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching ad performance:', error);
    throw new Error(`Failed to fetch ad performance: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to fetch ad performance with full granularity (campaign + ad set + ad)
 */
export async function getAdPerformanceDetailed(filters?: {
  startDate?: string;
  endDate?: string;
  campaignId?: string;
  adsetId?: string;
  adId?: string;
  platform?: string;
}) {
  let query = supabase
    .from('ad_performance')
    .select('*')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }
  if (filters?.campaignId) {
    query = query.eq('campaign_id', filters.campaignId);
  }
  if (filters?.adsetId) {
    query = query.eq('adset_id', filters.adsetId);
  }
  if (filters?.adId) {
    query = query.eq('ad_id', filters.adId);
  }
  if (filters?.platform) {
    query = query.eq('platform', filters.platform);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching detailed ad performance:', error);
    throw new Error(`Failed to fetch detailed ad performance: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to get unique campaigns, ad sets, and ads for filters
 */
export async function getAdHierarchy() {
  const { data, error } = await supabase
    .from('ad_performance')
    .select('campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, platform')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('campaign_name', { ascending: true });

  if (error) {
    console.error('[Supabase] Error fetching ad hierarchy:', error);
    throw new Error(`Failed to fetch ad hierarchy: ${error.message}`);
  }

  // Deduplicate and structure the hierarchy
  const campaigns = new Map<string, any>();
  
  data?.forEach((row: any) => {
    if (!campaigns.has(row.campaign_id)) {
      campaigns.set(row.campaign_id, {
        id: row.campaign_id,
        name: row.campaign_name,
        platform: row.platform,
        adsets: new Map<string, any>(),
      });
    }
    
    const campaign = campaigns.get(row.campaign_id);
    if (!campaign) return;
    
    if (row.adset_id && !campaign.adsets.has(row.adset_id)) {
      campaign.adsets.set(row.adset_id, {
        id: row.adset_id,
        name: row.adset_name,
        ads: new Map<string, any>(),
      });
    }
    
    if (row.adset_id && row.ad_id) {
      const adset = campaign.adsets.get(row.adset_id);
      if (adset && !adset.ads.has(row.ad_id)) {
        adset.ads.set(row.ad_id, {
          id: row.ad_id,
          name: row.ad_name,
        });
      }
    }
  });

  // Convert Maps to arrays
  return Array.from(campaigns.values()).map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name,
    platform: campaign.platform,
    adsets: Array.from(campaign.adsets.values()).map((adset: any) => ({
      id: adset.id,
      name: adset.name,
      ads: Array.from(adset.ads.values()),
    })),
  }));
}

/**
 * Helper to get landing page view rate metrics
 */
export async function getLandingPageMetrics(startDate?: string, endDate?: string) {
  let query = supabase
    .from('ad_performance')
    .select('campaign_name, adset_name, ad_name, inline_link_clicks, landing_page_view_per_link_click, date')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .not('landing_page_view_per_link_click', 'is', null)
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching landing page metrics:', error);
    throw new Error(`Failed to fetch landing page metrics: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to fetch daily attendance
 */
export async function getDailyAttendance(startDate?: string, endDate?: string) {
  let query = supabase
    .from('daily_attendance')
    .select('*')
    .order('date', { ascending: false });

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Supabase] Error fetching attendance:', error);
    throw new Error(`Failed to fetch attendance: ${error.message}`);
  }

  return data || [];
}

/**
 * Helper to get email engagement metrics
 */
export async function getEmailEngagement() {
  const { count: totalLeads } = await supabase
    .from('Lead')
    .select('*', { count: 'exact', head: true });

  const { count: clickedCount } = await supabase
    .from('Lead')
    .select('*', { count: 'exact', head: true })
    .eq('welcome_email_clicked', true);

  const clickRate = totalLeads && totalLeads > 0 ? (clickedCount || 0) / totalLeads * 100 : 0;

  return {
    totalLeads: totalLeads || 0,
    clicked: clickedCount || 0,
    clickRate,
  };
}


/**
 * Helper to fetch daily analysis metrics for spreadsheet view
 * Returns data grouped by date with separate metrics for Meta and Google
 */
export async function getDailyAnalysisMetrics(startDate?: string, endDate?: string) {
  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  // Fetch daily leads grouped by date
  const { data: dailyLeads, error: leadsError } = await supabase
    .from('Lead')
    .select('created_at')
    .order('created_at', { ascending: true });

  if (leadsError) {
    console.error('[Supabase] Error fetching daily leads:', leadsError);
  }

  // Fetch daily orders grouped by date
  const { data: dailyOrders, error: ordersError } = await supabase
    .from('Order')
    .select('created_at, order_total')
    .order('created_at', { ascending: true });

  if (ordersError) {
    console.error('[Supabase] Error fetching daily orders:', ordersError);
  }

  // Fetch daily ad performance
  let adQuery = supabase
    .from('ad_performance')
    .select('*')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: true });

  if (startDate) {
    adQuery = adQuery.gte('date', startDate);
  }
  if (endDate) {
    adQuery = adQuery.lte('date', endDate);
  }

  const { data: adPerformance, error: adError } = await adQuery;

  if (adError) {
    console.error('[Supabase] Error fetching ad performance:', adError);
  }

  // Group data by date
  const dateMap = new Map<string, any>();

  // Process leads by date
  dailyLeads?.forEach((lead: any) => {
    const date = lead.created_at?.split('T')[0];
    if (!date) return;
    
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        totalOptins: 0,
        totalVipSales: 0,
        totalVipRevenue: 0,
        metaSpend: 0,
        metaClicks: 0,
        metaImpressions: 0,
        metaLinkClicks: 0,
        metaReportedLeads: 0,
        metaReportedPurchases: 0,
        metaLandingPageViews: 0,
        googleSpend: 0,
        googleClicks: 0,
        googleImpressions: 0,
        googleLinkClicks: 0,
        googleReportedLeads: 0,
        googleReportedPurchases: 0,
      });
    }

    const dayData = dateMap.get(date);
    dayData.totalOptins += 1;
  });

  // Process orders by date
  dailyOrders?.forEach((order: any) => {
    const date = order.created_at?.split('T')[0];
    if (!date) return;

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        totalOptins: 0,
        totalVipSales: 0,
        totalVipRevenue: 0,
        metaSpend: 0,
        metaClicks: 0,
        metaImpressions: 0,
        metaLinkClicks: 0,
        metaReportedLeads: 0,
        metaReportedPurchases: 0,
        metaLandingPageViews: 0,
        googleSpend: 0,
        googleClicks: 0,
        googleImpressions: 0,
        googleLinkClicks: 0,
        googleReportedLeads: 0,
        googleReportedPurchases: 0,
      });
    }

    const dayData = dateMap.get(date);
    dayData.totalVipSales += 1;
    dayData.totalVipRevenue += parseFloat(order.order_total || '0');
  });

  // Process ad performance by date and platform
  adPerformance?.forEach((ad: any) => {
    const date = ad.date;
    if (!date) return;

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        totalOptins: 0,
        totalVipSales: 0,
        totalVipRevenue: 0,
        metaSpend: 0,
        metaClicks: 0,
        metaImpressions: 0,
        metaLinkClicks: 0,
        metaReportedLeads: 0,
        metaReportedPurchases: 0,
        metaLandingPageViews: 0,
        googleSpend: 0,
        googleClicks: 0,
        googleImpressions: 0,
        googleLinkClicks: 0,
        googleReportedLeads: 0,
        googleReportedPurchases: 0,
      });
    }

    const dayData = dateMap.get(date);
    const platform = ad.platform?.toLowerCase();

    if (platform === 'meta' || platform === 'facebook') {
      dayData.metaSpend += parseFloat(ad.spend || '0');
      dayData.metaClicks += parseInt(ad.clicks || '0');
      dayData.metaImpressions += parseInt(ad.impressions || '0');
      dayData.metaLinkClicks += parseInt(ad.link_clicks || '0');
      dayData.metaReportedLeads += parseInt(ad.reported_leads || '0');
      dayData.metaReportedPurchases += parseInt(ad.reported_purchases || '0');
      // Calculate landing page views from link clicks and ratio
      const lpViewRatio = parseFloat(ad.landing_page_view_per_link_click || '0');
      dayData.metaLandingPageViews += Math.round(parseInt(ad.link_clicks || '0') * lpViewRatio);
    } else if (platform === 'google') {
      dayData.googleSpend += parseFloat(ad.spend || '0');
      dayData.googleClicks += parseInt(ad.clicks || '0');
      dayData.googleImpressions += parseInt(ad.impressions || '0');
      dayData.googleLinkClicks += parseInt(ad.link_clicks || '0');
      dayData.googleReportedLeads += parseInt(ad.reported_leads || '0');
      dayData.googleReportedPurchases += parseInt(ad.reported_purchases || '0');
    }
  });

  // Convert map to array and calculate derived metrics
  const dailyData = Array.from(dateMap.values()).map(day => {
    const totalSpend = day.metaSpend + day.googleSpend;
    const vipTakeRate = day.totalOptins > 0 ? (day.totalVipSales / day.totalOptins) * 100 : 0;
    const trueCPL = day.totalOptins > 0 ? totalSpend / day.totalOptins : 0;
    const trueCPP = day.totalVipSales > 0 ? totalSpend / day.totalVipSales : 0;
    const roas = totalSpend > 0 ? day.totalVipRevenue / totalSpend : 0;
    const profitLoss = day.totalVipRevenue - totalSpend;

    // Meta metrics
    const metaCPL = day.metaReportedLeads > 0 ? day.metaSpend / day.metaReportedLeads : 0;
    const metaCPP = day.metaReportedPurchases > 0 ? day.metaSpend / day.metaReportedPurchases : 0;
    const metaConnectRate = day.metaClicks > 0 ? (day.metaLandingPageViews / day.metaClicks) * 100 : 0;
    const metaClickToLeadRate = day.metaClicks > 0 ? (day.metaReportedLeads / day.metaClicks) * 100 : 0;
    const metaClickToPurchaseRate = day.metaClicks > 0 ? (day.metaReportedPurchases / day.metaClicks) * 100 : 0;

    // Google metrics
    const googleCPL = day.googleReportedLeads > 0 ? day.googleSpend / day.googleReportedLeads : 0;
    const googleCPP = day.googleReportedPurchases > 0 ? day.googleSpend / day.googleReportedPurchases : 0;
    const googleClickToLeadRate = day.googleClicks > 0 ? (day.googleReportedLeads / day.googleClicks) * 100 : 0;
    const googleClickToPurchaseRate = day.googleClicks > 0 ? (day.googleReportedPurchases / day.googleClicks) * 100 : 0;

    return {
      date: day.date,
      // Summary Data
      totalOptins: day.totalOptins,
      totalVipSales: day.totalVipSales,
      vipTakeRate,
      totalVipRevenue: day.totalVipRevenue,
      // Costs & ROAS
      totalSpend,
      trueCPL,
      trueCPP,
      roas,
      profitLoss,
      // Meta Ads
      metaSpend: day.metaSpend,
      metaCPL,
      metaCPP,
      metaOptins: day.metaReportedLeads,
      metaVipSales: day.metaReportedPurchases,
      metaClicks: day.metaClicks,
      metaImpressions: day.metaImpressions,
      metaLandingPageViews: day.metaLandingPageViews,
      metaConnectRate,
      metaClickToLeadRate,
      metaClickToPurchaseRate,
      // Google Ads
      googleSpend: day.googleSpend,
      googleCPL,
      googleCPP,
      googleOptins: day.googleReportedLeads,
      googleVipSales: day.googleReportedPurchases,
      googleClicks: day.googleClicks,
      googleImpressions: day.googleImpressions,
      googleClickToLeadRate,
      googleClickToPurchaseRate,
    };
  });

  return dailyData;
}
