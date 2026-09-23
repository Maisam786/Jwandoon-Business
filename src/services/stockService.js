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
    (!Number.isFinite(cleanPurchasePrice) ||
      cleanPurchasePrice < 0)
  ) {
    throw new Error(
      "Purchase price must be a valid non-negative number.",
    );
  }

  const cleanReason =
    typeof reason === "string" && reason.trim()
      ? reason.trim()
      : "Stock received";

  const { data, error } = await supabase.rpc(
    "receive_stock",
    {
      p_product_id: Number(productId),
      p_quantity: receivedQuantity,
      p_purchase_price: cleanPurchasePrice,
      p_reason: cleanReason,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Adjust existing stock.
 *
 * Positive quantity  = increase stock
 * Negative quantity  = decrease stock
 *
 * Authorization is enforced by the secure
 * adjust_stock() PostgreSQL function.
 */
export async function adjustStock({
  productId,
  quantity,
  reason,
}) {
  const adjustmentQuantity = Number(quantity);

  if (
    !Number.isInteger(adjustmentQuantity) ||
    adjustmentQuantity === 0
  ) {
    throw new Error(
      "Adjustment quantity must be a non-zero whole number.",
    );
  }

  const cleanReason =
    typeof reason === "string" ? reason.trim() : "";

  if (!cleanReason) {
    throw new Error(
      "A reason is required for stock adjustment.",
    );
  }

  if (cleanReason.length > 500) {
    throw new Error(
      "Adjustment reason cannot exceed 500 characters.",
    );
  }

  const { data, error } = await supabase.rpc(
    "adjust_stock",
    {
      p_product_id: Number(productId),
      p_quantity: adjustmentQuantity,
      p_reason: cleanReason,
    },
  );

  if (error) {
    throw error;
  }

  return data;
}