import { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiDollarSign,
  FiEye,
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
} from "../services/saleService";

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
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [selectedSale, setSelectedSale] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <button
            type="button"
            className="view-sale-button"
            onClick={onView}
          >
            <FiEye />
            View
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="sales-items-row">
          <td colSpan="7">
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