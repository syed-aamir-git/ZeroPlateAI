// Automated Test Script for NGO Experience & Atomic Claiming
// Verifies:
// 1. NGO Registration with complete KYC fields (starts in kycStatus: "pending")
// 2. Server-side KYC enforcement: Direct API claim attempt while "pending" MUST be rejected (HTTP 403)
// 3. Race Condition / Atomic Claiming: Two approved NGOs claiming the same listing concurrently -> exactly ONE succeeds (200), other fails (409)
// 4. Confirm Receipt action: updates DeliveryAssignment to "confirmed" and SurplusListing to "delivered"
// 5. Impact calculation: verifies real computed redistribution metrics
// 6. Organization KYC profile view & edit

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function main() {
  console.log("=== STARTING NGO EXPERIENCE & ATOMIC CLAIM VERIFICATION ===");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

  const timestamp = Date.now();

  // Helper to register and onboard
  async function registerUser(email, name, role) {
    const regRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: BASE_URL },
      body: JSON.stringify({ email, password: "SecurePassword123!", name, role }),
    });
    if (!regRes.ok) {
      throw new Error(`Registration failed for ${email}: ${await regRes.text()}`);
    }
    const rawSetCookie = regRes.headers.get("set-cookie") || "";
    return rawSetCookie
      .split(/,(?=[^;]+;)/)
      .map((c) => c.split(";")[0].trim())
      .join("; ");
  }

  // --- STEP 1: Create Institution and Valid Surplus Listing ---
  console.log("\n1. Setting up Donor Kitchen and Verified Safe Listing...");
  const instCookies = await registerUser(
    `kitchen_${timestamp}@hospital.org`,
    "City Hospital Cafeteria",
    "institution_admin"
  );

  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "institution_admin",
      details: {
        name: "City Hospital Dietary Wing",
        type: "hospital",
        address: "7th Avenue Medical Enclave",
        lat: 28.58,
        lng: 77.22,
        plan: "free",
      },
    }),
  });

  const now = new Date();
  const prepTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1h ago
  const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4h

  const itemRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      name: "Nutritious Veg Khichdi & Fruit Packs",
      category: "cooked_food",
      quantity: 40,
      unit: "kg",
      preparedOrReceivedAt: prepTime.toISOString(),
      expiryEstimateAt: expiryTime.toISOString(),
    }),
  });
  const itemData = await itemRes.json();
  const inventoryItemId = itemData.item._id;

  const listingRes = await fetch(`${BASE_URL}/api/v1/surplus-listings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      inventoryItemId,
      quantity: 35,
      pickupWindow: {
        start: now.toISOString(),
        end: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      },
      pickupLocation: {
        address: "Hospital Bay 2 Service Gate",
        lat: 28.58,
        lng: 77.22,
      },
    }),
  });
  const listingData = await listingRes.json();
  if (listingRes.status !== 201) {
    throw new Error(`Failed to create surplus listing: ${JSON.stringify(listingData)}`);
  }
  const testListingId = listingData.listing._id;
  console.log(`✓ Surplus listing created: ${testListingId} (35 kg, status: pending, safetyStatus: verified_safe)`);

  // --- STEP 2: Register NGO 1 with full KYC fields ---
  console.log("\n2. Registering NGO 1 with complete KYC fields...");
  const ngo1Email = `ngo1_${timestamp}@foodbank.org`;
  const ngo1Cookies = await registerUser(ngo1Email, "Hope Community Foundation", "ngo");

  const ngo1OnboardRes = await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngo1Cookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "ngo",
      details: {
        orgName: "Hope Community Foundation",
        registrationNumber: `DL/NGO/${timestamp}`,
        contactPhone: "+91 98111 22233",
        serviceArea: "Central & South Delhi",
        capacityPerWeek: 800,
        lat: 28.57,
        lng: 77.21,
      },
    }),
  });
  const ngo1OnboardData = await ngo1OnboardRes.json();
  if (!ngo1OnboardRes.ok || !ngo1OnboardData.success) {
    throw new Error(`NGO 1 Onboarding failed: ${JSON.stringify(ngo1OnboardData)}`);
  }

  // Verify NGO 1 record in MongoDB starts with kycStatus: "pending"
  const ngo1DbRecord = await db.collection("ngos").findOne({ registrationNumber: `DL/NGO/${timestamp}` });
  if (!ngo1DbRecord || ngo1DbRecord.kycStatus !== "pending") {
    throw new Error(`Expected NGO 1 kycStatus to be 'pending', got: ${ngo1DbRecord?.kycStatus}`);
  }
  console.log(`✓ NGO 1 registered successfully with kycStatus: "${ngo1DbRecord.kycStatus}".`);

  // --- STEP 3: Server-side KYC Gating Enforcement ---
  console.log("\n3. Testing Server-side KYC Gating: attempting claim with KYC PENDING status...");
  const pendingClaimRes = await fetch(`${BASE_URL}/api/v1/ngo/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngo1Cookies, Origin: BASE_URL },
    body: JSON.stringify({ listingId: testListingId }),
  });
  const pendingClaimData = await pendingClaimRes.json();
  console.log(`HTTP Status: ${pendingClaimRes.status}`);
  console.log("Response:", pendingClaimData);

  if (pendingClaimRes.status !== 403) {
    throw new Error(`Expected HTTP 403 Forbidden for pending KYC, got ${pendingClaimRes.status}`);
  }
  if (!pendingClaimData.error.includes("KYC Pending")) {
    throw new Error(`Expected error message mentioning KYC Pending, got: ${pendingClaimData.error}`);
  }
  console.log("✓ SUCCESS: Server strictly blocked claim attempt from unapproved NGO (HTTP 403).");

  // Verify listing remains unclaimed
  const listingStillPending = await db.collection("surplusListings").findOne({ _id: new ObjectId(testListingId) });
  if (!["pending", "matched"].includes(listingStillPending.status)) {
    throw new Error(`Expected listing status to remain unclaimed ('pending' or 'matched'), got: ${listingStillPending.status}`);
  }
  console.log(`✓ SUCCESS: Surplus listing remains unclaimed with status '${listingStillPending.status}'.`);

  // --- STEP 4: Approve NGO 1 and Register/Approve NGO 2 ---
  console.log("\n4. Approving NGO 1 and registering/approving NGO 2 for atomic concurrency test...");
  await db.collection("ngos").updateOne(
    { _id: ngo1DbRecord._id },
    { $set: { kycStatus: "approved" } }
  );

  const ngo2Email = `ngo2_${timestamp}@seva.org`;
  const ngo2Cookies = await registerUser(ngo2Email, "Annapurna Seva Trust", "ngo");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngo2Cookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "ngo",
      details: {
        orgName: "Annapurna Seva Trust",
        registrationNumber: `DL/NGO/SEVA/${timestamp}`,
        contactPhone: "+91 98444 55566",
        serviceArea: "East & North Delhi",
        capacityPerWeek: 1200,
        lat: 28.62,
        lng: 77.24,
      },
    }),
  });
  const ngo2DbRecord = await db.collection("ngos").findOne({ registrationNumber: `DL/NGO/SEVA/${timestamp}` });
  await db.collection("ngos").updateOne(
    { _id: ngo2DbRecord._id },
    { $set: { kycStatus: "approved" } }
  );
  console.log("✓ Both NGO 1 and NGO 2 are now verified (kycStatus: 'approved').");

  // --- STEP 5: Test Atomic Concurrency on Claim ---
  console.log("\n5. Firing concurrent claims from NGO 1 and NGO 2 on the exact same listing...");
  const [claimResult1, claimResult2] = await Promise.all([
    fetch(`${BASE_URL}/api/v1/ngo/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ngo1Cookies, Origin: BASE_URL },
      body: JSON.stringify({ listingId: testListingId }),
    }).then(async (r) => ({ status: r.status, data: await r.json(), ngo: "NGO 1" })),

    fetch(`${BASE_URL}/api/v1/ngo/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: ngo2Cookies, Origin: BASE_URL },
      body: JSON.stringify({ listingId: testListingId }),
    }).then(async (r) => ({ status: r.status, data: await r.json(), ngo: "NGO 2" })),
  ]);

  console.log("Claim Result 1:", claimResult1);
  console.log("Claim Result 2:", claimResult2);

  const successResults = [claimResult1, claimResult2].filter((r) => r.status === 200);
  const conflictResults = [claimResult1, claimResult2].filter((r) => r.status === 409);

  if (successResults.length !== 1 || conflictResults.length !== 1) {
    throw new Error(
      `Atomic claim failed! Expected exactly 1 success (200) and 1 conflict (409), but got ${successResults.length} successes and ${conflictResults.length} conflicts.`
    );
  }

  const winner = successResults[0];
  const loser = conflictResults[0];
  console.log(`✓ SUCCESS: ${winner.ngo} won the atomic claim (HTTP 200), and ${loser.ngo} was safely rejected (HTTP 409 Conflict).`);

  // Verify exactly 1 DeliveryAssignment exists in DB
  const assignments = await db
    .collection("deliveryAssignments")
    .find({ surplusListingId: new ObjectId(testListingId) })
    .toArray();

  if (assignments.length !== 1) {
    throw new Error(`Expected exactly 1 DeliveryAssignment, found ${assignments.length}`);
  }
  console.log(`✓ SUCCESS: Exactly 1 DeliveryAssignment created in MongoDB with status: "${assignments[0].status}".`);

  // Determine winner's cookie and NGO record
  const winnerCookies = winner.ngo === "NGO 1" ? ngo1Cookies : ngo2Cookies;
  const winnerNgoRecord = winner.ngo === "NGO 1" ? ngo1DbRecord : ngo2DbRecord;

  // --- STEP 6: Test /api/v1/ngo/claims ---
  console.log("\n6. Testing /api/v1/ngo/claims for the winning NGO...");
  const claimsRes = await fetch(`${BASE_URL}/api/v1/ngo/claims`, {
    headers: { Cookie: winnerCookies },
  });
  const claimsData = await claimsRes.json();
  if (!claimsRes.ok || claimsData.claims.length === 0) {
    throw new Error(`Expected to find claimed listing in claims list, got: ${JSON.stringify(claimsData)}`);
  }
  console.log(`✓ Found ${claimsData.claims.length} claim(s). Delivery status: "${claimsData.claims[0].deliveryStatus}".`);

  // --- STEP 7: Test Confirm Receipt Action ---
  console.log("\n7. Testing Confirm Receipt action...");
  const confirmRes = await fetch(`${BASE_URL}/api/v1/ngo/claims/${testListingId}/confirm-receipt`, {
    method: "POST",
    headers: { Cookie: winnerCookies },
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok || !confirmData.success) {
    throw new Error(`Failed to confirm receipt: ${JSON.stringify(confirmData)}`);
  }
  console.log("✓ SUCCESS: Confirm receipt succeeded.");

  // Verify DeliveryAssignment status is now 'confirmed'
  const updatedAssignment = await db.collection("deliveryAssignments").findOne({
    surplusListingId: new ObjectId(testListingId),
  });
  if (updatedAssignment.status !== "confirmed" || !updatedAssignment.confirmedAt) {
    throw new Error(`Expected DeliveryAssignment to be 'confirmed', got: ${JSON.stringify(updatedAssignment)}`);
  }
  console.log("✓ SUCCESS: DeliveryAssignment status in MongoDB transitioned to 'confirmed'.");

  // Verify SurplusListing status is 'delivered'
  const updatedListing = await db.collection("surplusListings").findOne({
    _id: new ObjectId(testListingId),
  });
  if (updatedListing.status !== "delivered") {
    throw new Error(`Expected SurplusListing status to be 'delivered', got: ${updatedListing.status}`);
  }
  console.log("✓ SUCCESS: SurplusListing status in MongoDB transitioned to 'delivered'.");

  // --- STEP 8: Test Impact Calculation ---
  console.log("\n8. Testing NGO Impact calculation...");
  const impactRes = await fetch(`${BASE_URL}/api/v1/ngo/impact`, {
    headers: { Cookie: winnerCookies },
  });
  const impactData = await impactRes.json();
  if (!impactRes.ok || !impactData.success) {
    throw new Error(`Failed to fetch impact: ${JSON.stringify(impactData)}`);
  }
  console.log("Impact Data:", impactData.impact);

  if (impactData.impact.totalRedistributedKg !== 35) {
    throw new Error(`Expected 35 kg redistributed, got ${impactData.impact.totalRedistributedKg}`);
  }
  if (impactData.impact.mealsProvided !== 88) { // 35 * 2.5 = 87.5 -> 88
    throw new Error(`Expected 88 meals provided, got ${impactData.impact.mealsProvided}`);
  }
  if (impactData.impact.co2eAvoidedKg !== 66.5) { // 35 * 1.9 = 66.5
    throw new Error(`Expected 66.5 kg CO2e avoided, got ${impactData.impact.co2eAvoidedKg}`);
  }
  console.log("✓ SUCCESS: Impact numbers accurately match confirmed handoff weight (35 kg = 88 meals, 66.5 kg CO2e).");

  // --- STEP 9: Test NGO Profile View and Edit ---
  console.log("\n9. Testing NGO Profile View & Edit...");
  const patchProfileRes = await fetch(`${BASE_URL}/api/v1/ngo/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: winnerCookies, Origin: BASE_URL },
    body: JSON.stringify({
      serviceArea: "National Capital Region (NCR) - Extended Sector",
      contactPhone: "+91 99999 88888",
    }),
  });
  const patchProfileData = await patchProfileRes.json();
  if (!patchProfileRes.ok || patchProfileData.ngo.serviceArea !== "National Capital Region (NCR) - Extended Sector") {
    throw new Error(`Failed to update profile: ${JSON.stringify(patchProfileData)}`);
  }
  console.log("✓ SUCCESS: Organization profile updated in MongoDB.");

  await client.close();
  console.log("\n=======================================================");
  console.log("ALL NGO EXPERIENCE & ATOMIC CLAIMING TESTS PASSED 100%!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
