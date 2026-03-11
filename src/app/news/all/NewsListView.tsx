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

  return (
    <main className="ehvm-slide-up mx-auto flex flex-col items-center w-full max-w-[560px] px-[18px] pb-[40px]">
      <div className="w-full mb-[18px]">
        <FilterTabs tabs={filterTabs} active={active} onSelect={setActive} center />
      </div>

      <div className="flex flex-col gap-[14px] w-full">
        {filtered.map((article) => (
          <article key={article.slug} className="bg-card rounded-card p-[15px]">
            <div className="bg-thumbnail w-full aspect-[16/9] relative rounded-icon overflow-hidden mb-[14px]">
              {article.thumbnail ? (
                <Image
                  src={article.thumbnail}
                  alt={article.title}
                  fill
                  className={article.thumbnailFit === "contain" ? "object-contain p-[12px]" : "object-cover"}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[14px] text-muted">
                  No image uploaded
                </div>
              )}
            </div>
            <p className="text-[20px] leading-[1.1]" style={{ fontFamily: "var(--font-serif)" }}>{article.title}</p>
            {article.subtitle ? (
              <p className="text-[14px] leading-[1.4] mt-[8px] text-body">{article.subtitle}</p>
            ) : null}
            {article.quote ? (
              <blockquote className="mt-[10px] bg-tag rounded-[12px] p-[10px] text-[14px] leading-[1.4] text-body">
                “{article.quote}”
              </blockquote>
            ) : null}
            <div className="mt-[12px]">
              <Link
                href={`/news/${article.slug}`}
                className="bg-primary inline-flex h-[36px] items-center justify-center px-[15px] rounded-pill text-[14px] text-primary-text no-underline leading-normal"
              >
                {article.buttonLabel || "Read more"}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
