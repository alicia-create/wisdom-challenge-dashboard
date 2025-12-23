import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function analyzeNonWisdomContacts() {
  console.log('=== ANALYZING NON-WISDOM CONTACTS ===\n');
  
  // Get wisdom contact IDs
  const { data: wisdomData } = await supabase
    .from('wisdom_contacts')
    .select('contact_id');
  
  const wisdomIds = new Set(wisdomData?.map(w => w.contact_id) || []);
  console.log(`Wisdom contacts: ${wisdomIds.size}`);
  
  // Get all contacts (paginated)
  let allContacts = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, email, created_at, clickfunnels_contact_id, keap_contact_id')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error || !data || data.length === 0) break;
    
    allContacts.push(...data);
    page++;
    
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`Total contacts fetched: ${allContacts.length}`);
  
  // Separate wisdom vs non-wisdom
  const nonWisdomContacts = allContacts.filter(c => !wisdomIds.has(c.id));
  console.log(`Non-wisdom contacts: ${nonWisdomContacts.length}\n`);
  
  // Analyze creation dates
  console.log('=== CREATION DATE ANALYSIS ===');
  const dateGroups = {};
  nonWisdomContacts.forEach(c => {
    const date = c.created_at?.split('T')[0] || 'unknown';
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  const sortedDates = Object.entries(dateGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  console.log('Top 10 creation dates:');
  sortedDates.forEach(([date, count]) => {
    console.log(`  ${date}: ${count} contacts`);
  });
  
  // Check if they have events
  console.log('\n=== CHECKING EVENTS FOR SAMPLE NON-WISDOM CONTACTS ===');
  const sampleIds = nonWisdomContacts.slice(0, 20).map(c => c.id);
  
  for (const contactId of sampleIds) {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('name, comment')
      .eq('contact_id', contactId)
      .limit(5);
    
    if (events && events.length > 0) {
      console.log(`\nContact ${contactId}:`);
      events.forEach(e => {
        console.log(`  - ${e.name} | ${e.comment?.substring(0, 80) || 'no comment'}`);
      });
    } else {
      console.log(`\nContact ${contactId}: NO EVENTS`);
    }
  }
  
  // Count contacts with NO events at all
  console.log('\n=== CONTACTS WITHOUT ANY EVENTS ===');
  let noEventsCount = 0;
  
  for (const contact of nonWisdomContacts.slice(0, 100)) {
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contact.id);
    
    if (count === 0) noEventsCount++;
  }
  
  console.log(`Sample check: ${noEventsCount}/100 non-wisdom contacts have NO events`);
  console.log(`Estimated total: ~${Math.round(noEventsCount * nonWisdomContacts.length / 100)} contacts with no events`);
}

analyzeNonWisdomContacts().catch(console.error);
