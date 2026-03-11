"use client";

import { useEffect, useState } from "react";
import AdminClient from "@/app/admin/AdminClient";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (!response.ok) {
          if (active) window.location.href = "/admin/login";
          return;
        }
        const payload = (await response.json()) as { authenticated?: boolean };
        if (!active) return;
        if (payload.authenticated) {
          setIsAuthenticated(true);
          return;
        }
        window.location.href = "/admin/login";
      } catch {
        if (active) window.location.href = "/admin/login";
      }
    };

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  if (!isAuthenticated) return null;
  return <AdminClient />;
}
