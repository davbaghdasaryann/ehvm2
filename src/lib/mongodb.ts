import { MongoClient, type Db } from "mongodb";

type MongoGlobal = {
  mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as unknown as MongoGlobal;

async function getMongoClient(): Promise<MongoClient | null> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "ehvm";
  if (!uri) return null;

  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = new MongoClient(uri).connect();
  }

  try {
    return await globalForMongo.mongoClientPromise;
  } catch (error) {
    // Reset rejected promise so next request can retry.
    globalForMongo.mongoClientPromise = undefined;
    console.error("MongoDB connection failed, falling back to file storage.", error);
    return null;
  }
}

export async function getMongoDb(): Promise<Db | null> {
  const client = await getMongoClient();
  if (!client) return null;
  return client.db(process.env.MONGODB_DB || "ehvm");
}
