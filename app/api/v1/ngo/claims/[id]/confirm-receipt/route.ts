import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

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
      claimedByNgoId: ngo._id,
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Surplus claim not found or does not belong to this organization." },
        { status: 404 }
      );
    }

    const now = new Date();

    // Update DeliveryAssignment status to 'confirmed' (Functional PRD Section 12.5)
    await db.collection("deliveryAssignments").updateOne(
      { surplusListingId: listingObjectId },
      {
        $set: {
          status: "confirmed",
          confirmedAt: now,
          confirmedByNgoId: ngo._id,
          updatedAt: now,
        },
      }
    );

    // Update SurplusListing status to 'delivered'
    await db.collection("surplusListings").updateOne(
      { _id: listingObjectId },
      {
        $set: {
          status: "delivered",
          deliveredAt: now,
          updatedAt: now,
        },
      }
    );

    // Update parent inventory item if linked
    if (listing.inventoryItemId) {
      await db.collection("inventoryItems").updateOne(
        { _id: listing.inventoryItemId },
        { $set: { status: "expired", updatedAt: now } }
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
        quantityKg: listing.quantity,
        itemName: listing.itemName,
      },
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Delivery receipt confirmed successfully. Impact metrics updated.",
    });
  } catch (error: unknown) {
    console.error("Error confirming delivery receipt:", error);
    return NextResponse.json(
      { error: "Server error occurred while confirming receipt." },
      { status: 500 }
    );
  }
}
