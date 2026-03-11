import Image from "next/image";
import { notFound } from "next/navigation";
import HistoryBackLink from "@/components/HistoryBackLink";
import { getArticleBySlug, getArticleSlugs } from "@/lib/data";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="ehvm-slide-up bg-card flex flex-col items-start p-[15px] rounded-card w-full max-w-[560px]">
        <div className="flex items-center justify-between w-full mb-[16px]">
          <div className="bg-tag flex h-[27px] items-center justify-center px-[10px] rounded-pill shrink-0">
            <span className="text-[12px] leading-[1.2]">{article.category}</span>
          </div>
          <HistoryBackLink href="/news/all" className="bg-primary flex h-[27px] items-center justify-center px-[10px] rounded-pill shrink-0 no-underline">
            <span className="text-[12px] leading-[1.2] text-primary-text">Close</span>
          </HistoryBackLink>
        </div>

        <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden mb-[16px] bg-thumbnail">
          {article.thumbnail ? (
            <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[14px] text-muted">
              No image uploaded
            </div>
          )}
        </div>

        <p className="text-[26px] leading-[1.1]" style={{ fontFamily: "var(--font-serif)" }}>
          {article.title}
        </p>

        {article.subtitle ? (
          <p className="text-[16px] leading-[1.5] text-body mt-[10px]">
            {article.subtitle}
          </p>
        ) : null}

        {article.quote ? (
          <blockquote className="w-full mt-[14px] bg-tag rounded-[14px] p-[12px] text-[16px] leading-[1.5] text-body">
            “{article.quote}”
          </blockquote>
        ) : null}

        <div className="w-full mt-[16px]">
          {(article.buttonLabel || article.buttonUrl) && (
            <a
              href={article.buttonUrl || "/news/all"}
              className="bg-primary inline-flex h-[40px] items-center justify-center px-[15px] rounded-pill text-[14px] text-primary-text no-underline leading-normal"
            >
              {article.buttonLabel || "Read more"}
            </a>
          )}
        </div>

        <div className="w-full mt-[22px] pt-[16px] border-t border-divider">
          <HistoryBackLink href="/news/all" className="bg-tag inline-flex h-[36px] items-center justify-center px-[12px] rounded-pill text-[13px] no-underline">
            ← Back to News
          </HistoryBackLink>
        </div>
      </div>
    </main>
  );
}
