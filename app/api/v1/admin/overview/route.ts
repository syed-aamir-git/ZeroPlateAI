import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { calculateSustainabilityImpact } from "@/lib/sustainability";

export async function GET() {
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

    // 1. Entities counts
    const [
      institutionCount,
      ngoCount,
      pendingKycCount,
      deliveryPartnerCount,
      totalUsersCount,
    ] = await Promise.all([
      db.collection("institutions").countDocuments(),
      db.collection("ngos").countDocuments(),
      db.collection("ngos").countDocuments({ kycStatus: "pending" }),
      db.collection("deliveryPartners").countDocuments(),
      db.collection("user").countDocuments(),
    ]);

    // 2. Surplus & impact metrics
    const listings = await db.collection("surplusListings").find({}).toArray();

    let totalListedKg = 0;
    let totalRedistributedKg = 0;
    const redistributedByUnit = {
      kg: 0,
      pieces: 0,
      litres: 0,
    };

    for (const l of listings) {
      const qty = Number(l.quantity) || 0;
      const rawUnit = (l.unit || "kg").toLowerCase().trim();
      if (l.safetyStatus === "verified_safe") {
        totalListedKg += qty;
      }
      if (l.status === "delivered") {
        totalRedistributedKg += qty;
        if (rawUnit === "kg" || rawUnit === "kgs" || rawUnit === "kilogram" || rawUnit === "kilograms") {
          redistributedByUnit.kg += qty;
        } else if (rawUnit === "l" || rawUnit === "liter" || rawUnit === "litres" || rawUnit === "liters" || rawUnit === "litre") {
          redistributedByUnit.litres += qty;
        } else if (rawUnit === "pcs" || rawUnit === "pc" || rawUnit === "piece" || rawUnit === "pieces" || rawUnit === "portions" || rawUnit === "portion") {
          redistributedByUnit.pieces += qty;
        } else {
          redistributedByUnit.kg += qty;
        }
      }
    }

    // Official Sustainability Impact Calculation (Functional PRD Section 12.7 & 22)
    const impact = calculateSustainabilityImpact(totalRedistributedKg);

    // 3. Audit logs count & recent activity
    const [auditLogCount, recentLogs] = await Promise.all([
      db.collection("auditLogs").countDocuments(),
      db.collection("auditLogs").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);

    // 4. Live Delivery Dispatches
    const dispatches = await db
      .collection("deliveryAssignments")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const dispatchListingIds = dispatches.map((d) => d.surplusListingId).filter(Boolean);
    const dispatchDriverIds = dispatches.map((d) => d.assignedToDeliveryPartnerId).filter(Boolean);
    const dispatchNgoIds = dispatches.map((d) => d.claimedByNgoId).filter(Boolean);
    const dispatchInstIds = dispatches.map((d) => d.institutionId).filter(Boolean);

    const [dListings, dDrivers, dNgos, dInsts] = await Promise.all([
      db.collection("surplusListings").find({ _id: { $in: dispatchListingIds } }).toArray(),
      db.collection("deliveryPartners").find({ _id: { $in: dispatchDriverIds } }).toArray(),
      db.collection("ngos").find({ _id: { $in: dispatchNgoIds } }).toArray(),
      db.collection("institutions").find({ _id: { $in: dispatchInstIds } }).toArray(),
    ]);

    const dDriverUserIds = dDrivers.map((d) => d.userId).filter(Boolean);
    const dDriverUsers = await db.collection("user").find({ _id: { $in: dDriverUserIds } }).toArray();
    const dDriverUserMap = new Map(dDriverUsers.map((u) => [String(u._id), u]));

    const dListingMap = new Map(dListings.map((l) => [String(l._id), l]));
    const dDriverMap = new Map(dDrivers.map((d) => [String(d._id), d]));
    const dNgoMap = new Map(dNgos.map((n) => [String(n._id), n]));
    const dInstMap = new Map(dInsts.map((i) => [String(i._id), i]));

    const [facilitiesInstitutions, facilitiesNgos] = await Promise.all([
      db.collection("institutions").find({}).limit(20).toArray(),
      db.collection("ngos").find({ kycStatus: "approved" }).limit(20).toArray(),
    ]);

    const facilities = [
      ...facilitiesInstitutions.map((i) => ({
        _id: String(i._id),
        name: i.name,
        type: "kitchen" as const,
        address: i.address,
        location: i.location,
      })),
      ...facilitiesNgos.map((n) => ({
        _id: String(n._id),
        name: n.orgName,
        type: "ngo" as const,
        address: n.location?.address || n.serviceArea,
        location: n.location,
      })),
    ];

    const enrichedDispatches = dispatches.map((d) => {
      const listing = dListingMap.get(String(d.surplusListingId));
      const driver = d.assignedToDeliveryPartnerId ? dDriverMap.get(String(d.assignedToDeliveryPartnerId)) : null;
      const driverUser = driver?.userId ? dDriverUserMap.get(String(driver.userId)) : null;
      const ngo = dNgoMap.get(String(d.claimedByNgoId));
      const inst = dInstMap.get(String(d.institutionId));

      return {
        _id: d._id,
        status: d.status,
        createdAt: d.createdAt,
        acceptedAt: d.acceptedAt,
        pickedUpAt: d.pickedUpAt,
        deliveredAt: d.deliveredAt,
        itemName: listing?.itemName || "Surplus Batch",
        quantity: listing?.quantity || 0,
        unit: listing?.unit || "kg",
        institutionName: inst?.name || listing?.institutionName || "Donor Kitchen",
        ngoName: ngo?.orgName || "Verified NGO",
        pickupLocation: listing?.pickupLocation || inst?.location || { address: "Donor Kitchen", lat: 28.6139, lng: 77.209 },
        dropLocation: ngo?.location || { address: ngo?.serviceArea || "Recipient Center", lat: 28.58, lng: 77.24 },
        courier: driver
          ? {
              name: driverUser?.name || "Delivery Partner",
              phone: driver.phone,
              vehicleType: driver.vehicleType,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      metrics: {
        institutionCount,
        ngoCount,
        pendingKycCount,
        deliveryPartnerCount,
        totalUsersCount,
        totalListedKg,
        totalRedistributedKg: impact.wastePreventedKg,
        redistributedByUnit,
        mealsGiven: impact.mealsGiven,
        co2eAvoidedKg: impact.co2eAvoidedKg,
        methaneAvoidedKg: impact.methaneAvoidedKg,
        waterPreservedLiters: impact.waterPreservedLiters,
        costSavedInr: impact.costSavedInr,
        auditLogCount,
      },
      recentLogs,
      dispatches: enrichedDispatches,
      facilities,
    });
  } catch (error: unknown) {
    console.error("Error loading admin overview metrics:", error);
    return NextResponse.json(
      { error: "Failed to load platform analytics." },
      { status: 500 }
    );
  }
}
