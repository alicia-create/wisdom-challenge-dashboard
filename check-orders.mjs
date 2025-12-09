import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function checkOrders() {
  console.log('=== CHECKING ORDERS & PRODUCTS ===\n');
  
  // Check for order_items or similar tables
  const possibleTables = ['order_items', 'order_products', 'purchase_items', 'line_items'];
  
  for (const table of possibleTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (data && data.length > 0) {
      console.log(`✓ Found table: ${table}`);
      console.log('Columns:', Object.keys(data[0]));
      console.log('Sample:', JSON.stringify(data[0], null, 2));
      console.log('');
    }
  }
  
  // Check orders table columns again
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .limit(3);
  
  if (orders && orders[0]) {
    console.log('Orders table columns:', Object.keys(orders[0]));
    console.log('\nSample orders:');
    orders.forEach(o => {
      console.log(`- Order #${o.id}: $${o.order_total} (${o.funnel_name || 'no funnel'})`);
    });
  }
  
  // Count orders by funnel
  const { data: allOrders } = await supabase
    .from('orders')
    .select('id, order_total, funnel_name');
  
  if (allOrders) {
    console.log(`\nTotal orders: ${allOrders.length}`);
    const wisdomOrders = allOrders.filter(o => 
      o.funnel_name && o.funnel_name.toLowerCase().includes('wisdom')
    );
    console.log(`Wisdom funnel orders: ${wisdomOrders.length}`);
    
    const paidOrders = wisdomOrders.filter(o => o.order_total > 0);
    console.log(`Paid Wisdom orders (order_total > 0): ${paidOrders.length}`);
    
    console.log('\nPaid orders breakdown:');
    paidOrders.forEach(o => {
      console.log(`  - Order #${o.id}: $${o.order_total}`);
    });
  }
}

checkOrders();
