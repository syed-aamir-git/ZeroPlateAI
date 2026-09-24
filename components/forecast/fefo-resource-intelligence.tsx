"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
  Utensils,
  ChevronRight,
  Flame,
  Snowflake,
  Sun,
  Scale,
  Calendar,
  Zap,
  Info,
  Check,
  Sliders,
  Cpu,
} from "lucide-react";
import {
  FefoIntelligenceReport,
  FefoEvaluatedItem,
  evaluateFefoItem,
  FefoRawItemInput,
  StorageEnvironment,
} from "@/lib/fefo-engine";

interface FefoResourceIntelligenceProps {
  initialReport: FefoIntelligenceReport;
  tomorrowDemandKg?: number;
}

export default function FefoResourceIntelligence({
  initialReport,
  tomorrowDemandKg = 28,
}: FefoResourceIntelligenceProps) {
  const [report, setReport] = useState<FefoIntelligenceReport>(initialReport);
  const [activeTab, setActiveTab] = useState<"live_matrix" | "simulator" | "correlation">(
    "live_matrix"
  );

  // Filter state for matrix
  const [tierFilter, setTierFilter] = useState<"all" | "expiring_soon" | "moderate" | "long_shelf_life" | "overstocked">(
    "all"
  );

  // Simulator State
  const [simName, setSimName] = useState<string>("Tomatoes");
  const [simCategory, setSimCategory] = useState<string>("raw_produce");
  const [simQuantity, setSimQuantity] = useState<number>(5);
  const [simUnit, setSimUnit] = useState<string>("kg");
  const [simExpiryDays, setSimExpiryDays] = useState<number>(2);
  const [simStorage, setSimStorage] = useState<StorageEnvironment>("ambient");
  const [simDemand, setSimDemand] = useState<number>(14);

  // Calculated simulation result
  const simulatedItem: FefoEvaluatedItem = React.useMemo(() => {
    const expiryDate = new Date(Date.now() + simExpiryDays * 24 * 60 * 60 * 1000).toISOString();
    return evaluateFefoItem({
      name: simName,
      category: simCategory,
      quantity: simQuantity,
      unit: simUnit,
      expiryDate,
      storage: simStorage,
      projectedDemandKg: simDemand,
    });
  }, [simName, simCategory, simQuantity, simUnit, simExpiryDays, simStorage, simDemand]);

  // Filtered items in matrix
  const filteredItems = report.evaluatedItems.filter((item) => {
    if (tierFilter === "all") return true;
    return item.shelfLifeTier === tierFilter;
  });

  const getStorageBadge = (storage: StorageEnvironment) => {
    switch (storage) {
      case "cold_storage":
        return {
          label: "Cold Storage (≤4°C)",
          icon: <Snowflake className="w-3 h-3 text-blue-500" />,
          color: "bg-blue-50 text-blue-700 border-blue-200",
        };
      case "frozen":
        return {
          label: "Freezer (≤-18°C)",
          icon: <Snowflake className="w-3 h-3 text-cyan-600" />,
          color: "bg-cyan-50 text-cyan-700 border-cyan-200",
        };
      case "dry_pantry":
        return {
          label: "Dry Pantry",
          icon: <Package className="w-3 h-3 text-stone-500" />,
          color: "bg-stone-100 text-stone-700 border-stone-200",
        };
      default:
        return {
          label: "Ambient Room",
          icon: <Sun className="w-3 h-3 text-amber-500" />,
          color: "bg-amber-50 text-amber-800 border-amber-200",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Symmetrical Section Header */}
      <div className="border border-stone-200 bg-white p-5 sm:p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-3 h-3 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-tight">
                AI Central Resource Intelligence (FEFO Engine)
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                First-Expired, First-Out
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Transforms raw inventory tracking into proactive resource intelligence. Tackles{" "}
              <strong className="text-emerald-800 font-semibold">pre-consumption waste before it exists</strong>:
              prevent waste first, redistribute unavoidable surplus second.
            </p>
          </div>

          {/* Mathematical Blueprint Pill */}
          <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 shrink-0 text-left font-mono text-[11px] text-stone-600 space-y-0.5">
            <div className="text-[10px] text-stone-400 uppercase tracking-wider font-sans font-bold">
              Active Optimization Model
            </div>
            <div className="text-stone-800 font-semibold">
              inventory = &#123; food<sub>1</sub>, ..., food<sub>n</sub> &#125;
            </div>
            <div className="text-stone-500 text-[10px]">
              food<sub>i</sub> = (quantity, expiry, demand, shelf_life, storage)
            </div>
          </div>
        </div>

        {/* 2. Interactive Navigation Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("live_matrix")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "live_matrix"
                  ? "bg-white text-stone-900 shadow-xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Live Resource Matrix ({report.evaluatedItems.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "simulator"
                  ? "bg-white text-stone-900 shadow-xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>FEFO AI Simulator (Interactive)</span>
            </button>

            <button
              onClick={() => setActiveTab("correlation")}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "correlation"
                  ? "bg-white text-stone-900 shadow-xs font-bold"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>Upcoming Meal Absorption Schedule</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/app/institution/inventory"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-xs"
            >
              <Package className="w-3.5 h-3.5 text-stone-500" />
              <span>Manage Kitchen Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Symmetrical 4-Card FEFO Hierarchy KPI Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Rose Theme - Priority 1 (Expiring Soon) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border border-rose-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Priority 1: Expiring Soon
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shadow-2xs font-mono font-bold text-xs">
              &le;48h
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-rose-900 flex items-baseline gap-1.5">
            <span>{report.summary.expiringSoonKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100/90 text-rose-900 border border-rose-200">
              Use First
            </span>
            <span className="text-[11px] text-stone-500">tomorrow&apos;s meals</span>
          </div>
        </div>

        {/* Card 2: Amber Theme - Priority 2 (Moderate Shelf Life) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              Priority 2: Moderate Life
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs font-mono font-bold text-xs">
              3–7d
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-900 flex items-baseline gap-1.5">
            <span>{report.summary.moderateShelfLifeKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              Use Next
            </span>
            <span className="text-[11px] text-stone-500">mid-week rotation</span>
          </div>
        </div>

        {/* Card 3: Emerald Theme - Priority 3 (Long Shelf Life) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Priority 3: Long Life
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs font-mono font-bold text-xs">
              &gt;7d
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-900 flex items-baseline gap-1.5">
            <span>{report.summary.longShelfLifeKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Preserve
            </span>
            <span className="text-[11px] text-stone-500">safe buffer reserve</span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Pre-Consumption Waste Shield */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 inline-block" />
              Pre-Consumption Shield
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs font-mono font-bold text-xs">
              100%
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            <span>{report.summary.totalPreConsumptionWasteSavedKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              ₹{report.summary.estimatedCostSavedInr.toLocaleString()} Saved
            </span>
            <span className="text-[11px] text-stone-500">pre-consumption</span>
          </div>
        </div>
      </div>

      {/* 4. Live FEFO Resource Intelligence Matrix Tab */}
      {activeTab === "live_matrix" && (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs space-y-0">
          {/* Table Toolbar & Filter */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  FEFO Live Stock Prioritization &amp; Recipe Correlator
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-200 text-stone-700">
                  {filteredItems.length} Items Evaluated
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Central AI correlates current inventory shelf-life directly with tomorrow&apos;s predicted meal prep requirements.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-500 font-sans mr-1">Filter Tier:</span>
              <button
                onClick={() => setTierFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  tierFilter === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}
              >
                All ({report.evaluatedItems.length})
              </button>
              <button
                onClick={() => setTierFilter("expiring_soon")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  tierFilter === "expiring_soon"
                    ? "bg-rose-600 text-white"
                    : "bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                }`}
              >
                🔴 Expiring Soon ({report.summary.expiringSoonCount})
              </button>
              <button
                onClick={() => setTierFilter("moderate")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  tierFilter === "moderate"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                }`}
              >
                🟡 Moderate ({report.summary.moderateShelfLifeCount})
              </button>
              <button
                onClick={() => setTierFilter("long_shelf_life")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  tierFilter === "long_shelf_life"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                }`}
              >
                🟢 Long Life ({report.summary.longShelfLifeCount})
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-sans">
                  <th className="py-3 px-4 font-semibold">Raw Data &amp; Food Resource</th>
                  <th className="py-3 px-4 font-semibold">Storage &amp; Expiry</th>
                  <th className="py-3 px-4 font-mono font-semibold text-right">Stock / Demand</th>
                  <th className="py-3 px-4 font-semibold">AI Central Reasoning (FEFO)</th>
                  <th className="py-3 px-4 font-semibold text-right">Recommendation &amp; Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {filteredItems.map((item) => {
                  const storageInfo = getStorageBadge(item.storage);

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      {/* 1. Item Name & Category */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900 text-sm">{item.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] text-stone-400 capitalize">
                            {item.category.replace("_", " ")}
                          </span>
                          <span className="text-stone-300">·</span>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${storageInfo.color}`}
                          >
                            {storageInfo.icon}
                            <span>{storageInfo.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* 2. Expiry & Shelf Life Tier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${item.badgeColor.dot}`}
                          />
                          <span className="font-medium text-stone-900">
                            {item.daysUntilExpiry <= 1
                              ? `${Math.max(1, Math.round(item.hoursUntilExpiry))}h remaining`
                              : `${Math.round(item.daysUntilExpiry)} days safe`}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.badgeColor.bg}`}
                          >
                            {item.shelfLifeTier === "expiring_soon"
                              ? "🔴 Priority 1: Use First"
                              : item.shelfLifeTier === "moderate"
                              ? "🟡 Priority 2: Use Next"
                              : item.shelfLifeTier === "overstocked"
                              ? "🟣 Overstocked: Redistribute"
                              : "🟢 Priority 3: Preserve"}
                          </span>
                        </div>
                      </td>

                      {/* 3. Stock Quantity vs Projected Demand */}
                      <td className="py-3.5 px-4 font-mono text-right">
                        <div className="font-bold text-stone-900 text-sm">
                          {item.quantity} {item.unit}
                        </div>
                        <div className="text-[10px] text-stone-500 font-sans mt-0.5">
                          need: ~{item.correlatedDemandKg} kg/day
                        </div>
                      </td>

                      {/* 4. AI Central Reasoning */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-[11px] text-stone-700 leading-relaxed font-sans">
                          {item.aiReasoning}
                        </p>
                      </td>

                      {/* 5. Actionable Recommendation & Result */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="space-y-1">
                          <div className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 text-left max-w-xs ml-auto">
                            <span className="font-bold block text-[10px] uppercase tracking-wider text-emerald-700">
                              {item.targetMealTime}
                            </span>
                            <span>{item.recommendation}</span>
                          </div>
                          <div className="text-[10px] font-semibold text-stone-500 font-mono">
                            {item.resultMetric}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Interactive FEFO AI Simulator Tab */}
      {activeTab === "simulator" && (
        <div className="border border-stone-200 bg-white rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Interactive FEFO AI Reasoning &amp; Waste Mitigation Simulator
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Test any food inventory item to see how the central AI reasons, prioritizes shelf life, and plans pre-consumption waste prevention.
            </p>
          </div>

          {/* Preset Buttons for Quick Exploration */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-stone-600">Quick Test Presets:</span>
            <button
              onClick={() => {
                setSimName("Tomatoes");
                setSimCategory("raw_produce");
                setSimQuantity(5);
                setSimUnit("kg");
                setSimExpiryDays(2);
                setSimStorage("ambient");
                setSimDemand(12);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
            >
              🍅 5 kg Tomatoes (2 days left) [User Example]
            </button>
            <button
              onClick={() => {
                setSimName("Cow Milk");
                setSimCategory("dairy");
                setSimQuantity(20);
                setSimUnit("litres");
                setSimExpiryDays(1);
                setSimStorage("cold_storage");
                setSimDemand(15);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer"
            >
              🥛 20 L Milk (1 day left)
            </button>
            <button
              onClick={() => {
                setSimName("Potatoes");
                setSimCategory("raw_produce");
                setSimQuantity(40);
                setSimUnit("kg");
                setSimExpiryDays(6);
                setSimStorage("ambient");
                setSimDemand(10);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
            >
              🥔 40 kg Potatoes (6 days left)
            </button>
            <button
              onClick={() => {
                setSimName("Basmati Rice");
                setSimCategory("packaged_dry");
                setSimQuantity(100);
                setSimUnit("kg");
                setSimExpiryDays(45);
                setSimStorage("dry_pantry");
                setSimDemand(25);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            >
              🌾 100 kg Dry Rice (45 days left)
            </button>
          </div>

          {/* Simulator Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
            {/* Item Name */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Food Resource Name
              </label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Tomatoes"
              />
            </div>

            {/* Quantity & Unit */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Stock Quantity &amp; Unit
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(Math.max(0.5, Number(e.target.value) || 1))}
                  className="w-2/3 px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <select
                  value={simUnit}
                  onChange={(e) => setSimUnit(e.target.value)}
                  className="w-1/3 px-2 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="kg">kg</option>
                  <option value="litres">L</option>
                  <option value="pieces">pcs</option>
                </select>
              </div>
            </div>

            {/* Expiry / Shelf Life Days */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Days Until Expiry (Shelf Life)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={simExpiryDays}
                  onChange={(e) => setSimExpiryDays(Math.max(0.1, Number(e.target.value) || 1))}
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs font-mono text-stone-500">days</span>
              </div>
            </div>

            {/* Storage Environment */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Storage Method
              </label>
              <select
                value={simStorage}
                onChange={(e) => setSimStorage(e.target.value as StorageEnvironment)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                <option value="ambient">Ambient Room Temp</option>
                <option value="cold_storage">Cold Storage (≤4°C)</option>
                <option value="dry_pantry">Dry Pantry / Warehouse</option>
                <option value="frozen">Frozen Storage (≤-18°C)</option>
              </select>
            </div>
          </div>

          {/* AI Central Intelligence Live Reasoning Flow Container */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-stone-50 to-emerald-500/10 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-emerald-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                <h4 className="font-serif font-bold text-base text-stone-900">
                  AI Central Intelligence Reasoning Transformation
                </h4>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${simulatedItem.badgeColor.bg}`}
              >
                {simulatedItem.shelfLifeLabel}
              </span>
            </div>

            {/* The 4-Step User Transformation Chain */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1: Raw Data */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400 font-bold">
                  Step 1: Raw Data Input
                </div>
                <div className="font-bold text-stone-900 text-sm">
                  {simulatedItem.rawDataSummary}
                </div>
                <div className="text-[11px] text-stone-500">
                  Stored under {simStorage.replace("_", " ")}
                </div>
              </div>

              {/* Step 2: AI Reasoning */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-600 font-bold">
                  Step 2: AI Reasoning (FEFO)
                </div>
                <p className="text-xs text-stone-700 leading-snug">
                  {simulatedItem.aiReasoning}
                </p>
              </div>

              {/* Step 3: Recommendation */}
              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                  Step 3: Chef Recommendation
                </div>
                <div className="font-semibold text-emerald-800 text-xs">
                  {simulatedItem.recommendation}
                </div>
              </div>

              {/* Step 4: Result */}
              <div className="p-4 rounded-xl bg-emerald-900 text-white shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                  Step 4: Result Metric
                </div>
                <div className="font-bold text-white text-xs">
                  {simulatedItem.resultMetric}
                </div>
                <div className="text-[10px] text-emerald-200 font-mono">
                  ~{simulatedItem.wasteMitigationResult.mealsGenerated} meals · ₹{simulatedItem.wasteMitigationResult.procurementCostSavedInr} saved
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Upcoming Meal Absorption Schedule Tab */}
      {activeTab === "correlation" && (
        <div className="border border-stone-200 bg-white rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Raw Material &amp; Recipe Utilization Schedule
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Correlating raw ingredients directly into upcoming kitchen batch preparation to absorb stock before shelf-life expires.
            </p>
          </div>

          <div className="space-y-4">
            {report.recipeUtilizationSchedule.map((slot, index) => (
              <div
                key={index}
                className="p-5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-2.5">
                  <div className="flex items-center gap-2 font-serif font-bold text-stone-900">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>{slot.mealSlot}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {slot.preventionOutcome}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Ingredients to absorb */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                      Target Raw Ingredients to Absorb (FEFO):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {slot.ingredientsToAbsorb.length > 0 ? (
                        slot.ingredientsToAbsorb.map((ing, iIdx) => (
                          <span
                            key={iIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 shadow-2xs"
                          >
                            <Package className="w-3 h-3 text-stone-400" />
                            <strong>{ing.name}</strong>
                            <span className="text-stone-500 font-mono">({ing.quantity})</span>
                            <span className="text-[10px] text-rose-600 font-semibold">
                              · {ing.urgency}
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-stone-500 italic">
                          Standard pantry rotation (No nearing-expiry raw materials)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Suggested Dishes */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                      Suggested Kitchen Recipes:
                    </span>
                    <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside">
                      {slot.suggestedDishes.map((dish, dIdx) => (
                        <li key={dIdx} className="leading-snug">
                          <strong className="text-stone-900">{dish}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Notes Pill */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-purple-800">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>AI Resource Utilization Action Notes:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-purple-800 text-[11px]">
              {report.aiActionPlanNotes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
