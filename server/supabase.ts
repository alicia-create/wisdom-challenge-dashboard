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
  // Calculate nextDayStr for filtering (avoid timezone issues)
  const nextDayStr = endDate ? (() => {
    const parts = endDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })() : undefined;
  
  // Import wisdom filter
  const { getWisdomContactIds } = await import('./wisdom-filter');
  const wisdomContactIds = await getWisdomContactIds(startDate, endDate);

  if (wisdomContactIds.length === 0) {
    console.log('[Overview Metrics] No wisdom contacts found');
    return {
      totalLeads: 0,
      totalSpend: 0,
      vipSales: 0,
      totalRevenue: 0,
      kingdomSeekerTrials: 0,
      vipTakeRate: 0,
      costPerLead: 0,
      costPerPurchase: 0,
      aov: 0,
      roas: 0,
      manychatBotUsers: 0,
      broadcastSubscribers: 0,
    };
  }

  // Total leads = number of wisdom contacts (already filtered by date in getWisdomContactIds)
  // Note: We use wisdomContactIds.length directly because:
  // 1. getWisdomContactIds already filters by date range
  // 2. Supabase .in() has a limit of ~1000 IDs which causes incorrect counts
  const totalLeads = wisdomContactIds.length;
  console.log(`[Overview Metrics] Total leads from wisdom filter: ${totalLeads}`);

   // Get total ad spend from ad_performance table (Meta + Google)
  let metaAdQuery = supabase
    .from('ad_performance')
    .select('spend')
    .ilike('platform', 'meta');
  
  if (startDate) {
    metaAdQuery = metaAdQuery.gte('date', startDate);
  }
  if (endDate) {
    metaAdQuery = metaAdQuery.lte('date', endDate);
  }
  
  let googleAdQuery = supabase
    .from('ad_performance')
    .select('spend')
    .ilike('platform', 'google');
  
  if (startDate) {
    googleAdQuery = googleAdQuery.gte('date', startDate);
  }
  if (endDate) {
    googleAdQuery = googleAdQuery.lte('date', endDate);
  }
  
  const { data: metaAdData, error: metaAdError } = await metaAdQuery;
  const { data: googleAdData, error: googleAdError } = await googleAdQuery;

  if (metaAdError) {
    console.error('[Supabase] Error fetching Meta ad spend:', metaAdError);
  }
  if (googleAdError) {
    console.error('[Supabase] Error fetching Google ad spend:', googleAdError);
  }

  const metaSpend = metaAdData?.reduce((sum: number, row: any) => sum + parseFloat(row.spend || '0'), 0) || 0;
  const googleSpend = googleAdData?.reduce((sum: number, row: any) => sum + parseFloat(row.spend || '0'), 0) || 0;
  const totalSpend = metaSpend + googleSpend;

  // Get VIP sales count (orders with total >= $31, wisdom funnel contacts only)
  let ordersCountQuery = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .in('contact_id', wisdomContactIds)
    .gte('order_total', 31);
  
  if (startDate) {
    ordersCountQuery = ordersCountQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    ordersCountQuery = ordersCountQuery.lt('created_at', nextDayStr);
  }
  
  const { count: vipSales, error: ordersCountError } = await ordersCountQuery;

  if (ordersCountError) {
    console.error('[Supabase] Error counting orders:', ordersCountError);
  }

  // Get VIP revenue (orders with total >= $31, wisdom funnel contacts only)
  let ordersQuery = supabase
    .from('orders')
    .select('order_total')
    .in('contact_id', wisdomContactIds)
    .gte('order_total', 31);
  
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    ordersQuery = ordersQuery.lt('created_at', nextDayStr);
  }
  
  const { data: ordersData, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('[Supabase] Error fetching orders:', ordersError);
  }

  const vipRevenue = ordersData?.reduce((sum: number, row: any) => sum + parseFloat(row.order_total || '0'), 0) || 0;

  // Get Kingdom Seeker Trials count (product_id = 8)
  // Need to join with orders table to filter by date
  let kingdomSeekerQuery = supabase
    .from('order_items')
    .select('order_id, orders!inner(created_at)')
    .eq('product_id', 8);
  
  // Apply date filters to orders.created_at
  if (startDate) {
    kingdomSeekerQuery = kingdomSeekerQuery.gte('orders.created_at', startDate);
  }
  if (endDate) {
    kingdomSeekerQuery = kingdomSeekerQuery.lte('orders.created_at', endDate);
  }
  
  const { data: kingdomSeekerData } = await kingdomSeekerQuery;
  const kingdomSeekerTrials = kingdomSeekerData ? new Set(kingdomSeekerData.map((item: any) => item.order_id)).size : 0;

  // Get TOTAL revenue from ALL orders (not just wisdom contacts, to include organic traffic)
  let allOrdersQuery = supabase
    .from('orders')
    .select('order_total');
  
  if (startDate) {
    allOrdersQuery = allOrdersQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    allOrdersQuery = allOrdersQuery.lt('created_at', nextDayStr);
  }
  
  const { data: allOrdersData } = await allOrdersQuery;
  const totalRevenue = allOrdersData?.reduce((sum: number, row: any) => sum + parseFloat(row.order_total || '0'), 0) || 0;

  // Get ManyChat bot users (contacts with manychat_id)
  let manychatQuery = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .in('id', wisdomContactIds)
    .not('manychat_id', 'is', null);
  
  if (startDate) {
    manychatQuery = manychatQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    manychatQuery = manychatQuery.lt('created_at', nextDayStr);
  }
  
  const { count: manychatBotUsers } = await manychatQuery;

  // Get broadcast subscribers from Keap API
  let broadcastSubscribers = 0;
  try {
    const { getEmailEngagementMetrics } = await import('./keap');
    const emailMetrics = await getEmailEngagementMetrics();
    broadcastSubscribers = emailMetrics.reminderOptins + emailMetrics.replayOptins + emailMetrics.promoOptins;
  } catch (error) {
    console.error('[Overview Metrics] Failed to fetch Keap email metrics:', error);
  }

  // Calculate metrics
  const cpl = totalLeads && totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpp = vipSales && vipSales > 0 ? totalSpend / vipSales : 0;
  const roas = totalSpend > 0 ? vipRevenue / totalSpend : 0;
  const vipTakeRate = totalLeads && totalLeads > 0 ? (vipSales || 0) / totalLeads * 100 : 0;
  const aov = vipSales && vipSales > 0 ? vipRevenue / vipSales : 0;

  return {
    totalLeads: totalLeads || 0,
    totalSpend,
    totalRevenue,
    vipSales: vipSales || 0,
    kingdomSeekerTrials,
    cpl,
    cpp,
    aov,
    roas,
    vipTakeRate,
    vipRevenue,
    manychatBotUsers: manychatBotUsers || 0,
    broadcastSubscribers,
  };
}

