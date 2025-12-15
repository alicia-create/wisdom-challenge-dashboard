import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function compare() {
  console.log('=== Comparing KPI vs Funnel Metrics ===\n');
  
  // 1. KPI Logic: Total Leads from wisdom contacts
  const { data: wisdomEvents } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%wisdom%,comment.ilike.%31daywisdomchallenge%');
  const wisdomIds = new Set(wisdomEvents?.map(e => e.contact_id) || []);
  console.log(`KPI Total Leads (wisdom contacts): ${wisdomIds.size}`);
  
  // 2. Paid Ads Funnel: contacts from 31daywisdom.com
  const { data: paidAdsEvents } = await supabase
    .from('analytics_events')
    .select('contact_id')
    .or('comment.ilike.%31daywisdom.com%,value.ilike.%31daywisdom.com%');
  const paidAdsIds = new Set(paidAdsEvents?.map(e => e.contact_id) || []);
  console.log(`Paid Ads Funnel Leads (31daywisdom.com): ${paidAdsIds.size}`);
  
  // 3. Organic Funnel: wisdom - paidAds
  const organicIds = [...wisdomIds].filter(id => !paidAdsIds.has(id));
  console.log(`Organic Funnel Leads (wisdom - paidAds): ${organicIds.length}`);
  
  // 4. Sum of funnels
  console.log(`\nSum of Funnels: ${paidAdsIds.size} + ${organicIds.length} = ${paidAdsIds.size + organicIds.length}`);
  console.log(`KPI Total: ${wisdomIds.size}`);
  
  // 5. Check overlap
  const paidAdsInWisdom = [...paidAdsIds].filter(id => wisdomIds.has(id));
  const paidAdsNotInWisdom = [...paidAdsIds].filter(id => !wisdomIds.has(id));
  console.log(`\n=== Overlap Analysis ===`);
  console.log(`Paid Ads contacts IN wisdom: ${paidAdsInWisdom.length}`);
  console.log(`Paid Ads contacts NOT in wisdom: ${paidAdsNotInWisdom.length}`);
  
  // 6. The issue: Paid Ads funnel shows ALL 31daywisdom.com contacts, not just wisdom contacts
  console.log(`\n=== ROOT CAUSE ===`);
  console.log(`Paid Ads Funnel is counting ${paidAdsIds.size} contacts`);
  console.log(`But only ${paidAdsInWisdom.length} of them are in the Wisdom funnel`);
  console.log(`The funnel should only count wisdom contacts!`);
  
  // 7. Wisdom+ Sales comparison
  console.log(`\n=== Wisdom+ Sales ===`);
  
  // KPI: Wisdom+ from wisdom contacts only
  const { data: wisdomOrders } = await supabase
    .from('orders')
    .select('id')
    .in('contact_id', [...wisdomIds])
    .gte('order_total', 31);
  console.log(`KPI Wisdom+ Sales (wisdom contacts, $31+): ${wisdomOrders?.length || 0}`);
  
  // Funnel: Wisdom+ from order_items with product_id 1 or 7
  const { data: wisdomItems } = await supabase
    .from('order_items')
    .select('order_id')
    .or('product_id.eq.1,product_id.eq.7');
  const uniqueWisdomOrders = new Set(wisdomItems?.map(i => i.order_id) || []);
  console.log(`Funnel Wisdom+ Sales (product_id 1 or 7): ${uniqueWisdomOrders.size}`);
  
  // Check if funnel is filtering by wisdom contacts
  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, contact_id');
  const orderToContact = new Map(allOrders?.map(o => [o.id, o.contact_id]) || []);
  
  const wisdomItemsFromWisdomContacts = [...uniqueWisdomOrders].filter(orderId => {
    const contactId = orderToContact.get(orderId);
    return wisdomIds.has(contactId);
  });
  console.log(`Funnel Wisdom+ from wisdom contacts only: ${wisdomItemsFromWisdomContacts.length}`);
}

compare().catch(console.error);
