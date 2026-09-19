"use client";

import * as React from "react";
import { TicketCard } from "@/components/ui/ticket-card";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import {
  StampIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons/ledger-icons";
import type { LiveRedistributionTicket } from "@/lib/platform-stats";

export type TicketItem = LiveRedistributionTicket;

const sampleTickets: TicketItem[] = [
  {
    id: "T-01",
    item: "Steamed Basmati Rice & Dal",
    institutionType: "College Mess",
    quantity: "45.0 kg",
    meals: "~112 meals",
    status: "confirmed",
    statusLabel: "Claimed",
    isClaimed: true,
  },
  {
    id: "T-02",
    item: "Fresh Whole Wheat Chapatis",
    institutionType: "Hospital Food Service",
    quantity: "350 pcs",
    meals: "~88 meals",
    status: "verified_safe",
    statusLabel: "Verified Safe",
  },
  {
    id: "T-03",
    item: "Pasteurized Toned Milk",
    institutionType: "Processing Unit",
    quantity: "40.0 L",
    meals: "~100 meals",
    status: "confirmed",
    statusLabel: "Claimed",
    isClaimed: true,
  },
  {
    id: "T-04",
    item: "Mixed Vegetable Curry",
    institutionType: "Corporate Cafeteria",
    quantity: "28.5 kg",
    meals: "~70 meals",
    status: "verified_safe",
    statusLabel: "Verified Safe",
  },
  {
    id: "T-05",
    item: "Idli & Sambar Breakfast Batch",
    institutionType: "Hotel Banquet",
    quantity: "160 pcs",
    meals: "~80 meals",
    status: "nearing_expiry",
    statusLabel: "Nearing Expiry",
  },
  {
    id: "T-06",
    item: "Paneer Butter Masala",
    institutionType: "Hospital Mess",
    quantity: "22.0 kg",
    meals: "~55 meals",
    status: "confirmed",
    statusLabel: "Claimed",
    isClaimed: true,
  },
];

interface TicketStripProps {
  tickets?: TicketItem[];
}

export function TicketStrip({ tickets }: TicketStripProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartX = React.useRef(0);
  const dragStartScrollLeft = React.useRef(0);

  // Use real tickets if provided and non-empty, otherwise fallback to sample tickets
  const baseItems = React.useMemo(() => {
    return tickets && tickets.length > 0 ? tickets : sampleTickets;
  }, [tickets]);

  // Replicate list 3 times so horizontal scrolling wraps seamlessly in both directions
  const displayItems = React.useMemo(() => {
    return [...baseItems, ...baseItems, ...baseItems];
  }, [baseItems]);

  const isHoveredRef = React.useRef(false);
  const isDraggingRef = React.useRef(false);
  isHoveredRef.current = isHovered;
  isDraggingRef.current = isDragging;

  // Infinite wrapping utility
  const checkAndWrap = React.useCallback((el: HTMLDivElement) => {
    const singleSetWidth = el.scrollWidth / 3;
    if (singleSetWidth <= 0) return;

    if (el.scrollLeft >= singleSetWidth * 2) {
      el.scrollLeft -= singleSetWidth;
    } else if (el.scrollLeft <= 0) {
      el.scrollLeft += singleSetWidth;
    }
  }, []);

  // Initialize scroll position in the middle set for bidirectional scrolling
  React.useEffect(() => {
    const el = containerRef.current;
    if (el && el.scrollWidth > 0) {
      el.scrollLeft = el.scrollWidth / 3;
    }
  }, [displayItems]);

  // Smooth continuous auto-drift when not hovered or dragging
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    let animFrameId: number;
    let lastTime = performance.now();

    const step = (time: number) => {
      const dt = Math.min(time - lastTime, 40); // Cap frame delta for smooth tab switching
      lastTime = time;

      if (!isHoveredRef.current && !isDraggingRef.current && el) {
        // Continuous drift: ~32px / sec
        el.scrollLeft += dt * 0.032;
        checkAndWrap(el);
      }

      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [displayItems, checkAndWrap]);

  // Non-passive wheel listener: when mouse hovers over strip, wheel scrolls horizontally
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Translate vertical mouse wheel to smooth horizontal scroll without scrolling whole page away
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          el.scrollLeft += e.deltaY * 1.15;
          checkAndWrap(el);
        }
      } else if (Math.abs(e.deltaX) > 0) {
        el.scrollLeft += e.deltaX;
        checkAndWrap(el);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [checkAndWrap]);

  // Click & drag support for tactile desktop and mouse browsing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!isDragging || !el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.35;
    el.scrollLeft = dragStartScrollLeft.current - walk;
    checkAndWrap(el);
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const scrollByAmount = (offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <div
      className="group relative w-full py-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsDragging(false);
      }}
    >
      {/* Visual fading gradient edges */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-r from-ledger-paper via-ledger-paper/80 to-transparent z-10 pointer-events-none hidden sm:block" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 bg-gradient-to-l from-ledger-paper via-ledger-paper/80 to-transparent z-10 pointer-events-none hidden sm:block" />

      {/* Interactive Navigation Chevron Buttons (Fade in on Hover) */}
      <button
        type="button"
        onClick={() => scrollByAmount(-320)}
        aria-label="Scroll redistribution tickets left"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF6EE]/95 border border-line shadow-sm flex items-center justify-center text-ink hover:bg-[#F2ECE1] transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
      >
        <ChevronLeftIcon size={18} strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={() => scrollByAmount(320)}
        aria-label="Scroll redistribution tickets right"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FAF6EE]/95 border border-line shadow-sm flex items-center justify-center text-ink hover:bg-[#F2ECE1] transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
      >
        <ChevronRightIcon size={18} strokeWidth={2} />
      </button>

      {/* Horizontal Scroll Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        className="flex gap-4 overflow-x-auto overflow-y-hidden py-3 px-2 sm:px-4 ticket-strip-scroll select-none cursor-grab active:cursor-grabbing will-change-scroll"
        style={{
          scrollBehavior: isDragging ? "auto" : "smooth",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {displayItems.map((ticket, index) => {
          const isDelivered = ticket.status === "delivered";
          const isClaimed = ticket.isClaimed || ticket.status === "confirmed";

          return (
            <div
              key={`${ticket.id}-${index}`}
              className="w-[280px] sm:w-[310px] shrink-0 pointer-events-auto transition-transform duration-200 hover:-translate-y-0.5"
            >
              <TicketCard className="bg-[#FAF6EE] p-4 text-left select-none shadow-xs border-line/80 hover:border-line transition-all">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className="font-mono-numeral text-[11px] uppercase tracking-wider text-ink-soft truncate max-w-[170px]"
                    title={ticket.institutionType}
                  >
                    {ticket.institutionType}
                  </span>

                  {isDelivered ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-basil/15 text-basil border border-basil/30 uppercase tracking-wider shrink-0">
                      <StampIcon size={11} strokeWidth={2} /> Delivered
                    </span>
                  ) : isClaimed ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-basil/15 text-basil border border-basil/30 uppercase tracking-wider shrink-0">
                      <StampIcon size={11} strokeWidth={2} /> Claimed
                    </span>
                  ) : (
                    <StatusBadge
                      variant={ticket.status as StatusVariant}
                      label={ticket.statusLabel}
                      className="text-[10px] py-0 px-2 shrink-0"
                    />
                  )}
                </div>

                <div
                  className="font-display text-base font-medium text-ink truncate mb-2"
                  title={ticket.item}
                >
                  {ticket.item}
                </div>

                <div className="flex items-center justify-between border-t border-line/70 pt-2 text-xs">
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
          );
        })}
      </div>
    </div>
  );
}
