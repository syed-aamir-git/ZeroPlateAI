import { Db, ObjectId } from "mongodb";

export interface SafetyGatingInput {
  inventoryItem: {
    _id: ObjectId;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    preparedOrReceivedAt: Date;
    expiryEstimateAt: Date;
  };
  quantity: number;
  pickupWindow: {
    start: Date;
    end: Date;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  institutionId: ObjectId;
  userId: ObjectId | string;
}

export interface SafetyGatingResult {
  safe: boolean;
  ruleApplied: string;
  reason?: string;
  rejectionMessage?: string;
}

/**
 * Server-Side Safety Gating Engine (Functional PRD Section 12.3 & 20)
 * Evaluates food safety rules before allowing any surplus listing to go live.
 * Strictly FAILS CLOSED on any error or missing criteria.
 * Logs all decisions to MongoDB auditLogs collection.
 */
export async function evaluateSafetyGating(
  db: Db,
  input: SafetyGatingInput
): Promise<SafetyGatingResult> {
  const userObjId = ObjectId.isValid(input.userId)
    ? new ObjectId(input.userId)
    : input.userId;

  try {
    const now = new Date();
    const item = input.inventoryItem;
    const prepTime = new Date(item.preparedOrReceivedAt);
    const expiryTime = new Date(item.expiryEstimateAt);
    const pickupStart = new Date(input.pickupWindow.start);
    const pickupEnd = new Date(input.pickupWindow.end);

    // Rule 1: Field Validation
    if (!input.quantity || input.quantity <= 0) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "quantity_validation",
        reason: "Surplus quantity must be greater than zero.",
        rejectionMessage: "This item wasn't listed — quantity must be greater than zero.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    if (input.quantity > item.quantity) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "quantity_availability",
        reason: `Listing quantity (${input.quantity} ${item.unit}) exceeds in-stock quantity (${item.quantity} ${item.unit}).`,
        rejectionMessage: "This item wasn't listed — requested quantity exceeds available stock.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    if (!input.pickupLocation?.address?.trim()) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "pickup_location_presence",
        reason: "Valid pickup dispatch address is mandatory.",
        rejectionMessage: "This item wasn't listed — pickup address is required.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    if (pickupEnd <= pickupStart) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "pickup_window_order",
        reason: "Pickup window end time must be after start time.",
        rejectionMessage: "This item wasn't listed — pickup window end time must be after start time.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    if (pickupEnd <= now) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "pickup_window_future",
        reason: "Pickup window end time has already passed.",
        rejectionMessage: "This item wasn't listed — pickup window has already expired.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    // Rule 2: Absolute Expiry Check
    if (expiryTime <= now) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "expiry_threshold",
        reason: `Item expiry date (${expiryTime.toISOString()}) has elapsed.`,
        rejectionMessage: "This item wasn't listed — it has reached or passed its expiration estimate.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    if (pickupEnd > expiryTime) {
      const result: SafetyGatingResult = {
        safe: false,
        ruleApplied: "expiry_window_overlap",
        reason: "Pickup window extends beyond estimated safe shelf-life.",
        rejectionMessage: "This item wasn't listed — pickup window extends beyond the item's safe shelf-life.",
      };
      await recordAuditLog(db, input, result, userObjId);
      return result;
    }

    // Query dynamic safety rules configuration from MongoDB (Functional PRD Section 12.3)
    const safetyConfig = await db.collection("safetyRules").findOne({ key: "default_safety_rules" });
    const cookedFoodMaxHours = safetyConfig?.cookedFoodMaxHours ?? 4;
    const cookedFoodWindowCutoffHours = safetyConfig?.cookedFoodWindowCutoffHours ?? 4;
    const dairyBufferHours = safetyConfig?.dairyBufferHours ?? 2;

    // Rule 3: Cooked Food Elapsed Time Rule (FSSAI Norms / PRD Section 12.3 & 20)
    // Cooked items cannot be redistributed if cooked > max hours ago, and pickup must end within cutoff hours of cooking
    if (item.category === "cooked_food") {
      const hoursSinceCooked = (now.getTime() - prepTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceCooked > cookedFoodMaxHours) {
        const result: SafetyGatingResult = {
          safe: false,
          ruleApplied: "cooked_food_4h_threshold",
          reason: `Cooked food prepared ${hoursSinceCooked.toFixed(1)} hours ago exceeds the ${cookedFoodMaxHours}-hour food safety maximum.`,
          rejectionMessage: `This item wasn't listed — it's past the ${cookedFoodMaxHours}-hour safety window for cooked food.`,
        };
        await recordAuditLog(db, input, result, userObjId);
        return result;
      }

      const hoursAtPickupEnd = (pickupEnd.getTime() - prepTime.getTime()) / (1000 * 60 * 60);
      if (hoursAtPickupEnd > cookedFoodWindowCutoffHours) {
        const result: SafetyGatingResult = {
          safe: false,
          ruleApplied: "cooked_food_window_cutoff",
          reason: `Pickup window ends ${hoursAtPickupEnd.toFixed(1)} hours after preparation, exceeding the ${cookedFoodWindowCutoffHours}-hour limit.`,
          rejectionMessage: `This item wasn't listed — the pickup window extends beyond the ${cookedFoodWindowCutoffHours}-hour cooked food safety limit.`,
        };
        await recordAuditLog(db, input, result, userObjId);
        return result;
      }
    }

    // Rule 4: Dairy and Perishables Gating
    if (item.category === "dairy") {
      // Must have buffer before expiry at dispatch end
      const remainingMs = expiryTime.getTime() - pickupEnd.getTime();
      if (remainingMs < dairyBufferHours * 60 * 60 * 1000) {
        const result: SafetyGatingResult = {
          safe: false,
          ruleApplied: "dairy_perishable_buffer",
          reason: `Dairy products require at least a ${dairyBufferHours}-hour buffer before expiration at pickup close.`,
          rejectionMessage: `This item wasn't listed — dairy products require a ${dairyBufferHours}-hour buffer before expiration.`,
        };
        await recordAuditLog(db, input, result, userObjId);
        return result;
      }
    }

    // Gating Passed: Verified Safe to List
    const passResult: SafetyGatingResult = {
      safe: true,
      ruleApplied: "all_safety_criteria_satisfied",
      reason: "Passed all FSSAI-aligned temperature, elapsed time, and window thresholds.",
    };
    await recordAuditLog(db, input, passResult, userObjId);
    return passResult;
  } catch (error: unknown) {
    // FAIL CLOSED: If check errors, default to blocking listing
    console.error("Safety gating exception encountered (failing closed):", error);
    const failClosedResult: SafetyGatingResult = {
      safe: false,
      ruleApplied: "fail_closed_exception",
      reason: error instanceof Error ? error.message : "Internal safety gating evaluation failure",
      rejectionMessage: "This item wasn't listed — safety gating evaluation encountered an error and failed closed.",
    };
    try {
      await recordAuditLog(db, input, failClosedResult, userObjId);
    } catch (auditErr) {
      console.error("Failed to write audit log:", auditErr);
    }
    return failClosedResult;
  }
}

async function recordAuditLog(
  db: Db,
  input: SafetyGatingInput,
  result: SafetyGatingResult,
  userObjId: any
) {
  await db.collection("auditLogs").insertOne({
    entityType: "SurplusListing",
    entityId: input.inventoryItem._id,
    action: "safety_gate_evaluation",
    ruleApplied: result.ruleApplied,
    status: result.safe ? "verified_safe" : "rejected",
    reason: result.reason || result.rejectionMessage,
    performedBy: userObjId,
    details: {
      category: input.inventoryItem.category,
      quantity: input.quantity,
      unit: input.inventoryItem.unit,
      pickupWindow: input.pickupWindow,
    },
    createdAt: new Date(),
  });
}
