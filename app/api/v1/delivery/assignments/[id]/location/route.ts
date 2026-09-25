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
        { error: "Unauthorized. Please log in." },
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

    const body = await request.json();
    const { lat, lng, heading, speed } = body;

    if (lat === undefined || lng === undefined || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return NextResponse.json(
        { error: "Valid lat and lng are required." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const assignmentId = new ObjectId(id);
    const now = new Date();

    const locationData = {
      lat: Number(lat),
      lng: Number(lng),
      heading: heading !== undefined && !isNaN(Number(heading)) ? Number(heading) : undefined,
      speed: speed !== undefined && !isNaN(Number(speed)) ? Number(speed) : undefined,
      updatedAt: now,
    };

    // Update the delivery assignment document
    const result = await db.collection("deliveryAssignments").findOneAndUpdate(
      { _id: assignmentId },
      {
        $set: {
          currentLocation: locationData,
          updatedAt: now,
        },
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "Delivery assignment not found." },
        { status: 404 }
      );
    }

    // Also update the delivery partner's current location if assigned
    if (result.assignedToDeliveryPartnerId) {
      await db.collection("deliveryPartners").updateOne(
        { _id: result.assignedToDeliveryPartnerId },
        {
          $set: {
            currentLocation: locationData,
            lastActiveAt: now,
          },
        }
      );
    }

    return NextResponse.json({
      success: true,
      currentLocation: locationData,
    });
  } catch (error: unknown) {
    console.error("Error updating delivery location:", error);
    return NextResponse.json(
      { error: "Failed to update delivery location." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID." },
        { status: 400 }
      );
    }

    const db = await getDb();
    const assignmentId = new ObjectId(id);

    const assignment = await db.collection("deliveryAssignments").findOne({ _id: assignmentId });
    if (!assignment) {
      return NextResponse.json(
        { error: "Delivery assignment not found." },
        { status: 404 }
      );
    }

    let courier = null;
    if (assignment.assignedToDeliveryPartnerId) {
      const partner = await db.collection("deliveryPartners").findOne({
        _id: assignment.assignedToDeliveryPartnerId,
      });

      if (partner) {
        const user = partner.userId
          ? await db.collection("user").findOne({ _id: partner.userId })
          : null;

        courier = {
          name: user?.name || "Delivery Partner",
          phone: partner.phone || "",
          vehicleType: partner.vehicleType || "two_wheeler",
          vehicleNumber: partner.vehicleNumber || "",
        };
      }
    }

    return NextResponse.json({
      success: true,
      currentLocation: assignment.currentLocation || null,
      status: assignment.status,
      courier,
      updatedAt: assignment.currentLocation?.updatedAt || assignment.updatedAt || null,
    });
  } catch (error: unknown) {
    console.error("Error fetching delivery location:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivery location." },
      { status: 500 }
    );
  }
}
