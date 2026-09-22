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
    const role = (session.user as { role?: string }).role;

    const institution = await db
      .collection("institutions")
      .findOne({ userId: userObjectId as any });

    if (!institution && role !== "platform_admin") {
      return NextResponse.json(
        { error: "Institution profile not found." },
        { status: 404 }
      );
    }

    const institutionId = institution ? institution._id : null;

    // Single-roundtrip aggregation pipeline with $lookup
    const matchStage = institutionId ? { institutionId } : {};

    const pipeline = [
      { $match: matchStage },
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
      {
        $lookup: {
          from: "deliveryPartners",
          let: { dpId: "$assignedToDeliveryPartnerId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$dpId"] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$dpId" }] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: "user",
                let: { uId: "$userId" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$_id", "$$uId"] },
                          { $eq: [{ $toString: "$_id" }, { $toString: "$$uId" }] },
                        ],
                      },
                    },
                  },
                ],
                as: "user",
              },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
          ],
          as: "courier",
        },
      },
      {
        $lookup: {
          from: "ngos",
          let: { nId: "$claimedByNgoId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", "$$nId"] },
                    { $eq: [{ $toString: "$_id" }, { $toString: "$$nId" }] },
                  ],
                },
              },
            },
          ],
          as: "ngo",
        },
      },
      { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$courier", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$ngo", preserveNullAndEmptyArrays: true } },
    ];

    const results = await db.collection("deliveryAssignments").aggregate(pipeline).toArray();

    const enriched = results.map((a: any) => {
      const listing = a.listing;
      const driver = a.courier;
      const driverUser = driver?.user;
      const ngo = a.ngo;

      return {
        _id: a._id,
        status: a.status,
        createdAt: a.createdAt,
        acceptedAt: a.acceptedAt,
        pickedUpAt: a.pickedUpAt,
        deliveredAt: a.deliveredAt,
        confirmedAt: a.confirmedAt,
        item: {
          name: listing?.itemName || "Surplus Batch",
          category: listing?.category || "cooked_food",
          quantity: listing?.quantity || 0,
          unit: listing?.unit || "kg",
        },
        pickup: {
          name: institution?.name || listing?.institutionName || "Donor Kitchen",
          address: listing?.pickupLocation?.address || institution?.address || "Main Dispatch Bay",
          lat: listing?.pickupLocation?.lat || institution?.location?.lat,
          lng: listing?.pickupLocation?.lng || institution?.location?.lng,
        },
        drop: {
          name: ngo?.orgName || listing?.claimedByNgoName || "Verified NGO Recipient",
          address: ngo?.location?.address || ngo?.serviceArea || "Recipient Center",
          contactPhone: ngo?.contactPhone || "",
          lat: ngo?.location?.lat,
          lng: ngo?.location?.lng,
        },
        recipient: {
          name: ngo?.orgName || listing?.claimedByNgoName || "Verified NGO Recipient",
          serviceArea: ngo?.serviceArea || "Recipient Center",
          contactPhone: ngo?.contactPhone || "",
        },
        courier: driver
          ? {
              name: driverUser?.name || "Delivery Partner",
              vehicleType: driver.vehicleType,
              phone: driver.phone,
              serviceArea: driver.serviceArea,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      deliveries: enriched,
      count: enriched.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching institution deliveries:", error);
    return NextResponse.json(
      { error: "Failed to fetch deliveries." },
      { status: 500 }
    );
  }
}
