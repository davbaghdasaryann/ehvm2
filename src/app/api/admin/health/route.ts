import { NextResponse } from "next/server";
import { isAdminRequestAuthorized } from "@/lib/adminAuth";
import { getMongoDb } from "@/lib/mongodb";
import { readAdminDb } from "@/lib/adminDb";
import { getApps, getFeaturedApps } from "@/lib/data";

export const runtime = "nodejs";

const APPS_COLLECTION = "apps";
const NEWS_COLLECTION = "news";

export async function GET(request: Request) {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mongoConfigured = Boolean(process.env.MONGODB_URI?.trim());
  const dbName = process.env.MONGODB_DB || "ehvm";
  const mongoDb = await getMongoDb();

  let mongo = {
    configured: mongoConfigured,
    connected: Boolean(mongoDb),
    dbName,
    appsCount: 0,
    publishedCount: 0,
    featuredCount: 0,
    newsCount: 0,
    error: undefined as string | undefined,
  };

  if (mongoDb) {
    try {
      const appsCollection = mongoDb.collection(APPS_COLLECTION);
      const newsCollection = mongoDb.collection(NEWS_COLLECTION);
      const [appsCount, publishedCount, featuredCount, newsCount] = await Promise.all([
        appsCollection.countDocuments({}),
        appsCollection.countDocuments({ status: "published" }),
        appsCollection.countDocuments({ featured: true }),
        newsCollection.countDocuments({}),
      ]);

      mongo = {
        ...mongo,
        appsCount,
        publishedCount,
        featuredCount,
        newsCount,
      };
    } catch (error) {
      mongo = {
        ...mongo,
        error: error instanceof Error ? error.message : "Unknown MongoDB count error.",
      };
    }
  }

  const [adminDb, apps, featuredApps] = await Promise.all([
    readAdminDb(),
    getApps(),
    getFeaturedApps(),
  ]);

  return NextResponse.json({
    mongo,
    resolvedData: {
      adminDbAppsCount: adminDb.apps.length,
      adminDbPublishedCount: adminDb.apps.filter((app) => app.status === "published").length,
      adminDbFeaturedCount: adminDb.apps.filter((app) => app.featured).length,
      publicAppsCount: apps.length,
      homepageAppsCount: featuredApps.length,
      homepageAppSlugs: featuredApps.map((app) => app.slug),
    },
  });
}
