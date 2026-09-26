"use client";

import * as React from "react";
import Link from "next/link";
import {
  Ticket,
  Truck,
  CheckCircle2,
  Clock,
  Utensils,
  Building2,
  MapPin,
  RefreshCw,
  Search,
  X,
  Layers,
  ShieldCheck,
  Scale,
  ChevronDown,
  ChevronUp,
  Route,
  Info,
  Package,
  PackageCheck,
  BarChart3,
  Sparkles,
} from "lucide-react";
import DeliveryRouteMap, { getVehicleConfig, calculateDeliveryEtas } from "@/components/maps/delivery-route-map";
import { calculatePiecesToPlates, formatFoodQuantity, isPiecesUnit } from "@/lib/surplus-engine";

interface ClaimRecord {
  _id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  institutionName: string;
  pickupWindow: {
    start: string;
    end: string;
  };
  pickupLocation: {
    address: string;
    lat: number;
    lng: number;
  };
  status: "claimed" | "delivered" | "expired";
  deliveryStatus: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  isConfirmed: boolean;
  confirmedAt?: string;
  claimedAt?: string;
  courier?: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber?: string;
  } | null;
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
  } | null;
}

export default function NgoMyClaimsPage() {
  const [claims, setClaims] = React.useState<ClaimRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [openMapIds, setOpenMapIds] = React.useState<Record<string, boolean>>({});
  const [filter, setFilter] = React.useState<"all" | "active" | "confirmed">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const toggleMap = (id: string) => {
    setOpenMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Immediate, robust fetch logic without premature abort cancellations
  const fetchClaims = React.useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/ngo/claims");
      if (res.ok) {
        const json = await res.json();
        const items: ClaimRecord[] = json.claims || [];
        setClaims(items);

        // Auto-expand route map for any active in-transit or dropped deliveries
        setOpenMapIds((prev) => {
          const next = { ...prev };
          for (const c of items) {
            if (c.deliveryStatus === "accepted" || c.deliveryStatus === "picked_up" || c.deliveryStatus === "delivered") {
              if (next[c._id] === undefined) {
                next[c._id] = true;
              }
            }
          }
          return next;
        });
      }
    } catch (err: unknown) {
      console.warn("NGO claims sync paused:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Poll faster (every 5s) if there is an in-transit delivery or food dropped awaiting receipt
  React.useEffect(() => {
    fetchClaims();

    const hasActiveDelivery = claims.some(
      (c) => c.deliveryStatus === "accepted" || c.deliveryStatus === "picked_up" || c.deliveryStatus === "delivered"
    );
    const pollInterval = hasActiveDelivery ? 5000 : 20000;

    const interval = setInterval(() => {
      fetchClaims();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchClaims, claims]);

  const handleConfirmReceipt = async (claimId: string) => {
    setFeedback(null);
    setConfirmingId(claimId);

    try {
      const res = await fetch(`/api/v1/ngo/claims/${claimId}/confirm-receipt`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: json.error || "Failed to confirm receipt.",
        });
        return;
      }

      setFeedback({
        type: "success",
        message: "Delivery receipt confirmed! Quantity has been recorded toward your organization's impact ledger.",
      });

      fetchClaims();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error confirming receipt.",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  // Metrics calculations
  const totalClaimedBatches = claims.length;
  const confirmedCount = claims.filter(
    (c) => c.isConfirmed || c.deliveryStatus === "confirmed"
  ).length;
  const awaitingReceiptBatches = claims.filter(
    (c) => !c.isConfirmed && c.deliveryStatus === "delivered"
  );
  const inTransitCount = totalClaimedBatches - confirmedCount;
  const totalVolumeKg = claims.reduce((acc, c) => acc + (c.quantity || 0), 0);
  const totalMealsRescued = Math.round(totalVolumeKg * 2.5);

  // Search & Filter
  const filteredClaims = claims.filter((claim) => {
    const isConf = claim.isConfirmed || claim.deliveryStatus === "confirmed";
    const matchesFilter = (() => {
      if (filter === "active") return !isConf;
      if (filter === "confirmed") return isConf;
      return true;
    })();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      claim.itemName?.toLowerCase().includes(q) ||
      claim.institutionName?.toLowerCase().includes(q) ||
      claim.pickupLocation?.address?.toLowerCase().includes(q) ||
      claim.deliveryStatus?.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Claimed Surplus Food Batches
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Claims Ledger Active
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Real-time tracking of reserved batches, driver allocation, GPS dispatch telemetry, and digital delivery confirmations.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {totalClaimedBatches} Claimed Batches
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              FSSAI Verified Handoff
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Impact Credited Instantly
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <button
            onClick={() => fetchClaims(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Refresh active claims"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-stone-600 shrink-0 ${
                isRefreshing ? "animate-spin text-emerald-600" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <Link
            href="/app/ngo/impact"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Impact Ledger</span>
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

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 shadow-2xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Food Dropped Off / Awaiting Receipt Action Banner */}
      {awaitingReceiptBatches.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/80 bg-gradient-to-r from-emerald-50 via-emerald-50/50 to-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-stone-900">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <PackageCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif font-bold text-base sm:text-lg text-emerald-950">
                  Food Dropped Off by Delivery Partner!
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-700 text-white shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  Receipt Available Now ({awaitingReceiptBatches.length})
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
                The delivery partner has arrived and dropped off the food at your center. Please inspect the items and click <strong>&quot;Accept Delivery Receipt&quot;</strong> in the table below to mark the food as successfully delivered.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - Confirmed Delivered */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Confirmed Received
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {confirmedCount}
            <span className="text-xs font-sans font-medium text-emerald-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Zero Waste Closed
            </span>
          </div>
        </div>

        {/* Card 2: Amber Theme - In Transit / Pending */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              {awaitingReceiptBatches.length > 0 ? "Awaiting Receipt / Active" : "In Transit / En Route"}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {inTransitCount}
            <span className="text-xs font-sans font-medium text-amber-800">active</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              {awaitingReceiptBatches.length > 0
                ? `${awaitingReceiptBatches.length} Dropped (Accept Receipt)`
                : "Awaiting Handoff"}
            </span>
          </div>
        </div>

        {/* Card 3: Blue Theme - Total Rescued Meals */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Total Meals Rescued
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {totalMealsRescued.toLocaleString()}
            <span className="text-xs font-sans font-medium text-blue-700">meals</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              ~{Math.round(totalVolumeKg)} kg Total Volume
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Total Batches Claimed */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Total Claims Reserved
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            {totalClaimedBatches}
            <span className="text-xs font-sans font-medium text-purple-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              Locked Exclusively
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Claims", count: totalClaimedBatches },
            { id: "active", label: "In Transit / Pending", count: inTransitCount },
            { id: "confirmed", label: "Confirmed Received", count: confirmedCount },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-3.5 py-1.5 text-xs rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? "bg-emerald-700 text-white font-semibold shadow-xs"
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-emerald-800 text-emerald-100 font-bold"
                      : "bg-stone-200/80 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims or donors..."
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
      </div>

      {/* 4. Claims Ledger Table */}
      {loading ? (
        <div className="py-24 text-center space-y-3 bg-white border border-stone-200/80 rounded-2xl">
          <div className="w-9 h-9 mx-auto border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs uppercase tracking-wider text-stone-500">
            Loading claimed batches ledger &amp; logistics telemetry...
          </p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <Ticket className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-stone-900">
              No surplus batches {filter !== "all" ? `in ${filter}` : ""} found
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No claims match "${searchQuery}". Try clearing your search query.`
                : "Browse active listings in the marketplace to lock and claim surplus batches for immediate dispatch and community distribution."}
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/app/ngo/browse"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <Ticket className="w-4 h-4 text-emerald-100" />
              <span>Browse Marketplace</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-stone-100 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Claimed Batches Ledger ({filteredClaims.length})
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Exclusively reserved surplus meals departing donor kitchen facilities
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>Real-Time Fleet Status</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 bg-stone-50/80 text-[11px] uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 font-sans font-semibold">Surplus Item</th>
                  <th className="py-3 px-4 font-mono text-right font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-sans font-semibold">Donor Kitchen</th>
                  <th className="py-3 px-4 font-sans font-semibold">Pickup Window</th>
                  <th className="py-3 px-4 font-sans font-semibold">Logistics Status</th>
                  <th className="py-3 px-4 font-sans text-right font-semibold">Receipt Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-sans">
                {filteredClaims.map((claim) => {
                  const startDate = new Date(claim.pickupWindow.start);
                  const endDate = new Date(claim.pickupWindow.end);
                  const isConfirmed =
                    claim.isConfirmed || claim.deliveryStatus === "confirmed";
                  const isConfirming = confirmingId === claim._id;
                  const isMapOpen = !!openMapIds[claim._id];

                  return (
                    <React.Fragment key={claim._id}>
                      <tr className="hover:bg-stone-50/90 transition-colors">
                        {/* 1. Item Name & Category */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-900">
                            {claim.itemName}
                          </div>
                          <div className="text-[11px] text-stone-500 capitalize">
                            {claim.category.replace("_", " ")}
                          </div>
                        </td>

                        {/* 2. Quantity */}
                        <td className="py-3 px-4 font-mono text-right font-bold text-stone-900 whitespace-nowrap">
                          <div>
                            {claim.quantity}{" "}
                            <span className="text-xs font-sans font-normal text-stone-500">
                              {claim.unit}
                            </span>
                          </div>
                          {isPiecesUnit(claim.unit) && (
                            <div className="text-[11px] font-sans font-medium text-emerald-700">
                              ~{calculatePiecesToPlates(claim.quantity, claim.unit, claim.category).plates} plates
                            </div>
                          )}
                        </td>

                        {/* 3. Donor Kitchen */}
                        <td className="py-3 px-4 text-xs">
                          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{claim.institutionName || "Verified Institution"}</span>
                          </div>
                          <div
                            className="text-stone-500 text-[11px] truncate max-w-[190px] flex items-center gap-1 mt-0.5"
                            title={claim.pickupLocation?.address}
                          >
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{claim.pickupLocation?.address || "Main Dispatch Bay"}</span>
                          </div>
                        </td>

                        {/* 4. Pickup Window */}
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          <div className="font-semibold text-stone-800">
                            {startDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            {startDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            until {endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </td>

                        {/* 5. Logistics Delivery Status */}
                        <td className="py-3 px-4">
                          {isConfirmed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Delivered &amp; Receipt Accepted
                            </span>
                          ) : claim.deliveryStatus === "delivered" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-400 shadow-2xs">
                              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                              Food Dropped Off — Accept Receipt Below
                            </span>
                          ) : claim.deliveryStatus === "picked_up" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                              <Truck className="w-3.5 h-3.5 text-blue-600" />
                              In Transit to Your Center
                            </span>
                          ) : claim.deliveryStatus === "accepted" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Driver Assigned (En Route to Kitchen)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                              Assigning Fleet Courier...
                            </span>
                          )}

                          {claim.courier && (
                            <div className="mt-1.5 text-[11px] text-stone-600 space-y-0.5 font-mono">
                              <div className="font-semibold text-stone-900 flex items-center gap-1">
                                <span>{claim.courier.name}</span>
                                {claim.courier.vehicleNumber && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-50 text-stone-900 font-bold border border-amber-300 text-[10px] tracking-wider ml-1">
                                    🚘 {claim.courier.vehicleNumber}
                                  </span>
                                )}
                              </div>
                              {claim.courier.phone && (
                                <div>
                                  <a href={`tel:${claim.courier.phone}`} className="text-emerald-700 hover:underline">
                                    📞 {claim.courier.phone}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 6. Receipt Confirmation Action */}
                        <td className="py-3 px-4 text-right">
                          {isConfirmed ? (
                            <div className="text-xs text-emerald-800 font-semibold flex items-center justify-end gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Successfully Delivered &amp; Verified</span>
                              {claim.confirmedAt && (
                                <span className="text-[10px] text-stone-400 font-mono block ml-1">
                                  ({new Date(claim.confirmedAt).toLocaleDateString()})
                                </span>
                              )}
                            </div>
                          ) : claim.deliveryStatus === "delivered" ? (
                            /* RECEIPT OPTION AVAILABLE ONLY AFTER DELIVERY PARTNER DROPS THE FOOD */
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => toggleMap(claim._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                              >
                                <Route className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isMapOpen ? "Hide Map" : "View Map 🗺️"}</span>
                                {isMapOpen ? (
                                  <ChevronUp className="w-3 h-3 text-stone-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-stone-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleConfirmReceipt(claim._id)}
                                disabled={isConfirming}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-60 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap ring-2 ring-emerald-500/40"
                              >
                                {isConfirming ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Accepting Receipt...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                                    <span>Accept Delivery Receipt ✓</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            /* BEFORE FOOD IS DROPPED OFF: RECEIPT BUTTON IS NOT AVAILABLE YET */
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => toggleMap(claim._id)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:text-emerald-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                              >
                                <Route className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isMapOpen ? "Hide Map" : "View Map 🗺️"}</span>
                                {isMapOpen ? (
                                  <ChevronUp className="w-3 h-3 text-stone-400" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-stone-400" />
                                )}
                              </button>
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-100/90 border border-stone-200 text-stone-500 text-[11px] font-mono whitespace-nowrap"
                                title="Receipt button will become available once the delivery partner drops off the food at your center"
                              >
                                <Clock className="w-3 h-3 text-stone-400" />
                                <span>Receipt opens after drop-off</span>
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Interactive Route Map Row */}
                      {isMapOpen && (
                        <tr className="bg-stone-50/50">
                          <td colSpan={6} className="p-4 border-b border-stone-200">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-stone-600 flex-wrap gap-2">
                                <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                                  <Route className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Redistribution Route &amp; Pickup Bay Coordinates</span>
                                </span>
                                {claim.courier && (
                                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 border border-stone-200 text-xs font-mono">
                                    <span className="text-stone-900 font-semibold">{claim.courier.name}</span>
                                    <span>·</span>
                                    <a href={`tel:${claim.courier.phone}`} className="text-emerald-700 font-semibold hover:underline">
                                      📞 {claim.courier.phone}
                                    </a>
                                    {claim.courier.vehicleNumber && (
                                      <>
                                        <span>·</span>
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-stone-900 font-bold border border-amber-300 text-[10px] tracking-wider">
                                          🚘 {claim.courier.vehicleNumber}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                )}
                                <span className="font-mono text-[11px] text-stone-500">
                                  Direct Dispatch Telemetry
                                </span>
                              </div>
                              {/* Live Food Delivery Tracking Alert (Zomato/Swiggy style for NGO) */}
                              {(claim.deliveryStatus === "accepted" || claim.deliveryStatus === "picked_up" || claim.deliveryStatus === "delivered") && (() => {
                                const vConfig = getVehicleConfig(claim.courier?.vehicleType);
                                const etas = calculateDeliveryEtas(claim.deliveryStatus, 18);
                                const isDelivered = claim.deliveryStatus === "delivered";

                                return (
                                  <div className={`p-3.5 rounded-xl border text-xs space-y-2.5 shadow-2xs ${
                                    isDelivered
                                      ? "bg-emerald-50/95 border-emerald-300 text-stone-900"
                                      : "bg-emerald-50/90 border-emerald-200 text-stone-900"
                                  }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <span className="relative flex h-3 w-3 shrink-0">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                        </span>
                                        <div>
                                          <div className="font-bold text-stone-900 text-sm flex items-center gap-2">
                                            <span>{isDelivered ? "📦" : vConfig.emoji}</span>
                                            <span>
                                              {isDelivered
                                                ? "Food Dropped Off at Your Center! Ready for Receipt Acceptance"
                                                : claim.deliveryStatus === "accepted"
                                                ? `Driver En Route to Donor Kitchen (${vConfig.label})`
                                                : `Food En Route to Your Shelter! (${vConfig.label})`}
                                            </span>
                                          </div>
                                          <div className="text-xs text-stone-600 mt-0.5">
                                            <span className="font-medium text-stone-800">{claim.courier?.name || "Assigned Driver"}</span>
                                            {claim.courier?.vehicleNumber ? ` • Plate: ${claim.courier.vehicleNumber}` : ""}
                                            {" • Bringing "}
                                            <strong className="text-stone-800">{claim.itemName} ({formatFoodQuantity(claim.quantity, claim.unit, claim.category)})</strong>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                                        {claim.courier?.phone && (
                                          <a
                                            href={`tel:${claim.courier.phone}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-semibold shadow-xs transition-colors"
                                          >
                                            📞 Call Driver: {claim.courier.phone}
                                          </a>
                                        )}
                                        {isDelivered && !isConfirmed && (
                                          <button
                                            onClick={() => handleConfirmReceipt(claim._id)}
                                            disabled={isConfirming}
                                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                          >
                                            {isConfirming ? "Accepting..." : "Accept Receipt Now ✓"}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Estimated Timings of Pickup & Drop-Off */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 font-mono text-[11px]">
                                      <div className="bg-white/90 p-2 rounded border border-emerald-100">
                                        <div className="text-stone-500 text-[10px]">📍 Pickup from Kitchen:</div>
                                        <div className="font-bold text-emerald-800 text-xs">
                                          Collected from Kitchen ✓
                                        </div>
                                      </div>
                                      <div className="bg-white/90 p-2 rounded border border-emerald-100">
                                        <div className="text-stone-500 text-[10px]">🎯 Arrival at Shelter:</div>
                                        <div className={`font-bold text-xs ${isDelivered ? "text-emerald-800 font-extrabold" : "text-emerald-700"}`}>
                                          {isDelivered ? "Delivered at Shelter ✓ (Accept Receipt)" : `${etas.dropClockTime} (~${etas.dropMins}m away)`}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-white">
                                <DeliveryRouteMap
                                  pickup={{
                                    name: claim.institutionName || "Donor Kitchen",
                                    address: claim.pickupLocation?.address || "Main Dispatch Gate",
                                    lat: claim.pickupLocation?.lat,
                                    lng: claim.pickupLocation?.lng,
                                  }}
                                  drop={{
                                    name: "Your Receiving Center",
                                    address: "Registered NGO Center",
                                    lat: claim.pickupLocation?.lat
                                      ? claim.pickupLocation.lat - 0.03
                                      : 28.58,
                                    lng: claim.pickupLocation?.lng
                                      ? claim.pickupLocation.lng + 0.035
                                      : 77.24,
                                  }}
                                  status={claim.deliveryStatus}
                                  courierLocation={claim.currentLocation}
                                  courierInfo={claim.courier}
                                  role="ngo"
                                  theme="light"
                                  className="w-full h-72 sm:h-80"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-stone-100 bg-stone-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
            <div className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>
                Confirming delivery closes the chain of custody and logs verified meals directly to your NGO impact report.
              </span>
            </div>
            <div className="font-mono text-[11px] text-stone-400">
              ZeroPlate NGO Claims Engine
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
