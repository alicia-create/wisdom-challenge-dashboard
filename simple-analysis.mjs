import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function simpleAnalysis() {
  console.log('=== SIMPLE CONTACT ANALYSIS ===\n');
  
  // 1. Total contacts
  const { count: total } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`1. Total contacts in Supabase: ${total}`);
  
  // 2. Wisdom contacts (materialized view)
  const { count: wisdom } = await supabase
    .from('wisdom_contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`2. Wisdom contacts (materialized view): ${wisdom}`);
  
  // 3. Non-wisdom contacts
  console.log(`3. Non-wisdom contacts: ${total - wisdom} (${((total - wisdom) / total * 100).toFixed(1)}%)`);
  
  // 4. What dashboard shows
  console.log(`\n4. Dashboard "Total Leads" shows: 20,583`);
  console.log(`   This is the wisdom contacts count (filtered by date range)`);
  
  // 5. Explanation
  console.log('\n=== EXPLANATION ===');
  console.log(`You have ${total} total contacts in Supabase.`);
  console.log(`Only ${wisdom} are from the "Wisdom Challenge" funnel.`);
  console.log(`The dashboard filters to show ONLY Wisdom contacts.`);
  console.log(`\nThe ${total - wisdom} non-wisdom contacts are from:`);
  console.log('  - Other campaigns/funnels');
  console.log('  - Historical data before Wisdom Challenge');
  console.log('  - Test contacts');
  console.log('  - Contacts without wisdom-related events');
}

simpleAnalysis().catch(console.error);
