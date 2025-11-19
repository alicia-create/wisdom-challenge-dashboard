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
