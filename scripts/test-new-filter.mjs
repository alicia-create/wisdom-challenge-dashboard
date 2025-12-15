import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

async function getWisdomContactIds() {
  const allEvents = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < MAX_PAGES) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('contact_id')
      .or('comment.ilike.%31daywisdom%,comment.ilike.%wisdom challenge%,value.ilike.%31daywisdom%')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('Error:', error);
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

  return Array.from(new Set(allEvents.map(e => e.contact_id)));
}

async function getPaidAdsContactIds() {
  const allEvents = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < MAX_PAGES) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('contact_id')
      .or('comment.ilike.%31daywisdom.com%,value.ilike.%31daywisdom.com%')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) {
      console.error('Error:', error);
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

  return Array.from(new Set(allEvents.map(e => e.contact_id)));
}

async function test() {
  console.log('=== Testing New Wisdom Filter with Pagination ===\n');
  
  const wisdomIds = await getWisdomContactIds();
  console.log(`Total Wisdom Contacts: ${wisdomIds.length}`);
  
  const paidAdsIds = await getPaidAdsContactIds();
  console.log(`Paid Ads Contacts (31daywisdom.com): ${paidAdsIds.length}`);
  
  const paidAdsSet = new Set(paidAdsIds);
  const organicIds = wisdomIds.filter(id => !paidAdsSet.has(id));
  console.log(`Organic Contacts: ${organicIds.length}`);
  
  console.log(`\n=== Summary ===`);
  console.log(`Total Leads (KPI): ${wisdomIds.length}`);
  console.log(`Paid Ads Funnel: ${paidAdsIds.length}`);
  console.log(`Organic Funnel: ${organicIds.length}`);
  console.log(`Sum of Funnels: ${paidAdsIds.length + organicIds.length}`);
  
  // Check if sum matches
  if (wisdomIds.length === paidAdsIds.length + organicIds.length) {
    console.log(`\n✅ Numbers match! Total = Paid + Organic`);
  } else {
    console.log(`\n⚠️ Numbers don't match. Difference: ${wisdomIds.length - (paidAdsIds.length + organicIds.length)}`);
    // This is expected because some contacts may be in both
    const overlap = paidAdsIds.filter(id => wisdomIds.includes(id) && organicIds.includes(id));
    console.log(`Overlap (in both funnels): ${overlap.length}`);
  }
}

test().catch(console.error);
