import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function debug() {
  console.log('=== Debug Wisdom Filter ===\n');
  
  // 1. Your query: 31daywisdom.com in comment
  const { data: paidAdsYourQuery } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdom.com%');
  const paidAdsYourQueryIds = new Set(paidAdsYourQuery?.map(e => e.contact_id) || []);
  console.log(`Your query (31daywisdom.com in comment): ${paidAdsYourQueryIds.size} contacts`);
  
  // 2. Dashboard query: wisdom OR 31daywisdomchallenge in comment
  const { data: wisdomDashboard } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');
  const wisdomDashboardIds = new Set(wisdomDashboard?.map(e => e.contact_id) || []);
  console.log(`Dashboard wisdom filter (wisdom OR 31daywisdomchallenge): ${wisdomDashboardIds.size} contacts`);
  
  // 3. Check: Does "31daywisdom.com" contain "wisdom"? YES!
  console.log(`\n=== Key Insight ===`);
  console.log(`"31daywisdom.com" contains "wisdom": ${"31daywisdom.com".includes("wisdom")}`);
  
  // 4. Check overlap
  const paidAdsInWisdom = [...paidAdsYourQueryIds].filter(id => wisdomDashboardIds.has(id));
  const paidAdsNotInWisdom = [...paidAdsYourQueryIds].filter(id => !wisdomDashboardIds.has(id));
  console.log(`\nPaid Ads contacts IN wisdom dashboard: ${paidAdsInWisdom.length}`);
  console.log(`Paid Ads contacts NOT in wisdom dashboard: ${paidAdsNotInWisdom.length}`);
  
  // 5. If there are contacts NOT in wisdom, let's see why
  if (paidAdsNotInWisdom.length > 0) {
    console.log(`\n=== Sample contacts NOT in wisdom dashboard ===`);
    const sampleIds = paidAdsNotInWisdom.slice(0, 5);
    for (const id of sampleIds) {
      const { data: events } = await supabase
        .from('analytics_events')
        .select('comment')
        .eq('contact_id', id)
        .limit(5);
      console.log(`Contact ${id}: ${events?.map(e => e.comment).join(' | ')}`);
    }
  }
  
  // 6. Let's check what the actual comment looks like for 31daywisdom.com
  console.log(`\n=== Sample comments with 31daywisdom.com ===`);
  const { data: sampleComments } = await supabase
    .from('analytics_events')
    .select('contact_id, comment')
    .ilike('comment', '%31daywisdom.com%')
    .limit(10);
  for (const event of sampleComments || []) {
    console.log(`Contact ${event.contact_id}: "${event.comment}"`);
  }
  
  // 7. Check if the dashboard is using the correct filter
  console.log(`\n=== Dashboard Filter Analysis ===`);
  
  // The dashboard uses: comment.ilike.%wisdom% OR comment.ilike.%31daywisdomchallenge%
  // But "31daywisdom.com" contains "wisdom", so it SHOULD match!
  
  // Let's verify with explicit query
  const { data: wisdomOnly } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%wisdom%');
  const wisdomOnlyIds = new Set(wisdomOnly?.map(e => e.contact_id) || []);
  console.log(`Contacts with "wisdom" in comment: ${wisdomOnlyIds.size}`);
  
  const { data: challengeOnly } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .ilike('comment', '%31daywisdomchallenge%');
  const challengeOnlyIds = new Set(challengeOnly?.map(e => e.contact_id) || []);
  console.log(`Contacts with "31daywisdomchallenge" in comment: ${challengeOnlyIds.size}`);
  
  // Union
  const unionIds = new Set([...wisdomOnlyIds, ...challengeOnlyIds]);
  console.log(`Union (wisdom OR 31daywisdomchallenge): ${unionIds.size}`);
  
  // Check if 31daywisdom.com contacts are in wisdomOnly
  const paidAdsInWisdomOnly = [...paidAdsYourQueryIds].filter(id => wisdomOnlyIds.has(id));
  console.log(`\n31daywisdom.com contacts that match "wisdom": ${paidAdsInWisdomOnly.length}`);
}

debug().catch(console.error);
