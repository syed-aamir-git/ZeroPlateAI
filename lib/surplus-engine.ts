/**
 * ZeroPlate AI - Surplus Intelligence Engine
 * Implements deterministic urgency scoring, traffic-light classification (🔴/🟡/🟢),
 * food representation physics (Cooked vs. Raw Produce vs. Packaged), and pieces-to-plates conversion.
 */

export type UrgencyTier = "critical_red" | "urgent_yellow" | "safe_green";

export type FoodCategory =
  | "cooked_food"
  | "raw_produce"
  | "bakery"
  | "dairy"
  | "packaged_dry";

export type StorageCondition =
  | "ambient"
  | "refrigerated" // <= 5°C
  | "hot_hold" // >= 60°C
  | "frozen"; // <= -18°C

export interface SurplusEvaluationInput {
  category: FoodCategory | string;
  quantity: number;
  unit: "kg" | "pieces" | "litres" | "trays" | "boxes" | string;
  cookedOrPreparedAt?: Date | string;
  expiryDeadline: Date | string;
  storageCondition?: StorageCondition | string;
  ambientTemperatureC?: number; // e.g. 28°C
  isPerishableRaw?: boolean;
}

export interface SurplusEvaluationResult {
  urgencyScore: number; // 0 - 100
  urgencyTier: UrgencyTier;
  tierLabel: string;
  tierColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
  };
  timeRemainingHours: number;
  estimatedMeals: number;
  mealConversionAnalogy: string;
  storageSafetyAssessment: string;
  recommendedDispatchWindowHours: number;
  isHighPriorityDispatch: boolean;
}

/**
 * Standard portion conversions (Functional Blueprint Section 1 & 10)
 * Translates bulk donor quantities into meaningful human plate portions.
 */
export function calculatePiecesToPlates(
  quantity: number,
  unit: string = "pcs",
  category: FoodCategory | string = "general"
): {
  plates: number;
  analogyText: string;
  usableQuantityKg: number;
} {
  const normUnit = unit.toLowerCase().trim();
  const normCat = category.toLowerCase().trim();

  let estimatedKg = quantity;

  // Convert non-kg units to approximate kg
  if (
    normUnit === "pieces" ||
    normUnit === "pcs" ||
    normUnit === "piece" ||
    normUnit === "pc"
  ) {
    if (
      normCat.includes("meal") ||
      normCat.includes("thali") ||
      normCat.includes("box") ||
      normCat.includes("packed_meal") ||
      normCat.includes("packet")
    ) {
      const plates = Math.max(1, Math.round(quantity));
      return {
        plates,
        analogyText: `${quantity} pieces = ${plates} meal plates (1 plate/box)`,
        usableQuantityKg: Math.round(quantity * 0.4 * 10) / 10,
      };
    }
    if (normCat.includes("bakery") || normCat.includes("bread") || normCat.includes("roti") || normCat.includes("chapati")) {
      // 3 pieces per meal plate
      const plates = Math.max(1, Math.floor(quantity / 3));
      return {
        plates,
        analogyText: `${quantity} pieces ≈ ${plates} meal portions (at 3 pcs/portion)`,
        usableQuantityKg: Math.round(quantity * 0.05 * 10) / 10,
      };
    }
    // General items (fruits/cutlets/sandwiches): ~2 pieces per plate
    const plates = Math.max(1, Math.floor(quantity / 2));
    return {
      plates,
      analogyText: `${quantity} pieces ≈ ${plates} meal portions (at 2 pcs/portion)`,
      usableQuantityKg: Math.round(quantity * 0.15 * 10) / 10,
    };
  }

  if (normUnit === "litres" || normUnit === "l") {
    // 1 Litre liquid/curry/dal ≈ 4 portions (250 ml / portion)
    const plates = Math.max(1, Math.floor(quantity / 0.25));
    return {
      plates,
      analogyText: `${quantity} L liquid ≈ ${plates} meal servings (at 250 ml/serving)`,
      usableQuantityKg: quantity * 1.0,
    };
  }

  if (normUnit === "trays" || normUnit === "tray") {
    // Standard catering gastro tray ≈ 5 kg ≈ 11-12 meals
    const plates = Math.max(1, Math.floor(quantity * 11));
    return {
      plates,
      analogyText: `${quantity} catering trays ≈ ${plates} plates (at ~11 plates/tray)`,
      usableQuantityKg: quantity * 5.0,
    };
  }

  // Weight in kg based on food category
  if (normCat.includes("raw") || normCat.includes("produce") || normCat.includes("vegetable")) {
    // Raw produce has prep wastage (~15%), portion size ~250g cooked equivalent
    const usableKg = quantity * 0.85;
    const plates = Math.max(1, Math.floor(usableKg / 0.25));
    return {
      plates,
      analogyText: `${quantity} kg produce ≈ ${plates} meal portions (after prep allowance)`,
      usableQuantityKg: quantity,
    };
  }

  if (normCat.includes("dairy")) {
    // Dairy / milk / curd: ~200g serving
    const plates = Math.max(1, Math.floor(quantity / 0.2));
    return {
      plates,
      analogyText: `${quantity} kg dairy ≈ ${plates} servings (at 200g/serving)`,
      usableQuantityKg: quantity,
    };
  }

  if (normCat.includes("package") || normCat.includes("dry")) {
    // Dry grains / legumes: 1 kg raw grain yields ~3 meals
    const plates = Math.max(1, Math.floor(quantity * 2.8));
    return {
      plates,
      analogyText: `${quantity} kg dry goods ≈ ${plates} cooked meal equivalents`,
      usableQuantityKg: quantity,
    };
  }

  // Default: Cooked meal (Rice, Dal, Curries): ~450g per plate
  const plates = Math.max(1, Math.floor(quantity / 0.45));
  return {
    plates,
    analogyText: `${quantity} kg cooked food ≈ ${plates} full meal plates (at ~450g/plate)`,
    usableQuantityKg: quantity,
  };
}

