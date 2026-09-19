"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImpactCounter } from "@/components/public/impact-counter";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  CrateIcon,
  TicketIcon,
  ShieldCheckIcon,
} from "@/components/icons/ledger-icons";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";

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
      <div className="p-8 text-left">
        <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
          Loading institutional ledger...
        </span>
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
    totalListedKg: 0,
    inStockCount: 0,
    activeListingsCount: 0,
    nearingExpiryCount: 0,
    hasData: false,
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* Header Bar with Institution Title and Fast CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-numeral text-xs uppercase tracking-wider text-ink-soft">
              {institution?.type ? institution.type.replace("_", " ") : "Institutional"} Kitchen
            </span>
            <span className="text-[10px] uppercase font-mono-numeral px-2 py-0.2 rounded-full border border-line bg-ledger-paper text-ink-soft">
              {institution?.plan === "premium" ? "Premium Tier" : "Standard Free"}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-normal text-ink mt-0.5">
            {institution?.name || "Kitchen Operations Ledger"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/institution/inventory">
              <CrateIcon size={14} />
              <span>+ Add inventory item</span>
            </Link>
          </Button>
          <Button asChild variant="default" size="sm">
            <Link href="/app/institution/surplus-listings">
              <TicketIcon size={14} />
              <span>List surplus batch</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Ledger-Line Orientation Checklist (Design PRD Section 12.3) */}
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
            id: "reports",
            title: "Review ESG compliance audit reports",
            description: "Explore Scope 3 carbon offsets and audited redistribution logs",
            href: "/app/institution/reports",
            isCompleted: institution?.plan === "premium" && m.wastePreventedKg > 0,
          },
        ]}
      />

      {/* Horizontal Receipt-Total Ledger Strip (Design PRD Section 5.2) */}
      <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden shadow-none">
        <div className="px-5 py-2.5 border-b border-line bg-[#EAE3D4]/50 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-ink font-mono-numeral text-[11px]">
            Cumulative Redistribution Total
          </span>
          <span className="font-mono-numeral text-[11px] text-ink-soft">
            Verified recipient deliveries only
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-line p-4 sm:p-5">
          <div className="px-3 py-2 sm:py-0">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
              Waste Prevented
            </span>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xl sm:text-2xl font-semibold text-ink whitespace-nowrap">
                <ImpactCounter value={m.wastePreventedByUnit?.kg ?? m.wastePreventedKg} />
                <span className="text-xs font-mono text-ink-soft ml-1">kg</span>
              </span>
              <span className="text-ink-soft/40 text-xs select-none">•</span>
              <span className="text-xl sm:text-2xl font-semibold text-ink whitespace-nowrap">
                <ImpactCounter value={m.wastePreventedByUnit?.pieces ?? 0} />
                <span className="text-xs font-mono text-ink-soft ml-1">pieces</span>
              </span>
              <span className="text-ink-soft/40 text-xs select-none">•</span>
              <span className="text-xl sm:text-2xl font-semibold text-ink whitespace-nowrap">
                <ImpactCounter value={m.wastePreventedByUnit?.litres ?? 0} />
                <span className="text-xs font-mono text-ink-soft ml-1">litres</span>
              </span>
            </div>
            <span className="text-[11px] text-ink-soft mt-0.5 block">
              Diverted from landfill
            </span>
          </div>

          <div className="px-3 py-2 sm:py-0">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
              Meals Given
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-semibold text-basil">
              <ImpactCounter value={m.mealsGiven} />
            </div>
            <span className="text-[11px] text-ink-soft mt-0.5 block">
              Delivered to verified NGOs
            </span>
          </div>

          <div className="px-3 py-2 sm:py-0">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
              CO2e Avoided
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-semibold text-ink">
              <ImpactCounter value={m.co2eAvoidedKg} suffix=" kg" decimals={1} />
            </div>
            <span className="text-[11px] text-ink-soft mt-0.5 block">
              Scope 3 avoided emissions
            </span>
          </div>

          <div className="px-3 py-2 sm:py-0">
            <span className="text-xs text-ink-soft uppercase tracking-wider font-mono-numeral block">
              Cost Saved
            </span>
            <div className="mt-1 text-2xl sm:text-3xl font-semibold text-[#B85C38]">
              ₹<ImpactCounter value={m.costSavedInr} />
            </div>
            <span className="text-[11px] text-ink-soft mt-0.5 block">
              Avoided disposal and food loss
            </span>
          </div>
        </div>
      </div>

      {/* Operational Status Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/app/institution/inventory"
          className="border border-line bg-[#FAF6EE] p-5 rounded-[6px] hover:border-basil transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-ink-soft mb-2">
            <span className="font-mono-numeral uppercase tracking-wider">In-Stock Items</span>
            <CrateIcon size={18} />
          </div>
          <div className="font-ledger-mono text-3xl font-semibold text-ink">
            {m.inStockCount}
          </div>
          <span className="text-xs text-ink-soft block mt-1">
            Active batches currently logged
          </span>
        </Link>

        <Link
          href="/app/institution/surplus-listings"
          className="border border-line bg-[#FAF6EE] p-5 rounded-[6px] hover:border-basil transition-colors block"
        >
          <div className="flex items-center justify-between text-xs text-ink-soft mb-2">
            <span className="font-mono-numeral uppercase tracking-wider">Active Listings</span>
            <TicketIcon size={18} />
          </div>
          <div className="font-ledger-mono text-3xl font-semibold text-basil">
            {m.activeListingsCount}
          </div>
          <span className="text-xs text-ink-soft block mt-1">
            Pending pickup or NGO match
          </span>
        </Link>

        <div className={`border p-5 rounded-[6px] transition-colors ${
          m.nearingExpiryCount > 0
            ? "border-clay-rust/40 bg-clay-rust/5"
            : "border-line bg-[#FAF6EE]"
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-mono-numeral uppercase tracking-wider text-ink-soft">
              Nearing Expiry
            </span>
            <span className="w-2 h-2 rounded-full bg-clay-rust" />
          </div>
          <div className={`font-ledger-mono text-3xl font-semibold ${
            m.nearingExpiryCount > 0 ? "text-clay-rust" : "text-ink"
          }`}>
            {m.nearingExpiryCount}
          </div>
          <span className="text-xs text-ink-soft block mt-1">
            {m.nearingExpiryCount > 0
              ? "Items flagged by automated rule"
              : "All logged items within safe buffer"}
          </span>
        </div>
      </div>

      {/* Empty State vs Recent Activity Audit Trail */}
      {!m.hasData ? (
        <div className="border border-line bg-[#FAF6EE] p-8 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-line bg-ledger-paper mx-auto flex items-center justify-center text-ink-soft">
            <CrateIcon size={24} />
          </div>
          <h2 className="font-display text-xl font-normal text-ink">
            No inventory logged yet
          </h2>
          <p className="text-xs text-ink-soft max-w-md mx-auto leading-relaxed">
            Begin by adding your kitchen&apos;s active batch or prep items. 
            Once logged, our rules engine monitors shelf-life and surfaces automated surplus opportunities.
          </p>
          <div className="pt-2">
            <Button asChild variant="default">
              <Link href="/app/institution/inventory">
                Add your first inventory item
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="border border-line bg-[#FAF6EE] rounded-[6px] overflow-hidden">
          <div className="px-5 py-3 border-b border-line bg-[#EAE3D4]/50 flex items-center justify-between">
            <h2 className="font-display text-base font-medium text-ink">
              Recent Safety Gate Decisions & Audit Trail
            </h2>
            <span className="font-mono-numeral text-xs text-ink-soft">
              Immutable audit log
            </span>
          </div>

          {data?.recentActivity?.length === 0 ? (
            <div className="p-6 text-center text-xs text-ink-soft">
              No surplus listings or safety gate evaluations logged yet.
            </div>
          ) : (
            <div className="divide-y divide-line text-xs">
              {data?.recentActivity.map((act) => (
                <div key={act.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={act.status === "verified_safe" ? "verified_safe" : "rejected"}
                        className="text-[10px] py-0 px-2"
                      />
                      <span className="font-medium text-ink">
                        {act.action === "safety_gate_evaluation"
                          ? "Food Safety Gating Evaluation"
                          : act.action}
                      </span>
                    </div>
                    <p className="text-ink-soft leading-relaxed">
                      {act.reason || act.ruleApplied}
                    </p>
                  </div>
                  <span className="font-mono-numeral text-ink-soft shrink-0 text-[11px]">
                    {new Date(act.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
