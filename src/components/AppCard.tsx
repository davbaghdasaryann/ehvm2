"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { App } from "@/lib/data";
import { prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

function getFieldValue(app: App, matcher: RegExp): string {
  return (
    app.notionDbFields?.find((field) => matcher.test(field.label))?.value ||
    ""
  );
}

export default function AppCard({ app }: { app: App }) {
  const router = useRouter();
  const detailsUrl = app.notionPageId
    ? `/api/apps/${encodeURIComponent(app.slug)}/details?pageId=${encodeURIComponent(app.notionPageId)}`
    : undefined;
  const appUrl = `/apps/${app.slug}`;
  const ratingValue = app.rating > 0 ? String(app.rating) : "";
  const monetization = app.monetizationType || getFieldValue(app, /monetization/i);
  const offerStatus = app.hearingOffersStatus || getFieldValue(app, /hearing\s*offers?/i);
  const fallbackPill = monetization || offerStatus || "";
  const fallbackEmoji = monetization ? "🎟️" : "📬";

  const handleWarm = () => {
    router.prefetch(appUrl);
    void prefetchNotionDetails(detailsUrl);
  };

  return (
    <Link
      href={appUrl}
      prefetch={false}
      onMouseEnter={handleWarm}
      onFocus={handleWarm}
      onTouchStart={handleWarm}
      onMouseDown={handleWarm}
      className="bg-card flex flex-[1_0_0] items-center max-w-[382px] min-w-[335px] p-[15px] rounded-card no-underline text-foreground"
    >
      <div className="flex flex-1 gap-[10px] items-center min-w-0">
        <div className="relative shrink-0 size-[100px] rounded-icon shadow-icon overflow-hidden">
          <Image
            src={app.icon}
            alt={app.name}
            fill
            className="object-cover"
            sizes="100px"
          />
        </div>
        <div className="flex flex-1 flex-col h-full items-start justify-between min-h-[100px] min-w-0 overflow-hidden">
          <div className="flex items-start justify-between w-full min-w-0 gap-2">
            <div className="flex flex-1 flex-col gap-[4px] items-start leading-[1.2] min-w-0 overflow-hidden">
              <p className="font-bold text-[20px] w-full truncate">{app.name}</p>
              <p className="text-[12px] w-full truncate">{app.subtitle}</p>
            </div>
            <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
              <span className="text-[12px] leading-[1.2]">More</span>
            </div>
          </div>
          <div className="flex gap-[5px] items-center w-full flex-wrap min-w-0">
            <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill min-w-0 max-w-[128px] overflow-hidden">
              <span className="text-[12px] leading-[1.2] truncate block">💰{app.mrr} mrr</span>
            </div>
            <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill min-w-0 max-w-[132px] overflow-hidden">
              <span className="text-[12px] leading-[1.2] truncate block">{app.platformEmoji} {app.platform}</span>
            </div>
            {ratingValue ? (
              <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 max-w-[84px] overflow-hidden">
                <span className="text-[12px] leading-[1.2] truncate block">⭐ {ratingValue}</span>
              </div>
            ) : fallbackPill ? (
              <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill min-w-0 max-w-[150px] overflow-hidden">
                <span className="text-[12px] leading-[1.2] truncate block">{fallbackEmoji} {fallbackPill}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
