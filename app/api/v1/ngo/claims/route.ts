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
        $and: [
          {
            $or: [
              { claimedByNgoId: ngo._id },
              { claimedByNgoId: String(ngo._id) },
              { _id: { $in: assignmentListingIds } },
            ],
          },
          { itemName: { $not: /raj\s*bhai|aadi\s*bhai|^aamir$/i } },
        ],
      })
      .sort({ claimedAt: -1, createdAt: -1 })
      .toArray();

    // Attach delivery assignment state to each listing
    const assignmentMap = new Map();
    for (const a of assignments) {
      assignmentMap.set(String(a.surplusListingId || a.listingId), a);
    }

    // Collect assigned driver partners and their user accounts
    const partnerIds = assignments
      .map((a) => a.assignedToDeliveryPartnerId)
      .filter(Boolean)
      .map((id) => (ObjectId.isValid(id) ? new ObjectId(id) : id));

    const partners =
      partnerIds.length > 0
        ? await db
            .collection("deliveryPartners")
            .find({ _id: { $in: partnerIds } })
            .toArray()
        : [];

    const partnerMap = new Map(partners.map((p) => [String(p._id), p]));

    const userIds = partners
      .map((p) => p.userId)
      .filter(Boolean)
      .map((uid) => (ObjectId.isValid(uid) ? new ObjectId(uid) : uid));

    const users =
      userIds.length > 0
        ? await db
            .collection("user")
            .find({ _id: { $in: userIds } })
            .toArray()
        : [];

    const userMap = new Map(users.map((u) => [String(u._id), u]));

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
      const partner = assignment?.assignedToDeliveryPartnerId
        ? partnerMap.get(String(assignment.assignedToDeliveryPartnerId))
        : null;
      const driverUser = partner?.userId ? userMap.get(String(partner.userId)) : null;

      const courier = partner
        ? {
            name: driverUser?.name || "Assigned Driver",
            phone: partner.phone || "",
            vehicleType: partner.vehicleType || "two_wheeler",
            vehicleNumber: partner.vehicleNumber || "",
          }
        : null;

      return {
        ...listing,
        deliveryAssignment: assignment || null,
        deliveryAssignmentId: assignment?._id || null,
        deliveryStatus: assignment?.status || listing.status || "assigned",
        isConfirmed: assignment?.status === "confirmed",
        confirmedAt: assignment?.confirmedAt || null,
        courier,
        currentLocation: assignment?.currentLocation || partner?.currentLocation || null,
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
