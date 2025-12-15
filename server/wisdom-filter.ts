import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Supabase has a default limit of 1000 rows, we need to paginate to get all results
const PAGE_SIZE = 1000;
const MAX_PAGES = 20; // Safety limit: max 20,000 rows

/**
 * Get all contact IDs from the Wisdom funnel
 * Uses analytics_events to identify contacts with wisdom-related events
 * Filter: comment LIKE '%wisdom%' (matches both 31daywisdom.com and 31daywisdomchallenge.com)
 * @param startDate Optional start date filter (ISO string)
 * @param endDate Optional end date filter (ISO string)
 */
export async function getWisdomContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  const allEvents: { contact_id: number }[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < MAX_PAGES) {
    let pageQuery = supabase
      .from('analytics_events')
      .select('contact_id')
      .ilike('comment', '%wisdom%')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (startDate) {
      pageQuery = pageQuery.gte('timestamp', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      pageQuery = pageQuery.lt('timestamp', endDateTime.toISOString());
    }

    const { data, error } = await pageQuery;

    if (error) {
      console.error('[Wisdom Filter] Error fetching page:', error);
      break;
    }

    if (data && data.length > 0) {
      allEvents.push(...data);
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  // Extract unique contact IDs
  const contactIds = Array.from(new Set(allEvents.map(e => e.contact_id)));

  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Wisdom Filter] Found ${contactIds.length} contacts from Wisdom funnel (${dateRange}) - fetched ${allEvents.length} events in ${page} pages`);
  
  return contactIds;
}

/**
 * Get contact IDs from Paid Ads funnel (31daywisdom.com)
 * Filters analytics_events where comment contains '31daywisdom.com'
 */
export async function getPaidAdsContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  const allEvents: { contact_id: number }[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < MAX_PAGES) {
    let pageQuery = supabase
      .from('analytics_events')
      .select('contact_id')
      .ilike('comment', '%31daywisdom.com%')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (startDate) {
      pageQuery = pageQuery.gte('timestamp', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      pageQuery = pageQuery.lt('timestamp', endDateTime.toISOString());
    }

    const { data, error } = await pageQuery;

    if (error) {
      console.error('[Paid Ads Filter] Error fetching page:', error);
      break;
    }

    if (data && data.length > 0) {
      allEvents.push(...data);
      hasMore = data.length === PAGE_SIZE;
      page++;
    } else {
      hasMore = false;
    }
  }

  const contactIds = Array.from(new Set(allEvents.map(e => e.contact_id)));

  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Paid Ads Filter] Found ${contactIds.length} contacts from 31daywisdom.com (${dateRange}) - fetched ${allEvents.length} events in ${page} pages`);
  
  return contactIds;
}

/**
 * Get contact IDs from Organic/Affiliate funnel (NOT 31daywisdom.com)
 * These are contacts that came from 31daywisdomchallenge.com or other organic sources
 * Calculated as: All Wisdom contacts - Paid Ads contacts
 */
export async function getOrganicContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  // Get all wisdom contacts
  const allWisdomIds = await getWisdomContactIds(startDate, endDate);
  
  // Get paid ads contacts
  const paidAdsIds = await getPaidAdsContactIds(startDate, endDate);
  const paidAdsSet = new Set(paidAdsIds);
  
  // Subtract paid ads from all wisdom = organic/affiliate
  const organicIds = allWisdomIds.filter(id => !paidAdsSet.has(id));
  
  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}`
    : startDate 
    ? `from ${startDate}`
    : 'all time';
  console.log(`[Organic Filter] Found ${organicIds.length} contacts from organic/affiliate sources (${dateRange})`);
  
  return organicIds;
}
