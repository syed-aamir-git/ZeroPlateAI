import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { computeExpiryStatus } from "@/lib/auto-flagging";

async function getInstitutionContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "institution_admin" && role !== "platform_admin") {
    return { error: "Forbidden. Requires Institution Admin role.", status: 403 };
  }

  const db = await getDb();
  const userId = session.user.id;
  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

  const institution = await db
    .collection("institutions")
    .findOne({ userId: userObjectId as any });

  if (!institution) {
    return {
      error: "Institution profile not found. Please complete onboarding first.",
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

  const { db, institution } = ctx;

  const items = await db
    .collection("inventoryItems")
    .find({ institutionId: institution._id })
    .sort({ createdAt: -1 })
    .toArray();

  const enrichedItems = items.map((item) => {
    const expiryStatus = computeExpiryStatus(item.category, item.expiryEstimateAt);

    let effectiveStatus = item.status;
    if (effectiveStatus === "in_stock" && expiryStatus.isExpired) {
      effectiveStatus = "expired";
    }

    return {
      ...item,
      status: effectiveStatus,
      expiryStatus,
    };
  });

  return NextResponse.json({
    success: true,
    items: enrichedItems,
    count: enrichedItems.length,
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getInstitutionContext();
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const { db, institution } = ctx;

  try {
    const body = await request.json();
    const {
      name,
      category,
      quantity,
      unit,
      preparedOrReceivedAt,
      expiryEstimateAt,
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Item name is required." },
        { status: 400 }
      );
    }

    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than zero." },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: "Category is required." },
        { status: 400 }
      );
    }

    const prepDate = preparedOrReceivedAt
      ? new Date(preparedOrReceivedAt)
      : new Date();
    const expiryDate = expiryEstimateAt
      ? new Date(expiryEstimateAt)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (expiryDate <= prepDate) {
      return NextResponse.json(
        { error: "Expiry estimate must be after preparation/receipt date." },
        { status: 400 }
      );
    }

    const newItem = {
      institutionId: institution._id,
      name: name.trim(),
      category,
      quantity: Number(quantity),
      unit: unit || "kg",
      preparedOrReceivedAt: prepDate,
      expiryEstimateAt: expiryDate,
      status: "in_stock",
      createdAt: new Date(),
    };

    const insertResult = await db.collection("inventoryItems").insertOne(newItem);

    return NextResponse.json(
      {
        success: true,
        item: { ...newItem, _id: insertResult.insertedId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating inventory item:", error);
    return NextResponse.json(
      { error: "Failed to create inventory item." },
      { status: 500 }
    );
  }
}
