import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testWithoutFilter() {
  console.log('=== Test WITHOUT product filter ===\n');
  
  const { data, count } = await supabase
    .from('orders')
    .select(`
      *,
      contacts (full_name, email)
    `, { count: 'exact' })
    .limit(5);
  
  console.log('Total count:', count);
  console.log('Sample orders:', data?.map(o => ({ id: o.id, order_number: o.clickfunnels_order_number })));
}

async function testWithFilter() {
  console.log('\n=== Test WITH product filter (product_id = 8) ===\n');
  
  const { data, count, error } = await supabase
    .from('orders')
    .select(`
      *,
      contacts (full_name, email),
      order_items!inner (product_id)
    `, { count: 'exact' })
    .eq('order_items.product_id', 8)
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total count:', count);
    console.log('Sample orders:', data?.map(o => ({ 
      id: o.id, 
      order_number: o.clickfunnels_order_number,
      product_ids: o.order_items?.map(oi => oi.product_id)
    })));
  }
}

async function run() {
  await testWithoutFilter();
  await testWithFilter();
}

run();
