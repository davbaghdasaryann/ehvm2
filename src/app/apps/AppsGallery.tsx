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

export default function AppsGallery({ apps, categories, siteLinks }: AppsGalleryProps) {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? apps : apps.filter((a) => a.category === active);

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
            href={siteLinks.seeAllAppsUrl}
            className="bg-primary text-primary-text flex h-[41px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] no-underline leading-normal"
          >
            {siteLinks.seeAllAppsLabel}
          </a>
        </div>
      </div>
    </main>
  );
}
