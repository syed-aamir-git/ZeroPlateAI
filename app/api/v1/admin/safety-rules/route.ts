import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

const DEFAULT_SAFETY_RULES = {
  key: "default_safety_rules",
  cookedFoodMaxHours: 4,
  cookedFoodWindowCutoffHours: 4,
  dairyBufferHours: 2,
  expiryWindowThresholdHours: {
    cooked_food: 2,
    dairy: 12,
    bakery: 12,
    raw_produce: 24,
    packaged: 48,
  },
};

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "platform_admin") {
      return NextResponse.json(
        { error: "Forbidden. Platform Admin access required." },
        { status: 403 }
      );
    }

    const db = await getDb();
    let config = await db.collection("safetyRules").findOne({ key: "default_safety_rules" });

    if (!config) {
      // Upsert standard default rules
      await db.collection("safetyRules").insertOne({
        ...DEFAULT_SAFETY_RULES,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      config = await db.collection("safetyRules").findOne({ key: "default_safety_rules" });
    }

    return NextResponse.json({
      success: true,
      rules: config,
    });
  } catch (error: unknown) {
    console.error("Error fetching safety rules:", error);
    return NextResponse.json(
      { error: "Failed to load safety rules." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role;
    if (role !== "platform_admin") {
      return NextResponse.json(
        { error: "Forbidden. Platform Admin access required." },
        { status: 403 }
      );
    }

    const db = await getDb();
    const userId = session.user.id;
    const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : userId;

    const body = await request.json();
    const {
      cookedFoodMaxHours,
      cookedFoodWindowCutoffHours,
      dairyBufferHours,
      expiryWindowThresholdHours,
    } = body;

    const updates: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: userObjectId,
    };

    if (cookedFoodMaxHours !== undefined) {
      const val = Number(cookedFoodMaxHours);
      if (isNaN(val) || val < 0 || val > 72) {
        return NextResponse.json(
          { error: "Cooked food max age must be between 0 and 72 hours." },
          { status: 400 }
        );
      }
      updates.cookedFoodMaxHours = val;
    }
    if (cookedFoodWindowCutoffHours !== undefined) {
      const val = Number(cookedFoodWindowCutoffHours);
      if (isNaN(val) || val < 0 || val > 72) {
        return NextResponse.json(
          { error: "Pickup window cutoff must be between 0 and 72 hours." },
          { status: 400 }
        );
      }
      updates.cookedFoodWindowCutoffHours = val;
    }
    if (dairyBufferHours !== undefined) {
      const val = Number(dairyBufferHours);
      if (isNaN(val) || val < 0 || val > 72) {
        return NextResponse.json(
          { error: "Dairy buffer window must be between 0 and 72 hours." },
          { status: 400 }
        );
      }
      updates.dairyBufferHours = val;
    }
    if (expiryWindowThresholdHours && typeof expiryWindowThresholdHours === "object") {
      const cf = Number(expiryWindowThresholdHours.cooked_food ?? 2);
      const dy = Number(expiryWindowThresholdHours.dairy ?? 12);
      const bk = Number(expiryWindowThresholdHours.bakery ?? 12);
      const rp = Number(expiryWindowThresholdHours.raw_produce ?? 24);
      const pk = Number(expiryWindowThresholdHours.packaged ?? 48);

      if (
        isNaN(cf) || cf < 0 || cf > 72 ||
        isNaN(dy) || dy < 0 || dy > 168 ||
        isNaN(bk) || bk < 0 || bk > 168 ||
        isNaN(rp) || rp < 0 || rp > 336 ||
        isNaN(pk) || pk < 0 || pk > 720
      ) {
        return NextResponse.json(
          { error: "Category warning thresholds must be within limits (min: 0h; max: 72h–720h)." },
          { status: 400 }
        );
      }

      updates.expiryWindowThresholdHours = {
        cooked_food: cf,
        dairy: dy,
        bakery: bk,
        raw_produce: rp,
        packaged: pk,
      };
    }

    await db.collection("safetyRules").updateOne(
      { key: "default_safety_rules" },
      { $set: updates },
      { upsert: true }
    );

    const updatedConfig = await db.collection("safetyRules").findOne({ key: "default_safety_rules" });

    // Log configuration modification to immutable audit trail
    await db.collection("auditLogs").insertOne({
      entityType: "SafetyRuleConfiguration",
      entityId: updatedConfig?._id,
      action: "update_safety_rules",
      ruleApplied: "platform_admin_rule_modification",
      status: "verified_safe",
      performedBy: userObjectId,
      details: {
        cookedFoodMaxHours: updates.cookedFoodMaxHours,
        dairyBufferHours: updates.dairyBufferHours,
      },
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Safety gating thresholds updated successfully.",
      rules: updatedConfig,
    });
  } catch (error: unknown) {
    console.error("Error updating safety rules:", error);
    return NextResponse.json(
      { error: "Failed to update safety rules." },
      { status: 500 }
    );
  }
}
