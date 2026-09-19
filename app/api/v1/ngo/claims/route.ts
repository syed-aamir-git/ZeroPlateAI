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

    // 1. Find all delivery assignments claimed by or allocated to this NGO
    const assignments = await db
      .collection("deliveryAssignments")
      .find({
        $or: [
          { claimedByNgoId: ngo._id },
          { claimedByNgoId: String(ngo._id) },
        ],
      })
      .toArray();

    const assignmentListingIds = assignments
      .map((a) => a.surplusListingId || a.listingId)
      .filter(Boolean)
      .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));

    // 2. Find all listings claimed by this NGO OR linked to this NGO via assignments
    const claimedListings = await db
      .collection("surplusListings")
      .find({
        $or: [
          { claimedByNgoId: ngo._id },
          { claimedByNgoId: String(ngo._id) },
          { _id: { $in: assignmentListingIds } },
        ],
      })
      .sort({ claimedAt: -1, createdAt: -1 })
      .toArray();

    // Attach delivery assignment state to each listing
    const assignmentMap = new Map();
    for (const a of assignments) {
      assignmentMap.set(String(a.surplusListingId || a.listingId), a);
    }

    // Auto-backfill claimedByNgoId on any surplusListings if missing
    for (const listing of claimedListings) {
      if (!listing.claimedByNgoId) {
        await db.collection("surplusListings").updateOne(
          { _id: listing._id },
          {
            $set: {
              claimedByNgoId: ngo._id,
              claimedByNgoName: ngo.orgName,
              updatedAt: new Date(),
            },
          }
        );
        listing.claimedByNgoId = ngo._id;
        listing.claimedByNgoName = ngo.orgName;
      }
    }

    const enrichedClaims = claimedListings.map((listing) => {
      const assignment = assignmentMap.get(String(listing._id));
      return {
        ...listing,
        deliveryAssignment: assignment || null,
        deliveryStatus: assignment?.status || listing.status || "assigned",
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
