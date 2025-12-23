import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testMetrics() {
  console.log('Testing get_dashboard_metrics...\n');
  
  const { data, error } = await supabase.rpc('get_dashboard_metrics', {
    start_date: '2024-01-01',
    end_date: '2025-12-31'
  });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('KPIs:');
  console.log('- Total Wisdom+ Sales:', data.kpis.totalWisdomSales);
  console.log('- Total Revenue:', data.kpis.totalRevenue);
  console.log('- AOV:', data.kpis.aov);
  console.log('- CPL:', data.kpis.cpl);
  console.log('- CPP:', data.kpis.cpp);
  
  console.log('\nJournals:');
  console.log('- Wisdom+ journals (from sales):', data.kpis.totalWisdomSales);
  console.log('- Extra journals (product_id=4):', data.journals?.extraJournals || 0);
  console.log('- Total journals:', data.kpis.totalWisdomSales + (data.journals?.extraJournals || 0));
}

testMetrics();
