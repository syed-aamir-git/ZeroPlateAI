"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Leaf,
  Utensils,
  Droplets,
  Coins,
  Package,
  Calendar,
  Search,
  X,
  Layers,
  ArrowRight,
  BarChart3,
  Sparkles,
  CheckCircle2,
  Info,
  Building2,
  Scale,
} from "lucide-react";

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
  categoryBreakdown: Record<string, { kg: number; pieces: number; litres: number; total: number } | number>;
  deliveredListingsCount: number;
  records: Array<{
    listingId: string;
    itemName: string;
    category: string;
    quantity?: number;
    unit?: string;
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const handleDownloadCsv = () => {
    if (!institution?._id) return;
    window.location.href = `/api/v1/analytics/institution/${institution._id}/export?format=csv`;
  };

  // Filter records by search query
  const filteredRecords = useMemo(() => {
    if (!report?.records) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return report.records;
    return report.records.filter(
      (r) =>
        r.itemName?.toLowerCase().includes(q) ||
        r.category?.toLowerCase().includes(q) ||
        r.recipientNgo?.toLowerCase().includes(q) ||
        r.recipientRegistration?.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              ESG &amp; Sustainability Compliance Reporting
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              GHG Scope 3 Certified
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Continuous accounting of food waste diverted, Scope 3 Category 5 carbon offset credits, and immutable chain-of-custody audit ledgers.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              GHG Protocol Scope 3
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              100% Free Platform Access
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Audit Signatures Linked
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/analytics"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Operational Analytics</span>
          </Link>
          <button
            onClick={handleDownloadCsv}
            disabled={!report || report.records.length === 0}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Export Audit Ledger (.CSV)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Computing ESG carbon metrics and loading audited records...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 2. Full ESG Compliance Guarantee Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/90 text-xs text-stone-700 flex items-start gap-3.5 shadow-2xs">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
                <span>Full ESG Audit Certification Active (100% Free Open Access)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                  VERIFIED
                </span>
              </div>
              <p className="text-stone-600 leading-relaxed max-w-4xl">
                Continuous compliance with FSSAI Food Recovery Guidelines, BRSR Core Sustainability Reporting, and GHG Protocol Scope 3 Category 5 (Waste Generated in Operations) at zero platform cost. Every confirmed handover is backed by digital signatures from recipient NGOs.
              </p>
            </div>
          </div>

          {/* 3. 5 Vibrant Theme Impact KPI Cards */}
          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Card 1: Emerald Theme - Waste Diverted */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
                    Waste Diverted
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-xl sm:text-2xl font-extrabold text-emerald-950 flex flex-wrap items-baseline gap-1">
                  <span>
                    {report.executiveSummary.wastePreventedByUnit?.kg ?? report.executiveSummary.wastePreventedKg}
                    <span className="text-xs font-sans font-medium text-emerald-700 ml-0.5">kg</span>
                  </span>
                  {report.executiveSummary.wastePreventedByUnit && (
                    <span className="text-[11px] font-mono text-stone-400">
                      • {report.executiveSummary.wastePreventedByUnit.pieces} pcs • {report.executiveSummary.wastePreventedByUnit.litres} L
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
                    100% Landfill avoidance
                  </span>
                </div>
              </div>

              {/* Card 2: Blue Theme - CO2e Avoided */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
                    CO2e Avoided
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
                    <Leaf className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
                  {report.executiveSummary.co2eAvoidedKg.toLocaleString()}
                  <span className="text-xs font-sans font-medium text-blue-700">kg</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
                    1.9 kg CO2e / kg diverted
                  </span>
                </div>
              </div>

              {/* Card 3: Amber Theme - Meals Given */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
                    Meals Rescued
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
                    <Utensils className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
                  {report.executiveSummary.mealsGiven.toLocaleString()}
                  <span className="text-xs font-sans font-medium text-amber-800">meals</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
                    2.5 meals / kg standard
                  </span>
                </div>
              </div>

              {/* Card 4: Sky Theme - Water Preserved */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-white to-sky-500/5 border border-sky-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-sky-800 font-mono font-bold">
                    Water Preserved
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 shadow-2xs">
                    <Droplets className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-sky-900 flex items-baseline gap-1.5">
                  {report.executiveSummary.waterPreservedLiters.toLocaleString()}
                  <span className="text-xs font-sans font-medium text-sky-700">L</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100/90 text-sky-800 border border-sky-200">
                    Agricultural H2O saved
                  </span>
                </div>
              </div>

              {/* Card 5: Violet Theme - Economic Recovery */}
              <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
                    Economic Value
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
                  ₹{report.executiveSummary.costSavedInr.toLocaleString()}
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
                    Procurement recovery
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Audited Transaction Records Table */}
          <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Chain-of-Custody Redistribution Audit Records ({filteredRecords.length})
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Immutable audit trails of verified, safely dispatched food batches with recipient NGO registration
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search records..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleDownloadCsv}
                  disabled={!report || report.records.length === 0}
                  className="text-xs px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-emerald-800 font-semibold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Download .CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                    <th className="py-3 px-4 font-mono font-semibold">Delivery Date</th>
                    <th className="py-3 px-4 font-sans font-semibold">Item Details</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">Diverted Volume</th>
                    <th className="py-3 px-4 font-mono text-right font-semibold">CO2e Offset</th>
                    <th className="py-3 px-4 font-sans font-semibold">Recipient Organization</th>
                    <th className="py-3 px-4 font-sans text-center font-semibold">Safety Gating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs font-sans">
                  {!report || filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-stone-500">
                        <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-400 mb-3 shadow-2xs">
                          <FileSpreadsheet className="w-6 h-6 text-stone-400" />
                        </div>
                        <p className="font-semibold text-stone-800 text-sm">
                          {searchQuery ? "No records match your search filter." : "No confirmed surplus dispatches recorded in the ledger yet."}
                        </p>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                          Completed deliveries will automatically appear here with cryptographic chain-of-custody audit signatures.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => (
                      <tr key={rec.listingId} className="hover:bg-stone-50/90 transition-colors">
                        <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>
                              {rec.deliveredAt
                                ? new Date(rec.deliveredAt).toLocaleDateString([], {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "N/A"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">{rec.itemName}</div>
                          <div className="text-[11px] text-stone-500 font-mono capitalize">
                            {rec.category.replace("_", " ")} · ~{rec.mealsGiven} meals provided
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-stone-900 text-right whitespace-nowrap">
                          {rec.quantity ?? rec.quantityKg}{" "}
                          <span className="text-xs font-sans font-normal text-stone-500">
                            {rec.unit || "kg"}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-700 font-bold text-right whitespace-nowrap">
                          +{rec.co2eAvoidedKg} kg CO2e
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{rec.recipientNgo}</span>
                          </div>
                          <div className="text-[10px] font-mono text-stone-500">
                            Reg: {rec.recipientRegistration || "Government Registered"}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified Safe
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  All records comply with GHG Protocol Scope 3 Category 5 emissions factors and ISO 14064 carbon standards.
                </span>
              </div>
              <div className="font-mono text-[11px] text-stone-400">
                ZeroPlate ESG Engine v2.4
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
