/**
 * Automated Verification Suite for Prompt 6:
 * - Weighted Redistribution Matching Score Algorithm (Functional PRD Sections 11, 12.4)
 * - Nearest Available Delivery Partner Assignment (Functional PRD Section 12.5)
 * - In-App & Transactional Notifications (Functional PRD Section 12.6, Design PRD 12.3)
 * - Python FastAPI Forecasting Microservice with Cold-Start Fallback (PRD Sections 6, 11, 12.2)
 * - Next.js Route Handler Proxy (/api/v1/forecast/:institutionId)
 */

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";
const FORECAST_URL = process.env.FORECAST_SERVICE_URL || "http://127.0.0.1:8000";

async function runTests() {
  console.log("=================================================================");
  console.log("Starting Matching, Logistics, Notifications & Forecast Test Suite");
  console.log("=================================================================\n");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  try {
    // -------------------------------------------------------------
    // 1. TEST PYTHON FASTAPI FORECASTING MICROSERVICE DIRECTLY
    // -------------------------------------------------------------
    console.log("▶ [1/5] Testing Python FastAPI Forecasting Service...");
    
    // Test A: Health endpoint
    const healthRes = await fetch(`${FORECAST_URL}/health`);
    if (!healthRes.ok) throw new Error("Forecasting microservice /health failed.");
    const healthData = await healthRes.json();
    console.log(`  ✓ Forecasting microservice healthy: ${healthData.service}`);

    // Test B: Cold-start institution (5 days of history < 14 days)
    const coldStartHistory = [
      { date: "2026-09-10", quantity: 45, category: "cooked_food" },
      { date: "2026-09-11", quantity: 50, category: "cooked_food" },
      { date: "2026-09-12", quantity: 40, category: "cooked_food" },
      { date: "2026-09-13", quantity: 55, category: "cooked_food" },
      { date: "2026-09-14", quantity: 48, category: "cooked_food" },
    ];

    const coldRes = await fetch(`${FORECAST_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution_id: "test_inst_cold",
        history: coldStartHistory,
        forecast_days: 7,
      }),
    });

    if (!coldRes.ok) throw new Error(`Cold start forecast failed: ${await coldRes.text()}`);
    const coldData = await coldRes.json();

    if (coldData.confidence !== "low") {
      throw new Error(`Expected confidence to be 'low', got: ${coldData.confidence}`);
    }
    if (coldData.model_used !== "cold_start_moving_average") {
      throw new Error(`Expected model_used to be 'cold_start_moving_average', got: ${coldData.model_used}`);
    }
    if (coldData.predictions.length !== 7) {
      throw new Error(`Expected 7 predictions, got: ${coldData.predictions.length}`);
    }
    console.log(`  ✓ Cold-Start behavior confirmed: confidence='${coldData.confidence}' (${coldData.notes})`);

    // Test C: Confident institution (20 days of history >= 14 days)
    const confidentHistory = [];
    const baseDate = new Date("2026-08-20");
    for (let i = 0; i < 20; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      confidentHistory.push({
        date: d.toISOString().slice(0, 10),
        quantity: 80 + Math.sin(i) * 15 + (i % 7 === 0 ? -10 : 5),
        category: "cooked_food",
      });
    }

    const confRes = await fetch(`${FORECAST_URL}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution_id: "test_inst_active",
        history: confidentHistory,
        forecast_days: 7,
      }),
    });

    if (!confRes.ok) throw new Error(`Active forecast failed: ${await confRes.text()}`);
    const confData = await confRes.json();

    if (confData.confidence === "low") {
      throw new Error(`Expected high/moderate confidence for 20 days, got: ${confData.confidence}`);
    }
    console.log(`  ✓ Confident Forecast confirmed: model='${confData.model_used}', confidence='${confData.confidence}', score=${confData.confidence_score}`);

    // -------------------------------------------------------------
    // 2. TEST WEIGHTED MATCHING ENGINE (lib/matching.ts)
    // -------------------------------------------------------------
    console.log("\n▶ [2/5] Testing Weighted Redistribution Matching Algorithm...");
    
    // Set up test institution, 2 approved NGOs (1 close, 1 far)
    const instId = new ObjectId();
    const instUserId = new ObjectId();
    await db.collection("institutions").insertOne({
      _id: instId,
      userId: instUserId,
      name: "Apex Central Kitchen",
      address: "Connaught Place, New Delhi",
      location: { lat: 28.6315, lng: 77.2167 },
      createdAt: new Date(),
    });

    // NGO 1: Close (2.5 km away), High Capacity (700 kg/wk), High Reliability (95)
    const ngo1Id = new ObjectId();
    const ngo1UserId = new ObjectId();
    await db.collection("ngos").insertOne({
      _id: ngo1Id,
      userId: ngo1UserId,
      orgName: "City Bread Shelter (Near)",
      kycStatus: "approved",
      capacityPerWeek: 700,
      reliabilityScore: 95,
      location: { lat: 28.6415, lng: 77.2267 },
      createdAt: new Date(),
    });

    // NGO 2: Far (32 km away), Modest Capacity (140 kg/wk), Lower Reliability (75)
    const ngo2Id = new ObjectId();
    const ngo2UserId = new ObjectId();
    await db.collection("ngos").insertOne({
      _id: ngo2Id,
      userId: ngo2UserId,
      orgName: "Outskirts Relief (Far)",
      kycStatus: "approved",
      capacityPerWeek: 140,
      reliabilityScore: 75,
      location: { lat: 28.3815, lng: 77.0567 },
      createdAt: new Date(),
    });

    // Create listing
    const listingId = new ObjectId();
    const listingDoc = {
      _id: listingId,
      institutionId: instId,
      institutionName: "Apex Central Kitchen",
      itemName: "Steamed Basmati Rice & Dal Makhani",
      category: "cooked_food",
      quantity: 45,
      unit: "kg",
      pickupLocation: { lat: 28.6315, lng: 77.2167, address: "Gate 2, Connaught Place" },
      safetyStatus: "verified_safe",
      status: "pending",
      createdAt: new Date(),
    };
    await db.collection("surplusListings").insertOne(listingDoc);

    // Run dynamic matching calculation via lib
    const { rankAndCreateMatches } = await import("../lib/matching.js");
    const matches = await rankAndCreateMatches(db, listingDoc);

    const testMatches = matches.filter((m) =>
      [ngo1Id.toString(), ngo2Id.toString()].includes(m.ngoId.toString())
    );

    if (testMatches.length < 2) {
      throw new Error(`Expected both test NGOs in matches, found ${testMatches.length}`);
    }

    console.log(`  Top Test NGO Match: ${testMatches[0].orgName} - Score: ${testMatches[0].score}% (Dist: ${testMatches[0].distanceKm}km)`);
    console.log(`  Second Test NGO Match: ${testMatches[1].orgName} - Score: ${testMatches[1].score}% (Dist: ${testMatches[1].distanceKm}km)`);

    if (testMatches[0].ngoId.toString() !== ngo1Id.toString()) {
      throw new Error("Proximity + capacity weighting failed: Near NGO should rank higher than Far NGO.");
    }
    if (testMatches[0].score <= testMatches[1].score) {
      throw new Error("Score assertion failed: Near NGO score should be greater than Far NGO score.");
    }

    // Verify stored matches in MongoDB
    const persistedMatches = await db.collection("matches").find({ surplusListingId: listingId }).toArray();
    if (persistedMatches.length < 2) {
      throw new Error("Matches were not persisted to 'matches' collection in MongoDB.");
    }
    console.log(`  ✓ Persisted ${persistedMatches.length} proposed records in 'matches' collection.`);

    // -------------------------------------------------------------
    // 3. TEST LOGISTICS NEAREST DELIVERY PARTNER ASSIGNMENT
    // -------------------------------------------------------------
    console.log("\n▶ [3/5] Testing Nearest Delivery Partner Assignment (PRD 12.5)...");

    // Partner A: Near (1.2 km away, active: true)
    const driverAId = new ObjectId();
    const driverAUserId = new ObjectId();
    await db.collection("deliveryPartners").insertOne({
      _id: driverAId,
      userId: driverAUserId,
      phone: "+919876543210",
      vehicleType: "three_wheeler",
      serviceArea: "Central Zone",
      location: { lat: 28.6250, lng: 77.2100 },
      active: true,
      createdAt: new Date(),
    });

    // Partner B: Far (22 km away, active: true)
    const driverBId = new ObjectId();
    const driverBUserId = new ObjectId();
    await db.collection("deliveryPartners").insertOne({
      _id: driverBId,
      userId: driverBUserId,
      phone: "+919876543211",
      vehicleType: "two_wheeler",
      serviceArea: "Outer Ring",
      location: { lat: 28.4500, lng: 77.1000 },
      active: true,
      createdAt: new Date(),
    });

    const { assignNearestDeliveryPartner } = await import("../lib/logistics.js");
    const assignmentResult = await assignNearestDeliveryPartner(db, listingDoc.pickupLocation);

    if (!assignmentResult.partner) {
      throw new Error("assignNearestDeliveryPartner failed to find a partner.");
    }

    if (assignmentResult.partner._id.toString() !== driverAId.toString()) {
      throw new Error(`Expected Driver A (nearest) to be assigned, got: ${assignmentResult.partner._id}`);
    }
    console.log(`  ✓ Nearest driver assigned: Driver A (Distance: ${assignmentResult.distanceKm} km)`);

    // -------------------------------------------------------------
    // 4. TEST NOTIFICATIONS PIPELINE
    // -------------------------------------------------------------
    console.log("\n▶ [4/5] Testing In-App & Email Notifications Module...");
    const { createNotification } = await import("../lib/notifications.js");

    // Notification A: New matching listing
    await createNotification(db, {
      userId: ngo1UserId,
      role: "ngo",
      type: "new_matching_listing",
      title: "Surplus Food Match Available",
      message: "45 kg of Steamed Basmati Rice & Dal Makhani is available at Apex Central Kitchen.",
      link: "/app/ngo/browse",
    });

    // Notification B: Driver dispatch
    await createNotification(db, {
      userId: driverAUserId,
      role: "delivery_partner",
      type: "delivery_assigned",
      title: "New Dispatch Run Assigned",
      message: "Pickup 45 kg from Apex Central Kitchen for City Bread Shelter.",
      link: "/app/delivery/assignments",
    });

    // Verify stored notifications
    const ngoNotifs = await db.collection("notifications").find({ userId: ngo1UserId }).toArray();
    if (ngoNotifs.length === 0) throw new Error("In-app notification was not saved to MongoDB.");
    console.log(`  ✓ Created in-app notification for NGO: "${ngoNotifs[0].title}" (readStatus: ${ngoNotifs[0].readStatus})`);

    // Verify email log
    const emailLogs = await db.collection("emailLogs").find().toArray();
    console.log(`  ✓ Dispatched transactional emails tracked in emailLogs: ${emailLogs.length} logged.`);

    // -------------------------------------------------------------
    // 5. CLEANUP TEST ARTIFACTS
    // -------------------------------------------------------------
    console.log("\n▶ [5/5] Cleaning up test records...");
    await db.collection("institutions").deleteMany({ _id: instId });
    await db.collection("ngos").deleteMany({ _id: { $in: [ngo1Id, ngo2Id] } });
    await db.collection("surplusListings").deleteMany({ _id: listingId });
    await db.collection("matches").deleteMany({ surplusListingId: listingId });
    await db.collection("deliveryPartners").deleteMany({ _id: { $in: [driverAId, driverBId] } });
    await db.collection("notifications").deleteMany({ userId: { $in: [ngo1UserId, driverAUserId] } });

    console.log("  ✓ Cleanup complete.");

    console.log("\n=================================================================");
    console.log("ALL TESTS PASSED SUCCESSFULLY (100% GREEN)!");
    console.log("=================================================================");
  } finally {
    await client.close();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
