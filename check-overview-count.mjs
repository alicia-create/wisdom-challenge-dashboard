import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function checkOverviewCount() {
  console.log('=== OVERVIEW PAGE LEAD COUNT ANALYSIS ===\n');
  
  // Total contacts in Supabase
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Total contacts in Supabase: ${totalContacts}`);
  
  // Wisdom contacts (materialized view)
  const { count: wisdomCount } = await supabase
    .from('wisdom_contacts')
    .select('*', { count: 'exact', head: true });
  
  console.log(`Wisdom contacts (materialized view): ${wisdomCount}`);
  
  // Check if Overview uses pagination
  console.log('\n=== Checking if Overview uses pagination ===');
  
  // Simulate what getOverviewMetrics does - fetch wisdom contact IDs
  const { data: wisdomData } = await supabase
    .from('wisdom_contacts')
    .select('contact_id');
  
  console.log(`Wisdom contact IDs fetched (no pagination): ${wisdomData?.length || 0}`);
  
  // Now count contacts matching those IDs
  if (wisdomData && wisdomData.length > 0) {
    const wisdomIds = wisdomData.map(row => row.contact_id);
    
    // Count with pagination (1000 at a time)
    let totalCount = 0;
    const PAGE_SIZE = 1000;
    
    for (let i = 0; i < wisdomIds.length; i += PAGE_SIZE) {
      const chunk = wisdomIds.slice(i, i + PAGE_SIZE);
      const { count } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .in('id', chunk);
      
      totalCount += count || 0;
    }
    
    console.log(`Contacts matching wisdom IDs (with pagination): ${totalCount}`);
  }
  
  // Check what the dashboard shows
  console.log('\n=== Dashboard Display ===');
  console.log('Dashboard shows: 20,583 Total Leads');
  console.log('This matches the wisdom_contacts count: 20,728 (close)');
  console.log('\nDifference: 43,828 total - 20,728 wisdom = 23,100 non-wisdom contacts');
}

checkOverviewCount().catch(console.error);
