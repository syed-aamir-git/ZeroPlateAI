"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Utensils,
  Building2,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Search,
  X,
  Layers,
  Ticket,
  ArrowRight,
  Scale,
  Sparkles,
  Map as MapIcon,
  LayoutGrid,
  Info,
  AlertCircle,
} from "lucide-react";
import { OnboardingChecklist } from "@/components/ui/onboarding-checklist";
import MarketplaceMap from "@/components/maps/marketplace-map";
import {
  calculatePiecesToPlates,
  evaluateSurplusUrgency,
  isPiecesUnit,
} from "@/lib/surplus-engine";

interface SurplusListing {
  _id: string;
  inventoryItemId: string;
  institutionId: string;
  institutionName: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  pickupWindow: {
    start: string;
    end: string;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  safetyStatus: "verified_safe" | "rejected";
  status: "pending" | "matched" | "claimed" | "delivered" | "expired";
  createdAt: string;
}

interface NgoInfo {
  _id: string;
  orgName: string;
  kycStatus: "pending" | "approved" | "rejected";
  capacityPerWeek: number;
}

export default function NgoBrowsePage() {
  const [listings, setListings] = React.useState<SurplusListing[]>([]);
  const [ngo, setNgo] = React.useState<NgoInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "map">("grid");
  const [selectedMapId, setSelectedMapId] = React.useState<string | null>(null);
  const [claimingId, setClaimingId] = React.useState<string | null>(null);
  const [claimFeedback, setClaimFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchBrowseData = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/ngo/browse");
      if (res.ok) {
        const json = await res.json();
        setListings(json.listings || []);
        setNgo(json.ngo || null);
      }
    } catch (err) {
      console.warn("Notice: Failed to fetch available surplus listings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchBrowseData();
  }, [fetchBrowseData]);

  const handleClaim = async (listingId: string) => {
    setClaimFeedback(null);
    setClaimingId(listingId);

    try {
      const res = await fetch("/api/v1/ngo/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const json = await res.json();

      if (!res.ok) {
        setClaimFeedback({
          type: "error",
          message: json.error || "Failed to claim surplus listing.",
        });
        if (res.status === 409) {
          fetchBrowseData();
        }
        return;
      }

      setClaimFeedback({
        type: "success",
        message: "Surplus listing claimed successfully! Pickup details and driver dispatch are in My Claims.",
      });

      // Refresh listings
      fetchBrowseData();
    } catch (err: unknown) {
      setClaimFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error executing claim.",
      });
    } finally {
      setClaimingId(null);
    }
  };

  const isKycApproved = ngo?.kycStatus === "approved";

  // Compute live KPI metrics
  const totalVolumeKg = listings.reduce((acc, l) => acc + (l.quantity || 0), 0);
  const totalMealsEstimate = Math.round(totalVolumeKg * 2.5);
  const uniqueKitchensCount = new Set(
    listings.map((l) => l.institutionName).filter(Boolean)
  ).size;

  // Categories config with live item counters
  const categories = [
    { id: "all", label: "All Items", count: listings.length },
    {
      id: "cooked_food",
      label: "Cooked Food",
      count: listings.filter((i) => i.category === "cooked_food").length,
    },
    {
      id: "dairy",
      label: "Dairy",
      count: listings.filter((i) => i.category === "dairy").length,
    },
    {
      id: "bakery",
      label: "Bakery",
      count: listings.filter((i) => i.category === "bakery").length,
    },
    {
      id: "raw_produce",
      label: "Raw Produce",
      count: listings.filter((i) => i.category === "raw_produce").length,
    },
    {
      id: "packaged",
      label: "Packaged",
      count: listings.filter((i) => i.category === "packaged").length,
    },
  ];

