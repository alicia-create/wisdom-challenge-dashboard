import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function compare() {
  // 1. Dashboard logic: Total Wisdom contacts
  const { data: wisdom } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');
  const wisdomIds = new Set(wisdom?.map(e => e.contact_id) || []);
  
  // 2. Dashboard logic: Paid Ads contacts
  const { data: paidAds } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%31daywisdom.com%,value.ilike.%31daywisdom.com%');
  const paidAdsIds = new Set(paidAds?.map(e => e.contact_id) || []);
  
  // 3. Dashboard organic = wisdom - paidAds
  const organicDashboard = [...wisdomIds].filter(id => !paidAdsIds.has(id));
  
  // 4. Your query: 31daywisdomchallenge.com
  const { data: yourQuery } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdomchallenge.com%');
  const yourQueryIds = new Set(yourQuery?.map(e => e.contact_id) || []);
  
  console.log('=== Comparison ===');
  console.log(`Total Wisdom contacts (dashboard): ${wisdomIds.size}`);
  console.log(`Paid Ads contacts (31daywisdom.com): ${paidAdsIds.size}`);
  console.log(`Organic (dashboard logic): ${organicDashboard.length}`);
  console.log(`Your query (31daywisdomchallenge.com): ${yourQueryIds.size}`);
  console.log('');
  console.log('=== Difference Analysis ===');
  
  // Contacts in your query but NOT in dashboard organic
  const inYourQueryNotDashboard = [...yourQueryIds].filter(id => !organicDashboard.includes(id));
  console.log(`In your query but NOT in dashboard organic: ${inYourQueryNotDashboard.length}`);
  
  // Contacts in dashboard organic but NOT in your query
  const inDashboardNotYourQuery = organicDashboard.filter(id => !yourQueryIds.has(id));
  console.log(`In dashboard organic but NOT in your query: ${inDashboardNotYourQuery.length}`);
  
  // Check why some are missing
  if (inDashboardNotYourQuery.length > 0) {
    console.log('\n=== Sample contacts in dashboard but not your query ===');
    const sampleIds = inDashboardNotYourQuery.slice(0, 5);
    for (const id of sampleIds) {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('comment, value')
        .eq('contact_id', id)
        .limit(3);
      console.log(`Contact ${id}:`, events?.map(e => e.comment || e.value).join(' | '));
    }
  }
  
  // Check contacts that are in your query but excluded from dashboard (because they're in paid ads)
  if (inYourQueryNotDashboard.length > 0) {
    console.log('\n=== Contacts in your query but excluded (in paid ads too) ===');
    const sampleIds = inYourQueryNotDashboard.slice(0, 5);
    for (const id of sampleIds) {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('comment, value')
        .eq('contact_id', id)
        .or('comment.ilike.%31daywisdom%,value.ilike.%31daywisdom%')
        .limit(5);
      console.log(`Contact ${id}:`, events?.map(e => e.comment || e.value).join(' | '));
    }
  }
}

compare().catch(console.error);
