"use client";

import { useEffect, useState } from "react";
import type {
  AppfiguresEndpointResult,
  AppfiguresProductSnapshot,
  AppfiguresRouteResponse,
} from "@/lib/appfigures-types";

const MARKET_ENDPOINTS = new Set([
  "sdks",
  "ratings",
  "ratingsByDate",
  "estimatesByDate",
  "reviews",
  "reviewCounts",
  "ranks",
  "featuredSummary",
  "featuredFull",
  "estimates",
  "aso",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value || "N/A";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  return "Object";
}

function getPrimitiveEntries(value: unknown, limit = 8): Array<{ key: string; value: string }> {
  if (!isObject(value)) {
    if (Array.isArray(value)) {
      return [{ key: "items", value: String(value.length) }];
    }
    return [];
  }

  return Object.entries(value)
    .filter(([, entry]) => entry === null || ["string", "number", "boolean"].includes(typeof entry) || Array.isArray(entry))
    .slice(0, limit)
    .map(([key, entry]) => ({
      key,
      value: formatValue(entry),
    }));
}

function getReviewPreview(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(isObject).slice(0, 3);
  }

  if (!isObject(value)) return [];

  const direct = value.reviews;
  if (Array.isArray(direct)) {
    return direct.filter(isObject).slice(0, 3);
  }

  return [];
}

