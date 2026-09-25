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
  Sunrise,
  Coffee,
  Moon,
  Scale,
  Calendar,
  Zap,
  Info,
  Check,
  Sliders,
  Cpu,
  Plus,
  ShoppingCart,
  DollarSign,
  AlertOctagon,
  X,
  Search,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle,
  Radio,
  Activity,
  Wrench,
  Timer,
} from "lucide-react";
import {
  FefoIntelligenceReport,
  FefoEvaluatedItem,
  evaluateFefoItem,
  FefoRawItemInput,
  StorageEnvironment,
  RawMaterialProcurementItem,
  DayCookingPlan,
  generate3DayCookingPlans,
  CookingBatch,
  CookingBatchStatus,
  CookingBatchIngredient,
  getDefaultCookingBatches,
  formatDurationHoursMinutes,
  calculateBatchYieldMetrics,
  BatchYieldMetrics,
} from "@/lib/fefo-engine";

interface FefoResourceIntelligenceProps {
  initialReport: FefoIntelligenceReport;
  tomorrowDemandKg?: number;
  onRefresh?: () => void;
}

export default function FefoResourceIntelligence({
  initialReport,
  tomorrowDemandKg = 28,
  onRefresh,
}: FefoResourceIntelligenceProps) {
  const [report, setReport] = useState<FefoIntelligenceReport>(initialReport);
  const [activeTab, setActiveTab] = useState<"live_matrix" | "procurement" | "simulator" | "correlation">(
    "live_matrix"
  );
  const [selectedPlanDay, setSelectedPlanDay] = useState<"today" | "tomorrow" | "day_after_tomorrow">("today");

  const dailyPlans: DayCookingPlan[] = React.useMemo(() => {
    if (report.dailyCookingPlans && report.dailyCookingPlans.length > 0) {
      return report.dailyCookingPlans;
    }
    return generate3DayCookingPlans(report.evaluatedItems || []);
  }, [report.dailyCookingPlans, report.evaluatedItems]);

  const activePlan = dailyPlans.find((p) => p.dayKey === selectedPlanDay) || dailyPlans[0];

  // Filter state for matrix
  const [tierFilter, setTierFilter] = useState<"all" | "expiring_soon" | "moderate" | "long_shelf_life" | "overstocked" | "expired">(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedReasonId, setExpandedReasonId] = useState<string | null>(null);

  // Astra Cooking & Output Batch Tracking State (Khushbu Workflow)
  const [batches, setBatches] = useState<CookingBatch[]>(() => getDefaultCookingBatches());
  const [batchFilter, setBatchFilter] = useState<"all" | "cooking" | "needs_review" | "completed" | "planned">("all");
  const [recordingBatch, setRecordingBatch] = useState<CookingBatch | null>(null);
  const [inspectingBatch, setInspectingBatch] = useState<CookingBatch | null>(null);
  const [startingBatch, setStartingBatch] = useState<CookingBatch | null>(null);

  // Recording Form State
  const [recActualOutput, setRecActualOutput] = useState<string>("");
  const [recElapsedHours, setRecElapsedHours] = useState<string>("2");
  const [recElapsedMinutes, setRecElapsedMinutes] = useState<string>("48");
  const [recDowntimeMinutes, setRecDowntimeMinutes] = useState<string>("");
  const [recEnergyKwh, setRecEnergyKwh] = useState<string>("");
  const [recVarianceReason, setRecVarianceReason] = useState<string>("");
  const [recVarianceNotes, setRecVarianceNotes] = useState<string>("");
  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(false);

  // Count of batches that require attention
  const needsReviewCount = batches.filter((b) => b.status === "needs_review").length;

  // Filtered batches for display
  const filteredBatches = batches.filter((b) => {
    if (batchFilter === "all") return true;
    return b.status === batchFilter;
  });

  const handleOpenRecordModal = (batch: CookingBatch) => {
    setRecordingBatch(batch);
    setRecActualOutput(batch.actualOutput != null ? String(batch.actualOutput) : "");
    const totalMinutes = batch.actualDurationMinutes ?? batch.expectedDurationMinutes ?? 60;
    setRecElapsedHours(String(Math.floor(totalMinutes / 60)));
    setRecElapsedMinutes(String(totalMinutes % 60));
    setRecDowntimeMinutes(batch.downtimeMinutes != null ? String(batch.downtimeMinutes) : "");
    setRecEnergyKwh(batch.energyKwh != null ? String(batch.energyKwh) : "");
    setRecVarianceReason(batch.varianceReason || "");
    setRecVarianceNotes(batch.varianceNotes || "");
    setShowOptionalDetails(Boolean(batch.downtimeMinutes || batch.energyKwh || batch.varianceReason));
  };

  const handleSaveBatchResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordingBatch) return;

    const actualQty = parseFloat(recActualOutput);
    if (isNaN(actualQty) || actualQty < 0) return;

    const hrs = parseInt(recElapsedHours || "0", 10);
    const mins = parseInt(recElapsedMinutes || "0", 10);
    const actualMinutes = hrs * 60 + mins;

    const downtime = recDowntimeMinutes.trim() !== "" ? parseFloat(recDowntimeMinutes) : null;
    const energy = recEnergyKwh.trim() !== "" ? parseFloat(recEnergyKwh) : null;

    const tolerance = recordingBatch.tolerancePercent ?? 10;
    const shortfallAmount = recordingBatch.expectedOutput - actualQty;
    const shortfallPercent = (shortfallAmount / recordingBatch.expectedOutput) * 100;
    const needsReview = shortfallAmount > 0 && shortfallPercent >= tolerance;

    const updatedBatch: CookingBatch = {
      ...recordingBatch,
      actualOutput: actualQty,
      actualDurationMinutes: actualMinutes,
      downtimeMinutes: downtime,
      energyKwh: energy,
      varianceReason: (recVarianceReason as any) || "",
      varianceNotes: recVarianceNotes.trim() || (needsReview ? `Output is ${shortfallAmount} ${recordingBatch.outputUnit} below expected (${(100 - shortfallPercent).toFixed(1)}% yield)` : "Completed normally"),
      status: needsReview ? "needs_review" : "completed",
      recordedAt: "Today · Just now",
    };

    setBatches((prev) => prev.map((b) => (b.id === recordingBatch.id ? updatedBatch : b)));
    setRecordingBatch(null);
    setInspectingBatch(updatedBatch); // Immediately preview comparison card
  };

  const handleConfirmStartBatch = () => {
    if (!startingBatch) return;
    const updated: CookingBatch = {
      ...startingBatch,
      status: "cooking",
      recordedAt: "Started just now",
    };
    setBatches((prev) => prev.map((b) => (b.id === startingBatch.id ? updated : b)));
    setStartingBatch(null);
  };

  const handleStartBatchForDish = (
    dishName: string,
    mealLabel: string,
    ingredients: Array<{ name: string; quantity: string }>
  ) => {
    const existing = batches.find((b) => b.dishName.toLowerCase() === dishName.toLowerCase());
    if (existing) {
      if (existing.status === "planned") {
        setStartingBatch(existing);
      } else if (existing.status === "cooking") {
        handleOpenRecordModal(existing);
      } else {
        setInspectingBatch(existing);
      }
      return;
    }

    const newBatchId = `batch-${Date.now()}`;
    const newBatchNum = `B-${100 + batches.length + 1}`;
    const newBatch: CookingBatch = {
      id: newBatchId,
      batchNumber: newBatchNum,
      dishName,
      mealSlot: (mealLabel as any) || "Lunch",
      dayKey: selectedPlanDay,
      ingredients: ingredients.map((ing) => {
        const numVal = parseFloat(ing.quantity) || 10;
        const unit = ing.quantity.includes("L") ? "litres" : "kg";
        return {
          name: ing.name,
          expectedQuantity: numVal,
          unit,
        };
      }),
      totalRawInputExpected: 25,
      inputUnit: "kg",
      expectedOutput: 22,
      outputUnit: "kg",
      expectedDurationMinutes: 60,
      status: "planned",
      baselineType: "recipe_baseline",
      tolerancePercent: 10,
    };
    setBatches((prev) => [newBatch, ...prev]);
    setStartingBatch(newBatch);
  };

  const handleApproveBatchReview = (batchId: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === batchId ? { ...b, status: "completed" } : b))
    );
    if (inspectingBatch && inspectingBatch.id === batchId) {
      setInspectingBatch({ ...inspectingBatch, status: "completed" });
    }
  };

  // Modal State for adding Raw Material
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);

  // Add Raw Material Form
  const [rawName, setRawName] = useState("");
  const [rawCategory, setRawCategory] = useState("raw_produce");
  const [rawQuantity, setRawQuantity] = useState("10");
  const [rawUnit, setRawUnit] = useState("kg");
  const [rawStorage, setRawStorage] = useState<StorageEnvironment>("ambient");
  const [rawExpiryDays, setRawExpiryDays] = useState("3");
  const [rawUnitCost, setRawUnitCost] = useState("45");

  // Simulator State
  const [simName, setSimName] = useState<string>("Fresh Tomatoes");
  const [simCategory, setSimCategory] = useState<string>("raw_produce");
  const [simQuantity, setSimQuantity] = useState<number>(5);
  const [simUnit, setSimUnit] = useState<string>("kg");
  const [simExpiryDays, setSimExpiryDays] = useState<number>(2);
  const [simStorage, setSimStorage] = useState<StorageEnvironment>("ambient");
  const [simDemand, setSimDemand] = useState<number>(14);

  // Synchronize when initialReport changes
  React.useEffect(() => {
    setReport(initialReport);
  }, [initialReport]);

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

  // Filtered raw material items in matrix
  const filteredItems = report.evaluatedItems.filter((item) => {
    const matchesTier = tierFilter === "all" || item.shelfLifeTier === tierFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchesTier && matchesSearch;
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

  const handleCreateRawMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    setIsSubmitting(true);
    try {
      const expiryDate = new Date(Date.now() + Number(rawExpiryDays) * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch("/api/v1/resource-utilization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rawName,
          category: rawCategory,
          quantity: Number(rawQuantity),
          unit: rawUnit,
          storage: rawStorage,
          expiryEstimateAt: expiryDate,
          unitCostInr: Number(rawUnitCost),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log raw material.");
      }

      setAddSuccess(true);
      setTimeout(() => {
        setIsAddOpen(false);
        setAddSuccess(false);
        setRawName("");
        if (onRefresh) onRefresh();
        else window.location.reload();
      }, 1000);
    } catch (err: any) {
      setAddError(err.message || "Error logging raw material.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Symmetrical 4-Card FEFO Hierarchy KPI Deck with Interactive Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: High Priority (<= 48h) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("live_matrix");
            setTierFilter(tierFilter === "expiring_soon" && activeTab === "live_matrix" ? "all" : "expiring_soon");
          }}
          className={`text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
            activeTab === "live_matrix" && tierFilter === "expiring_soon"
              ? "border-rose-400 ring-2 ring-rose-400"
              : "border-rose-200/80 hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-rose-800 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-pulse" />
              1. High Priority (≤48h)
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold">
              COOK URGENTLY
            </span>
          </div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-extrabold text-rose-900 flex items-baseline gap-1.5">
            <span>{report.summary.expiringSoonKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
            <span className="text-xs font-mono text-stone-400 ml-auto font-normal">
              ({report.summary.expiringSoonCount} items)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
            <span>Produce &amp; dairy nearing expiry</span>
            <span className="text-rose-700 font-medium group-hover:underline text-[10px]">
              {tierFilter === "expiring_soon" && activeTab === "live_matrix" ? "Active Filter" : "Filter stock →"}
            </span>
          </div>
        </button>

        {/* Card 2: Medium Priority (3-7d) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("live_matrix");
            setTierFilter(tierFilter === "moderate" && activeTab === "live_matrix" ? "all" : "moderate");
          }}
          className={`text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
            activeTab === "live_matrix" && tierFilter === "moderate"
              ? "border-amber-400 ring-2 ring-amber-400"
              : "border-amber-200/80 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              2. Medium Priority (3–7d)
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
              STAGE NEXT
            </span>
          </div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-extrabold text-amber-900 flex items-baseline gap-1.5">
            <span>{report.summary.moderateShelfLifeKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
            <span className="text-xs font-mono text-stone-400 ml-auto font-normal">
              ({report.summary.moderateShelfLifeCount} items)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
            <span>Staples for mid-week meals</span>
            <span className="text-amber-800 font-medium group-hover:underline text-[10px]">
              {tierFilter === "moderate" && activeTab === "live_matrix" ? "Active Filter" : "Filter stock →"}
            </span>
          </div>
        </button>

        {/* Card 3: Low Priority (>7d) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("live_matrix");
            setTierFilter(tierFilter === "long_shelf_life" && activeTab === "live_matrix" ? "all" : "long_shelf_life");
          }}
          className={`text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
            activeTab === "live_matrix" && tierFilter === "long_shelf_life"
              ? "border-emerald-400 ring-2 ring-emerald-400"
              : "border-emerald-200/80 hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
              3. Low Priority (&gt;7d)
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
              PRESERVE BUFFER
            </span>
          </div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-900 flex items-baseline gap-1.5">
            <span>{report.summary.longShelfLifeKg}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">kg</span>
            <span className="text-xs font-mono text-stone-400 ml-auto font-normal">
              ({report.summary.longShelfLifeCount} items)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
            <span>Safe dry pantry &amp; grains</span>
            <span className="text-emerald-800 font-medium group-hover:underline text-[10px]">
              {tierFilter === "long_shelf_life" && activeTab === "live_matrix" ? "Active Filter" : "Filter stock →"}
            </span>
          </div>
        </button>

        {/* Card 4: Overstock Blocked */}
        <button
          type="button"
          onClick={() => setActiveTab("procurement")}
          className={`text-left p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
            activeTab === "procurement"
              ? "border-purple-400 ring-2 ring-purple-400"
              : "border-purple-200/80 hover:border-purple-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 inline-block" />
              4. Overstock Gated
            </span>
            <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full font-bold">
              DO NOT BUY
            </span>
          </div>
          <div className="mt-2.5 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            <span>₹{report.procurementSummary.procurementBudgetSavedInr.toLocaleString()}</span>
            <span className="text-xs font-sans text-stone-500 font-normal">saved</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-600 flex items-center justify-between">
            <span>{report.summary.overstockedCount} surplus reorders blocked</span>
            <span className="text-purple-800 font-medium group-hover:underline text-[10px]">
              {activeTab === "procurement" ? "Viewing Guide" : "Buying guide →"}
            </span>
          </div>
        </button>
      </div>

      {/* 2. Sleek Tab Bar & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div className="inline-flex p-1 rounded-xl bg-stone-100 border border-stone-200/70 text-xs font-semibold overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab("live_matrix")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "live_matrix"
                ? "bg-white text-stone-900 shadow-xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Raw Stock</span>
            <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-md text-[10px] font-mono">
              {report.evaluatedItems.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("correlation")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "correlation"
                ? "bg-white text-stone-900 shadow-xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <Utensils className="w-4 h-4 text-amber-600" />
            <span>Cooking &amp; Output</span>
            {needsReviewCount > 0 ? (
              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-md text-[10px] font-mono font-bold animate-pulse">
                {needsReviewCount} Review
              </span>
            ) : (
              <span className="px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded-md text-[10px] font-mono">
                {batches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("procurement")}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === "procurement"
                ? "bg-white text-stone-900 shadow-xs font-bold"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span>Buying Guide</span>
            {report.summary.overstockedCount > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded-md text-[10px] font-mono font-bold">
                {report.summary.overstockedCount} Gated
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0 px-1">
          {/* Secondary AI Simulator Button (Astra recommendation) */}
          <button
            onClick={() => setActiveTab("simulator")}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
              activeTab === "simulator"
                ? "bg-purple-100 text-purple-900 border-purple-300 font-bold shadow-xs"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Try AI Simulator</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-sm cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Raw Material</span>
          </button>
        </div>
      </div>

      {/* 3. Live FEFO Raw Stock Matrix Tab */}
      {activeTab === "live_matrix" && (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs space-y-0">
          {/* Table Toolbar & Search / Filters */}
          <div className="p-4 sm:p-5 border-b border-stone-200 bg-stone-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Raw Stock Inventory &amp; Expiry Monitor
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-stone-200 text-stone-700">
                  {filteredItems.length} of {report.evaluatedItems.length} items
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Evaluates raw ingredients only. Prioritizes nearing-expiry produce for immediate cooking before spoilage.
              </p>
            </div>

            {/* Search Input & Filter Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Live search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ingredient..."
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
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
                  🔴 High (&le;48h) ({report.summary.expiringSoonCount})
                </button>
                <button
                  onClick={() => setTierFilter("moderate")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    tierFilter === "moderate"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  🟡 Med (3–7d) ({report.summary.moderateShelfLifeCount})
                </button>
                <button
                  onClick={() => setTierFilter("long_shelf_life")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    tierFilter === "long_shelf_life"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  🟢 Low (&gt;7d) ({report.summary.longShelfLifeCount})
                </button>
                {report.summary.overstockedCount > 0 && (
                  <button
                    onClick={() => setTierFilter("overstocked")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      tierFilter === "overstocked"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100"
                    }`}
                  >
                    🟣 Overstocked ({report.summary.overstockedCount})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Clean Simplified Matrix Table (Astra Blueprint) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-sans">
                  <th className="py-3 px-4 font-semibold">Raw Ingredient &amp; Storage</th>
                  <th className="py-3 px-4 font-semibold">Available Stock</th>
                  <th className="py-3 px-4 font-semibold">Expiry &amp; Shelf Life</th>
                  <th className="py-3 px-4 font-semibold">Use-First Priority</th>
                  <th className="py-3 px-4 font-semibold text-right">Recommended Prep &amp; Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-stone-300" />
                        <p className="font-semibold text-stone-700 text-xs">No raw ingredients match your search or filter</p>
                        <p className="text-[11px] text-stone-500">Try adjusting your search query or tier filter.</p>
                        <button
                          type="button"
                          onClick={() => { setTierFilter("all"); setSearchQuery(""); }}
                          className="mt-1 px-3 py-1 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const storageInfo = getStorageBadge(item.storage);
                    const isExpired = item.shelfLifeTier === "expired";
                    const isExpanded = expandedReasonId === item.id;

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="hover:bg-stone-50/80 transition-colors">
                          {/* 1. Raw Ingredient & Storage */}
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

                          {/* 2. Available Stock */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-bold text-stone-900 text-sm">
                              {item.quantity} {item.unit}
                            </div>
                            <div className="text-[10px] text-stone-500 font-sans mt-0.5">
                              daily need: ~{item.correlatedDemandKg} kg
                            </div>
                          </td>

                          {/* 3. Expiry & Shelf Life */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${item.badgeColor.dot}`}
                              />
                              <span className={`font-medium ${isExpired ? "text-rose-700 font-bold" : "text-stone-900"}`}>
                                {isExpired
                                  ? `${Math.abs(Math.round(item.hoursUntilExpiry))}h overdue`
                                  : item.daysUntilExpiry <= 1
                                  ? `${Math.max(1, Math.round(item.hoursUntilExpiry))}h remaining`
                                  : `${Math.round(item.daysUntilExpiry)} days safe`}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                              Expiry: {new Date(item.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </td>

                          {/* 4. Use-First Priority */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${item.badgeColor.bg}`}
                            >
                              {isExpired
                                ? "❌ Expired / Quarantined"
                                : item.shelfLifeTier === "expiring_soon"
                                ? "🔴 High Priority: Cook Urgently"
                                : item.shelfLifeTier === "moderate"
                                ? "🟡 Medium Priority: Use Next"
                                : item.shelfLifeTier === "overstocked"
                                ? "🟣 Overstocked: Do Not Reorder"
                                : "🟢 Low Priority: Buffer Reserve"}
                            </span>
                          </td>

                          {/* 5. Recommended Prep & Rationale */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div
                                className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-medium text-left max-w-xs ml-auto border ${
                                  isExpired
                                    ? "bg-rose-50 text-rose-900 border-rose-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}
                              >
                                <span
                                  className={`font-bold block text-[10px] uppercase tracking-wider ${
                                    isExpired ? "text-rose-700" : "text-emerald-700"
                                  }`}
                                >
                                  {item.targetMealTime}
                                </span>
                                <span className="line-clamp-1">{item.suggestedRecipeUse || item.recommendation}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-stone-500 font-mono">
                                  {item.resultMetric}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedReasonId(isExpanded ? null : item.id)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  <span>{isExpanded ? "Hide" : "AI Reason"}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Accordion Row for AI Central Reasoning */}
                        {isExpanded && (
                          <tr className="bg-purple-50/40 border-b border-purple-100">
                            <td colSpan={5} className="py-3.5 px-5 text-left">
                              <div className="flex items-start gap-2.5 text-xs text-stone-700">
                                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <div className="font-semibold text-stone-900 text-xs flex items-center gap-2">
                                    <span>NVIDIA NIM Kitchen Intelligence:</span>
                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full font-bold">
                                      {item.targetMealTime}
                                    </span>
                                  </div>
                                  <p className="text-stone-700 text-xs leading-relaxed">{item.aiReasoning}</p>
                                  <p className="text-emerald-800 font-medium text-[11px] mt-1">
                                    Action: {item.recommendation}
                                  </p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Smart Procurement & Reorder Advisory Tab */}
      {activeTab === "procurement" && (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs space-y-0">
          <div className="p-5 border-b border-stone-200 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-700" />
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Smart Procurement &amp; Reorder Advisory (How Much to Buy)
                </h3>
              </div>
              <p className="text-xs text-stone-600 mt-1 max-w-2xl">
                Tells your institutional kitchen exact stock balances vs. 7-day cooking requirements so you{" "}
                <strong className="text-purple-900 font-bold">never overstock supplies unnecessarily</strong>.
              </p>
            </div>

            {/* Quick KPI Badge */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="p-2.5 rounded-xl bg-purple-100 border border-purple-300 text-purple-900 text-xs font-mono font-bold">
                ₹{report.procurementSummary.procurementBudgetSavedInr.toLocaleString()} Overstock Budget Saved
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-50/60 border-b border-purple-200/80 text-xs text-purple-900 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              <strong>AI Procurement Rule:</strong> If current inventory covers &gt;7 days of dining demand, reordering is blocked (DO NOT BUY). Buy only what can be consumed within the safe shelf-life window.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-sans">
                  <th className="py-3 px-4 font-semibold">Raw Ingredient</th>
                  <th className="py-3 px-4 font-mono font-semibold text-right">In Inventory</th>
                  <th className="py-3 px-4 font-mono font-semibold text-right">7-Day Cooking Need</th>
                  <th className="py-3 px-4 font-mono font-semibold text-right">Supply Remaining</th>
                  <th className="py-3 px-4 font-semibold text-center">NVIDIA Reorder Decision</th>
                  <th className="py-3 px-4 font-semibold">AI Procurement Guidance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {report.procurementSummary.items.map((p) => {
                  const isDoNotBuy = p.purchaseAction === "DO_NOT_BUY";

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-stone-400 capitalize">{p.category.replace("_", " ")}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right font-bold text-stone-900">
                        {p.currentStock} {p.unit}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right text-stone-600">
                        {p.projected7DayDemandKg} kg
                      </td>

                      <td className="py-3.5 px-4 font-mono text-right">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          p.daysOfSupplyRemaining < 2
                            ? "bg-amber-100 text-amber-900"
                            : p.daysOfSupplyRemaining > 7
                            ? "bg-purple-100 text-purple-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}>
                          ~{p.daysOfSupplyRemaining} days
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1 ${p.actionBadge.bg} ${p.actionBadge.text} ${p.actionBadge.border}`}
                          >
                            {isDoNotBuy ? "⛔ DO NOT BUY" : p.recommendedBuyKg > 0 ? `🛒 BUY ~${p.recommendedBuyKg} kg` : "✅ Adequate"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-[11px] text-stone-700 leading-relaxed">
                          {p.reasoning}
                        </p>
                        {isDoNotBuy && p.overstockCostSavedInr > 0 && (
                          <span className="text-[10px] text-purple-700 font-bold block mt-0.5">
                            Saved ~₹{p.overstockCostSavedInr} by withholding purchase
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Interactive FEFO AI Simulator Tab */}
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
              Test any raw ingredient to see how NVIDIA NIM central intelligence reasons, categorizes shelf-life, and optimizes cooking urgency.
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
              🍅 5 kg Tomatoes (2 days left) [User Blueprint Example]
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
                setSimName("Farm Potatoes");
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
                setSimQuantity(120);
                setSimUnit("kg");
                setSimExpiryDays(60);
                setSimStorage("dry_pantry");
                setSimDemand(25);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            >
              🌾 120 kg Dry Rice (60 days left)
            </button>
          </div>

          {/* Simulator Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
                Raw Material Name
              </label>
              <input
                type="text"
                value={simName}
                onChange={(e) => setSimName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-stone-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g. Tomatoes"
              />
            </div>

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

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-600 font-bold">
                  Step 2: AI Reasoning (NVIDIA NIM)
                </div>
                <p className="text-xs text-stone-700 leading-snug">
                  {simulatedItem.aiReasoning}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 font-bold">
                  Step 3: Urgent Cooking Recommendation
                </div>
                <div className="font-semibold text-emerald-800 text-xs">
                  {simulatedItem.recommendation}
                </div>
              </div>

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

      {/* 7. Upcoming Meal Absorption Schedule & Batch Execution Tab */}
      {activeTab === "correlation" && (
        <div className="border border-stone-200 bg-white rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-amber-600" />
              <h3 className="font-serif font-bold text-lg text-stone-900">
                Cooking &amp; Output: Raw Material Batch Execution &amp; Yield Tracking
              </h3>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Correlates raw stock into today, tomorrow, and day after tomorrow kitchen prep. Monitor how ingredients turn into finished food, record actual kitchen outputs, and compare yields against recipe baselines.
            </p>
          </div>

          {/* 3-Day Selector Bar (Today, Tomorrow, Day After Tomorrow ONLY) */}
          <div className="flex items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 overflow-x-auto">
            {dailyPlans.map((plan) => {
              const isActive = selectedPlanDay === plan.dayKey;
              return (
                <button
                  key={plan.dayKey}
                  type="button"
                  onClick={() => setSelectedPlanDay(plan.dayKey)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-white text-stone-900 shadow-xs font-bold border border-stone-200"
                      : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${isActive ? "text-emerald-700" : "text-stone-400"}`} />
                  <span>{plan.dayTitle}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      plan.badgeVariant === "urgent"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : plan.badgeVariant === "moderate"
                        ? "bg-amber-100 text-amber-800 border border-amber-200"
                        : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    }`}
                  >
                    {plan.totalKgToAbsorb > 0 ? `${plan.totalKgToAbsorb} kg` : "Balanced"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Day Summary Banner */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                  {activePlan.dayTitle}
                </span>
                <span className="text-xs text-stone-500 font-mono">
                  ({activePlan.dateLabel})
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                {activePlan.absorptionSummary}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${
                activePlan.badgeVariant === "urgent"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : activePlan.badgeVariant === "moderate"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{activePlan.urgencyBadge}</span>
            </span>
          </div>

          {/* 4 Distinct Meal Cards: Breakfast, Lunch, Snacks, Dinner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(
              [
                {
                  key: "breakfast" as const,
                  label: "Breakfast",
                  icon: <Sunrise className="w-4 h-4 text-amber-600" />,
                  accentBorder: "border-amber-200/80 hover:border-amber-300",
                  headerBg: "bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40",
                  tagColor: "text-amber-800 bg-amber-100/80 border-amber-200",
                  data: activePlan.meals.breakfast,
                },
                {
                  key: "lunch" as const,
                  label: "Lunch",
                  icon: <Sun className="w-4 h-4 text-emerald-600" />,
                  accentBorder: "border-emerald-200/80 hover:border-emerald-300",
                  headerBg: "bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40",
                  tagColor: "text-emerald-800 bg-emerald-100/80 border-emerald-200",
                  data: activePlan.meals.lunch,
                },
                {
                  key: "snacks" as const,
                  label: "Evening Snacks",
                  icon: <Coffee className="w-4 h-4 text-orange-600" />,
                  accentBorder: "border-orange-200/80 hover:border-orange-300",
                  headerBg: "bg-gradient-to-r from-orange-50/80 via-white to-orange-50/40",
                  tagColor: "text-orange-800 bg-orange-100/80 border-orange-200",
                  data: activePlan.meals.snacks,
                },
                {
                  key: "dinner" as const,
                  label: "Dinner",
                  icon: <Moon className="w-4 h-4 text-indigo-600" />,
                  accentBorder: "border-indigo-200/80 hover:border-indigo-300",
                  headerBg: "bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40",
                  tagColor: "text-indigo-800 bg-indigo-100/80 border-indigo-200",
                  data: activePlan.meals.dinner,
                },
              ] as const
            ).map((mealSlot) => {
              const meal = mealSlot.data;
              return (
                <div
                  key={mealSlot.key}
                  className={`p-4 sm:p-5 rounded-2xl border ${mealSlot.accentBorder} bg-white shadow-xs hover:shadow-sm transition-all space-y-3.5 flex flex-col justify-between`}
                >
                  <div className="space-y-3">
                    {/* Meal Header */}
                    <div className={`p-2.5 rounded-xl border border-stone-100 ${mealSlot.headerBg} flex items-center justify-between gap-2`}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-white border border-stone-200/70 flex items-center justify-center shadow-2xs">
                          {mealSlot.icon}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-stone-900 text-sm">
                            {meal.mealLabel}
                          </h4>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${mealSlot.tagColor}`}>
                        {meal.timeWindow}
                      </span>
                    </div>

                    {/* Target Raw Ingredients to Absorb (FEFO) */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                        Target Raw Ingredients to Absorb (FEFO):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.ingredientsToAbsorb.length > 0 ? (
                          meal.ingredientsToAbsorb.map((ing, iIdx) => (
                            <span
                              key={iIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 shadow-2xs"
                            >
                              <Package className="w-3 h-3 text-stone-400 shrink-0" />
                              <strong>{ing.name}</strong>
                              <span className="text-stone-500 font-mono">({ing.quantity})</span>
                              <span className="text-[10px] text-rose-600 font-semibold whitespace-nowrap">
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

                    {/* Recommended Dishes to Prepare with Action to Start Batch */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                        Recommended Dishes to Prepare:
                      </span>
                      <ul className="text-xs text-stone-700 space-y-1.5">
                        {meal.suggestedDishes.map((dish, dIdx) => (
                          <li key={dIdx} className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-stone-50 transition-colors">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-400 shrink-0 mt-1" />
                              <strong className="text-stone-900 font-semibold text-xs truncate">{dish}</strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartBatchForDish(dish, mealSlot.label, meal.ingredientsToAbsorb)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Start Batch</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Central Reasoning */}
                  {meal.aiRationale && (
                    <div className="pt-2 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-600 bg-stone-50/60 p-2 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                      <span className="leading-tight">
                        <strong className="text-stone-700">AI Chef Rationale:</strong> {meal.aiRationale}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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

          {/* Kitchen Batches & Output Tracking (Khushbu Khantwal Blueprint Workflow) */}
          <div className="mt-8 border-t border-stone-200 pt-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif font-bold text-base text-stone-900">
                    Kitchen Batches &amp; Output Tracking
                  </h4>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Khushbu Workflow
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Monitor raw materials converted into finished food, record kitchen actuals, and compare output yields against recipe baselines.
                </p>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setBatchFilter("all")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    batchFilter === "all"
                      ? "bg-stone-900 text-white"
                      : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  All ({batches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter("cooking")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    batchFilter === "cooking"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                  }`}
                >
                  Cooking ({batches.filter((b) => b.status === "cooking").length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter("needs_review")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    batchFilter === "needs_review"
                      ? "bg-rose-600 text-white"
                      : "bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100"
                  }`}
                >
                  Needs Review ({batches.filter((b) => b.status === "needs_review").length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter("completed")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    batchFilter === "completed"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Completed ({batches.filter((b) => b.status === "completed").length})
                </button>
                <button
                  type="button"
                  onClick={() => setBatchFilter("planned")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    batchFilter === "planned"
                      ? "bg-stone-600 text-white"
                      : "bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  Planned ({batches.filter((b) => b.status === "planned").length})
                </button>
              </div>
            </div>

            {/* Prominent Alert Banner if any batch needs attention */}
            {needsReviewCount > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-rose-900">
                      {needsReviewCount} Batch Requires Attention
                    </div>
                    <div className="text-xs text-rose-800 mt-0.5">
                      Batch #{batches.find(b => b.status === "needs_review")?.batchNumber} ({batches.find(b => b.status === "needs_review")?.dishName}): Output is {Math.abs(Number(((batches.find(b => b.status === "needs_review")?.actualOutput || 0) - (batches.find(b => b.status === "needs_review")?.expectedOutput || 0)).toFixed(1)))} {batches.find(b => b.status === "needs_review")?.outputUnit} below expected · Duration was +{((batches.find(b => b.status === "needs_review")?.actualDurationMinutes || 0) - (batches.find(b => b.status === "needs_review")?.expectedDurationMinutes || 0))} min over baseline.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const rev = batches.find((b) => b.status === "needs_review");
                    if (rev) setInspectingBatch(rev);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  Inspect Comparison →
                </button>
              </div>
            )}

            {/* Compact Batches Table (Desktop) */}
            <div className="hidden md:block border border-stone-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] uppercase tracking-wider text-stone-500 font-sans">
                    <th className="py-3 px-4 font-semibold">Dish / Meal</th>
                    <th className="py-3 px-4 font-semibold">Raw Input Allocated</th>
                    <th className="py-3 px-4 font-semibold">Expected Output</th>
                    <th className="py-3 px-4 font-semibold">Actual Output</th>
                    <th className="py-3 px-4 font-semibold">Duration</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Next Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500 text-xs">
                        No batches match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => {
                      const yieldMetrics = calculateBatchYieldMetrics(batch);
                      return (
                        <tr key={batch.id} className="hover:bg-stone-50/80 transition-colors">
                          {/* 1. Dish & Meal */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                                {batch.batchNumber}
                              </span>
                              <span className="font-semibold text-stone-900 text-xs">
                                {batch.dishName}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-stone-500">
                              <span>{batch.mealSlot}</span>
                              <span>·</span>
                              <span className="capitalize">{batch.dayKey.replace(/_/g, " ")}</span>
                            </div>
                          </td>

                          {/* 2. Raw Input */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-semibold text-stone-800 text-xs">
                              {batch.totalRawInputActual ?? batch.totalRawInputExpected} {batch.inputUnit}
                            </div>
                            <div className="text-[10px] text-stone-400 font-sans truncate max-w-[130px]">
                              {batch.ingredients.map((i) => i.name).join(", ")}
                            </div>
                          </td>

                          {/* 3. Expected Output */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="font-semibold text-stone-800 text-xs">
                              {batch.expectedOutput} {batch.outputUnit}
                            </div>
                            <div className="text-[10px] text-stone-400 font-sans">
                              {batch.baselineType === "recipe_baseline" ? "Recipe Baseline" : "Manually Entered"}
                            </div>
                          </td>

                          {/* 4. Actual Output */}
                          <td className="py-3.5 px-4 font-mono">
                            {batch.actualOutput != null ? (
                              <div>
                                <div className="font-bold text-stone-900 text-xs">
                                  {batch.actualOutput} {batch.outputUnit}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                      yieldMetrics.needsReview
                                        ? "bg-rose-100 text-rose-800"
                                        : "bg-emerald-100 text-emerald-800"
                                    }`}
                                  >
                                    {yieldMetrics.yieldPercent}%
                                  </span>
                                  {yieldMetrics.isShortfall && (
                                    <span className="text-[10px] text-rose-600 font-sans">
                                      (-{Math.abs(yieldMetrics.outputDiff || 0)} {batch.outputUnit})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-stone-400 italic text-[11px] font-sans">
                                Pending cooking
                              </span>
                            )}
                          </td>

                          {/* 5. Duration */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="text-xs text-stone-800">
                              {formatDurationHoursMinutes(batch.actualDurationMinutes ?? batch.expectedDurationMinutes)}
                            </div>
                            <div className="text-[10px] text-stone-400 font-sans">
                              exp: {formatDurationHoursMinutes(batch.expectedDurationMinutes)}
                              {batch.downtimeMinutes ? ` · ${batch.downtimeMinutes}m pause` : ""}
                            </div>
                          </td>

                          {/* 6. Plain Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                batch.status === "needs_review"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : batch.status === "cooking"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : batch.status === "completed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-stone-100 text-stone-700 border-stone-200"
                              }`}
                            >
                              {batch.status === "cooking" && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                              )}
                              {batch.status === "needs_review" && (
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                              )}
                              {batch.status === "completed" && (
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                              )}
                              <span>
                                {batch.status === "needs_review"
                                  ? "Needs review"
                                  : batch.status === "cooking"
                                  ? "Cooking"
                                  : batch.status === "completed"
                                  ? "Completed"
                                  : "Planned"}
                              </span>
                            </span>
                          </td>

                          {/* 7. Next Action Button */}
                          <td className="py-3.5 px-4 text-right">
                            {batch.status === "planned" && (
                              <button
                                type="button"
                                onClick={() => setStartingBatch(batch)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                              >
                                <Play className="w-3 h-3" />
                                <span>Start Batch</span>
                              </button>
                            )}

                            {batch.status === "cooking" && (
                              <button
                                type="button"
                                onClick={() => handleOpenRecordModal(batch)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                              >
                                <Timer className="w-3 h-3" />
                                <span>Record Result</span>
                              </button>
                            )}

                            {(batch.status === "completed" || batch.status === "needs_review") && (
                              <button
                                type="button"
                                onClick={() => setInspectingBatch(batch)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                                  batch.status === "needs_review"
                                    ? "bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300"
                                    : "bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200"
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                                <span>View Details</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Stacked Cards for Smaller Screens (Mobile) */}
            <div className="md:hidden space-y-3">
              {filteredBatches.map((batch) => {
                const yieldMetrics = calculateBatchYieldMetrics(batch);
                return (
                  <div
                    key={batch.id}
                    className="p-4 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200 text-stone-800">
                          {batch.batchNumber}
                        </span>
                        <span className="font-semibold text-stone-900 text-xs">
                          {batch.dishName}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          batch.status === "needs_review"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : batch.status === "cooking"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : batch.status === "completed"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-stone-100 text-stone-700 border-stone-200"
                        }`}
                      >
                        {batch.status === "needs_review" ? "Needs review" : batch.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                      <div>
                        <span className="text-[10px] text-stone-500 font-sans block">Expected Output:</span>
                        <span className="font-bold text-stone-800">{batch.expectedOutput} {batch.outputUnit}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 font-sans block">Actual Output:</span>
                        <span className="font-bold text-stone-900">
                          {batch.actualOutput != null ? `${batch.actualOutput} ${batch.outputUnit}` : "—"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-stone-500 font-mono">
                        {formatDurationHoursMinutes(batch.actualDurationMinutes ?? batch.expectedDurationMinutes)}
                      </span>
                      {batch.status === "planned" && (
                        <button
                          type="button"
                          onClick={() => setStartingBatch(batch)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 text-white text-xs font-semibold"
                        >
                          Start Batch
                        </button>
                      )}
                      {batch.status === "cooking" && (
                        <button
                          type="button"
                          onClick={() => handleOpenRecordModal(batch)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                        >
                          Record Result
                        </button>
                      )}
                      {(batch.status === "completed" || batch.status === "needs_review") && (
                        <button
                          type="button"
                          onClick={() => setInspectingBatch(batch)}
                          className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 border border-stone-200 text-xs font-semibold"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Record Batch Cooking Result */}
      {recordingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Record Finished Cooking Result
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Batch #{recordingBatch.batchNumber} · {recordingBatch.dishName} ({recordingBatch.mealSlot})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRecordingBatch(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchResult} className="p-5 space-y-4">
              {/* Baseline Reference Card */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1">
                <div className="font-semibold text-amber-900 flex items-center justify-between">
                  <span>Recipe Baseline:</span>
                  <span className="font-mono text-amber-800">
                    Expected: {recordingBatch.expectedOutput} {recordingBatch.outputUnit} · {formatDurationHoursMinutes(recordingBatch.expectedDurationMinutes)}
                  </span>
                </div>
                <div className="text-[11px] text-amber-800">
                  Ingredients: {recordingBatch.ingredients.map((i) => `${i.name} (${i.expectedQuantity} ${i.unit})`).join(", ")}
                </div>
              </div>

              {/* Prominent Inputs: Actual Output & Elapsed Duration */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Actual Finished Food Output ({recordingBatch.outputUnit}) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={recActualOutput}
                      onChange={(e) => setRecActualOutput(e.target.value)}
                      placeholder={`e.g. ${recordingBatch.expectedOutput}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-sm font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-stone-400 font-bold">
                      {recordingBatch.outputUnit}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1">
                    Elapsed Cooking Duration (Hours &amp; Minutes) *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="24"
                        required
                        value={recElapsedHours}
                        onChange={(e) => setRecElapsedHours(e.target.value)}
                        placeholder="2"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400">
                        hr
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        required
                        value={recElapsedMinutes}
                        onChange={(e) => setRecElapsedMinutes(e.target.value)}
                        placeholder="48"
                        className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-stone-400">
                        min
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Recorded duration: {recElapsedHours || 0} hr {recElapsedMinutes || 0} min (Start-to-finish elapsed time)
                  </p>
                </div>
              </div>

              {/* Collapsible: Additional details — optional */}
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(!showOptionalDetails)}
                  className="w-full p-3 bg-stone-50 hover:bg-stone-100 flex items-center justify-between text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-stone-500" />
                    <span>Additional details — optional</span>
                  </span>
                  {showOptionalDetails ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {showOptionalDetails && (
                  <div className="p-3.5 bg-white space-y-3 border-t border-stone-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Paused Downtime (Minutes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={recDowntimeMinutes}
                          onChange={(e) => setRecDowntimeMinutes(e.target.value)}
                          placeholder="Leave blank if none"
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-600 mb-1">
                          Energy Usage (kWh / fuel)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={recEnergyKwh}
                          onChange={(e) => setRecEnergyKwh(e.target.value)}
                          placeholder="e.g. 4.8"
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Variance Reason (if actual differs from recipe)
                      </label>
                      <select
                        value={recVarianceReason}
                        onChange={(e) => setRecVarianceReason(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="">None / Within normal tolerance</option>
                        <option value="trimming_moisture">Trimming / Moisture evaporation during cooking</option>
                        <option value="equipment_issue">Equipment issue / Machine delay</option>
                        <option value="ingredient_quality">Ingredient quality / Wilting loss</option>
                        <option value="prep_loss">Preparation / Pot scraping loss</option>
                        <option value="not_sure">Not sure / Unrecorded difference</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-600 mb-1">
                        Kitchen Staff Notes
                      </label>
                      <input
                        type="text"
                        value={recVarianceNotes}
                        onChange={(e) => setRecVarianceNotes(e.target.value)}
                        placeholder="e.g. Extended simmer for thicker gravy reduction"
                        className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRecordingBatch(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  Save Batch Result &amp; View Comparison
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Batch Yield & Output Comparison Modal (Khushbu 2-Page Sketch) */}
      {inspectingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Batch #{inspectingBatch.batchNumber} Output &amp; Yield Comparison
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        inspectingBatch.status === "needs_review"
                          ? "bg-rose-50 text-rose-800 border-rose-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {inspectingBatch.status === "needs_review" ? "Needs Review" : "Completed"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {inspectingBatch.dishName} · {inspectingBatch.mealSlot} · {inspectingBatch.recordedAt || "Today"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingBatch(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Canonical Diagnostic Alert Banner */}
              {(() => {
                const yieldMetrics = calculateBatchYieldMetrics(inspectingBatch);
                return yieldMetrics.needsReview ? (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm">
                        Output is {Math.abs(yieldMetrics.outputDiff || 0)} {inspectingBatch.outputUnit} below expected · Review this batch
                      </div>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        Yield achieved is {yieldMetrics.yieldPercent}% of recipe baseline. Output shortfall is not automatically food waste; differences can reflect natural moisture evaporation, trimming loss, or scale variance.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-900">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold text-sm">
                        Recipe Baseline Yield Confirmed ({yieldMetrics.yieldPercent}% Yield)
                      </div>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Kitchen finished output matches recipe conversion parameters. Full nutritional portion volume retained.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Side-by-Side Khushbu Expected vs Actual Comparison Ledger */}
              <div className="border border-stone-200 rounded-xl overflow-hidden bg-stone-50/40">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-100/80 text-[11px] uppercase tracking-wider text-stone-500 font-sans">
                      <th className="py-2.5 px-4 font-semibold">Workflow Metric</th>
                      <th className="py-2.5 px-4 font-semibold">Expected Baseline</th>
                      <th className="py-2.5 px-4 font-semibold">Kitchen Actual</th>
                      <th className="py-2.5 px-4 font-semibold">Variance</th>
                      <th className="py-2.5 px-4 font-semibold">Status / Telemetry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200/70 font-mono">
                    {/* Row 1: Raw Material Input */}
                    <tr className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900">
                        Raw Material Input
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {inspectingBatch.totalRawInputExpected} {inspectingBatch.inputUnit}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {inspectingBatch.totalRawInputActual ?? inspectingBatch.totalRawInputExpected} {inspectingBatch.inputUnit}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        0 {inspectingBatch.inputUnit} (100%)
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-stone-500">
                        Earliest-expiring stock allocated
                      </td>
                    </tr>

                    {/* Row 2: Finished Cooked Output */}
                    <tr className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900">
                        Finished Cooked Output
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {inspectingBatch.expectedOutput} {inspectingBatch.outputUnit}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {inspectingBatch.actualOutput ?? "—"} {inspectingBatch.outputUnit}
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const m = calculateBatchYieldMetrics(inspectingBatch);
                          return (
                            <span className={m.isShortfall ? "text-rose-700 font-bold" : "text-emerald-700 font-bold"}>
                              {m.outputDiff != null ? `${m.outputDiff > 0 ? "+" : ""}${m.outputDiff} ${inspectingBatch.outputUnit} (${m.yieldPercent}%)` : "—"}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px]">
                        {(() => {
                          const m = calculateBatchYieldMetrics(inspectingBatch);
                          return m.isShortfall ? (
                            <span className="text-rose-700 font-medium">Below expected output</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Normal yield achieved</span>
                          );
                        })()}
                      </td>
                    </tr>

                    {/* Row 3: Processing Time */}
                    <tr className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900">
                        Processing Time
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        {formatDurationHoursMinutes(inspectingBatch.expectedDurationMinutes)}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {formatDurationHoursMinutes(inspectingBatch.actualDurationMinutes)}
                      </td>
                      <td className="py-3 px-4">
                        {inspectingBatch.actualDurationMinutes != null ? (
                          <span className={inspectingBatch.actualDurationMinutes > inspectingBatch.expectedDurationMinutes ? "text-amber-700 font-bold" : "text-emerald-700 font-bold"}>
                            {inspectingBatch.actualDurationMinutes - inspectingBatch.expectedDurationMinutes > 0 ? "+" : ""}
                            {inspectingBatch.actualDurationMinutes - inspectingBatch.expectedDurationMinutes} min
                          </span>
                        ) : "—"}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-stone-500">
                        Start-to-finish elapsed time
                      </td>
                    </tr>

                    {/* Row 4: Paused Downtime */}
                    <tr className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900">
                        Paused Downtime
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        0 min
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {inspectingBatch.downtimeMinutes != null ? `${inspectingBatch.downtimeMinutes} min` : "Not recorded"}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {inspectingBatch.downtimeMinutes ? `+${inspectingBatch.downtimeMinutes} min` : "0 min"}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-stone-500">
                        {inspectingBatch.downtimeMinutes ? "Line pause / equipment wait" : "Continuous prep"}
                      </td>
                    </tr>

                    {/* Row 5: Energy Usage */}
                    <tr className="hover:bg-white transition-colors">
                      <td className="py-3 px-4 font-sans font-semibold text-stone-900">
                        Energy Usage
                      </td>
                      <td className="py-3 px-4 text-stone-700">
                        ~3.5 kWh est.
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900">
                        {inspectingBatch.energyKwh != null ? `${inspectingBatch.energyKwh} kWh` : "Not recorded"}
                      </td>
                      <td className="py-3 px-4 text-stone-600">
                        {inspectingBatch.energyKwh != null ? `+${(inspectingBatch.energyKwh - 3.5).toFixed(1)} kWh` : "—"}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px]">
                        <span className="inline-flex items-center gap-1 text-purple-700 font-medium">
                          <Radio className="w-3 h-3 text-purple-500 animate-pulse" />
                          <span>Telemetry ready (IoT)</span>
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Variance Analysis & Diagnostic Recommendations */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Variance Analysis &amp; Kitchen Notes:</span>
                  </span>
                  {inspectingBatch.varianceReason && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-200 text-stone-800">
                      Reason: {inspectingBatch.varianceReason.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
                {inspectingBatch.varianceNotes && (
                  <p className="text-stone-700 leading-relaxed font-sans">
                    <strong>Staff Observation:</strong> {inspectingBatch.varianceNotes}
                  </p>
                )}
                <p className="text-stone-600 text-[11px] leading-relaxed">
                  <strong>AI Chef Recommendation:</strong> Shortfall of 15 kg in fresh tomato gravy preparations is common when high water-content tomatoes undergo extended simmering. For subsequent batches, either calibrate simmering reduction time to 120 minutes or incorporate an extra 10–12 litres water buffer to achieve standard institutional gravy volume.
                </p>
              </div>

              {/* IoT Connection Notice */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 flex items-center gap-2.5 text-purple-900 text-xs">
                <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-[11px]">
                  <strong>Future IoT Integration:</strong> Telemetric smart scales, temperature probes, and power meters can automatically record actual finished food weights and burner gas/power consumption directly into this ledger.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-stone-200 flex items-center justify-between bg-stone-50">
              <span className="text-[11px] text-stone-500 font-mono">
                Batch ID: {inspectingBatch.id}
              </span>
              <div className="flex items-center gap-2">
                {inspectingBatch.status === "needs_review" && (
                  <button
                    type="button"
                    onClick={() => handleApproveBatchReview(inspectingBatch.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    Mark as Reviewed &amp; Approved
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingBatch(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Start Planned Cooking Batch Confirmation */}
      {startingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Confirm &amp; Start Cooking Batch
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Batch #{startingBatch.batchNumber} · {startingBatch.dishName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStartingBatch(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-bold block">
                  Raw Ingredients to Pull from Pantry (FEFO Sequence):
                </span>
                <div className="space-y-1.5">
                  {startingBatch.ingredients.map((ing, iIdx) => (
                    <div
                      key={iIdx}
                      className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-semibold text-stone-900">{ing.name}</span>
                      </div>
                      <span className="font-mono font-bold text-stone-800">
                        {ing.expectedQuantity} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                <div>
                  <span className="text-[10px] text-amber-800 block">Expected Finished Food:</span>
                  <span className="font-mono font-bold text-amber-950 text-sm">
                    {startingBatch.expectedOutput} {startingBatch.outputUnit}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-800 block">Expected Duration:</span>
                  <span className="font-mono font-bold text-amber-950 text-sm">
                    {formatDurationHoursMinutes(startingBatch.expectedDurationMinutes)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setStartingBatch(null)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStartBatch}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs"
                >
                  Confirm &amp; Start Cooking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Add Raw Material Intake Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-700" />
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Log Raw Material Inward Intake
                </h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRawMaterial} className="p-5 space-y-4">
              {addError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {addSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Raw material logged successfully into kitchen database!</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Raw Material Name (Ingredient)
                </label>
                <input
                  type="text"
                  required
                  value={rawName}
                  onChange={(e) => setRawName(e.target.value)}
                  placeholder="e.g. Tomatoes, Potatoes, Cow Milk, Atta, Toor Dal"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ingredient Category
                  </label>
                  <select
                    value={rawCategory}
                    onChange={(e) => setRawCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="raw_produce">Fresh Produce (Vegetables/Fruits)</option>
                    <option value="dairy">Dairy Raw Material (Milk, Curd, Paneer)</option>
                    <option value="packaged_dry">Grains, Pulses &amp; Flours</option>
                    <option value="bakery">Baking Ingredients</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Storage Environment
                  </label>
                  <select
                    value={rawStorage}
                    onChange={(e) => setRawStorage(e.target.value as StorageEnvironment)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="ambient">Ambient Room Temp</option>
                    <option value="cold_storage">Cold Storage (≤4°C)</option>
                    <option value="dry_pantry">Dry Pantry / Warehouse</option>
                    <option value="frozen">Freezer (≤-18°C)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={rawQuantity}
                    onChange={(e) => setRawQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={rawUnit}
                    onChange={(e) => setRawUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="litres">L</option>
                    <option value="pieces">pcs</option>
                    <option value="boxes">boxes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Shelf Life (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rawExpiryDays}
                    onChange={(e) => setRawExpiryDays(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? "Logging..." : "Save Raw Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
