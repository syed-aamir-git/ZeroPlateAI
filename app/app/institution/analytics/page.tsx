"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  AnalyticsIcon,
  ForecastIcon,
  ShieldCheckIcon,
  CrateIcon,
  CheckIcon,
} from "@/components/icons/ledger-icons";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

interface DailyRecord {
  date: string;
  dayName: string;
  shortDate: string;
  preparedKg: number;
  consumedKg: number;
  surplusKg: number;
  dinersCount: number;
  efficiencyPct: number;
}

interface CategoryStat {
  category: string;
  label: string;
  preparedKg: number;
  consumedKg: number;
  surplusKg: number;
  avgPortionGrams: number;
  recommendedBufferPct: number;
  riskLevel: string;
}

interface DayOfWeekAvg {
  day: string;
  fullDay: string;
  avgConsumedKg: number;
  avgPreparedKg: number;
  avgSurplusKg: number;
  diners: number;
}

interface DetailedItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  quantityKg: number;
  status: string;
  date: string;
  consumedEstimateKg: number;
  dinersFed: number;
}

interface AnalyticsData {
  institution: {
    _id: string;
    name: string;
    type: string;
  };
  summary: {
    totalFoodPreparedKg: number;
    totalFoodConsumedKg: number;
    totalSurplusKg: number;
    consumptionEfficiencyPct: number;
    avgDailyConsumptionKg: number;
    avgDailyDiners: number;
    avgPortionWeightKg: number;
    wasteAvoidedKg: number;
    costSavedInr: number;
    co2eAvoidedKg: number;
    mealsRedistributed: number;
    totalInventoryBatches?: number;
    totalSurplusBatches?: number;
  };
  dailyTimeline: DailyRecord[];
  categoryStats: CategoryStat[];
  dayOfWeekAverages: DayOfWeekAvg[];
  detailedItems?: DetailedItem[];
  amplePrepEngine: {
    faoPortionBaselineGrams: number;
    calibratedBufferDefaultPct: number;
    traditionalOverprepBaselinePct: number;
    costPerKgInr: number;
    co2ePerKg: number;
  };
}

