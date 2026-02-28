"use client";

import type { NotionPageBlock } from "@/data/apps";

type NotionDetailsCacheEntry = {
  blocks: NotionPageBlock[];
  savedAt: number;
};

const DETAILS_CACHE_TTL_MS = 60 * 60 * 1000;
const detailsMemoryCache = new Map<string, NotionDetailsCacheEntry>();
const detailsInFlight = new Map<string, Promise<NotionPageBlock[]>>();

function getStorageKey(url: string): string {
  return `ehvm:notion-details:v2:${url}`;
}

function isFresh(entry: NotionDetailsCacheEntry | null | undefined): entry is NotionDetailsCacheEntry {
  return Boolean(entry && Date.now() - entry.savedAt < DETAILS_CACHE_TTL_MS);
}

function readSessionEntry(url: string): NotionDetailsCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getStorageKey(url);
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { blocks?: NotionPageBlock[]; savedAt?: number };
    if (!Array.isArray(parsed.blocks) || typeof parsed.savedAt !== "number") return null;
    return { blocks: parsed.blocks, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function writeSessionEntry(url: string, entry: NotionDetailsCacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(url);
    const serialized = JSON.stringify(entry);
    localStorage.setItem(key, serialized);
    sessionStorage.setItem(key, serialized);
  } catch {
    // Ignore storage quota/private mode issues.
  }
}

function saveEntry(url: string, blocks: NotionPageBlock[]): NotionPageBlock[] {
  const entry: NotionDetailsCacheEntry = { blocks, savedAt: Date.now() };
  detailsMemoryCache.set(url, entry);
  writeSessionEntry(url, entry);
  return blocks;
}

async function fetchNotionDetails(url: string): Promise<NotionPageBlock[]> {
  const response = await fetch(url);
  if (!response.ok) return saveEntry(url, []);
  const data = (await response.json()) as { blocks?: NotionPageBlock[] };
  const blocks = Array.isArray(data.blocks) ? data.blocks : [];
  return saveEntry(url, blocks);
}

export function getCachedNotionDetails(url?: string): NotionPageBlock[] | null {
  if (!url) return null;

  const memoryEntry = detailsMemoryCache.get(url);
  if (isFresh(memoryEntry)) return memoryEntry.blocks;

  const sessionEntry = readSessionEntry(url);
  if (isFresh(sessionEntry)) {
    detailsMemoryCache.set(url, sessionEntry);
    return sessionEntry.blocks;
  }

  return null;
}

export function prefetchNotionDetails(url?: string): Promise<NotionPageBlock[]> {
  if (!url) return Promise.resolve([]);

  const cached = getCachedNotionDetails(url);
  if (cached) return Promise.resolve(cached);

  const inFlight = detailsInFlight.get(url);
  if (inFlight) return inFlight;

  const request = fetchNotionDetails(url).finally(() => {
    detailsInFlight.delete(url);
  });

  detailsInFlight.set(url, request);
  return request;
}
