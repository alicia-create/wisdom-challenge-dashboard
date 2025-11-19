import { createClient } from '@supabase/supabase-js';

// Supabase connection details
const SUPABASE_URL = 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1bWliY2N4aHBwa3Blam5ydWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzIwNDI5NjgsImV4cCI6MjA0NzYxODk2OH0.KxJQhkxIYVQzNBKQOy5cDKvqBBdTGYZPKCBKVSZqQFg';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
export async function getOverviewMetrics() {
  // Get total leads
  const { count: totalLeads, error: leadsError } = await supabase
    .from('Lead')
    .select('*', { count: 'exact', head: true });

  if (leadsError) {
    console.error('[Supabase] Error counting leads:', leadsError);
  }

  // Get total spend from ad_performance
  const { data: adData, error: adError } = await supabase
    .from('ad_performance')
    .select('spend');

  if (adError) {
    console.error('[Supabase] Error fetching ad spend:', adError);
  }

  const totalSpend = adData?.reduce((sum: number, row: any) => sum + parseFloat(row.spend || '0'), 0) || 0;

  // Get VIP sales (orders)
  const { count: vipSales, error: ordersCountError } = await supabase
    .from('Order')
    .select('*', { count: 'exact', head: true });

  if (ordersCountError) {
    console.error('[Supabase] Error counting orders:', ordersCountError);
  }

  // Get VIP revenue
  const { data: ordersData, error: ordersError } = await supabase
    .from('Order')
    .select('order_total');

  if (ordersError) {
    console.error('[Supabase] Error fetching orders:', ordersError);
  }

  const vipRevenue = ordersData?.reduce((sum: number, row: any) => sum + parseFloat(row.order_total || '0'), 0) || 0;

  // Calculate metrics
  const cpl = totalLeads && totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpp = vipSales && vipSales > 0 ? totalSpend / vipSales : 0;
  const roas = totalSpend > 0 ? vipRevenue / totalSpend : 0;
  const vipTakeRate = totalLeads && totalLeads > 0 ? (vipSales || 0) / totalLeads * 100 : 0;

  return {
    totalLeads: totalLeads || 0,
    totalSpend,
    cpl,
    vipSales: vipSales || 0,
    vipRevenue,
    cpp,
    roas,
    vipTakeRate,
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
