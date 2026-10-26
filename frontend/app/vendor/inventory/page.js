
"use client";

import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function InventoryPage() {
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [operation, setOperation] = useState("add");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProductId(params.get("productId") || "");
  }, []);

  async function handleAdjustStock(event) {
    event.preventDefault();
    setMessage("");

    const token = localStorage.getItem("shopsense_token");
    const amount = Number(quantity);

    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    if (!productId) {
      setMessage("Product ID is missing. Open this page using Adjust Stock.");
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setMessage("Enter a positive whole number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/inventory/${productId}/adjust`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        body: JSON.stringify({
  quantity: amount,
  action: operation === "add" ? "restock" : "sale",
}),
        }
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof result?.detail === "string"
            ? result.detail
            : "Stock adjustment failed."
        );
      }

      setMessage("Stock adjustment successful!");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{
      maxWidth: "600px",
      margin: "50px auto",
      padding: "24px",
      fontFamily: "Arial, sans-serif",
    }}>
      <h1>Inventory Management</h1>
      <p>Increase or decrease a product's stock.</p>

      {message && (
        <p role="status" style={{
          padding: "12px",
          background: "#f3f0ff",
          borderRadius: "8px",
        }}>
          {message}
        </p>
      )}

      <form onSubmit={handleAdjustStock}>
        <label htmlFor="productId">Product ID</label>
        <input
          id="productId"
          value={productId}
          onChange={(event) => setProductId(event.target.value)}
          required
          style={inputStyle}
        />

        <label htmlFor="operation">Operation</label>
        <select
          id="operation"
          value={operation}
          onChange={(event) => setOperation(event.target.value)}
          style={inputStyle}
        >
          <option value="add">Increase stock</option>
          <option value="remove">Decrease stock</option>
        </select>

        <label htmlFor="quantity">Quantity</label>
        <input
          id="quantity"
          type="number"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 18px",
            background: "#7664e8",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "12px",
          }}
        >
          {loading ? "Updating..." : "Update Stock"}
        </button>
      </form>

      <p>
        <a href="/vendor">← Back to Vendor Dashboard</a>
      </p>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: "10px",
  margin: "8px 0 18px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
};
