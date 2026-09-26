"use client";

import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Utensils,
  Leaf,
  CheckCircle2,
  Clock,
  HeartHandshake,
  Truck,
  RotateCcw,
  Building2,
  Award,
  Users,
  AlertTriangle,
  XCircle,
  ThumbsUp,
  Brain,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AboutInteractiveJourney() {
  const [activeTab, setActiveTab] = useState<"comparison" | "pillars" | "stories">("comparison");
  const [selectedPillar, setSelectedPillar] = useState<number>(0);
  const [selectedStory, setSelectedStory] = useState<number>(0);

  const pillars = [
    {
      icon: Brain,
      title: "Predictive AI Prevention",
      tagline: "Stop Waste Before Prep Begins",
      color: "emerald",
      badge: "Source Reduction",
      gradient: "from-emerald-500 to-teal-600",
      desc: "Most kitchen waste happens because chefs have to guess how many students or employees will show up. Our algorithms analyze past attendance, holiday calendars, exam schedules, and weather patterns to accurately forecast morning prep counts.",
      stat: "Cuts kitchen overages by up to 35%",
    },
    {
      icon: ShieldCheck,
      title: "Automated Food Safety Gate",
      tagline: "Fail-Closed Hygiene Compliance",
      color: "amber",
      badge: "Zero Compromises",
      gradient: "from-amber-500 to-orange-600",
      desc: "Food safety cannot be an afterthought. Our platform enforces automated 4-hour freshness clocks. Hot food must be logged and dispatched within strict temperature limits, or the listing is automatically locked out.",
      stat: "Strict 4-hour freshness rules",
    },
    {
      icon: HeartHandshake,
      title: "Zero Phantom Food Claiming",
      tagline: "1-Tap Exclusive Shelter Lock",
      color: "sky",
      badge: "Guaranteed Reservation",
      gradient: "from-sky-500 to-blue-600",
      desc: "Shelters should never drive across town only to find someone else took the food. The second a charity taps Claim, the batch is exclusively reserved in the database and an insulated courier is dispatched immediately.",
      stat: "100% exclusive digital lock",
    },
    {
      icon: Award,
      title: "Certified Audit Accountability",
      tagline: "No Greenwashing or Fake Metrics",
      color: "violet",
      badge: "UN FAO & Scope 3",
      gradient: "from-violet-500 to-purple-600",
      desc: "Every kilogram saved produces an official Scope 3 carbon reduction certificate and CSR donation document. ZeroPlate never displays fabricated sample numbers — every metric requires a verified recipient receipt.",
      stat: "Audited PDF certificates",
    },
  ];

  const stories = [
    {
      role: "College Dining Hall Director",
      name: "Chef Rajesh Verma",
      organization: "Apex Technical University Mess",
      avatarBg: "bg-emerald-100 text-emerald-800",
      quote:
        "Before ZeroPlate, exam weekends left us with 200 extra servings of hot food and no safe way to give it away without liability. Now, our chefs log extra trays in 30 seconds, and verified couriers deliver warm meals to children's shelters within 40 minutes.",
      impact: "Rescued 1,840 kg of fresh food in 1 semester",
    },
    {
      role: "Shelter Operations Lead",
      name: "Sister Meera Joseph",
      organization: "St. Jude Children's Home & Shelter",
      avatarBg: "bg-amber-100 text-amber-800",
      quote:
        "Our shelter feeds 80 orphaned children every evening. With ZeroPlate, we receive hot, high-protein dinners directly to our door completely free of cost. This has saved our monthly food budget and allowed us to buy new schoolbooks and medicines.",
      impact: "Saved ₹95,000 in monthly grocery bills",
    },
    {
      role: "Food Rescue Courier Volunteer",
      name: "Amitabh Sen",
      organization: "Community Logistics Network",
      avatarBg: "bg-sky-100 text-sky-800",
      quote:
        "The app gives me live turn-by-turn navigation with thermal insulated hot crates. Knowing that a 20-minute delivery run ensures dozens of elderly shelter residents eat a warm meal gives me immense joy and pride.",
      impact: "Completed 140+ hot doorstep deliveries",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Top Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200/90 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-amber-50/70 px-6 py-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive ZeroPlate Experience
          </span>
        </div>

        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("comparison")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "comparison"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔄 The Shift We Create
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pillars")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "pillars"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🏛️ 4 Core Pillars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("stories")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "stories"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            💬 Real Community Voices
          </button>
        </div>
      </div>

      {/* TAB 1: THE SHIFT WE CREATE (OLD WAY VS ZEROPLATE) */}
      {activeTab === "comparison" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              Systemic Transformation
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Replacing Waste with Dignified Flow
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              See how ZeroPlate re-engineers food recovery from frantic guesswork into a seamless, certified platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* The Old Broken Way */}
            <div className="rounded-2xl p-6 border border-slate-200 bg-slate-50/70 text-left space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  Traditional Food Waste Cycle
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Status Quo</span>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Unpredictable Kitchen Prep:</strong>
                    Chefs cook based on gut feeling. Hundreds of kilograms of leftover food are produced.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Fear of Legal Liability:</strong>
                    Donors worry about safety risks and lack a clear legal shield, so food is discarded.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Dumped in City Landfills:</strong>
                    Food decomposes in city garbage heaps, generating destructive methane gas emissions.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 text-xs text-rose-600 font-semibold">
                Outcome: Lost money, harmful emissions, and hungry families nearby left unfed.
              </div>
            </div>

            {/* The ZeroPlate Operating System */}
            <div className="rounded-2xl p-6 border border-emerald-300 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 text-left space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                  The ZeroPlate Operating System
                </span>
                <span className="text-[11px] text-emerald-700 font-mono font-bold">100% Free Relief</span>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">AI Headcount Forecasting:</strong>
                    Machine learning predicts attendance to cut overcooking before the stove turns on.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">30-Second Logging &amp; 4-Hr Safety Lock:</strong>
                    Surplus trays are logged instantly. Temperature gates ensure food is 100% hygienic.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <strong className="text-slate-900 block text-xs">Warm Insulated Doorstep Delivery:</strong>
                    Dedicated couriers transport hot food in thermal crates to verified shelters in &lt; 45 mins.
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-200 text-xs text-emerald-700 font-semibold">
                Outcome: Lower kitchen costs, full Good Samaritan legal shield, and nourished children.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 4 CORE PILLARS (INTERACTIVE DEEP DIVE) */}
      {activeTab === "pillars" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full">
              Platform Architecture
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Engineered for Real-World Kitchens
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select any pillar below to see how our engineering choices protect donors and feed communities.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              const isSelected = selectedPillar === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPillar(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/70 shadow-md ring-2 ring-emerald-400/40"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.gradient} text-white flex items-center justify-center mb-2 shadow-xs`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {p.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {p.badge}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Pillar Card */}
          {pillars[selectedPillar] && (() => {
            const cur = pillars[selectedPillar];
            const CurIcon = cur.icon;
            return (
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-6 sm:p-8 text-left space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cur.gradient} text-white flex items-center justify-center shadow-md`}
                    >
                      <CurIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xl font-extrabold text-slate-900">
                        {cur.title}
                      </h4>
                      <div className="text-xs font-semibold text-emerald-700">
                        {cur.tagline}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 self-start sm:self-auto">
                    {cur.stat}
                  </span>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  {cur.desc}
                </p>

                <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Integrated into the live ZeroPlate dispatch and verification workflow.</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 3: REAL COMMUNITY VOICES */}
      {activeTab === "stories" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 border border-sky-200/60 px-3 py-1 rounded-full">
              Voices on the Ground
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Stories from Kitchens, Shelters &amp; Couriers
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select any role below to hear firsthand how ZeroPlate impacts daily operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {stories.map((s, idx) => {
              const isSelected = selectedStory === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedStory(idx)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? "border-sky-500 bg-sky-50/70 shadow-md ring-2 ring-sky-400/40"
                      : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">{s.name}</div>
                  <div className="text-[11px] text-sky-700 font-medium mt-0.5">{s.role}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-1">{s.organization}</div>
                </button>
              );
            })}
          </div>

          {/* Active Story Card */}
          {stories[selectedStory] && (() => {
            const cur = stories[selectedStory];
            return (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-left space-y-4 shadow-sm">
                <Quote className="w-8 h-8 text-amber-500/40" />
                <p className="text-base text-slate-800 leading-relaxed font-normal italic">
                  &ldquo;{cur.quote}&rdquo;
                </p>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">{cur.name}</div>
                    <div className="text-xs text-slate-500">
                      {cur.role} • {cur.organization}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 self-start sm:self-auto">
                    {cur.impact}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
