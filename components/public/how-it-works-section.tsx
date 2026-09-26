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
  ExternalLink,
  BellRing,
  QrCode,
  Zap,
  CalendarCheck,
  PackageCheck,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type RoleType = "all" | "kitchens" | "ngos" | "drivers";

interface StepItem {
  num: string;
  badge: string;
  title: string;
  layman: string;
  color: string;
  gradient: string;
  lightBg: string;
  borderColor: string;
  accentText: string;
  tag: string;
  highlights: string[];
  icon: React.ElementType;
  preview: {
    title: string;
    item: string;
    quantity: string;
    status: string;
  };
}

export function HowItWorksSection() {
  const [activeRole, setActiveRole] = useState<RoleType>("all");
  const [activeStep, setActiveStep] = useState<number>(0);

  // Dedicated Steps for each role perspective
  const roleStepsData: Record<RoleType, StepItem[]> = {
    // 1. Complete Overview
    all: [
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
    ],

    // 2. Dedicated for Commercial Kitchens & Messes
    kitchens: [
      {
        num: "01",
        badge: "Kitchen Step 1 • AI Demand Forecasting",
        title: "Predict Daily Demand with AI",
        layman: "Before cooking starts, our machine learning forecasts student and staff dining turnout based on academic calendars and past consumption.",
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        lightBg: "bg-emerald-50",
        borderColor: "border-emerald-200",
        accentText: "text-emerald-700",
        tag: "📉 Stop Over-Prepping",
        highlights: ["Reduces overcooking up to 35%", "Syncs with kitchen menu cycles", "Cuts raw ingredient procurement costs"],
        icon: TrendingDown,
        preview: {
          title: "AI Headcount Forecast",
          item: "Lunch Service: 420 expected meals",
          quantity: "Prep Target: 65 kg Rice, 40 kg Dal",
          status: "Forecast Confidence 96%",
        },
      },
      {
        num: "02",
        badge: "Kitchen Step 2 • 30-Second Surplus Log",
        title: "Log Extra Food with 1 Tap",
        layman: "Whatever remains unserved at service close is weighed and recorded in 30 seconds on tablet or phone with automated temperature logging.",
        color: "amber",
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        borderColor: "border-amber-200",
        accentText: "text-amber-700",
        tag: "⏱️ Under 30 Secs",
        highlights: ["Zero manual paperwork", "Supports bulk kilograms or plate counts", "Automated timer starts immediately"],
        icon: Utensils,
        preview: {
          title: "Kitchen Surplus Log",
          item: "Paneer Curry & Chapati Batch",
          quantity: "28 kg (~70 meals logged)",
          status: "Ready for NGO Match",
        },
      },
      {
        num: "03",
        badge: "Kitchen Step 3 • 100% Legal Protection",
        title: "Automated Safety & Liability Shield",
        layman: "Pre-set FSSAI temperature checks ensure safe packaging. Donors are legally shielded under statutory Good Samaritan food recovery protections.",
        color: "sky",
        gradient: "from-sky-500 to-blue-600",
        lightBg: "bg-sky-50",
        borderColor: "border-sky-200",
        accentText: "text-sky-700",
        tag: "🛡️ Zero Liability",
        highlights: ["Fail-closed safety threshold check", "Timestamped digital dispatch seal", "Full compliance documentation"],
        icon: ShieldCheck,
        preview: {
          title: "Safety Compliance Seal",
          item: "Donor: Nobel Stays Mess",
          quantity: "Thermal Temp: 65°C Insulated",
          status: "Verified Donor Protection",
        },
      },
      {
        num: "04",
        badge: "Kitchen Step 4 • ESG & CSR Rewards",
        title: "Download Certified Impact Reports",
        layman: "Every kilogram of surplus rescued generates an official Scope 3 carbon reduction certificate and verified corporate CSR donation receipt.",
        color: "violet",
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        borderColor: "border-violet-200",
        accentText: "text-violet-700",
        tag: "🌱 ESG Audit-Ready",
        highlights: ["Scope 3 greenhouse gas avoidance", "Direct audit PDF export for leadership", "PR and sustainability badges"],
        icon: Award,
        preview: {
          title: "Annual Sustainability Credit",
          item: "12,450 Meals Diverted to Date",
          quantity: "22,410 kg CO₂e Offset",
          status: "Audited & Certified",
        },
      },
    ],

    // 3. Dedicated for Charities & NGOs
    ngos: [
      {
        num: "01",
        badge: "NGO Step 1 • Real-Time Phone Alerts",
        title: "Receive Instant Local Food Alerts",
        layman: "Whenever partner dining halls within 10 km log fresh surplus, verified charities receive instant push notifications with dish details and portion sizes.",
        color: "amber",
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        borderColor: "border-amber-200",
        accentText: "text-amber-700",
        tag: "🔔 Instant Alert",
        highlights: ["100% free food for non-profits", "Real-time push alerts on phone", "Shows exact dish and portion counts"],
        icon: BellRing,
        preview: {
          title: "New Surplus Broadcast",
          item: "Fresh Biryani & Veg Raita",
          quantity: "150 plates available",
          status: "Nearby (2.8 km away)",
        },
      },
      {
        num: "02",
        badge: "NGO Step 2 • 1-Tap Free Claiming",
        title: "Claim Hot Meals in 1 Tap",
        layman: "Tap 'Claim' on your mobile dashboard to instantly reserve the batch for your shelter. Zero bidding, zero cost, and zero paperwork.",
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        lightBg: "bg-emerald-50",
        borderColor: "border-emerald-200",
        accentText: "text-emerald-700",
        tag: "✅ Claimed in 10s",
        highlights: ["Immediate lock prevents duplicate claims", "Free meal supply for your community", "Matches your shelter's dining capacity"],
        icon: HeartHandshake,
        preview: {
          title: "Claim Reservation Locked",
          item: "Reserved for Ananda Children's Home",
          quantity: "150 Meals Reserved",
          status: "Driver Assigned for Pickup",
        },
      },
      {
        num: "03",
        badge: "NGO Step 3 • Real-Time Delivery Tracking",
        title: "Track Courier Directly to Door",
        layman: "Watch the delivery courier move in real time on the live map. Hot food is transported in hygienic insulated thermal crates directly to your facility.",
        color: "sky",
        gradient: "from-sky-500 to-blue-600",
        lightBg: "bg-sky-50",
        borderColor: "border-sky-200",
        accentText: "text-sky-700",
        tag: "🚚 Live GPS Map",
        highlights: ["Turn-by-turn ETA updates", "Direct driver phone communication", "Food arrives hot and ready to serve"],
        icon: Truck,
        preview: {
          title: "Courier Dispatch Tracking",
          item: "Driver: Rajesh K. (En Route)",
          quantity: "Arriving in 14 minutes",
          status: "Insulated Thermal Box",
        },
      },
      {
        num: "04",
        badge: "NGO Step 4 • Digital Receipt Confirmation",
        title: "Confirm Receipt & Nourish Community",
        layman: "When the driver arrives, simply confirm receipt on your smartphone with 1 click. Serve warm, nutritious meals to families that same afternoon or evening.",
        color: "violet",
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        borderColor: "border-violet-200",
        accentText: "text-violet-700",
        tag: "🍲 Ready to Serve",
        highlights: ["1-click digital receipt drop-off", "Nutritious, high-quality dining food", "Build lasting local food security"],
        icon: CheckCircle2,
        preview: {
          title: "Delivery Receipt Completed",
          item: "Received by Shelter Supervisor",
          quantity: "150 Beneficiaries Fed",
          status: "Verified & Closed",
        },
      },
    ],

    // 4. Dedicated for Volunteer Drivers & Logistics Couriers
    drivers: [
      {
        num: "01",
        badge: "Driver Step 1 • Nearby Dispatch Alert",
        title: "Get Nearby Pickup Assignments",
        layman: "Delivery partners receive a phone ping when a surplus package is ready for transfer between a local dining hall and nearby shelter.",
        color: "sky",
        gradient: "from-sky-500 to-blue-600",
        lightBg: "bg-sky-50",
        borderColor: "border-sky-200",
        accentText: "text-sky-700",
        tag: "📍 Local & Quick",
        highlights: ["Short distance transfers (avg 4-8 km)", "Flexible schedule & volunteering", "Clear pickup and drop-off addresses"],
        icon: MapPin,
        preview: {
          title: "Dispatch Request Alert",
          item: "From: City College Mess",
          quantity: "To: St. Jude Community Shelter",
          status: "Distance: 4.2 km (Accept?)",
        },
      },
      {
        num: "02",
        badge: "Driver Step 2 • Contactless Kitchen Pickup",
        title: "Fast Pickup at the Kitchen",
        layman: "Arrive at the kitchen dispatch door. Staff hand over pre-packed, sealed insulated boxes. Scan the digital pass and hit 'Picked Up'.",
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        lightBg: "bg-emerald-50",
        borderColor: "border-emerald-200",
        accentText: "text-emerald-700",
        tag: "📦 2-Minute Handover",
        highlights: ["Pre-packed and labeled containers", "No waiting in lines", "Instant timestamped digital handover"],
        icon: QrCode,
        preview: {
          title: "Kitchen Pickup Verified",
          item: "3 Insulated Food Crates",
          quantity: "Weight: 35.0 kg",
          status: "Status: Picked Up",
        },
      },
      {
        num: "03",
        badge: "Driver Step 3 • Turn-by-Turn GPS Guidance",
        title: "Drive Optimized Direct Route",
        layman: "ZeroPlate's mobile dashboard routes you straight to the recipient NGO shelter using optimal city traffic routes to keep food fresh and warm.",
        color: "amber",
        gradient: "from-amber-500 to-orange-600",
        lightBg: "bg-amber-50",
        borderColor: "border-amber-200",
        accentText: "text-amber-700",
        tag: "🧭 Smooth Routing",
        highlights: ["In-app navigation to destination", "Estimated arrival time shared with NGO", "Direct support contact if needed"],
        icon: Truck,
        preview: {
          title: "Transit Navigation Live",
          item: "Destination: Hope Shelter Gate 2",
          quantity: "ETA: 12 mins remaining",
          status: "On Schedule",
        },
      },
      {
        num: "04",
        badge: "Driver Step 4 • Drop-off & Volunteer Credit",
        title: "Deliver & Earn Verified Hours",
        layman: "Hand over the food crates to the shelter team. Tap 'Delivered' to record delivery proof, community volunteer hours, or logistics payouts.",
        color: "violet",
        gradient: "from-violet-500 to-purple-600",
        lightBg: "bg-violet-50",
        borderColor: "border-violet-200",
        accentText: "text-violet-700",
        tag: "⭐ Mission Completed",
        highlights: ["Instant delivery completion stamp", "Verified community service certificates", "Logistics compensation or awards"],
        icon: Award,
        preview: {
          title: "Assignment Completed",
          item: "Delivery Dropped Off Successfully",
          quantity: "85 Warm Meals Delivered",
          status: "Volunteer Credit Logged",
        },
      },
    ],
  };

  // Dedicated page redirect URLs
  const dedicatedPages: Record<RoleType, { url: string; label: string; registerUrl: string; registerLabel: string }> = {
    all: {
      url: "/how-it-works",
      label: "Open Full How It Works Guide",
      registerUrl: "/register",
      registerLabel: "Get Started Free",
    },
    kitchens: {
      url: "/institutions",
      label: "Go to Dedicated Kitchens Hub",
      registerUrl: "/register?role=institution_admin",
      registerLabel: "Register Kitchen / Mess",
    },
    ngos: {
      url: "/ngos",
      label: "Go to Dedicated NGOs Hub",
      registerUrl: "/register?role=ngo",
      registerLabel: "Register Charity for Free Meals",
    },
    drivers: {
      url: "/register?role=delivery_partner",
      label: "Go to Driver Onboarding Page",
      registerUrl: "/register?role=delivery_partner",
      registerLabel: "Sign Up as Delivery Courier",
    },
  };

  const roleMeta: Record<RoleType, { headline: string; subtitle: string; tag: string }> = {
    all: {
      tag: "Complete Lifecycle",
      headline: "The 4-Step Circular Food Rescue Journey",
      subtitle: "See how excess fresh food from college dining halls and corporate cafeterias flows directly to local shelters.",
    },
    kitchens: {
      tag: "For Commercial Dining",
      headline: "How It Works for Kitchens & College Messes",
      subtitle: "Eliminate kitchen food waste, reduce cooking costs with AI, and receive verified Scope 3 carbon tax credits.",
    },
    ngos: {
      tag: "For Charities & Shelters",
      headline: "How It Works for Non-Profits & Food Banks",
      subtitle: "Claim 100% free, safe, delicious surplus meals for your shelter with zero phone calls or logistical headaches.",
    },
    drivers: {
      tag: "For Volunteers & Couriers",
      headline: "How It Works for Delivery Drivers & Couriers",
      subtitle: "Pick up packaged meals and transport them to local community shelters with step-by-step mobile GPS guidance.",
    },
  };

  const currentSteps = roleStepsData[activeRole];
  const currentDedicated = dedicatedPages[activeRole];
  const currentMeta = roleMeta[activeRole];

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/60 to-white relative overflow-hidden">
      {/* Decorative ambient spots */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Interactive Visual Guide</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            How ZeroPlate Works in Simple Steps
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Effortless, automated, and built for real-world chefs, volunteers, and drivers. 
            Select your role below to explore your customized workflow or jump directly to the dedicated hub.
          </p>

          {/* Interactive Role Switcher - Strictly arranged in the same line */}
          <div className="mt-8 w-full max-w-4xl mx-auto flex justify-center">
            <div className="inline-flex flex-nowrap items-center gap-1 sm:gap-1.5 p-1.5 rounded-full bg-slate-100/90 border border-slate-200 shadow-xs overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
              <button
                type="button"
                onClick={() => {
                  setActiveRole("all");
                  setActiveStep(0);
                }}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5",
                  activeRole === "all"
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                <span>🌟 Complete Journey</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("kitchens");
                  setActiveStep(0);
                }}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5",
                  activeRole === "kitchens"
                    ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                <span>👨‍🍳 For Kitchens</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("ngos");
                  setActiveStep(0);
                }}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5",
                  activeRole === "ngos"
                    ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                <span>🤝 For Charities & NGOs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveRole("drivers");
                  setActiveStep(0);
                }}
                className={cn(
                  "px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1.5",
                  activeRole === "drivers"
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-sky-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                )}
              >
                <span>🚚 For Drivers & Couriers</span>
              </button>
            </div>
          </div>

          {/* Clean Dedicated Link Bar */}
          <div className="mt-3.5 flex items-center justify-center">
            <Link
              href={currentDedicated.url}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/80 px-3.5 py-1.5 rounded-full transition-all group shadow-2xs"
            >
              <span>{currentDedicated.label}</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Dynamic Role Headline Callout */}
        <div className="mb-8 text-center max-w-2xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-3 py-1 rounded-full">
            {currentMeta.tag}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 mt-2">
            {currentMeta.headline}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {currentMeta.subtitle}
          </p>
        </div>

        {/* 4 Interactive Step Progression Cards - Dynamically Updates on Role Change */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-300">
          {currentSteps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;

            return (
              <div
                key={`${activeRole}-${step.num}`}
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
                  <h4 className="text-lg font-bold text-slate-900 mb-2.5 leading-snug group-hover:text-emerald-700 transition-colors">
                    {step.title}
                  </h4>
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

        {/* Dynamic Action Banner with Direct Dedicated Page Redirect Button */}
        <div className="mt-12 rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-10 shadow-lg shadow-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-100/70 text-emerald-800 text-xs font-bold">
              <span>{currentMeta.tag}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentMeta.headline}
            </h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
              {currentMeta.subtitle}
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

          {/* Direct Redirection Actions */}
          <div className="w-full lg:w-auto shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all text-center justify-center"
            >
              <Link href={currentDedicated.url} className="flex items-center gap-2">
                <span>{currentDedicated.label}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-6 px-6 rounded-xl text-center justify-center"
            >
              <Link href={currentDedicated.registerUrl}>
                <span>{currentDedicated.registerLabel}</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
