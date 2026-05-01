import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppBySlug, getAppSlugs, getSiteLinks } from "@/lib/data";
import { getAppfiguresSnapshot } from "@/lib/appfigures";
import { deriveAppfiguresData } from "@/lib/appfiguresDerived";
import AppChartsClient from "@/components/AppChartsClient";
import AppfiguresSectionClient from "@/components/AppfiguresSectionClient";
import CalendarEmbed from "@/components/CalendarEmbed";
import NdaGatePortal from "@/components/NdaGatePortal";
import FaqAccordion from "@/components/FaqAccordion";
import HistoryBackLink from "@/components/HistoryBackLink";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://ehvmcapital.com";

function absoluteUrl(value?: string): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${SITE_URL}${value}`;
  return undefined;
}

function truncateMeta(value: string, maxLength: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1).trim()}…` : cleaned;
}

function appSeoTitle(app: NonNullable<Awaited<ReturnType<typeof getAppBySlug>>>): string {
  const configured = app.seo?.title?.trim();
  if (configured) return configured;
  const pieces = [app.name, app.subtitle || app.category].filter(Boolean);
  return `${pieces.join(" - ")} | EHVM`;
}

function appSeoDescription(app: NonNullable<Awaited<ReturnType<typeof getAppBySlug>>>): string {
  const configured = app.seo?.description?.trim();
  if (configured) return configured;
  return truncateMeta(app.about || `${app.name} is listed for acquisition on EHVM.`, 155);
}

function followersEmoji(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes("user")) return "👥";
  if (lower.includes("install")) return "📲";
  if (lower.includes("download")) return "⬇️";
  if (lower.includes("keyword")) return "🔑";
  if (lower.includes("rating")) return "💬";
  if (lower.includes("arppu") || lower.includes("benchmark")) return "📊";
  if (lower.includes("us ")) return "🇺🇸";
  return "📱";
}

