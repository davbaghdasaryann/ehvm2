"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotionPageBlock } from "@/data/apps";
import { getCachedNotionDetails, prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

function ExternalLinkArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 9L9 2M9 2H4.5M9 2V6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function collectUrls(blocks: NotionPageBlock[]): string[] {
  const urls: string[] = [];

  const visit = (block: NotionPageBlock) => {
    if (block.url) urls.push(block.url);
    if (Array.isArray(block.links)) urls.push(...block.links);
    if (block.value && /^https?:\/\//i.test(block.value)) urls.push(block.value);
    if (Array.isArray(block.children)) {
      block.children.forEach(visit);
    }
  };

  blocks.forEach(visit);
  return [...new Set(urls.map((url) => url.trim()).filter(Boolean))];
}

function findStoreLinks(blocks: NotionPageBlock[]): { appStoreLink?: string; playStoreLink?: string } {
  const urls = collectUrls(blocks);
  return {
    appStoreLink: urls.find((url) => /apps\.apple\.com/i.test(url)),
    playStoreLink: urls.find((url) => /play\.google\.com/i.test(url)),
  };
}

type StoreButtonsClientProps = {
  slug: string;
  pageId?: string;
  fallbackAppStoreLink?: string;
  fallbackPlayStoreLink?: string;
};

export default function StoreButtonsClient({
  slug,
  pageId,
  fallbackAppStoreLink,
  fallbackPlayStoreLink,
}: StoreButtonsClientProps) {
  const detailsUrl = useMemo(() => {
    if (!pageId) return undefined;
    return `/api/apps/${encodeURIComponent(slug)}/details?pageId=${encodeURIComponent(pageId)}`;
  }, [pageId, slug]);

  const [appStoreLink, setAppStoreLink] = useState<string | undefined>(fallbackAppStoreLink);
  const [playStoreLink, setPlayStoreLink] = useState<string | undefined>(fallbackPlayStoreLink);

  useEffect(() => {
    let active = true;

    const applyLinks = (blocks: NotionPageBlock[]) => {
      const extracted = findStoreLinks(blocks);
      if (!active) return;
      if (extracted.appStoreLink) setAppStoreLink(extracted.appStoreLink);
      if (extracted.playStoreLink) setPlayStoreLink(extracted.playStoreLink);
    };

    const load = async () => {
      if (!detailsUrl) return;

      const cached = getCachedNotionDetails(detailsUrl);
      if (cached) {
        applyLinks(cached);
        return;
      }

      try {
        const blocks = await prefetchNotionDetails(detailsUrl);
        applyLinks(blocks);
      } catch {
        // Keep fallback links only.
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [detailsUrl]);

  if (!appStoreLink && !playStoreLink) return null;

  return (
    <div className="flex flex-wrap gap-[10px] items-start">
      {appStoreLink && (
        <a href={appStoreLink} className="flex gap-[7px] items-center justify-center px-[14px] py-[8px] rounded-pill text-[15px] no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
          App Store
          <ExternalLinkArrow />
        </a>
      )}
      {playStoreLink && (
        <a href={playStoreLink} className="flex gap-[7px] items-center justify-center px-[14px] py-[8px] rounded-pill text-[15px] no-underline leading-normal transition-opacity duration-200 hover:opacity-70" style={{ background: 'var(--color-button)', color: 'var(--color-button-text)' }}>
          Play Store
          <ExternalLinkArrow />
        </a>
      )}
    </div>
  );
}