/**
 * Checks if a unit denotes pieces (pcs, pieces, piece, pc)
 */
export function isPiecesUnit(unit?: string | null): boolean {
  if (!unit) return false;
  const norm = unit.toLowerCase().trim();
  return norm === "pcs" || norm === "pieces" || norm === "piece" || norm === "pc";
}

/**
 * Formats a food quantity and unit string.
 * Whenever unit is in pieces ("pcs", "pieces"), it also displays in plates:
 * e.g., "50 pcs (~25 plates)"
 */
export function formatFoodQuantity(
  quantity: number | string,
  unit: string = "kg",
  category: FoodCategory | string = "general"
): string {
  const numQty = typeof quantity === "string" ? parseFloat(quantity) || 0 : quantity;
  if (!isPiecesUnit(unit)) {
    return `${numQty} ${unit}`;
  }
  const { plates } = calculatePiecesToPlates(numQty, unit, category);
  return `${numQty} ${unit} (~${plates} plates)`;
}

/**
 * Deterministic Traffic-Light Urgency Evaluation
 * Formula: U = wT * (Time Remaining) + wStorage + wTemp
 * Thresholds:
 *  🔴 Red (Score >= 75 or hours < 2): Critical priority dispatch
 *  🟡 Yellow (Score 40 - 74 or hours 2 - 6): Urgent dispatch
 *  🟢 Green (Score < 40 or hours > 6): Safe / Standard dispatch
 */
