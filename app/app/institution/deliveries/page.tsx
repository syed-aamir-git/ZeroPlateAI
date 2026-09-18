"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { RouteIcon, CheckIcon } from "@/components/icons/ledger-icons";

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
  recipient: {
    name: string;
    serviceArea: string;
    contactPhone: string;
  };
  courier: {
    vehicleType: string;
    phone: string;
    serviceArea: string;
  } | null;
}

const STEPS = [
  { key: "assigned", label: "Assigned", desc: "Driver dispatched" },
  { key: "accepted", label: "Accepted", desc: "Driver en route" },
  { key: "picked_up", label: "Picked Up", desc: "Food in transit" },
  { key: "delivered", label: "Delivered", desc: "Arrived at site" },
  { key: "confirmed", label: "Confirmed", desc: "Recipient verified" },
];

export default function InstitutionDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    async function loadDeliveries() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/v1/institution/deliveries");
        if (res.ok) {
          const data = await res.json();
          setDeliveries(data.deliveries || []);
        }
      } catch (err) {
        console.error("Error loading deliveries:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDeliveries();
  }, []);

  const getStepIndex = (status: string) => {
    const idx = STEPS.findIndex((s) => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const filtered = deliveries.filter((d) => {
    if (filter === "active") return d.status !== "confirmed";
    if (filter === "completed") return d.status === "confirmed";
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-line pb-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-soft">
              Logistics Coordination
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink mt-0.5">
              Active Surplus Deliveries
            </h1>
            <p className="text-xs text-ink-soft mt-1">
              Step-by-step dispatch tracking for claimed surplus batches departing your facility
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex rounded-md border border-line p-0.5 bg-ledger-paper text-xs">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  filter === "all" ? "bg-ledger-surface font-semibold text-ink" : "text-ink-soft"
                }`}
              >
                All ({deliveries.length})
              </button>
              <button
                onClick={() => setFilter("active")}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  filter === "active" ? "bg-ledger-surface font-semibold text-ink" : "text-ink-soft"
                }`}
              >
                In Transit ({deliveries.filter((d) => d.status !== "confirmed").length})
              </button>
              <button
                onClick={() => setFilter("completed")}
                className={`px-3 py-1 rounded cursor-pointer transition-colors ${
                  filter === "completed" ? "bg-ledger-surface font-semibold text-ink" : "text-ink-soft"
                }`}
              >
                Delivered ({deliveries.filter((d) => d.status === "confirmed").length})
              </button>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        {isLoading ? (
          <div className="py-20 text-center font-mono text-xs text-ink-soft">
            Tracking dispatch runs across local logistics network...
          </div>
        ) : filtered.length === 0 ? (
          <div className="border border-line bg-ledger-surface p-12 text-center rounded-md space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-ledger-paper flex items-center justify-center text-ink-soft">
              <RouteIcon size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-ink">
              No Deliveries {filter !== "all" ? `in ${filter}` : ""} Yet
            </h3>
            <p className="text-xs text-ink-soft max-w-sm mx-auto">
              When an approved NGO claims one of your listed surplus batches, a delivery partner is coordinated and dispatch status appears here.
            </p>
            <div className="pt-2">
              <Link
                href="/app/institution/surplus-listings"
                className="text-xs text-basil hover:underline font-medium"
              >
                View Surplus Listings →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((d) => {
              const currentStepIdx = getStepIndex(d.status);

              return (
                <div
                  key={d._id}
                  className="border border-line bg-ledger-surface p-5 sm:p-6 rounded-md space-y-6"
                >
                  {/* Delivery Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                          Dispatch ID: {d._id.slice(-6).toUpperCase()}
                        </span>
                        <StatusBadge
                          variant={
                            d.status === "confirmed"
                              ? "verified_safe"
                              : d.status === "delivered"
                              ? "in_stock"
                              : "pending"
                          }
                          label={d.status.replace("_", " ")}
                        />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-ink mt-1">
                        {d.item.name} · {d.item.quantity} {d.item.unit}
                      </h3>
                      <p className="text-xs text-ink-soft">
                        Destination: <strong className="text-ink">{d.recipient.name}</strong> ({d.recipient.serviceArea})
                      </p>
                    </div>

                    <div className="text-right text-xs">
                      {d.courier ? (
                        <div className="p-2 rounded bg-ledger-paper border border-line text-left">
                          <span className="text-[10px] uppercase font-mono text-ink-soft block">
                            Assigned Driver
                          </span>
                          <span className="font-semibold text-ink block capitalize">
                            {d.courier.vehicleType.replace("_", " ")}
                          </span>
                          <span className="font-mono text-ink-soft text-[11px]">
                            {d.courier.phone}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-saffron/20 text-[#8C6D1F]">
                          Awaiting Driver Acceptance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stepper View UI (Design PRD Section 7 & Functional PRD 12.5) */}
                  <div>
                    <div className="grid grid-cols-5 gap-2 relative">
                      {STEPS.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.key} className="text-center space-y-2">
                            <div className="flex items-center justify-center">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                                  isDone
                                    ? "bg-basil text-[#FAF7F2]"
                                    : "border border-line bg-ledger-paper text-ink-soft"
                                } ${isCurrent ? "ring-2 ring-basil/40" : ""}`}
                              >
                                {isDone ? <CheckIcon size={14} /> : idx + 1}
                              </div>
                            </div>
                            <div>
                              <span
                                className={`font-medium text-xs block ${
                                  isDone ? "text-ink" : "text-ink-soft"
                                }`}
                              >
                                {step.label}
                              </span>
                              <span className="text-[10px] text-ink-soft hidden sm:block">
                                {step.desc}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
