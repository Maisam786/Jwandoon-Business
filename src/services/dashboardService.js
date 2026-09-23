import { supabase } from "./supabase";

/**
 * Returns the current day's local date range.
 * The returned ISO values are used by Supabase/PostgreSQL.
 */
function getTodayRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

/**
 * Loads all data required by the dashboard.
 *
 * Security model:
 * - OWNER / MANAGER use manager_* views.
 * - STAFF uses staff_* views.
 * - STAFF never receives profit/cost fields.
 * - No direct sales/sale_items access is used.
 */
export async function getDashboardData() {
  const { start, end } = getTodayRange();

  // ---------------------------------------------------------
  // 1. Determine the current user's role
  // ---------------------------------------------------------

  const {
    data: role,
    error: roleError,
  } = await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const allowedRoles = ["OWNER", "MANAGER", "STAFF"];

  if (!allowedRoles.includes(role)) {
    throw new Error(
      "Your account does not have dashboard access.",
    );
  }

  const isStaff = role === "STAFF";

  // ---------------------------------------------------------
  // 2. Select security-controlled views
  // ---------------------------------------------------------

  const salesTable = isStaff
    ? "staff_sales"
    : "manager_sales";

  const saleItemsTable = isStaff
    ? "staff_sale_items"
    : "manager_sale_items";

  const productsTable = isStaff
    ? "staff_products"
    : "products";

  // ---------------------------------------------------------
  // 3. Load dashboard data in parallel
  // ---------------------------------------------------------

  const [
    todaySalesResult,
    todayItemsResult,
    productsResult,
    lowStockResult,
    recentSalesResult,
  ] = await Promise.all([
    // Today's sales
    supabase
      .from(salesTable)
      .select(
        isStaff
          ? "total_amount"
          : "total_amount, gross_profit",
      )
      .gte("created_at", start)
      .lt("created_at", end),

    // Today's sold units
    //
    // created_at is intentionally selected because the
    // secure sale-items views expose it for dashboard
    // date filtering.
    supabase
      .from(saleItemsTable)
      .select(`
        quantity,
        sale_id,
        created_at
      `)
      .gte("created_at", start)
      .lt("created_at", end),

    // Active product count
    supabase
      .from(productsTable)
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("active", true),

    // Inventory / low-stock information
    supabase
      .from(productsTable)
      .select(`
        id,
        name,
        stock_quantity,
        minimum_stock
      `)
      .eq("active", true)
      .order("stock_quantity", {
        ascending: true,
      }),

    // Latest six sales
    supabase
      .from(salesTable)
      .select(
        isStaff
          ? `
            id,
            invoice_number,
            customer_name,
            total_amount,
            created_by_name,
            created_at
          `
          : `
            id,
            invoice_number,
            customer_name,
            total_amount,
            gross_profit,
            created_by_name,
            created_at
          `,
      )
      .order("created_at", {
        ascending: false,
      })
      .limit(6),
  ]);

  // ---------------------------------------------------------
  // 4. Check every request for errors
  // ---------------------------------------------------------

  const results = [
    todaySalesResult,
    todayItemsResult,
    productsResult,
    lowStockResult,
    recentSalesResult,
  ];

  const failedResult = results.find(
    (result) => result.error,
  );

  if (failedResult) {
    throw failedResult.error;
  }

  // ---------------------------------------------------------
  // 5. Normalize returned data
  // ---------------------------------------------------------

  const todaySales = todaySalesResult.data ?? [];
  const todayItems = todayItemsResult.data ?? [];
  const allProducts = lowStockResult.data ?? [];

  // ---------------------------------------------------------
  // 6. Calculate low-stock products
  // ---------------------------------------------------------

  const lowStockProducts = allProducts.filter(
    (product) =>
      Number(product.stock_quantity || 0) <=
      Number(product.minimum_stock || 0),
  );

  // ---------------------------------------------------------
  // 7. Calculate today's sales
  // ---------------------------------------------------------

  const totalSales = todaySales.reduce(
    (sum, sale) =>
      sum + Number(sale.total_amount || 0),
    0,
  );

  // ---------------------------------------------------------
  // 8. Calculate today's profit
  //
  // STAFF receives null because staff views do not expose
  // financial cost/profit information.
  // ---------------------------------------------------------

  const totalProfit = isStaff
    ? null
    : todaySales.reduce(
        (sum, sale) =>
          sum + Number(sale.gross_profit || 0),
        0,
      );

  // ---------------------------------------------------------
  // 9. Calculate today's sold units
  // ---------------------------------------------------------

  const productsSold = todayItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0,
  );

  // ---------------------------------------------------------
  // 10. Return dashboard model
  // ---------------------------------------------------------

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