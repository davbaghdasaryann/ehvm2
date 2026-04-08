import Image from "next/image";
import { notFound } from "next/navigation";
import { getAppBySlug, getAppSlugs } from "@/lib/data";
import { getAppfiguresSnapshot } from "@/lib/appfigures";
import { deriveAppfiguresData } from "@/lib/appfiguresDerived";
import AppChartsClient from "@/components/AppChartsClient";
import AppfiguresSectionClient from "@/components/AppfiguresSectionClient";
import CalendarEmbed from "@/components/CalendarEmbed";
import FaqAccordion from "@/components/FaqAccordion";
import HistoryBackLink from "@/components/HistoryBackLink";

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

export default async function AppDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const app = await getAppBySlug(slug);
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

  const kpis = mergeUniqueByLabel(
    (app.kpis || []).filter((item) => item.label || item.value),
    appfiguresDerived.kpis,
  );
  const financialSummary = [
    { key: "mrr", label: "MRR", value: app.financials?.mrr || "" },
    { key: "arr", label: "ARR", value: app.financials?.arr || "" },
    { key: "ltvcac", label: "LTV : CAC", value: app.financials?.ltvCac || "" },
    { key: "margin", label: "Net Margin", value: app.financials?.netMargin || "" },
    { key: "yoy", label: "YoY Growth", value: app.financials?.yoyGrowth || "" },
    { key: "multiple", label: "Asking Multiple", value: app.financials?.askingMultiple || "" },
  ].filter((item) => item.value);
  const appfiguresFinancialSummary = appfiguresDerived.financialCards.filter((item) => {
    const label = item.label.trim().toLowerCase();
    return !financialSummary.some((existing) => existing.label.trim().toLowerCase() === label);
  });
  const plRows = (app.financials?.plRows || []).filter((row) => row.label || row.amount || row.notes);
  const charts = mergeUniqueCharts(
    (app.charts || []).filter((chart) => chart.labels.length > 0 && chart.datasets.length > 0),
    appfiguresDerived.charts,
  );
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
                  <a href={app.appStoreLink} className="flex gap-[8px] items-center justify-center px-[18px] py-[10px] rounded-pill text-[15px] font-medium no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
                    App Store
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                      <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                )}
                {app.playStoreLink && (
                  <a href={app.playStoreLink} className="flex gap-[8px] items-center justify-center px-[18px] py-[10px] rounded-pill text-[15px] font-medium no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
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
              <strong>About.</strong>{" "}{app.about}
            </p>

            {/* Developer Country */}
            {app.developerCountry && app.developerCountry !== "Unknown" && (
              <p className="text-[17px] leading-[1.4]">
                <strong>Developer.</strong>{" "}{app.developerCountry} {app.developerFlag}
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

        {/* ── KPI + FUNNEL: 2-col on PC ── */}
        {(kpis.length > 0 || funnel.length > 0) && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-[20px] items-start">
            {kpis.length > 0 && (
              <div className="flex flex-col gap-[12px] w-full">
                <p className="font-bold text-[20px] leading-[1.2]">KPI Cards</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] w-full">
                  {kpis.map((item, index) => (
                    <div key={`${item.label}-${index}`} className="bg-tag rounded-[16px] p-[12px]">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                      <p className="font-bold text-[22px] leading-[1.1] mt-[4px]">{item.value || "—"}</p>
                      {item.trend ? (
                        <p className="flex items-center gap-[4px] text-[12px] mt-[6px] text-body">
                          {/^↑/.test(item.trend) && (
                            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
                              <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="#34a853" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                          {item.trend.replace(/^↑\s*/, '')}
                        </p>
                      ) : null}
                      {item.sub ? (
                        <p className="text-[12px] text-caption mt-[2px]">{item.sub}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

        {(financialSummary.length > 0 || appfiguresFinancialSummary.length > 0 || plRows.length > 0) && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Financial Snapshot</p>
            {financialSummary.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-[10px] w-full">
                {financialSummary.map((item) => (
                  <div key={item.key} className="bg-tag rounded-[16px] p-[12px]">
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
                    <div key={item.key} className="bg-tag rounded-[16px] p-[12px]">
                      <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                      <p className="font-bold text-[20px] leading-[1.1] mt-[4px] break-words">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plRows.length > 0 && (() => {
              const hasTrend = plRows.some((r) => r.trend);
              const hasNotes = plRows.some((r) => r.notes);
              return (
                <div className="bg-tag rounded-[16px] p-[12px] overflow-x-auto w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-[0.08em] text-caption">
                        <th className="pb-[8px] pr-[10px]">Metric</th>
                        <th className="pb-[8px] pr-[10px]">Amount</th>
                        {hasTrend && <th className="pb-[8px] pr-[10px]">Trend</th>}
                        {hasNotes && <th className="pb-[8px]">Notes</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {plRows.map((row, index) => (
                        <tr key={`${row.label}-${index}`} className="border-t border-divider">
                          <td className="py-[8px] pr-[10px] text-[13px]">{row.highlight ? <strong>{row.label}</strong> : row.label}</td>
                          <td className="py-[8px] pr-[10px] text-[13px] font-bold">{row.amount || "—"}</td>
                          {hasTrend && <td className="py-[8px] pr-[10px] text-[12px] text-body">{row.trend || "—"}</td>}
                          {hasNotes && <td className="py-[8px] text-[12px] text-caption">{row.notes || "—"}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
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
                  <div key={item.key} className="bg-tag rounded-[16px] p-[12px]">
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

        {hasStoreIntelligence && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Store Intelligence</p>
            {appfiguresDerived.storeSignals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[10px] w-full">
                {appfiguresDerived.storeSignals.map((item) => (
                  <div key={item.key} className="bg-tag rounded-[16px] p-[12px]">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-caption">{item.label}</p>
                    <p className="font-bold text-[18px] mt-[4px]">{item.value}</p>
                    {item.sub ? <p className="text-[11px] text-caption mt-[2px]">{item.sub}</p> : null}
                  </div>
                ))}
              </div>
            )}
            {appfiguresDerived.featuredPlacements.length > 0 && (
              <div className="bg-tag rounded-[16px] p-[12px] flex flex-col">
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
              <div className="bg-tag rounded-[16px] p-[12px] flex flex-col gap-[10px]">
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

        {appfiguresDerived.reviews.length > 0 && (
          <div className="flex flex-col gap-[12px] w-full">
            <p className="font-bold text-[20px] leading-[1.2]">Recent Store Reviews</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[10px] w-full">
              {appfiguresDerived.reviews.map((review) => (
                <div key={review.id} className="bg-tag rounded-[16px] p-[12px] flex flex-col gap-[8px]">
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

        {app.appfigures?.products.length ? (
          <AppfiguresSectionClient slug={app.slug} />
        ) : null}

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

        </div>

      </div>
    </main>
  );
}
