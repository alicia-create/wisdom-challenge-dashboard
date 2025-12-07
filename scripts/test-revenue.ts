import { getOverviewMetrics } from '../server/supabase.ts';

async function testRevenue() {
  const metrics = await getOverviewMetrics();
  console.log('=== Overview Metrics ===');
  console.log('Total Revenue:', metrics.totalRevenue);
  console.log('VIP Revenue:', metrics.vipRevenue);
  console.log('VIP Sales:', metrics.vipSales);
  console.log('Total Spend:', metrics.totalSpend);
  console.log('AOV:', metrics.aov);
}

testRevenue().catch(console.error);
