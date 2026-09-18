import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

async function getNgoContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const db = await getDb();
  const userId = session.user.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const ngo = await db.collection("ngos").findOne({ userId: userObjectId as any });

  if (!ngo) {
    return {
      error: "NGO profile not found. Please complete onboarding.",
      status: 404,
    };
  }

  return { session, db, ngo, userId: userObjectId };
}

export async function GET() {
  const ctx = await getNgoContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  return NextResponse.json({
    success: true,
    ngo: ctx.ngo,
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getNgoContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { db, ngo } = ctx;

  try {
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.orgName?.trim()) {
      updates.orgName = body.orgName.trim();
    }
    if (body.contactPhone?.trim()) {
      updates.contactPhone = body.contactPhone.trim();
    }
    if (body.serviceArea?.trim()) {
      updates.serviceArea = body.serviceArea.trim();
    }
    if (body.capacityPerWeek !== undefined) {
      updates.capacityPerWeek = Number(body.capacityPerWeek);
    }
    if (body.location?.lat && body.location?.lng) {
      updates.location = {
        lat: Number(body.location.lat),
        lng: Number(body.location.lng),
      };
    }

    updates.updatedAt = new Date();

    await db.collection("ngos").updateOne(
      { _id: ngo._id },
      { $set: updates }
    );

    const updated = await db.collection("ngos").findOne({ _id: ngo._id });

    return NextResponse.json({
      success: true,
      ngo: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating NGO profile:", error);
    return NextResponse.json(
      { error: "Failed to update NGO organization profile." },
      { status: 500 }
    );
  }
}
