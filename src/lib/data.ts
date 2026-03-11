import { unstable_cache } from "next/cache";
import type { App } from "@/data/apps";
import {
  type Article,
  type ContentBlock,
} from "@/data/articles";
import { readAdminDb } from "@/lib/adminDb";
import type { AdminNewsRecord } from "@/admin/types";
import { mapAdminRecordToApp, type ParsedAppContent } from "@/lib/adminMapping";

export type { App, Article, ContentBlock, ParsedAppContent };

type AppsPayload = {
  apps: App[];
  parsedByPageId: Record<string, ParsedAppContent>;
};
type NewsPayload = {
  articles: Article[];
};
const hasMongoConfigured = Boolean(process.env.MONGODB_URI?.trim());
let lastNonEmptyAppsPayload: AppsPayload | null = null;
let lastNonEmptyNewsPayload: NewsPayload | null = null;

const getCachedAppsPayload = unstable_cache(
  async (): Promise<AppsPayload> => {
    const db = await readAdminDb();

    const publishedApps = db.apps.filter((record) => record.status === "published");
    const sourceApps = publishedApps.length > 0 ? publishedApps : db.apps;

    const mapped = sourceApps.map(mapAdminRecordToApp);

    const parsedByPageId: Record<string, ParsedAppContent> = {};
    mapped.forEach(({ app, parsedContent }) => {
      if (app.notionPageId) {
        parsedByPageId[app.notionPageId] = parsedContent;
      }
    });

    const payload = {
      apps: mapped.map((entry) => entry.app),
      parsedByPageId,
    };

    if (payload.apps.length > 0) {
      lastNonEmptyAppsPayload = payload;
      return payload;
    }

    if (hasMongoConfigured && lastNonEmptyAppsPayload) {
      console.warn("Using last non-empty apps payload to avoid transient empty MongoDB response.");
      return lastNonEmptyAppsPayload;
    }

    return payload;
  },
  ["ehvm-admin-apps-payload"],
  { tags: ["apps-data"], revalidate: 60 },
);
const getCachedNewsPayload = unstable_cache(
  async (): Promise<NewsPayload> => {
    const db = await readAdminDb();
    const source = db.news.filter((item) => item.published);
    const records = source.length > 0 ? source : db.news;

    if (records.length === 0) {
      if (hasMongoConfigured && lastNonEmptyNewsPayload) {
        console.warn("Using last non-empty news payload to avoid transient empty MongoDB response.");
        return lastNonEmptyNewsPayload;
      }
      return { articles: [] };
    }

    const articles = records
      .map(mapAdminNewsToArticle)
      .sort((a, b) => {
        const aTime = a.date ? Date.parse(a.date) : 0;
        const bTime = b.date ? Date.parse(b.date) : 0;
        return bTime - aTime;
      });

    const payload = { articles };
    if (payload.articles.length > 0) {
      lastNonEmptyNewsPayload = payload;
    }
    return payload;
  },
  ["ehvm-admin-news-payload"],
  { tags: ["news-data"], revalidate: 60 },
);

async function getAppsPayload(): Promise<AppsPayload> {
  return getCachedAppsPayload();
}
async function getNewsPayload(): Promise<NewsPayload> {
  return getCachedNewsPayload();
}

function mapAdminNewsToArticle(item: AdminNewsRecord): Article {
  const fallbackDate = new Date(item.updatedAt || Date.now()).toISOString();
  return {
    slug: item.slug,
    title: item.title,
    subtitle: item.subtitle || undefined,
    quote: item.quote || undefined,
    buttonLabel: item.buttonLabel || undefined,
    buttonUrl: item.buttonUrl || undefined,
    category: item.category,
    thumbnail: item.image || "",
    date: fallbackDate,
    featured: item.featured,
  };
}

export async function getApps(): Promise<App[]> {
  return (await getAppsPayload()).apps;
}

export async function getAppBySlug(slug: string): Promise<App | undefined> {
  const apps = await getApps();
  return apps.find((app) => app.slug === slug);
}

export async function getAppParsedContentByPageId(pageId: string): Promise<ParsedAppContent> {
  const payload = await getAppsPayload();
  return payload.parsedByPageId[pageId] || {};
}

export async function getAppSlugs(): Promise<string[]> {
  const apps = await getApps();
  return apps.map((app) => app.slug);
}

export async function getFeaturedApps(): Promise<App[]> {
  const allApps = await getApps();
  const featured = allApps.filter((app) => app.featured);
  return featured.length > 0 ? featured : allApps.slice(0, 6);
}

export async function getAppCategories(): Promise<string[]> {
  const allApps = await getApps();
  const categories = [...new Set(allApps.map((app) => app.category).filter(Boolean))];
  return ["All", ...categories];
}

export async function getArticles(): Promise<Article[]> {
  return (await getNewsPayload()).articles;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const allArticles = await getArticles();
  return allArticles.find((article) => article.slug === slug);
}

export async function getArticleSlugs(): Promise<string[]> {
  const allArticles = await getArticles();
  return allArticles.map((article) => article.slug);
}
