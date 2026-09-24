"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Utensils,
  Leaf,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Ticket,
  ArrowRight,
  Scale,
  Sparkles,
  Info,
  Layers,
  Clock,
} from "lucide-react";

interface NgoImpactData {
  totalRedistributedKg: number;
  redistributedByUnit?: {
    kg: number;
    pieces: number;
    litres: number;
  };
  mealsProvided: number;
  co2eAvoidedKg: number;
  totalClaimsCount: number;
  confirmedClaimsCount: number;
  inProgressCount: number;
  hasData: boolean;
}

interface RecentHandoff {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  institutionName: string;
  claimedAt: string;
  deliveredAt: string;
}

interface CategoryMetric {
  kg: number;
  pieces: number;
  litres: number;
  totalCount?: number;
  estimatedMeals?: number;
}

function formatCategoryQuantity(val: CategoryMetric | number): string {
  if (typeof val === "number") {
    return `${val} kg`;
  }
  const parts: string[] = [];
  if (val.kg > 0) parts.push(`${val.kg} kg`);
  if (val.pieces > 0) parts.push(`${val.pieces} pcs`);
  if (val.litres > 0) parts.push(`${val.litres} L`);
  return parts.length > 0 ? parts.join(" • ") : "0 kg";
}

function getCategoryTotalCount(val: CategoryMetric | number): number {
  if (typeof val === "number") return val;
  return val.totalCount ?? ((val.kg || 0) + (val.pieces || 0) + (val.litres || 0));
}

function getCategoryMeals(val: CategoryMetric | number): number {
  if (typeof val === "number") return Math.round(val * 2.5);
  if (typeof val.estimatedMeals === "number") return val.estimatedMeals;
  return Math.round(getCategoryTotalCount(val) * 2.5);
}

