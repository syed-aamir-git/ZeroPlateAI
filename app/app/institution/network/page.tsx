"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Scale,
  Search,
  X,
  Layers,
  Truck,
  Ticket,
  ArrowRight,
  Sparkles,
  Building2,
  Info,
  Map as MapIcon,
  LayoutGrid,
} from "lucide-react";
import NetworkDirectoryMap from "@/components/maps/network-directory-map";

interface VerifiedNGO {
  _id: string;
  orgName: string;
  registrationNumber: string;
  serviceArea: string;
  capacityPerWeek: number;
  location?: {
    address?: string;
    lat?: number;
    lng?: number;
  };
  kycStatus: string;
  updatedAt?: string;
}

export default function InstitutionNetworkPage() {
  const [ngos, setNgos] = React.useState<VerifiedNGO[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "map">("grid");

  React.useEffect(() => {
    async function loadNetwork() {
      try {
        const res = await fetch("/api/v1/institution/network");
        if (res.ok) {
          const data = await res.json();
          setNgos(data.network || []);
        }
      } catch (err) {
        console.error("Failed to load NGO network:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNetwork();
  }, []);

  // Compute summary KPI metrics
  const totalPartners = ngos.length;
  const totalCapacityKg = ngos.reduce(
    (acc, n) => acc + (n.capacityPerWeek || 0),
    0
  );
  const uniqueServiceAreas = new Set(
    ngos.map((n) => n.serviceArea).filter(Boolean)
  ).size;

  const filteredNgos = ngos.filter(
    (ngo) =>
      ngo.orgName?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.serviceArea?.toLowerCase().includes(search.toLowerCase()) ||
      ngo.registrationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Directory Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Verified NGO Partner Directory
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Network Active
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Browse verified recipient charitable organizations, community shelters, and distribution hubs operating within your regional dispatch routes.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {ngos.length} Verified Hubs
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <MapPin className="w-3 h-3 text-blue-600" />
              Geo-Tagged Radii
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI &amp; KYC Compliant
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <Link
            href="/app/institution/deliveries"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Active Deliveries</span>
          </Link>
          <Link
            href="/app/institution/surplus-listings"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Create Surplus Listing</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - Verified Partner NGOs */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Verified Partners
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {totalPartners}
            <span className="text-xs font-sans font-medium text-emerald-700">NGOs</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              100% KYC Approved
            </span>
          </div>
        </div>

        {/* Card 2: Blue Theme - Weekly Intake Capacity */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Weekly Absorption
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {totalCapacityKg.toLocaleString()}
            <span className="text-xs font-sans font-medium text-blue-700">kg/wk</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              High Regional Intake
            </span>
          </div>
        </div>

        {/* Card 3: Amber Theme - Active Service Coverage */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Service Clusters
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {uniqueServiceAreas || 1}
            <span className="text-xs font-sans font-medium text-amber-800">zones</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              Urban &amp; Peri-Urban
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Automated Match Guarantee */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Dispatch Matching
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            &lt; 15 min
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              Algorithmic Pairing
            </span>
          </div>
        </div>
      </div>

      {/* 3. Trust & Compliance Guarantee Notice */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/90 text-xs text-stone-700 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0 mt-0.5 shadow-2xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
        </div>
        <div className="space-y-1">
          <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
            <span>FSSAI &amp; Government KYC Compliance Guarantee</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
              VERIFIED
            </span>
          </div>
          <p className="text-stone-600 leading-relaxed max-w-4xl">
            Every organization in this directory has submitted official government registration credentials, verified physical premises, and completed food safety handling certifications. Direct contact details and gate handoff credentials are automatically routed upon verified batch claiming to ensure full dispatch integrity.
          </p>
        </div>
      </div>

      {/* 4. Filter, Search & View Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by NGO name, area, or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Switcher & Partner Count */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Directory Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "map"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Partner Map</span>
            </button>
          </div>

          <div className="text-xs font-mono text-stone-500 whitespace-nowrap bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200">
            {filteredNgos.length} {filteredNgos.length === 1 ? "Partner" : "Partners"}
          </div>
        </div>
      </div>

      {/* 5. Directory Map View Display */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Geographical coverage of verified NGO distribution hubs across your regional territory.</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {filteredNgos.length} Hubs Plotted
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-white">
            <NetworkDirectoryMap
              entities={filteredNgos.map((n) => ({
                _id: n._id,
                name: n.orgName,
                subtitle: n.serviceArea,
                location: n.location,
                badgeText: "Verified Recipient",
                details: {
                  Registration: n.registrationNumber,
                  Capacity: `${n.capacityPerWeek} kg/week`,
                  "Service Area": n.serviceArea,
                },
              }))}
              entityType="ngo"
              theme="light"
              className="w-full h-[520px]"
            />
          </div>
        </div>
      ) : loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Loading verified NGO network directory...
          </p>
        </div>
      ) : filteredNgos.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <Building2 className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No Verified NGOs Found
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              {search
                ? `No partner matches "${search}". Try checking for spelling or clear search filters.`
                : "No NGOs have been onboarded in this cluster yet. When pending applications are vetted by Platform Admins, they will appear here."}
            </p>
          </div>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              <span>Clear Filter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNgos.map((ngo) => (
            <div
              key={ngo._id}
              className="rounded-2xl bg-white border border-stone-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 text-left group"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-200 text-emerald-800 flex items-center justify-center font-bold font-serif text-base shrink-0 shadow-2xs">
                      {ngo.orgName?.charAt(0)?.toUpperCase() || "N"}
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-stone-900 text-base group-hover:text-emerald-800 transition-colors line-clamp-1">
                        {ngo.orgName}
                      </h3>
                      <div className="text-[11px] text-stone-500 font-mono">
                        Reg: {ngo.registrationNumber || "Government Registered"}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Approved
                  </span>
                </div>
              </div>

              {/* Service Details */}
              <div className="pt-3 border-t border-stone-100 text-xs space-y-2">
                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    Service Area:
                  </span>
                  <span className="font-semibold text-stone-900">
                    {ngo.serviceArea || "Metropolitan Zone"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-stone-600">
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <Scale className="w-3.5 h-3.5 text-stone-400" />
                    Weekly Intake:
                  </span>
                  <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                    {ngo.capacityPerWeek?.toLocaleString() || 0} kg/wk
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                <div className="text-[11px] text-emerald-800 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Eligible for Dispatch</span>
                </div>

                <Link
                  href="/app/institution/surplus-listings"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-700 hover:text-emerald-700 bg-stone-50 hover:bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 transition-colors"
                >
                  <span>Dispatch Batch</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
