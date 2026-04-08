import { unstable_cache } from "next/cache";
import type {
  AppfiguresAdminProduct,
  AppfiguresConfig,
  AppfiguresEndpointKey,
  AppfiguresEndpointResult,
  AppfiguresProductConfig,
  AppfiguresProductSnapshot,
  AppfiguresResolvedProduct,
  AppfiguresSnapshot,
  AppfiguresStore,
} from "@/lib/appfigures-types";

const APPFIGURES_BASE_URL = "https://api.appfigures.com/v2";
const SNAPSHOT_CACHE_TTL_SECONDS = 60 * 60 * 6;

type FetchResult = {
  ok: boolean;
  status: number;
  url: string;
  data?: unknown;
  error?: string;
};

function getAppfiguresToken(): string {
  return process.env.APPFIGURES_TOKEN?.trim() || "";
}

function getUserAgent(): string {
  return process.env.APPFIGURES_USER_AGENT?.trim() || "ehvm-appfigures-integration/1.0";
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function shiftDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return toIsoDate(date);
}

function clean(value?: string): string {
  return value?.trim() || "";
}

function normalizeCountry(value?: string): string {
  return clean(value).toUpperCase() || "US";
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function describeError(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim()) return payload.trim();

  const maybeObject = asObject(payload);
  if (!maybeObject) return `Appfigures request failed with status ${status}.`;

  const pieces = [
    maybeObject.message,
    maybeObject.additional,
    maybeObject.error,
    maybeObject.status,
  ]
    .filter((part): part is string | number => typeof part === "string" || typeof part === "number")
    .map((part) => String(part).trim())
    .filter(Boolean);

  return pieces[0] || `Appfigures request failed with status ${status}.`;
}

function buildUrl(path: string, params?: Record<string, string | undefined>): URL {
  const url = new URL(path.replace(/^\//, ""), `${APPFIGURES_BASE_URL}/`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (!value) return;
      url.searchParams.set(key, value);
    });
  }

  return url;
}

async function fetchFromAppfigures(path: string, params?: Record<string, string | undefined>): Promise<FetchResult> {
  const token = getAppfiguresToken();
  const url = buildUrl(path, params);

  if (!token) {
    return {
      ok: false,
      status: 503,
      url: url.toString(),
      error: "APPFIGURES_TOKEN is not configured.",
    };
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": getUserAgent(),
      },
      next: { revalidate: SNAPSHOT_CACHE_TTL_SECONDS },
    });

    let payload: unknown;
    const raw = await response.text();
    try {
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = raw;
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        url: url.toString(),
        data: payload,
        error: describeError(payload, response.status),
      };
    }

    return {
      ok: true,
      status: response.status,
      url: url.toString(),
      data: payload,
    };
  } catch (error) {
    return {
      ok: false,
      status: 500,
      url: url.toString(),
      error: error instanceof Error ? error.message : "Unknown Appfigures request error.",
    };
  }
}

function normalizeConfig(config: AppfiguresConfig): AppfiguresConfig {
  return {
    defaultCountry: normalizeCountry(config.defaultCountry),
    products: [...config.products]
      .filter((item) => clean(item.productId) || clean(item.storeProductId))
      .map((item) => ({
        ...item,
        id: clean(item.id) || item.store,
        label: clean(item.label) || item.store,
        productId: clean(item.productId) || undefined,
        storeProductId: clean(item.storeProductId) || undefined,
        country: normalizeCountry(item.country || config.defaultCountry),
      }))
      .sort((a, b) => `${a.store}:${a.productId || a.storeProductId}`.localeCompare(`${b.store}:${b.productId || b.storeProductId}`)),
  };
}

function normalizeAdminProducts(payload: unknown): AppfiguresAdminProduct[] {
  const products = asObject(payload);
  if (!products) return [];

  return Object.values(products)
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .map((item) => {
      const store: AppfiguresStore = item.store === "google_play" ? "google_play" : "apple";
      return {
        id: String(item.id ?? ""),
        name: typeof item.name === "string" ? item.name : "Untitled Product",
        developer: typeof item.developer === "string" ? item.developer : "",
        icon: typeof item.icon === "string" ? item.icon : undefined,
        store,
        storefront: typeof item.storefront === "string" ? item.storefront : undefined,
        active: Boolean(item.active),
        productType: typeof item.type === "string" ? item.type : undefined,
        vendorIdentifier:
          typeof item.vendor_identifier === "string" || typeof item.vendor_identifier === "number"
            ? String(item.vendor_identifier)
            : undefined,
        refNo:
          typeof item.ref_no === "string" || typeof item.ref_no === "number"
            ? String(item.ref_no)
            : undefined,
        sku: typeof item.sku === "string" ? item.sku : undefined,
        packageName: typeof item.package_name === "string" ? item.package_name : undefined,
        bundleIdentifier: typeof item.bundle_identifier === "string" ? item.bundle_identifier : undefined,
        releaseDate: typeof item.release_date === "string" ? item.release_date : undefined,
        updatedDate: typeof item.updated_date === "string" ? item.updated_date : undefined,
        accessibleFeatures: Array.isArray(item.accessible_features)
          ? item.accessible_features.filter((feature): feature is string => typeof feature === "string")
          : [],
      };
    })
    .filter((item) => item.id)
    .sort((a, b) => {
      const storeDelta = a.store.localeCompare(b.store);
      if (storeDelta !== 0) return storeDelta;
      const activeDelta = Number(b.active) - Number(a.active);
      if (activeDelta !== 0) return activeDelta;
      return a.name.localeCompare(b.name);
    });
}

