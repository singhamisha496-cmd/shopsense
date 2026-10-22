
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API = "http://127.0.0.1:8000";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      
const response = await fetch(`${API}/auth/login`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email, password }),
});
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed.");
      }

      localStorage.setItem("shopsense_token", data.access_token);
      localStorage.setItem("shopsense_user", JSON.stringify(data.user));

      router.push("/");
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#f3f4f6",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "36px",
          background: "#ffffff",
          borderRadius: "18px",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.08)",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#111827",
            margin: "0 0 10px",
          }}
        >
          ShopSense
        </h1>

        <p
          style={{
            color: "#4b5563",
            fontSize: "17px",
            marginBottom: "30px",
          }}
        >
          Sign in to your account
        </p>

        <label
          htmlFor="email"
          style={{
            display: "block",
            color: "#374151",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Email address
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          autoComplete="email"
          placeholder="Enter your email"
          style={inputStyle}
        />

        <label
          htmlFor="password"
          style={{
            display: "block",
            color: "#374151",
            fontWeight: "600",
            fontSize: "15px",
          }}
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          autoComplete="current-password"
          placeholder="Enter your password"
          style={inputStyle}
        />

        {error && (
          <p
            role="alert"
            style={{
              color: "#b91c1c",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            marginTop: "24px",
            padding: "14px",
            border: "none",
            borderRadius: "9px",
            background: loading ? "#9ca3af" : "#4f46e5",
            color: "#ffffff",
            fontSize: "17px",
            fontWeight: "600",
            cursor: loading ? "wait" : "pointer",
          }}
        >
          {loading ? "Signing in..." : "Login"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#6b7280",
            marginTop: "24px",
            marginBottom: "0",
          }}
        >
          Secure login powered by ShopSense
        </p>
      </form>
    </main>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "13px",
  marginTop: "9px",
  marginBottom: "22px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  color: "#111827",
  backgroundColor: "#ffffff",
  outlineColor: "#4f46e5",
};
