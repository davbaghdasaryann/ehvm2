"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { App } from "@/lib/data";

const pill = "flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0";

export default function AppCard({ app }: { app: App }) {
  const router = useRouter();
  const appUrl = `/apps/${app.slug}`;
  const ratingValue = app.rating > 0 ? String(app.rating) : "";
  const monetization = app.monetizationType || "";
  const offerStatus = app.hearingOffersStatus || "";
  const fallbackPill = monetization || offerStatus || "";
  const fallbackEmoji = monetization ? "🎟️" : "📬";

  const handleWarm = () => {
    router.prefetch(appUrl);
  };

  return (
    <Link
      href={appUrl}
      prefetch={false}
      onMouseEnter={handleWarm}
      onFocus={handleWarm}
      onTouchStart={handleWarm}
      onMouseDown={handleWarm}
      className="flex flex-[1_0_0] items-center max-w-[382px] min-w-[300px] sm:min-w-[335px] p-[15px] rounded-card no-underline text-foreground overflow-hidden"
      style={{ background: "var(--color-tag)" }}
    >
      <div className="flex flex-[1_0_0] gap-[10px] items-center min-w-0">
        {app.icon ? (
          <div className="relative shrink-0 size-[100px] rounded-icon shadow-icon overflow-hidden">
            <Image
              src={app.icon}
              alt={app.name}
              fill
              unoptimized
              className="object-cover"
              sizes="100px"
            />
          </div>
        ) : (
          <div className="shrink-0 size-[100px] rounded-icon flex items-center justify-center text-[28px]" style={{ background: "var(--color-card)" }}>
            📱
          </div>
        )}
        <div className="flex flex-[1_0_0] flex-col h-full items-start justify-between min-h-[100px] min-w-0">
          <div className="flex items-start justify-between w-full">
            <div className="flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[1.2] min-w-0">
              <p className="font-bold text-[20px] w-full truncate">{app.name}</p>
              <p className="text-[12px] w-full truncate">{app.subtitle}</p>
            </div>
            <div className={pill} style={{ background: "var(--color-card)" }}>
              <span className="text-[12px] leading-[1.2]">More</span>
            </div>
          </div>
          <div className="flex gap-[5px] items-center w-full flex-wrap min-w-0">
            <div className={`${pill} max-w-[128px]`} style={{ background: "var(--color-card)" }}>
              <span className="text-[12px] leading-[1.2] truncate">💰{app.mrr} mrr</span>
            </div>
            <div className={`${pill} max-w-[132px]`} style={{ background: "var(--color-card)" }}>
              <span className="text-[12px] leading-[1.2] truncate">{app.platformEmoji} {app.platform}</span>
            </div>
            {ratingValue ? (
              <div className={`${pill} max-w-[84px]`} style={{ background: "var(--color-card)" }}>
                <span className="text-[12px] leading-[1.2]">⭐ {ratingValue}</span>
              </div>
            ) : fallbackPill ? (
              <div className={`${pill} max-w-[150px]`} style={{ background: "var(--color-card)" }}>
                <span className="text-[12px] leading-[1.2] truncate">{fallbackEmoji} {fallbackPill}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
