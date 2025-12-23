import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function analyzeContacts() {
  console.log('=== SUPABASE CONTACTS ANALYSIS ===\n');
  
  // Total contacts
  const { count: totalCount, error: totalError } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  
  if (totalError) {
    console.error('Error counting total contacts:', totalError);
    return;
  }
  
  console.log(`Total contacts in Supabase: ${totalCount}\n`);
  
  // Contacts with ClickFunnels ID
  const { count: cfCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .not('clickfunnels_contact_id', 'is', null);
  
  console.log(`Contacts with ClickFunnels ID: ${cfCount}`);
  
  // Contacts with Keap ID
  const { count: keapCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .not('keap_contact_id', 'is', null);
  
  console.log(`Contacts with Keap ID: ${keapCount}`);
  
  // Contacts with BOTH IDs
  const { count: bothCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .not('clickfunnels_contact_id', 'is', null)
    .not('keap_contact_id', 'is', null);
  
  console.log(`Contacts with BOTH CF + Keap IDs: ${bothCount}`);
  
  // Contacts with NEITHER ID
  const { count: neitherCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .is('clickfunnels_contact_id', null)
    .is('keap_contact_id', null);
  
  console.log(`Contacts with NEITHER ID: ${neitherCount}\n`);
  
  // Check wisdom_contacts materialized view
  const { count: wisdomCount, error: wisdomError } = await supabase
    .from('wisdom_contacts')
    .select('*', { count: 'exact', head: true });
  
  if (!wisdomError) {
    console.log(`Wisdom contacts (materialized view): ${wisdomCount}`);
  } else {
    console.log('wisdom_contacts view error:', wisdomError.message);
  }
  
  // Sample a few contacts to see structure
  const { data: samples } = await supabase
    .from('contacts')
    .select('id, email, clickfunnels_contact_id, keap_contact_id, created_at')
    .limit(5);
  
  console.log('\n=== SAMPLE CONTACTS ===');
  console.table(samples);
}

analyzeContacts().catch(console.error);