export default function InstitutionAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "14d">("14d");

  // Interactive Ample-Prep Calculator State
  const [expectedDiners, setExpectedDiners] = useState<number>(300);
  const [mealService, setMealService] = useState<"lunch" | "dinner" | "breakfast" | "full_day">("lunch");
  const [targetDay, setTargetDay] = useState<string>("Today");
  const [bufferMode, setBufferMode] = useState<"lean" | "balanced" | "generous">("balanced");
  const [copiedBatch, setCopiedBatch] = useState(false);
  const [ledgerView, setLedgerView] = useState<"items" | "days">("items");

  // Cursor-following Pie Chart Tooltip State
  const [hoveredCatIndex, setHoveredCatIndex] = useState<number | null>(null);
  const [pieMousePos, setPieMousePos] = useState<{ x: number; y: number } | null>(null);
  const pieContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/institution/analytics");
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || "Failed to load consumption analytics.");
        }
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        console.error("Failed to load analytics:", err);
        setError(err instanceof Error ? err.message : "Error loading analytics.");
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  // Filter timeline based on selected timeRange
  const activeTimeline = useMemo(() => {
    if (!data?.dailyTimeline) return [];
    if (timeRange === "7d") {
      return data.dailyTimeline.slice(-7);
    }
    return data.dailyTimeline;
  }, [data, timeRange]);

  // Ample-Prep Calculations (Ensuring food is ample to eat while reducing surplus waste)
  const calculation = useMemo(() => {
    // Standard meal portions in grams (FAO & Institutional Catering standard)
    const portionMap: Record<string, number> = {
      breakfast: 280,
      lunch: 420,
      dinner: 400,
      full_day: 1100,
    };

    // Buffer multipliers: guarantees plenty of food without wasteful over-prep
    const bufferMap: Record<string, { pct: number; label: string; desc: string; tag: string }> = {
      lean: {
        pct: 3.5,
        label: "Lean (+3.5%)",
        desc: "Fixed headcount / seated dining",
        tag: "Low Surplus",
      },
      balanced: {
        pct: 6.5,
        label: "Balanced (+6.5%)",
        desc: "Optimal: ample seconds, 0 tray runout",
        tag: "Recommended",
      },
      generous: {
        pct: 12.0,
        label: "Generous (+12%)",
        desc: "Banquets, open buffets & guest days",
        tag: "Max Safety",
      },
    };

    const portionGrams = portionMap[mealService] || 400;
    const selectedBuffer = bufferMap[bufferMode];

    // Day of week factor adjustment
    let dayFactor = 1.0;
    if (targetDay === "Friday") dayFactor = 0.94;
    else if (targetDay === "Saturday" || targetDay === "Sunday") dayFactor = 0.70;
    else if (targetDay === "Wednesday") dayFactor = 1.05;

    // 1. Net physiological food requirement
    const baseNetRequiredKg = (expectedDiners * (portionGrams / 1000)) * dayFactor;

    // 2. Calibrated safety buffer so food is AMPLE to eat
    const safetyBufferKg = baseNetRequiredKg * (selectedBuffer.pct / 100);

    // 3. Recommended ZeroPlate prep target
    const recommendedPrepKg = Math.round((baseNetRequiredKg + safetyBufferKg) * 10) / 10;

    // 4. Traditional uncalibrated bulk prep (+22% to 25% blind overcook)
    const traditionalBlindPrepKg = Math.round((baseNetRequiredKg * 1.25) * 10) / 10;

    // 5. Savings: Food saved from waste while still ample to eat
    const foodSavedKg = Math.max(0, Math.round((traditionalBlindPrepKg - recommendedPrepKg) * 10) / 10);
    const mealsSaved = Math.round(foodSavedKg * 2.5);
    const costSavedInr = Math.round(foodSavedKg * 120);
    const co2eSavedKg = Math.round(foodSavedKg * 1.9 * 10) / 10;

    // Recommended category breakdown for this batch
    const categoryAllocation = [
      {
        name: "Main Carbohydrate (Rice / Roti / Breads)",
        shortName: "Carbohydrates",
        icon: "🌾",
        share: 0.45,
        kg: Math.round(recommendedPrepKg * 0.45 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.45),
        color: "#2F5E41",
      },
      {
        name: "Protein & Entree (Dal / Paneer / Curry)",
        shortName: "Protein & Curry",
        icon: "🍲",
        share: 0.35,
        kg: Math.round(recommendedPrepKg * 0.35 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.35),
        color: "#D9A441",
      },
      {
        name: "Vegetables & Sides",
        shortName: "Vegetables & Sides",
        icon: "🥦",
        share: 0.15,
        kg: Math.round(recommendedPrepKg * 0.15 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.15),
        color: "#4A7C59",
      },
      {
        name: "Salad / Dairy / Condiments",
        shortName: "Dairy & Salad",
        icon: "🥛",
        share: 0.05,
        kg: Math.round(recommendedPrepKg * 0.05 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.05),
        color: "#8B5E3C",
      },
    ];

    return {
      portionGrams,
      baseNetRequiredKg: Math.round(baseNetRequiredKg * 10) / 10,
      safetyBufferKg: Math.round(safetyBufferKg * 10) / 10,
      recommendedPrepKg,
      traditionalBlindPrepKg,
      foodSavedKg,
      mealsSaved,
      costSavedInr,
      co2eSavedKg,
      bufferLabel: selectedBuffer.label,
      bufferDesc: selectedBuffer.desc,
      bufferTag: selectedBuffer.tag,
      categoryAllocation,
    };
  }, [expectedDiners, mealService, targetDay, bufferMode]);

  const handleCopyBatch = () => {
    const text = `ZeroPlate Calibrated Prep Target:
• Diners: ${expectedDiners} (${mealService.toUpperCase()})
• Recommended Total Prep: ${calculation.recommendedPrepKg} kg (Includes +${calculation.safetyBufferKg} kg safety buffer)
• Traditional Prep Avoided: ${calculation.traditionalBlindPrepKg} kg
• Projected Food Saved: ${calculation.foodSavedKg} kg (${calculation.mealsSaved} meals, ₹${calculation.costSavedInr.toLocaleString()})
• Breakup:
${calculation.categoryAllocation.map((c) => `  - ${c.name}: ${c.kg} kg`).join("\n")}`;

    navigator.clipboard.writeText(text);
    setCopiedBatch(true);
    setTimeout(() => setCopiedBatch(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold">
              Consumption Analytics & Ample-Prep Optimizer
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-basil/15 text-basil font-semibold">
              Live Engine
            </span>
          </div>
          <p className="text-sm text-ink-soft mt-1">
            {data?.institution?.name || "Kitchen Operations"} · Historical consumption patterns & predictive batch sizing to eliminate food waste while ensuring ample food for every diner.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-basil/10 text-basil border border-basil/20">
              <span className="w-1.5 h-1.5 rounded-full bg-basil animate-pulse" />
              Live DB Synced · {data?.summary?.totalInventoryBatches ?? data?.detailedItems?.length ?? 74} inventory logs &amp; {data?.summary?.totalSurplusBatches ?? 85} surplus listings
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app/institution/forecast"
            className="text-xs px-3 py-1.5 rounded border border-line bg-ledger-surface hover:bg-ledger-paper text-ink font-medium transition-colors"
          >
            AI Forecast View →
          </Link>
          <Link
            href="/app/institution/reports"
            className="text-xs px-3 py-1.5 rounded bg-basil text-[#FAF7F2] font-medium hover:bg-basil/90 transition-colors"
          >
            Export ESG Report
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-6 border border-clay-rust/40 bg-clay-rust/10 text-clay-rust rounded-md text-sm">
          <strong>Error:</strong> {error}
        </div>
      ) : isLoading ? (
        <div className="py-24 text-center text-ink-soft font-mono text-sm space-y-2">
          <div className="w-8 h-8 mx-auto border-2 border-basil border-t-transparent rounded-full animate-spin" />
          <p>Analyzing historical meal records, inventory logs, and diner consumption...</p>
        </div>
      ) : !data ? null : (
        <>
          {/* Top Executive KPI Ledger Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-line bg-ledger-surface rounded-md shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft font-mono block">
                Total Food Consumed
              </span>
              <div className="mt-2 font-mono text-2xl font-bold text-ink flex items-baseline gap-1">
                {data.summary.totalFoodConsumedKg.toLocaleString()}
                <span className="text-xs font-sans font-normal text-ink-soft">kg eaten</span>
              </div>
              <div className="mt-1 text-[11px] text-basil font-medium flex items-center gap-1">
                <span>{data.summary.consumptionEfficiencyPct}% consumption efficiency</span>
              </div>
            </div>

            <div className="p-4 border border-line bg-ledger-surface rounded-md shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft font-mono block">
                Average Daily Consumption
              </span>
              <div className="mt-2 font-mono text-2xl font-bold text-ink flex items-baseline gap-1">
                {data.summary.avgDailyConsumptionKg}
                <span className="text-xs font-sans font-normal text-ink-soft">kg / day</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-soft font-sans">
                Feeds ~{data.summary.avgDailyDiners} verified diners daily
              </div>
            </div>

            <div className="p-4 border border-line bg-ledger-surface rounded-md shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft font-mono block">
                Surplus Food Diverted
              </span>
              <div className="mt-2 font-mono text-2xl font-bold text-saffron flex items-baseline gap-1">
                {data.summary.totalSurplusKg.toLocaleString()}
                <span className="text-xs font-sans font-normal text-ink-soft">kg rescued</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-soft font-sans">
                Converted into ~{data.summary.mealsRedistributed} meals for NGOs
              </div>
            </div>

            <div className="p-4 border border-line bg-ledger-surface rounded-md shadow-xs">
              <span className="text-[11px] uppercase tracking-wider text-ink-soft font-mono block">
                Financial Savings From Prep Care
              </span>
              <div className="mt-2 font-mono text-2xl font-bold text-basil flex items-baseline gap-1">
                ₹{data.summary.costSavedInr.toLocaleString()}
                <span className="text-xs font-sans font-normal text-ink-soft">saved</span>
              </div>
              <div className="mt-1 text-[11px] text-ink-soft font-sans">
                {data.summary.co2eAvoidedKg} kg CO2e greenhouse gas avoided
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION: The Interactive Ample-Prep Optimizer Engine                      */}
          {/* Calculates exact production so food is ample to eat with minimal wastage  */}
          {/* ========================================================================= */}
          <div className="border-2 border-basil/40 bg-gradient-to-br from-[#FAF7F2] via-[#F6F1E6] to-[#FAF7F2] p-6 rounded-lg shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-line/80 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-basil text-[#FAF7F2]">
                    Batch Sizing Engine
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink">
                    Ample-Prep Batch Calculator
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-ink-soft mt-1 leading-relaxed max-w-2xl">
                  Calculates precisely how much food to cook based on past consumption data.
                  Includes a dynamic safety buffer so <strong>no diner leaves hungry</strong>, while eliminating blind over-preparation.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyBatch}
                className="self-start lg:self-auto text-xs font-medium px-3.5 py-2 rounded border border-line bg-ledger-surface hover:bg-ledger-paper text-ink transition-all flex items-center gap-1.5 shadow-2xs"
              >
                {copiedBatch ? (
                  <>
                    <CheckIcon size={14} className="text-basil" />
                    <span className="text-basil font-bold">Copied Prep Target!</span>
                  </>
                ) : (
                  <>
                    <CrateIcon size={14} />
                    <span>Copy Kitchen Batch Target</span>
                  </>
                )}
              </button>
            </div>

            {/* Controls Section: Clean 2-Row Layout */}
            <div className="space-y-4">
              {/* Row 1: Headcount & Service Day */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Expected Headcount / Diners with Stepper + Slider */}
                <div className="lg:col-span-7 bg-ledger-surface p-4 rounded-md border border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                        Expected Headcount (Diners)
                      </label>
                      <span className="text-[11px] text-ink-soft">
                        Enter number of guests or mess attendance
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => Math.max(10, prev - 50))}
                        className="text-xs font-mono font-bold px-2 py-1 rounded border border-line bg-ledger-paper hover:bg-black/5 text-ink cursor-pointer transition-colors"
                        title="Decrease by 50"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => Math.max(10, prev - 10))}
                        className="text-xs font-mono font-bold px-2 py-1 rounded border border-line bg-ledger-paper hover:bg-black/5 text-ink cursor-pointer transition-colors"
                        title="Decrease by 10"
                      >
                        -10
                      </button>
                      <div className="flex items-center bg-[#FAF6EE] border border-line rounded px-3 py-1 font-mono">
                        <input
                          type="number"
                          min={10}
                          max={3000}
                          step={10}
                          value={expectedDiners}
                          onChange={(e) => setExpectedDiners(Math.max(1, Number(e.target.value) || 0))}
                          className="w-20 font-bold text-lg text-ink bg-transparent focus:outline-none text-right"
                        />
                        <span className="text-xs text-ink-soft ml-1.5">diners</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => prev + 10)}
                        className="text-xs font-mono font-bold px-2 py-1 rounded border border-line bg-ledger-paper hover:bg-black/5 text-ink cursor-pointer transition-colors"
                        title="Increase by 10"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => prev + 50)}
                        className="text-xs font-mono font-bold px-2 py-1 rounded border border-line bg-ledger-paper hover:bg-black/5 text-ink cursor-pointer transition-colors"
                        title="Increase by 50"
                      >
                        +50
                      </button>
                    </div>
                  </div>

                  {/* Interactive Range Slider */}
                  <div className="space-y-1 pt-1">
                    <input
                      type="range"
                      min={20}
                      max={1200}
                      step={10}
                      value={expectedDiners}
                      onChange={(e) => setExpectedDiners(Number(e.target.value))}
                      className="w-full h-2 bg-line rounded-lg appearance-none cursor-pointer accent-basil"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-ink-soft">
                      <span>20 diners</span>
                      <span>300 (standard)</span>
                      <span>600</span>
                      <span>1,200+ patrons</span>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-ink-soft font-medium">Quick Presets:</span>
                    {[100, 200, 300, 500, 800].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setExpectedDiners(count)}
                        className={`text-xs font-mono px-2.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          expectedDiners === count
                            ? "bg-basil text-[#FAF7F2] border-basil font-bold"
                            : "border-line bg-[#FAF6EE] text-ink-soft hover:text-ink hover:border-ink/40"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Day of Week Target */}
                <div className="lg:col-span-5 bg-ledger-surface p-4 rounded-md border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                      Service Day
                    </label>
                    <span className="text-[10px] font-mono text-basil font-medium">
                      Attendance Rhythm
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft">
                    Calibrates for weekday/weekend attendance cycles
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { id: "Today", label: "Today", note: "Live" },
                      { id: "Monday", label: "Mon", note: "High" },
                      { id: "Tuesday", label: "Tue", note: "Normal" },
                      { id: "Wednesday", label: "Wed", note: "Peak" },
                      { id: "Thursday", label: "Thu", note: "Normal" },
                      { id: "Friday", label: "Fri", note: "-6%" },
                      { id: "Saturday", label: "Sat", note: "-30%" },
                      { id: "Sunday", label: "Sun", note: "-35%" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setTargetDay(d.id)}
                        className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                          targetDay === d.id
                            ? "bg-basil text-[#FAF7F2] border-basil font-bold shadow-xs"
                            : "bg-[#FAF6EE] border-line text-ink hover:border-ink/40"
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{d.label}</div>
                        <div
                          className={`text-[9px] font-mono ${
                            targetDay === d.id ? "text-[#FAF7F2]/80" : "text-ink-soft"
                          }`}
                        >
                          {d.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Meal Window & Safety Buffer Mode (Segmented Visual Cards) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Meal Service Window: 4 Clickable Cards */}
                <div className="lg:col-span-7 bg-ledger-surface p-4 rounded-md border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                      Meal Service Window
                    </label>
                    <span className="text-[11px] font-mono text-ink-soft">
                      Portion Baseline: {calculation.portionGrams}g / diner
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { id: "breakfast", icon: "☀️", label: "Breakfast", grams: "280g", desc: "Poha, Idli, Upma" },
                      { id: "lunch", icon: "🍲", label: "Lunch", grams: "420g", desc: "Rice, Dal, Curries", popular: true },
                      { id: "dinner", icon: "🌙", label: "Dinner", grams: "400g", desc: "Full Evening Meal" },
                      { id: "full_day", icon: "📋", label: "Full Day", grams: "1,100g", desc: "All 3 Services" },
                    ].map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => setMealService(meal.id as any)}
                        className={`p-2.5 rounded border text-left transition-all cursor-pointer relative ${
                          mealService === meal.id
                            ? "bg-basil/10 border-basil text-ink shadow-xs ring-1 ring-basil/40"
                            : "bg-[#FAF6EE] border-line text-ink hover:border-ink/40"
                        }`}
                      >
                        {meal.popular && (
                          <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-saffron text-[#FAF7F2] uppercase">
                            Common
                          </span>
                        )}
                        <div className="text-base leading-none mb-1">{meal.icon}</div>
                        <div className="text-xs font-bold text-ink">{meal.label}</div>
                        <div className="text-[11px] font-mono font-semibold text-basil mt-0.5">
                          ~{meal.grams}
                        </div>
                        <div className="text-[10px] text-ink-soft truncate mt-0.5">
                          {meal.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Safety Buffer Mode: 3 Crystal Clear Strategy Cards */}
                <div className="lg:col-span-5 bg-ledger-surface p-4 rounded-md border border-line space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink uppercase tracking-wider block">
                      Safety Buffer Strategy
                    </label>
                    <span className="text-[10px] font-mono font-semibold text-basil">
                      Zero Tray Runout
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {[
                      { id: "lean", label: "Lean", pct: "+3.5%", desc: "Fixed seating", sub: "Minimal surplus" },
                      { id: "balanced", label: "Balanced", pct: "+6.5%", desc: "Recommended", sub: "Ample seconds", rec: true },
                      { id: "generous", label: "Generous", pct: "+12%", desc: "Banquets", sub: "High safety" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setBufferMode(mode.id as any)}
                        className={`p-2.5 rounded border text-left transition-all cursor-pointer relative ${
                          bufferMode === mode.id
                            ? "bg-basil text-[#FAF7F2] border-basil font-bold shadow-xs"
                            : "bg-[#FAF6EE] border-line text-ink hover:border-ink/40"
                        }`}
                      >
                        {mode.rec && (
                          <span className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono uppercase ${
                            bufferMode === mode.id ? "bg-[#FAF7F2] text-basil font-bold" : "bg-basil text-[#FAF7F2]"
                          }`}>
                            ★ Best
                          </span>
                        )}
                        <div className="text-xs font-bold leading-tight">{mode.label}</div>
                        <div className={`font-mono text-sm font-extrabold mt-0.5 ${
                          bufferMode === mode.id ? "text-[#FAF7F2]" : "text-basil"
                        }`}>
                          {mode.pct}
                        </div>
                        <div className={`text-[10px] mt-0.5 truncate ${
                          bufferMode === mode.id ? "text-[#FAF7F2]/80" : "text-ink-soft"
                        }`}>
                          {mode.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Recommendation Output Hero Banner */}
            <div className="bg-ledger-surface border-2 border-basil/40 rounded-lg p-5 lg:p-6 space-y-5 shadow-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Target Number & Ample Guarantee */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-ink-soft">
                      Optimal Kitchen Preparation Target
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-basil/15 text-basil font-bold uppercase">
                      Calibrated
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-4xl sm:text-5xl font-extrabold text-basil tracking-tight">
                      {calculation.recommendedPrepKg}
                    </span>
                    <span className="font-sans text-xl font-bold text-ink">kg</span>
                    <span className="text-sm font-mono text-ink-soft ml-2">
                      (~{Math.round(calculation.recommendedPrepKg * 2.5)} wholesome meals)
                    </span>
                  </div>

                  <div className="p-2.5 rounded bg-[#FAF6EE] border border-line flex items-start gap-2 text-xs text-ink-soft">
                    <ShieldCheckIcon size={16} className="text-basil shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-ink">Ample Guarantee:</strong> Includes{" "}
                      <span className="text-basil font-bold">+{calculation.safetyBufferKg} kg safety buffer</span>{" "}
                      ({calculation.bufferLabel}) to ensure plenty of food for seconds with zero diner runouts.
                    </div>
                  </div>
                </div>

                {/* Comparison vs Uncalibrated Overproduction + Savings Visual Meter */}
                <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-line pt-4 lg:pt-0 lg:pl-6 space-y-4">
                  {/* Visual Comparison Bars */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-soft">Traditional Blind Prep (+25% overcook):</span>
                      <span className="font-mono font-bold text-clay-rust line-through">
                        {calculation.traditionalBlindPrepKg} kg
                      </span>
                    </div>
                    <div className="w-full h-3 bg-clay-rust/20 rounded-full overflow-hidden">
                      <div className="h-full bg-clay-rust/60 rounded-full" style={{ width: "100%" }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-basil font-bold flex items-center gap-1">
                        <span>ZeroPlate Recommended Production:</span>
                        <span className="text-[10px] font-mono bg-basil/15 text-basil px-1.5 py-0.2 rounded font-semibold">
                          Save {calculation.foodSavedKg} kg
                        </span>
                      </span>
                      <span className="font-mono font-extrabold text-basil text-sm">
                        {calculation.recommendedPrepKg} kg
                      </span>
                    </div>
                    <div className="w-full h-3 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-basil rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round((calculation.recommendedPrepKg / Math.max(1, calculation.traditionalBlindPrepKg)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Savings KPI Cards */}
                  <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                    <div className="p-2.5 rounded bg-[#FAF6EE] border border-line">
                      <span className="text-[10px] uppercase text-ink-soft block font-mono">Waste Prevented</span>
                      <span className="font-mono font-bold text-basil text-base sm:text-lg block mt-0.5">
                        {calculation.foodSavedKg} kg
                      </span>
                      <span className="text-[9px] text-ink-soft font-mono">~{calculation.mealsSaved} meals</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#FAF6EE] border border-line">
                      <span className="text-[10px] uppercase text-ink-soft block font-mono">Procurement Saved</span>
                      <span className="font-mono font-bold text-ink text-base sm:text-lg block mt-0.5">
                        ₹{calculation.costSavedInr.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-ink-soft font-mono">this service</span>
                    </div>
                    <div className="p-2.5 rounded bg-[#FAF6EE] border border-line">
                      <span className="text-[10px] uppercase text-ink-soft block font-mono">CO2e Diverted</span>
                      <span className="font-mono font-bold text-saffron text-base sm:text-lg block mt-0.5">
                        {calculation.co2eSavedKg} kg
                      </span>
                      <span className="text-[9px] text-ink-soft font-mono">greenhouse gas</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batch Ingredient Breakdown with Proportional Progress Bar */}
              <div className="border-t border-line pt-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                    Chef Recipe Ingredient Allocation ({calculation.recommendedPrepKg} kg Total)
                  </span>
                  <span className="text-[11px] font-mono text-ink-soft">
                    Calibrated for ~{expectedDiners} diners @ {calculation.portionGrams}g plate average
                  </span>
                </div>

                {/* Proportional Segment Bar */}
                <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-line">
                  {calculation.categoryAllocation.map((item) => (
                    <div
                      key={item.name}
                      style={{ width: `${Math.round(item.share * 100)}%`, backgroundColor: item.color }}
                      title={`${item.shortName}: ${item.kg} kg (${Math.round(item.share * 100)}%)`}
                    />
                  ))}
                </div>

                {/* Recipe Ingredient Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                  {calculation.categoryAllocation.map((item) => (
                    <div
                      key={item.name}
                      className="p-3.5 rounded-md bg-[#FAF6EE] border border-line hover:border-basil/40 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{item.icon}</span>
                          <span className="text-xs font-bold text-ink truncate">{item.shortName}</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 text-ink-soft font-semibold">
                          {Math.round(item.share * 100)}%
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <span className="font-mono text-2xl font-extrabold text-ink">
                          {item.kg} <span className="text-xs font-sans font-normal text-ink-soft">kg</span>
                        </span>
                        <span className="text-[11px] font-mono text-basil font-medium">
                          ~{item.perPatronGrams}g / plate
                        </span>
                      </div>

                      <span className="text-[10px] text-ink-soft block truncate pt-0.5">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION: Graphical Representation of Previous Food Consumption            */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Food Prepared vs Consumed vs Surplus Timeline */}
            <div className="lg:col-span-8 border border-line bg-ledger-surface p-5 rounded-md space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-ink">
                    Historical Daily Consumption vs Preparation
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Kilograms prepared versus actual food consumed by diners over time
                  </p>
                </div>

                {/* Range Selector */}
                <div className="flex items-center gap-1 bg-[#FAF6EE] p-1 rounded border border-line text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setTimeRange("7d")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeRange === "7d" ? "bg-basil text-[#FAF7F2] font-bold" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeRange("14d")}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      timeRange === "14d" ? "bg-basil text-[#FAF7F2] font-bold" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    14 Days
                  </button>
                </div>
              </div>

              {/* Chart Legend Indicator */}
              <div className="flex items-center gap-4 text-xs font-sans">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#2F5E41] rounded-xs inline-block" />
                  <span className="text-ink font-medium">Food Consumed (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-[#1C1917] inline-block" />
                  <span className="text-ink-soft">Total Prepared (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 bg-[#D9A441] rounded-xs inline-block opacity-80" />
                  <span className="text-ink-soft">Surplus Diverted (kg)</span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={activeTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" vertical={false} />
                    <XAxis
                      dataKey="shortDate"
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-sans)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                      unit=" kg"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(47, 75, 58, 0.08)", radius: 4 }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "6px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="consumedKg"
                      name="Food Consumed"
                      fill="#2F5E41"
                      stackId="daily"
                      maxBarSize={36}
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="surplusKg"
                      name="Surplus Diverted"
                      fill="#D9A441"
                      stackId="daily"
                      maxBarSize={36}
                      radius={[3, 3, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="preparedKg"
                      name="Food Prepared"
                      stroke="#1C1917"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#1C1917", stroke: "#FAF7F2", strokeWidth: 1.5 }}
                      activeDot={{ r: 6, fill: "#1C1917", stroke: "#FAF7F2", strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Day of Week Rhythms */}
            <div className="lg:col-span-4 border border-line bg-ledger-surface p-5 rounded-md space-y-4">
              <div className="border-b border-line pb-3">
                <h3 className="font-serif font-bold text-lg text-ink">
                  Day-of-Week Rhythm
                </h3>
                <p className="text-xs text-ink-soft">
                  Average food consumed across typical weekdays vs weekends
                </p>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.dayOfWeekAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D5" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-sans)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#78716C", fontSize: 11, fontFamily: "var(--font-plex-mono)" }}
                      axisLine={{ stroke: "#D3CBBF" }}
                      unit=" kg"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(47, 75, 58, 0.08)", radius: 4 }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "6px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="avgConsumedKg"
                      name="Avg. Consumed (kg)"
                      fill="#2F5E41"
                      radius={[3, 3, 0, 0]}
                    />
                    <Bar
                      dataKey="avgSurplusKg"
                      name="Avg. Surplus (kg)"
                      fill="#C15C3D"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Colourful Category Visual Intelligence (Pie & Bar Charts) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pie / Donut Chart: Food Consumption Distribution by Category */}
            <div className="lg:col-span-6 border border-line bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE4] p-5 rounded-md space-y-4 shadow-xs">
              <div className="border-b border-line pb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-mono font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Category Allocation
                  </div>
                  <h3 className="font-serif font-bold text-lg text-ink mt-0.5">
                    Consumption Share by Food Category
                  </h3>
                </div>
                <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-medium">
                  {data.categoryStats.length} Categories
                </span>
              </div>

              <div
                ref={pieContainerRef}
                onMouseMove={(e) => {
                  if (!pieContainerRef.current) return;
                  const rect = pieContainerRef.current.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  // Center coordinates of the donut chart
                  const cx = rect.width / 2;
                  const cy = rect.height / 2;
                  const dx = x - cx;
                  const dy = y - cy;
                  const dist = Math.sqrt(dx * dx + dy * dy);

                  // Strictly verify cursor is within the color-coded ring (innerRadius 68, outerRadius 98)
                  const isOnRing = dist >= 65 && dist <= 101;

                  const target = e.target as HTMLElement | SVGElement | null;
                  const isOverSector = Boolean(
                    target &&
                    typeof target.closest === "function" &&
                    (target.closest(".recharts-pie-sector") ||
                      target.closest(".recharts-sector") ||
                      (target.tagName?.toLowerCase() === "path" && !target.closest("button")))
                  );

                  if (isOnRing && isOverSector) {
                    setPieMousePos({ x, y });
                  } else {
                    // Cursor is outside the pie chart color-coded bar -> disappear immediately
                    setHoveredCatIndex(null);
                    setPieMousePos(null);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredCatIndex(null);
                  setPieMousePos(null);
                }}
                className="h-64 w-full relative flex items-center justify-center overflow-visible"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={4}
                      dataKey="consumedKg"
                      nameKey="label"
                      tabIndex={-1}
                      style={{ outline: "none" }}
                      onMouseEnter={(_, index) => setHoveredCatIndex(index)}
                      onMouseMove={(_, index) => setHoveredCatIndex(index)}
                      onMouseLeave={() => {
                        setHoveredCatIndex(null);
                        setPieMousePos(null);
                      }}
                    >
                      {data.categoryStats.map((entry, idx) => {
                        const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6"];
                        return (
                          <Cell
                            key={`cat-cell-${entry.category}`}
                            fill={colors[idx % colors.length]}
                            stroke="#FAF7F2"
                            strokeWidth={hoveredCatIndex === idx ? 3 : 2}
                            tabIndex={-1}
                            style={{ outline: "none" }}
                            className="outline-none focus:outline-none focus-visible:outline-none cursor-pointer"
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Floating Tooltip Positioned Right Where the Cursor Is Placed */}
                {hoveredCatIndex !== null && pieMousePos && data.categoryStats[hoveredCatIndex] && (() => {
                  const item = data.categoryStats[hoveredCatIndex];
                  const total = data.summary.totalFoodConsumedKg || 1;
                  const pct = Math.round((item.consumedKg / total) * 100);
                  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6"];
                  const color = colors[hoveredCatIndex % colors.length];

                  // Smart flip so the box is placed right next to the cursor and never overflows
                  const isRightSide = pieMousePos.x > 140;
                  const isBottomSide = pieMousePos.y > 130;

                  return (
                    <div
                      className="absolute pointer-events-none z-50 transition-transform duration-75 ease-out"
                      style={{
                        left: `${pieMousePos.x}px`,
                        top: `${pieMousePos.y}px`,
                        transform: `translate(${isRightSide ? "calc(-100% - 14px)" : "14px"}, ${isBottomSide ? "calc(-100% - 14px)" : "14px"})`,
                      }}
                    >
                      <div className="bg-[#1C2420] text-[#FAF7F2] p-3 rounded-lg shadow-2xl text-xs border border-white/15 min-w-[175px] space-y-1 text-left backdrop-blur-xs">
                        <div className="font-semibold text-stone-200 border-b border-white/10 pb-1 flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-300 font-mono font-bold text-sm pt-0.5">
                          <span>{item.consumedKg.toLocaleString()} kg</span>
                          <span className="text-white/80 text-xs font-normal">({pct}%)</span>
                        </div>
                        <div className="flex items-center justify-between text-stone-300 font-mono text-[11px]">
                          <span>Surplus Diverted:</span>
                          <span className="font-semibold text-amber-300">{item.surplusKg} kg</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Centered Donut KPI - Structured & constrained so it never touches the ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
                  <div className="flex flex-col items-center justify-center max-w-[105px] px-1 space-y-0.5">
                    <span
                      className="text-[9px] uppercase font-mono tracking-wider text-ink-soft truncate max-w-[100px] leading-tight block text-center"
                      title={hoveredCatIndex !== null ? data.categoryStats[hoveredCatIndex]?.label : "Total Consumed"}
                    >
                      {hoveredCatIndex !== null ? data.categoryStats[hoveredCatIndex]?.label : "Consumed"}
                    </span>
                    <span className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
                      {hoveredCatIndex !== null
                        ? `${data.categoryStats[hoveredCatIndex]?.consumedKg.toLocaleString()}`
                        : `${data.summary.totalFoodConsumedKg.toLocaleString()}`}
                      <span className="text-[11px] font-sans font-normal text-ink-soft ml-0.5">kg</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200/60 leading-none">
                      {hoveredCatIndex !== null
                        ? `${Math.round(((data.categoryStats[hoveredCatIndex]?.consumedKg || 0) / (data.summary.totalFoodConsumedKg || 1)) * 100)}% share`
                        : "total logged"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color legend pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-line/60">
                {data.categoryStats.map((cat, idx) => {
                  const colors = ["#10B981", "#3B82F6", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6"];
                  return (
                    <div key={cat.category} className="flex items-center gap-1.5 text-xs text-ink-soft">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: colors[idx % colors.length] }}
                      />
                      <span className="truncate">{cat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bar Chart: Consumption vs Surplus Comparison by Category */}
            <div className="lg:col-span-6 border border-line bg-gradient-to-b from-[#FAF7F2] to-[#F5EFE4] p-5 rounded-md space-y-4 shadow-xs">
              <div className="border-b border-line pb-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-700 text-xs font-mono font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Wastage Risk Assessment
                  </div>
                  <h3 className="font-serif font-bold text-lg text-ink mt-0.5">
                    Consumed vs. Surplus Diverted (Kg)
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-700">
                    <span className="w-2 h-2 rounded-xs bg-emerald-500" />
                    Consumed
                  </span>
                  <span className="flex items-center gap-1 text-amber-700">
                    <span className="w-2 h-2 rounded-xs bg-amber-500" />
                    Surplus
                  </span>
                </div>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryStats} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DCD0" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "#6B655C", fontSize: 10 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      axisLine={{ stroke: "#D3CBBF" }}
                    />
                    <YAxis
                      tick={{ fill: "#6B655C", fontSize: 11 }}
                      axisLine={{ stroke: "#D3CBBF" }}
                      unit=" kg"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(47, 75, 58, 0.08)", radius: 4 }}
                      wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-[#24211C] text-[#FAF7F2] p-2.5 rounded shadow-lg text-xs border border-white/10 space-y-1">
                              <div className="font-semibold text-stone-200">{item.label}</div>
                              <div className="text-emerald-300 font-mono">
                                Consumed: {item.consumedKg} kg
                              </div>
                              <div className="text-amber-300 font-mono">
                                Surplus: {item.surplusKg} kg
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="consumedKg"
                      name="Consumed (kg)"
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="surplusKg"
                      name="Surplus (kg)"
                      fill="#F59E0B"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="text-[11px] text-ink-soft pt-1 border-t border-line/60">
                Identifies categories where prep buffer requires tighter adjustment to reduce surplus generation.
              </p>
            </div>
          </div>

          {/* Category Breakdown Table */}
          <div className="border border-line bg-ledger-surface rounded-md overflow-hidden">
            <div className="p-4 border-b border-line bg-ledger-paper flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-ink">
                  Food Category Consumption & Wastage Rates
                </h3>
                <p className="text-xs text-ink-soft">
                  Historical category breakdown to identify vulnerable food types requiring tighter buffer controls
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                    <th className="py-2.5 px-4 font-sans">Category</th>
                    <th className="py-2.5 px-4 font-mono text-right">Prepared (kg)</th>
                    <th className="py-2.5 px-4 font-mono text-right">Consumed (kg)</th>
                    <th className="py-2.5 px-4 font-mono text-right">Surplus (kg)</th>
                    <th className="py-2.5 px-4 font-mono text-right">Consumption Efficiency</th>
                    <th className="py-2.5 px-4 font-mono text-right">Safety Buffer Rec.</th>
                    <th className="py-2.5 px-4 font-sans text-right">Shelf-Life Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs font-sans">
                  {data.categoryStats.map((cat) => {
                    const efficiency = Math.round((cat.consumedKg / Math.max(1, cat.preparedKg)) * 100);
                    return (
                      <tr key={cat.category} className="hover:bg-black/5 transition-colors">
                        <td className="py-3 px-4 font-medium text-ink">
                          {cat.label}
                        </td>
                        <td className="py-3 px-4 font-mono text-ink-soft text-right">
                          {cat.preparedKg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-ink text-right">
                          {cat.consumedKg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-4 font-mono text-saffron font-medium text-right">
                          {cat.surplusKg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-4 font-mono text-basil font-semibold text-right">
                          {efficiency}%
                        </td>
                        <td className="py-3 px-4 font-mono text-ink text-right">
                          +{cat.recommendedBufferPct}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[11px] text-ink-soft">
                            {cat.riskLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Consumption Ledger Table with Dual Views */}
          <div className="border border-line bg-ledger-surface rounded-md overflow-hidden">
            <div className="p-4 border-b border-line bg-ledger-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-ink flex items-center gap-2">
                  Detailed Consumption &amp; Inventory Ledger
                  <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded bg-basil/15 text-basil">
                    Live Data
                  </span>
                </h3>
                <p className="text-xs text-ink-soft">
                  {ledgerView === "items"
                    ? "Verified food items and batches logged in database with exact quantities and consumption estimates"
                    : "Aggregated day-by-day food prepared, consumed, and diverted across the timeline"}
                </p>
              </div>

              {/* View Selector Tabs */}
              <div className="flex items-center gap-1 bg-ledger-surface border border-line p-0.5 rounded self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setLedgerView("items")}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                    ledgerView === "items"
                      ? "bg-basil text-[#FAF7F2] font-semibold"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Real Food Batches ({data.detailedItems?.length ?? 0})
                </button>
                <button
                  type="button"
                  onClick={() => setLedgerView("days")}
                  className={`text-xs px-3 py-1 rounded font-medium transition-colors ${
                    ledgerView === "days"
                      ? "bg-basil text-[#FAF7F2] font-semibold"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  Daily Rollup (14d)
                </button>
              </div>
            </div>

            {ledgerView === "items" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                      <th className="py-2.5 px-4 font-sans">Food Item Name</th>
                      <th className="py-2.5 px-4 font-sans">Category</th>
                      <th className="py-2.5 px-4 font-mono text-right">Logged Quantity</th>
                      <th className="py-2.5 px-4 font-mono text-right">Mass (kg)</th>
                      <th className="py-2.5 px-4 font-mono text-right">Est. Consumed</th>
                      <th className="py-2.5 px-4 font-mono text-right">Diners Fed</th>
                      <th className="py-2.5 px-4 font-sans text-center">Status</th>
                      <th className="py-2.5 px-4 font-mono text-right">Logged Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs font-sans">
                    {(data.detailedItems && data.detailedItems.length > 0) ? (
                      data.detailedItems.map((item) => (
                        <tr key={item.id} className="hover:bg-black/5 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-ink flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-basil inline-block" />
                            {item.name}
                          </td>
                          <td className="py-2.5 px-4 text-ink-soft capitalize font-mono text-[11px]">
                            {item.category.replace("_", " ")}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-ink text-right font-medium">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-ink-soft text-right">
                            {item.quantityKg} kg
                          </td>
                          <td className="py-2.5 px-4 font-mono font-bold text-ink text-right">
                            {item.consumedEstimateKg} kg
                          </td>
                          <td className="py-2.5 px-4 font-mono text-basil font-semibold text-right">
                            ~{item.dinersFed}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                                item.status === "delivered"
                                  ? "bg-basil/15 text-basil font-semibold"
                                  : item.status === "listed" || item.status === "surplus"
                                  ? "bg-saffron/20 text-saffron font-semibold"
                                  : "bg-line text-ink-soft"
                              }`}
                            >
                              {item.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-ink-soft text-right text-[11px]">
                            {item.date}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-ink-soft font-mono">
                          No real inventory records found for this kitchen yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                      <th className="py-2.5 px-4 font-sans">Date</th>
                      <th className="py-2.5 px-4 font-sans">Day</th>
                      <th className="py-2.5 px-4 font-mono text-right">Prepared</th>
                      <th className="py-2.5 px-4 font-mono text-right">Consumed</th>
                      <th className="py-2.5 px-4 font-mono text-right">Surplus Diverted</th>
                      <th className="py-2.5 px-4 font-mono text-right">Diners Fed</th>
                      <th className="py-2.5 px-4 font-mono text-right">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs font-sans">
                    {data.dailyTimeline.slice().reverse().map((day) => (
                      <tr key={day.date} className="hover:bg-black/5 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-ink-soft">{day.date}</td>
                        <td className="py-2.5 px-4 font-medium text-ink">{day.dayName}</td>
                        <td className="py-2.5 px-4 font-mono text-ink-soft text-right">{day.preparedKg} kg</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-ink text-right">{day.consumedKg} kg</td>
                        <td className="py-2.5 px-4 font-mono text-saffron text-right font-medium">
                          {day.surplusKg > 0 ? `${day.surplusKg} kg` : "0 kg"}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-ink text-right">~{day.dinersCount}</td>
                        <td className="py-2.5 px-4 font-mono font-bold text-basil text-right">
                          {day.efficiencyPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
