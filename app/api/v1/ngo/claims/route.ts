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

    // Find all listings claimed by this NGO
    const claimedListings = await db
      .collection("surplusListings")
      .find({ claimedByNgoId: ngo._id })
      .sort({ claimedAt: -1, createdAt: -1 })
      .toArray();

    // Attach delivery assignment state to each listing
    const listingIds = claimedListings.map((l) => l._id);
    const assignments = await db
      .collection("deliveryAssignments")
      .find({ surplusListingId: { $in: listingIds } })
      .toArray();

    const assignmentMap = new Map();
    for (const a of assignments) {
      assignmentMap.set(String(a.surplusListingId), a);
    }

    const enrichedClaims = claimedListings.map((listing) => {
      const assignment = assignmentMap.get(String(listing._id));
      return {
        ...listing,
        deliveryAssignment: assignment || null,
        deliveryStatus: assignment?.status || "assigned",
        isConfirmed: assignment?.status === "confirmed",
        confirmedAt: assignment?.confirmedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      claims: enrichedClaims,
      count: enrichedClaims.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching NGO claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims list." },
      { status: 500 }
    );
  }
}
