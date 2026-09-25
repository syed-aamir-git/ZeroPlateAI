"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Building2,
  HeartHandshake,
  Truck,
  Users,
  Utensils,
  Leaf,
  PackageCheck,
  CheckCircle2,
  MapPin,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Route,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import type { AdminMapFacility } from "@/components/maps/admin-command-map";
import { formatFoodQuantity } from "@/lib/surplus-engine";

// Dynamic import with ssr: false to prevent Leaflet SSR issues
const AdminCommandMap = dynamic(
  () => import("@/components/maps/admin-command-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 sm:h-96 rounded-2xl bg-white border border-stone-200/90 flex flex-col items-center justify-center gap-3 text-xs font-mono text-stone-500 shadow-xs">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
        <span>Loading City Dispatch Operations Map...</span>
      </div>
    ),
  }
);

interface AdminMetrics {
  institutionCount: number;
  ngoCount: number;
  pendingKycCount: number;
  deliveryPartnerCount: number;
  totalUsersCount: number;
  totalListedKg: number;
  totalRedistributedKg: number;
  redistributedByUnit?: {
    kg: number;
    pieces: number;
    litres: number;
  };
  mealsGiven: number;
  co2eAvoidedKg: number;
  auditLogCount: number;
}

interface DispatchItem {
  _id: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  itemName: string;
  quantity: number;
  unit: string;
  category?: string;
  institutionName: string;
  ngoName: string;
  pickupLocation?: { lat?: number; lng?: number; address?: string };
  dropLocation?: { lat?: number; lng?: number; address?: string };
  courier: {
    name: string;
    phone: string;
    vehicleType: string;
    vehicleNumber?: string;
  } | null;
}



