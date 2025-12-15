import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const PAGE_SIZE = 1000;
const MAX_PAGES = 20;

async function fetchAllWithFilter(filter) {
  const allEvents = [];
  let page = 0;
  let hasMore = true;

  while (hasMore && page < MAX_PAGES) {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('contact_id')
      .ilike('comment', filter)
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

  return {
    events: allEvents,
    uniqueContacts: Array.from(new Set(allEvents.map(e => e.contact_id))),
    pages: page
  };
}

async function test() {
  console.log('=== Testing with %wisdom% (like your SQL) ===\n');
  
  // Test 1: %wisdom% - should match both 31daywisdom.com and 31daywisdomchallenge.com
  const wisdom = await fetchAllWithFilter('%wisdom%');
  console.log(`%wisdom%: ${wisdom.events.length} events, ${wisdom.uniqueContacts.length} unique contacts (${wisdom.pages} pages)`);
  
  // Test 2: %31daywisdom.com% - Paid Ads only
  const paidAds = await fetchAllWithFilter('%31daywisdom.com%');
  console.log(`%31daywisdom.com%: ${paidAds.events.length} events, ${paidAds.uniqueContacts.length} unique contacts (${paidAds.pages} pages)`);
  
  // Test 3: %31daywisdomchallenge.com% - Organic only
  const organic = await fetchAllWithFilter('%31daywisdomchallenge.com%');
  console.log(`%31daywisdomchallenge.com%: ${organic.events.length} events, ${organic.uniqueContacts.length} unique contacts (${organic.pages} pages)`);
  
  // Calculate organic as wisdom - paidAds
  const paidAdsSet = new Set(paidAds.uniqueContacts);
  const organicCalculated = wisdom.uniqueContacts.filter(id => !paidAdsSet.has(id));
  
  console.log(`\n=== Summary ===`);
  console.log(`Total Leads (from %wisdom%): ${wisdom.uniqueContacts.length}`);
  console.log(`Paid Ads (from %31daywisdom.com%): ${paidAds.uniqueContacts.length}`);
  console.log(`Organic (calculated: wisdom - paidAds): ${organicCalculated.length}`);
  console.log(`Organic (direct from %31daywisdomchallenge.com%): ${organic.uniqueContacts.length}`);
  console.log(`Sum (Paid + Organic calculated): ${paidAds.uniqueContacts.length + organicCalculated.length}`);
  
  // Check overlap
  const overlap = paidAds.uniqueContacts.filter(id => organic.uniqueContacts.includes(id));
  console.log(`\nOverlap (in both .com and challenge.com): ${overlap.length}`);
}

test().catch(console.error);
