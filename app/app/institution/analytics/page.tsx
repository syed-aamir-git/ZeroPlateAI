"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Utensils,
  Users,
  HeartHandshake,
  Sparkles,
  PieChart as LucidePieChart,
  BarChart3,
  Calendar,
  Layers,
  ShieldCheck,
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
  unit?: string;
  quantityKg?: number;
  consumedEstimate?: string;
  consumedEstimateKg?: number;
  dinersFed: number;
  status: string;
  date: string;
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
  amplePrepEngine?: {
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
  const [activeTab, setActiveTab] = useState<"all" | "trends" | "categories" | "ledger">("all");
  const [ledgerView, setLedgerView] = useState<"items" | "days">("items");

  // Cursor-following Pie Chart Tooltip State
  const [hoveredCatIndex, setHoveredCatIndex] = useState<number | null>(null);
  const [pieMousePos, setPieMousePos] = useState<{ x: number; y: number } | null>(null);
  const pieContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/institution/analytics", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
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



  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4">
      {/* 1. Header Banner */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Institutional Consumption &amp; Operations Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Engine Synced
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            {data?.institution?.name || "Kitchen Operations"} · Real-time consumption patterns and waste mitigation analytics to ensure optimal dining with zero excess waste.
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
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Live
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
                        <th className="py-3 px-4 font-mono text-right font-semibold">Est. Consumed</th>
                        <th className="py-3 px-4 font-mono text-right font-semibold">Diners Fed</th>
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
                            <td className="py-3 px-4 font-mono text-stone-900 text-right font-semibold">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-right">
                              {item.consumedEstimate || (item.consumedEstimateKg !== undefined ? `${item.consumedEstimateKg} kg` : "—")}
                            </td>
                            <td className="py-3 px-4 font-mono text-blue-700 font-semibold text-right">
                              ~{item.dinersFed}
                            </td>
                            <td className="py-3 px-4 font-mono text-stone-500 text-right text-[11px]">
                              {item.date}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-stone-500 font-mono">
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