/**
 * Helper to fetch leads with UTM attribution
 */
export async function getLeadsWithAttribution(limit = 100) {
  const { data, error } = await supabase
    .from('contacts')
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
    .from('orders')
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
// TODO: Update to use analytics_events table when ready
export async function getDailyAttendance(startDate?: string, endDate?: string) {
  // Temporarily return empty array until analytics_events is configured
  console.log('[Supabase] getDailyAttendance: daily_attendance table removed, returning empty array');
  return [];
}

/**
 * Helper to get email engagement metrics
 */
export async function getEmailEngagement() {
  const { count: totalLeads } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });

  const { count: clickedCount } = await supabase
    .from('contacts')
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

  
  // Calculate nextDayStr for filtering (used in multiple places)
  const nextDayStr = endDate ? (() => {
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split('T')[0];
  })() : undefined;
  
  // Import wisdom filter
  // Note: We don't pass date filter to getWisdomContactIds because we want ALL wisdom contacts,
  // then filter their leads/orders by created_at date
  const { getWisdomContactIds } = await import('./wisdom-filter');
  const wisdomContactIds = await getWisdomContactIds();
  

  if (wisdomContactIds.length === 0) {
    return [];
  }

  // Build date filter
  const dateFilter: any = {};
  if (startDate) dateFilter.gte = startDate;
  if (endDate) dateFilter.lte = endDate;

  // Fetch daily leads grouped by date (wisdom funnel only)
  let leadsQuery = supabase
    .from('contacts')
    .select('id, created_at')
    .in('id', wisdomContactIds)
    .order('created_at', { ascending: true});
  
  // Apply date filters to created_at
  if (startDate) {
    leadsQuery = leadsQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    // Use next day with < instead of <= to include entire end date
    leadsQuery = leadsQuery.lt('created_at', nextDayStr);
  }
  
  const { data: dailyLeads, error: leadsError } = await leadsQuery;

  if (leadsError) {
    console.error('[Supabase] Error fetching daily leads:', leadsError);
  }
  
  // Fetch daily orders grouped by date (wisdom funnel contacts only)
  let ordersQuery = supabase
    .from('orders')
    .select('contact_id, created_at, order_total')
    .in('contact_id', wisdomContactIds)
    .order('created_at', { ascending: true});
  
  // Apply date filters to created_at
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    // Use next day with < instead of <= to include entire end date
    ordersQuery = ordersQuery.lt('created_at', nextDayStr);
  }
  
  const { data: dailyOrders, error: ordersError } = await ordersQuery;

  if (ordersError) {
    console.error('[Supabase] Error fetching daily orders:', ordersError);
  }

  // Fetch daily ad performance
  let adQuery = supabase
    .from('ad_performance')
    .select('*')
    .ilike('campaign_name', `%${CAMPAIGN_NAME_FILTER}%`)
    .order('date', { ascending: true });
  
  // Apply date filters
  if (startDate) {
    adQuery = adQuery.gte('date', startDate);
  }
  if (nextDayStr) {
    // Use next day with < instead of <= to include entire end date
    adQuery = adQuery.lt('date', nextDayStr);
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

  // Process orders by date (only count orders >= $31 as VIP Sales)
  dailyOrders?.forEach((order: any) => {
    const date = order.created_at?.split('T')[0];
    if (!date) return;
    
    const orderTotal = parseFloat(order.order_total || '0');
    if (orderTotal < 31) return; // Only count VIP sales (>= $31)

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
    dayData.totalVipRevenue += orderTotal;
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

  // Filter dateMap to only include dates within the requested range
  console.log(`[Daily Analysis] Before filter: dateMap has ${dateMap.size} days:`, Array.from(dateMap.keys()).sort().join(', '));
  console.log(`[Daily Analysis] Filtering for range: ${startDate} to ${endDate}`);
  
  const filteredDates = Array.from(dateMap.values()).filter(day => {
    // Always apply filter if startDate or endDate is provided
    let include = true;
    if (startDate && day.date < startDate) include = false;
    if (endDate && nextDayStr && day.date >= nextDayStr) include = false;
    return include;
  });
  
  console.log(`[Daily Analysis] Filtered to ${filteredDates.length} days within range ${startDate} to ${endDate}`);
  console.log(`[Daily Analysis] Filtered dates:`, filteredDates.map(d => d.date).sort().join(', '));
  
  // Convert map to array and calculate derived metrics
  const dailyData = filteredDates.map(day => {
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
      // Frontend-compatible field names for charts
      total_leads: day.totalOptins,
      vip_sales: day.totalVipSales,
      total_spend_meta: day.metaSpend,
      total_spend_google: day.googleSpend,
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
  // TODO: Update to use analytics_events table when ready
  console.log('[Supabase] getEngagementMetrics: daily_attendance table removed, returning zero attendance');
  
  return {
    todayAttendance: 0,
    totalAttendance: 0,
    attendanceByDay: [],
  };
}

export async function getHighTicketSales(startDate?: string, endDate?: string) {
  // High-ticket sales are now in orders table with order_items > $1000
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items!inner (
        amount,
        quantity,
        products (
          product_name
        )
      ),
      contacts (
        email,
        full_name
      )
    `)
    .gte('purchase_date', startDate || '2025-01-01')
    .lte('purchase_date', endDate || '2025-12-31')
    .gte('order_total', 1000)
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
  const todayData = (data || []).filter(s => s.purchase_date?.startsWith(today));
  const todayHtSales = todayData.length;

  // Calculate totals
  const totalHtSales = (data || []).length;
  const totalHtRevenue = (data || []).reduce((sum, s) => sum + parseFloat(s.order_total || 0), 0);

  return {
    todayHtSales,
    totalHtSales,
    totalHtRevenue,
    htSalesList: data || [],
  };
}

export async function getFullFunnelMetrics(startDate?: string, endDate?: string) {
  // Calculate nextDayStr for filtering (avoid timezone issues)
  const nextDayStr = endDate ? (() => {
    const parts = endDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })() : undefined;
  
  // Get VIP revenue from Order table
  let ordersQuery = supabase
    .from('orders')
    .select('order_total');
  
  if (startDate) {
    ordersQuery = ordersQuery.gte('created_at', startDate);
  }
  if (nextDayStr) {
    ordersQuery = ordersQuery.lt('created_at', nextDayStr);
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
    .select('spend, reported_leads, reported_purchases, campaign_name, link_clicks, landing_page_views')
    .ilike('platform', 'meta');
  
  if (startDate) metaQuery = metaQuery.gte('date', startDate);
  if (endDate) metaQuery = metaQuery.lte('date', endDate);
  
  const { data: metaAds, error: metaError } = await metaQuery;
  if (metaError) console.error('[Supabase] Error fetching Meta ads:', metaError);

  // Fetch Google ad performance
  let googleQuery = supabase
    .from('ad_performance')
    .select('spend, reported_leads, reported_purchases, campaign_name')
    .ilike('platform', 'google');
  
  if (startDate) googleQuery = googleQuery.gte('date', startDate);
  if (endDate) googleQuery = googleQuery.lte('date', endDate);
  
  const { data: googleAds, error: googleError } = await googleQuery;
  if (googleError) console.error('[Supabase] Error fetching Google ads:', googleError);

  // Get Meta leads to calculate revenue
  const { data: metaLeadsData } = await supabase
    .from('contacts')
    .select('id')
    .eq('utm_source', 'meta');
  
  const metaLeadIds = metaLeadsData?.map(l => l.id) || [];
  
  const { data: metaOrders } = await supabase
    .from('orders')
    .select('order_total')
    .in('lead_id', metaLeadIds);
  
  const metaRevenue = (metaOrders || []).reduce((sum, o) => sum + parseFloat(o.order_total || '0'), 0);

  // Get Google leads to calculate revenue
  const { data: googleLeadsData } = await supabase
    .from('contacts')
    .select('id')
    .eq('utm_source', 'google');
  
  const googleLeadIds = googleLeadsData?.map(l => l.id) || [];
  
  const { data: googleOrders } = await supabase
    .from('orders')
    .select('order_total')
    .in('lead_id', googleLeadIds);
  
  const googleRevenue = (googleOrders || []).reduce((sum, o) => sum + parseFloat(o.order_total || '0'), 0);

  // Calculate Meta metrics
  const metaSpend = (metaAds || []).reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
  const metaLeads = (metaAds || []).reduce((sum, row) => sum + parseInt(row.reported_leads || '0', 10), 0);
  const metaVips = (metaAds || []).reduce((sum, row) => sum + parseInt(row.reported_purchases || '0', 10), 0);
  const metaClicks = (metaAds || []).reduce((sum, row) => sum + parseInt(row.link_clicks || '0', 10), 0);
  
  // Calculate landing page views directly from the landing_page_views column
  const metaLandingPageViews = (metaAds || []).reduce((sum, row) => {
    return sum + parseInt(row.landing_page_views || '0', 10);
  }, 0);

  // Calculate Google metrics
  const googleSpend = (googleAds || []).reduce((sum, row) => sum + parseFloat(row.spend || '0'), 0);
  const googleLeads = (googleAds || []).reduce((sum, row) => sum + parseInt(row.reported_leads || '0', 10), 0);
  const googleVips = (googleAds || []).reduce((sum, row) => sum + parseInt(row.reported_purchases || '0', 10), 0);

  // Helper function to detect campaign type from campaign_name
  const getCampaignType = (campaignName: string): string => {
    if (!campaignName) return 'Other';
    if (campaignName.includes('[SALES]')) return 'Sales';
    if (campaignName.includes('[LEADS]')) return 'Leads';
    if (campaignName.includes('[RMKT]')) return 'Retargeting';
    if (campaignName.includes('[KLT]')) return 'Content';
    return 'Other';
  };

  // Calculate Meta breakdown by campaign type
  const metaBreakdown = (metaAds || []).reduce((acc: Record<string, { spend: number; leads: number; vips: number; clicks: number; landingPageViews: number }>, row) => {
    const type = getCampaignType(row.campaign_name || '');
    if (!acc[type]) acc[type] = { spend: 0, leads: 0, vips: 0, clicks: 0, landingPageViews: 0 };
    acc[type].spend += parseFloat(row.spend || '0');
    acc[type].leads += parseInt(row.reported_leads || '0', 10);
    acc[type].vips += parseInt(row.reported_purchases || '0', 10);
    acc[type].clicks += parseInt(row.link_clicks || '0', 10);
    acc[type].landingPageViews += parseInt(row.landing_page_views || '0', 10);
    return acc;
  }, {});

  // Calculate Google breakdown by campaign type
  const googleBreakdown = (googleAds || []).reduce((acc: Record<string, { spend: number; leads: number; vips: number }>, row) => {
    const type = getCampaignType(row.campaign_name || '');
    if (!acc[type]) acc[type] = { spend: 0, leads: 0, vips: 0 };
    acc[type].spend += parseFloat(row.spend || '0');
    acc[type].leads += parseInt(row.reported_leads || '0', 10);
    acc[type].vips += parseInt(row.reported_purchases || '0', 10);
    return acc;
  }, {});

  return {
    meta: {
      channel: 'Meta',
      spend: metaSpend,
      leads: metaLeads,
      cpl: metaLeads > 0 ? metaSpend / metaLeads : 0,
      vips: metaVips,
      cpp: metaVips > 0 ? metaSpend / metaVips : 0,
      roas: metaSpend > 0 ? metaRevenue / metaSpend : 0,
      clicks: metaClicks,
      landingPageViews: metaLandingPageViews,
      connectRate: metaClicks > 0 ? (metaLandingPageViews / metaClicks) * 100 : 0,
      clickToLeadRate: metaClicks > 0 ? (metaLeads / metaClicks) * 100 : 0,
      clickToPurchaseRate: metaClicks > 0 ? (metaVips / metaClicks) * 100 : 0,
      breakdown: metaBreakdown,
    },
    google: {
      channel: 'Google',
      spend: googleSpend,
      leads: googleLeads,
      cpl: googleLeads > 0 ? googleSpend / googleLeads : 0,
      vips: googleVips,
      cpp: googleVips > 0 ? googleSpend / googleVips : 0,
      roas: googleSpend > 0 ? googleRevenue / googleSpend : 0,
      breakdown: googleBreakdown,
    },
  };
}

/**
 * Get paginated contacts with search and filters
 * Now filters to show only contacts from "wisdom" funnel using analytics_events
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

  // Get wisdom contact IDs using shared filter
  const { getWisdomContactIds } = await import('./wisdom-filter');
  const wisdomContactIds = await getWisdomContactIds();

  console.log(`[Leads Paginated] Found ${wisdomContactIds.length} contacts from Wisdom funnel`);

  // Build query for contacts
  let query = supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Filter to only wisdom funnel contacts
  if (wisdomContactIds.length > 0) {
    query = query.in('id', wisdomContactIds);
  } else {
    // If no wisdom contacts found, return empty result
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Apply filters (contacts table has: email, full_name, first_name, last_name)
  // Enhanced search: also search in analytics_events for UTM data, funnel names, etc
  if (params.search) {
    // First search in contacts table
    const contactMatches = wisdomContactIds;
    
    // Then search in analytics_events for matching comment or value
    const { data: searchEvents } = await supabase
      .from('analytics_events')
      .select('contact_id')
      .or(`comment.ilike.%${params.search}%,value.ilike.%${params.search}%`)
      .in('contact_id', wisdomContactIds);
    
    const searchContactIds = searchEvents
      ? Array.from(new Set(searchEvents.map(e => e.contact_id)))
      : [];
    
    // Combine: contacts matching in contacts table OR in analytics_events
    if (searchContactIds.length > 0) {
      query = query.or(
        `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,id.in.(${searchContactIds.join(',')})`
      );
    } else {
      // Only search in contacts table fields
      query = query.or(
        `email.ilike.%${params.search}%,full_name.ilike.%${params.search}%,first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%`
      );
    }
  }

  // UTM filters are ignored since contacts table doesn't have UTM fields
  // UTM data is in analytics_events table

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
  productId?: number;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;
  const offset = (page - 1) * pageSize;

  // If filtering by product, first get order IDs that have that product
  let orderIdsWithProduct: number[] | undefined;
  if (params.productId !== undefined) {
    const { data: orderItems, error: orderItemsError } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', params.productId);
    
    if (orderItemsError) {
      console.error('[Supabase] Error fetching order items:', orderItemsError);
      throw new Error(`Failed to fetch order items: ${orderItemsError.message}`);
    }
    
    orderIdsWithProduct = orderItems?.map(item => item.order_id) || [];
    
    // If no orders have this product, return empty result
    if (orderIdsWithProduct.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }
  
  // Build query with contact join for name and email
  let query = supabase
    .from('orders')
    .select(`*,
      contacts (
        full_name,
        email
      )`, { count: 'exact' })
    .order('created_at', { ascending: false});
  
  // Filter by order IDs if product filter is active
  if (orderIdsWithProduct !== undefined) {
    query = query.in('id', orderIdsWithProduct);
  }

  // Apply filters
  if (params.search) {
    // Search in order number, contact name, and email
    // Note: We can't search contact fields directly in the orders table query
    // So we only search in clickfunnels_order_number here
    // For name/email search, we'll need to filter in-memory after the query
    query = query.ilike('clickfunnels_order_number', `%${params.search}%`);
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

  // Product filter is already applied via orderIdsWithProduct

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
    .ilike('platform', 'google')
    .order('date', { ascending: false });

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
    .ilike('platform', 'meta')
    .order('date', { ascending: false });

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

/**
 * Get funnel conversion metrics for step-by-step visualization
 * Returns counts for each step: step1 → step2 → step3 → checkout → purchase
 */
export async function getFunnelConversionMetrics(startDate?: string, endDate?: string) {
  try {
    // Get total clicks (funnel entry point)
    let clicksQuery = supabase
      .from('ad_performance')
      .select('clicks')
      .eq('campaign_name', CAMPAIGN_NAME_FILTER);
    
    if (startDate) clicksQuery = clicksQuery.gte('date', startDate);
    if (endDate) clicksQuery = clicksQuery.lte('date', endDate);
    
    const { data: clicksData } = await clicksQuery;
    const totalClicks = clicksData?.reduce((sum, row) => sum + (row.clicks || 0), 0) || 0;

    // Get landing page views (step1)
    let lpViewsQuery = supabase
      .from('ad_performance')
      .select('landing_page_views')
      .eq('campaign_name', CAMPAIGN_NAME_FILTER);
    
    if (startDate) lpViewsQuery = lpViewsQuery.gte('date', startDate);
    if (endDate) lpViewsQuery = lpViewsQuery.lte('date', endDate);
    
    const { data: lpViewsData } = await lpViewsQuery;
    const totalLandingPageViews = lpViewsData?.reduce((sum, row) => sum + (row.landing_page_views || 0), 0) || 0;

    // Get leads (step2 - optin)
    let leadsQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });
    
    if (startDate) leadsQuery = leadsQuery.gte('created_at', startDate);
    if (endDate) leadsQuery = leadsQuery.lte('created_at', endDate);
    
    const { count: totalLeads } = await leadsQuery;

    // Get VIP purchases (step3 - VIP offer)
    let vipQuery = supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true })
      .eq('product_type', 'VIP');
    
    if (startDate) vipQuery = vipQuery.gte('created_at', startDate);
    if (endDate) vipQuery = vipQuery.lte('created_at', endDate);
    
    const { count: totalVIP } = await vipQuery;

    // Get all purchases (final conversion)
    let purchasesQuery = supabase
      .from('purchases')
      .select('id', { count: 'exact', head: true });
    
    if (startDate) purchasesQuery = purchasesQuery.gte('created_at', startDate);
    if (endDate) purchasesQuery = purchasesQuery.lte('created_at', endDate);
    
    const { count: totalPurchases } = await purchasesQuery;

    // Calculate percentages based on total clicks
    const calculatePercentage = (count: number) => {
      return totalClicks > 0 ? (count / totalClicks) * 100 : 0;
    };

    return {
      steps: [
        {
          name: "Ad Clicks",
          count: totalClicks,
          percentage: 100,
        },
        {
          name: "Step 1: Landing Page Views",
          count: totalLandingPageViews,
          percentage: calculatePercentage(totalLandingPageViews),
        },
        {
          name: "Step 1: Leads (Optin)",
          count: totalLeads || 0,
          percentage: calculatePercentage(totalLeads || 0),
        },
        {
          name: "Step 2: Purchases (VIP)",
          count: totalVIP || 0,
          percentage: calculatePercentage(totalVIP || 0),
        },
        {
          name: "Step 3: OTO (Upsell)",
          count: totalPurchases || 0,
          percentage: calculatePercentage(totalPurchases || 0),
        },
      ],
    };
  } catch (error) {
    console.error('[Supabase] Error fetching funnel metrics:', error);
    return {
      steps: [],
    };
  }
}


/**
 * Helper to fetch journals metrics from edge function
 */
export async function getJournalsMetrics(startDate?: string, endDate?: string) {
  const { data, error } = await supabase.rpc('get_journals_metrics', {
    p_start_date: startDate || null,
    p_end_date: endDate || null,
  });

  if (error) {
    console.error('[Supabase] Error fetching journals metrics:', error);
    return {
      wisdomJournals: 0,
      extraJournals: 0,
      totalJournals: 0,
      journalGoal: 20000,
      journalProgress: 0,
      journalsRemaining: 20000,
    };
  }

  return data;
}