function EndpointCard({ endpoint }: { endpoint: AppfiguresEndpointResult }) {
  const summary = getPrimitiveEntries(endpoint.data);
  const reviews = endpoint.key === "reviews" ? getReviewPreview(endpoint.data) : [];

  return (
    <div className="rounded-[16px] p-[12px] flex flex-col gap-[10px]" style={{ background: "var(--color-detail-surface)" }}>
      <div className="flex items-start justify-between gap-[10px]">
        <div>
          <p className="font-bold text-[14px] leading-[1.2]">{endpoint.label}</p>
          <p className="text-[11px] text-caption mt-[2px]">
            {endpoint.ok ? `HTTP ${endpoint.status}` : endpoint.error || `HTTP ${endpoint.status}`}
          </p>
        </div>
        <span
          className={`px-[8px] py-[2px] rounded-pill text-[10px] uppercase tracking-[0.08em] ${
            endpoint.ok ? "bg-card text-foreground" : "bg-[#f4d8d8] text-[#8f2d2d]"
          }`}
        >
          {endpoint.ok ? "Loaded" : "Unavailable"}
        </span>
      </div>

      {summary.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[8px]">
          {summary.map((item) => (
            <div key={`${endpoint.key}-${item.key}`} className="bg-card rounded-[12px] px-[10px] py-[8px]">
              <p className="text-[10px] uppercase tracking-[0.08em] text-caption">{item.key}</p>
              <p className="text-[12px] font-medium mt-[3px] break-words">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {reviews.length > 0 ? (
        <div className="flex flex-col gap-[8px]">
          {reviews.map((review, index) => (
            <div key={`${endpoint.key}-review-${index}`} className="bg-card rounded-[12px] px-[10px] py-[8px]">
              <div className="flex items-center justify-between gap-[10px] text-[10px] uppercase tracking-[0.08em] text-caption">
                <span>{formatValue(review.author || review.user || review.username)}</span>
                <span>{formatValue(review.date)}</span>
              </div>
              <p className="text-[12px] mt-[4px] break-words">
                {formatValue(review.review || review.title || review.text || review.content)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <details className="bg-card rounded-[12px] px-[10px] py-[8px]">
        <summary className="cursor-pointer text-[11px] font-medium">Raw payload</summary>
        <pre className="mt-[8px] text-[11px] leading-[1.45] overflow-x-auto whitespace-pre-wrap break-words">
          {JSON.stringify(endpoint.data ?? { error: endpoint.error }, null, 2)}
        </pre>
        <p className="text-[10px] text-caption mt-[8px] break-all">{endpoint.url}</p>
      </details>
    </div>
  );
}

function ProductSection({ snapshot }: { snapshot: AppfiguresProductSnapshot }) {
  const productMeta = getPrimitiveEntries(snapshot.product.resolvedProduct, 10);
  const marketData = snapshot.endpoints.filter((item) => MARKET_ENDPOINTS.has(item.key));
  const privateData = snapshot.endpoints.filter((item) => !MARKET_ENDPOINTS.has(item.key));

  return (
    <div className="rounded-[20px] p-[14px] flex flex-col gap-[14px]" style={{ background: "var(--color-detail-surface)" }}>
      <div className="flex flex-col gap-[6px]">
        <div className="flex flex-wrap items-center gap-[8px]">
          <p className="font-bold text-[18px] leading-[1.2]">{snapshot.product.label}</p>
          <span className="bg-card px-[8px] py-[2px] rounded-pill text-[10px] uppercase tracking-[0.08em]">
            {snapshot.product.store}
          </span>
          <span className="bg-card px-[8px] py-[2px] rounded-pill text-[10px] uppercase tracking-[0.08em]">
            {snapshot.product.lookupStatus}
          </span>
        </div>
          <p className="text-[12px] text-body break-words">
          Country {snapshot.window.country} · Product ID {snapshot.product.appfiguresProductId || "N/A"} · Window {snapshot.window.last30DaysStart} to {snapshot.window.endDate}
        </p>
        {snapshot.product.error ? (
          <p className="text-[12px] text-[#8f2d2d]">{snapshot.product.error}</p>
        ) : null}
      </div>

      {productMeta.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[8px]">
          {productMeta.map((item) => (
            <div key={`${snapshot.product.id}-${item.key}`} className="bg-card rounded-[12px] px-[10px] py-[8px]">
              <p className="text-[10px] uppercase tracking-[0.08em] text-caption">{item.key}</p>
              <p className="text-[12px] font-medium mt-[3px] break-words">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {marketData.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          <p className="font-bold text-[16px] leading-[1.2]">Market & Store Data</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px]">
            {marketData.map((endpoint) => (
              <EndpointCard key={`${snapshot.product.id}-${endpoint.key}`} endpoint={endpoint} />
            ))}
          </div>
        </div>
      ) : null}

      {privateData.length > 0 ? (
        <div className="flex flex-col gap-[10px]">
          <p className="font-bold text-[16px] leading-[1.2]">Private Account Data</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px]">
            {privateData.map((endpoint) => (
              <EndpointCard key={`${snapshot.product.id}-${endpoint.key}`} endpoint={endpoint} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AppfiguresSectionClient({
  slug,
}: {
  slug: string;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    payload: AppfiguresRouteResponse | null;
    error: string | null;
  }>({
    loading: true,
    payload: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch(`/api/apps/${slug}/appfigures`, { cache: "no-store" });
        const payload = (await response.json()) as AppfiguresRouteResponse;
        if (cancelled) return;
        setState({
          loading: false,
          payload,
          error: response.ok ? null : payload.reason || "Failed to load Appfigures data.",
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          loading: false,
          payload: null,
          error: error instanceof Error ? error.message : "Failed to load Appfigures data.",
        });
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="flex flex-col gap-[12px] w-full">
      <div className="flex flex-col gap-[4px]">
        <p className="font-bold text-[20px] leading-[1.2]">Appfigures Intelligence</p>
        <p className="text-[13px] text-body">
          Live Appfigures snapshot across public market endpoints and private account reports.
        </p>
      </div>

      {state.loading ? (
        <div className="rounded-[16px] p-[14px] text-[13px] text-body" style={{ background: "var(--color-detail-surface)" }}>
          Loading Appfigures data...
        </div>
      ) : null}

      {!state.loading && state.error ? (
        <div className="rounded-[16px] p-[14px] text-[13px] text-body" style={{ background: "var(--color-detail-surface)" }}>
          {state.error}
        </div>
      ) : null}

      {!state.loading && !state.error && !state.payload?.configured ? (
        <div className="rounded-[16px] p-[14px] text-[13px] text-body" style={{ background: "var(--color-detail-surface)" }}>
          {state.payload?.reason || "Appfigures is not configured for this app."}
        </div>
      ) : null}

      {state.payload?.snapshot ? (
        <>
          <div className="rounded-[16px] p-[14px] flex flex-col gap-[8px]" style={{ background: "var(--color-detail-surface)" }}>
            <p className="text-[12px] text-body">
              Cached snapshot from{" "}
              <time dateTime={state.payload.snapshot.generatedAt}>
                {new Date(state.payload.snapshot.generatedAt).toLocaleString()}
              </time>
              {" "}· cache TTL {Math.round(state.payload.snapshot.cacheTtlSeconds / 3600)}h
            </p>
            {state.payload.snapshot.notes.map((note, index) => (
              <p key={`note-${index}`} className="text-[12px] text-caption">
                {note}
              </p>
            ))}
          </div>

          {state.payload.snapshot.products.map((snapshot) => (
            <ProductSection key={`${snapshot.product.id}-${snapshot.product.store}`} snapshot={snapshot} />
          ))}
        </>
      ) : null}
    </div>
  );
}
