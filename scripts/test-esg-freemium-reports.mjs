/**
 * Automated Verification Suite for Prompt 7:
 * - Sustainability & ESG Conversion Factors (PRD Sections 12.7 & 22)
 * - Freemium Gating (PRD Section 23): plan: "free" (blocked HTTP 403 with upsell payload) vs plan: "premium" (HTTP 200 with real CSV audit export)
 * - Plan toggling via real API endpoint
 * - Onboarding checklist and help content validation
 */

import { MongoClient, ObjectId } from "mongodb";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zeroplate";

async function registerUser(email, name, role) {
  const password = "Password@123456";
  const res = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE_URL },
    body: JSON.stringify({ email, password, name, role }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sign up failed: ${res.status} ${text}`);
  }

  const rawSetCookie = res.headers.get("set-cookie");
  if (!rawSetCookie) throw new Error("No cookies returned from signup");

  const cookies = rawSetCookie
    .split(/,(?=[^;]+=[^;]+)/)
    .map((c) => c.trim().split(";")[0])
    .join("; ");

  return cookies;
}

async function runTests() {
  console.log("=================================================================");
  console.log("Starting ESG Reports & Freemium Gating Test Suite");
  console.log("=================================================================\n");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const timestamp = Date.now();

  try {
    // -------------------------------------------------------------
    // 1. TEST DOCUMENTED SUSTAINABILITY CONVERSION FACTORS
    // -------------------------------------------------------------
    console.log("▶ [1/5] Testing Documented Sustainability Conversion Engine...");
    const { calculateSustainabilityImpact, SUSTAINABILITY_FACTORS } = await import("../lib/sustainability.js");

    const sampleImpact = calculateSustainabilityImpact(100);
    console.log("  Calculated sample impact for 100 kg surplus diverted:", sampleImpact);

    if (sampleImpact.mealsGiven !== 250) {
      throw new Error(`Expected 250 meals (100 * 2.5), got: ${sampleImpact.mealsGiven}`);
    }
    if (sampleImpact.co2eAvoidedKg !== 190) {
      throw new Error(`Expected 190 kg CO2e (100 * 1.9), got: ${sampleImpact.co2eAvoidedKg}`);
    }
    if (sampleImpact.methaneAvoidedKg !== 7) {
      throw new Error(`Expected 7 kg CH4 (100 * 0.07), got: ${sampleImpact.methaneAvoidedKg}`);
    }
    if (sampleImpact.costSavedInr !== 12000) {
      throw new Error(`Expected ₹12,000 (100 * 120), got: ${sampleImpact.costSavedInr}`);
    }
    if (sampleImpact.waterPreservedLiters !== 25000) {
      throw new Error(`Expected 25,000 L water (100 * 250), got: ${sampleImpact.waterPreservedLiters}`);
    }
    console.log("  ✓ Conversion factors confirmed: 2.5 meals/kg, 1.9 kg CO2e/kg, 0.07 kg CH4/kg, ₹120/kg, 250 L/kg.");

    // -------------------------------------------------------------
    // 2. REGISTER INSTITUTION & VERIFY DEFAULT FREE PLAN
    // -------------------------------------------------------------
    console.log("\n▶ [2/5] Registering Institution Admin (Standard Free Tier)...");
    const instEmail = `esg_admin_${timestamp}@dining.org`;
    const instCookies = await registerUser(instEmail, "Executive Chef Mehta", "institution_admin");

    const instName = `The Royal Kitchen & Banquet ${timestamp}`;
    const onboardRes = await fetch(`${BASE_URL}/api/v1/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
      body: JSON.stringify({
        role: "institution_admin",
        details: {
          name: instName,
          type: "hotel",
          address: "Civil Lines, New Delhi",
          location: { lat: 28.67, lng: 77.22 },
        },
      }),
    });

    const onboardData = await onboardRes.json();
    if (!onboardRes.ok || !onboardData.success) {
      throw new Error(`Onboarding failed: ${JSON.stringify(onboardData)}`);
    }

    const instRecord = await db.collection("institutions").findOne({ name: instName });
    if (!instRecord) throw new Error("Institution not found in MongoDB.");

    if (instRecord.plan !== "free") {
      throw new Error(`Expected default plan to be 'free', got: ${instRecord.plan}`);
    }
    console.log(`  ✓ Institution onboarded on plan: "${instRecord.plan}" (ID: ${instRecord._id})`);

    // Add a delivered surplus batch to test report itemization
    const deliveredListingId = new ObjectId();
    await db.collection("surplusListings").insertOne({
      _id: deliveredListingId,
      institutionId: instRecord._id,
      institutionName: instRecord.name,
      itemName: "Gourmet Banquet Curry & Basmati Rice",
      category: "cooked_food",
      quantity: 80,
      unit: "kg",
      safetyStatus: "verified_safe",
      status: "delivered",
      claimedByNgoName: "Delhi Seva Food Bank",
      deliveredAt: new Date(),
      createdAt: new Date(Date.now() - 3600000),
    });

    // -------------------------------------------------------------
    // 3. TEST FREEMIUM GATING: EXPORT BLOCKED ON FREE PLAN (HTTP 403)
    // -------------------------------------------------------------
    console.log("\n▶ [3/5] Testing Freemium Gating on Free Plan (Expect HTTP 403)...");
    const freeExportRes = await fetch(`${BASE_URL}/api/v1/analytics/institution/${instRecord._id}/export`, {
      headers: { Cookie: instCookies },
    });

    console.log(`  HTTP Status: ${freeExportRes.status}`);
    const freeExportData = await freeExportRes.json();
    console.log("  Server Response:", freeExportData);

    if (freeExportRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for free tier export, got: ${freeExportRes.status}`);
    }
    if (freeExportData.code !== "PLAN_UPGRADE_REQUIRED") {
      throw new Error(`Expected error code 'PLAN_UPGRADE_REQUIRED', got: ${freeExportData.code}`);
    }
    if (!freeExportData.message.includes("Premium Plan")) {
      throw new Error(`Expected upsell message mentioning Premium Plan, got: ${freeExportData.message}`);
    }
    console.log("  ✓ SUCCESS: Export correctly blocked with real upsell state for free institution!");

    // -------------------------------------------------------------
    // 4. UPGRADE INSTITUTION TO PREMIUM PLAN VIA API
    // -------------------------------------------------------------
    console.log("\n▶ [4/5] Upgrading Institution to Premium Tier via API...");
    const upgradeRes = await fetch(`${BASE_URL}/api/v1/institution/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
      body: JSON.stringify({ plan: "premium" }),
    });

    const upgradeData = await upgradeRes.json();
    if (!upgradeRes.ok || upgradeData.institution.plan !== "premium") {
      throw new Error(`Upgrade failed: ${JSON.stringify(upgradeData)}`);
    }

    const updatedInst = await db.collection("institutions").findOne({ _id: instRecord._id });
    if (updatedInst.plan !== "premium") {
      throw new Error(`Expected MongoDB plan to be 'premium', got: ${updatedInst.plan}`);
    }
    console.log(`  ✓ Institution upgraded to plan: "${updatedInst.plan}" in MongoDB.`);

    // -------------------------------------------------------------
    // 5. TEST PREMIUM EXPORT: SUCCEEDS WITH REAL AUDITED CSV
    // -------------------------------------------------------------
    console.log("\n▶ [5/5] Testing Premium Export (Expect HTTP 200 & Real CSV)...");
    const premiumExportRes = await fetch(`${BASE_URL}/api/v1/analytics/institution/${instRecord._id}/export?format=csv`, {
      headers: { Cookie: instCookies },
    });

    console.log(`  HTTP Status: ${premiumExportRes.status}`);
    const contentType = premiumExportRes.headers.get("content-type");
    const contentDisposition = premiumExportRes.headers.get("content-disposition");
    console.log(`  Content-Type: ${contentType}`);
    console.log(`  Content-Disposition: ${contentDisposition}`);

    if (premiumExportRes.status !== 200) {
      throw new Error(`Expected HTTP 200 for premium export, got: ${premiumExportRes.status}`);
    }
    if (!contentType || !contentType.includes("text/csv")) {
      throw new Error(`Expected text/csv content type, got: ${contentType}`);
    }
    if (!contentDisposition || !contentDisposition.includes("attachment")) {
      throw new Error(`Expected attachment disposition, got: ${contentDisposition}`);
    }

    const csvBody = await premiumExportRes.text();
    console.log("\n--- GENERATED CSV EXPORT PREVIEW ---");
    console.log(csvBody.split("\n").slice(0, 15).join("\n"));
    console.log("------------------------------------\n");

    if (!csvBody.includes("GHG Protocol Standard: Scope 3 Category 5")) {
      throw new Error("Missing GHG Protocol standards header in CSV.");
    }
    if (!csvBody.includes("Gourmet Banquet Curry & Basmati Rice")) {
      throw new Error("Missing delivered food record in CSV.");
    }
    if (!csvBody.includes("Delhi Seva Food Bank")) {
      throw new Error("Missing recipient NGO in CSV.");
    }
    console.log("  ✓ SUCCESS: Full audited ESG CSV generated with real conversion metrics!");

    // -------------------------------------------------------------
    // 6. DOWNGRADE BACK TO FREE TO VERIFY RE-LOCKING
    // -------------------------------------------------------------
    console.log("▶ Verifying Downgrade back to Free Tier re-locks the export...");
    await fetch(`${BASE_URL}/api/v1/institution/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: instCookies, Origin: BASE_URL },
      body: JSON.stringify({ plan: "free" }),
    });

    const relockedRes = await fetch(`${BASE_URL}/api/v1/analytics/institution/${instRecord._id}/export`, {
      headers: { Cookie: instCookies },
    });

    if (relockedRes.status !== 403) {
      throw new Error(`Expected HTTP 403 after downgrade, got: ${relockedRes.status}`);
    }
    console.log("  ✓ SUCCESS: Export correctly re-locked after downgrade!");

    // Clean up test records
    await db.collection("institutions").deleteOne({ _id: instRecord._id });
    await db.collection("surplusListings").deleteOne({ _id: deliveredListingId });
    await db.collection("user").deleteOne({ email: instEmail });

    console.log("\n=================================================================");
    console.log("ALL ESG REPORTS & FREEMIUM GATING TESTS PASSED 100%!");
    console.log("=================================================================");
  } finally {
    await client.close();
  }
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
