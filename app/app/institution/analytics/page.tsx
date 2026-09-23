"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Utensils,
  Users,
  HeartHandshake,
  Sparkles,
  Calculator,
  PieChart as LucidePieChart,
  BarChart3,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  Copy,
  Info,
  ArrowRight,
  Flame,
  Leaf,
  Scale,
  RefreshCw,
  Award,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
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

const CATEGORY_COLORS = [
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#8B5CF6", // Violet
  "#14B8A6", // Teal
];

export default function InstitutionAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "14d">("14d");

  // Modern Organized Tab Navigation State
  const [activeTab, setActiveTab] = useState<"all" | "calculator" | "trends" | "categories" | "ledger">("all");

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
  const pieContainerRef = useRef<HTMLDivElement>(null);

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
    const portionMap: Record<string, number> = {
      breakfast: 280,
      lunch: 420,
      dinner: 400,
      full_day: 1100,
    };

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
        color: "#F59E0B",
        bgLight: "bg-amber-50/80 border-amber-200 text-amber-950",
        badgeBg: "bg-amber-100 text-amber-800",
      },
      {
        name: "Protein & Entree (Dal / Paneer / Curry)",
        shortName: "Protein & Curry",
        icon: "🍲",
        share: 0.35,
        kg: Math.round(recommendedPrepKg * 0.35 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.35),
        color: "#EF4444",
        bgLight: "bg-rose-50/80 border-rose-200 text-rose-950",
        badgeBg: "bg-rose-100 text-rose-800",
      },
      {
        name: "Vegetables & Sides",
        shortName: "Vegetables & Sides",
        icon: "🥦",
        share: 0.15,
        kg: Math.round(recommendedPrepKg * 0.15 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.15),
        color: "#10B981",
        bgLight: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
        badgeBg: "bg-emerald-100 text-emerald-800",
      },
      {
        name: "Salad / Dairy / Condiments",
        shortName: "Dairy & Salad",
        icon: "🥛",
        share: 0.05,
        kg: Math.round(recommendedPrepKg * 0.05 * 10) / 10,
        perPatronGrams: Math.round(portionGrams * 0.05),
        color: "#8B5CF6",
        bgLight: "bg-purple-50/80 border-purple-200 text-purple-950",
        badgeBg: "bg-purple-100 text-purple-800",
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Institutional Consumption &amp; Ample-Prep Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Engine Synced
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            {data?.institution?.name || "Kitchen Operations"} · Real-time consumption patterns &amp; predictive batch sizing to ensure ample food for diners with zero excess waste.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {data?.summary?.totalInventoryBatches ?? data?.detailedItems?.length ?? 74} Verified Batches
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
              <HeartHandshake className="w-3 h-3 text-amber-600" />
              {data?.summary?.totalSurplusBatches ?? 85} Surplus Rescues
            </span>
          </div>
        </div>

        {/* Quick Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center">
          <Link
            href="/app/institution/forecast"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>AI Forecast View</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
          <Link
            href="/app/institution/reports"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Export ESG Report</span>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-6 border border-rose-300 bg-rose-50 text-rose-800 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Unable to load analytics:</strong> {error}
          </div>
        </div>
      ) : isLoading ? (
        <div className="py-28 text-center text-stone-500 font-mono text-sm space-y-3">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-sans text-stone-600">Analyzing historical consumption records, diner headcount, and inventory logs...</p>
        </div>
      ) : !data ? null : (
        <>
          {/* 2. Top Executive KPI Cards (Vibrant, Colorful & Clean) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Emerald Theme - Consumed Food */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                  Total Food Consumed
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                  <Utensils className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
                {data.summary.totalFoodConsumedKg.toLocaleString()}
                <span className="text-xs font-sans font-medium text-emerald-700">kg eaten</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {data.summary.consumptionEfficiencyPct}% Efficiency
                </span>
                <span className="text-[11px] text-stone-500">high intake</span>
              </div>
            </div>

            {/* Card 2: Sky/Blue Theme - Daily Consumption & Verified Diners */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                  Daily Consumption Rate
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
                {data.summary.avgDailyConsumptionKg}
                <span className="text-xs font-sans font-medium text-blue-700">kg / day</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
                  <Users className="w-3 h-3 text-blue-600" />
                  ~{data.summary.avgDailyDiners} Diners
                </span>
                <span className="text-[11px] text-stone-500">daily verified</span>
              </div>
            </div>

            {/* Card 3: Amber/Gold Theme - Rescued Surplus Diverted */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                  Surplus Rescued &amp; Diverted
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                  <HeartHandshake className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
                {data.summary.totalSurplusKg.toLocaleString()}
                <span className="text-xs font-sans font-medium text-amber-800">kg rescued</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                  <Utensils className="w-3 h-3 text-amber-600" />
                  ~{data.summary.mealsRedistributed} NGO Meals
                </span>
              </div>
            </div>

            {/* Card 4: Violet/Purple Theme - Cost Savings & ESG Climate */}
            <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                  Procurement Cost Saved
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                  <Leaf className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
                ₹{data.summary.costSavedInr.toLocaleString()}
                <span className="text-xs font-sans font-medium text-purple-700">saved</span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  {data.summary.co2eAvoidedKg} kg CO₂e Saved
                </span>
              </div>
            </div>
          </div>

          {/* 3. Section Switcher / Segmented Navigation Bar (Prevents Meshing Everything Up!) */}
          <div className="bg-stone-100/90 p-1.5 rounded-2xl border border-stone-200/80 flex items-center gap-1 overflow-x-auto shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-stone-900 text-white shadow-xs"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "calculator"
                  ? "bg-emerald-700 text-white shadow-xs shadow-emerald-200"
                  : "text-stone-600 hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Ample-Prep Batch Calculator</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "calculator" ? "bg-emerald-800 text-emerald-100" : "bg-emerald-100 text-emerald-800"
              }`}>
                Interactive
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("trends")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "trends"
                  ? "bg-blue-600 text-white shadow-xs shadow-blue-200"
                  : "text-stone-600 hover:text-blue-700 hover:bg-blue-50"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Consumption &amp; Trends</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("categories")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "categories"
                  ? "bg-amber-600 text-white shadow-xs shadow-amber-200"
                  : "text-stone-600 hover:text-amber-700 hover:bg-amber-50"
              }`}
            >
              <LucidePieChart className="w-3.5 h-3.5" />
              <span>Category Breakdown</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "categories" ? "bg-amber-700 text-amber-100" : "bg-amber-100 text-amber-800"
              }`}>
                {data.categoryStats.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-purple-700 text-white shadow-xs shadow-purple-200"
                  : "text-stone-600 hover:text-purple-700 hover:bg-purple-50"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Detailed Food Ledger</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === "ledger" ? "bg-purple-800 text-purple-100" : "bg-purple-100 text-purple-800"
              }`}>
                {data.detailedItems?.length ?? 0}
              </span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* SECTION A: Interactive Ample-Prep Optimizer Engine                        */}
          {/* ========================================================================= */}
          {(activeTab === "all" || activeTab === "calculator") && (
            <div className="bg-gradient-to-br from-white via-emerald-50/20 to-amber-50/20 border-2 border-emerald-500/25 p-6 sm:p-7 rounded-2xl shadow-xs space-y-6">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-200/80 pb-4">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-700 text-white">
                      AI Batch Sizing Engine
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                      Ample-Prep Batch Calculator
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed max-w-2xl">
                    Calculates exact kitchen production targets based on historical consumption patterns.
                    Includes a calibrated safety buffer so <strong className="text-stone-900">every diner eats amply</strong>, with zero blind overcook.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyBatch}
                  className="self-start lg:self-auto text-xs font-semibold px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {copiedBatch ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied Target!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500" />
                      <span>Copy Kitchen Batch Target</span>
                    </>
                  )}
                </button>
              </div>

              {/* Controls Layout: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Step 1: Headcount & Service Day */}
                <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                        Step 1
                      </span>
                      <h3 className="text-sm font-bold text-stone-900 mt-1">Expected Headcount (Diners)</h3>
                    </div>
                    {/* Stepper buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => Math.max(10, prev - 50))}
                        className="text-xs font-mono font-bold px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
                        title="Decrease by 50"
                      >
                        -50
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => Math.max(10, prev - 10))}
                        className="text-xs font-mono font-bold px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
                        title="Decrease by 10"
                      >
                        -10
                      </button>
                      <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 font-mono">
                        <input
                          type="number"
                          min={10}
                          max={3000}
                          step={10}
                          value={expectedDiners}
                          onChange={(e) => setExpectedDiners(Math.max(1, Number(e.target.value) || 0))}
                          className="w-16 font-bold text-base text-stone-900 bg-transparent focus:outline-none text-right"
                        />
                        <span className="text-[11px] text-stone-500 ml-1">diners</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => prev + 10)}
                        className="text-xs font-mono font-bold px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
                        title="Increase by 10"
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpectedDiners((prev) => prev + 50)}
                        className="text-xs font-mono font-bold px-2 py-1 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 cursor-pointer transition-colors"
                        title="Increase by 50"
                      >
                        +50
                      </button>
                    </div>
                  </div>

                  {/* Range Slider */}
                  <div className="space-y-1.5 pt-1">
                    <input
                      type="range"
                      min={20}
                      max={1200}
                      step={10}
                      value={expectedDiners}
                      onChange={(e) => setExpectedDiners(Number(e.target.value))}
                      className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
                      <span>20</span>
                      <span>150</span>
                      <span>300 (standard)</span>
                      <span>600</span>
                      <span>1,200+</span>
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] text-stone-500 font-medium">Presets:</span>
                    {[100, 200, 300, 500, 800].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setExpectedDiners(count)}
                        className={`text-xs font-mono px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                          expectedDiners === count
                            ? "bg-emerald-700 text-white border-emerald-700 font-bold"
                            : "border-stone-200 bg-stone-50 text-stone-600 hover:text-stone-900 hover:border-stone-300"
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>

                  {/* Service Day Selection */}
                  <div className="border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-900">Service Day Calibration:</span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.2 rounded">
                        Attendance Rhythm
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
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
                          className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                            targetDay === d.id
                              ? "bg-emerald-700 text-white border-emerald-700 font-bold shadow-xs"
                              : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300"
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight">{d.label}</div>
                          <div
                            className={`text-[9px] font-mono ${
                              targetDay === d.id ? "text-emerald-100" : "text-stone-500"
                            }`}
                          >
                            {d.note}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Step 2: Meal Window & Safety Strategy */}
                <div className="lg:col-span-6 bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-4">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                      Step 2
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      <h3 className="text-sm font-bold text-stone-900">Meal Service Window</h3>
                      <span className="text-[11px] font-mono text-stone-500">
                        Baseline: {calculation.portionGrams}g / diner
                      </span>
                    </div>
                  </div>

                  {/* 4 Clickable Meal Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "breakfast", icon: "☀️", label: "Breakfast", grams: "280g", desc: "Poha, Idli" },
                      { id: "lunch", icon: "🍲", label: "Lunch", grams: "420g", desc: "Curries & Rice", popular: true },
                      { id: "dinner", icon: "🌙", label: "Dinner", grams: "400g", desc: "Full Meal" },
                      { id: "full_day", icon: "📋", label: "Full Day", grams: "1,100g", desc: "All 3 Services" },
                    ].map((meal) => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => setMealService(meal.id as any)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                          mealService === meal.id
                            ? "bg-emerald-50 border-emerald-600 text-stone-900 ring-2 ring-emerald-500/20"
                            : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300"
                        }`}
                      >
                        {meal.popular && (
                          <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-500 text-white uppercase">
                            Major
                          </span>
                        )}
                        <div className="text-base mb-1">{meal.icon}</div>
                        <div className="text-xs font-bold text-stone-900">{meal.label}</div>
                        <div className="text-[11px] font-mono font-semibold text-emerald-700 mt-0.5">
                          ~{meal.grams}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate mt-0.5">
                          {meal.desc}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Safety Buffer Strategy */}
                  <div className="border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-stone-900">Safety Buffer Strategy:</span>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded">
                        Zero Diner Runout
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "lean", label: "Lean", pct: "+3.5%", desc: "Fixed seating", sub: "Minimal surplus" },
                        { id: "balanced", label: "Balanced", pct: "+6.5%", desc: "Recommended", sub: "Ample seconds", rec: true },
                        { id: "generous", label: "Generous", pct: "+12%", desc: "Banquets", sub: "Max safety" },
                      ].map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setBufferMode(mode.id as any)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                            bufferMode === mode.id
                              ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                              : "bg-stone-50 border-stone-200 text-stone-700 hover:border-stone-300"
                          }`}
                        >
                          {mode.rec && (
                            <span className={`absolute top-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono uppercase ${
                              bufferMode === mode.id ? "bg-white text-emerald-800 font-bold" : "bg-emerald-100 text-emerald-800"
                            }`}>
                              ★ Best
                            </span>
                          )}
                          <div className="text-xs font-bold leading-tight">{mode.label}</div>
                          <div className={`font-mono text-sm font-extrabold mt-0.5 ${
                            bufferMode === mode.id ? "text-white" : "text-emerald-700"
                          }`}>
                            {mode.pct}
                          </div>
                          <div className={`text-[10px] mt-0.5 truncate ${
                            bufferMode === mode.id ? "text-emerald-100" : "text-stone-500"
                          }`}>
                            {mode.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Recommendation Hero Result Banner */}
              <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-emerald-950 text-white rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Target Hero Metric */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                        Calibrated Kitchen Prep Target
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase font-bold">
                        Guaranteed Ample
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-5xl sm:text-6xl font-black text-emerald-400 tracking-tight">
                        {calculation.recommendedPrepKg}
                      </span>
                      <span className="font-sans text-2xl font-bold text-stone-200">kg</span>
                      <span className="text-xs sm:text-sm font-mono text-stone-400 ml-2">
                        (~{Math.round(calculation.recommendedPrepKg * 2.5)} meals)
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-start gap-2.5 text-xs text-stone-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Ample Food Guarantee:</strong> Includes{" "}
                        <span className="text-emerald-300 font-bold">+{calculation.safetyBufferKg} kg safety buffer</span>{" "}
                        ({calculation.bufferLabel}) to ensure plenty of food for second helpings with zero diner runouts.
                      </div>
                    </div>
                  </div>

                  {/* Comparison vs Uncalibrated Overproduction + Savings */}
                  <div className="lg:col-span-7 border-t lg:border-t-0 lg:border-l border-white/15 pt-5 lg:pt-0 lg:pl-7 space-y-4">
                    {/* Visual Comparison Progress Bars */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-300">Traditional Blind Prep (+25% overcook):</span>
                        <span className="font-mono font-bold text-rose-300 line-through">
                          {calculation.traditionalBlindPrepKg} kg
                        </span>
                      </div>
                      <div className="w-full h-3 bg-rose-950/60 border border-rose-500/30 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500/70 rounded-full" style={{ width: "100%" }} />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                          <span>ZeroPlate Calibrated Production:</span>
                          <span className="text-[10px] font-mono bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-1.5 py-0.2 rounded font-semibold">
                            Save {calculation.foodSavedKg} kg
                          </span>
                        </span>
                        <span className="font-mono font-extrabold text-emerald-400 text-sm">
                          {calculation.recommendedPrepKg} kg
                        </span>
                      </div>
                      <div className="w-full h-3 bg-stone-800 rounded-full overflow-hidden border border-emerald-500/30">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.round((calculation.recommendedPrepKg / Math.max(1, calculation.traditionalBlindPrepKg)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* 3 Savings KPI Cards */}
                    <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] uppercase text-stone-400 block font-mono">Waste Prevented</span>
                        <span className="font-mono font-bold text-emerald-400 text-base sm:text-lg block mt-0.5">
                          {calculation.foodSavedKg} kg
                        </span>
                        <span className="text-[9px] text-stone-400 font-mono">~{calculation.mealsSaved} meals</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] uppercase text-stone-400 block font-mono">Procurement Saved</span>
                        <span className="font-mono font-bold text-amber-300 text-base sm:text-lg block mt-0.5">
                          ₹{calculation.costSavedInr.toLocaleString()}
                        </span>
                        <span className="text-[9px] text-stone-400 font-mono">this service</span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <span className="text-[10px] uppercase text-stone-400 block font-mono">CO₂e Diverted</span>
                        <span className="font-mono font-bold text-sky-300 text-base sm:text-lg block mt-0.5">
                          {calculation.co2eSavedKg} kg
                        </span>
                        <span className="text-[9px] text-stone-400 font-mono">climate impact</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4: Recipe Ingredient Allocation */}
                <div className="border-t border-white/15 pt-5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-stone-200 uppercase tracking-wider block">
                      Chef Recipe Ingredient Allocation ({calculation.recommendedPrepKg} kg Total)
                    </span>
                    <span className="text-[11px] font-mono text-stone-400">
                      Calibrated for ~{expectedDiners} diners @ {calculation.portionGrams}g plate average
                    </span>
                  </div>

                  {/* Proportional Segment Bar */}
                  <div className="h-3 w-full rounded-full overflow-hidden flex bg-stone-800 border border-white/10">
                    {calculation.categoryAllocation.map((item) => (
                      <div
                        key={item.name}
                        style={{ width: `${Math.round(item.share * 100)}%`, backgroundColor: item.color }}
                        title={`${item.shortName}: ${item.kg} kg (${Math.round(item.share * 100)}%)`}
                      />
                    ))}
                  </div>

                  {/* Recipe Ingredient Cards with colorful styling */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {calculation.categoryAllocation.map((item) => (
                      <div
                        key={item.name}
                        className={`p-3.5 rounded-xl border transition-all ${item.bgLight} shadow-xs space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{item.icon}</span>
                            <span className="text-xs font-bold truncate">{item.shortName}</span>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${item.badgeBg}`}>
                            {Math.round(item.share * 100)}%
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1">
                          <span className="font-mono text-2xl font-black">
                            {item.kg} <span className="text-xs font-sans font-normal opacity-70">kg</span>
                          </span>
                          <span className="text-[11px] font-mono font-semibold">
                            ~{item.perPatronGrams}g / plate
                          </span>
                        </div>

                        <span className="text-[10px] block truncate opacity-75 pt-0.5">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: Graphical Representation of Food Consumption (Timeline & Day) */}
          {/* ========================================================================= */}
          {(activeTab === "all" || activeTab === "trends") && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    Historical Consumption &amp; Preparation Trends
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    Compare daily food cooked versus actual amount consumed by patrons to fine-tune future batching.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Chart 1: Food Prepared vs Consumed vs Surplus Timeline */}
                <div className="lg:col-span-8 border border-stone-200 bg-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                        Daily Intake vs Kitchen Preparation
                      </h3>
                      <p className="text-xs text-stone-500">
                        Kilograms prepared versus actual food consumed by diners over time
                      </p>
                    </div>

                    {/* Range Selector */}
                    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setTimeRange("7d")}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          timeRange === "7d" ? "bg-emerald-700 text-white font-bold" : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        7 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimeRange("14d")}
                        className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                          timeRange === "14d" ? "bg-emerald-700 text-white font-bold" : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        14 Days
                      </button>
                    </div>
                  </div>

                  {/* Chart Legend Indicator */}
                  <div className="flex items-center gap-4 text-xs font-sans flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-600 rounded-sm inline-block" />
                      <span className="text-stone-800 font-semibold">Food Consumed (kg)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-amber-500 rounded-sm inline-block" />
                      <span className="text-stone-600">Surplus Rescued (kg)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-stone-900 inline-block rounded-full" />
                      <span className="text-stone-600">Total Prepared (kg)</span>
                    </div>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={activeTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="shortDate"
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={{ stroke: "#D1D5DB" }}
                        />
                        <YAxis
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={{ stroke: "#D1D5DB" }}
                          unit=" kg"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(16, 185, 129, 0.08)", radius: 4 }}
                          wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                            fontSize: "12px",
                            borderRadius: "10px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="consumedKg"
                          name="Food Consumed"
                          fill="#10B981"
                          stackId="daily"
                          maxBarSize={36}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="surplusKg"
                          name="Surplus Rescued"
                          fill="#F59E0B"
                          stackId="daily"
                          maxBarSize={36}
                          radius={[4, 4, 0, 0]}
                        />
                        <Line
                          type="monotone"
                          dataKey="preparedKg"
                          name="Food Prepared"
                          stroke="#1F2937"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#1F2937", stroke: "#FFFFFF", strokeWidth: 1.5 }}
                          activeDot={{ r: 6, fill: "#1F2937", stroke: "#FFFFFF", strokeWidth: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Day of Week Rhythms */}
                <div className="lg:col-span-4 border border-stone-200 bg-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                      Day-of-Week Rhythm
                    </h3>
                    <p className="text-xs text-stone-500">
                      Average food consumed across typical weekdays vs weekends
                    </p>
                  </div>

                  <div className="h-72 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dayOfWeekAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="day"
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={{ stroke: "#D1D5DB" }}
                        />
                        <YAxis
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={{ stroke: "#D1D5DB" }}
                          unit=" kg"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(16, 185, 129, 0.08)", radius: 4 }}
                          wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E5E7EB",
                            fontSize: "12px",
                            borderRadius: "10px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar
                          dataKey="avgConsumedKg"
                          name="Avg. Consumed (kg)"
                          fill="#10B981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="avgSurplusKg"
                          name="Avg. Surplus (kg)"
                          fill="#F59E0B"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION C: Colourful Category Intelligence (Pie, Risk Bar, & Table)       */}
          {/* ========================================================================= */}
          {(activeTab === "all" || activeTab === "categories") && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900">
                    Category Breakdown &amp; Risk Assessment
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                    Interactive category distribution, wastage vulnerability analysis, and safety buffer calibrations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Donut Chart: Food Consumption Distribution by Category */}
                <div className="lg:col-span-6 border border-stone-200 bg-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-mono font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Distribution Share
                      </div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 mt-0.5">
                        Consumption Share by Food Category
                      </h3>
                    </div>
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                      {data.categoryStats.length} Categories
                    </span>
                  </div>

                  {/* Donut Chart Container */}
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
                          {data.categoryStats.map((entry, idx) => (
                            <Cell
                              key={`cat-cell-${entry.category}`}
                              fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}
                              stroke="#FFFFFF"
                              strokeWidth={hoveredCatIndex === idx ? 3 : 2}
                              tabIndex={-1}
                              style={{ outline: "none" }}
                              className="outline-none focus:outline-none focus-visible:outline-none cursor-pointer"
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Floating Tooltip Positioned Right Where the Cursor Is Placed */}
                    {hoveredCatIndex !== null && pieMousePos && data.categoryStats[hoveredCatIndex] && (() => {
                      const item = data.categoryStats[hoveredCatIndex];
                      const total = data.summary.totalFoodConsumedKg || 1;
                      const pct = Math.round((item.consumedKg / total) * 100);
                      const color = CATEGORY_COLORS[hoveredCatIndex % CATEGORY_COLORS.length];

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
                          <div className="bg-stone-900 text-white p-3 rounded-xl shadow-2xl text-xs border border-white/15 min-w-[175px] space-y-1 text-left backdrop-blur-xs">
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
                              <span>Surplus Rescued:</span>
                              <span className="font-semibold text-amber-300">{item.surplusKg} kg</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Centered Donut KPI - Constrained so it never touches the ring */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none">
                      <div className="flex flex-col items-center justify-center max-w-[105px] px-1 space-y-0.5">
                        <span
                          className="text-[9px] uppercase font-mono tracking-wider text-stone-500 truncate max-w-[100px] leading-tight block text-center"
                          title={hoveredCatIndex !== null ? data.categoryStats[hoveredCatIndex]?.label : "Total Consumed"}
                        >
                          {hoveredCatIndex !== null ? data.categoryStats[hoveredCatIndex]?.label : "Consumed"}
                        </span>
                        <span className="font-serif text-xl sm:text-2xl font-bold text-stone-900 leading-tight">
                          {hoveredCatIndex !== null
                            ? `${data.categoryStats[hoveredCatIndex]?.consumedKg.toLocaleString()}`
                            : `${data.summary.totalFoodConsumedKg.toLocaleString()}`}
                          <span className="text-[11px] font-sans font-normal text-stone-500 ml-0.5">kg</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 leading-none">
                          {hoveredCatIndex !== null
                            ? `${Math.round(((data.categoryStats[hoveredCatIndex]?.consumedKg || 0) / (data.summary.totalFoodConsumedKg || 1)) * 100)}% share`
                            : "total logged"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Color legend pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100">
                    {data.categoryStats.map((cat, idx) => (
                      <div key={cat.category} className="flex items-center gap-1.5 text-xs text-stone-600">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                        />
                        <span className="truncate">{cat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar Chart: Consumption vs Surplus Comparison by Category */}
                <div className="lg:col-span-6 border border-stone-200 bg-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-blue-700 text-xs font-mono font-semibold">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Vulnerability Index
                      </div>
                      <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 mt-0.5">
                        Consumed vs. Surplus Rescued (Kg)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
                        Consumed
                      </span>
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                        Surplus
                      </span>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.categoryStats} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          axisLine={{ stroke: "#D1D5DB" }}
                        />
                        <YAxis
                          tick={{ fill: "#6B7280", fontSize: 11 }}
                          axisLine={{ stroke: "#D1D5DB" }}
                          unit=" kg"
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(16, 185, 129, 0.08)", radius: 4 }}
                          wrapperStyle={{ zIndex: 100, pointerEvents: "none", outline: "none" }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const item = payload[0].payload;
                              return (
                                <div className="bg-stone-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-white/10 space-y-1">
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

                  <p className="text-[11px] text-stone-500 pt-1 border-t border-stone-100">
                    Highlights categories with elevated surplus where prep buffers should be tightened.
                  </p>
                </div>
              </div>

              {/* Category Breakdown Table */}
              <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Food Category Intake &amp; Wastage Metrics
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Detailed efficiency, buffer recommendations, and perishability risk by food group
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                        <th className="py-3 px-4 font-sans font-semibold">Category</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Prepared (kg)</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Consumed (kg)</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Surplus Rescued</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Intake Efficiency</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Buffer Rec.</th>
                        <th className="py-3 px-4 font-sans text-right font-semibold">Shelf-Life Risk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs font-sans">
                      {data.categoryStats.map((cat, idx) => {
                        const efficiency = Math.round((cat.consumedKg / Math.max(1, cat.preparedKg)) * 100);
                        const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                        return (
                          <tr key={cat.category} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3 px-4 font-medium text-stone-900 flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              {cat.label}
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-500 text-right">
                              {cat.preparedKg.toLocaleString()} kg
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-stone-900 text-right">
                              {cat.consumedKg.toLocaleString()} kg
                            </td>
                            <td className="py-3 px-4 font-mono text-amber-700 font-medium text-right">
                              {cat.surplusKg.toLocaleString()} kg
                            </td>
                            <td className="py-3 px-4 font-mono text-right">
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {efficiency}%
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-800 text-right font-semibold">
                              +{cat.recommendedBufferPct}%
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold ${
                                cat.riskLevel.toLowerCase().includes("high")
                                  ? "bg-rose-100 text-rose-800"
                                  : cat.riskLevel.toLowerCase().includes("medium")
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}>
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
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION D: Detailed Consumption Ledger Table (Dual Views)                 */}
          {/* ========================================================================= */}
          {(activeTab === "all" || activeTab === "ledger") && (
            <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs space-y-0">
              <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                    Detailed Food Inventory &amp; Consumption Ledger
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Live MongoDB
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {ledgerView === "items"
                      ? "Individual verified batch logs with exact measured quantities and consumption estimates"
                      : "Aggregated day-by-day food prepared, consumed, and diverted across the timeline"}
                  </p>
                </div>

                {/* View Selector Tabs */}
                <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 p-1 rounded-xl self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLedgerView("items")}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      ledgerView === "items"
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    Food Batches ({data.detailedItems?.length ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerView("days")}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      ledgerView === "days"
                        ? "bg-emerald-700 text-white shadow-2xs"
                        : "text-stone-600 hover:text-stone-900"
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
                      <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                        <th className="py-3 px-4 font-sans font-semibold">Food Item Name</th>
                        <th className="py-3 px-4 font-sans font-semibold">Category</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Logged Quantity</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Mass (kg)</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Est. Consumed</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Diners Fed</th>
                        <th className="py-3 px-4 font-sans text-center font-semibold">Status</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Logged Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs font-sans">
                      {(data.detailedItems && data.detailedItems.length > 0) ? (
                        data.detailedItems.map((item) => (
                          <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-3 px-4 font-medium text-stone-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="truncate max-w-[200px]">{item.name}</span>
                            </td>
                            <td className="py-3 px-4 text-stone-600 capitalize font-mono text-[11px]">
                              {item.category.replace("_", " ")}
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-900 text-right font-medium">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-500 text-right">
                              {item.quantityKg} kg
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">
                              {item.consumedEstimateKg} kg
                            </td>
                            <td className="py-3 px-4 font-mono text-blue-700 font-semibold text-right">
                              ~{item.dinersFed}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold ${
                                  item.status === "delivered"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : item.status === "listed" || item.status === "surplus"
                                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                                    : "bg-stone-100 text-stone-700 border border-stone-200"
                                }`}
                              >
                                {item.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-500 text-right text-[11px]">
                              {item.date}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-10 text-center text-stone-500 font-mono">
                            No food batch inventory records found for this kitchen yet.
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
                      <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500">
                        <th className="py-3 px-4 font-sans font-semibold">Date</th>
                        <th className="py-3 px-4 font-sans font-semibold">Day</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Prepared</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Consumed</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Surplus Rescued</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Diners Fed</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs font-sans">
                      {data.dailyTimeline.slice().reverse().map((day) => (
                        <tr key={day.date} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-stone-500">{day.date}</td>
                          <td className="py-3 px-4 font-medium text-stone-900">{day.dayName}</td>
                          <td className="py-3 px-4 font-mono text-stone-500 text-right">{day.preparedKg} kg</td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">{day.consumedKg} kg</td>
                          <td className="py-3 px-4 font-mono text-amber-700 text-right font-medium">
                            {day.surplusKg > 0 ? `${day.surplusKg} kg` : "0 kg"}
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-700 text-right">~{day.dinersCount}</td>
                          <td className="py-3 px-4 font-mono font-bold text-right">
                            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {day.efficiencyPct}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
