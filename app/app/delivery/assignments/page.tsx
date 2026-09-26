"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  RouteIcon,
  StampIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/icons/ledger-icons";
import {
  evaluateSurplusUrgency,
  calculatePiecesToPlates,
  isPiecesUnit,
  formatFoodQuantity,
} from "@/lib/surplus-engine";
import { Clock, Utensils, AlertTriangle, Star, CloudRain, Gauge } from "lucide-react";

import { getVehicleConfig, calculateDeliveryEtas } from "@/components/maps/delivery-route-map";

const DeliveryRouteMap = dynamic(
  () => import("@/components/maps/delivery-route-map"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-64 sm:h-72 border border-[#3B362E] rounded-[6px] bg-[#1D1B17] flex items-center justify-center text-xs font-mono-numeral text-[#9E9587] animate-pulse">
        Loading route map...
      </div>
    ),
  }
);

interface Assignment {
  _id: string;
  surplusListingId: string;
  status: "assigned" | "accepted" | "picked_up" | "delivered" | "confirmed";
  createdAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  confirmedAt?: string;
  isAssignedToMe: boolean;
  isOpenBroadcast?: boolean;
  item: {
    name: string;
    category: string;
    quantity: number;
    unit: string;
    pickupWindow: {
      start: string;
      end: string;
    } | null;
  };
  pickup: {
    name: string;
    address: string;
    lat?: number;
    lng?: number;
  };
  drop: {
    name: string;
    address: string;
    contactPhone?: string;
    lat?: number;
    lng?: number;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    updatedAt?: string;
  } | null;
}

interface PartnerInfo {
  _id: string;
  name?: string;
  phone: string;
  vehicleType: string;
  vehicleNumber?: string;
  serviceArea: string;
  active: boolean;
}

const LIFECYCLE_STAGES: Array<{
  id: Assignment["status"];
  label: string;
}> = [
  { id: "assigned", label: "Assigned" },
  { id: "accepted", label: "Accepted" },
  { id: "picked_up", label: "Picked Up" },
  { id: "delivered", label: "Delivered" },
  { id: "confirmed", label: "Confirmed" },
];

