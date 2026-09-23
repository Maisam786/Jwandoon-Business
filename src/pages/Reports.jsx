import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBarChart2,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";

import { getReportData } from "../services/reportService";

import "./Reports.css";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Reports() {
  const [range, setRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadReport(showRefresh = false) {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getReportData({
        range,
        customStart,
        customEnd,
      });

      setReport(data);
    } catch (err) {
      console.error("Failed to load report:", err);

      setError(
        err?.message ||
          "Unable to load business report."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (
      range === "custom" &&
      (!customStart || !customEnd)
    ) {
      return;
    }

    loadReport();
  }, [range, customStart, customEnd]);

  const profitMargin = useMemo(() => {
    if (!report?.summary?.totalSales) {
      return 0;
    }

    return (
      (report.summary.totalProfit /
        report.summary.totalSales) *
      100
    );
  }, [report]);

  if (loading && !report) {
    return (
      <section className="reports-page">
        <div className="reports-loading">
          <div className="reports-loader" />
          <p>Loading business report...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="reports-page">
      <div className="reports-header">
        <div>
          <span className="reports-eyebrow">
            BUSINESS ANALYTICS
          </span>

          <h1>Reports</h1>

          <p>
            Understand your sales, profit and inventory
            performance.
          </p>
        </div>

        <button
          type="button"
          className="reports-refresh"
          onClick={() => loadReport(true)}
          disabled={refreshing}
        >
          <FiRefreshCw
            className={
              refreshing ? "reports-spin" : ""
            }
          />

          {refreshing
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      <div className="reports-filters">
        <div className="reports-range-buttons">
          <button
            type="button"
            className={
              range === "today"
                ? "active"
                : ""
            }
            onClick={() => setRange("today")}
          >
            Today
          </button>

          <button
            type="button"
            className={
              range === "week"
                ? "active"
                : ""
            }
            onClick={() => setRange("week")}
          >
            This Week
          </button>

          <button
            type="button"
            className={
              range === "month"
                ? "active"
                : ""
            }
            onClick={() => setRange("month")}
          >
            This Month
          </button>

          <button
            type="button"
            className={
              range === "custom"
                ? "active"
                : ""
            }
            onClick={() => setRange("custom")}
          >
            Custom
          </button>
        </div>

        {range === "custom" && (
          <div className="reports-custom-dates">
            <label>
              <FiCalendar />

              <input
                type="date"
                value={customStart}
                onChange={(event) =>
                  setCustomStart(
                    event.target.value
                  )
                }
              />
            </label>

            <span>to</span>

            <label>
              <FiCalendar />

              <input
                type="date"
                value={customEnd}
                onChange={(event) =>
                  setCustomEnd(
                    event.target.value
                  )
                }
              />
            </label>
          </div>
        )}
      </div>

      {error && (
        <div className="reports-error">
          <FiAlertCircle />

          <div>
            <strong>
              Unable to load report
            </strong>

            <span>{error}</span>
          </div>
        </div>
      )}

      {report && (
        <>
          <div className="reports-summary">
            <ReportCard
              icon={<FiDollarSign />}
              label="Total Sales"
              value={formatCurrency(
                report.summary.totalSales
              )}
            />

            <ReportCard
              icon={<FiTrendingUp />}
              label="Gross Profit"
              value={formatCurrency(
                report.summary.totalProfit
              )}
            />

            <ReportCard
              icon={<FiShoppingBag />}
              label="Invoices"
              value={report.summary.invoices}
            />

            <ReportCard
              icon={<FiPackage />}
              label="Units Sold"
              value={report.summary.totalUnits}
            />
          </div>

          <div className="reports-secondary-summary">
            <div>
              <span>Total Cost</span>
              <strong>
                {formatCurrency(
                  report.summary.totalCost
                )}
              </strong>
            </div>

            <div>
              <span>Average Invoice</span>
              <strong>
                {formatCurrency(
                  report.summary.averageInvoice
                )}
              </strong>
            </div>

            <div>
              <span>Profit Margin</span>
              <strong>
                {profitMargin.toFixed(1)}%
              </strong>
            </div>

            <div>
              <span>Transactions</span>
              <strong>
                {report.summary.invoices}
              </strong>
            </div>
          </div>

          <div className="reports-grid">
            <section className="reports-panel reports-trend-panel">
              <div className="reports-panel-header">
                <div>
                  <span>
                    PERFORMANCE
                  </span>

                  <h2>Sales Trend</h2>
                </div>

                <FiBarChart2 />
              </div>

              {report.salesTrend.length === 0 ? (
                <div className="reports-empty">
                  <FiBarChart2 />
                  <p>No sales during this period.</p>
                </div>
              ) : (
                <div className="reports-trend-list">
                  {report.salesTrend.map(
                    (item) => (
                      <div
                        className="reports-trend-row"
                        key={item.date}
                      >
                        <div>
                          <strong>
                            {formatDate(
                              item.date
                            )}
                          </strong>

                          <span>
                            {item.invoices} invoice
                            {item.invoices === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>

                        <div>
                          <strong>
                            {formatCurrency(
                              item.sales
                            )}
                          </strong>

                          <span>
                            Profit{" "}
                            {formatCurrency(
                              item.profit
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="reports-panel">
              <div className="reports-panel-header">
                <div>
                  <span>
                    PRODUCTS
                  </span>

                  <h2>Top Selling</h2>
                </div>

                <FiShoppingBag />
              </div>

              {report.topProducts.length === 0 ? (
                <div className="reports-empty">
                  <FiShoppingBag />
                  <p>No products sold.</p>
                </div>
              ) : (
                <div className="reports-product-list">
                  {report.topProducts.map(
                    (product, index) => (
                      <div
                        className="reports-product-row"
                        key={product.product_id}
                      >
                        <div className="reports-product-rank">
                          {index + 1}
                        </div>

                        <div className="reports-product-info">
                          <strong>
                            {product.product_name}
                          </strong>

                          <span>
                            {product.quantity} unit
                            {product.quantity === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>

                        <div className="reports-product-value">
                          <strong>
                            {formatCurrency(
                              product.revenue
                            )}
                          </strong>

                          <span>
                            {formatCurrency(
                              product.profit
                            )} profit
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="reports-panel reports-stock-panel">
            <div className="reports-panel-header">
              <div>
                <span>
                  INVENTORY
                </span>

                <h2>Low Stock</h2>
              </div>

              <FiAlertCircle />
            </div>

            {report.lowStockProducts.length === 0 ? (
              <div className="reports-stock-good">
                <FiPackage />

                <div>
                  <strong>
                    Inventory looks healthy
                  </strong>

                  <span>
                    No products are currently at
                    or below their minimum stock.
                  </span>
                </div>
              </div>
            ) : (
              <div className="reports-stock-list">
                {report.lowStockProducts.map(
                  (product) => (
                    <div
                      className="reports-stock-row"
                      key={product.id}
                    >
                      <div>
                        <strong>
                          {product.name}
                        </strong>

                        <span>
                          Minimum required:{" "}
                          {product.minimum_stock}
                        </span>
                      </div>

                      <span className="reports-stock-badge">
                        {product.stock_quantity} left
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>

          <section className="reports-panel reports-transactions-panel">
            <div className="reports-panel-header">
              <div>
                <span>
                  TRANSACTIONS
                </span>

                <h2>Recent Sales</h2>
              </div>
            </div>

            {report.sales.length === 0 ? (
              <div className="reports-empty">
                <FiShoppingBag />
                <p>No transactions in this period.</p>
              </div>
            ) : (
              <div className="reports-transactions">
                {report.sales.slice(0, 8).map(
                  (sale) => (
                    <div
                      className="reports-transaction-row"
                      key={sale.id}
                    >
                      <div>
                        <strong>
                          {sale.invoice_number}
                        </strong>

                        <span>
                          {sale.customer_name ||
                            "Walk-in Customer"}
                          {" · "}
                          {formatDate(
                            sale.created_at
                          )}
                        </span>
                      </div>

                      <div>
                        <strong>
                          {formatCurrency(
                            sale.total_amount
                          )}
                        </strong>

                        <span className="reports-profit">
                          +
                          {formatCurrency(
                            sale.gross_profit
                          )}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

function ReportCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="reports-card">
      <div className="reports-card-icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}