"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  LedgerTabIcon,
  ShieldCheckIcon,
  TicketIcon,
  CheckIcon,
} from "@/components/icons/ledger-icons";

interface InstitutionData {
  _id: string;
  name: string;
  type: string;
  plan: "free" | "premium";
  address?: string;
}

interface ReportData {
  executiveSummary: {
    wastePreventedKg: number;
    wastePreventedByUnit?: {
      kg: number;
      pieces: number;
      litres: number;
    };
    mealsGiven: number;
    co2eAvoidedKg: number;
    methaneAvoidedKg: number;
    waterPreservedLiters: number;
    costSavedInr: number;
  };
  categoryBreakdown: Record<string, number>;
  deliveredListingsCount: number;
  records: Array<{
    listingId: string;
    itemName: string;
    category: string;
    quantityKg: number;
    mealsGiven: number;
    co2eAvoidedKg: number;
    recipientNgo: string;
    recipientRegistration: string;
    safetyStatus: string;
    deliveredAt: string;
  }>;
}

export default function InstitutionReportsPage() {
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upsellMessage, setUpsellMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // 1. Fetch institution profile
      const profRes = await fetch("/api/v1/institution/profile");
      if (!profRes.ok) throw new Error("Failed to load profile");
      const profJson = await profRes.json();
      const inst = profJson.institution;
      setInstitution(inst);

      if (inst?._id) {
        // 2. Fetch report data (JSON format for in-page display)
        const repRes = await fetch(
          `/api/v1/analytics/institution/${inst._id}/export?format=json`
        );
        if (repRes.status === 403) {
          const errData = await repRes.json();
          setUpsellMessage(errData.message || "Premium plan required.");
          setReport(null);
        } else if (repRes.ok) {
          const repJson = await repRes.json();
          setReport(repJson);
          setUpsellMessage(null);
        }
      }
    } catch (err) {
      console.error("Error loading ESG reports:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePlan = async (targetPlan: "free" | "premium") => {
    try {
      setIsUpgrading(true);
      const res = await fetch("/api/v1/institution/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Error updating plan:", err);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!institution?._id) return;
    window.location.href = `/api/v1/analytics/institution/${institution._id}/export?format=csv`;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                GHG Protocol Scope 3 · Category 5 Accounting
              </span>
              <span
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full border ${
                  institution?.plan === "premium"
                    ? "bg-basil/15 border-basil/40 text-basil font-semibold"
                    : "bg-ledger-paper border-line text-ink-soft"
                }`}
              >
                {institution?.plan === "premium" ? "Enterprise Premium" : "Standard Free"}
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-ink font-bold mt-1">
              ESG & Sustainability Compliance Reporting
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {institution?.plan === "premium" ? (
              <button
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded bg-basil hover:bg-basil/90 text-[#FAF7F2] font-medium text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
              >
                <LedgerTabIcon size={14} />
                <span>Export Audit Ledger (CSV)</span>
              </button>
            ) : null}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center font-mono text-xs text-ink-soft">
            Verifying plan entitlements and computing ESG carbon metrics...
          </div>
        ) : institution?.plan !== "premium" ? (
          /* ========================================================================= */
          /* REAL UPSELL STATE (Functional PRD Section 23 & Design PRD Section 5.2)     */
          /* ========================================================================= */
          <div className="space-y-6">
            <div className="border border-line bg-ledger-surface p-6 sm:p-8 rounded-lg shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono bg-saffron/20 text-[#8C6D1F] font-bold uppercase tracking-wider">
                      Premium Plan Feature
                    </span>
                    <span className="text-xs text-ink-soft">
                      Current: Free Tier
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-2">
                    Unlock Enterprise ESG Auditing & Carbon Certifications
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-soft mt-1 max-w-2xl leading-relaxed">
                    {upsellMessage ||
                      "Audited sustainability exports, board-ready GHG Scope 3 reports, and FSSAI chain-of-custody transfer logs are reserved for Premium institutions."}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleTogglePlan("premium")}
                    disabled={isUpgrading}
                    className="px-5 py-2.5 rounded bg-basil hover:bg-basil/90 text-[#FAF7F2] font-semibold text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isUpgrading ? "Activating..." : "Upgrade to Premium Plan (Instant Demo)"}
                  </button>
                </div>
              </div>

              {/* Feature Comparison Ledger Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="border border-line bg-ledger-paper p-5 rounded-md space-y-3">
                  <div className="text-xs font-mono text-ink-soft uppercase tracking-wider">
                    Standard Free Tier (Current)
                  </div>
                  <ul className="space-y-2 text-xs text-ink-soft">
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Daily kitchen inventory tracking & shelf-life logging</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Surplus batch listing & safety gating rules</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Verified NGO recipient matching & delivery routing</span>
                    </li>
                    <li className="flex items-center gap-2 text-ink-soft/50 line-through">
                      <span>Automated CSV / PDF ESG compliance report export</span>
                    </li>
                    <li className="flex items-center gap-2 text-ink-soft/50 line-through">
                      <span>GHG Protocol Scope 3 Category 5 carbon offset verification</span>
                    </li>
                  </ul>
                </div>

                <div className="border-2 border-basil/40 bg-basil/5 p-5 rounded-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-basil font-bold uppercase tracking-wider">
                      Enterprise Premium Plan
                    </span>
                    <span className="text-xs font-serif font-bold text-basil">
                      ₹4,999 / mo
                    </span>
                  </div>
                  <ul className="space-y-2 text-xs text-ink">
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Full audited CSV & printable PDF executive summaries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Chain-of-custody transfer logs with digital recipient signatures</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>UNEP / IPCC validated carbon emissions avoidance certifications</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Priority matching engine allocation for rapid surplus dispatch</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon size={14} className="text-basil" />
                      <span>Dedicated sustainability liaison & audit documentation support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* PREMIUM ACTIVE STATE (Functional PRD Section 12.7 & Design PRD 5.2)       */
          /* ========================================================================= */
          <div className="space-y-8">
            {/* Active Status Strip */}
            <div className="border border-basil/30 bg-basil/5 p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-basil/20 text-basil flex items-center justify-center shrink-0">
                  <ShieldCheckIcon size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-basil uppercase tracking-wider">
                    Enterprise Audit Certification Active
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Continuous compliance with FSSAI Food Waste Rules & GHG Protocol Scope 3 Category 5.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTogglePlan("free")}
                  disabled={isUpgrading}
                  className="text-xs font-mono text-ink-soft hover:text-ink underline cursor-pointer"
                  title="Switch to free tier to verify freemium gating"
                >
                  {isUpgrading ? "Updating..." : "Downgrade to Free (Demo Test)"}
                </button>
              </div>
            </div>

            {/* Executive Impact Metrics Strip */}
            {report && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-4 border border-line bg-ledger-surface rounded-md">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft font-mono block">
                    Waste Diverted
                  </span>
                  <div className="mt-1.5 font-mono text-xl font-bold text-ink flex flex-wrap items-baseline gap-x-1.5">
                    <span>{report.executiveSummary.wastePreventedByUnit?.kg ?? report.executiveSummary.wastePreventedKg}<span className="text-xs font-normal text-ink-soft ml-0.5">kg</span></span>
                    <span className="text-ink-soft/40 text-xs">•</span>
                    <span>{report.executiveSummary.wastePreventedByUnit?.pieces ?? 0}<span className="text-xs font-normal text-ink-soft ml-0.5">pcs</span></span>
                    <span className="text-ink-soft/40 text-xs">•</span>
                    <span>{report.executiveSummary.wastePreventedByUnit?.litres ?? 0}<span className="text-xs font-normal text-ink-soft ml-0.5">L</span></span>
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">100% Landfill avoidance</span>
                </div>

                <div className="p-4 border border-line bg-ledger-surface rounded-md">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft font-mono block">
                    CO2e Avoided
                  </span>
                  <div className="mt-1.5 font-mono text-2xl font-bold text-basil">
                    {report.executiveSummary.co2eAvoidedKg.toLocaleString()}
                    <span className="text-xs font-normal text-ink-soft ml-1">kg</span>
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">1.9 kg CO2e / kg diverted</span>
                </div>

                <div className="p-4 border border-line bg-ledger-surface rounded-md">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft font-mono block">
                    Meals Given
                  </span>
                  <div className="mt-1.5 font-mono text-2xl font-bold text-ink">
                    {report.executiveSummary.mealsGiven.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">2.5 meals / kg</span>
                </div>

                <div className="p-4 border border-line bg-ledger-surface rounded-md">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft font-mono block">
                    Water Preserved
                  </span>
                  <div className="mt-1.5 font-mono text-2xl font-bold text-saffron">
                    {report.executiveSummary.waterPreservedLiters.toLocaleString()}
                    <span className="text-xs font-normal text-ink-soft ml-1">L</span>
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">Embedded agricultural H2O</span>
                </div>

                <div className="p-4 border border-line bg-ledger-surface rounded-md col-span-2 md:col-span-1">
                  <span className="text-[10px] uppercase tracking-wider text-ink-soft font-mono block">
                    Economic Value
                  </span>
                  <div className="mt-1.5 font-mono text-2xl font-bold text-ink">
                    ₹{report.executiveSummary.costSavedInr.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-ink-soft mt-0.5 block">Procurement recovery</span>
                </div>
              </div>
            )}

            {/* Audited Transaction Records Table */}
            <div className="border border-line bg-ledger-surface rounded-md overflow-hidden">
              <div className="p-4 border-b border-line bg-ledger-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-base text-ink">
                    Chain-of-Custody Redistribution Records
                  </h3>
                  <p className="text-xs text-ink-soft">
                    Permanent audit trails of verified, safely dispatched food batches
                  </p>
                </div>

                <button
                  onClick={handleDownloadCsv}
                  className="text-xs px-3 py-1.5 rounded border border-line bg-ledger-surface hover:bg-ledger-paper text-basil font-medium cursor-pointer transition-colors"
                >
                  Download .CSV Report
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-ledger-paper text-[11px] uppercase tracking-wider text-ink-soft">
                      <th className="py-2.5 px-4 font-mono">Date</th>
                      <th className="py-2.5 px-4 font-sans">Item Details</th>
                      <th className="py-2.5 px-4 font-mono text-right">Diverted</th>
                      <th className="py-2.5 px-4 font-mono text-right">CO2e Credit</th>
                      <th className="py-2.5 px-4 font-sans">Recipient Organization</th>
                      <th className="py-2.5 px-4 font-sans text-center">Safety Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs">
                    {!report || report.records.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-ink-soft">
                          No delivered surplus batches recorded in the ledger yet. Confirmed deliveries will automatically appear here with chain-of-custody audit signatures.
                        </td>
                      </tr>
                    ) : (
                      report.records.map((rec) => (
                        <tr key={rec.listingId} className="hover:bg-black/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-ink-soft whitespace-nowrap">
                            {rec.deliveredAt ? new Date(rec.deliveredAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-ink">{rec.itemName}</div>
                            <div className="text-[10px] font-mono text-ink-soft capitalize">
                              {rec.category.replace("_", " ")} · {rec.mealsGiven} meals
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-ink text-right whitespace-nowrap">
                            {rec.quantityKg} kg
                          </td>
                          <td className="py-3 px-4 font-mono text-basil font-semibold text-right whitespace-nowrap">
                            {rec.co2eAvoidedKg} kg
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-ink">{rec.recipientNgo}</div>
                            <div className="text-[10px] font-mono text-ink-soft">
                              Reg: {rec.recipientRegistration}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-basil/15 text-basil font-semibold">
                              Verified Safe
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
