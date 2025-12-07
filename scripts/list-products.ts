import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);

async function listProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*');
  
  console.log('=== All Products ===');
  products?.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.product_name}`);
  });
}

listProducts().catch(console.error);
