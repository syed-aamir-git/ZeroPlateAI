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
  Thermometer,
  CloudRain,
  Flame,
  Snowflake,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Layers,
  HeartHandshake,
  Activity,
} from "lucide-react";


const STORAGE_OPTIONS: { id: StorageCondition; label: string; desc: string; icon: string; badgeColor: string }[] = [
  {
    id: "ambient",
    label: "Room Temp",
    desc: "Kitchen ambient (24-32°C)",
    icon: "🌡️",
    badgeColor: "amber",
  },
  {
    id: "refrigerated",
    label: "Chilled / Fridge",
    desc: "Cold storage (≤ 5°C)",
    icon: "❄️",
    badgeColor: "blue",
  },
  {
    id: "hot_hold",
    label: "Food Warmer",
    desc: "Hot held (≥ 60°C)",
    icon: "♨️",
    badgeColor: "rose",
  },
];

const WEATHER_OPTIONS = [
  { id: "clear" as const, label: "Mild / Normal", temp: "26°C", icon: "☀️", tempC: 26 },
  { id: "extreme_heat" as const, label: "Hot Summer", temp: "38°C", icon: "🔥", tempC: 38 },
  { id: "heavy_rain" as const, label: "Monsoon Rain", temp: "24°C", icon: "🌧️", tempC: 24 },
  { id: "cold_wave" as const, label: "Cold Winter", temp: "14°C", icon: "❄️", tempC: 14 },
];

