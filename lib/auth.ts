import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

function sanitizeDbName(name?: string): string {
  if (!name) return "zeroplate";
  const clean = name.replace(/[/\\. "$*<>:|?]/g, "_").trim();
  return clean || "zeroplate";
}

function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI || "";
  if (!envUri || envUri.includes("<db_password>") || envUri.includes("<password>")) {
    return "mongodb://127.0.0.1:27017/zeroplate";
  }
  return envUri;
}

const uri = getMongoUri();
const dbName = sanitizeDbName(process.env.MONGODB_DB_NAME || "zeroplate");

declare global {
  // eslint-disable-next-line no-var
  var _mongoAuthClient: MongoClient | undefined;
}

let client: MongoClient;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoAuthClient) {
    global._mongoAuthClient = new MongoClient(uri);
  }
  client = global._mongoAuthClient;
} else {
  client = new MongoClient(uri);
}

const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "zeroplate_auth_dev_secret_secure_key_2026_antigravity",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        input: true,
      },
      profileCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
