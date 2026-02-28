import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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

  const hasContent = article.content && article.content.length > 0;

  return (
    <main className="flex justify-center w-full px-[10px] pb-[40px]">
      <div className="ehvm-slide-up bg-card flex flex-col items-start p-[15px] rounded-card w-full max-w-[500px]">
        {/* Meta bar */}
        <div className="flex items-center justify-between w-full mb-[20px]">
          <div className="flex gap-[5px] items-center">
            <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
              <span className="text-[12px] leading-[1.2]">{article.category}</span>
            </div>
            {article.readTime && (
              <div className="bg-tag flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0">
                <span className="text-[12px] leading-[1.2]">{article.readTime}</span>
              </div>
            )}
          </div>
          <Link href="/news/all" className="bg-primary flex h-[27px] items-center justify-center p-[10px] rounded-pill shrink-0 no-underline">
            <span className="text-[12px] leading-[1.2] text-primary-text">Close</span>
          </Link>
        </div>

        {/* Headline */}
        <h1 className="font-[var(--font-serif)] text-[28px] leading-[1.15] tracking-[-0.5px] mb-[8px]" style={{ fontFamily: "var(--font-serif)" }}>
          {article.title}
        </h1>

        {/* Date + Author line */}
        <div className="flex items-center gap-[10px] mb-[24px]">
          {article.author && (
            <>
              <div className="relative size-[28px] rounded-full overflow-hidden shrink-0">
                <Image src={article.author.image} alt={article.author.name} fill className="object-cover" />
              </div>
              <span className="text-[13px] text-caption">{article.author.name}</span>
              <span className="text-[13px] text-faint">·</span>
            </>
          )}
          {article.date && (
            <span className="text-[13px] text-caption">{article.date}</span>
          )}
        </div>

        {/* Hero Image */}
        <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden mb-[30px] bg-thumbnail">
          <Image src={article.thumbnail} alt={article.title} fill className="object-cover" />
        </div>

        {/* Content */}
        {hasContent ? (
          <div className="flex flex-col gap-[20px] w-full px-[5px]">
            {article.content!.map((block, i) => {
              if (block.type === "text") {
                return (
                  <p key={i} className="text-[16px] leading-[1.7] text-body" style={{ fontFamily: "var(--font-serif)" }}>
                    {block.value}
                  </p>
                );
              }
              if (block.type === "image") {
                return (
                  <figure key={i} className="flex flex-col gap-[8px] w-full my-[10px]">
                    <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden">
                      <Image src={block.src} alt={block.caption || ""} fill className="object-cover" />
                    </div>
                    {block.caption && (
                      <figcaption className="text-[12px] text-caption text-center italic">{block.caption}</figcaption>
                    )}
                  </figure>
                );
              }
              if (block.type === "quote") {
                return (
                  <blockquote key={i} className="border-l-[3px] border-primary pl-[20px] py-[4px] my-[6px]">
                    <p className="text-[18px] leading-[1.6] italic text-body" style={{ fontFamily: "var(--font-serif)" }}>
                      &ldquo;{block.value}&rdquo;
                    </p>
                    <cite className="text-[13px] text-caption not-italic mt-[8px] block">— {block.author}</cite>
                  </blockquote>
                );
              }
              return null;
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-[10px] w-full leading-[1.2]">
            <p className="text-[16px] text-caption" style={{ fontFamily: "var(--font-serif)" }}>Full article coming soon.</p>
          </div>
        )}

        {/* Divider + Back */}
        <div className="w-full mt-[30px] pt-[20px] border-t border-divider">
          <Link href="/news/all" className="bg-primary flex w-fit gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px] text-primary-text no-underline leading-normal">
            ← Back to News
          </Link>
        </div>
      </div>
    </main>
  );
}
