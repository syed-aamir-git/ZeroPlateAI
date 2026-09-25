"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Route,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  MapPin,
  RefreshCw,
  Search,
  X,
  Layers,
  ShieldCheck,
  Package,
  Ticket,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getVehicleConfig, calculateDeliveryEtas } from "@/components/maps/delivery-route-map";
import { formatFoodQuantity } from "@/lib/surplus-engine";

const DeliveryRouteMap = dynamic(
  () => import("@/components/maps/delivery-route-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-72 border border-stone-200 rounded-2xl bg-stone-50 flex items-center justify-center text-xs font-mono text-stone-400 animate-pulse">
        Loading route map telemetry...
      </div>
    ),
  }
);

interface DeliveryItem {
  _id: string;
  status: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
  };
  pickup?: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  drop?: {
    name: string;
    address: string;
    contactPhone?: string;
    lat?: number;
    lng?: number;
  };
  recipient: {
    name: string;
    serviceArea: string;
    contactPhone: string;
  };
  courier: {
    name?: string;
    vehicleType: string;
    vehicleNumber?: string;
    phone: string;
    serviceArea: string;
  } | null;
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
  } | null;
}

const STEPS = [
  { key: "assigned", label: "Allotted", desc: "Broadcast to network" },
  { key: "accepted", label: "Accepted", desc: "Driver assigned" },
  { key: "picked_up", label: "Picked Up", desc: "Food in transit" },
  { key: "delivered", label: "Delivered", desc: "Arrived at site" },
  { key: "confirmed", label: "Confirmed", desc: "Recipient verified" },
];

