import type { MetadataRoute } from "next";
import { getAppSlugs, getArticleSlugs, getPublishedStories } from "@/lib/data";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://ehvmcapital.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [appSlugs, articleSlugs, stories] = await Promise.all([
    getAppSlugs(),
    getArticleSlugs(),
    getPublishedStories(),
  ]);
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/apps`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/news`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/news/all`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  const appRoutes = appSlugs.map((slug) => ({
    url: `${SITE_URL}/apps/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  const articleRoutes = articleSlugs.map((slug) => ({
    url: `${SITE_URL}/news/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.65,
  }));

  const storyRoutes = stories.map((story) => ({
    url: `${SITE_URL}/story/${story.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...appRoutes, ...articleRoutes, ...storyRoutes];
}
