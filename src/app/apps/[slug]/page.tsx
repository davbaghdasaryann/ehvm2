import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAppBySlug, getAppSlugs } from "@/lib/data";
import CalendarWidget from "@/components/CalendarWidget";
import FaqAccordion from "@/components/FaqAccordion";
import HighlightsClient from "@/components/HighlightsClient";
import NotionDetailsClient from "@/components/NotionDetailsClient";
import StoreButtonsClient from "@/components/StoreButtonsClient";

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

function getFieldValue(
  fields: { label: string; value: string }[] | undefined,
  matcher: RegExp,
): string {
  return fields?.find((field) => matcher.test(field.label))?.value || "";
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
  const ratingValue = app.rating > 0 ? String(app.rating) : "";
  const topRating = app.rating > 0 ? String(app.rating) : (app.highlights.rating !== "—" ? app.highlights.rating : "");
  const topFollowers = app.followers || (app.highlights.followers !== "—" ? app.highlights.followers : "");
  const monetization = app.monetizationType || getFieldValue(app.notionDbFields, /monetization/i);
  const offerStatus = app.hearingOffersStatus || getFieldValue(app.notionDbFields, /hearing\s*offers?/i);
  const fallbackPill = monetization || offerStatus || "";
  const fallbackEmoji = monetization ? "🎟️" : "📬";
  const fallbackHighlights: Array<{ key: string; emoji: string; value: string; label: string }> = [];

  if (app.highlights.mrr && app.highlights.mrr !== "—") {
    fallbackHighlights.push({
      key: "fallback-mrr",
      emoji: "💰",
      value: app.highlights.mrr,
      label: "MRR",
    });
  } else if (app.mrr && app.mrr !== "—") {
    fallbackHighlights.push({
      key: "fallback-mrr-card",
      emoji: "💰",
      value: app.mrr,
      label: "MRR",
    });
  }

  if (topRating) {
    fallbackHighlights.push({
      key: "fallback-rating",
      emoji: "⭐",
      value: topRating,
      label: app.highlights.ratingLabel || "Rating",
    });
  }

  if (topFollowers) {
    fallbackHighlights.push({
      key: "fallback-users",
      emoji: followersEmoji(app.highlights.followersLabel),
      value: topFollowers,
      label: app.highlights.followersLabel || "Users",
    });
  }

  if (app.platform) {
    fallbackHighlights.push({
      key: "fallback-os",
      emoji: app.platformEmoji || "📱",
      value: app.platform,
      label: "OS",
    });
  }

  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="ehvm-slide-up bg-card flex flex-col gap-[20px] items-start p-[15px] rounded-card w-full max-w-[500px]">
        {/* Top Header */}
        <div className="flex gap-[10px] items-center w-full">
          <div className="relative shrink-0 size-[100px] rounded-icon shadow-icon overflow-hidden">
            <Image
              src={app.icon}
              alt={app.name}
              fill
              className="object-cover"
              sizes="100px"
            />
          </div>
          <div className="flex flex-[1_0_0] flex-col h-full items-start justify-between min-h-[100px] min-w-0">
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[1.2] min-w-0">
                <p className="font-bold text-[20px] w-full truncate">{app.name}</p>
                <p className="text-[12px] w-full truncate">{app.subtitle}</p>
              </div>
              <Link href="/apps" className="bg-primary flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 no-underline">
                <span className="text-[12px] leading-[1.2] text-primary-text">Close</span>
              </Link>
            </div>
            <div className="flex gap-[5px] items-center w-full flex-wrap min-w-0">
              <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 max-w-[132px]">
                <span className="text-[12px] leading-[1.2] truncate">💰{app.mrr} mrr</span>
              </div>
              <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 max-w-[140px]">
                <span className="text-[12px] leading-[1.2] truncate">{app.platformEmoji} {app.platform}</span>
              </div>
              {ratingValue ? (
                <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 max-w-[92px]">
                  <span className="text-[12px] leading-[1.2]">⭐ {ratingValue}</span>
                </div>
              ) : fallbackPill ? (
                <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 max-w-[150px]">
                  <span className="text-[12px] leading-[1.2] truncate">{fallbackEmoji} {fallbackPill}</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* About */}
        <div className="flex flex-col gap-[10px] w-full leading-[1.2]">
          <p className="font-bold text-[20px]">About</p>
          <p className="text-[17px]">{app.about}</p>
        </div>

        {/* Links */}
        <StoreButtonsClient
          slug={app.slug}
          pageId={app.notionPageId}
          fallbackAppStoreLink={app.appStoreLink}
          fallbackPlayStoreLink={app.playStoreLink}
        />

        <HighlightsClient
          slug={app.slug}
          pageId={app.notionPageId}
          fallbackHighlights={fallbackHighlights.slice(0, 3)}
        />

        {/* App Screenshots */}
        <div className="relative w-full aspect-[1592/820] rounded-icon overflow-hidden">
          <Image
            src={app.screenshotsImage}
            alt="App screenshots"
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 500px"
            priority
          />
        </div>

        {/* Full Notion Content */}
        <NotionDetailsClient
          key={app.slug}
          slug={app.slug}
          pageId={app.notionPageId}
        />

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
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} className="object-contain" />
                      </a>
                    ) : (
                      <div className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} className="object-contain" />
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
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} className="object-contain" />
                      </a>
                    ) : (
                      <div className="relative shrink-0 size-[75px] bg-tag rounded-icon overflow-hidden flex items-center justify-center">
                        <Image src={ch.icon} alt={ch.name} width={36} height={36} className="object-contain" />
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
          <div className="flex flex-col gap-[10px] w-full leading-[1.2]">
            <p className="font-bold text-[20px]">Opportunities</p>
            <div className="text-[17px] flex flex-col gap-[16px]">
              {app.opportunities.map((opp, i) => (
                <p key={i}>{opp}</p>
              ))}
            </div>
          </div>
        )}

        {/* Developer Country */}
        <div className="flex flex-col gap-[10px] w-full leading-[1.2]">
          <p className="font-bold text-[20px]">Developers country</p>
          <p className="text-[17px]">{app.developerFlag} {app.developerCountry}</p>
        </div>

        {/* FAQs */}
        {app.faqs.length > 0 && (
          <FaqAccordion faqs={app.faqs} />
        )}

        {/* Contact */}
        <div className="flex flex-col gap-[10px] w-full">
          <div className="flex flex-col gap-[10px] leading-[1.2]">
            <p className="font-bold text-[20px]">Interested?</p>
            <p className="text-[17px]">If you have more questions, reach out or book a call with your POC</p>
          </div>
          <div className="flex gap-[10px] items-center w-full">
            <div className="relative size-[97px] rounded-icon shadow-icon overflow-hidden shrink-0">
              <Image
                src={app.contact.image}
                alt={app.contact.name}
                fill
                className="object-cover"
                sizes="97px"
              />
            </div>
            <div className="flex flex-col gap-[10px] flex-[1_0_0]">
              <a href={`mailto:${app.contact.email}`} className="bg-primary flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px] text-primary-text no-underline leading-normal">
                📫 {app.contact.email}
              </a>
              <a href={`tel:${app.contact.phone}`} className="bg-primary flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px] text-primary-text no-underline leading-normal">
                ☎️ {app.contact.phone}
              </a>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <CalendarWidget
          hostName={app.contact.name}
          hostImage={app.contact.image}
          title="M&A Questions"
          duration="15m"
          platform="Google Meet"
          timezone="Europe/Berlin"
        />
      </div>
    </main>
  );
}
