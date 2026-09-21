import { MongoClient, Db } from "mongodb";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://rajjasani08_db_user:SBCIcDaPAqk1DUtj@cluster0.chrxzvr.mongodb.net/ZeroPlate_ai_MVP?retryWrites=true&w=majority";

function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI || "";
  if (!envUri || envUri.includes("<db_password>") || envUri.includes("<password>")) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

const uri = getMongoUri();
const options = {
  maxPoolSize: 20,
  minPoolSize: 1,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 20000,
  serverSelectionTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

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

function sanitizeDbName(name?: string): string {
  if (!name) return "ZeroPlate_ai_MVP";
  // MongoDB forbids: /\. "$*<>:|?
  const clean = name.replace(/[/\\. "$*<>:|?]/g, "_").trim();
  return clean || "ZeroPlate_ai_MVP";
}

export async function getDb(dbName?: string): Promise<Db> {
  const clientInstance = await clientPromise;
  const targetDb = sanitizeDbName(dbName || process.env.MONGODB_DB_NAME || "ZeroPlate_ai_MVP");
  return clientInstance.db(targetDb);
}

export default clientPromise;
