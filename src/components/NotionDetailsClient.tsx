"use client";

import { useEffect, useState } from "react";
import type { NotionPageBlock } from "@/data/apps";
import { getCachedNotionDetails, prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

const DUPLICATE_SECTION_PATTERNS: RegExp[] = [
  /^about$/i,
  /^highlights?$/i,
  /screenshots?/i,
  /user acquisition/i,
  /opportunit/i,
  /^faqs?$/i,
  /have more questions/i,
  /reach out or book a call/i,
  /developer/i,
  /interested/i,
  /contact/i,
  /booking|book a call|calendar/i,
];

function isHeading(block: NotionPageBlock): boolean {
  return block.type === "heading_1" || block.type === "heading_2" || block.type === "heading_3";
}

function shouldSkipSectionHeading(value?: string): boolean {
  if (!value) return false;
  return DUPLICATE_SECTION_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function collectBlockText(block: NotionPageBlock): string {
  const parts: string[] = [];
  if (block.value) parts.push(block.value);
  if (block.url) parts.push(block.url);
  if (block.links?.length) parts.push(...block.links);
  if (block.children?.length) {
    block.children.forEach((child) => {
      parts.push(collectBlockText(child));
    });
  }
  return parts.join(" ").trim();
}

function shouldSkipStandaloneParagraph(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return true;
  if (text === "/" || text === "↗" || text === "\\n") return true;
  if (/app store/i.test(text) && /play store/i.test(text)) return true;
  if (/^https?:\/\/\S+$/i.test(text)) return true;
  if (/docuseal\.com/i.test(text)) return true;
  if (/cal\.com/i.test(text)) return true;
  return false;
}

function isContactLikeText(value?: string): boolean {
  const text = (value || "").trim();
  if (!text) return false;
  if (/cal\.com|book a call|reach out|poc|contact/i.test(text)) return true;
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text)) return true;
  if (/\+?\d[\d\s().-]{7,}/.test(text)) return true;
  if (/^evelin herrera$/i.test(text)) return true;
  return false;
}

function isLikelyContactCardImage(block: NotionPageBlock, nearby: NotionPageBlock[]): boolean {
  if (block.type !== "image") return false;
  const nearbyText = nearby
    .map((candidate) => (candidate.value || candidate.url || ""))
    .join(" ")
    .toLowerCase();
  return /cal\.com|@|\+?\d[\d\s().-]{7,}|evelin herrera|book a call|reach out|poc/.test(nearbyText);
}

function isDuplicateIntroColumnList(block: NotionPageBlock): boolean {
  if (block.type !== "column_list") return false;
  const text = collectBlockText(block).toLowerCase();
  if (!text) return false;
  return (
    (/app store/.test(text) && /play store/.test(text)) ||
    /indify\.co/.test(text) ||
    /annual recurring revenue|ios rating|main geos|docuseal|sign nda/.test(text) ||
    (/cal\.com|book a call|reach out/.test(text) && /@|mailto:|tel:|\+\d/.test(text))
  );
}

function filterDuplicateSections(blocks: NotionPageBlock[]): NotionPageBlock[] {
  const filtered: NotionPageBlock[] = [];
  let skipSection = false;

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const lookahead = blocks.slice(index + 1, index + 5);

    if (isDuplicateIntroColumnList(block)) continue;
    if (block.type === "paragraph" && shouldSkipStandaloneParagraph(block.value)) continue;
    if (block.type === "paragraph" && isContactLikeText(block.value)) continue;
    if (isHeading(block) && isContactLikeText(block.value)) continue;
    if (isLikelyContactCardImage(block, lookahead)) continue;
    if (
      (block.type === "embed" || block.type === "bookmark") &&
      block.url &&
      (/indify\.co/i.test(block.url) || /cal\.com/i.test(block.url))
    ) {
      continue;
    }

    if (isHeading(block)) {
      skipSection = shouldSkipSectionHeading(block.value);
      if (skipSection) continue;
    }
    if (skipSection) continue;
    filtered.push(block);
  }

  return filtered;
}

function getHostLabel(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./i, "");
  } catch {
    return url;
  }
}

