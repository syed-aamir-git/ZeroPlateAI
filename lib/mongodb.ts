import { MongoClient, Db } from "mongodb";

function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI || "";
  if (!envUri || envUri.includes("<db_password>") || envUri.includes("<password>")) {
    return "mongodb://127.0.0.1:27017/zeroplate";
  }
  return envUri;
}

const uri = getMongoUri();
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!process.env.MONGODB_URI) {
  // In development/build without credentials, provide a deferred promise or throw when accessed
  clientPromise = Promise.reject(
    new Error("Please define the MONGODB_URI environment variable inside .env.local")
  );
  // Suppress uncaught rejection warning until explicitly called
  clientPromise.catch(() => {});
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

function sanitizeDbName(name?: string): string {
  if (!name) return "zeroplate";
  // MongoDB forbids: /\. "$*<>:|?
  const clean = name.replace(/[/\\. "$*<>:|?]/g, "_").trim();
  return clean || "zeroplate";
}

export async function getDb(dbName?: string): Promise<Db> {
  const clientInstance = await clientPromise;
  const targetDb = sanitizeDbName(dbName || process.env.MONGODB_DB_NAME || "zeroplate");
  return clientInstance.db(targetDb);
}

export default clientPromise;
