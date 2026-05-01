import type { App, NotionPageBlock } from "@/data/apps";
import type { AppRecord } from "@/admin/types";
import type { AppfiguresConfig, AppfiguresProductConfig } from "@/lib/appfigures-types";

export type ParsedAppContent = {
  about?: string;
  appStoreLink?: string;
  playStoreLink?: string;
  screenshotsImage?: string;
  opportunities?: App["opportunities"];
  faqs?: App["faqs"];
  userAcquisition?: App["userAcquisition"];
  notionDetailBlocks?: NonNullable<App["notionDetailBlocks"]>;
  notionPageBlocks?: NonNullable<App["notionPageBlocks"]>;
  contact?: Partial<App["contact"]>;
  highlights?: Partial<App["highlights"]>;
  rating?: number;
};

export type MappedAdminApp = {
  app: App;
  parsedContent: ParsedAppContent;
};

function clean(value?: string): string {
  return value?.trim() || "";
}

function toSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || `app-${Date.now()}`;
}

function parseFloatFromText(value: string): number {
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;
  const parsed = Number.parseFloat(match[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractAppleAppId(url?: string): string | undefined {
  const cleaned = clean(url);
  if (!cleaned) return undefined;
  const match = cleaned.match(/\/id(\d+)/i);
  return match?.[1];
}

function extractGooglePackageName(url?: string): string | undefined {
  const cleaned = clean(url);
  if (!cleaned) return undefined;

  try {
    const parsed = new URL(cleaned);
    return parsed.searchParams.get("id")?.trim() || undefined;
  } catch {
    return undefined;
  }
}

function parsePlatform(platforms: string): { platform: string; emoji: string } {
  const lower = platforms.toLowerCase();
  if (lower.includes("ios") && lower.includes("android")) {
    return { platform: "iOS + Android", emoji: "📱" };
  }
  if (lower.includes("ios")) {
    return { platform: "iOS", emoji: "🔵" };
  }
  if (lower.includes("android")) {
    return { platform: "Android", emoji: "🤖" };
  }
  if (lower.includes("web")) {
    return { platform: "Web", emoji: "🌐" };
  }
  return { platform: platforms || "Unknown", emoji: "📱" };
}

function pickRating(record: AppRecord): { rating: number; label: string } {
  const ratingKpi = record.kpis.find((item) => /rating|star/i.test(item.label));
  if (!ratingKpi) return { rating: 0, label: "Rating" };

  const parsed = parseFloatFromText(`${ratingKpi.value} ${ratingKpi.trend}`);
  return {
    rating: parsed,
    label: clean(ratingKpi.label) || "Rating",
  };
}

function pickFollowers(record: AppRecord): { value: string; label: string } {
  const followersKpi = record.kpis.find((item) => /follower|subscriber|user|install|download/i.test(item.label));
  if (!followersKpi) return { value: "—", label: "Followers" };

  return {
    value: clean(followersKpi.value) || clean(followersKpi.sub) || "—",
    label: clean(followersKpi.label) || "Followers",
  };
}

function buildNotionDbFields(record: AppRecord): NonNullable<App["notionDbFields"]> {
  const fields: NonNullable<App["notionDbFields"]> = [];

  const push = (label: string, value?: string, url?: string) => {
    const cleaned = clean(value);
    if (!cleaned) return;
    fields.push({ label, value: cleaned, url: url || undefined });
  };

  push("Asking", record.meta.askingPrice);
  push("ARR", record.financials.arr);
  push("LTV:CAC", record.financials.ltvCac);
  push("Net Margin", record.financials.netMargin);
  push("YoY Growth", record.financials.yoyGrowth);
  push("Business model", record.meta.model);
  push("Badge", record.meta.badge);
  push("Status", record.status);
  push("Website", record.meta.websiteUrl, record.meta.websiteUrl);
  push("Calendar", record.contact.calendarUrl, record.contact.calendarUrl);
  push("NDA", record.contact.ndaUrl, record.contact.ndaUrl);

  return fields;
}

function toNotionDetailBlocks(blocks: NotionPageBlock[]): NonNullable<App["notionDetailBlocks"]> {
  const detailBlocks: NonNullable<App["notionDetailBlocks"]> = [];

  const visit = (block: NotionPageBlock) => {
    if (block.type === "heading_1" || block.type === "heading_2" || block.type === "heading_3") {
      if (block.value) detailBlocks.push({ type: "heading", value: block.value });
    } else if (block.type === "paragraph" || block.type === "bulleted_list_item" || block.type === "numbered_list_item") {
      if (block.value) detailBlocks.push({ type: "text", value: block.value });
    } else if (block.type === "quote" || block.type === "callout") {
      if (block.value) detailBlocks.push({ type: "quote", value: block.value });
    } else if (block.type === "image") {
      if (block.src) detailBlocks.push({ type: "image", src: block.src });
    } else if (block.type === "divider") {
      detailBlocks.push({ type: "divider" });
    }

    block.children?.forEach(visit);
  };

  blocks.forEach(visit);
  return detailBlocks;
}

function buildPageBlocks(record: AppRecord): NotionPageBlock[] {
  const blocks: NotionPageBlock[] = [];

  if (clean(record.product?.vision)) {
    blocks.push({ type: "heading_2", value: "Product vision" });
    blocks.push({ type: "paragraph", value: clean(record.product.vision) });
  }

  if (record.media.cover) {
    blocks.push({ type: "image", src: record.media.cover });
  }

  if (record.media.screenshots.length > 0) {
    blocks.push({ type: "heading_2", value: "Product gallery" });
    record.media.screenshots.forEach((item) => {
      if (!item.url) return;
      blocks.push({ type: "image", src: item.url });
      if (clean(item.caption)) {
        blocks.push({ type: "paragraph", value: item.caption });
      }
    });
  }

  if ((record.market?.competitors?.length ?? 0) > 0 || (record.market?.keywords?.length ?? 0) > 0) {
    blocks.push({ type: "heading_2", value: "Market context" });

    record.market.competitors.forEach((item) => {
      const appIcon = item.appStoreIcon || '🍎';
      const googleIcon = item.googleStoreIcon || '▶';
      const text = [item.icon, item.name, item.description, item.appStoreRating && `${appIcon}${item.appStoreRating}`, item.googleStoreRating && `${googleIcon}${item.googleStoreRating}`].filter(Boolean).join(" ").trim();
      if (text) blocks.push({ type: "bulleted_list_item", value: text });
    });

    record.market.keywords.forEach((item) => {
      const text = [item.keyword, item.store && `(${item.store})`, item.country && `[${item.country}]`, item.rank].filter(Boolean).join(" ").trim();
      if (text) blocks.push({ type: "bulleted_list_item", value: text });
    });
  }

  if (record.financials.plRows.length > 0) {
    blocks.push({ type: "heading_2", value: "Financial notes" });
    record.financials.plRows.forEach((row) => {
      const rowLine = [row.label, row.amount, row.trend, row.notes].filter(Boolean).join(" • ");
      if (rowLine) blocks.push({ type: "bulleted_list_item", value: rowLine });
    });
  }

  if (record.contact.processSteps.length > 0) {
    blocks.push({ type: "heading_2", value: "Process timeline" });
    record.contact.processSteps.forEach((step) => {
      const children: NotionPageBlock[] = [];
      if (clean(step.note)) {
        children.push({ type: "paragraph", value: step.note });
      }
      if (clean(step.description)) {
        children.push({ type: "paragraph", value: step.description });
      }
      blocks.push({
        type: "toggle",
        value: clean(step.title) || "Step",
        children,
      });
    });
  }

  const externalLinks = [record.meta.websiteUrl, record.meta.appStoreUrl, record.meta.playStoreUrl, record.contact.calendarUrl, record.contact.ndaUrl]
    .map(clean)
    .filter(Boolean);

  if (externalLinks.length > 0) {
    blocks.push({ type: "heading_2", value: "Useful links" });
    externalLinks.forEach((url) => {
      blocks.push({ type: "bookmark", url });
    });
  }

  return blocks;
}

function buildAppfiguresConfig(record: AppRecord): AppfiguresConfig | undefined {
  const defaultCountry = clean(record.appfigures?.defaultCountry).toUpperCase() || "US";
  const products: AppfiguresProductConfig[] = [];

  const configuredApple = record.appfigures?.products.find((item) => item.store === "apple");
  const configuredGoogle = record.appfigures?.products.find((item) => item.store === "google_play");

  const appleStoreProductId = clean(configuredApple?.storeProductId) || extractAppleAppId(record.meta.appStoreUrl);
  const googleStoreProductId = clean(configuredGoogle?.storeProductId) || extractGooglePackageName(record.meta.playStoreUrl);

  if (clean(configuredApple?.productId) || appleStoreProductId) {
    products.push({
      id: configuredApple?.id || "apple",
      label: clean(configuredApple?.label) || "iOS",
      store: "apple",
      productId: clean(configuredApple?.productId) || undefined,
      storeProductId: appleStoreProductId || undefined,
      country: clean(configuredApple?.country).toUpperCase() || defaultCountry,
    });
  }

  if (clean(configuredGoogle?.productId) || googleStoreProductId) {
    products.push({
      id: configuredGoogle?.id || "google_play",
      label: clean(configuredGoogle?.label) || "Android",
      store: "google_play",
      productId: clean(configuredGoogle?.productId) || undefined,
      storeProductId: googleStoreProductId || undefined,
      country: clean(configuredGoogle?.country).toUpperCase() || defaultCountry,
    });
  }

  if (products.length === 0) return undefined;

  return {
    defaultCountry,
    products,
  };
}

function buildSeoFields(record: AppRecord, appName: string): App["seo"] {
  const title = clean(record.seo?.title);
  const description = clean(record.seo?.description);
  const image = clean(record.seo?.image) || clean(record.media.cover) || clean(record.media.icon);
  const fallbackTitle = [appName, clean(record.meta.tagline)].filter(Boolean).join(" - ");
  const fallbackDescription = clean(record.meta.description);

  return {
    title: title || (fallbackTitle ? `${fallbackTitle} | EHVM` : `${appName} | EHVM`),
    description: description || fallbackDescription,
    image: image || undefined,
    noIndex: Boolean(record.seo?.noIndex),
  };
}

export function mapAdminRecordToApp(record: AppRecord): MappedAdminApp {
  const appName = clean(record.meta.name) || "Untitled App";
  const slug = toSlug(clean(record.meta.name) || record.id);
  const { platform, emoji: platformEmoji } = parsePlatform(clean(record.meta.platforms));
  const ratingMeta = pickRating(record);
  const followersMeta = pickFollowers(record);
  const mrr = clean(record.financials.mrr) || "—";
  const about =
    clean(record.meta.description) ||
    `${appName} is listed for acquisition on EHVM.`;
  const screenshotsImage =
    clean(record.media.cover) ||
    clean(record.media.screenshots[0]?.url);
  const opportunities = record.opportunities
    .filter((item) => clean(item.title))
    .map((item) => ({ icon: clean(item.icon) || "🚀", title: clean(item.title)!, description: clean(item.description) || "" }));

  const pageBlocks = buildPageBlocks(record);
  const detailBlocks = toNotionDetailBlocks(pageBlocks);
  const appfigures = buildAppfiguresConfig(record);
  const seo = buildSeoFields(record, appName);

  const app: App = {
    notionPageId: record.id,
    slug,
    name: appName,
    subtitle: clean(record.meta.tagline),
    icon: clean(record.media.icon),
    mrr,
    platform,
    platformEmoji,
    monetizationType: clean(record.meta.model) || undefined,
    hearingOffersStatus: record.status === "published" ? "Published" : "Draft",
    rating: ratingMeta.rating,
    followers: followersMeta.value !== "—" ? followersMeta.value : undefined,
    category: clean(record.meta.category) || "Other",
    about,
    highlights: {
      mrr: mrr !== "—" ? mrr : "—",
      rating: ratingMeta.rating > 0 ? String(ratingMeta.rating) : "—",
      ratingLabel: ratingMeta.label,
      followers: followersMeta.value || "—",
      followersLabel: followersMeta.label,
    },
    screenshotsImage,
    screenshots: record.media.screenshots.map((s) => ({
      url: clean(s.url),
      caption: clean(s.caption),
    })),
    appStoreLink: clean(record.meta.appStoreUrl) || undefined,
    playStoreLink: clean(record.meta.playStoreUrl) || undefined,
    userAcquisition: {
      paid: [],
      organic: [],
    },
    opportunities,
    developerCountry: clean(record.meta.developerCountry) || "Unknown",
    developerFlag: clean(record.meta.developerFlag) || "🌍",
    faqs: record.contact.processSteps
      .filter((step) => clean(step.title))
      .map((step) => ({
        question: clean(step.title),
        answer: [clean(step.note), clean(step.description)].filter(Boolean).join(" — ") || undefined,
      })),
    contact: {
      name: clean(record.contact.name),
      image: clean(record.contact.image),
      email: clean(record.contact.email),
      phone: clean(record.contact.phone),
      title: clean(record.contact.title) || undefined,
      calendarUrl: clean(record.contact.calendarUrl) || undefined,
      ndaUrl: clean(record.contact.ndaUrl) || undefined,
      processSteps: record.contact.processSteps.map((step) => ({
        title: clean(step.title),
        note: clean(step.note),
        description: clean(step.description),
      })),
    },
    featured: record.featured,
    ndaRequired: record.ndaRequired,
    kpis: record.kpis.map((item) => ({
      label: clean(item.label),
      value: clean(item.value),
      trend: clean(item.trend),
      sub: clean(item.sub),
      icon: clean(item.icon),
    })),
    financials: {
      mrr: clean(record.financials.mrr),
      arr: clean(record.financials.arr),
      ltvCac: clean(record.financials.ltvCac),
      netMargin: clean(record.financials.netMargin),
      yoyGrowth: clean(record.financials.yoyGrowth),
      askingMultiple: clean(record.financials.askingMultiple),
      plRows: record.financials.plRows.map((row) => ({
        label: clean(row.label),
        amount: clean(row.amount),
        trend: clean(row.trend),
        notes: clean(row.notes),
        highlight: Boolean(row.highlight),
        icon: row.icon || undefined,
      })),
    },
    charts: (record.charts ?? []).map((chart) => ({
      type: clean(chart.type),
      title: clean(chart.title),
      subtitle: clean(chart.subtitle),
      labels: (Array.isArray(chart.labels) ? chart.labels : []).map((label) => clean(label)).filter(Boolean),
      datasets: chart.datasets.map((dataset) => ({
        label: clean(dataset.label),
        data: (Array.isArray(dataset.data) ? dataset.data : []).filter((value) => Number.isFinite(value)),
        color: clean(dataset.color),
        colors: (dataset as any).colors ? clean((dataset as any).colors) : undefined,
      })),
    })),
    funnel: (record.funnel ?? []).map((step) => ({
      label: clean(step.label),
      value: clean(step.value),
      pct: clean(step.pct),
    })),
    product: {
      vision: clean(record.product?.vision),
      roadmap: (record.product?.roadmap ?? []).map((item) => ({
        status: item.status,
        title: clean(item.title),
        description: clean(item.description),
      })),
    },
    market: {
      tam: clean(record.market?.tam),
      sam: clean(record.market?.sam),
      som: clean(record.market?.som),
      tamLabel: clean(record.market?.tamLabel),
      samLabel: clean(record.market?.samLabel),
      year: clean(record.market?.year),
      competitors: (record.market?.competitors ?? []).map((item) => ({
        icon: clean(item.icon),
        name: clean(item.name),
        description: clean(item.description),
        appStoreRating: clean(item.appStoreRating),
        appStoreIcon: item.appStoreIcon ? clean(item.appStoreIcon) : undefined,
        googleStoreRating: clean(item.googleStoreRating),
        googleStoreIcon: item.googleStoreIcon ? clean(item.googleStoreIcon) : undefined,
        link: clean(item.link),
        isThisApp: Boolean(item.isThisApp),
      })),
      keywords: (record.market?.keywords ?? []).map((item) => ({
        keyword: clean(item.keyword),
        store: clean(item.store),
        country: clean(item.country),
        rank: clean(item.rank),
      })),
    },
    notionDbFields: buildNotionDbFields(record),
    notionDetailBlocks: detailBlocks.length > 0 ? detailBlocks : undefined,
    notionPageBlocks: pageBlocks.length > 0 ? pageBlocks : undefined,
    appfigures,
    dataSources: record.dataSources,
    storeSignals: (record.storeSignals ?? []).filter(s => s.label && s.value).map(s => ({
      label: clean(s.label),
      value: clean(s.value),
      sub: clean(s.sub) || undefined,
    })),
    manualReviews: (record.manualReviews ?? []).filter(r => r.review).map(r => ({
      title: clean(r.title),
      author: clean(r.author),
      productName: clean(r.productName) || undefined,
      stars: Number(r.stars) || 5,
      store: clean(r.store) || 'apple',
      review: clean(r.review),
      date: clean(r.date),
      version: clean(r.version) || undefined,
    })),
    seo,
  };

  return {
    app,
    parsedContent: {
      about,
      appStoreLink: app.appStoreLink,
      playStoreLink: app.playStoreLink,
      screenshotsImage,
      opportunities,
      faqs: app.faqs,
      userAcquisition: app.userAcquisition,
      notionDetailBlocks: app.notionDetailBlocks,
      notionPageBlocks: app.notionPageBlocks,
      contact: app.contact,
      highlights: app.highlights,
      rating: app.rating,
    },
  };
}
