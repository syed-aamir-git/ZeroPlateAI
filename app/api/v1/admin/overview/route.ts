import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { calculateSustainabilityImpact } from "@/lib/sustainability";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "platform_admin") {
      return NextResponse.json(
        { error: "Forbidden. Platform Admin access required." },
        { status: 403 }
      );
    }

    const db = await getDb();

    // 1. Entities counts
    const [
      institutionCount,
      ngoCount,
      pendingKycCount,
      deliveryPartnerCount,
      totalUsersCount,
    ] = await Promise.all([
      db.collection("institutions").countDocuments(),
      db.collection("ngos").countDocuments(),
      db.collection("ngos").countDocuments({ kycStatus: "pending" }),
      db.collection("deliveryPartners").countDocuments(),
      db.collection("user").countDocuments(),
    ]);

    // 2. Surplus & impact metrics
    const listings = await db.collection("surplusListings").find({}).toArray();

    let totalListedKg = 0;
    let totalRedistributedKg = 0;

    for (const l of listings) {
      const qty = Number(l.quantity) || 0;
      if (l.safetyStatus === "verified_safe") {
        totalListedKg += qty;
      }
      if (l.status === "delivered") {
        totalRedistributedKg += qty;
      }
    }

    // Official Sustainability Impact Calculation (Functional PRD Section 12.7 & 22)
    const impact = calculateSustainabilityImpact(totalRedistributedKg);

    // 3. Audit logs count & recent activity
    const [auditLogCount, recentLogs] = await Promise.all([
      db.collection("auditLogs").countDocuments(),
      db.collection("auditLogs").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        institutionCount,
        ngoCount,
        pendingKycCount,
        deliveryPartnerCount,
        totalUsersCount,
        totalListedKg,
        totalRedistributedKg: impact.wastePreventedKg,
        mealsGiven: impact.mealsGiven,
        co2eAvoidedKg: impact.co2eAvoidedKg,
        methaneAvoidedKg: impact.methaneAvoidedKg,
        waterPreservedLiters: impact.waterPreservedLiters,
        costSavedInr: impact.costSavedInr,
        auditLogCount,
      },
      recentLogs,
    });
  } catch (error: unknown) {
    console.error("Error loading admin overview metrics:", error);
    return NextResponse.json(
      { error: "Failed to load platform analytics." },
      { status: 500 }
    );
  }
}
