import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET() {
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

    const partner = await db.collection("deliveryPartners").findOne({ userId: userObjectId as any });
    if (!partner) {
      return NextResponse.json(
        { error: "Delivery partner profile not found." },
        { status: 404 }
      );
    }

    const totalCompleted = await db.collection("deliveryAssignments").countDocuments({
      assignedToDeliveryPartnerId: partner._id,
      status: { $in: ["delivered", "confirmed"] },
    });

    const activeCount = await db.collection("deliveryAssignments").countDocuments({
      assignedToDeliveryPartnerId: partner._id,
      status: { $in: ["assigned", "accepted", "picked_up"] },
    });

    return NextResponse.json({
      success: true,
      partner: {
        _id: partner._id,
        name: session.user.name,
        email: session.user.email,
        phone: partner.phone,
        vehicleType: partner.vehicleType || "two_wheeler",
        vehicleNumber: partner.vehicleNumber || "",
        serviceArea: partner.serviceArea || "Metropolitan Zone",
        active: partner.active !== false,
        createdAt: partner.createdAt,
        totalCompleted,
        activeCount,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching partner profile:", error);
    return NextResponse.json(
      { error: "Failed to load delivery partner profile." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const partner = await db.collection("deliveryPartners").findOne({ userId: userObjectId as any });
    if (!partner) {
      return NextResponse.json(
        { error: "Delivery partner profile not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.phone?.trim()) {
      updates.phone = body.phone.trim();
    }
    if (body.vehicleType && ["two_wheeler", "four_wheeler", "van", "electric_cargo"].includes(body.vehicleType)) {
      updates.vehicleType = body.vehicleType;
    }
    if (body.vehicleNumber !== undefined) {
      updates.vehicleNumber = String(body.vehicleNumber).trim().toUpperCase();
    }
    if (body.serviceArea?.trim()) {
      updates.serviceArea = body.serviceArea.trim();
    }
    if (body.active !== undefined) {
      updates.active = Boolean(body.active);
    }

    updates.updatedAt = new Date();

    await db.collection("deliveryPartners").updateOne(
      { _id: partner._id },
      { $set: updates }
    );

    const updated = await db.collection("deliveryPartners").findOne({ _id: partner._id });

    return NextResponse.json({
      success: true,
      partner: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating partner profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
