import { supabase } from './supabase';

/**
 * Get conversion funnel metrics
 * 
 * Funnel stages:
 * 1. Lead (contact created)
 * 2. Wisdom+ Purchase (product_id 1 or 7)
 * 3. Kingdom Seekers Trial (product_id 8)
 * 4. ManyChat Connected (manychat_id not null)
 * 5. Bot Alerts Subscribed (ntn_subscribe event)
 */
export async function getFunnelMetrics(startDate?: string, endDate?: string) {
  // Stage 1: Total Leads
  let leadsQuery = supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true });
  
  if (startDate) leadsQuery = leadsQuery.gte('created_at', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    leadsQuery = leadsQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { count: totalLeads } = await leadsQuery;

  // Stage 2: Wisdom+ Purchases (product_id 1 = Backstage Pass, 7 = Wisdom+ Experience)
  let wisdomQuery = supabase
    .from('order_items')
    .select('order_id')
    .or('product_id.eq.1,product_id.eq.7');
  
  if (startDate || endDate) {
    // Join with orders to filter by date
    let ordersSubquery = supabase
      .from('orders')
      .select('id');
    
    if (startDate) ordersSubquery = ordersSubquery.gte('created_at', startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      ordersSubquery = ordersSubquery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: orderIds } = await ordersSubquery;
    const validOrderIds = orderIds?.map(o => o.id) || [];
    
    if (validOrderIds.length > 0) {
      wisdomQuery = wisdomQuery.in('order_id', validOrderIds);
    } else {
      // No orders in date range
      const wisdomPurchases = 0;
      const kingdomSeekerTrials = 0;
      const manychatConnected = 0;
      const botAlertsSubscribed = 0;
      
      return {
        totalLeads: totalLeads || 0,
        wisdomPurchases,
        kingdomSeekerTrials,
        manychatConnected,
        botAlertsSubscribed,
        leadToWisdomRate: 0,
        wisdomToKingdomRate: 0,
        kingdomToManychatRate: 0,
        manychatToBotAlertsRate: 0,
      };
    }
  }
  
  const { data: wisdomItems } = await wisdomQuery;
  const wisdomPurchases = wisdomItems ? new Set(wisdomItems.map(item => item.order_id)).size : 0;

  // Stage 3: Kingdom Seekers Trial (product_id 8)
  let kingdomQuery = supabase
    .from('order_items')
    .select('order_id')
    .eq('product_id', 8);
  
  if (startDate || endDate) {
    let ordersSubquery = supabase
      .from('orders')
      .select('id');
    
    if (startDate) ordersSubquery = ordersSubquery.gte('created_at', startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      ordersSubquery = ordersSubquery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: orderIds } = await ordersSubquery;
    const validOrderIds = orderIds?.map(o => o.id) || [];
    
    if (validOrderIds.length > 0) {
      kingdomQuery = kingdomQuery.in('order_id', validOrderIds);
    }
  }
  
  const { data: kingdomItems } = await kingdomQuery;
  const kingdomSeekerTrials = kingdomItems ? new Set(kingdomItems.map(item => item.order_id)).size : 0;

  // Stage 4: ManyChat Connected (contacts with manychat_id)
  let manychatQuery = supabase
    .from('contacts')
    .select('id', { count: 'exact', head: true })
    .not('manychat_id', 'is', null);
  
  if (startDate) manychatQuery = manychatQuery.gte('created_at', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    manychatQuery = manychatQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { count: manychatConnected } = await manychatQuery;

  // Stage 5: Bot Alerts Subscribed (ntn_subscribe event in analytics_events)
  let botAlertsQuery = supabase
    .from('analytics_events')
    .select('contact_id', { count: 'exact', head: false })
    .eq('event_name', 'ntn_subscribe');
  
  if (startDate) botAlertsQuery = botAlertsQuery.gte('timestamp', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    botAlertsQuery = botAlertsQuery.lt('timestamp', endDateTime.toISOString().split('T')[0]);
  }
  
  const { data: botAlertsData } = await botAlertsQuery;
  const botAlertsSubscribed = botAlertsData ? new Set(botAlertsData.map(item => item.contact_id)).size : 0;

  // Calculate conversion rates
  const leadToWisdomRate = totalLeads && totalLeads > 0 ? (wisdomPurchases / totalLeads) * 100 : 0;
  const wisdomToKingdomRate = wisdomPurchases > 0 ? (kingdomSeekerTrials / wisdomPurchases) * 100 : 0;
  const kingdomToManychatRate = kingdomSeekerTrials > 0 ? (manychatConnected || 0) / kingdomSeekerTrials * 100 : 0;
  const manychatToBotAlertsRate = manychatConnected && manychatConnected > 0 ? (botAlertsSubscribed / manychatConnected) * 100 : 0;

  return {
    totalLeads: totalLeads || 0,
    wisdomPurchases,
    kingdomSeekerTrials,
    manychatConnected: manychatConnected || 0,
    botAlertsSubscribed,
    leadToWisdomRate,
    wisdomToKingdomRate,
    kingdomToManychatRate,
    manychatToBotAlertsRate,
  };
}

/**
 * Get VSL performance metrics from Vidalytics events
 * 
 * VSL watch milestones:
 * - vsl_5_percent
 * - vsl_25_percent
 * - vsl_75_percent
 * - vsl_95_percent
 */
export async function getVSLMetrics(startDate?: string, endDate?: string) {
  // Get all VSL events
  let vslQuery = supabase
    .from('analytics_events')
    .select('event_name, contact_id')
    .or('event_name.eq.vsl_5_percent,event_name.eq.vsl_25_percent,event_name.eq.vsl_75_percent,event_name.eq.vsl_95_percent');
  
  if (startDate) vslQuery = vslQuery.gte('timestamp', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    vslQuery = vslQuery.lt('timestamp', endDateTime.toISOString().split('T')[0]);
  }
  
  const { data: vslEvents } = await vslQuery;

  // Count unique contacts for each milestone
  const vsl5Percent = vslEvents ? new Set(vslEvents.filter(e => e.event_name === 'vsl_5_percent').map(e => e.contact_id)).size : 0;
  const vsl25Percent = vslEvents ? new Set(vslEvents.filter(e => e.event_name === 'vsl_25_percent').map(e => e.contact_id)).size : 0;
  const vsl75Percent = vslEvents ? new Set(vslEvents.filter(e => e.event_name === 'vsl_75_percent').map(e => e.contact_id)).size : 0;
  const vsl95Percent = vslEvents ? new Set(vslEvents.filter(e => e.event_name === 'vsl_95_percent').map(e => e.contact_id)).size : 0;

  // Get Wisdom+ purchases in the same period
  let wisdomQuery = supabase
    .from('order_items')
    .select('order_id')
    .or('product_id.eq.1,product_id.eq.7');
  
  if (startDate || endDate) {
    let ordersSubquery = supabase
      .from('orders')
      .select('id');
    
    if (startDate) ordersSubquery = ordersSubquery.gte('created_at', startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      ordersSubquery = ordersSubquery.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }
    
    const { data: orderIds } = await ordersSubquery;
    const validOrderIds = orderIds?.map(o => o.id) || [];
    
    if (validOrderIds.length > 0) {
      wisdomQuery = wisdomQuery.in('order_id', validOrderIds);
    }
  }
  
  const { data: wisdomItems } = await wisdomQuery;
  const wisdomPurchases = wisdomItems ? new Set(wisdomItems.map(item => item.order_id)).size : 0;

  // Calculate conversion rate from VSL view to purchase
  const vslToPurchaseRate = vsl5Percent > 0 ? (wisdomPurchases / vsl5Percent) * 100 : 0;

  return {
    vsl5Percent,
    vsl25Percent,
    vsl75Percent,
    vsl95Percent,
    wisdomPurchases,
    vslToPurchaseRate,
  };
}
