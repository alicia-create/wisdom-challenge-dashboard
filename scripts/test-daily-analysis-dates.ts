import { getDailyAnalysisMetrics } from '../server/supabase';
import { getDateRangeValues, DATE_RANGES } from '../shared/constants';

async function testDailyAnalysisDates() {
  console.log('Testing Daily Analysis date filtering...\n');
  
  // Test TODAY
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.TODAY);
  console.log(`TODAY range: ${startDate} to ${endDate}`);
  
  const dailyData = await getDailyAnalysisMetrics(startDate, endDate);
  
  console.log(`\nReturned ${dailyData.length} days:`);
  dailyData.forEach(day => {
    console.log(`  - ${day.date}: ${day.total_leads} leads, ${day.vip_sales} vip sales`);
  });
  
  if (dailyData.length > 1) {
    console.log('\n❌ ERROR: TODAY should return 0 or 1 day, but returned', dailyData.length, 'days');
  } else {
    console.log('\n✅ SUCCESS: Correct number of days returned');
  }
}

testDailyAnalysisDates().catch(console.error);
