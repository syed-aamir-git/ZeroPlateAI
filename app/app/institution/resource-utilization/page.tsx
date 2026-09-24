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
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Raw Materials &amp; Food Resource Utilization
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-600" />
              NVIDIA NIM Central Intelligence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-2xl">
            {institution?.name || "Your Kitchen"} · Exclusively manages <strong>raw ingredients</strong> (vegetables, dairy, grains, pulses) that make ready-made food.
            Mitigates pre-consumption waste, predicts what to cook urgently, and advises how much to purchase to prevent overstocking.
          </p>
        </div>

        {/* Quick Nav Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={loadResourceData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Refresh raw materials analysis"
          >
            <RefreshCw className="w-4 h-4 text-stone-500" />
            <span>Refresh Analysis</span>
          </button>
          <Link
            href="/app/institution/forecast"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-all shadow-xs hover:shadow-sm"
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>7-Day Demand Forecast</span>
          </Link>
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Package className="w-4 h-4 text-stone-300" />
            <span>Cooked Food Ledger (Surplus)</span>
          </Link>
        </div>
      </div>

      {/* 2. Educational & Principles Banner: Raw Materials FEFO & Procurement Guard */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-purple-500/10 border border-stone-200/90 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900">
                Raw Materials Optimization &amp; Overstock Gating Protocol
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              <strong>Raw Materials Only:</strong> Ready-to-eat cooked meals belong in the surplus redistribution desk. This portal manages raw ingredients before cooking:
              identifying what to cook urgently so nearing-expiry stock never spoils, and telling your kitchen <strong>how much to buy so you never overstock supplies</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 border border-stone-200 text-stone-700 font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-stone-500" />
              <span>FEFO Protocol: High &rarr; Med &rarr; Low</span>
            </div>
          </div>
        </div>

        {/* 3-Tier Spectrum Quick Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Tier 1 */}
          <div className="p-3 rounded-xl bg-white border border-rose-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-rose-800 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                1. High Priority (&le; 48h)
              </span>
              <span className="text-[10px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-900 font-bold">COOK URGENTLY</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Nearing-expiry raw produce &amp; dairy (e.g. 5 kg ripe tomatoes &rarr; Tomato Gravy / Basil Soup).
            </p>
          </div>

          {/* Tier 2 */}
          <div className="p-3 rounded-xl bg-white border border-amber-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-amber-800 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                2. Medium Priority (3–7d)
              </span>
              <span className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-bold">STAGE NEXT</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Moderate shelf-life staples (potatoes, onions). Scheduled into mid-week batch menus.
            </p>
          </div>

          {/* Tier 3 */}
          <div className="p-3 rounded-xl bg-white border border-emerald-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                3. Low Priority (&gt; 7d)
              </span>
              <span className="text-[10px] bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900 font-bold">PRESERVE BUFFER</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-snug">
              Grains, pulses, flours, oils. Held as safe buffer. Blocked from reorder if stock exceeds 7-day need.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            NVIDIA NIM analyzing raw materials database and calculating procurement advisory...
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
