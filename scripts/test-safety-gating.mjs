// Automated Safety Gating Verification Script
// Tests:
// 1. Authenticate real Institution Admin via Better-Auth
// 2. Add inventory item past 4-hour cooked threshold -> attempt listing -> expect 422 Rejection + audit log
// 3. Add inventory item within safe window -> attempt listing -> expect 201 Verified Safe + audit log
// 4. Verify MongoDB collections: inventoryItems, surplusListings, auditLogs, institutions

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function main() {
  console.log("=== STARTING SAFETY GATING VERIFICATION TEST ===");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const testEmail = `admin_tester_${Date.now()}@kitchen.org`;
  const testPassword = "SecurePassword123!";
  const testName = "Executive Chef Test";

  console.log(`\n1. Registering Institution Admin account: ${testEmail}`);
  const regRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
      role: "institution_admin",
    }),
  });

  const regData = await regRes.json();
  if (!regRes.ok) {
    throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
  }

  // Extract session cookies
  const rawSetCookie = regRes.headers.get("set-cookie") || "";
  const cookies = rawSetCookie
    .split(/,(?=[^;]+;)/)
    .map((c) => c.split(";")[0].trim())
    .join("; ");

  console.log("✓ User created and session obtained.");

  // Complete Onboarding
  console.log("\n2. Completing Institution onboarding profile...");
  const onboardRes = await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      role: "institution_admin",
      details: {
        name: "Central University Dining Hall",
        type: "college",
        address: "Campus Gate 3, New Delhi",
        lat: 28.545,
        lng: 77.192,
        plan: "free",
      },
    }),
  });

  const onboardData = await onboardRes.json();
  if (!onboardRes.ok || !onboardData.success) {
    throw new Error(`Onboarding failed: ${JSON.stringify(onboardData)}`);
  }
  console.log("✓ Institution profile established.");

  // 3. Create Item A (Expired / Past 4 hours cooked food)
  console.log("\n3. Creating Item A: Cooked food prepared 5 hours ago (PAST 4H THRESHOLD)...");
  const now = new Date();
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const itemARes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      name: "Steam Rice & Dal Makhani (Batch 1)",
      category: "cooked_food",
      quantity: 30,
      unit: "kg",
      preparedOrReceivedAt: fiveHoursAgo.toISOString(),
      expiryEstimateAt: threeHoursFromNow.toISOString(),
    }),
  });

  const itemAData = await itemARes.json();
  if (!itemARes.ok) {
    throw new Error(`Item A creation failed: ${JSON.stringify(itemAData)}`);
  }
  const itemAId = itemAData.item._id;
  console.log(`✓ Item A created with ID: ${itemAId}`);

  // Attempt to list Item A -> EXPECT 422 SAFETY REJECTION
  console.log("\n4. Testing Safety Gating Rejection on Item A...");
  const listARes = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      inventoryItemId: itemAId,
      quantity: 25,
      pickupWindow: {
        start: now.toISOString(),
        end: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      },
      pickupLocation: {
        address: "Campus Gate 3 Kitchen Dispatch",
        lat: 28.545,
        lng: 77.192,
      },
    }),
  });

  const listAData = await listARes.json();
  console.log(`HTTP Status: ${listARes.status}`);
  console.log("Server Response:", listAData);

  if (listARes.status !== 422) {
    throw new Error(`Expected status 422, but got ${listARes.status}`);
  }
  if (listAData.safetyStatus !== "rejected" || listAData.ruleApplied !== "cooked_food_4h_threshold") {
    throw new Error(`Expected cooked_food_4h_threshold rejection, got: ${JSON.stringify(listAData)}`);
  }
  console.log("✓ SUCCESS: Server correctly rejected Item A with rule 'cooked_food_4h_threshold'!");

  // Verify audit log in MongoDB for Item A
  const auditA = await db.collection("auditLogs").findOne({
    entityId: new ObjectId(itemAId),
    ruleApplied: "cooked_food_4h_threshold",
  });
  if (!auditA || auditA.status !== "rejected") {
    throw new Error(`MongoDB audit log record missing or incorrect for Item A: ${JSON.stringify(auditA)}`);
  }
  console.log("✓ SUCCESS: Audit log entry confirmed in MongoDB for rejected Item A.");

  // 5. Create Item B (Fresh cooked food: 1 hour ago, safe shelf life)
  console.log("\n5. Creating Item B: Fresh cooked food prepared 1 hour ago (WITHIN SAFE WINDOW)...");
  const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const itemBRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      name: "Paneer Pulao (Lunch Surplus)",
      category: "cooked_food",
      quantity: 20,
      unit: "kg",
      preparedOrReceivedAt: oneHourAgo.toISOString(),
      expiryEstimateAt: twoHoursFromNow.toISOString(),
    }),
  });

  const itemBData = await itemBRes.json();
  if (!itemBRes.ok) {
    throw new Error(`Item B creation failed: ${JSON.stringify(itemBData)}`);
  }
  const itemBId = itemBData.item._id;
  console.log(`✓ Item B created with ID: ${itemBId}`);

  // Attempt to list Item B -> EXPECT 201 VERIFIED SAFE
  console.log("\n6. Testing Safety Gating Approval on Item B...");
  // Window ends 2 hours after prep time (total 2.5h < 4h max)
  const windowEnd = new Date(oneHourAgo.getTime() + 2.5 * 60 * 60 * 1000);
  const listBRes = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      inventoryItemId: itemBId,
      quantity: 15,
      pickupWindow: {
        start: now.toISOString(),
        end: windowEnd.toISOString(),
      },
      pickupLocation: {
        address: "Campus Gate 3 Kitchen Dispatch",
        lat: 28.545,
        lng: 77.192,
      },
    }),
  });

  const listBData = await listBRes.json();
  console.log(`HTTP Status: ${listBRes.status}`);
  console.log("Server Response:", listBData);

  if (listBRes.status !== 201) {
    throw new Error(`Expected status 201, but got ${listBRes.status}: ${JSON.stringify(listBData)}`);
  }
  if (listBData.safetyStatus !== "verified_safe" || !["pending", "matched"].includes(listBData.listing.status)) {
    throw new Error(`Expected verified_safe listing, got: ${JSON.stringify(listBData)}`);
  }
  console.log("✓ SUCCESS: Server correctly approved Item B as 'verified_safe'!");

  // Verify audit log in MongoDB for Item B
  const auditB = await db.collection("auditLogs").findOne({
    entityId: new ObjectId(itemBId),
    status: "verified_safe",
  });
  if (!auditB) {
    throw new Error("MongoDB audit log record missing for verified safe Item B");
  }
  console.log("✓ SUCCESS: Audit log entry confirmed in MongoDB for verified safe Item B.");

  // Verify Item B status in inventory transitioned to "listed"
  const updatedItemB = await db.collection("inventoryItems").findOne({
    _id: new ObjectId(itemBId),
  });
  if (updatedItemB.status !== "listed") {
    throw new Error(`Expected inventory item status to be 'listed', got: ${updatedItemB.status}`);
  }
  console.log("✓ SUCCESS: Inventory item status correctly transitioned to 'listed'.");

  // 7. Verify Settings & Plan Update
  console.log("\n7. Testing Settings profile and plan updates...");
  const settingsRes = await fetch(`${BASE_URL}/api/v1/institution/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies,
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      plan: "premium",
      address: "Campus Gate 3 Logistics Bay",
    }),
  });

  const settingsData = await settingsRes.json();
  if (!settingsRes.ok || settingsData.institution.plan !== "premium") {
    throw new Error(`Plan upgrade failed: ${JSON.stringify(settingsData)}`);
  }
  console.log("✓ SUCCESS: Plan tier upgraded to 'premium' and address updated.");

  // 8. Verify Overview Metrics
  console.log("\n8. Testing Overview computed metrics...");
  const metricsRes = await fetch(`${BASE_URL}/api/v1/institution/metrics`, {
    headers: { Cookie: cookies },
  });
  const metricsData = await metricsRes.json();
  if (!metricsRes.ok || !metricsData.success) {
    throw new Error(`Failed to load metrics: ${JSON.stringify(metricsData)}`);
  }
  console.log("Computed Metrics:", metricsData.metrics);
  console.log(`Recent Activity items: ${metricsData.recentActivity.length}`);
  console.log("✓ SUCCESS: Overview metrics computed from real database collections.");

  await client.close();
  console.log("\n=======================================================");
  console.log("ALL SAFETY GATING AND INSTITUTION TESTS PASSED 100%!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
