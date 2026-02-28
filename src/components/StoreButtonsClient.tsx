"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotionPageBlock } from "@/data/apps";
import { getCachedNotionDetails, prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

function ExternalLinkArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" className="shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.6721 0.75C10.6721 0.335787 10.3363 9.16047e-08 9.92212 2.39119e-07L3.17212 -1.8235e-07C2.75791 -1.8235e-07 2.42212 0.335786 2.42212 0.75C2.42212 1.16421 2.75791 1.5 3.17212 1.5H9.17212V7.5C9.17212 7.91421 9.50791 8.25 9.92212 8.25C10.3363 8.25 10.6721 7.91421 10.6721 7.5L10.6721 0.75ZM0.530273 10.1418L1.0606 10.6722L10.4524 1.28033L9.92212 0.75L9.39179 0.21967L-5.66393e-05 9.61152L0.530273 10.1418Z" fill="currentColor"/>
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
        <a href={appStoreLink} className="bg-primary flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-primary-text no-underline leading-normal transition-opacity duration-200 hover:opacity-90">
          App Store
          <ExternalLinkArrow />
        </a>
      )}
      {playStoreLink && (
        <a href={playStoreLink} className="bg-primary flex gap-[10px] items-center justify-center px-[15px] py-[10px] rounded-pill text-[17px] text-primary-text no-underline leading-normal transition-opacity duration-200 hover:opacity-90">
          Play Store
          <ExternalLinkArrow />
        </a>
      )}
    </div>
  );
}
