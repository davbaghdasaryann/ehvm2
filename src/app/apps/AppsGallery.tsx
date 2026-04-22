"use client";

import { useState } from "react";
import FilterTabs from "@/components/FilterTabs";
import AppCard from "@/components/AppCard";
import NdaGatePortal from "@/components/NdaGatePortal";
import type { App, SiteLinks } from "@/lib/data";

const VISIBLE_ROWS = 1;
const COLS = 3;
const VISIBLE_COUNT = VISIBLE_ROWS * COLS;

type AppsGalleryProps = {
  apps: App[];
  categories: string[];
  siteLinks: SiteLinks;
};

export default function AppsGallery({ apps, categories, siteLinks }: AppsGalleryProps) {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? apps : apps.filter((a) => a.category === active);
  const visible = filtered.slice(0, VISIBLE_COUNT);
  const locked = filtered.slice(VISIBLE_COUNT);
  const ndaUrl = siteLinks.ndaUrl || siteLinks.seeAllAppsUrl;

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full">
        <FilterTabs tabs={categories} active={active} onSelect={setActive} />
      </div>

      <div className="ehvm-slide-up flex flex-col gap-0 max-w-[1180px] w-full mt-[18px] pb-[40px] px-[20px] sm:px-[24px]">
        {/* Visible apps — first row */}
        <div className="flex flex-wrap gap-[10px] justify-center items-center">
          {visible.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>

        {/* NDA gate — blurred rows with overlay */}
        {locked.length > 0 && (
          <div className="relative mt-[10px]">
            {/* Blurred locked apps */}
            <div
              className="flex flex-wrap gap-[10px] justify-center items-center select-none pointer-events-none"
              style={{ filter: "blur(6px)", opacity: 0.6 }}
            >
              {locked.map((app) => (
                <AppCard key={app.slug} app={app} />
              ))}
            </div>

            {/* NDA overlay — portal escapes transform stacking context */}
            <NdaGatePortal ndaUrl={ndaUrl} />
          </div>
        )}
      </div>
    </main>
  );
}
