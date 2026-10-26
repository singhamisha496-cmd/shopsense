
"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function VendorDashboard() {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("shopsense_token");
    const savedUser = localStorage.getItem("shopsense_user");

    if (!token || !savedUser) {
      setMessage("Please log in to access the vendor dashboard.");
      setLoading(false);
      return;
    }

    try {
      const currentUser = JSON.parse(savedUser);

      if (currentUser.role !== "vendor") {
        setMessage("This page is only available to vendor accounts.");
        setLoading(false);
        return;
      }

      setUser(currentUser);
      loadProducts(token, currentUser);
    } catch {
      setMessage("Unable to read your account. Please log in again.");
      setLoading(false);
    }
  }, []);

  async function handleDeleteProduct(productId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("shopsense_token");

      if (!token) {
        alert("Please log in again.");
        return;
      }

      const response = await fetch(`${API}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.detail === "string"
            ? result.detail
            : "Product delete failed."
        );
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (product) =>
            String(product._id || product.id) !== String(productId)
        )
      );

      alert("Product deleted successfully!");
    } catch (error) {
      alert(error.message || "Something went wrong.");
    }
  }

  async function loadProducts(token, currentUser) {
    setLoading(true);
    setMessage("");

    try {
      // Fetch the logged-in vendor profile
      const vendorResponse = await fetch(`${API}/vendors/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const vendorData = await vendorResponse.json();

      if (!vendorResponse.ok) {
        throw new Error(
          vendorData.detail || "Could not load your vendor profile."
        );
      }

      const vendorId = vendorData._id || vendorData.id;

      if (!vendorId) {
        throw new Error("Vendor profile ID was not returned by the server.");
      }

      setVendor(vendorData);

      // Fetch products
      const response = await fetch(`${API}/products/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Could not load products.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected products response from the server.");
      }

      // Keep only products belonging to this vendor
      const myProducts = data.filter(
        (product) => String(product.vendor_id) === String(vendorId)
      );

      setUser({
        ...currentUser,
        vendor_id: vendorId,
      });

      setProducts(myProducts);
    } catch (error) {
      setProducts([]);
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    const token = localStorage.getItem("shopsense_token");

    if (token && user) {
      loadProducts(token, user);
    } else {
      setMessage("Please log in again to continue.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("shopsense_token");
    localStorage.removeItem("shopsense_user");
    window.location.href = "/login";
  }

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity ?? product.stock ?? 0),
    0
  );

  const lowStock = products.filter(
    (product) =>
      Number(product.stock_quantity ?? product.stock ?? 0) <= 5
  ).length;
const outOfStock = products.filter(
  (product) =>
    Number(product.stock_quantity ?? product.stock ?? 0) === 0
).length;

const lowStockProducts = products.filter((product) => {
  const stock = Number(
    product.stock_quantity ?? product.stock ?? 0
  );

  return stock > 0 && stock <= 5;
});
  const activeProducts = products.filter(
    (product) => product.status === "active"
  ).length;

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(price) || 0);

  return (
    <main className="dashboard">
      <header className="topbar">
        <a href="/vendor" className="brand">
          Shop<span>Sense</span>
        </a>

        <div className="top-actions">
          <span className="role-label">Vendor Portal</span>
          <button className="logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">VENDOR WORKSPACE</p>
          <h1>Welcome{user?.name ? `, ${user.name}` : " back"}!</h1>
          <p>Manage your products and keep track of your inventory.</p>
          {vendor?.business_name && (
            <p className="business-name">
              Business: <strong>{vendor.business_name}</strong>
            </p>
          )}
        </div>

        <button
          className="refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </section>

      {message && (
        <div className="message" role="alert">
          {message}
        </div>
      )}

      <section className="stats">
        <article className="stat-card">
          <span>Total Products</span>
          <strong>{loading ? "—" : totalProducts}</strong>
          <small>Products linked to your vendor profile</small>
        </article>

        <article className="stat-card">
          <span>Total Stock Units</span>
          <strong>{loading ? "—" : totalStock}</strong>
          <small>Units currently listed in inventory</small>
        </article>

        <article className="stat-card">
          <span>Low Stock</span>
          <strong>{loading ? "—" : lowStock}</strong>
          <small>Products with 5 or fewer units</small>
        </article>
<article className="stat-card">
  <span>Out of Stock</span>
  <strong>{loading ? "—" : outOfStock}</strong>
  <small>Products with zero units remaining</small>
</article>
        <article className="stat-card">
          <span>Active Products</span>
          <strong>{loading ? "—" : activeProducts}</strong>
          <small>Products marked active</small>
        </article>
      </section>
{!loading && lowStockProducts.length > 0 && (
  <section className="products-panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">INVENTORY ALERT</p>
        <h2>⚠️ Low Stock Warning</h2>
      </div>
    </div>

    {lowStockProducts.map((product) => (
      <div
        key={product._id || product.id}
        style={{
          padding: "12px",
          marginBottom: "10px",
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "8px",
          color: "#9a3412",
        }}
      >
        <strong>{product.name || product.title}</strong>
        {" — "}
        Only {Number(
          product.stock_quantity ?? product.stock ?? 0
        )} units remaining.
      </div>
    ))}
  </section>
)}
      <section className="products-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">INVENTORY</p>
            <h2>My Products</h2>
          </div>

          <a className="add-product" href="/vendor/products/new">
            + Add Product
          </a>
        </div>

        {loading ? (
          <p className="empty">Loading your products...</p>
        ) : products.length === 0 ? (
          <div className="empty">
            <h3>No products to display</h3>
            <p>
              No products are currently linked to this vendor profile.
              You can refresh the dashboard or add a product.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const stock = Number(
                    product.stock_quantity ?? product.stock ?? 0
                  );

                  return (
                    <tr key={product._id || product.id}>
                      <td>
                        <strong>{product.name || product.title}</strong>
                        <small className="description">
                          {product.description || "No description"}
                        </small>
                      </td>

                      <td>{product.category || "—"}</td>
                      <td>{formatPrice(product.price)}</td>
<td>
  <span className={stock <= 5 ? "stock low" : "stock"}>
    {stock}
  </span>

  <div style={{ marginTop: "8px" }}>
    <button
      type="button"
      onClick={() =>
        window.location.href = `/vendor/inventory?productId=${product._id || product.id}`
      }
      style={{
        padding: "6px 10px",
        background: "#7664e8",
        color: "white",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "12px",
      }}
    >
      Adjust Stock
    </button>
  </div>
</td>
                      <td>
                        <span className="status">
                          {product.status || "Unknown"}
                        </span>
                      </td>


<td>
  <div className="product-actions">
    <a
      href={`/vendor/products/${product._id || product.id}`}
      className="edit-product"
    >
      Edit
    </a>
    <button
      type="button"
      onClick={() =>
        handleDeleteProduct(product._id || product.id)
      }
      className="delete-product"
    >
      Delete
    </button>
  </div>
</td>



                    </tr>

                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <footer>ShopSense Vendor Portal · Inventory overview</footer>

      <style jsx>{`
      .edit-product {
  display: inline-block;
  padding: 8px 12px;
  background: #7664e8;
  color: white;
  border-radius: 7px;
  text-decoration: none;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.edit-product:hover {
  background: #5b4bc4;
}
        * {
          box-sizing: border-box;
        }

        .dashboard {
          min-height: 100vh;
          background: #f6f7fb;
          color: #20243a;
          font-family: Arial, sans-serif;
        }

        .topbar {
          min-height: 76px;
          padding: 16px 6%;
          background: white;
          border-bottom: 1px solid #e8eaf1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }

        .brand {
          color: #242843;
          font-size: 25px;
          font-weight: 800;
          text-decoration: none;
        }

        .brand span {
          color: #7664e8;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .role-label {
          color: #666b80;
          font-size: 14px;
        }

        .logout,
        .refresh,
        .add-product {
          border: 0;
          border-radius: 9px;
          padding: 11px 16px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          font-size: 14px;
        }

        .logout {
          background: #f0edff;
          color: #5b4bc4;
        }

        .welcome {
          padding: 36px 6% 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .eyebrow {
          margin: 0 0 9px;
          color: #7664e8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        h1 {
          margin: 0;
          font-size: clamp(27px, 4vw, 36px);
        }

        .welcome p:not(.eyebrow) {
          color: #70758a;
          margin: 10px 0 0;
          line-height: 1.6;
        }

        .business-name strong {
          color: #292d45;
        }

        .refresh {
          background: #7664e8;
          color: white;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .stats {
          padding: 0 6% 28px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
        }

        .stat-card {
          background: white;
          border: 1px solid #eaebf2;
          border-radius: 15px;
          padding: 22px;
          box-shadow: 0 4px 15px #22224405;
        }

        .stat-card span,
        .stat-card small {
          display: block;
          color: #777b8d;
        }

        .stat-card strong {
          display: block;
          margin: 15px 0 10px;
          font-size: 30px;
        }

        .stat-card small {
          font-size: 12px;
          line-height: 1.5;
        }

        .products-panel {
          margin: 0 6% 36px;
          padding: 24px;
          background: white;
          border: 1px solid #eaebf2;
          border-radius: 15px;
        }

        .panel-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }

        h2 {
          margin: 0;
          font-size: 23px;
        }

        .add-product {
          background: #7664e8;
          color: white;
        }

        .message {
          margin: 0 6% 24px;
          padding: 14px 16px;
          border-radius: 10px;
          background: #fff0f0;
          color: #a12626;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .empty {
          padding: 32px 12px;
          text-align: center;
          color: #777b8d;
          line-height: 1.6;
        }

        .empty h3 {
          color: #292d45;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          min-width: 650px;
        }

        th,
        td {
          padding: 15px 12px;
          border-bottom: 1px solid #eef0f5;
          font-size: 14px;
        }

        th {
          color: #777b8d;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        td strong,
        .description {
          display: block;
        }

        .description {
          max-width: 230px;
          margin-top: 6px;
          color: #8a8ea0;
          font-size: 12px;
        }

        .stock,
        .status {
          display: inline-block;
          border-radius: 20px;
          padding: 6px 10px;
          background: #e7f8ed;
          color: #207748;
          font-size: 12px;
          font-weight: 700;
        }

        .stock.low {
          background: #fff0e5;
          color: #a95012;
        }

        footer {
          padding: 22px 6%;
          color: #8a8ea0;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 850px) {
          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .topbar,
          .welcome {
            align-items: flex-start;
            flex-direction: column;
          }

          .top-actions {
            width: 100%;
            justify-content: space-between;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .products-panel {
            padding: 16px;
          }

          .panel-heading {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
