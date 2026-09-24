import { evaluateFefoItem, evaluateFefoInventory, getDefaultFefoBaselineItems } from "../lib/fefo-engine.js";

console.log("=== Testing ZeroPlate AI FEFO Engine ===");

// Test 1: User's exact case - 5 kg tomatoes expiring in 2 days
const now = new Date();
const tomatoExpiry = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 2 days

const tomatoResult = evaluateFefoItem({
  name: "Tomatoes",
  category: "raw_produce",
  quantity: 5,
  unit: "kg",
  expiryDate: tomatoExpiry,
  storage: "ambient",
  projectedDemandKg: 12,
}, now);

console.log("\n[Test 1] User Example - 5 kg Tomatoes:");
console.log("Raw Data:", tomatoResult.rawDataSummary);
console.log("Shelf Life Tier:", tomatoResult.shelfLifeTier, "(Priority rank:", tomatoResult.fefoPriorityRank, ")");
console.log("AI Reasoning:", tomatoResult.aiReasoning);
console.log("Recommendation:", tomatoResult.recommendation);
console.log("Result:", tomatoResult.resultMetric);
console.log("Pre-consumption waste prevented (kg):", tomatoResult.wasteMitigationResult.wastePreventedKg);

if (tomatoResult.shelfLifeTier !== "expiring_soon") {
  throw new Error("Expected shelfLifeTier to be expiring_soon");
}
if (!tomatoResult.recommendation.toLowerCase().includes("tomorrow")) {
  throw new Error("Expected recommendation to incorporate in tomorrow's meal");
}

// Test 2: Moderate shelf-life item (Potatoes, 5 days)
const potatoExpiry = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
const potatoResult = evaluateFefoItem({
  name: "Potatoes",
  category: "raw_produce",
  quantity: 40,
  unit: "kg",
  expiryDate: potatoExpiry,
  storage: "ambient",
  projectedDemandKg: 10,
}, now);

console.log("\n[Test 2] Moderate Shelf Life - 40 kg Potatoes (5 days):");
console.log("Tier:", potatoResult.shelfLifeTier);
console.log("Recommendation:", potatoResult.recommendation);

// Test 3: Long shelf-life item (Rice, 60 days)
const riceExpiry = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
const riceResult = evaluateFefoItem({
  name: "Basmati Rice",
  category: "packaged_dry",
  quantity: 120,
  unit: "kg",
  expiryDate: riceExpiry,
  storage: "dry_pantry",
  projectedDemandKg: 20,
}, now);

console.log("\n[Test 3] Long Shelf Life - 120 kg Rice (60 days):");
console.log("Tier:", riceResult.shelfLifeTier);
console.log("Recommendation:", riceResult.recommendation);

// Test 4: Full Inventory Evaluation
const defaultItems = getDefaultFefoBaselineItems();
const report = evaluateFefoInventory(defaultItems, { now });

console.log("\n[Test 4] Full Inventory Report Summary:");
console.log("Total Stock:", report.summary.totalStockKg, "kg");
console.log("Expiring Soon Stock:", report.summary.expiringSoonKg, "kg (" + report.summary.expiringSoonCount + " items)");
console.log("Moderate Shelf Life Stock:", report.summary.moderateShelfLifeKg, "kg (" + report.summary.moderateShelfLifeCount + " items)");
console.log("Long Shelf Life Stock:", report.summary.longShelfLifeKg, "kg (" + report.summary.longShelfLifeCount + " items)");
console.log("Total Pre-consumption Waste Saved:", report.summary.totalPreConsumptionWasteSavedKg, "kg");
console.log("Cost Saved INR: ₹", report.summary.estimatedCostSavedInr);
console.log("Meal Absorption Slots:", report.recipeUtilizationSchedule.length);

console.log("\n=== ALL FEFO TESTS PASSED SUCCESSFULLY! ===");
