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
        { error: "NGO profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Live claimable listings: verified safe, active window, pending or matched
    const now = new Date();
    const query = {
      safetyStatus: "verified_safe",
      status: { $in: ["pending", "matched"] },
      "pickupWindow.end": { $gt: now },
    };

    const listings = await db
      .collection("surplusListings")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      ngo: {
        _id: ngo._id,
        orgName: ngo.orgName,
        kycStatus: ngo.kycStatus || "pending",
        capacityPerWeek: ngo.capacityPerWeek,
      },
      listings,
      count: listings.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching available surplus listings for NGO:", error);
    return NextResponse.json(
      { error: "Failed to fetch available surplus listings." },
      { status: 500 }
    );
  }
}
