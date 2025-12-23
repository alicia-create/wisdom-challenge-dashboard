import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkWisdomFilter() {
  console.log('=== WISDOM FILTER ANALYSIS ===\n');
  
  // Check wisdom_contacts materialized view
  const { count: wisdomViewCount } = await supabase
    .from('wisdom_contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Wisdom contacts (materialized view): ${wisdomViewCount}`);
  
  // Get sample wisdom contacts
  const { data: wisdomSamples } = await supabase
    .from('wisdom_contacts')
    .select('contact_id')
    .limit(5);
  
  console.log('\nSample wisdom contact IDs:', wisdomSamples?.map(c => c.contact_id));
  
  // Count contacts that match wisdom filter manually
  // (contacts that have analytics_events with name ILIKE '%wisdom%')
  const { data: allContacts } = await supabase
    .from('contacts')
    .select('id')
    .limit(50000);
  
  console.log(`\nTotal contacts fetched: ${allContacts?.length}`);
  
  // Check how many have wisdom events
  let wisdomCount = 0;
  for (const contact of allContacts || []) {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('contact_id', contact.id)
      .ilike('name', '%wisdom%')
      .limit(1);
    
    if (events && events.length > 0) {
      wisdomCount++;
    }
    
    if (wisdomCount % 100 === 0) {
      console.log(`Checked ${wisdomCount} wisdom contacts...`);
    }
  }
  
  console.log(`\nContacts with wisdom events: ${wisdomCount}`);
}

checkWisdomFilter().catch(console.error);
