import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

// Read .env.local to match Next.js dev server's exact database
let envUri = process.env.MONGODB_URI;
let envDb = process.env.MONGODB_DB_NAME || "ZeroPlate_ai_MVP";
try {
  const envContent = fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("MONGODB_URI=")) {
      envUri = trimmed.replace("MONGODB_URI=", "").replace(/['"]/g, "").trim();
    }
    if (trimmed.startsWith("MONGODB_DB_NAME=")) {
      envDb = trimmed.replace("MONGODB_DB_NAME=", "").replace(/['"]/g, "").trim();
    }
  }
} catch (e) {}

const MONGO_URI = envUri || "mongodb+srv://rajjasani08_db_user:SBCIcDaPAqk1DUtj@cluster0.chrxzvr.mongodb.net/ZeroPlate_ai_MVP?retryWrites=true&w=majority";

async function main() {
  console.log("=== STARTING BROADCAST DISPATCH & TWO-STAGE ASSIGNMENT VERIFICATION ===");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(envDb);

  const timestamp = Date.now();

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

  // 1. Setup Platform Admin
  console.log("\n1. Setting up Platform Admin...");
  const adminEmail = `admin_test_${timestamp}@zeroplate.ai`;
  const adminCookies = await registerUser(adminEmail, "Super Admin", "platform_admin");
  await db.collection("user").updateOne({ email: adminEmail }, { $set: { role: "platform_admin" } });

  // 2. Setup Donor Kitchen and Surplus Listing
  console.log("\n2. Creating Donor Kitchen and Surplus Listing...");
  const instCookies = await registerUser(
    `chef_dispatch_${timestamp}@hotel.org`,
    "Grand Regency Banquet",
    "institution_admin"
  );
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "institution_admin",
      details: {
        name: "Grand Regency Banquets",
        type: "caterer",
        address: "77 Convention Plaza, Central City",
        lat: 28.60,
        lng: 77.20,
        plan: "free",
      },
    }),
  });

  const now = new Date();
  const prepTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const itemRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      name: "Fresh Palak Paneer & Pulao",
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
        address: "Grand Regency Dock 2",
        lat: 28.60,
        lng: 77.20,
      },
    }),
  });
  const listingData = await listingRes.json();
  const listingId = listingData.listing._id;
  console.log(`✓ Surplus listing created: ${listingId} (35 kg)`);

  // 3. Register TWO Delivery Partners: Driver A & Driver B
  console.log("\n3. Registering Driver A and Driver B...");
  const driverAEmail = `driver_a_${timestamp}@express.org`;
  const driverACookies = await registerUser(driverAEmail, "Aarav Sharma (Driver A)", "delivery_partner");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverACookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "delivery_partner",
      details: {
        phone: "+91 91111 22233",
        vehicleType: "three_wheeler",
        serviceArea: "Central City Zone",
      },
    }),
  });

  const driverBEmail = `driver_b_${timestamp}@express.org`;
  const driverBCookies = await registerUser(driverBEmail, "Vikram Patel (Driver B)", "delivery_partner");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverBCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "delivery_partner",
      details: {
        phone: "+91 94444 55566",
        vehicleType: "two_wheeler",
        serviceArea: "Central City Zone",
      },
    }),
  });
  console.log("✓ Both Driver A and Driver B registered and active in Partner network.");

  // 4. Setup Approved NGO and claim listing (Allotment)
  console.log("\n4. Registering NGO and claiming listing (Allotting delivery)...");
  const ngoEmail = `ngo_shelter_${timestamp}@feeding.org`;
  const ngoCookies = await registerUser(ngoEmail, "Hope Community Foundation", "ngo");
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "ngo",
      details: {
        orgName: "Hope Community Foundation",
        registrationNumber: `REG/NGO/${timestamp}`,
        contactPhone: "+91 98888 77766",
        serviceArea: "Central City East",
        capacityPerWeek: 1200,
        lat: 28.61,
        lng: 77.22,
      },
    }),
  });
  await db.collection("ngos").updateOne({ registrationNumber: `REG/NGO/${timestamp}` }, { $set: { kycStatus: "approved" } });

  const claimRes = await fetch(`${BASE_URL}/api/v1/ngo/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
    body: JSON.stringify({ listingId }),
  });
  const claimData = await claimRes.json();
  if (claimRes.status !== 200) {
    throw new Error(`Claim failed: ${JSON.stringify(claimData)}`);
  }
  console.log("✓ Delivery successfully allotted by NGO claim.");
  console.log(`  claimData.deliveryAssignedTo: ${claimData.deliveryAssignedTo} (Expected: null)`);

  if (claimData.deliveryAssignedTo !== null) {
    throw new Error(`Expected deliveryAssignedTo to be null at allotment, got ${claimData.deliveryAssignedTo}`);
  }

  // 5. Verification Before Any Driver Accepts:
  console.log("\n5. Verifying state BEFORE any driver accepts...");

  // a. Driver A checks assignments:
  const driverARes = await fetch(`${BASE_URL}/api/v1/delivery/assignments`, {
    headers: { Cookie: driverACookies },
  });
  const driverAData = await driverARes.json();
  const assignmentForA = driverAData.assignments.find((a) => String(a.surplusListingId) === String(listingId));
  if (!assignmentForA) {
    throw new Error("Driver A cannot see open broadcast assignment!");
  }
  console.log(`✓ Driver A sees open broadcast assignment (${assignmentForA._id}), status: "${assignmentForA.status}", isAssignedToMe: ${assignmentForA.isAssignedToMe}`);

  // b. Driver B checks assignments:
  const driverBRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments`, {
    headers: { Cookie: driverBCookies },
  });
  const driverBData = await driverBRes.json();
  const assignmentForB = driverBData.assignments.find((a) => String(a.surplusListingId) === String(listingId));
  if (!assignmentForB) {
    throw new Error("Driver B cannot see open broadcast assignment!");
  }
  console.log(`✓ Driver B ALSO sees the same open broadcast assignment (${assignmentForB._id})!`);

  // c. Institution checks deliveries:
  const instDelivRes = await fetch(`${BASE_URL}/api/v1/institution/deliveries`, {
    headers: { Cookie: instCookies },
  });
  const instDelivData = await instDelivRes.json();
  const instDelivery = instDelivData.deliveries.find((d) => String(d._id) === String(assignmentForA._id));
  console.log(`✓ Institution delivery courier: ${instDelivery?.courier} (Expected: null before acceptance)`);
  if (instDelivery?.courier !== null) {
    throw new Error("Expected institution courier to be null until driver accepts!");
  }

  // d. Admin overview checks:
  const adminOverviewRes = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
    headers: { Cookie: adminCookies },
  });
  const adminOverviewData = await adminOverviewRes.json();
  const adminDispatch = adminOverviewData.dispatches.find((d) => String(d._id) === String(assignmentForA._id));
  console.log(`✓ Admin overview dispatch courier: ${adminDispatch?.courier} (Expected: null)`);
  if (adminDispatch?.courier !== null) {
    throw new Error("Expected admin overview courier to be null until accepted!");
  }

  // e. Admin notifications check:
  const adminUser = await db.collection("user").findOne({ email: adminEmail });
  const adminNotifsBefore = await db.collection("notifications").find({
    userId: adminUser._id,
    type: "delivery_assigned",
  }).toArray();
  console.log(`✓ Admin delivery_assigned notifications before acceptance: ${adminNotifsBefore.length} (Expected: 0)`);
  if (adminNotifsBefore.length !== 0) {
    throw new Error(`Admin should NOT be notified of assignment yet, found: ${adminNotifsBefore.length}`);
  }

  // 6. Driver A ACCEPTS the order!
  console.log("\n6. Driver A accepts the delivery order...");
  const acceptRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentForA._id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverACookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "accepted" }),
  });
  const acceptData = await acceptRes.json();
  if (acceptRes.status !== 200 || acceptData.assignment.status !== "accepted") {
    throw new Error(`Driver A failed to accept: ${JSON.stringify(acceptData)}`);
  }
  console.log("✓ Driver A successfully accepted the order. Status: 'accepted'.");

  // 7. Driver B tries to accept the SAME order -> MUST fail with 409 Conflict
  console.log("\n7. Testing Race-Condition Lock: Driver B tries to accept already-taken order...");
  const conflictRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentForA._id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverBCookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "accepted" }),
  });
  console.log(`✓ Driver B accept attempt status code: ${conflictRes.status} (Expected: 409)`);
  if (conflictRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for secondary driver accept, got: ${conflictRes.status}`);
  }

  // 8. Verification AFTER Driver A accepts:
  console.log("\n8. Verifying state AFTER Driver A accepted...");

  // a. Admin notifications check:
  const adminNotifsAfter = await db.collection("notifications").find({
    userId: adminUser._id,
    type: "delivery_assigned",
  }).toArray();
  console.log(`✓ Admin delivery_assigned notifications after acceptance: ${adminNotifsAfter.length} (Expected: >= 1)`);
  if (adminNotifsAfter.length === 0) {
    throw new Error("Expected Admin to receive delivery_assigned notification after driver accepts!");
  }
  console.log(`  Notification message: "${adminNotifsAfter[0].message}"`);

  // b. Institution deliveries check:
  const instDelivAfterRes = await fetch(`${BASE_URL}/api/v1/institution/deliveries`, {
    headers: { Cookie: instCookies },
  });
  const instDelivAfterData = await instDelivAfterRes.json();
  const instDelivAfter = instDelivAfterData.deliveries.find((d) => String(d._id) === String(assignmentForA._id));
  console.log(`✓ Institution now sees assigned courier:`, instDelivAfter?.courier);
  if (!instDelivAfter?.courier?.name) {
    throw new Error("Expected institution deliveries to display assigned courier details!");
  }

  // c. Admin overview check:
  const adminOverviewAfterRes = await fetch(`${BASE_URL}/api/v1/admin/overview`, {
    headers: { Cookie: adminCookies },
  });
  const adminOverviewAfterData = await adminOverviewAfterRes.json();
  const adminDispatchAfter = adminOverviewAfterData.dispatches.find((d) => String(d._id) === String(assignmentForA._id));
  console.log(`✓ Admin overview now shows assigned courier:`, adminDispatchAfter?.courier);
  if (!adminDispatchAfter?.courier?.name) {
    throw new Error("Expected admin overview dispatches to display assigned courier details!");
  }

  // 9. Full lifecycle completion: Driver A picks up -> delivers -> NGO confirms
  console.log("\n9. Completing full lifecycle (picked_up -> delivered -> confirmed)...");
  await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentForA._id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverACookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "picked_up" }),
  });
  await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentForA._id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverACookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "delivered" }),
  });

  const myClaimsRes = await fetch(`${BASE_URL}/api/v1/ngo/claims`, {
    headers: { Cookie: ngoCookies },
  });
  const myClaimsData = await myClaimsRes.json();
  const myClaim = myClaimsData.claims.find((c) => String(c._id) === String(listingId));

  const confirmRes = await fetch(`${BASE_URL}/api/v1/ngo/claims/${myClaim._id}/confirm-receipt`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
  });
  const confirmData = await confirmRes.json();
  console.log(`✓ NGO confirmed receipt: ${confirmData.success}`);

  await client.close();
  console.log("\n🎉 ALL BROADCAST DISPATCH & TWO-STAGE NOTIFICATION TESTS PASSED PERFECTLY!");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
