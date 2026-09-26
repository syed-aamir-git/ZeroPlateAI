"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Truck,
  Utensils,
  Zap,
  ArrowRight,
  RotateCcw,
  IndianRupee,
  Users,
  Leaf,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DonationBatch {
  id: string;
  source: string;
  sourceType: string;
  meals: number;
  item: string;
  distance: string;
  cookedAgo: string;
  temp: string;
  dietary: string;
  verified: boolean;
}

const sampleBatches: DonationBatch[] = [
  {
    id: "batch-1",
    source: "City University Central Mess",
    sourceType: "College Dining Hall",
    meals: 140,
    item: "Veg Biryani, Mixed Dal & Roti",
    distance: "2.4 km away",
    cookedAgo: "45 mins ago",
    temp: "68°C Hot",
    dietary: "100% Pure Vegetarian",
    verified: true,
  },
  {
    id: "batch-2",
    source: "Grand Regency Hotel & Banquet",
    sourceType: "Hotel Buffet",
    meals: 85,
    item: "Paneer Gravy, Jeera Rice & Chapati",
    distance: "3.1 km away",
    cookedAgo: "25 mins ago",
    temp: "71°C Hot",
    dietary: "Vegetarian & High-Protein",
    verified: true,
  },
  {
    id: "batch-3",
    source: "Apex Care Hospital Cafeteria",
    sourceType: "Healthcare Dietary",
    meals: 60,
    item: "Mild Khichdi & Steamed Veggies",
    distance: "1.8 km away",
    cookedAgo: "15 mins ago",
    temp: "74°C Hot",
    dietary: "Low Spice & Nutritious",
    verified: true,
  },
];

