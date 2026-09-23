import { importCatalogueProducts } from "../services/productImportService";

import { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

import {
  createProduct,
  getProducts,
  updateProduct,
} from "../services/productService";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-PK")}`;
}

const EMPTY_FORM = {
  id: "",
  name: "",
  category: "",
  cost_price: "",
  selling_price: "",
  minimum_stock: "5",
};

export default function Products() {
  const { profile } = useAuth();

  const canManageProducts =
    profile?.role === "OWNER" || profile?.role === "MANAGER";
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  async function handleImportCatalogue() {
    const confirmed = window.confirm(
      "Import all 131 catalogue products into Supabase?",
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const imported = await importCatalogueProducts();

      alert(`${imported.length} products imported successfully.`);

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(error?.message || "Unable to import catalogue.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const data = await getProducts({
        includeInactive: true,
      });

      setProducts(data);
    } catch (error) {
      console.error(error);
      setError(error?.message || "Unable to load products.");
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

  function openCreateModal() {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);

    setForm({
      id: product.id,
      name: product.name || "",
      category: product.category || "",
      cost_price: product.cost_price ?? "",
      selling_price: product.selling_price ?? "",
      minimum_stock: product.minimum_stock ?? 5,
    });

    setError("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (Number(form.selling_price) < 0) {
      setError("Selling price cannot be negative.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          name: form.name,
          category: form.category,
          cost_price: form.cost_price,
          selling_price: form.selling_price,
          minimum_stock: form.minimum_stock,
        });
      } else {
        if (!form.id || Number(form.id) <= 0) {
          setError("Enter a valid product number.");
          setSaving(false);
          return;
        }

        await createProduct({
          id: form.id,
          name: form.name,
          category: form.category,
          cost_price: form.cost_price,
          selling_price: form.selling_price,
          minimum_stock: form.minimum_stock,

          // Stock should be received through Inventory.
          stock_quantity: 0,
        });
      }

      closeModal();
      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(error?.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product) {
    const action = product.active ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${product.name}"?`,
    );

    if (!confirmed) return;

    try {
      await updateProduct(product.id, {
        active: !product.active,
      });

      await loadProducts();
    } catch (error) {
      console.error(error);
      setError(error?.message || "Unable to update product.");
    }
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <span className="page-eyebrow">PRODUCT CATALOGUE</span>
          <h1>Products</h1>
          <p>Manage your Jwandoon products, pricing and stock thresholds.</p>
        </div>

        <div className="products-header-actions">
          <button
            type="button"
            className="secondary-business-button"
            onClick={loadProducts}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>

          {products.length === 0 && !loading && (
            <button
              type="button"
              className="secondary-business-button"
              onClick={handleImportCatalogue}
            >
              <FiPackage />
              Import 131 Products
            </button>
          )}

          {canManageProducts && (
            <button
              type="button"
              className="primary-business-button"
              onClick={openCreateModal}
            >
              <FiPlus />
              Add Product
            </button>
          )}
        </div>
      </div>

      <section className="products-toolbar">
        <div className="products-count">
          <FiPackage />

          <div>
            <strong>{products.length}</strong>
            <span>Total products</span>
          </div>
        </div>

        <div className="products-search">
          <FiSearch />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search product number, name or category..."
          />
        </div>
      </section>

      {error && <div className="products-error">{error}</div>}

      <section className="products-panel">
        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product #</th>
                <th>Product</th>
                <th>Category</th>
                <th>Cost Price</th>
                <th>Selling Price</th>
                <th>Stock</th>
                <th>Min. Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="products-table-message">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="products-table-message">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const stock = Number(product.stock_quantity || 0);
                  const minimum = Number(product.minimum_stock || 0);

                  let stockStatus = "In Stock";

                  if (stock === 0) {
                    stockStatus = "Out of Stock";
                  } else if (stock <= minimum) {
                    stockStatus = "Low Stock";
                  }

                  return (
                    <tr key={product.id}>
                      <td>
                        <strong className="product-number">
                          #{product.id}
                        </strong>
                      </td>

                      <td>
                        <div className="product-name-cell">
                          <strong>{product.name}</strong>
                        </div>
                      </td>

                      <td>{product.category || "—"}</td>

                      <td>{formatCurrency(product.cost_price)}</td>

                      <td>
                        <strong>{formatCurrency(product.selling_price)}</strong>
                      </td>

                      <td>
                        <strong className="stock-number">{stock}</strong>
                      </td>

                      <td>{minimum}</td>

                      <td>
                        <span
                          className={`stock-status ${stockStatus
                            .toLowerCase()
                            .replaceAll(" ", "-")}`}
                        >
                          {stockStatus}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">
                          {canManageProducts && (
                            <button
                              type="button"
                              className="table-icon-button"
                              title="Edit product"
                              onClick={() => openEditModal(product)}
                            >
                              <FiEdit2 />
                            </button>
                          )}

                          <button
                            type="button"
                            className="table-text-button"
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="business-modal-overlay">
          <div className="business-modal product-modal">
            <div className="business-modal-header">
              <div>
                <span className="page-eyebrow">PRODUCT CATALOGUE</span>

                <h2>{editingProduct ? "Edit Product" : "Add Product"}</h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {!editingProduct && (
                <div className="business-form-group">
                  <label htmlFor="product-id">Product Number</label>

                  <input
                    id="product-id"
                    name="id"
                    type="number"
                    min="1"
                    value={form.id}
                    onChange={handleChange}
                    placeholder="e.g. 132"
                    required
                  />
                </div>
              )}

              <div className="business-form-group">
                <label htmlFor="product-name">Product Name</label>

                <input
                  id="product-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="business-form-group">
                <label htmlFor="product-category">Category</label>

                <input
                  id="product-category"
                  name="category"
                  type="text"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Electronics"
                />
              </div>

              <div className="business-form-row">
                <div className="business-form-group">
                  <label htmlFor="product-cost">Cost Price</label>

                  <input
                    id="product-cost"
                    name="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={handleChange}
                    placeholder="0"
                  />
                </div>

                <div className="business-form-group">
                  <label htmlFor="product-selling">Selling Price</label>

                  <input
                    id="product-selling"
                    name="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={handleChange}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="business-form-group">
                <label htmlFor="product-minimum">Minimum Stock Level</label>

                <input
                  id="product-minimum"
                  name="minimum_stock"
                  type="number"
                  min="0"
                  value={form.minimum_stock}
                  onChange={handleChange}
                  placeholder="5"
                />
              </div>

              {error && <p className="auth-error">{error}</p>}

              <div className="business-modal-actions">
                <button
                  type="button"
                  className="secondary-business-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-business-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
