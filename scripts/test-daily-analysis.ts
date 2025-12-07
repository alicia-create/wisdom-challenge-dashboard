import { getDailyAnalysisMetrics } from '../server/supabase';
import { getDateRangeValues, DATE_RANGES } from '../shared/constants';

async function testDailyAnalysis() {
  console.log('Testing Daily Analysis Metrics...\n');
  
  const { startDate, endDate } = getDateRangeValues(DATE_RANGES.LAST_30_DAYS);
  console.log('Date Range:', startDate, 'to', endDate);
  console.log('');
  
  const data = await getDailyAnalysisMetrics(startDate, endDate);
  
  console.log(`Found ${data.length} days of data:`);
  data.forEach(day => {
    console.log(`  ${day.date}: ${day.totalOptins} leads, ${day.totalVipSales} VIP sales`);
  });
}

testDailyAnalysis().catch(console.error);
