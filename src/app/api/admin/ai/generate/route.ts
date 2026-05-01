import { NextResponse } from "next/server";
import type { AppRecord } from "@/admin/types";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { readAdminDb } from "@/lib/adminDb";
import { getAppfiguresSnapshot, hasAppfiguresAccess } from "@/lib/appfigures";
import { deriveAppfiguresData } from "@/lib/appfiguresDerived";
import type {
  AppfiguresEndpointKey,
  AppfiguresEndpointResult,
  AppfiguresProductSnapshot,
  AppfiguresSnapshot,
} from "@/lib/appfigures-types";

export const runtime = "nodejs";

type GenerateRequest = {
  fieldLabel?: string;
  fieldPath?: string;
  currentValue?: string;
  instruction?: string;
  app?: AppRecord;
};

type ClaudeResponse = {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
};

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

function getClaudeApiKey(): string {
  return process.env.ANTHROPIC_API_KEY?.trim() || "";
}

function getClaudeModel(): string {
  return process.env.CLAUDE_MODEL?.trim() || "claude-3-5-sonnet-latest";
}

function compactApp(app?: AppRecord | null) {
  if (!app) return null;

  return {
    name: app.meta?.name,
    tagline: app.meta?.tagline,
    description: app.meta?.description,
    category: app.meta?.category,
    platforms: app.meta?.platforms,
    model: app.meta?.model,
    badge: app.meta?.badge,
    askingPrice: app.meta?.askingPrice,
    tags: app.meta?.tags,
    seo: app.seo,
    financials: app.financials,
    kpis: app.kpis,
    product: app.product,
    market: app.market,
    opportunities: app.opportunities,
    contactProcess: app.contact?.processSteps,
  };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function truncate(value: string, maxLength = 220): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned;
}

function endpoint(product: AppfiguresProductSnapshot, key: AppfiguresEndpointKey): AppfiguresEndpointResult | undefined {
  return product.endpoints.find((item) => item.key === key);
}

function endpointData(product: AppfiguresProductSnapshot, key: AppfiguresEndpointKey): unknown {
  const result = endpoint(product, key);
  return result?.ok ? result.data : undefined;
}

function compactEndpointStatuses(product: AppfiguresProductSnapshot) {
  return product.endpoints.map((item) => ({
    key: item.key,
    ok: item.ok,
    status: item.status,
    error: item.ok ? undefined : item.error,
  }));
}

function compactProductAppfigures(product: AppfiguresProductSnapshot) {
  const ratings = asObject(endpointData(product, "ratings"));
  const estimates = asObject(endpointData(product, "estimates"));
  const revenue = asObject(endpointData(product, "revenue"));
  const sales = asObject(endpointData(product, "sales"));
  const reviewCounts = asObject(endpointData(product, "reviewCounts"));
  const subscriptions = asObject(endpointData(product, "subscriptions"));
  const ads = asObject(endpointData(product, "ads"));
  const adspend = asObject(endpointData(product, "adspend"));
  const payments = asObject(endpointData(product, "payments"));
  const aso = asObject(endpointData(product, "aso"));
  const reviewsData = asObject(endpointData(product, "reviews"));
  const ranksData = asObject(endpointData(product, "ranks"));
  const sdkData = asArray(endpointData(product, "sdks"));

  const ranks = asArray(ranksData?.data)
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .slice(0, 5)
    .map((item) => {
      const category = asObject(item.category);
      const positions = asArray(item.positions).map(parseNumber).filter((position) => position > 0);
      return {
        category: category?.name,
        subtype: category?.subtype,
        bestPosition: positions.length ? Math.min(...positions) : undefined,
      };
    });

  const reviews = asArray(reviewsData?.reviews)
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .slice(0, 5)
    .map((item) => ({
      stars: parseNumber(item.stars),
      title: typeof item.title === "string" ? truncate(item.title, 90) : "",
      review: typeof item.review === "string" ? truncate(item.review, 180) : "",
      date: item.date,
      version: item.version,
    }));

  const activeSdks = sdkData
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => item !== null)
    .filter((item) => Boolean(item.active))
    .map((item) => String(item.id || item.name || ""))
    .filter(Boolean)
    .slice(0, 20);

  return {
    product: {
      label: product.product.label,
      store: product.product.store,
      country: product.window.country,
      appfiguresProductId: product.product.appfiguresProductId,
      lookupStatus: product.product.lookupStatus,
    },
    ratings: ratings ? {
      average: ratings.average,
      total: ratings.total,
      stars: ratings.stars,
    } : undefined,
    estimates30d: estimates ? {
      downloads: estimates.downloads,
      revenue: estimates.revenue,
    } : undefined,
    privateReports30d: {
      salesUnits: sales?.units,
      revenueTotal: revenue?.total,
      subscriptionMrr: subscriptions?.mrr,
      adRevenue: ads?.revenue,
      adSpend: adspend?.cost,
      paymentsRevenue: payments?.financial_revenue || payments?.estimated_revenue,
    },
    reviewCounts90d: reviewCounts,
    latestReviews: reviews,
    ranks,
    activeSdks,
    aso: aso ? {
      rankedKeywords: aso.ranked_keywords,
      top25: aso.top_25,
      top10: aso.top_10,
    } : undefined,
    endpointStatuses: compactEndpointStatuses(product),
  };
}

