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
    .order('date', { ascending: true });

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
    .order('date', { ascending: true });

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
    .order('date', { ascending: true });

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
    .order('date', { ascending: true });

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
    .order('date', { ascending: true });

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


// ============================================
// VIEW 3: ENGAGEMENT & SALES QUERIES
// ============================================

export async function getEngagementMetrics(startDate?: string, endDate?: string) {
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('daily_attendance')
    .select('*')
    .gte('date', startDate || '2025-01-01')
    .lte('date', endDate || '2025-12-31')
    .order('date', { ascending: true });

  if (attendanceError) {
    console.error('[Supabase] Error fetching attendance:', attendanceError);
    return {
      todayAttendance: 0,
      totalAttendance: 0,
      attendanceByDay: [],
    };
  }

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const todayData = (attendanceData || []).filter(a => a.date === today);
  const todayAttendance = todayData.reduce((sum, a) => sum + (a.participant_count || 0), 0);

  // Calculate total attendance
  const totalAttendance = (attendanceData || []).reduce((sum, a) => sum + (a.participant_count || 0), 0);

  // Group by date and platform
  const attendanceByDay = (attendanceData || []).reduce((acc: any[], row) => {
    const existing = acc.find(d => d.date === row.date);
    if (existing) {
      if (row.platform === 'youtube') {
        existing.freeCount = row.participant_count || 0;
      } else if (row.platform === 'zoom') {
        existing.vipCount = row.participant_count || 0;
      }
    } else {
      acc.push({
        date: row.date,
        freeCount: row.platform === 'youtube' ? (row.participant_count || 0) : 0,
        vipCount: row.platform === 'zoom' ? (row.participant_count || 0) : 0,
      });
    }
    return acc;
  }, []);

  return {
    todayAttendance,
    totalAttendance,
    attendanceByDay,
  };
}

export async function getHighTicketSales(startDate?: string, endDate?: string) {
  const { data, error } = await supabase
    .from('high_ticket_sales')
    .select('*')
    .gte('purchase_date', startDate || '2025-01-01')
    .lte('purchase_date', endDate || '2025-12-31')
    .order('purchase_date', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching high ticket sales:', error);
    return {
      todayHtSales: 0,
      totalHtSales: 0,
      totalHtRevenue: 0,
      htSalesList: [],
    };
  }

  // Get today's HT sales
  const today = new Date().toISOString().split('T')[0];
  const todayData = (data || []).filter(s => s.purchase_date.startsWith(today));
  const todayHtSales = todayData.length;

  // Calculate totals
  const totalHtSales = (data || []).length;
  const totalHtRevenue = (data || []).reduce((sum, s) => sum + parseFloat(s.price || 0), 0);

  return {
    todayHtSales,
    totalHtSales,
    totalHtRevenue,
    htSalesList: data || [],
  };
}

export async function getFullFunnelMetrics(startDate?: string, endDate?: string) {
  // Get VIP revenue from Order table
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
  
  const { data: orders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('[Supabase] Error fetching orders for full funnel:', ordersError);
  }

  const vipRevenue = (orders || []).reduce((sum, o) => sum + parseFloat(o.order_total || 0), 0);

  // Get HT revenue
  const { totalHtRevenue, totalHtSales } = await getHighTicketSales(startDate, endDate);

  // Get total ad spend
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
    console.error('[Supabase] Error fetching ad spend for full funnel:', adError);
  }

  const totalSpend = (adData || []).reduce((sum, a) => sum + parseFloat(a.spend || 0), 0);

  // Calculate full funnel ROAS
  const totalRevenue = vipRevenue + totalHtRevenue;
  const fullFunnelRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Calculate HT CPA
  const htCpa = totalHtSales > 0 ? totalSpend / totalHtSales : 0;

  return {
    vipRevenue,
    htRevenue: totalHtRevenue,
    totalRevenue,
    totalSpend,
    fullFunnelRoas,
    htCpa,
    htSalesCount: totalHtSales,
  };
}

/**
 * Get performance comparison by channel (Meta vs Google)
 */
