import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { createNotification } from "@/lib/notifications";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid claim ID." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const ngo = await db.collection("ngos").findOne({ userId: userObjectId as any });
    if (!ngo) {
      return NextResponse.json(
        { error: "NGO organization profile not found." },
        { status: 404 }
      );
    }

    const listingObjectId = new ObjectId(id);
    const listing = await db.collection("surplusListings").findOne({
      _id: listingObjectId,
      $or: [
        { claimedByNgoId: ngo._id },
        { claimedByNgoId: String(ngo._id) },
        { claimedByNgoId: { $in: [null, undefined] } },
      ],
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Surplus claim not found or does not belong to this organization." },
        { status: 404 }
      );
    }

    // Verify that if a delivery assignment exists, the delivery partner has already dropped off the food (status is "delivered")
    const assignment = await db.collection("deliveryAssignments").findOne({
      $or: [
        { surplusListingId: listingObjectId },
        { listingId: listingObjectId },
      ],
    });

    if (assignment && assignment.status !== "delivered" && assignment.status !== "confirmed") {
      const statusLabels: Record<string, string> = {
        assigned: "awaiting courier assignment",
        accepted: "driver en route to donor kitchen",
        picked_up: "food picked up and in transit",
      };
      const currentDesc = statusLabels[assignment.status] || assignment.status;
      return NextResponse.json(
        {
          error: `The delivery partner has not dropped off the food yet (currently: ${currentDesc}). The receipt can only be accepted once the delivery partner drops off the food at your center.`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update DeliveryAssignment status to 'confirmed' (Functional PRD Section 12.5)
    await db.collection("deliveryAssignments").updateOne(
      {
        $or: [
          { surplusListingId: listingObjectId },
          { listingId: listingObjectId },
        ],
      },
      {
        $set: {
          status: "confirmed",
          confirmedAt: now,
          confirmedByNgoId: ngo._id,
          updatedAt: now,
        },
      }
    );

    // Update SurplusListing status to 'delivered' and ensure claimedByNgo is recorded
    await db.collection("surplusListings").updateOne(
      { _id: listingObjectId },
      {
        $set: {
          status: "delivered",
          claimedByNgoId: ngo._id,
          claimedByNgoName: ngo.orgName,
          deliveredAt: now,
          updatedAt: now,
        },
      }
    );

    // Update parent inventory item if linked
    if (listing.inventoryItemId) {
      await db.collection("inventoryItems").updateOne(
        { _id: listing.inventoryItemId },
        { $set: { status: "delivered", updatedAt: now } }
      );
    }

    // Record audit trail event for confirmed handoff
    await db.collection("auditLogs").insertOne({
      entityType: "DeliveryAssignment",
      entityId: listingObjectId,
      action: "confirm_delivery_receipt",
      ruleApplied: "ngo_delivery_confirmation",
      status: "confirmed",
      performedBy: userObjectId,
      details: {
        ngoId: ngo._id,
        orgName: ngo.orgName,
        quantity: listing.quantity,
        unit: listing.unit || "kg",
        quantityKg: listing.quantity,
        itemName: listing.itemName,
      },
      createdAt: now,
    });

    // Notify Delivery Partner that receipt has been confirmed
    try {
      const assignment = await db.collection("deliveryAssignments").findOne({
        $or: [
          { surplusListingId: listingObjectId },
          { listingId: listingObjectId },
        ],
      });
      if (assignment?.assignedToDeliveryPartnerId) {
        const partner = await db.collection("deliveryPartners").findOne({
          _id: assignment.assignedToDeliveryPartnerId,
        });
        if (partner?.userId) {
          await createNotification(db, {
            userId: partner.userId,
            role: "delivery_partner",
            type: "delivery_status_change",
            title: "Delivery Run Confirmed by Recipient",
            message: `${ngo.orgName} has confirmed receipt for ${listing.quantity} ${listing.unit} of ${listing.itemName}. Great work!`,
            link: "/app/delivery/history",
          });
        }
      }
    } catch (notifErr) {
      console.error("Error notifying driver of receipt confirmation:", notifErr);
    }

    return NextResponse.json({
      success: true,
      message: "Delivery receipt accepted! Food has been successfully delivered and impact metrics updated.",
    });
  } catch (error: unknown) {
    console.error("Error confirming delivery receipt:", error);
    return NextResponse.json(
      { error: "Server error occurred while confirming receipt." },
      { status: 500 }
    );
  }
}