export function evaluateSurplusUrgency(
  input: SurplusEvaluationInput
): SurplusEvaluationResult {
  const now = new Date();
  const deadline = new Date(input.expiryDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  const rawHoursRemaining = diffMs / (1000 * 60 * 60);
  const hoursRemaining = Math.max(0, Math.round(rawHoursRemaining * 10) / 10);

  const normCat = (input.category || "cooked_food").toLowerCase();
  const normStorage = (input.storageCondition || "ambient").toLowerCase();
  const ambientTemp = input.ambientTemperatureC ?? 30; // default 30°C typical Indian urban climate

  // 1. Base Urgency from Time Remaining
  let baseScore = 0;
  if (hoursRemaining <= 0) {
    baseScore = 100; // Expired
  } else if (hoursRemaining < 1.0) {
    baseScore = 95;
  } else if (hoursRemaining < 2.0) {
    baseScore = 80;
  } else if (hoursRemaining <= 4.0) {
    baseScore = 60;
  } else if (hoursRemaining <= 6.0) {
    baseScore = 45;
  } else if (hoursRemaining <= 12.0) {
    baseScore = 30;
  } else if (hoursRemaining <= 24.0) {
    baseScore = 20;
  } else {
    baseScore = 10;
  }

  // 2. Category Multiplier & Decay Speed
  let categoryRiskPenalty = 0;
  if (normCat.includes("cooked")) {
    categoryRiskPenalty = 10; // Cooked foods are high-risk bacterial vectors
  } else if (normCat.includes("dairy")) {
    categoryRiskPenalty = 8;
  } else if (normCat.includes("produce") || normCat.includes("raw")) {
    // Raw produce has longer life unless high ambient temp
    categoryRiskPenalty = ambientTemp > 32 ? 12 : -5;
  } else if (normCat.includes("package") || normCat.includes("dry")) {
    categoryRiskPenalty = -20; // Dry goods are highly shelf-stable
  }

  // 3. Storage Condition Multiplier
  let storageAdjustment = 0;
  let storageAssessment = "Ambient temperature storage. Standard shelf-life decay.";
  if (normStorage === "hot_hold") {
    storageAdjustment = -5; // Safe if >= 60°C
    storageAssessment = "Hot-held (≥60°C). Safe from bacterial multiplication while holding.";
  } else if (normStorage === "refrigerated") {
    storageAdjustment = -15; // Chilled slows microbial activity
    storageAssessment = "Cold-chain preserved (≤5°C). Reduced spoilage risk.";
  } else if (normStorage === "ambient" && ambientTemp >= 35) {
    storageAdjustment = 15; // Extreme temperature abuse
    storageAssessment = `High ambient exposure (${ambientTemp}°C). Acceleration of bacterial risk.`;
  }

  // Calculate final urgency score capped between 0 and 100
  const urgencyScore = Math.min(100, Math.max(0, baseScore + categoryRiskPenalty + storageAdjustment));

  // Determine Tier
  let urgencyTier: UrgencyTier;
  let tierLabel: string;
  let tierColor: SurplusEvaluationResult["tierColor"];

  if (urgencyScore >= 75 || hoursRemaining < 2.0) {
    urgencyTier = "critical_red";
    tierLabel = "🔴 Critical Urgency (<2h)";
    tierColor = {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
      badge: "bg-red-600 text-white",
      dot: "bg-red-500",
    };
  } else if (urgencyScore >= 40 || hoursRemaining <= 6.0) {
    urgencyTier = "urgent_yellow";
    tierLabel = "🟡 Urgent Redistribution (2-6h)";
    tierColor = {
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/30",
      badge: "bg-amber-500 text-stone-900",
      dot: "bg-amber-500",
    };
  } else {
    urgencyTier = "safe_green";
    tierLabel = "🟢 Safe Buffer (>6h)";
    tierColor = {
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30",
      badge: "bg-emerald-600 text-white",
      dot: "bg-emerald-500",
    };
  }

  // Pieces to plates translation
  const { plates, analogyText } = calculatePiecesToPlates(
    input.quantity,
    input.unit,
    input.category
  );

  return {
    urgencyScore,
    urgencyTier,
    tierLabel,
    tierColor,
    timeRemainingHours: hoursRemaining,
    estimatedMeals: plates,
    mealConversionAnalogy: analogyText,
    storageSafetyAssessment: storageAssessment,
    recommendedDispatchWindowHours: Math.min(hoursRemaining, Math.max(0.5, hoursRemaining * 0.7)),
    isHighPriorityDispatch: urgencyTier === "critical_red",
  };
}

export interface AiSafeExpiryComputation {
  baseShelfLifeHours: number;
  weatherDecayFactor: number;
  effectiveShelfLifeHours: number;
  elapsedStoredHours: number;
  remainingSafeHours: number;
  urgencyTier: UrgencyTier;
  tierLabel: string;
  tierColor: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    dot: string;
  };
  rationale: string;
  isExpired: boolean;
  recommendedAction: string;
}

/**
 * Central AI Safe Expiry Decision Engine
 * Automatically calculates the remaining safe window and traffic-light spectrum
 * based on exact food classification, storage condition, elapsed time since preparation,
 * and environmental/climate factors.
 */
