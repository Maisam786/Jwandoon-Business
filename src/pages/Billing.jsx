import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { jsPDF } from "jspdf";

import {
  FiPlus,
  FiTrash2,
  FiPrinter,
  FiShare2,
  FiUser,
  FiCamera,
  FiX,
  FiRefreshCw,
  FiCheckCircle,
  FiHash,
} from "react-icons/fi";

import { getProducts } from "../services/productService";
import { createSale } from "../services/saleService";
import { useAuth } from "../context/AuthContext";

import "./Billing.css";

const EMPTY_ITEM = {
  productNo: "",
  quantity: 1,
};

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

function getInvoiceNumber() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  const random = Math.floor(100 + Math.random() * 900);

  return `JW-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
}

function getFormattedDate() {
  return new Date().toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(error) {
  if (!error) {
    return "Something went wrong.";
  }

  const message = error?.message || String(error);

  if (message.includes("Insufficient stock")) {
    return message;
  }

  if (message.includes("Invoice number already exists")) {
    return "This invoice number already exists. Please start a new bill.";
  }

  if (message.includes("Not authenticated")) {
    return "Your session has expired. Please sign in again.";
  }

  return message;
}

export default function Billing() {
  const { profile } = useAuth();

  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  const [buyerName, setBuyerName] = useState("");
  const [printedBy, setPrintedBy] = useState(profile?.full_name || "");
  const [discount, setDiscount] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState(getInvoiceNumber());

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const scannerRef = useRef(null);
  const scanLockRef = useRef(false);

  /*
   * Product auto-commit timers.
   *
   * This allows:
   * 9
   * 99
   * 999
   *
   * to be typed normally without committing after every digit.
   */
  const productCommitTimersRef = useRef(new Map());

  const productInputRefs = useRef({});
  const quantityInputRefs = useRef({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [savingSale, setSavingSale] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [saleRecord, setSaleRecord] = useState(null);

  useEffect(() => {
    if (profile?.full_name) {
      setPrintedBy(profile.full_name);
    }
  }, [profile]);

  useEffect(() => {
    return () => {
      productCommitTimersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });

      productCommitTimersRef.current.clear();
    };
  }, []);

  async function loadProducts(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoadingProducts(true);
      }

      setError("");

      const data = await getProducts();

      setProducts(data);
    } catch (error) {
      console.error("Failed to load billing products:", error);

      setError(getErrorMessage(error) || "Unable to load products.");
    } finally {
      setLoadingProducts(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const invoiceItems = useMemo(() => {
    return items.map((item) => {
      const product = products.find(
        (product) => product.id === Number(item.productNo),
      );

      const parsedQuantity = Number(item.quantity);

      const quantity =
        Number.isFinite(parsedQuantity) && parsedQuantity > 0
          ? parsedQuantity
          : 1;

      return {
        ...item,
        quantity,
        product,
        total: product ? Number(product.selling_price || 0) * quantity : 0,
      };
    });
  }, [items, products]);

  const validItems = invoiceItems.filter((item) => item.product);

  const subtotal = validItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = Math.min(Math.max(0, Number(discount) || 0), subtotal);

  const grandTotal = Math.max(0, subtotal - discountAmount);

  function updateItem(index, field, value) {
    if (saleCompleted) {
      return;
    }

    setError("");
    setSuccess("");

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addProductToBill(productId, quantityToAdd = 1) {
    if (saleCompleted) {
      return;
    }

    const product = products.find((item) => item.id === Number(productId));

    if (!product) {
      setError("Product not found.");
      return;
    }

    if (!product.active) {
      setError("This product is inactive.");
      return;
    }

    const availableStock = Number(product.stock_quantity || 0);

    if (availableStock <= 0) {
      setError(`${product.name} is currently out of stock.`);
      return;
    }

    const quantity = Math.max(1, Number(quantityToAdd) || 1);

    setError("");
    setSuccess("");

    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => Number(item.productNo) === Number(product.id),
      );

      if (existingIndex !== -1) {
        return current.map((item, index) => {
          if (index !== existingIndex) {
            return item;
          }

          const newQuantity = Number(item.quantity || 1) + quantity;

          return {
            ...item,
            quantity: Math.min(newQuantity, availableStock),
          };
        });
      }

      const emptyIndex = current.findIndex((item) => !item.productNo);

      if (emptyIndex !== -1) {
        return current.map((item, index) =>
          index === emptyIndex
            ? {
                productNo: String(product.id),
                quantity: Math.min(quantity, availableStock),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          productNo: String(product.id),
          quantity: Math.min(quantity, availableStock),
        },
      ];
    });
  }

  function commitManualProduct(index) {
    if (saleCompleted) {
      return false;
    }

    const productId = Number(items[index]?.productNo);

    if (!Number.isInteger(productId) || productId <= 0) {
      if (items[index]?.productNo) {
        setError("Enter a valid product number.");
      }

      return false;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      setError(`Product #${productId} was not found.`);
      return false;
    }

    if (!product.active) {
      setError("This product is inactive.");
      return false;
    }

    if (Number(product.stock_quantity || 0) <= 0) {
      setError(`${product.name} is currently out of stock.`);
      return false;
    }

    const currentQuantity = Number(items[index]?.quantity);

    const quantity =
      Number.isFinite(currentQuantity) && currentQuantity > 0
        ? currentQuantity
        : 1;

    const duplicateIndex = items.findIndex(
      (item, itemIndex) =>
        itemIndex !== index && Number(item.productNo) === productId,
    );

    if (duplicateIndex !== -1) {
      const existingQuantity = Number(items[duplicateIndex].quantity || 1);

      const combinedQuantity = existingQuantity + quantity;

      const maxStock = Number(product.stock_quantity || 0);

      setItems((current) =>
        current
          .filter((_, itemIndex) => itemIndex !== index)
          .map((item, itemIndex) => {
            const originalIndex =
              itemIndex >= index ? itemIndex + 1 : itemIndex;

            if (originalIndex === duplicateIndex) {
              return {
                ...item,
                quantity: Math.min(combinedQuantity, maxStock),
              };
            }

            return item;
          }),
      );

      setError("");

      return true;
    }

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productNo: String(product.id),
              quantity: Math.min(quantity, Number(product.stock_quantity || 0)),
            }
          : item,
      ),
    );

    setError("");

    return true;
  }

  function scheduleProductCommit(index) {
    const existingTimer = productCommitTimersRef.current.get(index);

    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      productCommitTimersRef.current.delete(index);

      const currentValue = items[index]?.productNo;

      if (!currentValue) {
        return;
      }

      const productId = Number(currentValue);

      if (!Number.isInteger(productId)) {
        return;
      }

      const productExists = products.some(
        (product) => product.id === productId,
      );

      /*
       * Only auto-commit when the complete typed number
       * actually exists.
       *
       * This means typing:
       *
       * 9 -> does not immediately destroy the input
       * 99 -> resolves product 99
       */
      if (productExists) {
        commitManualProduct(index);
      }
    }, 350);

    productCommitTimersRef.current.set(index, timer);
  }

  function handleProductNumberChange(index, value) {
    if (saleCompleted) {
      return;
    }

    // Keep only digits
    const cleanValue = value.replace(/\D/g, "");

    setError("");
    setSuccess("");

    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productNo: cleanValue,
            }
          : item,
      ),
    );

    // Do NOT commit/blur here.
    // This allows mobile users to type 123 continuously.
  }

  function handleProductNumberKeyDown(event, index) {
    if (event.key === "Enter") {
      event.preventDefault();

      const timer = productCommitTimersRef.current.get(index);

      if (timer) {
        clearTimeout(timer);
        productCommitTimersRef.current.delete(index);
      }

      const committed = commitManualProduct(index);

      if (committed) {
        setTimeout(() => {
          quantityInputRefs.current[index]?.focus();
          quantityInputRefs.current[index]?.select();
        }, 0);
      }
    }
  }

  function handleProductNumberBlur(index) {
    const timer = productCommitTimersRef.current.get(index);

    if (timer) {
      clearTimeout(timer);
      productCommitTimersRef.current.delete(index);
    }

    if (items[index]?.productNo) {
      commitManualProduct(index);
    }
  }

  function handleQuantityFocus(event) {
    /*
     * Selecting the entire current quantity means:
     *
     * current = 1
     * tap field
     * type 4
     *
     * becomes:
     * 4
     *
     * instead of:
     * 14
     */
    event.target.select();
  }

  function handleQuantityChange(index, value) {
    if (saleCompleted) {
      return;
    }

    const cleanedValue = value.replace(/\D/g, "");

    /*
     * Allow an empty value while the user is editing.
     * The field is normalized on blur.
     */
    updateItem(index, "quantity", cleanedValue);
  }

  function normalizeQuantity(index) {
    const item = items[index];

    if (!item) {
      return;
    }

    const product = products.find(
      (product) => product.id === Number(item.productNo),
    );

    const stock = Number(product?.stock_quantity || 0);

    let quantity = Number(item.quantity);

    if (!Number.isFinite(quantity) || quantity < 1) {
      quantity = 1;
    }

    if (stock > 0) {
      quantity = Math.min(quantity, stock);
    }

    updateItem(index, "quantity", quantity);
  }

  function handleQuantityKeyDown(event, index) {
    if (event.key === "Enter") {
      event.preventDefault();

      normalizeQuantity(index);

      productInputRefs.current[index + 1]?.focus();
    }
  }

  function handleScannedCode(decodedText) {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;

    const code = decodedText.trim();

    let productId = null;

    if (code.startsWith("JWANDOON:")) {
      productId = Number(code.replace("JWANDOON:", ""));
    } else if (/^\d+$/.test(code)) {
      productId = Number(code);
    }

    if (!productId) {
      setError("Invalid Jwandoon product QR code.");

      setTimeout(() => {
        scanLockRef.current = false;
      }, 1200);

      return;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      setError(`Product #${productId} was not found.`);
    } else {
      addProductToBill(productId, 1);

      setSuccess(`${product.name} added to the bill.`);

      setTimeout(() => {
        setScannerOpen(false);
      }, 250);
    }

    setTimeout(() => {
      scanLockRef.current = false;
    }, 1200);
  }

  useEffect(() => {
    if (!scannerOpen) {
      return undefined;
    }

    let cancelled = false;

    async function startScanner() {
      try {
        const scanner = new Html5Qrcode("qr-reader");

        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          (decodedText) => {
            if (!cancelled) {
              handleScannedCode(decodedText);
            }
          },
          () => {},
        );
      } catch (error) {
        console.error("Unable to start QR scanner:", error);

        if (!cancelled) {
          setError(
            "Unable to access the camera. Please allow camera permission.",
          );
        }
      }
    }

    startScanner();

    return () => {
      cancelled = true;

      const scanner = scannerRef.current;

      if (scanner) {
        scanner
          .stop()
          .catch(() => {})
          .finally(() => {
            scanner.clear();
          });
      }

      scannerRef.current = null;
    };
  }, [scannerOpen]);

  function addItem() {
  if (saleCompleted) {
    return;
  }

  setItems((current) => [
    {
      ...EMPTY_ITEM,
    },
    ...current,
  ]);
}

  function removeItem(index) {
    if (saleCompleted) {
      return;
    }

    const timer = productCommitTimersRef.current.get(index);

    if (timer) {
      clearTimeout(timer);
      productCommitTimersRef.current.delete(index);
    }

    setItems((current) => {
      const updated = current.filter((_, itemIndex) => itemIndex !== index);

      return updated.length ? updated : [{ ...EMPTY_ITEM }];
    });
  }

  function clearInvoice() {
    if (saleCompleted) {
      return;
    }

    productCommitTimersRef.current.forEach((timer) => clearTimeout(timer));

    productCommitTimersRef.current.clear();

    setItems([{ ...EMPTY_ITEM }]);
    setBuyerName("");
    setDiscount("");
    setError("");
    setSuccess("");
  }

  function validateInvoice() {
    if (!validItems.length) {
      setError("Please add at least one valid product.");
      return false;
    }

    for (const item of validItems) {
      const quantity = Number(item.quantity || 0);

      const stock = Number(item.product.stock_quantity || 0);

      if (quantity <= 0) {
        setError(`Invalid quantity for ${item.product.name}.`);
        return false;
      }

      if (quantity > stock) {
        setError(
          `Insufficient stock for ${item.product.name}. Available: ${stock}, requested: ${quantity}.`,
        );
        return false;
      }

      if (Number(item.product.selling_price || 0) <= 0) {
        setError(`${item.product.name} does not have a valid selling price.`);
        return false;
      }
    }

    if (discountAmount > subtotal) {
      setError("Discount cannot be greater than the subtotal.");
      return false;
    }

    return true;
  }

  async function ensureSaleCreated() {
    if (saleCompleted && saleRecord) {
      return saleRecord;
    }

    /*
     * Normalize any quantity that may still be
     * actively edited before validation.
     */
    setItems((current) =>
      current.map((item) => {
        const product = products.find(
          (product) => product.id === Number(item.productNo),
        );

        const stock = Number(product?.stock_quantity || 0);

        let quantity = Number(item.quantity);

        if (!Number.isFinite(quantity) || quantity < 1) {
          quantity = 1;
        }

        if (stock > 0) {
          quantity = Math.min(quantity, stock);
        }

        return {
          ...item,
          quantity,
        };
      }),
    );

    if (!validateInvoice()) {
      return null;
    }

    setSavingSale(true);
    setError("");
    setSuccess("");

    try {
      const sale = await createSale({
        invoiceNumber,
        customerName: buyerName,
        discount: discountAmount,
        subtotal,
        total: grandTotal,
        items: validItems.map((item) => ({
          product_id: item.product.id,
          quantity: Number(item.quantity),
        })),
      });

      setSaleRecord(sale);
      setSaleCompleted(true);

      setSuccess(`Sale ${invoiceNumber} completed successfully.`);

      await loadProducts(true);

      return sale;
    } catch (error) {
      console.error("Failed to create sale:", error);

      setError(getErrorMessage(error));

      return null;
    } finally {
      setSavingSale(false);
    }
  }

  function buildPDF() {
    const doc = new jsPDF();

    const brown = [43, 27, 16];
    const gold = [194, 142, 46];
    const muted = [109, 76, 49];
    const light = [248, 243, 235];
    const border = [225, 216, 205];
    const white = [255, 255, 255];

    doc.setFillColor(...brown);
    doc.rect(0, 0, 210, 34, "F");

    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("JWANDOON", 15, 16);

    doc.setFontSize(8);
    doc.setTextColor(225, 216, 205);

    doc.text("Kacha Pakha, Hangu Road, Kohat", 15, 23);

    doc.text("+92 333 9024144 | itminanh@gmail.com", 15, 28);

    doc.setTextColor(...brown);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");

    doc.text("INVOICE", 195, 17, {
      align: "right",
    });

    doc.setFontSize(8);
    doc.setTextColor(...muted);

    doc.text(getFormattedDate(), 195, 23, {
      align: "right",
    });

    doc.text(invoiceNumber, 195, 28, {
      align: "right",
    });

    let y = 48;

    doc.setFillColor(...light);

    doc.roundedRect(15, y, 180, 25, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...muted);

    doc.text("CUSTOMER", 21, y + 8);

    doc.text("PRINTED BY", 21, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...brown);

    doc.text(buyerName.trim() || "Walk-in Customer", 55, y + 8);

    doc.text(printedBy || profile?.full_name || "Jwandoon", 55, y + 17);

    y += 36;

    doc.setFillColor(...brown);
    doc.rect(15, y, 180, 10, "F");

    doc.setTextColor(...white);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    doc.text("PRODUCT", 20, y + 6.5);

    doc.text("QTY", 125, y + 6.5);

    doc.text("PRICE", 145, y + 6.5);

    doc.text("TOTAL", 190, y + 6.5, {
      align: "right",
    });

    y += 10;

    doc.setFont("helvetica", "normal");

    doc.setFontSize(8);

    validItems.forEach((item) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFillColor(...white);
      doc.setDrawColor(...border);

      doc.line(15, y + 9, 195, y + 9);

      doc.setTextColor(...brown);

      const productName =
        item.product.name.length > 45
          ? `${item.product.name.slice(0, 42)}...`
          : item.product.name;

      doc.text(productName, 20, y + 6);

      doc.text(String(item.quantity), 125, y + 6);

      doc.text(formatCurrency(item.product.selling_price), 145, y + 6);

      doc.text(formatCurrency(item.total), 190, y + 6, {
        align: "right",
      });

      y += 10;
    });

    y += 8;

    doc.setDrawColor(...border);

    doc.line(120, y, 195, y);

    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);

    doc.text("Subtotal", 145, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brown);

    doc.text(formatCurrency(subtotal), 190, y, {
      align: "right",
    });

    y += 8;

    if (discountAmount > 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...muted);

      doc.text("Discount", 145, y);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(74, 114, 75);

      doc.text(`- ${formatCurrency(discountAmount)}`, 190, y, {
        align: "right",
      });

      y += 10;
    }

    doc.setFillColor(...gold);

    doc.roundedRect(120, y - 4, 75, 15, 3, 3, "F");

    doc.setTextColor(...white);

    doc.setFont("helvetica", "bold");

    doc.text("TOTAL", 127, y + 5);

    doc.text(formatCurrency(grandTotal), 190, y + 5, {
      align: "right",
    });

    y += 30;

    doc.setTextColor(...muted);

    doc.setFont("helvetica", "normal");

    doc.setFontSize(9);

    doc.text("Thank you for shopping with Jwandoon.", 105, y, {
      align: "center",
    });

    doc.setFontSize(7);

    doc.text(
      "This invoice is generated by Jwandoon Business Management.",
      105,
      y + 7,
      {
        align: "center",
      },
    );

    return doc;
  }

  async function printInvoice() {
    const sale = await ensureSaleCreated();

    if (!sale) {
      return;
    }

    setTimeout(() => {
      window.print();
    }, 150);
  }

  async function sharePDF() {
    const sale = await ensureSaleCreated();

    if (!sale) {
      return;
    }

    try {
      const doc = buildPDF();

      const pdfBlob = doc.output("blob");

      const file = new File(
        [pdfBlob],
        `Jwandoon-Invoice-${invoiceNumber}.pdf`,
        {
          type: "application/pdf",
        },
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          title: `Jwandoon Invoice ${invoiceNumber}`,
          text: `Jwandoon invoice ${invoiceNumber}`,
          files: [file],
        });

        return;
      }

      doc.save(file.name);
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Failed to share invoice:", error);

      setError(
        "Unable to share the PDF. The invoice will be downloaded instead.",
      );

      buildPDF().save(`Jwandoon-Invoice-${invoiceNumber}.pdf`);
    }
  }

  function startNewBill() {
    productCommitTimersRef.current.forEach((timer) => clearTimeout(timer));

    productCommitTimersRef.current.clear();

    setItems([{ ...EMPTY_ITEM }]);
    setBuyerName("");
    setDiscount("");
    setInvoiceNumber(getInvoiceNumber());
    setError("");
    setSuccess("");
    setSaleCompleted(false);
    setSaleRecord(null);
  }

  return (
    <main className="billing-page">
      <div className="billing-header">
        <div>
          <span className="billing-eyebrow">SALES & BILLING</span>

          <h1>Create Invoice</h1>

          <p>Create a bill using your live Jwandoon product catalogue.</p>
        </div>

        <button
          type="button"
          className="billing-refresh-button"
          onClick={() => loadProducts(true)}
          disabled={refreshing || savingSale}
        >
          <FiRefreshCw className={refreshing ? "spin" : ""} />

          {refreshing ? "Refreshing..." : "Refresh Stock"}
        </button>
      </div>

      {error && (
        <div className="billing-alert billing-alert-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <FiX />
          </button>
        </div>
      )}

      {success && (
        <div className="billing-alert billing-alert-success">
          <FiCheckCircle />
          <span>{success}</span>
        </div>
      )}

      {saleCompleted && (
        <div className="sale-completed-banner">
          <div>
            <FiCheckCircle />

            <div>
              <strong>Sale completed</strong>

              <span>
                {invoiceNumber} has been recorded and stock has been deducted.
              </span>
            </div>
          </div>

          <button type="button" onClick={startNewBill}>
            New Bill
          </button>
        </div>
      )}

      <section className="invoice-card">
        <header className="invoice-header">
          <div className="invoice-brand">
            <span>JWANDOON</span>
            <small>BUSINESS MANAGEMENT</small>
          </div>

          <div className="invoice-title">
            <span>INVOICE</span>
            <strong>{invoiceNumber}</strong>
            <small>{getFormattedDate()}</small>
          </div>
        </header>

        <section className="items-section">
          <div className="section-heading">
            <div>
              <span>PRODUCTS</span>

              <h2>Invoice Items</h2>
            </div>

            <div className="billing-actions-top">
              <button
                type="button"
                className="scan-button"
                onClick={() => {
                  setError("");
                  setScannerOpen(true);
                }}
                disabled={saleCompleted || loadingProducts}
              >
                <FiCamera />
                Scan Product
              </button>

              <button
                type="button"
                className="add-button"
                onClick={addItem}
                disabled={saleCompleted}
              >
                <FiPlus />
                Add Product
              </button>
            </div>
          </div>

          <div className="quick-entry-hint">
            <FiHash />

            <span>
              Type the product number and keep typing — the product will appear
              automatically.
            </span>
          </div>

          <div className="product-list">
            {items.map((item, index) => {
              const invoiceItem = invoiceItems[index];

              const product = invoiceItem?.product;

              const availableStock = Number(product?.stock_quantity || 0);

              return (
                <div
                  className={`product-row ${
                    product ? "product-row-filled" : ""
                  }`}
                  key={index}
                >
                  <div className="field product-number-field">
                    <label>Product #</label>

                    <div className="input-with-status">
                      <input
                        ref={(element) => {
                          productInputRefs.current[index] = element;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={item.productNo}
                        disabled={saleCompleted || loadingProducts}
                        onChange={(event) =>
                          handleProductNumberChange(index, event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleProductNumberKeyDown(event, index)
                        }
                        onBlur={() => handleProductNumberBlur(index)}
                        placeholder="ID"
                        aria-label={`Product number ${index + 1}`}
                      />

                      {product && (
                        <span className="input-success-dot">
                          <FiCheckCircle />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="product-preview">
                    {product ? (
                      <>
                        <div>
                          <strong>{product.name}</strong>

                          <span>{formatCurrency(product.selling_price)}</span>
                        </div>

                        <small>Stock available: {availableStock}</small>
                      </>
                    ) : (
                      <span className="empty-product">
                        Enter a product number
                      </span>
                    )}
                  </div>

                  <div className="field quantity-field">
                    <label>Quantity</label>

                    <input
                      ref={(element) => {
                        quantityInputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="off"
                      min="1"
                      max={availableStock || undefined}
                      value={item.quantity ?? ""}
                      disabled={saleCompleted || !product}
                      onFocus={handleQuantityFocus}
                      onChange={(event) =>
                        handleQuantityChange(index, event.target.value)
                      }
                      onBlur={() => normalizeQuantity(index)}
                      onKeyDown={(event) => handleQuantityKeyDown(event, index)}
                      aria-label={`Quantity for ${product?.name || "product"}`}
                    />

                    {product && (
                      <small className="quantity-stock">
                        Max {availableStock}
                      </small>
                    )}
                  </div>

                  <div className="line-total">
                    <span>Total</span>

                    <strong>{formatCurrency(invoiceItem?.total || 0)}</strong>
                  </div>

                  <button
                    type="button"
                    className="remove-item"
                    onClick={() => removeItem(index)}
                    disabled={saleCompleted}
                    aria-label="Remove product"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="billing-bottom">
          <div className="customer-fields">
            <div className="field">
              <label>
                <FiUser />
                Customer Name
              </label>

              <input
                type="text"
                value={buyerName}
                disabled={saleCompleted}
                onChange={(event) => setBuyerName(event.target.value)}
                placeholder="Walk-in Customer"
              />
            </div>

            <div className="field">
              <label>
                <FiUser />
                Printed By
              </label>

              <input type="text" value={printedBy} readOnly disabled />
            </div>
          </div>

          <div className="invoice-summary">
            <div>
              <span>Items</span>

              <strong>
                {validItems.reduce(
                  (sum, item) => sum + Number(item.quantity),
                  0,
                )}
              </strong>
            </div>

            <div>
              <span>Subtotal</span>

              <strong>{formatCurrency(subtotal)}</strong>
            </div>

            <div className="discount-row">
              <span>Discount</span>

              <div className="discount-input-wrapper">
                <span>Rs.</span>

                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={discount}
                  disabled={saleCompleted}
                  onChange={(event) => {
                    const value = event.target.value.replace(/\D/g, "");
                    setDiscount(value);
                  }}
                  placeholder="0"
                  aria-label="Discount amount"
                />
              </div>
            </div>

            {discountAmount > 0 && (
              <div className="discount-applied">
                <span>Discount Applied</span>

                <strong>- {formatCurrency(discountAmount)}</strong>
              </div>
            )}

            <div className="summary-total">
              <span>Total</span>

              <strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </div>
        </section>

        <footer className="invoice-actions">
          <button
            type="button"
            className="clear-button"
            onClick={clearInvoice}
            disabled={saleCompleted || savingSale}
          >
            Clear
          </button>

          <div>
            <button
              type="button"
              className="print-button"
              onClick={printInvoice}
              disabled={savingSale || loadingProducts}
            >
              <FiPrinter />

              {savingSale
                ? "Saving Sale..."
                : saleCompleted
                  ? "Print Bill"
                  : "Complete & Print"}
            </button>

            <button
              type="button"
              className="share-button"
              onClick={sharePDF}
              disabled={savingSale || loadingProducts}
            >
              <FiShare2 />

              {savingSale ? "Saving..." : "Share PDF"}
            </button>
          </div>
        </footer>
      </section>

      {scannerOpen && (
        <div className="scanner-overlay">
          <div className="scanner-modal">
            <header>
              <div>
                <span>JWANDOON SCANNER</span>

                <h2>Scan Product QR</h2>
              </div>

              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                aria-label="Close scanner"
              >
                <FiX />
              </button>
            </header>

            <div id="qr-reader" className="qr-reader" />

            <p>Point the camera at a Jwandoon product QR code.</p>
          </div>
        </div>
      )}

      <div className="print-invoice">
        <div className="print-header">
          <strong>JWANDOON</strong>

          <span>INVOICE</span>
        </div>

        <div className="print-meta">
          <div>
            <span>Invoice</span>

            <strong>{invoiceNumber}</strong>
          </div>

          <div>
            <span>Date</span>

            <strong>{getFormattedDate()}</strong>
          </div>

          <div>
            <span>Customer</span>

            <strong>{buyerName.trim() || "Walk-in Customer"}</strong>
          </div>

          <div>
            <span>Printed By</span>

            <strong>{printedBy}</strong>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>

              <th>Qty</th>

              <th>Price</th>

              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {validItems.map((item) => (
              <tr key={item.product.id}>
                <td>{item.product.name}</td>

                <td>{item.quantity}</td>

                <td>{formatCurrency(item.product.selling_price)}</td>

                <td>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-summary">
          <div>
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          {discountAmount > 0 && (
            <div className="print-discount">
              <span>Discount</span>
              <strong>- {formatCurrency(discountAmount)}</strong>
            </div>
          )}

          <div className="print-grand-total">
            <span>Total</span>
            <strong>{formatCurrency(grandTotal)}</strong>
          </div>
        </div>

        <p className="print-thank-you">Thank you for shopping with Jwandoon.</p>
      </div>
    </main>
  );
}