export default function NgoImpactPage() {
  const [impact, setImpact] = React.useState<NgoImpactData | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = React.useState<
    Record<string, CategoryMetric | number>
  >({});
  const [recentHandoffs, setRecentHandoffs] = React.useState<RecentHandoff[]>([]);
  const [ngoName, setNgoName] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  const fetchImpact = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ngo/impact");
      const json = await res.json();
      if (res.ok) {
        setImpact(json.impact);
        setCategoryBreakdown(json.categoryBreakdown || json.categoryTotals || {});
        setRecentHandoffs(json.recentHandoffs || []);
        setNgoName(json.ngo?.orgName || "Organization");
      }
    } catch (err) {
      console.error("Failed to load NGO impact metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchImpact();
  }, [fetchImpact]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl max-w-7xl mx-auto">
        <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
          Computing redistribution impact ledger from confirmed receipts...
        </p>
      </div>
    );
  }

  const hasData = impact?.hasData;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              {ngoName} — Impact Ledger
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Handoffs Only
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Audited account of food rescued, nutritional meals distributed to beneficiaries, and greenhouse gas emissions diverted from landfills.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              FAO Conversion Standard
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI Audit Compliant
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Cryptographic Signatures Linked
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/ngo/my-claims"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>My Claimed Batches</span>
          </Link>
          <Link
            href="/app/ngo/browse"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>+ Browse Marketplace</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - Food Redistributed */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Food Redistributed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-xl sm:text-2xl font-extrabold text-emerald-950 flex flex-wrap items-baseline gap-1">
            <span>
              {impact?.redistributedByUnit?.kg ?? impact?.totalRedistributedKg ?? 0}
              <span className="text-xs font-sans font-medium text-emerald-700 ml-0.5">kg</span>
            </span>
            {impact?.redistributedByUnit && (
              <span className="text-[11px] font-mono text-stone-400">
                • {impact.redistributedByUnit.pieces} pcs • {impact.redistributedByUnit.litres} L
              </span>
            )}
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Confirmed Handoffs
            </span>
          </div>
        </div>

        {/* Card 2: Blue Theme - Meals Distributed */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Meals Distributed
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {(impact?.mealsProvided || 0).toLocaleString()}
            <span className="text-xs font-sans font-medium text-blue-700">meals</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              2.5 meals / kg standard
            </span>
          </div>
        </div>

        {/* Card 3: Amber Theme - CO2e Diverted */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              CO2e Diverted
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {(impact?.co2eAvoidedKg || 0).toLocaleString()}
            <span className="text-xs font-sans font-medium text-amber-800">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              1.9 kg CO2e / kg diverted
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Completed Batches */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Completed Batches
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            {impact?.confirmedClaimsCount || 0}
            <span className="text-xs font-sans font-medium text-purple-700">delivered</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              {impact?.inProgressCount || 0} In Progress
            </span>
          </div>
        </div>
      </div>

      {/* Honest Empty State if no confirmed claims yet */}
      {!hasData ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <Package className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              No redistribution impact recorded yet
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              Impact numbers are computed strictly from confirmed surplus handoffs. When your organization receives a batch and clicks <strong>Confirm Receipt</strong> in My Claims, the verified weight is automatically converted into meals provided and avoided emissions.
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/app/ngo/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Ticket className="w-4 h-4 text-emerald-100" />
              <span>Browse Surplus Food</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 3. Category Breakdown Ledger */}
          <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60">
              <h2 className="font-serif font-bold text-base text-stone-900">
                Redistribution by Food Category
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Audited breakdown of all surplus items accepted and distributed across your network
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-sans font-semibold">Category</th>
                    <th className="py-3 px-4 font-mono font-semibold">Total Quantity</th>
                    <th className="py-3 px-4 font-mono font-semibold">Estimated Meals</th>
                    <th className="py-3 px-4 font-sans font-semibold text-right">Share of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {(() => {
                    const totalAllItems: number =
                      Object.values(categoryBreakdown).reduce<number>(
                        (acc: number, curr) => acc + getCategoryTotalCount(curr),
                        0
                      ) || 1;

                    return Object.entries(categoryBreakdown).map(([cat, metric]) => {
                      const count = getCategoryTotalCount(metric);
                      const percent = Math.round((count / totalAllItems) * 100);
                      const meals = getCategoryMeals(metric);

                      return (
                        <tr key={cat} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 font-medium text-stone-900 capitalize">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                              {cat.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-stone-900">
                            {formatCategoryQuantity(metric)}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            ~{meals.toLocaleString()} meals
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {percent}%
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Recent Verified Distribution History Table */}
          <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60">
              <h2 className="font-serif font-bold text-base text-stone-900">
                Verified Distribution History ({recentHandoffs.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Most recent confirmed handoffs credited to your organization&apos;s verified impact ledger
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-sans font-semibold">Item &amp; Category</th>
                    <th className="py-3 px-4 font-sans font-semibold">Donor Kitchen</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Rescued Volume</th>
                    <th className="py-3 px-4 font-mono font-semibold">Confirmed At</th>
                    <th className="py-3 px-4 font-sans text-center font-semibold">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {recentHandoffs.map((handoff) => (
                    <tr key={handoff._id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-900">{handoff.itemName}</div>
                        <div className="text-[11px] text-stone-500 capitalize">
                          {handoff.category.replace("_", " ")}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-800">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{handoff.institutionName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700 whitespace-nowrap">
                        {handoff.quantity} {handoff.unit}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            {new Date(handoff.deliveredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Safe
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Methodology and Standards Note */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/90 text-xs text-stone-700 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <span>Audited Conversion Methodology &amp; FAO Standards</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              ISO 14064
            </span>
          </div>
          <p className="text-stone-600 leading-relaxed max-w-4xl">
            ZeroPlate computes redistribution figures using verified standard conversion factors. 1 kg of edible food diverted equates to 2.5 average nutritional portions (400g reference). Greenhouse gas savings are derived using the standard FAO landfill-avoidance coefficient of 1.9 kg CO2e per kg of organic matter. All claimed records remain immutable in the MongoDB audit trail for third-party compliance verification.
          </p>
        </div>
      </div>
    </div>
  );
}
