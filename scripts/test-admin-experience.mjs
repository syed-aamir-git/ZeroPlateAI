// Automated Verification Script for Platform Admin Experience
// Tests:
// 1. Authenticate real Platform Admin account
// 2. GET /api/v1/admin/overview -> verify platform-wide aggregate counts
// 3. NGO Verification queue -> approve an NGO & verify audit log
// 4. Institutions directory -> verify onboarded institutions list
// 5. Dynamic Safety Rules:
//    - Update cookedFoodMaxHours to 3 in DB
//    - Attempt listing item cooked 3.5h ago -> MUST BE REJECTED (422) by dynamic rule
//    - Restore cookedFoodMaxHours to 4 in DB
//    - Attempt listing item cooked 3.5h ago -> MUST BE APPROVED (201)
// 6. GET /api/v1/admin/audit-log -> verify pagination & filtering
// 7. GET /api/v1/admin/users -> verify users across roles

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function main() {
  console.log("=== STARTING PLATFORM ADMIN EXPERIENCE VERIFICATION ===");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const timestamp = Date.now();

  // Helper to log in as Platform Admin
  console.log("\n1. Authenticating as Platform Admin (platform_admin@zeroplate.ai)...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({
      email: "platform_admin@zeroplate.ai",
      password: "ZeroPlateAdmin2026!Secure",
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Admin login failed: ${await loginRes.text()}`);
  }

  const rawSetCookie = loginRes.headers.get("set-cookie") || "";
  const adminCookies = rawSetCookie
    .split(/,(?=[^;]+;)/)
    .map((c) => c.split(";")[0].trim())
    .join("; ");

  console.log("✓ Admin authenticated and session established.");

  // Helper to register other users for testing
  async function registerUser(email, name, role) {
    const regRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email, password: "SecurePassword123!", name, role }),
    });
    const cookieHeader = regRes.headers.get("set-cookie") || "";
    return cookieHeader
      .split(/,(?=[^;]+;)/)
      .map((c) => c.split(";")[0].trim())
      .join("; ");
  }

  // 2. Test GET /api/v1/admin/overview
  console.log("\n2. Testing GET /api/v1/admin/overview...");
  const overviewRes = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
    headers: { Cookie: adminCookies },
  });
  const overviewData = await overviewRes.json();
  if (!overviewRes.ok || !overviewData.success) {
    throw new Error(`Failed to load admin overview: ${JSON.stringify(overviewData)}`);
  }
  console.log("✓ Platform Analytics retrieved:", overviewData.metrics);
  console.log(`✓ Recent audit log events: ${overviewData.recentLogs.length}`);

  // 3. Test NGO Verification Queue and Action
  console.log("\n3. Testing NGO Verification Queue and Approval Action...");
  const testNgoEmail = `ngo_verify_${timestamp}@shelter.org`;
  const ngoCookies = await registerUser(testNgoEmail, "Navodaya Shelter", "ngo");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "ngo",
      details: {
        orgName: "Navodaya Shelter Trust",
        registrationNumber: `DL/NGO/NAV/${timestamp}`,
        contactPhone: "+91 98777 66655",
        serviceArea: "Central Delhi Community Belt",
        capacityPerWeek: 750,
      },
    }),
  });

  // Query pending queue
  const queueRes = await fetch(`${BASE_URL}/api/v1/admin/ngo-verification?status=pending`, {
    headers: { Cookie: adminCookies },
  });
  const queueData = await queueRes.json();
  const targetNgo = queueData.ngos.find((n) => n.registrationNumber === `DL/NGO/NAV/${timestamp}`);
  if (!targetNgo) {
    throw new Error("Registered pending NGO not found in admin queue.");
  }
  console.log(`✓ Found pending NGO: ${targetNgo.orgName} (ID: ${targetNgo._id})`);

  // Approve NGO
  const approveRes = await fetch(`${BASE_URL}/api/v1/admin/ngo-verification`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookies, Origin: BASE_URL },
    body: JSON.stringify({
      ngoId: targetNgo._id,
      action: "approve",
      reason: "Verified statutory trust deed and FCRA documentation",
    }),
  });
  const approveData = await approveRes.json();
  if (!approveRes.ok || approveData.ngo.kycStatus !== "approved") {
    throw new Error(`Failed to approve NGO: ${JSON.stringify(approveData)}`);
  }
  console.log("✓ NGO approved successfully. Verified kycStatus === 'approved'.");

  // Verify Audit Log for NGO approval
  const auditNgo = await db.collection("auditLogs").findOne({
    entityId: new ObjectId(targetNgo._id),
    action: "ngo_kyc_approval",
  });
  if (!auditNgo) {
    throw new Error("Audit log record missing for NGO approval.");
  }
  console.log("✓ Audit log record confirmed for NGO approval.");

  // 4. Test GET /api/v1/admin/institutions
  console.log("\n4. Testing GET /api/v1/admin/institutions...");
  const instRes = await fetch(`${BASE_URL}/api/v1/admin/institutions`, {
    headers: { Cookie: adminCookies },
  });
  const instData = await instRes.json();
  if (!instRes.ok || instData.institutions.length === 0) {
    throw new Error(`Failed to load institutions: ${JSON.stringify(instData)}`);
  }
  console.log(`✓ Retrieved ${instData.institutions.length} onboarded institutions with plan and listing stats.`);

  // 5. Test Real Editable Safety Rules & Dynamic Gating
  console.log("\n5. Testing Real Dynamic Safety Rules Configuration...");
  // Step 5a: Set cooked food threshold to strictly 3 HOURS in database
  console.log("5a. Admin sets cookedFoodMaxHours = 3 in MongoDB safetyRules...");
  const setRuleRes = await fetch(`${BASE_URL}/api/v1/admin/safety-rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookies, Origin: BASE_URL },
    body: JSON.stringify({
      cookedFoodMaxHours: 3,
      cookedFoodWindowCutoffHours: 3.5,
      dairyBufferHours: 2,
    }),
  });
  const setRuleData = await setRuleRes.json();
  if (!setRuleRes.ok || setRuleData.rules.cookedFoodMaxHours !== 3) {
    throw new Error(`Failed to update safety rules: ${JSON.stringify(setRuleData)}`);
  }
  console.log("✓ Safety rule updated: cookedFoodMaxHours === 3.");

  // Setup institution for testing
  const instCookies = await registerUser(`chef_rules_${timestamp}@kitchen.org`, "Test Kitchen Safety", "institution_admin");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "institution_admin",
      details: {
        name: "Central Cafeteria Safety Test",
        type: "corporate_cafeteria",
        address: "DLF CyberCity Gate 1",
        plan: "free",
      },
    }),
  });

  // Create an item cooked 3.5 hours ago
  const now = new Date();
  const threePointFiveHoursAgo = new Date(now.getTime() - 3.5 * 60 * 60 * 1000);
  const fiveHoursFromNow = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  const itemRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      name: "Hyderabadi Biryani (Batch 3.5h old)",
      category: "cooked_food",
      quantity: 20,
      unit: "kg",
      preparedOrReceivedAt: threePointFiveHoursAgo.toISOString(),
      expiryEstimateAt: fiveHoursFromNow.toISOString(),
    }),
  });
  const itemData = await itemRes.json();
  const itemId = itemData.item._id;

  // Step 5b: Attempt listing -> under 3-hour rule, this MUST BE REJECTED (422)
  console.log("5b. Attempting to list item cooked 3.5h ago under 3-hour rule (EXPECT REJECTION 422)...");
  const testListingRes1 = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      inventoryItemId: itemId,
      quantity: 15,
      pickupWindow: {
        start: now.toISOString(),
        end: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      },
      pickupLocation: { address: "Dispatch Bay A" },
    }),
  });
  const testListingData1 = await testListingRes1.json();
  console.log("Response 1:", testListingData1);

  if (testListingRes1.status !== 422 || !testListingData1.reason.includes("3-hour")) {
    throw new Error(`Expected rejection under 3-hour rule, got: ${JSON.stringify(testListingData1)}`);
  }
  console.log("✓ SUCCESS: Gating engine dynamically rejected item with reason: " + testListingData1.reason);

  // Step 5c: Now admin restores the rule to 4 hours in DB
  console.log("5c. Admin restores cookedFoodMaxHours = 4 in MongoDB safetyRules...");
  await fetch(`${BASE_URL}/api/v1/admin/safety-rules`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: adminCookies, Origin: BASE_URL },
    body: JSON.stringify({
      cookedFoodMaxHours: 4,
      cookedFoodWindowCutoffHours: 4,
      dairyBufferHours: 2,
    }),
  });

  // Step 5d: Attempt listing the same item cooked 3.5h ago -> under 4-hour rule, this MUST BE APPROVED (201)!
  console.log("5d. Attempting to list the same item under 4-hour rule (EXPECT APPROVAL 201)...");
  // Window ends within 4h of prep (3.5h + 0.3h = 3.8h < 4h)
  const windowEnd2 = new Date(threePointFiveHoursAgo.getTime() + 3.9 * 60 * 60 * 1000);
  const testListingRes2 = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      inventoryItemId: itemId,
      quantity: 15,
      pickupWindow: {
        start: now.toISOString(),
        end: windowEnd2.toISOString(),
      },
      pickupLocation: { address: "Dispatch Bay A" },
    }),
  });
  const testListingData2 = await testListingRes2.json();
  console.log("Response 2:", testListingData2);

  if (testListingRes2.status !== 201 || testListingData2.safetyStatus !== "verified_safe") {
    throw new Error(`Expected approval under 4-hour rule, got: ${JSON.stringify(testListingData2)}`);
  }
  console.log("✓ SUCCESS: Gating engine dynamically approved item once rule was updated to 4 hours!");

  // 6. Test GET /api/v1/admin/audit-log
  console.log("\n6. Testing GET /api/v1/admin/audit-log (Pagination & Filtering)...");
  const auditRes = await fetch(`${BASE_URL}/api/v1/admin/audit-log?page=1&limit=5`, {
    headers: { Cookie: adminCookies },
  });
  const auditData = await auditRes.json();
  if (!auditRes.ok || auditData.logs.length === 0) {
    throw new Error(`Failed to load audit logs: ${JSON.stringify(auditData)}`);
  }
  console.log(`✓ Audit log verified: ${auditData.total} total events, ${auditData.logs.length} returned on page 1 of ${auditData.totalPages}.`);

  // 7. Test GET /api/v1/admin/users
  console.log("\n7. Testing GET /api/v1/admin/users...");
  const usersRes = await fetch(`${BASE_URL}/api/v1/admin/users`, {
    headers: { Cookie: adminCookies },
  });
  const usersData = await usersRes.json();
  if (!usersRes.ok || usersData.users.length === 0) {
    throw new Error(`Failed to load users: ${JSON.stringify(usersData)}`);
  }
  const rolesFound = new Set(usersData.users.map((u) => u.role));
  console.log(`✓ Found ${usersData.users.length} registered user accounts across roles:`, Array.from(rolesFound));

  await client.close();
  console.log("\n=======================================================");
  console.log("ALL PLATFORM ADMIN EXPERIENCE TESTS PASSED 100%!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
