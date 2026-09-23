import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  FiShoppingBag,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiAlertCircle,
  FiArrowUpRight,
  FiRefreshCw,
  FiClock,
} from "react-icons/fi";

import { getDashboardData } from "../services/dashboardService";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatTime(value) {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate() {
  return new Date().toLocaleDateString("en-PK", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getStockStatus(product) {
  if (product.stock_quantity <= 0) {
    return "Out of stock";
  }

  if (product.stock_quantity <= product.minimum_stock) {
    return "Low stock";
  }

  return "In stock";
}

export default function Dashboard() {
  const { profile } = useAuth();

  const canViewProfit =
    profile?.role === "OWNER" || profile?.role === "MANAGER";
  const [dashboard, setDashboard] = useState({
    totalSales: 0,
    totalProfit: 0,
    productsSold: 0,
    invoiceCount: 0,
    productCount: 0,
    lowStockProducts: [],
    recentSales: [],
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDashboard(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getDashboardData();

      setDashboard(data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      setError(
        err?.message || "Unable to load dashboard data. Please try again.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  function handleViewSales() {
    window.dispatchEvent(
      new CustomEvent("jwandoon:navigate", {
        detail: "sales",
      }),
    );
  }

  function handleViewInventory() {
    window.dispatchEvent(
      new CustomEvent("jwandoon:navigate", {
        detail: "inventory",
      }),
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="dashboard-loader" />
          <p>Loading business overview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">JWANDOON BUSINESS</span>

          <h1>Business Overview</h1>

          <p>
            Monitor your sales, inventory and business performance from one
            place.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <div className="dashboard-date">{formatDate()}</div>

          <button
            type="button"
            className="dashboard-refresh"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "dashboard-spin" : ""} />

            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <FiAlertCircle />

          <div>
            <strong>Dashboard update failed</strong>
            <span>{error}</span>
          </div>

          <button type="button" onClick={() => loadDashboard(true)}>
            Try again
          </button>
        </div>
      )}

      <section className="stats-grid">
        {canViewProfit && (
          <div className="stat-card">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>

            <div>
              <span>Today's Profit</span>

              <strong>{formatCurrency(dashboard.totalProfit)}</strong>

              <small>Gross profit from today's sales</small>
            </div>
          </div>
        )}

        <div className="stat-card">
          <div className="stat-icon">
            <FiTrendingUp />
          </div>

          <div>
            <span>Today's Profit</span>

            <strong>{formatCurrency(dashboard.totalProfit)}</strong>

            <small>Gross profit from today's sales</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiShoppingBag />
          </div>

          <div>
            <span>Products Sold</span>

            <strong>{dashboard.productsSold}</strong>

            <small>Units sold today</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FiPackage />
          </div>

          <div>
            <span>Total Products</span>

            <strong>{dashboard.productCount}</strong>

            <small>Active product catalogue</small>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">BUSINESS ACTIVITY</span>

              <h2>Recent Sales</h2>
            </div>

            <button
              type="button"
              className="panel-action"
              onClick={handleViewSales}
            >
              View All
              <FiArrowUpRight />
            </button>
          </div>

          {dashboard.recentSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FiShoppingBag />
              </div>

              <h3>No sales yet</h3>

              <p>Completed invoices will appear here automatically.</p>
            </div>
          ) : (
            <div className="recent-sales-list">
              {dashboard.recentSales.map((sale) => (
                <div className="recent-sale" key={sale.id}>
                  <div className="recent-sale-icon">
                    <FiShoppingBag />
                  </div>

                  <div className="recent-sale-info">
                    <strong>{sale.invoice_number}</strong>

                    <span>{sale.customer_name || "Walk-in Customer"}</span>
                  </div>

                  <div className="recent-sale-time">
                    <span>{formatTime(sale.created_at)}</span>

                    <strong>{formatCurrency(sale.total_amount)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <div>
              <span className="panel-eyebrow">INVENTORY</span>

              <h2>Stock Alerts</h2>
            </div>

            <button
              type="button"
              className="panel-action"
              onClick={handleViewInventory}
            >
              Inventory
              <FiArrowUpRight />
            </button>
          </div>

          {dashboard.lowStockProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <FiPackage />
              </div>

              <h3>Inventory looks good</h3>

              <p>
                No products are currently at or below their minimum stock level.
              </p>
            </div>
          ) : (
            <div className="stock-alert-list">
              {dashboard.lowStockProducts.slice(0, 6).map((product) => (
                <div className="stock-alert" key={product.id}>
                  <div className="stock-alert-icon">
                    <FiAlertCircle />
                  </div>

                  <div className="stock-alert-info">
                    <strong>{product.name}</strong>

                    <span>Minimum: {product.minimum_stock}</span>
                  </div>

                  <div className="stock-alert-quantity">
                    <strong>{product.stock_quantity}</strong>

                    <span>{getStockStatus(product)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="dashboard-footer-note">
        <FiClock />

        <span>Dashboard automatically refreshes every minute.</span>
      </div>
    </div>
  );
}
