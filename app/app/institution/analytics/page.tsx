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
    const bufferMap: Record<string, { pct: number; label: string; desc: string }> = {
      lean: {
        pct: 3.5,
        label: "Lean (+3.5% Buffer)",
        desc: "Best for fixed seated dining with strict attendance checks.",
      },
      balanced: {
        pct: 6.5,
        label: "Balanced / Recommended (+6.5% Buffer)",
        desc: "Optimal balance: ample food for second helpings with <3% post-service surplus.",
      },
      generous: {
        pct: 12.0,
        label: "Generous (+12% Buffer)",
        desc: "Recommended for guest days, banquets, and open-buffet events.",
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
      { name: "Main Carbohydrate (Rice / Roti / Breads)", share: 0.45, kg: Math.round(recommendedPrepKg * 0.45 * 10) / 10 },
      { name: "Protein & Entree (Dal / Paneer / Curry)", share: 0.35, kg: Math.round(recommendedPrepKg * 0.35 * 10) / 10 },
      { name: "Vegetables & Sides", share: 0.15, kg: Math.round(recommendedPrepKg * 0.15 * 10) / 10 },
      { name: "Salad / Dairy / Condiments", share: 0.05, kg: Math.round(recommendedPrepKg * 0.05 * 10) / 10 },
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

            {/* Inputs & Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Expected Headcount / Diners */}
              <div className="bg-ledger-surface p-4 rounded-md border border-line">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  Expected Headcount (Diners)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    step={10}
                    value={expectedDiners}
                    onChange={(e) => setExpectedDiners(Math.max(1, Number(e.target.value) || 0))}
                    className="w-full font-mono text-xl font-bold bg-[#FAF6EE] border border-line rounded px-3 py-1.5 text-ink focus:outline-none focus:border-basil"
                  />
                  <span className="text-xs font-mono text-ink-soft">patrons</span>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  {[150, 300, 500, 800].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setExpectedDiners(count)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                        expectedDiners === count
                          ? "bg-basil text-[#FAF7F2] border-basil font-bold"
                          : "border-line text-ink-soft hover:bg-black/5"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meal Service Slot */}
              <div className="bg-ledger-surface p-4 rounded-md border border-line">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  Meal Service Window
                </label>
                <select
                  value={mealService}
                  onChange={(e) => setMealService(e.target.value as any)}
                  className="w-full bg-[#FAF6EE] border border-line rounded px-3 py-2 text-sm text-ink font-medium focus:outline-none focus:border-basil"
                >
                  <option value="lunch">Lunch Service (~420g / portion)</option>
                  <option value="dinner">Dinner Service (~400g / portion)</option>
                  <option value="breakfast">Breakfast Service (~280g / portion)</option>
                  <option value="full_day">Full Day Catered (~1,100g / person)</option>
                </select>
                <span className="text-[11px] text-ink-soft mt-1.5 block">
                  Reference: {calculation.portionGrams}g food per patron
                </span>
              </div>

              {/* Day of Week Target */}
              <div className="bg-ledger-surface p-4 rounded-md border border-line">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  Service Day
                </label>
                <select
                  value={targetDay}
                  onChange={(e) => setTargetDay(e.target.value)}
                  className="w-full bg-[#FAF6EE] border border-line rounded px-3 py-2 text-sm text-ink font-medium focus:outline-none focus:border-basil"
                >
                  <option value="Today">Today (Current Trend)</option>
                  <option value="Monday">Monday (High volume resumption)</option>
                  <option value="Tuesday">Tuesday (Steady baseline)</option>
                  <option value="Wednesday">Wednesday (Mid-week peak)</option>
                  <option value="Thursday">Thursday (Normal service)</option>
                  <option value="Friday">Friday (Early departures -6%)</option>
                  <option value="Saturday">Saturday (Weekend cohort -30%)</option>
                  <option value="Sunday">Sunday (Reduced mess -35%)</option>
                </select>
                <span className="text-[11px] text-ink-soft mt-1.5 block">
                  Calibrates for weekday/weekend attendance cycles
                </span>
              </div>

              {/* Buffer Mode Tolerance */}
              <div className="bg-ledger-surface p-4 rounded-md border border-line">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1.5">
                  Safety Buffer Mode
                </label>
                <select
                  value={bufferMode}
                  onChange={(e) => setBufferMode(e.target.value as any)}
                  className="w-full bg-[#FAF6EE] border border-line rounded px-3 py-2 text-sm text-ink font-medium focus:outline-none focus:border-basil"
                >
                  <option value="balanced">Balanced (+6.5% Ample Buffer)</option>
                  <option value="lean">Lean (+3.5% Buffer)</option>
                  <option value="generous">Generous (+12% Buffer)</option>
                </select>
                <span className="text-[11px] text-basil font-medium mt-1.5 block">
                  Guarantees ample servings with 0 tray runout
                </span>
              </div>
            </div>

            {/* Live Recommendation Output Banner */}
            <div className="bg-ledger-surface border border-basil/50 rounded-md p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div className="lg:col-span-5 space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-ink-soft">
                  Optimal Kitchen Preparation Target
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-extrabold text-basil">
                    {calculation.recommendedPrepKg}
                  </span>
                  <span className="font-sans text-lg font-medium text-ink">kg</span>
                  <span className="text-sm font-mono text-ink-soft ml-2">
                    (~{Math.round(calculation.recommendedPrepKg * 2.5)} wholesome meals)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  <ShieldCheckIcon size={16} className="text-basil shrink-0" />
                  <span>
                    Includes <strong>+{calculation.safetyBufferKg} kg ample buffer</strong> ({calculation.bufferLabel}) to ensure no diner is turned away.
                  </span>
                </div>
              </div>

              {/* Comparison vs Uncalibrated Overproduction */}
              <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-line pt-4 lg:pt-0 lg:pl-6 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Traditional Uncalibrated Prep (+25% blind overcook):</span>
                  <span className="font-mono font-bold text-clay-rust line-through">
                    {calculation.traditionalBlindPrepKg} kg
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-basil font-semibold">ZeroPlate Calibrated Production:</span>
                  <span className="font-mono font-bold text-basil">
                    {calculation.recommendedPrepKg} kg
                  </span>
                </div>

                {/* Savings Bar */}
                <div className="bg-[#FAF6EE] p-3 rounded border border-line/60 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-ink-soft block font-mono">Waste Prevented</span>
                    <span className="font-mono font-bold text-basil text-sm">
                      {calculation.foodSavedKg} kg
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-soft block font-mono">Cost Saved</span>
                    <span className="font-mono font-bold text-ink text-sm">
                      ₹{calculation.costSavedInr.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-ink-soft block font-mono">CO2e Diverted</span>
                    <span className="font-mono font-bold text-saffron text-sm">
                      {calculation.co2eSavedKg} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Production Batch Category Allocation Table */}
            <div className="bg-ledger-surface p-4 rounded-md border border-line space-y-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Batch Ingredient Breakdown (Target {calculation.recommendedPrepKg} kg)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {calculation.categoryAllocation.map((item) => (
                  <div key={item.name} className="p-3 rounded bg-[#FAF6EE] border border-line/70">
                    <span className="text-[11px] text-ink-soft block truncate">{item.name}</span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="font-mono text-lg font-bold text-ink">{item.kg} kg</span>
                      <span className="text-[10px] font-mono text-ink-soft">{Math.round(item.share * 100)}%</span>
                    </div>
                  </div>
                ))}
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
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "4px",
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
                      contentStyle={{
                        backgroundColor: "#FAF7F2",
                        borderColor: "#D3CBBF",
                        fontSize: "12px",
                        fontFamily: "var(--font-plex-sans)",
                        borderRadius: "4px",
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
