"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImpactCounter } from "@/components/public/impact-counter";
import {
  CrateIcon,
  TicketIcon,
  ShieldCheckIcon,
} from "@/components/icons/ledger-icons";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import {
  Scale,
  Utensils,
  Leaf,
  Sparkles,
  TrendingUp,
  BarChart3,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Package,
  HeartHandshake,
  Layers,
  Activity,
  Filter,
} from "lucide-react";

interface MetricsData {
  institution: {
    id: string;
    name: string;
    type: string;
    plan: string;
  };
  metrics: {
    wastePreventedKg: number;
    wastePreventedByUnit?: {
      kg: number;
      pieces: number;
      litres: number;
    };
    mealsGiven: number;
    co2eAvoidedKg: number;
    costSavedInr: number;
    methaneAvoidedKg?: number;
    waterPreservedLiters?: number;
    totalListedKg: number;
    inStockCount: number;
    activeListingsCount: number;
    nearingExpiryCount: number;
    hasData: boolean;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    status: string;
    ruleApplied: string;
    reason?: string;
    timestamp: string;
  }>;
}

export default function InstitutionOverviewPage() {
  const [data, setData] = React.useState<MetricsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchMetrics = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/institution/metrics");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load institution metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
          Loading institutional ledger &amp; operational metrics...
        </p>
      </div>
    );
  }

  const institution = data?.institution;
  const m = data?.metrics || {
    wastePreventedKg: 0,
    wastePreventedByUnit: {
      kg: 0,
      pieces: 0,
      litres: 0,
    },
    mealsGiven: 0,
    co2eAvoidedKg: 0,
    costSavedInr: 0,
    methaneAvoidedKg: 0,
    waterPreservedLiters: 0,
    totalListedKg: 0,
    inStockCount: 0,
    activeListingsCount: 0,
    nearingExpiryCount: 0,
    hasData: false,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left pb-16 px-2 sm:px-4">
      {/* 1. Header Bar with Institution Title and Fast CTAs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {institution?.type ? institution.type.replace("_", " ") : "Institutional"} Kitchen
            </span>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full border border-stone-200 bg-stone-100 text-stone-600 font-medium whitespace-nowrap">
              100% Free Platform
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1.5">
            {institution?.name || "Kitchen Operations Ledger"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Real-time kitchen ledger, active surplus redistribution batches, and automated redistribution tracking.
          </p>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-blue-600 shrink-0" />
            <span>+ Add inventory</span>
          </Link>
          <Link
            href="/app/institution/surplus-listings"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Sparkles size={14} className="text-emerald-100 shrink-0" />
            <span>⚡ 1-Step Food Listing</span>
          </Link>
          <Link
            href="/app/institution/forecast"
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.98] text-emerald-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>MealBalance &amp; Forecast</span>
          </Link>
          <Link
            href="/app/institution/analytics"
            className="group inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200/90 bg-stone-50 hover:bg-stone-100 active:scale-[0.98] text-stone-700 text-xs font-semibold shadow-2xs transition-all whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4 text-stone-500 shrink-0" />
            <span>Consumption Analytics</span>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
          </Link>
        </div>
      </div>

      {/* 2. Onboarding & Calibration Checklist */}
      <OnboardingChecklist
        storageKey="institution_overview"
        title="Kitchen Setup & Compliance Checklist"
        subtitle="Complete these initial milestones to calibrate automated surplus detection and AI forecasting."
        items={[
          {
            id: "inventory",
            title: "Log your first daily inventory item",
            description: "Record prepared meals or ingredients with prep date and shelf-life",
            href: "/app/institution/inventory",
            isCompleted: m.inStockCount > 0,
          },
          {
            id: "surplus",
            title: "Flag and publish a surplus batch",
            description: "Pass automated safety gating rules and match with verified local NGOs",
            href: "/app/institution/surplus-listings",
            isCompleted: m.totalListedKg > 0,
          },
          {
            id: "forecast",
            title: "Inspect AI demand & production forecast",
            description: "Review rolling baseline predictions and cold-start confidence bands",
            href: "/app/institution/forecast",
            isCompleted: m.inStockCount > 0,
          },
          {
            id: "resource-utilization",
            title: "Optimize raw materials & FEFO kitchen prep",
            description: "Prioritize nearing-expiry ingredients and prevent overstocking",
            href: "/app/institution/resource-utilization",
            isCompleted: m.inStockCount > 0,
          },
        ]}
      />

      {/* 3. Cumulative Redistribution Total (4 Vibrant Theme Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Cumulative Redistribution &amp; ESG Impact
            </h2>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Verified recipient deliveries only
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Emerald Theme - Waste Prevented */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                Waste Prevented
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Scale className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
              <ImpactCounter value={m.wastePreventedByUnit?.kg ?? m.wastePreventedKg} />
              <span className="text-xs font-sans font-medium text-emerald-700">kg total</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                {m.wastePreventedByUnit?.pieces ?? 0} pcs (~{Math.round((m.wastePreventedByUnit?.pieces ?? 0) / 2)} plates)
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                {m.wastePreventedByUnit?.litres ?? 0} L
              </span>
              <span className="text-[11px] text-stone-500">diverted</span>
            </div>
          </div>

          {/* Card 2: Sky/Blue Theme - Meals Given */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                Meals Given
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                <Utensils className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-blue-700 flex items-baseline gap-1.5">
              <ImpactCounter value={m.mealsGiven} />
              <span className="text-xs font-sans font-medium text-blue-800">meals</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
                <HeartHandshake className="w-3 h-3 text-blue-600" />
                Verified NGOs
              </span>
              <span className="text-[11px] text-stone-500">delivered</span>
            </div>
          </div>

          {/* Card 3: Amber/Gold Theme - Scope 3 CO2e Avoided */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                CO2e Avoided
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
              <ImpactCounter value={m.co2eAvoidedKg} suffix=" kg" decimals={1} />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                Scope 3
              </span>
              <span className="text-[11px] text-stone-500">
                ~{(m.methaneAvoidedKg ?? m.co2eAvoidedKg * 0.25).toFixed(1)} kg methane saved
              </span>
            </div>
          </div>

          {/* Card 4: Violet/Purple Theme - Cost Saved */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                Procurement Cost Saved
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
              ₹<ImpactCounter value={m.costSavedInr} />
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                Avoided Waste
              </span>
              <span className="text-[11px] text-stone-500">
                ~{(m.waterPreservedLiters ?? m.wastePreventedKg * 180).toLocaleString()} L water saved
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Kitchen Operational Status Modules (3 Clean Live Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Kitchen Operational Command
            </h2>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Real-time batch tracking
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card A: In-Stock Inventory */}
          <Link
            href="/app/institution/inventory"
            className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-mono uppercase tracking-wider font-bold text-blue-700">
                  In-Stock Batches
                </span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-stone-900">
                {m.inStockCount}
              </div>
              <span className="text-xs text-stone-500 block mt-1">
                Active batches currently logged in kitchen
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-blue-700 group-hover:text-blue-800">
              <span>Manage Inventory</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card B: Active Surplus Listings */}
          <Link
            href="/app/institution/surplus-listings"
            className="group p-5 rounded-2xl bg-white border border-stone-200 hover:border-amber-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-mono uppercase tracking-wider font-bold text-amber-700">
                  Active Listings
                </span>
                <div className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors">
                  <TicketIcon size={16} />
                </div>
              </div>
              <div className="font-mono text-3xl sm:text-4xl font-black text-amber-600">
                {m.activeListingsCount}
              </div>
              <span className="text-xs text-stone-500 block mt-1">
                Pending pickup or verified NGO match ({m.totalListedKg} kg listed)
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-semibold text-amber-700 group-hover:text-amber-800">
              <span>View Listings</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card C: Expiry & Shelf-Life Watch */}
          <div
            className={`p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between ${
              m.nearingExpiryCount > 0
                ? "bg-gradient-to-br from-rose-500/10 via-white to-rose-500/5 border-rose-300"
                : "bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-200"
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span
                  className={`font-mono uppercase tracking-wider font-bold ${
                    m.nearingExpiryCount > 0 ? "text-rose-800" : "text-emerald-800"
                  }`}
                >
                  Shelf-Life Watch
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    m.nearingExpiryCount > 0 ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                  }`}
                />
              </div>
              <div
                className={`font-mono text-3xl sm:text-4xl font-black ${
                  m.nearingExpiryCount > 0 ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {m.nearingExpiryCount}
              </div>
              <span className="text-xs text-stone-600 block mt-1">
                {m.nearingExpiryCount > 0
                  ? "Items approaching safe threshold (< 4h rule)"
                  : "All logged items well within safe consumption window"}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              {m.nearingExpiryCount > 0 ? (
                <Link
                  href="/app/institution/surplus-listings"
                  className="font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1"
                >
                  <span>Auto-list for donation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Batches Fresh</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Quick Workflow Launch Matrix (4 Clean Navigation Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <h2 className="font-serif font-bold text-lg text-stone-900">
              Kitchen Workflow Accelerators
            </h2>
          </div>
          <span className="text-[11px] font-mono text-stone-500">
            Direct navigation
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/app/institution/forecast"
            className="group p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs hover:shadow-xs transition-all space-y-2"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-blue-700 transition-colors">
              AI Demand Forecast
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Predict upcoming meal requirements and avoid over-preparation with rolling AI baselines.
            </p>
          </Link>

          <Link
            href="/app/institution/analytics"
            className="group p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs hover:shadow-xs transition-all space-y-2"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-emerald-700 transition-colors">
              Consumption Analytics
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Analyze historical consumption patterns, category trends, and verified food audit logs.
            </p>
          </Link>

          <Link
            href="/app/institution/deliveries"
            className="group p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs hover:shadow-xs transition-all space-y-2"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-amber-700 transition-colors">
              Delivery Logistics
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Track volunteer pickups, live dispatch routes, and confirmed recipient drop-offs.
            </p>
          </Link>

          <Link
            href="/app/institution/resource-utilization"
            className="group p-4 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 shadow-2xs hover:shadow-xs transition-all space-y-2"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-stone-900 group-hover:text-purple-700 transition-colors">
              Resource Utilization
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Prioritize raw ingredients by expiry (FEFO) and prevent surplus before cooking.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
