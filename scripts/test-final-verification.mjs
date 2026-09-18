import { MongoClient, ObjectId } from "mongodb";
import { evaluateSafetyGating } from "../lib/safety-gating.ts";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = "mongodb://127.0.0.1:27017/zeroplate";

async function runVerification() {
  console.log("==================================================================");
  console.log("   ZeroPlate.ai FINAL STAGE VERIFICATION SUITE");
  console.log("==================================================================");

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  // Helper to register and get proper session cookies
  async function registerUser(email, name, role) {
    const regRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email, password: "StrongPassword123!", name, role }),
    });
    if (!regRes.ok) {
      throw new Error(`Registration failed for ${email}: ${await regRes.text()}`);
    }
    const rawSetCookie = regRes.headers.get("set-cookie") || "";
    const cookie = rawSetCookie
      .split(/,(?=[^;]+;)/)
      .map((c) => c.split(";")[0].trim())
      .join("; ");
    const json = await regRes.json();
    return { cookie, user: json.user };
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Safety-Gating Fails Closed on Forced Error (PRD Section 12.3)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 1] Testing Safety-Gating Fail-Closed Behavior on Forced Error...");
    
    // Create a mock DB that throws an error when querying safetyRules
    const errorDb = {
      collection(name) {
        if (name === "safetyRules") {
          return {
            findOne: async () => {
              throw new Error("Forced simulated database connection crash during safety check");
            },
          };
        }
        return db.collection(name);
      },
    };

    const forcedErrorInput = {
      inventoryItem: {
        _id: new ObjectId(),
        name: "Forced Error Test Item",
        category: "cooked_food",
        quantity: 20,
        unit: "kg",
        preparedOrReceivedAt: new Date(Date.now() - 30 * 60 * 1000), // 30m ago
        expiryEstimateAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // in 2h
      },
      quantity: 10,
      pickupWindow: {
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
      },
      pickupLocation: {
        address: "Disaster Drill Kitchen, Delhi",
        lat: 28.6139,
        lng: 77.209,
      },
      institutionId: new ObjectId(),
      userId: new ObjectId(),
    };

    const verdict = await evaluateSafetyGating(errorDb, forcedErrorInput);
    console.log("   Verdict received:", verdict);

    if (verdict.safe === false && verdict.ruleApplied === "fail_closed_exception") {
      console.log("   ✓ PASS: Safety gating properly failed closed (safe: false, rule: fail_closed_exception).");
    } else {
      throw new Error(`FAIL: Safety gating did not fail closed! Verdict: ${JSON.stringify(verdict)}`);
    }

    // Check that an audit log was recorded for this failure
    const auditRecord = await db.collection("auditLogs").findOne({
      ruleApplied: "fail_closed_exception",
      status: "rejected",
    });
    if (auditRecord) {
      console.log("   ✓ PASS: Audit log successfully written with status: rejected and fail_closed_exception.");
    } else {
      throw new Error("FAIL: Audit log not found for fail-closed exception!");
    }

    // -------------------------------------------------------------------------
    // TEST 2: Role Authorization Server-Side Enforcement (PRD Sections 7 & 19)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 2] Testing Server-Side Role Enforcement (Spot-Checking Unauthorized Access)...");

    const timestamp = Date.now();
    // 2a. Register an NGO user
    const { cookie: ngoRegCookies } = await registerUser(
      `ngo_security_${timestamp}@example.org`,
      "Security Test NGO",
      "ngo"
    );

    // 2b. Attempt to POST inventory (Institution Admin only) with NGO session
    const unauthorizedInvRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ngoRegCookies,
      },
      body: JSON.stringify({
        name: "Unauthorized Rice",
        category: "grains_staples",
        quantity: 50,
        unit: "kg",
      }),
    });

    console.log(`   Attempt POST /api/v1/inventory with NGO session: Status ${unauthorizedInvRes.status}`);
    if (unauthorizedInvRes.status === 403) {
      console.log("   ✓ PASS: Endpoint correctly rejected unauthorized role with 403 Forbidden.");
    } else {
      throw new Error(`FAIL: Expected 403 Forbidden for NGO creating inventory, got ${unauthorizedInvRes.status}`);
    }

    // 2c. Attempt to POST surplus listing (Institution Admin only) with NGO session
    const unauthorizedSurplusRes = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: ngoRegCookies,
      },
      body: JSON.stringify({
        inventoryItemId: new ObjectId().toString(),
        quantity: 10,
      }),
    });

    console.log(`   Attempt POST /api/v1/surplus-listings with NGO session: Status ${unauthorizedSurplusRes.status}`);
    if (unauthorizedSurplusRes.status === 403) {
      console.log("   ✓ PASS: Endpoint correctly rejected unauthorized surplus listing with 403 Forbidden.");
    } else {
      throw new Error(`FAIL: Expected 403 Forbidden for NGO listing surplus, got ${unauthorizedSurplusRes.status}`);
    }

    // 2d. Attempt to access safety rules config (Platform Admin only) with NGO session
    const unauthorizedSafetyRes = await fetch(`${BASE_URL}/api/v1/admin/safety-rules`, {
      method: "GET",
      headers: {
        Cookie: ngoRegCookies,
      },
    });

    console.log(`   Attempt GET /api/v1/admin/safety-rules with NGO session: Status ${unauthorizedSafetyRes.status}`);
    if (unauthorizedSafetyRes.status === 403) {
      console.log("   ✓ PASS: Endpoint correctly rejected non-admin role with 403 Forbidden.");
    } else {
      throw new Error(`FAIL: Expected 403 Forbidden for NGO accessing safety rules, got ${unauthorizedSafetyRes.status}`);
    }

    // -------------------------------------------------------------------------
    // TEST 3: Full End-to-End Live Workflow with Real Data (Item 7)
    // -------------------------------------------------------------------------
    console.log("\n[TEST 3] Testing Full End-to-End Flow with Real Data...");

    // Step 3a: Create Institution Admin
    const { cookie: instCookies, user: instUser } = await registerUser(
      `inst_e2e_${timestamp}@kitchen.org`,
      "E2E Grand Central Kitchen",
      "institution_admin"
    );
    const instUserId = instUser.id;

    // Complete onboarding for Institution
    await fetch(`${BASE_URL}/api/v1/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instCookies },
      body: JSON.stringify({
        role: "institution_admin",
        details: {
          name: "E2E Grand Central Kitchen",
          type: "commercial_kitchen",
          address: "Sector 14, Connaught Hub, New Delhi",
          location: { lat: 28.6315, lng: 77.2167 },
          capacityMealsPerDay: 3000,
        },
      }),
    });
    console.log("   ✓ Step 3a: Institution Admin registered and onboarded.");

    // Step 3b: Institution adds real Inventory item
    const prepDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hr ago
    const expDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // in 3 hrs
    const invRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instCookies },
      body: JSON.stringify({
        name: "Paneer Butter Masala & Pulao",
        category: "cooked_food",
        quantity: 40,
        unit: "kg",
        storageCondition: "hot_hold",
        preparedOrReceivedAt: prepDate.toISOString(),
        expiryEstimateAt: expDate.toISOString(),
      }),
    });
    const invJson = await invRes.json();
    const inventoryItemId = invJson.item._id;
    console.log("   ✓ Step 3b: Real inventory item created (40 kg cooked food, ID:", inventoryItemId, ")");

    // Step 3c: Institution lists 30 kg surplus (within 4h window)
    const pickupStart = new Date(Date.now() + 15 * 60 * 1000);
    const pickupEnd = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const listRes = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instCookies },
      body: JSON.stringify({
        inventoryItemId,
        quantity: 30,
        pickupWindow: {
          start: pickupStart.toISOString(),
          end: pickupEnd.toISOString(),
        },
        pickupLocation: {
          address: "Sector 14, Connaught Hub, Loading Bay 2",
          lat: 28.6315,
          lng: 77.2167,
        },
      }),
    });
    const listJson = await listRes.json();
    if (!listJson.listing || listJson.listing.safetyStatus !== "verified_safe") {
      throw new Error(`FAIL: Listing was not verified safe! Response: ${JSON.stringify(listJson)}`);
    }
    const listingId = listJson.listing._id;
    console.log("   ✓ Step 3c: Surplus listing created and verified safe by Safety Gating (Listing ID:", listingId, ")");

    // Step 3d: Create and approve an NGO
    const { cookie: fullNgoCookies, user: fullNgoUser } = await registerUser(
      `e2e_ngo_${timestamp}@relief.org`,
      "Delhi Food Relief Foundation",
      "ngo"
    );
    const fullNgoUserId = fullNgoUser.id;

    // Complete NGO onboarding
    await fetch(`${BASE_URL}/api/v1/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: fullNgoCookies },
      body: JSON.stringify({
        role: "ngo",
        details: {
          orgName: "Delhi Food Relief Foundation",
          registrationNumber: "DL-RELIEF-2026-99",
          contactPhone: "+91-9876543210",
          serviceArea: "Central Delhi",
          capacityPerWeek: 5000,
          location: { lat: 28.632, lng: 77.218 },
        },
      }),
    });

    // Mark NGO as approved in DB (simulating Platform Admin approval)
    const ngoUserObjId = ObjectId.isValid(fullNgoUserId)
      ? new ObjectId(fullNgoUserId)
      : fullNgoUserId;
    await db.collection("ngos").updateOne(
      { $or: [{ userId: fullNgoUserId }, { userId: ngoUserObjId }] },
      { $set: { kycStatus: "approved" } }
    );
    console.log("   ✓ Step 3d: Real NGO registered, onboarded, and KYC approved.");

    // Step 3e: NGO claims the surplus listing
    const claimRes = await fetch(`${BASE_URL}/api/v1/ngo/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: fullNgoCookies },
      body: JSON.stringify({ listingId }),
    });
    const claimJson = await claimRes.json();
    if (!claimJson.success) {
      throw new Error(`FAIL: NGO failed to claim listing! ${JSON.stringify(claimJson)}`);
    }
    const matchId = claimJson.matchId;
    console.log("   ✓ Step 3e: NGO claimed listing. Match created (Match ID:", matchId, ")");

    // Step 3f: Create and register a Delivery Partner
    const { cookie: driverCookies, user: driverUser } = await registerUser(
      `e2e_driver_${timestamp}@logistics.org`,
      "Aman Logistics Delivery",
      "delivery_partner"
    );
    const driverUserId = driverUser.id;

    // Complete Driver onboarding
    await fetch(`${BASE_URL}/api/v1/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
      body: JSON.stringify({
        role: "delivery_partner",
        details: {
          vehicleType: "van",
          serviceArea: "Central Delhi",
          phone: "+91-9123456780",
          location: { lat: 28.630, lng: 77.215 },
        },
      }),
    });

    // Query the delivery assignment created for this surplus listing
    let assignment = await db.collection("deliveryAssignments").findOne({
      surplusListingId: new ObjectId(listingId),
    });

    if (!assignment) {
      throw new Error("FAIL: Delivery assignment not found for claimed listing!");
    }
    console.log("   ✓ Step 3f: Delivery Partner onboarded and assigned (Assignment ID:", assignment._id, ")");

    // Step 3g: Driver advances delivery lifecycle: accepted -> picked_up -> delivered
    const steps = ["accepted", "picked_up", "delivered"];
    for (const step of steps) {
      const statusRes = await fetch(
        `${BASE_URL}/api/v1/delivery/assignments/${assignment._id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Cookie: driverCookies },
          body: JSON.stringify({ nextStatus: step }),
        }
      );
      if (!statusRes.ok) {
        const errJson = await statusRes.json().catch(() => ({}));
        throw new Error(`FAIL: Delivery status update to ${step} failed with ${statusRes.status}: ${JSON.stringify(errJson)}`);
      }
      console.log(`     → Advanced delivery status to: [${step}]`);
    }

    // Step 3h: NGO confirms receipt
    const confirmRes = await fetch(
      `${BASE_URL}/api/v1/ngo/claims/${listingId}/confirm-receipt`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: fullNgoCookies },
      }
    );
    const confirmJson = await confirmRes.json();
    if (!confirmJson.success) {
      throw new Error(`FAIL: NGO confirm receipt failed! ${JSON.stringify(confirmJson)}`);
    }
    console.log("   ✓ Step 3h: NGO confirmed receipt. Food safely redistributed!");

    // Step 3i: Institution dashboard reflects updated metrics
    const metricsRes = await fetch(`${BASE_URL}/api/v1/institution/metrics`, {
      headers: { Cookie: instCookies },
    });
    const metricsJson = await metricsRes.json();
    console.log("   ✓ Step 3i: Fetched Institution live dashboard metrics:");
    console.log("     - Waste Prevented:", metricsJson.metrics.wastePreventedKg, "kg (Expected: >= 30 kg)");
    console.log("     - Meals Given:", metricsJson.metrics.mealsGiven, "(Expected: >= 75 meals @ 2.5 meals/kg)");
    console.log("     - CO2e Avoided:", metricsJson.metrics.co2eAvoidedKg, "kg (Expected: >= 57 kg @ 1.9 kg CO2e/kg)");
    console.log("     - Cost Saved:", "₹" + metricsJson.metrics.costSavedInr);

    if (metricsJson.metrics.wastePreventedKg >= 30 && metricsJson.metrics.mealsGiven >= 75) {
      console.log("   ✓ PASS: Full end-to-end flow verified with 100% real live computed data!");
    } else {
      throw new Error("FAIL: Dashboard metrics did not reflect the completed redistribution!");
    }

    console.log("\n==================================================================");
    console.log("   ALL FINAL VERIFICATION TESTS PASSED SUCCESSFULLY! (3/3)");
    console.log("==================================================================");
  } finally {
    await client.close();
  }
}

runVerification().catch((err) => {
  console.error("\n❌ VERIFICATION SUITE FAILED:", err);
  process.exit(1);
});
