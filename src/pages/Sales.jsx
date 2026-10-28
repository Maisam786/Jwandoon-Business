import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiEye,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiUser,
  FiX,
} from "react-icons/fi";

import {
  getSales,
  getSaleDetails,
  updateSale,
} from "../services/saleService";
import { getProducts } from "../services/productService";
import { useAuth } from "../context/AuthContext";

import "./Sales.css";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDateForInput(date) {
  return date.toISOString().split("T")[0];
}

export default function Sales() {
  const { profile } = useAuth();
  const canEditReceipts = ["OWNER", "MANAGER"].includes(profile?.role);
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editingSale, setEditingSale] = useState(null);

  const [expandedSale, setExpandedSale] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  async function loadSales(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getSales({
        search,
        startDate,
        endDate,
      });

      setSales(data);
    } catch (err) {
      console.error("Failed to load sales:", err);
      setError(
        err?.message || "Unable to load sales. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSales();
    }, 300);

    return () => clearTimeout(timer);
  }, [search, startDate, endDate]);

  const summary = useMemo(() => {
    return sales.reduce(
      (result, sale) => {
        result.totalSales += Number(sale.total_amount || 0);
        result.totalCost += Number(sale.total_cost || 0);
        result.totalProfit += Number(sale.gross_profit || 0);
        result.invoices += 1;

        return result;
      },
      {
        totalSales: 0,
        totalCost: 0,
        totalProfit: 0,
        invoices: 0,
      }
    );
  }, [sales]);

  async function openSale(sale) {
    try {
      setDetailsLoading(true);
      setError("");

      const details = await getSaleDetails(sale.id);

      setSelectedSale(details);
    } catch (err) {
      console.error("Failed to load sale details:", err);
      setError(
        err?.message || "Unable to load invoice details."
      );
    } finally {
      setDetailsLoading(false);
    }
  }

  async function openEdit(sale) {
    if (!canEditReceipts) return;
    try {
      setError("");
      setDetailsLoading(true);
      setEditingSale(await getSaleDetails(sale.id));
    } catch (err) {
      console.error("Failed to load receipt for editing:", err);
      setError(err?.message || "Unable to load this receipt for editing.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function saveEditedSale(payload) {
    await updateSale(payload);
    setEditingSale(null);
    setSelectedSale(null);
    setExpandedItems({});
    await loadSales(true);
  }

  async function toggleExpanded(sale) {
    if (expandedSale === sale.id) {
      setExpandedSale(null);
      return;
    }

    setExpandedSale(sale.id);

    if (expandedItems[sale.id]) {
      return;
    }

    try {
      const details = await getSaleDetails(sale.id);

      setExpandedItems((current) => ({
        ...current,
        [sale.id]: details.items,
      }));
    } catch (err) {
      console.error("Failed to load sale items:", err);
      setError(
        err?.message || "Unable to load sale items."
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setStartDate("");
    setEndDate("");
  }

  return (
    <section className="sales-page">
      <div className="sales-header">
        <div>
          <span className="sales-eyebrow">TRANSACTIONS</span>
          <h1>Sales</h1>
          <p>
            View completed invoices, revenue, costs and gross profit.
          </p>
        </div>

        <button
          type="button"
          className="sales-refresh"
          onClick={() => loadSales(true)}
          disabled={refreshing}
        >
          <FiRefreshCw className={refreshing ? "spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="sales-summary">
        <div className="sales-summary-card">
          <div className="sales-summary-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Total Sales</span>
            <strong>{formatCurrency(summary.totalSales)}</strong>
          </div>
        </div>

        <div className="sales-summary-card">
          <div className="sales-summary-icon">
            <FiShoppingBag />
          </div>

          <div>
            <span>Invoices</span>
            <strong>{summary.invoices}</strong>
          </div>
        </div>

        <div className="sales-summary-card">
          <div className="sales-summary-icon">
            <FiTrendingUp />
          </div>

          <div>
            <span>Gross Profit</span>
            <strong>{formatCurrency(summary.totalProfit)}</strong>
          </div>
        </div>

        <div className="sales-summary-card">
          <div className="sales-summary-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Total Cost</span>
            <strong>{formatCurrency(summary.totalCost)}</strong>
          </div>
        </div>
      </div>

      <div className="sales-toolbar">
        <div className="sales-search">
          <FiSearch />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice or customer..."
          />
        </div>

        <label className="sales-date">
          <FiCalendar />
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            aria-label="Start date"
          />
        </label>

        <span className="sales-date-separator">to</span>

        <label className="sales-date">
          <FiCalendar />
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            aria-label="End date"
          />
        </label>

        {(search || startDate || endDate) && (
          <button
            type="button"
            className="sales-clear"
            onClick={clearFilters}
          >
            <FiX />
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="sales-error">
          <strong>Something went wrong</strong>
          <span>{error}</span>
        </div>
      )}

      <div className="sales-table-card">
        <div className="sales-table-heading">
          <div>
            <h2>Completed Sales</h2>
            <p>
              {sales.length} transaction
              {sales.length === 1 ? "" : "s"} found
            </p>
          </div>
        </div>

        {loading ? (
          <div className="sales-state">
            <div className="sales-loader" />
            <p>Loading sales...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="sales-state sales-empty">
            <div className="sales-empty-icon">
              <FiShoppingBag />
            </div>

            <h3>No sales found</h3>

            <p>
              Completed invoices will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Profit</th>
                  <th>Created By</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <SalesRow
                    key={sale.id}
                    sale={sale}
                    expanded={expandedSale === sale.id}
                    items={expandedItems[sale.id]}
                    onToggle={() => toggleExpanded(sale)}
                    onView={() => openSale(sale)}
                    canEdit={canEditReceipts}
                    onEdit={() => openEdit(sale)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingSale && canEditReceipts && (
        <EditSaleModal details={editingSale} onClose={() => setEditingSale(null)} onSave={saveEditedSale} />
      )}

      {selectedSale && (
        <SaleDetailsModal
          details={selectedSale}
          loading={detailsLoading}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </section>
  );
}

function SalesRow({
  sale,
  expanded,
  items,
  onToggle,
  onView,
  canEdit,
  onEdit,
}) {
  return (
    <>
      <tr className={expanded ? "sales-row active" : "sales-row"}>
        <td>
          <button
            type="button"
            className="invoice-number-button"
            onClick={onToggle}
          >
            {expanded ? <FiChevronUp /> : <FiChevronDown />}
            {sale.invoice_number}
          </button>
        </td>

        <td>
          <span className="sales-date-text">
            {formatDateTime(sale.created_at)}
          </span>
        </td>

        <td>
          <span className="customer-name">
            {sale.customer_name || "Walk-in Customer"}
          </span>
        </td>

        <td>
          <strong className="sale-total">
            {formatCurrency(sale.total_amount)}
          </strong>
        </td>

        <td>
          <strong className="sale-profit">
            {formatCurrency(sale.gross_profit)}
          </strong>
        </td>

        <td>
          <span className="created-by">
            <FiUser />
            {sale.created_by
              ? `${sale.created_by.slice(0, 8)}...`
              : "System"}
          </span>
        </td>

        <td>
          <div className="sales-row-actions">
            <button type="button" className="view-sale-button" onClick={onView}><FiEye /> View</button>
            {canEdit && <button type="button" className="edit-sale-button" onClick={onEdit}><FiEdit2 /> Edit</button>}
          </div>
        </td>
      </tr>

      {expanded && (
        <tr className="sales-items-row">
          <td colSpan={canEdit ? 8 : 7}>
            {!items ? (
              <div className="sales-items-loading">
                Loading products...
              </div>
            ) : (
              <div className="sales-items">
                <div className="sales-items-heading">
                  <span>Product</span>
                  <span>Qty</span>
                  <span>Price</span>
                  <span>Total</span>
                </div>

                {items.map((item) => (
                  <div className="sales-item" key={item.id}>
                    <span>{item.product_name}</span>
                    <span>{item.quantity}</span>
                    <span>
                      {formatCurrency(item.selling_price)}
                    </span>
                    <strong>
                      {formatCurrency(item.line_total)}
                    </strong>
                  </div>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}


function EditSaleModal({ details, onClose, onSave }) {
  const { sale, items: originalItems } = details;
  const [products, setProducts] = useState([]);
  const [customerName, setCustomerName] = useState(sale.customer_name || "");
  const [discount, setDiscount] = useState(String(sale.discount_amount || 0));
  const [items, setItems] = useState(() => originalItems.map((item) => ({
    product_id: Number(item.product_id),
    product_name: item.product_name,
    quantity: String(item.quantity),
    selling_price: String(item.selling_price),
  })));
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProducts({ includeInactive: true }).then((data) => {
      if (active) setProducts(data);
    }).catch((err) => {
      if (active) setError(err?.message || "Unable to load products.");
    }).finally(() => {
      if (active) setLoadingProducts(false);
    });
    return () => { active = false; };
  }, []);

  const subtotal = items.reduce((sum, item) => {
    const q = Number(item.quantity), p = Number(item.selling_price);
    return sum + (Number.isFinite(q) && Number.isFinite(p) ? q * p : 0);
  }, 0);
  const discountValue = Number(discount || 0);
  const total = Math.max(0, subtotal - (Number.isFinite(discountValue) ? discountValue : 0));

  function changeItem(index, field, value) {
    setItems((current) => current.map((item, i) => {
      if (i !== index) return item;
      if (field === "product_id") {
        const product = products.find((entry) => Number(entry.id) === Number(value));
        return { ...item, product_id: Number(value), product_name: product?.name || item.product_name, selling_price: String(product?.selling_price ?? item.selling_price) };
      }
      return { ...item, [field]: value };
    }));
  }

  function addItem() {
    const product = products.find((p) => p.active !== false && !items.some((item) => Number(item.product_id) === Number(p.id)));
    if (!product) { setError("No additional active products are available to add."); return; }
    setError("");
    setItems((current) => [...current, { product_id: Number(product.id), product_name: product.name, quantity: "1", selling_price: String(product.selling_price ?? 0) }]);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!items.length) { setError("A receipt must contain at least one product."); return; }
    const d = Number(discount || 0);
    if (!Number.isFinite(d) || d < 0 || d > subtotal) { setError("Enter a valid discount that does not exceed the subtotal."); return; }
    const cleanItems = items.map((item) => ({ product_id: Number(item.product_id), quantity: Number(item.quantity), selling_price: Number(item.selling_price) }));
    if (cleanItems.some((item) => !Number.isInteger(item.product_id) || item.product_id <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.selling_price) || item.selling_price < 0)) {
      setError("Each product needs a valid quantity and non-negative price."); return;
    }
    if (new Set(cleanItems.map((item) => item.product_id)).size !== cleanItems.length) { setError("A product can only appear once. Remove duplicates before saving."); return; }
    try {
      setSaving(true);
      await onSave({ saleId: sale.id, customerName, discount: d, items: cleanItems });
    } catch (err) {
      setError(err?.message || "Unable to update this receipt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sale-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <form className="sale-modal sale-edit-modal" onSubmit={submit}>
        <div className="sale-modal-header">
          <div><span>EDIT RECEIPT · OWNER / MANAGER</span><h2>{sale.invoice_number}</h2></div>
          <button type="button" className="sale-modal-close" onClick={onClose} disabled={saving} aria-label="Close edit receipt"><FiX /></button>
        </div>
        <div className="sale-edit-body">
          <div className="sale-edit-fields">
            <label>Customer name<input value={customerName} maxLength={150} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in Customer" disabled={saving} /></label>
            <label>Discount (Rs.)<input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={saving} /></label>
          </div>
          {loadingProducts && <p className="sale-edit-hint">Loading product catalogue…</p>}
          {items.map((item, index) => (
            <div className="sale-edit-item" key={index}>
              <label className="sale-edit-product">Product
                <select value={item.product_id} onChange={(e) => changeItem(index, "product_id", e.target.value)} disabled={saving || loadingProducts}>
                  {!products.some((p) => Number(p.id) === Number(item.product_id)) && <option value={item.product_id}>{item.product_name} (current receipt)</option>}
                  {products.map((p) => <option key={p.id} value={p.id} disabled={items.some((other, i) => i !== index && Number(other.product_id) === Number(p.id))}>{p.name}{p.active === false ? " (inactive)" : ""}</option>)}
                </select>
              </label>
              <label>Qty<input type="number" min="1" step="1" value={item.quantity} onChange={(e) => changeItem(index, "quantity", e.target.value)} disabled={saving} required /></label>
              <label>Price (Rs.)<input type="number" min="0" step="0.01" value={item.selling_price} onChange={(e) => changeItem(index, "selling_price", e.target.value)} disabled={saving} required /></label>
              <strong className="sale-edit-line-total">{formatCurrency(Number(item.quantity || 0) * Number(item.selling_price || 0))}</strong>
              <button type="button" className="sale-edit-remove" onClick={() => setItems((current) => current.filter((_, i) => i !== index))} disabled={saving || items.length === 1} aria-label="Remove product"><FiTrash2 /></button>
            </div>
          ))}
          <button type="button" className="sale-edit-add" onClick={addItem} disabled={saving || loadingProducts}><FiPlus /> Add product</button>
          <div className="sale-edit-summary">
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Discount</span><strong>− {formatCurrency(discountValue)}</strong></div>
            <div className="sale-edit-grand-total"><span>Updated total</span><strong>{formatCurrency(total)}</strong></div>
          </div>
          {error && <div className="sale-edit-error" role="alert">{error}</div>}
          <p className="sale-edit-warning">Saving updates this existing receipt and adjusts stock. The invoice number and original sale date stay unchanged.</p>
        </div>
        <div className="sale-edit-footer">
          <button type="button" className="sale-edit-cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="sale-edit-save" disabled={saving || loadingProducts}><FiSave /> {saving ? "Saving receipt…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

function SaleDetailsModal({
  details,
  loading,
  onClose,
}) {
  const { sale, items } = details;

  return (
    <div
      className="sale-modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="sale-modal">
        <div className="sale-modal-header">
          <div>
            <span>COMPLETED INVOICE</span>
            <h2>{sale.invoice_number}</h2>
          </div>

          <button
            type="button"
            className="sale-modal-close"
            onClick={onClose}
          >
            <FiX />
          </button>
        </div>

        {loading ? (
          <div className="sales-state">
            <div className="sales-loader" />
            <p>Loading invoice...</p>
          </div>
        ) : (
          <>
            <div className="sale-modal-meta">
              <div>
                <span>Customer</span>
                <strong>
                  {sale.customer_name || "Walk-in Customer"}
                </strong>
              </div>

              <div>
                <span>Date</span>
                <strong>
                  {formatDateTime(sale.created_at)}
                </strong>
              </div>
            </div>

            <div className="sale-modal-items">
              <div className="sale-modal-item heading">
                <span>Product</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>

              {items.map((item) => (
                <div
                  className="sale-modal-item"
                  key={item.id}
                >
                  <span>{item.product_name}</span>
                  <span>{item.quantity}</span>
                  <span>
                    {formatCurrency(item.selling_price)}
                  </span>
                  <strong>
                    {formatCurrency(item.line_total)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="sale-modal-total">
              <span>Total</span>
              <strong>
                {formatCurrency(sale.total_amount)}
              </strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}