import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const ngo = await db.collection("ngos").findOne({ userId: userObjectId as any });
    if (!ngo) {
      return NextResponse.json(
        { error: "NGO profile not found." },
        { status: 404 }
      );
    }

    // Retrieve all claims made by this NGO
    const allClaims = await db
      .collection("surplusListings")
      .find({ claimedByNgoId: ngo._id })
      .toArray();

    const claimIds = allClaims.map((c) => c._id);
    const confirmedAssignments = await db
      .collection("deliveryAssignments")
      .find({
        surplusListingId: { $in: claimIds },
        status: "confirmed",
      })
      .toArray();

    const confirmedListingIds = new Set(
      confirmedAssignments.map((a) => String(a.surplusListingId))
    );

    // Only count listings that are confirmed or status === 'delivered' toward real impact
    const confirmedListings = allClaims.filter(
      (c) => confirmedListingIds.has(String(c._id)) || c.status === "delivered"
    );

    let totalRedistributedKg = 0;
    const categoryTotals: Record<string, number> = {};

    for (const item of confirmedListings) {
      const qty = Number(item.quantity) || 0;
      totalRedistributedKg += qty;
      const cat = item.category || "uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + qty;
    }

    // Impact conversion standards:
    // 1 kg food waste prevented = 2.5 average meals
    // 1 kg food waste diverted from landfill = 1.9 kg CO2e avoided (FAO / standard reference)
    const mealsProvided = Math.round(totalRedistributedKg * 2.5);
    const co2eAvoidedKg = Number((totalRedistributedKg * 1.9).toFixed(1));

    const inProgressCount = allClaims.filter(
      (c) => c.status === "claimed" && !confirmedListingIds.has(String(c._id))
    ).length;

    const recentHandoffs = confirmedListings.slice(0, 10).map((c) => ({
      _id: c._id,
      itemName: c.itemName,
      category: c.category,
      quantity: c.quantity,
      unit: c.unit,
      institutionName: c.institutionName || "Partner Kitchen",
      claimedAt: c.claimedAt,
      deliveredAt: c.deliveredAt || c.updatedAt || c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      ngo: {
        _id: ngo._id,
        orgName: ngo.orgName,
        kycStatus: ngo.kycStatus || "pending",
        capacityPerWeek: ngo.capacityPerWeek,
      },
      impact: {
        totalRedistributedKg,
        mealsProvided,
        co2eAvoidedKg,
        totalClaimsCount: allClaims.length,
        confirmedClaimsCount: confirmedListings.length,
        inProgressCount,
        hasData: confirmedListings.length > 0,
      },
      categoryTotals,
      recentHandoffs,
    });
  } catch (error: unknown) {
    console.error("Error computing NGO impact stats:", error);
    return NextResponse.json(
      { error: "Failed to compute redistribution impact metrics." },
      { status: 500 }
    );
  }
}
