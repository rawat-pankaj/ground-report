"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 style={{ fontSize: "18px", fontWeight: 700, color: "var(--ink)", fontFamily: "'Archivo Narrow', sans-serif", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "16px" }}>Admin login</h1>
      <form onSubmit={handleSubmit} className="panel flex flex-col gap-4">
        <input
          type="password"
          className="input"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Log in"}
        </button>
        {error && <p className="text-sm" style={{ color: "var(--signal)" }}>{error}</p>}
      </form>
    </div>
  );
}
