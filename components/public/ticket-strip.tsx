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
    quantity: "350 pcs (~116 plates)",
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
    quantity: "160 pcs (~80 plates)",
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

  // Subpixel accumulator for jitter-free 60fps/120fps continuous motion
  const scrollPosRef = React.useRef(0);
  const velocityRef = React.useRef(0.035); // Base cruising speed (~35px/s)
  const targetSpeed = isHovered || isDragging ? 0 : 0.035;

  // Drag physics tracking
  const dragStartX = React.useRef(0);
  const dragStartScrollLeft = React.useRef(0);
  const lastDragTime = React.useRef(0);
  const lastDragX = React.useRef(0);
  const dragVelocity = React.useRef(0);

  // Use real tickets if provided and non-empty, otherwise fallback to sample tickets
  const baseItems = React.useMemo(() => {
    return tickets && tickets.length > 0 ? tickets : sampleTickets;
  }, [tickets]);

  // Replicate list 3 times so horizontal scrolling wraps seamlessly in both directions
  const displayItems = React.useMemo(() => {
    return [...baseItems, ...baseItems, ...baseItems];
  }, [baseItems]);

  const isDraggingRef = React.useRef(false);
  isDraggingRef.current = isDragging;

  // Seamless wrapping utility using high-precision float position
  const checkAndWrap = React.useCallback((el: HTMLDivElement) => {
    const singleSetWidth = el.scrollWidth / 3;
    if (singleSetWidth <= 0) return;

    if (scrollPosRef.current >= singleSetWidth * 2) {
      scrollPosRef.current -= singleSetWidth;
      el.scrollLeft = scrollPosRef.current;
    } else if (scrollPosRef.current <= 0) {
      scrollPosRef.current += singleSetWidth;
      el.scrollLeft = scrollPosRef.current;
    }
  }, []);

  // Initialize scroll position in the center set for infinite wrapping
  React.useEffect(() => {
    const el = containerRef.current;
    if (el && el.scrollWidth > 0) {
      const initialPos = el.scrollWidth / 3;
      el.scrollLeft = initialPos;
      scrollPosRef.current = initialPos;
    }
  }, [displayItems]);

  // Sync scrollPosRef whenever external scrolling occurs (e.g. touch or button)
  const syncScrollPos = React.useCallback(() => {
    if (containerRef.current) {
      scrollPosRef.current = containerRef.current.scrollLeft;
    }
  }, []);

  // Butter-smooth continuous auto-drift with momentum & soft hover deceleration
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
      // Clamp dt to 32ms to prevent jumping when switching browser tabs or waking up
      const dt = Math.min(time - lastTime, 32);
      lastTime = time;

      if (!isDraggingRef.current && el) {
        // Softly interpolate current velocity toward target speed (gentle glide to pause on hover)
        const lerpFactor = Math.min(dt * 0.006, 0.12);
        velocityRef.current += (targetSpeed - velocityRef.current) * lerpFactor;

        // Apply movement if velocity is non-negligible
        if (Math.abs(velocityRef.current) > 0.0005) {
          scrollPosRef.current += dt * velocityRef.current;
          el.scrollLeft = scrollPosRef.current;
          checkAndWrap(el);
        }
      }

      animFrameId = requestAnimationFrame(step);
    };

    animFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameId);
  }, [displayItems, checkAndWrap, targetSpeed]);

  // Non-passive wheel listener: translate mouse wheel into horizontal glide
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollPosRef.current += e.deltaY * 0.9;
          el.scrollLeft = scrollPosRef.current;
          checkAndWrap(el);
        }
      } else if (Math.abs(e.deltaX) > 0) {
        scrollPosRef.current += e.deltaX;
        el.scrollLeft = scrollPosRef.current;
        checkAndWrap(el);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [checkAndWrap]);

  // Tactile click & drag with momentum physics
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - el.offsetLeft;
    dragStartScrollLeft.current = el.scrollLeft;
    scrollPosRef.current = el.scrollLeft;
    lastDragX.current = e.pageX;
    lastDragTime.current = performance.now();
    dragVelocity.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!isDragging || !el) return;
    e.preventDefault();
    const now = performance.now();
    const dt = Math.max(now - lastDragTime.current, 1);
    const dx = e.pageX - lastDragX.current;

    // Track instantaneous drag velocity for fling inertia
    dragVelocity.current = -dx / dt;
    lastDragX.current = e.pageX;
    lastDragTime.current = now;

    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX.current) * 1.25;
    scrollPosRef.current = dragStartScrollLeft.current - walk;
    el.scrollLeft = scrollPosRef.current;
    checkAndWrap(el);
  };

  const handleMouseUpOrLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      // Transfer fling momentum if user dragged vigorously
      if (Math.abs(dragVelocity.current) > 0.05) {
        velocityRef.current = Math.sign(dragVelocity.current) * Math.min(Math.abs(dragVelocity.current) * 0.8, 0.4);
      }
    }
  };

  const scrollByAmount = (offset: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollBy({ left: offset, behavior: "smooth" });
    // Update ref after smooth scroll finishes
    setTimeout(() => {
      if (containerRef.current) {
        scrollPosRef.current = containerRef.current.scrollLeft;
      }
    }, 350);
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
      {/* Visual fading gradient edges for seamless horizon blending */}
      <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white via-white/80 to-transparent z-10 pointer-events-none hidden sm:block" />
      <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white via-white/80 to-transparent z-10 pointer-events-none hidden sm:block" />

      {/* Interactive Navigation Chevron Buttons (Fade in on Hover) */}
      <button
        type="button"
        onClick={() => scrollByAmount(-340)}
        aria-label="Scroll redistribution tickets left"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
      >
        <ChevronLeftIcon size={18} strokeWidth={2} />
      </button>

      <button
        type="button"
        onClick={() => scrollByAmount(340)}
        aria-label="Scroll redistribution tickets right"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-50 transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
      >
        <ChevronRightIcon size={18} strokeWidth={2} />
      </button>

      {/* Horizontal Scroll Container without any visible scrollbar */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onTouchStart={() => {
          setIsHovered(true);
          syncScrollPos();
        }}
        onTouchEnd={() => {
          setIsHovered(false);
          syncScrollPos();
        }}
        onScroll={syncScrollPos}
        className="flex gap-4 overflow-x-auto overflow-y-hidden py-3 px-2 sm:px-4 ticket-strip-scroll [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none cursor-grab active:cursor-grabbing will-change-scroll"
        style={{
          scrollBehavior: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {displayItems.map((ticket, index) => {
          const isDelivered = ticket.status === "delivered";
          const isClaimed = ticket.isClaimed || ticket.status === "confirmed";

          return (
            <div
              key={`${ticket.id}-${index}`}
              className="w-[280px] sm:w-[310px] shrink-0 pointer-events-auto transition-transform duration-200 hover:-translate-y-1"
            >
              <TicketCard className="bg-white p-4.5 text-left select-none shadow-xs border-slate-200/90 hover:border-emerald-400 hover:shadow-md transition-all rounded-xl">
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate max-w-[170px]"
                    title={ticket.institutionType}
                  >
                    {ticket.institutionType}
                  </span>

                  {isDelivered ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider shrink-0">
                      <StampIcon size={11} strokeWidth={2} /> Delivered
                    </span>
                  ) : isClaimed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider shrink-0">
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
                  className="text-base font-semibold text-slate-900 truncate mb-2.5"
                  title={ticket.item}
                >
                  {ticket.item}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider block">Quantity</span>
                    <span className="font-semibold text-slate-800">
                      {ticket.quantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider block">Impact</span>
                    <span className="font-semibold text-emerald-600">
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
