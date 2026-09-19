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
    const redistributedByUnit = {
      kg: 0,
      pieces: 0,
      litres: 0,
    };
    const categoryTotals: Record<string, number> = {};
    const categoryBreakdown: Record<
      string,
      {
        kg: number;
        pieces: number;
        litres: number;
        totalCount: number;
        estimatedMeals: number;
      }
    > = {};

    for (const item of confirmedListings) {
      const qty = Number(item.quantity) || 0;
      totalRedistributedKg += qty;
      const rawUnit = (item.unit || "kg").toLowerCase().trim();
      let normalizedUnit: "kg" | "litres" | "pieces" = "kg";

      if (rawUnit === "kg" || rawUnit === "kgs" || rawUnit === "kilogram" || rawUnit === "kilograms") {
        redistributedByUnit.kg += qty;
        normalizedUnit = "kg";
      } else if (rawUnit === "l" || rawUnit === "liter" || rawUnit === "litres" || rawUnit === "liters" || rawUnit === "litre") {
        redistributedByUnit.litres += qty;
        normalizedUnit = "litres";
      } else if (rawUnit === "pcs" || rawUnit === "pc" || rawUnit === "piece" || rawUnit === "pieces" || rawUnit === "portions" || rawUnit === "portion") {
        redistributedByUnit.pieces += qty;
        normalizedUnit = "pieces";
      } else {
        redistributedByUnit.kg += qty;
        normalizedUnit = "kg";
      }

      const cat = item.category || "uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + qty;

      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = {
          kg: 0,
          pieces: 0,
          litres: 0,
          totalCount: 0,
          estimatedMeals: 0,
        };
      }
      categoryBreakdown[cat][normalizedUnit] += qty;
      categoryBreakdown[cat].totalCount += qty;
      categoryBreakdown[cat].estimatedMeals += Math.round(qty * 2.5);
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
        redistributedByUnit,
        mealsProvided,
        co2eAvoidedKg,
        totalClaimsCount: allClaims.length,
        confirmedClaimsCount: confirmedListings.length,
        inProgressCount,
        hasData: confirmedListings.length > 0,
      },
      categoryTotals,
      categoryBreakdown,
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
