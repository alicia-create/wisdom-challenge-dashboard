import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function compare() {
  console.log('🔍 Comparing Materialized View vs Direct Query...\n');
  
  // Get contacts from materialized view
  const { data: mvContacts } = await supabase
    .from('wisdom_contacts')
    .select('contact_id');
  
  const mvSet = new Set(mvContacts?.map(c => c.contact_id) || []);
  console.log(`Materialized View: ${mvSet.size} contacts`);
  
  // Get contacts from direct query
  const { data: directEvents } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');
  
  const directSet = new Set(directEvents?.map(e => e.contact_id) || []);
  console.log(`Direct Query: ${directSet.size} contacts\n`);
  
  // Find differences
  const onlyInMV = Array.from(mvSet).filter(id => !directSet.has(id));
  const onlyInDirect = Array.from(directSet).filter(id => !mvSet.has(id));
  
  if (onlyInMV.length > 0) {
    console.log(`⚠️  Contacts ONLY in Materialized View (${onlyInMV.length}):`);
    console.log('   ', onlyInMV.join(', '));
    
    // Check what events these contacts have
    console.log('\n   Checking their analytics_events:');
    for (const contactId of onlyInMV.slice(0, 5)) {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('comment, value, name, type')
        .eq('contact_id', contactId)
        .limit(5);
      
      console.log(`\n   Contact ${contactId} (${events?.length || 0} events):`);
      events?.forEach((e, i) => {
        console.log(`     Event ${i + 1}: ${e.name} (${e.type})`);
        console.log(`       comment: ${e.comment ? e.comment.substring(0, 100) : 'null'}`);
        console.log(`       value: ${e.value ? e.value.substring(0, 100) : 'null'}`);
      });
    }
  }
  
  if (onlyInDirect.length > 0) {
    console.log(`\n⚠️  Contacts ONLY in Direct Query (${onlyInDirect.length}):`);
    console.log('   ', onlyInDirect.join(', '));
  }
  
  if (onlyInMV.length === 0 && onlyInDirect.length === 0) {
    console.log('✅ Perfect match! No discrepancies found.');
  } else {
    console.log(`\n📊 Summary:`);
    console.log(`   - Materialized View has ${onlyInMV.length} extra contacts`);
    console.log(`   - Direct Query has ${onlyInDirect.length} extra contacts`);
    console.log(`   - Difference: ${Math.abs(mvSet.size - directSet.size)} contacts`);
  }
}

compare().catch(console.error);