export function NgoInteractiveShowcase() {
  const [activeTab, setActiveTab] = useState<"simulator" | "calculator">("simulator");
  const [selectedBatch, setSelectedBatch] = useState<DonationBatch>(sampleBatches[0]);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);
  const [claimProgress, setClaimProgress] = useState<boolean>(false);

  // Calculator state
  const [dailyHeadcount, setDailyHeadcount] = useState<number>(100);

  const handleClaim = () => {
    setClaimProgress(true);
    setTimeout(() => {
      setClaimProgress(false);
      setIsClaimed(true);
    }, 600);
  };

  const handleReset = () => {
    setIsClaimed(false);
    setClaimProgress(false);
  };

  // Calculations for 30 days
  const monthlyMeals = dailyHeadcount * 30;
  const monthlySavings = monthlyMeals * 35; // ₹35 per meal estimate
  const monthlyFoodKg = Math.round(monthlyMeals * 0.45); // ~450g per plate
  const co2PreventedKg = Math.round(monthlyFoodKg * 2.5); // ~2.5kg CO2 per kg food

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-slate-200/90 bg-white shadow-xl shadow-slate-200/40 overflow-hidden">
      {/* Top Interactive Mode Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-200/90 bg-gradient-to-r from-amber-50/70 via-slate-50 to-emerald-50/70 px-6 py-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Interactive Non-Profit Experience
          </span>
        </div>

        <div className="inline-flex p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("simulator")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "simulator"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📱 Live Meal Claim Demo
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
            💰 Shelter Budget Savings Calculator
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE MEAL CLAIM SIMULATOR */}
      {activeTab === "simulator" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-200/60 px-3 py-1 rounded-full">
              Test In 10 Seconds
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              See What Your Shelter Receives
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select any live kitchen surplus below, then tap &quot;Claim Free Meals&quot; to test instant reservation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Sample Batch Selector */}
            <div className="lg:col-span-5 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Available Surplus Nearby (Select One)
              </label>
              {sampleBatches.map((batch) => {
                const isSelected = selectedBatch.id === batch.id;
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => {
                      setSelectedBatch(batch);
                      setIsClaimed(false);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 relative ${
                      isSelected
                        ? "border-amber-400 bg-amber-50/50 shadow-md ring-2 ring-amber-300/40"
                        : "border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                          {batch.sourceType}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">
                          {batch.source}
                        </h4>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        {batch.meals} Meals
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-1">
                      {batch.item}
                    </p>

                    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500" />
                        {batch.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {batch.cookedAgo}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right: Simulated Mobile Shelter Claim View */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border-2 border-slate-800 bg-slate-900 p-4 shadow-2xl relative text-white">
                {/* Phone Notch Bar */}
                <div className="flex items-center justify-between px-3 py-1 text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
                  <span className="font-semibold">ZeroPlate Charity App</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>GPS Active • 100% Free</span>
                  </div>
                </div>

                {!isClaimed ? (
                  /* Unclaimed State */
                  <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          <Utensils className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-300">
                            Incoming Fresh Batch
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            {selectedBatch.source}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-full">
                        {selectedBatch.temp}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/60">
                      <div className="text-xs text-slate-400">Menu Contents:</div>
                      <div className="text-base font-bold text-amber-300 mt-0.5">
                        {selectedBatch.item}
                      </div>
                      <div className="flex items-center gap-4 mt-2.5 text-xs text-slate-300">
                        <span>🍱 {selectedBatch.meals} Hot Plates</span>
                        <span>🌱 {selectedBatch.dietary}</span>
                        <span>📍 {selectedBatch.distance}</span>
                      </div>
                    </div>

                    {/* Safety Verification Pill */}
                    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-700/50 p-2.5 rounded-xl">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        <strong>Safety Verified:</strong> Cooked {selectedBatch.cookedAgo} in a licensed commercial kitchen.
                      </span>
                    </div>

                    {/* Claim Button */}
                    <Button
                      onClick={handleClaim}
                      disabled={claimProgress}
                      className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-base py-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {claimProgress ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Locking Reservation in System...</span>
                        </>
                      ) : (
                        <>
                          <HeartHandshake className="w-5 h-5 text-slate-950" />
                          <span>Claim {selectedBatch.meals} Free Meals (1-Tap Lock)</span>
                        </>
                      )}
                    </Button>

                    <p className="text-[11px] text-center text-slate-400">
                      ₹0.00 platform charge. Locked exclusively to your shelter upon tap.
                    </p>
                  </div>
                ) : (
                  /* Successfully Claimed State */
                  <div className="bg-slate-800/90 rounded-2xl p-5 border border-emerald-500/60 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        <div>
                          <div className="text-xs font-bold text-emerald-400">
                            CLAIM LOCKED &amp; CONFIRMED
                          </div>
                          <div className="text-sm font-extrabold text-white">
                            Assigned Exclusively to Your Shelter
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                        Zero Phantom Food
                      </span>
                    </div>

                    {/* Dispatch Courier Card */}
                    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-amber-400" />
                          Dedicated Food Courier:
                        </span>
                        <span className="font-bold text-amber-300">Rajesh K. (4.9★)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Estimated Doorstep Arrival:</span>
                        <span className="font-extrabold text-white">22 mins (1:20 PM)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Transport Method:</span>
                        <span className="text-emerald-300 font-medium">Insulated Hot Thermal Crates</span>
                      </div>
                    </div>

                    {/* Zero Cost Breakdown */}
                    <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/40 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400">Food Cost</div>
                        <div className="font-bold text-emerald-400">₹0.00</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Delivery</div>
                        <div className="font-bold text-emerald-400">₹0.00</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">Shelter Total</div>
                        <div className="font-extrabold text-white">₹0.00 Free</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Test Another Donation</span>
                      </button>

                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        100% Free Forever
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHELTER BUDGET SAVINGS CALCULATOR */}
      {activeTab === "calculator" && (
        <div className="p-6 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full">
              Non-Profit Financial Impact
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              Calculate Your Monthly Savings
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Select how many meals your shelter serves daily to see how much food budget you can redirect to medical care, education, and shelter facilities.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-10">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block text-center mb-3">
              Daily People or Meals Served at Your Shelter:
            </label>
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              {[50, 100, 250, 500].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setDailyHeadcount(count)}
                  className={`py-3 px-2 rounded-2xl font-extrabold text-center transition-all ${
                    dailyHeadcount === count
                      ? "bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400 scale-[1.03]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <div className="text-lg sm:text-xl">{count}</div>
                  <div className="text-[10px] uppercase font-bold tracking-tight opacity-80">
                    people/day
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Impact Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold mb-3 shadow-sm">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹{monthlySavings.toLocaleString("en-IN")}
              </div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-tight mt-1">
                Monthly Grocery Budget Saved
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Redirect to healthcare, education, or expanding shelter beds.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                <Utensils className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {monthlyMeals.toLocaleString("en-IN")}
              </div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-tight mt-1">
                Wholesome Free Plates / Month
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Nutritious, hot meals delivered warm and ready to serve.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-sky-200 bg-gradient-to-br from-sky-50/80 to-blue-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                <Leaf className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {monthlyFoodKg.toLocaleString("en-IN")} kg
              </div>
              <div className="text-xs font-bold text-sky-800 uppercase tracking-tight mt-1">
                Fresh Food Rescued
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Diverted from city landfills into nourishing community meals.
              </p>
            </div>

            <div className="rounded-2xl p-5 border border-violet-200 bg-gradient-to-br from-violet-50/80 to-purple-50/40 text-left">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-bold mb-3 shadow-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                ₹0.00
              </div>
              <div className="text-xs font-bold text-violet-800 uppercase tracking-tight mt-1">
                ZeroPlate NGO Platform Fee
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                100% free food and access for verified non-profits forever.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
