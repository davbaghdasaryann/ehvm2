"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import FilterTabs from "@/components/FilterTabs";
import type { Article } from "@/lib/data";

const filterTabs = ["All", "Stories", "Events"];
const categoryMap: Record<string, string> = { Stories: "Story", Events: "Event" };

type NewsListViewProps = {
  articles: Article[];
};

export default function NewsListView({ articles }: NewsListViewProps) {
  const [active, setActive] = useState("All");

  const filtered =
    active === "All"
      ? articles
      : articles.filter((a) => a.category === categoryMap[active]);

  // The featured card shows the first (newest) article in the current filter
  const featured = filtered[0];

  return (
    <main className="ehvm-slide-up flex flex-col items-center w-full max-w-[402px] px-[18px] pb-[40px]">
      <div className="w-full mb-[18px]">
        <FilterTabs tabs={filterTabs} active={active} onSelect={setActive} center />
      </div>

      {/* Featured Card */}
      {featured && (
        <Link href={`/news/${featured.slug}`} className="w-full mb-[15px] block no-underline text-foreground">
          <div className="bg-thumbnail w-full aspect-[334/202] relative rounded-icon overflow-hidden">
            <Image src={featured.thumbnail} alt={featured.title} fill className={featured.thumbnailFit === "contain" ? "object-contain p-[12px]" : "object-cover"} />
          </div>
          <div className="p-[15px]">
            <p className="text-[20px] leading-none" style={{ fontFamily: "var(--font-serif)" }}>{featured.title}</p>
            <p className="text-[12px] mt-[5px]">{featured.category}</p>
          </div>
        </Link>
      )}

      {/* Article List */}
      <div className="flex flex-col gap-[13px] w-full">
        {filtered.filter((a) => a.slug !== featured?.slug).map((article) => (
          <Link key={article.slug} href={`/news/${article.slug}`} className="flex gap-[18px] items-center w-full no-underline text-foreground">
            <div className="relative shrink-0 size-[75px] bg-thumbnail rounded-icon overflow-hidden">
              <Image src={article.thumbnail} alt={article.title} fill className={article.thumbnailFit === "contain" ? "object-contain p-[8px]" : "object-cover"} />
            </div>
            <div className="flex flex-col gap-[5px] leading-[1.2]">
              <p className="text-[20px] leading-none" style={{ fontFamily: "var(--font-serif)" }}>{article.title}</p>
              <p className="text-[12px]">{article.category}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