export async function getChannelPerformance(startDate?: string, endDate?: string) {
  // Fetch Meta ad performance
  let metaQuery = supabase
    .from('ad_performance')
    .select('spend, reported_leads, reported_purchases')
    .eq('platform', 'meta')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`);
  
  if (startDate) metaQuery = metaQuery.gte('date', startDate);
  if (endDate) metaQuery = metaQuery.lte('date', endDate);
  
  const { data: metaAds, error: metaError } = await metaQuery;
  if (metaError) console.error('[Supabase] Error fetching Meta ads:', metaError);

  // Fetch Google ad performance
  let googleQuery = supabase
    .from('ad_performance')
    .select('spend, reported_leads, reported_purchases')
    .eq('platform', 'google')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`);
  
  if (startDate) googleQuery = googleQuery.gte('date', startDate);
  if (endDate) googleQuery = googleQuery.lte('date', endDate);
  
  const { data: googleAds, error: googleError } = await googleQuery;
  if (googleError) console.error('[Supabase] Error fetching Google ads:', googleError);

  // Get Meta leads to calculate revenue
  const { data: metaLeadsData } = await supabase
    .from('Lead')
    .select('id')
    .eq('utm_source', 'meta');
  
  const metaLeadIds = metaLeadsData?.map(l => l.id) || [];
  
  const { data: metaOrders } = await supabase
    .from('Order')
    .select('order_total')
    .in('lead_id', metaLeadIds);
  
  const metaRevenue = (metaOrders || []).reduce((sum, o) => sum + parseFloat(o.order_total || '0'), 0);

  // Get Google leads to calculate revenue
  const { data: googleLeadsData } = await supabase
    .from('Lead')
    .select('id')
    .eq('utm_source', 'google');
  
  const googleLeadIds = googleLeadsData?.map(l => l.id) || [];
  
  const { data: googleOrders } = await supabase
    .from('Order')
    .select('order_total')
    .in('lead_id', googleLeadIds);
  
  const googleRevenue = (googleOrders || []).reduce((sum, o) => sum + parseFloat(o.order_total || '0'), 0);

  // Calculate Meta metrics
  const metaSpend = (metaAds || []).reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
  const metaLeads = (metaAds || []).reduce((sum, row) => sum + parseInt(row.reported_leads || '0', 10), 0);
  const metaVips = (metaAds || []).reduce((sum, row) => sum + parseInt(row.reported_purchases || '0', 10), 0);

  // Calculate Google metrics
  const googleSpend = (googleAds || []).reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
  const googleLeads = (googleAds || []).reduce((sum, row) => sum + parseInt(row.reported_leads || '0', 10), 0);
  const googleVips = (googleAds || []).reduce((sum, row) => sum + parseInt(row.reported_purchases || '0', 10), 0);

  return {
    meta: {
      channel: 'Meta',
      spend: metaSpend,
      leads: metaLeads,
      cpl: metaLeads > 0 ? metaSpend / metaLeads : 0,
      vips: metaVips,
      cpp: metaVips > 0 ? metaSpend / metaVips : 0,
      roas: metaSpend > 0 ? metaRevenue / metaSpend : 0,
    },
    google: {
      channel: 'Google',
      spend: googleSpend,
      leads: googleLeads,
      cpl: googleLeads > 0 ? googleSpend / googleLeads : 0,
      vips: googleVips,
      cpp: googleVips > 0 ? googleSpend / googleVips : 0,
      roas: googleSpend > 0 ? googleRevenue / googleSpend : 0,
    },
  };
}

/**
 * Get paginated leads with search and filters
 */
export async function getLeadsPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('Lead')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.search) {
    query = query.or(`email.ilike.%${params.search}%,name.ilike.%${params.search}%,utm_source.ilike.%${params.search}%,utm_campaign.ilike.%${params.search}%,utm_medium.ilike.%${params.search}%`);
  }

  if (params.utmSource) {
    query = query.eq('utm_source', params.utmSource);
  }

  if (params.utmMedium) {
    query = query.eq('utm_medium', params.utmMedium);
  }

  if (params.utmCampaign) {
    query = query.ilike('utm_campaign', `%${params.utmCampaign}%`);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    const endDateTime = new Date(params.endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    query = query.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Error fetching leads:', error);
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get paginated purchases/orders with search and filters
 */
export async function getPurchasesPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('Order')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.search) {
    query = query.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,order_number.ilike.%${params.search}%`);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    const endDateTime = new Date(params.endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    query = query.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }

  if (params.minAmount !== undefined) {
    query = query.gte('order_total', params.minAmount);
  }

  if (params.maxAmount !== undefined) {
    query = query.lte('order_total', params.maxAmount);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Error fetching purchases:', error);
    throw new Error(`Failed to fetch purchases: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get paginated Google Ads campaigns with search and filters
 */
export async function getGoogleCampaignsPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('ad_performance')
    .select('*', { count: 'exact' })
    .eq('platform', 'google')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: true });

  // Apply filters
  if (params.search) {
    query = query.or(`campaign_name.ilike.%${params.search}%,adset_name.ilike.%${params.search}%,ad_name.ilike.%${params.search}%`);
  }

  if (params.startDate) {
    query = query.gte('date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('date', params.endDate);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Error fetching Google campaigns:', error);
    throw new Error(`Failed to fetch Google campaigns: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

/**
 * Get paginated Meta Ads campaigns with search and filters
 */
export async function getMetaCampaignsPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // Build query
  let query = supabase
    .from('ad_performance')
    .select('*', { count: 'exact' })
    .eq('platform', 'meta')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: true });

  // Apply filters
  if (params.search) {
    query = query.or(`campaign_name.ilike.%${params.search}%,adset_name.ilike.%${params.search}%,ad_name.ilike.%${params.search}%`);
  }

  if (params.startDate) {
    query = query.gte('date', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('date', params.endDate);
  }

  // Apply pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('[Supabase] Error fetching Meta campaigns:', error);
    throw new Error(`Failed to fetch Meta campaigns: ${error.message}`);
  }

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}
