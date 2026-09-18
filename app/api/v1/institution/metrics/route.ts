import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { computeExpiryStatus } from "@/lib/auto-flagging";
import { calculateSustainabilityImpact } from "@/lib/sustainability";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const db = await getDb();
  const userId = session.user.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const institution = await db
    .collection("institutions")
    .findOne({ userId: userObjectId as any });

  if (!institution) {
    return NextResponse.json({ error: "Institution not found." }, { status: 404 });
  }

  try {
    const [inventoryItems, listings, auditLogs] = await Promise.all([
      db.collection("inventoryItems").find({ institutionId: institution._id }).toArray(),
      db.collection("surplusListings").find({ institutionId: institution._id }).toArray(),
      db.collection("auditLogs").find({ performedBy: userObjectId as any }).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);

    // Compute inventory nearing expiry count
    let nearingExpiryCount = 0;
    inventoryItems.forEach((item) => {
      const status = computeExpiryStatus(item.category, item.expiryEstimateAt);
      if (status.isNearingExpiry) {
        nearingExpiryCount++;
      }
    });

    const deliveredListings = listings.filter((l) => l.status === "delivered");
    const activeListings = listings.filter((l) => l.status === "pending" || l.status === "matched" || l.status === "claimed");

    const totalListedKg = listings
      .filter((l) => l.safetyStatus === "verified_safe")
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    const wastePreventedKg = deliveredListings.reduce(
      (acc, curr) => acc + (Number(curr.quantity) || 0),
      0
    );

    // Official Sustainability Impact Calculation (Functional PRD Section 12.7 & 22)
    const impact = calculateSustainabilityImpact(wastePreventedKg);

    return NextResponse.json({
      success: true,
      institution: {
        id: institution._id,
        name: institution.name,
        type: institution.type,
        plan: institution.plan || "free",
      },
      metrics: {
        wastePreventedKg: impact.wastePreventedKg,
        mealsGiven: impact.mealsGiven,
        co2eAvoidedKg: impact.co2eAvoidedKg,
        costSavedInr: impact.costSavedInr,
        methaneAvoidedKg: impact.methaneAvoidedKg,
        waterPreservedLiters: impact.waterPreservedLiters,
        totalListedKg,
        inStockCount: inventoryItems.filter((i) => i.status === "in_stock").length,
        activeListingsCount: activeListings.length,
        nearingExpiryCount,
        hasData: inventoryItems.length > 0 || listings.length > 0,
      },
      recentActivity: auditLogs.map((log) => ({
        id: log._id,
        action: log.action,
        status: log.status,
        ruleApplied: log.ruleApplied,
        reason: log.reason,
        timestamp: log.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Error computing institution metrics:", error);
    return NextResponse.json(
      { error: "Failed to compute metrics." },
      { status: 500 }
    );
  }
}
