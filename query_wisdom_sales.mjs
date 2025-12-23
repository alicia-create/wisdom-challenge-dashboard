import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function queryWisdomSales() {
  console.log('Querying Wisdom+ Sales (product_id = 1)...\n');
  
  // Count orders with product_id = 1
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_total, order_items!inner(product_id)')
    .eq('order_items.product_id', 1)
    .in('billing_status', ['paid', 'partially-refunded']);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const totalOrders = orders.length;
  const nonZeroOrders = orders.filter(o => o.order_total > 0).length;
  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.order_total || 0), 0);
  
  console.log('Results:');
  console.log('- Total Wisdom+ orders (product_id=1):', totalOrders);
  console.log('- Non-zero orders (for AOV):', nonZeroOrders);
  console.log('- Total Revenue:', totalRevenue.toFixed(2));
  console.log('- AOV (excluding $0):', nonZeroOrders > 0 ? (totalRevenue / nonZeroOrders).toFixed(2) : 0);
  
  // Count extra journals (product_id = 4)
  const { data: journals, error: journalsError } = await supabase
    .from('order_items')
    .select('quantity, orders!inner(billing_status)')
    .eq('product_id', 4)
    .in('orders.billing_status', ['paid', 'partially-refunded']);
  
  if (!journalsError) {
    const extraJournals = journals.reduce((sum, j) => sum + (j.quantity || 0), 0);
    console.log('\nJournals:');
    console.log('- Wisdom+ journals:', totalOrders);
    console.log('- Extra journals (product_id=4):', extraJournals);
    console.log('- Total journals:', totalOrders + extraJournals);
  }
}

queryWisdomSales();
