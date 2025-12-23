import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 Testing optimized get_dashboard_metrics with 120s timeout...');
console.log('Date range: 2025-12-13 to 2025-12-22\n');

const startTime = Date.now();

const { data, error } = await supabase.rpc('get_dashboard_metrics', {
  p_start_date: '2025-12-13',
  p_end_date: '2025-12-22'
});

const duration = Date.now() - startTime;

if (error) {
  console.error('❌ Error:', error.message);
  console.error('Details:', error);
  process.exit(1);
}

console.log(`✅ SUCCESS! Query completed in ${duration}ms (${(duration/1000).toFixed(2)}s)\n`);
console.log('📊 Results:');
console.log('  Total Leads:', data?.kpis?.totalLeads);
console.log('  Paid Leads:', data?.paidAdsFunnel?.leads);
console.log('  Organic Leads:', data?.organicFunnel?.leads);
console.log('  Wisdom+ Sales:', data?.kpis?.totalWisdomSales);
console.log('  Total Spend: $' + data?.kpis?.totalSpend?.toFixed(2));
console.log('  Total Revenue: $' + data?.kpis?.totalRevenue?.toFixed(2));
console.log('  CPL: $' + data?.kpis?.cpl?.toFixed(2));
console.log('  CPP: $' + data?.kpis?.cpp?.toFixed(2));
console.log('  ROAS:', data?.kpis?.roas?.toFixed(2) + 'x');
console.log('  Conversion Rate:', data?.kpis?.conversionRate?.toFixed(2) + '%');
