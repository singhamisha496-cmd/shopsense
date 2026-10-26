
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock_quantity: "0",
};

export default function AddProductPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [token, setToken] = useState("");
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadVendor() {
      const savedToken = localStorage.getItem("shopsense_token");
      const savedUser = localStorage.getItem("shopsense_user");

      if (!savedToken || !savedUser) {
        setError("Please log in before adding a product.");
        setLoading(false);
        return;
      }

      try {
        const user = JSON.parse(savedUser);

        if (user.role !== "vendor") {
          setError("Only vendor accounts can add products.");
          setLoading(false);
          return;
        }

        setToken(savedToken);

        const response = await fetch(`${API}/vendors/me`, {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load your vendor profile."
          );
        }

        const vendorId = data._id || data.id;

        if (!vendorId) {
          throw new Error("Your vendor profile ID is missing.");
        }

        setVendor({
          ...data,
          _id: vendorId,
        });
      } catch (err) {
        setError(err.message || "Could not load your vendor profile.");
      } finally {
        setLoading(false);
      }
    }

    loadVendor();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!token || !vendor?._id) {
      setError("Your vendor profile is not ready. Please log in again.");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock_quantity);

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Product name must contain at least 2 characters.");
      return;
    }

    if (!form.category.trim() || form.category.trim().length < 2) {
      setError("Category must contain at least 2 characters.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock quantity must be a whole number of zero or more.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price,
        category: form.category.trim(),
        vendor_id: vendor._id,
        stock_quantity: stock,
      };

      const response = await fetch(`${API}/products/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const detail = data.detail;
        const errorText = Array.isArray(detail)
          ? detail.map((item) => item.msg).join(", ")
          : typeof detail === "string"
            ? detail
            : "Could not save the product.";

        throw new Error(errorText);
      }

      setSuccess("Product added successfully!");

      setTimeout(() => {
        router.push("/vendor");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err.message || "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="loading-card">Loading your vendor profile...</div>
        <style jsx>{`
          .page {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #f6f7fb;
            font-family: Arial, sans-serif;
          }
          .loading-card {
            padding: 28px;
            background: white;
            border-radius: 14px;
            color: #555b70;
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <a href="/vendor" className="brand">
          Shop<span>Sense</span>
        </a>

        <a href="/vendor" className="back-link">
          ← Back to Dashboard
        </a>
      </header>

      <section className="content">
        <div className="heading">
          <p className="eyebrow">VENDOR WORKSPACE</p>
          <h1>Add New Product</h1>
          <p className="subtitle">
            Enter your product details to add it to your store inventory.
          </p>
        </div>

        {vendor && (
          <div className="vendor-info">
            <span className="vendor-dot" />
            Adding product for{" "}
            <strong>{vendor.business_name || vendor.name || "Your store"}</strong>
          </div>
        )}

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert success" role="status">
            {success} Redirecting to your dashboard...
          </div>
        )}

        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-heading">
            <div>
              <h2>Product Information</h2>
              <p>Fields marked * are required.</p>
            </div>
            <span className="form-icon">＋</span>
          </div>

          <div className="field">
            <label htmlFor="name">Product Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="e.g. Wireless Headphones"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={150}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe your product, features and benefits..."
              value={form.description}
              onChange={handleChange}
              rows={4}
            />
            <small>Provide useful details for customers.</small>
          </div>

          <div className="two-columns">
            <div className="field">
              <label htmlFor="price">Price (₹) *</label>
              <input
                id="price"
                name="price"
                type="number"
                placeholder="e.g. 2499"
                value={form.price}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="category">Category *</label>
              <input
                id="category"
                name="category"
                type="text"
                placeholder="e.g. Electronics"
                value={form.category}
                onChange={handleChange}
                minLength={2}
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="stock_quantity">Initial Stock Quantity *</label>
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={handleChange}
              required
            />
            <small>Enter 0 if the product is currently out of stock.</small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => router.push("/vendor")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="submit-button"
              disabled={saving || !vendor}
            >
              {saving ? "Saving Product..." : "＋ Add Product"}
            </button>
          </div>
        </form>

        <p className="security-note">
          Your product will be associated with your authenticated vendor
          profile.
        </p>
      </section>

      <footer>ShopSense Vendor Portal · Product Management</footer>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
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
          align-items: center;
          justify-content: space-between;
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

        .back-link {
          color: #6554d4;
          font-weight: 700;
          font-size: 14px;
          text-decoration: none;
        }

        .content {
          width: min(760px, 90%);
          margin: 0 auto;
          padding: 42px 0 30px;
        }

        .heading {
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #7664e8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        h1 {
          margin: 0;
          font-size: clamp(28px, 4vw, 36px);
        }

        .subtitle {
          color: #70758a;
          margin: 12px 0 0;
          line-height: 1.6;
        }

        .vendor-info {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 7px;
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid #e8e4ff;
          border-radius: 10px;
          background: #f0edff;
          color: #5c51a5;
          font-size: 14px;
        }

        .vendor-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #7664e8;
        }

        .form-card {
          padding: 28px;
          border: 1px solid #e8eaf1;
          border-radius: 16px;
          background: white;
          box-shadow: 0 8px 30px #22224408;
        }

        .form-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eef0f5;
        }

        .form-heading h2 {
          margin: 0;
          font-size: 21px;
        }

        .form-heading p {
          margin: 7px 0 0;
          color: #81869a;
          font-size: 13px;
        }

        .form-icon {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #f0edff;
          color: #7664e8;
          font-size: 26px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 22px;
        }

        .field label {
          color: #30344d;
          font-size: 14px;
          font-weight: 700;
        }

        .field input,
        .field textarea {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #dfe2ec;
          border-radius: 9px;
          background: white;
          color: #20243a;
          font: inherit;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #7664e8;
          box-shadow: 0 0 0 3px #7664e81c;
        }

        .field textarea {
          resize: vertical;
          min-height: 100px;
        }

        .field small {
          color: #81869a;
          font-size: 12px;
        }

        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 8px;
        }

        .cancel-button,
        .submit-button {
          padding: 13px 18px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .cancel-button {
          background: white;
          border: 1px solid #dfe2ec;
          color: #565b70;
        }

        .submit-button {
          background: #7664e8;
          border: 1px solid #7664e8;
          color: white;
        }

        .cancel-button:disabled,
        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .alert {
          margin-bottom: 18px;
          padding: 14px 16px;
          border-radius: 10px;
          font-size: 14px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .error {
          background: #fff0f0;
          border: 1px solid #ffd6d6;
          color: #a12626;
        }

        .success {
          background: #eaf9ef;
          border: 1px solid #c8eed4;
          color: #207748;
        }

        .security-note {
          margin: 18px 0 0;
          text-align: center;
          color: #81869a;
          font-size: 12px;
          line-height: 1.6;
        }

        footer {
          padding: 22px 6%;
          color: #8a8ea0;
          text-align: center;
          font-size: 12px;
        }

        @media (max-width: 600px) {
          .content {
            width: 92%;
            padding-top: 28px;
          }

          .form-card {
            padding: 20px;
          }

          .two-columns {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .cancel-button,
          .submit-button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
