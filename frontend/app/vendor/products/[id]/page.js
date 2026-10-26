
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    vendor_id: "",
    stock_quantity: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  // Load product details
  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadProduct() {
      const token = localStorage.getItem("shopsense_token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Use the working products list endpoint
        const response = await fetch(`${API}/products/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            typeof result?.detail === "string"
              ? result.detail
              : "Products load nahi hue."
          );
        }

        // API may return an array directly or inside an object
        const products = Array.isArray(result)
          ? result
          : result?.products || result?.data || [];

        const product = products.find(
          (item) => String(item._id || item.id) === String(id)
        );

        if (!product) {
          throw new Error(
            "Product nahi mila. Dashboard se Edit Product dobara open karo."
          );
        }

        if (cancelled) return;

        const vendorId =
          typeof product.vendor_id === "object" && product.vendor_id !== null
            ? String(
                product.vendor_id._id ||
                  product.vendor_id.id ||
                  ""
              )
            : String(product.vendor_id ?? "");

        setForm({
          name: product.name ?? "",
          description: product.description ?? "",
          price: product.price ?? "",
          category: product.category ?? "",
          vendor_id: vendorId,
          stock_quantity: product.stock_quantity ?? 0,
        });
      } catch (error) {
        if (!cancelled) {
          setMessage(error.message || "Product load karne mein error aaya.");
          setMessageType("error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // Save updated product
  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!form.vendor_id) {
      setMessage("Vendor ID missing hai. Product details dobara load karo.");
      setMessageType("error");
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock_quantity);

    if (!Number.isFinite(price) || price < 0) {
      setMessage("Price valid aur 0 ya usse zyada hona chahiye.");
      setMessageType("error");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setMessage("Stock quantity 0 ya usse zyada whole number honi chahiye.");
      setMessageType("error");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("shopsense_token");

      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API}/products/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          category: form.category.trim(),
          vendor_id: form.vendor_id,
          stock_quantity: stock,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = result?.detail;

        const errorMessage =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail
                  .map((item) => item.msg || JSON.stringify(item))
                  .join(", ")
              : JSON.stringify(detail || "Product update failed.");

        throw new Error(errorMessage);
      }

      setMessage("Product successfully updated!");
      setMessageType("success");

      setTimeout(() => {
        router.push("/vendor");
      }, 1200);
    } catch (error) {
      setMessage(error.message || "Product update nahi hua.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <p>Loading product...</p>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <button
          type="button"
          onClick={() => router.push("/vendor")}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>

        <h1 style={styles.heading}>Edit Product</h1>
        <p style={styles.subtitle}>
          Product details aur stock update karo.
        </p>

        {message && (
          <p
            role="status"
            style={{
              ...styles.message,
              ...(messageType === "success"
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label htmlFor="name" style={styles.label}>
              Product Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="description" style={styles.label}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="price" style={styles.label}>
              Price (₹)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="category" style={styles.label}>
              Category
            </label>
            <input
              id="category"
              name="category"
              type="text"
              value={form.category}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="stock_quantity" style={styles.label}>
              Stock Quantity
            </label>
            <input
              id="stock_quantity"
              name="stock_quantity"
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              ...styles.saveButton,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "40px 16px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },
  card: {
    maxWidth: "650px",
    margin: "0 auto",
    padding: "28px",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },
  backButton: {
    padding: "9px 14px",
    marginBottom: "18px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    background: "#ffffff",
    cursor: "pointer",
  },
  heading: {
    fontSize: "28px",
    margin: "0 0 8px",
    color: "#111827",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
  },
  field: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "7px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    display: "block",
    width: "100%",
    padding: "12px",
    border: "1px solid #d1d5db",
    borderRadius: "7px",
    boxSizing: "border-box",
    fontSize: "15px",
    background: "#ffffff",
    color: "#111827",
  },
  message: {
    padding: "12px",
    borderRadius: "7px",
    overflowWrap: "anywhere",
    marginBottom: "18px",
  },
  successMessage: {
    background: "#dcfce7",
    color: "#166534",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  saveButton: {
    width: "100%",
    padding: "13px",
    marginTop: "8px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "7px",
    fontSize: "15px",
    fontWeight: "700",
  },
};