export default function SurplusAiCalculator() {
  // 1. Food Details Input States
  const [foodName, setFoodName] = React.useState<string>("Cooked Basmati Rice");
  const [category, setCategory] = React.useState<FoodCategory>("cooked_food");
  const [storageCondition, setStorageCondition] = React.useState<StorageCondition>("ambient");
  const [quantity, setQuantity] = React.useState<number>(30);
  const [unit, setUnit] = React.useState<string>("kg");

  // 2. Weather & Context States
  const [ambientTempC, setAmbientTempC] = React.useState<number>(28);
  const [weatherCondition, setWeatherCondition] = React.useState<
    "sunny" | "extreme_heat" | "heavy_rain" | "cold_wave" | "clear"
  >("clear");
  const [activeCalendarKey, setActiveCalendarKey] = React.useState<string>("none");
  const [baseHeadcount, setBaseHeadcount] = React.useState<number>(450);

  // 3. Central AI Baseline Storage Spectrum Model
  const inferredSpectrum: AiInferredSpectrumModel = React.useMemo(() => {
    return inferAiBaselineStorageSpectrum({
      category,
      storageCondition,
      ambientTemperatureC: ambientTempC,
      weatherCondition,
      foodName,
    });
  }, [category, storageCondition, ambientTempC, weatherCondition, foodName]);

  // Track if the user manually adjusted the AI's baseline
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
    if (hours === 0) return "Freshly prepared (0h)";
    if (hours === 0.5) return "30 mins ago (0.5h)";
    if (hours === 1.0) return "1 hour ago (1h)";
    if (hours === 1.25) return "1 hr 15m ago (1.25h)";
    if (hours === 1.5) return "1 hr 30m ago (1.5h)";
    if (hours === 2.0) return "2 hours ago (2h)";
    if (hours === 2.5) return "2.5 hours ago (2.5h)";
    if (hours === 3.0) return "3 hours ago (3h)";
    if (hours === 4.0) return "4 hours ago (4h)";
    return `${hours.toFixed(1)} hrs ago`;
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

  // Stepper helper for quantity
  const handleQuantityStep = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  // Stepper helper for headcount
  const handleHeadcountStep = (delta: number) => {
    setBaseHeadcount((prev) => Math.max(20, prev + delta));
  };

  // Maximum slider bound depending on unit
  const maxQty = unit === "pieces" ? 500 : unit === "trays" ? 60 : 300;
  const qtyStep = unit === "trays" ? 1 : unit === "pieces" ? 5 : 2;

  // Surplus listing redirection URL with parameters
  const surplusListingUrl = `/app/institution/surplus-listings?foodName=${encodeURIComponent(
    foodName
  )}&category=${category}&qty=${quantity}&unit=${unit}&storage=${storageCondition}`;

  return (
    <div className="rounded-2xl sm:rounded-3xl border border-stone-200/90 bg-white shadow-sm overflow-hidden transition-all">
      {/* Header Banner - Colorful, Clean & Modern */}
      <div className="px-6 py-5 border-b border-stone-200 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-purple-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-700/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">
                MealBalance
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                AI Surplus &amp; Demand Engine
              </span>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-100 text-stone-600 border border-stone-200">
                v2.4 Active
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-xl">
              Type what food is left in your kitchen. MealBalance calculates real-time portions, food safety deadlines, and dynamic diner demand.
            </p>
          </div>
        </div>

        {/* Quick Reset & Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setFoodName("Cooked Basmati Rice");
              setCategory("cooked_food");
              setStorageCondition("ambient");
              setQuantity(30);
              setUnit("kg");
              setAmbientTempC(28);
              setWeatherCondition("clear");
              setActiveCalendarKey("none");
              setBaseHeadcount(450);
              setIsManualOverride(false);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Reset calculator to defaults"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* ================= LEFT COLUMN: CLEAN INTERACTIVE CONTROLS ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1 CONTAINER: FOOD & QUANTITY */}
          <div className="p-5 rounded-2xl border border-stone-200/90 bg-stone-50/50 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center font-mono shadow-2xs">
                  1
                </span>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  What food do you have available?
                </h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Live Auto-Detect
              </span>
            </div>


            {/* Dish Name Input */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                Food or Dish Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => {
                    setFoodName(e.target.value);
                    const lower = e.target.value.toLowerCase();
                    if (
                      lower.includes("milk") ||
                      lower.includes("curd") ||
                      lower.includes("paneer") ||
                      lower.includes("yogurt")
                    ) {
                      setCategory("dairy");
                      setStorageCondition("refrigerated");
                    } else if (
                      lower.includes("bread") ||
                      lower.includes("roti") ||
                      lower.includes("chapati") ||
                      lower.includes("bun") ||
                      lower.includes("cake") ||
                      lower.includes("pizza")
                    ) {
                      setCategory("bakery");
                      setUnit("pieces");
                    } else if (
                      lower.includes("fruit") ||
                      lower.includes("apple") ||
                      lower.includes("tomato") ||
                      lower.includes("veg") ||
                      lower.includes("salad")
                    ) {
                      setCategory("raw_produce");
                    } else if (
                      lower.includes("rice") ||
                      lower.includes("dal") ||
                      lower.includes("curry") ||
                      lower.includes("soup") ||
                      lower.includes("pulao") ||
                      lower.includes("pasta") ||
                      lower.includes("biryani")
                    ) {
                      setCategory("cooked_food");
                    }
                    setIsManualOverride(false);
                  }}
                  placeholder="e.g. Basmati Rice, Chicken Curry, Fresh Apples..."
                  className="w-full text-sm px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-stone-400 font-medium shadow-2xs"
                />
              </div>
              <span className="text-[11px] text-stone-500 mt-1 block">
                Type what was prepared or left over in your kitchen today.
              </span>
            </div>

            {/* Food Category & Storage Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Food Category
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value as FoodCategory);
                    setIsManualOverride(false);
                  }}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer font-medium shadow-2xs"
                >
                  <option value="cooked_food">🍲 Cooked Meals &amp; Curries</option>
                  <option value="bakery">🥖 Bakery, Bread &amp; Rotis</option>
                  <option value="dairy">🥛 Dairy &amp; Milk Products</option>
                  <option value="raw_produce">🥦 Fresh Fruits &amp; Vegetables</option>
                  <option value="packaged_dry">📦 Packaged &amp; Dry Goods</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  Measurement Unit
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "kg", label: "kg" },
                    { id: "pieces", label: "Pieces" },
                    { id: "trays", label: "Trays" },
                    { id: "litres", label: "Litres" },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setUnit(u.id)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer ${
                        unit === u.id
                          ? "bg-emerald-700 text-white shadow-2xs"
                          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Storage Condition Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-2">
                How is it currently stored?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {STORAGE_OPTIONS.map((opt) => {
                  const isSelected = storageCondition === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStorageCondition(opt.id);
                        setIsManualOverride(false);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? opt.badgeColor === "blue"
                            ? "border-blue-500 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20"
                            : opt.badgeColor === "rose"
                            ? "border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20"
                            : "border-amber-500 bg-amber-50/70 shadow-xs ring-2 ring-amber-500/20"
                          : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{opt.icon}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-semibold text-xs text-stone-900">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5 leading-tight">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Slider + Numeric Stepper */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-semibold text-stone-800 block">
                    Available Food Quantity
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Use slider or +/- buttons to dial exact batch size
                  </span>
                </div>
                {/* Numeric Stepper Box */}
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(-qtyStep)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="w-14 text-center font-mono font-bold text-sm bg-transparent border-0 focus:outline-hidden text-emerald-800"
                  />
                  <span className="text-xs font-semibold text-stone-500 pr-1.5 font-mono">
                    {unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityStep(qtyStep)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slider */}
              <div className="pt-1">
                <input
                  type="range"
                  min="5"
                  max={maxQty}
                  step={qtyStep}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-stone-400 mt-1">
                  <span>5 {unit}</span>
                  <span className="text-emerald-700 font-bold">
                    {quantity} {unit} selected
                  </span>
                  <span>
                    {maxQty} {unit}
                  </span>
                </div>
              </div>
            </div>

            {/* Preparation / Stored Time Spectrum */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3.5">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    When was this food cooked or prepared?
                  </label>
                  <span className="text-[11px] text-stone-500 block">
                    AI automatically factors kitchen batching schedules.
                  </span>
                </div>

                {!isManualOverride ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5 text-emerald-600" />
                    AI Baseline: {formatFriendlyTime(elapsedStoredHours)}
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      Manual: {formatFriendlyTime(elapsedStoredHours)}
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToAiAssumption}
                      className="text-xs text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      title="Reset to AI baseline"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset AI
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Time Stage Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Just Made", hours: 0 },
                  { label: "1 hour ago", hours: 1 },
                  { label: "2.5h (Lunch)", hours: 2.5 },
                  { label: "4h (Morning)", hours: 4 },
                  { label: "6h (Early)", hours: 6 },
                ].map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => {
                      setIsManualOverride(true);
                      setElapsedStoredHours(
                        Math.min(t.hours, inferredSpectrum.maxSensibleHours)
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      Math.abs(elapsedStoredHours - t.hours) < 0.25
                        ? "bg-stone-800 text-white font-semibold"
                        : "bg-stone-100 hover:bg-stone-200 text-stone-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
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
                  className="w-full accent-emerald-600 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                  <span>Freshly made (0h)</span>
                  <span className="text-emerald-700 font-bold">
                    ~{inferredSpectrum.assumedElapsedHours}h (AI Est)
                  </span>
                  <span>Max safe: {inferredSpectrum.maxSensibleHours}h</span>
                </div>
              </div>

              {/* Plain Rationale Box */}
              <div className="text-xs text-stone-600 bg-amber-500/10 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-stone-800">Why this estimate?</strong>{" "}
                  {inferredSpectrum.assumedReason}
                </span>
              </div>
            </div>
          </div>

          {/* STEP 2 CONTAINER: WEATHER & HEADCOUNT */}
          <div className="p-5 rounded-2xl border border-stone-200/90 bg-stone-50/50 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center font-mono shadow-2xs">
                  2
                </span>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Kitchen Environment &amp; Diner Rush
                </h3>
              </div>
              <span className="text-[11px] font-mono font-medium text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Weather &amp; Calendar Factors
              </span>
            </div>

            {/* Weather Selector Cards */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-2 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                Select Today&apos;s Weather Condition
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {WEATHER_OPTIONS.map((w) => {
                  const isSelected = weatherCondition === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        setWeatherCondition(w.id);
                        setAmbientTempC(w.tempC);
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 font-semibold shadow-2xs"
                          : "border-stone-200 bg-white hover:bg-stone-50 text-stone-700"
                      }`}
                    >
                      <div className="text-xl mb-1">{w.icon}</div>
                      <div className="text-xs font-semibold">{w.label}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{w.temp}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Calendar Event Selection */}
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-600" />
                Special Day or Dining Event
              </label>
              <select
                value={activeCalendarKey}
                onChange={(e) => setActiveCalendarKey(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-800 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer font-medium shadow-2xs"
              >
                <option value="none">Standard Working Day (Normal Schedule)</option>
                <option value="weekend">🎉 Weekend Inflow (More Walk-in Diners)</option>
                <option value="diwali">🪔 Diwali Festive Feast (+45% Surge)</option>
                <option value="eid">🌙 Eid Celebration (+40% Surge)</option>
                <option value="christmas">🎄 Year-End Gathering (+35% Surge)</option>
                <option value="exam_period">📚 Exam Period (Late Dining Utilization)</option>
                <option value="semester_break">🏖️ Semester Break / Vacations (-55% Dip)</option>
              </select>
            </div>

            {/* Headcount Stepper + Range */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-semibold text-stone-800 block">
                    Usual Daily Diners (Headcount)
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Baseline diners attending meals today
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                  <button
                    type="button"
                    onClick={() => handleHeadcountStep(-50)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="20"
                    max="3000"
                    step="10"
                    value={baseHeadcount}
                    onChange={(e) => setBaseHeadcount(Math.max(20, Number(e.target.value) || 20))}
                    className="w-16 text-center font-mono font-bold text-sm bg-transparent border-0 focus:outline-hidden text-blue-800"
                  />
                  <span className="text-xs font-semibold text-stone-500 pr-1.5 font-mono">
                    people
                  </span>
                  <button
                    type="button"
                    onClick={() => handleHeadcountStep(50)}
                    className="w-7 h-7 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <input
                  type="range"
                  min="50"
                  max="1500"
                  step="25"
                  value={baseHeadcount}
                  onChange={(e) => setBaseHeadcount(Number(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-stone-400 mt-1">
                  <span>50 diners</span>
                  <span className="text-blue-700 font-bold">
                    {baseHeadcount} diners baseline
                  </span>
                  <span>1,500 diners</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: COLORFUL & PREMIUM LIVE AI RESULTS ================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-600" />
              Live AI Results &amp; Impact
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Deterministic Real-time
            </span>
          </div>

          {/* 1. HERO RESULT CARD: MEALS RECOVERABLE */}
          <div className="p-6 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/10 shadow-sm space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-700" />
                How Many Meals Will This Feed?
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                Verified Portioning
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-1">
              <span
                className="text-4xl sm:text-5xl font-serif font-extrabold text-emerald-700 tracking-tight"
                suppressHydrationWarning
              >
                ~{urgencyResult.estimatedMeals}
              </span>
              <div className="leading-tight">
                <div className="text-lg font-bold text-stone-900">
                  Full Meals Provided
                </div>
                <div className="text-[11px] text-emerald-800 font-mono font-semibold">
                  Standard 450g per plate portion
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-emerald-200/60 shadow-2xs">
              {foodName.trim() ? (
                <span>
                  Your batch of <strong className="text-stone-900">{foodName}</strong> ({quantity} {unit}) will feed approximately{" "}
                  <strong className="text-emerald-800">{urgencyResult.estimatedMeals} people</strong> via verified local non-profit community kitchens.
                </span>
              ) : (
                <span>
                  This batch of {quantity} {unit} will provide approximately{" "}
                  <strong className="text-emerald-800">{urgencyResult.estimatedMeals} full plates of food</strong> for community redistribution.
                </span>
              )}
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-center">
                <span className="text-[10px] text-stone-500 font-medium block">
                  Usable Portion Weight
                </span>
                <span className="text-xs font-mono font-bold text-emerald-900" suppressHydrationWarning>
                  {urgencyResult.estimatedMeals * 0.45} kg food
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-center">
                <span className="text-[10px] text-stone-500 font-medium block">
                  CO₂e Offset Projected
                </span>
                <span className="text-xs font-mono font-bold text-emerald-900" suppressHydrationWarning>
                  ~{(urgencyResult.estimatedMeals * 0.45 * 2.5).toFixed(1)} kg CO₂
                </span>
              </div>
            </div>
          </div>

          {/* 2. FOOD SAFETY & DISPATCH WINDOW CARD */}
          <div
            className={`p-6 rounded-2xl border ${aiSafeComputation.tierColor.bg} ${aiSafeComputation.tierColor.border} shadow-sm space-y-3.5 transition-all`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${aiSafeComputation.tierColor.dot} animate-pulse`}
                />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Safe Distribution Window
                </span>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold shadow-2xs ${aiSafeComputation.tierColor.badge}`}
              >
                {aiSafeComputation.tierLabel}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <span className="text-xs text-stone-500 block">
                  Time Left for Pickup:
                </span>
                <span
                  className={`font-serif text-3xl font-extrabold ${aiSafeComputation.tierColor.text}`}
                  suppressHydrationWarning
                >
                  {aiSafeComputation.isExpired
                    ? "Expired (Do Not Distribute)"
                    : `${aiSafeComputation.remainingSafeHours} Hours Remaining`}
                </span>
              </div>

              <div className="text-right text-xs text-stone-600 font-mono bg-white/80 px-2.5 py-1.5 rounded-lg border border-stone-200 shadow-2xs">
                <div>Safe Life: ~{aiSafeComputation.effectiveShelfLifeHours}h</div>
                <div>Elapsed: -{aiSafeComputation.elapsedStoredHours}h</div>
              </div>
            </div>

            {/* Visual Multi-Color Progress Gauge */}
            <div className="space-y-1.5">
              <div className="h-3 w-full bg-stone-200/90 rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    aiSafeComputation.isExpired
                      ? "bg-red-700"
                      : aiSafeComputation.urgencyTier === "critical_red"
                      ? "bg-gradient-to-r from-red-500 to-rose-600"
                      : aiSafeComputation.urgencyTier === "urgent_yellow"
                      ? "bg-gradient-to-r from-amber-400 to-amber-600"
                      : "bg-gradient-to-r from-emerald-500 to-teal-600"
                  }`}
                  style={{ width: `${remainingPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-stone-500 font-mono font-medium">
                <span className="text-red-700 font-bold">🔴 &lt;2h Urgent</span>
                <span className="text-amber-700 font-bold">🟡 2-6h Standard</span>
                <span className="text-emerald-700 font-bold">🟢 &gt;6h Safe Buffer</span>
              </div>
            </div>

            {/* Plain English Recommendation */}
            <div className="text-xs bg-white/90 p-3 rounded-xl border border-stone-200/80 leading-relaxed shadow-2xs">
              <div className="font-semibold text-stone-800 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {aiSafeComputation.recommendedAction}
              </div>
              <p className="text-stone-600">
                {urgencyResult.isHighPriorityDispatch ? (
                  <span className="text-rose-700 font-semibold">
                    ⚠️ Priority Notice: Less than 2 hours remaining. Listing this food now will tag nearby volunteers with instant urgent alerts.
                  </span>
                ) : (
                  <span>
                    💡 <strong>Food Safety Note:</strong> {aiSafeComputation.rationale}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 3. KITCHEN DEMAND FORECAST CARD */}
          <div className="p-6 rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-500/10 via-white to-indigo-500/5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-700" />
                Kitchen Demand Forecast
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs ${demandResult.trajectoryBadgeColor.bg} ${demandResult.trajectoryBadgeColor.text} ${demandResult.trajectoryBadgeColor.border}`}
              >
                {demandResult.trajectoryLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white border border-blue-200/70 shadow-2xs">
                <span className="text-[11px] text-stone-500 block font-medium">
                  Expected Diners Today
                </span>
                <span className="font-serif text-2xl font-bold text-stone-900" suppressHydrationWarning>
                  {demandResult.predictedDemandPlates}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold block mt-0.5">
                  Baseline: {baseHeadcount} diners
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-blue-200/70 shadow-2xs">
                <span className="text-[11px] text-stone-500 block font-medium">
                  Forecast Confidence
                </span>
                <span className="font-serif text-2xl font-bold text-emerald-700" suppressHydrationWarning>
                  {demandResult.confidencePercent}%
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  Weather + Calendar AI
                </span>
              </div>
            </div>

            <div className="text-xs text-stone-700 bg-white/80 p-3 rounded-xl border border-blue-200/50 leading-relaxed shadow-2xs">
              🍳 <strong>Chef &amp; Kitchen Tip:</strong>{" "}
              {demandResult.recommendedPreparationAdvice}
            </div>
          </div>

          {/* 4. ONE-CLICK DISPATCH CTA BUTTON */}
          <div className="pt-1">
            <Link
              href={surplusListingUrl}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-3 shadow-md hover:shadow-lg active:scale-[0.99] cursor-pointer"
            >
              <span>Post This Food for NGO Pickup →</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </Link>
            <p className="text-[11px] text-center text-stone-500 mt-2">
              Automatically pre-fills the Surplus Listing with this dish, quantity ({quantity} {unit}), and safety window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
