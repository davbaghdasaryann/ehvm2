import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminDatabase, AdminNewsRecord, AppRecord } from "@/admin/types";
import { getMongoDb } from "@/lib/mongodb";

const DB_PATH = path.join(process.cwd(), "src/data/admin-db.json");
const APPS_COLLECTION = "apps";
const NEWS_COLLECTION = "news";
const LEGACY_STATE_COLLECTION = "admin_state";
const LEGACY_APPS_DOC_ID = "apps";

function normalizeDatabase(parsed: unknown): AdminDatabase {
  if (!parsed || typeof parsed !== "object") {
    return { apps: [], news: [] };
  }

  const maybeApps = (parsed as { apps?: unknown }).apps;
  const maybeNews = (parsed as { news?: unknown }).news;

  return {
    apps: Array.isArray(maybeApps) ? (maybeApps as AppRecord[]) : [],
    news: Array.isArray(maybeNews) ? (maybeNews as AdminNewsRecord[]) : [],
  };
}

export async function readAdminDb(): Promise<AdminDatabase> {
  const mongoDb = await getMongoDb();
  if (mongoDb) {
    try {
      const docs = await mongoDb
        .collection<AppRecord & { _id?: string; updatedAtMongo?: Date }>(APPS_COLLECTION)
        .find({})
        .toArray();
      const newsDocs = await mongoDb
        .collection<AdminNewsRecord & { _id?: string; updatedAtMongo?: Date }>(NEWS_COLLECTION)
        .find({})
        .toArray();

      if (docs.length > 0) {
        const apps = docs.map((doc) => {
          const normalized = doc as AppRecord & { _id?: string; updatedAtMongo?: Date };
          const id = String(normalized.id || normalized._id || "");
          return {
            id,
            updatedAt: normalized.updatedAt,
            status: normalized.status,
            featured: normalized.featured,
            ndaRequired: normalized.ndaRequired,
            meta: normalized.meta,
            kpis: normalized.kpis,
            financials: normalized.financials,
            charts: normalized.charts,
            funnel: normalized.funnel,
            product: normalized.product,
            market: normalized.market,
            opportunities: normalized.opportunities,
            contact: normalized.contact,
            media: normalized.media,
          };
        });

        const validApps = apps.filter(
          (app): app is AppRecord => Boolean(app.id && app.meta && app.contact && app.media),
        );

        const news = newsDocs.map((doc) => {
          const normalized = doc as AdminNewsRecord & { _id?: string; updatedAtMongo?: Date };
          const id = String(normalized.id || normalized._id || "");
          return {
            id,
            slug: normalized.slug,
            title: normalized.title,
            subtitle: normalized.subtitle,
            quote: normalized.quote,
            image: normalized.image,
            buttonLabel: normalized.buttonLabel,
            buttonUrl: normalized.buttonUrl,
            category: normalized.category,
            featured: Boolean(normalized.featured),
            published: Boolean(normalized.published),
            updatedAt: normalized.updatedAt,
          };
        });

        const validNews = news.filter(
          (item): item is AdminNewsRecord => Boolean(item.id && item.slug && item.title),
        );

        return { apps: validApps, news: validNews };
      }

      // Legacy fallback: migrate from single-document admin_state -> apps collection.
      const legacy = await mongoDb
        .collection<{ _id: string; apps?: AppRecord[] }>(LEGACY_STATE_COLLECTION)
        .findOne({ _id: LEGACY_APPS_DOC_ID });

      const legacyApps = Array.isArray(legacy?.apps) ? legacy.apps : [];
      if (legacyApps.length > 0) {
        const collection = mongoDb.collection<AppRecord & { _id: string; updatedAtMongo?: Date }>(APPS_COLLECTION);
        const now = new Date();
        await collection.bulkWrite(
          legacyApps.map((app) => ({
            replaceOne: {
              filter: { _id: app.id },
              replacement: { ...app, _id: app.id, updatedAtMongo: now },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }

      return { apps: legacyApps, news: [] };
    } catch (error) {
      console.error("Failed to read admin data from MongoDB. Falling back to file.", error);
    }
  }

  try {
    const raw = await readFile(DB_PATH, "utf8");
    return normalizeDatabase(JSON.parse(raw));
  } catch {
    return { apps: [], news: [] };
  }
}

export async function writeAdminDb(db: AdminDatabase): Promise<void> {
  const mongoDb = await getMongoDb();
  if (mongoDb) {
    try {
      const appsCollection = mongoDb.collection<AppRecord & { _id: string; updatedAtMongo?: Date }>(APPS_COLLECTION);
      const newsCollection = mongoDb.collection<AdminNewsRecord & { _id: string; updatedAtMongo?: Date }>(NEWS_COLLECTION);
      const now = new Date();
      const apps = db.apps.filter((app) => Boolean(app.id));
      const news = db.news.filter((item) => Boolean(item.id));
      const ids = apps.map((app) => app.id);
      const newsIds = news.map((item) => item.id);

      if (apps.length > 0) {
        await appsCollection.bulkWrite(
          apps.map((app) => ({
            replaceOne: {
              filter: { _id: app.id },
              replacement: { ...app, _id: app.id, updatedAtMongo: now },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }

      if (news.length > 0) {
        await newsCollection.bulkWrite(
          news.map((item) => ({
            replaceOne: {
              filter: { _id: item.id },
              replacement: { ...item, _id: item.id, updatedAtMongo: now },
              upsert: true,
            },
          })),
          { ordered: false },
        );
      }

      if (ids.length > 0) {
        await appsCollection.deleteMany({ _id: { $nin: ids } });
      } else {
        await appsCollection.deleteMany({});
      }

      if (newsIds.length > 0) {
        await newsCollection.deleteMany({ _id: { $nin: newsIds } });
      } else {
        await newsCollection.deleteMany({});
      }

      return;
    } catch (error) {
      console.error("Failed to write admin data to MongoDB. Falling back to file.", error);
    }
  }

  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
}
