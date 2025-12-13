import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test TODAY filter
const startDate = '2025-12-13';
const endDate = '2025-12-13';

// Calculate next day for < comparison
const nextDay = new Date(endDate);
nextDay.setDate(nextDay.getDate() + 1);
const nextDayStr = nextDay.toISOString().split('T')[0];

console.log(`Testing date filter: ${startDate} to ${endDate}`);
console.log(`Using nextDay for < comparison: ${nextDayStr}`);

// Get all wisdom contacts (no date filter)
const { data: allContacts } = await supabase
  .from('contacts')
  .select('id')
  .eq('tag_name', 'Wisdom+ Funnel');

const wisdomIds = allContacts?.map(c => c.id) || [];
console.log(`\nTotal wisdom contacts: ${wisdomIds.length}`);

// Test leads query with date filter
const { data: leads } = await supabase
  .from('contacts')
  .select('id, created_at')
  .in('id', wisdomIds)
  .gte('created_at', startDate)
  .lt('created_at', nextDayStr);

console.log(`\nLeads created TODAY (${startDate}): ${leads?.length || 0}`);
if (leads && leads.length > 0) {
  console.log('Sample lead dates:');
  leads.slice(0, 5).forEach(l => {
    console.log(`  - ${l.created_at}`);
  });
}

// Group by date to see distribution
const dateCount = {};
leads?.forEach(l => {
  const date = l.created_at.split('T')[0];
  dateCount[date] = (dateCount[date] || 0) + 1;
});

console.log('\nLeads grouped by date:');
Object.entries(dateCount).forEach(([date, count]) => {
  console.log(`  ${date}: ${count} leads`);
});
