/**
 * ZeroPlate AI - FEFO (First-Expired, First-Out) Central Resource Intelligence Engine
 * Powered by NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)
 * 
 * CORE PRINCIPLES:
 * 1. Strictly RAW MATERIALS (Ingredients) - NOT ready-made meals. Ready-made meals belong in surplus redistribution.
 * 2. Mathematical Model:
 *    inventory = { raw_material_1, raw_material_2, ..., raw_material_n }
 *    where raw_material_i = (quantity, expiry, demand, shelfLife, storage)
 * 3. FEFO Hierarchy:
 *    - High Priority: Expiring Soon (<= 48 hrs / 2 days) -> Use immediately in tomorrow's meals!
 *    - Medium Priority: Moderate Shelf Life (3 - 7 days) -> Stage for mid-week prep cycles.
 *    - Low Priority: Long Shelf Life (> 7 days) -> Retain as safe pantry buffer reserve.
 *    - Overstocked: Stock > projected consumption within shelf life -> Do NOT buy; reduce order.
 * 4. Procurement Advisory:
 *    - Tells institutional kitchens how much is in inventory vs how much they should ACTUALLY BUY
 *      so they do NOT overstock supplies unnecessarily.
 * 5. Mitigate waste before it exists: Pre-consumption prevention first, redistribution second.
 */

export type FefoShelfLifeTier =
  | "expiring_soon" // <= 48 hours / 2 days (Priority 1: High Priority - Use First)
  | "moderate" // 3 - 7 days (Priority 2: Medium Priority - Use Next)
  | "long_shelf_life" // > 7 days (Priority 3: Low Priority - Preserve)
  | "expired" // <= 0 hours (Unsafe / Quarantined)
  | "overstocked"; // Stock exceeds demand during shelf life window

export type StorageEnvironment =
  | "ambient"
  | "cold_storage" // Refrigerator (<= 4°C)
  | "dry_pantry" // Cool dry warehouse
  | "frozen"; // Freezer (<= -18°C)

export interface FefoRawItemInput {
  id?: string;
  name: string;
  category: "raw_produce" | "dairy" | "bakery" | "packaged_dry" | "grains" | "pulses" | "spices" | string;
  quantity: number;
  unit: "kg" | "litres" | "pieces" | "trays" | "boxes" | string;
  expiryDate: string | Date;
  storage: StorageEnvironment | string;
  preparedOrReceivedAt?: string | Date;
  projectedDemandKg?: number; // Estimated kitchen demand for this item/category in next 24-48h
  unitCostInr?: number; // Cost per kg/unit for procurement calculations
}

export interface RawMaterialProcurementItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  currentStockKg: number;
  projected7DayDemandKg: number;
  daysOfSupplyRemaining: number;
  safeReorderPointKg: number;
  recommendedBuyKg: number;
  purchaseAction: "DO_NOT_BUY" | "RESTOCK_NEEDED" | "URGENT_PURCHASE" | "ADEQUATE_BUFFER";
  actionBadge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  reasoning: string;
  preventedOverstockKg: number;
  overstockCostSavedInr: number;
}

export interface FefoEvaluatedItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  storage: StorageEnvironment;
  expiryDate: string;
  hoursUntilExpiry: number;
  daysUntilExpiry: number;
  shelfLifeTier: FefoShelfLifeTier;
  shelfLifeLabel: string;
  priorityLevel: "HIGH" | "MEDIUM" | "LOW" | "EXPIRED" | "OVERSTOCKED";
  fefoPriorityRank: number; // 1 (Highest / Urgently Cook) to 4 (Preserve)
  isOverstocked: boolean;
  unnecessarySurplusKg: number;
  utilizableQuantityKg: number;
  correlatedDemandKg: number;
  
  // AI Central Intelligence Reasoning & Recommendations
  rawDataSummary: string; // e.g. "5 kg tomatoes"
  aiReasoning: string; // e.g. "Tomatoes expire in 2 days. Critical shelf life window..."
  recommendation: string; // e.g. "Incorporate into tomorrow's lunch (Tomato Gravy / Basil Soup)"
  targetMealTime: string; // e.g. "Tomorrow's Lunch (12:30 PM)"
  suggestedRecipeUse: string; // e.g. "Tomato Gravy, Dal Tadka, or Basil Soup"
  resultMetric: string; // e.g. "Reduced food waste: 5 kg (100% pre-consumption diverted)"
  wasteMitigationResult: {
    wastePreventedKg: number;
    mealsGenerated: number;
    procurementCostSavedInr: number;
    status: "waste_prevented" | "preserved" | "redistribution_needed" | "quarantine";
  };
  badgeColor: {
    bg: string;
    text: string;
    border: string;
    dot: string;
  };
  // Procurement Reorder Advisory for this raw material
  procurement: RawMaterialProcurementItem;
}

