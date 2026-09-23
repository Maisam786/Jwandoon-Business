import { supabase } from "./supabase";

export async function createSale({
  invoiceNumber,
  customerName,
  items,
}) {
  const cleanItems = items.map((item) => ({
    product_id: Number(item.product_id),
    quantity: Number(item.quantity),
  }));

  const { data, error } = await supabase.rpc("create_sale", {
    p_invoice_number: invoiceNumber,
    p_customer_name: customerName?.trim() || null,
    p_items: cleanItems,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getSales({
  search = "",
  startDate = "",
  endDate = "",
} = {}) {
  const { data: role, error: roleError } =
    await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const isStaff = role === "STAFF";

  let query = supabase
    .from(isStaff ? "staff_sales" : "sales")
    .select(
      isStaff
        ? `
          id,
          invoice_number,
          customer_name,
          subtotal,
          total_amount,
          created_by,
          created_by_name,
          created_at
        `
        : `
          id,
          invoice_number,
          customer_name,
          subtotal,
          total_amount,
          total_cost,
          gross_profit,
          created_by,
          created_by_name,
          created_at
        `
    )
    .order("created_at", { ascending: false });

  const cleanSearch = search.trim();

  if (cleanSearch) {
    query = query.or(
      `invoice_number.ilike.%${cleanSearch}%,customer_name.ilike.%${cleanSearch}%`
    );
  }

  if (startDate) {
    query = query.gte(
      "created_at",
      `${startDate}T00:00:00`
    );
  }

  if (endDate) {
    query = query.lt(
      "created_at",
      `${endDate}T23:59:59.999`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getSaleItems(saleId) {
  const { data: role, error: roleError } =
    await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const isStaff = role === "STAFF";

  const { data, error } = await supabase
    .from(
      isStaff
        ? "staff_sale_items"
        : "sale_items"
    )
    .select(
      isStaff
        ? `
          id,
          product_id,
          product_name,
          quantity,
          selling_price,
          line_total
        `
        : `
          id,
          product_id,
          product_name,
          quantity,
          selling_price,
          cost_price,
          line_total,
          line_cost,
          line_profit
        `
    )
    .eq("sale_id", saleId)
    .order("id", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getSaleDetails(saleId) {
  const { data: role, error: roleError } =
    await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const isStaff = role === "STAFF";

  const saleQuery = supabase
    .from(isStaff ? "staff_sales" : "sales")
    .select(
      isStaff
        ? `
          id,
          invoice_number,
          customer_name,
          subtotal,
          total_amount,
          created_by,
          created_by_name,
          created_at
        `
        : `
          id,
          invoice_number,
          customer_name,
          subtotal,
          total_amount,
          total_cost,
          gross_profit,
          created_by,
          created_by_name,
          created_at
        `
    )
    .eq("id", saleId)
    .single();

  const itemsQuery = supabase
    .from(
      isStaff
        ? "staff_sale_items"
        : "sale_items"
    )
    .select(
      isStaff
        ? `
          id,
          product_id,
          product_name,
          quantity,
          selling_price,
          line_total
        `
        : `
          id,
          product_id,
          product_name,
          quantity,
          selling_price,
          cost_price,
          line_total,
          line_cost,
          line_profit
        `
    )
    .eq("sale_id", saleId)
    .order("id", { ascending: true });

  const [saleResult, itemsResult] =
    await Promise.all([
      saleQuery,
      itemsQuery,
    ]);

  if (saleResult.error) {
    throw saleResult.error;
  }

  if (itemsResult.error) {
    throw itemsResult.error;
  }

  return {
    sale: saleResult.data,
    items: itemsResult.data ?? [],
  };
}