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

    // Query assignments for this institution
    const query = institutionId ? { institutionId } : {};
    const assignments = await db
      .collection("deliveryAssignments")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({
        success: true,
        deliveries: [],
        count: 0,
      });
    }

    // Enrich with listing, driver, and NGO details
    const listingIds = assignments.map((a) => a.surplusListingId).filter(Boolean);
    const driverIds = assignments.map((a) => a.assignedToDeliveryPartnerId).filter(Boolean);
    const ngoIds = assignments.map((a) => a.claimedByNgoId).filter(Boolean);

    const toIdFilter = (ids: any[]) => {
      const list: any[] = [];
      ids.forEach((id) => {
        if (!id) return;
        list.push(id);
        if (typeof id === "string" && ObjectId.isValid(id)) {
          try {
            list.push(new ObjectId(id));
          } catch {}
        } else if (id instanceof ObjectId) {
          list.push(id.toString());
        }
      });
      return list;
    };

    const [listings, drivers, ngos] = await Promise.all([
      listingIds.length > 0
        ? db.collection("surplusListings").find({ _id: { $in: toIdFilter(listingIds) } }).toArray()
        : [],
      driverIds.length > 0
        ? db.collection("deliveryPartners").find({ _id: { $in: toIdFilter(driverIds) } }).toArray()
        : [],
      ngoIds.length > 0
        ? db.collection("ngos").find({ _id: { $in: toIdFilter(ngoIds) } }).toArray()
        : [],
    ]);

    const driverUserIds = drivers.map((d) => d.userId).filter(Boolean);
    const driverUsers = driverUserIds.length > 0
      ? await db.collection("user").find({ _id: { $in: toIdFilter(driverUserIds) } }).toArray()
      : [];
    const driverUserMap = new Map(driverUsers.map((u) => [String(u._id), u]));

    const listingMap = new Map(listings.map((l) => [String(l._id), l]));
    const driverMap = new Map(drivers.map((d) => [String(d._id), d]));
    const ngoMap = new Map(ngos.map((n) => [String(n._id), n]));

    const enriched = assignments.map((a) => {
      const listing = listingMap.get(String(a.surplusListingId));
      const driver = a.assignedToDeliveryPartnerId ? driverMap.get(String(a.assignedToDeliveryPartnerId)) : null;
      const driverUser = driver?.userId ? driverUserMap.get(String(driver.userId)) : null;
      const ngo = ngoMap.get(String(a.claimedByNgoId));

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
