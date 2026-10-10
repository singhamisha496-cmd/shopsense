
"use client";

import { useCallback, useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Vendors", icon: "♙" },
  { name: "Products", icon: "▣" },
  { name: "Inventory", icon: "▤" },
  { name: "Transactions", icon: "↔" },
  { name: "Analytics", icon: "▥" },
];

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

export default function Home() {
  const [active, setActive] = useState("Dashboard");
  const [period, setPeriod] = useState("This week");

  const [summary, setSummary] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setApiError("");

    try {
      const endpoints = [
        ["summary", `${API}/analytics/sales-summary`],
        ["vendors", `${API}/vendors/`],
        ["products", `${API}/products/`],
        ["inventory", `${API}/inventory/`],
        ["transactions", `${API}/transactions/`],
      ];

      const responses = await Promise.all(
        endpoints.map(async ([key, url]) => {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`${key} API returned ${response.status}`);
          }
          return [key, await response.json()];
        })
      );

      const data = Object.fromEntries(responses);

      setSummary(data.summary);
      setVendors(Array.isArray(data.vendors) ? data.vendors : []);
      setProducts(Array.isArray(data.products) ? data.products : []);
      setInventory(Array.isArray(data.inventory) ? data.inventory : []);
      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (error) {
      console.error("Dashboard API error:", error);
      setApiError(
        "Unable to load live data. Check that the FastAPI backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const activeVendors = vendors.filter(
    (vendor) => (vendor.status || "active") === "active"
  ).length;

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock_quantity || 0),
    0
  );

  const lowStock = inventory.filter(
    (item) => item.stock_status === "Low Stock" ||
      item.stock_status === "Out of Stock"
  ).length;

  const stats = [
    {
      label: "Total Revenue",
      value: loading && !summary
        ? "Loading..."
        : formatMoney(summary?.total_revenue),
      icon: "₹",
      tone: "#EEF2FF",
      ink: "#4F46E5",
      description: "From recorded sales",
    },
    {
      label: "Total Orders",
      value: loading && !summary
        ? "Loading..."
        : Number(summary?.total_transactions || 0).toLocaleString("en-IN"),
      icon: "↗",
      tone: "#DCFCE7",
      ink: "#15803D",
      description: "Recorded transactions",
    },
    {
      label: "Active Vendors",
      value: loading && vendors.length === 0
        ? "Loading..."
        : activeVendors.toLocaleString("en-IN"),
      icon: "♙",
      tone: "#F3E8FF",
      ink: "#7E22CE",
      description: "Registered vendors",
    },
    {
      label: "Total Products",
      value: loading && products.length === 0
        ? "Loading..."
        : products.length.toLocaleString("en-IN"),
      icon: "▣",
      tone: "#FEF3C7",
      ink: "#B45309",
      description: `${totalStock.toLocaleString("en-IN")} units in stock`,
    },
  ];

  const recentTransactions = [...transactions]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, 5);

  const getProductName = (transaction) => {
    const product = products.find(
      (item) => item._id === transaction.product_id
    );
    return product?.name || "Product";
  };

  const getVendorName = (vendorId) => {
    const vendor = vendors.find((item) => item._id === vendorId);
    return vendor?.business_name || vendor?.name || "Vendor";
  };

  const navTo = (name) => setActive(name);

const [stockProductId, setStockProductId] = useState("");
const [stockChange, setStockChange] = useState("");
const [stockMessage, setStockMessage] = useState("");
const [stockSaving, setStockSaving] = useState(false);

const updateStock = async (event) => {
  event.preventDefault();
  setStockSaving(true);
  setStockMessage("");

  try {
    const response = await fetch(
      `${API}/inventory/${stockProductId}/adjust`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity_change: Number(stockChange),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail || "Unable to update stock.")
      );
    }

    setStockMessage("Stock updated successfully!");
    setStockChange("");
    await loadDashboard();
  } catch (error) {
    setStockMessage(error.message);
  } finally {
    setStockSaving(false);
  }
};

const [showProductForm, setShowProductForm] = useState(false);
const [productName, setProductName] = useState("");
const [productDescription, setProductDescription] = useState("");
const [productPrice, setProductPrice] = useState("");
const [productCategory, setProductCategory] = useState("");
const [productVendor, setProductVendor] = useState("");
const [productStock, setProductStock] = useState("");
const [productMessage, setProductMessage] = useState("");
const [productSaving, setProductSaving] = useState(false);