function compactAppfiguresSnapshot(snapshot: AppfiguresSnapshot | null) {
  if (!snapshot) return null;
  const derived = deriveAppfiguresData(snapshot);

  return {
    generatedAt: snapshot.generatedAt,
    products: snapshot.products.map(compactProductAppfigures),
    derived: {
      highlights: derived.highlights,
      kpis: derived.kpis,
      financialCards: derived.financialCards,
      storeSignals: derived.storeSignals,
      featuredPlacements: derived.featuredPlacements.slice(0, 6),
      activeSdks: derived.activeSdks.slice(0, 20),
      reviews: derived.reviews.slice(0, 5).map((review) => ({
        stars: review.stars,
        title: truncate(review.title, 90),
        review: truncate(review.review, 180),
        store: review.store,
        date: review.date,
      })),
    },
  };
}

async function getLiveAppfiguresContext(app?: AppRecord | null) {
  if (!app?.appfigures?.products?.length) {
    return {
      available: false,
      reason: "No Appfigures products are configured for this app.",
    };
  }

  if (!hasAppfiguresAccess()) {
    return {
      available: false,
      reason: "APPFIGURES_TOKEN is not configured, so live Appfigures context was not loaded.",
    };
  }

  try {
    const snapshot = await getAppfiguresSnapshot(app.appfigures);
    const compact = compactAppfiguresSnapshot(snapshot);
    return compact
      ? { available: true, ...compact }
      : { available: false, reason: "Appfigures snapshot was empty." };
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : "Unknown Appfigures context error.",
    };
  }
}

