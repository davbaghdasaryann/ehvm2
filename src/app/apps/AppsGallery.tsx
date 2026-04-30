"use client";

import { useState } from "react";
import FilterTabs from "@/components/FilterTabs";
import AppCard from "@/components/AppCard";
import type { App, SiteLinks } from "@/lib/data";

type AppsGalleryProps = {
  apps: App[];
  categories: string[];
  siteLinks: SiteLinks;
};

export default function AppsGallery({ apps, categories, siteLinks: _ }: AppsGalleryProps) {
  const [active, setActive] = useState("All");

  const appCategories = new Set(apps.map((a) => a.category));
  const visibleCategories = categories.filter((c) => c === "All" || appCategories.has(c));

  const filtered = active === "All" ? apps : apps.filter((a) => a.category === active);

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full py-[4px]">
        <FilterTabs tabs={visibleCategories} active={active} onSelect={setActive} center />
      </div>

      <div className="ehvm-slide-up flex flex-wrap gap-[10px] justify-center max-w-[1180px] w-full mt-[18px] pb-[40px] px-[20px] sm:px-[24px]">
        {filtered.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </main>
  );
}
