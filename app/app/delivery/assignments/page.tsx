"use client";

import * as React from "react";
import {
  RouteIcon,
  StampIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@/components/icons/ledger-icons";

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

  const fetchAssignments = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/delivery/assignments");
      const json = await res.json();
      if (res.ok) {
        setAssignments(json.assignments || []);
      }
    } catch (err) {
      console.error("Failed to load delivery assignments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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

  return (
    <div className="space-y-4 text-left">
      {/* Page Title & Status */}
      <div className="flex items-baseline justify-between border-b border-[#3B362E] pb-3">
        <div>
          <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587]">
            Active Logistics Route
          </span>
          <h1 className="font-display text-xl font-bold text-[#F3EEE2] mt-0.5">
            Delivery Dispatches
          </h1>
        </div>

        <button
          onClick={fetchAssignments}
          className="text-xs text-[#D9A441] hover:underline font-mono-numeral cursor-pointer"
        >
          ↻ Refresh
        </button>
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

      {/* Active Assignment Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#9E9587]">
          Checking for active dispatches...
        </div>
      ) : assignments.length === 0 ? (
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
          {assignments.map((assignment) => {
            const currentStageIdx = getStageIndex(assignment.status);
            const isUpdating = updatingId === assignment._id;
            const windowStart = assignment.item.pickupWindow?.start
              ? new Date(assignment.item.pickupWindow.start)
              : null;
            const windowEnd = assignment.item.pickupWindow?.end
              ? new Date(assignment.item.pickupWindow.end)
              : null;

            return (
              <div
                key={assignment._id}
                className="border border-[#3B362E] bg-[#1D1B17] rounded-[6px] p-4 space-y-4"
              >
                {/* Header: Item & Quantity */}
                <div className="flex items-start justify-between border-b border-[#3B362E] pb-3">
                  <div>
                    <span className="text-[10px] font-mono-numeral uppercase tracking-wider text-[#9E9587]">
                      {assignment.item.category.replace("_", " ")}
                    </span>
                    <h3 className="font-display text-base font-semibold text-[#F3EEE2] leading-snug">
                      {assignment.item.name}
                    </h3>
                  </div>
                  <div className="font-mono-numeral text-xl font-bold text-[#D9A441]">
                    {assignment.item.quantity}{" "}
                    <span className="text-xs font-normal text-[#9E9587]">{assignment.item.unit}</span>
                  </div>
                </div>

                {/* Pickup and Drop Details */}
                <div className="space-y-3 text-xs">
                  {/* Pickup Point */}
                  <div className="bg-[#24211C] border border-[#3B362E] p-3 rounded-[6px] space-y-1">
                    <div className="flex items-center justify-between text-[#9E9587] text-[11px] font-mono-numeral uppercase">
                      <span>1. Pickup Point (Kitchen)</span>
                      {windowStart && windowEnd && (
                        <span>
                          {windowStart.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                          {windowEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-[#F3EEE2]">{assignment.pickup.name}</div>
                    <div className="text-[#D4CBBF]">{assignment.pickup.address}</div>
                  </div>

                  {/* Drop Point */}
                  <div className="bg-[#24211C] border border-[#3B362E] p-3 rounded-[6px] space-y-1">
                    <div className="flex items-center justify-between text-[#9E9587] text-[11px] font-mono-numeral uppercase">
                      <span>2. Drop Point (NGO Recipient)</span>
                      {assignment.drop.contactPhone && (
                        <a
                          href={`tel:${assignment.drop.contactPhone}`}
                          className="text-[#D9A441] underline font-mono-numeral"
                        >
                          📞 Call NGO
                        </a>
                      )}
                    </div>
                    <div className="font-semibold text-[#F3EEE2]">{assignment.drop.name}</div>
                    <div className="text-[#D4CBBF]">{assignment.drop.address}</div>
                  </div>
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
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#2F4B3A] hover:bg-[#3D614B] text-[#F3EEE2] font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✓ Accept Dispatch Assignment</span>
                    </button>
                  )}

                  {assignment.status === "accepted" && (
                    <button
                      onClick={() => handleAdvanceStatus(assignment._id, "picked_up")}
                      disabled={isUpdating}
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#D9A441] hover:bg-[#E2B359] text-[#24211C] font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <StampIcon size={18} />
                      <span>Confirm Food Picked Up from Kitchen</span>
                    </button>
                  )}

                  {assignment.status === "picked_up" && (
                    <button
                      onClick={() => handleAdvanceStatus(assignment._id, "delivered")}
                      disabled={isUpdating}
                      className="w-full min-h-[48px] py-3 px-4 rounded-[6px] bg-[#2F4B3A] hover:bg-[#3D614B] text-[#F3EEE2] font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <ShieldCheckIcon size={18} />
                      <span>Confirm Handover to Recipient NGO</span>
                    </button>
                  )}

                  {assignment.status === "delivered" && (
                    <div className="p-3 rounded-[6px] bg-[#24211C] border border-[#3B362E] text-center text-xs text-[#9E9587]">
                      ✓ Handed over to recipient — awaiting NGO receipt confirmation tap
                    </div>
                  )}

                  {assignment.status === "confirmed" && (
                    <div className="p-3 rounded-[6px] bg-[#2F4B3A]/20 border border-[#2F4B3A] text-center text-xs text-[#86C29B] font-medium">
                      ✓ Distribution run complete & confirmed
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