function fieldRules(fieldPath: string, fieldLabel: string): string {
  const path = fieldPath.toLowerCase();
  const label = fieldLabel.toLowerCase();

  if (path.includes("description") && path.includes("meta")) {
    return "Write one polished listing hero paragraph, 28-45 words. Lead with acquisition value, traction, category, and strategic upside. No markdown.";
  }
  if (path.includes("tagline")) {
    return "Write a short marketplace tagline, 2-5 words. No punctuation unless necessary.";
  }
  if (path.includes("badge")) {
    return "Write a compact badge label like 'Acquisition Opportunity · Health & Fitness'. Keep it under 55 characters.";
  }
  if (path.includes("asking")) {
    return "Write a short asking price label. If no valuation data is present, use a neutral phrase like 'Asking price available under NDA'.";
  }
  if (path === "seo.title" || label.includes("seo title")) {
    return "Write one SEO title for this app acquisition page. Keep it search-friendly and ideally under 60 characters. Include the app name and EHVM when natural. No markdown.";
  }
  if (path === "seo.description" || label.includes("seo description")) {
    return "Write one meta description for search/social previews. Keep it under 155 characters. Use only verified traction from the app draft or live Appfigures context. No markdown.";
  }
  if (path.includes("productvision")) {
    return "Write one strategic product vision paragraph, 35-65 words. Make it buyer-facing and specific to the app.";
  }
  if (path.includes("roadmap") && label.includes("title")) {
    return "Write a concise feature title, 3-7 words.";
  }
  if (path.includes("roadmap")) {
    return "Write one feature description sentence, 12-24 words, focused on buyer value and product capability.";
  }
  if (path.includes("opportunit") && label.includes("title")) {
    return "Write a concise growth lever title, 2-6 words.";
  }
  if (path.includes("opportunit")) {
    return "Write 1-2 concise sentences describing an acquirer upside lever with practical business impact. No markdown.";
  }
  if (path.includes("competitor")) {
    return "Write a compact competitor description using the existing EHVM style: product position, traction when known, and market relevance.";
  }
  if (path.includes("process") && label.includes("title")) {
    return "Write a short acquisition process step title, 2-5 words.";
  }
  if (path.includes("process")) {
    return "Write one clear sentence explaining this acquisition process step for buyers.";
  }
  if (path.includes("financial")) {
    return "Write a concise finance-table value or note matching the field label. Use only facts from context; do not invent exact numbers.";
  }
  if (path.includes("kpi")) {
    return "Write a concise KPI field value matching the label. Use only facts from context; do not invent exact numbers.";
  }

  return "Write concise buyer-facing copy for this admin field. Match the EHVM acquisition listing style. No markdown.";
}

async function getCoachifyExample() {
  const db = await readAdminDb();
  return db.apps.find((app) => app.meta?.name?.trim().toLowerCase() === "coachify") || db.apps[0] || null;
}

export async function POST(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = getClaudeApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const fieldLabel = body.fieldLabel?.trim() || "Admin field";
  const fieldPath = body.fieldPath?.trim() || fieldLabel;
  const currentValue = body.currentValue?.trim() || "";
  const [coachify, appfiguresContext] = await Promise.all([
    getCoachifyExample(),
    getLiveAppfiguresContext(body.app),
  ]);

  const userPrompt = [
    `Field label: ${fieldLabel}`,
    `Field path: ${fieldPath}`,
    `Current field value: ${currentValue || "(empty)"}`,
    body.instruction ? `Extra instruction: ${body.instruction.trim()}` : "",
    "",
    "Current app draft JSON:",
    JSON.stringify(compactApp(body.app), null, 2),
    "",
    "Coachify reference listing JSON:",
    JSON.stringify(compactApp(coachify), null, 2),
    "",
    "Live Appfigures context JSON:",
    JSON.stringify(appfiguresContext, null, 2),
    "",
    `Rules for this field: ${fieldRules(fieldPath, fieldLabel)}`,
    "Return only the replacement field text. Do not wrap it in quotes. Do not include explanations.",
  ].filter(Boolean).join("\n");

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: getClaudeModel(),
        max_tokens: 220,
        temperature: 0.7,
        system:
          "You write concise EHVM acquisition marketplace copy for mobile app listings. Match the Coachify example's direct, investor-facing tone. Prefer verified live Appfigures metrics when present, including ratings, reviews, ranks, downloads, revenue, SDKs, ASO, and private reports. Be specific, practical, and credible. Never invent precise financial metrics, ratings, rankings, or buyer claims that are not present in context.",
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const payload = (await response.json()) as ClaudeResponse;
    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error?.message || `Claude request failed with status ${response.status}.` },
        { status: response.status },
      );
    }

    const text = payload.content?.find((item) => item.type === "text" && item.text)?.text?.trim();
    if (!text) {
      return NextResponse.json({ error: "Claude returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown Claude request error." },
      { status: 500 },
    );
  }
}
