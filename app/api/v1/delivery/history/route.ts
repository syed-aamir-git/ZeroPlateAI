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
        { error: "Delivery partner profile not found." },
        { status: 404 }
      );
    }

    const query = {
      assignedToDeliveryPartnerId: partner._id,
      status: { $in: ["delivered", "confirmed"] },
    };

    const completed = await db
      .collection("deliveryAssignments")
      .find(query)
      .sort({ confirmedAt: -1, deliveredAt: -1, createdAt: -1 })
      .toArray();

    const listingIds = completed.map((a) => a.surplusListingId).filter(Boolean);
    const ngoIds = completed.map((a) => a.claimedByNgoId).filter(Boolean);

    const [listings, ngos] = await Promise.all([
      listingIds.length > 0
        ? db.collection("surplusListings").find({ _id: { $in: listingIds } }).toArray()
        : [],
      ngoIds.length > 0
        ? db.collection("ngos").find({ _id: { $in: ngoIds } }).toArray()
        : [],
    ]);

    const listingMap = new Map(listings.map((l) => [String(l._id), l]));
    const ngoMap = new Map(ngos.map((n) => [String(n._id), n]));

    const enriched = completed.map((a) => {
      const listing = listingMap.get(String(a.surplusListingId));
      const ngo = ngoMap.get(String(a.claimedByNgoId));

      return {
        _id: a._id,
        status: a.status,
        deliveredAt: a.deliveredAt,
        confirmedAt: a.confirmedAt,
        createdAt: a.createdAt,
        itemName: listing?.itemName || "Surplus Batch",
        category: listing?.category || "cooked_food",
        quantity: listing?.quantity || 0,
        unit: listing?.unit || "kg",
        donorName: listing?.institutionName || "Donor Kitchen",
        pickupAddress: listing?.pickupLocation?.address || "Dispatch Gate",
        recipientName: ngo?.orgName || "Verified NGO",
        dropAddress: ngo?.serviceArea || "Recipient Center",
        pickupLocation: listing?.pickupLocation || { address: "Dispatch Gate", lat: 28.6139, lng: 77.209 },
        dropLocation: ngo?.location || { address: ngo?.serviceArea || "Recipient Center", lat: 28.58, lng: 77.24 },
      };
    });

    return NextResponse.json({
      success: true,
      deliveries: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching delivery history:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery history." },
      { status: 500 }
    );
  }
}
