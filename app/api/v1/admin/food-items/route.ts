import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET(req: NextRequest) {
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

    // 1. Fetch all surplus listings
    const listings = await db
      .collection("surplusListings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // 2. Fetch associated institutions, delivery assignments, NGOs, and delivery partners
    const listingIds = listings.map((l) => l._id);
    const instIds = listings.map((l) => l.institutionId).filter(Boolean);

    const [allInsts, allDeliveries] = await Promise.all([
      db.collection("institutions").find({}).toArray(),
      db.collection("deliveryAssignments").find({}).toArray(),
    ]);

    const instMap = new Map(allInsts.map((i) => [String(i._id), i]));
    const delMap = new Map();
    allDeliveries.forEach((d) => {
      if (d.surplusListingId) {
        delMap.set(String(d.surplusListingId), d);
      }
    });

    const ngoIds = allDeliveries.map((d) => d.claimedByNgoId).filter(Boolean);
    const driverIds = allDeliveries.map((d) => d.assignedToDeliveryPartnerId).filter(Boolean);

    const [allNgos, allDrivers] = await Promise.all([
      db.collection("ngos").find({}).toArray(),
      db.collection("deliveryPartners").find({}).toArray(),
    ]);

    const ngoMap = new Map(allNgos.map((n) => [String(n._id), n]));
    const driverMap = new Map(allDrivers.map((d) => [String(d._id), d]));

    // 3. Enrich items
    const enrichedItems = listings.map((l) => {
      const delivery = delMap.get(String(l._id));
      const inst = instMap.get(String(l.institutionId));
      const ngo = delivery?.claimedByNgoId ? ngoMap.get(String(delivery.claimedByNgoId)) : null;
      const driver = delivery?.assignedToDeliveryPartnerId
        ? driverMap.get(String(delivery.assignedToDeliveryPartnerId))
        : null;

      // Determine effective delivery status
      let effectiveStatus = l.status || "available";
      if (delivery) {
        effectiveStatus = delivery.status || l.status;
      }

      return {
        _id: String(l._id),
        foodName: l.itemName || l.foodName || "Surplus Food Batch",
        category: l.category || "cooked_food",
        quantity: Number(l.quantity) || 0,
        unit: l.unit || "kg",
        institutionId: l.institutionId ? String(l.institutionId) : undefined,
        institutionName: inst?.name || l.institutionName || "Registered Kitchen",
        ngoName: ngo?.orgName || delivery?.ngoName || "Community Shelter",
        driver: driver
          ? {
              name: driver.name || "Assigned Driver",
              vehicleNumber: driver.vehicleNumber,
              vehicleType: driver.vehicleType,
              phone: driver.phone,
            }
          : undefined,
        status: effectiveStatus,
        safetyStatus: l.safetyStatus || "verified_safe",
        rejectionReason: l.rejectionReason,
        pickupAddress: l.pickupLocation?.address || inst?.address || "On-site dispatch",
        createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    // 4. Calculate Summary Metrics
    const totalItems = enrichedItems.length;
    const deliveredCount = enrichedItems.filter((i) => i.status === "delivered").length;
    const activeCount = enrichedItems.filter((i) => i.status !== "delivered" && i.status !== "expired").length;
    const totalQuantity = enrichedItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    return NextResponse.json({
      success: true,
      metrics: {
        totalItems,
        deliveredCount,
        activeCount,
        totalQuantity,
      },
      items: enrichedItems,
    });
  } catch (error: unknown) {
    console.error("Error fetching food items directory:", error);
    return NextResponse.json(
      { error: "Failed to retrieve food items directory." },
      { status: 500 }
    );
  }
}