export function calculateAiDecidedSafeExpiry(params: {
  category: FoodCategory | string;
  storageCondition: StorageCondition | string;
  elapsedStoredHours: number;
  ambientTemperatureC?: number;
  weatherCondition?: "sunny" | "extreme_heat" | "heavy_rain" | "cold_wave" | "clear" | string;
  foodName?: string;
}): AiSafeExpiryComputation {
  const normCat = (params.category || "cooked_food").toLowerCase();
  const normStorage = (params.storageCondition || "ambient").toLowerCase();
  const weather = params.weatherCondition || "clear";
  const temp = params.ambientTemperatureC ?? 30;
  const elapsed = Math.max(0, params.elapsedStoredHours);

  // 1. Base Shelf-Life Matrix by Category & Storage
  let baseHours = 4.0;
  if (normCat.includes("cooked")) {
    if (normStorage === "refrigerated") baseHours = 24.0;
    else if (normStorage === "hot_hold") baseHours = 6.0;
    else baseHours = 4.0; // FSSAI 4-hour room temp danger zone rule
  } else if (normCat.includes("dairy")) {
    if (normStorage === "refrigerated") baseHours = 36.0;
    else if (normStorage === "hot_hold") baseHours = 4.0;
    else baseHours = 4.5;
  } else if (normCat.includes("bakery") || normCat.includes("bread") || normCat.includes("roti")) {
    if (normStorage === "refrigerated") baseHours = 36.0;
    else baseHours = 18.0;
  } else if (normCat.includes("produce") || normCat.includes("raw")) {
    if (normStorage === "refrigerated") baseHours = 96.0;
    else baseHours = 36.0;
  } else if (normCat.includes("package") || normCat.includes("dry")) {
    baseHours = 120.0;
  }

  // 2. Weather & Temperature Decay Multiplier (applicable if ambient)
  let weatherFactor = 1.0;
  let weatherNote = "";
  if (normStorage === "ambient") {
    if (weather === "extreme_heat" || temp >= 35) {
      weatherFactor = 1.35;
      weatherNote = "Extreme ambient heat (>35°C) accelerated microbial decay by 1.35x.";
    } else if (weather === "heavy_rain") {
      weatherFactor = 1.15;
      weatherNote = "High monsoon humidity increased microbial spoilage rate by 1.15x.";
    } else if (weather === "cold_wave" || temp <= 16) {
      weatherFactor = 0.85;
      weatherNote = "Cooler ambient climate (<16°C) slightly retards bacterial growth.";
    }
  }

  // 3. Effective Shelf-Life
  const effectiveShelfLife = Math.round((baseHours / weatherFactor) * 10) / 10;
  const remainingHours = Math.max(0, Math.round((effectiveShelfLife - elapsed) * 10) / 10);
  const isExpired = elapsed >= effectiveShelfLife;

  // 4. Urgency Tier & Badges
  let urgencyTier: UrgencyTier;
  let tierLabel: string;
  let tierColor: AiSafeExpiryComputation["tierColor"];
  let recommendedAction: string;

  if (isExpired || remainingHours <= 0) {
    urgencyTier = "critical_red";
    tierLabel = "🔴 Expired / Unsafe for Donation";
    tierColor = {
      bg: "bg-red-500/15",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-500/40",
      badge: "bg-red-700 text-white",
      dot: "bg-red-700",
    };
    recommendedAction =
      "FSSAI safety threshold exceeded. Batch should not be redistributed for human consumption; divert to compost/biogas.";
  } else if (remainingHours < 2.0) {
    urgencyTier = "critical_red";
    tierLabel = "🔴 Critical Tier (<2h Left)";
    tierColor = {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
      badge: "bg-red-600 text-white",
      dot: "bg-red-500",
    };
    recommendedAction =
      "High-priority dispatch fast-track. Pinned to the top of courier routing & NGO marketplace.";
  } else if (remainingHours <= 6.0) {
    urgencyTier = "urgent_yellow";
    tierLabel = "🟡 Urgent Tier (2-6h Left)";
    tierColor = {
      bg: "bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-300",
      border: "border-amber-500/30",
      badge: "bg-amber-500 text-stone-900",
      dot: "bg-amber-500",
    };
    recommendedAction =
      "Standard priority redistribution. Dispatch within the next 2-3 hours recommended.";
  } else {
    urgencyTier = "safe_green";
    tierLabel = "🟢 Safe Buffer (>6h Left)";
    tierColor = {
      bg: "bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      border: "border-emerald-500/30",
      badge: "bg-emerald-600 text-white",
      dot: "bg-emerald-500",
    };
    recommendedAction =
      "Safe preservation buffer. Standard scheduled pickup window and distribution.";
  }

  // 5. Construct Rationale
  const storageLabel =
    normStorage === "refrigerated"
      ? "chilled (≤5°C)"
      : normStorage === "hot_hold"
      ? "hot-held (≥60°C)"
      : "ambient holding";

  let rationale = `Under ${storageLabel}, standard safe window is ${baseHours.toFixed(1)}h. `;
  if (weatherNote) {
    rationale += `${weatherNote} `;
  }
  if (elapsed === 0) {
    rationale += `Food was just freshly prepared/logged, leaving full ${effectiveShelfLife.toFixed(1)}h safe redistribution window.`;
  } else if (isExpired) {
    rationale += `Elapsed storage (${elapsed.toFixed(1)}h) has exceeded effective safe threshold of ${effectiveShelfLife.toFixed(1)}h.`;
  } else {
    rationale += `With ${elapsed.toFixed(1)}h elapsed since preparation, the AI engine calculates exactly ${remainingHours.toFixed(1)}h remaining safe window.`;
  }

  return {
    baseShelfLifeHours: baseHours,
    weatherDecayFactor: weatherFactor,
    effectiveShelfLifeHours: effectiveShelfLife,
    elapsedStoredHours: elapsed,
    remainingSafeHours: remainingHours,
    urgencyTier,
    tierLabel,
    tierColor,
    rationale,
    isExpired,
    recommendedAction,
  };
}