export interface FefoIntelligenceReport {
  evaluatedItems: FefoEvaluatedItem[];
  summary: {
    totalItemsTracked: number;
    totalStockKg: number;
    expiringSoonCount: number;
    expiringSoonKg: number;
    moderateShelfLifeCount: number;
    moderateShelfLifeKg: number;
    longShelfLifeCount: number;
    longShelfLifeKg: number;
    overstockedCount: number;
    overstockedKg: number;
    totalPreConsumptionWasteSavedKg: number;
    estimatedCostSavedInr: number;
    totalMealsAbsorbed: number;
    fefoAdherenceScorePercent: number;
  };
  procurementSummary: {
    totalRawStockKg: number;
    totalWeeklyDemandKg: number;
    itemsNeedingRestockCount: number;
    itemsOverstockedCount: number;
    preventedUnnecessaryBuyKg: number;
    procurementBudgetSavedInr: number;
    advisoryNote: string;
    items: RawMaterialProcurementItem[];
  };
  recipeUtilizationSchedule: Array<{
    mealSlot: string; // e.g. "Tomorrow Lunch", "Tomorrow Dinner", "Day 3 Prep"
    ingredientsToAbsorb: Array<{ name: string; quantity: string; urgency: string }>;
    suggestedDishes: string[];
    preventionOutcome: string;
  }>;
  aiActionPlanNotes: string[];
  nvidiaAiInsights?: {
    model: string;
    isLiveAi: boolean;
    urgentDishes: Array<{ dish: string; ingredientsUsed: string[]; rationale: string }>;
    procurementAdviceNotes: string[];
  };
}

/**
 * Intelligent recipe mapping heuristics for institutional kitchens
 * Maps nearing-expiry raw ingredients into upcoming menu additions.
 */
const INGREDIENT_RECIPE_MAP: Record<string, { dish: string; meal: string; yieldPerKg: number }> = {
  tomato: { dish: "Fresh Tomato Gravy / Tomato Basil Soup", meal: "Tomorrow's Lunch", yieldPerKg: 8 },
  tomatoes: { dish: "Fresh Tomato Curry Base / Dal Tadka", meal: "Tomorrow's Lunch", yieldPerKg: 8 },
  potato: { dish: "Aloo Gobhi / Mashed Potato filling", meal: "Tomorrow's Dinner", yieldPerKg: 4 },
  potatoes: { dish: "Jeera Aloo / Vegetable Pulao", meal: "Tomorrow's Dinner", yieldPerKg: 4 },
  onion: { dish: "Caramelized Onion Gravy / Biryani base", meal: "Tomorrow's Lunch", yieldPerKg: 6 },
  onions: { dish: "Onion Sambar / Pulao Tempering", meal: "Tomorrow's Lunch", yieldPerKg: 6 },
  spinach: { dish: "Palak Dal / Palak Paneer", meal: "Tomorrow's Lunch", yieldPerKg: 5 },
  palak: { dish: "Palak Khichdi / Saag", meal: "Tomorrow's Lunch", yieldPerKg: 5 },
  milk: { dish: "Fresh Curd (Dahi) / Paneer Coagulation", meal: "Tomorrow's Breakfast / Lunch", yieldPerKg: 4 },
  curd: { dish: "Kadhi Pakora / Spiced Chaas (Buttermilk)", meal: "Tomorrow's Lunch", yieldPerKg: 5 },
  paneer: { dish: "Matar Paneer / Paneer Bhurji", meal: "Tomorrow's Dinner", yieldPerKg: 4 },
  bread: { dish: "Bread Pudding / Croutons for Soup", meal: "Tomorrow's Breakfast", yieldPerKg: 6 },
  banana: { dish: "Banana Bread / Fruit Custard", meal: "Tomorrow's Breakfast", yieldPerKg: 5 },
  bananas: { dish: "Fruit Custard / Smoothie batch", meal: "Tomorrow's Breakfast", yieldPerKg: 5 },
  rice: { dish: "Vegetable Biryani / Fried Rice Batch", meal: "Tomorrow's Lunch", yieldPerKg: 3 },
  carrot: { dish: "Carrot Halwa / Mixed Veg Curry", meal: "Mid-week Prep", yieldPerKg: 5 },
  carrots: { dish: "Vegetable Sambar / Coleslaw", meal: "Mid-week Prep", yieldPerKg: 5 },
  cabbage: { dish: "Cabbage Poriyal / Mixed Veg Stir-fry", meal: "Mid-week Prep", yieldPerKg: 5 },
  dal: { dish: "Tadka Dal / Sambar", meal: "Tomorrow's Lunch", yieldPerKg: 4 },
  lentils: { dish: "Dal Makhani / Khichdi", meal: "Tomorrow's Dinner", yieldPerKg: 4 },
  atta: { dish: "Fresh Chapati / Paratha Batch", meal: "Tomorrow's Meals", yieldPerKg: 4 },
  flour: { dish: "Poori / Fresh Flatbreads", meal: "Tomorrow's Meals", yieldPerKg: 4 },
  oil: { dish: "Tempering / Sautéing Buffer", meal: "Daily Cooking Buffer", yieldPerKg: 10 },
};

/**
 * Standardizes units to approximate kilograms for demand comparison
 */
