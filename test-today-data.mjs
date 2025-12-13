import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://sumibccxhppkpejrurjt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Get TODAY's date range
const today = new Date();
today.setHours(0, 0, 0, 0);
const startDate = today.toISOString();

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const endDate = tomorrow.toISOString();

console.log(`\n📅 Checking data for TODAY: ${startDate.split('T')[0]}`);
console.log(`Date range: ${startDate} to ${endDate}\n`);

// Check contacts created TODAY
const { data: contacts, error: contactsError } = await supabase
  .from('contacts')
  .select('id, created_at, full_name')
  .gte('created_at', startDate)
  .lt('created_at', endDate);

if (contactsError) {
  console.error('❌ Error fetching contacts:', contactsError);
} else {
  console.log(`✅ Contacts created TODAY: ${contacts?.length || 0}`);
  if (contacts && contacts.length > 0) {
    contacts.forEach(c => console.log(`  - ${c.full_name} (${c.created_at})`));
  }
}

// Check orders created TODAY
const { data: orders, error: ordersError } = await supabase
  .from('orders')
  .select('id, created_at, order_total')
  .gte('created_at', startDate)
  .lt('created_at', endDate);

if (ordersError) {
  console.error('❌ Error fetching orders:', ordersError);
} else {
  console.log(`\n✅ Orders created TODAY: ${orders?.length || 0}`);
  if (orders && orders.length > 0) {
    orders.forEach(o => console.log(`  - Order #${o.id}: $${o.order_total} (${o.created_at})`));
  }
}

// Check wisdom contacts from analytics_events
const { data: events, error: eventsError } = await supabase
  .from('analytics_events')
  .select('contact_id, event_type, created_at')
  .eq('event_type', 'funnel_entry')
  .ilike('comment', '%wisdom%')
  .gte('created_at', startDate)
  .lt('created_at', endDate);

if (eventsError) {
  console.error('❌ Error fetching events:', eventsError);
} else {
  console.log(`\n✅ Wisdom funnel entries TODAY: ${events?.length || 0}`);
}

console.log('\n---\n');
