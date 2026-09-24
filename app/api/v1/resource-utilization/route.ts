import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import {
  evaluateFefoInventory,
  getDefaultFefoBaselineItems,
  analyzeRawMaterialsWithNvidia,
  FefoRawItemInput,
} from "@/lib/fefo-engine";

export async function GET(request: NextRequest) {
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

    const institution = await db
      .collection("institutions")
      .findOne({ userId: userObjectId });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution profile not found." },
        { status: 404 }
      );
    }

    // 1. Fetch RAW MATERIALS ONLY (strictly exclude ready-to-eat cooked meals!)
    const rawInventoryDocs = await db
      .collection("inventoryItems")
      .find({
        institutionId: institution._id,
        category: { $ne: "cooked_food" }, // Strictly raw materials & ingredients!
        status: { $ne: "delivered" },
      })
      .sort({ expiryEstimateAt: 1 })
      .toArray();

    // Map into FefoRawItemInput format
    const rawItems: FefoRawItemInput[] = rawInventoryDocs.map((doc) => ({
      id: String(doc._id),
      name: doc.name,
      category: doc.category || "raw_produce",
      quantity: Number(doc.quantity) || 0,
      unit: doc.unit || "kg",
      expiryDate: doc.expiryEstimateAt || new Date(Date.now() + 48 * 3600 * 1000),
      storage: doc.storage || (doc.category === "dairy" ? "cold_storage" : "ambient"),
      preparedOrReceivedAt: doc.preparedOrReceivedAt || doc.createdAt,
      unitCostInr: doc.unitCostInr || 50,
    }));

    // If no raw materials are recorded yet in this kitchen's DB, supply calibrated seed raw materials
    const itemsToEvaluate = rawItems.length > 0 ? rawItems : getDefaultFefoBaselineItems();

    // 2. Evaluate FEFO Intelligence & Procurement Optimization
    const fefoReport = evaluateFefoInventory(itemsToEvaluate);

    // 3. Query NVIDIA NIM for deep biochemical/culinary reasoning and procurement advice
    const nvidiaInsights = await analyzeRawMaterialsWithNvidia(itemsToEvaluate, 28);
    fefoReport.nvidiaAiInsights = {
      model: "meta/llama-3.2-11b-vision-instruct",
      isLiveAi: nvidiaInsights.isLiveAi,
      urgentDishes: nvidiaInsights.urgentDishes,
      procurementAdviceNotes: nvidiaInsights.procurementAdviceNotes,
    };

    return NextResponse.json({
      success: true,
      institution: {
        _id: institution._id,
        name: institution.name,
        type: institution.type,
      },
      isUsingCalibratedDefaults: rawItems.length === 0,
      rawItemsCount: rawItems.length,
      report: fefoReport,
    });
  } catch (error: unknown) {
    console.error("Error fetching resource utilization:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const institution = await db
      .collection("institutions")
      .findOne({ userId: userObjectId });

    if (!institution) {
      return NextResponse.json(
        { error: "Institution profile not found." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, category, quantity, unit, storage, expiryEstimateAt, unitCostInr } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Raw material name is required." }, { status: 400 });
    }

    if (!quantity || Number(quantity) <= 0) {
      return NextResponse.json({ error: "Quantity must be greater than zero." }, { status: 400 });
    }

    // Ensure category is a raw material, not cooked food
    const safeCategory = category === "cooked_food" ? "raw_produce" : (category || "raw_produce");

    const expiryDate = expiryEstimateAt
      ? new Date(expiryEstimateAt)
      : new Date(Date.now() + 48 * 60 * 60 * 1000);

    const newRawItem = {
      institutionId: institution._id,
      name: name.trim(),
      category: safeCategory,
      quantity: Number(quantity),
      unit: unit || "kg",
      storage: storage || (safeCategory === "dairy" ? "cold_storage" : "ambient"),
      isRawMaterial: true,
      unitCostInr: Number(unitCostInr) || 45,
      preparedOrReceivedAt: new Date(),
      expiryEstimateAt: expiryDate,
      status: "in_stock",
      createdAt: new Date(),
    };

    const result = await db.collection("inventoryItems").insertOne(newRawItem);

    return NextResponse.json(
      {
        success: true,
        item: { ...newRawItem, _id: result.insertedId },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating raw material:", error);
    return NextResponse.json(
      { error: "Failed to log raw material." },
      { status: 500 }
    );
  }
}
