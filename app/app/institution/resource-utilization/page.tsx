"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Package,
  Layers,
  Calendar,
  Utensils,
  ArrowRight,
  RefreshCw,
  Info,
  Clock,
  Scale,
  Cpu,
  CheckCircle2,
  Sliders,
  ShoppingCart,
} from "lucide-react";
import FefoResourceIntelligence from "@/components/forecast/fefo-resource-intelligence";
import {
  FefoIntelligenceReport,
  getDefaultFefoBaselineItems,
  evaluateFefoInventory,
} from "@/lib/fefo-engine";

export default function InstitutionResourceUtilizationPage() {
  const [institution, setInstitution] = useState<any>(null);
  const [fefoReport, setFefoReport] = useState<FefoIntelligenceReport | null>(null);
  const [tomorrowDemandKg, setTomorrowDemandKg] = useState<number>(28);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResourceData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 1. Fetch institution profile
      const instRes = await fetch("/api/v1/institution/profile");
      if (!instRes.ok) {
        throw new Error("Could not load institution profile. Complete onboarding first.");
      }
      const instData = await instRes.json();
      const currentInst = instData.institution;
      setInstitution(currentInst);

      if (!currentInst?._id) {
        throw new Error("Institution record missing.");
      }

      // 2. Fetch dedicated raw materials resource utilization & NVIDIA AI intelligence
      const res = await fetch("/api/v1/resource-utilization");
      if (res.ok) {
        const json = await res.json();
        if (json.report) {
          setFefoReport(json.report);
        } else {
          setFefoReport(evaluateFefoInventory(getDefaultFefoBaselineItems()));
        }
      } else {
        // Fallback to calibrated raw materials baseline
        setFefoReport(evaluateFefoInventory(getDefaultFefoBaselineItems()));
      }

      // 3. Also fetch forecast demand for daily meal reference
      const fRes = await fetch(`/api/v1/forecast/${currentInst._id}`);
      if (fRes.ok) {
        const fJson = await fRes.json();
        if (fJson.forecast?.predictions?.[0]?.predicted_demand) {
          setTomorrowDemandKg(fJson.forecast.predictions[0].predicted_demand);
        }
      }
    } catch (err: any) {
      console.error("Failed to load resource utilization data:", err);
      setError(err.message || "Failed to load resource data.");
      // Resilient fallback
      setFefoReport(evaluateFefoInventory(getDefaultFefoBaselineItems()));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResourceData();
  }, [loadResourceData]);

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Raw Materials &amp; Resource Utilization
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              Smart FEFO Engine Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-2xl leading-relaxed">
            {institution?.name || "Your Kitchen"} · Real-time inventory tracking for <strong>raw ingredients</strong> (vegetables, dairy, staples). Prioritizes items to cook urgently and blocks surplus reordering to eliminate waste before cooking begins.
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadResourceData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Refresh raw materials analysis"
          >
            <RefreshCw className={`w-4 h-4 text-stone-500 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <Link
            href="/app/institution/forecast"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-all shadow-xs hover:shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>7-Day Demand</span>
          </Link>
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Package className="w-4 h-4 text-stone-300" />
            <span>Cooked Surplus Ledger</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Smart FEFO Engine analyzing raw materials database and calculating procurement advisory...
          </p>
        </div>
      ) : (
        /* 3. FEFO Central Intelligence Hub */
        <FefoResourceIntelligence
          initialReport={fefoReport || evaluateFefoInventory(getDefaultFefoBaselineItems())}
          tomorrowDemandKg={tomorrowDemandKg}
          onRefresh={loadResourceData}
        />
      )}
    </div>
  );
}
