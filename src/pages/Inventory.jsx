import { useEffect, useMemo, useState } from "react";
import {
  FiArrowDownCircle,
  FiArrowUpCircle,
  FiBox,
  FiSearch,
  FiAlertTriangle,
  FiPlus,
  FiX,
  FiEdit3,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

import { getProducts } from "../services/productService";
import {
  receiveStock,
  adjustStock,
} from "../services/stockService";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

export default function Inventory() {
  const { profile } = useAuth();

  const canManageInventory =
    profile?.role === "OWNER" || profile?.role === "MANAGER";

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // Receive Stock
  // ---------------------------------------------------------

  const [showReceiveModal, setShowReceiveModal] =
    useState(false);

  const [selectedProduct, setSelectedProduct] =
    useState("");

  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] =
    useState("");

  // ---------------------------------------------------------
  // Adjust Stock
  // ---------------------------------------------------------

  const [showAdjustModal, setShowAdjustModal] =
    useState(false);

  const [adjustmentProduct, setAdjustmentProduct] =
    useState("");

  const [adjustmentQuantity, setAdjustmentQuantity] =
    useState("");

  const [adjustmentReason, setAdjustmentReason] =
    useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setError(
        error?.message || "Unable to load inventory.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        String(product.id).includes(query) ||
        product.name?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    });
  }, [products, search]);

  const totalUnits = products.reduce(
    (total, product) =>
      total + Number(product.stock_quantity || 0),
    0,
  );

  const inventoryValue = products.reduce(
    (total, product) =>
      total +
      Number(product.stock_quantity || 0) *
        Number(product.selling_price || 0),
    0,
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) <=
      Number(product.minimum_stock || 0),
  );

  // ---------------------------------------------------------
  // Receive Stock Modal
  // ---------------------------------------------------------

  function openReceiveModal() {
    setSelectedProduct("");
    setQuantity("");
    setPurchasePrice("");
    setError("");
    setShowReceiveModal(true);
  }

  function closeReceiveModal() {
    if (saving) return;

    setShowReceiveModal(false);
    setSelectedProduct("");
    setQuantity("");
    setPurchasePrice("");
  }

  async function handleReceiveStock(event) {
    event.preventDefault();

    const productId = Number(selectedProduct);
    const receivedQuantity = Number(quantity);

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(receivedQuantity) ||
      receivedQuantity <= 0
    ) {
      setError(
        "Enter a valid whole-number quantity.",
      );
      return;
    }

    if (
      purchasePrice !== "" &&
      (Number(purchasePrice) < 0 ||
        Number.isNaN(Number(purchasePrice)))
    ) {
      setError("Enter a valid purchase price.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await receiveStock({
        productId,
        quantity: receivedQuantity,
        purchasePrice,
      });

      closeReceiveModal();
      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(
        error?.message ||
          "Unable to receive stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------
  // Adjust Stock Modal
  // ---------------------------------------------------------

  function openAdjustModal(product = null) {
    setAdjustmentProduct(
      product ? String(product.id) : "",
    );
    setAdjustmentQuantity("");
    setAdjustmentReason("");
    setError("");
    setShowAdjustModal(true);
  }

  function closeAdjustModal() {
    if (saving) return;

    setShowAdjustModal(false);
    setAdjustmentProduct("");
    setAdjustmentQuantity("");
    setAdjustmentReason("");
  }

  async function handleAdjustStock(event) {
    event.preventDefault();

    const productId = Number(adjustmentProduct);
    const quantity = Number(adjustmentQuantity);
    const reason = adjustmentReason.trim();

    if (!productId) {
      setError("Please select a product.");
      return;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity === 0
    ) {
      setError(
        "Enter a non-zero whole number. Use + to add stock or - to remove stock.",
      );
      return;
    }

    if (!reason) {
      setError(
        "Please provide a reason for this adjustment.",
      );
      return;
    }

    if (reason.length > 500) {
      setError(
        "Adjustment reason cannot exceed 500 characters.",
      );
      return;
    }

    const product = products.find(
      (item) => Number(item.id) === productId,
    );

    if (!product) {
      setError("Selected product could not be found.");
      return;
    }

    const currentStock = Number(
      product.stock_quantity || 0,
    );

    const newStock = currentStock + quantity;

    if (newStock < 0) {
      setError(
        `Stock cannot become negative. Current stock: ${currentStock}.`,
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      await adjustStock({
        productId,
        quantity,
        reason,
      });

      closeAdjustModal();
      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(
        error?.message ||
          "Unable to adjust stock.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="inventory-page">
      {/* ---------------------------------------------------
          PAGE HEADER
      --------------------------------------------------- */}

      <div className="page-header">
        <div>
          <span className="page-eyebrow">
            INVENTORY MANAGEMENT
          </span>

          <h1>Stock Control</h1>

          <p>
            Monitor stock levels, receive new products and
            track inventory.
          </p>
        </div>

        {canManageInventory && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="secondary-business-button"
              onClick={() => openAdjustModal()}
            >
              <FiEdit3 />
              Adjust Stock
            </button>

            <button
              type="button"
              className="primary-business-button"
              onClick={openReceiveModal}
            >
              <FiPlus />
              Receive Stock
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="products-error">
          {error}
        </div>
      )}

      {/* ---------------------------------------------------
          INVENTORY STATS
      --------------------------------------------------- */}

      <section className="inventory-stats">
        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            <FiBox />
          </div>

          <div>
            <span>Total Products</span>
            <strong>{products.length}</strong>
            <small>Products in catalogue</small>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            <FiBox />
          </div>

          <div>
            <span>Total Units</span>
            <strong>{totalUnits}</strong>
            <small>Units currently in stock</small>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon">
            <FiArrowUpCircle />
          </div>

          <div>
            <span>Inventory Value</span>
            <strong>
              {formatCurrency(inventoryValue)}
            </strong>
            <small>Based on selling prices</small>
          </div>
        </div>

        <div className="inventory-stat-card warning">
          <div className="inventory-stat-icon">
            <FiAlertTriangle />
          </div>

          <div>
            <span>Low Stock</span>
            <strong>
              {lowStockProducts.length}
            </strong>
            <small>
              At or below minimum level
            </small>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------
          INVENTORY TABLE
      --------------------------------------------------- */}

      <section className="inventory-panel">
        <div className="inventory-panel-header">
          <div>
            <span className="panel-eyebrow">
              PRODUCT STOCK
            </span>

            <h2>Current Inventory</h2>
          </div>

          <div className="inventory-search">
            <FiSearch />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search product number or name..."
            />
          </div>
        </div>

        <div className="inventory-table-wrapper">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product #</th>
                <th>Product</th>
                <th>Selling Price</th>
                <th>Stock</th>
                <th>Status</th>

                {canManageInventory && (
                  <th>Action</th>
                )}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={
                      canManageInventory ? "6" : "5"
                    }
                    className="products-table-message"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      canManageInventory ? "6" : "5"
                    }
                    className="products-table-message"
                  >
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = Number(
                    product.stock_quantity || 0,
                  );

                  const minimumStock = Number(
                    product.minimum_stock || 0,
                  );

                  let status = "In Stock";

                  if (stock === 0) {
                    status = "Out of Stock";
                  } else if (
                    stock <= minimumStock
                  ) {
                    status = "Low Stock";
                  }

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong className="product-number">
                          #{product.id}
                        </strong>
                      </td>

                      <td>
                        <div className="inventory-product">
                          <strong>
                            {product.name}
                          </strong>
                        </div>
                      </td>

                      <td>
                        {formatCurrency(
                          product.selling_price,
                        )}
                      </td>

                      <td>
                        <strong className="stock-number">
                          {stock}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`stock-status ${status
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {status}
                        </span>
                      </td>

                      {canManageInventory && (
                        <td>
                          <button
                            type="button"
                            className="secondary-business-button"
                            onClick={() =>
                              openAdjustModal(product)
                            }
                          >
                            <FiEdit3 />
                            Adjust
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading &&
          filteredProducts.length === 0 && (
            <div className="inventory-empty">
              <FiSearch />

              <h3>No products found</h3>

              <p>
                Try another product number or name.
              </p>
            </div>
          )}
      </section>

      {/* ===================================================
          RECEIVE STOCK MODAL
      =================================================== */}

      {showReceiveModal && (
        <div className="business-modal-overlay">
          <div className="business-modal">
            <div className="business-modal-header">
              <div>
                <span className="page-eyebrow">
                  INVENTORY
                </span>

                <h2>Receive Stock</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeReceiveModal}
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleReceiveStock}>
              <div className="business-form-group">
                <label htmlFor="inventory-product">
                  Product
                </label>

                <select
                  id="inventory-product"
                  value={selectedProduct}
                  onChange={(event) =>
                    setSelectedProduct(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Select product...
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      #{product.id} — {product.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="business-form-row">
                <div className="business-form-group">
                  <label htmlFor="inventory-quantity">
                    Quantity
                  </label>

                  <input
                    id="inventory-quantity"
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 20"
                    required
                  />
                </div>

                <div className="business-form-group">
                  <label htmlFor="inventory-cost">
                    Purchase Price
                  </label>

                  <input
                    id="inventory-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(event) =>
                      setPurchasePrice(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 300"
                  />
                </div>
              </div>

              <div className="stock-receive-note">
                <FiArrowDownCircle />

                <p>
                  Stock will be permanently added to the
                  database and recorded in the stock
                  transaction history.
                </p>
              </div>

              <div className="business-modal-actions">
                <button
                  type="button"
                  className="secondary-business-button"
                  onClick={closeReceiveModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-business-button"
                  disabled={saving}
                >
                  <FiPlus />

                  {saving
                    ? "Saving..."
                    : "Add Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================
          ADJUST STOCK MODAL
      =================================================== */}

      {showAdjustModal && (
        <div className="business-modal-overlay">
          <div className="business-modal">
            <div className="business-modal-header">
              <div>
                <span className="page-eyebrow">
                  INVENTORY
                </span>

                <h2>Adjust Stock</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeAdjustModal}
                disabled={saving}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleAdjustStock}>
              <div className="business-form-group">
                <label htmlFor="adjustment-product">
                  Product
                </label>

                <select
                  id="adjustment-product"
                  value={adjustmentProduct}
                  onChange={(event) =>
                    setAdjustmentProduct(
                      event.target.value,
                    )
                  }
                  required
                >
                  <option value="">
                    Select product...
                  </option>

                  {products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      #{product.id} — {product.name}
                    </option>
                  ))}
                </select>
              </div>

              {adjustmentProduct && (
                <div className="stock-receive-note">
                  <FiBox />

                  <p>
                    Current stock:{" "}
                    <strong>
                      {Number(
                        products.find(
                          (product) =>
                            Number(product.id) ===
                            Number(
                              adjustmentProduct,
                            ),
                        )?.stock_quantity || 0,
                      )}
                    </strong>{" "}
                    units
                  </p>
                </div>
              )}

              <div className="business-form-group">
                <label htmlFor="adjustment-quantity">
                  Adjustment Quantity
                </label>

                <input
                  id="adjustment-quantity"
                  type="number"
                  step="1"
                  value={adjustmentQuantity}
                  onChange={(event) =>
                    setAdjustmentQuantity(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. +5 or -3"
                  required
                />

                <small>
                  Use a positive number to add stock or a
                  negative number to remove stock.
                </small>
              </div>

              <div className="business-form-group">
                <label htmlFor="adjustment-reason">
                  Reason
                </label>

                <textarea
                  id="adjustment-reason"
                  value={adjustmentReason}
                  onChange={(event) =>
                    setAdjustmentReason(
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Physical stock count correction"
                  rows="4"
                  maxLength="500"
                  required
                />

                <small>
                  Required for the stock history and audit
                  record.
                </small>
              </div>

              <div className="stock-receive-note">
                <FiEdit3 />

                <p>
                  This adjustment will permanently change
                  the stock quantity and create a stock
                  transaction and audit record.
                </p>
              </div>

              <div className="business-modal-actions">
                <button
                  type="button"
                  className="secondary-business-button"
                  onClick={closeAdjustModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-business-button"
                  disabled={saving}
                >
                  <FiEdit3 />

                  {saving
                    ? "Saving..."
                    : "Save Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}