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
 * Fetch daily table data using the EXACT SAME approach as Overview
 * Uses get_daily_metrics which returns daily breakdown
 * 
 * This approach guarantees 100% consistency because:
 * - Uses the same SQL function as Overview
 * - Gets daily data in a single call (not day-by-day)
 * - Returns data in the same format Overview uses
 */
export async function getDailyTableData(startDate: string, endDate: string) {
  console.log(`[Daily Table] Fetching data from ${startDate} to ${endDate}`);
  
  // Use get_daily_metrics - same as Overview uses for dailyKpis
  const { data, error } = await supabase.rpc('get_daily_metrics', {
    p_start_date: startDate,
    p_end_date: endDate,
  });
  
  if (error) {
    console.error(`[Daily Table] Error fetching daily metrics:`, error);
    throw new Error(`Failed to fetch daily metrics: ${error.message}`);
  }
  
  console.log(`[Daily Table] Raw response:`, JSON.stringify(data, null, 2).substring(0, 500));
  
  // Extract dailyData array from response
  const dailyData = data?.dailyData || [];
  
  console.log(`[Daily Table] Successfully fetched ${dailyData.length} days`);
  
  return dailyData;
}
