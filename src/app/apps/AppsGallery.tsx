"use client";

import { useEffect, useState } from "react";
import FilterTabs from "@/components/FilterTabs";
import AppCard from "@/components/AppCard";
import type { App } from "@/lib/data";
import { prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

type AppsGalleryProps = {
  apps: App[];
  categories: string[];
};

export default function AppsGallery({ apps, categories }: AppsGalleryProps) {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? apps : apps.filter((a) => a.category === active);

  useEffect(() => {
    const warmCandidates = filtered
      .filter((app) => Boolean(app.notionPageId))
      .slice(0, 10);

    if (warmCandidates.length === 0) return;

    let cancelled = false;
    const timerIds: number[] = [];
    const requestIdle =
      (window as Window & { requestIdleCallback?: (cb: IdleRequestCallback, opts?: IdleRequestOptions) => number }).requestIdleCallback;
    const cancelIdle =
      (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
    let idleId: number | null = null;

    const warm = () => {
      warmCandidates.forEach((app, index) => {
        const timerId = window.setTimeout(() => {
          if (cancelled || !app.notionPageId) return;
          void prefetchNotionDetails(
            `/api/apps/${encodeURIComponent(app.slug)}/details?pageId=${encodeURIComponent(app.notionPageId)}`,
          );
        }, 120 * index);
        timerIds.push(timerId);
      });
    };

    if (typeof requestIdle === "function") {
      idleId = requestIdle(() => {
        if (!cancelled) warm();
      }, { timeout: 400 });
    } else {
      const fallbackId = window.setTimeout(() => {
        if (!cancelled) warm();
      }, 120);
      timerIds.push(fallbackId);
    }

    return () => {
      cancelled = true;
      if (idleId !== null && typeof cancelIdle === "function") {
        cancelIdle(idleId);
      }
      timerIds.forEach((id) => window.clearTimeout(id));
    };
  }, [filtered]);

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full">
        <FilterTabs tabs={categories} active={active} onSelect={setActive} />
      </div>

      <div className="ehvm-slide-up flex flex-wrap gap-[10px] justify-center items-center max-w-[1180px] w-full mt-[18px] pb-[40px] px-[10px]">
        {filtered.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}

        {/* CTA */}
        <div className="w-full flex justify-center mt-[10px]">
          <a
            href="mailto:evelin@ehvm.com?subject=NDA%20%26%20Full%20Portfolio%20Access"
            className="bg-primary text-primary-text flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] no-underline leading-normal"
          >
            🔒 See all Apps & Numbers
          </a>
        </div>
      </div>
    </main>
  );
}
