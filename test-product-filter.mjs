import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function testProductFilter() {
  console.log('Testing product filter with product_id = 8 (Kingdom Seekers)...\n');
  
  const { data, error, count } = await supabase
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
    console.log('Results:', JSON.stringify(data, null, 2));
  }
}

testProductFilter();
