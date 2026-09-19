"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CrateIcon,
  ShieldCheckIcon,
  TicketIcon,
} from "@/components/icons/ledger-icons";

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
  if (val.pieces > 0) parts.push(`${val.pieces} pieces`);
  if (val.litres > 0) parts.push(`${val.litres} litres`);
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
      <div className="max-w-6xl mx-auto p-12 text-center text-xs font-mono-numeral text-ink-soft">
        Computing redistribution impact ledger from confirmed receipts...
      </div>
    );
  }

  const hasData = impact?.hasData;

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
            Audited Redistribution Impact
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            {ngoName} — Impact Ledger
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge variant="verified_safe" label="Verified Handoffs Only" />
        </div>
      </div>

      {/* Horizontal Ledger Strip (Design PRD Section 5.2 & 12.2) */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line text-ink">
        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Food Redistributed
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="font-mono-numeral text-xl sm:text-2xl font-normal text-basil whitespace-nowrap">
              {impact?.redistributedByUnit?.kg ?? impact?.totalRedistributedKg ?? 0}
              <span className="text-xs text-ink-soft font-normal ml-1">kg</span>
            </span>
            <span className="text-ink-soft/40 text-xs select-none">•</span>
            <span className="font-mono-numeral text-xl sm:text-2xl font-normal text-basil whitespace-nowrap">
              {impact?.redistributedByUnit?.pieces ?? 0}
              <span className="text-xs text-ink-soft font-normal ml-1">pieces</span>
            </span>
            <span className="text-ink-soft/40 text-xs select-none">•</span>
            <span className="font-mono-numeral text-xl sm:text-2xl font-normal text-basil whitespace-nowrap">
              {impact?.redistributedByUnit?.litres ?? 0}
              <span className="text-xs text-ink-soft font-normal ml-1">litres</span>
            </span>
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">confirmed receipts</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Meals Distributed
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-normal text-ink mt-1">
            {impact?.mealsProvided || 0}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">estimated nutritious meals</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            CO2e Emissions Diverted
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-normal text-saffron mt-1">
            {impact?.co2eAvoidedKg || 0}{" "}
            <span className="text-xs text-ink-soft font-normal">kg CO2e</span>
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">landfill emissions prevented</div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="text-xs uppercase tracking-wider text-ink-soft font-mono-numeral">
            Completed Batches
          </div>
          <div className="font-mono-numeral text-2xl sm:text-3xl font-normal text-ink mt-1">
            {impact?.confirmedClaimsCount || 0}
          </div>
          <div className="text-[11px] text-ink-soft mt-0.5">
            {impact?.inProgressCount || 0} in progress
          </div>
        </div>
      </div>

      {/* Honest Empty State if no confirmed claims yet */}
      {!hasData ? (
        <div className="border border-line bg-[#FAF6EE] p-12 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <CrateIcon size={24} />
          </div>
          <h2 className="font-display text-lg font-normal text-ink">
            No redistribution impact recorded yet
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
            Impact numbers are computed strictly from confirmed surplus handoffs. When your organization
            receives a batch and clicks <strong>Confirm receipt</strong> in My Claims, the verified weight is
            automatically converted into meals provided and avoided emissions.
          </p>
          <div className="pt-2">
            <Button asChild variant="default" size="sm">
              <Link href="/app/ngo/browse">Browse surplus food</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Category Breakdown Ledger */}
          <div className="space-y-3">
            <div className="border-b border-line pb-2">
              <h2 className="font-display text-xl font-normal text-ink">
                Redistribution by Food Category
              </h2>
              <p className="text-xs text-ink-soft">
                Audited breakdown of all surplus items accepted and distributed across your network.
              </p>
            </div>

            <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAE3D4] border-b border-line uppercase tracking-wider font-mono-numeral text-ink">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Total Quantity</th>
                    <th className="px-4 py-3 font-semibold">Estimated Meals</th>
                    <th className="px-4 py-3 font-semibold">Share of Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {(() => {
                    const totalAllItems: number = Object.values(categoryBreakdown).reduce<number>(
                      (acc: number, curr) => acc + getCategoryTotalCount(curr),
                      0
                    ) || 1;

                    return Object.entries(categoryBreakdown).map(([cat, metric]) => {
                      const count = getCategoryTotalCount(metric);
                      const percent = Math.round((count / totalAllItems) * 100);
                      const meals = getCategoryMeals(metric);

                      return (
                        <tr key={cat} className="hover:bg-[#F3EDE0]/80">
                          <td className="px-4 py-3 font-medium text-ink capitalize">
                            {cat.replace("_", " ")}
                          </td>
                          <td className="px-4 py-3 font-mono-numeral text-ink">
                            {formatCategoryQuantity(metric)}
                          </td>
                          <td className="px-4 py-3 font-mono-numeral text-ink">
                            ~{meals} meals
                          </td>
                          <td className="px-4 py-3 font-mono-numeral text-ink-soft">
                            {percent}%
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Handoffs Table */}
          <div className="space-y-3">
            <div className="border-b border-line pb-2">
              <h2 className="font-display text-xl font-normal text-ink">
                Verified Distribution History
              </h2>
              <p className="text-xs text-ink-soft">
                Most recent confirmed handoffs credited to your organization's impact ledger.
              </p>
            </div>

            <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#EAE3D4] border-b border-line uppercase tracking-wider font-mono-numeral text-ink">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item & Category</th>
                    <th className="px-4 py-3 font-semibold">Donor Kitchen</th>
                    <th className="px-4 py-3 font-semibold">Quantity</th>
                    <th className="px-4 py-3 font-semibold">Confirmed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentHandoffs.map((handoff) => (
                    <tr key={handoff._id} className="hover:bg-[#F3EDE0]/80">
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{handoff.itemName}</div>
                        <div className="text-[10px] text-ink-soft capitalize">
                          {handoff.category.replace("_", " ")}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-ink">
                        {handoff.institutionName}
                      </td>
                      <td className="px-4 py-3 font-mono-numeral text-basil font-medium">
                        {handoff.quantity} {handoff.unit}
                      </td>
                      <td className="px-4 py-3 font-mono-numeral text-ink-soft">
                        {new Date(handoff.deliveredAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Methodology and Standards Note */}
      <div className="border border-line bg-ledger-paper p-5 rounded-[6px] space-y-2 text-xs text-ink-soft">
        <div className="flex items-center gap-2 font-semibold text-ink font-mono-numeral uppercase tracking-wider">
          <ShieldCheckIcon size={16} />
          <span>Audited Conversion Methodology</span>
        </div>
        <p className="leading-relaxed">
          ZeroPlate computes redistribution figures using verified standard conversion factors. 1 kg of edible
          food diverted equates to 2.5 average nutritional portions (400g reference). Greenhouse gas savings are
          derived using the standard FAO landfill-avoidance coefficient of 1.9 kg CO2e per kg of organic matter.
          All claimed records remain immutable in the MongoDB audit trail for third-party compliance verification.
        </p>
      </div>
    </div>
  );
}
