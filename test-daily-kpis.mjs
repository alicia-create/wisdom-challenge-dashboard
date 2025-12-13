import { getDailyAnalysisMetrics } from './server/supabase.ts';
import { getDateRangeValues, DATE_RANGES } from './shared/constants.ts';

console.log('\n📊 Testing Daily KPIs for TODAY\n');

// Get TODAY date range
const { startDate, endDate } = getDateRangeValues(DATE_RANGES.TODAY);
console.log(`Date range: ${startDate} to ${endDate}`);

// Fetch daily analysis metrics
const dailyData = await getDailyAnalysisMetrics(startDate, endDate);

console.log(`\n✅ Daily data points returned: ${dailyData.length}`);

if (dailyData.length > 0) {
  console.log('\nData breakdown:');
  dailyData.forEach(day => {
    console.log(`\n📅 ${day.date}:`);
    console.log(`  Leads: ${day.leads}`);
    console.log(`  Wisdom+ Sales: ${day.wisdomSales}`);
    console.log(`  Revenue: $${day.revenue}`);
    console.log(`  Spend: $${day.spend}`);
  });
} else {
  console.log('\n⚠️  No data found for TODAY');
  console.log('This could mean:');
  console.log('1. No wisdom contacts created today');
  console.log('2. Date filter is excluding today\'s data');
  console.log('3. Timezone mismatch between server and database');
}

console.log('\n---\n');
