import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testSourcesFunction() {
  console.log('Testing get_contact_sources_analysis function...\n');
  
  const { data, error } = await supabase.rpc('get_contact_sources_analysis');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('=== CONTACT SOURCES ANALYSIS ===\n');
  console.log(`Total contacts: ${data.total_contacts}`);
  console.log(`Wisdom contacts: ${data.wisdom_contacts}`);
  console.log(`Non-wisdom contacts: ${data.non_wisdom_contacts}`);
  console.log(`Contacts without ANY events: ${data.contacts_without_events}\n`);
  
  console.log('=== TOP EVENT NAMES (Non-Wisdom) ===');
  data.top_event_names?.slice(0, 10).forEach(e => {
    console.log(`  ${e.event_name}: ${e.contact_count} contacts`);
  });
  
  console.log('\n=== TOP CREATION DATES (Non-Wisdom) ===');
  data.top_creation_dates?.slice(0, 10).forEach(d => {
    console.log(`  ${d.date}: ${d.contact_count} contacts`);
  });
  
  console.log('\n=== SAMPLE NON-WISDOM CONTACTS ===');
  data.sample_non_wisdom_with_events?.slice(0, 3).forEach(c => {
    console.log(`\nContact ${c.contact_id} (${c.email}):`);
    c.recent_events?.forEach(e => {
      console.log(`  - ${e.name}`);
    });
  });
}

testSourcesFunction().catch(console.error);
