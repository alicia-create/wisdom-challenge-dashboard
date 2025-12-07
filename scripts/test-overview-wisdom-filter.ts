import { getOverviewMetrics } from '../server/supabase';
import { DATE_RANGES } from '../shared/constants';

async function testOverviewWisdomFilter() {
  console.log('Testing Overview Metrics - Should show ONLY Wisdom funnel data\n');
  
  const metrics = await getOverviewMetrics(DATE_RANGES.LAST_30_DAYS);
  
  console.log('📊 Overview Metrics (Last 30 Days):');
  console.log('  Total Leads:', metrics.totalLeads);
  console.log('  VIP Sales:', metrics.vipSales);
  console.log('  Kingdom Seeker Trials:', metrics.kingdomSeekerTrials);
  console.log('  ManyChat Bot Users:', metrics.manyChatBotUsers);
  console.log('  Broadcast Subscribers:', metrics.broadcastSubscribers);
  console.log('  Total Revenue:', metrics.totalRevenue);
  console.log('  Total Ad Spend:', metrics.totalAdSpend);
  
  console.log('\n✅ All metrics should reflect ONLY contacts from Wisdom funnel');
}

testOverviewWisdomFilter().catch(console.error);
