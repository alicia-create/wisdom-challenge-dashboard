import { supabase } from '../server/supabase';
import { getOverviewMetrics } from '../server/supabase';
import { getDateRangeValues, DATE_RANGES } from '../shared/constants';

async function testVipSales() {
  console.log('Testing VIP Sales Logic (order_total >= $31)...\n');
  
  // Check all orders in database
  const { data: allOrders, error } = await supabase
    .from('orders')
    .select('id, order_total, created_at')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('📊 All orders in database:');
  allOrders?.forEach(order => {
    const total = parseFloat(order.order_total || '0');
    const isVip = total >= 31;
    console.log(`  Order ${order.id}: $${total.toFixed(2)} ${isVip ? '✅ VIP' : '❌ Not VIP'}`);
  });
  
  const vipCount = allOrders?.filter(o => parseFloat(o.order_total || '0') >= 31).length || 0;
  console.log(`\n📈 Expected VIP Sales: ${vipCount}`);
  
  // Test getOverviewMetrics
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
  const metrics = await getOverviewMetrics(startDate, endDate);
  
  console.log(`📊 Actual VIP Sales from getOverviewMetrics: ${metrics.vipSales}`);
  console.log(`💰 Total VIP Revenue: $${metrics.totalRevenue.toFixed(2)}`);
  
  if (metrics.vipSales === vipCount) {
    console.log('\n✅ VIP Sales count is correct!');
  } else {
    console.log(`\n❌ Mismatch! Expected ${vipCount}, got ${metrics.vipSales}`);
  }
}

testVipSales().catch(console.error);
