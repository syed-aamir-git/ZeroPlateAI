"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CrateIcon } from "@/components/icons/ledger-icons";
import {
  Building2,
  AlertTriangle,
  RefreshCw,
  Search,
} from "lucide-react";

// Dynamically import NetworkDirectoryMap with ssr: false to prevent Leaflet SSR crashes
const NetworkDirectoryMap = dynamic(
  () => import("@/components/maps/network-directory-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col items-center justify-center gap-3 text-xs font-mono text-zinc-500 shadow-xs">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <span>Initializing Interactive Regional Map...</span>
      </div>
    ),
  }
);

interface InstitutionItem {
  _id: string;
  name: string;
  type?: string;
  address?: string;
  location?: { lat: number; lng: number };
  plan?: "free" | "premium" | string;
  createdAt?: string;
  inventoryCount?: number;
  listingsCount?: number;
  totalSurplusKg?: number;
}

function formatType(type?: string): string {
  if (!type || typeof type !== "string") return "Commercial Kitchen";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "Recently added";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently added";
    return d.toLocaleDateString();
  } catch {
    return "Recently added";
  }
}

export default function AdminInstitutionsPage() {
  const [institutions, setInstitutions] = React.useState<InstitutionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"table" | "map">("table");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState<string>("all");

  const fetchInstitutions = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/institutions");
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${res.status}`);
      }
      const json = await res.json();
      setInstitutions(json.institutions || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load institutions.";
      console.error("Failed to load institutions:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

  // Aggregate metrics
  const totalSurplusListedKg = React.useMemo(() => {
    return institutions.reduce((acc, curr) => acc + (Number(curr.totalSurplusKg) || 0), 0);
  }, [institutions]);

  const totalInventoryCount = React.useMemo(() => {
    return institutions.reduce((acc, curr) => acc + (Number(curr.inventoryCount) || 0), 0);
  }, [institutions]);

  // Available unique types for filter
  const availableTypes = React.useMemo(() => {
    const set = new Set<string>();
    institutions.forEach((i) => {
      if (i.type) set.add(i.type);
    });
    return Array.from(set);
  }, [institutions]);

  // Filtered list
  const filteredInstitutions = React.useMemo(() => {
    return institutions.filter((inst) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q || (inst.name && inst.name.toLowerCase().includes(q));
      const addressMatch = !q || (inst.address && inst.address.toLowerCase().includes(q));
      const idMatch = !q || (inst._id && inst._id.toLowerCase().includes(q));
      const matchesSearch = nameMatch || addressMatch || idMatch;

      const matchesType = typeFilter === "all" || inst.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [institutions, searchQuery, typeFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-emerald-700 font-semibold flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Kitchens &amp; Facilities Directory
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900 mt-1 tracking-tight">
            Registered Institutions ({institutions.length})
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage food donors, dining halls, commercial kitchens, and surplus inventory.
          </p>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-xs text-zinc-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs">
            Aggregate Surplus: <span className="text-emerald-700 font-bold">{totalSurplusListedKg.toLocaleString()} kg</span>
          </div>
          <div className="text-xs text-zinc-600 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/90 shadow-xs">
            Active Inventory: <span className="text-blue-700 font-bold">{totalInventoryCount.toLocaleString()} items</span>
          </div>
          <button
            type="button"
            onClick={fetchInstitutions}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-zinc-600 hover:text-zinc-900 border border-slate-200/90 shadow-xs transition-colors cursor-pointer"
            title="Refresh Institutions List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-rose-900">Unable to load institutions</div>
              <div className="text-rose-700 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchInstitutions}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* View Mode & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>⊞ Facilities Table</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-zinc-700 font-bold border border-slate-200">
              {filteredInstitutions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-white text-zinc-900 font-semibold shadow-xs border border-slate-200/60"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span>🗺️ Map View</span>
          </button>
        </div>

        {/* Search & Type Filter Bar */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facility name, address, ID..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-zinc-900 placeholder:text-zinc-400 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs transition-all"
            />
          </div>

          {availableTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-zinc-800 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-xs cursor-pointer font-medium"
            >
              <option value="all">All Types</option>
              {availableTypes.map((t) => (
                <option key={t} value={t}>
                  {formatType(t)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Facility Map View */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-600 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <span>Interactive regional facility distribution across dining verticals, processing centers, and campus kitchens.</span>
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {institutions.length} Kitchens Mapped
            </span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-white">
            <NetworkDirectoryMap
              entities={institutions.map((inst) => ({
                _id: inst._id || String(Math.random()),
                name: inst.name || "Commercial Kitchen",
                subtitle: formatType(inst.type).toUpperCase(),
                address: inst.address || "Address not provided",
                location: inst.location,
                badgeText: inst.plan === "premium" ? "Enterprise Kitchen" : "Standard Kitchen",
                details: {
                  Type: formatType(inst.type),
                  "Surplus Listed": `${Number(inst.totalSurplusKg) || 0} kg`,
                  "Inventory Items": Number(inst.inventoryCount) || 0,
                  "Active Listings": Number(inst.listingsCount) || 0,
                },
              }))}
              entityType="kitchen"
              theme="light"
              className="w-full h-[520px]"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Institutions Ledger Table */}
          {loading ? (
            <div className="p-16 text-center space-y-3 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
              <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin mx-auto" />
              <div className="text-xs text-zinc-500">
                Loading registered institutions directory...
              </div>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="border border-slate-200/90 bg-white p-12 rounded-2xl text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl border border-slate-200 bg-slate-50 mx-auto flex items-center justify-center text-zinc-600">
                <CrateIcon size={24} />
              </div>
              <h2 className="font-display text-lg font-bold text-zinc-900">
                {institutions.length === 0
                  ? "No institutions onboarded yet"
                  : "No facilities matching your search"}
              </h2>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                {institutions.length === 0
                  ? "New commercial dining facilities, campus kitchens, and hospitals will appear here once they complete onboarding."
                  : "Try adjusting your search query or vertical type filter."}
              </p>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="px-3.5 py-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:underline"
                >
                  Clear search filters
                </button>
              )}
            </div>
          ) : (
            <div className="border border-slate-200/90 bg-white rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-zinc-600 uppercase font-semibold text-[11px] tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Facility Name</th>
                      <th className="px-4 py-3.5">Vertical Type</th>
                      <th className="px-4 py-3.5">Dispatch Address</th>
                      <th className="px-4 py-3.5">Subscription Plan</th>
                      <th className="px-4 py-3.5">Inventory Logged</th>
                      <th className="px-4 py-3.5">Total Surplus Listed</th>
                      <th className="px-5 py-3.5 text-right">Onboarded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-zinc-700">
                    {filteredInstitutions.map((inst) => (
                      <tr key={inst._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-zinc-900">
                          <div className="text-sm font-bold text-zinc-900">{inst.name || "Commercial Kitchen"}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            ID: {inst._id}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-700 font-medium">
                          {formatType(inst.type)}
                        </td>

                        <td
                          className="px-4 py-3.5 max-w-[220px] truncate text-zinc-500 text-xs"
                          title={inst.address || "Address not provided"}
                        >
                          {inst.address || "Address not provided"}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
                              inst.plan === "premium"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {inst.plan === "premium" ? "Enterprise Premium" : "Community Free"}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-zinc-900 font-medium">
                          {Number(inst.inventoryCount) || 0} items
                        </td>

                        <td className="px-4 py-3.5 text-emerald-700 font-bold">
                          {Number(inst.totalSurplusKg) || 0} kg <span className="text-zinc-400 font-normal">({Number(inst.listingsCount) || 0} batches)</span>
                        </td>

                        <td
                          className="px-5 py-3.5 text-right text-zinc-500 text-xs"
                          suppressHydrationWarning
                        >
                          {formatDate(inst.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
