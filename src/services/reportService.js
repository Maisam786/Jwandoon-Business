import { supabase } from "./supabase";

/* =========================================================
   DATE HELPERS
   ========================================================= */

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Get today's date according to Pakistan time.
 * This prevents the user's browser timezone from affecting
 * Today / This Week / This Month reports.
 */
function getPakistanToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
  };
}

/**
 * Convert a YYYY-MM-DD string into a local Date object.
 *
 * We intentionally avoid:
 * new Date("YYYY-MM-DD")
 *
 * because JavaScript treats that format as UTC, which can
 * cause the date to shift depending on the browser timezone.
 */
function dateFromParts(year, month, day) {
  return new Date(year, month - 1, day);
}

/* =========================================================
   REPORT DATE RANGE
   ========================================================= */

function getDateRange(
  range,
  customStart,
  customEnd
) {
  /* -------------------------
     CUSTOM RANGE
     ------------------------- */

  if (range === "custom") {
    if (!customStart || !customEnd) {
      throw new Error(
        "Please select both custom dates."
      );
    }

    if (customEnd < customStart) {
      throw new Error(
        "End date cannot be before start date."
      );
    }

    return {
      startDate: customStart,
      endDate: customEnd,
    };
  }

  /* -------------------------
     PAKISTAN TODAY
     ------------------------- */

  const pakistanToday = getPakistanToday();

  const today = dateFromParts(
    pakistanToday.year,
    pakistanToday.month,
    pakistanToday.day
  );

  let startDate = new Date(today);

  /* -------------------------
     THIS WEEK
     Monday → Today
     ------------------------- */

  if (range === "week") {
    const dayOfWeek = today.getDay();

    /*
      JavaScript:
      Sunday    = 0
      Monday    = 1
      Tuesday   = 2
      Wednesday = 3
      Thursday  = 4
      Friday    = 5
      Saturday  = 6
    */

    const daysSinceMonday =
      dayOfWeek === 0
        ? 6
        : dayOfWeek - 1;

    startDate = new Date(today);

    startDate.setDate(
      today.getDate() - daysSinceMonday
    );
  }

  /* -------------------------
     THIS MONTH
     ------------------------- */

  if (range === "month") {
    startDate = dateFromParts(
      pakistanToday.year,
      pakistanToday.month,
      1
    );
  }

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(today),
  };
}

/* =========================================================
   PAKISTAN TIME → UTC
   ========================================================= */

/**
 * Start of a Pakistan calendar day.
 *
 * Pakistan = UTC+05:00
 */
function toPakistanStartOfDay(dateString) {
  return new Date(
    `${dateString}T00:00:00+05:00`
  ).toISOString();
}

/**
 * End of a Pakistan calendar day.
 *
 * Pakistan = UTC+05:00
 */
function toPakistanEndOfDay(dateString) {
  return new Date(
    `${dateString}T23:59:59.999+05:00`
  ).toISOString();
}

/* =========================================================
   MAIN REPORT FUNCTION
   ========================================================= */

export async function getReportData({
  range = "today",
  customStart = "",
  customEnd = "",
}) {
  /* -------------------------
     Calculate date range
     ------------------------- */

  const {
    startDate,
    endDate,
  } = getDateRange(
    range,
    customStart,
    customEnd
  );

  const startUTC =
    toPakistanStartOfDay(startDate);

  const endUTC =
    toPakistanEndOfDay(endDate);

  /* -------------------------
     Debug information
     ------------------------- */

  console.log(
    "REPORT DATE RANGE:",
    {
      range,
      startDate,
      endDate,
      startUTC,
      endUTC,
    }
  );

  /* -------------------------
     Get report from Supabase
     ------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_reports",
    {
      p_start_date: startUTC,
      p_end_date: endUTC,
    }
  );

  if (error) {
    console.error(
      "REPORT ERROR:",
      error
    );

    throw error;
  }

  /* -------------------------
     Normalize response
     ------------------------- */

  const report = data || {};

  /* -------------------------
     Summary
     ------------------------- */

  const summary = {
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
  };

  /* -------------------------
     Sales trend
     ------------------------- */

  const salesTrend =
    Array.isArray(report.salesTrend)
      ? report.salesTrend
      : [];

  /* -------------------------
     Top products
     ------------------------- */

  const topProducts =
    Array.isArray(report.topProducts)
      ? report.topProducts.map(
          (product) => ({
            product_id:
              product.product_id,

            product_name:
              product.product_name,

            quantity: Number(
              product.units_sold || 0
            ),

            revenue: Number(
              product.sales || 0
            ),

            profit: Number(
              product.profit || 0
            ),
          })
        )
      : [];

  /* -------------------------
     Low stock products
     ------------------------- */

  const lowStockProducts =
    Array.isArray(
      report.lowStockProducts
    )
      ? report.lowStockProducts
      : [];

  /* -------------------------
     Recent sales
     ------------------------- */

  const sales =
    Array.isArray(report.recentSales)
      ? report.recentSales
      : [];

  /* -------------------------
     Final report
     ------------------------- */

  return {
    summary,
    salesTrend,
    topProducts,
    lowStockProducts,
    sales,
  };
}