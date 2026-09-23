import { supabase } from "./supabase";

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateRange(range, customStart, customEnd) {
  const now = new Date();

  if (range === "custom") {
    if (!customStart || !customEnd) {
      throw new Error("Please select both custom dates.");
    }

    if (customEnd < customStart) {
      throw new Error("End date cannot be before start date.");
    }

    return {
      startDate: customStart,
      endDate: customEnd,
    };
  }

  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  let startDate = today;

  if (range === "week") {
    const day = today.getDay();

    const daysSinceMonday = day === 0 ? 6 : day - 1;

    startDate = new Date(today);
    startDate.setDate(
      today.getDate() - daysSinceMonday
    );
  }

  if (range === "month") {
    startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );
  }

  return {
    startDate: formatLocalDate(startDate),
    endDate: formatLocalDate(today),
  };
}

function toPakistanStartOfDay(dateString) {
  return new Date(
    `${dateString}T00:00:00+05:00`
  ).toISOString();
}

function toPakistanEndOfDay(dateString) {
  return new Date(
    `${dateString}T23:59:59.999+05:00`
  ).toISOString();
}

export async function getReportData({
  range = "today",
  customStart = "",
  customEnd = "",
}) {
  const { startDate, endDate } = getDateRange(
    range,
    customStart,
    customEnd
  );

  const { data, error } = await supabase.rpc(
    "get_reports",
    {
      p_start_date:
        toPakistanStartOfDay(startDate),

      p_end_date:
        toPakistanEndOfDay(endDate),
    }
  );

  if (error) {
    throw error;
  }

  const report = data || {};

  return {
    summary: {
      totalSales: Number(
        report.totalSales || 0
      ),

      totalCost: Number(
        report.totalCost || 0
      ),

      totalProfit: Number(
        report.totalProfit || 0
      ),

      totalUnits: Number(
        report.totalUnits || 0
      ),

      invoices: Number(
        report.invoices || 0
      ),

      averageInvoice: Number(
        report.averageInvoice || 0
      ),
    },

    salesTrend: Array.isArray(
      report.salesTrend
    )
      ? report.salesTrend
      : [],

    topProducts: Array.isArray(
      report.topProducts
    )
      ? report.topProducts.map(
          (product) => ({
            product_id: product.product_id,
            product_name:
              product.product_name,

            quantity: Number(
              product.units_sold || 0
            ),

            revenue: Number(
              product.sales || 0
            ),

            profit: 0,
          })
        )
      : [],

    lowStockProducts:
      Array.isArray(
        report.lowStockProducts
      )
        ? report.lowStockProducts
        : [],

    sales: Array.isArray(
      report.recentSales
    )
      ? report.recentSales
      : [],
  };
}