const addProduct = async (event) => {
  event.preventDefault();
  setProductSaving(true);
  setProductMessage("");

  try {
    const response = await fetch(`${API}/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: productName,
        description: productDescription,
        price: Number(productPrice),
        category: productCategory,
        vendor_id: productVendor,
        stock_quantity: Number(productStock),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data.detail === "string"
          ? data.detail
          : JSON.stringify(data.detail || "Unable to add product.")
      );
    }

    setProductMessage("Product added successfully!");
    setProductName("");
    setProductDescription("");
    setProductPrice("");
    setProductCategory("");
    setProductVendor("");
    setProductStock("");

    await loadDashboard();
  } catch (error) {
    setProductMessage(error.message);
  } finally {
    setProductSaving(false);
  }
};

const [showVendorForm, setShowVendorForm] = useState(false);
const [vendorName, setVendorName] = useState("");
const [vendorEmail, setVendorEmail] = useState("");
const [vendorBusiness, setVendorBusiness] = useState("");
const [vendorAddress, setVendorAddress] = useState("");
const [vendorMessage, setVendorMessage] = useState("");
const [vendorSaving, setVendorSaving] = useState(false);

const addVendor = async (event) => {
  event.preventDefault();
  setVendorSaving(true);
  setVendorMessage("");

  try {
    const response = await fetch(`${API}/vendors/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: vendorName,
        email: vendorEmail,
        business_name: vendorBusiness,
        address: vendorAddress,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.detail || "Unable to add vendor."
      );
    }

    setVendorMessage("Vendor added successfully!");
    setVendorName("");
    setVendorEmail("");
    setVendorBusiness("");
    setVendorAddress("");
    await loadDashboard();
  } catch (error) {
    setVendorMessage(error.message);
  } finally {
    setVendorSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-slate-800 md:flex">
      <aside className="flex w-full flex-col bg-[#151B32] text-white md:fixed md:inset-y-0 md:w-[245px]">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-2xl font-bold shadow-lg shadow-indigo-500/30">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ShopSense</h1>
            <p className="text-xs text-slate-400">Commerce intelligence</p>
          </div>
        </div>

        <div className="px-4 pt-7">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[2px] text-slate-500">
            Workspace
          </p>
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {menuItems.map((item) => (
              <button
                key={item.name}
                onClick={() => navTo(item.name)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  active === item.name
                    ? "bg-indigo-500 text-white shadow-lg shadow-indigo-950/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">{item.icon}</span>
                {item.name}
                {item.name === "Inventory" && lowStock > 0 && (
                  <span className="ml-auto rounded-md bg-amber-400/15 px-2 py-0.5 text-xs text-amber-300">
                    {lowStock}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto hidden p-4 md:block">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-medium text-slate-300">
                {apiError ? "Connection issue" : "ShopSense API"}
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              {apiError ? "Backend connection needs attention." : "Marketplace overview and inventory monitoring."}
            </p>
            <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-400/20 font-semibold text-indigo-200">
                AS
              </div>
              <div>
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-slate-400">Marketplace manager</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 md:ml-[245px] md:p-9">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-500">
              Workspace / {active}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {active === "Dashboard" ? "Good morning, Admin 👋" : active}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Your marketplace performance, powered by live data.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-700">
              AS
            </div>
          </div>
        </header>

        {apiError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {apiError}
            <button
              onClick={loadDashboard}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

{active === "Vendors" && (
  <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Vendor Management
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Manage your marketplace vendors.
        </p>
      </div>
      <button
        onClick={() => {
          setShowVendorForm(!showVendorForm);
          setVendorMessage("");
        }}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {showVendorForm ? "Cancel" : "+ Add Vendor"}
      </button>
    </div>

    {showVendorForm && (
      <form
        onSubmit={addVendor}
        className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
      >
        <input
          required
          value={vendorName}
          onChange={(e) => setVendorName(e.target.value)}
          placeholder="Vendor full name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          type="email"
          value={vendorEmail}
          onChange={(e) => setVendorEmail(e.target.value)}
          placeholder="Email address"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          value={vendorBusiness}
          onChange={(e) => setVendorBusiness(e.target.value)}
          placeholder="Business name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          value={vendorAddress}
          onChange={(e) => setVendorAddress(e.target.value)}
          placeholder="Business address"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <button
          type="submit"
          disabled={vendorSaving}
          className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {vendorSaving ? "Saving..." : "Save Vendor"}
        </button>
        {vendorMessage && (
          <p className="text-sm sm:col-span-2">
            {vendorMessage}
          </p>
        )}
      </form>
    )}

    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Vendor</th>
            <th className="px-4 py-3">Business</th>
            <th className="px-4 py-3">Address</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor._id} className="border-t border-slate-100">
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-800">
                  {vendor.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {vendor.email}
                </p>
              </td>
              <td className="px-4 py-4">
                {vendor.business_name || "—"}
              </td>
              <td className="px-4 py-4">
                {vendor.address || "—"}
              </td>
              <td className="px-4 py-4">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {vendor.status || "active"}
                </span>
              </td>
            </tr>
          ))}
          {!loading && vendors.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No vendors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}

{active === "Products" && (
  <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Product Management
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Add and manage marketplace products.
        </p>
      </div>
      <button
        onClick={() => {
          setShowProductForm(!showProductForm);
          setProductMessage("");
        }}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        {showProductForm ? "Cancel" : "+ Add Product"}
      </button>
    </div>

    {showProductForm && (
      <form
        onSubmit={addProduct}
        className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"
      >
        <input
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Product name"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          value={productCategory}
          onChange={(e) => setProductCategory(e.target.value)}
          placeholder="Category (e.g. Electronics)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={productPrice}
          onChange={(e) => setProductPrice(e.target.value)}
          placeholder="Price (₹)"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <input
          required
          type="number"
          min="0"
          step="1"
          value={productStock}
          onChange={(e) => setProductStock(e.target.value)}
          placeholder="Stock quantity"
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
        />
        <select
          required
          value={productVendor}
          onChange={(e) => setProductVendor(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm sm:col-span-2"
        >
          <option value="">Select vendor</option>
          {vendors.map((vendor) => (
            <option key={vendor._id} value={vendor._id}>
              {vendor.business_name || vendor.name} ({vendor.email})
            </option>
          ))}
        </select>
        <textarea
          required
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Product description"
          rows={3}
          className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          disabled={productSaving || vendors.length === 0}
          className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
        >
          {productSaving
            ? "Saving..."
            : vendors.length === 0
              ? "Add a vendor first"
              : "Save Product"}
        </button>
        {productMessage && (
          <p className="text-sm sm:col-span-2">{productMessage}</p>
        )}
      </form>
    )}

    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product._id} className="border-t border-slate-100">
              <td className="px-4 py-4">
                <p className="font-semibold text-slate-800">
                  {product.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {product.description}
                </p>
              </td>
              <td className="px-4 py-4">{product.category || "—"}</td>
              <td className="px-4 py-4 font-semibold">
                {formatMoney(product.price)}
              </td>
              <td className="px-4 py-4">{product.stock_quantity ?? 0}</td>
            </tr>
          ))}
          {!loading && products.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}
{active === "Inventory" && (
  <section className="mb-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
    <div className="mb-5">
      <h3 className="text-lg font-bold text-slate-900">
        Inventory Management
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Monitor product stock and adjust quantities.
      </p>
    </div>

    <form
      onSubmit={updateStock}
      className="mb-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"
    >
      <select
        required
        value={stockProductId}
        onChange={(e) => setStockProductId(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
      >
        <option value="">Select product</option>
        {products.map((product) => (
          <option key={product._id} value={product._id}>
            {product.name} — Stock: {product.stock_quantity ?? 0}
          </option>
        ))}
      </select>

      <input
        required
        type="number"
        step="1"
        value={stockChange}
        onChange={(e) => setStockChange(e.target.value)}
        placeholder="Quantity change (+5 or -2)"
        className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
      />

      <button
        type="submit"
        disabled={stockSaving || products.length === 0}
        className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {stockSaving ? "Updating..." : "Update Stock"}
      </button>

      {stockMessage && (
        <p className="text-sm sm:col-span-3">{stockMessage}</p>
      )}
    </form>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Current Stock</th>
            <th className="px-4 py-3">Stock Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const quantity = Number(product.stock_quantity || 0);
            const status =
              quantity === 0
                ? "Out of Stock"
                : quantity <= 10
                  ? "Low Stock"
                  : "In Stock";

            return (
              <tr key={product._id} className="border-t border-slate-100">
                <td className="px-4 py-4 font-semibold text-slate-800">
                  {product.name}
                </td>
                <td className="px-4 py-4">{product.category || "—"}</td>
                <td className="px-4 py-4 font-semibold">{quantity}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      quantity === 0
                        ? "bg-red-50 text-red-700"
                        : quantity <= 10
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {status}
                  </span>
                </td>
              </tr>
            );
          })}

          {!loading && products.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                No products available. Add a product first.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}


        {active !== "Dashboard" && (
          <div className="mb-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
            <strong>{active}</strong> section selected.
            {active === "Vendors" && ` ${vendors.length} vendors registered.`}
            {active === "Products" && ` ${products.length} products listed.`}
            {active === "Inventory" && ` ${totalStock} total units; ${lowStock} low/out-of-stock products.`}
            {active === "Transactions" && ` ${transactions.length} transactions recorded.`}
            {active === "Analytics" && ` Revenue: ${formatMoney(summary?.total_revenue)}; units sold: ${summary?.total_units_sold || 0}.`}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold"
                  style={{ background: stat.tone, color: stat.ink }}
                >
                  {stat.icon}
                </div>
              </div>
              <h3 className="mt-4 break-words text-2xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </h3>
              <p className="mt-3 text-xs text-slate-500">{stat.description}</p>
              <span className="mt-2 inline-block rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                Live data
              </span>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sales overview</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Units sold and sales activity
                </p>
              </div>
              <select
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400"
              >
                <option>This week</option>
                <option>This month</option>
                <option>This year</option>
              </select>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-indigo-50 p-4">
                <p className="text-sm text-slate-500">Total units sold</p>
                <p className="mt-2 text-2xl font-bold text-indigo-700">
                  {summary?.total_units_sold ?? (loading ? "…" : 0)}
                </p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="mt-2 break-words text-xl font-bold text-emerald-700">
                  {formatMoney(summary?.total_revenue)}
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="mt-2 text-2xl font-bold text-violet-700">
                  {summary?.total_transactions ?? (loading ? "…" : 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-4 text-sm leading-6 text-slate-500">
              This summary reflects recorded transactions in your database.
              A daily/weekly sales chart will require a date-grouped analytics endpoint.
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">Marketplace health</h3>
            <p className="mt-1 text-sm text-slate-500">Live inventory snapshot</p>

            <div className="mt-7 space-y-6">
              {[
                {
                  label: "Active vendors",
                  value: activeVendors,
                  percent: vendors.length
                    ? Math.min(100, (activeVendors / vendors.length) * 100)
                    : 0,
                  color: "bg-indigo-500",
                },
                {
                  label: "Products listed",
                  value: products.length,
                  percent: products.length ? 100 : 0,
                  color: "bg-emerald-500",
                },
                {
                  label: "Units in stock",
                  value: totalStock,
                  percent: totalStock ? 100 : 0,
                  color: "bg-violet-500",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-slate-800">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-900">
                Inventory insight ✨
              </p>
              <p className="mt-1 text-xs leading-5 text-indigo-700">
                {lowStock
                  ? `${lowStock} products need a stock check.`
                  : "Keep monitoring inventory to maintain smooth operations."}
              </p>
              <button
                onClick={() => setActive("Inventory")}
                className="mt-3 text-xs font-semibold text-indigo-700 hover:underline"
              >
                View inventory →
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Recent transactions</h3>
              <p className="mt-1 text-sm text-slate-500">
                Latest transactions stored in MongoDB
              </p>
            </div>
            <button
              onClick={() => setActive("Transactions")}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
            >
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Transaction ID</th>
                  <th className="px-6 py-4 font-semibold">Product</th>
                  <th className="px-6 py-4 font-semibold">Vendor</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((transaction) => (
                  <tr
                    key={transaction._id}
                    className="border-t border-slate-100 transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4 font-semibold text-indigo-600">
                      {transaction._id
                        ? `#${transaction._id.slice(-6).toUpperCase()}`
                        : "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {getProductName(transaction)}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {getVendorName(transaction.vendor_id)}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {formatMoney(transaction.total_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        {transaction.payment_status || "Recorded"}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && recentTransactions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      No transactions recorded yet.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Loading transactions…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
            Data is fetched from your ShopSense backend.
          </div>
        </section>

        <footer className="py-7 text-center text-xs text-slate-500">
          © 2026 ShopSense · Multi-Vendor Commerce Analytics
        </footer>
      </main>
    </div>
  );
}
