"use client";

import * as React from "react";
import { TicketCard } from "@/components/ui/ticket-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { StampIcon } from "@/components/icons/ledger-icons";

interface TicketItem {
  id: string;
  item: string;
  institutionType: string;
  quantity: string;
  meals: string;
  status: "verified_safe" | "confirmed" | "pending" | "nearing_expiry";
  isClaimed?: boolean;
}

const sampleTickets: TicketItem[] = [
  {
    id: "T-01",
    item: "Steamed Basmati Rice & Dal",
    institutionType: "College Mess",
    quantity: "45.0 kg",
    meals: "~112 meals",
    status: "confirmed",
    isClaimed: true,
  },
  {
    id: "T-02",
    item: "Fresh Whole Wheat Chapatis",
    institutionType: "Hospital Food Service",
    quantity: "350 pcs",
    meals: "~88 meals",
    status: "verified_safe",
  },
  {
    id: "T-03",
    item: "Pasteurized Toned Milk",
    institutionType: "Processing Unit",
    quantity: "40.0 L",
    meals: "~100 meals",
    status: "confirmed",
    isClaimed: true,
  },
  {
    id: "T-04",
    item: "Mixed Vegetable Curry",
    institutionType: "Corporate Cafeteria",
    quantity: "28.5 kg",
    meals: "~70 meals",
    status: "verified_safe",
  },
  {
    id: "T-05",
    item: "Idli & Sambar Breakfast Batch",
    institutionType: "Hotel Banquet",
    quantity: "160 pcs",
    meals: "~80 meals",
    status: "nearing_expiry",
  },
  {
    id: "T-06",
    item: "Paneer Butter Masala",
    institutionType: "Hospital Mess",
    quantity: "22.0 kg",
    meals: "~55 meals",
    status: "confirmed",
    isClaimed: true,
  },
];

export function TicketStrip() {
  // Duplicate list to achieve continuous infinite marquee loop
  const displayItems = [...sampleTickets, ...sampleTickets];

  return (
    <div className="w-full overflow-hidden relative py-4 mask-fade-edges">
      {/* Visual fading gradient edges for seamless ticket strip boundary */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-ledger-paper to-transparent z-10 pointer-events-none hidden sm:block" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-ledger-paper to-transparent z-10 pointer-events-none hidden sm:block" />

      <div className="flex gap-4 w-max animate-ticket-drift motion-reduce:transform-none motion-reduce:animate-none">
        {displayItems.map((ticket, index) => (
          <div
            key={`${ticket.id}-${index}`}
            className="w-[280px] sm:w-[310px] shrink-0"
          >
            <TicketCard className="bg-[#FAF6EE] p-4 text-left select-none">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-ink-soft">
                  {ticket.institutionType}
                </span>
                {ticket.isClaimed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-basil/15 text-basil border border-basil/30 uppercase tracking-wider">
                    <StampIcon size={11} strokeWidth={2} /> Claimed
                  </span>
                ) : (
                  <StatusBadge
                    variant={ticket.status}
                    className="text-[10px] py-0 px-2"
                  />
                )}
              </div>

              <div className="font-display text-base font-medium text-ink truncate mb-2">
                {ticket.item}
              </div>

              <div className="flex items-center justify-between border-t border-line pt-2 text-xs">
                <div>
                  <span className="text-ink-soft text-[11px] block">Volume</span>
                  <span className="font-ledger-mono font-semibold text-ink">
                    {ticket.quantity}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-ink-soft text-[11px] block">Impact</span>
                  <span className="font-ledger-mono font-semibold text-basil">
                    {ticket.meals}
                  </span>
                </div>
              </div>
            </TicketCard>
          </div>
        ))}
      </div>
    </div>
  );
}
