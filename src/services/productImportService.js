import { supabase } from "./supabase";
import products from "../data/products";

export async function importCatalogueProducts() {
  const rows = products.map((product) => ({
    id: Number(product.id),
    name: product.name.trim(),
    category: null,
    cost_price: 0,
    selling_price: Number(product.price || 0),
    stock_quantity: 0,
    minimum_stock: 5,
    active: true,
  }));

  const { data, error } = await supabase
    .from("products")
    .insert(rows)
    .select();

  if (error) {
    throw error;
  }

  return data || [];
}