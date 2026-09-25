"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { CrateIcon } from "@/components/icons/ledger-icons";
import {
  Building2,
  MapPin,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Layers,
} from "lucide-react";

// Dynamically import NetworkDirectoryMap with ssr: false to prevent Leaflet SSR crashes
const NetworkDirectoryMap = dynamic(
  () => import("@/components/maps/network-directory-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] rounded-xl bg-[#3D2538] border border-[#5A3653] flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#C9B9C7]">
        <div className="w-7 h-7 rounded-full border-2 border-[#D9A441] border-t-transparent animate-spin" />
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

  const premiumCount = React.useMemo(() => {
    return institutions.filter((i) => i.plan === "premium").length;
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
    <div className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#5A3653] pb-4">
        <div>
          <span className="font-mono-numeral text-xs uppercase tracking-wider text-[#D9A441] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Commercial Kitchens &amp; Facilities Directory
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-0.5">
            Onboarded Institutions ({institutions.length})
          </h1>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="font-mono-numeral text-xs text-[#C9B9C7] bg-[#3D2538] px-3 py-1.5 rounded-lg border border-[#5A3653]">
            Aggregate Surplus: <span className="text-[#86C29B] font-bold">{totalSurplusListedKg} kg</span>
          </div>
          <div className="font-mono-numeral text-xs text-[#C9B9C7] bg-[#3D2538] px-3 py-1.5 rounded-lg border border-[#5A3653]">
            Active Inventory: <span className="text-[#D9A441] font-bold">{totalInventoryCount} items</span>
          </div>
          <button
            type="button"
            onClick={fetchInstitutions}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#3D2538] hover:bg-[#4A2E44] text-[#C9B9C7] hover:text-[#F3EEE2] border border-[#5A3653] transition-colors cursor-pointer"
            title="Refresh Institutions List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Alert Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-100">Unable to load institutions</div>
              <div className="text-red-300/90 mt-0.5">{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchInstitutions}
            className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-white rounded font-mono-numeral text-xs font-semibold border border-red-700 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* View Mode & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#3D2538] p-1 rounded-lg border border-[#5A3653]">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 text-xs font-mono-numeral rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-[#D9A441] text-[#24211C] font-bold shadow-2xs"
                : "text-[#C9B9C7] hover:text-[#F3EEE2]"
            }`}
          >
            <span>⊞ Facilities Table</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-bold">
              {filteredInstitutions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`px-3 py-1.5 text-xs font-mono-numeral rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === "map"
                ? "bg-[#D9A441] text-[#24211C] font-bold shadow-2xs"
                : "text-[#C9B9C7] hover:text-[#F3EEE2]"
            }`}
          >
            <span>🗺️ Facility Map View</span>
          </button>
        </div>

        {/* Search & Type Filter Bar */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#C9B9C7] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facility name, address, ID..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-[#5A3653] bg-[#3D2538] text-[#F3EEE2] placeholder:text-[#C9B9C7]/50 focus:outline-hidden focus:border-[#D9A441] transition-all font-mono-numeral"
            />
          </div>

          {availableTypes.length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-[#5A3653] bg-[#3D2538] text-[#F3EEE2] focus:outline-hidden focus:border-[#D9A441] font-mono-numeral cursor-pointer"
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
          <div className="flex items-center justify-between text-xs text-[#C9B9C7] font-mono-numeral bg-[#3D2538] p-3 rounded-xl border border-[#5A3653]">
            <span>Interactive regional facility distribution across dining verticals, processing centers, and campus kitchens.</span>
            <span className="text-[#86C29B] font-semibold">{institutions.length} Kitchens Mapped</span>
          </div>
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
            theme="dark"
            className="w-full h-[520px]"
          />
        </div>
      ) : (
        <>
          {/* Institutions Ledger Table */}
          {loading ? (
            <div className="p-16 text-center space-y-3 border border-[#5A3653] bg-[#3D2538] rounded-xl">
              <div className="w-8 h-8 rounded-full border-2 border-[#D9A441] border-t-transparent animate-spin mx-auto" />
              <div className="text-xs font-mono-numeral text-[#C9B9C7]">
                Loading registered institutions ledger...
              </div>
            </div>
          ) : filteredInstitutions.length === 0 ? (
            <div className="border border-[#5A3653] bg-[#3D2538] p-12 rounded-xl text-center space-y-3">
              <div className="w-12 h-12 rounded-xl border border-[#5A3653] bg-[#4A2E44] mx-auto flex items-center justify-center text-[#D9A441]">
                <CrateIcon size={24} />
              </div>
              <h2 className="font-display text-lg font-medium text-[#F3EEE2]">
                {institutions.length === 0
                  ? "No institutions onboarded yet"
                  : "No facilities matching your search"}
              </h2>
              <p className="text-xs text-[#C9B9C7] max-w-md mx-auto">
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
                  className="px-3 py-1.5 text-xs font-mono-numeral text-[#D9A441] hover:underline"
                >
                  Clear search filters
                </button>
              )}
            </div>
          ) : (
            <div className="border border-[#5A3653] bg-[#3D2538] rounded-xl overflow-x-auto shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono-numeral text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Facility Name</th>
                    <th className="px-4 py-3 font-semibold">Vertical Type</th>
                    <th className="px-4 py-3 font-semibold">Dispatch Address</th>
                    <th className="px-4 py-3 font-semibold">Subscription Plan</th>
                    <th className="px-4 py-3 font-semibold">Inventory Logged</th>
                    <th className="px-4 py-3 font-semibold">Total Surplus Listed</th>
                    <th className="px-4 py-3 font-semibold text-right">Onboarded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
                  {filteredInstitutions.map((inst) => (
                    <tr key={inst._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#F3EEE2]">
                        <div className="text-sm font-semibold">{inst.name || "Commercial Kitchen"}</div>
                        <div className="text-[10px] text-[#C9B9C7] font-mono-numeral">
                          ID: {inst._id}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-[#D9A441] font-medium">
                        {formatType(inst.type)}
                      </td>

                      <td
                        className="px-4 py-3 max-w-[220px] truncate text-[#C9B9C7]"
                        title={inst.address || "Address not provided"}
                      >
                        {inst.address || "Address not provided"}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-numeral uppercase font-semibold ${
                            inst.plan === "premium"
                              ? "bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40"
                              : "bg-[#2F4B3A]/20 text-[#86C29B] border border-[#2F4B3A]/40"
                          }`}
                        >
                          {inst.plan === "premium" ? "Enterprise Premium" : "Community Free"}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono-numeral text-[#F3EEE2]">
                        {Number(inst.inventoryCount) || 0} items
                      </td>

                      <td className="px-4 py-3 font-mono-numeral text-[#86C29B] font-medium">
                        {Number(inst.totalSurplusKg) || 0} kg ({Number(inst.listingsCount) || 0} batches)
                      </td>

                      <td
                        className="px-4 py-3 text-right font-mono-numeral text-[#C9B9C7]"
                        suppressHydrationWarning
                      >
                        {formatDate(inst.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
