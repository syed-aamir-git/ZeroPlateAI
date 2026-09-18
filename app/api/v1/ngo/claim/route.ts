import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { assignNearestDeliveryPartner } from "@/lib/logistics";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const ngo = await db.collection("ngos").findOne({ userId: userObjectId as any });
    if (!ngo) {
      return NextResponse.json(
        { error: "NGO profile not found. Please complete onboarding first." },
        { status: 404 }
      );
    }

    // SERVER-SIDE KYC ENFORCEMENT (PRD Section 12.8 & Acceptance Criteria)
    // Even if attempted via direct API request, block unapproved NGOs
    if (ngo.kycStatus !== "approved") {
      return NextResponse.json(
        {
          error:
            "Your NGO account is currently in 'KYC Pending' status. Under Section 12.8 of the Food Safety Policy, surplus listings can only be claimed once your KYC registration is approved by a Platform Admin.",
          kycStatus: ngo.kycStatus || "pending",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { listingId } = body;

    if (!listingId || !ObjectId.isValid(listingId)) {
      return NextResponse.json(
        { error: "A valid listing ID must be provided." },
        { status: 400 }
      );
    }

    const listingObjectId = new ObjectId(listingId);
    const now = new Date();

    // ATOMIC RACE-CONDITION SAFE CLAIM (Functional PRD Section 12.4)
    // Uses findOneAndUpdate with status-check filter to ensure exactly one NGO can lock the claim
    const updatedListing = await db.collection("surplusListings").findOneAndUpdate(
      {
        _id: listingObjectId,
        status: { $in: ["pending", "matched"] },
        safetyStatus: "verified_safe",
        "pickupWindow.end": { $gt: now },
      },
      {
        $set: {
          status: "claimed",
          claimedByNgoId: ngo._id,
          claimedByNgoName: ngo.orgName,
          claimedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    // If update returned null, the listing was already claimed or expired
    if (!updatedListing) {
      return NextResponse.json(
        {
          error:
            "This surplus listing was just claimed by another recipient organization or is no longer available.",
          code: "ALREADY_CLAIMED_OR_EXPIRED",
        },
        { status: 409 }
      );
    }

    // 1. Assign Nearest Available Delivery Partner (Functional PRD Section 12.5)
    let assignedPartner = null;
    try {
      const assignmentDecision = await assignNearestDeliveryPartner(
        db,
        updatedListing.pickupLocation || { lat: 28.6139, lng: 77.209 }
      );
      assignedPartner = assignmentDecision.partner;
    } catch (assignErr) {
      console.error("Error finding nearest delivery partner:", assignErr);
    }

    // 2. Create DeliveryAssignment record (Functional PRD Section 12.5)
    const deliveryAssignmentDoc = {
      surplusListingId: listingObjectId,
      claimedByNgoId: ngo._id,
      institutionId: updatedListing.institutionId,
      assignedToDeliveryPartnerId: assignedPartner ? assignedPartner._id : undefined,
      status: "assigned", // assigned -> accepted -> picked_up -> delivered -> confirmed
      createdAt: now,
    };
    await db.collection("deliveryAssignments").insertOne(deliveryAssignmentDoc);

    // 3. Update Match records if exists (Functional PRD Section 12.4)
    await db.collection("matches").updateOne(
      { surplusListingId: listingObjectId, ngoId: ngo._id },
      { $set: { status: "claimed", updatedAt: now } }
    );
    await db.collection("matches").updateMany(
      { surplusListingId: listingObjectId, ngoId: { $ne: ngo._id } },
      { $set: { status: "rejected", updatedAt: now } }
    );

    // 4. Update parent inventory item status if linked
    if (updatedListing.inventoryItemId) {
      await db.collection("inventoryItems").updateOne(
        { _id: updatedListing.inventoryItemId },
        { $set: { status: "claimed", updatedAt: now } }
      );
    }

    // 5. Dispatch Real Notifications (Functional PRD Section 12.6)
    // Notify Institution Admin
    const institution = await db
      .collection("institutions")
      .findOne({ _id: updatedListing.institutionId });

    if (institution && institution.userId) {
      await createNotification(db, {
        userId: institution.userId,
        role: "institution_admin",
        type: "listing_claimed",
        title: "Surplus Listing Claimed",
        message: `${ngo.orgName} has claimed ${updatedListing.quantity} ${updatedListing.unit} of ${updatedListing.itemName}. A delivery partner is being coordinated for pickup.`,
        link: "/app/institution/surplus-listings",
        metadata: {
          listingId: listingObjectId,
          ngoName: ngo.orgName,
          itemName: updatedListing.itemName,
        },
      });
    }

    // Notify Assigned Delivery Partner (if available)
    if (assignedPartner && assignedPartner.userId) {
      await createNotification(db, {
        userId: assignedPartner.userId,
        role: "delivery_partner",
        type: "delivery_assigned",
        title: "New Dispatch Run Assigned",
        message: `Pickup ${updatedListing.quantity} ${updatedListing.unit} of ${updatedListing.itemName} from ${updatedListing.institutionName || institution?.name} for delivery to ${ngo.orgName}.`,
        link: "/app/delivery/assignments",
        metadata: {
          listingId: listingObjectId,
          pickupAddress: updatedListing.pickupLocation?.address || institution?.address,
          dropAddress: ngo.serviceArea,
        },
      });
    }

    // 6. Log claim decision to immutable audit trail
    await db.collection("auditLogs").insertOne({
      entityType: "SurplusListing",
      entityId: listingObjectId,
      action: "claim_surplus_listing",
      ruleApplied: "verified_ngo_atomic_lock",
      status: "claimed",
      performedBy: userObjectId,
      details: {
        ngoId: ngo._id,
        orgName: ngo.orgName,
        itemName: updatedListing.itemName,
        quantity: updatedListing.quantity,
        unit: updatedListing.unit,
        assignedDeliveryPartnerId: assignedPartner ? assignedPartner._id : null,
      },
      createdAt: now,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Surplus listing locked and claimed successfully.",
        listing: updatedListing,
        deliveryAssignedTo: assignedPartner ? assignedPartner._id : null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error executing atomic claim on listing:", error);
    return NextResponse.json(
      { error: "Server error occurred while claiming surplus listing." },
      { status: 500 }
    );
  }
}
