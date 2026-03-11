import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AdminDatabase, AdminNewsRecord, AppRecord } from "@/admin/types";
import { getMongoDb } from "@/lib/mongodb";

const DB_PATH = path.join(process.cwd(), "src/data/admin-db.json");
const APPS_COLLECTION = "apps";
const NEWS_COLLECTION = "news";
const LEGACY_STATE_COLLECTION = "admin_state";
const LEGACY_APPS_DOC_ID = "apps";
const hasMongoConfigured = Boolean(process.env.MONGODB_URI?.trim());
let lastKnownDb: AdminDatabase | null = null;

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

function cloneDatabase(db: AdminDatabase): AdminDatabase {
  return {
    apps: [...db.apps],
    news: [...db.news],
  };
}

function rememberDatabase(db: AdminDatabase): void {
  if (db.apps.length === 0 && db.news.length === 0) return;
  lastKnownDb = cloneDatabase(db);
}

async function readAdminDbFromFile(): Promise<AdminDatabase> {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    return normalizeDatabase(JSON.parse(raw));
  } catch {
    return { apps: [], news: [] };
  }
}

async function writeAdminDbToFile(db: AdminDatabase): Promise<void> {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  await writeFile(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, "utf8");
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

        const nextDb = { apps: validApps, news: validNews };
        rememberDatabase(nextDb);
        return nextDb;
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

      const nextDb = { apps: legacyApps, news: [] };
      rememberDatabase(nextDb);
      return nextDb;
    } catch (error) {
      console.error("Failed to read admin data from MongoDB.", error);
    }
  }

  if (hasMongoConfigured && lastKnownDb) {
    console.warn("Using last known in-memory admin DB snapshot after MongoDB read failure.");
    return cloneDatabase(lastKnownDb);
  }

  const fileDb = await readAdminDbFromFile();
  if (hasMongoConfigured && (fileDb.apps.length > 0 || fileDb.news.length > 0)) {
    console.warn("Using local file backup because MongoDB is currently unavailable.");
  }
  rememberDatabase(fileDb);
  return fileDb;
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

      rememberDatabase({ apps, news });
      // Best-effort local mirror; useful as a fallback snapshot in local/dev.
      try {
        await writeAdminDbToFile({ apps, news });
      } catch (fileError) {
        console.warn("Failed to mirror admin DB to local file after MongoDB write.", fileError);
      }
      return;
    } catch (error) {
      console.error("Failed to write admin data to MongoDB.", error);
      if (hasMongoConfigured) {
        throw error;
      }
    }
  }

  await writeAdminDbToFile(db);
  rememberDatabase(db);
}
