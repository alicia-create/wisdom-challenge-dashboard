import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Get all contact IDs from the Wisdom funnel
 * Uses analytics_events to identify contacts with wisdom-related events
 * @param startDate Optional start date filter (ISO string)
 * @param endDate Optional end date filter (ISO string)
 */
export async function getWisdomContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  let query = supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    // Add one day to endDate to include the entire end date
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    query = query.lt('timestamp', endDateTime.toISOString());
  }

  const { data: wisdomEvents, error: eventsError } = await query;

  if (eventsError) {
    console.error('[Wisdom Filter] Error fetching wisdom events:', eventsError);
    return [];
  }

  // Extract unique contact IDs
  const contactIds = wisdomEvents 
    ? Array.from(new Set(wisdomEvents.map(e => e.contact_id)))
    : [];

  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Wisdom Filter] Found ${contactIds.length} contacts from Wisdom funnel (${dateRange})`);
  
  return contactIds;
}

/**
 * Get contact IDs from Paid Ads funnel (31daywisdom.com)
 * Filters analytics_events where comment or value contains '31daywisdom.com'
 */
export async function getPaidAdsContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  let query = supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%31daywisdom.com%,value.ilike.%31daywisdom.com%');

  if (startDate) {
    query = query.gte('timestamp', startDate);
  }
  if (endDate) {
    const endDateTime = new Date(endDate);
    endDateTime.setDate(endDateTime.getDate() + 1);
    query = query.lt('timestamp', endDateTime.toISOString());
  }

  const { data: paidEvents, error } = await query;

  if (error) {
    console.error('[Paid Ads Filter] Error fetching paid ads events:', error);
    return [];
  }

  const contactIds = paidEvents 
    ? Array.from(new Set(paidEvents.map(e => e.contact_id)))
    : [];

  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Paid Ads Filter] Found ${contactIds.length} contacts from 31daywisdom.com (${dateRange})`);
  
  return contactIds;
}

/**
 * Get contact IDs from Organic/Affiliate funnel (NOT 31daywisdom.com)
 * Filters analytics_events where comment or value does NOT contain '31daywisdom.com'
 */
export async function getOrganicContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  // Get all wisdom contacts
  const allWisdomIds = await getWisdomContactIds(startDate, endDate);
  
  // Get paid ads contacts
  const paidAdsIds = await getPaidAdsContactIds(startDate, endDate);
  
  // Subtract paid ads from all wisdom = organic/affiliate
  const organicIds = allWisdomIds.filter(id => !paidAdsIds.includes(id));
  
  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Organic Filter] Found ${organicIds.length} contacts from organic/affiliate sources (${dateRange})`);
  
  return organicIds;
}
