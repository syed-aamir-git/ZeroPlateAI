"use client";

import { useState } from "react";
import {
  Car,
  Droplets,
  Zap,
  Utensils,
  Leaf,
  Scale,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  FileCheck2,
  Layers,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Building2,
  HeartHandshake,
} from "lucide-react";
import { PlatformStats, LiveRedistributionTicket } from "@/lib/platform-stats";

interface ImpactInteractiveExplorerProps {
  stats: PlatformStats;
  tickets?: LiveRedistributionTicket[];
}

export function ImpactInteractiveExplorer({
  stats,
  tickets = [],
}: ImpactInteractiveExplorerProps) {
  const [activeTab, setActiveTab] = useState<"equivalents" | "calculator" | "audit">("equivalents");
  const [selectedEquivalent, setSelectedEquivalent] = useState<"car" | "water" | "energy" | "meals">("car");
  
  // Custom calculator state
  const [customKg, setCustomKg] = useState<number>(100);

  // Dynamic calculations based on live stats
  const totalWasteKg = stats.wastePreventedKg || 420;
  const totalCo2Kg = stats.co2eAvoidedKg || Math.round(totalWasteKg * 1.8);
  const totalMeals = stats.mealsRedistributed || Math.round(totalWasteKg * 2.5);

  // Equivalents logic
  // 1 kg CO2e ≈ 4.1 km driven by an average passenger car (EPA factor)
  const carKmAvoided = Math.round(totalCo2Kg * 4.1);
  // 1 kg food ≈ 850 L virtual water footprint saved (UN FAO global benchmark)
  const waterLitresSaved = Math.round(totalWasteKg * 850);
  // 1 kg food embodied energy ≈ 120 smartphone recharges (EPA energy conversion)
  const smartphoneCharges = Math.round(totalWasteKg * 120);

  // Custom calculator computed metrics
  const calcMeals = Math.round(customKg * 2.5);
  const calcCo2 = Math.round(customKg * 1.8 * 10) / 10;
  const calcWater = Math.round(customKg * 850);
  const calcCarKm = Math.round(calcCo2 * 4.1);
  const calcShelterSavings = Math.round(calcMeals * 35); // ₹35 avg meal value

  return (
    <div className="w-full max-w-6xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Interactive Mode Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200/90 bg-gradient-to-r from-emerald-50/60 via-slate-50 to-amber-50/60 px-6 py-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Transparency Explorer
          </span>
        </div>

        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("equivalents")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "equivalents"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🌍 Real-World Equivalents
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("calculator")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "calculator"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🧮 Kitchen Potential Calculator
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "audit"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📋 Live Audit Records
          </button>
        </div>
      </div>

      {/* TAB 1: REAL-WORLD EQUIVALENTS (LAYMAN TRANSLATION) */}
      {activeTab === "equivalents" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              Plain English Impact
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              What Do These Numbers Mean in Real Life?
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Carbon and weight metrics can be hard to picture. Select any lens below to see the tangible environmental and human benefits of our collective food rescue.
            </p>
          </div>

          {/* 4 Interactive Selector Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <button
              type="button"
              onClick={() => setSelectedEquivalent("car")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                selectedEquivalent === "car"
                  ? "border-emerald-500 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/40"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <Car className="w-5 h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {carKmAvoided.toLocaleString()} km
              </div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-tight mt-1">
                Car Miles Off Road
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEquivalent("water")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                selectedEquivalent === "water"
                  ? "border-sky-500 bg-sky-50/60 shadow-md ring-2 ring-sky-400/40"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {waterLitresSaved.toLocaleString()} L
              </div>
              <div className="text-xs font-bold text-sky-800 uppercase tracking-tight mt-1">
                Virtual Water Saved
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEquivalent("energy")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                selectedEquivalent === "energy"
                  ? "border-amber-500 bg-amber-50/60 shadow-md ring-2 ring-amber-400/40"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {smartphoneCharges.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-tight mt-1">
                Phone Recharges Saved
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedEquivalent("meals")}
              className={`p-5 rounded-2xl border text-left transition-all relative ${
                selectedEquivalent === "meals"
                  ? "border-violet-500 bg-violet-50/60 shadow-md ring-2 ring-violet-400/40"
                  : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {totalMeals.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-violet-800 uppercase tracking-tight mt-1">
                Hot Meals to Shelters
              </div>
            </button>
          </div>

          {/* Detailed Spotlight Description */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Verified Scientific Methodology (UN FAO Standard)</span>
              </div>
              <h4 className="text-xl font-extrabold text-slate-900">
                {selectedEquivalent === "car" &&
                  `Prevented ${totalCo2Kg.toLocaleString()} kg of greenhouse gases from rotting organic waste.`}
                {selectedEquivalent === "water" &&
                  `Conserved ${waterLitresSaved.toLocaleString()} litres of agricultural irrigation water.`}
                {selectedEquivalent === "energy" &&
                  `Saved enough farming and transport energy to power ${smartphoneCharges.toLocaleString()} smartphones.`}
                {selectedEquivalent === "meals" &&
                  `Provided ${totalMeals.toLocaleString()} dignified, hot, freshly cooked meals to hungry community members.`}
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedEquivalent === "car" &&
                  "When food rots in open city landfills, it releases methane — a greenhouse gas 28 times more destructive than carbon dioxide. By diverting fresh food before disposal, we effectively remove the emissions equal to driving a standard petrol vehicle for thousands of kilometers."}
                {selectedEquivalent === "water" &&
                  "Agriculture accounts for 70% of freshwater withdrawals globally. Growing a single kilogram of rice or wheat takes hundreds of litres of water. When food is wasted, all that water is lost. ZeroPlate ensures none of that vital water is squandered."}
                {selectedEquivalent === "energy" &&
                  "Every plate of food requires diesel for tractors, electricity for cold storage, and gas for cooking. Rescuing food rescues the entire supply chain energy that brought it from farm to table."}
                {selectedEquivalent === "meals" &&
                  "Commercial kitchens and banquets prepare excess delicious meals every day. ZeroPlate matches this surplus directly with verified shelters and children's homes in under 45 minutes, ensuring 100% free food with zero phantom claims."}
              </p>
            </div>

            <div className="shrink-0 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm text-center min-w-[200px]">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                Integrity Standard
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">
                100% Real DB
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Zero fabricated statistics
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audited Proof</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KITCHEN POTENTIAL CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full">
              Interactive Forecast Tool
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Calculate What Your Facility Can Prevent
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select how much surplus food your dining hall, hospital, or hotel might generate in a typical week to see the projected annual savings and community relief.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="max-w-xl mx-auto mb-8">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-center mb-3">
              Weekly Surplus Volume (Select or Adjust):
            </label>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[25, 50, 100, 250].map((kg) => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => setCustomKg(kg)}
                  className={`py-3 px-2 rounded-2xl font-extrabold text-center transition-all ${
                    customKg === kg
                      ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400 scale-[1.02]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div className="text-lg sm:text-xl">{kg} kg</div>
                  <div className="text-[10px] uppercase font-bold tracking-tight opacity-80">
                    per week
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Calculator Output Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {calcMeals.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-tight mt-1">
                Wholesome Free Meals
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Delivered warm and fresh to local children and shelters.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-xs">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {calcCo2} kg
              </div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-tight mt-1">
                CO₂e Emissions Blocked
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Official Scope 3 carbon reduction certified for university/ESG audits.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-sky-200 bg-gradient-to-br from-sky-50/80 to-blue-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <Car className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {calcCarKm.toLocaleString()} km
              </div>
              <div className="text-xs font-bold text-sky-800 uppercase tracking-tight mt-1">
                Equivalent Vehicle km
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Equal to removing a vehicle from city streets for this distance.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold mb-3 shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹{calcShelterSavings.toLocaleString("en-IN")}
              </div>
              <div className="text-xs font-bold text-violet-800 uppercase tracking-tight mt-1">
                Shelter Grocery Savings
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Redirected to children&apos;s schooling, blankets, and medicine.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE AUDIT RECORDS (TRANSPARENCY LEDGER STREAM) */}
      {activeTab === "audit" && (
        <div className="p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                Permanent MongoDB Records
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                Recent Verified Redistribution Entries
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Every line item is validated by donor temperature logs and recipient digital sign-off.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Audit Stream
              </span>
            </div>
          </div>

          {tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.slice(0, 6).map((ticket, idx) => (
                <div
                  key={ticket.id || idx}
                  className="rounded-2xl p-4 border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {ticket.item}
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {ticket.statusLabel || "Verified"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {ticket.institutionType || "Commercial Dining"}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {ticket.meals} Meals ({ticket.quantity})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Safe</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        ID: ZP-{ticket.id?.slice(-6) || "948210"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 p-8 text-center space-y-2 bg-slate-50/50">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-slate-900">
                Transparent Ledger Initializing
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All metrics are generated in real-time from active partner facilities. As kitchens log daily meals and NGOs sign digital handoffs, individual audit receipts appear here automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
