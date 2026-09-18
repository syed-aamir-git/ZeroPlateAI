// Script to setup, index, and seed MongoDB Atlas according to PRD Sections 13, 14, 18, 20
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const ATLAS_URI = process.env.MONGODB_URI;
const ATLAS_DB_NAME = process.env.MONGODB_DB_NAME || "ZeroPlate_ai_MVP";
const LOCAL_URI = "mongodb://127.0.0.1:27017/zeroplate";

async function setupAtlas() {
  console.log("====================================================");
  console.log("  ZEROPLATE.AI - MONGODB ATLAS SETUP & INDEXING");
  console.log("====================================================");
  console.log(`Target Atlas DB: ${ATLAS_DB_NAME}`);

  const atlasClient = new MongoClient(ATLAS_URI);
  await atlasClient.connect();
  console.log("✓ Connected to MongoDB Atlas successfully!");

  const atlasDb = atlasClient.db(ATLAS_DB_NAME);

  // 1. Check if local mongo has data to transfer
  const localClient = new MongoClient(LOCAL_URI);
  let localDb = null;
  try {
    await localClient.connect();
    localDb = localClient.db("zeroplate");
    console.log("✓ Connected to local MongoDB for data sync.");
  } catch (err) {
    console.log("Local MongoDB not reachable, will perform direct Atlas initialization.");
  }

  const collectionsToSync = [
    "user",
    "account",
    "session",
    "verification",
    "institutions",
    "inventoryItems",
    "surplusListings",
    "ngos",
    "matches",
    "deliveryAssignments",
    "deliveryPartners",
    "adminProfiles",
    "safetyRules",
    "auditLogs",
    "notifications",
  ];

  if (localDb) {
    console.log("\n--- Syncing Data from Local MongoDB to Atlas ---");
    for (const colName of collectionsToSync) {
      const localCol = localDb.collection(colName);
      const atlasCol = atlasDb.collection(colName);

      const localDocs = await localCol.find({}).toArray();
      if (localDocs.length > 0) {
        const atlasCount = await atlasCol.countDocuments();
        if (atlasCount === 0) {
          await atlasCol.insertMany(localDocs);
          console.log(`✓ Migrated ${localDocs.length} documents into '${colName}' on Atlas.`);
        } else {
          console.log(`• Collection '${colName}' already has ${atlasCount} docs on Atlas.`);
        }
      } else {
        console.log(`- Collection '${colName}' is empty locally.`);
      }
    }
  }

  // 2. Ensure Default Safety Rules (PRD Section 18 & 20)
  const safetyCol = atlasDb.collection("safetyRules");
  const existingRules = await safetyCol.findOne({ key: "default_safety_rules" });
  if (!existingRules) {
    await safetyCol.insertOne({
      key: "default_safety_rules",
      name: "FSSAI Food Safety Standards & Temperature Gating Rules",
      cookedFoodWindowHours: 4,
      rawMeatDairyWindowHours: 2,
      minTemperatureCelsius: 0,
      maxTemperatureCelsius: 60,
      requiresRefrigeration: true,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("✓ Inserted default FSSAI safety rules on Atlas.");
  } else {
    console.log("✓ FSSAI safety rules already active on Atlas.");
  }

  // 3. Create all PRD Section 13 Recommended Indexes
  console.log("\n--- Creating PRD Section 13 Indexes on Atlas ---");

  // Institutions: userId
  await atlasDb.collection("institutions").createIndex({ userId: 1 }, { name: "idx_institutions_userId" });
  console.log("✓ Indexed institutions.userId");

  // InventoryItems: institutionId, status
  await atlasDb.collection("inventoryItems").createIndex({ institutionId: 1 }, { name: "idx_inventory_institutionId" });
  await atlasDb.collection("inventoryItems").createIndex({ status: 1 }, { name: "idx_inventory_status" });
  console.log("✓ Indexed inventoryItems.institutionId and status");

  // SurplusListings: status, pickupLocation coordinates
  await atlasDb.collection("surplusListings").createIndex({ status: 1 }, { name: "idx_surplus_status" });
  await atlasDb.collection("surplusListings").createIndex({ "pickupLocation.lat": 1, "pickupLocation.lng": 1 }, { name: "idx_surplus_coords" });
  console.log("✓ Indexed surplusListings.status and pickupLocation");

  // NGOs: userId, location coordinates, kycStatus
  await atlasDb.collection("ngos").createIndex({ userId: 1 }, { name: "idx_ngos_userId" });
  await atlasDb.collection("ngos").createIndex({ "location.lat": 1, "location.lng": 1 }, { name: "idx_ngos_coords" });
  await atlasDb.collection("ngos").createIndex({ kycStatus: 1 }, { name: "idx_ngos_kycStatus" });
  console.log("✓ Indexed ngos.userId, location, and kycStatus");

  // Matches: surplusListingId, ngoId
  await atlasDb.collection("matches").createIndex({ surplusListingId: 1 }, { name: "idx_matches_surplusListingId" });
  await atlasDb.collection("matches").createIndex({ ngoId: 1 }, { name: "idx_matches_ngoId" });
  console.log("✓ Indexed matches.surplusListingId and ngoId");

  // DeliveryAssignments: surplusListingId, matchId, deliveryPartnerId, status
  await atlasDb.collection("deliveryAssignments").createIndex({ surplusListingId: 1 }, { name: "idx_deliv_surplusListingId" });
  await atlasDb.collection("deliveryAssignments").createIndex({ matchId: 1 }, { name: "idx_deliv_matchId" });
  await atlasDb.collection("deliveryAssignments").createIndex({ deliveryPartnerId: 1 }, { name: "idx_deliv_partnerId" });
  await atlasDb.collection("deliveryAssignments").createIndex({ status: 1 }, { name: "idx_deliv_status" });
  console.log("✓ Indexed deliveryAssignments (surplusListingId, matchId, deliveryPartnerId, status)");

  // SafetyRules: key (unique)
  await atlasDb.collection("safetyRules").createIndex({ key: 1 }, { unique: true, name: "idx_safety_key_unique" });
  console.log("✓ Created unique index on safetyRules.key");

  // Notifications: userId, createdAt
  await atlasDb.collection("notifications").createIndex({ userId: 1, createdAt: -1 }, { name: "idx_notif_userId_createdAt" });
  console.log("✓ Indexed notifications.userId + createdAt");

  // AuditLogs: entityId, performedBy, createdAt
  await atlasDb.collection("auditLogs").createIndex({ entityId: 1, createdAt: -1 }, { name: "idx_audit_entityId_createdAt" });
  await atlasDb.collection("auditLogs").createIndex({ performedBy: 1 }, { name: "idx_audit_performedBy" });
  console.log("✓ Indexed auditLogs (entityId, performedBy, createdAt)");

  // DeliveryPartners: userId
  await atlasDb.collection("deliveryPartners").createIndex({ userId: 1 }, { name: "idx_deliv_partners_userId" });
  console.log("✓ Indexed deliveryPartners.userId");

  // AdminProfiles: userId
  await atlasDb.collection("adminProfiles").createIndex({ userId: 1 }, { name: "idx_admin_profiles_userId" });
  console.log("✓ Indexed adminProfiles.userId");

  // 4. Verify Platform Admin Account in Atlas
  console.log("\n--- Verifying Accounts in Atlas ---");
  const adminUser = await atlasDb.collection("user").findOne({ email: "platform_admin@zeroplate.ai" });
  if (adminUser) {
    console.log(`✓ Platform Admin verified: ${adminUser.email} (Role: ${adminUser.role})`);
  } else {
    console.log("! Note: Platform Admin will be created on next startup/script.");
  }

  // 5. Output Summary of Atlas Database Collections
  console.log("\n--- Atlas Database Collection Summary ---");
  const cols = await atlasDb.listCollections().toArray();
  for (const c of cols) {
    const count = await atlasDb.collection(c.name).countDocuments();
    const indexes = await atlasDb.collection(c.name).indexes();
    console.log(`• Collection '${c.name}': ${count} documents, ${indexes.length} indexes`);
  }

  if (localClient) await localClient.close();
  await atlasClient.close();

  console.log("\n====================================================");
  console.log("  MONGODB ATLAS SETUP & VALIDATION COMPLETE");
  console.log("====================================================");
}

setupAtlas().catch((err) => {
  console.error("Atlas setup error:", err);
  process.exit(1);
});
