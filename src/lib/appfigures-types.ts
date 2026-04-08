export type AppfiguresStore = "apple" | "google_play";

export type AppfiguresProductConfig = {
  id: string;
  label: string;
  store: AppfiguresStore;
  productId?: string;
  storeProductId?: string;
  country?: string;
};

export type AppfiguresConfig = {
  defaultCountry: string;
  products: AppfiguresProductConfig[];
};

export type AppfiguresAdminProduct = {
  id: string;
  name: string;
  developer: string;
  icon?: string;
  store: AppfiguresStore;
  storefront?: string;
  active: boolean;
  productType?: string;
  vendorIdentifier?: string;
  refNo?: string;
  sku?: string;
  packageName?: string;
  bundleIdentifier?: string;
  releaseDate?: string;
  updatedDate?: string;
  accessibleFeatures: string[];
};

export type AppfiguresEndpointKey =
  | "sdks"
  | "ratings"
  | "ratingsByDate"
  | "estimatesByDate"
  | "reviews"
  | "reviewCounts"
  | "ranks"
  | "featuredSummary"
  | "featuredFull"
  | "estimates"
  | "sales"
  | "revenue"
  | "subscriptions"
  | "ads"
  | "adspend"
  | "payments"
  | "usage"
  | "aso";

export type AppfiguresEndpointResult = {
  key: AppfiguresEndpointKey;
  label: string;
  ok: boolean;
  status: number;
  url: string;
  data?: unknown;
  error?: string;
};

export type AppfiguresResolvedProduct = AppfiguresProductConfig & {
  appfiguresProductId?: string;
  lookupStatus: "resolved" | "pending" | "failed" | "skipped";
  resolvedProduct?: Record<string, unknown> | null;
  error?: string;
};

export type AppfiguresProductSnapshot = {
  product: AppfiguresResolvedProduct;
  window: {
    country: string;
    endDate: string;
    last30DaysStart: string;
    last90DaysStart: string;
  };
  endpoints: AppfiguresEndpointResult[];
};

export type AppfiguresSnapshot = {
  generatedAt: string;
  cacheTtlSeconds: number;
  notes: string[];
  products: AppfiguresProductSnapshot[];
};

export type AppfiguresRouteResponse = {
  configured: boolean;
  reason?: string;
  snapshot?: AppfiguresSnapshot;
};
