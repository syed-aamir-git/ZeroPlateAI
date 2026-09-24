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

    // Auto-sync: Ensure any active surplus listing (verified_safe, pending/matched/claimed) has an open delivery assignment
    const now = new Date();
    const activeListings = await db.collection("surplusListings").find({
      safetyStatus: "verified_safe",
      status: { $in: ["matched", "pending", "claimed"] },
      "pickupWindow.end": { $gt: now },
    }).toArray();

    if (activeListings.length > 0) {
      const listingIds = activeListings.map((l) => l._id);
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

      const missingListings = activeListings.filter(
        (l) => !existingSet.has(String(l._id))
      );

      if (missingListings.length > 0) {
        const missingIds = missingListings.map((l) => l._id);
        const matches = await db
          .collection("matches")
          .find({ surplusListingId: { $in: missingIds } })
          .toArray();
        const matchMap = new Map(matches.map((m) => [String(m.surplusListingId), m]));

        const newDocs = missingListings.map((l) => {
          const topMatch = matchMap.get(String(l._id));
          return {
            surplusListingId: l._id,
            institutionId: l.institutionId,
            claimedByNgoId: l.claimedByNgoId || (topMatch ? topMatch.ngoId : null),
            assignedToDeliveryPartnerId: null,
            status: "assigned",
            createdAt: l.createdAt || now,
            updatedAt: now,
          };
        });

        await db.collection("deliveryAssignments").insertMany(newDocs);
      }
    }

    // Find active assignments:
    // 1. Broadcast assignments open to all registered delivery partners (unassigned)
    // 2. Active assignments claimed/assigned to this partner (assigned, accepted, picked_up)
    const matchQuery = {
      $or: [
        { assignedToDeliveryPartnerId: partner._id, status: { $in: ["assigned", "accepted", "picked_up"] } },
        { status: "assigned", assignedToDeliveryPartnerId: null },
        { status: "assigned", assignedToDeliveryPartnerId: { $in: [null, undefined] } },
        { status: "assigned", assignedToDeliveryPartnerId: { $exists: false } },
        { status: "pending_acceptance" },
      ],
    };

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
                  $or: [
                    { $eq: ["$_id", "$$sId"] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$sId" }] },
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