export interface AiInferredSpectrumModel {
  assumedElapsedHours: number;
  assumedReason: string;
  minSensibleHours: number;
  maxSensibleHours: number;
  sensibleCeilingWarning: string | null;
  quickStepChoices: Array<{ label: string; val: number }>;
}

/**
 * Calculates the Central AI's autonomous baseline assumption for food age / storage duration
 * based on all input prerequisites, plus dynamic realistic sensible bounds.
 */
export function inferAiBaselineStorageSpectrum(params: {
  category: FoodCategory | string;
  storageCondition: StorageCondition | string;
  ambientTemperatureC?: number;
  weatherCondition?: string;
  foodName?: string;
}): AiInferredSpectrumModel {
  const normCat = (params.category || "cooked_food").toLowerCase();
  const normStorage = (params.storageCondition || "ambient").toLowerCase();
  const isHeatwave =
    params.weatherCondition === "extreme_heat" || (params.ambientTemperatureC ?? 30) >= 35;

  let assumedElapsedHours = 1.25;
  let assumedReason =
    "Typical commercial meal service duration (60-90 min dining rush before surplus declaration).";
  let minSensibleHours = 0;
  let maxSensibleHours = 4.0;
  let sensibleCeilingWarning: string | null = null;
  let quickStepChoices = [
    { label: "Just now (0m)", val: 0 },
    { label: "30m ago", val: 0.5 },
    { label: "1h ago", val: 1.0 },
    { label: "1.25h (AI Baseline)", val: 1.25 },
    { label: "2h ago", val: 2.0 },
    { label: "3h ago", val: 3.0 },
    { label: "4h max", val: 4.0 },
  ];

  if (normCat.includes("cooked")) {
    if (normStorage === "refrigerated") {
      assumedElapsedHours = 2.0;
      assumedReason =
        "Chilled cooked batch: AI infers 2.0h elapsed post-service blast-chilling and transfer.";
      maxSensibleHours = 18.0;
      quickStepChoices = [
        { label: "0m", val: 0 },
        { label: "1h", val: 1.0 },
        { label: "2h (AI Baseline)", val: 2.0 },
        { label: "4h", val: 4.0 },
        { label: "8h", val: 8.0 },
        { label: "12h", val: 12.0 },
      ];
    } else if (normStorage === "hot_hold") {
      assumedElapsedHours = 1.5;
      assumedReason =
        "Hot-holding warmer (≥60°C): AI infers 1.5h safe hold since preparation completion.";
      maxSensibleHours = 6.0;
      quickStepChoices = [
        { label: "0m", val: 0 },
        { label: "30m", val: 0.5 },
        { label: "1h", val: 1.0 },
        { label: "1.5h (AI Baseline)", val: 1.5 },
        { label: "3h", val: 3.0 },
        { label: "5h", val: 5.0 },
      ];
    } else {
      // Ambient cooked food
      assumedElapsedHours = isHeatwave ? 1.0 : 1.25;
      assumedReason = isHeatwave
        ? "Extreme heat ambient holding (>35°C): AI accelerates assumption to 1.0h to protect bacterial threshold."
        : "Ambient post-buffet holding: AI infers standard 1.25h window following commercial meal transition.";
      maxSensibleHours = isHeatwave ? 3.0 : 4.0;
      sensibleCeilingWarning = isHeatwave
        ? "Ambient holding in extreme heat (>35°C) should not exceed 3.0h before redistribution."
        : "Cooked food held at ambient temperature past 4.0h breaches FSSAI microbiological guidelines.";
      quickStepChoices = [
        { label: "Just now", val: 0 },
        { label: "30m", val: 0.5 },
        { label: "1h", val: 1.0 },
        { label: `${assumedElapsedHours}h (AI Baseline)`, val: assumedElapsedHours },
        { label: "2h", val: 2.0 },
        { label: "3h", val: 3.0 },
      ];
    }
  } else if (normCat.includes("dairy")) {
    if (normStorage === "refrigerated") {
      assumedElapsedHours = 2.0;
      assumedReason =
        "Refrigerated dairy batch: AI assumes 2.0h cold storage post-receipt/preparation.";
      maxSensibleHours = 24.0;
      quickStepChoices = [
        { label: "0m", val: 0 },
        { label: "1h", val: 1.0 },
        { label: "2h (AI Baseline)", val: 2.0 },
        { label: "4h", val: 4.0 },
        { label: "8h", val: 8.0 },
      ];
    } else {
      assumedElapsedHours = 1.0;
      assumedReason =
        "Ambient dairy: Rapid spoilage vector. AI assumes 1.0h since cold-chain removal.";
      maxSensibleHours = 4.0;
      sensibleCeilingWarning =
        "Unrefrigerated dairy beyond 4.0h experiences rapid lactic acidification.";
      quickStepChoices = [
        { label: "0m", val: 0 },
        { label: "30m", val: 0.5 },
        { label: "1h (AI Baseline)", val: 1.0 },
        { label: "2h", val: 2.0 },
        { label: "3h", val: 3.0 },
      ];
    }
  } else if (normCat.includes("bakery") || normCat.includes("bread") || normCat.includes("roti")) {
    assumedElapsedHours = 2.5;
    assumedReason =
      "Commercial bakery batch: AI assumes 2.5h elapsed since morning/evening bake cycle.";
    maxSensibleHours = normStorage === "refrigerated" ? 36.0 : 16.0;
    quickStepChoices = [
      { label: "0m", val: 0 },
      { label: "1h", val: 1.0 },
      { label: "2.5h (AI Baseline)", val: 2.5 },
      { label: "4h", val: 4.0 },
      { label: "8h", val: 8.0 },
      { label: "12h", val: 12.0 },
    ];
  } else if (normCat.includes("produce") || normCat.includes("raw")) {
    assumedElapsedHours = 3.5;
    assumedReason =
      "Raw produce & vegetables: AI assumes 3.5h since morning kitchen procurement/sorting.";
    maxSensibleHours = normStorage === "refrigerated" ? 72.0 : 24.0;
    quickStepChoices = [
      { label: "1h", val: 1.0 },
      { label: "3.5h (AI Baseline)", val: 3.5 },
      { label: "6h", val: 6.0 },
      { label: "12h", val: 12.0 },
      { label: "18h", val: 18.0 },
    ];
  } else if (normCat.includes("package") || normCat.includes("dry")) {
    assumedElapsedHours = 6.0;
    assumedReason =
      "Packaged dry goods / grains: Shelf-stable batch with minimal time-temperature risk.";
    maxSensibleHours = 72.0;
    quickStepChoices = [
      { label: "2h", val: 2.0 },
      { label: "6h (AI Baseline)", val: 6.0 },
      { label: "12h", val: 12.0 },
      { label: "24h", val: 24.0 },
      { label: "48h", val: 48.0 },
    ];
  }

  return {
    assumedElapsedHours,
    assumedReason,
    minSensibleHours,
    maxSensibleHours,
    sensibleCeilingWarning,
    quickStepChoices,
  };
}


