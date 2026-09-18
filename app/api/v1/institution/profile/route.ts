import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

async function getInstitutionContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const db = await getDb();
  const userId = session.user.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const institution = await db
    .collection("institutions")
    .findOne({ userId: userObjectId as any });

  if (!institution) {
    return {
      error: "Institution profile not found.",
      status: 404,
    };
  }

  return { session, db, institution, userId: userObjectId };
}

export async function GET() {
  const ctx = await getInstitutionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  return NextResponse.json({
    success: true,
    institution: ctx.institution,
  });
}

export async function PATCH(request: NextRequest) {
  const ctx = await getInstitutionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { db, institution } = ctx;

  try {
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.name?.trim()) {
      updates.name = body.name.trim();
    }
    if (body.type && ["college", "hospital", "hotel", "corporate_cafeteria", "processing_unit"].includes(body.type)) {
      updates.type = body.type;
    }
    if (body.address?.trim()) {
      updates.address = body.address.trim();
    }
    if (body.plan && ["free", "premium"].includes(body.plan)) {
      updates.plan = body.plan;
    }
    if (body.location?.lat && body.location?.lng) {
      updates.location = {
        lat: Number(body.location.lat),
        lng: Number(body.location.lng),
      };
    }

    updates.updatedAt = new Date();

    await db.collection("institutions").updateOne(
      { _id: institution._id },
      { $set: updates }
    );

    const updated = await db.collection("institutions").findOne({ _id: institution._id });

    return NextResponse.json({
      success: true,
      institution: updated,
    });
  } catch (error: unknown) {
    console.error("Error updating institution profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
