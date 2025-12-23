import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function analyzeNonWisdomContacts() {
  console.log('=== ANALYZING NON-WISDOM CONTACTS ===\n');
  
  // Get ALL wisdom contact IDs with pagination
  let wisdomIds = new Set();
  let page = 0;
  const PAGE_SIZE = 1000;
  
  console.log('Fetching wisdom contacts...');
  while (true) {
    const { data, error } = await supabase
      .from('wisdom_contacts')
      .select('contact_id')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    
    if (error) {
      console.error('Error fetching wisdom contacts:', error);
      break;
    }
    
    if (!data || data.length === 0) break;
    
    data.forEach(w => wisdomIds.add(w.contact_id));
    page++;
    
    if (data.length < PAGE_SIZE) break;
  }
  
  console.log(`Wisdom contacts: ${wisdomIds.size}`);
  
  // Get sample of ALL contacts
  const { data: allContacts, error: contactsError } = await supabase
    .from('contacts')
    .select('id, email, created_at, clickfunnels_contact_id, keap_contact_id')
    .limit(5000);
  
  if (contactsError) {
    console.error('Error fetching contacts:', contactsError);
    return;
  }
  
  console.log(`Sample contacts fetched: ${allContacts?.length || 0}`);
  
  // Separate wisdom vs non-wisdom
  const nonWisdomContacts = allContacts?.filter(c => !wisdomIds.has(c.id)) || [];
  console.log(`Non-wisdom in sample: ${nonWisdomContacts.length}\n`);
  
  if (nonWisdomContacts.length === 0) {
    console.log('No non-wisdom contacts found in sample!');
    return;
  }
  
  // Analyze creation dates
  console.log('=== CREATION DATE ANALYSIS ===');
  const dateGroups = {};
  nonWisdomContacts.forEach(c => {
    const date = c.created_at?.split('T')[0] || 'unknown';
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  const sortedDates = Object.entries(dateGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  
  console.log('Top 15 creation dates:');
  sortedDates.forEach(([date, count]) => {
    console.log(`  ${date}: ${count} contacts`);
  });
  
  // Check events for sample
  console.log('\n=== SAMPLE NON-WISDOM CONTACT EVENTS ===');
  const sampleIds = nonWisdomContacts.slice(0, 10).map(c => c.id);
  
  for (const contactId of sampleIds) {
    const { data: events } = await supabase
      .from('analytics_events')
      .select('name, comment, timestamp')
      .eq('contact_id', contactId)
      .order('timestamp', { ascending: false })
      .limit(3);
    
    console.log(`\nContact ${contactId}:`);
    if (events && events.length > 0) {
      events.forEach(e => {
        const comment = e.comment?.substring(0, 60) || 'no comment';
        console.log(`  - ${e.name} | ${comment}`);
      });
    } else {
      console.log(`  NO EVENTS FOUND`);
    }
  }
}

analyzeNonWisdomContacts().catch(console.error);
