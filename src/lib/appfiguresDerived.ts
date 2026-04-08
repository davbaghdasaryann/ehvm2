import type { App } from "@/data/apps";
import type { AppfiguresEndpointKey, AppfiguresProductSnapshot, AppfiguresSnapshot } from "@/lib/appfigures-types";

type AppKpi = NonNullable<App["kpis"]>[number];
type AppChart = NonNullable<App["charts"]>[number];

export type AppfiguresDerivedReview = {
  id: string;
  author: string;
  title: string;
  review: string;
  stars: number;
  date: string;
  store: string;
  productName: string;
  version?: string;
};

export type AppfiguresDerivedPlacement = {
  id: string;
  title: string;
  category: string;
  position: number;
  country: string;
  viewedFrom: string;
};

export type AppfiguresDerivedSignal = {
  key: string;
  label: string;
  value: string;
  sub: string;
};

export type AppfiguresDerivedFinancialCard = {
  key: string;
  label: string;
  value: string;
};

export type AppfiguresDerivedHighlight = {
  key: string;
  emoji: string;
  value: string;
  label: string;
};

export type AppfiguresDerivedData = {
  highlights: AppfiguresDerivedHighlight[];
  kpis: AppKpi[];
  financialCards: AppfiguresDerivedFinancialCard[];
  charts: AppChart[];
  reviews: AppfiguresDerivedReview[];
  storeSignals: AppfiguresDerivedSignal[];
  featuredPlacements: AppfiguresDerivedPlacement[];
  activeSdks: string[];
};

