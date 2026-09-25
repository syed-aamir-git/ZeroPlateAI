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
  Activity,
  Route,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import type { AdminMapFacility } from "@/components/maps/admin-command-map";

// Dynamic import with ssr: false to prevent Leaflet SSR issues
const AdminCommandMap = dynamic(
  () => import("@/components/maps/admin-command-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 sm:h-96 rounded-2xl bg-[#3D2538] border border-[#5A3653] flex flex-col items-center justify-center gap-3 text-xs font-mono text-[#C9B9C7]">
        <div className="w-8 h-8 rounded-full border-2 border-[#D9A441] border-t-transparent animate-spin" />
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

interface AuditEvent {
  _id: string;
  entityType: string;
  action: string;
  ruleApplied?: string;
  status?: string;
  createdAt: string;
  details?: Record<string, any>;
}

// Convert technical event names to plain, simple English
function formatEventAction(action: string): string {
  const map: Record<string, string> = {
    surplus_listed: "Surplus Food Donated",
    surplus_claimed: "Charity Claimed Food",
    delivery_assigned: "Delivery Driver Assigned",
    delivery_accepted: "Driver Accepted Delivery",
    delivery_picked_up: "Food Picked Up from Kitchen",
    delivery_completed: "Food Delivered to Shelter",
    kyc_approved: "Charity Account Approved",
    kyc_submitted: "New Charity KYC Submitted",
    kyc_rejected: "Charity KYC Rejected",
    safety_gating_passed: "Food Passed Safety Inspection",
    safety_gating_failed: "Food Blocked (Safety Risk)",
  };
  return map[action] || action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Convert technical status names to friendly labels
function formatDeliveryStatus(status: string, hasCourier: boolean) {
  if (status === "assigned" && !hasCourier) {
    return {
      label: "Looking for Driver",
      color: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      dot: "bg-amber-400 animate-pulse",
    };
  }
  switch (status) {
    case "accepted":
      return {
        label: "Driver on the Way",
        color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
        dot: "bg-blue-400",
      };
    case "picked_up":
      return {
        label: "Food in Transit",
        color: "bg-purple-500/20 text-purple-300 border-purple-500/40",
        dot: "bg-purple-400 animate-pulse",
      };
    case "confirmed":
    case "delivered":
      return {
        label: "Safely Delivered",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        dot: "bg-emerald-400",
      };
    default:
      return {
        label: status.replace(/_/g, " "),
        color: "bg-stone-500/20 text-stone-300 border-stone-500/40",
        dot: "bg-stone-400",
      };
  }
}

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = React.useState<AdminMetrics | null>(null);
  const [recentLogs, setRecentLogs] = React.useState<AuditEvent[]>([]);
  const [dispatches, setDispatches] = React.useState<DispatchItem[]>([]);
  const [facilities, setFacilities] = React.useState<AdminMapFacility[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [lastRefreshed, setLastRefreshed] = React.useState<Date>(new Date());
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
        setRecentLogs(json.recentLogs || []);
        setDispatches(json.dispatches || []);
        setFacilities(json.facilities || []);
        setLastRefreshed(new Date());
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
    }, 15000);

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
        <div className="w-12 h-12 rounded-2xl bg-[#4A2E44] border border-[#5A3653] mx-auto flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-[#D9A441] border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-[#F3EEE2]">
            Loading Live Operations Center
          </h3>
          <p className="text-xs text-[#C9B9C7]">
            Connecting to MongoDB and calculating city-wide food redistribution statistics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left">
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#5A3653] pb-5">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Network Active
            </span>
            <span className="text-xs font-mono text-[#C9B9C7] hidden sm:inline">
              Auto-syncs every 15s
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#F3EEE2] mt-1.5 tracking-tight">
            Platform Overview &amp; Live Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#C9B9C7] mt-1 max-w-2xl leading-relaxed">
            Welcome to the ZeroPlate control center. Track surplus food donations, active charity deliveries, logistics partners, and community meals in real time.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* KYC Review Alert Button */}
          <Link
            href="/app/admin/ngo-verification"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-100" />
            <span>Review Pending Charities ({metrics?.pendingKycCount || 0})</span>
          </Link>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isManualRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#3D2538] hover:bg-[#4A2E44] border border-[#5A3653] text-[#F3EEE2] text-xs font-medium transition-all cursor-pointer"
            title="Refresh statistics now"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#D9A441] ${
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
            <h2 className="font-display text-lg font-bold text-[#F3EEE2] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#D9A441]" />
              Community Network &amp; Participants
            </h2>
            <p className="text-xs text-[#C9B9C7]">
              The organizations and people actively rescuing food across your city.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Partner Kitchens (Amber Theme) */}
          <Link
            href="/app/admin/institutions"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-[#3D2538] to-[#2B1826] border border-amber-500/30 hover:border-amber-400/60 shadow-sm transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-mono font-bold">
                Food Donors
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30 shadow-2xs group-hover:bg-amber-500/30 transition-colors">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-[#F3EEE2]">
              {metrics?.institutionCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-[#F3EEE2]">
              Partner Kitchens
            </div>
            <div className="mt-0.5 text-[11px] text-[#C9B9C7] flex items-center justify-between">
              <span>Hotels, colleges &amp; hospitals</span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Charity & NGO Partners (Emerald Theme) */}
          <Link
            href="/app/admin/ngo-verification"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-[#3D2538] to-[#2B1826] border border-emerald-500/30 hover:border-emerald-400/60 shadow-sm transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-mono font-bold">
                Food Shelters
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shadow-2xs group-hover:bg-emerald-500/30 transition-colors">
                <HeartHandshake className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-[#F3EEE2]">
              {metrics?.ngoCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-[#F3EEE2]">
              Charity &amp; NGO Partners
            </div>
            <div className="mt-0.5 text-[11px] text-[#C9B9C7] flex items-center justify-between">
              <span className="text-[#86C29B]">
                {metrics?.pendingKycCount
                  ? `${metrics.pendingKycCount} awaiting review`
                  : "All verified & active"}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Delivery Drivers (Blue Theme) */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/15 via-[#3D2538] to-[#2B1826] border border-blue-500/30 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-blue-300 font-mono font-bold">
                Logistics Fleet
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-500/30 shadow-2xs">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-[#F3EEE2]">
              {metrics?.deliveryPartnerCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-[#F3EEE2]">
              Active Delivery Drivers
            </div>
            <div className="mt-0.5 text-[11px] text-[#C9B9C7]">
              Transporting food batches safely
            </div>
          </div>

          {/* Card 4: Total User Accounts (Purple Theme) */}
          <Link
            href="/app/admin/users"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/15 via-[#3D2538] to-[#2B1826] border border-purple-500/30 hover:border-purple-400/60 shadow-sm transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-purple-300 font-mono font-bold">
                Platform Access
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shadow-2xs group-hover:bg-purple-500/30 transition-colors">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 font-mono text-3xl font-extrabold text-[#F3EEE2]">
              {metrics?.totalUsersCount || 0}
            </div>
            <div className="mt-1 font-semibold text-xs text-[#F3EEE2]">
              Total Registered Users
            </div>
            <div className="mt-0.5 text-[11px] text-[#C9B9C7] flex items-center justify-between">
              <span>Chefs, NGOs &amp; Drivers</span>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. SUSTAINABILITY & COMMUNITY IMPACT METRICS */}
      <div className="space-y-3">
        <div className="border-b border-[#5A3653] pb-2">
          <h2 className="font-display text-lg font-bold text-[#F3EEE2] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#86C29B]" />
            Live Community Impact &amp; Food Saved
          </h2>
          <p className="text-xs text-[#C9B9C7]">
            Direct real-time results achieved by distributing extra food instead of letting it go to waste.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Impact 1: Surplus Food Listed */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600/10 via-[#3D2538] to-[#2B1826] border border-emerald-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-mono font-bold">
                Food Rescued
              </span>
              <PackageCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-2">
              {metrics?.totalListedKg || 0}{" "}
              <span className="text-xs font-sans text-[#C9B9C7] font-normal">kg</span>
            </div>
            <div className="text-xs font-semibold text-[#F3EEE2] pt-0.5">
              Total Food Donated
            </div>
            <div className="text-[11px] text-[#C9B9C7]">
              Passed food safety verification
            </div>
          </div>

          {/* Impact 2: Food Delivered to Shelters */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-600/10 via-[#3D2538] to-[#2B1826] border border-teal-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-teal-300 font-mono font-bold">
                Delivered
              </span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-teal-300 mt-2 flex flex-wrap items-baseline gap-1.5">
              <span>{metrics?.redistributedByUnit?.kg ?? metrics?.totalRedistributedKg ?? 0}</span>
              <span className="text-xs font-sans text-[#C9B9C7] font-normal">kg</span>
              {Boolean(metrics?.redistributedByUnit?.pieces) && (
                <span className="text-xs text-teal-200/80 font-normal">
                  + {metrics?.redistributedByUnit?.pieces} pcs
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-[#F3EEE2] pt-0.5">
              Received by Shelters
            </div>
            <div className="text-[11px] text-[#C9B9C7]">
              Distributed to verified beneficiaries
            </div>
          </div>

          {/* Impact 3: Free Meals Given */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-600/10 via-[#3D2538] to-[#2B1826] border border-amber-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-mono font-bold">
                Plates Served
              </span>
              <Utensils className="w-4 h-4 text-amber-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#D9A441] mt-2">
              {metrics?.mealsGiven ? metrics.mealsGiven.toLocaleString() : 0}
            </div>
            <div className="text-xs font-semibold text-[#F3EEE2] pt-0.5">
              Full Meals Provided
            </div>
            <div className="text-[11px] text-[#C9B9C7]">
              Based on standard 450g portions
            </div>
          </div>

          {/* Impact 4: CO2e Diverted */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-green-600/10 via-[#3D2538] to-[#2B1826] border border-green-500/30 shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-green-300 font-mono font-bold">
                Planet Protected
              </span>
              <Leaf className="w-4 h-4 text-green-400" />
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-green-400 mt-2">
              {metrics?.co2eAvoidedKg ? metrics.co2eAvoidedKg.toLocaleString() : 0}{" "}
              <span className="text-xs font-sans text-[#C9B9C7] font-normal">kg</span>
            </div>
            <div className="text-xs font-semibold text-[#F3EEE2] pt-0.5">
              CO₂ Emissions Prevented
            </div>
            <div className="text-[11px] text-[#C9B9C7]">
              Kept food waste out of landfills
            </div>
          </div>
        </div>
      </div>

      {/* 4. LIVE DELIVERY TRACKING & METROPOLITAN OPERATIONS MAP */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5A3653] pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F3EEE2] flex items-center gap-2">
              <Route className="w-5 h-5 text-[#D9A441]" />
              Live Deliveries &amp; City-Wide Tracking
            </h2>
            <p className="text-xs text-[#C9B9C7]">
              Real-time map showing where food is being picked up, driven, and dropped off right now.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#4A2E44] text-[#D9A441] border border-[#5A3653]">
              <span className="w-2 h-2 rounded-full bg-[#86C29B] animate-pulse" />
              {dispatches.length} Active Dispatches
            </span>
          </div>
        </div>

        {/* Map Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#C9B9C7] font-mono">
            <span>Metropolitan Live Operations: GPS routes connecting kitchens to charities</span>
            <span className="text-[#86C29B] font-semibold">{facilities.length} Verified Facilities</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-[#5A3653] shadow-md">
            <AdminCommandMap
              dispatches={dispatches}
              facilities={facilities}
              className="w-full h-80 sm:h-96"
            />
          </div>
        </div>

        {/* Delivery Runs Table */}
        {dispatches.length === 0 ? (
          <div className="border border-[#5A3653] bg-[#3D2538] rounded-2xl p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#4A2E44] border border-[#5A3653] mx-auto flex items-center justify-center text-[#D9A441]">
              <Route className="w-6 h-6" />
            </div>
            <div className="font-semibold text-[#F3EEE2] text-sm">
              No Delivery Runs Right Now
            </div>
            <p className="text-xs text-[#C9B9C7] max-w-md mx-auto">
              When a charity claims extra food from a kitchen, the delivery run and live driver status will appear here immediately.
            </p>
          </div>
        ) : (
          <div className="border border-[#5A3653] bg-[#3D2538] rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Food Item</th>
                  <th className="px-4 py-3 font-semibold">Pickup &amp; Drop-off</th>
                  <th className="px-4 py-3 font-semibold">Assigned Driver</th>
                  <th className="px-4 py-3 font-semibold">Delivery Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
                {dispatches.map((d) => {
                  const statusInfo = formatDeliveryStatus(d.status, Boolean(d.courier));
                  return (
                    <tr key={d._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                      {/* Food Item */}
                      <td className="px-4 py-3.5 font-medium text-[#F3EEE2]">
                        <div className="font-semibold text-sm">{d.itemName}</div>
                        <div className="text-xs text-[#D9A441] font-mono font-bold mt-0.5">
                          {d.quantity} {d.unit}
                        </div>
                      </td>

                      {/* Pickup & Destination */}
                      <td className="px-4 py-3.5 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#C9B9C7]">From:</span>
                          <span className="font-medium text-[#F3EEE2]">{d.institutionName}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#C9B9C7]">To:</span>
                          <span className="font-medium text-[#86C29B]">{d.ngoName}</span>
                        </div>
                      </td>

                      {/* Courier Information */}
                      <td className="px-4 py-3.5">
                        {d.courier ? (
                          <div className="space-y-1">
                            <div className="font-semibold text-[#F3EEE2] flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#86C29B]" />
                              <span>{d.courier.name}</span>
                              {d.courier.vehicleNumber && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/30">
                                  {d.courier.vehicleNumber}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#C9B9C7] capitalize">
                              {d.courier.vehicleType?.replace("_", " ")} · {d.courier.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Looking for nearby driver...
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3.5 font-mono text-right text-[#C9B9C7]">
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
        )}
      </div>

      {/* 5. RECENT ACTIVITY & SAFETY LOG */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#5A3653] pb-2">
          <div>
            <h2 className="font-display text-lg font-bold text-[#F3EEE2] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#86C29B]" />
              Recent Network Activity &amp; Safety Events
            </h2>
            <p className="text-xs text-[#C9B9C7]">
              Every safety check, food claim, and charity approval is permanently recorded.
            </p>
          </div>

          <Link
            href="/app/admin/audit-log"
            className="inline-flex items-center gap-1.5 text-xs text-[#D9A441] hover:text-[#F3EEE2] transition-colors font-semibold"
          >
            <span>View Full Activity Log ({metrics?.auditLogCount || 0} Events)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="p-8 text-center border border-[#5A3653] bg-[#3D2538] rounded-2xl text-xs text-[#C9B9C7]">
            No recent platform events recorded yet.
          </div>
        ) : (
          <div className="border border-[#5A3653] bg-[#3D2538] rounded-2xl overflow-x-auto shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#4A2E44] border-b border-[#5A3653] text-[#F3EEE2] uppercase font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Activity</th>
                  <th className="px-4 py-3 font-semibold">Participant Role</th>
                  <th className="px-4 py-3 font-semibold">Safety Rule Applied</th>
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                  <th className="px-4 py-3 font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5A3653] text-[#D4CBBF]">
                {recentLogs.map((log) => {
                  const isSuccess =
                    log.status === "verified_safe" ||
                    log.status === "approved" ||
                    log.status === "confirmed" ||
                    log.status === "delivered";
                  const isBlocked = log.status === "rejected" || log.status === "blocked";

                  return (
                    <tr key={log._id} className="hover:bg-[#4A2E44]/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-[#F3EEE2]">
                        {formatEventAction(log.action)}
                      </td>
                      <td className="px-4 py-3 capitalize text-[#C9B9C7]">
                        {log.entityType?.replace(/_/g, " ") || "Platform"}
                      </td>
                      <td className="px-4 py-3 text-[#D9A441] font-mono">
                        {log.ruleApplied ? log.ruleApplied.replace(/_/g, " ") : "Standard Rule"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isSuccess
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : isBlocked
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-[#4A2E44] text-[#D9A441] border border-[#5A3653]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuccess ? "bg-emerald-400" : isBlocked ? "bg-red-400" : "bg-amber-400"
                            }`}
                          />
                          {log.status || "Completed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-[#C9B9C7]">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
