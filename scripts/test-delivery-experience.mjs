// Automated Verification Script for Delivery Partner Experience
// Tests:
// 1. Create Institution Admin + Listing + Approved NGO Claim -> Generates DeliveryAssignment
// 2. Register Delivery Partner + Onboarding (vehicleType, phone, serviceArea)
// 3. GET /api/v1/delivery/assignments -> verify assignment with pickup/drop locations & window
// 4. Test status lifecycle: assigned -> accepted -> picked_up -> delivered -> confirmed
// 5. GET /api/v1/delivery/history -> verify completed delivery
// 6. GET / PATCH /api/v1/delivery/profile -> verify profile and completed count

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function main() {
  console.log("=== STARTING DELIVERY PARTNER EXPERIENCE VERIFICATION ===");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();

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

  // 1. Setup Donor Kitchen and Verified Listing
  console.log("\n1. Creating Donor Kitchen and Surplus Listing...");
  const instCookies = await registerUser(
    `chef_delivery_test_${timestamp}@hotel.org`,
    "Grand Heritage Hotel Kitchen",
    "institution_admin"
  );
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "institution_admin",
      details: {
        name: "Grand Heritage Hotel",
        type: "hotel",
        address: "55 Hospitality Boulevard, Aerocity",
        lat: 28.55,
        lng: 77.12,
        plan: "free",
      },
    }),
  });

  const now = new Date();
  const prepTime = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  const expiryTime = new Date(now.getTime() + 3 * 60 * 60 * 1000);

  const itemRes = await fetch(`${BASE_URL}/api/v1/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
    body: JSON.stringify({
      name: "Gourmet Dinner Buffet Surplus",
      category: "cooked_food",
      quantity: 50,
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
      quantity: 45,
      pickupWindow: {
        start: now.toISOString(),
        end: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      },
      pickupLocation: {
        address: "Grand Heritage Hotel Bay 4 Loading Dock",
        lat: 28.55,
        lng: 77.12,
      },
    }),
  });
  const listingData = await listingRes.json();
  const listingId = listingData.listing._id;
  console.log(`✓ Surplus listing created: ${listingId} (45 kg)`);

  // 2. Setup Approved NGO and claim the listing to generate DeliveryAssignment
  console.log("\n2. Creating Approved NGO and claiming listing...");
  const ngoCookies = await registerUser(
    `ngo_delivery_test_${timestamp}@seva.org`,
    "Aerocity Shelter Kitchen",
    "ngo"
  );
  await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "ngo",
      details: {
        orgName: "Aerocity Shelter Kitchen",
        registrationNumber: `DL/NGO/DELIVERY/${timestamp}`,
        contactPhone: "+91 97111 88899",
        serviceArea: "Aerocity & Mahipalpur",
        capacityPerWeek: 1500,
        lat: 28.54,
        lng: 77.13,
      },
    }),
  });
  const ngoRecord = await db.collection("ngos").findOne({ registrationNumber: `DL/NGO/DELIVERY/${timestamp}` });
  await db.collection("ngos").updateOne({ _id: ngoRecord._id }, { $set: { kycStatus: "approved" } });

  // 2. Register Delivery Partner
  console.log("\n2. Registering Delivery Partner...");
  const driverEmail = `driver_${timestamp}@logistics.org`;
  const driverCookies = await registerUser(driverEmail, "Ramesh Kumar Driver", "delivery_partner");

  const driverOnboardRes = await fetch(`${BASE_URL}/api/v1/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
    body: JSON.stringify({
      role: "delivery_partner",
      details: {
        phone: "+91 98999 77766",
        vehicleType: "two_wheeler",
        serviceArea: "South West Delhi & Aerocity Zone",
      },
    }),
  });
  const driverOnboardData = await driverOnboardRes.json();
  if (!driverOnboardRes.ok || !driverOnboardData.success) {
    throw new Error(`Driver onboarding failed: ${JSON.stringify(driverOnboardData)}`);
  }
  const driverUser = await db.collection("user").findOne({ email: driverEmail });
  const driverRecord = await db.collection("deliveryPartners").findOne({ userId: driverUser._id });
  await db.collection("deliveryPartners").updateOne(
    { _id: driverRecord._id },
    { $set: { location: { lat: 28.55, lng: 77.12 }, active: true } }
  );
  console.log("✓ Delivery Partner registered, localized, and onboarded.");

  // 3. Claim listing by NGO
  console.log("\n3. Claiming listing by NGO...");
  const claimRes = await fetch(`${BASE_URL}/api/v1/ngo/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: ngoCookies, Origin: BASE_URL },
    body: JSON.stringify({ listingId }),
  });
  const claimData = await claimRes.json();
  if (claimRes.status !== 200) {
    throw new Error(`Failed to claim listing: ${JSON.stringify(claimData)}`);
  }
  console.log("✓ Listing claimed by NGO. deliveryAssignedTo:", claimData.deliveryAssignedTo, "driverRecord._id:", driverRecord._id);

  // Target assignment to current test driver for lifecycle testing
  await db.collection("deliveryAssignments").updateOne(
    { surplusListingId: new ObjectId(listingId) },
    { $set: { assignedToDeliveryPartnerId: driverRecord._id } }
  );

  // 4. Test GET /api/v1/delivery/assignments
  console.log("\n4. Testing GET /api/v1/delivery/assignments...");
  const assignmentsRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments`, {
    headers: { Cookie: driverCookies },
  });
  const assignmentsData = await assignmentsRes.json();
  if (!assignmentsRes.ok || assignmentsData.assignments.length === 0) {
    throw new Error(`No assignments returned: ${JSON.stringify(assignmentsData)}`);
  }

  const assignment = assignmentsData.assignments.find((a) => String(a.surplusListingId) === String(listingId));
  if (!assignment) {
    throw new Error(`Created assignment not found in response: ${JSON.stringify(assignmentsData)}`);
  }
  console.log("✓ Found assignment:", {
    id: assignment._id,
    status: assignment.status,
    item: assignment.item.name,
    quantity: `${assignment.item.quantity} ${assignment.item.unit}`,
    pickup: assignment.pickup.address,
    drop: assignment.drop.address,
  });

  const assignmentId = assignment._id;

  // 5. Test Status Lifecycle Progression
  // Stage 1 -> 2: assigned -> accepted
  console.log("\n5a. Advancing status: assigned -> accepted...");
  const acceptRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "accepted" }),
  });
  const acceptData = await acceptRes.json();
  if (acceptRes.status !== 200 || acceptData.assignment.status !== "accepted") {
    throw new Error(`Failed to advance to accepted: ${JSON.stringify(acceptData)}`);
  }
  console.log("✓ Status transitioned to 'accepted'. Partner assigned.");

  // Stage 2 -> 3: accepted -> picked_up
  console.log("\n5b. Advancing status: accepted -> picked_up...");
  const pickupRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "picked_up" }),
  });
  const pickupData = await pickupRes.json();
  if (pickupRes.status !== 200 || pickupData.assignment.status !== "picked_up") {
    throw new Error(`Failed to advance to picked_up: ${JSON.stringify(pickupData)}`);
  }
  console.log("✓ Status transitioned to 'picked_up'.");

  // Stage 3 -> 4: picked_up -> delivered
  console.log("\n5c. Advancing status: picked_up -> delivered...");
  const deliveredRes = await fetch(`${BASE_URL}/api/v1/delivery/assignments/${assignmentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
    body: JSON.stringify({ nextStatus: "delivered" }),
  });
  const deliveredData = await deliveredRes.json();
  if (deliveredRes.status !== 200 || deliveredData.assignment.status !== "delivered") {
    throw new Error(`Failed to advance to delivered: ${JSON.stringify(deliveredData)}`);
  }
  console.log("✓ Status transitioned to 'delivered'.");

  // Stage 4 -> 5: delivered -> confirmed (NGO confirms receipt)
  console.log("\n5d. NGO confirms receipt (closing delivery lifecycle)...");
  const confirmRes = await fetch(`${BASE_URL}/api/v1/ngo/claims/${listingId}/confirm-receipt`, {
    method: "POST",
    headers: { Cookie: ngoCookies },
  });
  const confirmData = await confirmRes.json();
  if (!confirmRes.ok || !confirmData.success) {
    throw new Error(`NGO confirmation failed: ${JSON.stringify(confirmData)}`);
  }

  const finalAssignment = await db.collection("deliveryAssignments").findOne({ _id: new ObjectId(assignmentId) });
  if (finalAssignment.status !== "confirmed") {
    throw new Error(`Expected assignment status to be 'confirmed', got: ${finalAssignment.status}`);
  }
  console.log("✓ Full lifecycle complete: assigned -> accepted -> picked_up -> delivered -> confirmed!");

  // 6. Test GET /api/v1/delivery/history
  console.log("\n6. Testing GET /api/v1/delivery/history...");
  const historyRes = await fetch(`${BASE_URL}/api/v1/delivery/history`, {
    headers: { Cookie: driverCookies },
  });
  const historyData = await historyRes.json();
  if (!historyRes.ok || historyData.deliveries.length === 0) {
    throw new Error(`Expected completed delivery in history, got: ${JSON.stringify(historyData)}`);
  }
  console.log(`✓ History confirmed: ${historyData.deliveries.length} completed run(s).`);

  // 7. Test GET & PATCH /api/v1/delivery/profile
  console.log("\n7. Testing GET & PATCH /api/v1/delivery/profile...");
  const patchProfileRes = await fetch(`${BASE_URL}/api/v1/delivery/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: driverCookies, Origin: BASE_URL },
    body: JSON.stringify({
      vehicleType: "electric_cargo",
      serviceArea: "National Capital Region (Aerocity Cargo Hub)",
      active: true,
    }),
  });
  const patchProfileData = await patchProfileRes.json();
  if (!patchProfileRes.ok || patchProfileData.partner.vehicleType !== "electric_cargo") {
    throw new Error(`Failed to update delivery profile: ${JSON.stringify(patchProfileData)}`);
  }

  const getProfileRes = await fetch(`${BASE_URL}/api/v1/delivery/profile`, {
    headers: { Cookie: driverCookies },
  });
  const getProfileData = await getProfileRes.json();
  if (!getProfileRes.ok || getProfileData.partner.totalCompleted !== 1) {
    throw new Error(`Expected totalCompleted === 1, got: ${getProfileData.partner?.totalCompleted}`);
  }
  console.log("✓ Profile successfully updated and totalCompleted count verified:", getProfileData.partner);

  await client.close();
  console.log("\n=======================================================");
  console.log("ALL DELIVERY PARTNER EXPERIENCE TESTS PASSED 100%!");
  console.log("=======================================================");
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