function parsePercent(value: string, fallback: number): number {
  const parsed = Number.parseFloat((value || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

function rankColor(rank: string): string {
  const parsed = Number.parseFloat((rank || "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return "var(--color-body)";
  if (parsed <= 5) return "#2d7a4f";
  if (parsed <= 20) return "#b45309";
  return "var(--color-body)";
}

function mergeUniqueByLabel<T extends { label: string }>(primary: T[], secondary: T[]): T[] {
  const seen = new Set(primary.map((item) => item.label.trim().toLowerCase()).filter(Boolean));
  const extra = secondary.filter((item) => {
    const label = item.label.trim().toLowerCase();
    if (!label || seen.has(label)) return false;
    seen.add(label);
    return true;
  });
  return [...primary, ...extra];
}

function mergeUniqueCharts<T extends { title: string }>(primary: T[], secondary: T[]): T[] {
  const seen = new Set(primary.map((item) => item.title.trim().toLowerCase()).filter(Boolean));
  const extra = secondary.filter((item) => {
    const title = item.title.trim().toLowerCase();
    if (!title || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
  return [...primary, ...extra];
}

function formatReviewStars(value: number): string {
  const rounded = Math.max(1, Math.min(5, Math.round(value)));
  return `${"★".repeat(rounded)}${"☆".repeat(5 - rounded)}`;
}

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAppSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
  if (!app) return {};

  const title = appSeoTitle(app);
  const description = appSeoDescription(app);
  const canonical = `${SITE_URL}/apps/${app.slug}`;
  const image = absoluteUrl(app.seo?.image || app.screenshotsImage || app.icon);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "EHVM Apps Capital",
      type: "website",
      images: image ? [{ url: image, alt: `${app.name} app acquisition listing` }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
    robots: app.seo?.noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  };
}

export default async function AppDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [app, siteLinks] = await Promise.all([getAppBySlug(slug), getSiteLinks()]);
  if (!app) notFound();
  const appfiguresSnapshot = await getAppfiguresSnapshot(app.appfigures);
  const appfiguresDerived = deriveAppfiguresData(appfiguresSnapshot);
  const topRating = app.rating > 0 ? String(app.rating) : app.highlights.rating !== "—" ? app.highlights.rating : "";
  const topFollowers = app.followers || (app.highlights.followers !== "—" ? app.highlights.followers : "");
  const highlightItems: Array<{ key: string; emoji: string; value: string; label: string }> = [];

  if (app.highlights.mrr && app.highlights.mrr !== "—") {
    highlightItems.push({
      key: "mrr",
      emoji: "💰",
      value: app.highlights.mrr,
      label: "MRR",
    });
  } else if (app.mrr && app.mrr !== "—") {
    highlightItems.push({
      key: "mrr-alt",
      emoji: "💰",
      value: app.mrr,
      label: "MRR",
    });
  }

  if (topRating) {
    highlightItems.push({
      key: "rating",
      emoji: "⭐",
      value: topRating,
      label: app.highlights.ratingLabel || "Rating",
    });
  }

  if (topFollowers) {
    highlightItems.push({
      key: "followers",
      emoji: followersEmoji(app.highlights.followersLabel),
      value: topFollowers,
      label: app.highlights.followersLabel || "Users",
    });
  }

  if (app.platform) {
    highlightItems.push({
      key: "platform",
      emoji: app.platformEmoji || "📱",
      value: app.platform,
      label: "OS",
    });
  }
  appfiguresDerived.highlights.forEach((item) => {
    const exists = highlightItems.some((existing) => existing.label.trim().toLowerCase() === item.label.trim().toLowerCase());
    if (!exists) {
      highlightItems.push(item);
    }
  });

  const dsKpis = app.dataSources?.kpis || 'auto';
  const dsCharts = app.dataSources?.charts || 'auto';
  const dsFinancials = app.dataSources?.financials || 'auto';

  const manualKpis = (app.kpis || []).filter((item) => item.label || item.value);
  const kpis =
    dsKpis === 'manual' ? manualKpis :
    dsKpis === 'live' ? appfiguresDerived.kpis :
    mergeUniqueByLabel(manualKpis, appfiguresDerived.kpis);

  const manualFinancialSummary = [
    { key: "mrr", label: "MRR", value: app.financials?.mrr || "" },
    { key: "arr", label: "ARR", value: app.financials?.arr || "" },
    { key: "ltvcac", label: "LTV : CAC", value: app.financials?.ltvCac || "" },
    { key: "margin", label: "Net Margin", value: app.financials?.netMargin || "" },
    { key: "yoy", label: "YoY Growth", value: app.financials?.yoyGrowth || "" },
    { key: "multiple", label: "Asking Multiple", value: app.financials?.askingMultiple || "" },
  ].filter((item) => item.value);
  const financialSummary = dsFinancials === 'live' ? [] : manualFinancialSummary;
  const appfiguresFinancialSummary = dsFinancials === 'manual' ? [] : appfiguresDerived.financialCards.filter((item) => {
    const label = item.label.trim().toLowerCase();
    return !financialSummary.some((existing) => existing.label.trim().toLowerCase() === label);
  });
  const plRows = (app.financials?.plRows || []).filter((row) => row.label || row.amount || row.notes);

  const manualCharts = (app.charts || []).filter((chart) => chart.labels.length > 0 && chart.datasets.length > 0);
  const charts =
    dsCharts === 'manual' ? manualCharts :
    dsCharts === 'live' ? appfiguresDerived.charts :
    mergeUniqueCharts(manualCharts, appfiguresDerived.charts);
  const funnel = (app.funnel || []).filter((step) => step.label || step.value || step.pct);
  const roadmap = (app.product?.roadmap || []).filter((item) => item.title || item.description);
  const hasProductSection = Boolean(app.product?.vision || roadmap.length > 0);
  const marketStats = [
    { key: "tam", label: "TAM", value: app.market?.tam || "", sub: app.market?.tamLabel || "" },
    { key: "sam", label: "SAM", value: app.market?.sam || "", sub: app.market?.samLabel || "" },
    { key: "som", label: "SOM", value: app.market?.som || "", sub: app.market?.year ? `Year ${app.market.year}` : "" },
  ].filter((item) => item.value);
  const competitors = (app.market?.competitors || []).filter((item) => item.name || item.description || item.appStoreRating || item.googleStoreRating);
  const keywords = (app.market?.keywords || []).filter((item) => item.keyword || item.store || item.rank);
  const hasMarketSection = marketStats.length > 0 || competitors.length > 0 || keywords.length > 0;
  const hasStoreIntelligence =
    appfiguresDerived.storeSignals.length > 0 ||
    appfiguresDerived.featuredPlacements.length > 0 ||
    appfiguresDerived.activeSdks.length > 0;
  const processSteps = (app.contact.processSteps || []).filter((step) => step.title || step.note || step.description);
  const processTitles = new Set(
    processSteps.map((step) => step.title.trim().toLowerCase()).filter(Boolean),
  );
  const visibleFaqs = (app.faqs || []).filter((faq) => {
    const question = faq.question.trim().toLowerCase();
    if (!question) return false;
    return !processTitles.has(question);
  });

  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="ehvm-slide-up bg-card relative flex flex-col gap-[20px] items-start p-[15px] rounded-card w-full max-w-[500px] lg:max-w-[960px]">

        {/* Close button – top-right of card */}
        <HistoryBackLink href="/apps" className="absolute top-[15px] right-[15px] flex size-[20px] items-center justify-center rounded-full shrink-0 no-underline z-10" style={{ background: '#6e6e73' }}>
          <svg width="8" height="8" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L6 6M6 1L1 6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </HistoryBackLink>

        {/* ── TOP SECTION: 2-col on PC ── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-[30px] items-start">

          {/* Left column */}
          <div className="flex flex-col gap-[20px]">

            {/* Icon + Name row */}
            <div className="flex items-center gap-[16px] min-w-0 pr-[30px]">
              {app.icon ? (
                <div className="relative shrink-0 size-[80px] rounded-icon shadow-icon overflow-hidden">
                  <Image src={app.icon} alt={app.name} fill unoptimized className="object-cover" sizes="80px" />
                </div>
              ) : (
                <div className="shrink-0 size-[80px] rounded-icon bg-tag flex items-center justify-center text-[28px]">📱</div>
              )}
              <p className="font-bold text-[28px] leading-[1.15] min-w-0">{app.name}</p>
            </div>

            {/* Store buttons */}
            {(app.appStoreLink || app.playStoreLink) && (
              <div className="flex flex-wrap gap-[10px] items-start">
                {app.appStoreLink && (
                  <a href={app.appStoreLink} target="_blank" rel="noopener noreferrer" className="flex gap-[8px] items-center justify-center px-[18px] py-[10px] rounded-pill text-[15px] font-medium no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
                    App Store
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
                {app.playStoreLink && (
                  <a href={app.playStoreLink} target="_blank" rel="noopener noreferrer" className="flex gap-[8px] items-center justify-center px-[18px] py-[10px] rounded-pill text-[15px] font-medium no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
                    Play Store
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* About */}
            <p className="text-[17px] leading-[1.6]">
              {app.about}
            </p>

            {/* Developer Country */}
            {app.developerCountry && app.developerCountry !== "Unknown" && (
              <p className="text-[17px] leading-[1.4]">
                {app.developerCountry} {app.developerFlag}
              </p>
            )}

            {/* Highlights (mobile only – shown on mobile, hidden on PC since no highlights box in design) */}
            {highlightItems.length > 0 && (
              <div className="flex flex-col gap-[12px] w-full leading-[1.2] lg:hidden">
                <p className="font-bold text-[20px]">Highlights</p>
                <div className="flex items-start justify-between w-full text-center gap-[8px]">
                  {highlightItems.slice(0, 3).map((item) => (
                    <div key={item.key} className="flex flex-[1_0_0] flex-col gap-[6px] items-center text-center min-w-0">
                      <div className="font-bold text-[20px] leading-[1.2] min-w-0">
                        {item.emoji ? <p>{item.emoji}</p> : null}
                        <p className="break-words">{item.value}</p>
                      </div>
                      <p className="text-[12px] text-muted leading-[1.2] break-words">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>{/* end left column */}

          {/* Right column: screenshots */}
          <div className="w-full">
            {app.screenshots && app.screenshots.length > 0 ? (
              <div className="grid grid-cols-4 gap-[10px] w-full">
                {app.screenshots.slice(0, 4).map((screenshot, index) => (
                  <div key={index} className="relative w-full aspect-[9/19] rounded-[16px] overflow-hidden">
                    <Image
                      src={screenshot.url}
                      alt={screenshot.caption || `App screenshot ${index + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative w-full aspect-[1592/820] rounded-icon overflow-hidden">
                {app.screenshotsImage ? (
                  <Image
                    src={app.screenshotsImage}
                    alt="App screenshots"
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 500px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-tag flex items-center justify-center text-[17px] text-muted">
                    No screenshots uploaded
                  </div>
                )}
              </div>
            )}
          </div>{/* end right column */}

        </div>{/* end top 2-col grid */}

        {/* ── LOCKED CONTENT: blurred NDA gate ── */}
        <div className="relative w-full">
          <div className="flex flex-col gap-[20px] w-full" style={app.ndaRequired ? { filter: "blur(5px)", opacity: 0.7, pointerEvents: "none", userSelect: "none" } : {}}>

        {/* ── KPI + FUNNEL: 2-col on PC ── */}
        {(kpis.length > 0 || funnel.length > 0) && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-[20px] items-start">
            {kpis.length > 0 && (
              <div className="flex flex-col gap-[12px] w-full">
                <p className="font-bold text-[20px] leading-[1.2]">KPI Cards</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] w-full">
                  {kpis.map((item, index) => {
                    const isRating = /star|rating/i.test(item.icon || "") || /rating/i.test(item.label);
                    const cleanValue = (item.value || "—").replace(/\s*[⭐★]\s*/g, "").trim();
                    return (
                    <div key={`${item.label}-${index}`} className="rounded-[24px] flex flex-col" style={{ background: "#F5F5F7", padding: "18px 20px 20px", gap: 0, boxShadow: "0px 1.01px 2.02px -1.01px #0000001A, 0px 1.01px 3.03px 0px #0000001A" }}>
                      {/* Icon + label row */}
                      <div className="flex items-start gap-[8px]" style={{ marginBottom: 12 }}>
                        {isRating ? (
                          <svg width="24" height="24" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ marginTop: 1 }}>
                            <path d="M19.3781 3.85888C19.4518 3.71001 19.5656 3.58469 19.7067 3.49708C19.8479 3.40946 20.0107 3.36304 20.1768 3.36304C20.3429 3.36304 20.5057 3.40946 20.6468 3.49708C20.7879 3.58469 20.9018 3.71001 20.9755 3.85888L24.8596 11.7263C25.1155 12.2442 25.4932 12.6922 25.9603 13.0319C26.4274 13.3716 26.97 13.5929 27.5415 13.6768L36.2278 14.948C36.3924 14.9718 36.547 15.0412 36.6742 15.1484C36.8014 15.2555 36.896 15.3961 36.9475 15.5543C36.9989 15.7125 37.0051 15.8818 36.9652 16.0433C36.9254 16.2048 36.8412 16.3519 36.7221 16.468L30.4403 22.5851C30.026 22.9888 29.716 23.4871 29.5371 24.0372C29.3581 24.5873 29.3155 25.1726 29.4129 25.7428L30.8959 34.3854C30.925 34.5499 30.9072 34.7193 30.8447 34.8742C30.7821 35.029 30.6772 35.1632 30.5421 35.2614C30.4069 35.3596 30.2469 35.4178 30.0802 35.4294C29.9136 35.441 29.747 35.4055 29.5996 35.327L21.8347 31.2445C21.323 30.9758 20.7538 30.8354 20.1759 30.8354C19.5981 30.8354 19.0288 30.9758 18.5172 31.2445L10.754 35.327C10.6066 35.405 10.4402 35.4401 10.2739 35.4283C10.1075 35.4165 9.94778 35.3582 9.81289 35.2601C9.678 35.162 9.57335 35.028 9.51084 34.8734C9.44833 34.7187 9.43047 34.5497 9.45929 34.3854L10.9406 25.7445C11.0385 25.174 10.9961 24.5883 10.8171 24.0379C10.6381 23.4875 10.3279 22.9889 9.91328 22.5851L3.63143 16.4697C3.51137 16.3537 3.42628 16.2063 3.38588 16.0444C3.34547 15.8824 3.35137 15.7124 3.40289 15.5536C3.45441 15.3948 3.54949 15.2537 3.6773 15.1463C3.8051 15.039 3.96049 14.9697 4.12577 14.9463L12.8104 13.6768C13.3825 13.5936 13.9258 13.3726 14.3936 13.0328C14.8614 12.693 15.2396 12.2447 15.4957 11.7263L19.3781 3.85888Z" stroke="#9810FA" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ marginTop: 1 }}>
                            <path d="M36.9911 11.77L22.6988 26.0622L14.2917 17.6551L3.3623 28.5844" stroke="#00A63E" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M26.9023 11.77H36.991V21.8586" stroke="#00A63E" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        <p className="text-[11px] uppercase tracking-[0.08em] font-bold leading-[1.35]" style={{ color: "#111" }}>{item.label}</p>
                      </div>
                      {/* Value + trend + sub */}
                      <div className="flex flex-col gap-[8px]">
                      {isRating ? (
                        <div className="flex items-center gap-[8px]">
                          <p className="font-bold leading-[1.05]" style={{ fontSize: 42 }}>{cleanValue}</p>
                          <svg width="30" height="30" viewBox="0 0 41 41" fill="#9810FA" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19.3781 3.85888C19.4518 3.71001 19.5656 3.58469 19.7067 3.49708C19.8479 3.40946 20.0107 3.36304 20.1768 3.36304C20.3429 3.36304 20.5057 3.40946 20.6468 3.49708C20.7879 3.58469 20.9018 3.71001 20.9755 3.85888L24.8596 11.7263C25.1155 12.2442 25.4932 12.6922 25.9603 13.0319C26.4274 13.3716 26.97 13.5929 27.5415 13.6768L36.2278 14.948C36.3924 14.9718 36.547 15.0412 36.6742 15.1484C36.8014 15.2555 36.896 15.3961 36.9475 15.5543C36.9989 15.7125 37.0051 15.8818 36.9652 16.0433C36.9254 16.2048 36.8412 16.3519 36.7221 16.468L30.4403 22.5851C30.026 22.9888 29.716 23.4871 29.5371 24.0372C29.3581 24.5873 29.3155 25.1726 29.4129 25.7428L30.8959 34.3854C30.925 34.5499 30.9072 34.7193 30.8447 34.8742C30.7821 35.029 30.6772 35.1632 30.5421 35.2614C30.4069 35.3596 30.2469 35.4178 30.0802 35.4294C29.9136 35.441 29.747 35.4055 29.5996 35.327L21.8347 31.2445C21.323 30.9758 20.7538 30.8354 20.1759 30.8354C19.5981 30.8354 19.0288 30.9758 18.5172 31.2445L10.754 35.327C10.6066 35.405 10.4402 35.4401 10.2739 35.4283C10.1075 35.4165 9.94778 35.3582 9.81289 35.2601C9.678 35.162 9.57335 35.028 9.51084 34.8734C9.44833 34.7187 9.43047 34.5497 9.45929 34.3854L10.9406 25.7445C11.0385 25.174 10.9961 24.5883 10.8171 24.0379C10.6381 23.4875 10.3279 22.9889 9.91328 22.5851L3.63143 16.4697C3.51137 16.3537 3.42628 16.2063 3.38588 16.0444C3.34547 15.8824 3.35137 15.7124 3.40289 15.5536C3.45441 15.3948 3.54949 15.2537 3.6773 15.1463C3.8051 15.039 3.96049 14.9697 4.12577 14.9463L12.8104 13.6768C13.3825 13.5936 13.9258 13.3726 14.3936 13.0328C14.8614 12.693 15.2396 12.2447 15.4957 11.7263L19.3781 3.85888Z"/>
                          </svg>
                        </div>
                      ) : (
                        <p className="font-bold leading-[1.05]" style={{ fontSize: 42 }}>{item.value || "—"}</p>
                      )}
                      {/* Trend */}
                      {item.trend ? (
                        isRating ? (
                          <div className="flex items-center gap-[6px]">
                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M13.0116 10.8368L14.2853 18.0048C14.2996 18.0892 14.2878 18.1759 14.2514 18.2534C14.215 18.3309 14.1559 18.3954 14.0818 18.4384C14.0078 18.4814 13.9224 18.5007 13.8371 18.4938C13.7517 18.4869 13.6705 18.4542 13.6043 18.3999L10.5946 16.1409C10.4493 16.0323 10.2728 15.9737 10.0914 15.9737C9.91004 15.9737 9.73353 16.0323 9.58823 16.1409L6.57342 18.3991C6.50727 18.4532 6.42617 18.4859 6.34095 18.4928C6.25573 18.4997 6.17044 18.4805 6.09645 18.4376C6.02245 18.3948 5.96329 18.3304 5.92684 18.2531C5.89038 18.1757 5.87838 18.0891 5.89243 18.0048L7.16528 10.8368" stroke="#9810FA" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M10.0892 11.77C12.8751 11.77 15.1335 9.51161 15.1335 6.72571C15.1335 3.93981 12.8751 1.6814 10.0892 1.6814C7.30334 1.6814 5.04492 3.93981 5.04492 6.72571C5.04492 9.51161 7.30334 11.77 10.0892 11.77Z" stroke="#9810FA" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p className="text-[13px] font-medium" style={{ color: "#111" }}>{item.trend}</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-[5px]">
                            <svg width="16" height="16" viewBox="0 0 41 41" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M36.9911 11.77L22.6988 26.0622L14.2917 17.6551L3.3623 28.5844" stroke="#00A63E" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M26.9023 11.77H36.991V21.8586" stroke="#00A63E" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p className="text-[14px] font-medium" style={{ color: "#34a853" }}>{item.trend.replace(/^[↑↗]\s*/, "")}</p>
                          </div>
                        )
                      ) : null}
                      {/* Sub */}
                      {item.sub ? (
                        isRating ? (
                          <div className="flex items-center gap-[6px]">
                            <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M9.24724 15.9737C12.9618 15.9737 15.973 12.9625 15.973 9.24797C15.973 5.53344 12.9618 2.52222 9.24724 2.52222C5.53271 2.52222 2.52148 5.53344 2.52148 9.24797C2.52148 12.9625 5.53271 15.9737 9.24724 15.9737Z" stroke="#1447E6" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M17.6542 17.6551L14.0391 14.04" stroke="#1447E6" strokeWidth="1.68144" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <p className="text-[13px]" style={{ color: "#111" }}>{item.sub}</p>
                          </div>
                        ) : (
                          <p className="text-[14px]" style={{ color: "#111" }}>{item.sub}</p>
                        )
                      ) : null}
                      </div>{/* end bottom group */}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

        {(financialSummary.length > 0 || appfiguresFinancialSummary.length > 0 || plRows.length > 0) && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Financial Snapshot</p>
            {financialSummary.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] w-full">
                {financialSummary.map((item) => (
                  <div key={item.key} className="rounded-[16px] p-[12px]" style={{ background: "#F5F5F7" }}>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                    <p className="font-bold text-[20px] leading-[1.1] mt-[4px] break-words">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
            {appfiguresFinancialSummary.length > 0 && (
              <div className="flex flex-col gap-[8px]">
                <p className="text-[11px] uppercase tracking-[0.08em] text-caption">Appfigures</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] w-full">
                  {appfiguresFinancialSummary.map((item) => (
                    <div key={item.key} className="rounded-[16px] p-[12px]" style={{ background: "#F5F5F7" }}>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                      <p className="font-bold text-[20px] leading-[1.1] mt-[4px] break-words">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plRows.length > 0 && (
              <div className="rounded-[20px] overflow-hidden w-full" style={{ background: "#F5F5F7", boxShadow: "0px 1.01px 2.02px -1.01px #0000001A, 0px 1.01px 3.03px 0px #0000001A" }}>
                {/* Header */}
                <div className="grid px-[20px] py-[12px]" style={{ gridTemplateColumns: "1fr auto auto auto", gap: "0 16px" }}>
                  <span className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#999" }}>Metric</span>
                  <span className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#999" }}>Amount</span>
                  <span className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#999" }}>Trend</span>
                  <span className="text-[11px] uppercase tracking-[0.08em] font-semibold" style={{ color: "#999" }}>Notes</span>
                </div>
                {/* Rows */}
                {plRows.map((row, index) => (
                  <div key={`${row.label}-${index}`} className="grid px-[20px] py-[20px] items-center" style={{ gridTemplateColumns: "1fr auto auto auto", gap: "0 16px", borderTop: "1px solid #000" }}>
                    {/* Metric: icon + label */}
                    <div className="flex items-center gap-[10px] min-w-0">
                      {row.icon && (
                        <span className="shrink-0" dangerouslySetInnerHTML={{ __html: row.icon }} />
                      )}
                      <span className="text-[14px] truncate" style={{ fontWeight: row.highlight ? 700 : 400 }}>{row.label || "—"}</span>
                    </div>
                    {/* Amount */}
                    <span className="text-[14px] font-bold whitespace-nowrap" style={{ fontWeight: row.highlight ? 700 : 600 }}>{row.amount || "—"}</span>
                    {/* Trend */}
                    <span className="text-[13px] whitespace-nowrap" style={{ color: /^↑/.test(row.trend || "") ? "#00A63E" : "#999", fontWeight: /^↑/.test(row.trend || "") ? 500 : 400 }}>
                      {row.trend || "—"}
                    </span>
                    {/* Notes */}
                    <span className="text-[13px]" style={{ color: "#999" }}>{row.notes || ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

            {funnel.length > 0 && (
              <div className="flex flex-col gap-[12px] w-full">
                <p className="font-bold text-[20px] leading-[1.2]">Conversion Funnel</p>
                <div className="bg-tag rounded-[16px] p-[12px] flex flex-col gap-[8px]">
                  {funnel.map((step, index) => {
                    const percent = parsePercent(step.pct, Math.max(20, 100 - index * 14));
                    return (
                      <div key={`${step.label}-${index}`} className="flex items-center gap-[8px]">
                        <p className="w-[102px] text-[11px] text-body text-right truncate">{step.label}</p>
                        <div className="flex-1 h-[24px] rounded-[10px] bg-card overflow-hidden">
                          <div
                            className="h-full rounded-[10px] bg-primary text-primary-text text-[11px] px-[8px] flex items-center"
                            style={{ width: `${percent}%`, minWidth: "38px" }}
                          >
                            {step.value || "—"}
                          </div>
                        </div>
                        <p className="w-[42px] text-[11px] font-bold text-right">{step.pct || "—"}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}{/* end KPI + Funnel 2-col grid */}

        {charts.length > 0 && <AppChartsClient charts={charts} />}

        {hasProductSection && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Product Roadmap</p>
            {app.product?.vision ? (
              <div className="bg-tag rounded-[16px] p-[12px] text-[14px] leading-[1.5] text-body">
                {app.product.vision}
              </div>
            ) : null}
            {roadmap.length > 0 && (
              <div className="bg-tag rounded-[16px] p-[12px] flex flex-col">
                {roadmap.map((item, index) => (
                  <div
                    key={`${item.title}-${index}`}
                    className={`py-[10px] ${index > 0 ? "border-t border-divider" : ""}`}
                  >
                    <p className="text-[10px] uppercase tracking-[0.08em] text-caption">
                      {item.status === "done" ? "Shipped" : item.status === "progress" ? "In Progress" : "Planned"}
                    </p>
                    <p className="font-bold text-[14px] mt-[4px]">{item.title || "Untitled"}</p>
                    {item.description ? (
                      <p className="text-[12px] text-body mt-[3px]">{item.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {hasMarketSection && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Market Overview</p>
            {marketStats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[10px] w-full">
                {marketStats.map((item) => (
                  <div key={item.key} className="rounded-[16px] p-[12px]" style={{ background: "#F5F5F7" }}>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                    <p className="font-bold text-[18px] mt-[4px]">{item.value}</p>
                    {item.sub ? <p className="text-[11px] text-caption mt-[2px]">{item.sub}</p> : null}
                  </div>
                ))}
              </div>
            )}
            {competitors.length > 0 && (
              <div className="bg-tag rounded-[16px] p-[12px] flex flex-col">
                <p className="font-bold text-[14px]">Competitive Landscape</p>
                {competitors.map((item, index) => (
                  <div key={`${item.name}-${index}`} className={`py-[10px] ${index > 0 ? "border-t border-divider" : ""} flex items-center gap-[10px]`}>
                    <div className="size-[32px] rounded-[10px] bg-card flex items-center justify-center text-[16px] shrink-0">
                      {item.icon || "📱"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold truncate">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="no-underline hover:underline">{item.name || "Unnamed"}</a>
                        ) : (item.name || "Unnamed")}
                        {item.isThisApp ? (
                          <span className="ml-[6px] text-[10px] text-[#2d7a4f] bg-[#e8f5ee] px-[6px] py-[2px] rounded-pill">This app</span>
                        ) : null}
                      </p>
                      {item.description ? <p className="text-[11px] text-caption">{item.description}</p> : null}
                    </div>
                    <div className="flex flex-col items-end gap-[3px] shrink-0">
                      {item.appStoreRating ? (
                        <span className="bg-card px-[8px] py-[2px] rounded-pill text-[11px]">{item.appStoreIcon || '🍎'} {item.appStoreRating}</span>
                      ) : null}
                      {item.googleStoreRating ? (
                        <span className="bg-card px-[8px] py-[2px] rounded-pill text-[11px]">{item.googleStoreIcon || '▶'} {item.googleStoreRating}</span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {keywords.length > 0 && (
              <div className="bg-tag rounded-[16px] p-[12px] flex flex-col">
                <p className="font-bold text-[14px]">Keyword Rankings</p>
                {keywords.map((item, index) => (
                  <div key={`${item.keyword}-${index}`} className={`py-[8px] ${index > 0 ? "border-t border-divider" : ""} flex items-center gap-[8px]`}>
                    <p className="text-[12px] flex-1 truncate">{item.keyword || "—"}</p>
                    <p className="text-[11px] text-caption w-[60px] text-right truncate">{item.store || "—"}</p>
                    <p className="text-[11px] text-caption w-[28px] text-right">{item.country || "—"}</p>
                    <p className="text-[11px] w-[36px] text-right font-bold" style={{ color: rankColor(item.rank) }}>
                      {item.rank || "—"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Store Intelligence + Appfigures Intelligence side by side */}
        {(hasStoreIntelligence || (app.storeSignals?.length ?? 0) > 0 || !!app.appfigures?.products.length) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] w-full items-start">
            {/* Left: Store Intelligence */}
            {(hasStoreIntelligence || (app.storeSignals?.length ?? 0) > 0) && (
              <div className="flex flex-col gap-[12px]">
                <p className="font-bold text-[20px] leading-[1.2]">Store Intelligence</p>
                {/* Manual signals */}
                {(app.storeSignals?.length ?? 0) > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] w-full">
                    {app.storeSignals!.map((item, i) => (
                      <div key={i} className="rounded-[16px] p-[12px]" style={{ background: "#F5F5F7" }}>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                        <p className="font-bold text-[18px] mt-[4px]">{item.value}</p>
                        {item.sub ? <p className="text-[11px] text-caption mt-[2px]">{item.sub}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
                {/* Appfigures signals */}
                {appfiguresDerived.storeSignals.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] w-full">
                    {appfiguresDerived.storeSignals.map((item) => (
                      <div key={item.key} className="rounded-[16px] p-[12px]" style={{ background: "#F5F5F7" }}>
                        <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                        <p className="font-bold text-[18px] mt-[4px]">{item.value}</p>
                        {item.sub ? <p className="text-[11px] text-caption mt-[2px]">{item.sub}</p> : null}
                      </div>
                    ))}
                  </div>
                )}
                {appfiguresDerived.featuredPlacements.length > 0 && (
                  <div className="rounded-[16px] p-[12px] flex flex-col" style={{ background: "#F5F5F7" }}>
                    <p className="font-bold text-[14px]">Featured Placements</p>
                    {appfiguresDerived.featuredPlacements.map((item, index) => (
                      <div key={item.id} className={`py-[10px] ${index > 0 ? "border-t border-divider" : ""} flex items-center gap-[10px]`}>
                        <div className="size-[32px] rounded-[10px] bg-card flex items-center justify-center text-[14px] shrink-0">
                          #{item.position}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold">{item.title}</p>
                          <p className="text-[11px] text-caption">{item.category} · {item.viewedFrom} · {item.country}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {appfiguresDerived.activeSdks.length > 0 && (
                  <div className="rounded-[16px] p-[12px] flex flex-col gap-[10px]" style={{ background: "#F5F5F7" }}>
                    <p className="font-bold text-[14px]">SDK Footprint</p>
                    <div className="flex flex-wrap gap-[8px]">
                      {appfiguresDerived.activeSdks.map((sdk) => (
                        <span key={sdk} className="bg-card px-[10px] py-[5px] rounded-pill text-[11px]">
                          {sdk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Right: Appfigures Intelligence */}
            {app.appfigures?.products.length ? (
              <AppfiguresSectionClient slug={app.slug} />
            ) : null}
          </div>
        )}

        {/* Recent Store Reviews — full width */}
        {(appfiguresDerived.reviews.length > 0 || (app.manualReviews?.length ?? 0) > 0) && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Recent Store Reviews</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px] w-full">
              {/* Manual reviews */}
              {(app.manualReviews ?? []).map((review, i) => (
                <div key={`manual-${i}`} className="rounded-[16px] p-[12px] flex flex-col gap-[8px]" style={{ background: "#F5F5F7" }}>
                  <div className="flex items-start justify-between gap-[10px]">
                    <div>
                      <p className="font-bold text-[14px] leading-[1.2]">{review.title || "Review"}</p>
                      <p className="text-[11px] text-caption mt-[2px]">
                        {review.author}{review.productName ? ` · ${review.productName}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold">{formatReviewStars(review.stars)}</p>
                      <p className="text-[10px] text-caption">{review.store === 'apple' ? 'apple' : 'google'}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-body leading-[1.45]">{review.review}</p>
                  <p className="text-[10px] text-caption">
                    {review.date ? new Date(review.date).toLocaleDateString() : ""}{review.version ? ` · v${review.version}` : ""}
                  </p>
                </div>
              ))}
              {/* Appfigures reviews */}
              {appfiguresDerived.reviews.map((review) => (
                <div key={review.id} className="rounded-[16px] p-[12px] flex flex-col gap-[8px]" style={{ background: "#F5F5F7" }}>
                  <div className="flex items-start justify-between gap-[10px]">
                    <div>
                      <p className="font-bold text-[14px] leading-[1.2]">{review.title || "Review"}</p>
                      <p className="text-[11px] text-caption mt-[2px]">
                        {review.author} · {review.productName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[13px] font-bold">{formatReviewStars(review.stars)}</p>
                      <p className="text-[10px] text-caption">{review.store}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-body leading-[1.45]">{review.review}</p>
                  <p className="text-[10px] text-caption">
                    {new Date(review.date).toLocaleDateString()} {review.version ? `· v${review.version}` : ""}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USER ACQUISITION + OPPORTUNITIES: 2-col on PC ── */}
        {(app.userAcquisition.paid.length > 0 || app.userAcquisition.organic.length > 0 || app.opportunities.length > 0) && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-[20px] items-start">

        {/* User Acquisition */}
        {(app.userAcquisition.paid.length > 0 || app.userAcquisition.organic.length > 0) && (
          <div className="flex flex-col gap-[10px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">User Acquisition</p>

            {app.userAcquisition.paid.length > 0 && (
              <>
                <p className="font-bold text-[17px] h-[40px] flex items-center">Paid</p>
                {app.userAcquisition.paid.map((ch) => (
                  <div key={ch.name} className="flex gap-[18px] h-[75px] items-center w-full">
                    {ch.link ? (
                      <a href={ch.link} target="_blank" rel="noopener noreferrer" className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} unoptimized className="object-contain" />
                      </a>
                    ) : (
                      <div className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} unoptimized className="object-contain" />
                      </div>
                    )}
                    <div className="flex flex-[1_0_0] items-center justify-between">
                      <div className="flex flex-col gap-[5px] leading-[1.2]">
                        <p className="text-[17px]">{ch.name}</p>
                        <p className="text-[12px]">{ch.subtitle}</p>
                      </div>
                      {ch.link ? (
                        <a href={ch.link} target="_blank" rel="noopener noreferrer" className={`flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 no-underline ${ch.metricStyle === "dark" ? "bg-primary" : "bg-tag"}`}>
                          <span className={`text-[12px] leading-[1.2] ${ch.metricStyle === "dark" ? "text-primary-text" : "text-foreground"}`}>{ch.metric}</span>
                        </a>
                      ) : (
                        <div className={`flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 ${ch.metricStyle === "dark" ? "bg-primary" : "bg-tag"}`}>
                          <span className={`text-[12px] leading-[1.2] ${ch.metricStyle === "dark" ? "text-primary-text" : "text-foreground"}`}>{ch.metric}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}

            {app.userAcquisition.organic.length > 0 && (
              <>
                <p className="font-bold text-[17px] h-[40px] flex items-center">Organic</p>
                {app.userAcquisition.organic.map((ch) => (
                  <div key={ch.name} className="flex gap-[18px] h-[75px] items-center w-full">
                    {ch.link ? (
                      <a href={ch.link} target="_blank" rel="noopener noreferrer" className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} unoptimized className="object-contain" />
                      </a>
                    ) : (
                      <div className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} unoptimized className="object-contain" />
                      </div>
                    )}
                    <div className="flex flex-[1_0_0] items-center justify-between">
                      <div className="flex flex-col gap-[5px] leading-[1.2]">
                        <p className="text-[17px]">{ch.name}</p>
                        <p className="text-[12px]">{ch.subtitle}</p>
                      </div>
                      {ch.link ? (
                        <a href={ch.link} target="_blank" rel="noopener noreferrer" className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 no-underline">
                          <span className="text-[12px] leading-[1.2] text-foreground">{ch.metric}</span>
                        </a>
                      ) : (
                        <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
                          <span className="text-[12px] leading-[1.2]">{ch.metric}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Opportunities */}
        {app.opportunities.length > 0 && (
          <div className="flex flex-col gap-[10px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Opportunities</p>
            <div className="bg-tag rounded-[16px] p-[12px] flex flex-col">
              {app.opportunities.map((opp, i) => (
                <div key={i} className={`py-[10px] ${i > 0 ? "border-t border-divider" : ""} flex items-center gap-[10px]`}>
                  <div className="size-[32px] rounded-[10px] bg-card flex items-center justify-center text-[16px] shrink-0">
                    {opp.icon || "🚀"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold">{opp.title}</p>
                    {opp.description ? <p className="text-[11px] text-caption">{opp.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
        )}{/* end User Acquisition + Opportunities 2-col grid */}

        {/* Acquisition Process */}
        {processSteps.length > 0 && (
          <div className="flex flex-col gap-[10px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Acquisition Process</p>
            <div className="bg-tag rounded-icon px-[14px] py-[8px] flex flex-col">
              {processSteps.map((step, index) => (
                <div
                  key={`${step.title}-${index}`}
                  className={`py-[10px] ${index > 0 ? "border-t border-divider" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-bold leading-[1.25]">
                      <span className="text-caption font-normal mr-[6px]">{index + 1}.</span>
                      {step.title || "Step"}
                      {step.note ? (
                        <span className="ml-[6px] text-[11px] font-normal text-caption">{step.note}</span>
                      ) : null}
                    </p>
                    {step.description ? (
                      <p className="text-[13px] text-body mt-[3px] leading-[1.35]">{step.description}</p>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* FAQs */}
        {visibleFaqs.length > 0 && (
          <FaqAccordion faqs={visibleFaqs} />
        )}

        {/* ── CONTACT ── */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-[20px] items-start">

          <div className="flex flex-col gap-[24px]">
            <div className="flex flex-col gap-[12px]">
              <p className="font-bold text-[28px] leading-[1.2]">Interested?</p>
              <p className="text-[16px] text-body leading-[1.5]">If you have more questions, reach out or book a call with your POC</p>
            </div>

            <div className="flex flex-col gap-[12px]">
              {app.contact.email && (
                <a
                  href={`mailto:${app.contact.email}`}
                  className="flex items-center gap-[14px] bg-tag rounded-[16px] px-[20px] py-[18px] no-underline transition-opacity hover:opacity-70"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-foreground">
                    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[15px] text-foreground leading-normal">{app.contact.email}</span>
                </a>
              )}
              {app.contact.phone && (
                <a
                  href={`tel:${app.contact.phone}`}
                  className="flex items-center gap-[14px] bg-tag rounded-[16px] px-[20px] py-[18px] no-underline transition-opacity hover:opacity-70"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-foreground">
                    <path d="M6.6 10.8a15.05 15.05 0 006.6 6.6l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.47.57 3.58a1 1 0 01-.24 1.02L6.6 10.8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[15px] text-foreground leading-normal">{app.contact.phone}</span>
                </a>
              )}
              {app.contact.ndaUrl && (
                <a
                  href={app.contact.ndaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[14px] bg-tag rounded-[16px] px-[20px] py-[18px] no-underline transition-opacity hover:opacity-70"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-foreground">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[15px] text-foreground leading-normal">Sign NDA</span>
                </a>
              )}
            </div>
          </div>

          {/* Calendar in its own card */}
          {app.contact.calendarUrl ? (
            <div className="bg-card rounded-card p-[15px] w-full overflow-hidden">
              <CalendarEmbed calendarUrl={app.contact.calendarUrl} />
            </div>
          ) : null}

        </div>{/* end contact grid */}

          </div>{/* end blurred content */}

          {/* NDA overlay — rendered via portal to escape transform stacking context */}
          {app.ndaRequired && <NdaGatePortal ndaUrl={siteLinks.ndaUrl || siteLinks.seeAllAppsUrl} />}

        </div>{/* end relative locked container */}

      </div>
    </main>
  );
}
