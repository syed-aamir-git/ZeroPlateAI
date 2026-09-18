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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getInstitutionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid inventory item ID." }, { status: 400 });
  }

  const { db, institution } = ctx;

  try {
    const body = await request.json();
    const itemObjectId = new ObjectId(id);

    const existing = await db.collection("inventoryItems").findOne({
      _id: itemObjectId,
      institutionId: institution._id,
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found or access denied." },
        { status: 404 }
      );
    }

    const updates: Record<string, any> = {};

    if (body.status && ["in_stock", "surplus", "listed", "expired"].includes(body.status)) {
      updates.status = body.status;
    }

    if (body.name?.trim()) {
      updates.name = body.name.trim();
    }

    if (body.quantity !== undefined && Number(body.quantity) > 0) {
      updates.quantity = Number(body.quantity);
    }

    if (body.expiryEstimateAt) {
      updates.expiryEstimateAt = new Date(body.expiryEstimateAt);
    }

    updates.updatedAt = new Date();

    await db.collection("inventoryItems").updateOne(
      { _id: itemObjectId },
      { $set: updates }
    );

    const updatedDoc = await db.collection("inventoryItems").findOne({ _id: itemObjectId });

    return NextResponse.json({
      success: true,
      item: updatedDoc,
    });
  } catch (error: unknown) {
    console.error("Error updating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to update item." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getInstitutionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid inventory item ID." }, { status: 400 });
  }

  const { db, institution } = ctx;

  try {
    const itemObjectId = new ObjectId(id);

    const existing = await db.collection("inventoryItems").findOne({
      _id: itemObjectId,
      institutionId: institution._id,
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Item not found or access denied." },
        { status: 404 }
      );
    }

    if (existing.status === "listed") {
      return NextResponse.json(
        { error: "Cannot delete an item that is currently in an active surplus listing." },
        { status: 400 }
      );
    }

    await db.collection("inventoryItems").deleteOne({ _id: itemObjectId });

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted successfully.",
    });
  } catch (error: unknown) {
    console.error("Error deleting inventory item:", error);
    return NextResponse.json(
      { error: "Failed to delete item." },
      { status: 500 }
    );
  }
}
