"use client";

import * as React from "react";
import Link from "next/link";
import {
  evaluateSurplusUrgency,
  calculatePiecesToPlates,
  calculateAiDecidedSafeExpiry,
  inferAiBaselineStorageSpectrum,
  FoodCategory,
  StorageCondition,
  SurplusEvaluationResult,
  AiSafeExpiryComputation,
  AiInferredSpectrumModel,
} from "@/lib/surplus-engine";
import {
  calculateContextualDemandPrediction,
  KNOWN_CALENDAR_EVENTS,
  DemandPredictionResult,
} from "@/lib/demand-prediction";
import {
  Calculator,
  Sparkles,
  TrendingUp,
  Clock,
  Sun,
  Calendar,
  Utensils,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  RotateCcw,
  Bot,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function SurplusAiCalculator() {
  // 1. Food Details Input States
  const [foodName, setFoodName] = React.useState<string>("");
  const [category, setCategory] = React.useState<FoodCategory>("cooked_food");
  const [storageCondition, setStorageCondition] = React.useState<StorageCondition>("ambient");
  const [quantity, setQuantity] = React.useState<number>(30);
  const [unit, setUnit] = React.useState<string>("kg");

  // 2. Weather & Context States
  const [ambientTempC, setAmbientTempC] = React.useState<number>(32);
  const [weatherCondition, setWeatherCondition] = React.useState<
    "sunny" | "extreme_heat" | "heavy_rain" | "cold_wave" | "clear"
  >("clear");
  const [activeCalendarKey, setActiveCalendarKey] = React.useState<string>("none");
  const [baseHeadcount, setBaseHeadcount] = React.useState<number>(450);

  // 3. Central AI Baseline Storage Spectrum Model (First assumption rests on AI)
  const inferredSpectrum: AiInferredSpectrumModel = React.useMemo(() => {
    return inferAiBaselineStorageSpectrum({
      category,
      storageCondition,
      ambientTemperatureC: ambientTempC,
      weatherCondition,
      foodName,
    });
  }, [category, storageCondition, ambientTempC, weatherCondition, foodName]);

  // Track if the user manually adjusted the AI's autonomous baseline
  const [isManualOverride, setIsManualOverride] = React.useState<boolean>(false);
  const [elapsedStoredHours, setElapsedStoredHours] = React.useState<number>(1.25);

  // Auto-adapt when prerequisites change
  React.useEffect(() => {
    if (!isManualOverride) {
      setElapsedStoredHours(inferredSpectrum.assumedElapsedHours);
    } else {
      if (elapsedStoredHours > inferredSpectrum.maxSensibleHours) {
        setElapsedStoredHours(inferredSpectrum.maxSensibleHours);
      }
    }
  }, [inferredSpectrum, isManualOverride, elapsedStoredHours]);

  // 4. Central AI Safe Expiry Decision Computation
  const aiSafeComputation: AiSafeExpiryComputation = React.useMemo(() => {
    return calculateAiDecidedSafeExpiry({
      category,
      storageCondition,
      elapsedStoredHours,
      ambientTemperatureC: ambientTempC,
      weatherCondition,
      foodName,
    });
  }, [category, storageCondition, elapsedStoredHours, ambientTempC, weatherCondition, foodName]);

  // 5. Multi-variable Urgency based on AI-Decided Remaining Safe Hours
  const urgencyResult: SurplusEvaluationResult = React.useMemo(() => {
    const now = new Date();
    const targetDate = new Date(
      now.getTime() + aiSafeComputation.remainingSafeHours * 60 * 60 * 1000
    );

    return evaluateSurplusUrgency({
      category,
      quantity,
      unit,
      expiryDeadline: targetDate,
      storageCondition,
      ambientTemperatureC: ambientTempC,
    });
  }, [
    category,
    quantity,
    unit,
    aiSafeComputation.remainingSafeHours,
    storageCondition,
    ambientTempC,
  ]);

  // 6. Contextual Demand Prediction
  const demandResult: DemandPredictionResult = React.useMemo(() => {
    return calculateContextualDemandPrediction({
      baseHeadcount,
      weather: {
        temperatureC: ambientTempC,
        condition: weatherCondition,
        humidityPercent: weatherCondition === "heavy_rain" ? 85 : 45,
        description: weatherCondition,
      },
      activeCalendarEventKey: activeCalendarKey === "none" ? undefined : activeCalendarKey,
    });
  }, [baseHeadcount, ambientTempC, weatherCondition, activeCalendarKey]);

  // Friendly human format for elapsed time
  const formatFriendlyTime = (hours: number) => {
    if (hours === 0) return "Freshly prepared (just now)";
    if (hours === 0.5) return "30 minutes ago";
    if (hours === 1.0) return "1 hour ago";
    if (hours === 1.25) return "About 1 hr 15m ago";
    if (hours === 1.5) return "1 hour 30 mins ago";
    if (hours === 2.0) return "2 hours ago";
    if (hours === 2.5) return "2 hours 30 mins ago";
    if (hours === 3.0) return "3 hours ago";
    if (hours === 4.0) return "4 hours ago";
    return `${hours.toFixed(1)} hours ago`;
  };

  const handleResetToAiAssumption = () => {
    setIsManualOverride(false);
    setElapsedStoredHours(inferredSpectrum.assumedElapsedHours);
  };

  // Safe percentage for visual meter
  const remainingPercent = aiSafeComputation.isExpired
    ? 0
    : Math.min(
        100,
        Math.max(
          5,
          (aiSafeComputation.remainingSafeHours /
            Math.max(aiSafeComputation.effectiveShelfLifeHours, 1)) *
            100
        )
      );

  return (
    <div className="border border-line rounded-xl bg-ledger-surface overflow-hidden shadow-sm">
      {/* Friendly Header */}
      <div className="px-6 py-5 border-b border-line bg-gradient-to-r from-[#FAF6EE] to-[#F3EDE0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-basil text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl text-ink">
                MealBalance
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-basil/15 text-basil border border-basil/30">
                AI Surplus &amp; Demand Engine
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Enter what food you have. MealBalance instantly calculates how many meals it will provide, safe pickup windows, and expected kitchen demand.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Easy Inputs */}
        <div className="lg:col-span-6 space-y-6">
          {/* Step 1 Card */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="w-5 h-5 rounded-full bg-basil text-white text-xs font-bold flex items-center justify-center font-mono">
                1
              </span>
              <h3 className="font-serif font-bold text-sm text-ink">
                What food do you have?
              </h3>
            </div>

            {/* Food Name Input - Clean, free text, no preset clutter */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Food or Dish Name
              </label>
              <input
                type="text"
                value={foodName}
                onChange={(e) => {
                  setFoodName(e.target.value);
                  // Intelligent auto-detection of food type without cluttered buttons
                  const lower = e.target.value.toLowerCase();
                  if (lower.includes("milk") || lower.includes("curd") || lower.includes("paneer") || lower.includes("yogurt")) {
                    setCategory("dairy");
                    setStorageCondition("refrigerated");
                  } else if (lower.includes("bread") || lower.includes("roti") || lower.includes("chapati") || lower.includes("bun") || lower.includes("cake")) {
                    setCategory("bakery");
                    setUnit("pieces");
                  } else if (lower.includes("fruit") || lower.includes("apple") || lower.includes("tomato") || lower.includes("veg") || lower.includes("salad")) {
                    setCategory("raw_produce");
                  } else if (lower.includes("rice") || lower.includes("dal") || lower.includes("curry") || lower.includes("soup") || lower.includes("pulao") || lower.includes("pasta") || lower.includes("biryani")) {
                    setCategory("cooked_food");
                  }
                  setIsManualOverride(false);
                }}
                placeholder="e.g. Cooked Rice, Sandwiches, Milk, Fresh Fruit..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil focus:ring-1 focus:ring-basil transition-all placeholder:text-ink-soft/50 shadow-2xs"
              />
              <span className="text-[11px] text-ink-soft mt-1 block">
                Type what was prepared or left over in your kitchen today.
              </span>
            </div>

            {/* Food Category & Storage Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Food Type
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as FoodCategory);
                    setIsManualOverride(false);
                  }}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil transition-all cursor-pointer font-medium"
                >
                  <option value="cooked_food">🍲 Cooked Meals &amp; Curries</option>
                  <option value="bakery">🥖 Bakery, Bread &amp; Rotis</option>
                  <option value="dairy">🥛 Dairy &amp; Milk Products</option>
                  <option value="raw_produce">🥦 Fresh Fruits &amp; Vegetables</option>
                  <option value="packaged_dry">📦 Packaged &amp; Dry Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  How is it stored?
                </label>
                <select
                  value={storageCondition}
                  onChange={(e) => {
                    setStorageCondition(e.target.value as StorageCondition);
                    setIsManualOverride(false);
                  }}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil transition-all cursor-pointer font-medium"
                >
                  <option value="ambient">🌡️ Room Temperature</option>
                  <option value="refrigerated">❄️ Refrigerator / Chilled (≤ 5°C)</option>
                  <option value="hot_hold">♨️ Food Warmer / Hot-Held (≥ 60°C)</option>
                </select>
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-ink">
                    How much food is available?
                  </label>
                  <span className="text-xs font-bold text-basil font-mono">
                    {quantity} {unit}
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-basil cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Measurement Unit
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil transition-all cursor-pointer font-medium"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="pieces">Pieces / Servings</option>
                  <option value="trays">Trays (~5kg each)</option>
                  <option value="litres">Litres (L)</option>
                </select>
              </div>
            </div>

            {/* Preparation / Stored Time Spectrum (AI Decided Baseline + Sensible Kitchen Tuning) */}
            <div className="p-4 rounded-xl border border-line bg-ledger-paper space-y-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-basil" />
                    When was this food cooked or prepared?
                  </label>
                  <span className="text-[11px] text-ink-soft block">
                    The AI automatically estimates the typical service time.
                  </span>
                </div>

                {!isManualOverride ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-basil/15 text-basil border border-basil/30 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    AI Estimate: {formatFriendlyTime(elapsedStoredHours)}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-900 border border-amber-500/30">
                      Your Setting: {formatFriendlyTime(elapsedStoredHours)}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToAiAssumption}
                      className="text-xs text-basil hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      title="Reset to AI estimate"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset to AI
                    </button>
                  </div>
                )}
              </div>

              {/* Slider within realistic sensible bounds */}
              <div className="space-y-1 pt-1">
                <input
                  type="range"
                  min={inferredSpectrum.minSensibleHours}
                  max={inferredSpectrum.maxSensibleHours}
                  step={inferredSpectrum.maxSensibleHours > 10 ? 0.5 : 0.25}
                  value={elapsedStoredHours}
                  onChange={(e) => {
                    setIsManualOverride(true);
                    setElapsedStoredHours(Number(e.target.value));
                  }}
                  className="w-full accent-basil cursor-pointer"
                />

                <div className="flex justify-between text-xs text-ink-soft font-mono">
                  <span>Freshly made</span>
                  <span className="text-basil font-semibold">
                    AI Baseline: ~{inferredSpectrum.assumedElapsedHours}h ago
                  </span>
                  <span>Max safe: {inferredSpectrum.maxSensibleHours}h</span>
                </div>
              </div>

              {/* Friendly explanation */}
              <div className="text-xs text-ink-soft bg-[#FAF6EE] p-2.5 rounded-lg border border-line/50 flex items-start gap-2">
                <Info className="w-4 h-4 text-basil shrink-0 mt-0.5" />
                <span>
                  <strong>Why this estimate?</strong> {inferredSpectrum.assumedReason}
                </span>
              </div>
            </div>

            {/* Food Safety & Safe Expiry Window Result */}
            <div
              className={`p-4 rounded-xl border ${aiSafeComputation.tierColor.bg} ${aiSafeComputation.tierColor.border} space-y-3 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${aiSafeComputation.tierColor.dot} animate-pulse`}
                  />
                  <span className="text-xs font-bold text-ink uppercase tracking-wide">
                    Food Safety Window (Decided by AI)
                  </span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${aiSafeComputation.tierColor.badge}`}
                >
                  {aiSafeComputation.tierLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-ink-soft block">
                    Safe Window to Distribute:
                  </span>
                  <span className={`font-serif text-2xl font-bold ${aiSafeComputation.tierColor.text}`}>
                    {aiSafeComputation.isExpired
                      ? "Expired (Do Not Distribute)"
                      : `${aiSafeComputation.remainingSafeHours} Hours Remaining`}
                  </span>
                </div>

                <div className="text-right text-xs text-ink-soft font-mono">
                  <div>Total Safe Life: ~{aiSafeComputation.effectiveShelfLifeHours}h</div>
                  <div>Time Since Prep: - {aiSafeComputation.elapsedStoredHours}h</div>
                </div>
              </div>

              {/* Clean visual progress bar */}
              <div className="space-y-1.5">
                <div className="h-3 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      aiSafeComputation.isExpired
                        ? "bg-red-700"
                        : aiSafeComputation.urgencyTier === "critical_red"
                        ? "bg-red-500"
                        : aiSafeComputation.urgencyTier === "urgent_yellow"
                        ? "bg-amber-500"
                        : "bg-emerald-600"
                    }`}
                    style={{ width: `${remainingPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-ink-soft font-medium">
                  <span className="text-red-600">🔴 Under 2h (Needs Quick Action)</span>
                  <span className="text-amber-600">🟡 2 to 6h (Good Window)</span>
                  <span className="text-emerald-700">🟢 6h+ (Plenty of Time)</span>
                </div>
              </div>

              {/* Plain English Safety Note */}
              <div className="text-xs text-ink leading-relaxed border-t border-line/40 pt-2.5">
                <p>
                  💡 <strong>In Plain English:</strong> {aiSafeComputation.rationale}
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 Card: Weather & Headcount */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-line pb-2">
              <span className="w-5 h-5 rounded-full bg-basil text-white text-xs font-bold flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="font-serif font-bold text-sm text-ink">
                Today&apos;s Weather &amp; Dining Schedule
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-saffron" />
                  Today&apos;s Weather
                </label>
                <select
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value as any)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil transition-all cursor-pointer font-medium"
                >
                  <option value="clear">☀️ Mild / Normal Day (24°C - 28°C)</option>
                  <option value="extreme_heat">🔥 Hot Summer Day (&gt;35°C)</option>
                  <option value="heavy_rain">🌧️ Rainy / Monsoon Day</option>
                  <option value="cold_wave">❄️ Cold Winter Day (&lt;16°C)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-basil" />
                  Special Day or Event
                </label>
                <select
                  value={activeCalendarKey}
                  onChange={(e) => setActiveCalendarKey(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-line bg-ledger-paper text-ink focus:outline-hidden focus:border-basil transition-all cursor-pointer font-medium"
                >
                  <option value="none">Standard Working Day</option>
                  <option value="weekend">🎉 Weekend (More Diners)</option>
                  <option value="diwali">🪔 Diwali Festive Feast (+45%)</option>
                  <option value="eid">🌙 Eid Celebration (+40%)</option>
                  <option value="christmas">🎄 Year-End Gathering (+35%)</option>
                  <option value="exam_period">📚 Exam Period (Late Dining)</option>
                  <option value="semester_break">🏖️ Vacation / Holiday (Fewer Diners)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-ink">
                  Usual Daily Diners (Headcount)
                </label>
                <span className="text-xs font-bold text-ink font-mono">
                  {baseHeadcount} people
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="1500"
                step="50"
                value={baseHeadcount}
                onChange={(e) => setBaseHeadcount(Number(e.target.value))}
                className="w-full accent-basil cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Layman-Friendly Results */}
        <div className="lg:col-span-6 space-y-5">
          <div className="text-xs font-mono font-bold text-ink-soft uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-basil" />
            Live AI Results (What This Means For You)
          </div>

          {/* Meals Recoverable Card */}
          <div className="p-5 rounded-xl border border-line bg-gradient-to-br from-white to-[#FAF6EE] shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-basil" />
                How Many Meals Will This Feed?
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-basil/10 text-basil">
                Verified Portioning
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-4xl font-serif font-extrabold text-basil">
                ~{urgencyResult.estimatedMeals}
              </span>
              <span className="text-base font-semibold text-ink">
                Full Meals Provided
              </span>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed pt-1">
              {foodName.trim() ? (
                <span>
                  Your batch of <strong>{foodName}</strong> ({quantity} {unit}) can feed approximately{" "}
                  <strong>{urgencyResult.estimatedMeals} people</strong> based on standard 450g meal portions.
                </span>
              ) : (
                <span>
                  This batch of {quantity} {unit} will provide approximately{" "}
                  <strong>{urgencyResult.estimatedMeals} full plates of food</strong> for community distribution.
                </span>
              )}
            </p>
          </div>

          {/* Action Recommendation Card */}
          <div className="p-5 rounded-xl border border-line bg-ledger-paper shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-basil" />
                Recommended Next Step
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${aiSafeComputation.tierColor.badge}`}
              >
                {aiSafeComputation.tierLabel}
              </span>
            </div>

            <p className="text-sm font-medium text-ink leading-snug">
              {aiSafeComputation.recommendedAction}
            </p>

            <div className="text-xs text-ink-soft bg-[#FAF6EE] p-3 rounded-lg border border-line/50 leading-relaxed">
              {urgencyResult.isHighPriorityDispatch ? (
                <span className="text-red-700 font-semibold">
                  ⚠️ Priority Alert: This batch has under 2 hours remaining. If you list it now, it will be highlighted in bright red on the NGO marketplace so delivery partners pick it up immediately.
                </span>
              ) : (
                <span>
                  ✅ Standard Window: You have ample time to list this batch and coordinate a convenient pickup with a nearby NGO.
                </span>
              )}
            </div>
          </div>

          {/* Expected Dining Demand Today Card */}
          <div className="p-5 rounded-xl border border-line bg-ledger-paper shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-basil" />
                Kitchen Demand Forecast
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${demandResult.trajectoryBadgeColor.bg} ${demandResult.trajectoryBadgeColor.text} ${demandResult.trajectoryBadgeColor.border}`}
              >
                {demandResult.trajectoryLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#FAF6EE] border border-line/60">
                <span className="text-[11px] text-ink-soft block font-medium">
                  Expected Diners Today
                </span>
                <span className="font-serif text-xl font-bold text-ink">
                  {demandResult.predictedDemandPlates} meals
                </span>
                <span className="text-[10px] text-ink-soft block mt-0.5">
                  Normal baseline: {baseHeadcount}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#FAF6EE] border border-line/60">
                <span className="text-[11px] text-ink-soft block font-medium">
                  Forecast Confidence
                </span>
                <span className="font-serif text-xl font-bold text-basil">
                  {demandResult.confidencePercent}%
                </span>
                <span className="text-[10px] text-ink-soft block mt-0.5">
                  Weather + Calendar analysis
                </span>
              </div>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed border-t border-line/40 pt-2.5">
              🍳 <strong>Chef &amp; Kitchen Tip:</strong> {demandResult.recommendedPreparationAdvice}
            </p>
          </div>

          {/* Big, Friendly 1-Click Action */}
          <div className="pt-2">
            <Link
              href={`/app/institution/surplus-listings`}
              className="w-full py-3.5 px-5 rounded-xl bg-basil hover:bg-basil/90 text-white text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
            >
              <span>Post This Food for NGO Pickup →</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-[11px] text-center text-ink-soft mt-1.5">
              Instantly notifies verified non-profits and assigns logistics drivers for safe pickup.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
