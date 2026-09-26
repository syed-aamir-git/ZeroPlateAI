"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Utensils,
  ShieldCheck,
  Truck,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  HeartHandshake,
  TrendingDown,
  Building2,
  FileCheck2,
  ChevronRight,
  BellRing,
  QrCode,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RoleType = "all" | "kitchens" | "ngos" | "drivers";

export function HowItWorksSection() {
  const [activeRole, setActiveRole] = useState<RoleType>("all");
  const [activeStep, setActiveStep] = useState<number>(0);

  const stepsAll = [
    {
      num: "01",
      badge: "Step 1 • Kitchen Prep & Logging",
      title: "Kitchens Log Surplus in 30 Seconds",
      layman: "When lunch or dinner ends, dining staff simply tap the extra portions into their phone or tablet. Automated AI estimates servings and logs temperatures.",
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600",
      lightBg: "bg-emerald-50",
      borderColor: "border-emerald-200",
      accentText: "text-emerald-700",
      tag: "⚡ Fast & Effortless",
      highlights: ["No complex paperwork", "Instant meal count & temperature check", "Supports bulk trays, kg & litres"],
      icon: Utensils,
      preview: {
        title: "Chef's 1-Tap Surplus Entry",
        item: "Steamed Rice & Lentil Dal",
        quantity: "45.0 kg (~112 plates)",
        status: "Logged & Safety-Checked",
      },
    },
    {
      num: "02",
      badge: "Step 2 • Automated Food Safety",
      title: "Instant Food Safety Validation",
      layman: "Our system immediately checks the preparation time against strict food hygiene standards. Only safe, fresh food is approved — unsafe items are blocked automatically.",
      color: "amber",
      gradient: "from-amber-500 to-orange-600",
      lightBg: "bg-amber-50",
      borderColor: "border-amber-200",
      accentText: "text-amber-700",
      tag: "🛡️ 100% Protected",
      highlights: ["Strict 4-hour fresh cooked window", "Zero legal liability for donors", "Tamper-proof safety audit trail"],
      icon: ShieldCheck,
      preview: {
        title: "ZeroPlate Safety Gate",
        item: "Batch Temperature: 68°C (Safe)",
        quantity: "Time Since Cooking: 42 mins",
        status: "APPROVED FOR DISPATCH",
      },
    },
    {
      num: "03",
      badge: "Step 3 • Local Charity Matching",
      title: "Nearby Shelters Claim Free Meals",
      layman: "Verified food banks and community shelters within 10 km receive instant smartphone notifications. The first available NGO claims the batch with one tap.",
      color: "sky",
      gradient: "from-sky-500 to-blue-600",
      lightBg: "bg-sky-50",
      borderColor: "border-sky-200",
      accentText: "text-sky-700",
      tag: "📍 Proximity Matched",
      highlights: ["100% free food for non-profits", "Claimed in under 4 minutes", "Matches capacity to shelter size"],
      icon: HeartHandshake,
      preview: {
        title: "Shelter Notification Alert",
        item: "Hope Shelter (3.2 km away)",
        quantity: "112 hot meals claimed",
        status: "Claim Confirmed by Staff",
      },
    },
    {
      num: "04",
      badge: "Step 4 • Swift Pickup & Verified Impact",
      title: "Quick Delivery & Carbon Certificates",
      layman: "Drivers transport warm food containers directly to shelters. Once delivered, kitchens receive certified tax documents and carbon reduction certificates.",
      color: "violet",
      gradient: "from-violet-500 to-purple-600",
      lightBg: "bg-violet-50",
      borderColor: "border-violet-200",
      accentText: "text-violet-700",
      tag: "📜 Certified Proof",
      highlights: ["Live route tracking to the door", "Official ESG & CSR disclosures", "Direct hunger relief impact"],
      icon: Award,
      preview: {
        title: "Delivery & Impact Ledger",
        item: "Received by Shelter Supervisor",
        quantity: "201.6 kg CO₂e avoided",
        status: "Impact Certificate Issued",
      },
    },
  ];

  const roleDetails = {
    all: {
      headline: "The Complete Circular Food Journey",
      subtitle: "How surplus food moves from dining halls to families in need in 4 simple steps.",
    },
    kitchens: {
      headline: "How It Works for Commercial Kitchens & Messes",
      subtitle: "Turn unavoidable leftover food into hunger relief and tax-deductible ESG sustainability credits.",
    },
    ngos: {
      headline: "How It Works for Food Banks & Shelters",
      subtitle: "Receive regular, high-quality, hot nutritious meals for free with zero administrative overhead.",
    },
    drivers: {
      headline: "How It Works for Delivery Drivers & Volunteers",
      subtitle: "Earn delivery payouts or volunteer hours while connecting kitchens with local community shelters.",
    },
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
      {/* Decorative ambient spots */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Visual Guide</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            How ZeroPlate Works in Simple Steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Effortless, automated, and built for real-world chefs, volunteers, and drivers. 
            No confusing manuals — saving food takes under 30 seconds.
          </p>

          {/* Interactive Role Switcher */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-slate-200/70 backdrop-blur-xs border border-slate-300/60 shadow-inner max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveRole("all")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeRole === "all"
                  ? "bg-white text-slate-900 shadow-md scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              🌟 Complete Journey
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("kitchens")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeRole === "kitchens"
                  ? "bg-white text-emerald-700 shadow-md scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              👨‍🍳 For Kitchens & Messes
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("ngos")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeRole === "ngos"
                  ? "bg-white text-amber-700 shadow-md scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              🤝 For Charities & NGOs
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("drivers")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer",
                activeRole === "drivers"
                  ? "bg-white text-sky-700 shadow-md scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              🚚 For Drivers & Couriers
            </button>
          </div>
        </div>

        {/* 4 Interactive Step Progression Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stepsAll.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;

            return (
              <div
                key={step.num}
                onClick={() => setActiveStep(idx)}
                className={cn(
                  "relative rounded-2xl p-6 transition-all duration-300 cursor-pointer flex flex-col justify-between border bg-white shadow-xs group",
                  isSelected
                    ? "ring-2 ring-emerald-500 shadow-xl -translate-y-1.5 border-emerald-300"
                    : "hover:shadow-lg hover:-translate-y-1 hover:border-slate-300 border-slate-200/90"
                )}
              >
                <div>
                  {/* Top Bar with Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <span
                      className={cn(
                        "w-11 h-11 rounded-xl font-extrabold flex items-center justify-center text-sm shadow-md transition-transform duration-300 group-hover:scale-105 text-white bg-gradient-to-br",
                        step.gradient
                      )}
                    >
                      {step.num}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                        step.lightBg,
                        step.borderColor,
                        step.accentText
                      )}
                    >
                      {step.tag}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {step.badge}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-emerald-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal mb-5">
                    {step.layman}
                  </p>
                </div>

                {/* Key Points Bullet List */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                      <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", step.accentText)} />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Micro Simulator Pill */}
                <div
                  className={cn(
                    "mt-5 p-3 rounded-xl border text-left transition-colors",
                    step.lightBg,
                    step.borderColor
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>{step.preview.title}</span>
                    <span className={cn("font-extrabold", step.accentText)}>● Live</span>
                  </div>
                  <div className="font-bold text-slate-900 text-xs mt-1 truncate">
                    {step.preview.item}
                  </div>
                  <div className="text-[11px] text-slate-600 flex items-center justify-between mt-1">
                    <span>{step.preview.quantity}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-white/80 px-1.5 py-0.5 rounded">
                      {step.preview.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Detail Card Based on Active Role */}
        <div className="mt-12 rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-lg shadow-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100/70 text-emerald-800 text-xs font-bold">
              <span>Layman Guarantee</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {roleDetails[activeRole].headline}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {roleDetails[activeRole].subtitle}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Zero food sits waiting &gt; 4 hours</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>KYC-verified NGOs only</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Automated tax & ESG receipts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>GPS routed delivery couriers</span>
              </div>
            </div>
          </div>

          {/* Action Callout */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all text-center justify-center"
            >
              <Link href="/register" className="flex items-center gap-2">
                <span>Start in 2 Minutes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-6 px-6 rounded-xl text-center justify-center"
            >
              <Link href="/how-it-works">Read Full Detailed Guide</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
