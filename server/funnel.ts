import { supabase } from './supabase';
import { getWisdomContactIds } from './wisdom-filter';

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
export async function getFunnelMetrics(
  startDate?: string, 
  endDate?: string,
  contactIdsFilter?: number[] // Optional: pre-filtered contact IDs
) {
  // Stage 1: Total Leads (wisdom contacts only)
  const wisdomContactIds = contactIdsFilter || await getWisdomContactIds(startDate, endDate);
  const totalLeads = wisdomContactIds.length;

  // Stage 2: Wisdom+ Purchases (product_id 1 = Backstage Pass, 7 = Wisdom+ Experience)
  // First get orders from the filtered contacts
  const { data: contactOrders } = await supabase
    .from('orders')
    .select('id')
    .in('contact_id', wisdomContactIds);
  
  const contactOrderIds = contactOrders?.map(o => o.id) || [];
  
  if (contactOrderIds.length === 0) {
    return {
      totalLeads: totalLeads || 0,
      wisdomPurchases: 0,
      kingdomSeekerTrials: 0,
      manychatConnected: 0,
      botAlertsSubscribed: 0,
      leadToWisdomRate: 0,
      wisdomToKingdomRate: 0,
      kingdomToManychatRate: 0,
      manychatToBotAlertsRate: 0,
    };
  }
  
  let wisdomQuery = supabase
    .from('order_items')
    .select('order_id')
    .or('product_id.eq.1,product_id.eq.7')
    .in('order_id', contactOrderIds);
  
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
    .eq('product_id', 8)
    .in('order_id', contactOrderIds);
  
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
    .not('manychat_id', 'is', null)
    .in('id', wisdomContactIds);
  
  if (startDate) manychatQuery = manychatQuery.gte('created_at', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    manychatQuery = manychatQuery.lt('created_at', endDateTime.toISOString().split('T')[0]);
  }
  
  const { count: manychatConnected } = await manychatQuery;

  // Stage 5: Bot Alerts Subscribed (manychat.add_tag with gold.ntn.request_accepted)
  let botAlertsQuery = supabase
    .from('analytics_events')
    .select('contact_id', { count: 'exact', head: false })
    .eq('name', 'manychat.add_tag')
    .eq('value', 'gold.ntn.request_accepted')
    .in('contact_id', wisdomContactIds);
  
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
  // ManyChat is available to all leads, so calculate rate from total leads
  const leadToManychatRate = totalLeads && totalLeads > 0 ? (manychatConnected || 0) / totalLeads * 100 : 0;
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
    leadToManychatRate, // New: Leads → ManyChat conversion rate
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
  // Get all VSL events (vidalytics.view_video with Wisdom Upgrade milestones)
  let vslQuery = supabase
    .from('analytics_events')
    .select('name, value, contact_id')
    .eq('name', 'vidalytics.view_video')
    .ilike('value', '%Wisdom Upgrade%');
  
  if (startDate) vslQuery = vslQuery.gte('timestamp', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    vslQuery = vslQuery.lt('timestamp', endDateTime.toISOString());
  }
  
  const { data: vslEvents } = await vslQuery;

  // Count unique contacts for each milestone by parsing the value field
  const vsl5Percent = vslEvents ? new Set(vslEvents.filter(e => e.value?.includes('View 5%')).map(e => e.contact_id)).size : 0;
  const vsl25Percent = vslEvents ? new Set(vslEvents.filter(e => e.value?.includes('View 25%')).map(e => e.contact_id)).size : 0;
  const vsl75Percent = vslEvents ? new Set(vslEvents.filter(e => e.value?.includes('View 50%') || e.value?.includes('View 75%')).map(e => e.contact_id)).size : 0;
  const vsl95Percent = vslEvents ? new Set(vslEvents.filter(e => e.value?.includes('View 95%')).map(e => e.contact_id)).size : 0;

  // Get Wisdom+ purchases and correlate with VSL viewers
  // First, get all VSL viewer contact IDs
  const vslViewerContactIds = vslEvents ? Array.from(new Set(vslEvents.filter(e => e.value?.includes('View 5%')).map(e => e.contact_id))) : [];
  
  // Get orders from VSL viewers
  let ordersQuery = supabase
    .from('orders')
    .select('id, contact_id, order_total')
    .gte('order_total', 31); // Wisdom+ purchases are $31+
  
  if (vslViewerContactIds.length > 0) {
    ordersQuery = ordersQuery.in('contact_id', vslViewerContactIds);
  }
  
  if (startDate) ordersQuery = ordersQuery.gte('created_at', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    ordersQuery = ordersQuery.lt('created_at', endDateTime.toISOString());
  }
  
  const { data: vslPurchases } = await ordersQuery;
  const wisdomPurchasesFromVSL = vslPurchases ? vslPurchases.length : 0;
  
  // Also get total Wisdom+ purchases for context
  let allWisdomQuery = supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .gte('order_total', 31);
  
  if (startDate) allWisdomQuery = allWisdomQuery.gte('created_at', startDate);
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    allWisdomQuery = allWisdomQuery.lt('created_at', endDateTime.toISOString());
  }
  
  const { count: totalWisdomPurchases } = await allWisdomQuery;

  // Calculate conversion rate from VSL view to purchase (only counting VSL viewers who purchased)
  const vslToPurchaseRate = vsl5Percent > 0 ? (wisdomPurchasesFromVSL / vsl5Percent) * 100 : 0;

  return {
    vsl5Percent,
    vsl25Percent,
    vsl75Percent,
    vsl95Percent,
    wisdomPurchases: wisdomPurchasesFromVSL, // Purchases from VSL viewers only
    totalWisdomPurchases: totalWisdomPurchases || 0, // Total Wisdom+ purchases for context
    vslToPurchaseRate,
  };
}