function NotionText({
  text,
  links,
  className,
}: {
  text?: string;
  links?: string[];
  className: string;
}) {
  if (!text) return null;
  const firstLink = links?.[0];
  const looksLikeUrl = /^https?:\/\//i.test(text);
  const href = firstLink || (looksLikeUrl ? text : undefined);
  const looksLikeLinkedLabel =
    Boolean(href) &&
    (looksLikeUrl || text.trim().toLowerCase() === (href || "").trim().toLowerCase());

  if (!href || !looksLikeLinkedLabel) return <p className={className}>{text}</p>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${className} leading-[1.2] underline underline-offset-4`}>
      {text}
    </a>
  );
}

function NotionBlocks({ blocks }: { blocks: NotionPageBlock[] }) {
  return (
    <div className="flex flex-col gap-[10px] w-full leading-[1.2]">
      {blocks.map((block, index) => (
        <NotionBlockItem key={`notion-${index}`} block={block} blockKey={`notion-${index}`} />
      ))}
    </div>
  );
}

function NotionBlockItem({ block, blockKey }: { block: NotionPageBlock; blockKey: string }) {
  const renderChildren = (children?: NotionPageBlock[]) =>
    children?.map((child, index) => (
      <NotionBlockItem key={`${blockKey}-${index}`} block={child} blockKey={`${blockKey}-${index}`} />
    ));

  const childNodes = block.children && block.children.length > 0 ? (
    <div className="flex flex-col gap-[8px] pl-[8px]">
      {renderChildren(block.children)}
    </div>
  ) : null;

  switch (block.type) {
    case "heading_1":
      return (
        <div className="flex flex-col gap-[8px]">
          <NotionText text={block.value} links={block.links} className="font-bold text-[20px] leading-[1.2] mt-[4px]" />
          {childNodes}
        </div>
      );
    case "heading_2":
    case "heading_3":
      return (
        <div className="flex flex-col gap-[8px]">
          <NotionText text={block.value} links={block.links} className="font-bold text-[17px] leading-[1.2] mt-[2px]" />
          {childNodes}
        </div>
      );
    case "paragraph":
      return (
        <div className="flex flex-col gap-[8px]">
          <NotionText text={block.value} links={block.links} className="text-[17px] leading-[1.2]" />
          {childNodes}
        </div>
      );
    case "bulleted_list_item":
      return (
        <div className="flex flex-col gap-[8px]">
          <NotionText text={block.value ? `• ${block.value}` : undefined} links={block.links} className="text-[17px] leading-[1.2] pl-[2px]" />
          {childNodes}
        </div>
      );
    case "numbered_list_item":
      return (
        <div className="flex flex-col gap-[8px]">
          <NotionText text={block.value} links={block.links} className="text-[17px] leading-[1.2] pl-[2px]" />
          {childNodes}
        </div>
      );
    case "quote":
    case "callout":
      return (
        <blockquote className="bg-tag rounded-[16px] p-[12px] text-[17px] leading-[1.2]">
          {block.value}
          {childNodes}
        </blockquote>
      );
    case "divider":
      return <div className="h-px w-full bg-divider my-[4px]" />;
    case "image":
      if (!block.src) return null;
      return (
        <div className="flex flex-col gap-[8px]">
          <img
            src={block.src}
            alt="Notion detail"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            className="w-full h-auto rounded-icon"
          />
          {childNodes}
        </div>
      );
    case "embed":
    case "bookmark":
      if (!block.url) return null;
      return (
        <a href={block.url} target="_blank" rel="noopener noreferrer" className="bg-tag flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[14px] no-underline leading-normal w-fit">
          ↗ {getHostLabel(block.url)}
        </a>
      );
    case "toggle":
      return (
        <details className="bg-tag rounded-[16px] p-[12px]">
          <summary className="cursor-pointer text-[17px] font-bold leading-[1.2]">{block.value || "Details"}</summary>
          <div className="flex flex-col gap-[10px] mt-[8px] leading-[1.2]">{renderChildren(block.children)}</div>
        </details>
      );
    case "column_list": {
      const columns = block.children?.filter((child) => child.type === "column") || [];
      if (columns.length === 0) {
        return <div className="flex flex-col gap-[10px]">{renderChildren(block.children)}</div>;
      }
      return (
        <div className="flex flex-col gap-[10px] w-full">
          {columns.map((column, index) => (
            <div key={`${blockKey}-col-${index}`} className="flex flex-col gap-[10px] flex-[1_0_0]">
              {renderChildren(column.children)}
            </div>
          ))}
        </div>
      );
    }
    case "column":
      return <div className="flex flex-col gap-[10px]">{renderChildren(block.children)}</div>;
    default:
      return childNodes;
  }
}

type NotionDetailsClientProps = {
  slug: string;
  pageId?: string;
};

export default function NotionDetailsClient({
  slug,
  pageId,
}: NotionDetailsClientProps) {
  const detailsUrl = pageId
    ? `/api/apps/${encodeURIComponent(slug)}/details?pageId=${encodeURIComponent(pageId)}`
    : undefined;
  const [blocks, setBlocks] = useState<NotionPageBlock[] | null>(() => {
    if (!detailsUrl) return [];
    return getCachedNotionDetails(detailsUrl) ?? null;
  });

  useEffect(() => {
    if (!detailsUrl) return;

    let active = true;

    const load = async () => {
      try {
        const cached = getCachedNotionDetails(detailsUrl);
        if (cached && active) {
          setBlocks(cached);
          return;
        }
        const prefetched = await prefetchNotionDetails(detailsUrl);
        if (active) setBlocks(prefetched);
      } catch {
        if (active) setBlocks([]);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [detailsUrl]);

  const visibleBlocks = blocks ? filterDuplicateSections(blocks) : null;

  if (blocks === null) {
    return (
      <div className="flex flex-col gap-[12px] w-full leading-[1.3]">
        <div className="flex flex-col gap-[10px] w-full">
          <div className="ehvm-skeleton h-[16px] w-full rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[90%] rounded-pill" />
          <div className="ehvm-skeleton h-[16px] w-[82%] rounded-pill" />
          <div className="ehvm-skeleton h-[180px] w-full rounded-icon" />
        </div>
      </div>
    );
  }

  if (!visibleBlocks || visibleBlocks.length === 0) return null;

  return (
    <div className="ehvm-fade-in flex flex-col gap-[10px] w-full leading-[1.2]">
      <NotionBlocks blocks={visibleBlocks} />
    </div>
  );
}
