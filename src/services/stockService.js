import { supabase } from "./supabase";
import { emitNotification } from "./notificationService";

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

  const cleanReason =
    typeof reason === "string" && reason.trim()
      ? reason.trim()
      : "Stock received";

  const { data, error } = await supabase.rpc("receive_stock", {
    p_product_id: Number(productId),
    p_quantity: receivedQuantity,
    p_purchase_price: cleanPurchasePrice,
    p_reason: cleanReason,
  });

  if (error) {
    throw error;
  }

  emitNotification({
    type: "stock",
    title: "Stock received",
    message: `${receivedQuantity} unit${
      receivedQuantity === 1 ? "" : "s"
    } received successfully.`,
  });

  notifyLowStock(data);

  return data;
}

function notifyLowStock(product) {
  if (!product) {
    return;
  }

  const stock = Number(product.stock_quantity || 0);
  const minimumStock = Number(product.minimum_stock || 0);

  if (stock <= minimumStock) {
    emitNotification({
      type: "warning",
      title: stock === 0 ? "Product out of stock" : "Low stock alert",
      message:
        stock === 0
          ? `${product.name} is out of stock.`
          : `${product.name} is low on stock: ${stock} remaining, minimum ${minimumStock}.`,
    });
  }
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
export async function adjustStock({ productId, quantity, reason }) {
  const adjustmentQuantity = Number(quantity);

  if (!Number.isInteger(adjustmentQuantity) || adjustmentQuantity === 0) {
    throw new Error("Adjustment quantity must be a non-zero whole number.");
  }

  const cleanReason = typeof reason === "string" ? reason.trim() : "";

  if (!cleanReason) {
    throw new Error("A reason is required for stock adjustment.");
  }

  if (cleanReason.length > 500) {
    throw new Error("Adjustment reason cannot exceed 500 characters.");
  }

  const { data, error } = await supabase.rpc("adjust_stock", {
    p_product_id: Number(productId),
    p_quantity: adjustmentQuantity,
    p_reason: cleanReason,
  });

  if (error) {
    throw error;
  }

  emitNotification({
    type: adjustmentQuantity > 0 ? "stock" : "warning",
    title:
      adjustmentQuantity > 0
        ? "Stock increased"
        : "Stock decreased",
    message: `${Math.abs(adjustmentQuantity)} unit${
      Math.abs(adjustmentQuantity) === 1 ? "" : "s"
    } ${
      adjustmentQuantity > 0 ? "added to" : "removed from"
    } stock.`,
  });

  notifyLowStock(data);

  return data;
}