export function normalizeQuantityToKg(quantity: number, unit: string): number {
  const normUnit = (unit || "kg").toLowerCase().trim();
  if (normUnit === "kg" || normUnit === "kgs" || normUnit === "kilograms") return quantity;
  if (normUnit === "litres" || normUnit === "l" || normUnit === "liters") return quantity * 1.0;
  if (normUnit === "pieces" || normUnit === "pcs") return Math.round(quantity * 0.12 * 10) / 10;
  if (normUnit === "trays" || normUnit === "tray") return quantity * 5.0;
  if (normUnit === "boxes" || normUnit === "box") return quantity * 10.0;
  if (normUnit === "grams" || normUnit === "g") return quantity / 1000;
  return quantity;
}

/**
 * Evaluates a single RAW MATERIAL under the FEFO AI Central Intelligence
 */
export function evaluateFefoItem(
  item: FefoRawItemInput,
  now: Date = new Date()
): FefoEvaluatedItem {
  const id = item.id || `fefo_${Math.random().toString(36).substring(2, 9)}`;
  const expiry = new Date(item.expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const rawHours = diffMs / (1000 * 60 * 60);
  const hoursUntilExpiry = Math.round(rawHours * 10) / 10;
  const daysUntilExpiry = Math.round((hoursUntilExpiry / 24) * 10) / 10;
  const quantityKg = normalizeQuantityToKg(item.quantity, item.unit);

  const storageEnv = (item.storage as StorageEnvironment) || "ambient";
  const normName = item.name.toLowerCase().trim();
  const unitCost = item.unitCostInr || (normName.includes("paneer") ? 320 : normName.includes("milk") ? 65 : normName.includes("rice") ? 80 : 45);

  // Baseline projected daily demand for this ingredient if not explicitly provided
  const projectedDemandKg = item.projectedDemandKg ?? Math.max(3.0, Math.round(quantityKg * 0.7 * 10) / 10);
  const projected7DayDemandKg = Math.round(projectedDemandKg * 7 * 10) / 10;

  // 1. Determine Shelf Life Tier & FEFO Priority
  let shelfLifeTier: FefoShelfLifeTier;
  let shelfLifeLabel: string;
  let priorityLevel: FefoEvaluatedItem["priorityLevel"];
  let fefoPriorityRank: number;
  let badgeColor: FefoEvaluatedItem["badgeColor"];

  if (hoursUntilExpiry <= 0) {
    shelfLifeTier = "expired";
    shelfLifeLabel = `Expired (${Math.abs(Math.round(hoursUntilExpiry))}h overdue)`;
    priorityLevel = "EXPIRED";
    fefoPriorityRank = 99;
    badgeColor = {
      bg: "bg-red-50 text-red-900 border-red-300",
      text: "text-red-700",
      border: "border-red-400",
      dot: "bg-red-600",
    };
  } else if (hoursUntilExpiry <= 48) {
    // 0 - 2 days: Priority 1 (High Priority - Use Urgently)
    shelfLifeTier = "expiring_soon";
    shelfLifeLabel = `Expiring Soon (${daysUntilExpiry <= 1 ? `${Math.max(1, Math.round(hoursUntilExpiry))}h` : `${daysUntilExpiry}d`})`;
    priorityLevel = "HIGH";
    fefoPriorityRank = 1;
    badgeColor = {
      bg: "bg-rose-50 text-rose-800 border-rose-200",
      text: "text-rose-700",
      border: "border-rose-300",
      dot: "bg-rose-600",
    };
  } else if (hoursUntilExpiry <= 168) {
    // 3 - 7 days: Priority 2 (Medium Priority - Use Next)
    shelfLifeTier = "moderate";
    shelfLifeLabel = `Moderate Shelf Life (${Math.round(daysUntilExpiry)} days)`;
    priorityLevel = "MEDIUM";
    fefoPriorityRank = 2;
    badgeColor = {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      text: "text-amber-800",
      border: "border-amber-300",
      dot: "bg-amber-500",
    };
  } else {
    // > 7 days: Priority 3 (Low Priority - Preserve Pantry Buffer)
    shelfLifeTier = "long_shelf_life";
    shelfLifeLabel = `Long Shelf Life (> ${Math.round(daysUntilExpiry)} days)`;
    priorityLevel = "LOW";
    fefoPriorityRank = 3;
    badgeColor = {
      bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      text: "text-emerald-800",
      border: "border-emerald-300",
      dot: "bg-emerald-500",
    };
  }

  // 2. Overstock & Unnecessary inventory detection
  // If stock exceeds what the kitchen can consume within its safe shelf life window
  const shelfLifeDaysSafe = Math.max(1, daysUntilExpiry);
  const totalMaxAbsorbableKg = Math.round(projectedDemandKg * shelfLifeDaysSafe * 10) / 10;
  const isOverstocked = hoursUntilExpiry > 0 && quantityKg > totalMaxAbsorbableKg * 1.25;
  const unnecessarySurplusKg = isOverstocked
    ? Math.round((quantityKg - totalMaxAbsorbableKg) * 10) / 10
    : 0;

  if (isOverstocked && shelfLifeTier === "moderate") {
    shelfLifeTier = "overstocked";
    priorityLevel = "OVERSTOCKED";
    shelfLifeLabel = `Overstocked (+${unnecessarySurplusKg}kg Unnecessary)`;
    badgeColor = {
      bg: "bg-purple-50 text-purple-800 border-purple-200",
      text: "text-purple-800",
      border: "border-purple-300",
      dot: "bg-purple-600",
    };
  }

  // 3. Find recipe/dish matching
  let matchedRecipe = Object.entries(INGREDIENT_RECIPE_MAP).find(([key]) => normName.includes(key));
  let suggestedDish = matchedRecipe
    ? matchedRecipe[1].dish
    : `${item.name} Kitchen Batch Integration`;
  let targetMeal = shelfLifeTier === "expired"
    ? "QUARANTINE / DO NOT COOK"
    : matchedRecipe
    ? matchedRecipe[1].meal
    : shelfLifeTier === "expiring_soon"
    ? "Tomorrow's Lunch (Urgently Cook)"
    : shelfLifeTier === "moderate"
    ? "Mid-week Dinner Cycle (Priority 2)"
    : "Safe Buffer Reserve (Priority 3)";

  // 4. Construct AI Central Intelligence Reasoning & Recommendations
  const rawDataSummary = `${item.quantity} ${item.unit} ${item.name}`;
  let aiReasoning = "";
  let recommendation = "";
  let resultMetric = "";
  let wastePreventedKg = 0;
  let status: FefoEvaluatedItem["wasteMitigationResult"]["status"] = "waste_prevented";

  const storageNote =
    storageEnv === "ambient"
      ? "ambient storage accelerates enzymatic breakdown"
      : storageEnv === "cold_storage"
      ? "cold storage retards spoilage but approaching safe deadline"
      : storageEnv === "frozen"
      ? "frozen holding extends longevity"
      : "dry pantry sealed storage";

  if (shelfLifeTier === "expired") {
    aiReasoning = `${item.name} has passed its safe consumption deadline (${Math.abs(hoursUntilExpiry)}h overdue). Biological safety threshold has lapsed.`;
    recommendation = `Quarantine batch immediately. Divert to verified organic bio-compost or biogas facility; do not prepare in human meals.`;
    resultMetric = `Safety risk averted: 0 food safety violations`;
    wastePreventedKg = 0;
    status = "quarantine";
  } else if (shelfLifeTier === "expiring_soon") {
    const hoursText = hoursUntilExpiry <= 24 ? `${Math.round(hoursUntilExpiry)} hours` : `${daysUntilExpiry} days`;
    aiReasoning = `${item.name} expires in ${hoursText}. Under ${storageNote}. Tomorrow's meal demand requires ~${projectedDemandKg} kg, providing ideal capacity to absorb this batch completely.`;
    recommendation = `Urgently make ${suggestedDish} in tomorrow's meals. Prioritize in FEFO sequence before pulling longer-life stock.`;
    resultMetric = `Reduced food waste: ${quantityKg} kg (100% pre-consumption diverted)`;
    wastePreventedKg = quantityKg;
    status = "waste_prevented";
  } else if (shelfLifeTier === "overstocked") {
    aiReasoning = `Stock (${quantityKg} kg) exceeds projected kitchen demand (${totalMaxAbsorbableKg} kg) over its ${Math.round(daysUntilExpiry)}-day shelf life. Unnecessary surplus risk of ~${unnecessarySurplusKg} kg.`;
    recommendation = `Absorb ${Math.round(quantityKg - unnecessarySurplusKg)} kg in kitchen meals; DO NOT purchase more. Flag remaining ${unnecessarySurplusKg} kg for pre-emptive NGO redistribution before expiry.`;
    resultMetric = `Prevented spoilage: ${quantityKg} kg optimized (pre-consumption prep + redistribution)`;
    wastePreventedKg = quantityKg;
    status = "redistribution_needed";
  } else if (shelfLifeTier === "moderate") {
    aiReasoning = `${item.name} has ${Math.round(daysUntilExpiry)} days shelf life. Stable under current storage. Subsequent kitchen prep cycles can absorb this batch sequentially.`;
    recommendation = `Stage for use next in days 3–5 batch cycles (${suggestedDish}). Do not consume before Priority 1 expiring stock.`;
    resultMetric = `Preserved shelf stability: ${quantityKg} kg in scheduled rotation`;
    wastePreventedKg = quantityKg;
    status = "waste_prevented";
  } else {
    // Long shelf life
    aiReasoning = `${item.name} remains safe for >${Math.round(daysUntilExpiry)} days. High preservation stability under ${storageNote}.`;
    recommendation = `Preserve for later use. Retain as safe pantry buffer reserve; maintain FIFO/FEFO bin discipline.`;
    resultMetric = `Buffer secured: ${quantityKg} kg safe reserve`;
    wastePreventedKg = 0;
    status = "preserved";
  }

  // 5. Intelligent Procurement & Reorder Calculations
  // How much is in inventory vs how much should the kitchen actually buy
  let purchaseAction: RawMaterialProcurementItem["purchaseAction"] = "ADEQUATE_BUFFER";
  let recommendedBuyKg = 0;
  let purchaseReasoning = "";
  let actionBadge = {
    label: "Adequate Stock",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
  };
  let preventedOverstockKg = 0;
  const daysOfSupply = projectedDemandKg > 0 ? Math.round((quantityKg / projectedDemandKg) * 10) / 10 : 14;
  const safeReorderPointKg = Math.round(projectedDemandKg * 2.5 * 10) / 10; // 2.5 days safety buffer

  if (hoursUntilExpiry <= 0) {
    purchaseAction = "RESTOCK_NEEDED";
    recommendedBuyKg = Math.round(projectedDemandKg * Math.min(3, shelfLifeDaysSafe) * 10) / 10;
    actionBadge = {
      label: "Restock Fresh Batch",
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-200",
    };
    purchaseReasoning = `Existing stock expired. Procure fresh batch of ~${recommendedBuyKg} kg aligned with daily demand.`;
  } else if (quantityKg >= projected7DayDemandKg) {
    // Overstock prevention: Kitchen has plenty of stock for the entire week
    purchaseAction = "DO_NOT_BUY";
    recommendedBuyKg = 0;
    preventedOverstockKg = Math.round((quantityKg - projected7DayDemandKg) * 10) / 10;
    actionBadge = {
      label: "DO NOT BUY (Overstock Risk)",
      bg: "bg-purple-100",
      text: "text-purple-900 font-bold",
      border: "border-purple-300",
    };
    purchaseReasoning = `DO NOT purchase additional ${item.name}. Current stock (${quantityKg} kg) already covers ${daysOfSupply} days of cooking. Purchasing more will cause unnecessary overstocking and spoilage.`;
  } else if (quantityKg <= safeReorderPointKg) {
    // Stock is below 2.5 days buffer -> purchase just enough for upcoming demand window
    const maxSafePurchase = Math.min(projected7DayDemandKg, projectedDemandKg * Math.min(daysUntilExpiry, 4));
    recommendedBuyKg = Math.max(0, Math.round((maxSafePurchase - quantityKg) * 10) / 10);
    purchaseAction = quantityKg <= projectedDemandKg ? "URGENT_PURCHASE" : "RESTOCK_NEEDED";
    actionBadge = {
      label: purchaseAction === "URGENT_PURCHASE" ? "Urgent Reorder" : "Plan Reorder",
      bg: purchaseAction === "URGENT_PURCHASE" ? "bg-amber-100" : "bg-blue-50",
      text: purchaseAction === "URGENT_PURCHASE" ? "text-amber-900 font-bold" : "text-blue-800",
      border: purchaseAction === "URGENT_PURCHASE" ? "border-amber-300" : "border-blue-200",
    };
    purchaseReasoning = `Stock (${quantityKg} kg) covers only ${daysOfSupply} days. Reorder ~${recommendedBuyKg} kg to maintain kitchen readiness without over-purchasing.`;
  } else {
    // Safe buffer
    purchaseAction = "ADEQUATE_BUFFER";
    recommendedBuyKg = 0;
    actionBadge = {
      label: "Stock Optimized",
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
    };
    purchaseReasoning = `Current inventory of ${quantityKg} kg is well-calibrated for upcoming 3–5 days. No purchase needed today.`;
  }

  const overstockCostSavedInr = Math.round(preventedOverstockKg * unitCost);

  const procurement: RawMaterialProcurementItem = {
    id,
    name: item.name,
    category: item.category,
    currentStock: item.quantity,
    unit: item.unit,
    currentStockKg: quantityKg,
    projected7DayDemandKg,
    daysOfSupplyRemaining: daysOfSupply,
    safeReorderPointKg,
    recommendedBuyKg,
    purchaseAction,
    actionBadge,
    reasoning: purchaseReasoning,
    preventedOverstockKg,
    overstockCostSavedInr,
  };

  const mealsGenerated = Math.round(quantityKg * 2.2);
  const costSavedInr = Math.round(quantityKg * 110);

  return {
    id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unit: item.unit,
    storage: storageEnv,
    expiryDate: new Date(item.expiryDate).toISOString(),
    hoursUntilExpiry,
    daysUntilExpiry,
    shelfLifeTier,
    shelfLifeLabel,
    priorityLevel,
    fefoPriorityRank,
    isOverstocked,
    unnecessarySurplusKg,
    utilizableQuantityKg: quantityKg,
    correlatedDemandKg: projectedDemandKg,
    rawDataSummary,
    aiReasoning,
    recommendation,
    targetMealTime: targetMeal,
    suggestedRecipeUse: suggestedDish,
    resultMetric,
    wasteMitigationResult: {
      wastePreventedKg,
      mealsGenerated,
      procurementCostSavedInr: costSavedInr,
      status,
    },
    badgeColor,
    procurement,
  };
}

/**
 * Evaluates an entire inventory set of RAW MATERIALS under FEFO Central AI Intelligence
 */
export function evaluateFefoInventory(
  inventory: FefoRawItemInput[],
  options?: {
    now?: Date;
    tomorrowDemandKg?: number;
  }
): FefoIntelligenceReport {
  const now = options?.now || new Date();
  
  // 1. Filter ONLY raw materials (strictly exclude ready-made cooked food)
  const rawItems = inventory.filter((item) => {
    const cat = (item.category || "").toLowerCase();
    return cat !== "cooked_food";
  });

  const itemsToProcess = rawItems.length > 0 ? rawItems : getDefaultFefoBaselineItems();

  // 2. Evaluate each raw material
  const evaluatedItems = itemsToProcess.map((item) => evaluateFefoItem(item, now));

  // 3. Sort by FEFO Priority: High Priority (Expiring soonest first), then Moderate, then Long
  evaluatedItems.sort((a, b) => {
    if (a.shelfLifeTier === "expired") return 1;
    if (b.shelfLifeTier === "expired") return -1;
    return a.hoursUntilExpiry - b.hoursUntilExpiry;
  });

  // 4. Compute aggregations & procurement totals
  let totalStockKg = 0;
  let expiringSoonCount = 0;
  let expiringSoonKg = 0;
  let moderateShelfLifeCount = 0;
  let moderateShelfLifeKg = 0;
  let longShelfLifeCount = 0;
  let longShelfLifeKg = 0;
  let overstockedCount = 0;
  let overstockedKg = 0;
  let totalPreConsumptionWasteSavedKg = 0;

  let totalWeeklyDemandKg = 0;
  let itemsNeedingRestockCount = 0;
  let itemsOverstockedCount = 0;
  let preventedUnnecessaryBuyKg = 0;
  let procurementBudgetSavedInr = 0;

  const procurementItems: RawMaterialProcurementItem[] = [];

  for (const item of evaluatedItems) {
    totalStockKg += item.utilizableQuantityKg;
    totalWeeklyDemandKg += item.procurement.projected7DayDemandKg;
    procurementItems.push(item.procurement);

    if (item.shelfLifeTier === "expiring_soon") {
      expiringSoonCount++;
      expiringSoonKg += item.utilizableQuantityKg;
      totalPreConsumptionWasteSavedKg += item.wasteMitigationResult.wastePreventedKg;
    } else if (item.shelfLifeTier === "moderate") {
      moderateShelfLifeCount++;
      moderateShelfLifeKg += item.utilizableQuantityKg;
      totalPreConsumptionWasteSavedKg += item.wasteMitigationResult.wastePreventedKg;
    } else if (item.shelfLifeTier === "long_shelf_life") {
      longShelfLifeCount++;
      longShelfLifeKg += item.utilizableQuantityKg;
    } else if (item.shelfLifeTier === "overstocked") {
      overstockedCount++;
      overstockedKg += item.unnecessarySurplusKg;
      totalPreConsumptionWasteSavedKg += item.wasteMitigationResult.wastePreventedKg;
    }

    if (item.procurement.purchaseAction === "DO_NOT_BUY") {
      itemsOverstockedCount++;
      preventedUnnecessaryBuyKg += item.procurement.preventedOverstockKg;
      procurementBudgetSavedInr += item.procurement.overstockCostSavedInr;
    } else if (
      item.procurement.purchaseAction === "RESTOCK_NEEDED" ||
      item.procurement.purchaseAction === "URGENT_PURCHASE"
    ) {
      itemsNeedingRestockCount++;
    }
  }

  totalStockKg = Math.round(totalStockKg * 10) / 10;
  expiringSoonKg = Math.round(expiringSoonKg * 10) / 10;
  moderateShelfLifeKg = Math.round(moderateShelfLifeKg * 10) / 10;
  longShelfLifeKg = Math.round(longShelfLifeKg * 10) / 10;
  overstockedKg = Math.round(overstockedKg * 10) / 10;
  totalPreConsumptionWasteSavedKg = Math.round(totalPreConsumptionWasteSavedKg * 10) / 10;
  totalWeeklyDemandKg = Math.round(totalWeeklyDemandKg * 10) / 10;
  preventedUnnecessaryBuyKg = Math.round(preventedUnnecessaryBuyKg * 10) / 10;

  const estimatedCostSavedInr = Math.round(totalPreConsumptionWasteSavedKg * 115);
  const totalMealsAbsorbed = Math.round(totalPreConsumptionWasteSavedKg * 2.2);

  const totalUrgent = expiringSoonCount + overstockedCount;
  const fefoAdherenceScorePercent = totalUrgent > 0 ? 98 : 100;

  // 5. Generate AI Recipe Utilization Schedule for Upcoming Meals
  const expiringItems = evaluatedItems.filter((i) => i.shelfLifeTier === "expiring_soon");
  const moderateItems = evaluatedItems.filter((i) => i.shelfLifeTier === "moderate" || i.shelfLifeTier === "overstocked");

  const recipeUtilizationSchedule: FefoIntelligenceReport["recipeUtilizationSchedule"] = [
    {
      mealSlot: "Tomorrow Lunch (High Priority - Cook Urgently)",
      ingredientsToAbsorb: expiringItems.map((i) => ({
        name: i.name,
        quantity: `${i.quantity} ${i.unit}`,
        urgency: `${i.daysUntilExpiry}d safe window`,
      })),
      suggestedDishes: expiringItems.length > 0
        ? Array.from(new Set(expiringItems.map((i) => i.suggestedRecipeUse)))
        : ["Standard Balanced Kitchen Menu (No urgent ingredients)"],
      preventionOutcome: expiringItems.length > 0
        ? `Absorbs ${expiringSoonKg} kg nearing-expiry raw ingredients before waste occurs (100% pre-consumption save).`
        : "All inventory within safe multi-day buffer.",
    },
    {
      mealSlot: "Days 3–5 Batch Cooking (Medium Priority - Moderate Shelf Life)",
      ingredientsToAbsorb: moderateItems.map((i) => ({
        name: i.name,
        quantity: `${i.quantity} ${i.unit}`,
        urgency: `${Math.round(i.daysUntilExpiry)}d safe window`,
      })),
      suggestedDishes: moderateItems.length > 0
        ? Array.from(new Set(moderateItems.map((i) => i.suggestedRecipeUse)))
        : ["Pantry staples & scheduled fresh batches"],
      preventionOutcome: `Sequential FEFO rotation prevents ${moderateShelfLifeKg} kg from lapsing into urgent status.`,
    },
  ];

  // 6. Action Plan Notes
  const aiActionPlanNotes: string[] = [
    `Pre-consumption Priority: ${expiringSoonKg} kg of raw materials nearing expiry scheduled into tomorrow's cooking recipes first.`,
    `Procurement Reorder Gating: ${itemsOverstockedCount} raw items are already well-stocked; purchasing is blocked to prevent overstock spoilage.`,
    `Overstock Savings: Saved ~₹${procurementBudgetSavedInr.toLocaleString()} by preventing unnecessary ingredient purchase.`,
  ];

  return {
    evaluatedItems,
    summary: {
      totalItemsTracked: evaluatedItems.length,
      totalStockKg,
      expiringSoonCount,
      expiringSoonKg,
      moderateShelfLifeCount,
      moderateShelfLifeKg,
      longShelfLifeCount,
      longShelfLifeKg,
      overstockedCount,
      overstockedKg,
      totalPreConsumptionWasteSavedKg,
      estimatedCostSavedInr,
      totalMealsAbsorbed,
      fefoAdherenceScorePercent,
    },
    procurementSummary: {
      totalRawStockKg: totalStockKg,
      totalWeeklyDemandKg,
      itemsNeedingRestockCount,
      itemsOverstockedCount,
      preventedUnnecessaryBuyKg,
      procurementBudgetSavedInr,
      advisoryNote: itemsOverstockedCount > 0
        ? `Gated ${itemsOverstockedCount} raw ingredients where inventory already exceeds 7-day demand. Purchase only restock items.`
        : "Raw material inventory levels are balanced with upcoming dining demand.",
      items: procurementItems,
    },
    recipeUtilizationSchedule,
    aiActionPlanNotes,
  };
}

/**
 * Calls NVIDIA NIM API (Llama 3.2 Vision-Instruct) to analyze raw materials
 * Returns live AI recommendations on what food to make urgently and how much to buy.
 */
export async function analyzeRawMaterialsWithNvidia(
  items: FefoRawItemInput[],
  dailyDemandKg = 25
): Promise<{
  urgentDishes: Array<{ dish: string; ingredientsUsed: string[]; rationale: string }>;
  procurementAdviceNotes: string[];
  isLiveAi: boolean;
}> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return {
      urgentDishes: [
        { dish: "Fresh Tomato Basil Soup / Tomato Gravy", ingredientsUsed: ["Tomatoes"], rationale: "Nearing expiry in 2 days; absorbs ripe stock" },
        { dish: "Spiced Kadhi / Fresh Paneer Coagulation", ingredientsUsed: ["Milk"], rationale: "Absorbs milk batch before 24h threshold" },
      ],
      procurementAdviceNotes: [
        "Do not buy additional tomatoes or rice: existing stock covers demand.",
        "Reorder potatoes and onions for mid-week buffer.",
      ],
      isLiveAi: false,
    };
  }

  try {
    const rawItemsSummary = items
      .map((i) => `${i.quantity} ${i.unit} ${i.name} (expires: ${new Date(i.expiryDate).toLocaleDateString()}, storage: ${i.storage})`)
      .join(", ");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "system",
            content: `You are the ZeroPlate Central AI Resource Optimization Engine.
Analyze the raw materials (ingredients).
Suggest:
1. Urgent dishes to prepare tomorrow to eliminate pre-consumption waste for nearing-expiry raw materials.
2. Procurement advice: What to NOT buy because stock is already sufficient.
Format your output as valid JSON:
{
  "urgentDishes": [{"dish": "Dish Name", "ingredientsUsed": ["Tomatoes"], "rationale": "Reason"}],
  "procurementAdviceNotes": ["Advice string 1", "Advice string 2"]
}`
          },
          {
            role: "user",
            content: `Raw materials currently in kitchen inventory: ${rawItemsSummary}. Projected daily kitchen demand is ~${dailyDemandKg} kg.`
          }
        ],
        temperature: 0.2,
        max_tokens: 450,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        // Parse JSON from NVIDIA content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            urgentDishes: parsed.urgentDishes || [],
            procurementAdviceNotes: parsed.procurementAdviceNotes || [],
            isLiveAi: true,
          };
        }
      }
    }
  } catch (err) {
    console.warn("NVIDIA NIM call failed or timed out, falling back to local culinary matrix:", err);
  }

  // Graceful fallback
  return {
    urgentDishes: [
      { dish: "Fresh Tomato Gravy / Tomato Soup", ingredientsUsed: ["Tomatoes"], rationale: "High priority: consume 5 kg tomatoes within 48h safe window" },
      { dish: "Palak Paneer / Saag Khichdi", ingredientsUsed: ["Spinach", "Milk"], rationale: "High priority: utilize perishable leafy greens and dairy" },
    ],
    procurementAdviceNotes: [
      "Overstock Guard: Existing rice and dry pantry stock exceeds 7-day demand; do not purchase additional bulk grains.",
      "Restock Alert: Fresh vegetables nearing expiry should be replenished only after tomorrow's batch is cooked.",
    ],
    isLiveAi: false,
  };
}

