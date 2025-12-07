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
 * Filters to last 2 days for more normalized data
 */
export async function getWisdomContactIds(): Promise<number[]> {
  // Filter to last 2 days by default for more normalized data
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoISO = twoDaysAgo.toISOString();

  const { data: wisdomEvents, error: eventsError } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%')
    .gte('timestamp', twoDaysAgoISO);

  if (eventsError) {
    console.error('[Wisdom Filter] Error fetching wisdom events:', eventsError);
    return [];
  }

  // Extract unique contact IDs
  const contactIds = wisdomEvents 
    ? Array.from(new Set(wisdomEvents.map(e => e.contact_id)))
    : [];

  console.log(`[Wisdom Filter] Found ${contactIds.length} contacts from Wisdom funnel (last 2 days)`);
  
  return contactIds;
}
