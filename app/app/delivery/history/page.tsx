"use client";

import * as React from "react";
import Link from "next/link";
import { LedgerTabIcon, StampIcon, RouteIcon } from "@/components/icons/ledger-icons";
import DeliveryRouteMap from "@/components/maps/delivery-route-map";

interface CompletedDelivery {
  _id: string;
  status: "delivered" | "confirmed";
  deliveredAt?: string;
  confirmedAt?: string;
  createdAt: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  donorName: string;
  pickupAddress: string;
  recipientName: string;
  dropAddress: string;
  pickupLocation?: { lat?: number; lng?: number; address?: string };
  dropLocation?: { lat?: number; lng?: number; address?: string };
}

export default function DeliveryHistoryPage() {
  const [history, setHistory] = React.useState<CompletedDelivery[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [openMapIds, setOpenMapIds] = React.useState<Record<string, boolean>>({});

  const toggleMap = (id: string) => {
    setOpenMapIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchHistory = React.useCallback(async () => {
    try {
      const res = await fetch("/api/v1/delivery/history");
      const json = await res.json();
      if (res.ok) {
        setHistory(json.deliveries || []);
      }
    } catch (err) {
      console.error("Failed to load delivery history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalByUnit = history.reduce(
    (acc, curr) => {
      const qty = Number(curr.quantity) || 0;
      const rawUnit = (curr.unit || "kg").toLowerCase().trim();
      if (rawUnit === "kg" || rawUnit === "kgs" || rawUnit === "kilogram" || rawUnit === "kilograms") {
        acc.kg += qty;
      } else if (rawUnit === "l" || rawUnit === "liter" || rawUnit === "litres" || rawUnit === "liters" || rawUnit === "litre") {
        acc.litres += qty;
      } else if (rawUnit === "pcs" || rawUnit === "pc" || rawUnit === "piece" || rawUnit === "pieces" || rawUnit === "portions" || rawUnit === "portion") {
        acc.pieces += qty;
      } else {
        acc.kg += qty;
      }
      return acc;
    },
    { kg: 0, pieces: 0, litres: 0 }
  );

  return (
    <div className="space-y-4 text-left">
      {/* Page Title */}
      <div className="flex items-baseline justify-between border-b border-[#3B362E] pb-3">
        <div>
          <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587]">
            Logistics Ledger
          </span>
          <h1 className="font-display text-xl font-bold text-[#F3EEE2] mt-0.5">
            Completed Dispatches
          </h1>
        </div>

        <span className="text-xs font-mono-numeral text-[#D9A441]">
          {history.length} runs
        </span>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 gap-2 border border-[#3B362E] bg-[#1D1B17] p-3 rounded-[6px]">
        <div>
          <div className="text-[10px] uppercase font-mono-numeral text-[#9E9587]">
            Total Completed
          </div>
          <div className="font-mono-numeral text-xl font-bold text-[#F3EEE2] mt-0.5">
            {history.length}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase font-mono-numeral text-[#9E9587]">
            Food Transported
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 font-mono-numeral text-sm sm:text-base font-bold text-[#86C29B]">
            <span className="whitespace-nowrap">{totalByUnit.kg} <span className="text-[11px] font-normal text-[#9E9587]">kg</span></span>
            <span className="text-[#9E9587]/40 text-xs select-none">•</span>
            <span className="whitespace-nowrap">{totalByUnit.pieces} <span className="text-[11px] font-normal text-[#9E9587]">pieces</span></span>
            <span className="text-[#9E9587]/40 text-xs select-none">•</span>
            <span className="whitespace-nowrap">{totalByUnit.litres} <span className="text-[11px] font-normal text-[#9E9587]">litres</span></span>
          </div>
        </div>
      </div>

      {/* History Items */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono-numeral text-[#9E9587]">
          Loading delivery history ledger...
        </div>
      ) : history.length === 0 ? (
        <div className="border border-[#3B362E] bg-[#1D1B17] p-8 rounded-[6px] text-center space-y-3">
          <div className="w-12 h-12 rounded-[6px] border border-[#3B362E] bg-[#24211C] mx-auto flex items-center justify-center text-[#9E9587]">
            <LedgerTabIcon size={24} />
          </div>
          <h2 className="font-display text-base font-medium text-[#F3EEE2]">
            No completed deliveries yet
          </h2>
          <p className="text-xs text-[#9E9587] leading-relaxed">
            Completed and confirmed redistribution runs will appear in this ledger with full pickup and handoff timestamps.
          </p>
          <div className="pt-1">
            <Link
              href="/app/delivery/assignments"
              className="text-xs text-[#D9A441] underline font-mono-numeral"
            >
              View available assignments →
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const dateStr = item.deliveredAt || item.confirmedAt || item.createdAt;
            const formattedDate = new Date(dateStr).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={item._id}
                className="border border-[#3B362E] bg-[#1D1B17] rounded-[6px] p-3.5 space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono-numeral uppercase text-[#9E9587]">
                      {item.category.replace("_", " ")}
                    </span>
                    <div className="font-display text-sm font-semibold text-[#F3EEE2]">
                      {item.itemName}
                    </div>
                  </div>
                  <div className="font-mono-numeral text-base font-bold text-[#86C29B]">
                    {item.quantity} <span className="text-xs font-normal text-[#9E9587]">{item.unit}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[#D4CBBF] border-t border-[#3B362E] pt-2">
                  <div className="flex justify-between">
                    <span className="text-[#9E9587]">From:</span>
                    <span className="text-right text-[#F3EEE2]">{item.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9E9587]">To:</span>
                    <span className="text-right text-[#F3EEE2]">{item.recipientName}</span>
                  </div>
                  <div className="flex justify-between font-mono-numeral text-[11px] pt-1 text-[#9E9587]">
                    <span>Completed:</span>
                    <span>{formattedDate}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-[#3B362E] pt-2">
                  <button
                    type="button"
                    onClick={() => toggleMap(item._id)}
                    className="text-[11px] font-mono-numeral text-[#D9A441] hover:text-[#E2B359] transition-colors cursor-pointer flex items-center gap-1 bg-[#24211C] px-2.5 py-1 rounded border border-[#3B362E]"
                  >
                    <RouteIcon size={12} />
                    <span>{openMapIds[item._id] ? "Hide Map" : "View Route 🗺️"}</span>
                  </button>
                  <span className="text-[11px] font-mono-numeral text-[#86C29B] flex items-center gap-1">
                    <StampIcon size={12} />
                    <span>{item.status === "confirmed" ? "Confirmed by NGO" : "Handed over"}</span>
                  </span>
                </div>

                {openMapIds[item._id] && (
                  <div className="mt-2 pt-2 border-t border-[#3B362E]">
                    <DeliveryRouteMap
                      pickup={{
                        name: item.donorName,
                        address: item.pickupAddress,
                        lat: item.pickupLocation?.lat,
                        lng: item.pickupLocation?.lng,
                      }}
                      drop={{
                        name: item.recipientName,
                        address: item.dropAddress,
                        lat: item.dropLocation?.lat,
                        lng: item.dropLocation?.lng,
                      }}
                      status={item.status}
                      theme="dark"
                      className="w-full h-56"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
