import { supabase } from "./supabase";
import { CAMPAIGN_NAME_FILTER } from "@shared/constants";

/**
 * OPTIMIZED: Get overview metrics from pre-aggregated daily_kpis table
 * This is 10-20x faster than calculating in real-time
 * 
 * Falls back to real-time calculation if daily_kpis is empty
 */
export async function getOverviewMetricsOptimized(startDate?: string, endDate?: string) {
  // Try to get data from daily_kpis first (pre-aggregated by Supabase edge function)
  let kpisQuery = supabase
    .from('daily_kpis')
    .select('*')
    .order('date', { ascending: true });

  if (startDate) {
    kpisQuery = kpisQuery.gte('date', startDate);
  }
  if (endDate) {
    kpisQuery = kpisQuery.lte('date', endDate);
  }

  const { data: kpisData, error: kpisError } = await kpisQuery;

  if (kpisError) {
    console.error('[Overview Metrics] Error fetching daily_kpis:', kpisError);
  }

  // If we have daily_kpis data, aggregate it
  // NOTE: Currently forcing fallback to real-time calculation because daily_kpis table is empty
  // Once n8n workflows populate daily_kpis, change 'false' back to 'kpisData && kpisData.length > 0'
  if (false && kpisData && (kpisData || []).length > 0) {
    console.log(`[Overview Metrics] Using daily_kpis (${kpisData?.length || 0} days)`);
    
    // Get wisdom contacts for the date range to count unique leads
    const { getWisdomContactIds } = await import('./wisdom-filter');
    const wisdomContactIds = await getWisdomContactIds(startDate, endDate);
    const totalLeads = wisdomContactIds.length;
    const totalSpend = (kpisData || []).reduce((sum, row) => {
      const metaSpend = parseFloat(row.total_spend_meta || '0');
      const googleSpend = parseFloat(row.total_spend_google || '0');
      return sum + metaSpend + googleSpend;
    }, 0);
    
    // Count Wisdom+ sales from order_items (product_id 1 = Backstage Pass, 7 = Wisdom+ Experience)
    const { data: wisdomPlusItems } = await supabase
      .from('order_items')
      .select('order_id, products!inner(product_name)')
      .or('product_id.eq.1,product_id.eq.7'); // Backstage Pass or Wisdom+ Experience
    
    const vipSales = (wisdomPlusItems || []).length > 0 ? new Set((wisdomPlusItems || []).map((item: any) => item.order_id)).size : 0;
    
    // Calculate Wisdom+ revenue from order_items
    const { data: wisdomPlusRevenue } = await supabase
      .from('order_items')
      .select('amount')
      .or('product_id.eq.1,product_id.eq.7');
    
    const vipRevenue = (wisdomPlusRevenue || []).reduce((sum, item) => sum + (item.amount || 0), 0);
    const welcomeEmailClicks = (kpisData || []).reduce((sum, row) => sum + (row.welcome_email_clicks || 0), 0);

    // Calculate derived metrics
    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const costPerPurchase = vipSales > 0 ? totalSpend / vipSales : 0;
    const aov = vipSales > 0 ? vipRevenue / vipSales : 0;
    const roas = totalSpend > 0 ? vipRevenue / totalSpend : 0;
    const vipTakeRate = totalLeads > 0 ? (vipSales / totalLeads) * 100 : 0;

    // wisdomContactIds already fetched above for totalLeads calculation

    // Kingdom Seeker Trials (product_id = 8)
    const { data: kingdomSeekerData } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', 8);
    const kingdomSeekerTrials = (kingdomSeekerData || []).length > 0 ? new Set((kingdomSeekerData || []).map((item: any) => item.order_id)).size : 0;

    // ManyChat bot users
    let manychatQuery = supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .in('id', wisdomContactIds)
      .not('manychat_id', 'is', null);
    
    if (startDate) {
      manychatQuery = manychatQuery.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate || new Date());
      endDateTime.setDate(endDateTime.getDate() + 1);
      manychatQuery = manychatQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { count: manychatBotUsers } = await manychatQuery;

    // Broadcast subscribers (from analytics_events)
    let broadcastQuery = supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact', head: false })
      .eq('event_name', 'broadcast_subscribed')
      .in('user_id', wisdomContactIds);
    
    if (startDate) {
      broadcastQuery = broadcastQuery.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate || new Date());
      endDateTime.setDate(endDateTime.getDate() + 1);
      broadcastQuery = broadcastQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: broadcastData } = await broadcastQuery;
    const broadcastSubscribers = (broadcastData || []).length > 0 ? new Set((broadcastData || []).map((item: any) => item.user_id)).size : 0;

    // Total revenue (all orders, not just wisdom contacts)
    let allOrdersQuery = supabase
      .from('orders')
      .select('order_total');
    
    if (startDate) {
      allOrdersQuery = allOrdersQuery.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate || new Date());
      endDateTime.setDate(endDateTime.getDate() + 1);
      allOrdersQuery = allOrdersQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: allOrdersData } = await allOrdersQuery;
    const totalRevenue = allOrdersData?.reduce((sum: number, row: any) => sum + parseFloat(row.order_total || '0'), 0) || 0;

    return {
      totalLeads,
      totalSpend,
      vipSales,
      totalRevenue,
      kingdomSeekerTrials,
      vipTakeRate,
      costPerLead,
      costPerPurchase,
      cpl: costPerLead, // Alias for backward compatibility
      cpp: costPerPurchase, // Alias for backward compatibility
      aov,
      roas,
      vipRevenue,
      manychatBotUsers: manychatBotUsers || 0,
      broadcastSubscribers,
    };
  }

  // Fallback: daily_kpis is empty, use real-time calculation
  console.log('[Overview Metrics] daily_kpis empty, falling back to real-time calculation');
  const { getOverviewMetrics } = await import('./supabase');
  return getOverviewMetrics(startDate, endDate);
}
