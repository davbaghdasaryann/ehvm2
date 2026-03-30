import Image from "next/image";
import { notFound } from "next/navigation";
import HistoryBackLink from "@/components/HistoryBackLink";
import { getArticleBySlug, getArticleSlugs } from "@/lib/data";
import type { NewsBlock } from "@/data/articles";

export const revalidate = 60; // ISR: revalidate every 60 seconds

export async function generateStaticParams() {
  const slugs = await getArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

function renderTextWithLinks(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, idx) => {
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      return (
        <a key={idx} href={linkUrl} className="underline hover:opacity-70" target="_blank" rel="noopener noreferrer">
          {linkText}
        </a>
      );
    }
    return part ? <span key={idx}>{part}</span> : null;
  });
}

function renderNewsBlock(block: NewsBlock) {
  if (block.type === "text" && block.content) {
    return (
      <p key={block.id} className="text-[16px] leading-[1.7]" style={{ fontFamily: "var(--font-serif)", whiteSpace: "pre-wrap" }}>
        {renderTextWithLinks(block.content)}
      </p>
    );
  }
  if (block.type === "title" && block.content) {
    return (
      <h2 key={block.id} className="text-[24px] leading-[1.2] mt-[20px]" style={{ fontFamily: "var(--font-serif)" }}>
        {block.content}
      </h2>
    );
  }
  if (block.type === "image" && block.imageUrl) {
    return (
      <div key={block.id} className="w-full my-[20px]">
        <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden bg-thumbnail">
          <Image src={block.imageUrl} alt={block.imageCaption || "Article image"} fill unoptimized className="object-cover" />
        </div>
        {block.imageCaption && (
          <p className="text-[12px] text-caption text-center mt-[8px] italic">{block.imageCaption}</p>
        )}
      </div>
    );
  }
  if (block.type === "quote" && block.quoteText) {
    return (
      <blockquote key={block.id} className="border-l-[3px] border-primary pl-[20px] py-[4px] my-[20px]">
        <p className="text-[18px] leading-[1.6] italic" style={{ fontFamily: "var(--font-serif)" }}>
          &ldquo;{block.quoteText}&rdquo;
        </p>
        {block.quoteCite && (
          <cite className="text-[13px] text-caption not-italic mt-[8px] block">{block.quoteCite}</cite>
        )}
      </blockquote>
    );
  }
  return null;
}

export default async function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  // Support both legacy articles and new block-based articles
  const blocks: NewsBlock[] = article.blocks || [];

  // If no blocks, create them from legacy fields
  if (blocks.length === 0 && (article.quote || article.subtitle)) {
    if (article.subtitle) {
      blocks.push({
        id: "legacy-subtitle",
        type: "text",
        content: article.subtitle,
      });
    }
    if (article.quote) {
      blocks.push({
        id: "legacy-quote",
        type: "quote",
        quoteText: article.quote,
      });
    }
  }

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

        {/* Title and date above image */}
        <h1 className="text-[28px] leading-[1.15] tracking-[-0.5px] mb-[12px]" style={{ fontFamily: "var(--font-serif)" }}>
          {article.title}
        </h1>

        {article.date && (
          <p className="text-[13px] text-caption mb-[20px]">
            {new Date(article.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        )}

        {/* Hero image */}
        {article.thumbnail && (
          <div className="relative w-full aspect-[16/9] rounded-icon overflow-hidden mb-[20px] bg-thumbnail">
            <Image src={article.thumbnail} alt={article.title} fill unoptimized className="object-cover" />
          </div>
        )}

        {/* Content blocks */}
        <div className="flex flex-col gap-[16px] w-full">
          {blocks.map((block) => renderNewsBlock(block))}
        </div>

        {/* Back link */}
        <div className="w-full mt-[32px] pt-[16px] border-t border-divider">
          <HistoryBackLink href="/news/all" className="bg-primary inline-flex h-[40px] items-center justify-center px-[20px] rounded-pill text-[14px] no-underline font-semibold text-primary-text">
            ← Back to News
          </HistoryBackLink>
        </div>
      </div>
    </main>
  );
}