export default function InstitutionDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openMapIds, setOpenMapIds] = useState<Record<string, boolean>>({});

  const toggleMap = (id: string) => {
    setOpenMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Immediate, robust fetch logic without premature abort cancellations
  const fetchDeliveries = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }
    try {
      const res = await fetch("/api/v1/institution/deliveries");
      if (res.ok) {
        const data = await res.json();
        const items: DeliveryItem[] = data.deliveries || [];
        setDeliveries(items);

        // Auto-expand route map for any deliveries in transit/accepted
        setOpenMapIds((prev) => {
          const next = { ...prev };
          for (const d of items) {
            if (d.status === "accepted" || d.status === "picked_up") {
              if (next[d._id] === undefined) {
                next[d._id] = true;
              }
            }
          }
          return next;
        });
      }
    } catch (err: unknown) {
      console.warn("Failed to load deliveries:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Poll faster (every 5s) if there is an in-transit delivery to show live vehicle movement
  useEffect(() => {
    fetchDeliveries();

    const hasActiveDelivery = deliveries.some(
      (d) => d.status === "accepted" || d.status === "picked_up"
    );
    const pollInterval = hasActiveDelivery ? 5000 : 20000;

    const interval = setInterval(() => {
      fetchDeliveries();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [fetchDeliveries, deliveries]);

  const getStepIndex = (status: string) => {
    const idx = STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  // Compute live KPI metrics
  const activeDeliveries = deliveries.filter((d) => d.status !== "confirmed");
  const completedDeliveries = deliveries.filter((d) => d.status === "confirmed");
  const courierAssignedCount = deliveries.filter((d) => d.courier !== null).length;
  const partnerMatchRate =
    deliveries.length > 0
      ? Math.round((courierAssignedCount / deliveries.length) * 100)
      : 100;
  const totalVolumeKg = deliveries.reduce((acc, d) => acc + (d.item.quantity || 0), 0);

  // Search & Filter
  const filtered = deliveries.filter((d) => {
    const matchesFilter = (() => {
      if (filter === "active") return d.status !== "confirmed";
      if (filter === "completed") return d.status === "confirmed";
      return true;
    })();

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      d.item.name.toLowerCase().includes(q) ||
      d.recipient.name.toLowerCase().includes(q) ||
      (d.courier?.name || "").toLowerCase().includes(q) ||
      (d.courier?.vehicleNumber || "").toLowerCase().includes(q) ||
      d._id.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 px-2 sm:px-4 text-left">
      {/* 1. Header Bar with Operations Title & Fast Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 border-b border-stone-200/80 pb-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-bold tracking-tight">
              Active Surplus Deliveries
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Fleet Telemetry Active
            </span>
          </div>
          <p className="text-sm text-stone-600 mt-1 max-w-3xl leading-relaxed">
            Real-time logistics coordination, driver allocation, and automated verification for claimed surplus meals departing your facility.
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-stone-100 text-stone-700 border border-stone-200 whitespace-nowrap">
              <Layers className="w-3 h-3 text-stone-500" />
              {deliveries.length} Total Dispatches
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 whitespace-nowrap">
              <Route className="w-3 h-3 text-blue-600" />
              GPS Coordinates Synced
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              Zero-Waste Handoff
            </span>
          </div>
        </div>

        {/* Action Buttons - Well Organised, Single-line & Equal Height */}
        <div className="flex items-center gap-2.5 shrink-0 self-start xl:self-center flex-wrap">
          <button
            onClick={() => fetchDeliveries(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-700 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title="Refresh active deliveries data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-stone-600 shrink-0 ${
                isRefreshing ? "animate-spin text-emerald-600" : ""
              }`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
          <Link
            href="/app/institution/surplus-listings"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-stone-200/90 bg-white hover:bg-stone-50 active:scale-[0.98] text-stone-800 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Ticket className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Surplus Listings</span>
          </Link>
          <Link
            href="/app/institution/inventory"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-xs font-semibold shadow-2xs hover:shadow-xs transition-all whitespace-nowrap"
          >
            <Package className="w-4 h-4 text-emerald-100 shrink-0" />
            <span>Kitchen Ledger</span>
          </Link>
        </div>
      </div>

      {/* 2. 4 Vibrant Theme KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Emerald Theme - In Transit Dispatches */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border border-emerald-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-mono font-bold">
              Active In Transit
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-950 flex items-baseline gap-1.5">
            {activeDeliveries.length}
            <span className="text-xs font-sans font-medium text-emerald-700">batches</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
              Live Fleet Active
            </span>
            <span className="text-[11px] text-stone-500">en route</span>
          </div>
        </div>

        {/* Card 2: Blue Theme - Completed Handoffs */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 via-white to-blue-500/5 border border-blue-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-blue-800 font-mono font-bold">
              Verified Delivered
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shadow-2xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-stone-900 flex items-baseline gap-1.5">
            {completedDeliveries.length}
            <span className="text-xs font-sans font-medium text-blue-700">handoffs</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100/90 text-blue-800 border border-blue-200">
              Recipient Verified
            </span>
          </div>
        </div>

        {/* Card 3: Amber Theme - Driver Match Rate */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border border-amber-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-amber-800 font-mono font-bold">
              Fleet Match Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-amber-700 flex items-baseline gap-1.5">
            {partnerMatchRate}%
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100/90 text-amber-900 border border-amber-200">
              {courierAssignedCount} Drivers Assigned
            </span>
          </div>
        </div>

        {/* Card 4: Violet Theme - Total Volume Transported */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 border border-purple-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-purple-800 font-mono font-bold">
              Total Volume Moved
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 font-mono text-2xl sm:text-3xl font-extrabold text-purple-900 flex items-baseline gap-1.5">
            {Math.round(totalVolumeKg)}
            <span className="text-xs font-sans font-medium text-purple-700">kg</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100/90 text-purple-900 border border-purple-200">
              Zero Waste Impact
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white border border-stone-200/90 p-2.5 rounded-2xl shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: "all", label: "All Deliveries", count: deliveries.length },
            { id: "active", label: "In Transit", count: activeDeliveries.length },
            { id: "completed", label: "Completed Handoffs", count: completedDeliveries.length },
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
        <div className="relative shrink-0 w-full lg:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by dish, recipient, ID..."
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

      {/* 4. Deliveries List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="border border-stone-200 bg-white p-6 rounded-2xl space-y-5 animate-pulse shadow-xs"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 border-b border-stone-100 pb-4">
                <div className="space-y-2">
                  <div className="h-3 w-28 bg-stone-200 rounded" />
                  <div className="h-5 w-48 bg-stone-200 rounded" />
                  <div className="h-3 w-64 bg-stone-100 rounded" />
                </div>
                <div className="h-14 w-40 bg-stone-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-5 gap-2 py-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <div key={s} className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 rounded-full bg-stone-200" />
                    <div className="h-2 w-14 bg-stone-100 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-stone-200 bg-white p-12 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 border border-stone-200/80 mx-auto flex items-center justify-center text-stone-500 shadow-2xs">
            <Route className="w-7 h-7 text-stone-400" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              No Deliveries {filter !== "all" ? `in ${filter}` : ""} Found
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No dispatches match "${searchQuery}". Try clearing your search query.`
                : "When an approved NGO partner claims your published surplus batch, delivery coordination begins and live GPS progress appears here."}
            </p>
          </div>
          <div className="pt-1">
            <Link
              href="/app/institution/surplus-listings"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
            >
              <span>View Surplus Listings</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((d) => {
            const currentStepIdx = getStepIndex(d.status);
            const isMapOpen = !!openMapIds[d._id];

            return (
              <div
                key={d._id}
                className="border border-stone-200 bg-white p-5 sm:p-7 rounded-2xl space-y-6 shadow-xs hover:shadow-md transition-shadow"
              >
                {/* Delivery Header Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-md border border-stone-200">
                        DISPATCH #{d._id.slice(-6).toUpperCase()}
                      </span>
                      {d.status === "confirmed" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Confirmed Delivered
                        </span>
                      ) : d.status === "delivered" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Arrived at Site
                        </span>
                      ) : d.status === "picked_up" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          In Transit
                        </span>
                      ) : d.status === "accepted" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Driver Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                          Allotted to Fleet
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 mt-2">
                      {d.item.name} ·{" "}
                      <span className="font-mono text-emerald-700">
                        {formatFoodQuantity(d.item.quantity, d.item.unit, d.item.category)}
                      </span>
                    </h3>

                    <div className="flex items-center gap-2 mt-1 text-xs text-stone-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Recipient: <strong className="text-stone-900">{d.recipient.name}</strong>
                        </span>
                      </div>
                      <span className="text-stone-300">·</span>
                      <span className="text-stone-500">{d.recipient.serviceArea}</span>
                      {d.recipient.contactPhone && (
                        <>
                          <span className="text-stone-300">·</span>
                          <a
                            href={`tel:${d.recipient.contactPhone}`}
                            className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {d.recipient.contactPhone}
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Courier Partner Info Card */}
                  <div className="shrink-0 text-left sm:text-right">
                    {d.courier ? (
                      <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 text-left space-y-1 shadow-2xs min-w-[200px]">
                        <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Assigned Courier
                        </span>
                        <div className="font-semibold text-stone-900 text-xs flex items-center justify-between gap-2">
                          <span>{d.courier.name || "Delivery Partner"}</span>
                          {d.courier.vehicleNumber && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-stone-900 font-mono text-[10px] font-bold tracking-wider border border-amber-300 shadow-2xs">
                              {d.courier.vehicleNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 capitalize flex items-center gap-1">
                          <Truck className="w-3 h-3 text-stone-400" />
                          <span>{d.courier.vehicleType.replace("_", " ")}</span>
                        </div>
                        <a
                          href={`tel:${d.courier.phone}`}
                          className="font-mono text-emerald-700 hover:text-emerald-800 text-[11px] font-semibold flex items-center gap-1 pt-0.5"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {d.courier.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-amber-50 text-amber-900 border border-amber-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Matching nearby courier driver...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5-Stage Step-by-Step Logistics Stepper with Connected Bar */}
                <div className="py-2">
                  <div className="relative">
                    {/* Background Progress Track */}
                    <div className="absolute top-4 left-6 right-6 h-1 bg-stone-200 -z-0" />
                    {/* Active Progress Track */}
                    <div
                      className="absolute top-4 left-6 h-1 bg-emerald-600 transition-all duration-500 -z-0"
                      style={{
                        width: `${Math.min(100, Math.max(0, (currentStepIdx / (STEPS.length - 1)) * 100))}%`,
                      }}
                    />

                    <div className="grid grid-cols-5 gap-2 relative z-10">
                      {STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="text-center space-y-2 flex flex-col items-center">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all shadow-xs ${
                                isDone
                                  ? "bg-emerald-700 text-white"
                                  : "border-2 border-stone-300 bg-white text-stone-400"
                              } ${
                                isCurrent
                                  ? "ring-4 ring-emerald-500/20 border-emerald-600 font-extrabold scale-110"
                                  : ""
                              }`}
                            >
                              {isDone ? <CheckCircle2 className="w-4 h-4 text-white" /> : idx + 1}
                            </div>
                            <div>
                              <span
                                className={`font-semibold text-xs block ${
                                  isDone ? "text-stone-900" : "text-stone-400"
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[10px] text-stone-500 hidden sm:block">
                                {step.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Interactive Leaflet Route Map Accordion */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleMap(d._id)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-emerald-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                    >
                      <Route className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isMapOpen ? "Hide Live Route Map" : "Track Live Route on Map 🗺️"}</span>
                      {isMapOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                      )}
                    </button>
                    {isMapOpen && (
                      <span className="text-[11px] font-mono text-stone-400">
                        Interactive GPS Telemetry
                      </span>
                    )}
                  </div>

                  {/* Live Food Delivery Tracking Alert for In-Transit Dispatches */}
                  {(d.status === "accepted" || d.status === "picked_up") && (() => {
                    const vConfig = getVehicleConfig(d.courier?.vehicleType);
                    const etas = calculateDeliveryEtas(d.status, 18);

                    return (
                      <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs space-y-2 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-3 w-3 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <div>
                              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                                <span>{vConfig.emoji}</span>
                                <span>
                                  {d.status === "accepted"
                                    ? `Driver Arriving for Pickup (${vConfig.label})`
                                    : `Surplus Batch In Transit to NGO (${vConfig.label})`}
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-600 mt-0.5">
                                <span className="font-medium text-stone-800">{d.courier?.name || "Assigned Driver"}</span>
                                {d.courier?.vehicleNumber ? ` • Plate: ${d.courier.vehicleNumber}` : ""}
                                <span> • {vConfig.modelDesc}</span>
                              </div>
                            </div>
                          </div>

                          {d.courier?.phone && (
                            <a
                              href={`tel:${d.courier.phone}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-mono text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto shrink-0"
                            >
                              📞 Call Driver
                            </a>
                          )}
                        </div>

                        {/* Estimated Pickup & Drop-Off Timings */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 font-mono text-[11px]">
                          <div className="bg-white/90 p-2 rounded border border-emerald-100">
                            <div className="text-stone-500 text-[10px]">📍 Est. Kitchen Pickup:</div>
                            <div className="font-bold text-amber-700 text-xs">
                              {etas.isPickupDone ? "Collected ✓" : `${etas.pickupClockTime} (~${etas.pickupMins}m away)`}
                            </div>
                          </div>
                          <div className="bg-white/90 p-2 rounded border border-emerald-100">
                            <div className="text-stone-500 text-[10px]">🎯 Est. NGO Drop-off:</div>
                            <div className="font-bold text-emerald-700 text-xs">
                              {etas.isDropDone ? "Delivered ✓" : `${etas.dropClockTime} (~${etas.dropMins}m away)`}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {isMapOpen && (
                    <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xs animate-in fade-in duration-200">
                      <DeliveryRouteMap
                        pickup={
                          d.pickup || {
                            name: "Your Kitchen Facility",
                            address: "Main Dispatch Bay",
                            lat: 28.6139,
                            lng: 77.209,
                          }
                        }
                        drop={
                          d.drop || {
                            name: d.recipient.name,
                            address: d.recipient.serviceArea,
                            contactPhone: d.recipient.contactPhone,
                            lat: 28.58,
                            lng: 77.24,
                          }
                        }
                        status={d.status}
                        courierLocation={d.currentLocation}
                        courierInfo={d.courier}
                        role="institution"
                        theme="light"
                        className="w-full h-72 sm:h-80"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
