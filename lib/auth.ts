import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const DEFAULT_MONGODB_URI =
  "mongodb+srv://rajjasani08_db_user:SBCIcDaPAqk1DUtj@cluster0.chrxzvr.mongodb.net/ZeroPlate_ai_MVP?retryWrites=true&w=majority";

function sanitizeDbName(name?: string): string {
  if (!name) return "ZeroPlate_ai_MVP";
  const clean = name.replace(/[/\\. "$*<>:|?]/g, "_").trim();
  return clean || "ZeroPlate_ai_MVP";
}

function getMongoUri(): string {
  const envUri = process.env.MONGODB_URI || "";
  if (!envUri || envUri.includes("<db_password>") || envUri.includes("<password>")) {
    return DEFAULT_MONGODB_URI;
  }
  return envUri;
}

const uri = getMongoUri();
const dbName = sanitizeDbName(process.env.MONGODB_DB_NAME || "ZeroPlate_ai_MVP");

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

function getBaseUrl(): string {
  if (process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes("localhost")) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
}

const db = client.db(dbName);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "zeroplate_auth_dev_secret_secure_key_2026_antigravity",
  baseURL: getBaseUrl(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
  ],
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
