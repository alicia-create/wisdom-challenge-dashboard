import { supabase } from "./supabase";

export async function getProductsWithSales() {
  // Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .order('product_name', { ascending: true });

  if (productsError) {
    console.error('[Products] Error fetching products:', productsError);
    throw new Error('Failed to fetch products');
  }

  // Get sales count and revenue for each product
  const { data: orderItems, error: orderItemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity, amount');

  if (orderItemsError) {
    console.error('[Products] Error fetching order_items:', orderItemsError);
    throw new Error('Failed to fetch order items');
  }

  // Aggregate sales by product_id
  const salesByProduct = orderItems?.reduce((acc: any, item: any) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = {
        sales_count: 0,
        total_revenue: 0,
      };
    }
    acc[item.product_id].sales_count += item.quantity || 1;
    acc[item.product_id].total_revenue += item.amount || 0;
    return acc;
  }, {});

  // Merge products with sales data
  const productsWithSales = products?.map((product: any) => ({
    ...product,
    sales_count: salesByProduct?.[product.id]?.sales_count || 0,
    total_revenue: salesByProduct?.[product.id]?.total_revenue || 0,
  }));

  return productsWithSales || [];
}
