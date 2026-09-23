import { supabase } from "./supabase";

export async function getProducts({
  includeInactive = false,
  search = "",
} = {}) {
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const isStaff = role === "STAFF";

  let query = supabase
    .from(isStaff ? "staff_products" : "products")
    .select("*")
    .order("id", { ascending: true });

  if (!includeInactive) {
    query = query.eq("active", true);
  }

  const cleanSearch = search.trim();

  if (cleanSearch) {
    query = query.or(
      `name.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getProduct(productId) {
  const { data: role, error: roleError } = await supabase.rpc("get_my_role");

  if (roleError) {
    throw roleError;
  }

  const tableName = role === "STAFF" ? "staff_products" : "products";

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createProduct(product) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      id: Number(product.id),
      name: product.name.trim(),
      category: product.category?.trim() || null,
      cost_price: Number(product.cost_price || 0),
      selling_price: Number(product.selling_price || 0),
      stock_quantity: Number(product.stock_quantity || 0),
      minimum_stock: Number(product.minimum_stock || 5),
      active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProduct(productId, updates) {
  const payload = {};

  if (updates.name !== undefined) {
    payload.name = updates.name.trim();
  }

  if (updates.category !== undefined) {
    payload.category = updates.category?.trim() || null;
  }

  if (updates.cost_price !== undefined) {
    payload.cost_price = Number(updates.cost_price || 0);
  }

  if (updates.selling_price !== undefined) {
    payload.selling_price = Number(updates.selling_price || 0);
  }

  if (updates.minimum_stock !== undefined) {
    payload.minimum_stock = Number(updates.minimum_stock || 0);
  }

  if (updates.active !== undefined) {
    payload.active = Boolean(updates.active);
  }

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
