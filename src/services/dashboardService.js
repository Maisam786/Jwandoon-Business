import { supabase } from "./supabase";

function getTodayRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function getDashboardData() {
  const { start, end } = getTodayRange();

  const [
    todaySalesResult,
    todayItemsResult,
    productsResult,
    lowStockResult,
    recentSalesResult,
  ] = await Promise.all([
    supabase
      .from("sales")
      .select("total_amount, gross_profit")
      .gte("created_at", start)
      .lt("created_at", end),

    supabase
      .from("sale_items")
      .select(`
        quantity,
        sale_id
      `)
      .gte("created_at", start)
      .lt("created_at", end),

    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("active", true),

    supabase
      .from("products")
      .select(`
        id,
        name,
        stock_quantity,
        minimum_stock
      `)
      .eq("active", true)
      .order("stock_quantity", { ascending: true }),

    supabase
      .from("sales")
      .select(`
        id,
        invoice_number,
        customer_name,
        total_amount,
        gross_profit,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const results = [
    todaySalesResult,
    todayItemsResult,
    productsResult,
    lowStockResult,
    recentSalesResult,
  ];

  const failedResult = results.find((result) => result.error);

  if (failedResult) {
    throw failedResult.error;
  }

  const todaySales = todaySalesResult.data ?? [];
  const todayItems = todayItemsResult.data ?? [];
  const allProducts = lowStockResult.data ?? [];

  const lowStockProducts = allProducts.filter(
    (product) =>
      product.stock_quantity <= product.minimum_stock
  );

  const totalSales = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total_amount || 0),
    0
  );

  const totalProfit = todaySales.reduce(
    (sum, sale) => sum + Number(sale.gross_profit || 0),
    0
  );

  const productsSold = todayItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  return {
    totalSales,
    totalProfit,
    productsSold,
    invoiceCount: todaySales.length,
    productCount: productsResult.count ?? 0,
    lowStockProducts,
    recentSales: recentSalesResult.data ?? [],
  };
}