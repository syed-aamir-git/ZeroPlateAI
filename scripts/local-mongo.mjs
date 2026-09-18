import { MongoMemoryServer } from "mongodb-memory-server";
import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), ".mongodb-data");
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

async function start() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbPath: dbPath,
      storageEngine: "wiredTiger",
    },
  });

  const uri = mongod.getUri();
  console.log(`[ZeroPlate Local MongoDB] Real MongoDB instance running at: ${uri}`);
  console.log(`[ZeroPlate Local MongoDB] Data persisted at: ${dbPath}`);

  process.on("SIGINT", async () => {
    await mongod.stop();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await mongod.stop();
    process.exit(0);
  });
}

start().catch(console.error);