async function resolveProduct(config: AppfiguresProductConfig): Promise<AppfiguresResolvedProduct> {
  if (!config.productId && !config.storeProductId) {
    return {
      ...config,
      lookupStatus: "skipped",
      error: "No Appfigures product ID or store product ID was provided.",
    };
  }

  const path = config.productId
    ? `/products/${encodeURIComponent(config.productId)}`
    : `/products/${config.store}/${encodeURIComponent(config.storeProductId || "")}`;

  const result = await fetchFromAppfigures(path);
  if (!result.ok) {
    return {
      ...config,
      lookupStatus: result.status === 202 ? "pending" : "failed",
      error: result.error,
    };
  }

  if (result.status === 202) {
    return {
      ...config,
      lookupStatus: "pending",
      resolvedProduct: asObject(result.data),
      error: "Appfigures has accepted the lookup but the product is not ready yet. Retry shortly.",
    };
  }

  const resolvedProduct = asObject(result.data);
  const appfiguresProductId =
    typeof resolvedProduct?.id === "number" || typeof resolvedProduct?.id === "string"
      ? String(resolvedProduct.id)
      : config.productId;

  return {
    ...config,
    appfiguresProductId: clean(appfiguresProductId) || undefined,
    lookupStatus: appfiguresProductId ? "resolved" : "failed",
    resolvedProduct,
    error: appfiguresProductId ? undefined : "Appfigures returned a product without an id.",
  };
}

function endpointResult(
  key: AppfiguresEndpointKey,
  label: string,
  result: FetchResult,
): AppfiguresEndpointResult {
  return {
    key,
    label,
    ok: result.ok,
    status: result.status,
    url: result.url,
    data: result.data,
    error: result.error,
  };
}