type NumericRecord = Record<string, number>;

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getEndpointData(product: AppfiguresProductSnapshot, key: AppfiguresEndpointKey): unknown {
  return product.endpoints.find((endpoint) => endpoint.key === key && endpoint.ok)?.data;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCompactNumber(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? "↑" : "↓"} ${Math.abs(value).toFixed(0)}% vs prev 7d`;
}

function cleanDateLabel(value: string): string {
  return value.slice(5);
}

function computeDelta(values: number[]): string {
  if (values.length < 14) return "";
  const prev = values.slice(0, 7).reduce((sum, value) => sum + value, 0);
  const current = values.slice(-7).reduce((sum, value) => sum + value, 0);
  if (prev === 0) {
    if (current === 0) return "";
    return "↑ New in last 7d";
  }
  const delta = ((current - prev) / prev) * 100;
  return formatPercent(delta);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function aggregateDateSeries(
  products: AppfiguresProductSnapshot[],
  key: AppfiguresEndpointKey,
  fields: string[],
): Map<string, NumericRecord> {
  const series = new Map<string, NumericRecord>();

  products.forEach((product) => {
    const data = asObject(getEndpointData(product, key));
    if (!data) return;

    Object.entries(data).forEach(([date, entry]) => {
      const object = asObject(entry);
      if (!object) return;

      const current = series.get(date) || {};
      fields.forEach((field) => {
        current[field] = (current[field] || 0) + parseNumber(object[field]);
      });
      series.set(date, current);
    });
  });

  return new Map([...series.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function collectReviews(products: AppfiguresProductSnapshot[]): AppfiguresDerivedReview[] {
  const reviews = products.flatMap((product) => {
    const data = asObject(getEndpointData(product, "reviews"));
    const items = asArray(data?.reviews);
    return items
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .map((entry) => ({
        id: String(entry.id ?? `${entry.author ?? ""}-${entry.date ?? ""}`),
        author: String(entry.author ?? "Anonymous"),
        title: String(entry.title ?? ""),
        review: String(entry.review ?? ""),
        stars: parseNumber(entry.stars),
        date: String(entry.date ?? ""),
        store: String(entry.store ?? product.product.store),
        productName: String(entry.product_name ?? product.product.label),
        version: typeof entry.version === "string" ? entry.version : undefined,
      }));
  });

  return reviews
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, 6);
}

function collectActiveSdks(products: AppfiguresProductSnapshot[]): string[] {
  const sdks = products.flatMap((product) => {
    const data = asArray(getEndpointData(product, "sdks"));
    return data
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .filter((entry) => Boolean(entry.active))
      .map((entry) => String(entry.id ?? ""));
  });

  return uniqueStrings(sdks).sort((a, b) => a.localeCompare(b));
}

function collectFeaturedPlacements(products: AppfiguresProductSnapshot[]): AppfiguresDerivedPlacement[] {
  const placements = products.flatMap((product) => {
    const data = asObject(getEndpointData(product, "featuredFull"));
    if (!data) return [];

    return Object.entries(data)
      .map(([id, value]) => {
        const entry = asObject(value);
        if (!entry) return null;

        const baseCategory = asObject(entry.base_category);
        const crumbs = asArray(entry.crumbs).filter((crumb): crumb is string => typeof crumb === "string");
        const title = crumbs[crumbs.length - 1] || String(baseCategory?.name ?? "Featured placement");
        return {
          id,
          title,
          category: String(baseCategory?.name ?? "Featured"),
          position: parseNumber(entry.highest_position),
          country: String(entry.country ?? product.window.country),
          viewedFrom: String(entry.viewed_from ?? "Store"),
        } satisfies AppfiguresDerivedPlacement;
      })
      .filter((entry): entry is AppfiguresDerivedPlacement => entry !== null);
  });

  return placements
    .filter((entry) => entry.position > 0)
    .sort((a, b) => a.position - b.position)
    .slice(0, 6);
}

function collectFeaturedCountries(products: AppfiguresProductSnapshot[]): string[] {
  const countries = products.flatMap((product) => {
    const data = asObject(getEndpointData(product, "featuredSummary"));
    if (!data) return [];

    return Object.values(data).flatMap((value) => {
      const entry = asObject(value);
      const list = asArray(entry?.countries);
      return list.filter((country): country is string => typeof country === "string");
    });
  });

  return uniqueStrings(countries).sort((a, b) => a.localeCompare(b));
}

function getBestRank(products: AppfiguresProductSnapshot[]): { value: number; label: string } | null {
  let best: { value: number; label: string } | null = null;

  products.forEach((product) => {
    const data = asObject(getEndpointData(product, "ranks"));
    const items = asArray(data?.data);
    items
      .map((entry) => asObject(entry))
      .filter((entry): entry is Record<string, unknown> => entry !== null)
      .forEach((entry) => {
        const positions = asArray(entry.positions).map(parseNumber).filter((value) => value > 0);
        if (positions.length === 0) return;
        const minPosition = Math.min(...positions);
        if (!best || minPosition < best.value) {
          const category = asObject(entry.category);
          const name = String(category?.name ?? "Category");
          const subtype = String(category?.subtype ?? "");
          best = {
            value: minPosition,
            label: subtype ? `${name} ${subtype}` : name,
          };
        }
      });
  });

  return best;
}

export function deriveAppfiguresData(snapshot: AppfiguresSnapshot | null): AppfiguresDerivedData {
  if (!snapshot) {
    return {
      highlights: [],
      kpis: [],
      financialCards: [],
      charts: [],
      reviews: [],
      storeSignals: [],
      featuredPlacements: [],
      activeSdks: [],
    };
  }

  const products = snapshot.products.filter((product) => product.product.lookupStatus === "resolved");
  if (products.length === 0) {
    return {
      highlights: [],
      kpis: [],
      financialCards: [],
      charts: [],
      reviews: [],
      storeSignals: [],
      featuredPlacements: [],
      activeSdks: [],
    };
  }

  let totalRatings = 0;
  let weightedRating = 0;
  let estimatedDownloads30d = 0;
  let estimatedRevenue30d = 0;
  let reportedRevenue30d = 0;
  let subscriptionMrr = 0;
  let paymentsRevenue = 0;
  let adRevenue = 0;
  let adSpend = 0;
  let reviews90d = 0;
  let positiveReviews90d = 0;
  let negativeReviews90d = 0;
  let rankedKeywords = 0;
  let topKeywords25 = 0;

  products.forEach((product) => {
    const ratings = asObject(getEndpointData(product, "ratings"));
    const ratingsTotal = parseNumber(ratings?.total);
    const ratingsAverage = parseNumber(ratings?.average);
    totalRatings += ratingsTotal;
    weightedRating += ratingsTotal * ratingsAverage;

    const estimates = asObject(getEndpointData(product, "estimates"));
    estimatedDownloads30d += parseNumber(estimates?.downloads);
    estimatedRevenue30d += parseNumber(estimates?.revenue);

    const revenue = asObject(getEndpointData(product, "revenue"));
    reportedRevenue30d += parseNumber(revenue?.total);

    const subscriptions = asObject(getEndpointData(product, "subscriptions"));
    subscriptionMrr += parseNumber(subscriptions?.mrr);

    const payments = asObject(getEndpointData(product, "payments"));
    paymentsRevenue += Math.max(parseNumber(payments?.financial_revenue), parseNumber(payments?.estimated_revenue));

    const ads = asObject(getEndpointData(product, "ads"));
    adRevenue += parseNumber(ads?.revenue);

    const adspend = asObject(getEndpointData(product, "adspend"));
    adSpend += parseNumber(adspend?.cost);

    const reviewCounts = asObject(getEndpointData(product, "reviewCounts"));
    const stars = asObject(reviewCounts?.stars);
    Object.entries(stars || {}).forEach(([star, count]) => {
      const parsedCount = parseNumber(count);
      reviews90d += parsedCount;
      if (Number.parseInt(star, 10) >= 4) positiveReviews90d += parsedCount;
      if (Number.parseInt(star, 10) <= 2) negativeReviews90d += parsedCount;
    });

    const aso = asObject(getEndpointData(product, "aso"));
    rankedKeywords += parseNumber(aso?.ranked_keywords);
    topKeywords25 += parseNumber(aso?.top_25);
  });

  const averageRating = totalRatings > 0 ? weightedRating / totalRatings : 0;
  const featuredCountries = collectFeaturedCountries(products);
  const featuredPlacements = collectFeaturedPlacements(products);
  const activeSdks = collectActiveSdks(products);
  const reviews = collectReviews(products);
  const bestRank = getBestRank(products);

  const estimatesByDate = aggregateDateSeries(products, "estimatesByDate", ["downloads", "revenue"]);
  const ratingsByDate = aggregateDateSeries(products, "ratingsByDate", ["total", "new_total"]);

  const estimateLabels = [...estimatesByDate.keys()].map(cleanDateLabel);
  const estimateDownloadsSeries = [...estimatesByDate.values()].map((entry) => entry.downloads || 0);
  const estimateRevenueSeries = [...estimatesByDate.values()].map((entry) => entry.revenue || 0);
  const ratingsLabels = [...ratingsByDate.keys()].map(cleanDateLabel);
  const ratingsTotalSeries = [...ratingsByDate.values()].map((entry) => entry.total || 0);
  const ratingsNewSeries = [...ratingsByDate.values()].map((entry) => entry.new_total || 0);

  const highlights: AppfiguresDerivedHighlight[] = [];
  if (averageRating > 0) {
    highlights.push({
      key: "appfigures-rating",
      emoji: "⭐",
      value: averageRating.toFixed(2),
      label: "Store Rating",
    });
  }
  if (estimatedDownloads30d > 0) {
    highlights.push({
      key: "appfigures-downloads",
      emoji: "⬇️",
      value: formatCompactNumber(estimatedDownloads30d),
      label: "Est. Downloads (30d)",
    });
  }
  if (estimatedRevenue30d > 0) {
    highlights.push({
      key: "appfigures-revenue",
      emoji: "💵",
      value: formatCurrency(estimatedRevenue30d),
      label: "Est. Revenue (30d)",
    });
  }

  const kpis: AppKpi[] = [];
  if (averageRating > 0) {
    kpis.push({
      label: "Store Rating",
      value: averageRating.toFixed(2),
      trend: ratingsNewSeries.some((value) => value > 0) ? `↑ ${formatInteger(ratingsNewSeries.reduce((sum, value) => sum + value, 0))} new in 30d` : "",
      sub: totalRatings > 0 ? `${formatCompactNumber(totalRatings)} total ratings` : "",
      icon: "⭐",
    });
  }
  if (estimatedDownloads30d > 0) {
    kpis.push({
      label: "Estimated Downloads",
      value: formatCompactNumber(estimatedDownloads30d),
      trend: computeDelta(estimateDownloadsSeries),
      sub: "Last 30 days",
      icon: "⬇️",
    });
  }
  if (estimatedRevenue30d > 0) {
    kpis.push({
      label: "Estimated Revenue",
      value: formatCurrency(estimatedRevenue30d),
      trend: computeDelta(estimateRevenueSeries),
      sub: "Last 30 days",
      icon: "💵",
    });
  }
  if (reviews90d > 0) {
    const sentiment = positiveReviews90d + negativeReviews90d > 0
      ? `${Math.round((positiveReviews90d / (positiveReviews90d + negativeReviews90d)) * 100)}% positive`
      : "";
    kpis.push({
      label: "Recent Reviews",
      value: formatInteger(reviews90d),
      trend: "",
      sub: sentiment || "Last 90 days",
      icon: "💬",
    });
  }
  if (bestRank) {
    kpis.push({
      label: "Best Rank",
      value: `#${formatInteger(bestRank.value)}`,
      trend: "",
      sub: bestRank.label,
      icon: "🏆",
    });
  }
  if (featuredCountries.length > 0 || featuredPlacements.length > 0) {
    kpis.push({
      label: "Featured Reach",
      value: featuredCountries.length > 0 ? formatInteger(featuredCountries.length) : formatInteger(featuredPlacements.length),
      trend: "",
      sub: featuredCountries.length > 0 ? "countries featured" : "featured placements",
      icon: "🌎",
    });
  }
  if (activeSdks.length > 0) {
    kpis.push({
      label: "Active SDKs",
      value: formatInteger(activeSdks.length),
      trend: "",
      sub: activeSdks.slice(0, 3).join(", "),
      icon: "🧩",
    });
  }

  const financialCards: AppfiguresDerivedFinancialCard[] = [];
  if (estimatedRevenue30d > 0) {
    financialCards.push({ key: "estimated-revenue", label: "Est. Revenue (30d)", value: formatCurrency(estimatedRevenue30d) });
  }
  if (reportedRevenue30d > 0) {
    financialCards.push({ key: "reported-revenue", label: "Reported Revenue", value: formatCurrency(reportedRevenue30d) });
  }
  if (subscriptionMrr > 0) {
    financialCards.push({ key: "subscription-mrr", label: "Subscription MRR", value: formatCurrency(subscriptionMrr) });
  }
  if (paymentsRevenue > 0) {
    financialCards.push({ key: "payments", label: "Payments Revenue", value: formatCurrency(paymentsRevenue) });
  }
  if (adRevenue > 0) {
    financialCards.push({ key: "ad-revenue", label: "Ad Revenue", value: formatCurrency(adRevenue) });
  }
  if (adSpend > 0) {
    financialCards.push({ key: "ad-spend", label: "Ad Spend", value: formatCurrency(adSpend) });
  }

  const charts: AppChart[] = [];
  if (estimateLabels.length > 1) {
    charts.push({
      type: "line",
      title: "Estimated Downloads",
      subtitle: "Appfigures daily estimate, last 14 days",
      labels: estimateLabels,
      datasets: [
        {
          label: "Downloads",
          data: estimateDownloadsSeries,
          color: "#1a1a1a",
        },
      ],
    });
    charts.push({
      type: "line",
      title: "Estimated Revenue",
      subtitle: "Appfigures daily estimate, last 14 days",
      labels: estimateLabels,
      datasets: [
        {
          label: "Revenue (USD)",
          data: estimateRevenueSeries,
          color: "#2d7a4f",
        },
      ],
    });
  }
  if (ratingsLabels.length > 1) {
    charts.push({
      type: "line",
      title: "Total Ratings",
      subtitle: "Cumulative store ratings, last 30 days",
      labels: ratingsLabels,
      datasets: [
        {
          label: "Total ratings",
          data: ratingsTotalSeries,
          color: "#b45309",
        },
      ],
    });
    charts.push({
      type: "bar",
      title: "New Ratings",
      subtitle: "New ratings per day, last 30 days",
      labels: ratingsLabels,
      datasets: [
        {
          label: "New ratings",
          data: ratingsNewSeries,
          color: "#4361ee",
        },
      ],
    });
  }

  const storeSignals: AppfiguresDerivedSignal[] = [];
  if (featuredCountries.length > 0) {
    storeSignals.push({
      key: "featured-countries",
      label: "Featured Countries",
      value: formatInteger(featuredCountries.length),
      sub: featuredCountries.slice(0, 5).join(", "),
    });
  }
  if (featuredPlacements.length > 0) {
    storeSignals.push({
      key: "featured-placements",
      label: "Featured Placements",
      value: formatInteger(featuredPlacements.length),
      sub: featuredPlacements[0] ? `Best #${featuredPlacements[0].position}` : "",
    });
  }
  if (rankedKeywords > 0) {
    storeSignals.push({
      key: "ranked-keywords",
      label: "Ranked Keywords",
      value: formatInteger(rankedKeywords),
      sub: topKeywords25 > 0 ? `${formatInteger(topKeywords25)} in top 25` : "Keyword coverage",
    });
  }
  if (activeSdks.length > 0) {
    storeSignals.push({
      key: "sdk-footprint",
      label: "SDK Footprint",
      value: formatInteger(activeSdks.length),
      sub: activeSdks.slice(0, 4).join(", "),
    });
  }

  return {
    highlights,
    kpis,
    financialCards,
    charts,
    reviews,
    storeSignals,
    featuredPlacements,
    activeSdks,
  };
}