export default function DeliveryAssignmentsPage() {
  const [assignments, setAssignments] = React.useState<Assignment[]>([]);
  const [partner, setPartner] = React.useState<PartnerInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [justAdvancedStage, setJustAdvancedStage] = React.useState<{
    assignmentId: string;
    stage: string;
  } | null>(null);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [openMapIds, setOpenMapIds] = React.useState<Record<string, boolean>>({});

  const toggleMap = (id: string) => {
    setOpenMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sendLocationUpdate = React.useCallback(
    async (assignmentId: string, loc: { lat: number; lng: number; heading?: number; speed?: number }) => {
      try {
        await fetch(`/api/v1/delivery/assignments/${assignmentId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loc),
        });
      } catch (e) {
        console.warn("Failed to stream GPS location:", e);
      }
    },
    []
  );

  const isFetchingRef = React.useRef(false);

  const fetchAssignments = React.useCallback(async (signal?: AbortSignal) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch("/api/v1/delivery/assignments", { signal });
      if (res.ok) {
        const json = await res.json();
        const items: Assignment[] = json.assignments || [];
        setAssignments(items);
        if (json.partner) {
          setPartner(json.partner);
        }

        // Auto-expand route map for any active in-transit delivery assignments
        setOpenMapIds((prev) => {
          const next = { ...prev };
          for (const a of items) {
            if (a.status === "accepted" || a.status === "picked_up" || a.status === "delivered") {
              if (next[a._id] === undefined) {
                next[a._id] = true;
              }
            }
          }
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.warn("Delivery assignments sync paused:", err);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Poll assignments every 4 seconds if an active delivery is running, else 20 seconds
  React.useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    fetchAssignments(abortController.signal);

    const hasActiveMission = assignments.some(
      (a) => a.isAssignedToMe && (a.status === "accepted" || a.status === "picked_up" || a.status === "delivered")
    );
    const pollInterval = hasActiveMission ? 4000 : 20000;

    const interval = setInterval(() => {
      if (isMounted) {
        fetchAssignments(abortController.signal);
      }
    }, pollInterval);

    return () => {
      isMounted = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, [fetchAssignments, assignments]);

  // Real-time GPS Location streaming from driver device
  React.useEffect(() => {
    const active = assignments.find(
      (a) => a.isAssignedToMe && (a.status === "accepted" || a.status === "picked_up")
    );
    if (!active || typeof navigator === "undefined" || !("geolocation" in navigator)) return;

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        // Throttle to update every 4 seconds
        if (now - lastSent >= 4000) {
          lastSent = now;
          sendLocationUpdate(active._id, {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || undefined,
            speed: pos.coords.speed || undefined,
          });
        }
      },
      (err) => {
        console.warn("GPS watch position notice:", err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 4000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [assignments, sendLocationUpdate]);

  const handleAdvanceStatus = async (
    assignmentId: string,
    nextStatus: "accepted" | "picked_up" | "delivered"
  ) => {
    setFeedback(null);
    setUpdatingId(assignmentId);

    try {
      const res = await fetch(`/api/v1/delivery/assignments/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextStatus }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFeedback({
          type: "error",
          message: json.error || "Failed to update delivery status.",
        });
        return;
      }

      // Trigger the stamp-mark thunk animation on the new stage
      setJustAdvancedStage({
        assignmentId,
        stage: nextStatus,
      });

      setFeedback({
        type: "success",
        message: `Status updated: ${nextStatus.replace("_", " ").toUpperCase()}`,
      });

      // Refresh list
      fetchAssignments();
    } catch (err: unknown) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Error advancing status.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageIndex = (status: Assignment["status"]) => {
    return LIFECYCLE_STAGES.findIndex((s) => s.id === status);
  };

  // Sort assignments: 🔴 Critical Red items first, followed by active statuses, then completed
  const sortedAssignments = React.useMemo(() => {
    return [...assignments].sort((a, b) => {
      const urgencyA = evaluateSurplusUrgency({
        category: a.item.category,
        quantity: a.item.quantity,
        unit: a.item.unit,
        expiryDeadline: a.item.pickupWindow?.end || new Date(),
      });
      const urgencyB = evaluateSurplusUrgency({
        category: b.item.category,
        quantity: b.item.quantity,
        unit: b.item.unit,
        expiryDeadline: b.item.pickupWindow?.end || new Date(),
      });
      const rank: Record<string, number> = { critical_red: 3, urgent_yellow: 2, safe_green: 1 };
      const diff = (rank[urgencyB.urgencyTier] || 0) - (rank[urgencyA.urgencyTier] || 0);
      if (diff !== 0) return diff;

      // Active tasks before delivered/confirmed
      const isAActive = a.status !== "confirmed" && a.status !== "delivered";
      const isBActive = b.status !== "confirmed" && b.status !== "delivered";
      if (isAActive && !isBActive) return -1;
      if (!isAActive && isBActive) return 1;

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [assignments]);

  const criticalCount = React.useMemo(() => {
    return sortedAssignments.filter((a) => {
      const u = evaluateSurplusUrgency({
        category: a.item.category,
        quantity: a.item.quantity,
        unit: a.item.unit,
        expiryDeadline: a.item.pickupWindow?.end || new Date(),
      });
      return u.urgencyTier === "critical_red" && a.status !== "confirmed" && a.status !== "delivered";
    }).length;
  }, [sortedAssignments]);

  const activeMission = React.useMemo(() => {
    return assignments.find(
      (a) => a.isAssignedToMe && ["accepted", "picked_up", "delivered"].includes(a.status)
    );
  }, [assignments]);

  return (
    <div className="space-y-4 text-left">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#3B362E] pb-3 gap-2">
        <div>
          <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587]">
            {activeMission ? "Active Delivery Route (Locked to You)" : "Accepted by NGOs · Open to Deliver"}
          </span>
          <h1 className="font-display text-xl font-bold text-[#F3EEE2] mt-0.5">
            {activeMission ? "Active Delivery Mission" : "Available Delivery Dispatches"}
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {partner && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#24211C] border border-[#3B362E] text-xs font-mono-numeral">
              <span className="text-[#F3EEE2] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#86C29B]" />
                {partner.name || "Driver"}
              </span>
              <span className="text-[#9E9587]">·</span>
              <span className="text-[#D4CBBF]">📞 {partner.phone}</span>
              {partner.vehicleNumber && (
                <>
                  <span className="text-[#9E9587]">·</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 text-[11px] tracking-wider">
                    🚘 {partner.vehicleNumber}
                  </span>
                </>
              )}
            </div>
          )}
          <button
            onClick={() => {
              setLoading(true);
              fetchAssignments();
            }}
            className="text-xs text-[#D9A441] hover:underline font-mono-numeral cursor-pointer whitespace-nowrap"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-[6px] border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-[#2F4B3A]/20 border-[#2F4B3A] text-[#86C29B]"
              : "bg-clay-rust/20 border-clay-rust text-[#F4A88E]"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {/* Active Mission Locking Banner */}
      {activeMission && (
        <div className="p-3.5 rounded-[6px] border border-emerald-500/50 bg-emerald-950/30 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="font-bold text-emerald-300 block text-xs">
                ACTIVE DELIVERY IN PROGRESS · ORDER LOCKED TO YOU
              </span>
              <span className="text-[#D4CBBF] text-[11px]">
                {activeMission.status === "accepted"
                  ? "Navigate to donor kitchen to pick up food. All other orders are hidden until this trip finishes."
                  : activeMission.status === "picked_up"
                  ? "Food collected! En route to recipient NGO shelter. Hand over and wait for receipt confirmation."
                  : "Food dropped off at NGO! Waiting for NGO to verify receipt on their portal to finish this trip."}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-emerald-800 text-white font-mono text-[10px] font-bold uppercase tracking-wider self-start sm:self-auto shrink-0 border border-emerald-600">
            {activeMission.status.replace("_", " ")}
          </span>
        </div>
      )}

      {/* Critical Red Priority Alert Banner */}
      {criticalCount > 0 && (
        <div className="p-3.5 rounded-[6px] border border-red-500/40 bg-red-950/30 text-xs text-red-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-bold font-mono text-[10px] tracking-wide animate-pulse">
              RED DISPATCH ALERT
            </span>
            <span className="font-semibold text-red-300">
              {criticalCount} critical surplus batch{criticalCount > 1 ? "es have" : " has"} &lt; 2 hours remaining!
            </span>
            <span className="text-[#9E9587] hidden sm:inline">Prioritized at top of routing queue.</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-red-400">🔴 Critical Priority</span>
        </div>
      )}

      {/* Active Assignment Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="border border-[#3B362E] bg-[#1D1B17] rounded-[6px] p-4 space-y-4 animate-pulse"
            >
              <div className="flex items-start justify-between border-b border-[#3B362E] pb-3">
                <div className="space-y-2">
                  <div className="h-2.5 w-24 bg-[#3B362E] rounded" />
                  <div className="h-5 w-48 bg-[#3B362E] rounded" />
                  <div className="h-3 w-36 bg-[#3B362E]/60 rounded" />
                </div>
                <div className="h-6 w-16 bg-[#3B362E] rounded" />
              </div>
              <div className="space-y-2.5">
                <div className="h-14 bg-[#24211C] border border-[#3B362E] rounded-[6px]" />
                <div className="h-14 bg-[#24211C] border border-[#3B362E] rounded-[6px]" />
              </div>
              <div className="h-10 bg-[#24211C] border border-[#3B362E] rounded-[6px]" />
            </div>
          ))}
        </div>
      ) : sortedAssignments.length === 0 ? (
        <div className="border border-[#3B362E] bg-[#1D1B17] p-8 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#3B362E] bg-[#24211C] mx-auto flex items-center justify-center text-[#9E9587]">
            <RouteIcon size={24} />
          </div>
          <h2 className="font-display text-base font-medium text-[#F3EEE2]">
            No active delivery dispatches
          </h2>
          <p className="text-xs text-[#9E9587] leading-relaxed">
            When commercial kitchens mark surplus and recipient NGOs accept matching batches, pickup
            assignments in your area will appear here immediately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAssignments.map((assignment) => {
            const currentStageIdx = getStageIndex(assignment.status);
            const isUpdating = updatingId === assignment._id;
            const windowStart = assignment.item.pickupWindow?.start
              ? new Date(assignment.item.pickupWindow.start)
              : null;
            const windowEnd = assignment.item.pickupWindow?.end
              ? new Date(assignment.item.pickupWindow.end)
              : null;

            const urgency = evaluateSurplusUrgency({
              category: assignment.item.category,
              quantity: assignment.item.quantity,
              unit: assignment.item.unit,
              expiryDeadline: assignment.item.pickupWindow?.end || new Date(),
            });
            const plates = calculatePiecesToPlates(
              assignment.item.quantity,
              assignment.item.unit,
              assignment.item.category
            );
            const isRed = urgency.urgencyTier === "critical_red";
            const isYellow = urgency.urgencyTier === "urgent_yellow";
            const isActiveMission = assignment.status === "accepted" || assignment.status === "picked_up";

            return (
              <div
                key={assignment._id}
                className={`border ${
                  isRed
                    ? "border-red-500/70 shadow-lg shadow-red-950/40 ring-1 ring-red-500/30"
                    : isYellow
                    ? "border-amber-500/40"
                    : "border-[#3B362E]"
                } bg-[#1D1B17] rounded-[6px] p-4 space-y-4 transition-all`}
              >
                {/* Header: Item & Quantity */}
                <div className="flex items-start justify-between border-b border-[#3B362E] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono-numeral uppercase tracking-wider text-[#9E9587]">
                        {assignment.item.category.replace("_", " ")}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold border ${urgency.tierColor.bg} ${urgency.tierColor.text} ${urgency.tierColor.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${urgency.tierColor.dot} ${isRed ? "animate-ping" : ""}`} />
                        {isRed
                          ? "🔴 Critical Tier (<2h)"
                          : isYellow
                          ? "🟡 Urgent (2-6h)"
                          : "🟢 Safe Buffer"}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-[#F3EEE2] leading-snug mt-1">
                      {assignment.item.name}
                    </h3>

                    {assignment.status === "assigned" ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-mono-numeral font-bold bg-[#D9A441]/20 text-[#D9A441] border border-[#D9A441]/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D9A441] animate-pulse" />
                          BROADCAST TO ALL PARTNERS · OPEN TO ACCEPT
                        </span>
                        <span className="text-[10px] text-[#9E9587]">First to tap Accept secures order</span>
                      </div>
                    ) : assignment.isAssignedToMe ? (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono-numeral font-semibold bg-[#2F4B3A]/40 text-[#86C29B] border border-[#2F4B3A]">
                          ✓ Assigned to You
                        </span>
                        {partner && (
                          <span className="text-[10px] font-mono-numeral text-[#D4CBBF] flex items-center gap-1.5">
                            <span>Driver: <strong className="text-[#F3EEE2]">{partner.name || "You"}</strong></span>
                            <span>·</span>
                            <span>📞 {partner.phone}</span>
                            {partner.vehicleNumber && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30 text-[10px] tracking-wider ml-0.5">
                                🚘 {partner.vehicleNumber}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <div className="font-mono-numeral text-xl font-bold text-[#D9A441]">
                      {assignment.item.quantity}{" "}
                      <span className="text-xs font-normal text-[#9E9587]">{assignment.item.unit}</span>
                      {isPiecesUnit(assignment.item.unit) && (
                        <span className="text-xs font-normal text-[#86C29B] ml-1.5 whitespace-nowrap">
                          (~{plates.plates} plates)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#86C29B] font-semibold flex items-center gap-1 justify-end">
                      <Utensils className="w-3 h-3 text-[#86C29B]" />
                      ≈ {plates.plates} plates
                    </div>
                  </div>
                </div>

                {/* Multi-Factor Environmental & Route Conditions Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-[4px] bg-[#24211C] border border-[#3B362E] text-[11px] font-mono-numeral text-[#D4CBBF]">
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-[#D9A441]" />
                    <span>Traffic: <strong className="text-[#F3EEE2]">1.12x (Flowing)</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-[#86C29B]" />
                    <span>Weather: <strong className="text-[#F3EEE2]">Clear / Sealed</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-[#D9A441] fill-[#D9A441]" />
                    <span>Partner SLA: <strong className="text-[#86C29B]">⭐ 4.9 (98.4%)</strong></span>
                  </div>
                </div>

                {/* Active Mission Directive (Displayed during accepted or picked_up) */}
                {isActiveMission && (() => {
                  const vConfig = getVehicleConfig(partner?.vehicleType);
                  const missionEtas = calculateDeliveryEtas(assignment.status, 18);

                  return (
                    <div
                      className={`p-3.5 rounded-[8px] border text-xs space-y-2.5 ${
                        assignment.status === "accepted"
                          ? "bg-[#D9A441]/10 border-[#D9A441]/50 text-[#F3EEE2]"
                          : "bg-[#2F4B3A]/25 border-emerald-500/50 text-[#F3EEE2]"
                      }`}
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono-numeral text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span>{vConfig.emoji}</span>
                            <span>
                              {assignment.status === "accepted"
                                ? "Mission Phase 1: Proceed to Pickup Point"
                                : "Mission Phase 2: Proceed to NGO Drop-Off"}
                            </span>
                          </span>
                        </div>
                        <span className="text-[10px] font-mono-numeral text-stone-300 bg-[#1D1B17] px-2 py-0.5 rounded border border-[#3B362E] flex items-center gap-1">
                          <span>{vConfig.label}</span>
                          {partner?.vehicleNumber && <span className="text-amber-300">• {partner.vehicleNumber}</span>}
                        </span>
                      </div>

                      <div className="font-semibold text-sm">
                        {assignment.status === "accepted"
                          ? `Proceed to: ${assignment.pickup.name}`
                          : `Proceed to: ${assignment.drop.name}`}
                      </div>

                      {/* Estimated Times of Pickup & Drop-Off */}
                      <div className="grid grid-cols-2 gap-2 p-2 rounded bg-[#1D1B17]/90 border border-[#3B362E] font-mono-numeral text-[11px]">
                        <div>
                          <span className="text-[#9E9587] block text-[10px]">📍 Est. Pickup Time</span>
                          <span className="font-bold text-amber-300">
                            {missionEtas.isPickupDone ? "Collected ✓" : `${missionEtas.pickupClockTime} (~${missionEtas.pickupMins}m)`}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#9E9587] block text-[10px]">🎯 Est. Drop-off Time</span>
                          <span className="font-bold text-emerald-400">
                            {missionEtas.isDropDone ? "Delivered ✓" : `${missionEtas.dropClockTime} (~${missionEtas.dropMins}m)`}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#D4CBBF]">
                        {assignment.status === "accepted"
                          ? `Collect verified batch "${assignment.item.name}" (${formatFoodQuantity(assignment.item.quantity, assignment.item.unit, assignment.item.category)}) from the donor facility.`
                          : `Deliver batch "${assignment.item.name}" safely to the recipient shelter.`}
                      </div>
                    </div>
                  );
                })()}

                {/* Pickup and Drop Details with Navigation Action Links & ETAs */}
                {(() => {
                  const missionEtas = calculateDeliveryEtas(assignment.status, 18);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Pickup Point */}
                      <div
                        className={`p-3 rounded-[6px] space-y-2 transition-all border ${
                          assignment.status === "accepted"
                            ? "bg-[#2A241A] border-[#D9A441] shadow-sm"
                            : "bg-[#24211C] border-[#3B362E]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[#9E9587] text-[11px] font-mono-numeral uppercase">
                          <span className="font-bold text-[#D9A441] flex items-center gap-1">
                            <span>📍</span>
                            <span>1. Pickup Point (Kitchen)</span>
                          </span>
                          {windowStart && windowEnd && (
                            <span>
                              {windowStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                              {windowEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#F3EEE2]">{assignment.pickup.name}</div>
                          <div className="text-[#D4CBBF] mt-0.5 leading-relaxed">{assignment.pickup.address}</div>
                        </div>

                        {/* Pickup ETA Timing Display */}
                        <div className="text-[11px] font-mono-numeral text-amber-300/90 bg-[#1D1B17] px-2 py-1 rounded border border-[#3B362E] flex items-center justify-between">
                          <span>Est. Pickup:</span>
                          <span className="font-bold">
                            {missionEtas.isPickupDone ? "Collected ✓" : `${missionEtas.pickupClockTime} (~${missionEtas.pickupMins}m away)`}
                          </span>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              assignment.pickup.address
                            )}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#D9A441]/20 hover:bg-[#D9A441]/30 border border-[#D9A441]/40 text-[#D9A441] text-[11px] font-mono-numeral transition-colors"
                          >
                            🧭 Navigate to Pickup
                          </a>
                        </div>
                      </div>

                      {/* Drop Point */}
                      <div
                        className={`p-3 rounded-[6px] space-y-2 transition-all border ${
                          assignment.status === "picked_up"
                            ? "bg-[#1E2922] border-emerald-500 shadow-sm"
                            : "bg-[#24211C] border-[#3B362E]"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[#9E9587] text-[11px] font-mono-numeral uppercase">
                          <span className="font-bold text-emerald-400 flex items-center gap-1">
                            <span>🎯</span>
                            <span>2. Drop Point (NGO Recipient)</span>
                          </span>
                          {assignment.drop.contactPhone && (
                            <a
                              href={`tel:${assignment.drop.contactPhone}`}
                              className="text-[#D9A441] underline font-mono-numeral"
                            >
                              📞 Call NGO
                            </a>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-[#F3EEE2]">{assignment.drop.name}</div>
                          <div className="text-[#D4CBBF] mt-0.5 leading-relaxed">{assignment.drop.address}</div>
                        </div>

                        {/* Drop ETA Timing Display */}
                        <div className="text-[11px] font-mono-numeral text-emerald-400/90 bg-[#1D1B17] px-2 py-1 rounded border border-[#3B362E] flex items-center justify-between">
                          <span>Est. Drop-off:</span>
                          <span className="font-bold">
                            {missionEtas.isDropDone ? "Delivered ✓" : `${missionEtas.dropClockTime} (~${missionEtas.dropMins}m away)`}
                          </span>
                        </div>

                        <div className="pt-1 flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              assignment.drop.address
                            )}&travelmode=driving`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 text-[11px] font-mono-numeral transition-colors"
                          >
                            🧭 Navigate to Drop
                          </a>
                          {assignment.drop.contactPhone && (
                            <a
                              href={`tel:${assignment.drop.contactPhone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 border border-[#3B362E] text-[#F3EEE2] text-[11px] font-mono-numeral transition-colors"
                            >
                              📞 {assignment.drop.contactPhone}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Interactive Leaflet Route Map Toggle & View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleMap(assignment._id)}
                      className="inline-flex items-center gap-1.5 text-xs font-mono-numeral text-[#D9A441] hover:text-[#E2B359] transition-colors cursor-pointer bg-[#24211C] hover:bg-[#2C2822] border border-[#3B362E] px-3 py-1.5 rounded-[4px]"
                    >
                      <RouteIcon size={14} />
                      <span>{openMapIds[assignment._id] ? "Hide Route Map" : "View Live Route on Map 🗺️"}</span>
                    </button>
                    {openMapIds[assignment._id] && (
                      <span className="text-[10px] font-mono-numeral text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Live GPS Telemetry
                      </span>
                    )}
                  </div>

                  {openMapIds[assignment._id] && (
                    <div className="mt-2">
                      <DeliveryRouteMap
                        pickup={assignment.pickup}
                        drop={assignment.drop}
                        status={assignment.status}
                        courierLocation={assignment.currentLocation}
                        courierInfo={{
                          name: partner?.name || "You (Driver)",
                          phone: partner?.phone,
                          vehicleType: partner?.vehicleType,
                          vehicleNumber: partner?.vehicleNumber,
                        }}
                        role="driver"
                        urgencyTier={urgency.urgencyTier}
                        theme="dark"
                        onLocationUpdate={(loc) => sendLocationUpdate(assignment._id, loc)}
                      />
                    </div>
                  )}
                </div>

                {/* Step-Tracker UI with Stamp Mark Animation (Design PRD Section 5.4 & 7) */}
                <div className="bg-[#24211C] border border-[#3B362E] p-3 rounded-[6px] space-y-2">
                  <div className="text-[10px] font-mono-numeral uppercase tracking-wider text-[#9E9587]">
                    Redistribution Progress Stepper
                  </div>

                  <div className="flex items-center justify-between relative pt-2 pb-1">
                    {/* Background connector line */}
                    <div className="absolute left-4 right-4 top-5 h-0.5 bg-[#3B362E] -z-0" />

                    {LIFECYCLE_STAGES.map((stage, idx) => {
                      const isCompleted = idx < currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      const isTargetOfStamp =
                        justAdvancedStage?.assignmentId === assignment._id &&
                        justAdvancedStage?.stage === stage.id;

                      return (
                        <div
                          key={stage.id}
                          className="flex flex-col items-center relative z-10 space-y-1"
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center border text-[11px] transition-colors ${
                              isCompleted
                                ? "bg-[#2F4B3A] border-[#2F4B3A] text-[#F3EEE2]"
                                : isCurrent
                                ? "bg-[#D9A441] border-[#D9A441] text-[#24211C] font-bold"
                                : "bg-[#1D1B17] border-[#3B362E] text-[#9E9587]"
                            } ${isTargetOfStamp ? "animate-stamp-thunk" : ""}`}
                          >
                            {isCompleted ? (
                              <StampIcon size={14} />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`text-[9px] font-mono-numeral tracking-tight ${
                              isCurrent
                                ? "text-[#D9A441] font-semibold"
                                : isCompleted
                                ? "text-[#86C29B]"
                                : "text-[#9E9587]"
                            }`}
                          >
                            {stage.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Button (Min 44px touch targets) */}
                <div className="pt-2">
                  {assignment.status === "assigned" && (
                    <button
                      onClick={() => handleAdvanceStatus(assignment._id, "accepted")}
                      disabled={isUpdating}
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#2F4B3A] hover:bg-[#3D614B] text-[#F3EEE2] font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
                    >
                      <span>✓ Accept Delivery Order (Lock to You)</span>
                    </button>
                  )}

                  {assignment.status === "accepted" && (
                    <button
                      onClick={() => handleAdvanceStatus(assignment._id, "picked_up")}
                      disabled={isUpdating}
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#D9A441] hover:bg-[#E2B359] text-[#24211C] font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <StampIcon size={18} />
                      <span>Confirm Food Picked Up from Kitchen ➔</span>
                    </button>
                  )}

                  {assignment.status === "picked_up" && (
                    <button
                      onClick={() => handleAdvanceStatus(assignment._id, "delivered")}
                      disabled={isUpdating}
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#2F4B3A] hover:bg-[#3D614B] text-[#F3EEE2] font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <ShieldCheckIcon size={18} />
                      <span>Confirm Handover to Recipient NGO ➔</span>
                    </button>
                  )}

                  {assignment.status === "delivered" && (
                    <div className="p-4 rounded-[6px] bg-amber-950/40 border border-amber-500/50 text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-sm">
                        <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        <span>Food Dropped Off at Recipient Shelter</span>
                      </div>
                      <p className="text-xs text-[#D4CBBF] max-w-md mx-auto leading-relaxed">
                        Awaiting recipient NGO coordinator to verify and accept the delivery receipt on their portal. Once accepted, this order will finish and you will be free to take new orders!
                      </p>
                    </div>
                  )}

                  {assignment.status === "confirmed" && (
                    <div className="p-4 rounded-[6px] bg-[#2F4B3A]/30 border border-emerald-500/50 text-center space-y-2.5">
                      <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                        <span>🎉 Order Finished &amp; Receipt Confirmed by NGO!</span>
                      </div>
                      <p className="text-xs text-[#D4CBBF]">
                        The recipient NGO has confirmed safe handover. You are now free to take new delivery orders!
                      </p>
                      <button
                        onClick={() => {
                          setLoading(true);
                          fetchAssignments();
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        <span>View Available Orders ➔</span>
                      </button>
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
