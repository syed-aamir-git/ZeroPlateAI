import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "ZeroPlate_ai_MVP";

async function cleanupDummyData() {
  console.log("=================================================");
  console.log("  ZEROPLATE.AI - DUMMY DATA REMOVAL & PURGE");
  console.log("=================================================");
  console.log(`Connecting to: ${dbName}...`);

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log("✓ Connected to MongoDB Atlas.");

  // 1. Identify Real Users
  const allUsers = await db.collection("user").find({}).toArray();
  const realUsers = allUsers.filter((u) => !/_\d{10,}/.test(u.email));
  const dummyUsers = allUsers.filter((u) => /_\d{10,}/.test(u.email));

  const realUserObjIds = realUsers.map((u) => (u._id instanceof ObjectId ? u._id : new ObjectId(u._id)));
  const realUserStrIds = realUsers.map((u) => u._id.toString());
  const allRealUserIds = [...realUserObjIds, ...realUserStrIds];

  const dummyUserObjIds = dummyUsers.map((u) => (u._id instanceof ObjectId ? u._id : new ObjectId(u._id)));
  const dummyUserStrIds = dummyUsers.map((u) => u._id.toString());
  const allDummyUserIds = [...dummyUserObjIds, ...dummyUserStrIds];

  console.log(`\n• Users: Found ${realUsers.length} REAL users to preserve, and ${dummyUsers.length} dummy users to remove.`);

  // 2. Identify Real Institutions
  const realInstitutions = await db.collection("institutions").find({
    userId: { $in: allRealUserIds },
  }).toArray();
  const realInstObjIds = realInstitutions.map((i) => (i._id instanceof ObjectId ? i._id : new ObjectId(i._id)));
  const realInstStrIds = realInstitutions.map((i) => i._id.toString());
  const allRealInstIds = [...realInstObjIds, ...realInstStrIds];

  console.log(`• Institutions: Found ${realInstitutions.length} REAL institutions to preserve:`);
  realInstitutions.forEach((i) => console.log(`   - ${i.name} (${i._id})`));

  // 3. Identify Real NGOs
  const realNgos = await db.collection("ngos").find({
    userId: { $in: allRealUserIds },
  }).toArray();
  const realNgoObjIds = realNgos.map((n) => (n._id instanceof ObjectId ? n._id : new ObjectId(n._id)));
  const realNgoStrIds = realNgos.map((n) => n._id.toString());
  const allRealNgoIds = [...realNgoObjIds, ...realNgoStrIds];

  console.log(`• NGOs: Found ${realNgos.length} REAL NGOs to preserve:`);
  realNgos.forEach((n) => console.log(`   - ${n.orgName} (${n._id})`));

  // 4. Identify Real Delivery Partners
  const realDrivers = await db.collection("deliveryPartners").find({
    userId: { $in: allRealUserIds },
  }).toArray();
  const realDriverObjIds = realDrivers.map((d) => (d._id instanceof ObjectId ? d._id : new ObjectId(d._id)));
  const realDriverStrIds = realDrivers.map((d) => d._id.toString());
  const allRealDriverIds = [...realDriverObjIds, ...realDriverStrIds];

  console.log(`• Delivery Partners: Found ${realDrivers.length} REAL drivers to preserve:`);
  realDrivers.forEach((d) => console.log(`   - ${d.name || d.vehicleNumber} (${d._id})`));

  // 5. Identify Real Surplus Listings (entered by real institutions)
  const realSurplus = await db.collection("surplusListings").find({
    $or: [
      { institutionId: { $in: allRealInstIds } },
      { userId: { $in: allRealUserIds } },
    ],
  }).toArray();
  const realSurplusObjIds = realSurplus.map((s) => (s._id instanceof ObjectId ? s._id : new ObjectId(s._id)));
  const realSurplusStrIds = realSurplus.map((s) => s._id.toString());
  const allRealSurplusIds = [...realSurplusObjIds, ...realSurplusStrIds];

  console.log(`• Surplus Listings: Found ${realSurplus.length} REAL listings to preserve:`);
  realSurplus.forEach((s) => console.log(`   - ${s.itemName || s.foodName} (${s.quantity || s.quantityKg}kg)`));

  // 6. Identify Real Inventory Items (entered by real users/institutions, excluding the repeated 9 seed baseline items)
  const seedItemNames = [
    "Fresh Ripe Tomatoes",
    "Farm Potatoes",
    "Red Onions",
    "Aged Basmati Rice",
    "Toned Cow Milk",
    "Fresh Farm Spinach (Palak)",
    "Organic Toor Dal",
    "Fresh Cottage Cheese (Paneer)",
    "Refined Sunflower Cooking Oil",
  ];

  const userInventory = await db.collection("inventoryItems").find({
    $or: [
      { institutionId: { $in: allRealInstIds } },
      { userId: { $in: allRealUserIds } },
    ],
    name: { $nin: seedItemNames },
  }).toArray();

  const userInvObjIds = userInventory.map((i) => (i._id instanceof ObjectId ? i._id : new ObjectId(i._id)));
  const userInvStrIds = userInventory.map((i) => i._id.toString());
  const allUserInvIds = [...userInvObjIds, ...userInvStrIds];

  console.log(`• Inventory: Found ${userInventory.length} REAL user-logged inventory items to preserve:`);
  userInventory.forEach((inv) => console.log(`   - ${inv.name} (${inv.quantity} ${inv.unit})`));

  console.log("\n=================================================");
  console.log("  EXECUTING TARGETED PURGE OF DUMMY TEST DATA");
  console.log("=================================================");

  // A. Purge dummy institutions
  const instResult = await db.collection("institutions").deleteMany({
    _id: { $nin: realInstObjIds },
  });
  console.log(`✓ Removed ${instResult.deletedCount} dummy institutions (Preserved: ${realInstitutions.length})`);

  // B. Purge dummy NGOs
  const ngoResult = await db.collection("ngos").deleteMany({
    _id: { $nin: realNgoObjIds },
  });
  console.log(`✓ Removed ${ngoResult.deletedCount} dummy NGOs (Preserved: ${realNgos.length})`);

  // C. Purge dummy Delivery Partners
  const driverResult = await db.collection("deliveryPartners").deleteMany({
    _id: { $nin: realDriverObjIds },
  });
  console.log(`✓ Removed ${driverResult.deletedCount} dummy drivers (Preserved: ${realDrivers.length})`);

  // D. Purge dummy Surplus Listings
  const surplusResult = await db.collection("surplusListings").deleteMany({
    _id: { $nin: realSurplusObjIds },
  });
  console.log(`✓ Removed ${surplusResult.deletedCount} dummy surplus listings (Preserved: ${realSurplus.length})`);

  // E. Purge dummy Inventory Items
  const invResult = await db.collection("inventoryItems").deleteMany({
    _id: { $nin: userInvObjIds },
  });
  console.log(`✓ Removed ${invResult.deletedCount} dummy/seed inventory items (Preserved: ${userInventory.length})`);

  // F. Purge dummy Delivery Assignments (keep only assignments linked to real surplus listings)
  const delResult = await db.collection("deliveryAssignments").deleteMany({
    surplusListingId: { $nin: allRealSurplusIds },
  });
  console.log(`✓ Removed ${delResult.deletedCount} dummy delivery assignments`);

  // G. Purge dummy Matches
  const matchResult = await db.collection("matches").deleteMany({
    $or: [
      { surplusListingId: { $nin: allRealSurplusIds } },
      { ngoId: { $nin: allRealNgoIds } },
    ],
  });
  console.log(`✓ Removed ${matchResult.deletedCount} dummy match pairs`);

  // H. Purge dummy Users, Accounts, Sessions
  const userResult = await db.collection("user").deleteMany({
    _id: { $in: dummyUserObjIds },
  });
  console.log(`✓ Removed ${userResult.deletedCount} dummy users (Preserved: ${realUsers.length})`);

  const accountResult = await db.collection("account").deleteMany({
    userId: { $in: allDummyUserIds },
  });
  console.log(`✓ Removed ${accountResult.deletedCount} dummy accounts`);

  const sessionResult = await db.collection("session").deleteMany({
    userId: { $in: allDummyUserIds },
  });
  console.log(`✓ Removed ${sessionResult.deletedCount} dummy sessions`);

  // I. Purge dummy admin profiles
  const adminResult = await db.collection("adminProfiles").deleteMany({
    userId: { $in: allDummyUserIds },
  });
  console.log(`✓ Removed ${adminResult.deletedCount} dummy admin profiles`);

  // J. Purge dummy notifications & emailLogs
  const notifResult = await db.collection("notifications").deleteMany({
    userId: { $in: allDummyUserIds },
  });
  console.log(`✓ Removed ${notifResult.deletedCount} dummy notifications`);

  const emailResult = await db.collection("emailLogs").deleteMany({
    to: { $regex: /_\d{10,}/ },
  });
  console.log(`✓ Removed ${emailResult.deletedCount} dummy email logs`);

  // K. Purge auditLogs referencing dummy test users
  const auditResult = await db.collection("auditLogs").deleteMany({
    $or: [
      { performedBy: { $in: dummyUserStrIds } },
      { "details.userEmail": { $regex: /_\d{10,}/ } },
    ],
  });
  console.log(`✓ Removed ${auditResult.deletedCount} dummy audit logs`);

  console.log("\n=================================================");
  console.log("  FINAL DATABASE STATUS - REAL DATA ONLY");
  console.log("=================================================");
  const collections = [
    "user",
    "institutions",
    "ngos",
    "deliveryPartners",
    "surplusListings",
    "inventoryItems",
    "deliveryAssignments",
    "matches",
    "notifications",
    "auditLogs",
  ];
  for (const col of collections) {
    const count = await db.collection(col).countDocuments();
    console.log(`• ${col}: ${count} records remaining`);
  }

  await client.close();
  console.log("\n✓ Cleanup successfully finished!");
}

cleanupDummyData().catch(console.error);