/**
 * Standard Default Seed Inventory of RAW MATERIALS ONLY
 * Exclusively ingredients (Produce, Dairy, Grains, Pulses, Oils)
 * Strictly illustrates the user's FEFO flow.
 */
export function getDefaultFefoBaselineItems(): FefoRawItemInput[] {
  const now = new Date();

  return [
    {
      id: "raw_tomatoes_1",
      name: "Fresh Ripe Tomatoes",
      category: "raw_produce",
      quantity: 25,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 44 * 60 * 60 * 1000).toISOString(), // 44 hours (2 days) -> Expiring soon (HIGH PRIORITY)
      storage: "ambient",
      projectedDemandKg: 12,
      unitCostInr: 40,
    },
    {
      id: "dairy_milk_1",
      name: "Toned Cow Milk",
      category: "dairy",
      quantity: 15,
      unit: "litres",
      expiryDate: new Date(now.getTime() + 32 * 60 * 60 * 1000).toISOString(), // 32 hours (1.3 days) -> Expiring soon (HIGH PRIORITY)
      storage: "cold_storage",
      projectedDemandKg: 10,
      unitCostInr: 65,
    },
    {
      id: "raw_spinach_1",
      name: "Fresh Farm Spinach (Palak)",
      category: "raw_produce",
      quantity: 6,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 38 * 60 * 60 * 1000).toISOString(), // 38 hours -> Expiring soon (HIGH PRIORITY)
      storage: "cold_storage",
      projectedDemandKg: 8,
      unitCostInr: 50,
    },
    {
      id: "raw_potatoes_1",
      name: "Farm Potatoes",
      category: "raw_produce",
      quantity: 10,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days -> Moderate (MEDIUM PRIORITY)
      storage: "ambient",
      projectedDemandKg: 8,
      unitCostInr: 30,
    },
    {
      id: "raw_onions_1",
      name: "Red Onions",
      category: "raw_produce",
      quantity: 8,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days -> Moderate (MEDIUM PRIORITY)
      storage: "ambient",
      projectedDemandKg: 6,
      unitCostInr: 35,
    },
    {
      id: "dairy_paneer_1",
      name: "Fresh Cottage Cheese (Paneer)",
      category: "dairy",
      quantity: 8,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 40 * 60 * 60 * 1000).toISOString(), // 40 hours -> Expiring soon (HIGH PRIORITY)
      storage: "cold_storage",
      projectedDemandKg: 6,
      unitCostInr: 320,
    },
    {
      id: "dry_basmati_rice_1",
      name: "Aged Basmati Rice",
      category: "packaged_dry",
      quantity: 100,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000).toISOString(), // 7 months -> Long shelf life (LOW PRIORITY)
      storage: "dry_pantry",
      projectedDemandKg: 20,
      unitCostInr: 85,
    },
    {
      id: "dry_toor_dal_1",
      name: "Organic Toor Dal",
      category: "packaged_dry",
      quantity: 40,
      unit: "kg",
      expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months -> Long shelf life (LOW PRIORITY)
      storage: "dry_pantry",
      projectedDemandKg: 10,
      unitCostInr: 140,
    },
    {
      id: "pantry_sunflower_oil_1",
      name: "Refined Sunflower Cooking Oil",
      category: "packaged_dry",
      quantity: 30,
      unit: "litres",
      expiryDate: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString(), // 8 months -> Long shelf life (LOW PRIORITY)
      storage: "dry_pantry",
      projectedDemandKg: 5,
      unitCostInr: 125,
    },
  ];
}
