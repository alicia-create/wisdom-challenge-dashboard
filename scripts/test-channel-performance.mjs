import { getChannelPerformance } from '../server/supabase.js';

async function test() {
  // Calculate LAST_30_DAYS range
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];
  
  console.log('🔍 Testing getChannelPerformance()...\n');
  console.log(`Date Range: ${startDateStr} to ${endDateStr}\n`);
  
  const result = await getChannelPerformance(startDateStr, endDateStr);
  
  console.log('Meta Total:');
  console.log(`  Spend: $${result.meta.spend.toFixed(2)}`);
  console.log(`  Clicks: ${result.meta.clicks}`);
  console.log(`  Leads: ${result.meta.leads}`);
  console.log(`  VIPs: ${result.meta.vips}\n`);
  
  console.log('Meta Breakdown:');
  const breakdown = result.meta.breakdown || {};
  const types = Object.keys(breakdown).sort();
  
  if (types.length === 0) {
    console.log('  (empty - no breakdown data)');
  } else {
    types.forEach(type => {
      const data = breakdown[type];
      console.log(`  ${type}:`);
      console.log(`    Spend: $${data.spend.toFixed(2)}`);
      console.log(`    Clicks: ${data.clicks}`);
      console.log(`    Leads: ${data.leads}`);
      console.log(`    VIPs: ${data.vips}`);
    });
  }
  
  // Check if Sales is missing
  if (!breakdown['Sales'] && types.length > 0) {
    console.log('\n⚠️  Sales campaign type is MISSING from breakdown!');
  } else if (breakdown['Sales']) {
    console.log('\n✅ Sales campaign type is present in breakdown');
  }
}

test().catch(console.error);
