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

    let updatedAssignment: any = null;

    // Validate lifecycle progression (Functional PRD Section 12.5)
    if (nextStatus === "accepted") {
      // Race-condition safe atomic lock: First partner to accept claims the dispatch
      const result = await db.collection("deliveryAssignments").findOneAndUpdate(
        {
          _id: assignmentId,
          status: "assigned",
          $or: [
            { assignedToDeliveryPartnerId: null },
            { assignedToDeliveryPartnerId: { $exists: false } },
            { assignedToDeliveryPartnerId: partner._id },
          ],
        },
        {
          $set: {
            status: "accepted",
            assignedToDeliveryPartnerId: partner._id,
            acceptedAt: now,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );

      if (!result) {
        return NextResponse.json(
          { error: "This delivery order has already been accepted by another delivery partner or is no longer open." },
          { status: 409 }
        );
      }
      updatedAssignment = result;
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
      await db.collection("deliveryAssignments").updateOne(
        { _id: assignmentId },
        { $set: { status: "picked_up", pickedUpAt: now, updatedAt: now } }
      );
      updatedAssignment = await db.collection("deliveryAssignments").findOne({ _id: assignmentId });
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
      await db.collection("deliveryAssignments").updateOne(
        { _id: assignmentId },
        { $set: { status: "delivered", deliveredAt: now, updatedAt: now } }
      );

      // Also update linked SurplusListing
      if (currentAssignment.surplusListingId) {
        await db.collection("surplusListings").updateOne(
          { _id: currentAssignment.surplusListingId },
          { $set: { status: "delivered", deliveredAt: now, updatedAt: now } }
        );
      }
      updatedAssignment = await db.collection("deliveryAssignments").findOne({ _id: assignmentId });
    }

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
      const driverUser = await db.collection("user").findOne({ _id: partner.userId as any });
      const driverName = driverUser?.name || "Delivery Partner";
      const vehicleDesc = (partner.vehicleType || "two_wheeler").replace("_", " ");

      if (nextStatus === "accepted") {
        // 1. Notify Platform Admins that delivery partner has accepted and is now assigned
        const platformAdmins = await db
          .collection("user")
          .find({ role: "platform_admin" })
          .toArray();

        for (const admin of platformAdmins) {
          await createNotification(db, {
            userId: admin._id,
            role: "platform_admin",
            type: "delivery_assigned",
            title: "Delivery Partner Assigned",
            message: `Order for ${itemName} has been assigned to delivery partner ${driverName} (${partner.phone || "No phone"}, ${vehicleDesc}).`,
            link: "/app/admin/overview",
            metadata: {
              assignmentId,
              partnerId: partner._id,
              driverName,
              phone: partner.phone,
              vehicleType: partner.vehicleType,
              itemName,
            },
          });
        }

        // 2. Notify Institution Admin that driver is assigned and en route
        if (institution?.userId) {
          await createNotification(db, {
            userId: institution.userId,
            role: "institution_admin",
            type: "delivery_status_change",
            title: `Delivery Partner Assigned: ${driverName}`,
            message: `Order for ${itemName} is assigned to delivery partner ${driverName} (${partner.phone || "No phone"}, ${vehicleDesc}). Driver is en route to pick up.`,
            link: "/app/institution/deliveries",
            metadata: {
              assignmentId,
              partnerId: partner._id,
              driverName,
              phone: partner.phone,
              vehicleType: partner.vehicleType,
            },
          });
        }

        // 3. Notify NGO that driver has accepted dispatch
        if (ngo?.userId) {
          await createNotification(db, {
            userId: ngo.userId,
            role: "ngo",
            type: "delivery_status_change",
            title: `Delivery Partner Assigned: ${driverName}`,
            message: `Delivery partner ${driverName} (${partner.phone || "No phone"}, ${vehicleDesc}) has accepted dispatch for ${itemName} and will deliver to your center.`,
            link: "/app/ngo/my-claims",
            metadata: {
              assignmentId,
              partnerId: partner._id,
              driverName,
            },
          });
        }
      } else {
        const statusLabels: Record<string, string> = {
          picked_up: "Picked Up & In Transit",
          delivered: "Delivered to Recipient Site",
        };

        if (institution?.userId) {
          await createNotification(db, {
            userId: institution.userId,
            role: "institution_admin",
            type: "delivery_status_change",
            title: `Delivery Update: ${statusLabels[nextStatus] || nextStatus}`,
            message: `Delivery status for ${itemName} has been updated to "${nextStatus}" by driver ${driverName}.`,
            link: "/app/institution/deliveries",
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
                ? `Delivery partner ${driverName} has arrived and delivered ${itemName}. Please confirm receipt on your claims page to finalize the impact credit.`
                : `Your claimed batch of ${itemName} is now ${statusLabels[nextStatus] || nextStatus}.`,
            link: "/app/ngo/my-claims",
          });
        }
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
