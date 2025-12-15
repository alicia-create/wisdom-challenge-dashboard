/**
 * Data Audit Script
 * Identifies all data sources and their values to find discrepancies
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Get today's date range
const today = new Date();
const startDate = today.toISOString().split('T')[0];
const endDate = startDate;

console.log(`\n=== DATA AUDIT FOR ${startDate} ===\n`);

async function auditDataSources() {
  // 1. KPI Source: wisdom_contacts (contacts with wisdom events)
  console.log('--- SOURCE 1: Wisdom Filter (analytics_events with %wisdom%) ---');
  const { data: wisdomEvents, count: wisdomEventCount } = await supabase
    .from('analytics_events')
    .select('contact_id', { count: 'exact' })
    .ilike('comment', '%wisdom%')
    .gte('created_at', startDate)
    .lt('created_at', startDate + 'T23:59:59');
  
  const wisdomContactIds = [...new Set(wisdomEvents?.map(e => e.contact_id) || [])];
  console.log(`  Events with %wisdom%: ${wisdomEventCount}`);
  console.log(`  Unique contacts: ${wisdomContactIds.length}`);

  // 2. Paid Ads Source: contacts from 31daywisdom.com
  console.log('\n--- SOURCE 2: Paid Ads Filter (analytics_events with %31daywisdom.com%) ---');
  const { data: paidEvents } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdom.com%')
    .gte('created_at', startDate)
    .lt('created_at', startDate + 'T23:59:59');
  
  const paidContactIds = [...new Set(paidEvents?.map(e => e.contact_id) || [])];
  console.log(`  Unique contacts from 31daywisdom.com: ${paidContactIds.length}`);

  // 3. Organic Source: contacts from 31daywisdomchallenge.com
  console.log('\n--- SOURCE 3: Organic Filter (analytics_events with %31daywisdomchallenge.com%) ---');
  const { data: organicEvents } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdomchallenge.com%')
    .gte('created_at', startDate)
    .lt('created_at', startDate + 'T23:59:59');
  
  const organicContactIds = [...new Set(organicEvents?.map(e => e.contact_id) || [])];
  console.log(`  Unique contacts from 31daywisdomchallenge.com: ${organicContactIds.length}`);

  // 4. Meta Performance Source: ad_performance table
  console.log('\n--- SOURCE 4: Meta Performance (ad_performance table) ---');
  const { data: metaAds } = await supabase
    .from('ad_performance')
    .select('reported_leads, reported_purchases')
    .ilike('platform', 'meta')
    .eq('date', startDate);
  
  const metaLeads = (metaAds || []).reduce((sum, r) => sum + parseInt(r.reported_leads || '0'), 0);
  const metaPurchases = (metaAds || []).reduce((sum, r) => sum + parseInt(r.reported_purchases || '0'), 0);
  console.log(`  Meta reported_leads: ${metaLeads}`);
  console.log(`  Meta reported_purchases: ${metaPurchases}`);

  // 5. Daily KPIs Source: daily_kpis table
  console.log('\n--- SOURCE 5: Daily KPIs Table ---');
  const { data: dailyKpis } = await supabase
    .from('daily_kpis')
    .select('*')
    .eq('date', startDate)
    .single();
  
  if (dailyKpis) {
    console.log(`  total_leads: ${dailyKpis.total_leads}`);
    console.log(`  wisdom_sales: ${dailyKpis.wisdom_sales}`);
  } else {
    console.log('  No daily_kpis record for today');
  }

  // 6. Orders Source: orders table
  console.log('\n--- SOURCE 6: Orders Table (Wisdom+ orders) ---');
  const { data: orders, count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .gte('order_total', 31)
    .gte('created_at', startDate)
    .lt('created_at', startDate + 'T23:59:59');
  
  console.log(`  Orders >= $31 today: ${orderCount}`);

  // 7. Contacts Source: contacts table
  console.log('\n--- SOURCE 7: Contacts Table (created today) ---');
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate)
    .lt('created_at', startDate + 'T23:59:59');
  
  console.log(`  Contacts created today: ${contactCount}`);

  // Calculate overlaps
  console.log('\n=== OVERLAP ANALYSIS ===');
  const paidSet = new Set(paidContactIds);
  const organicSet = new Set(organicContactIds);
  const overlap = paidContactIds.filter(id => organicSet.has(id));
  console.log(`  Contacts in BOTH paid and organic: ${overlap.length}`);
  
  const organicOnly = organicContactIds.filter(id => !paidSet.has(id));
  console.log(`  Organic-only contacts: ${organicOnly.length}`);

  // Expected totals
  console.log('\n=== EXPECTED TOTALS ===');
  console.log(`  Paid Ads Leads: ${paidContactIds.length}`);
  console.log(`  Organic Leads (exclusive): ${organicOnly.length}`);
  console.log(`  Total (Paid + Organic exclusive): ${paidContactIds.length + organicOnly.length}`);
  console.log(`  Wisdom Filter Total: ${wisdomContactIds.length}`);

  // Discrepancy
  console.log('\n=== DISCREPANCY ===');
  const sumFunnels = paidContactIds.length + organicOnly.length;
  console.log(`  Sum of Funnels: ${sumFunnels}`);
  console.log(`  Wisdom Filter: ${wisdomContactIds.length}`);
  console.log(`  Difference: ${wisdomContactIds.length - sumFunnels}`);
}

auditDataSources().catch(console.error);
