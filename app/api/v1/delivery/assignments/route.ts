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

    // Find active assignments:
    // 1. Broadcast assignments open to all registered delivery partners (unassigned)
    // 2. Active assignments claimed/assigned to this partner
    const query = {
      $or: [
        { assignedToDeliveryPartnerId: partner._id, status: { $in: ["assigned", "accepted", "picked_up", "delivered"] } },
        { status: "assigned", assignedToDeliveryPartnerId: null },
        { status: "assigned", assignedToDeliveryPartnerId: { $in: [null, undefined] } },
        { status: "assigned", assignedToDeliveryPartnerId: { $exists: false } },
      ],
    };

    const assignments = await db
      .collection("deliveryAssignments")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich assignments with listing, institution, and NGO details
    const listingIds = assignments.map((a) => a.surplusListingId).filter(Boolean);
    const listings = await db
      .collection("surplusListings")
      .find({ _id: { $in: listingIds } })
      .toArray();

    const listingMap = new Map();
    const institutionIds: ObjectId[] = [];
    const ngoIds: ObjectId[] = [];

    for (const l of listings) {
      listingMap.set(String(l._id), l);
      if (l.institutionId) institutionIds.push(l.institutionId);
      if (l.claimedByNgoId) ngoIds.push(l.claimedByNgoId);
    }

    for (const a of assignments) {
      if (a.claimedByNgoId) ngoIds.push(a.claimedByNgoId);
    }

    const institutions = await db
      .collection("institutions")
      .find({ _id: { $in: institutionIds } })
      .toArray();

    const ngos = await db
      .collection("ngos")
      .find({ _id: { $in: ngoIds } })
      .toArray();

    const instMap = new Map(institutions.map((i) => [String(i._id), i]));
    const ngoMap = new Map(ngos.map((n) => [String(n._id), n]));

    const enriched = assignments.map((a) => {
      const listing = listingMap.get(String(a.surplusListingId));
      const institution = listing ? instMap.get(String(listing.institutionId)) : null;
      const ngo = ngoMap.get(String(a.claimedByNgoId || listing?.claimedByNgoId));

      return {
        _id: a._id,
        surplusListingId: a.surplusListingId,
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
          name: ngo?.orgName || "Verified NGO Recipient",
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
        phone: partner.phone,
        vehicleType: partner.vehicleType,
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