async function buildProductSnapshot(config: AppfiguresProductConfig): Promise<AppfiguresProductSnapshot> {
  const country = normalizeCountry(config.country);
  const endDate = shiftDays(0);
  const last14DaysStart = shiftDays(13);
  const last30DaysStart = shiftDays(30);
  const last90DaysStart = shiftDays(90);
  const resolved = await resolveProduct(config);

  if (!resolved.appfiguresProductId) {
    return {
      product: resolved,
      window: { country, endDate, last30DaysStart, last90DaysStart },
      endpoints: [],
    };
  }

  const productId = resolved.appfiguresProductId;
  const baseReportParams = {
    products: productId,
    countries: country,
    start_date: last30DaysStart,
    end_date: endDate,
  };

  const requests: Array<Promise<AppfiguresEndpointResult>> = [
    fetchFromAppfigures(`/products/${encodeURIComponent(productId)}/sdks`).then((result) =>
      endpointResult("sdks", "Installed SDKs", result),
    ),
    fetchFromAppfigures("/reports/ratings", {
      products: productId,
      countries: country,
    }).then((result) => endpointResult("ratings", "Ratings Totals", result)),
    fetchFromAppfigures("/reports/estimates", {
      products: productId,
      countries: country,
      start_date: last14DaysStart,
      end_date: endDate,
      group_by: "date",
    }).then((result) => endpointResult("estimatesByDate", "Estimated Downloads & Revenue History", result)),
    fetchFromAppfigures("/reports/ratings", {
      products: productId,
      countries: country,
      start_date: last30DaysStart,
      end_date: endDate,
      group_by: "date",
    }).then((result) => endpointResult("ratingsByDate", "Ratings History", result)),
    fetchFromAppfigures("/reviews", {
      products: productId,
      countries: country,
      count: "10",
      page: "1",
      sort: "-date",
      start: last90DaysStart,
      end: endDate,
    }).then((result) => endpointResult("reviews", "Latest Reviews", result)),
    fetchFromAppfigures("/reviews/count", {
      products: productId,
      countries: country,
      start: last90DaysStart,
      end: endDate,
    }).then((result) => endpointResult("reviewCounts", "Review Breakdowns", result)),
    fetchFromAppfigures(`/ranks/${encodeURIComponent(productId)}/daily/${last30DaysStart}/${endDate}`, {
      countries: country,
    }).then((result) => endpointResult("ranks", "Category Ranks", result)),
    fetchFromAppfigures(`/featured/summary/${last90DaysStart}/${endDate}`, {
      products: productId,
    }).then((result) => endpointResult("featuredSummary", "Featured Summary", result)),
    fetchFromAppfigures(`/featured/full/${encodeURIComponent(productId)}/${last30DaysStart}/${endDate}`, {
      countries: country,
    }).then((result) => endpointResult("featuredFull", "Featured History", result)),
    fetchFromAppfigures("/reports/estimates", {
      products: productId,
      countries: country,
      start_date: last30DaysStart,
      end_date: endDate,
    }).then((result) => endpointResult("estimates", "Estimated Downloads & Revenue", result)),
    fetchFromAppfigures("/reports/sales", {
      ...baseReportParams,
      include_inapps: "true",
    }).then((result) =>
      endpointResult("sales", "Sales", result),
    ),
    fetchFromAppfigures("/reports/revenue", {
      ...baseReportParams,
      include_inapps: "true",
    }).then((result) =>
      endpointResult("revenue", "Revenue", result),
    ),
    fetchFromAppfigures("/reports/subscriptions", baseReportParams).then((result) =>
      endpointResult("subscriptions", "Subscriptions", result),
    ),
    fetchFromAppfigures("/reports/ads", baseReportParams).then((result) =>
      endpointResult("ads", "Ad Revenue", result),
    ),
    fetchFromAppfigures("/reports/adspend", baseReportParams).then((result) =>
      endpointResult("adspend", "Ad Spend", result),
    ),
    fetchFromAppfigures("/reports/payments", baseReportParams).then((result) =>
      endpointResult("payments", "Payments", result),
    ),
    fetchFromAppfigures("/reports/usage", {
      products: productId,
      countries: country,
      start_date: last30DaysStart,
      end_date: endDate,
      group_by: "network",
    }).then((result) => endpointResult("usage", "In-App Usage", result)),
    fetchFromAppfigures("/aso/stats", {
      products: productId,
      countries: country,
      start: last14DaysStart,
      end: endDate,
      granularity: "daily",
      device: resolved.store === "apple" ? "handheld" : undefined,
    }).then((result) => endpointResult("aso", "Keyword Rank Stats", result)),
  ];

  return {
    product: resolved,
    window: { country, endDate, last30DaysStart, last90DaysStart },
    endpoints: await Promise.all(requests),
  };
}

const getCachedSnapshot = unstable_cache(
  async (configJson: string): Promise<AppfiguresSnapshot> => {
    const parsed = JSON.parse(configJson) as AppfiguresConfig;
    const config = normalizeConfig(parsed);

    return {
      generatedAt: new Date().toISOString(),
      cacheTtlSeconds: SNAPSHOT_CACHE_TTL_SECONDS,
      notes: [
        "Public-data routes may require public scopes, add-ons, or credits.",
        "Private report routes only succeed for products owned by the authenticated Appfigures account.",
        "This snapshot is cached server-side to reduce repeated Appfigures requests.",
      ],
      products: await Promise.all(config.products.map(buildProductSnapshot)),
    };
  },
  ["appfigures-snapshot-v1"],
  { revalidate: SNAPSHOT_CACHE_TTL_SECONDS },
);

const getCachedProducts = unstable_cache(
  async (): Promise<AppfiguresAdminProduct[]> => {
    const result = await fetchFromAppfigures("/products/mine");
    if (!result.ok) {
      throw new Error(result.error || "Failed to load Appfigures products.");
    }

    return normalizeAdminProducts(result.data);
  },
  ["appfigures-products-v1"],
  { revalidate: 60 * 10 },
);

export function hasAppfiguresAccess(): boolean {
  return Boolean(getAppfiguresToken());
}

export async function getAppfiguresSnapshot(config?: AppfiguresConfig | null): Promise<AppfiguresSnapshot | null> {
  if (!config) return null;

  const normalized = normalizeConfig(config);
  if (normalized.products.length === 0) return null;
  if (!hasAppfiguresAccess()) return null;

  return getCachedSnapshot(JSON.stringify(normalized));
}

export async function listAppfiguresProducts(): Promise<AppfiguresAdminProduct[]> {
  if (!hasAppfiguresAccess()) {
    throw new Error("APPFIGURES_TOKEN is not configured.");
  }

  return getCachedProducts();
}
