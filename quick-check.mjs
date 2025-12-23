import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function quickCheck() {
  console.log('=== QUICK NON-WISDOM ANALYSIS ===\n');
  
  // Get counts
  const { count: totalCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  
  const { count: wisdomCount } = await supabase
    .from('wisdom_contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total contacts: ${totalCount}`);
  console.log(`Wisdom contacts: ${wisdomCount}`);
  console.log(`Non-wisdom: ${totalCount - wisdomCount}\n`);
  
  // Sample analytics_events to see what event names exist
  console.log('=== SAMPLE EVENT NAMES (all contacts) ===');
  const { data: eventSample } = await supabase
    .from('analytics_events')
    .select('name, comment')
    .limit(50);
  
  const eventNames = {};
  eventSample?.forEach(e => {
    const name = e.name || 'null';
    eventNames[name] = (eventNames[name] || 0) + 1;
  });
  
  console.log('\nEvent name distribution in sample:');
  Object.entries(eventNames)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`  ${name}: ${count}`);
    });
  
  // Check if there are contacts with NO events
  console.log('\n=== CHECKING FOR CONTACTS WITHOUT EVENTS ===');
  
  // Get 100 random contact IDs
  const { data: sampleContacts } = await supabase
    .from('contacts')
    .select('id')
    .limit(100);
  
  let noEventsCount = 0;
  for (const contact of sampleContacts || []) {
    const { count } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('contact_id', contact.id);
    
    if (count === 0) noEventsCount++;
  }
  
  console.log(`Contacts with NO events: ${noEventsCount}/100 sampled`);
  console.log(`Estimated total with no events: ~${Math.round(noEventsCount * totalCount / 100)}`);
}

quickCheck().catch(console.error);
