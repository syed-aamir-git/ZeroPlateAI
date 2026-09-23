import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { calculateDistanceKm } from "@/lib/matching";
import { evaluateSurplusUrgency } from "@/lib/surplus-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get("listingId");

    if (!listingId || !ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: "Valid listingId is required" }, { status: 400 });
    }

    const db = await getDb();
    const listing = await db.collection("surplusListings").findOne({ _id: new ObjectId(listingId) });

    if (!listing) {
      return NextResponse.json({ error: "Surplus listing not found" }, { status: 404 });
    }

    // Evaluate listing urgency
    const urgency = evaluateSurplusUrgency({
      category: listing.category || "cooked_food",
      quantity: listing.quantity || 10,
      unit: listing.unit || "kg",
      expiryDeadline: listing.pickupWindow?.end || new Date(),
    });

    // Fetch all active verified NGOs
    const ngos = await db
      .collection("ngos")
      .find({ verificationStatus: { $in: ["verified", "approved"] } })
      .toArray();

    const donorLat = listing.pickupLocation?.lat ?? 28.6139;
    const donorLng = listing.pickupLocation?.lng ?? 77.209;

    // Calculate Compatibility Score M = w1*D + w2*Q + w3*T + w4*C
    const scoredNgos = ngos.map((ngo) => {
      const ngoLat = ngo.location?.lat ?? 28.6139;
      const ngoLng = ngo.location?.lng ?? 77.209;
      const distanceKm = calculateDistanceKm(donorLat, donorLng, ngoLat, ngoLng);

      // Distance score (w1 = 35%): 100 at 0km down to 0 at 35km
      const distanceScore = Math.max(0, Math.min(100, Math.round(100 - (distanceKm / 35) * 100)));

      // Quantity / Capacity match (w2 = 30%)
      const dailyCap = Math.max(10, (ngo.capacityPerWeek || 280) / 7);
      const neededQty = dailyCap;
      const ratio = Math.min(listing.quantity, neededQty) / Math.max(listing.quantity, neededQty);
      const capacityScore = Math.round(ratio * 100);

      // Urgency factor (w3 = 20%): If Red, heavily favor proximity under 8km
      let urgencyCompatibility = 70;
      if (urgency.urgencyTier === "critical_red") {
        urgencyCompatibility = distanceKm <= 8 ? 100 : Math.max(20, 100 - distanceKm * 8);
      }

      // Capability & Vehicle bonus (w4 = 15%)
      const hasVehicle = ngo.pickupCapability === true || Boolean(ngo.vehicleAvailability);
      const capabilityScore = hasVehicle ? 95 : 60;

      // Weighted Composite: 35% dist + 30% cap + 20% urg + 15% vehicle
      const totalScore = Math.round(
        distanceScore * 0.35 +
          capacityScore * 0.3 +
          urgencyCompatibility * 0.2 +
          capabilityScore * 0.15
      );

      return {
        ngoId: ngo._id,
        ngoName: ngo.organizationName || ngo.name || "Community Relief Foundation",
        address: ngo.location?.address || "Metropolitan Service Radius",
        distanceKm,
        dailyCapacityMeals: Math.round(dailyCap),
        hasOwnVehicle: hasVehicle,
        verificationStatus: ngo.verificationStatus,
        compatibilityScore: Math.min(99, Math.max(45, totalScore)),
        recommendedEtaMinutes: Math.round(15 + distanceKm * 3.5),
      };
    });

    // Sort by highest compatibility score
    scoredNgos.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return NextResponse.json({
      success: true,
      listing: {
        id: listing._id,
        itemName: listing.itemName,
        category: listing.category,
        quantity: listing.quantity,
        unit: listing.unit,
        urgencyTier: urgency.urgencyTier,
        urgencyLabel: urgency.tierLabel,
        estimatedMeals: urgency.estimatedMeals,
        pickupDeadline: listing.pickupWindow?.end,
      },
      candidates: scoredNgos.slice(0, 6),
    });
  } catch (error: any) {
    console.error("Matchmake evaluation error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate matchmaking" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, ngoId, notes } = body;

    if (!listingId || !ngoId || !ObjectId.isValid(listingId) || !ObjectId.isValid(ngoId)) {
      return NextResponse.json({ error: "listingId and ngoId are required" }, { status: 400 });
    }

    const db = await getDb();
    const listingObjectId = new ObjectId(listingId);
    const ngoObjectId = new ObjectId(ngoId);

    const listing = await db.collection("surplusListings").findOne({ _id: listingObjectId });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const ngo = await db.collection("ngos").findOne({ _id: ngoObjectId });
    if (!ngo) {
      return NextResponse.json({ error: "Recipient NGO not found" }, { status: 404 });
    }

    const urgency = evaluateSurplusUrgency({
      category: listing.category || "cooked_food",
      quantity: listing.quantity || 10,
      unit: listing.unit || "kg",
      expiryDeadline: listing.pickupWindow?.end || new Date(),
    });

    // 1. Create or update Match record
    const matchRecord = {
      surplusListingId: listingObjectId,
      ngoId: ngoObjectId,
      institutionId: listing.institutionId,
      status: "accepted",
      matchType: "manual_donor_assigned",
      urgencyTier: urgency.urgencyTier,
      isCriticalRed: urgency.urgencyTier === "critical_red",
      assignedByUserId: session.user.id,
      notes: notes || "Manually assigned by institution manager",
      matchedAt: new Date(),
      createdAt: new Date(),
    };

    const matchInsert = await db.collection("matches").insertOne(matchRecord);

    // 2. Update Surplus Listing status to matched
    await db.collection("surplusListings").updateOne(
      { _id: listingObjectId },
      {
        $set: {
          status: "matched",
          matchedNgoId: ngoObjectId,
          matchedAt: new Date(),
          urgencyTier: urgency.urgencyTier,
        },
      }
    );

    // 3. Create or update Delivery Assignment for couriers
    await db.collection("deliveryAssignments").insertOne({
      surplusListingId: listingObjectId,
      matchId: matchInsert.insertedId,
      institutionId: listing.institutionId,
      ngoId: ngoObjectId,
      status: "assigned",
      isCriticalPriority: urgency.urgencyTier === "critical_red",
      urgencyTier: urgency.urgencyTier,
      pickupLocation: listing.pickupLocation,
      dropoffLocation: ngo.location || { address: "Recipient Community Center", lat: 28.6139, lng: 77.209 },
      estimatedKg: listing.quantity,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully matched and assigned to ${ngo.organizationName || "the NGO"}!`,
      matchId: matchInsert.insertedId,
      isCriticalRed: urgency.urgencyTier === "critical_red",
    });
  } catch (error: any) {
    console.error("Matchmake assignment error:", error);
    return NextResponse.json({ error: error.message || "Failed to execute manual match" }, { status: 500 });
  }
}
