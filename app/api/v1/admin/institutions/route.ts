import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const institutions = await db
      .collection("institutions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Attach count of inventory items and surplus listings per institution
    const institutionIds = institutions.map((i) => i._id);

    const [inventoryCounts, listingCounts] = await Promise.all([
      db.collection("inventoryItems").aggregate([
        { $match: { institutionId: { $in: institutionIds } } },
        { $group: { _id: "$institutionId", count: { $sum: 1 } } },
      ]).toArray(),
      db.collection("surplusListings").aggregate([
        { $match: { institutionId: { $in: institutionIds } } },
        { $group: { _id: "$institutionId", count: { $sum: 1 }, totalKg: { $sum: "$quantity" } } },
      ]).toArray(),
    ]);

    const invMap = new Map(inventoryCounts.map((c) => [String(c._id), c.count]));
    const listMap = new Map(listingCounts.map((c) => [String(c._id), { count: c.count, totalKg: c.totalKg }]));

    const enriched = institutions.map((inst) => {
      const listingStats = listMap.get(String(inst._id)) || { count: 0, totalKg: 0 };
      return {
        ...inst,
        inventoryCount: invMap.get(String(inst._id)) || 0,
        listingsCount: listingStats.count,
        totalSurplusKg: listingStats.totalKg,
      };
    });

    return NextResponse.json({
      success: true,
      institutions: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching institutions for admin:", error);
    return NextResponse.json(
      { error: "Failed to load institutions." },
      { status: 500 }
    );
  }
}
