import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function analyzeBackend() {
  console.log('=== SUPABASE DATA PIPELINE ANALYSIS ===\n');
  
  const tables = [
    { name: 'contacts', description: 'ClickFunnels leads + Keap contacts' },
    { name: 'orders', description: 'ClickFunnels purchases/VIP sales' },
    { name: 'ad_performance', description: 'Meta + Google Ads daily metrics' },
    { name: 'analytics_events', description: 'ManyChat bot interactions' },
    { name: 'daily_kpis', description: 'Pre-aggregated daily KPIs (edge function)' },
    { name: 'facebook_audiences', description: 'Meta custom audiences sync' },
    { name: 'ga4_metrics', description: 'Google Analytics 4 website traffic' }
  ];
  
  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select('*', { count: 'exact', head: true });
    
    if (!error) {
      console.log(`✓ ${table.name.padEnd(20)} ${String(count).padStart(6)} records - ${table.description}`);
    } else {
      console.log(`✗ ${table.name.padEnd(20)} ERROR: ${error.message}`);
    }
  }
  
  // Get sample data from key tables
  console.log('\n=== SAMPLE DATA ===\n');
  
  const { data: sampleAd } = await supabase
    .from('ad_performance')
    .select('date, channel, spend, impressions, clicks, leads')
    .order('date', { ascending: false })
    .limit(1);
  
  if (sampleAd && sampleAd[0]) {
    console.log('Latest ad_performance record:');
    console.log(JSON.stringify(sampleAd[0], null, 2));
  }
  
  const { data: sampleKpi } = await supabase
    .from('daily_kpis')
    .select('*')
    .order('date', { ascending: false })
    .limit(1);
  
  if (sampleKpi && sampleKpi[0]) {
    console.log('\nLatest daily_kpis record:');
    console.log(JSON.stringify(sampleKpi[0], null, 2));
  }
}

analyzeBackend();
