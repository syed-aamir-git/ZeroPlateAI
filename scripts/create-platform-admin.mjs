// One-Time Secure Platform Admin Setup Script (Functional PRD Section 12.8)
// Usage:
//   node scripts/create-platform-admin.mjs
// Or with custom env variables:
//   ADMIN_EMAIL="ops@zeroplate.ai" ADMIN_PASSWORD="SecureAdminPassword123!" node scripts/create-platform-admin.mjs

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function main() {
  console.log("=== ONE-TIME SECURE PLATFORM ADMIN INITIALIZATION ===");

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  // Read credentials from env or CLI flags
  const args = process.argv.slice(2);
  const getArg = (key) => {
    const idx = args.indexOf(key);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
  };

  const adminEmail = process.env.ADMIN_EMAIL || getArg("--email") || "platform_admin@zeroplate.ai";
  const adminPassword = process.env.ADMIN_PASSWORD || getArg("--password") || "ZeroPlateAdmin2026!Secure";
  const adminName = process.env.ADMIN_NAME || getArg("--name") || "Chief Compliance Officer";
  const department = process.env.ADMIN_DEPARTMENT || getArg("--department") || "Food Safety & Regulatory Compliance";

  // Check if this specific platform admin already exists
  const existingAdmin = await db.collection("user").findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`\nPlatform Admin account (${adminEmail}) already exists:`);
    console.log(`- Email: ${existingAdmin.email}`);
    console.log(`- Role: ${existingAdmin.role}`);
    console.log(`- ID: ${existingAdmin._id}`);
    console.log(`\nNo action taken to prevent duplicate administration accounts.`);
    await client.close();
    process.exit(0);
  }

  console.log(`\nRegistering real Platform Admin account...`);
  console.log(`- Email: ${adminEmail}`);
  console.log(`- Name: ${adminName}`);
  console.log(`- Department: ${department}`);

  const regRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      name: adminName,
      role: "platform_admin",
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok) {
    throw new Error(`Failed to create platform admin account: ${JSON.stringify(regData)}`);
  }

  const userId = regData.user?.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  // Complete profile in database directly as per Section 12.8
  await db.collection("user").updateOne(
    { _id: userObjectId },
    { $set: { role: "platform_admin", profileCompleted: true, updatedAt: new Date() } }
  );

  await db.collection("adminProfiles").insertOne({
    userId: userObjectId,
    name: adminName,
    department,
    createdAt: new Date(),
  });

  // Log setup to immutable audit trail
  await db.collection("auditLogs").insertOne({
    entityType: "User",
    entityId: userObjectId,
    action: "platform_admin_setup",
    ruleApplied: "one_time_admin_initialization",
    status: "verified_safe",
    performedBy: userObjectId,
    details: {
      email: adminEmail,
      department,
    },
    createdAt: new Date(),
  });

  console.log(`\n✓ Platform Admin successfully initialized with ID: ${userObjectId}`);
  console.log(`✓ Audit log entry recorded.`);
  console.log(`\nYou can now log in at ${BASE_URL}/login using:`);
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: [HIDDEN]`);

  await client.close();
}

main().catch((err) => {
  console.error("Platform admin creation failed:", err);
  process.exit(1);
});
