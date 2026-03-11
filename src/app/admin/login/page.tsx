"use client";

import { FormEvent, useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error || "Login failed");
        return;
      }

      window.location.href = "/admin";
    } catch {
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420 }}>
        <div className="card-header">
          <div className="card-title">EHVM Admin Login</div>
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit} className="form-grid">
            <div className="field">
              <label className="field-label">Username</label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? (
              <p style={{ color: "var(--red)", fontSize: 12 }}>{error}</p>
            ) : null}
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
