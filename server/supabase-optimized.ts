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
  if (kpisData && kpisData.length > 0) {
    console.log(`[Overview Metrics] Using daily_kpis (${kpisData.length} days)`);
    
    const totalLeads = kpisData.reduce((sum, row) => sum + (row.total_leads || 0), 0);
    const totalSpend = kpisData.reduce((sum, row) => sum + parseFloat(row.total_spend || '0'), 0);
    const vipSales = kpisData.reduce((sum, row) => sum + (row.vip_sales || 0), 0);
    const vipRevenue = kpisData.reduce((sum, row) => sum + parseFloat(row.vip_revenue || '0'), 0);
    const welcomeEmailClicks = kpisData.reduce((sum, row) => sum + (row.welcome_email_clicks || 0), 0);

    // Calculate derived metrics
    const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
    const costPerPurchase = vipSales > 0 ? totalSpend / vipSales : 0;
    const aov = vipSales > 0 ? vipRevenue / vipSales : 0;
    const roas = totalSpend > 0 ? vipRevenue / totalSpend : 0;
    const vipTakeRate = totalLeads > 0 ? (vipSales / totalLeads) * 100 : 0;

    // Get additional metrics not in daily_kpis (these are still fast queries)
    const { getWisdomContactIds } = await import('./wisdom-filter');
    const wisdomContactIds = await getWisdomContactIds();

    // Kingdom Seeker Trials (product_id = 5)
    const { data: kingdomSeekerData } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('product_id', 5);
    const kingdomSeekerTrials = kingdomSeekerData ? new Set(kingdomSeekerData.map((item: any) => item.order_id)).size : 0;

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
      const endDateTime = new Date(endDate);
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
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      broadcastQuery = broadcastQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: broadcastData } = await broadcastQuery;
    const broadcastSubscribers = broadcastData ? new Set(broadcastData.map((item: any) => item.user_id)).size : 0;

    // Total revenue (all orders, not just wisdom contacts)
    let allOrdersQuery = supabase
      .from('orders')
      .select('order_total');
    
    if (startDate) {
      allOrdersQuery = allOrdersQuery.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
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