  const filteredListings = listings.filter((item) => {
    const matchesCategory =
      filterCategory === "all" || item.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.itemName?.toLowerCase().includes(q) ||
      item.institutionName?.toLowerCase().includes(q) ||
      item.pickupLocation?.address?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  // Sort listings with 🔴 Critical Red items (<2 hours) prioritized at the top
  const sortedListings = React.useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      const urgencyA = evaluateSurplusUrgency({
        category: a.category,
        quantity: a.quantity,
        unit: a.unit,
        expiryDeadline: a.pickupWindow?.end || new Date(),
      });
      const urgencyB = evaluateSurplusUrgency({
        category: b.category,
        quantity: b.quantity,
        unit: b.unit,
        expiryDeadline: b.pickupWindow?.end || new Date(),
      });
      const rank: Record<string, number> = { critical_red: 3, urgent_yellow: 2, safe_green: 1 };
      const diff = (rank[urgencyB.urgencyTier] || 0) - (rank[urgencyA.urgencyTier] || 0);
      if (diff !== 0) return diff;
      return new Date(a.pickupWindow?.end || 0).getTime() - new Date(b.pickupWindow?.end || 0).getTime();
    });
  }, [filteredListings]);

  const criticalCount = React.useMemo(() => {
    return sortedListings.filter((item) => {
      const u = evaluateSurplusUrgency({
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        expiryDeadline: item.pickupWindow?.end || new Date(),
      });
      return u.urgencyTier === "critical_red";
    }).length;
  }, [sortedListings]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Available Surplus Food Marketplace
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Marketplace Broadcast
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Browse verified safe surplus batches from commercial kitchens, inspect pickup windows, and claim food for immediate community distribution.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {listings.length} Active Batches
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI Gating Verified
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Zero Commission Platform
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          {ngo && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-semibold border shadow-2xs whitespace-nowrap bg-white text-stone-800 border-stone-200">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isKycApproved ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <span>{isKycApproved ? "KYC Approved" : "KYC Pending"}</span>
              </span>
            </div>
          )}
          <Link
            href="/app/ngo/my-claims"
            className="group inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs hover:border-stone-300 transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>My Claimed Batches</span>
          </Link>
          <Link
            href="/app/ngo/organization"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Building2 className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Organization Profile</span>
          </Link>
        </div>
      </div>

      {/* KYC Warning Banner if not yet approved */}
      {!loading && !isKycApproved && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-3.5 shadow-2xs">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-stone-900 text-sm flex items-center gap-2">
              <span>KYC Verification Pending — Claiming Temporarily Restricted</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                UNDER REVIEW
              </span>
            </div>
            <p className="text-stone-700 leading-relaxed max-w-4xl">
              Under Section 12.8 of the ZeroPlate Food Safety Policy, commercial surplus food redistribution requires verified-recipient compliance. Your organization (<strong>{ngo?.orgName || "Your NGO"}</strong>) is currently awaiting Platform Administrator approval. You may browse listings freely, and claiming will unlock automatically upon KYC approval.
            </p>
            <div className="pt-1">
              <Link
                href="/app/ngo/organization"
                className="font-semibold text-emerald-800 hover:underline flex items-center gap-1 text-xs"
              >
                <span>Review or update KYC registration details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Claim Feedback Banner */}
      {claimFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-2xs ${
            claimFeedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {claimFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{claimFeedback.message}</span>
          </div>
          {claimFeedback.type === "success" && (
            <Link
              href="/app/ngo/my-claims"
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs whitespace-nowrap"
            >
              View in My Claims →
            </Link>
          )}
        </div>
      )}

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - Available Surplus Batches */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Available Batches
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {listings.length}
            <span className="text-xs font-sans font-medium text-emerald-700">active</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Verified Safe to Claim
            </span>
          </div>
        </div>

        {/* Card 2: Blue Theme - Total Rescuable Volume */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Rescuable Food Volume
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {Math.round(totalVolumeKg)}
            <span className="text-xs font-sans font-medium text-blue-700">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              ~{totalMealsEstimate.toLocaleString()} Meals Equivalent
            </span>
          </div>
        </div>

        {/* Card 3: Amber Theme - Active Donor Kitchens */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Donor Institutions
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {uniqueKitchensCount || 1}
            <span className="text-xs font-sans font-medium text-amber-800">facilities</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              Corporate &amp; Campus Kitchens
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Recipient Capacity Quota */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Weekly Intake Quota
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            {ngo?.capacityPerWeek ? ngo.capacityPerWeek.toLocaleString() : 500}
            <span className="text-xs font-sans font-medium text-purple-700">kg/wk</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              Priority Dispatch Allocation
            </span>
          </div>
        </div>
      </div>

      {/* 3. Orientation Checklist */}
      <OnboardingChecklist
        storageKey="ngo_browse"
        title="NGO Recipient Onboarding Checklist"
        subtitle="Follow these operational milestones to safely claim and distribute surplus food."
        items={[
          {
            id: "kyc",
            title: "Complete organization KYC registration",
            description: "Provide statutory non-profit registration and service capacity",
            href: "/app/ngo/organization",
            isCompleted: isKycApproved,
          },
          {
            id: "browse",
            title: "Browse verified safe listings",
            description: "Inspect certified surplus batches with verified pickup windows",
            href: "/app/ngo/browse",
            isCompleted: listings.length > 0,
          },
          {
            id: "claim",
            title: "Lock and claim a surplus batch",
            description: "Coordinate with logistics delivery partners for prompt dispatch",
            href: "/app/ngo/browse",
            isCompleted: false,
          },
          {
            id: "confirm",
            title: "Confirm delivery receipt",
            description: "Close the loop to credit meals delivered and CO2e avoided",
            href: "/app/ngo/my-claims",
            isCompleted: false,
          },
        ]}
      />

      {/* 4. Category Filter Tabs, Search & View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isActive = filterCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-emerald-800 text-emerald-100 font-bold"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & View Mode Toggle */}
        <div className="flex items-center gap-2.5 justify-between lg:justify-end">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes or donors..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50/70 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/80 shrink-0">
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
              <span>Grid</span>
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
              <span>Map View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Marketplace Content (Map vs Cards Grid) */}
      {viewMode === "map" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-600 bg-white p-4 rounded-2xl border border-stone-200/90 shadow-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Click any map pin to inspect batch details, pickup window, and claim directly.</span>
            </div>
            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {sortedListings.length} Active Listings Mapped
            </span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-white">
            <MarketplaceMap
              listings={sortedListings}
              selectedId={selectedMapId}
              onSelect={(id) => setSelectedMapId(id)}
              onClaim={handleClaim}
              isKycApproved={isKycApproved}
              className="w-full h-[540px]"
            />
          </div>
        </div>
      ) : (
        <>
          {/* Critical Surplus Alert Banner */}
          {criticalCount > 0 && (
            <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs text-red-950 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-bold font-mono text-[10px] tracking-wide animate-pulse">
                  RESCUE PRIORITY
                </span>
                <span className="font-semibold">
                  {criticalCount} surplus batch{criticalCount > 1 ? "es have" : " has"} &lt; 2 hours remaining!
                </span>
                <span className="text-red-800/80 hidden sm:inline">
                  Prioritized at the top of the marketplace for immediate pickup.
                </span>
              </div>
              <span className="text-[11px] font-mono font-bold text-red-700">🔴 Critical Tier</span>
            </div>
          )}

          {loading ? (
            <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
              <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
                Loading available surplus marketplace batches...
              </p>
            </div>
          ) : sortedListings.length === 0 ? (
            <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
                <Package className="w-7 h-7 text-stone-400" />
              </div>
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-bold text-stone-900">
                  No active surplus listings found
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery
                    ? `No surplus batches match "${searchQuery}". Try clearing search filters.`
                    : "Commercial kitchens publish surplus batches following daily service cycles. As soon as a batch passes automated safety gating, it will appear here for immediate claim."}
                </p>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <span>Clear Search Filter</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedListings.map((item) => {
                const startDate = new Date(item.pickupWindow.start);
                const endDate = new Date(item.pickupWindow.end);
                const isClaiming = claimingId === item._id;

                const urgency = evaluateSurplusUrgency({
                  category: item.category,
                  quantity: item.quantity,
                  unit: item.unit,
                  expiryDeadline: item.pickupWindow?.end || new Date(),
                });
                const plates = calculatePiecesToPlates(item.quantity, item.unit, item.category);
                const isRed = urgency.urgencyTier === "critical_red";
                const isYellow = urgency.urgencyTier === "urgent_yellow";

                return (
                  <div
                    key={item._id}
                    className={`rounded-2xl bg-white border p-5 sm:p-6 shadow-xs transition-all flex flex-col justify-between space-y-5 text-left group ${
                      isRed
                        ? "border-red-500/60 bg-red-50/20 shadow-md ring-1 ring-red-500/30 hover:border-red-600"
                        : isYellow
                        ? "border-amber-300 hover:border-amber-400 hover:shadow-md"
                        : "border-stone-200/90 hover:shadow-md hover:border-emerald-300"
                    }`}
                  >
                    <div>
                      {/* Category Stamp & Urgency Badge */}
                      <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3 mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200 capitalize">
                          {item.category === "cooked_food"
                            ? "🍲 Cooked Food"
                            : item.category === "dairy"
                            ? "🥛 Dairy & Milk"
                            : item.category === "bakery"
                            ? "🍞 Bakery & Bread"
                            : item.category === "raw_produce"
                            ? "🥦 Raw Produce"
                            : "📦 Packaged Goods"}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${urgency.tierColor.bg} ${urgency.tierColor.text} ${urgency.tierColor.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${urgency.tierColor.dot} ${isRed ? "animate-ping" : ""}`} />
                          {isRed
                            ? "🔴 Critical Tier"
                            : isYellow
                            ? "🟡 Urgent Tier"
                            : "🟢 Safe Buffer"}
                        </span>
                      </div>

                      {/* Title & Quantity + Pieces-to-Plates */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-serif font-bold text-lg text-stone-900 group-hover:text-emerald-800 transition-colors line-clamp-1">
                            {item.itemName}
                          </h3>
                          {isRed && (
                            <span className="px-1.5 py-0.5 bg-red-600 text-white rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                              PRIORITY
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline justify-between pt-1">
                          <div className="font-mono text-2xl font-extrabold text-emerald-700">
                            {item.quantity}{" "}
                            <span className="text-xs font-sans font-medium text-stone-500">
                              {item.unit}
                            </span>
                            {isPiecesUnit(item.unit) && (
                              <span className="text-xs font-sans font-semibold text-emerald-800 ml-1.5 whitespace-nowrap">
                                (~{plates.plates} plates)
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-xs font-bold text-stone-800 flex items-center gap-1 justify-end">
                              <Utensils className="w-3 h-3 text-emerald-600" />
                              ≈ {plates.plates} plates
                            </span>
                            <span className="text-[10px] text-stone-500 font-mono block">
                              {plates.analogyText}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Time Remaining Strip */}
                      <div
                        className={`mt-3 p-2.5 rounded-xl text-xs flex items-center justify-between font-mono ${
                          isRed
                            ? "bg-red-500/10 text-red-900 border border-red-500/30"
                            : isYellow
                            ? "bg-amber-500/10 text-amber-900 border border-amber-500/30"
                            : "bg-stone-50 text-stone-600 border border-stone-100"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          Window Status:
                        </span>
                        <span className="font-bold">
                          {urgency.timeRemainingHours <= 0
                            ? "Window Expiring"
                            : `${urgency.timeRemainingHours.toFixed(1)}h remaining`}
                        </span>
                      </div>

                      {/* Donor & Dispatch Details */}
                      <div className="mt-4 pt-3 border-t border-stone-100 text-xs space-y-2">
                        <div className="flex items-center justify-between gap-2 text-stone-600">
                          <span className="flex items-center gap-1.5 text-stone-500">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            Donor Kitchen:
                          </span>
                          <span className="font-semibold text-stone-900 text-right truncate max-w-[170px]">
                            {item.institutionName || "Verified Kitchen"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-stone-600">
                          <span className="flex items-center gap-1.5 text-stone-500">
                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                            Pickup Bay:
                          </span>
                          <span
                            className="text-stone-700 text-right truncate max-w-[170px]"
                            title={item.pickupLocation?.address}
                          >
                            {item.pickupLocation?.address || "Main Dispatch Bay"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-stone-600">
                          <span className="flex items-center gap-1.5 text-stone-500">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            Pickup Window:
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-stone-800 text-right">
                            {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                            {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Claim Action Button */}
                    <div className="pt-3 border-t border-stone-100">
                      {isKycApproved ? (
                        <button
                          onClick={() => handleClaim(item._id)}
                          disabled={isClaiming}
                          className={`w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-60 active:scale-[0.98] ${
                            isRed
                              ? "bg-rose-700 hover:bg-rose-800"
                              : "bg-emerald-700 hover:bg-emerald-800"
                          }`}
                        >
                          {isClaiming ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Locking Claim...</span>
                            </>
                          ) : (
                            <>
                              <Ticket className="w-4 h-4 text-emerald-100" />
                              <span>
                                {isRed ? "🚨 Urgent Claim Surplus Batch" : "Claim Surplus Batch"}
                              </span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="space-y-1.5">
                          <button
                            disabled
                            className="w-full h-10 px-4 rounded-xl bg-stone-100 border border-stone-200 text-stone-400 text-xs font-semibold cursor-not-allowed"
                          >
                            Claiming Restricted (KYC Pending)
                          </button>
                          <p className="text-[10px] text-center text-stone-400 font-mono">
                            Safety policy compliance approval required
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
