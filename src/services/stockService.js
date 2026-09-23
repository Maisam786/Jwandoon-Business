import { supabase } from "./supabase";

export async function receiveStock({
  productId,
  quantity,
  purchasePrice,
  reason = "Stock received",
}) {
  const receivedQuantity = Number(quantity);

  if (!Number.isInteger(receivedQuantity) || receivedQuantity <= 0) {
    throw new Error("Quantity must be a positive whole number.");
  }

  const cleanPurchasePrice =
    purchasePrice === "" || purchasePrice == null
      ? null
      : Number(purchasePrice);

  if (
    cleanPurchasePrice !== null &&
    (!Number.isFinite(cleanPurchasePrice) || cleanPurchasePrice < 0)
  ) {
    throw new Error("Purchase price must be a valid non-negative number.");
  }

  const { data, error } = await supabase.rpc("receive_stock", {
    p_product_id: Number(productId),
    p_quantity: receivedQuantity,
    p_purchase_price: cleanPurchasePrice,
    p_reason: reason,
  });

  if (error) {
    throw error;
  }

  return data;
}