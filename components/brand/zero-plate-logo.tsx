"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ZeroPlateLogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  href?: string;
  variant?: "default" | "dark";
}

export function ZeroPlateLogoIcon({
  size = 40,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 group select-none transition-transform duration-300 hover:scale-105",
        className
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {/* Emerald Gradient for Environmental Food Rescue */}
          <linearGradient id="zp-emerald-flow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#059669" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          {/* Warm Amber/Saffron Gradient for Nourishing Meals */}
          <linearGradient id="zp-amber-glow" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="50%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Porcelain Plate Surface Gradient */}
          <radialGradient
            id="zp-porcelain-base"
            cx="48%"
            cy="46%"
            r="50%"
            fx="40%"
            fy="35%"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="75%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </radialGradient>

          {/* Soft Luxury Drop Shadow */}
          <filter
            id="zp-card-shadow"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            filterUnits="userSpaceOnUse"
          >
            <feDropShadow
              dx="0"
              dy="2.5"
              stdDeviation="3"
              floodColor="#064E3B"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        {/* Outer Circular Dish (Zero Waste Round Plate) */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="url(#zp-porcelain-base)"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          filter="url(#zp-card-shadow)"
        />

        {/* Subtle Inner Plate Rim Ring */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill="#FFFFFF"
          stroke="#F1F5F9"
          strokeWidth="1.2"
        />

        {/* Dynamic Rotating Group on Hover for Circular Flow */}
        <g className="transition-transform duration-700 ease-out origin-center group-hover:rotate-45">
          {/* 1. Circular Redistribution Arc: Emerald Fresh Food Stream (Top/Left) */}
          <path
            d="M 22 50 C 22 34.5 34.5 22 50 22 C 60.5 22 69.8 27.8 74.8 36.5"
            stroke="url(#zp-emerald-flow)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Emerald Stream Arrowhead / Leaf Tip */}
          <path
            d="M 72 30 L 76.5 37 L 68.5 38 Z"
            fill="#059669"
          />

          {/* 2. Circular Redistribution Arc: Golden Amber Meal Delivery Stream (Bottom/Right) */}
          <path
            d="M 78 50 C 78 65.5 65.5 78 50 78 C 39.5 78 30.2 72.2 25.2 63.5"
            stroke="url(#zp-amber-glow)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Golden Stream Arrowhead / Nourishment Terminal */}
          <path
            d="M 28 70 L 23.5 63 L 31.5 62 Z"
            fill="#D97706"
          />
        </g>

        {/* Center Emblem: Minimalist Modern Fork + Organic Sprout (The Plate & Nourishment) */}
        <g className="transition-transform duration-500 ease-out group-hover:scale-110 origin-center">
          {/* Stylized Modern Fork (Left of center) */}
          {/* Fork Handle */}
          <path
            d="M 43 64 L 43 47"
            stroke="#1E293B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Fork Base & Curve */}
          <path
            d="M 39 47 C 39 50 47 50 47 47 L 47 37"
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Fork Tines */}
          <path
            d="M 39 37 L 39 47 M 43 37 L 43 47"
            stroke="#1E293B"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Fresh Sprouting Leaf (Right of center, curling gently around the fork) */}
          <path
            d="M 45 61 C 48 57 58 54 60 41 C 51 40 47 49 46 56 Z"
            fill="url(#zp-emerald-flow)"
            className="transition-all duration-300"
          />
          {/* Delicate leaf vein */}
          <path
            d="M 46 59 C 48 53 53 48 58 43"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.85"
          />

          {/* Warm Golden Grain / Nourishment Drop (Top accent) */}
          <circle
            cx="50"
            cy="31"
            r="3"
            fill="url(#zp-amber-glow)"
          />
        </g>
      </svg>
    </div>
  );
}

export function ZeroPlateLogo({
  className = "",
  iconOnly = false,
  size = "md",
  showTagline = true,
  href = "/",
  variant = "default",
}: ZeroPlateLogoProps) {
  const sizeMap = {
    sm: { icon: 34, text: "text-lg", tagline: "text-[8px] tracking-[0.18em]", gap: "gap-2.5" },
    md: { icon: 42, text: "text-xl", tagline: "text-[9px] tracking-[0.2em]", gap: "gap-3" },
    lg: { icon: 48, text: "text-2xl", tagline: "text-[10px] tracking-[0.22em]", gap: "gap-3.5" },
    xl: { icon: 56, text: "text-3xl", tagline: "text-[11px] tracking-[0.25em]", gap: "gap-4" },
  };

  const config = sizeMap[size];
  const isDark = variant === "dark";

  const content = (
    <div
      className={cn(
        "inline-flex items-center group transition-all select-none",
        config.gap,
        className
      )}
    >
      {/* Handcrafted Circular Plate & Redistribution Icon */}
      <ZeroPlateLogoIcon size={config.icon} />

      {!iconOnly && (
        <div className="flex flex-col justify-center leading-none text-left">
          <div className="flex items-baseline">
            <span
              className={cn(
                "font-extrabold tracking-tight transition-colors",
                isDark
                  ? "text-white group-hover:text-emerald-300"
                  : "text-slate-900 group-hover:text-emerald-950",
                config.text
              )}
            >
              Zero<span className={isDark ? "text-emerald-400" : "text-emerald-600"}>Plate</span>
            </span>
            <span
              className={cn(
                "font-black ml-0.5",
                isDark ? "text-amber-400" : "text-amber-500",
                config.text
              )}
            >
              .ai
            </span>
          </div>

          {showTagline && (
            <span
              className={cn(
                "font-bold uppercase mt-1 transition-colors",
                isDark
                  ? "text-emerald-300/80 group-hover:text-emerald-200"
                  : "text-emerald-700/90 group-hover:text-emerald-800",
                config.tagline
              )}
            >
              Food Rescue Network
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg group"
      >
        {content}
      </Link>
    );
  }

  return content;
}
