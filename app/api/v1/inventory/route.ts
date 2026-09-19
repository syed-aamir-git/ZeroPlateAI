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

  const itemIds = items.map((i) => i._id);
  const listings = await db
    .collection("surplusListings")
    .find({ inventoryItemId: { $in: itemIds } })
    .toArray();

  const listingByItemId = new Map<string, any>();
  for (const l of listings) {
    const key = String(l.inventoryItemId);
    const existing = listingByItemId.get(key);
    if (!existing) {
      listingByItemId.set(key, l);
    } else if (l.status === "delivered") {
      listingByItemId.set(key, l);
    } else if (
      existing.status !== "delivered" &&
      (l.status === "claimed" || l.status === "matched" || l.status === "pending")
    ) {
      listingByItemId.set(key, l);
    }
  }

  const enrichedItems = items.map((item) => {
    const expiryStatus = computeExpiryStatus(item.category, item.expiryEstimateAt);
    const linkedListing = listingByItemId.get(String(item._id));

    let effectiveStatus = item.status || "in_stock";

    if (item.status === "delivered" || linkedListing?.status === "delivered") {
      effectiveStatus = "delivered";
    } else if (
      item.status === "in_progress" ||
      item.status === "claimed" ||
      item.status === "listed" ||
      linkedListing?.status === "claimed" ||
      linkedListing?.status === "matched" ||
      linkedListing?.status === "pending"
    ) {
      effectiveStatus = "in_progress";
    } else if (item.status === "expired" || expiryStatus.isExpired) {
      effectiveStatus = "expired";
    } else if (item.status === "surplus") {
      effectiveStatus = "surplus";
    } else {
      effectiveStatus = "in_stock";
    }

    return {
      ...item,
      rawStatus: item.status,
      status: effectiveStatus,
      expiryStatus,
      linkedListing: linkedListing
        ? {
            id: linkedListing._id,
            status: linkedListing.status,
            deliveredAt: linkedListing.deliveredAt,
            claimedByNgoName: linkedListing.claimedByNgoName,
          }
        : undefined,
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
