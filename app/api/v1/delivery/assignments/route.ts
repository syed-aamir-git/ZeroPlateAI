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

    const partner = await db.collection("deliveryPartners").findOne({ userId: userObjectId as any });
    if (!partner) {
      return NextResponse.json(
        { error: "Delivery partner profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // Auto-sync & Hygiene: Only listings that have been CLAIMED / ACCEPTED by an NGO can have delivery assignments!
    // Clean up any legacy assignments that were created for unaccepted/pending listings
    const now = new Date();
    await db.collection("deliveryAssignments").deleteMany({
      status: "assigned",
      assignedToDeliveryPartnerId: null,
      $or: [
        { claimedByNgoId: null },
        { claimedByNgoId: { $exists: false } },
      ],
    });

    // Auto-sync: Ensure any active surplus listing CLAIMED by an NGO has a delivery assignment
    const activeClaimedListings = await db.collection("surplusListings").find({
      safetyStatus: "verified_safe",
      status: "claimed",
      claimedByNgoId: { $ne: null, $exists: true },
      "pickupWindow.end": { $gt: now },
      itemName: { $not: /raj\s*bhai|aadi\s*bhai|^aamir$/i },
    }).toArray();

    if (activeClaimedListings.length > 0) {
      const listingIds = activeClaimedListings.map((l) => l._id);
      const existingAssignments = await db.collection("deliveryAssignments").find(
        {
          $or: [
            { surplusListingId: { $in: listingIds } },
            { listingId: { $in: listingIds } },
          ],
        },
        { projection: { surplusListingId: 1, listingId: 1 } }
      ).toArray();

      const existingSet = new Set(
        existingAssignments.map((a) => String(a.surplusListingId || a.listingId))
      );

      const missingListings = activeClaimedListings.filter(
        (l) => !existingSet.has(String(l._id))
      );

      if (missingListings.length > 0) {
        const newDocs = missingListings.map((l) => ({
          surplusListingId: l._id,
          institutionId: l.institutionId,
          claimedByNgoId: l.claimedByNgoId,
          assignedToDeliveryPartnerId: null,
          status: "assigned",
          createdAt: l.createdAt || now,
          updatedAt: now,
        }));

        await db.collection("deliveryAssignments").insertMany(newDocs);
      }
    }

    // 1. Check if THIS delivery partner currently has an ACTIVE mission in progress:
    // "accepted" = accepted order, heading to kitchen
    // "picked_up" = food collected, en route to NGO
    // "delivered" = dropped off at NGO, awaiting NGO receipt confirmation
    const activeOwnMission = await db.collection("deliveryAssignments").findOne({
      assignedToDeliveryPartnerId: partner._id,
      status: { $in: ["accepted", "picked_up", "delivered"] },
    });

    let matchQuery: Record<string, any>;

    if (activeOwnMission) {
      // THE DELIVERY PARTNER HAS ACCEPTED AN ORDER:
      // Show ONLY that order details and DON'T show other orders!
      matchQuery = {
        _id: activeOwnMission._id,
      };
    } else {
      // THE DELIVERY PARTNER IS FREE (no active delivery in progress):
      // Show ALL orders accepted by an NGO that are open for delivery partners to accept.
      // EXCLUDE orders that are already accepted by another delivery partner!
      matchQuery = {
        status: "assigned",
        $or: [
          { assignedToDeliveryPartnerId: null },
          { assignedToDeliveryPartnerId: { $exists: false } },
        ],
        claimedByNgoId: { $ne: null, $exists: true },
      };
    }

    const pipeline = [
      { $match: matchQuery },
      { $sort: { createdAt: -1 as const } },
      { $limit: 100 },
      {
        $lookup: {
          from: "surplusListings",
          let: { sId: "$surplusListingId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $or: [
                        { $eq: ["$_id", "$$sId"] },
                        { $eq: [{ $toString: "$_id" }, { $toString: "$$sId" }] },
                      ],
                    },
                    // Under no circumstances show pending/unclaimed listings to delivery portal!
                    { $in: ["$status", ["claimed", "delivered"]] },
                    { $ne: ["$claimedByNgoId", null] },
                  ],
                },
              },
            },
          ],
          as: "listing",
        },
      },
      { $unwind: { path: "$listing", preserveNullAndEmptyArrays: false } },
      {
        $lookup: {
          from: "institutions",
          let: { instId: { $ifNull: ["$listing.institutionId", "$institutionId"] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$instId"] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$instId" }] },
                  ],
                },
              },
            },
          ],
          as: "institution",
        },
      },
      { $unwind: { path: "$institution", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "ngos",
          let: { ngoId: { $ifNull: ["$claimedByNgoId", "$listing.claimedByNgoId"] } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$ngoId"] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$ngoId" }] },
                  ],
                },
              },
            },
          ],
          as: "ngo",
        },
      },
      { $unwind: { path: "$ngo", preserveNullAndEmptyArrays: true } },
    ];

    const results = await db.collection("deliveryAssignments").aggregate(pipeline).toArray();

    const enriched = results.map((a: any) => {
      const listing = a.listing;
      const institution = a.institution;
      const ngo = a.ngo;

      return {
        _id: a._id,
        surplusListingId: a.surplusListingId || a.listingId,
        status: a.status,
        createdAt: a.createdAt,
        acceptedAt: a.acceptedAt,
        pickedUpAt: a.pickedUpAt,
        deliveredAt: a.deliveredAt,
        confirmedAt: a.confirmedAt,
        isAssignedToMe: String(a.assignedToDeliveryPartnerId) === String(partner._id),
        isOpenBroadcast: !a.assignedToDeliveryPartnerId && a.status === "assigned",
        item: {
          name: listing?.itemName || "Surplus Batch",
          category: listing?.category || "cooked_food",
          quantity: listing?.quantity || 0,
          unit: listing?.unit || "kg",
          pickupWindow: listing?.pickupWindow || null,
        },
        pickup: {
          name: listing?.institutionName || institution?.name || "Donor Kitchen",
          address: listing?.pickupLocation?.address || institution?.address || "Main Dispatch Bay",
          lat: listing?.pickupLocation?.lat || institution?.location?.lat,
          lng: listing?.pickupLocation?.lng || institution?.location?.lng,
        },
        drop: {
          name: ngo?.orgName || listing?.claimedByNgoName || "Verified NGO Recipient",
          address: ngo?.serviceArea || "Recipient Center",
          contactPhone: ngo?.contactPhone || "",
          lat: ngo?.location?.lat,
          lng: ngo?.location?.lng,
        },
        currentLocation: a.currentLocation || partner.currentLocation || null,
      };
    });

    return NextResponse.json({
      success: true,
      partner: {
        _id: partner._id,
        name: session.user.name,
        phone: partner.phone,
        vehicleType: partner.vehicleType,
        vehicleNumber: partner.vehicleNumber || "",
        serviceArea: partner.serviceArea,
        active: partner.active,
      },
      assignments: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching delivery assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery assignments." },
      { status: 500 }
    );
  }
}
