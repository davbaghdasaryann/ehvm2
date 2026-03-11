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
    <div className="admin-login-shell">
      <div className="admin-login-orb admin-login-orb-a" />
      <div className="admin-login-orb admin-login-orb-b" />

      <div className="admin-login-card card">
        <div className="card-body">
          <div className="admin-login-head">
            <p className="admin-login-kicker">EHVM Internal</p>
            <h1 className="admin-login-title">Admin Access</h1>
            <p className="admin-login-subtitle">Sign in to manage apps, listings, and newsroom content.</p>
          </div>

          <form onSubmit={onSubmit} className="form-grid admin-login-form">
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
            <p className={`admin-login-error${error ? " show" : ""}`} role="alert">
              {error || " "}
            </p>
            <button className="btn btn-primary admin-login-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="admin-login-footnote">Protected EHVM workspace</p>
        </div>
      </div>
    </div>
  );
}