// Convert technical status names to friendly labels with luxury badge styling
function formatDeliveryStatus(status: string, hasCourier: boolean) {
  if (status === "assigned" && !hasCourier) {
    return {
      label: "Looking for Driver",
      color: "bg-amber-50 text-amber-800 border-amber-200",
      icon: Clock,
      iconColor: "text-amber-600 animate-pulse",
    };
  }
  switch (status) {
    case "accepted":
      return {
        label: "Driver on the Way",
        color: "bg-blue-50 text-blue-800 border-blue-200",
        icon: Truck,
        iconColor: "text-blue-600",
      };
    case "picked_up":
      return {
        label: "Food in Transit",
        color: "bg-purple-50 text-purple-800 border-purple-200",
        icon: Truck,
        iconColor: "text-purple-600 animate-pulse",
      };
    case "confirmed":
    case "delivered":
      return {
        label: "Safely Delivered",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
        iconColor: "text-emerald-600",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        color: "bg-stone-50 text-stone-800 border-stone-200",
        icon: PackageCheck,
        iconColor: "text-stone-500",
      };
  }
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = React.useState<AdminMetrics | null>(null);
  const [dispatches, setDispatches] = React.useState<DispatchItem[]>([]);
  const [facilities, setFacilities] = React.useState<AdminMapFacility[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isManualRefreshing, setIsManualRefreshing] = React.useState(false);

  const isFetchingRef = React.useRef(false);

  const fetchOverview = React.useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/v1/admin/overview", { signal });
      const json = await res.json();
      if (res.ok) {
        setMetrics(json.metrics);
        setDispatches(json.dispatches || []);
        setFacilities(json.facilities || []);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.warn("Admin overview sync paused:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setIsManualRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    fetchOverview(abortController.signal);
    const interval = setInterval(() => {
      if (isMounted) {
        fetchOverview(abortController.signal);
      }
    }, 1000);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [fetchOverview]);

  const handleManualRefresh = () => {
    setIsManualRefreshing(true);
    fetchOverview();
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4 max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-sm mx-auto flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-lg font-bold text-zinc-900">
            Loading Live Operations Center
          </h3>
          <p className="text-xs text-zinc-500">
            Connecting to database and calculating city-wide food redistribution statistics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Live Network Active
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-zinc-900 mt-1.5 tracking-tight">
            Platform Overview &amp; Live Operations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl leading-relaxed">
            Real-time control center tracking surplus food donations, active charity deliveries, logistics partners, and community meals across the city.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* KYC Review Alert Button */}
          <Link
            href="/app/admin/ngo-verification"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-100" />
            <span>Review Pending Charities ({metrics?.pendingKycCount || 0})</span>
          </Link>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-200/90 text-zinc-700 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            title="Refresh statistics now"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${
                isManualRefreshing ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
        </div>
      </div>

      {/* 2. NETWORK PARTICIPANTS SECTION */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              Community Network &amp; Participants
            </h2>
            <p className="text-xs text-zinc-500">
              The organizations and people actively rescuing food across your city.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Partner Kitchens (Amber Theme) */}
          <Link
            href="/app/admin/institutions"
            className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-amber-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Food Donors
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200 shadow-2xs group-hover:bg-amber-200 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-zinc-900">
              {metrics?.institutionCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-zinc-800">
              Partner Kitchens
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Hotels, colleges &amp; hospitals</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Charity & NGO Partners (Emerald Theme) */}
          <Link
            href="/app/admin/ngo-verification"
            className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-emerald-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Food Shelters
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200 shadow-2xs group-hover:bg-emerald-200 transition-colors">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-zinc-900">
              {metrics?.ngoCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-zinc-800">
              Charity &amp; NGO Partners
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 flex items-center justify-between">
              <span className="text-emerald-700 font-medium">
                {metrics?.pendingKycCount
                  ? `${metrics.pendingKycCount} awaiting review`
                  : "All verified & active"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Delivery Drivers (Blue Theme) */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Logistics Fleet
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center border border-blue-200 shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-zinc-900">
              {metrics?.deliveryPartnerCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-zinc-800">
              Active Delivery Drivers
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500">
              Transporting food batches safely
            </div>
          </div>

          {/* Card 4: Total User Accounts (Purple Theme) */}
          <Link
            href="/app/admin/users"
            className="group relative overflow-hidden p-5 rounded-2xl bg-white border border-stone-200/90 hover:border-purple-300 shadow-[0_1px_3px_0_rgba(0,0,0,0.04),0_1px_2px_0_rgba(0,0,0,0.02)] hover:shadow-md transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Platform Access
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-200 shadow-2xs group-hover:bg-purple-200 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-zinc-900">
              {metrics?.totalUsersCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-zinc-800">
              Total Registered Users
            </div>
            <div className="mt-0.5 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Chefs, NGOs &amp; Drivers</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. SUSTAINABILITY & COMMUNITY IMPACT METRICS */}
      <div className="space-y-3">
        <div className="border-b border-stone-200 pb-2">
          <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Live Community Impact &amp; Food Saved
          </h2>
          <p className="text-xs text-zinc-500">
            Direct real-time results achieved by distributing extra food instead of letting it go to waste.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Impact 1: Surplus Food Listed */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-teal-500/5 border border-emerald-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Food Rescued
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2">
              {metrics?.totalListedKg || 0}{" "}
              <span className="text-xs font-sans text-zinc-500 font-normal">kg</span>
            </div>
            <div className="text-xs font-semibold text-zinc-800 pt-0.5">
              Total Food Donated
            </div>
            <div className="text-[11px] text-zinc-500">
              Passed food safety verification
            </div>
          </div>

          {/* Impact 2: Food Delivered to Shelters */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-500/10 via-white to-cyan-500/5 border border-teal-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-teal-800 bg-teal-100/70 border border-teal-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-700" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-2 flex flex-wrap items-baseline gap-1.5">
              <span>{metrics?.redistributedByUnit?.kg ?? metrics?.totalRedistributedKg ?? 0}</span>
              <span className="text-xs font-sans text-zinc-500 font-normal">kg</span>
              {Boolean(metrics?.redistributedByUnit?.pieces) && (
                <span className="text-xs text-teal-700 font-normal">
                  + {metrics?.redistributedByUnit?.pieces} pcs (~{Math.round((metrics?.redistributedByUnit?.pieces ?? 0) / 2)} plates)
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-zinc-800 pt-0.5">
              Received by Shelters
            </div>
            <div className="text-[11px] text-zinc-500">
              Distributed to verified beneficiaries
            </div>
          </div>

          {/* Impact 3: Free Meals Given */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-orange-500/5 border border-amber-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-amber-800 bg-amber-100/70 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Plates Served
              </span>
              <Utensils className="w-4 h-4 text-amber-700" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 mt-2">
              {metrics?.mealsGiven ? metrics.mealsGiven.toLocaleString() : 0}
            </div>
            <div className="text-xs font-semibold text-zinc-800 pt-0.5">
              Full Meals Provided
            </div>
            <div className="text-[11px] text-zinc-500">
              Based on standard 450g portions
            </div>
          </div>

          {/* Impact 4: CO2e Diverted */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 via-white to-emerald-500/5 border border-green-200/90 shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-green-800 bg-green-100/70 border border-green-200 px-2 py-0.5 rounded-full font-mono font-bold">
                Planet Protected
              </span>
              <Leaf className="w-4 h-4 text-green-700" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-green-700 mt-2">
              {metrics?.co2eAvoidedKg ? metrics.co2eAvoidedKg.toLocaleString() : 0}{" "}
              <span className="text-xs font-sans text-zinc-500 font-normal">kg</span>
            </div>
            <div className="text-xs font-semibold text-zinc-800 pt-0.5">
              CO₂ Emissions Prevented
            </div>
            <div className="text-[11px] text-zinc-500">
              Kept food waste out of landfills
            </div>
          </div>
        </div>
      </div>

      {/* 4. LIVE DELIVERY TRACKING & METROPOLITAN OPERATIONS MAP */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
          <div>
            <h2 className="font-serif text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Route className="w-5 h-5 text-emerald-700" />
              Live Deliveries &amp; City-Wide Tracking
            </h2>
            <p className="text-xs text-zinc-500">
              Real-time map showing where food is being picked up, driven, and dropped off right now.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              {dispatches.length} Active Dispatches
            </span>
            <Link
              href="/app/admin/food-items"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 text-stone-100 hover:bg-stone-800 hover:text-white border border-stone-800 shadow-xs transition-all group"
              title="Open full food items directory"
            >
              <Utensils className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>All Food Items</span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
            </Link>
          </div>
        </div>

        {/* Map Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Metropolitan Live Operations: GPS routes connecting kitchens to charities</span>
            <span className="text-emerald-700 font-semibold">{facilities.length} Verified Facilities</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm bg-white">
            <AdminCommandMap
              dispatches={dispatches}
              facilities={facilities}
              className="w-full h-80 sm:h-96"
            />
          </div>
        </div>

        {/* Delivery Runs Table */}
        {dispatches.length === 0 ? (
          <div className="border border-stone-200/90 bg-white rounded-2xl p-10 text-center space-y-2 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-stone-50 border border-stone-200 mx-auto flex items-center justify-center text-zinc-400">
              <Route className="w-6 h-6" />
            </div>
            <div className="font-semibold text-zinc-800 text-sm">
              No Delivery Runs Right Now
            </div>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              When a charity claims extra food from a kitchen, the delivery run and live driver status will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="border border-stone-200/90 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50/90 border-b border-stone-200 text-zinc-600 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Food Item</th>
                    <th className="px-4 py-3 font-semibold">Pickup &amp; Drop-off</th>
                    <th className="px-4 py-3 font-semibold">Assigned Driver</th>
                    <th className="px-4 py-3 font-semibold">Delivery Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-zinc-700">
                  {dispatches.slice(0, 4).map((d) => {
                    const statusInfo = formatDeliveryStatus(d.status, Boolean(d.courier));
                    return (
                      <tr key={d._id} className="hover:bg-stone-50/70 transition-colors">
                        {/* Food Item */}
                        <td className="px-4 py-3.5 font-medium text-zinc-900">
                          <div className="font-semibold text-sm">{d.itemName}</div>
                          <div className="text-xs text-amber-700 font-mono font-bold mt-0.5">
                            {formatFoodQuantity(d.quantity, d.unit, d.category || "general")}
                          </div>
                        </td>

                        {/* Pickup & Destination */}
                        <td className="px-4 py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-400">From:</span>
                            <span className="font-medium text-zinc-900">{d.institutionName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-zinc-400">To:</span>
                            <span className="font-medium text-emerald-800">{d.ngoName}</span>
                          </div>
                        </td>

                        {/* Courier Information */}
                        <td className="px-4 py-3.5">
                          {d.courier ? (
                            <div className="space-y-1">
                              <div className="font-semibold text-zinc-900 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                <span>{d.courier.name}</span>
                                {d.courier.vehicleNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[10px] border border-amber-300">
                                    {d.courier.vehicleNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 capitalize">
                                {d.courier.vehicleType?.replace("_", " ")} · {d.courier.phone}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Looking for nearby driver...
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {(() => {
                            const StatusIcon = statusInfo.icon;
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}
                              >
                                <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${statusInfo.iconColor}`} />
                                <span>{statusInfo.label}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-3.5 font-mono text-right text-zinc-500">
                          {new Date(d.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer with redirect to all food items */}
            <div className="px-4 py-3 bg-stone-50/90 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-zinc-500 font-medium">
                Showing <span className="font-bold text-zinc-900">{Math.min(dispatches.length, 4)}</span> latest food items of <span className="font-bold text-zinc-900">{dispatches.length}</span> total listings
              </div>
              <Link
                href="/app/admin/food-items"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs transition-all group"
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-200" />
                <span>View All Food Items Directory</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
