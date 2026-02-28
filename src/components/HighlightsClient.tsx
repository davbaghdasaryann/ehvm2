"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotionPageBlock } from "@/data/apps";
import { getCachedNotionDetails, prefetchNotionDetails } from "@/lib/notionDetailsClientCache";

type HighlightItem = {
  key: string;
  emoji: string;
  value: string;
  label: string;
};

type HighlightsClientProps = {
  slug: string;
  pageId?: string;
  fallbackHighlights: HighlightItem[];
};

function isLikelyUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

function cleanMetricLabel(value: string): string {
  const firstLine = value
    .split(/\r?\n/)
    .map((part) => part.trim())
    .find(Boolean) || "";

  return firstLine
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\b(sign nda|see arr|see mrr|docuseal)\b.*$/i, "")
    .replace(/[↓↘↗]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isFlagOnlyValue(value: string): boolean {
  const stripped = value.replace(/\s+/g, "");
  return Boolean(stripped) && /^[\u{1F1E6}-\u{1F1FF}]+$/u.test(stripped);
}

function scoreLabel(label: string): number {
  const lower = label.toLowerCase();
  if (/annual recurring revenue|mrr|arr|revenue/.test(lower)) return 1;
  if (/rating|star/.test(lower)) return 2;
  if (/geo|country/.test(lower)) return 3;
  if (/user|follower|download|install|subscriber/.test(lower)) return 4;
  if (/os|platform/.test(lower)) return 5;
  return 9;
}

function parseMetricVisual(value: string, label: string): { emoji: string; value: string } {
  const trimmed = value.trim();
  const lowerLabel = label.toLowerCase();

  if (/geo|country/.test(lowerLabel)) {
    return isFlagOnlyValue(trimmed) ? { emoji: "", value: trimmed } : { emoji: "🌍", value: trimmed };
  }

  const match = trimmed.match(/^([^\p{L}\p{N}$€£]+)\s*(.*)$/u);
  if (match) {
    const emoji = match[1].trim();
    const rest = match[2].trim();
    if (emoji && rest) return { emoji, value: rest };
  }

  if (/rating|star/.test(lowerLabel)) return { emoji: "⭐", value: trimmed };
  if (/revenue|mrr|arr/.test(lowerLabel)) return { emoji: "💰", value: trimmed };
  if (/os|platform/.test(lowerLabel)) return { emoji: "📱", value: trimmed };
  return { emoji: "📌", value: trimmed };
}

function extractFromColumnList(blocks: NotionPageBlock[]): HighlightItem[] {
  for (const block of blocks) {
    if (block.type !== "column_list" || !block.children?.length) continue;

    const columns = block.children.filter((child) => child.type === "column");
    if (columns.length < 2) continue;

    const items: HighlightItem[] = [];
    const used = new Set<string>();

    columns.forEach((column, index) => {
      const children = column.children || [];
      const heading = children.find(
        (child) =>
          (child.type === "heading_1" || child.type === "heading_2" || child.type === "heading_3") &&
          Boolean(child.value?.trim()),
      );
      const labelParagraph = children.find(
        (child) => child.type === "paragraph" && Boolean(child.value?.trim()) && !isLikelyUrl(child.value || ""),
      );

      if (!heading?.value || !labelParagraph?.value) return;

      const label = cleanMetricLabel(labelParagraph.value);
      if (!label) return;
      const canonical = label.toLowerCase();
      if (used.has(canonical)) return;
      used.add(canonical);

      const visual = parseMetricVisual(heading.value, label);
      items.push({
        key: `notion-col-${index}-${canonical}`,
        emoji: visual.emoji,
        value: visual.value,
        label,
      });
    });

    const hasExpectedMetric = items.some((item) => /revenue|rating|geo|country/i.test(item.label));
    if (items.length >= 2 && hasExpectedMetric) {
      return items.sort((a, b) => scoreLabel(a.label) - scoreLabel(b.label)).slice(0, 3);
    }
  }

  return [];
}

function extractHighlightsFromBlocks(blocks: NotionPageBlock[]): HighlightItem[] {
  const fromTop = extractFromColumnList(blocks);
  if (fromTop.length > 0) return fromTop;

  for (const block of blocks) {
    if (!block.children?.length) continue;
    const nested = extractHighlightsFromBlocks(block.children);
    if (nested.length > 0) return nested;
  }

  return [];
}

export default function HighlightsClient({
  slug,
  pageId,
  fallbackHighlights,
}: HighlightsClientProps) {
  const [items, setItems] = useState<HighlightItem[]>(fallbackHighlights);

  const detailsUrl = useMemo(() => {
    if (!pageId) return undefined;
    return `/api/apps/${encodeURIComponent(slug)}/details?pageId=${encodeURIComponent(pageId)}`;
  }, [pageId, slug]);

  useEffect(() => {
    let active = true;

    const applyFromBlocks = (blocks: NotionPageBlock[]) => {
      const parsed = extractHighlightsFromBlocks(blocks);
      if (!active || parsed.length === 0) return;
      setItems(parsed);
    };

    const load = async () => {
      if (!detailsUrl) return;
      const cached = getCachedNotionDetails(detailsUrl);
      if (cached) {
        applyFromBlocks(cached);
        return;
      }

      try {
        const prefetched = await prefetchNotionDetails(detailsUrl);
        applyFromBlocks(prefetched);
      } catch {
        // Keep fallback highlights only.
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [detailsUrl]);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-[12px] w-full leading-[1.2]">
      <p className="font-bold text-[20px]">Highlights</p>
      <div className="flex items-start justify-between w-full text-center gap-[8px]">
        {items.map((item) => (
          <div key={item.key} className="flex flex-[1_0_0] flex-col gap-[6px] items-center text-center">
            <div className="font-bold text-[20px] leading-[1.2]">
              {item.emoji ? <p>{item.emoji}</p> : null}
              <p className="break-words">{item.value}</p>
            </div>
            <p className="text-[12px] text-muted leading-[1.2]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
