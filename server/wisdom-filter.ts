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
 * Uses wisdom_contacts materialized view for fast lookups
 * @param startDate Optional start date filter (ISO string) - filters contacts.created_at
 * @param endDate Optional end date filter (ISO string) - filters contacts.created_at
 */
export async function getWisdomContactIds(startDate?: string, endDate?: string): Promise<number[]> {
  // Use wisdom_contacts materialized view (much faster than scanning analytics_events)
  const { data: wisdomData, error: wisdomError } = await supabase
    .from('wisdom_contacts')
    .select('contact_id');

  if (wisdomError) {
    console.error('[Wisdom Filter] Error fetching from wisdom_contacts:', wisdomError);
    return [];
  }

  if (!wisdomData || wisdomData.length === 0) {
    console.log('[Wisdom Filter] No contacts found in wisdom_contacts materialized view');
    return [];
  }

  const wisdomContactIds = wisdomData.map(row => row.contact_id);

  // If date filters provided, filter by contacts.created_at
  if (startDate || endDate) {
    let dateQuery = supabase
      .from('contacts')
      .select('id')
      .in('id', wisdomContactIds);

    if (startDate) {
      dateQuery = dateQuery.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      dateQuery = dateQuery.lt('created_at', endDateTime.toISOString());
    }

    const { data: filteredContacts, error: dateError } = await dateQuery;

    if (dateError) {
      console.error('[Wisdom Filter] Error filtering by date:', dateError);
      return wisdomContactIds; // Return unfiltered if date filter fails
    }

    const filteredIds = filteredContacts?.map(c => c.id) || [];
    const dateRange = `${startDate || 'all'} to ${endDate || 'now'}`;
    console.log(`[Wisdom Filter] Found ${filteredIds.length} contacts from Wisdom funnel (${dateRange})`);
    return filteredIds;
  }

  console.log(`[Wisdom Filter] Found ${wisdomContactIds.length} contacts from Wisdom funnel (all time)`);
  return wisdomContactIds;
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
