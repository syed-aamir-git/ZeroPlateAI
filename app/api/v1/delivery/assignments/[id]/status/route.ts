import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { createNotification } from "@/lib/notifications";

export async function PATCH(
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
        { error: "Invalid assignment ID." },
        { status: 400 }
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

    const body = await request.json();
    const { nextStatus } = body;

    const allowedTransitions = ["accepted", "picked_up", "delivered"];
    if (!allowedTransitions.includes(nextStatus)) {
      return NextResponse.json(
        { error: `Invalid transition status: ${nextStatus}. Allowed: accepted, picked_up, delivered.` },
        { status: 400 }
      );
    }

    const assignmentId = new ObjectId(id);
    const currentAssignment = await db.collection("deliveryAssignments").findOne({ _id: assignmentId });

    if (!currentAssignment) {
      return NextResponse.json(
        { error: "Delivery assignment not found." },
        { status: 404 }
      );
    }

    const now = new Date();
    const updates: Record<string, any> = {
      status: nextStatus,
      updatedAt: now,
    };

    // Validate lifecycle progression (Functional PRD Section 12.5)
    if (nextStatus === "accepted") {
      if (currentAssignment.status !== "assigned") {
        return NextResponse.json(
          { error: `Cannot accept assignment from current status: ${currentAssignment.status}.` },
          { status: 400 }
        );
      }
      updates.assignedToDeliveryPartnerId = partner._id;
      updates.acceptedAt = now;
    } else if (nextStatus === "picked_up") {
      if (currentAssignment.status !== "accepted") {
        return NextResponse.json(
          { error: `Cannot advance to picked_up from status: ${currentAssignment.status}.` },
          { status: 400 }
        );
      }
      if (String(currentAssignment.assignedToDeliveryPartnerId) !== String(partner._id)) {
        return NextResponse.json(
          { error: "This assignment is assigned to another delivery partner." },
          { status: 403 }
        );
      }
      updates.pickedUpAt = now;
    } else if (nextStatus === "delivered") {
      if (currentAssignment.status !== "picked_up") {
        return NextResponse.json(
          { error: `Cannot advance to delivered from status: ${currentAssignment.status}.` },
          { status: 400 }
        );
      }
      if (String(currentAssignment.assignedToDeliveryPartnerId) !== String(partner._id)) {
        return NextResponse.json(
          { error: "This assignment is assigned to another delivery partner." },
          { status: 403 }
        );
      }
      updates.deliveredAt = now;

      // Also update linked SurplusListing
      if (currentAssignment.surplusListingId) {
        await db.collection("surplusListings").updateOne(
          { _id: currentAssignment.surplusListingId },
          { $set: { status: "delivered", deliveredAt: now, updatedAt: now } }
        );
      }
    }

    await db.collection("deliveryAssignments").updateOne(
      { _id: assignmentId },
      { $set: updates }
    );

    const updatedAssignment = await db.collection("deliveryAssignments").findOne({ _id: assignmentId });

    // Dispatch Real Notifications (Functional PRD Section 12.6)
    try {
      const listing = await db
        .collection("surplusListings")
        .findOne({ _id: currentAssignment.surplusListingId });

      const institution = listing?.institutionId
        ? await db.collection("institutions").findOne({ _id: listing.institutionId })
        : null;

      const ngo = currentAssignment.claimedByNgoId
        ? await db.collection("ngos").findOne({ _id: currentAssignment.claimedByNgoId })
        : null;

      const itemName = listing?.itemName || "Surplus Batch";
      const statusLabels: Record<string, string> = {
        accepted: "Driver Assigned & En Route to Kitchen",
        picked_up: "Picked Up & In Transit",
        delivered: "Delivered to Recipient Site",
      };

      if (institution?.userId) {
        await createNotification(db, {
          userId: institution.userId,
          role: "institution_admin",
          type: "delivery_status_change",
          title: `Delivery Update: ${statusLabels[nextStatus] || nextStatus}`,
          message: `Delivery status for ${itemName} has been updated to "${nextStatus}".`,
          link: "/app/institution/surplus-listings",
        });
      }

      if (ngo?.userId) {
        await createNotification(db, {
          userId: ngo.userId,
          role: "ngo",
          type: "delivery_status_change",
          title: `Dispatch Update: ${statusLabels[nextStatus] || nextStatus}`,
          message:
            nextStatus === "delivered"
              ? `Delivery partner has arrived and delivered ${itemName}. Please confirm receipt on your claims page to finalize the impact credit.`
              : `Your claimed batch of ${itemName} is now ${statusLabels[nextStatus] || nextStatus}.`,
          link: "/app/ngo/my-claims",
        });
      }
    } catch (notifErr) {
      console.error("Error dispatching delivery status notifications:", notifErr);
    }

    // Log lifecycle event to audit trail
    await db.collection("auditLogs").insertOne({
      entityType: "DeliveryAssignment",
      entityId: assignmentId,
      action: `delivery_status_${nextStatus}`,
      status: nextStatus,
      performedBy: userObjectId,
      details: {
        partnerId: partner._id,
        vehicleType: partner.vehicleType,
        surplusListingId: currentAssignment.surplusListingId,
      },
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment,
    });
  } catch (error: unknown) {
    console.error("Error updating delivery status:", error);
    return NextResponse.json(
      { error: "Server error occurred while updating delivery status." },
      { status: 500 }
    );
  }
}
